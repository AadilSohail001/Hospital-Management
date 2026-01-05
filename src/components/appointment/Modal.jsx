import { Icon } from "@iconify/react";
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
    handlePatientChange,
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

                        {/* Patient */}
                        <div className="form-group">
                            <label><Icon icon="mdi:account" /> Select Patient</label>
                            <select value={selectedPatient} onChange={handlePatientChange} required>
                                <option value="">-- Select Patient --</option>
                                {patients.map(patient => (
                                    <option key={patient.id} value={patient.id}>
                                        {patient.name} ({patient.contact})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Doctor */}
                        <div className="form-group">
                            <label><Icon icon="mdi:doctor" /> Select Doctor</label>
                            <select
                                value={selectedDoctor}
                                onChange={(e) => setSelectedDoctor(e.target.value)}
                                required
                            >
                                <option value="">-- Select Doctor --</option>
                                {doctors.map(doctor => (
                                    <option key={doctor.id} value={doctor.id}>
                                        {doctor.name} ({doctor.specialization})
                                    </option>
                                ))}
                            </select>
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
