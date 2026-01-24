import React, { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Pagination from "../components/Pagination";

import Modal from "../components/appointment/Modal";
import Reschedule from "../components/appointment/Reschedule";
// import CheckupModal from "../components/appointment/CheckupModal";
//date 1/4/2026 changes 
import CheckupModalV2 from "../components/appointment/CheckupModalV2";


import "../styles/Appointment.css";
import { appointmentStatuses } from "../utils/functions";

const API_BASE_URL = "http://localhost:8080/hospital";

export default function Appointment() {
    // Safe state initialization
    const [doctors, setDoctors] = useState([]);
    const [patients, setPatients] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    const [editIndex, setEditIndex] = useState(null);
    // editId will store the actual appointment ID for API calls
    const [editId, setEditId] = useState(null);

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
            const patient = patients.find((p) => p.id == patientId);
            return patient?.contact || "";
        },
        [patients]
    );

    // Load data on mount safely
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                toast.error("Authentication token not found. Please log in.");
                setLoading(false);
                return;
            }

            const headers = {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            };

            // Fetch sequentially to avoid potential server concurrency issues and better error handling
            const doctorsRes = await fetch(`${API_BASE_URL}/users/show-all-doctors`,
                { method: "GET", headers });

            if (!doctorsRes.ok) {
                throw new Error(`Failed to fetch doctors: ${doctorsRes.status}`);
            }
            const doctorsData = await doctorsRes.json();

            const patientsRes = await fetch(`${API_BASE_URL}/patients/show-patients`,
                { method: "GET", headers });

            if (!patientsRes.ok) {
                throw new Error(`Failed to fetch patients: ${patientsRes.status}`);
            }
            const patientsData = await patientsRes.json();

            // const appointmentsRes = await fetch(`${API_BASE_URL}/appointments/show-all-appointments`, { method: "GET", headers });
            // if (!appointmentsRes.ok) {
            //     throw new Error(`Failed to fetch appointments: ${appointmentsRes.status}`);
            // }
            // const appointmentsData = await appointmentsRes.json();

            const allUsers = Array.isArray(doctorsData) ? doctorsData : doctorsData.users || [];
            const doctorsList = allUsers.filter(user => {
                // Check for role_id = 1 (doctor)
                if (user.role_id === 1 || user.role_id === '1') return true;

                // Check for role field string
                if (user.role) {
                    const role = user.role.toString().toLowerCase();
                    return role.includes('doctor') || role === '1';
                }

                // Check for user_type
                if (user.user_type === 'doctor' || user.type === 'doctor') return true;

                return false;
            });

            setDoctors(doctorsList);
            setPatients(Array.isArray(patientsData) ? patientsData : []);

            // const appointmentsList = Array.isArray(appointmentsData) ? appointmentsData : appointmentsData.appointments || [];

            // const formattedAppointments = appointmentsList.map(appt => ({
            //     id: appt.id,
            //     patientName: appt.patient?.patient_name || 'Unknown Patient',
            //     patientId: appt.patientId,
            //     doctorName: appt.doctor?.user_name || 'Unknown Doctor',
            //     doctorId: appt.doctorId,
            //     doctorEmail: appt.doctor?.user_email,
            //     contact: appt.patient?.contact || "Not provided",
            //     date: appt.date,
            //     time: appt.time,
            //     status: appt.status,
            //     checkupReport: appt.checkupReport
            // }));

            // setAppointments(formattedAppointments);

        } catch (error) {
            toast.error(error.message || "Failed to load data.");
            console.error("Fetch data error:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedDoctor || !selectedPatient || !selectedDate || !selectedTime) {
            toast.error("Please fill all required fields!");
            return;
        }

        const isEditing = editIndex !== null;

        const appointmentData = {
            patientId: parseInt(selectedPatient, 10),
            doctorId: parseInt(selectedDoctor, 10),
            date: selectedDate,
            time: selectedTime,
            status: isEditing ? appointments[editIndex].status : "Pending",
        };

        const url = isEditing
            ? `${API_BASE_URL}/appointments/update-appointment/${editId}`
            : `${API_BASE_URL}/appointments/create-appointment`;

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(appointmentData),
            });

            const result = await response.json();

            if (!response.ok) {
                // The backend sends a 409 for conflicts
                if (response.status === 409) {
                    setConflictAppointment(result.existingAppointment || { ...appointmentData, doctorName: doctors.find(d => d.user_Id == selectedDoctor)?.user_name, patientName: patients.find(p => p.id == selectedPatient)?.patient_name });
                }
                throw new Error(result.message || `Failed to ${isEditing ? 'update' : 'create'} appointment.`);
            }

            toast.success(`Appointment ${isEditing ? 'updated' : 'created'} successfully!`);
            fetchData();
            closeModal();

        } catch (error) {
            toast.error(error.message);
            console.error("Submit error:", error);
        }
    };

    const handleDelete = async (index) => {
        const appointmentToDelete = appointments[index];
        if (window.confirm(`Are you sure you want to delete the appointment for ${appointmentToDelete.patientName}?`)) {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(`${API_BASE_URL}/appointments/delete-appointment/${appointmentToDelete.id}`, {
                    method: "POST", // Backend uses POST for delete
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || "Failed to delete appointment.");
                }

                toast.success("Appointment deleted successfully!");
                fetchData();
            } catch (error) {
                toast.error(error.message);
                console.error("Delete error:", error);
            }
        }
    };

    const handleEdit = (index) => {
        const appt = appointments[index];
        setSelectedPatient(appt.patientId);
        setSelectedDoctor(appt.doctorId);
        setSelectedDate(appt.date);
        setSelectedTime(appt.time);
        setContact(appt.contact);
        setEditIndex(index);
        setEditId(appt.id);
        setShowModal(true);
    };

    const toggleStatus = async (index) => {
        const appointmentToUpdate = appointments[index];
        const newStatus = appointmentToUpdate.status === "Pending" ? "Checked" : "Pending";

        const updateData = {
            patientId: appointmentToUpdate.patientId,
            doctorId: appointmentToUpdate.doctorId,
            date: appointmentToUpdate.date,
            time: appointmentToUpdate.time,
            status: newStatus,
        };

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_BASE_URL}/appointments/update-appointment/${appointmentToUpdate.id}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(updateData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Failed to update status.");
            }

            toast.success(`Appointment status changed to ${newStatus}`);
            fetchData();
        } catch (error) {
            toast.error(error.message);
            console.error("Status toggle error:", error);
        }
    };

    const resetForm = () => {
        setEditIndex(null);
        setEditId(null);
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

    const handleCheckupSubmit = (checkupData) => {
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
                    </div>
                </header>
            )}

            <div className="appointment-container">
                {loading && <div className="loading-state">Loading appointments...</div>}

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
                    setSelectedPatient={setSelectedPatient}
                    selectedDoctor={selectedDoctor}
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                    contact={contact}
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


                {!loading && !showModal && !showCheckup && (
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