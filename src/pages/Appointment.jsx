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

    // New state for patient search in modal
    const [patientSearchId, setPatientSearchId] = useState("");
    const [searchedPatient, setSearchedPatient] = useState(null);
    const [patientSearchLoading, setPatientSearchLoading] = useState(false);
    const [patientSearchError, setPatientSearchError] = useState(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalAllAppointments, setTotalAllAppointments] = useState(0);
    const recordsPerPage = 4;

    const getPatientPhone = useCallback(
        (patientId) => {
            if (!patientId) return "";

            // Check searched patient first
            if (searchedPatient && (searchedPatient.id == patientId)) {
                return searchedPatient.contact || "";
            }

            return "";
        },
        [searchedPatient]
    );

    const handlePatientSearch = async (e) => {
        if (e) e.preventDefault();

        if (!patientSearchId.trim()) {
            toast.error("Please enter a Patient ID to search.");
            return;
        }
        setPatientSearchLoading(true);
        setPatientSearchError(null);
        setSearchedPatient(null);
        setSelectedPatient("");

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_BASE_URL}/users/fetch-patient?pt_id=${patientSearchId}`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Patient with ID ${patientSearchId} not found.`);
            }

            const patientData = await response.json();
            if (patientData && patientData.id) {
                // The API for fetch-patient might only return id and name.
                const completePatientData = {
                    ...patientData,
                    contact: patientData.contact || ""
                };

                setSearchedPatient(completePatientData);
                setSelectedPatient(completePatientData.id.toString());

                setContact(completePatientData.contact || "");
                toast.success(`Patient "${completePatientData.patient_name}" found and selected.`);
            } else {
                throw new Error(`Patient with ID ${patientSearchId} not found.`);
            }

        } catch (error) {
            setPatientSearchError(error.message);
            toast.error(error.message);
            setSelectedPatient("");
        } finally {
            setPatientSearchLoading(false);
        }
    };

    // Load data on mount safely
    const fetchData = useCallback(async (page = 1) => {
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
                if (doctorsRes.status === 401) {
                    toast.error("Please log in again");
                    localStorage.removeItem("token");
                    window.location.href = "/login";
                    return;
                }

                if (doctorsRes.status === 200) {
                    const response = doctorsRes.data;
                    doctorsData = response.allDoctors || response.users || response.data || (Array.isArray(response) ? response : []);
                } else {
                    console.warn("Failed to fetch doctors:", doctorsRes.status);
                }
            } catch (doctorError) {
                console.warn("Could not fetch doctors:", doctorError);
            }

            // Fetch appointments with pagination
            let appointmentsList = [];
            let totalAppointmentsFromAPI = 0;

            try {
                // Handle page parameter based on your API requirements
                const pageParam = page === 1 ? "firstPage" : page;
                const appointmentsRes = await fetch(`${API_BASE_URL}/appointments/show-appointments?page=${pageParam}`, {
                    method: "GET",
                    headers,
                });

                if (appointmentsRes.ok) {
                    const response = await appointmentsRes.json();


                    // Handle the response format correctly
                    if (response.formattedAppointments) {
                        appointmentsList = response.formattedAppointments;
                        totalAppointmentsFromAPI = response.totalAppointments || 0;
                        setCurrentPage(Number(response.currentPage) || 1);

                        // Calculate total pages
                        const calculatedTotalPages = Math.ceil(totalAppointmentsFromAPI / recordsPerPage);
                        setTotalPages(calculatedTotalPages > 0 ? calculatedTotalPages : 1);
                    } else if (Array.isArray(response)) {
                        appointmentsList = response;
                        totalAppointmentsFromAPI = response.length;
                        setTotalPages(1);
                    } else {
                        appointmentsList = response.appointments || response.data || [];
                        totalAppointmentsFromAPI = response.totalAppointments || response.total || appointmentsList.length;
                        setCurrentPage(response.currentPage || 1);
                        const calculatedTotalPages = Math.ceil(totalAppointmentsFromAPI / recordsPerPage);
                        setTotalPages(calculatedTotalPages > 0 ? calculatedTotalPages : 1);
                    }

                    setTotalAllAppointments(totalAppointmentsFromAPI);
                } else {
                    console.warn("Could not fetch appointments:", appointmentsRes.status);
                }
            } catch (appointmentError) {
                console.warn("Error fetching appointments:", appointmentError);
            }

            // Format appointments
            const formattedAppointments = appointmentsList.map(appt => {
                const doctor = Array.isArray(doctorsData)
                    ? doctorsData.find(d => d.user_Id == appt.doctor_ID || d.id == appt.doctor_ID)
                    : null;

                return {
                    id: appt.id,
                    patientName: String(appt.patient_name || 'Unknown Patient'),
                    patientId: appt.patient_ID,
                    doctorName: String(doctor?.user_name || doctor?.name || 'Unknown Doctor'),
                    doctorId: appt.doctor_ID,
                    contact: String(appt.contact || "Not provided"),
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

        } catch (error) {
            if (!error.message.includes("Failed to fetch")) {
                toast.error("Failed to load data. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(1);
    }, [fetchData]);

    // Apply filters whenever search term or date filter changes
    useEffect(() => {
        const filterAppointments = () => {
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
        };

        filterAppointments();
    }, [appointments, searchTerm, dateFilter, statusFilter]);


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

                // Use the correct endpoint with proper payload
                const response = await fetch(`${API_BASE_URL}/appointments/create-appointment`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        doc_id: docId,
                        doc_apt_date: selectedDate
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.alert || errorData.message || `Server Error: ${response.status}`);
                }

                const data = await response.json();

                // Handle the response format correctly
                if (data.formattedSlots && Array.isArray(data.formattedSlots)) {
                    setAvailableSlots(data.formattedSlots);
                    setScheduleId(data.schedule_id || null);
                    setSelectedTime("");

                    if (data.formattedSlots.length > 0) {
                        toast.success(`Found ${data.formattedSlots.length} available time slots`);
                    } else {
                        toast.warning("No available slots for this date");
                    }
                } else {
                    setAvailableSlots([]);
                    setScheduleId(null);
                    toast.warning("Doctor is not scheduled for this date");
                }

            } catch (error) {
                console.error("Error fetching available slots:", error);
                toast.error(error.message || "Failed to fetch available time slots");
                setAvailableSlots([]);
                setScheduleId(null);
                setSelectedTime("");
            }
        };

        fetchAvailableSlots();
    }, [selectedDoctor, selectedDate]);

    // handleSubmit function with proper error handling
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedDoctor || !selectedPatient || !selectedDate || !selectedTime) {
            toast.error("Please fill all required fields!");
            return;
        }

        const isEditing = editIndex !== null;

        // Format time for backend (convert from "hh:mm A" to "HH:mm:ss")
        const formatTimeForBackend = (timeStr) => {
            if (!timeStr) return "";

            // If already in HH:mm format, add seconds
            if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
                return `${timeStr}:00`;
            }

            // Convert from "hh:mm A" format to "HH:mm:ss"
            try {
                const time = new Date(`2000-01-01 ${timeStr}`);
                if (isNaN(time.getTime())) return timeStr;

                const hours = String(time.getHours()).padStart(2, '0');
                const minutes = String(time.getMinutes()).padStart(2, '0');
                return `${hours}:${minutes}:00`;
            } catch (error) {
                console.error("Error formatting time:", error);
                return timeStr;
            }
        };

        const aptTime = formatTimeForBackend(selectedTime);

        const appointmentData = {
            patient_id: parseInt(selectedPatient, 10),
            doc_id: parseInt(selectedDoctor, 10),
            doc_apt_date: selectedDate,
            apt_time: aptTime,
            apt_status: isEditing ? appointments[editIndex].status : "pending"
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
                    const patientName = (searchedPatient && searchedPatient.id == selectedPatient) ? searchedPatient.patient_name : 'Unknown Patient';

                    setConflictAppointment({
                        ...existingAppt,
                        doctorName: doctor?.user_name || 'Unknown Doctor',
                        patientName: patientName
                    });
                }
                throw new Error(result.alert || result.message || result.error || `Failed to ${isEditing ? 'update' : 'create'} appointment.`);
            }

            toast.success(result.success || result.alert || `Appointment ${isEditing ? 'updated' : 'created'} successfully!`);
            fetchData(currentPage);
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
                throw new Error(result.alert || result.message || "Failed to delete appointment.");
            }

            toast.success(result.alert || result.success || "Appointment deleted successfully!");
            fetchData(currentPage);
        } catch (error) {
            toast.error(error.message || "Error deleting appointment");
        }
    };

    // handleEdit function with proper time formatting
    const handleEdit = (index) => {
        const appt = filteredAppointments[index];
        if (!appt) return;

        // Pre-populate patient info for the modal
        if (appt.patientId && appt.patientName) {
            setSearchedPatient({
                id: appt.patientId,
                patient_name: appt.patientName,
                contact: appt.contact
            });
        }

        const originalIndex = appointments.findIndex(a => a.id === appt.id);

        setSelectedPatient(appt.patientId?.toString() || "");
        setSelectedDoctor(appt.doctorId?.toString() || "");
        setSelectedDate(appt.date || "");

        // Convert backend time format (hh:mm:ss A) to input format (HH:MM)
        let timeVal = appt.time || "";
        if (timeVal) {
            try {
                // Handle formats like "09:00:00 AM" or "14:30:00"
                const timeParts = String(timeVal).split(' ');
                let timeStr = timeParts[0]; // Get "09:00:00"

                if (timeParts.length > 1 && (timeParts[1].toUpperCase() === 'AM' || timeParts[1].toUpperCase() === 'PM')) {
                    // Convert from 12-hour format
                    const [time, period] = timeParts;
                    const [hours, minutes] = time.split(':');
                    let hour = parseInt(hours, 10);

                    if (period.toUpperCase() === 'PM' && hour < 12) {
                        hour += 12;
                    } else if (period.toUpperCase() === 'AM' && hour === 12) {
                        hour = 0;
                    }

                    timeVal = `${String(hour).padStart(2, '0')}:${minutes.padStart(2, '0')}`;
                } else {
                    // Already in 24-hour format or just HH:MM
                    const [hours, minutes] = timeStr.split(':');
                    timeVal = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
                }
            } catch (error) {
                console.error("Error parsing time:", timeVal, error);
                timeVal = "";
            }
        }

        setSelectedTime(timeVal || "");
        setContact(appt.contact || "");
        setEditIndex(originalIndex);
        setEditId(appt.id);
        setShowModal(true);
    };

    // toggleStatus function with proper data format
    const toggleStatus = async (index) => {
        const appointmentToUpdate = filteredAppointments[index];
        if (!appointmentToUpdate || !appointmentToUpdate.id) return;

        const newStatus = appointmentToUpdate.status === "pending" ? "confirmed" : "pending";

        // Format time for backend
        const formatTimeForBackend = (timeStr) => {
            if (!timeStr) return "";

            try {
                // Handle formats like "09:00 AM" or "14:30"
                const timeParts = String(timeStr).split(' ');
                if (timeParts.length > 1 && (timeParts[1].toUpperCase() === 'AM' || timeParts[1].toUpperCase() === 'PM')) {
                    const [time, period] = timeParts;
                    const [hours, minutes] = time.split(':');
                    let hour = parseInt(hours, 10);

                    if (period.toUpperCase() === 'PM' && hour < 12) {
                        hour += 12;
                    } else if (period.toUpperCase() === 'AM' && hour === 12) {
                        hour = 0;
                    }

                    return `${String(hour).padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
                } else {
                    // Already in 24-hour format
                    const [hours, minutes] = timeStr.split(':');
                    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
                }
            } catch (error) {
                console.error("Error formatting time:", error);
                return timeStr;
            }
        };

        const aptTime = formatTimeForBackend(appointmentToUpdate.time);

        const updateData = {
            apt_Id: appointmentToUpdate.id,
            patient_id: appointmentToUpdate.patientId,
            doc_id: appointmentToUpdate.doctorId,
            doc_apt_date: appointmentToUpdate.date,
            apt_time: aptTime,
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
                throw new Error(result.alert || result.message || "Failed to update status.");
            }

            toast.success(`Appointment status changed to ${newStatus}`);
            fetchData(currentPage);
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
        // Reset patient search state
        setPatientSearchId("");
        setSearchedPatient(null);
        setPatientSearchError(null);
    };

    const openModal = () => {
        resetForm();
        setShowModal(true);
    };

    const closeModal = () => {
        resetForm();
        setShowModal(false);
    };

    const totalFilteredAppointments = filteredAppointments.length;
    const totalAllAppointmentsCount = totalAllAppointments;
    const pendingAppointments = appointmentStatuses(filteredAppointments, "pending").length;
    const completedAppointments = appointmentStatuses(filteredAppointments, "confirmed").length;
    const isContactAutoFilled = selectedPatient && contact && getPatientPhone(selectedPatient) === contact;
    const selectedPatientPhone = selectedPatient ? getPatientPhone(selectedPatient) : "";

    const handleNavigation = (direction) => {
        if (direction === "next" && currentPage < totalPages) {
            fetchData(currentPage + 1);
        } else if (direction === "prev" && currentPage > 1) {
            fetchData(currentPage - 1);
        }
    };

    const onCloseHandler = () => {
        setShowReschedule(false);
    };

    // eslint-disable-next-line no-unused-vars
    const handleCheckupSubmit = async (checkupData) => {
        if (checkupIndex === null) return;

        const appointmentToUpdate = appointments[checkupIndex];

        const updateData = {
            apt_id: appointmentToUpdate.id,
            apt_status: "confirmed"
        };

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_BASE_URL}/appointments/staff-change-apt-status`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(updateData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.alert || result.message || "Failed to update status.");
            }

            toast.success(result.message || "Checkup completed and appointment confirmed!");
            fetchData(currentPage);
            setShowCheckup(false);
            setCheckupIndex(null);
        } catch (error) {
            toast.error(error.message);
        }
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
                            <span className="stat-number">{totalAllAppointmentsCount}</span>
                            <span className="stat-label">Total</span>
                        </div>
                        <div className="stat-card pending">
                            <span className="stat-number">{pendingAppointments}</span>
                            <span className="stat-label">Pending</span>
                        </div>
                        <div className="stat-card completed">
                            <span className="stat-number">{completedAppointments}</span>
                            <span className="stat-label">Confirmed</span>
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
                    // Add new props for patient search
                    patientSearchId={patientSearchId}
                    setPatientSearchId={setPatientSearchId}
                    handlePatientSearch={handlePatientSearch}
                    searchedPatient={searchedPatient}
                    patientSearchLoading={patientSearchLoading}
                    patientSearchError={patientSearchError}
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
                    onSuccess={() => fetchData(currentPage)}
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
                                <span className="page-info">(Page {currentPage} of {totalPages})</span>
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
                                        <option value="pending">Pending</option>
                                        <option value="confirmed">Confirmed</option>
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
                                    Showing {totalFilteredAppointments} of {appointments.length} appointments
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
                                        {filteredAppointments.map((appt, index) => (
                                            <tr key={appt.id || index}>
                                                <td>
                                                    <span
                                                        className={`status-cell ${appt.status.toLowerCase()}`}
                                                        onClick={() => toggleStatus(index)}
                                                        style={{ cursor: 'pointer' }}
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
                                                        onClick={() => handleEdit(index)}
                                                        title="Edit"
                                                    >
                                                        <Icon icon="mdi:pencil" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="table-btn delete"
                                                        onClick={() => handleDelete(index)}
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
                                                        disabled={appt.status === "confirmed"}
                                                    >
                                                        <Icon icon="mdi:clipboard-check-outline" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {totalPages > 1 && (
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPrev={() => handleNavigation("prev")}
                                        onNext={() => handleNavigation("next")}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}