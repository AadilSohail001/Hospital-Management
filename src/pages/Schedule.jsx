import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";
import "../styles/Schedule.css";

const API_BASE_URL = "http://localhost:8080/hospital";

export default function Schedule() {
    const [doctors, setDoctors] = useState([]);
    const [filteredDoctors, setFilteredDoctors] = useState([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const [specialities, setSpecialities] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDoctor, setSelectedDoctor] = useState(null);

    const [scheduleDays, setScheduleDays] = useState([]);
    const [scheduleRows, setScheduleRows] = useState([{
        dayIndex: -1,
        from: "09:00",
        to: "17:00",
        duration: "30",
        isScheduled: false
    }]);

    useEffect(() => {
        fetchDoctors();
        fetchScheduleDays();
        fetchSpecialities();
    }, []);

    useEffect(() => {
        const doctorId = searchParams.get("doctorId");
        if (doctorId && doctors.length > 0) {
            const doc = doctors.find(d => d.id == doctorId);
            if (doc) {
                setSelectedDoctor(doc);
            }
        } else if (!doctorId) {
            setSelectedDoctor(null);
        }
    }, [doctors, searchParams]);

    useEffect(() => {
        if (selectedDoctor && scheduleDays.length > 0) {
            fetchDoctorTimetable(selectedDoctor.id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDoctor, scheduleDays]);

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
        }
    };

    const fetchScheduleDays = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(
                `${API_BASE_URL}/schedule-doctors/show-days`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (res.ok) {
                const data = await res.json();
                setScheduleDays(data);
            }
            // eslint-disable-next-line no-unused-vars
        } catch (err) {
            toast.error("Failed to load schedule days");
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

    const fetchDoctorTimetable = async (doctorId) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(
                `${API_BASE_URL}/schedule-doctors/show-doctor-timetable/${doctorId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    const rows = data.map(item => {
                        const dIndex = scheduleDays.findIndex(d => d.id === item.doctor_day_ID);
                        return {
                            id: item.id,
                            dayIndex: dIndex !== -1 ? dIndex : -1,
                            from: item.doctor_from_time ? item.doctor_from_time.toString().substring(0, 5) : "09:00",
                            to: item.doctor_to_time ? item.doctor_to_time.toString().substring(0, 5) : "17:00",
                            duration: item.doc_slot_dur ? String(item.doc_slot_dur) : "30",
                            isScheduled: true
                        };
                    });
                    const validRows = rows.filter(r => r.dayIndex !== -1);
                    setScheduleRows(validRows.length > 0 ? validRows : [{ dayIndex: -1, from: "09:00", to: "17:00", duration: "30", isScheduled: false }]);
                } else {
                    setScheduleRows([{ dayIndex: -1, from: "09:00", to: "17:00", duration: "30", isScheduled: false }]);
                }
            }
        } catch (err) {
            console.error("Failed to fetch timetable", err);
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

    const handleAddRow = () => {
        if (scheduleRows.length >= 6) {
            toast.info("Maximum schedule days reached.");
            return;
        }

        const usedDayIndices = new Set(scheduleRows.map(row => row.dayIndex).filter(index => index !== -1));
        let nextDayIndex = -1;

        if (scheduleDays.length > 0) {
            for (let i = 0; i < scheduleDays.length; i++) {
                if (!usedDayIndices.has(i)) {
                    nextDayIndex = i;
                    break;
                }
            }
        }

        setScheduleRows(prev => {
            return [...prev, { dayIndex: nextDayIndex, from: "09:00", to: "17:00", duration: "30", isScheduled: false }];
        });
    };

    const handleUpdateRow = (index, field, value) => {
        const updated = [...scheduleRows];
        updated[index] = { ...updated[index], [field]: value };
        setScheduleRows(updated);
    };

    const handleScheduleClick = async (rowIndex) => {
        const row = scheduleRows[rowIndex];
        if (row.dayIndex === -1) {
            toast.error("Please select a day first");
            return;
        }

        const dayObj = scheduleDays[row.dayIndex];
        const payload = {
            docID: selectedDoctor.id,
            dayID: dayObj.id,
            from_time: row.from,
            to_time: row.to,
            slot_duration: row.duration
        };

        try {
            const token = localStorage.getItem("token");
            let url = `${API_BASE_URL}/schedule-doctors/save-doctor-timetable`;
            if (row.id) {
                url = `${API_BASE_URL}/schedule-doctors/edit-doctor-timetable/${row.id}`;
            }

            const res = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const savedData = await res.json();
                toast.success("Schedule saved successfully!");

                // This is the key change: we modify the state in one go.
                setScheduleRows(prevRows => {
                    // 1. Mark the current row as scheduled.
                    const updatedRows = prevRows.map((r, i) => {
                        if (i === rowIndex) {
                            return {
                                ...r,
                                id: savedData.timetable?.id || savedData.id || r.id,
                                isScheduled: true
                            };
                        }
                        return r;
                    });

                    // 2. If it was a NEW schedule (not an edit) and we have space, add a new row.
                    if (!row.id && updatedRows.length < 6) {
                        const usedDayIndices = new Set(updatedRows.map(r => r.dayIndex).filter(index => index !== -1));
                        let nextDayIndex = -1;

                        if (scheduleDays.length > 0) {
                            for (let i = 0; i < scheduleDays.length; i++) {
                                if (!usedDayIndices.has(i)) {
                                    nextDayIndex = i;
                                    break;
                                }
                            }
                        }

                        // Only add a new row if there's an available day.
                        if (nextDayIndex !== -1) {
                            updatedRows.push({ dayIndex: nextDayIndex, from: "09:00", to: "17:00", duration: "30", isScheduled: false });
                        }
                    }

                    return updatedRows;
                });

            } else {
                toast.error("Failed to save schedule");
            }
            // eslint-disable-next-line no-unused-vars
        } catch (err) {
            toast.error("Error saving schedule");
        }
    };

    const handleEditClick = (rowIndex) => {
        const updated = [...scheduleRows];
        updated[rowIndex].isScheduled = false;
        setScheduleRows(updated);
        toast.info("You can now edit the schedule for this day.");
    };

    const getSpecialityName = (doc) => {
        if (doc.specialization) return doc.specialization;
        if (doc.spec_ID) {
            const spec = specialities.find(s => s.id === doc.spec_ID);
            return spec ? spec.speciality : "Specialist";
        }
        return "Specialist";
    };

    const scheduledDayIndices = scheduleRows
        .filter(r => r.isScheduled && r.dayIndex !== -1)
        .map(r => r.dayIndex);

    return (
        <div className="schedule-container">
            <h2>
                <Icon icon="mdi:calendar-clock" /> Doctor Schedule
            </h2>

            {!selectedDoctor ? (
                <>
                    <div className="search-bar">
                        <Icon icon="mdi:magnify" />
                        <input
                            placeholder="Search Doctor"
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                    </div>

                    <div className="doctors-grid">
                        {filteredDoctors.map(doc => (
                            <div
                                key={doc.user_Id}
                                className="doctor-card"
                                onClick={() => setSearchParams({ doctorId: doc.id })}
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
                                setScheduleRows([{ dayIndex: -1, from: "09:00", to: "17:00", duration: "30", isScheduled: false }]);
                            }}
                        >
                            <Icon icon="mdi:arrow-left" /> Back
                        </button>
                    </div>

                    <div className="selected-doctor-info" style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px', borderLeft: '4px solid #667eea' }}>
                        <h3 style={{ margin: 0, color: '#2d3748' }}>{selectedDoctor.user_name}</h3>
                        <p style={{ margin: '5px 0 0', color: '#718096' }}>{getSpecialityName(selectedDoctor)}</p>
                    </div>


                    {[...scheduleRows]
                        .map((row, index) => ({ ...row, originalIndex: index }))
                        .sort((a, b) => {
                            if (a.isScheduled !== b.isScheduled) {
                                return b.isScheduled - a.isScheduled;
                            }
                            return a.dayIndex - b.dayIndex;
                        })
                        .map((row, index, array) => (
                            <div key={row.originalIndex} className="schedule-row-group">
                                <div className="schedule-controls">
                                    <div className="control-group">
                                        <label>Select Day</label>
                                        <select
                                            value={row.dayIndex}
                                            disabled={row.isScheduled}
                                            onChange={(e) => handleUpdateRow(row.originalIndex, 'dayIndex', parseInt(e.target.value, 10))}
                                        >
                                            <option value={-1}>Select Day</option>
                                            {scheduleDays.map((d, i) => {
                                                if (scheduledDayIndices.includes(i) && row.dayIndex !== i) return null;
                                                return (
                                                    <option key={d.id} value={i}>
                                                        {d.day}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>

                                    <div className="control-group">
                                        <label>From</label>
                                        <input
                                            type="time"
                                            disabled={row.isScheduled}
                                            value={row.from}
                                            onChange={(e) => handleUpdateRow(row.originalIndex, 'from', e.target.value)}
                                        />
                                    </div>

                                    <div className="control-group">
                                        <label>To</label>
                                        <input
                                            type="time"
                                            disabled={row.isScheduled}
                                            value={row.to}
                                            onChange={(e) => handleUpdateRow(row.originalIndex, 'to', e.target.value)}
                                        />
                                    </div>

                                    <div className="control-group">
                                        <label>Duration</label>
                                        <select
                                            value={row.duration}
                                            disabled={row.isScheduled}
                                            onChange={(e) => handleUpdateRow(row.originalIndex, 'duration', e.target.value)}
                                        >
                                            <option value="15">15 Mins</option>
                                            <option value="30">30 Mins</option>
                                            <option value="45">45 Mins</option>
                                            <option value="60">1 Hour</option>
                                        </select>
                                    </div>

                                    <div className="control-group buttons-row">
                                        {!row.isScheduled ? (
                                            <button className="schedule-btn" onClick={() => handleScheduleClick(row.originalIndex)}>Schedule</button>
                                        ) : (
                                            <button className="edit-btn" onClick={() => handleEditClick(row.originalIndex)}>Edit</button>
                                        )}
                                        {index === array.length - 1 && (
                                            <button
                                                className="add-row-btn"
                                                onClick={handleAddRow}
                                                disabled={scheduleRows.length >= 6}
                                            >
                                                <Icon icon="mdi:plus" /> Add Row
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    }
                </>
            )}
        </div>
    );
}
