import React from "react";
import { Icon } from "@iconify/react";
import Select from "react-select";
import MyButton from "../MyButtons";

export default function Modal({
    showModal,
    closeModal,
    ModalLabel,
    editIndex,
    handleSubmit,
    patients,
    doctors,
    selectedPatient,
    selectedDoctor,
    selectedDate,
    selectedTime,
    contact,
    setSelectedPatient,
    setSelectedDoctor,
    setSelectedDate,
    setSelectedTime,
    setContact,
    isContactAutoFilled,
    selectedPatientPhone,
    onRescheduleClick
}) {
    if (!showModal) return null;

    // lock date/time if in edit mode
    const isEditMode = editIndex !== null;

    const patientOptions = patients.map(p => ({
        value: p.id,
        label: `ID: ${p.id} - ${p.patient_name || p.name} (${p.contact})`
    }));

    const doctorOptions = doctors.map(d => ({
        value: d.user_Id || d.id,
        label: `ID: ${d.user_Id || d.id} - ${d.user_name || d.name} (${d.specialization || d.speciality || "General"})`
    }));

    const handlePatientSelectChange = (selectedOption) => {
        if (selectedOption) {
            setSelectedPatient(selectedOption.value);
            const p = patients.find(pat => pat.id == selectedOption.value);
            if (p) {
                setContact(p.contact || "");
            }
        } else {
            setSelectedPatient("");
            setContact("");
        }
    };

    return (
        <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{isEditMode ? "Edit Appointment" : ModalLabel}</h2>
                    <button className="modal-close-btn" onClick={closeModal}>
                        <Icon icon="mdi:close" />
                    </button>
                </div>

                <form className="appointment-form" onSubmit={handleSubmit}>
                    <div className="form-grid">

                        {/* Patient Search */}
                        <div className="form-group">
                            <label><Icon icon="mdi:account-search" /> Search Patient (ID)</label>
                            <Select
                                options={patientOptions}
                                value={patientOptions.find(opt => opt.value == selectedPatient) || null}
                                onChange={handlePatientSelectChange}
                                placeholder="Search by ID..."
                                isClearable
                            />
                        </div>

                        {/* Patient */}
                        <div className="form-group">
                            <label><Icon icon="mdi:account" /> Patient Name</label>
                            <input
                                type="text"
                                value={patients.find(p => p.id == selectedPatient)?.patient_name || patients.find(p => p.id == selectedPatient)?.name || ""}
                                readOnly
                            />
                        </div>

                        {/* Doctor */}
                        <div className="form-group">
                            <label><Icon icon="mdi:doctor" /> Select Doctor</label>
                            <Select
                                options={doctorOptions}
                                value={doctorOptions.find(opt => opt.value == selectedDoctor) || null}
                                onChange={(option) => setSelectedDoctor(option ? option.value : "")}
                                placeholder="Select Doctor..."
                                isClearable
                            />
                        </div>

                        {/* Contact */}
                        <div className="form-group">
                            <label><Icon icon="mdi:phone" /> Patient Contact</label>
                            <div className="contact-input-wrapper">
                                <input
                                    type="text"
                                    value={contact}
                                    onChange={(e) => setContact(e.target.value)}
                                    className={isContactAutoFilled ? "auto-filled" : ""}
                                    readOnly
                                />
                                {isContactAutoFilled && (
                                    <span className="auto-fill-badge">
                                        <Icon icon="mdi:check-circle" /> Auto-filled
                                    </span>
                                )}
                            </div>

                            {selectedPatient && !isContactAutoFilled && contact && selectedPatientPhone && (
                                <div className="contact-warning">
                                    <Icon icon="mdi:alert-circle" />
                                    Differs from saved contact: {selectedPatientPhone}
                                </div>
                            )}
                        </div>

                        {/* Date */}
                        <div className="form-group">
                            <label><Icon icon="mdi:calendar" /> Select Date</label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                required
                                disabled={isEditMode} // locked in edit mode
                            />
                        </div>

                        {/* Time */}
                        <div className="form-group">
                            <label><Icon icon="mdi:clock" /> Select Time</label>
                            <input
                                type="time"
                                value={selectedTime}
                                onChange={(e) => setSelectedTime(e.target.value)}
                                required
                                disabled={isEditMode} // locked in edit mode
                            />
                        </div>
                    </div>

                    <div className="modal-actions">
                        <MyButton
                            title={isEditMode ? "Update Appointment" : "Save Appointment"}
                            type="submit"
                            icon={<Icon icon="mdi:calendar-check" />}
                        />

                        {/* Reschedule button visible only in edit mode */}
                        {isEditMode && (
                            <button
                                style={{ color: "white", borderRadius: "5px", border: "1px solid #5564d8", padding: "10px 15px", backgroundColor: "#6a77d6ff", cursor: "pointer", fontWeight: "500", display: "flex", alignItems: "center", gap: "5px" }}
                                type="button"
                                className="reschedule-btn"
                                onClick={onRescheduleClick}
                            >
                                Reschedule
                            </button>
                        )}

                        <button type="button" className="cancel-btn" onClick={closeModal}>
                            <Icon icon="mdi:close" /> Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
