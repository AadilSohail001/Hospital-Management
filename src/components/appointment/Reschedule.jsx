import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";
import "./Reschedule.css";

const API_BASE_URL = "http://localhost:8080/hospital";

export default function Reschedule({
    show,
    onClick,
    appointmentIndex,
    appointments,
    onSuccess
}) {
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [doctorId, setDoctorId] = useState("");
    const [appointmentDetails, setAppointmentDetails] = useState(null);


    useEffect(() => {
        if (show && appointmentIndex !== null) {
            const appt = appointments[appointmentIndex];
            if (appt) {
                setDate(appt.date);
                setTime(appt.time);
                setDoctorId(appt.doctorId?.toString() || "");
                setAppointmentDetails(appt);
                setAvailableSlots([]);
            }
        }
    }, [show, appointmentIndex, appointments]);

    // Fetch available slots when date or doctor changes
    useEffect(() => {
        if (show && date && doctorId) {
            fetchAvailableSlots();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [date, doctorId, show]);

    const fetchAvailableSlots = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}/appointments/create-appointment`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    doc_id: parseInt(doctorId, 10),
                    doc_apt_date: date,
                }),
            });

            if (!response.ok) {
                setAvailableSlots([]);
                return;
            }

            const raw = await response.json();
            console.debug("reschedule create-appointment raw response:", raw);

            // Handle different response shapes
            let slots = [];
            if (Array.isArray(raw)) slots = raw;
            else if (Array.isArray(raw.data)) slots = raw.data;
            else if (Array.isArray(raw.slots)) slots = raw.slots;
            else if (Array.isArray(raw.available_slots)) slots = raw.available_slots;

            // Normalize times to 'HH:MM' (remove seconds) and dedupe/sort
            const normalized = slots
                .map(s => String(s || "").trim())
                .filter(s => s.length > 0)
                .map(s => {
                    const parts = s.split(":");
                    if (parts.length >= 2) {
                        const hh = parts[0].padStart(2, "0");
                        const mm = parts[1].padStart(2, "0");
                        return `${hh}:${mm}`;
                    }
                    return s;
                });

            // Deduplicate then sort by numeric minutes since midnight
            const unique = Array.from(new Set(normalized)).sort((a, b) => {
                const [ah, am] = a.split(":").map(Number);
                const [bh, bm] = b.split(":").map(Number);
                return (ah * 60 + am) - (bh * 60 + bm);
            });
            console.debug("reschedule normalized available slots:", unique);
            setAvailableSlots(unique);
        } catch (error) {
            console.error("Failed to fetch available slots:", error);
            setAvailableSlots([]);
        }
    };

    if (!show) return null;

    const handleReschedule = async (e) => {
        e.preventDefault();

        if (!date || !time) {
            toast.error("Please select both date and time");
            return;
        }

        try {
            setIsLoading(true);

            const appt = appointments[appointmentIndex];
            if (!appt || !appt.id || !appt.patientId || !appt.doctorId) {
                toast.error("Invalid appointment data");
                return;
            }

            const token = localStorage.getItem("token");
            if (!token) {
                toast.error("Please log in again");
                return;
            }

            // Format time to HH:MM:SS for backend (appointment creation expects this format)
            const timeParts = time.split(":");
            const formattedTime = `${timeParts[0]}:${timeParts[1]}:00`;

            // Step 1: Create new appointment with the rescheduled date and time
            const createResponse = await fetch(`${API_BASE_URL}/appointments/save-appointment`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    patient_id: appt.patientId,
                    doc_id: appt.doctorId,
                    doc_apt_date: date,
                    apt_time: formattedTime,
                    apt_status: "Pending", // New appointment starts as Pending
                }),
            });

            const createResult = await createResponse.json().catch(() => ({}));

            if (!createResponse.ok) {
                throw new Error(createResult.message || createResult.error || "Failed to create rescheduled appointment");
            }

            // Step 2: Delete the old appointment (pending only)
            const deleteResponse = await fetch(`${API_BASE_URL}/appointments/delete-pending-appointment`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    apt_Id: appt.id,
                }),
            });

            const deleteResult = await deleteResponse.json().catch(() => ({}));

            if (!deleteResponse.ok) {
                console.warn("Old appointment deletion warning:", deleteResult.message || deleteResult.error);
                // Don't throw error here - new appointment was created successfully
            }

            toast.success("Appointment rescheduled successfully! Old appointment removed.");

            // Call onSuccess callback to refresh appointments in parent
            if (onSuccess) {
                await onSuccess();
            }

            onClick(); // Close modal
        } catch (error) {
            toast.error(error.message || "Error rescheduling appointment");
        } finally {
            setIsLoading(false);
        }
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
                    {appointmentDetails && (
                        <div className="reschedule-info">
                            <p><strong>Patient:</strong> {appointmentDetails.patientName}</p>
                            <p><strong>Doctor:</strong> {appointmentDetails.doctorName}</p>
                            <p><strong>Current Date:</strong> {appointmentDetails.date}</p>
                            <p><strong>Current Time:</strong> {appointmentDetails.time}</p>
                        </div>
                    )}

                    <div className="reschedule-group">
                        <label>
                            <Icon icon="mdi:calendar" /> Select New Date
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                            required
                        />
                    </div>

                    {availableSlots.length > 0 && (
                        <div className="reschedule-group">
                            <label>
                                <Icon icon="mdi:clock-outline" /> Select New Time Slot
                            </label>
                            <select
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                required
                            >
                                <option value="">-- Select Time --</option>
                                {availableSlots.map((slot) => (
                                    <option key={slot} value={slot}>
                                        {slot}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {!availableSlots.length && date && (
                        <div className="reschedule-group">
                            <p className="no-slots-message">
                                <Icon icon="mdi:alert-circle" /> No available slots for this date
                            </p>
                        </div>
                    )}

                    <div className="reschedule-actions">
                        <button
                            type="submit"
                            className="reschedule-save-btn"
                            disabled={isLoading || !time || !availableSlots.includes(time)}
                        >
                            <Icon icon="mdi:check-circle" />
                            {isLoading ? "Rescheduling..." : "Confirm Reschedule"}
                        </button>

                        <button
                            type="button"
                            className="reschedule-cancel-btn"
                            onClick={onClick}
                            disabled={isLoading}
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
