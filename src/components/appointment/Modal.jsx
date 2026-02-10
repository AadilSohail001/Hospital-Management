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
    patients = [], // Ensure default array
    doctors = [],  // Ensure default array
    selectedPatient,
    selectedDoctor,
    selectedDate,
    selectedTime,
    contact,
    availableSlots = [],
    setSelectedPatient,
    setSelectedDoctor,
    setSelectedDate,
    setSelectedTime,
    setContact,
    isContactAutoFilled,
    onRescheduleClick
}) {
    const isEditMode = editIndex !== null;



    if (!showModal) return null;

    // FIXED: Better patient options with null checks
    const patientOptions = Array.isArray(patients) ? patients.map(p => {
        if (!p) return null;
        const patientId = p.id || p.patient_id || "";
        const patientName = p.patient_name || p.name || "Unknown Patient";
        const patientContact = p.contact || "No contact";

        return {
            value: patientId.toString(),
            label: `ID: ${patientId} - ${patientName} (${patientContact})`
        };
    }).filter(Boolean) : [];

    // FIXED: Better doctor options with null checks
    const doctorOptions = Array.isArray(doctors) ? doctors.map(d => {
        if (!d) return null;
        const doctorId = d.id || d.user_Id || d.doctor_id || "";
        const doctorName = d.user_name || d.name || "Unknown Doctor";
        const specialization = d.specialization || d.speciality || d.spec_name || "General";

        return {
            value: doctorId.toString(),
            label: `ID: ${doctorId} - ${doctorName} (${specialization})`
        };
    }).filter(Boolean) : [];


    const handlePatientSelectChange = (selectedOption) => {

        if (selectedOption) {
            setSelectedPatient(selectedOption.value);
            // Find patient and set contact
            const patient = patients.find(p => {
                const pId = p.id || p.patient_id;
                return pId && pId.toString() === selectedOption.value.toString();
            });

            if (patient) {
                setContact(patient.contact || "");

            }
        } else {
            setSelectedPatient("");
            setContact("");
        }
    };

    // FIXED: Better slot normalization
    const normalizeSlots = (slots) => {
        if (!slots) return [];

        // If it's already an array of strings
        if (Array.isArray(slots)) {
            return slots.filter(slot => {
                if (typeof slot === 'string') return slot.trim().length > 0;
                if (slot && typeof slot === 'object') {
                    // Handle object slots
                    if (slot.value) return String(slot.value).trim();
                    if (slot.label) return String(slot.label).trim();
                    if (slot.slot) return String(slot.slot).trim();
                    if (slot.formattedSlot) return String(slot.formattedSlot).trim();
                }
                return false;
            }).map(slot => {
                if (typeof slot === 'string') return slot.trim();
                if (slot.value) return String(slot.value).trim();
                if (slot.label) return String(slot.label).trim();
                if (slot.slot) return String(slot.slot).trim();
                if (slot.formattedSlot) return String(slot.formattedSlot).trim();
                return String(slot).trim();
            });
        }

        return [];
    };

    const normalizedSlots = normalizeSlots(availableSlots);


    const timeOptions = normalizedSlots.map(slot => ({
        value: slot,
        label: slot
    }));

    // Preserve booked slot in edit mode
    if (isEditMode && selectedTime && !timeOptions.some(o => o.value === selectedTime)) {
        const displayTime = selectedTime.length >= 5 ? selectedTime.substring(0, 5) : selectedTime;
        timeOptions.unshift({
            value: selectedTime,
            label: `${displayTime} (Currently Booked)`
        });
    }

    const hasSlots = normalizedSlots.length > 0;
    const needsDoctorAndDate = !selectedDoctor || !selectedDate;

    const slotMessage = needsDoctorAndDate
        ? "Select doctor and date first"
        : !hasSlots
            ? "No available slots for this date"
            : "Select time slot";

    // Find current patient for display
    const currentPatient = patients.find(p => {
        const pId = p.id || p.patient_id;
        return pId && pId.toString() === selectedPatient.toString();
    });

    // eslint-disable-next-line no-unused-vars
    const currentDoctor = doctors.find(d => {
        const dId = d.id || d.user_Id || d.doctor_id;
        return dId && dId.toString() === selectedDoctor.toString();
    });

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
                                value={patientOptions.find(opt => opt.value.toString() === selectedPatient?.toString()) || null}
                                onChange={handlePatientSelectChange}
                                placeholder="Search by ID..."
                                isClearable
                                isSearchable
                                classNamePrefix="react-select"
                                styles={{ menu: p => ({ ...p, zIndex: 9999 }) }}
                                noOptionsMessage={() => patientOptions.length === 0 ? "No patients found" : "Type to search..."}
                            />

                        </div>

                        {/* Patient Name */}
                        <div className="form-group">
                            <label><Icon icon="mdi:account" /> Patient Name</label>
                            <input
                                type="text"
                                value={currentPatient?.patient_name || currentPatient?.name || ""}
                                readOnly
                                placeholder="Select patient first"
                                className="readonly-input"
                            />
                        </div>

                        {/* Doctor */}
                        <div className="form-group">
                            <label><Icon icon="mdi:doctor" /> Select Doctor</label>
                            <Select
                                options={doctorOptions}
                                value={doctorOptions.find(opt => opt.value.toString() === selectedDoctor?.toString()) || null}
                                onChange={(option) => {
                                    setSelectedDoctor(option ? option.value : "");
                                }}
                                placeholder="Select Doctor..."
                                isClearable
                                isSearchable
                                isDisabled={isEditMode}
                                classNamePrefix="react-select"
                                styles={{ menu: p => ({ ...p, zIndex: 9999 }) }}
                                noOptionsMessage={() => doctorOptions.length === 0 ? "No doctors found" : "Type to search..."}
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
                                    readOnly={isContactAutoFilled}
                                    className={isContactAutoFilled ? "auto-filled" : ""}
                                    placeholder="Auto-filled when patient selected"
                                />
                            </div>
                        </div>

                        {/* Date */}
                        <div className="form-group">
                            <label><Icon icon="mdi:calendar" /> Select Date</label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => {
                                    setSelectedDate(e.target.value);
                                }}
                                disabled={isEditMode}
                                min={new Date().toISOString().split("T")[0]}
                                required
                                className="date-input"
                            />
                        </div>

                        {/* Time */}
                        <div className="form-group">
                            <label><Icon icon="mdi:clock" /> Select Time</label>
                            <Select
                                options={timeOptions}
                                value={timeOptions.find(opt => opt.value === selectedTime) || null}
                                onChange={(option) => {
                                    setSelectedTime(option ? option.value : "");
                                }}
                                placeholder={slotMessage}
                                isDisabled={!selectedDoctor || !selectedDate}
                                isClearable
                                classNamePrefix="react-select"
                                noOptionsMessage={() => slotMessage}
                                styles={{ menu: p => ({ ...p, zIndex: 9999 }) }}
                            />
                            {selectedDoctor && selectedDate && normalizedSlots.length === 0 && (
                                <small className="text-warning">No available time slots for this doctor on the selected date</small>
                            )}
                        </div>
                    </div>

                    <div className="modal-actions">
                        <MyButton
                            title={isEditMode ? "Update Appointment" : "Save Appointment"}
                            type="submit"
                            icon={<Icon icon="mdi:calendar-check" />}
                            disabled={!selectedPatient || !selectedDoctor || !selectedDate || !selectedTime}
                            className="save-btn"
                        />

                        {isEditMode && (
                            <button
                                type="button"
                                className="reschedule-btn"
                                onClick={onRescheduleClick}
                            >
                                <Icon icon="mdi:calendar-clock" /> Reschedule
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