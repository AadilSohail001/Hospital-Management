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

    // Add useEffect to log slot updates
    React.useEffect(() => {
        console.log("🔄 Modal availableSlots updated:", availableSlots);
        if (availableSlots.length > 0) {
            console.log("✓ Slots available for display:", availableSlots.slice(0, 5), "...");
        }
    }, [availableSlots]);

    if (!showModal) return null;

    const patientOptions = patients.map(p => ({
        value: p.id,
        label: `ID: ${p.id} - ${p.patient_name || p.name} (${p.contact})`
    }));

    const doctorOptions = doctors.map(d => ({
        value: d.id || d.user_Id,
        label: `ID: ${d.id || d.user_Id} - ${d.user_name || d.name} (${d.specialization || d.speciality || "General"})`
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

    // Time slot options
    // Normalize different possible shapes of `availableSlots` coming from the backend
    const normalizeSlots = (slots) => {
        if (!slots) return [];
        // If API returned an object with formattedSlots
        if (!Array.isArray(slots) && typeof slots === 'object') {
            if (Array.isArray(slots.formattedSlots)) return slots.formattedSlots;
            // try other possible keys
            if (Array.isArray(slots.slots)) return slots.slots;
            return [];
        }

        // If it's an array
        if (Array.isArray(slots)) {
            // If array contains a single object that holds formattedSlots
            if (slots.length === 1 && typeof slots[0] === 'object' && Array.isArray(slots[0].formattedSlots)) {
                return slots[0].formattedSlots;
            }

            // Map elements to strings: support strings or objects with a common field
            return slots.map(s => {
                if (typeof s === 'string') return s;
                if (!s) return '';
                if (typeof s === 'object') {
                    if (typeof s.value === 'string') return s.value;
                    if (typeof s.slot === 'string') return s.slot;
                    if (Array.isArray(s.formattedSlots)) return s.formattedSlots.join(', ');
                    // fallback to JSON string (shouldn't happen in normal cases)
                    try { return JSON.stringify(s); }
                    // eslint-disable-next-line no-unused-vars
                    catch (e) { return String(s); }
                }
                return String(s);
            }).flat();
        }

        return [];
    };

    const normalizedSlots = normalizeSlots(availableSlots || []);

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

    const hasSlots = availableSlots.length > 0;
    const needsDoctorAndDate = !selectedDoctor || !selectedDate;

    const slotMessage = needsDoctorAndDate
        ? "Select doctor and date first"
        : !hasSlots
            ? "No available slots for this date"
            : "Select time slot";

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
                                isSearchable
                                classNamePrefix="react-select"
                                styles={{ menu: p => ({ ...p, zIndex: 9999 }) }}
                            />
                        </div>

                        {/* Patient Name */}
                        <div className="form-group">
                            <label><Icon icon="mdi:account" /> Patient Name</label>
                            <input
                                type="text"
                                value={
                                    patients.find(p => p.id == selectedPatient)?.patient_name ||
                                    patients.find(p => p.id == selectedPatient)?.name ||
                                    ""
                                }
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
                                value={doctorOptions.find(opt => opt.value == selectedDoctor) || null}
                                onChange={(option) => setSelectedDoctor(option ? option.value : "")}
                                placeholder="Select Doctor..."
                                isClearable
                                isSearchable
                                isDisabled={isEditMode}
                                classNamePrefix="react-select"
                                styles={{ menu: p => ({ ...p, zIndex: 9999 }) }}
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
                                {isContactAutoFilled && (
                                    <span className="auto-fill-badge">
                                        <Icon icon="mdi:check-circle" /> Auto-filled
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Date */}
                        <div className="form-group">
                            <label><Icon icon="mdi:calendar" /> Select Date</label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                disabled={isEditMode}
                                min={new Date().toISOString().split("T")[0]}
                                required
                                className="date-input"
                            />
                        </div>

                        {/* Time */}
                        <div className="form-group">
                            <label><Icon icon="mdi:clock" /> Select Time</label>
                            {/* {console.log("Rendering time select - timeOptions:", timeOptions)} */}
                            <Select
                                options={timeOptions}
                                value={timeOptions.find(opt => opt.value === selectedTime) || null}
                                onChange={(option) => setSelectedTime(option ? option.value : "")}
                                placeholder={slotMessage}
                                isDisabled={!selectedDoctor || !selectedDate}
                                isClearable
                                classNamePrefix="react-select"
                                noOptionsMessage={() => slotMessage}
                                styles={{ menu: p => ({ ...p, zIndex: 9999 }) }}
                                formatOptionLabel={(option) => {
                                    // console.log("Rendering option:", option);
                                    return option.label;
                                }}
                            />
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
