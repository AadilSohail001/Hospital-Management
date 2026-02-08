import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";
import Pagination from "../components/Pagination";
import "../styles/Doctors.css";
import { getData, postData } from "../utils/apiService";

export default function Doctors() {
    // Load Doctors - from backend API
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    // Add state for specializations from backend
    const [specializations, setSpecializations] = useState([]);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    // eslint-disable-next-line no-unused-vars
    const [totalDoctors, setTotalDoctors] = useState(0);
    const recordsPerPage = 5;

    // Load Specializations
    const loadSpecializations = async () => {
        try {
            const specsResponse = await getData("/users/get-doctor-specialities");
            if (specsResponse.status === 200) {
                const specsData = specsResponse.data;
                if (Array.isArray(specsData)) {
                    setSpecializations(specsData);
                }
            }
        } catch (error) {
            console.error("Error loading specializations", error);
        }
    };

    // Load Doctors
    const loadDoctors = async (page = "firstPage") => {
        setLoading(true);
        try {
            const response = await getData(`/users/show-all-doctors?page=${page}`);

            if (response.status === 200) {
                const data = response.data;
                if (data && data.allDoctors) {
                    setDoctors(data.allDoctors);
                    setCurrentPage(Number(data.currentPage) || 1);
                    setTotalDoctors(Number(data.totalDoctors) || 0);
                    setTotalPages(Math.ceil((Number(data.totalDoctors) || 0) / recordsPerPage));
                } else {
                    setDoctors([]);
                    setTotalPages(0);
                }
            } else {
                setDoctors([]);
            }
            // eslint-disable-next-line no-unused-vars
        } catch (error) {
            toast.error("Error loading doctors");
            setDoctors([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSpecializations();
        loadDoctors("firstPage");
    }, []);

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
                contact: contact,
                password: "MinimumPass123!" // Workaround: Backend requires password field
            };

            try {
                const response = await postData(`/users/update-user/${existingDoctor.user_Id}`, updateData);

                if (response.status === 200) {
                    // eslint-disable-next-line no-unused-vars
                    const responseData = response.data;
                    await loadDoctors(currentPage);
                    toast.success(`Doctor updated! Specialization: ${selectedSpec.speciality}`);
                    resetForm();

                } else {
                    const errorData = response.data;
                    toast.error(errorData.message || "Failed to update doctor");
                }
            } catch (error) {
                console.error("Error updating doctor:", error);
                if (error.response && error.response.data) {
                    toast.error(error.response.data.message || "Failed to update doctor");
                } else {
                    toast.error(error.message || "Network error");
                }
            }
        } else {
            toast.error("Please select a specialization");
        }
    }

    function handleEdit(index) {
        const d = doctors[index];

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
        setEditIndex(index);
        setShowModal(true);
    }

    async function handleDelete(index) {
        if (window.confirm("Are you sure you want to delete this doctor?")) {
            const doctorToDelete = doctors[index];

            try {
                const response = await postData(`/users/delete-user/${doctorToDelete.user_Id}`);

                if (response.status === 200) {
                    if (doctors.length === 1 && currentPage > 1) {
                        await loadDoctors(currentPage - 1);
                    } else {
                        await loadDoctors(currentPage);
                    }
                    toast.success("Doctor deleted successfully!");
                } else {
                    const errorData = response.data;
                    toast.error(errorData.message || "Failed to delete doctor");
                }
            } catch (error) {
                console.error("Error deleting doctor:", error);
                if (error.response && error.response.data) {
                    toast.error(error.response.data.message || "Failed to delete doctor");
                } else {
                    toast.error(error.message || "Error deleting doctor");
                }
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
            loadDoctors(currentPage + 1);
        }

        if (direction === "prev" && currentPage > 1) {
            loadDoctors(currentPage - 1);
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
                                    {doctors.map((doctor, index) => (
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