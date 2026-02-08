import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";

import Pagination from "../components/Pagination";
import { getData, postData } from "../utils/apiService";

import "../styles/Patients.css";

export default function Patients() {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const recordsPerPage = 5;

    // Load patients from backend
    const loadPatients = async (page = 1) => {
        setLoading(true);
        try {
            const response = await getData(`/patients/show-patients?page=${page}`);

            if (response.status === 200) {
                const data = response.data;

                if (data && data.patientsShown) {
                    setPatients(data.patientsShown);

                    // Make sure currentPage is a number
                    const apiCurrentPage = Number(data.currentPage) || 1;
                    const apiTotalUsers = Number(data.totalUsers) || 0;

                    setCurrentPage(apiCurrentPage);
                    setTotalUsers(apiTotalUsers);

                    // Calculate total pages
                    const calculatedTotalPages = Math.ceil(apiTotalUsers / recordsPerPage);
                    setTotalPages(calculatedTotalPages);

                } else {
                    setPatients([]);
                    setTotalUsers(0);
                    setTotalPages(0);
                }
            } else {
                setPatients([]);
                toast.error("Failed to load patients");
            }
            // eslint-disable-next-line no-unused-vars
        } catch (error) {
            setPatients([]);
            toast.error("Error loading patients");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPatients(1);
    }, []);

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
                    p_contact: contact
                };

                const response = await postData(`/patients/update-patient/${patientId}`, updateData);

                if (response.status === 200) {
                    await loadPatients(currentPage);
                    toast.success("Patient updated successfully!");
                    resetForm();
                } else {
                    const errorData = response.data;
                    toast.error(errorData.message || "Failed to update patient");
                }
            } else {
                // Add new patient
                const newPatientData = {
                    p_name: patientName,
                    p_condition: condition,
                    p_contact: contact
                };

                const response = await postData("/patients/register-patient", newPatientData);

                if (response.status === 200) {
                    // After adding, we need to reload to get the updated total count
                    // First, try to go to the last page
                    const lastPage = Math.ceil((totalUsers + 1) / recordsPerPage);
                    await loadPatients(lastPage);
                    toast.success("Patient added successfully!");
                    resetForm();
                } else {
                    const errorData = response.data;
                    toast.error(errorData.message || "Failed to add patient");
                }
            }
            // eslint-disable-next-line no-unused-vars
        } catch (error) {
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
        const p = patients[index];
        setPatientId(p.id);
        setPatientName(p.patient_name);
        setCondition(p.condition);
        setContact(p.contact || "");
        setEditIndex(index);
        setShowModal(true);
    }

    async function handleDelete(index) {
        if (window.confirm("Are you sure you want to delete this patient?")) {
            const p = patients[index];

            try {
                const response = await postData(`/patients/delete-patient/${p.id}`);

                if (response.status === 200) {
                    // Handle pagination after deletion
                    if (patients.length === 1 && currentPage > 1) {
                        // If this is the last patient on the page, go to previous page
                        await loadPatients(currentPage - 1);
                    } else {
                        // Reload current page
                        await loadPatients(currentPage);
                    }
                    toast.success("Patient deleted successfully!");
                } else {
                    toast.error("Failed to delete patient");
                }
                // eslint-disable-next-line no-unused-vars
            } catch (error) {
                toast.error("Error deleting patient");
            }
        }
    }

    const handlePrevPage = () => {
        if (currentPage > 1) {
            loadPatients(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            loadPatients(currentPage + 1);
        }
    };

    return (
        <div>
            <h1 className="patients-title">Patients</h1>

            {loading && <div className="loading-indicator">Loading patients...</div>}

            <button
                className="save-btn"
                style={{ marginBottom: 10 }}
                onClick={() => setShowModal(true)}
                disabled={loading}
            >
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
                                    {loading ? "Loading patients..." : "No Patients Found"}
                                </td>
                            </tr>
                        ) : (
                            patients.map((p, i) => (
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
                                                disabled={loading}
                                            >
                                                <Icon icon="mdi:account-edit" width="20" />
                                            </button>
                                            <button
                                                className="btn-delete"
                                                onClick={() => handleDelete(i)}
                                                disabled={loading}
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

                {patients.length > 0 && totalPages > 1 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPrev={handlePrevPage}
                        onNext={handleNextPage}
                    />
                )}
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
                                disabled={loading}
                            />

                            <input
                                placeholder="Condition"
                                required
                                value={condition}
                                onChange={e => setCondition(e.target.value)}
                                disabled={loading}
                            />

                            <input
                                placeholder="Contact"
                                required
                                value={contact}
                                onChange={e => setContact(e.target.value)}
                                disabled={loading}
                            />

                            <div className="modal-buttons">
                                <button
                                    className="save-btn"
                                    type="submit"
                                    disabled={loading}
                                >
                                    {loading ? "Saving..." : "Save"}
                                </button>
                                <button
                                    className="cancel-btn"
                                    type="button"
                                    onClick={resetForm}
                                    disabled={loading}
                                >
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