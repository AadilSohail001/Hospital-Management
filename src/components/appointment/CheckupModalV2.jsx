import React, { useState, useEffect } from "react";
import Select from "react-select";
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { toast } from "react-toastify";
import './CheckupModal.css';

const API_BASE_URL = "http://localhost:8080/hospital";

export default function CheckupModalV2({
    show,
    onClose,
    appointment,
    onSubmit
}) {
    const [loading, setLoading] = useState(false);
    const [allergiesOptions, setAllergiesOptions] = useState([]);

    useEffect(() => {
        if (show) {
            const fetchAllergies = async () => {
                try {
                    const token = localStorage.getItem("token");
                    const response = await fetch(`${API_BASE_URL}/patients/show-allergies`, {
                        headers: {
                            "Authorization": `Bearer ${token}`
                        }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        const options = (Array.isArray(data) ? data : []).map(item => ({
                            value: item.id,
                            label: item.allergy_name
                        }));
                        setAllergiesOptions(options);
                    }
                } catch (error) {
                    console.error("Failed to fetch allergies", error);
                }
            };
            fetchAllergies();
        }
    }, [show]);

    if (!show || !appointment) return null;

    const initialValues = {
        // Patient Complaint / Medical History
        pt_complaint: "",
        past_md_history: "",

        // Allergies
        hasAllergies: "no",
        pt_allergies: [],

        // Vital Signs
        coscs: "Alert", // Consciousness level
        s_bp: "", // Systolic BP
        d_bp: "", // Diastolic BP
        h_pulse: "", // Heart Pulse
        b_rate: "", // Breathing Rate
        temp: "", // Temperature

        // Additional fields if needed by backend
        otherExamination: "",
        diagnosis: "",
        recommendation: "",

        // Doctor info
        doctorSignature: "",
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5)
    };

    const handleSubmit = async (values, { resetForm }) => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                toast.error("Please log in again");
                setLoading(false);
                return;
            }

            let allergiesPayload = null;
            if (values.hasAllergies === "yes" && values.pt_allergies && values.pt_allergies.length > 0) {
                allergiesPayload = values.pt_allergies.map(opt => opt.value);
            }

            // Prepare data for backend
            const checkupData = {
                pt_id: appointment.patientId, // Patient ID
                treat_doc_id: appointment.doctorId, // Treating doctor ID
                apt_id: appointment.id, // Appointment ID
                pt_complaint: values.pt_complaint,
                past_md_history: values.past_md_history,
                coscs: values.coscs,
                s_bp: values.s_bp,
                d_bp: values.d_bp,
                h_pulse: values.h_pulse,
                b_rate: values.b_rate,
                temp: values.temp,
                pt_allergies: allergiesPayload
            };

            console.log("Submitting checkup data:", checkupData);

            const response = await fetch(`${API_BASE_URL}/patient-assessment/save-assessment`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(checkupData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.alert || result.message || result.error || "Failed to save assessment");
            }

            // Show success message
            toast.success(result.message || "Assessment saved successfully!");

            // Call parent onSubmit with formatted data
            onSubmit({
                ...values,
                appointmentId: appointment.id,
                patientId: appointment.patientId,
                doctorId: appointment.doctorId,
                submittedAt: new Date().toISOString()
            });

            resetForm();
            onClose();

        } catch (error) {
            console.error("Error saving assessment:", error);
            toast.error(error.message || "Failed to save assessment");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = (resetForm) => {
        resetForm();
        onClose();
    };

    return (
        <div className="checkup-overlay">
            <div className="checkup-box">
                <div className="hospital-header">
                    <h2>Shifa International Hospital</h2>
                    <h3>ASSESSMENT REPORT</h3>
                </div>

                <div className="patient-info-header">
                    <div className="info-row">
                        <span><strong>Patient:</strong> {appointment.patientName}</span>
                        <span><strong>Doctor:</strong> {appointment.doctorName}</span>
                    </div>
                    <div className="info-row">
                        <span><strong>Date:</strong> {appointment.date}</span>
                        <span><strong>Time:</strong> {appointment.time}</span>
                    </div>
                    <div className="info-row">
                        <span><strong>Appointment ID:</strong> {appointment.id}</span>
                    </div>
                </div>

                <Formik
                    initialValues={initialValues}
                    onSubmit={handleSubmit}
                >

                    {({ values, errors, touched, resetForm, setFieldValue, submitForm }) => (
                        <Form className="checkup-form detailed-form">
                            {/* Patient Complaint */}
                            <div className="form-section">
                                <label className="section-label">Patient Complaint</label>
                                <Field
                                    as="textarea"
                                    name="pt_complaint"
                                    placeholder="Enter patient's chief complaint..."
                                    rows="3"
                                    className={errors.pt_complaint && touched.pt_complaint ? 'error-field' : ''}
                                />
                                <ErrorMessage name="pt_complaint" component="div" className="error-message" />
                            </div>

                            {/* Past Medical History */}
                            <div className="form-section">
                                <label className="section-label">Past Medical History</label>
                                <Field
                                    as="textarea"
                                    name="past_md_history"
                                    placeholder="Enter past medical history..."
                                    rows="3"
                                />
                                <ErrorMessage name="past_md_history" component="div" className="error-message" />
                            </div>

                            {/* Allergies Section */}
                            <div className="form-section">
                                <label className="section-label">Allergies</label>
                                <div className="radio-group" style={{ display: 'flex', gap: '20px', marginBottom: '10px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                                        <Field type="radio" name="hasAllergies" value="yes" />
                                        Yes
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                                        <Field type="radio" name="hasAllergies" value="no" />
                                        No
                                    </label>
                                </div>

                                {values.hasAllergies === "yes" && (
                                    <div className="allergies-select-container">
                                        <Select
                                            isMulti
                                            name="pt_allergies"
                                            options={allergiesOptions}
                                            className="basic-multi-select"
                                            classNamePrefix="select"
                                            placeholder="Search and select allergies..."
                                            value={values.pt_allergies}
                                            onChange={(selectedOptions) => setFieldValue("pt_allergies", selectedOptions)}
                                            styles={{ menu: p => ({ ...p, zIndex: 9999 }) }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Physical Examination - Vital Signs */}
                            <div className="form-section">
                                <label className="section-label">Vital Signs</label>
                                <div className="examination-grid">
                                    {/* Consciousness Level */}
                                    <div className="exam-field">
                                        <label>Level of Consciousness:</label>
                                        <Field
                                            as="select"
                                            name="coscs"
                                            className={errors.coscs && touched.coscs ? 'error-field' : ''}
                                        >
                                            <option value="Alert">Alert</option>
                                            <option value="Verbal Response">Verbal Response</option>
                                            <option value="Pain Response">Pain Response</option>
                                            <option value="Unresponsive">Unresponsive</option>
                                            <option value="Confused">Confused</option>
                                            <option value="Drowsy">Drowsy</option>
                                        </Field>
                                        <ErrorMessage name="coscs" component="div" className="error-message" />
                                    </div>

                                    {/* Blood Pressure */}
                                    <div className="exam-row">
                                        <div className="exam-field">
                                            <label>Systolic BP:</label>
                                            <Field
                                                type="number"
                                                name="s_bp"
                                                placeholder="e.g., 120"
                                                className={errors.s_bp && touched.s_bp ? 'error-field' : ''}
                                                min="50"
                                                max="250"
                                            />
                                            <span className="unit">mmHg</span>
                                            <ErrorMessage name="s_bp" component="div" className="error-message" />
                                        </div>

                                        <div className="exam-field">
                                            <label>Diastolic BP:</label>
                                            <Field
                                                type="number"
                                                name="d_bp"
                                                placeholder="e.g., 80"
                                                className={errors.d_bp && touched.d_bp ? 'error-field' : ''}
                                                min="30"
                                                max="150"
                                            />
                                            <span className="unit">mmHg</span>
                                            <ErrorMessage name="d_bp" component="div" className="error-message" />
                                        </div>
                                    </div>

                                    {/* Pulse and Respiration */}
                                    <div className="exam-row">
                                        <div className="exam-field">
                                            <label>Heart Rate:</label>
                                            <Field
                                                type="number"
                                                name="h_pulse"
                                                placeholder="e.g., 72"
                                                className={errors.h_pulse && touched.h_pulse ? 'error-field' : ''}
                                                min="30"
                                                max="200"
                                            />
                                            <span className="unit">bpm</span>
                                            <ErrorMessage name="h_pulse" component="div" className="error-message" />
                                        </div>

                                        <div className="exam-field">
                                            <label>Respiratory Rate:</label>
                                            <Field
                                                type="number"
                                                name="b_rate"
                                                placeholder="e.g., 16"
                                                className={errors.b_rate && touched.b_rate ? 'error-field' : ''}
                                                min="8"
                                                max="60"
                                            />
                                            <span className="unit">bpm</span>
                                            <ErrorMessage name="b_rate" component="div" className="error-message" />
                                        </div>
                                    </div>

                                    {/* Temperature */}
                                    <div className="exam-field">
                                        <label>Temperature:</label>
                                        <Field
                                            type="number"
                                            step="0.1"
                                            name="temp"
                                            placeholder="e.g., 36.5"
                                            className={errors.temp && touched.temp ? 'error-field' : ''}
                                            min="34"
                                            max="42"
                                        />
                                        <span className="unit">°C</span>
                                        <ErrorMessage name="temp" component="div" className="error-message" />
                                    </div>
                                </div>
                            </div>

                            {/* Diagnosis / Assessment */}
                            <div className="form-section">
                                <label className="section-label">Diagnosis / Assessment</label>
                                <Field
                                    as="textarea"
                                    name="diagnosis"
                                    placeholder="Enter diagnosis and assessment..."
                                    rows="3"
                                    className={errors.diagnosis && touched.diagnosis ? 'error-field' : ''}
                                />
                                <ErrorMessage name="diagnosis" component="div" className="error-message" />
                            </div>



                            {/* Doctor's Signature */}
                            <div className="form-section signature-section">
                                <div className="signature-row">
                                    <div className="signature-field">
                                        <label>Treating Person:</label>
                                        <input
                                            type="text"
                                            value="Admin "

                                        />
                                    </div>
                                    <div className="signature-field">
                                        <label>Attendie Signature:</label>
                                        <Field
                                            type="text"
                                            name="doctorSignature"
                                            placeholder="Enter your name"
                                            className={errors.doctorSignature && touched.doctorSignature ? 'error-field' : ''}
                                        />
                                        <ErrorMessage name="doctorSignature" component="div" className="error-message" />
                                    </div>
                                </div>

                                <div className="signature-row">
                                    <div className="signature-field">
                                        <label>Date:</label>
                                        <Field
                                            type="date"
                                            name="date"
                                            className={errors.date && touched.date ? 'error-field' : ''}
                                        />
                                        <ErrorMessage name="date" component="div" className="error-message" />
                                    </div>
                                    <div className="signature-field">
                                        <label>Time:</label>
                                        <Field
                                            type="time"
                                            name="time"
                                            className={errors.time && touched.time ? 'error-field' : ''}
                                        />
                                        <ErrorMessage name="time" component="div" className="error-message" />
                                    </div>
                                </div>
                            </div>

                            <div className="checkup-actions">
                                <button
                                    type="button"
                                    className="submit-btn"
                                    disabled={loading}
                                    onClick={submitForm}
                                >
                                    {loading ? "Saving..." : "Submit Assessment Report"}
                                </button>
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => handleCancel(resetForm)}
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>
        </div>
    );
}