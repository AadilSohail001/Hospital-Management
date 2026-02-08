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
import { getData } from "../utils/apiService";

const API_BASE_URL = "http://localhost:8080/hospital";

export default function Appointment() {
    // Safe state initialization
    const [doctors, setDoctors] = useState([]);
    const [patients, setPatients] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [filteredAppointments, setFilteredAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    const [editIndex, setEditIndex] = useState(null);
    const [editId, setEditId] = useState(null);

    const [selectedDoctor, setSelectedDoctor] = useState("");
    const [selectedPatient, setSelectedPatient] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTime, setSelectedTime] = useState("");
    const [contact, setContact] = useState("");
    const [availableSlots, setAvailableSlots] = useState([]);
    const [scheduleId, setScheduleId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const ModalLabel = "Schedule New Appointment";

    const [showReschedule, setShowReschedule] = useState(false);
    const [rescheduleIndex, setRescheduleIndex] = useState(null);
    const [conflictAppointment, setConflictAppointment] = useState(null);

    // Checkup Modal
    const [showCheckup, setShowCheckup] = useState(false);
    const [checkupIndex, setCheckupIndex] = useState(null);

    // Search and Filter states
    const [searchTerm, setSearchTerm] = useState("");
    const [dateFilter, setDateFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 3;
    const lastIndex = currentPage * recordsPerPage;
    const firstIndex = lastIndex - recordsPerPage;

    const paginatedAppointments = Array.isArray(filteredAppointments)
        ? filteredAppointments.slice(firstIndex, lastIndex)
        : [];

    const totalPages = Math.ceil(filteredAppointments.length / recordsPerPage);

    const getPatientPhone = useCallback(
        (patientId) => {
            if (!patientId || !Array.isArray(patients)) return "";
            const patient = patients.find((p) => p.id == patientId);
            return patient?.contact || "";
        },
        [patients]
    );

    // Function to filter appointments based on search and date filter
    const filterAppointments = useCallback(() => {
        let filtered = [...appointments];

        // Apply search filter
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(appt => {
                const patientName = String(appt.patientName || '').toLowerCase();
                const doctorName = String(appt.doctorName || '').toLowerCase();
                const contact = String(appt.contact || '').toLowerCase();
                const status = String(appt.status || '').toLowerCase();
                const date = String(appt.date || '');
                const time = String(appt.time || '');

                return patientName.includes(term) ||
                    doctorName.includes(term) ||
                    contact.includes(term) ||
                    date.includes(term) ||
                    time.includes(term) ||
                    status.includes(term);
            });
        }

        // Apply date filter
        if (dateFilter !== "all") {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            filtered = filtered.filter(appt => {
                try {
                    if (!appt.date) return false;

                    const appointmentDate = new Date(appt.date);
                    if (isNaN(appointmentDate.getTime())) return false;

                    // normalize both dates to start of day
                    appointmentDate.setHours(0, 0, 0, 0);

                    // compute end date based on selected filter (inclusive)
                    let endDate = new Date(today.getTime());
                    switch (dateFilter) {
                        case "today":
                            // endDate stays as today
                            break;
                        case "2days":
                            endDate = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);
                            break;
                        case "3days":
                            endDate = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
                            break;
                        case "7days":
                            endDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                            break;
                        default:
                            // if unknown filter, include all
                            return true;
                    }

                    // include appointments from today up to endDate (inclusive)
                    return appointmentDate.getTime() >= today.getTime() && appointmentDate.getTime() <= endDate.getTime();
                } catch (error) {
                    console.error("Error parsing date:", appt.date, error);
                    return false;
                }
            });
        }

        // Apply status filter
        if (statusFilter !== "all") {
            filtered = filtered.filter(appt => appt.status === statusFilter);
        }

        setFilteredAppointments(filtered);
        setCurrentPage(1);
    }, [appointments, searchTerm, dateFilter, statusFilter]);

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

            // Check token expiration
            try {
                const tokenPayload = JSON.parse(atob(token.split('.')[1]));
                const tokenExp = tokenPayload.exp * 1000;
                if (Date.now() >= tokenExp) {
                    toast.error("Your session has expired. Please log in again.");
                    localStorage.removeItem("token");
                    window.location.href = "/login";
                    return;
                }
            } catch (tokenError) {
                console.warn("Token parsing error:", tokenError);
            }

            // Fetch doctors
            let doctorsData = [];
            try {
                const doctorsRes = await getData("/users/show-all-doctors");
                // const doctorsRes = await fetch(`${API_BASE_URL}/users/show-all-doctors`, {
                //     method: "GET",
                //     headers,
                // });
                // console.log("junsif ", doctorsRes)
                // console.log("junsif ", doctorsRes1)

                if (doctorsRes.status === 401) {
                    toast.error("Please log in again");
                    localStorage.removeItem("token");
                    window.location.href = "/login";
                    return;
                }

                if (doctorsRes.status === 200) {
                    const response = doctorsRes.data; //await doctorsRes.json();
                    doctorsData = response.users || response.data || response || [];
                } else {
                    console.warn("Failed to fetch doctors:", doctorsRes.status);
                }
            } catch (doctorError) {
                console.warn("Could not fetch doctors:", doctorError);
            }

            // Fetch patients
            let patientsData = [];
            try {
                const patientsRes = await fetch(`${API_BASE_URL}/patients/show-patients`, {
                    method: "GET",
                    headers,
                });

                if (patientsRes.ok) {
                    const response = await patientsRes.json();
                    patientsData = response.patients || response.data || response || [];
                } else {
                    console.warn("Failed to fetch patients:", patientsRes.status);
                }
            } catch (patientError) {
                console.warn("Could not fetch patients:", patientError);
            }

            // Fetch appointments
            let appointmentsList = [];
            try {
                const appointmentsRes = await fetch(`${API_BASE_URL}/appointments/show-appointments`, {
                    method: "GET",
                    headers,
                });

                if (appointmentsRes.ok) {
                    const appointmentsData = await appointmentsRes.json();
                    appointmentsList = Array.isArray(appointmentsData)
                        ? appointmentsData
                        : appointmentsData.appointments || appointmentsData.data || [];
                } else {
                    console.warn("Could not fetch appointments:", appointmentsRes.status);
                }
            } catch (appointmentError) {
                console.warn("Error fetching appointments:", appointmentError);
            }

            // Format appointments
            const formattedAppointments = appointmentsList.map(appt => {
                const patient = Array.isArray(patientsData)
                    ? patientsData.find(p => p.id == appt.patient_ID || p.patient_id == appt.patient_ID)
                    : null;

                const doctor = Array.isArray(doctorsData)
                    ? doctorsData.find(d => d.user_Id == appt.doctor_ID || d.id == appt.doctor_ID)
                    : null;

                return {
                    id: appt.appointment_id || appt.id,
                    patientName: String(patient?.patient_name || patient?.name || 'Unknown Patient'),
                    patientId: appt.patient_ID || patient?.id,
                    doctorName: String(doctor?.user_name || doctor?.name || 'Unknown Doctor'),
                    doctorId: appt.doctor_ID || doctor?.user_Id || doctor?.id,
                    contact: String(patient?.contact || appt.contact || "Not provided"),
                    date: appt.appointment_date || appt.date,
                    time: appt.appointment_time || appt.time,
                    status: String(appt.appointment_status || appt.status || "Pending"),
                    checkupReport: appt.checkupReport
                };
            });

            setAppointments(formattedAppointments);
            setFilteredAppointments(formattedAppointments);

            // Process doctors list
            const allUsers = Array.isArray(doctorsData) ? doctorsData : [];
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
            if (!error.message.includes("Failed to fetch")) {
                toast.error("Failed to load data. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Apply filters whenever search term or date filter changes
    useEffect(() => {
        filterAppointments();
    }, [filterAppointments]);

    // Fetch available slots when doctor and date change
    useEffect(() => {
        const fetchAvailableSlots = async () => {

            if (!selectedDoctor || !selectedDate) {
                setAvailableSlots([]);
                setSelectedTime("");
                return;
            }


            // Client-side validation for immediate feedback
            const selectedDateObj = new Date(selectedDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (selectedDateObj < today) {
                toast.error("Cannot book appointment for a past date.");
                setAvailableSlots([]);
                setSelectedTime("");
                return;
            }

            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    toast.error("Please log in again.");
                    return;
                }

                const docId = parseInt(selectedDoctor, 10) || selectedDoctor;

                // First, try the appointments/create-appointment endpoint which returns formattedSlots
                try {
                    const createResp = await fetch(`${API_BASE_URL}/appointments/create-appointment`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ doc_id: docId, doc_apt_date: selectedDate })
                    });

                    if (createResp.ok) {
                        const createData = await createResp.json();
                        const formatted = createData.formattedSlots || createData.formatted_slots || createData.slots || [];
                        if (Array.isArray(formatted) && formatted.length > 0) {
                            setAvailableSlots(formatted);
                            setScheduleId(createData.schedule_id || null);
                            setSelectedTime("");
                            toast.success(`Found ${formatted.length} available time slots`);
                            return; // done
                        }
                    }
                } catch (createErr) {
                    console.warn("appointments/create-appointment failed, falling back to schedule endpoint:", createErr);
                }

                const response = await fetch(`${API_BASE_URL}/schedule-doctors/show-doctor-timetable/${docId}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || errorData.error || `Server Error: ${response.status}`);
                }

                const scheduleData = await response.json();
                // Extract schedule information and calculate available slots
                let slots = [];
                let schId = null;

                // Get schedules array
                const schedules = Array.isArray(scheduleData) ? scheduleData : scheduleData.schedules || [];

                if (schedules.length > 0) {
                    // Find matching schedule for the selected date
                    const selectedDateObj = new Date(selectedDate);
                    const dayOfWeek = selectedDateObj.getDay(); // 0=Sunday, 1=Monday, etc.

                    // Map JS day (0-6) to our day mapping (1-7, where 1=Monday)
                    const dayMap = { 0: 7, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6 };
                    const mappedDay = dayMap[dayOfWeek];

                    // Find schedule for this day
                    const daySchedule = schedules.find(sch => {
                        const schDay = sch.doc_day_num || sch.day_num || sch.doc_day;
                        // allow doc_day as string like 'MONDAY'
                        if (typeof schDay === 'string') {
                            const name = schDay.charAt(0).toUpperCase() + schDay.slice(1).toLowerCase();
                            const map = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7 };
                            return map[name] === mappedDay;
                        }
                        return schDay === mappedDay || schDay === dayOfWeek;
                    });

                    if (daySchedule) {
                        console.log("✓ Found schedule for day:", daySchedule);

                        // Parse times and duration
                        const fromTime = daySchedule.doc_from_time || daySchedule.from_time || daySchedule.doctor_from_time;
                        const toTime = daySchedule.doc_to_time || daySchedule.to_time || daySchedule.doctor_to_time;
                        const durationStr = daySchedule.doc_slot_dur || daySchedule.slot_duration || daySchedule.doc_slot_duration || "30";

                        // Extract duration in minutes
                        const durationMatch = String(durationStr).match(/\d+/);
                        const duration = durationMatch ? parseInt(durationMatch[0]) : 30;

                        // Generate time slots
                        slots = generateTimeSlots(fromTime, toTime, duration);
                        console.log("✓ Generated", slots.length, "time slots");

                        // Try to get schedule_id
                        schId = daySchedule.schedule_id || daySchedule.id || null;
                        console.log("✓ Schedule ID:", schId);
                    } else {
                        console.warn("No schedule found for day", mappedDay);
                    }
                } else {
                    console.warn("No schedules in response");
                }

                if (slots && slots.length > 0) {
                    console.log("✓ Setting", slots.length, "slots into state");
                    setAvailableSlots(slots);
                    if (schId) {
                        setScheduleId(schId);
                    }
                    toast.success(`Found ${slots.length} available time slots`);
                } else {
                    console.warn("✗ No slots generated");
                    toast.warning("Doctor is not scheduled for this date");
                    setAvailableSlots([]);
                    setScheduleId(null);
                }


                setSelectedTime("");
            } catch (error) {
                console.error("❌ Error in fetchAvailableSlots:", error);
                toast.error(error.message || "An error occurred while fetching time slots.");
                setAvailableSlots([]);
                setScheduleId(null);
                setSelectedTime("");
            }
        };

        // Helper function to generate time slots
        const generateTimeSlots = (fromTime, toTime, durationMinutes) => {
            const slots = [];
            if (!fromTime || !toTime) return slots;

            try {
                // Parse time strings (format: "HH:MM" or "HH:MM AM/PM")
                const parseTime = (timeStr) => {
                    const cleaned = timeStr.trim();
                    const isPM = /PM|pm/.test(cleaned);
                    const isAM = /AM|am/.test(cleaned);

                    let [hours, minutes] = cleaned.replace(/[APap][Mm]/g, '').trim().split(':').map(Number);

                    if (isAM && hours === 12) hours = 0;
                    if (isPM && hours !== 12) hours += 12;

                    return hours * 60 + minutes;
                };

                // Format time to 12-hour with AM/PM
                const formatTime = (minutes) => {
                    let hours = Math.floor(minutes / 60);
                    const mins = minutes % 60;
                    const period = hours >= 12 ? 'PM' : 'AM';
                    if (hours > 12) hours -= 12;
                    if (hours === 0) hours = 12;
                    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${period}`;
                };

                const startMins = parseTime(fromTime);
                const endMins = parseTime(toTime);

                for (let current = startMins; current < endMins; current += durationMinutes) {
                    slots.push(formatTime(current));
                }
            } catch (err) {
                console.error("Error generating time slots:", err);
            }

            return slots;
        };

        fetchAvailableSlots();
    }, [selectedDoctor, selectedDate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedDoctor || !selectedPatient || !selectedDate || !selectedTime) {
            toast.error("Please fill all required fields!");
            return;
        }

        const isEditing = editIndex !== null;

        // Format time for backend
        const aptTime = selectedTime.includes(':') && selectedTime.length === 5
            ? `${selectedTime}:00`
            : selectedTime;

        const appointmentData = {
            patient_id: parseInt(selectedPatient, 10),
            doc_id: parseInt(selectedDoctor, 10),
            doc_apt_date: selectedDate,
            apt_time: aptTime,
            apt_status: isEditing ? appointments[editIndex].status : "Pending"
        };

        // Add schedule_id if available (for new appointments) - backend expects doc_sch_id
        if (scheduleId && !isEditing) {
            appointmentData.doc_sch_id = scheduleId;
        }

        const url = isEditing
            ? `${API_BASE_URL}/appointments/edit-appointment/${editId}`
            : `${API_BASE_URL}/appointments/save-appointment`;

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
                if (response.status === 409) {
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
            fetchData();
            closeModal();

        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleDelete = async (index) => {
        const appointmentToDelete = filteredAppointments[index];
        if (!appointmentToDelete || !appointmentToDelete.id) {
            toast.error("Cannot delete: Invalid appointment data");
            return;
        }

        // Only allow deletion for Pending appointments
        if (String(appointmentToDelete.status).toLowerCase() !== "pending") {
            toast.error("Only pending appointments can be deleted.");
            return;
        }

        if (!window.confirm(`Are you sure you want to delete the pending appointment for ${appointmentToDelete.patientName}?`)) {
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_BASE_URL}/appointments/delete-pending-appointment`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ apt_Id: appointmentToDelete.id }),
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(result.message || result.alert || "Failed to delete appointment.");
            }

            toast.success(result.alert || result.success || "Appointment deleted successfully!");
            fetchData();
        } catch (error) {
            toast.error(error.message || "Error deleting appointment");
        }
    };

    const handleEdit = (index) => {
        const appt = filteredAppointments[index];
        if (!appt) return;

        const originalIndex = appointments.findIndex(a => a.id === appt.id);

        setSelectedPatient(appt.patientId?.toString() || "");
        setSelectedDoctor(appt.doctorId?.toString() || "");
        setSelectedDate(appt.date || "");
        // Normalize time to HH:MM for the time select
        let timeVal = appt.time || "";
        if (timeVal) {
            const parts = String(timeVal).split(":");
            if (parts.length >= 2) {
                timeVal = `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
            }
        }
        setSelectedTime(timeVal || "");
        setContact(appt.contact || "");
        setEditIndex(originalIndex);
        setEditId(appt.id);
        setShowModal(true);
    };

    const toggleStatus = async (index) => {
        const appointmentToUpdate = filteredAppointments[index];
        if (!appointmentToUpdate || !appointmentToUpdate.id) return;

        const newStatus = appointmentToUpdate.status === "Pending" ? "Checked" : "Pending";

        const aptTime = appointmentToUpdate.time.includes(':') && appointmentToUpdate.time.length === 5
            ? `${appointmentToUpdate.time}:00`
            : appointmentToUpdate.time;

        const updateData = {
            patient_id: appointmentToUpdate.patientId,
            doc_id: appointmentToUpdate.doctorId,
            doc_apt_date: appointmentToUpdate.date,
            apt_time: aptTime,
            apt_status: newStatus,
        };

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_BASE_URL}/appointments/edit-appointment/${appointmentToUpdate.id}`, {
                method: "POST", // Note: PUT or PATCH is more appropriate for updates
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
            fetchData();
        } catch (error) {
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
        setAvailableSlots([]);
        setScheduleId(null);
    };

    const openModal = () => {
        resetForm();
        setShowModal(true);
    };

    const closeModal = () => {
        resetForm();
        setShowModal(false);
    };

    const totalAppointments = filteredAppointments.length;
    const pendingAppointments = appointmentStatuses(filteredAppointments, "Pending").length;
    const completedAppointments = appointmentStatuses(filteredAppointments, "Checked").length;
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

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleDateFilterChange = (e) => {
        setDateFilter(e.target.value);
    };

    const handleStatusFilterChange = (e) => {
        setStatusFilter(e.target.value);
    };

    const clearFilters = () => {
        setSearchTerm("");
        setDateFilter("all");
        setStatusFilter("all");
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
                {console.debug("Passing availableSlots to Modal:", availableSlots)}
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
                    onSuccess={fetchData}
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

                            <div className="search-filter-container">
                                {/* Search Bar */}
                                <div>
                                    <input
                                        type="text"
                                        placeholder="Search appointments..."
                                        value={searchTerm}
                                        onChange={handleSearchChange}
                                        className="search-input"
                                    />
                                    {searchTerm && (
                                        <button
                                            className="clear-search-btn"
                                            onClick={() => setSearchTerm("")}
                                            title="Clear search"
                                        >
                                            <Icon icon="mdi:close" />
                                        </button>
                                    )}
                                </div>

                                {/* Date Filter */}
                                <div className="filter-group">
                                    <Icon icon="mdi:calendar" className="filter-icon" />
                                    <select
                                        value={dateFilter}
                                        onChange={handleDateFilterChange}
                                        className="filter-select"
                                    >
                                        <option value="all">All Dates</option>
                                        <option value="today">Today</option>
                                        <option value="2days">Next 2 Days</option>
                                        <option value="3days">Next 3 Days</option>
                                        <option value="7days">Next 7 Days</option>
                                    </select>
                                </div>

                                {/* Status Filter */}
                                <div className="filter-group">
                                    <Icon icon="mdi:filter" className="filter-icon" />
                                    <select
                                        value={statusFilter}
                                        onChange={handleStatusFilterChange}
                                        className="filter-select"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Checked">Checked</option>
                                    </select>
                                </div>

                                {/* Clear Filters Button */}
                                {(searchTerm || dateFilter !== "all" || statusFilter !== "all") && (
                                    <button
                                        className="clear-filters-btn"
                                        onClick={clearFilters}
                                    >
                                        <Icon icon="mdi:filter-remove" /> Clear
                                    </button>
                                )}
                            </div>

                            <button className="add-appointment-btn" onClick={openModal}>
                                <Icon icon="mdi:plus" /> Add Appointment
                            </button>
                        </div>

                        {/* Filter Status Info */}
                        {(searchTerm || dateFilter !== "all" || statusFilter !== "all") && (
                            <div className="filter-status-info">
                                <Icon icon="mdi:filter" />
                                <span>
                                    Showing {filteredAppointments.length} of {appointments.length} appointments
                                    {searchTerm && ` matching "${searchTerm}"`}
                                    {dateFilter !== "all" &&
                                        ` from ${dateFilter === "today" ? "today" :
                                            dateFilter === "2days" ? "next 2 days" :
                                                dateFilter === "3days" ? "next 3 days" :
                                                    "next 7 days"}`
                                    }
                                    {statusFilter !== "all" && ` with status "${statusFilter}"`}
                                </span>
                            </div>
                        )}

                        {filteredAppointments.length === 0 ? (
                            <div className="empty-state">
                                {searchTerm || dateFilter !== "all" || statusFilter !== "all" ? (
                                    <>
                                        <Icon icon="mdi:filter-off" className="empty-icon" />
                                        <p>No appointments match your search criteria.</p>
                                        <p className="empty-subtitle">
                                            Try changing your search terms or filters.
                                        </p>
                                        <button
                                            className="add-appointment-btn empty-state-btn"
                                            onClick={clearFilters}
                                        >
                                            <Icon icon="mdi:filter-remove" /> Clear Filters
                                        </button>
                                    </>
                                ) : (
                                    <>
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
                                    </>
                                )}
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
                                                        disabled={String(appt.status).toLowerCase() !== "pending"}
                                                        title={String(appt.status).toLowerCase() === "pending" ? "Delete" : "Only pending appointments can be deleted"}
                                                    >
                                                        <Icon icon="mdi:delete" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="table-btn edit"
                                                        title="Reschedule"
                                                        onClick={() => {
                                                            const originalIndex = appointments.findIndex(a => a.id === appt.id);
                                                            setRescheduleIndex(originalIndex);
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
                                                            const originalIndex = appointments.findIndex(a => a.id === appt.id);
                                                            setCheckupIndex(originalIndex);
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
