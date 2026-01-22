import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";
import "../styles/Schedule.css";

const API_BASE_URL = "http://localhost:8080/hospital";

export default function Schedule() {
    const [doctors, setDoctors] = useState([]);
    const [filteredDoctors, setFilteredDoctors] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDoctor, setSelectedDoctor] = useState(() => {
        const saved = localStorage.getItem("selectedScheduleDoctor");
        return saved ? JSON.parse(saved) : null;
    });

    const [scheduleDays, setScheduleDays] = useState([]);
    const [scheduleRows, setScheduleRows] = useState(() => {
        const saved = localStorage.getItem("scheduleRows");
        return saved ? JSON.parse(saved) : [{
            dayIndex: -1,
            from: "09:00",
            to: "17:00",
            duration: "30",
            isScheduled: false
        }];
    });

    useEffect(() => {

        // eslint-disable-next-line react-hooks/immutability
        fetchDoctors();
        // eslint-disable-next-line react-hooks/immutability
        fetchScheduleDays();
    }, []);

    useEffect(() => {
        if (selectedDoctor) {
            localStorage.setItem(
                "selectedScheduleDoctor",
                JSON.stringify(selectedDoctor)
            );
        } else {
            localStorage.removeItem("selectedScheduleDoctor");
        }
    }, [selectedDoctor]);

    useEffect(() => {
        localStorage.setItem("scheduleRows", JSON.stringify(scheduleRows));
    }, [scheduleRows]);

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
        if (scheduleRows.length >= 6) return;
        setScheduleRows(prev => {
            const lastRow = prev[prev.length - 1];
            let nextDayIndex = lastRow.dayIndex + 1;
            if (nextDayIndex >= scheduleDays.length) nextDayIndex = 0;

            return [...prev, { dayIndex: nextDayIndex, from: "09:00", to: "17:00", duration: "30", isScheduled: false }];
        });
    };

    const handleUpdateRow = (index, field, value) => {
        const updated = [...scheduleRows];
        updated[index] = { ...updated[index], [field]: value };
        setScheduleRows(updated);
    };

    const handleScheduleClick = (rowIndex) => {
        const updated = [...scheduleRows];
        updated[rowIndex].isScheduled = true;
        setScheduleRows(updated);
        toast.success("Day scheduled successfully!");
    };

    const handleEditClick = (rowIndex) => {
        const updated = [...scheduleRows];
        updated[rowIndex].isScheduled = false;
        setScheduleRows(updated);
        toast.info("You can now edit the schedule for this day.");
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
                                onClick={() => setSelectedDoctor(doc)}
                            >
                                <Icon icon="mdi:doctor" />
                                <h3>{doc.user_name}</h3>
                                <p>{doc.specialization || "Specialist"}</p>
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
                                setSelectedDoctor(null);
                                setScheduleRows([{ dayIndex: -1, from: "09:00", to: "17:00", duration: "30", isScheduled: false }]);
                            }}
                        >
                            <Icon icon="mdi:arrow-left" /> Back
                        </button>
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
                                                disabled={scheduleRows.length >= 7}
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
