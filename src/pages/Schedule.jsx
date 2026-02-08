import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";
import "../styles/Schedule.css";

const API_BASE_URL = "http://localhost:8080/hospital";

const initialScheduleState = {
    id: null,
    isScheduled: false,
    fromDate: "",
    toDate: "",
    days: {
        Monday: false,
        Tuesday: false,
        Wednesday: false,
        Thursday: false,
        Friday: false,
        Saturday: false,
        Sunday: false,
    },
};

// Per-day time schedule structure
const initialDayScheduleState = {
    fromTime: "09:00",
    toTime: "17:00",
    duration: "30",
};

const dayMapping = {
    "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4,
    "Friday": 5, "Saturday": 6, "Sunday": 7
};

const reverseDayMapping = {
    1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday",
    5: "Friday", 6: "Saturday", 7: "Sunday"
};

export default function Schedule() {
    const [doctors, setDoctors] = useState([]);
    const [filteredDoctors, setFilteredDoctors] = useState([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const [specialities, setSpecialities] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [schedule, setSchedule] = useState(initialScheduleState);
    // daySchedules[dayName] = { fromTime: "09:00", toTime: "17:00" }
    const [daySchedules, setDaySchedules] = useState({
        Monday: { ...initialDayScheduleState },
        Tuesday: { ...initialDayScheduleState },
        Wednesday: { ...initialDayScheduleState },
        Thursday: { ...initialDayScheduleState },
        Friday: { ...initialDayScheduleState },
        Saturday: { ...initialDayScheduleState },
        Sunday: { ...initialDayScheduleState },
    });
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [existingSchedules, setExistingSchedules] = useState([]);
    const [showFormContainer, setShowFormContainer] = useState(true);
    const prevScheduleRef = useRef(null);
    const prevDaySchedulesRef = useRef(null);
    const prevShowFormContainerRef = useRef(null);
    const [isCreatingFollowing, setIsCreatingFollowing] = useState(false);

    const groupedSchedules = React.useMemo(() => {
        if (!existingSchedules.length) return [];
        const groups = {};
        existingSchedules.forEach(sch => {
            const key = `${sch.doc_from_date}_${sch.doc_to_date}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(sch);
        });
        return Object.values(groups).sort((a, b) => {
            return new Date(a[0].doc_from_date) - new Date(b[0].doc_from_date);
        });
    }, [existingSchedules]);

    // Helper functions - defined early so they can be used in useCallback
    const resetDaySchedules = () => {
        setDaySchedules({
            Monday: { ...initialDayScheduleState },
            Tuesday: { ...initialDayScheduleState },
            Wednesday: { ...initialDayScheduleState },
            Thursday: { ...initialDayScheduleState },
            Friday: { ...initialDayScheduleState },
            Saturday: { ...initialDayScheduleState },
            Sunday: { ...initialDayScheduleState },
        });
    };

    // FIXED: Proper time formatting for backend (HH:mm)
    const formatTimeForBackend = (timeStr) => {
        if (!timeStr) return "09:00";

        // If already in HH:mm format, ensure proper formatting
        if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
            const [hours, minutes] = timeStr.split(':');
            const hourNum = parseInt(hours, 10);
            // Ensure hour is within 0-23 range
            if (hourNum < 0 || hourNum > 23) return "09:00";
            return `${String(hourNum).padStart(2, '0')}:${minutes.padStart(2, '0')}`;
        }

        // Convert from AM/PM format if needed
        const time = new Date(`2000-01-01 ${timeStr}`);
        if (isNaN(time.getTime())) return "09:00";

        const hours = String(time.getHours()).padStart(2, '0');
        const minutes = String(time.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    // Helper to format date for input type="date" (YYYY-MM-DD)
    const formatDateForInput = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return "";
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    // Helper to format time for input type="time" (HH:MM)
    const formatTimeForInput = (timeStr) => {
        if (!timeStr) return "09:00";

        // Remove AM/PM and trim
        let cleanTime = timeStr.replace(/AM|PM/gi, '').trim();

        // If already in HH:MM format, return it properly formatted
        if (/^\d{1,2}:\d{2}$/.test(cleanTime)) {
            const [hours, minutes] = cleanTime.split(':');
            let hourNum = parseInt(hours, 10);

            // Handle AM/PM conversion if present in original string
            if (timeStr.toLowerCase().includes('pm') && hourNum < 12) {
                hourNum += 12;
            } else if (timeStr.toLowerCase().includes('am') && hourNum === 12) {
                hourNum = 0;
            }

            return `${String(hourNum).padStart(2, '0')}:${minutes.padStart(2, '0')}`;
        }

        return "09:00";
    };

    useEffect(() => {
        fetchDoctors();
        fetchSpecialities();
    }, []);

    useEffect(() => {
        const doctorId = searchParams.get("doctorId");
        if (doctorId && doctors.length > 0) {
            const doc = doctors.find(d => (d.id || d.user_Id) == doctorId);
            if (doc) {
                setSelectedDoctor(doc);
                fetchDoctorSchedule(doc.id || doc.user_Id);
            }
        } else if (!doctorId) {
            setSelectedDoctor(null);
            setSchedule(initialScheduleState);
            setExistingSchedules([]);
            resetDaySchedules();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [doctors, searchParams]);

    const fetchDoctors = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(
                `${API_BASE_URL}/users/show-all-doctors`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (res.ok) {
                const data = await res.json();
                const users = Array.isArray(data)
                    ? data
                    : data.allDoctors || data.users || [];

                const docs = users.filter(
                    u =>
                        u.role_id === 1 ||
                        u.role_id === "1" ||
                        (u.role && u.role.includes("doctor"))
                );

                setDoctors(docs);
                setFilteredDoctors(docs);
            }
        } catch (err) {
            console.error("Failed to fetch doctors", err);
            toast.error("Failed to load doctors");
        }
    };

    const fetchSpecialities = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(
                `${API_BASE_URL}/users/get-doctor-specialities`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (res.ok) {
                const data = await res.json();
                setSpecialities(data);
            }
        } catch (err) {
            console.error("Failed to fetch specialities", err);
        }
    };

    const fetchDoctorSchedule = useCallback(async (doctorId) => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem("token");
            const res = await fetch(
                `${API_BASE_URL}/schedule-doctors/show-doctor-timetable/${doctorId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (res.ok) {
                const data = await res.json();
                setExistingSchedules(data || []);

                if (data && data.length > 0) {
                    const firstSchedule = data[0];

                    const daysObj = { ...initialScheduleState.days };
                    const newDaySchedules = {
                        Monday: { ...initialDayScheduleState },
                        Tuesday: { ...initialDayScheduleState },
                        Wednesday: { ...initialDayScheduleState },
                        Thursday: { ...initialDayScheduleState },
                        Friday: { ...initialDayScheduleState },
                        Saturday: { ...initialDayScheduleState },
                        Sunday: { ...initialDayScheduleState },
                    };

                    // Process each schedule entry
                    data.forEach(sch => {
                        let dayName = '';
                        if (sch.doc_day) {
                            // Handle both string and number day formats
                            if (typeof sch.doc_day === 'number') {
                                dayName = reverseDayMapping[sch.doc_day] || '';
                            } else {
                                dayName = sch.doc_day.charAt(0).toUpperCase() +
                                    sch.doc_day.slice(1).toLowerCase();
                            }
                        }

                        if (dayName && dayName in daysObj) {
                            daysObj[dayName] = true;

                            // Format times for input fields
                            const fromTime = sch.doc_from_time ? formatTimeForInput(sch.doc_from_time) : "09:00";
                            const toTime = sch.doc_to_time ? formatTimeForInput(sch.doc_to_time) : "17:00";

                            newDaySchedules[dayName] = {
                                fromTime,
                                toTime,
                                duration: sch.doc_slot_dur ? sch.doc_slot_dur.match(/\d+/)?.[0] || "30" : "30"
                            };
                        }
                    });

                    setSchedule({
                        id: firstSchedule.schedule_id,
                        isScheduled: true,
                        fromDate: formatDateForInput(firstSchedule.doc_from_date),
                        toDate: formatDateForInput(firstSchedule.doc_to_date),
                        days: daysObj,
                    });

                    setDaySchedules(newDaySchedules);
                    setShowFormContainer(false);
                } else {
                    // No existing schedules
                    setSchedule(initialScheduleState);
                    resetDaySchedules();
                    setShowFormContainer(true);
                }
            } else {
                // API returned error
                setSchedule(initialScheduleState);
                resetDaySchedules();
                setShowFormContainer(true);
            }
        } catch (error) {
            console.error("Failed to fetch schedule", error);
            toast.error("Failed to load schedule");
            setSchedule(initialScheduleState);
            resetDaySchedules();
            setShowFormContainer(true);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleSearch = (e) => {
        const term = e.target.value.toLowerCase();
        setSearchTerm(term);

        if (!term) {
            setFilteredDoctors(doctors);
            return;
        }

        setFilteredDoctors(
            doctors.filter(
                d =>
                    (d.user_name || "")
                        .toLowerCase()
                        .includes(term) ||
                    (d.specialization || "")
                        .toLowerCase()
                        .includes(term)
            )
        );
    };

    const handleScheduleChange = (field, value) => {
        setSchedule(prev => ({ ...prev, [field]: value }));
    };

    const handleDayChange = (day) => {
        setSchedule(prev => ({
            ...prev,
            days: {
                ...prev.days,
                [day]: !prev.days[day]
            }
        }));
    };

    const handleDayTimeChange = (day, field, value) => {
        setDaySchedules(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                [field]: value
            }
        }));
    };

    const handleDayDurationChange = (day, value) => {
        setDaySchedules(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                duration: value
            }
        }));
    };

    const handleSelectAllDays = () => {
        const allDaysSelected = Object.values(schedule.days).every(Boolean);
        setSchedule(prev => {
            const newDays = {};
            Object.keys(prev.days).forEach(day => {
                newDays[day] = !allDaysSelected;
            });
            return {
                ...prev,
                days: newDays
            };
        });
    };

    // FIXED: Main schedule save/update function
    const handleScheduleAction = async () => {
        if (!schedule.fromDate || !schedule.toDate) {
            toast.error("Please select both 'From Date' and 'To Date'.");
            return;
        }
        if (new Date(schedule.toDate) < new Date(schedule.fromDate)) {
            toast.error("'To Date' cannot be earlier than 'From Date'.");
            return;
        }
        const selectedDaysCount = Object.values(schedule.days).filter(Boolean).length;
        if (selectedDaysCount === 0) {
            toast.error("Please select at least one day of the week.");
            return;
        }

        // Validate each day's time slots
        for (const day of Object.keys(schedule.days).filter(day => schedule.days[day])) {
            const daySchedule = daySchedules[day];
            const fromTime = new Date(`2000-01-01 ${daySchedule.fromTime}`);
            const toTime = new Date(`2000-01-01 ${daySchedule.toTime}`);

            if (fromTime >= toTime) {
                toast.error(`${day}: 'To Time' must be later than 'From Time'`);
                return;
            }
        }

        // Build array of per-day schedules
        const selectedDays = Object.keys(schedule.days).filter(day => schedule.days[day]);
        const daySchedulePayloads = selectedDays.map(day => {
            const times = daySchedules[day];

            // Get doctor ID - handle all possible ID fields
            const doctorId = parseInt(
                selectedDoctor.doctor_ID ||
                selectedDoctor.doctor_id ||
                selectedDoctor.doctorId ||
                selectedDoctor.id ||
                selectedDoctor.user_Id,
                10
            );

            // FIXED: Ensure proper time formatting for backend
            return {
                docID: doctorId,
                doc_day: dayMapping[day], // Send day number (1-7)
                from_time: formatTimeForBackend(times.fromTime), // HH:mm format
                to_time: formatTimeForBackend(times.toTime), // HH:mm format
                from_date: schedule.fromDate, // YYYY-MM-DD format
                to_date: schedule.toDate, // YYYY-MM-DD format
                slot_duration: parseInt(times.duration, 10) // Number
            };
        });

        console.log("Schedule payload:", daySchedulePayloads); // Debug log

        try {
            setIsLoading(true);
            const token = localStorage.getItem("token");
            const endpoint = `${API_BASE_URL}/schedule-doctors/save-doctor-timetable`;

            const res = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(daySchedulePayloads)
            });

            // Try to parse response
            let responseData;
            const responseText = await res.text();
            try {
                responseData = responseText ? JSON.parse(responseText) : {};
                // eslint-disable-next-line no-unused-vars
            } catch (e) {
                responseData = { message: responseText };
            }

            if (res.ok) {
                toast.success(responseData.message || "Schedule saved successfully");
                setIsEditing(false);
                setShowFormContainer(false);
                setIsCreatingFollowing(false);

                // Refresh the doctor's schedule
                const doctorID = selectedDoctor.doctor_ID ||
                    selectedDoctor.doctor_id ||
                    selectedDoctor.doctorId ||
                    selectedDoctor.id ||
                    selectedDoctor.user_Id;
                await fetchDoctorSchedule(doctorID);
            } else {
                const errorMsg = responseData.alert ||
                    responseData.error ||
                    responseData.message ||
                    `Error ${res.status}: ${responseText.substring(0, 100)}`;
                toast.error(`Failed to save schedule: ${errorMsg}`);
            }
        } catch (error) {
            console.error("Error saving schedule:", error);
            toast.error("Error saving schedule. Please check console for details.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditAction = (schedulesToEdit = existingSchedules) => {
        // Populate form with existing schedule data for editing
        const targetSchedules = Array.isArray(schedulesToEdit) ? schedulesToEdit : existingSchedules;
        if (targetSchedules.length > 0) {
            const firstSchedule = targetSchedules[0];

            // Build days object and day schedules from existing data
            const daysObj = { ...initialScheduleState.days };
            const newDaySchedules = {
                Monday: { ...initialDayScheduleState },
                Tuesday: { ...initialDayScheduleState },
                Wednesday: { ...initialDayScheduleState },
                Thursday: { ...initialDayScheduleState },
                Friday: { ...initialDayScheduleState },
                Saturday: { ...initialDayScheduleState },
                Sunday: { ...initialDayScheduleState },
            };

            // Process each schedule entry to populate days and times
            targetSchedules.forEach(sch => {
                let dayName = '';
                if (sch.doc_day) {
                    if (typeof sch.doc_day === 'number') {
                        dayName = reverseDayMapping[sch.doc_day] || '';
                    } else {
                        dayName = sch.doc_day.charAt(0).toUpperCase() +
                            sch.doc_day.slice(1).toLowerCase();
                    }
                }

                if (dayName && dayName in daysObj) {
                    daysObj[dayName] = true;
                    newDaySchedules[dayName] = {
                        fromTime: formatTimeForInput(sch.doc_from_time),
                        toTime: formatTimeForInput(sch.doc_to_time),
                        duration: sch.doc_slot_dur?.match(/\d+/)?.[0] || "30"
                    };
                }
            });

            setSchedule({
                id: firstSchedule.schedule_id,
                isScheduled: true,
                fromDate: formatDateForInput(firstSchedule.doc_from_date),
                toDate: formatDateForInput(firstSchedule.doc_to_date),
                days: daysObj,
            });

            setDaySchedules(newDaySchedules);
        }

        setShowFormContainer(true);
        setIsEditing(true);
        toast.info("You can now edit the schedule.");
    };

    const handleDeleteSchedule = async (id) => {
        if (!id) return;

        if (window.confirm("Are you sure you want to delete this schedule?")) {
            try {
                setIsLoading(true);
                const token = localStorage.getItem("token");
                const res = await fetch(
                    `${API_BASE_URL}/schedule-doctors/delete-doctor-timetable/${id}`,
                    {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                if (res.ok) {
                    const doctorID = selectedDoctor.doctor_ID || selectedDoctor.doctor_id ||
                        selectedDoctor.doctorId || selectedDoctor.id || selectedDoctor.user_Id;
                    await fetchDoctorSchedule(doctorID);
                    toast.success("Schedule deleted successfully!");
                    if (schedule.id === id) {
                        setIsEditing(false);
                        setShowFormContainer(false);
                    }
                } else {
                    const errorData = await res.json();
                    toast.error(errorData.message || "Failed to delete schedule");
                }
            } catch (error) {
                console.error("Error deleting schedule:", error);
                toast.error("Error deleting schedule");
            } finally {
                setIsLoading(false);
            }
        }
    };

    // eslint-disable-next-line no-unused-vars
    const handleDeleteAction = () => {
        if (!schedule.id) {
            toast.error("No schedule to delete");
            return;
        }
        handleDeleteSchedule(schedule.id);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setShowFormContainer(false);
    };

    // Prefill a new schedule that starts after the current schedule's toDate
    const handleCreateFollowingSchedule = () => {
        if (!schedule.isScheduled || !schedule.toDate) {
            toast.error("No existing schedule to base the next schedule on.");
            return;
        }

        try {
            // preserve current state so user can cancel creating the following schedule
            prevScheduleRef.current = schedule;
            prevDaySchedulesRef.current = daySchedules;
            prevShowFormContainerRef.current = showFormContainer;

            const prevFrom = schedule.fromDate;
            const prevTo = schedule.toDate;
            const fromDateObj = new Date(prevFrom);
            const toDateObj = new Date(prevTo);
            if (isNaN(fromDateObj.getTime()) || isNaN(toDateObj.getTime())) {
                toast.error("Existing schedule has invalid dates.");
                return;
            }

            const nextFrom = new Date(toDateObj.getTime());
            nextFrom.setDate(nextFrom.getDate() + 1);

            const diffMs = toDateObj.getTime() - fromDateObj.getTime();
            const lengthDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
            const nextTo = new Date(nextFrom.getTime());
            nextTo.setDate(nextTo.getDate() + lengthDays);

            const fmt = (d) => {
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                return `${yyyy}-${mm}-${dd}`;
            };

            setSchedule(prev => ({
                ...prev,
                id: null,
                isScheduled: false,
                fromDate: fmt(nextFrom),
                toDate: fmt(nextTo),
                days: { ...prev.days }
            }));

            setIsEditing(false);
            setShowFormContainer(true);
            setIsCreatingFollowing(true);
            toast.info("Prefilled next schedule — adjust if needed and click Create Schedule.");
        } catch (err) {
            console.error("Failed to prefill following schedule:", err);
            toast.error("Failed to prepare following schedule.");
        }
    };

    const handleCancelCreateFollowing = () => {
        // restore saved state if available
        if (prevScheduleRef.current) {
            setSchedule(prevScheduleRef.current);
        } else {
            setSchedule(initialScheduleState);
        }

        if (prevDaySchedulesRef.current) {
            setDaySchedules(prevDaySchedulesRef.current);
        } else {
            resetDaySchedules();
        }

        if (typeof prevShowFormContainerRef.current !== 'undefined') {
            setShowFormContainer(prevShowFormContainerRef.current);
        } else {
            setShowFormContainer(false);
        }

        setIsCreatingFollowing(false);
        toast.info("Cancelled creating following schedule.");
    };

    const getSpecialityName = (doc) => {
        if (doc.specialization) return doc.specialization;
        if (doc.spec_ID) {
            const spec = specialities.find(s => s.id === doc.spec_ID);
            return spec ? spec.speciality : "Specialist";
        }
        return "Specialist";
    };

    const isFormDisabled = (schedule.isScheduled && !isEditing) || isLoading;
    const selectedDays = Object.keys(schedule.days).filter(day => schedule.days[day]);

    // Auto-scroll to day schedules section when days are selected
    const daySchedulesRef = React.useRef(null);
    React.useEffect(() => {
        if (selectedDays.length > 0 && daySchedulesRef.current) {
            setTimeout(() => {
                daySchedulesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }, [selectedDays]);

    return (
        <div className="schedule-container">
            <h2>
                <Icon icon="mdi:calendar-clock" /> Doctor Schedule
            </h2>

            {isLoading && (
                <div className="loading-overlay">
                    <div className="loading-spinner"></div>
                    <p>Loading schedule...</p>
                </div>
            )}

            {!selectedDoctor ? (
                <>
                    <div className="search-bar">
                        <input
                            placeholder="Search Doctor"
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                    </div>

                    <div className="doctors-grid">
                        {filteredDoctors && filteredDoctors.length > 0 ? (
                            filteredDoctors.map(doc => (
                                <div
                                    key={doc.id || doc.user_Id}
                                    className="doctor-card"
                                    onClick={() => setSearchParams({ doctorId: doc.id || doc.user_Id })}
                                >
                                    <Icon icon="mdi:doctor" />
                                    <h3>{doc.user_name || "Doctor"}</h3>
                                    <p>{getSpecialityName(doc)}</p>
                                </div>
                            ))
                        ) : (
                            <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#999' }}>
                                No doctors available. Please check back later.
                            </p>
                        )}
                    </div>
                </>
            ) : (
                <>
                    <div className="schedule-header-actions">
                        <button
                            className="back-btn"
                            onClick={() => {
                                setSearchParams({});
                                setSelectedDoctor(null);
                            }}
                            disabled={isLoading}
                        >
                            <Icon icon="mdi:arrow-left" /> Back
                        </button>
                    </div>

                    <div className="selected-doctor-info">
                        <h3>{selectedDoctor.user_name}</h3>
                        <p>{getSpecialityName(selectedDoctor)}</p>
                    </div>

                    {groupedSchedules.length > 0 && !isEditing && (
                        <div className="existing-schedules-list">
                            {groupedSchedules.map((group, idx) => (
                                <div key={idx} className="existing-schedules" style={{ marginBottom: '20px' }}>
                                    <div className="existing-schedules-header">
                                        <h4>Schedule: {group[0].doc_from_date} to {group[0].doc_to_date}</h4>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button
                                                className="edit-btn"
                                                onClick={() => handleEditAction(group)}
                                                disabled={isLoading}
                                            >
                                                <Icon icon="mdi:pencil" /> Edit
                                            </button>
                                            <button
                                                className="delete-btn"
                                                onClick={() => handleDeleteSchedule(group[0].schedule_id)}
                                                disabled={isLoading}
                                                style={{ padding: '8px 16px', fontSize: '14px', backgroundColor: '#ff4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                            >
                                                <Icon icon="mdi:delete" /> Delete
                                            </button>
                                        </div>
                                    </div>
                                    <div className="schedules-cards-container">
                                        {group.map((sch, index) => {
                                            let dayName = 'Schedule';
                                            if (sch.doc_day) {
                                                if (typeof sch.doc_day === 'number') {
                                                    dayName = reverseDayMapping[sch.doc_day] || 'Day ' + sch.doc_day;
                                                } else {
                                                    dayName = sch.doc_day.charAt(0).toUpperCase() +
                                                        sch.doc_day.slice(1).toLowerCase();
                                                }
                                            }
                                            const fromTime = sch.doc_from_time || '-';
                                            const toTime = sch.doc_to_time || '-';
                                            const duration = sch.doc_slot_dur || '-';

                                            return (
                                                <div key={index} className="schedule-card">
                                                    <div className="card-day-header">
                                                        <h5>{dayName}</h5>
                                                    </div>
                                                    <div className="card-content">
                                                        <div className="info-row">
                                                            <span className="label">Time:</span>
                                                            <span className="value">{fromTime} - {toTime}</span>
                                                        </div>
                                                        <div className="info-row">
                                                            <span className="label">Duration:</span>
                                                            <span className="value">{duration}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {showFormContainer && (
                        <div className="schedule-form-container">
                            {/* Global Date Controls */}
                            <div className="schedule-controls">
                                <div className="control-group">
                                    <label>From Date</label>
                                    <input
                                        type="date"
                                        value={schedule.fromDate}
                                        disabled={isFormDisabled}
                                        onChange={(e) => handleScheduleChange('fromDate', e.target.value)}
                                    />
                                </div>
                                <div className="control-group">
                                    <label>To Date</label>
                                    <input
                                        type="date"
                                        value={schedule.toDate}
                                        disabled={isFormDisabled}
                                        onChange={(e) => handleScheduleChange('toDate', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Day Selection Checkboxes */}
                            <div className="schedule-day-selector">
                                <div className="day-selector-header">
                                    <h4>Select Days</h4>
                                    <button
                                        className="select-all-btn"
                                        onClick={handleSelectAllDays}
                                        disabled={isFormDisabled}
                                    >
                                        {Object.values(schedule.days).every(Boolean) ? 'Deselect All' : 'Select All'}
                                    </button>
                                </div>
                                <div className="day-checkboxes">
                                    {Object.keys(schedule.days).map(day => (
                                        <div key={day} className="day-checkbox-group">
                                            <input
                                                type="checkbox"
                                                id={`day-${day}`}
                                                checked={schedule.days[day]}
                                                disabled={isFormDisabled}
                                                onChange={() => handleDayChange(day)}
                                            />
                                            <label htmlFor={`day-${day}`}>{day}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Per-Day Time Slot Cards */}
                            <div
                                ref={daySchedulesRef}
                                className="day-schedules-section"
                                style={{
                                    display: selectedDays.length > 0 ? 'block' : 'none',
                                    visibility: selectedDays.length > 0 ? 'visible' : 'hidden'
                                }}
                            >
                                <h4> Time Slots for Selected Days</h4>
                                <div className="day-schedules-grid">
                                    {selectedDays.map(day => (
                                        <div key={day} className="day-schedule-card">
                                            <div className="day-card-header">
                                                <h5>{day}</h5>
                                            </div>
                                            <div className="day-card-content">
                                                <div className="time-input-group">
                                                    <label>From Time</label>
                                                    <input
                                                        type="time"
                                                        value={daySchedules[day].fromTime}
                                                        disabled={isFormDisabled}
                                                        onChange={(e) => handleDayTimeChange(day, 'fromTime', e.target.value)}
                                                    />
                                                </div>
                                                <div className="time-input-group">
                                                    <label>To Time</label>
                                                    <input
                                                        type="time"
                                                        value={daySchedules[day].toTime}
                                                        disabled={isFormDisabled}
                                                        onChange={(e) => handleDayTimeChange(day, 'toTime', e.target.value)}
                                                    />
                                                </div>
                                                <div className="duration-input-group">
                                                    <label>Slot Duration (minutes)</label>
                                                    <select
                                                        value={daySchedules[day].duration}
                                                        disabled={isFormDisabled}
                                                        onChange={(e) => handleDayDurationChange(day, e.target.value)}
                                                    >
                                                        <option value="15">15 min</option>
                                                        <option value="30">30 min</option>
                                                        <option value="45">45 min</option>
                                                        <option value="60">60 min</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="schedule-action-buttons">
                                {(!schedule.isScheduled || isEditing) && (
                                    <button
                                        className="schedule-btn"
                                        onClick={handleScheduleAction}
                                        disabled={isLoading}
                                    >
                                        <Icon icon="mdi:calendar-check" />
                                        {isLoading ? 'Saving...' : (schedule.isScheduled ? 'Update Schedule' : 'Create Schedule')}
                                    </button>
                                )}

                                {isEditing && (
                                    <button
                                        className="cancel-btn"
                                        onClick={handleCancelEdit}
                                        disabled={isLoading}
                                    >
                                        <Icon icon="mdi:close" /> Cancel
                                    </button>
                                )}
                                {isCreatingFollowing && !isEditing && (
                                    <button
                                        className="cancel-btn"
                                        onClick={handleCancelCreateFollowing}
                                        disabled={isLoading}
                                    >
                                        <Icon icon="mdi:close" /> Cancel
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {schedule.isScheduled && !isEditing && (
                        <div className="schedule-action-buttons">
                            <button
                                className="schedule-btn"
                                onClick={handleCreateFollowingSchedule}
                                disabled={isLoading}
                                title="Create a new schedule starting after the current schedule"
                            >
                                <Icon icon="mdi:calendar-plus" /> New Following Schedule
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}