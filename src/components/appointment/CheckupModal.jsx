import React, { useState } from "react";
import './CheckupModal.css';
// import Appointment from "../../pages/Appointment";

export default function CheckupModal({
    show,
    onClose,
    appointment,
    onSubmit
}) {
    // Define initialFormState FIRST
    const initialFormState = {
        complaint: "",
        allergy: "",
        history: "",

        // Physical Examination
        consciousness: "",
        bloodPressure: "",
        pulse: "",
        respiration: "",
        temperature: "",
        oxygenSaturation: "",
        oxygenSource: "room air",
        otherExamination: "",

        // Investigations
        investigations: "",

        // Diagnosis
        diagnosis: "",

        // Treatment
        treatment: "",

        // Recommendation
        recommendation: "",

        // Travel Recommendation
        fitToFly: false,
        seatType: "ordinary",
        travelEscort: "unescorted",
        needsRepatriation: false,
        medicallyNecessary: false
    };

    const [form, setForm] = useState(initialFormState);

    if (!show || !appointment) return null;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm({
            ...form,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleTextareaChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(form);
        setForm(initialFormState);
    };

    const handleCancel = () => {
        setForm(initialFormState);
        onClose();
    };

    return (
        <div className="checkup-overlay">
            <div className="checkup-box">
                <div className="hospital-header">
                    <h2>Shifa International Hospital</h2>
                    <h4>PATIENT STICKERS</h4>
                    <h3>ASSESSMENT REPORT</h3>
                </div>

                <form onSubmit={handleSubmit} className="checkup-form detailed-form">
                    {/* Patient Complaint / Medical History */}
                    <div className="form-section">
                        <label className="section-label">Patient Complaint / Medical History</label>
                        <textarea
                            name="complaint"
                            value={form.complaint}
                            onChange={handleTextareaChange}
                            placeholder="Enter patient complaint and medical history..."
                            rows="3"
                            required
                        />
                    </div>

                    {/* Allergy */}
                    <div className="form-section">
                        <label className="section-label">Allergy :</label>
                        <textarea
                            name="allergy"
                            value={form.allergy}
                            onChange={handleTextareaChange}
                            placeholder="List any allergies..."
                            rows="2"
                        />
                    </div>

                    {/* Past Medical History */}
                    <div className="form-section">
                        <label className="section-label">Past Medical History</label>
                        <textarea
                            name="history"
                            value={form.history}
                            onChange={handleTextareaChange}
                            placeholder="Enter past medical history..."
                            rows="3"
                        />
                    </div>

                    {/* Physical Examination Table */}
                    <div className="form-section">
                        <label className="section-label">Physical Examination</label>
                        <div className="examination-grid">
                            <div className="exam-field">
                                <label>Level of Consciousness :</label>
                                <input
                                    type="text"
                                    name="consciousness"
                                    value={form.consciousness}
                                    onChange={handleChange}
                                    placeholder="e.g., Alert, GCS 15/15"
                                />
                            </div>

                            <div className="exam-row">
                                <div className="exam-field">
                                    <label>Blood Pressure :</label>
                                    <input
                                        type="text"
                                        name="bloodPressure"
                                        value={form.bloodPressure}
                                        onChange={handleChange}
                                        placeholder="e.g., 120/80"
                                    />
                                    <span className="unit">mmHg</span>
                                </div>

                                <div className="exam-field">
                                    <label>Pulse :</label>
                                    <input
                                        type="text"
                                        name="pulse"
                                        value={form.pulse}
                                        onChange={handleChange}
                                        placeholder="e.g., 72"
                                    />
                                    <span className="unit">x/min</span>
                                </div>
                            </div>

                            <div className="exam-row">
                                <div className="exam-field">
                                    <label>Respiration rate :</label>
                                    <input
                                        type="text"
                                        name="respiration"
                                        value={form.respiration}
                                        onChange={handleChange}
                                        placeholder="e.g., 16"
                                    />
                                    <span className="unit">x/min</span>
                                </div>

                                <div className="exam-field">
                                    <label>Temperature :</label>
                                    <input
                                        type="text"
                                        name="temperature"
                                        value={form.temperature}
                                        onChange={handleChange}
                                        placeholder="e.g., 36.5"
                                    />
                                    <span className="unit">°C</span>
                                </div>
                            </div>

                            <div className="exam-row">
                                <div className="exam-field">
                                    <label>O₂ Saturation :</label>
                                    <input
                                        type="text"
                                        name="oxygenSaturation"
                                        value={form.oxygenSaturation}
                                        onChange={handleChange}
                                        placeholder="e.g., 98"
                                        style={{ width: '60px' }}
                                    />
                                    <span className="unit">% on</span>
                                    <select
                                        name="oxygenSource"
                                        value={form.oxygenSource}
                                        onChange={handleChange}
                                        style={{ marginLeft: '5px' }}
                                    >
                                        <option value="room air">room air</option>
                                        <option value="O2 therapy">O2 therapy</option>
                                        <option value="ventilator">ventilator</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Other Examination Findings */}
                        <div className="exam-field" style={{ marginTop: '10px' }}>
                            <label>Other Examination Findings :</label>
                            <textarea
                                name="otherExamination"
                                value={form.otherExamination}
                                onChange={handleTextareaChange}
                                placeholder="Enter other examination findings..."
                                rows="2"
                            />
                        </div>
                    </div>

                    {/* Investigations */}
                    <div className="form-section">
                        <label className="section-label">Investigations</label>
                        <textarea
                            name="investigations"
                            value={form.investigations}
                            onChange={handleTextareaChange}
                            placeholder="Enter investigation results (lab tests, imaging, etc.)..."
                            rows="3"
                        />
                    </div>

                    {/* Assessment / Diagnosis */}
                    <div className="form-section">
                        <label className="section-label">Assessment / Diagnosis</label>
                        <textarea
                            name="diagnosis"
                            value={form.diagnosis}
                            onChange={handleTextareaChange}
                            placeholder="Enter assessment and diagnosis..."
                            rows="3"
                            required
                        />
                    </div>

                    {/* Treatment / Management */}
                    <div className="form-section">
                        <label className="section-label">Treatment / Management</label>
                        <textarea
                            name="treatment"
                            value={form.treatment}
                            onChange={handleTextareaChange}
                            placeholder="Enter treatment plan and management..."
                            rows="3"
                            required
                        />
                    </div>

                    {/* Recommendation / Doctor's Note */}
                    <div className="form-section">
                        <label className="section-label">Recommendation / Doctor's Note</label>
                        <textarea
                            name="recommendation"
                            value={form.recommendation}
                            onChange={handleTextareaChange}
                            placeholder="Enter recommendations and notes..."
                            rows="3"
                        />
                    </div>

                    {/* Travel Recommendation Section */}
                    <div className="form-section travel-section">
                        <label className="section-label">Travel Recommendation (if applicable)</label>

                        <div className="travel-options">
                            <div className="travel-question">
                                <label>Patient is fit to fly?</label>
                                <div className="checkbox-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="fitToFly"
                                            checked={form.fitToFly}
                                            onChange={handleChange}
                                        />
                                        Yes
                                    </label>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            disabled
                                            checked={!form.fitToFly}
                                            onChange={() => { }}
                                        />
                                        No
                                    </label>
                                </div>
                            </div>

                            <div className="travel-question">
                                <label>Patient needs:</label>
                                <div className="radio-group">
                                    <label className="radio-label">
                                        <input
                                            type="radio"
                                            name="seatType"
                                            value="ordinary"
                                            checked={form.seatType === "ordinary"}
                                            onChange={handleChange}
                                        />
                                        Ordinary seat
                                    </label>
                                    <label className="radio-label">
                                        <input
                                            type="radio"
                                            name="seatType"
                                            value="wheelchair"
                                            checked={form.seatType === "wheelchair"}
                                            onChange={handleChange}
                                        />
                                        Wheelchair assistance
                                    </label>
                                    <label className="radio-label">
                                        <input
                                            type="radio"
                                            name="seatType"
                                            value="stretcher"
                                            checked={form.seatType === "stretcher"}
                                            onChange={handleChange}
                                        />
                                        Stretcher case
                                    </label>
                                    <label className="radio-label">
                                        <input
                                            type="radio"
                                            name="seatType"
                                            value="business"
                                            checked={form.seatType === "business"}
                                            onChange={handleChange}
                                        />
                                        Business class / extra leg space
                                    </label>
                                </div>
                            </div>

                            <div className="travel-question">
                                <label>Patient can travel:</label>
                                <div className="radio-group">
                                    <label className="radio-label">
                                        <input
                                            type="radio"
                                            name="travelEscort"
                                            value="unescorted"
                                            checked={form.travelEscort === "unescorted"}
                                            onChange={handleChange}
                                        />
                                        Unescorted
                                    </label>
                                    <label className="radio-label">
                                        <input
                                            type="radio"
                                            name="travelEscort"
                                            value="nonMedical"
                                            checked={form.travelEscort === "nonMedical"}
                                            onChange={handleChange}
                                        />
                                        With non-medical escort
                                    </label>
                                    <label className="radio-label">
                                        <input
                                            type="radio"
                                            name="travelEscort"
                                            value="medical"
                                            checked={form.travelEscort === "medical"}
                                            onChange={handleChange}
                                        />
                                        With medical escort
                                    </label>
                                </div>
                            </div>

                            <div className="travel-question">
                                <label>Patient requests repatriation?</label>
                                <div className="checkbox-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="needsRepatriation"
                                            checked={form.needsRepatriation}
                                            onChange={handleChange}
                                        />
                                        Yes
                                    </label>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            disabled
                                            checked={form.needsRepatriation === false}
                                            onChange={() => { }}
                                        />
                                        No
                                    </label>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            disabled
                                            onChange={() => { }}
                                        />
                                        No choice
                                    </label>
                                </div>
                            </div>

                            <div className="travel-question">
                                <label>In Doctor's Opinion Is This Medically Necessary?</label>
                                <div className="checkbox-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="medicallyNecessary"
                                            checked={form.medicallyNecessary}
                                            onChange={handleChange}
                                        />
                                        Yes
                                    </label>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            disabled
                                            checked={!form.medicallyNecessary}
                                            onChange={() => { }}
                                        />
                                        No
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Doctor's Signature */}
                    <div className="form-section signature-section">
                        <div className="signature-row">
                            <div className="signature-field">
                                <label>Treating Doctor's Name :</label>
                                <input
                                    type="text"
                                    value={appointment.doctorName || ''}
                                    placeholder="Enter doctor's name"
                                    required
                                />
                            </div>
                            <div className="signature-field">
                                <label>Signature :</label>
                                <input
                                    type="text"
                                    placeholder="Signature"
                                    required
                                />
                            </div>
                        </div>

                        <div className="signature-row">
                            <div className="signature-field">
                                <label>Date :</label>
                                <input
                                    type="date"
                                    defaultValue={new Date().toISOString().split('T')[0]}
                                    required
                                />
                            </div>
                            <div className="signature-field">
                                <label>Time :</label>
                                <input
                                    type="time"
                                    defaultValue={new Date().toTimeString().slice(0, 5)}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="checkup-actions">
                        <button type="submit" className="submit-btn">Submit Checkup Report</button>
                        <button type="button" className="cancel-btn" onClick={handleCancel}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
}