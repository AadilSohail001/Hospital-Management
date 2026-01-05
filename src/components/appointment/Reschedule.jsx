import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";
import "./Reschedule.css";

export default function Reschedule({
    show,
    onClick,
    appointmentIndex,
    appointments,
    setAppointments
}) {
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");


    useEffect(() => {
        if (show && appointmentIndex !== null) {
            const appt = appointments[appointmentIndex];
            if (appt) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setDate(appt.date);
                setTime(appt.time);
            }
        }
    }, [show, appointmentIndex, appointments]);

    if (!show) return null;

    const handleReschedule = (e) => {
        e.preventDefault();

        if (!date || !time) {
            toast.error("Please select both date and time");
            return;
        }

        const updatedAppointments = [...appointments];
        // data = 1/12/2025
        // time = 4:14
        // const appointmentIndex = 1;
        // const updatedAppointments = [{id:1, name:'abc', }, {id:2, name:'def, date:'1/12/2025', time:'4:14'}]

        updatedAppointments[appointmentIndex] = {
            ...updatedAppointments[appointmentIndex],
            date,
            time
        };
        // 
        setAppointments(updatedAppointments);
        localStorage.setItem(
            "appointments",
            JSON.stringify(updatedAppointments)
        );

        toast.success("Appointment rescheduled successfully");
        onClick();
    };

    return (
        <div className="reschedule-overlay" onClick={onClick}>
            <div
                className="reschedule-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="reschedule-header">
                    <h2 className="reschedule-title">
                        <Icon icon="mdi:calendar-clock" /> Reschedule Appointment
                    </h2>
                    <button
                        className="reschedule-close-btn"
                        onClick={onClick}
                    >
                        <Icon icon="mdi:close" />
                    </button>
                </div>

                <form onSubmit={handleReschedule} className="reschedule-form">
                    <div className="reschedule-group">
                        <label>
                            <Icon icon="mdi:calendar" /> Select New Date
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </div>

                    <div className="reschedule-group">
                        <label>
                            <Icon icon="mdi:clock-outline" /> Select New Time
                        </label>
                        <input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            required
                        />
                    </div>

                    <div className="reschedule-actions">
                        <button
                            type="submit"
                            className="reschedule-save-btn"
                        >
                            <Icon icon="mdi:check-circle" />
                            Confirm Reschedule
                        </button>

                        <button
                            type="button"
                            className="reschedule-cancel-btn"
                            onClick={onClick}
                        >
                            <Icon icon="mdi:close" />
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
