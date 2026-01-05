import React, { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import Pagination from "../components/Pagination";

import Modal from "../components/appointment/Modal";
import Reschedule from "../components/appointment/Reschedule";
// import CheckupModal from "../components/appointment/CheckupModal";
//date 1/4/2026 changes 
import CheckupModalV2 from "../components/appointment/CheckupModalV2";


import "../styles/Appointment.css";
import { appointmentStatuses, getLocalStorageData } from "../utils/functions";


export default function Appointment() {
    // Safe state initialization
    const [doctors, setDoctors] = useState(() => {
        const data = getLocalStorageData("doctors");
        return Array.isArray(data) ? data : [];
    });

    const [patients, setPatients] = useState(() => {
        const data = getLocalStorageData("patients");
        return Array.isArray(data) ? data : [];
    });

    const [appointments, setAppointments] = useState(() => {
        const data = getLocalStorageData("appointments");
        return Array.isArray(data) ? data : [];
    });

    const [editIndex, setEditIndex] = useState(null);
    const [selectedDoctor, setSelectedDoctor] = useState("");
    const [selectedPatient, setSelectedPatient] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTime, setSelectedTime] = useState("");
    const [contact, setContact] = useState("");
    const [showModal, setShowModal] = useState(false);
    const ModalLabel = "Schedule New Appointment";

    const [showReschedule, setShowReschedule] = useState(false);
    const [rescheduleIndex, setRescheduleIndex] = useState(null);
    const [conflictAppointment, setConflictAppointment] = useState(null);

    //Checkup Modal
    const [showCheckup, setShowCheckup] = useState(false);
    const [checkupIndex, setCheckupIndex] = useState(null);


    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 3;

    const lastIndex = currentPage * recordsPerPage;
    const firstIndex = lastIndex - recordsPerPage;

    const paginatedAppointments = Array.isArray(appointments)
        ? appointments.slice(firstIndex, lastIndex)
        : [];

    const totalPages = Math.ceil(appointments.length / recordsPerPage);

    const getPatientPhone = useCallback(
        (patientId) => {
            if (!patientId || !Array.isArray(patients)) return "";
            const patient = patients.find((p) => p.id === patientId);
            return patient?.contact || "";
        },
        [patients]
    );

    // Load data on mount safely
    useEffect(() => {
        const docData = getLocalStorageData("doctors");
        setDoctors(Array.isArray(docData) ? docData : []);

        const patData = getLocalStorageData("patients");
        setPatients(Array.isArray(patData) ? patData : []);

        const apptData = getLocalStorageData("appointments");
        setAppointments(Array.isArray(apptData) ? apptData : []);
    }, []);

    const handlePatientChange = (e) => {
        const patientId = e.target.value;
        setSelectedPatient(patientId);
        setContact(getPatientPhone(patientId) || "");
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedDoctor || !selectedPatient || !selectedDate || !selectedTime) {
            alert("Please fill all required fields!");
            return;
        }

        // Check duplicate
        const alreadyScheduled = appointments.find(
            (appt, index) => appt.patientId === selectedPatient && index !== editIndex
        );

        if (alreadyScheduled) {
            setConflictAppointment(alreadyScheduled);
            return;
        }
        setConflictAppointment(null);

        // FIX: Find doctor by ID or name
        const doctor = doctors.find((d) => {
            // Try to match by ID first
            if (d.id && d.id == selectedDoctor) return true;
            // If selectedDoctor is a name (string), try to match by name
            if (typeof selectedDoctor === 'string' && d.name === selectedDoctor) return true;
            // If selectedDoctor is an email, try to match by email
            if (d.email && d.email === selectedDoctor) return true;
            return false;
        });

        const patient = patients.find((p) => p.id === selectedPatient);

        if (!doctor || !patient) {
            alert("Doctor or patient not found!");
            console.error("Doctor not found. SelectedDoctor:", selectedDoctor, "Doctors:", doctors);
            return;
        }

        const newAppointment = {
            // eslint-disable-next-line react-hooks/purity
            id: editIndex !== null ? appointments[editIndex].id : Date.now(),
            patientName: patient.name,
            patientId: selectedPatient,
            doctorName: doctor.name,
            doctorId: doctor.id, // FIX: Use the actual doctor.id, not the selected value
            doctorEmail: doctor.email, // Add doctor email for better matching
            contact: contact || getPatientPhone(selectedPatient) || "Not provided",
            date: selectedDate,
            time: selectedTime,
            status: editIndex !== null ? appointments[editIndex].status : "Pending",
        };

        const updatedAppointments =
            editIndex !== null
                ? appointments.map((appt, i) => (i === editIndex ? newAppointment : appt))
                : [...appointments, newAppointment];

        setAppointments(updatedAppointments);
        localStorage.setItem("appointments", JSON.stringify(updatedAppointments));

        // Log for debugging
        // console.log("Appointment created/updated:", newAppointment);
        // console.log("All appointments:", updatedAppointments);

        resetForm();
        setShowModal(false);
    };

    const handleDelete = (index) => {
        if (window.confirm("Delete this appointment?")) {
            const updatedAppointments = appointments.filter((_, i) => i !== index);
            setAppointments(updatedAppointments);
            localStorage.setItem("appointments", JSON.stringify(updatedAppointments));
        }
    };

    const handleEdit = (index) => {
        const appt = appointments[index];
        setSelectedPatient(appt.patientId);
        setSelectedDoctor(appt.doctorId || appt.doctorName); // Use ID or name
        setSelectedDate(appt.date);
        setSelectedTime(appt.time);
        setContact(appt.contact);
        setEditIndex(index);
        setShowModal(true);
    };

    const toggleStatus = (index) => {
        const updatedAppointments = [...appointments];
        updatedAppointments[index].status =
            updatedAppointments[index].status === "Pending" ? "Checked" : "Pending";
        setAppointments(updatedAppointments);
        localStorage.setItem("appointments", JSON.stringify(updatedAppointments));
    };

    const resetForm = () => {
        setEditIndex(null);
        setSelectedPatient("");
        setSelectedDoctor("");
        setSelectedDate("");
        setSelectedTime("");
        setContact("");
    };

    const openModal = () => {
        resetForm();
        setShowModal(true);
    };

    const closeModal = () => {
        resetForm();
        setShowModal(false);
    };

    const totalAppointments = appointments.length;
    const pendingAppointments = appointmentStatuses(appointments, "Pending").length;
    const completedAppointments = appointmentStatuses(appointments, "Checked").length;
    const isContactAutoFilled =
        selectedPatient && getPatientPhone(selectedPatient) === contact;

    const selectedPatientPhone = selectedPatient ? getPatientPhone(selectedPatient) : "";

    const handleNavigation = (direction) => {
        if (direction === "next" && currentPage < totalPages) {
            setCurrentPage((prev) => prev + 1);
        }
        if (direction === "prev" && currentPage > 1) {
            setCurrentPage((prev) => prev - 1);
        }
    };

    const onCloseHandler = () => {
        setShowReschedule(false);
    };

    // Fix existing appointments to have proper doctorId
    const fixAppointmentDoctorIds = () => {
        const updatedAppointments = appointments.map(appt => {
            // If doctorId exists and is correct, keep it
            if (appt.doctorId && doctors.some(d => d.id == appt.doctorId)) {
                return appt;
            }

            // Try to find doctor by name
            const foundDoctor = doctors.find(d =>
                d.name === appt.doctorName ||
                (appt.doctorName && d.name.includes(appt.doctorName.replace("Dr. ", "")))
            );

            if (foundDoctor) {
                return {
                    ...appt,
                    doctorId: foundDoctor.id,
                    doctorEmail: foundDoctor.email
                };
            }

            return appt;
        });

        setAppointments(updatedAppointments);
        localStorage.setItem("appointments", JSON.stringify(updatedAppointments));
        alert("Appointments fixed! Doctor IDs updated.");
    };

    const handleCheckupSubmit = (checkupData) => {
        //logs for Checking data received from Formik
        console.log('Checkup data received from Formik:', checkupData);
        //==============================================

        if (checkupIndex === null) return;

        const updatedAppointments = [...appointments];

        updatedAppointments[checkupIndex] = {
            ...updatedAppointments[checkupIndex],
            status: "Checked",
            checkupReport: {
                ...checkupData,
                hospital: "Shifa International Hospital",
                checkedAt: new Date().toISOString()
            }
        };

        setAppointments(updatedAppointments);
        localStorage.setItem("appointments", JSON.stringify(updatedAppointments));

        setShowCheckup(false);
        setCheckupIndex(null);
    };


    return (
        <div className="appointment-page">
            {!showModal && !showCheckup && (
                <header className="appointment-header">
                    <h1>
                        <Icon icon="mdi:calendar" /> Appointment Management
                    </h1>
                    <div className="appointment-stats">
                        <div className="stat-card">
                            <span className="stat-number">{totalAppointments}</span>
                            <span className="stat-label">Total</span>
                        </div>
                        <div className="stat-card pending">
                            <span className="stat-number">{pendingAppointments}</span>
                            <span className="stat-label">Pending</span>
                        </div>
                        <div className="stat-card completed">
                            <span className="stat-number">{completedAppointments}</span>
                            <span className="stat-label">Checked</span>
                        </div>
                        <button
                            onClick={fixAppointmentDoctorIds}
                            className="fix-btn"
                            style={{
                                padding: '5px 10px',
                                backgroundColor: '#ff9800',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                marginLeft: '10px'
                            }}
                        >
                            Fix Doctor IDs
                        </button>
                    </div>
                </header>
            )}

            <div className="appointment-container">
                {/* Conflict Card, Modal, Reschedule */}
                {conflictAppointment && (
                    <div className="conflict-card">
                        <div className="conflict-header">
                            <Icon icon="mdi:alert-circle-outline" />
                            <h4>Patient Already Scheduled</h4>
                        </div>
                        <div className="conflict-body">
                            <p>
                                <strong>Patient:</strong> {conflictAppointment.patientName}
                            </p>
                            <p>
                                <strong>Doctor:</strong> {conflictAppointment.doctorName}
                            </p>
                            <p>
                                <strong>Date:</strong> {conflictAppointment.date}
                            </p>
                            <p>
                                <strong>Time:</strong> {conflictAppointment.time}
                            </p>
                        </div>
                        <div className="conflict-actions">
                            <button
                                className="reschedule-btn"
                                onClick={() => {
                                    const index = appointments.findIndex(
                                        (a) => a.id === conflictAppointment.id
                                    );
                                    setShowModal(false);
                                    setConflictAppointment(null);
                                    setRescheduleIndex(index);
                                    setShowReschedule(true);
                                }}
                            >
                                <Icon icon="mdi:calendar-clock" /> Reschedule
                            </button>
                            <button
                                className="dismiss-btn"
                                onClick={() => setConflictAppointment(null)}
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                )}

                <Modal
                    ModalLabel={ModalLabel}
                    showModal={showModal}
                    closeModal={closeModal}
                    editIndex={editIndex}
                    handleSubmit={handleSubmit}
                    patients={patients}
                    doctors={doctors}
                    selectedPatient={selectedPatient}
                    selectedDoctor={selectedDoctor}
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                    contact={contact}
                    handlePatientChange={handlePatientChange}
                    setSelectedDoctor={setSelectedDoctor}
                    setSelectedDate={setSelectedDate}
                    setSelectedTime={setSelectedTime}
                    setContact={setContact}
                    isContactAutoFilled={isContactAutoFilled}
                    selectedPatientPhone={selectedPatientPhone}
                    onRescheduleClick={() => {
                        setShowModal(false);
                        setShowReschedule(true);
                        setRescheduleIndex(editIndex);
                    }}
                />

                <Reschedule
                    show={showReschedule}
                    onClick={onCloseHandler}
                    appointmentIndex={rescheduleIndex}
                    appointments={appointments}
                    setAppointments={setAppointments}
                />

                {showCheckup && checkupIndex !== null && (
                    <CheckupModalV2
                        show={showCheckup}
                        appointment={appointments[checkupIndex]}
                        onClose={() => {
                            setShowCheckup(false);
                            setCheckupIndex(null);
                        }}
                        onSubmit={handleCheckupSubmit}
                    />
                )}

                {/* <CheckupModal
                    show={showCheckup}
                    appointment={appointments[checkupIndex]}
                    onClose={() => {
                        setShowCheckup(false);
                        setCheckupIndex(null);
                    }}
                    onSubmit={handleCheckupSubmit}
                /> */}


                {!showModal && !showCheckup && (
                    <div className="appointment-main-content">
                        <div className="appointment-list-header">
                            <h2>
                                <Icon icon="mdi:clipboard-list" /> Scheduled Appointments
                            </h2>
                            <button className="add-appointment-btn" onClick={openModal}>
                                <Icon icon="mdi:plus" /> Add Appointment
                            </button>
                        </div>

                        {appointments.length === 0 ? (
                            <div className="empty-state">
                                <Icon icon="mdi:calendar-remove" className="empty-icon" />
                                <p>No appointments scheduled yet.</p>
                                <p className="empty-subtitle">
                                    Click "Add Appointment" to schedule your first appointment.
                                </p>
                                <button
                                    className="add-appointment-btn empty-state-btn"
                                    onClick={openModal}
                                >
                                    <Icon icon="mdi:calendar-plus" /> Schedule First Appointment
                                </button>
                            </div>
                        ) : (
                            <div className="appointments-table-container">
                                <table className="appointments-table">
                                    <thead>
                                        <tr>
                                            <th>Status</th>
                                            <th>Patient</th>
                                            <th>Doctor</th>
                                            <th>Contact</th>
                                            <th>Date</th>
                                            <th>Time</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedAppointments.map((appt, index) => (
                                            <tr key={appt.id || index}>
                                                <td>
                                                    <span
                                                        className={`status-cell ${appt.status.toLowerCase()}`}
                                                        onClick={() => toggleStatus(index + firstIndex)}
                                                    >
                                                        {appt.status}
                                                    </span>
                                                </td>
                                                <td>{appt.patientName}</td>
                                                <td>{appt.doctorName}</td>
                                                <td
                                                    className={
                                                        !appt.contact || appt.contact === "Not provided"
                                                            ? "no-contact"
                                                            : ""
                                                    }
                                                >
                                                    {appt.contact || "No contact"}
                                                </td>
                                                <td>{appt.date}</td>
                                                <td>{appt.time}</td>
                                                <td className="table-actions">
                                                    <button
                                                        type="button"
                                                        className="table-btn edit"
                                                        onClick={() => handleEdit(index + firstIndex)}
                                                        title="Edit"
                                                    >
                                                        <Icon icon="mdi:pencil" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="table-btn delete"
                                                        onClick={() => handleDelete(index + firstIndex)}
                                                        title="Delete"
                                                    >
                                                        <Icon icon="mdi:delete" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="table-btn edit"
                                                        title="Reschedule"
                                                        onClick={() => {
                                                            setRescheduleIndex(index + firstIndex);
                                                            setShowReschedule(true);
                                                        }}
                                                    >
                                                        <Icon icon="mdi:calendar-clock" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="table-btn checkup"
                                                        title="Patient Checkup"
                                                        onClick={() => {
                                                            setCheckupIndex(index + firstIndex);
                                                            setShowCheckup(true);
                                                        }}
                                                        disabled={appt.status === "Checked"}
                                                    >
                                                        <Icon icon="mdi:clipboard-check-outline" />
                                                    </button>

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
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}