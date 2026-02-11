import React, { useState } from "react";
import { Formik, Form, Field } from "formik";
import { toast } from "react-toastify";
import "../components/appointment/CheckupModal.css";

export default function DoctorPrescriptionModal({
    show,
    onClose,
    appointment,
    onSubmit
}) {
    if (!show || !appointment) return null;
    const [showTravelDetails, setShowTravelDetails] = useState(false);

    const initialValues = {
        apt_id: appointment.id ?? "",
        pt_id: appointment.patientId ?? "",
        tr_doc_id: appointment.doctorId ?? "",

        doctor_note: "",
        other_exm: "",
        treatment_plan: "",
        trav_reccom: "",
        trav_req: "",
        trav_comp_req: "",
        patient_Allergies: "",
        travel_advData: "",

        // UI-only fields
        doctor_sign: "",
        prescription_date: new Date().toISOString().split("T")[0]
    };

    const handleSubmit = async (values, { setSubmitting }) => {
        const payload = {
            pt_id: Number(values.pt_id),
            tr_doc_id: Number(values.tr_doc_id),
            apt_id: Number(values.apt_id),
            doc_note: values.doctor_note,
            other_exm: values.other_exm,
            treat_plan: values.treatment_plan,
            trav_reccom: showTravelDetails ? values.trav_reccom : null,
            trav_req: showTravelDetails ? values.trav_req : null,
            trav_comp_req: showTravelDetails ? values.trav_comp_req : null,
            patient_Allergies: values.patient_Allergies || null,
            travel_advData: showTravelDetails ? values.travel_advData : null,
        };

        if (isNaN(payload.pt_id) || isNaN(payload.tr_doc_id) || isNaN(payload.apt_id) || payload.pt_id <= 0 || payload.tr_doc_id <= 0 || payload.apt_id <= 0) {
            toast.error("A required ID (Patient, Doctor, or Appointment) is missing or invalid.");
            setSubmitting(false);
            return;
        }

        await onSubmit(payload, setSubmitting);
    };

    return (
        <div className="checkup-overlay">
            <div className="checkup-box">

                {/* Header */}
                <div className="hospital-header">
                    <h2>Shifa International Hospital</h2>
                    <h3>DOCTOR PRESCRIPTION</h3>
                </div>

                <Formik initialValues={initialValues} onSubmit={handleSubmit} enableReinitialize>
                    {({ isSubmitting, resetForm }) => (
                        <Form className="checkup-form detailed-form">

                            {/* Appointment ID */}
                            <div className="form-section">
                                <label className="section-label">Appointment ID</label>
                                <Field
                                    type="number"
                                    name="apt_id"
                                    readOnly
                                />
                            </div>

                            {/* Other Examinations */}
                            <div className="form-section">
                                <label className="section-label">Other Examinations</label>
                                <Field
                                    as="textarea"
                                    name="other_exm"
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
                                <div className="travel-toggle">
                                    <label className="section-label">Travel Details Required?</label>
                                    <input
                                        type="checkbox"
                                        checked={showTravelDetails}
                                        onChange={() => setShowTravelDetails(prev => !prev)}
                                    />
                                    <span>{showTravelDetails ? 'Yes' : 'No'}</span>
                                </div>

                                {showTravelDetails && (
                                    <div className="travel-options">
                                        <div className="travel-question">
                                            <label>Travel Recommendation</label>
                                            <Field
                                                as="textarea"
                                                name="trav_reccom"
                                                rows="2"
                                                placeholder="e.g., can_fly"
                                            />
                                        </div>

                                        <div className="travel-question">
                                            <label>Travel Requirement</label>
                                            <Field
                                                as="textarea"
                                                name="trav_req"
                                                rows="2"
                                                placeholder="e.g., ordinary_seat"
                                            />
                                        </div>

                                        <div className="travel-question">
                                            <label>Travelling Company Required</label>
                                            <Field
                                                as="textarea"
                                                name="trav_comp_req"
                                                rows="2"
                                                placeholder="e.g., medical_escort"
                                            />
                                        </div>

                                        <div className="travel-question">
                                            <label>Doctor Advice on Travel</label>
                                            <Field
                                                as="textarea"
                                                name="travel_advData"
                                                rows="2"
                                            />
                                        </div>
                                    </div>
                                )}
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
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="checkup-actions">
                                <button type="submit" className="submit-btn" disabled={isSubmitting}>
                                    {isSubmitting ? "Saving..." : "Save Prescription"}
                                </button>
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    disabled={isSubmitting}
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
