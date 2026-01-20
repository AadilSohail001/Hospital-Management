import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";
import Pagination from "../components/Pagination";
import "../styles/Doctors.css";

const API_BASE_URL = "http://localhost:8080/hospital";

export default function Doctors() {
    // Load Doctors - from backend API
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    // Add state for specializations from backend
    const [specializations, setSpecializations] = useState([]);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem("token");

                // Load specializations first
                const specsResponse = await fetch(`${API_BASE_URL}/users/get-doctor-specialities`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (specsResponse.ok) {
                    const specsData = await specsResponse.json();
                    if (Array.isArray(specsData)) {
                        setSpecializations(specsData);
                    }
                }

                // Load doctors
                const doctorsResponse = await fetch(`${API_BASE_URL}/users/show-all-doctors`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (doctorsResponse.ok) {
                    const doctorsData = await doctorsResponse.json();

                    // DEBUG: Log what the API returns
                    console.log("=== DEBUG: API RESPONSE ===");
                    console.log("Full response:", doctorsData);

                    const allUsers = Array.isArray(doctorsData) ? doctorsData : doctorsData.users || [];

                    // DEBUG: Log first user to see structure
                    if (allUsers.length > 0) {
                        console.log("First user object:", allUsers[0]);
                        console.log("Keys in first user:", Object.keys(allUsers[0]));
                    }

                    // IMPORTANT: Check what field indicates a doctor
                    // Based on your DB, it might be role_id = 1
                    const doctorsList = allUsers.filter(user => {
                        // Check for role_id = 1 (doctor)
                        if (user.role_id === 1 || user.role_id === '1') {
                            return true;
                        }

                        // Check for role field
                        if (user.role) {
                            const role = user.role.toString().toLowerCase();
                            return role.includes('doctor') || role === '1';
                        }

                        // If no role field, check other possibilities
                        if (user.user_type === 'doctor' || user.type === 'doctor') {
                            return true;
                        }

                        return false;
                    });

                    console.log("=== DEBUG: FILTERING RESULTS ===");
                    console.log("Total users from API:", allUsers.length);
                    console.log("Filtered doctors:", doctorsList.length);
                    console.log("Doctors list:", doctorsList);

                    setDoctors(doctorsList);
                } else {
                    console.error("Failed to fetch doctors");
                    setDoctors([]);
                }

            } catch (error) {
                console.error("Error loading data:", error);
                toast.error("Error loading data");
                setDoctors([]);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 5;
    const lastIndex = currentPage * recordsPerPage;
    const firstIndex = lastIndex - recordsPerPage;
    const paginatedDoctors = doctors.slice(firstIndex, lastIndex);
    const totalPages = Math.ceil(doctors.length / recordsPerPage);

    const [showModal, setShowModal] = useState(false);
    const [editIndex, setEditIndex] = useState(null);
    const [doctorId, setDoctorId] = useState("");
    const [doctorName, setDoctorName] = useState("");
    const [specId, setSpecId] = useState("");
    const [specializationName, setSpecializationName] = useState("");
    const [contact, setContact] = useState("");
    const [email, setEmail] = useState("");

    // Save Form (Add or Update)
    async function handleSave(e) {
        e.preventDefault();

        const existingDoctor = editIndex !== null ? doctors[editIndex] : null;

        if (editIndex !== null && specId) {
            const specIdNum = parseInt(specId);
            const selectedSpec = specializations.find(spec => spec.id === specIdNum);

            if (!selectedSpec) {
                toast.error("Invalid specialization selected");
                return;
            }

            // Use spz_ID to match backend
            const updateData = {
                name: doctorName,
                email: email,
                spz_ID: specIdNum,
                contact: contact ? parseInt(contact) : 0
            };

            console.log("Sending to backend:", updateData);

            try {
                const token = localStorage.getItem("token");
                const response = await fetch(`${API_BASE_URL}/users/update-user/${existingDoctor.user_Id}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(updateData)
                });

                if (response.ok) {
                    const responseData = await response.json();
                    console.log("Backend response:", responseData);

                    const updatedDoctors = [...doctors];
                    updatedDoctors[editIndex] = {
                        ...existingDoctor,
                        user_name: doctorName,
                        user_email: email,
                        spec_ID: specIdNum,
                        specialization: selectedSpec.speciality,
                        contact: contact
                    };

                    setDoctors(updatedDoctors);
                    toast.success(`Doctor updated! Specialization: ${selectedSpec.speciality}`);
                    resetForm();

                } else {
                    const errorData = await response.json();
                    toast.error(errorData.message || "Failed to update doctor");
                }
            } catch (error) {
                console.error("Network error:", error);
                toast.error("Network error");
            }
        } else {
            toast.error("Please select a specialization");
        }
    }

    function handleEdit(index) {
        const actualIndex = index + firstIndex;
        const d = doctors[actualIndex];

        setDoctorId(d.user_Id);
        setDoctorName(d.user_name || "");

        let currentSpecId = "";
        let currentSpecName = "";

        if (d.spec_ID) {
            currentSpecId = d.spec_ID.toString();
            const specObj = specializations.find(spec => spec.id.toString() === currentSpecId);
            currentSpecName = specObj ? specObj.speciality : "";
        } else if (d.specialization) {
            currentSpecName = d.specialization;
            const specObj = specializations.find(spec => spec.speciality === d.specialization);
            currentSpecId = specObj ? specObj.id.toString() : "";
        }

        setSpecId(currentSpecId);
        setSpecializationName(currentSpecName);
        setContact(d.contact ? d.contact.toString() : "");
        setEmail(d.user_email || "");
        setEditIndex(actualIndex);
        setShowModal(true);
    }

    async function handleDelete(index) {
        if (window.confirm("Are you sure you want to delete this doctor?")) {
            const actualIndex = index + firstIndex;
            const doctorToDelete = doctors[actualIndex];

            try {
                const token = localStorage.getItem("token");
                const response = await fetch(`${API_BASE_URL}/users/delete-user/${doctorToDelete.user_Id}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    setDoctors(prev => prev.filter(doc => doc.user_Id !== doctorToDelete.user_Id));
                    toast.success("Doctor deleted successfully!");

                    if (paginatedDoctors.length === 1 && currentPage > 1) {
                        setCurrentPage(prev => Math.max(1, prev - 1));
                    }
                } else {
                    const errorData = await response.json();
                    toast.error(errorData.message || "Failed to delete doctor");
                }
            } catch (error) {
                console.error("Error deleting doctor:", error);
                toast.error("Error deleting doctor");
            }
        }
    }

    function resetForm() {
        setShowModal(false);
        setEditIndex(null);
        setDoctorId("");
        setDoctorName("");
        setSpecId("");
        setSpecializationName("");
        setContact("");
        setEmail("");
    }

    const handleNavigation = (direction) => {
        if (direction === "next" && currentPage < totalPages) {
            setCurrentPage(prev => prev + 1);
        }

        if (direction === "prev" && currentPage > 1) {
            setCurrentPage(prev => prev - 1);
        }
    };

    const handleSpecializationChange = (e) => {
        const selectedId = e.target.value;
        setSpecId(selectedId);

        if (selectedId && specializations.length > 0) {
            const selectedSpec = specializations.find(spec => spec.id.toString() === selectedId);
            if (selectedSpec) {
                setSpecializationName(selectedSpec.speciality);
            }
        } else {
            setSpecializationName("");
        }
    };

    const getDisplaySpecialization = (doctor) => {
        if (doctor.spec_ID && specializations.length > 0) {
            const spec = specializations.find(s => s.id === doctor.spec_ID);
            return spec ? spec.speciality : doctor.specialization || "Not specified";
        }

        return doctor.specialization || doctor.speciality || "Not specified";
    };

    return (
        <div className="doctors-container">
            <h2>Doctors</h2>

            {loading ? (
                <div style={{ textAlign: "center", padding: "2rem" }}>
                    <p>Loading doctors...</p>
                </div>
            ) : (
                <>
                    {doctors.length === 0 ? (
                        <div className="no-doctors">
                            <Icon icon="mdi:doctor" className="no-doctors-icon" />
                            <p>No doctors registered yet.</p>
                            <p className="no-doctors-subtitle">Doctors will appear here once they sign up with "Register as Doctor" option.</p>
                        </div>
                    ) : (
                        <>
                            <table className="doctors-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Specialization</th>
                                        <th>Contact</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {paginatedDoctors.map((doctor, index) => (
                                        <tr key={doctor.user_Id || index}>
                                            <td>{doctor.user_Id}</td>
                                            <td>{doctor.user_name || doctor.name || "N/A"}</td>
                                            <td>{doctor.user_email || doctor.email || "No email"}</td>
                                            <td>{getDisplaySpecialization(doctor)}</td>
                                            <td>{doctor.contact || "No contact"}</td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        className="btn-edit"
                                                        onClick={() => handleEdit(index)}
                                                        title="Edit Doctor"
                                                    >
                                                        <Icon icon="nimbus:edit" width="16" height="16" />
                                                    </button>

                                                    <button
                                                        className="btn-delete"
                                                        onClick={() => handleDelete(index)}
                                                        title="Delete Doctor"
                                                    >
                                                        <Icon icon="weui:delete-on-filled" width="22" height="22" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPrev={() => handleNavigation("prev")}
                                onNext={() => handleNavigation("next")}
                            />
                        </>
                    )}
                </>
            )}

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <h2>{editIndex !== null ? "Edit Doctor" : "Add Doctor"}</h2>

                        <form onSubmit={handleSave} className="doctor-form">
                            {editIndex === null && (
                                <div style={{ padding: "1rem", backgroundColor: "#f0f0f0", borderRadius: "4px", marginBottom: "1rem" }}>
                                    <p><strong>Note:</strong> New doctors must register via the Sign Up page with "Register as Doctor" option.</p>
                                </div>
                            )}

                            {editIndex !== null && (
                                <label>
                                    Doctor ID (Read-only):
                                    <input
                                        type="text"
                                        value={doctorId}
                                        disabled
                                    />
                                </label>
                            )}

                            <label>
                                Doctor Name:
                                <input
                                    type="text"
                                    value={doctorName}
                                    onChange={(e) => setDoctorName(e.target.value)}
                                    required
                                />
                            </label>

                            <label>
                                Email:
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="doctor@hospital.com"
                                />
                            </label>

                            <label>
                                Specialization:
                                <select
                                    value={specId}
                                    onChange={handleSpecializationChange}
                                    required
                                >
                                    <option value="">Select specialization</option>
                                    {specializations.map((spec) => (
                                        <option key={spec.id} value={spec.id}>
                                            {spec.speciality}
                                        </option>
                                    ))}
                                </select>
                                {specializationName && (
                                    <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                                        Selected: {specializationName}
                                    </small>
                                )}
                            </label>

                            <label>
                                Contact Number:
                                <input
                                    type="text"
                                    value={contact}
                                    onChange={(e) => setContact(e.target.value)}
                                    placeholder="e.g., 0312-3456789"
                                    maxLength="15"
                                />
                            </label>

                            <div className="modal-buttons">
                                <button type="submit" className="save-btn">
                                    {editIndex !== null ? "Update Doctor" : "Close"}
                                </button>
                                <button type="button" className="cancel-btn" onClick={resetForm}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}