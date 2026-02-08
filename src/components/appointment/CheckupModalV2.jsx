import React from "react";
import { Formik, Form, Field, ErrorMessage } from 'formik';
import './CheckupModal.css';
import { checkupValidation } from "../../schemas/checkupValidation";

export default function CheckupModalV2({
    show,
    onClose,
    appointment,
    onSubmit
}) {
    if (!show || !appointment) return null;

    const initialValues = {
        complaint: "",
        allergy: "",
        history: "",

        // Physical Examination
        consciousness: "",
        bloodPressure: "",
        pulse: "",
        respiration: "",
        temperature: "",
        otherExamination: "",

        // Investigations
        investigations: "",

        // Diagnosis
        diagnosis: "",

        // Recommendation
        recommendation: "",

        // Doctor's Signature
        signature: "",
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5)
    };

    const handleSubmit = (values, { resetForm }) => {
        onSubmit(values);
        resetForm();
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
                    <h4>PATIENT STICKERS</h4>
                    <h3>ASSESSMENT REPORT</h3>
                </div>

                <Formik
                    initialValues={initialValues}
                    validationSchema={checkupValidation}
                    onSubmit={handleSubmit}
                >
                    {({ values, errors, touched, resetForm }) => (
                        <Form className="checkup-form detailed-form">
                            {/* Patient Complaint / Medical History */}
                            <div className="form-section">
                                <label className="section-label">Patient Complaint</label>
                                <Field
                                    as="textarea"
                                    name="complaint"
                                    placeholder="Enter patient complaint and medical history..."
                                    rows="3"
                                    className={errors.complaint && touched.complaint ? 'error-field' : ''}
                                />
                                <ErrorMessage name="complaint" component="div" className="error-message" />
                            </div>

                            {/* Allergy */}
                            <div className="form-section">
                                <label className="section-label">Allergy</label>
                                <Field
                                    as="textarea"
                                    name="allergy"
                                    placeholder="List any allergies..."
                                    rows="2"
                                />
                                <ErrorMessage name="allergy" component="div" className="error-message" />
                            </div>

                            {/* Past Medical History */}
                            <div className="form-section">
                                <label className="section-label">Past Medical History</label>
                                <Field
                                    as="textarea"
                                    name="history"
                                    placeholder="Enter past medical history..."
                                    rows="3"
                                />
                                <ErrorMessage name="history" component="div" className="error-message" />
                            </div>

                            {/* Physical Examination Table */}
                            <div className="form-section">
                                <label className="section-label">Physical Examination</label>
                                <div className="examination-grid">
                                    <div className="exam-field">
                                        <label>Level of Consciousness :</label>
                                        <Field
                                            type="text"
                                            name="consciousness"
                                            placeholder="e.g., Alert, GCS 15/15"
                                            className={errors.consciousness && touched.consciousness ? 'error-field' : ''}
                                        />
                                        <ErrorMessage name="consciousness" component="div" className="error-message" />
                                    </div>

                                    <div className="exam-row">
                                        <div className="exam-field">
                                            <label>Blood Pressure :</label>
                                            <Field
                                                type="text"
                                                name="bloodPressure"
                                                placeholder="e.g., 120/80"
                                                className={errors.bloodPressure && touched.bloodPressure ? 'error-field' : ''}
                                            />
                                            <span className="unit">mmHg</span>
                                            <ErrorMessage name="bloodPressure" component="div" className="error-message" />
                                        </div>

                                        <div className="exam-field">
                                            <label>Pulse :</label>
                                            <Field
                                                type="text"
                                                name="pulse"
                                                placeholder="e.g., 72"
                                                className={errors.pulse && touched.pulse ? 'error-field' : ''}
                                            />
                                            <span className="unit">x/min</span>
                                            <ErrorMessage name="pulse" component="div" className="error-message" />
                                        </div>
                                    </div>

                                    <div className="exam-row">
                                        <div className="exam-field">
                                            <label>Respiration rate :</label>
                                            <Field
                                                type="text"
                                                name="respiration"
                                                placeholder="e.g., 16"
                                                className={errors.respiration && touched.respiration ? 'error-field' : ''}
                                            />
                                            <span className="unit">x/min</span>
                                            <ErrorMessage name="respiration" component="div" className="error-message" />
                                        </div>

                                        <div className="exam-field">
                                            <label>Temperature :</label>
                                            <Field
                                                type="text"
                                                name="temperature"
                                                placeholder="e.g., 36.5"
                                                className={errors.temperature && touched.temperature ? 'error-field' : ''}
                                            />
                                            <span className="unit">°C</span>
                                            <ErrorMessage name="temperature" component="div" className="error-message" />
                                        </div>
                                    </div>


                                </div>

                                {/* Other Examination Findings */}
                                <div className="exam-field" style={{ marginTop: '10px' }}>
                                    <label>Other Examination Findings :</label>
                                    <Field
                                        as="textarea"
                                        name="otherExamination"
                                        placeholder="Enter other examination findings..."
                                        rows="2"
                                    />
                                    <ErrorMessage name="otherExamination" component="div" className="error-message" />
                                </div>
                            </div>


                            {/* Assessment / Diagnosis */}
                            <div className="form-section">
                                <label className="section-label">Assessment / Diagnosis</label>
                                <Field
                                    as="textarea"
                                    name="diagnosis"
                                    placeholder="Enter assessment and diagnosis..."
                                    rows="3"
                                    className={errors.diagnosis && touched.diagnosis ? 'error-field' : ''}
                                />
                                <ErrorMessage name="diagnosis" component="div" className="error-message" />
                            </div>



                            {/* Doctor's Signature */}
                            <div className="form-section signature-section">
                                <div className="signature-row">
                                    <div className="signature-field">
                                        <label>Treating Doctor's Name :</label>
                                        <input
                                            type="text"
                                            value={appointment.doctorName || ''}
                                            readOnly
                                            style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                                        />
                                    </div>
                                    <div className="signature-field">
                                        <label>Signature :</label>
                                        <Field
                                            type="text"
                                            name="signature"
                                            placeholder="Signature"
                                            className={errors.signature && touched.signature ? 'error-field' : ''}
                                        />
                                        <ErrorMessage name="signature" component="div" className="error-message" />
                                    </div>
                                </div>

                                <div className="signature-row">
                                    <div className="signature-field">
                                        <label>Date :</label>
                                        <Field
                                            type="date"
                                            name="date"
                                            className={errors.date && touched.date ? 'error-field' : ''}
                                        />
                                        <ErrorMessage name="date" component="div" className="error-message" />
                                    </div>
                                    <div className="signature-field">
                                        <label>Time :</label>
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
                                <button type="submit" className="submit-btn">Submit Checkup Report</button>
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => handleCancel(resetForm)}
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