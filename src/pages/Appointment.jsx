import React, { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Pagination from "../components/Pagination";

import Modal from "../components/appointment/Modal";
import Reschedule from "../components/appointment/Reschedule";
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
    const [editId, setEditId] = useState(null);

    const [selectedDoctor, setSelectedDoctor] = useState("");
    const [selectedPatient, setSelectedPatient] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTime, setSelectedTime] = useState("");
    const [contact, setContact] = useState("");
    const [availableSlots, setAvailableSlots] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const ModalLabel = "Schedule New Appointment";

    const [showReschedule, setShowReschedule] = useState(false);
    const [rescheduleIndex, setRescheduleIndex] = useState(null);
    const [conflictAppointment, setConflictAppointment] = useState(null);

    // Checkup Modal
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

            // Fetch doctors
            const doctorsRes = await fetch(`${API_BASE_URL}/users/show-all-doctors`, {
                method: "GET",
                headers,
            });

            if (!doctorsRes.ok) {
                throw new Error(`Failed to fetch doctors: ${doctorsRes.status}`);
            }
            const doctorsData = await doctorsRes.json();

            // Fetch patients
            const patientsRes = await fetch(`${API_BASE_URL}/patients/show-patients`, {
                method: "GET",
                headers,
            });

            if (!patientsRes.ok) {
                throw new Error(`Failed to fetch patients: ${patientsRes.status}`);
            }
            const patientsData = await patientsRes.json();

            // ✅ FIXED: Fetch appointments from backend
            const appointmentsRes = await fetch(`${API_BASE_URL}/appointments/show-appointments`, {
                method: "GET",
                headers,
            });

            if (!appointmentsRes.ok) {
                console.warn("Could not fetch appointments, continuing with empty list");
                setAppointments([]);
            } else {
                const appointmentsData = await appointmentsRes.json();

                // ✅ FIXED: Handle backend response structure
                const appointmentsList = Array.isArray(appointmentsData)
                    ? appointmentsData
                    : appointmentsData.appointments || appointmentsData.data || [];

                // ✅ FIXED: Format appointments to match frontend structure
                const formattedAppointments = appointmentsList.map(appt => {
                    // Find patient and doctor details
                    const patient = Array.isArray(patientsData)
                        ? patientsData.find(p => p.id == appt.patient_ID || p.patient_id == appt.patient_ID)
                        : null;

                    const doctor = Array.isArray(doctorsData) || Array.isArray(doctorsData?.users)
                        ? (doctorsData.users || doctorsData).find(d => d.user_Id == appt.doctor_ID || d.id == appt.doctor_ID)
                        : null;

                    return {
                        id: appt.appointment_id || appt.id,
                        patientName: patient?.patient_name || 'Unknown Patient',
                        patientId: appt.patient_ID || patient?.id,
                        doctorName: doctor?.user_name || 'Unknown Doctor',
                        doctorId: appt.doctor_ID || doctor?.user_Id,
                        doctorEmail: doctor?.user_email,
                        contact: patient?.contact || appt.contact || "Not provided",
                        date: appt.appointment_date || appt.date,
                        time: appt.appointment_time || appt.time,
                        status: appt.appointment_status || appt.status || "Pending",
                        checkupReport: appt.checkupReport
                    };
                });

                setAppointments(formattedAppointments);
            }

            // Process doctors list
            const allUsers = Array.isArray(doctorsData) ? doctorsData : doctorsData.users || [];
            const doctorsList = allUsers.filter(user => {
                if (user.role_id === 1 || user.role_id === '1') return true;
                if (user.role) {
                    const role = user.role.toString().toLowerCase();
                    return role.includes('doctor') || role === '1';
                }
                if (user.user_type === 'doctor' || user.type === 'doctor') return true;
                return false;
            });

            setDoctors(doctorsList);
            setPatients(Array.isArray(patientsData) ? patientsData : []);

        } catch (error) {
            console.error("Fetch data error:", error);
            toast.error(error.message || "Failed to load data. Please try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const fetchAvailableSlots = useCallback(async () => {
        if (!selectedDoctor || !selectedDate) {
            setAvailableSlots([]);
            setSelectedTime("");
            return;
        }

        const day = new Date(selectedDate).getDay();
        if (day === 0) {
            toast.error("Appointment can't be registered for Sunday!");
            setAvailableSlots([]);
            setSelectedTime("");
            return;
        }

        try {
            const token = localStorage.getItem("token");

            // 1️⃣ FETCH SCHEDULE SLOTS
            const response = await fetch(
                `${API_BASE_URL}/appointments/create-appointment/${selectedDoctor}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        doc_apt_date: selectedDate,
                    }),
                }
            );

            if (!response.ok) {
                setAvailableSlots([]);
                setSelectedTime("");
                return;
            }

            const scheduleSlots = await response.json();

            // 2️⃣ FETCH BOOKED APPOINTMENTS
            const bookedRes = await fetch(
                `${API_BASE_URL}/appointments/show-appointments?doctor_id=${selectedDoctor}&date=${selectedDate}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const bookedJson = bookedRes.ok ? await bookedRes.json() : [];

            // ✅ FIX: NORMALIZE BACKEND RESPONSE
            const bookedAppointments = Array.isArray(bookedJson)
                ? bookedJson
                : bookedJson.appointments || bookedJson.data || [];

            const bookedTimes = bookedAppointments
                .map(a => a.appointment_time?.substring(0, 5))
                .filter(Boolean);

            // 3️⃣ FILTER AVAILABLE SLOTS
            const normalizedSlots = Array.isArray(scheduleSlots)
                ? scheduleSlots
                    .map(t => t.substring(0, 5))
                    .filter(t => !bookedTimes.includes(t))
                : [];

            setAvailableSlots(normalizedSlots);
            setSelectedTime("");

        } catch (error) {
            console.error("Error fetching slots:", error);
            setAvailableSlots([]);
            setSelectedTime("");
        }
    }, [selectedDoctor, selectedDate]);

    useEffect(() => {
        fetchAvailableSlots();
    }, [fetchAvailableSlots]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedDoctor || !selectedPatient || !selectedDate || !selectedTime) {
            toast.error("Please fill all required fields!");
            return;
        }

        const isEditing = editIndex !== null;

        // ✅ FIXED: Match backend field names exactly
        const appointmentData = {
            patient_id: parseInt(selectedPatient, 10),      // Backend expects snake_case
            doc_id: parseInt(selectedDoctor, 10),           // Changed from doctorId to doc_id
            doc_apt_date: selectedDate,                     // Changed from date to doc_apt_date
            apt_time: selectedTime,                         // Changed from time to apt_time
            apt_status: isEditing ? appointments[editIndex].status : "Pending"  // Changed from status to apt_status
        };

        const url = isEditing
            ? `${API_BASE_URL}/appointments/edit-appointment/${editId}`  // Note: using edit-appointment, not update-appointment
            : `${API_BASE_URL}/appointments/save-appointment`;

        try {
            const token = localStorage.getItem("token");
            console.log("Sending appointment data:", appointmentData); // Debug log

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(appointmentData),
            });

            const result = await response.json();
            console.log("Backend response:", result); // Debug log

            if (!response.ok) {
                if (response.status === 409) {
                    // Handle conflict
                    const existingAppt = result.existingAppointment || appointmentData;
                    const doctor = doctors.find(d => d.user_Id == selectedDoctor);
                    const patient = patients.find(p => p.id == selectedPatient);

                    setConflictAppointment({
                        ...existingAppt,
                        doctorName: doctor?.user_name || 'Unknown Doctor',
                        patientName: patient?.patient_name || 'Unknown Patient'
                    });
                }
                throw new Error(result.message || result.alert || result.error || `Failed to ${isEditing ? 'update' : 'create'} appointment.`);
            }

            toast.success(result.success || `Appointment ${isEditing ? 'updated' : 'created'} successfully!`);
            fetchData(); // Refresh the list
            closeModal();

        } catch (error) {
            console.error("Submit error:", error);
            toast.error(error.message);
        }
    };

    const handleDelete = async (index) => {
        const appointmentToDelete = appointments[index];
        if (!appointmentToDelete || !appointmentToDelete.id) {
            toast.error("Cannot delete: Invalid appointment data");
            return;
        }

        if (window.confirm(`Are you sure you want to delete the appointment for ${appointmentToDelete.patientName}?`)) {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(`${API_BASE_URL}/appointments/delete-appointment/${appointmentToDelete.id}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || result.alert || "Failed to delete appointment.");
                }

                toast.success(result.success || "Appointment deleted successfully!");
                fetchData(); // Refresh the list
            } catch (error) {
                console.error("Delete error:", error);
                toast.error(error.message);
            }
        }
    };

    const handleEdit = (index) => {
        const appt = appointments[index];
        if (!appt) return;

        setSelectedPatient(appt.patientId?.toString() || "");
        setSelectedDoctor(appt.doctorId?.toString() || "");
        setSelectedDate(appt.date || "");
        setSelectedTime(appt.time || "");
        setContact(appt.contact || "");
        setEditIndex(index);
        setEditId(appt.id);
        setShowModal(true);
    };

    const toggleStatus = async (index) => {
        const appointmentToUpdate = appointments[index];
        if (!appointmentToUpdate || !appointmentToUpdate.id) return;

        const newStatus = appointmentToUpdate.status === "Pending" ? "Checked" : "Pending";

        // ✅ FIXED: Use backend field names
        const updateData = {
            patient_id: appointmentToUpdate.patientId,
            doc_id: appointmentToUpdate.doctorId,
            doc_apt_date: appointmentToUpdate.date,
            apt_time: appointmentToUpdate.time,
            apt_status: newStatus,
        };

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_BASE_URL}/appointments/edit-appointment/${appointmentToUpdate.id}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(updateData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || result.alert || "Failed to update status.");
            }

            toast.success(`Appointment status changed to ${newStatus}`);
            fetchData(); // Refresh the list
        } catch (error) {
            console.error("Status toggle error:", error);
            toast.error(error.message);
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
        setConflictAppointment(null);
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
    const isContactAutoFilled = selectedPatient && getPatientPhone(selectedPatient) === contact;
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

                {/* Conflict Card */}
                {conflictAppointment && (
                    <div className="conflict-card">
                        <div className="conflict-header">
                            <Icon icon="mdi:alert-circle-outline" />
                            <h4>Patient Already Scheduled</h4>
                        </div>
                        <div className="conflict-body">
                            <p><strong>Patient:</strong> {conflictAppointment.patientName}</p>
                            <p><strong>Doctor:</strong> {conflictAppointment.doctorName}</p>
                            <p><strong>Date:</strong> {conflictAppointment.date}</p>
                            <p><strong>Time:</strong> {conflictAppointment.time}</p>
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

                {/* Main Modal */}
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
                    availableSlots={availableSlots}
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

                {/* Reschedule Modal */}
                <Reschedule
                    show={showReschedule}
                    onClick={onCloseHandler}
                    appointmentIndex={rescheduleIndex}
                    appointments={appointments}
                    setAppointments={setAppointments}
                />

                {/* Checkup Modal */}
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

                {/* Main Content */}
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
                                                <td className={!appt.contact || appt.contact === "Not provided" ? "no-contact" : ""}>
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