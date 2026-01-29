import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";
import "../styles/Schedule.css";

const API_BASE_URL = "http://localhost:8080/hospital";

const initialScheduleState = {
    id: null,
    isScheduled: false,
    fromTime: "09:00",
    toTime: "17:00",
    fromDate: "",
    toDate: "",
    duration: "30",
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
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [existingSchedules, setExistingSchedules] = useState([]);

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
        }
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
                    : data.users || [];

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

    const fetchDoctorSchedule = async (doctorId) => {
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
                setExistingSchedules(data);

                if (data && data.length > 0) {
                    const firstSchedule = data[0];
                    const daysArray = firstSchedule.days ? firstSchedule.days.split(',') : [];

                    const daysObj = { ...initialScheduleState.days };
                    daysArray.forEach(day => {
                        const dayName = reverseDayMapping[day] || day;
                        if (dayName in daysObj) {
                            daysObj[dayName] = true;
                        }
                    });

                    setSchedule({
                        id: firstSchedule.id,
                        isScheduled: true,
                        fromTime: firstSchedule.doctor_from_time?.substring(0, 5) || "09:00",
                        toTime: firstSchedule.doctor_to_time?.substring(0, 5) || "17:00",
                        fromDate: firstSchedule.doc_from_date || "",
                        toDate: firstSchedule.doc_to_date || "",
                        duration: firstSchedule.doc_slot_dur?.toString() || "30",
                        days: daysObj,
                    });
                } else {
                    setSchedule(initialScheduleState);
                }
            } else {
                setSchedule(initialScheduleState);
            }
        } catch (error) {
            console.error("Failed to fetch schedule", error);
            toast.error("Failed to load schedule");
            setSchedule(initialScheduleState);
        } finally {
            setIsLoading(false);
        }
    };

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

        const docDays = Object.keys(schedule.days)
            .filter(day => schedule.days[day])
            .map(day => dayMapping[day]);

        const doctorID = selectedDoctor.doctor_ID || selectedDoctor.doctor_id ||
            selectedDoctor.doctorId || selectedDoctor.id || selectedDoctor.user_Id;

        const formatTimeForBackend = (timeStr) => {
            if (!timeStr) return timeStr;
            const [hours, minutes] = timeStr.split(':');
            const hourNum = parseInt(hours, 10);
            return `${hourNum}:${minutes}`;
        };

        const payload = {
            docID: parseInt(doctorID, 10),
            doc_days: docDays,
            from_time: formatTimeForBackend(schedule.fromTime),
            to_time: formatTimeForBackend(schedule.toTime),
            from_date: schedule.fromDate,
            to_date: schedule.toDate,
            slot_duration: parseInt(schedule.duration, 10)
        };

        if (schedule.id) {
            payload.sch_ID = schedule.id;
        }

        try {
            setIsLoading(true);
            const token = localStorage.getItem("token");
            const endpoint = schedule.id
                ? `${API_BASE_URL}/schedule-doctors/edit-doctor-timetable`
                : `${API_BASE_URL}/schedule-doctors/save-doctor-timetable`;

            const res = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const responseText = await res.text();
            let responseData;
            try {
                responseData = JSON.parse(responseText);
                // eslint-disable-next-line no-unused-vars
            } catch (e) {
                responseData = { message: responseText };
            }

            if (res.ok) {
                const newSchedule = {
                    ...schedule,
                    isScheduled: true,
                    id: schedule.id || Date.now()
                };
                setSchedule(newSchedule);
                setIsEditing(false);

                await fetchDoctorSchedule(doctorID);

                toast.success(
                    schedule.id
                        ? "Schedule updated successfully!"
                        : "Schedule created successfully!"
                );
            } else {
                const errorMsg = responseData.error || responseData.message ||
                    `Error ${res.status}: ${responseText.substring(0, 100)}`;
                toast.error(errorMsg);
            }
        } catch (error) {
            console.error("Error saving schedule:", error);
            toast.error("Error saving schedule");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditAction = () => {
        setIsEditing(true);
        toast.info("You can now edit the schedule.");
    };

    const handleDeleteAction = async () => {
        if (!schedule.id) {
            toast.error("No schedule to delete");
            return;
        }

        if (window.confirm("Are you sure you want to delete this schedule?")) {
            try {
                setIsLoading(true);
                const token = localStorage.getItem("token");
                const res = await fetch(
                    `${API_BASE_URL}/schedule-doctors/delete-doctor-timetable/${schedule.id}`,
                    {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                if (res.ok) {
                    setSchedule(initialScheduleState);
                    setIsEditing(false);
                    const doctorID = selectedDoctor.doctor_ID || selectedDoctor.doctor_id ||
                        selectedDoctor.doctorId || selectedDoctor.id || selectedDoctor.user_Id;
                    await fetchDoctorSchedule(doctorID);
                    toast.success("Schedule deleted successfully!");
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

    const handleCancelEdit = () => {
        if (existingSchedules.length > 0) {
            const firstSchedule = existingSchedules[0];
            const daysArray = firstSchedule.days ? firstSchedule.days.split(',') : [];

            const daysObj = { ...initialScheduleState.days };
            daysArray.forEach(day => {
                const dayName = reverseDayMapping[day] || day;
                if (dayName in daysObj) {
                    daysObj[dayName] = true;
                }
            });

            setSchedule({
                id: firstSchedule.id,
                isScheduled: true,
                fromTime: firstSchedule.doctor_from_time?.substring(0, 5) || "09:00",
                toTime: firstSchedule.doctor_to_time?.substring(0, 5) || "17:00",
                fromDate: firstSchedule.doc_from_date || "",
                toDate: firstSchedule.doc_to_date || "",
                duration: firstSchedule.doc_slot_dur?.toString() || "30",
                days: daysObj,
            });
        } else {
            setSchedule(initialScheduleState);
        }
        setIsEditing(false);
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

    return (
        <div className="schedule-container">
            <h2>
                <Icon icon="mdi:calendar-clock" /> Doctor Schedule
            </h2>

            {isLoading && (
                <div className="loading-overlay">
                    <div className="loading-spinner"></div>
                    <p>Loading...</p>
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
                        {filteredDoctors.map(doc => (
                            <div
                                key={doc.id || doc.user_Id}
                                className="doctor-card"
                                onClick={() => setSearchParams({ doctorId: doc.id || doc.user_Id })}
                            >
                                <Icon icon="mdi:doctor" />
                                <h3>{doc.user_name}</h3>
                                <p>{getSpecialityName(doc)}</p>
                            </div>
                        ))}
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

                    {existingSchedules.length > 0 && !isEditing && (
                        <div className="existing-schedules">
                            <h4>Existing Schedules</h4>
                            {existingSchedules.map((sch, index) => (
                                <div key={index} className="schedule-card">
                                    <p><strong>Days:</strong> {sch.days}</p>
                                    <p><strong>Time:</strong> {sch.doctor_from_time} - {sch.doctor_to_time}</p>
                                    <p><strong>Date Range:</strong> {sch.doc_from_date} to {sch.doc_to_date}</p>
                                    <p><strong>Slot Duration:</strong> {sch.doc_slot_dur} minutes</p>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="schedule-form-container">
                        <div className="schedule-controls">
                            <div className="control-group">
                                <label>From Time</label>
                                <input
                                    type="time"
                                    value={schedule.fromTime}
                                    disabled={isFormDisabled}
                                    onChange={(e) => handleScheduleChange('fromTime', e.target.value)}
                                />
                            </div>
                            <div className="control-group">
                                <label>To Time</label>
                                <input
                                    type="time"
                                    value={schedule.toTime}
                                    disabled={isFormDisabled}
                                    onChange={(e) => handleScheduleChange('toTime', e.target.value)}
                                />
                            </div>
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
                            <div className="control-group">
                                <label>Duration (minutes)</label>
                                <select
                                    value={schedule.duration}
                                    disabled={isFormDisabled}
                                    onChange={(e) => handleScheduleChange('duration', e.target.value)}
                                >
                                    <option value="15">15 Mins</option>
                                    <option value="30">30 Mins</option>
                                    <option value="45">45 Mins</option>
                                    <option value="60">60 Mins</option>
                                </select>
                            </div>
                        </div>

                        <div className="schedule-day-selector">
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

                            {schedule.isScheduled && !isEditing && (
                                <>
                                    <button
                                        className="edit-btn"
                                        onClick={handleEditAction}
                                        disabled={isLoading}
                                    >
                                        <Icon icon="mdi:pencil" /> Edit
                                    </button>
                                    <button
                                        className="delete-btn"
                                        onClick={handleDeleteAction}
                                        disabled={isLoading}
                                    >
                                        <Icon icon="mdi:delete" /> Delete
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}