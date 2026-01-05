import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import Pagination from "../components/Pagination";
import "../styles/Doctors.css";

export default function Doctors() {
    // Load Doctors - always sync with appData
    const [doctors, setDoctors] = useState(() => {
        const appData = JSON.parse(localStorage.getItem("appData")) || { users: [] };

        // Get only doctors from appData users
        const doctorsFromAppData = appData.users.filter(user =>
            user.isDoctor === true || user.isDoctor === "1"
        );

        // Also check doctors array for any additional doctors
        const savedDoctors = JSON.parse(localStorage.getItem("doctors")) || [];

        // Merge both arrays, giving priority to appData
        const allDoctors = [...doctorsFromAppData];

        // Add doctors from doctors array if not already in appData
        savedDoctors.forEach(savedDoctor => {
            const exists = allDoctors.some(d =>
                d.email === savedDoctor.email || d.id === savedDoctor.id
            );
            if (!exists) {
                allDoctors.push(savedDoctor);
            }
        });

        return allDoctors;
    });

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

    // Update both arrays when doctors change
    useEffect(() => {
        if (doctors.length > 0) {
            // Update doctors array (simplified version without passwords)
            const simplifiedDoctors = doctors.map(d => ({
                id: d.id,
                name: d.name,
                email: d.email,
                specialization: d.specialization,
                contact: d.contact,
                isDoctor: true
            }));

            localStorage.setItem("doctors", JSON.stringify(simplifiedDoctors));

            // Update appData users array - preserve passwords
            const appData = JSON.parse(localStorage.getItem("appData")) || { users: [] };

            // Create a map of existing users to preserve their passwords
            const existingUsersMap = new Map();
            appData.users.forEach(user => {
                existingUsersMap.set(user.email, user.password);
            });

            // Create updated users list
            const nonDoctorUsers = appData.users.filter(user =>
                user.isDoctor !== true && user.isDoctor !== "1"
            );

            const doctorUsers = doctors.map(doctor => {
                // Use existing password if available, otherwise use doctor's password or default
                const existingPassword = existingUsersMap.get(doctor.email);

                return {
                    id: doctor.id,
                    name: doctor.name,
                    email: doctor.email,
                    password: existingPassword || doctor.password || "default123",
                    specialization: doctor.specialization,
                    contact: doctor.contact,
                    isDoctor: true
                };
            });

            const updatedUsers = [...nonDoctorUsers, ...doctorUsers];

            // Save updated appData
            localStorage.setItem("appData", JSON.stringify({
                ...appData,
                users: updatedUsers
            }));
        }
    }, [doctors]);

    // Save Form (Add or Update)
    function handleSave(e) {
        e.preventDefault();

        // Get the current doctor if editing
        const existingDoctor = editIndex !== null ? doctors[editIndex] : null;

        // Generate ID if not provided
        // eslint-disable-next-line react-hooks/purity
        const newDoctorId = doctorId || Date.now().toString();
        const newDoctor = {
            id: newDoctorId,
            name: doctorName,
            specialization,
            contact,
            email: email || `doctor${newDoctorId}@hospital.com`,
            password: existingDoctor?.password || "default123", // Preserve existing password
            isDoctor: true
        };

        if (editIndex !== null) {
            // Update in doctors array - preserve all existing data
            const updated = [...doctors];
            updated[editIndex] = {
                ...existingDoctor, // Keep all existing properties
                name: doctorName,
                specialization,
                contact,
                email: email || existingDoctor.email
                // Don't touch the password!
            };
            setDoctors(updated);
        } else {
            // Add new doctor
            setDoctors([...doctors, newDoctor]);
        }

        resetForm();
    }

    function handleEdit(index) {
        const d = doctors[index];
        setDoctorId(d.id);
        setDoctorName(d.name);
        setSpecialization(d.specialization || "");
        setContact(d.contact || "");
        setEmail(d.email || "");
        setEditIndex(index);
        setShowModal(true);
    }

    function handleDelete(index) {
        if (window.confirm("Are you sure you want to delete this doctor?")) {
            const doctorToDelete = doctors[index];

            // Delete from doctors array
            const updatedDoctors = doctors.filter((_, i) => i !== index);
            setDoctors(updatedDoctors);

            // Update appData - convert to regular user (preserve password)
            const appData = JSON.parse(localStorage.getItem("appData")) || { users: [] };
            const updatedUsers = appData.users.map(user => {
                if (user.email === doctorToDelete.email || user.id === doctorToDelete.id) {
                    return {
                        ...user,
                        isDoctor: false, // Convert to regular user
                        specialization: undefined,
                        contact: undefined
                    };
                }
                return user;
            });

            localStorage.setItem("appData", JSON.stringify({
                ...appData,
                users: updatedUsers
            }));

            alert("Doctor deleted successfully! They have been converted to a regular user.");
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

            <button className="save-btn" style={{ marginBottom: 10 }} onClick={() => setShowModal(true)}>
                + Add Doctor
            </button>

            {/* TABLE */}
            {doctors.length === 0 ? (
                <div className="no-doctors">
                    <Icon icon="mdi:doctor" className="no-doctors-icon" />
                    <p>No doctors registered yet.</p>
                    <p className="no-doctors-subtitle">Click "Add Doctor" to add your first doctor.</p>
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
                                <tr key={index}>
                                    <td>{doctor.id}</td>
                                    <td>{doctor.name}</td>
                                    <td>{doctor.email || "No email"}</td>
                                    <td>{doctor.specialization || "Not specified"}</td>
                                    <td>{doctor.contact || "No contact"}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                className="btn-edit"
                                                onClick={() => handleEdit(index + firstIndex)}
                                                title="Edit Doctor"
                                            >
                                                <Icon icon="nimbus:edit" width="16" height="16" />
                                            </button>

                                            <button
                                                className="btn-delete"
                                                onClick={() => handleDelete(index + firstIndex)}
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

            {/* MODAL */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <h2>{editIndex !== null ? "Edit Doctor" : "Add Doctor"}</h2>

                        <form onSubmit={handleSave} className="doctor-form">
                            {editIndex === null && (
                                <label>
                                    Doctor ID (Optional - auto-generated if empty):
                                    <input
                                        type="text"
                                        value={doctorId}
                                        onChange={(e) => setDoctorId(e.target.value)}
                                        placeholder="Auto-generated"
                                    />
                                </label>
                            )}

                            <label>
                                Doctor Name:*
                                <input
                                    type="text"
                                    value={doctorName}
                                    onChange={(e) => setDoctorName(e.target.value)}
                                    required
                                />
                            </label>

                            <label>
                                Email:*
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="doctor@hospital.com"
                                />
                            </label>

                            <label>
                                Specialization:*
                                <input
                                    type="text"
                                    value={specialization}
                                    onChange={(e) => setSpecialization(e.target.value)}
                                    required
                                    placeholder="e.g., Cardiology"
                                />
                            </label>

                            <label>
                                Contact Number:*
                                <input
                                    type="text"
                                    value={contact}
                                    onChange={(e) => setContact(e.target.value)}
                                    required
                                    placeholder="e.g., 0312-3456789"
                                />
                            </label>

                            <div className="modal-buttons">
                                <button type="submit" className="save-btn">
                                    {editIndex !== null ? "Update Doctor" : "Add Doctor"}
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