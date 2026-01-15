import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";

import Pagination from "../components/Pagination";

import "../styles/Patients.css";

const API_BASE_URL = "http://localhost:8080/hospital";

export default function Patients() {
    const [patients, setPatients] = useState([]);
    // eslint-disable-next-line no-unused-vars
    const [loading, setLoading] = useState(true);

    // Load patients from backend
    const loadPatients = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_BASE_URL}/patients/show-patients`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const patientsList = Array.isArray(data) ? data : [];
                setPatients(patientsList);
            } else {
                console.error("Failed to fetch patients");
                setPatients([]);
                toast.error("Failed to load patients");
            }
        } catch (error) {
            console.error("Error fetching patients:", error);
            setPatients([]);
            toast.error("Error loading patients");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPatients();
    }, []);

    // PAGINATION
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 3;

    const lastIndex = currentPage * recordsPerPage;
    const firstIndex = lastIndex - recordsPerPage;
    const paginatedPatients = patients.slice(firstIndex, lastIndex);
    const totalPages = Math.ceil(patients.length / recordsPerPage);

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [editIndex, setEditIndex] = useState(null);

    // Form fields
    const [patientId, setPatientId] = useState("");
    const [patientName, setPatientName] = useState("");
    const [condition, setCondition] = useState("");
    const [contact, setContact] = useState("");

    // ADD / EDIT
    async function handleSave(e) {
        e.preventDefault();

        if (!patientName.trim()) {
            toast.error("Patient name is required");
            return;
        }

        if (!condition.trim()) {
            toast.error("Condition is required");
            return;
        }

        if (!contact) {
            toast.error("Contact is required");
            return;
        }

        try {
            if (editIndex !== null) {
                // Update existing patient
                const updateData = {
                    p_name: patientName,
                    p_condition: condition,
                    p_contact: parseInt(contact)
                };

                const token = localStorage.getItem("token");
                const response = await fetch(`${API_BASE_URL}/patients/update-patient/${patientId}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(updateData)
                });

                if (response.ok) {
                    await loadPatients();
                    toast.success("Patient updated successfully!");
                    resetForm();
                } else {
                    const errorData = await response.json();
                    toast.error(errorData.message || "Failed to update patient");
                }
            } else {
                // Add new patient
                const newPatientData = {
                    p_name: patientName,
                    p_condition: condition,
                    p_contact: parseInt(contact)
                };

                const token = localStorage.getItem("token");
                const response = await fetch(`${API_BASE_URL}/patients/register-patient`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(newPatientData)
                });

                if (response.ok) {
                    await loadPatients();
                    toast.success("Patient added successfully!");
                    resetForm();
                } else {
                    const errorData = await response.json();
                    toast.error(errorData.message || "Failed to add patient");
                }
            }
        } catch (error) {
            console.error("Error saving patient:", error);
            toast.error("Error saving patient");
        }
    }

    function resetForm() {
        setShowModal(false);
        setPatientId("");
        setPatientName("");
        setCondition("");
        setContact("");
        setEditIndex(null);
    }

    function handleEdit(index) {
        const p = paginatedPatients[index];
        setPatientId(p.id);
        setPatientName(p.patient_name);
        setCondition(p.condition);
        setContact(p.contact || "");
        setEditIndex(index + firstIndex);
        setShowModal(true);
    }

    async function handleDelete(index) {
        if (window.confirm("Are you sure you want to delete this patient?")) {
            const p = paginatedPatients[index];

            try {
                const token = localStorage.getItem("token");
                const response = await fetch(`${API_BASE_URL}/patients/delete-patient/${p.id}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    await loadPatients();
                    toast.success("Patient deleted successfully!");

                    if (paginatedPatients.length === 1 && currentPage > 1) {
                        setCurrentPage(prev => Math.max(1, prev - 1));
                    }
                } else {
                    toast.error("Failed to delete patient");
                }
            } catch (error) {
                console.error("Error deleting patient:", error);
                toast.error("Error deleting patient");
            }
        }
    }

    const handleNavigation = (direction) => {
        if (direction === "next" && currentPage < totalPages) {
            setCurrentPage(prev => prev + 1);
        } else if (direction === "prev" && currentPage > 1) {
            setCurrentPage(prev => prev - 1);
        }
    };

    return (
        <div>
            <h1 className="patients-title">Patients</h1>

            <button className="save-btn" style={{ marginBottom: 10 }} onClick={() => setShowModal(true)}>
                + Add Patient
            </button>

            <div className="table-responsive">
                <table className="patients-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Condition</th>
                            <th>Contact</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {patients.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="no-patients">
                                    No Patients Added
                                </td>
                            </tr>
                        ) : (
                            paginatedPatients.map((p, i) => (
                                <tr key={i}>
                                    <td>{p.id}</td>
                                    <td>{p.patient_name}</td>
                                    <td>{p.condition}</td>
                                    <td>{p.contact}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                className="btn-edit"
                                                onClick={() => handleEdit(i)}
                                            >
                                                <Icon icon="mdi:account-edit" width="20" />
                                            </button>
                                            <button
                                                className="btn-delete"
                                                onClick={() => handleDelete(i)}
                                            >
                                                <Icon icon="mdi:trash" width="20" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPrev={() => handleNavigation("prev")}
                    onNext={() => handleNavigation("next")}
                />
            </div>

            {/* MODAL */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <h2>{editIndex !== null ? "Edit Patient" : "Add Patient"}</h2>

                        <form className="modal-form" onSubmit={handleSave}>
                            <input
                                placeholder="Patient Name"
                                required
                                value={patientName}
                                onChange={e => setPatientName(e.target.value)}
                                autoFocus
                            />

                            <input
                                placeholder="Condition"
                                required
                                value={condition}
                                onChange={e => setCondition(e.target.value)}
                            />

                            <input
                                placeholder="Contact"
                                required
                                value={contact}
                                onChange={e => setContact(e.target.value)}
                            />

                            <div className="modal-buttons">
                                <button className="save-btn" type="submit">Save</button>
                                <button className="cancel-btn" type="button" onClick={resetForm}>
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
