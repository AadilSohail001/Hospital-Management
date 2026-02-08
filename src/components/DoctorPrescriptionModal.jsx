import React from "react";
import { Formik, Form, Field } from "formik";
import "../components/appointment/CheckupModal.css";

export default function DoctorPrescriptionModal({
    show,
    onClose,
    appointment,
    onSubmit
}) {
    if (!show || !appointment) return null;

    const initialValues = {
        appointment_ID: appointment.id || "",

        doctor_sign: "",
        doctor_advice_on_travel: "",
        travelling_company_required: "",
        travel_requirement: "",
        travel_recommendation: "",
        doctor_note: "",
        treatment_plan: "",
        other_examinations: "",

        prescription_date: new Date().toISOString().split("T")[0],
        prescription_time: new Date().toTimeString().slice(0, 5)
    };

    const handleSubmit = (values, { resetForm }) => {
        onSubmit(values);
        resetForm();
        onClose();
    };

    return (
        <div className="checkup-overlay">
            <div className="checkup-box">

                {/* Header */}
                <div className="hospital-header">
                    <h2>Shifa International Hospital</h2>
                    <h4>PATIENT STICKERS</h4>
                    <h3>DOCTOR PRESCRIPTION</h3>
                </div>

                <Formik initialValues={initialValues} onSubmit={handleSubmit}>
                    {({ resetForm }) => (
                        <Form className="checkup-form detailed-form">

                            {/* Appointment ID */}
                            <div className="form-section">
                                <label className="section-label">Appointment ID</label>
                                <Field
                                    type="text"
                                    name="appointment_ID"
                                    readOnly
                                />
                            </div>

                            {/* Other Examinations */}
                            <div className="form-section">
                                <label className="section-label">Other Examinations</label>
                                <Field
                                    as="textarea"
                                    name="other_examinations"
                                    placeholder="Enter other examination findings..."
                                    rows="3"
                                />
                            </div>

                            {/* Treatment Plan */}
                            <div className="form-section">
                                <label className="section-label">Treatment Plan</label>
                                <Field
                                    as="textarea"
                                    name="treatment_plan"
                                    placeholder="Enter treatment plan..."
                                    rows="3"
                                />
                            </div>

                            {/* Doctor Note */}
                            <div className="form-section">
                                <label className="section-label">Doctor Note</label>
                                <Field
                                    as="textarea"
                                    name="doctor_note"
                                    placeholder="Additional doctor notes..."
                                    rows="3"
                                />
                            </div>

                            {/* Travel Recommendation Section */}
                            <div className="form-section travel-section">
                                <label className="section-label">Travel Details</label>

                                <div className="travel-options">
                                    <div className="travel-question">
                                        <label>Doctor Advice on Travel</label>
                                        <Field
                                            as="textarea"
                                            name="doctor_advice_on_travel"
                                            rows="2"
                                        />
                                    </div>

                                    <div className="travel-question">
                                        <label>Travelling Company Required</label>
                                        <Field
                                            as="textarea"
                                            name="travelling_company_required"
                                            rows="2"
                                        />
                                    </div>

                                    <div className="travel-question">
                                        <label>Travel Requirement</label>
                                        <Field
                                            as="textarea"
                                            name="travel_requirement"
                                            rows="2"
                                        />
                                    </div>

                                    <div className="travel-question">
                                        <label>Travel Recommendation</label>
                                        <Field
                                            as="textarea"
                                            name="travel_recommendation"
                                            rows="2"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Signature + Date / Time */}
                            <div className="form-section signature-section">
                                <div className="signature-row">
                                    <div className="signature-field">
                                        <label>Doctor Signature</label>
                                        <Field
                                            type="text"
                                            name="doctor_sign"
                                            placeholder="Doctor Signature"
                                        />
                                    </div>
                                </div>

                                <div className="signature-row">
                                    <div className="signature-field">
                                        <label>Prescription Date</label>
                                        <Field
                                            type="date"
                                            name="prescription_date"
                                        />
                                    </div>

                                    <div className="signature-field">
                                        <label>Prescription Time</label>
                                        <Field
                                            type="time"
                                            name="prescription_time"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="checkup-actions">
                                <button type="submit" className="submit-btn">
                                    Save Prescription
                                </button>
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => {
                                        resetForm();
                                        onClose();
                                    }}
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
