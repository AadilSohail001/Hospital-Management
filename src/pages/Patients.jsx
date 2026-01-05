import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

import { getLocalStorageData } from "../utils/functions";
import Pagination from "../components/Pagination";

import "../styles/Patients.css";

export default function Patients() {
    // Load Patients safely
    const [patients, setPatients] = useState(() => {
        const data = getLocalStorageData("patients");
        return Array.isArray(data) ? data : [];
    });

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

    // Sync patients to localStorage
    useEffect(() => {
        localStorage.setItem("patients", JSON.stringify(patients));
    }, [patients]);

    // ADD / EDIT
    function handleSave(e) {
        e.preventDefault();

        const newPatient = {
            id: patientId,
            name: patientName,
            condition,
            contact
        };

        if (editIndex !== null) {
            const updated = [...patients];
            updated[editIndex] = newPatient;
            setPatients(updated);
            setEditIndex(null);
        } else {
            setPatients([...patients, newPatient]);
        }

        resetForm();
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
        setPatientName(p.name);
        setCondition(p.condition);
        setContact(p.contact);
        setEditIndex(index);
        setShowModal(true);
    }

    function handleDelete(index) {
        setPatients(patients.filter((_, i) => i !== index));
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
                                    <td>{p.name}</td>
                                    <td>{p.condition}</td>
                                    <td>{p.contact}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                className="btn-edit"
                                                onClick={() => handleEdit(i + firstIndex)}
                                            >
                                                <Icon icon="mdi:account-edit" width="20" />
                                            </button>
                                            <button
                                                className="btn-delete"
                                                onClick={() => handleDelete(i + firstIndex)}
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
                                placeholder="Patient ID"
                                required
                                value={patientId}
                                onChange={e => setPatientId(e.target.value)}
                            />

                            <input
                                placeholder="Patient Name"
                                required
                                value={patientName}
                                onChange={e => setPatientName(e.target.value)}
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
