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

    useEffect(() => {
        const loadDoctors = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(`${API_BASE_URL}/users/show-all-doctors`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    const allUsers = Array.isArray(data) ? data : data.users || [];
                    // Filter only doctors (where role = 'doctor')
                    const doctorsList = allUsers.filter(user => user.role && (user.role === "doctor" || user.role === "Doctor"));
                    setDoctors(doctorsList);

                } else {
                    console.error("Failed to fetch doctors");
                    setDoctors([]);
                }
            } catch (error) {
                console.error("Error fetching doctors:", error);
                setDoctors([]);
            } finally {
                setLoading(false);
            }
        };

        loadDoctors();
    }, []);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 2;
    const lastIndex = currentPage * recordsPerPage;
    const firstIndex = lastIndex - recordsPerPage;
    const paginatedDoctors = doctors.slice(firstIndex, lastIndex);
    const totalPages = Math.ceil(doctors.length / recordsPerPage);

    const [showModal, setShowModal] = useState(false);
    const [editIndex, setEditIndex] = useState(null);
    const [doctorId, setDoctorId] = useState("");
    const [doctorName, setDoctorName] = useState("");
    const [specialization, setSpecialization] = useState("");
    const [contact, setContact] = useState("");
    const [email, setEmail] = useState("");

    // Validation helpers (match backend rules)


    // Update both arrays when doctors change
    // Removed - no longer needed since we fetch from backend

    // Save Form (Add or Update)
    async function handleSave(e) {
        e.preventDefault();

        const existingDoctor = editIndex !== null ? doctors[editIndex] : null;

        if (editIndex !== null) {
            // Update existing doctor via API
            const updateData = {
                name: doctorName,
                email: email,
                specialization: specialization,
                contact: contact
            };

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
                    const updatedDoctors = [...doctors];
                    updatedDoctors[editIndex] = {
                        ...existingDoctor,
                        user_name: doctorName,
                        user_email: email,
                        specialization: specialization,
                        contact: contact
                    };
                    setDoctors(updatedDoctors);
                    toast.success("Doctor updated successfully!");
                    resetForm();
                } else {
                    const errorData = await response.json();
                    toast.error(errorData.alert || errorData.message || "Failed to update doctor");
                    console.error("Update failed:", errorData);
                }
            } catch (error) {
                console.error("Error updating doctor:", error);
                toast.error("Error updating doctor");
            }
        } else {
            // For adding new doctors, prompt user to use backend or return message
            toast.info("New doctors must be registered via the Sign Up page with 'Register as Doctor' option.");
            resetForm();
        }
    }

    function handleEdit(index) {
        const actualIndex = index + firstIndex;
        const d = doctors[actualIndex];
        setDoctorId(d.user_Id);
        setDoctorName(d.user_name || "");
        setSpecialization(d.specialization || "");
        setContact(d.contact || "");
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
                    // Reload doctors list after delete
                    setLoading(true);
                    try {
                        const reloadToken = localStorage.getItem("token");
                        const reloadResponse = await fetch(`${API_BASE_URL}/users/show-all-doctors`, {
                            method: "GET",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${reloadToken}`
                            }
                        });
                        // Update local state immediately
                        setDoctors(prev => prev.filter(doc => doc.user_Id !== doctorToDelete.user_Id));

                        if (reloadResponse.ok) {
                            const data = await reloadResponse.json();
                            const allUsers = Array.isArray(data) ? data : data.users || [];
                            const doctorsList = allUsers.filter(user => user.role && (user.role === "doctor" || user.role === "Doctor"));
                            setDoctors(doctorsList);
                        }
                    } catch (error) {
                        console.error("Error reloading doctors:", error);
                    } finally {
                        setLoading(false);
                    }

                    toast.success("Doctor deleted successfully!");

                    // Reset to first page if current page has no doctors
                    if (paginatedDoctors.length === 1 && currentPage > 1) {
                        setCurrentPage(prev => Math.max(1, prev - 1));
                    }
                } else {
                    toast.error("Failed to delete doctor");
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
        setSpecialization("");
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

    return (
        <div className="doctors-container">
            <h2>Doctors</h2>

            {loading ? (
                <div style={{ textAlign: "center", padding: "2rem" }}>
                    <p>Loading doctors...</p>
                </div>
            ) : (
                <>
                    {/* TABLE */}
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
                                            <td>{doctor.specialization || "Not specified"}</td>
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


                            {/* PAGINATION */}
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

            {/* MODAL */}
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
                                <input
                                    type="text"
                                    value={specialization}
                                    onChange={(e) => setSpecialization(e.target.value)}
                                    placeholder="e.g., Cardiology"
                                />
                            </label>

                            <label>
                                Contact Number:
                                <input
                                    type="text"
                                    value={contact}
                                    onChange={(e) => setContact(e.target.value)}
                                    placeholder="e.g., 0312-3456789"
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