/* eslint-disable react-hooks/rules-of-hooks */
import React, { useState, useEffect } from "react";
import { Formik, Form, Field } from "formik";
import { toast } from "react-toastify";
import Select from "react-select";
import "../components/appointment/CheckupModal.css";
import { getData, postData } from "../utils/apiService";

export default function DoctorPrescriptionModal({
    show,
    onClose,
    appointment,
    onSubmit
}) {
    if (!show || !appointment) return null;

    const [showTravelDetails, setShowTravelDetails] = useState(false);
    const [patientAllergies, setPatientAllergies] = useState([]);
    const [loadingAllergies, setLoadingAllergies] = useState(false);
    const [allergiesOptions, setAllergiesOptions] = useState([]);

    // Fetch patient allergies when modal opens
    useEffect(() => {
        const fetchPatientAllergies = async () => {
            if (appointment?.patientId) {
                setLoadingAllergies(true);
                try {
                    const response = await getData(`/patients/show-patient-allergies/${appointment.patientId}`);

                    if (response.status === 200) {
                        const data = response.data;
                        setPatientAllergies(Array.isArray(data) ? data : []);
                    }
                } catch (error) {
                    console.error("Error fetching patient allergies:", error);
                } finally {
                    setLoadingAllergies(false);
                }
            }
        };

        if (show && appointment) {
            fetchPatientAllergies();
        }
    }, [show, appointment]);

    // Fetch all allergies options
    useEffect(() => {
        if (show) {
            const fetchAllAllergies = async () => {
                try {
                    const response = await getData("/patients/show-allergies");
                    if (response.status === 200) {
                        const data = response.data;
                        const options = (Array.isArray(data) ? data : []).map(item => ({
                            value: item.id,
                            label: item.allergy_name
                        }));
                        setAllergiesOptions(options);
                    }
                } catch (error) {
                    console.error("Failed to fetch allergies options", error);
                }
            };
            fetchAllAllergies();
        }
    }, [show]);

    const getInitialSelectedAllergies = () => {
        if (!patientAllergies.length || !allergiesOptions.length) return [];

        return patientAllergies.map(pa => {
            let label = typeof pa === 'string' ? pa : (pa.allergy_name || pa.name || pa.allergy_Name);
            let value = typeof pa === 'object' ? (pa.id || pa.allergy_ID) : null;

            if (!value && label) {
                const match = allergiesOptions.find(opt => opt.label.toLowerCase() === label.toLowerCase());
                if (match) value = match.value;
            }

            if (value && label) return { value, label };
            return null;
        }).filter(Boolean);
    };

    const initialValues = {
        doc_note: "",
        other_exm: "",
        treat_plan: "",
        trav_reccom: "",
        trav_req: "",
        trav_comp_req: "",
        doctor_sign: "",
        prescription_date: new Date().toISOString().split("T")[0],
        pt_allergies: getInitialSelectedAllergies()
    };

    const handleSubmit = async (values, { setSubmitting, resetForm }) => {
        try {
            // Calculate new allergies to add
            const selectedAllergies = values.pt_allergies || [];
            const selectedIds = selectedAllergies.map(a => a.value);

            const existingIds = patientAllergies.map(pa => {
                if (typeof pa === 'string') {
                    const match = allergiesOptions.find(opt => opt.label.toLowerCase() === pa.toLowerCase());
                    return match ? match.value : null;
                }
                return pa.allergy_ID || pa.id;
            }).filter(id => id != null);

            const newIds = selectedIds.filter(id => !existingIds.includes(id));

            const payload = {
                pt_id: appointment.patientId,
                tr_doc_id: appointment.doctorId,
                apt_id: appointment.id,
                doc_note: values.doc_note || "",
                other_exm: values.other_exm || "",
                treat_plan: values.treat_plan || "",
                trav_reccom: showTravelDetails ? values.trav_reccom : null,
                trav_req: showTravelDetails ? values.trav_req : null,
                trav_comp_req: showTravelDetails ? values.trav_comp_req : null,
                patient_Allergies: newIds.length > 0 ? newIds : null,
                travel_advData: showTravelDetails ? "yes" : null // This triggers travel advisory save
            };

            // Validate required IDs
            if (!payload.pt_id || !payload.tr_doc_id || !payload.apt_id ||
                payload.pt_id <= 0 || payload.tr_doc_id <= 0 || payload.apt_id <= 0) {
                toast.error("A required ID (Patient, Doctor, or Appointment) is missing or invalid.");
                setSubmitting(false);
                return;
            }



            // Make the API call to the correct endpoint
            const response = await postData("/patient-diagnosis/write-diagnosis", payload);

            if (response.status !== 200) {
                throw new Error(response.data?.alert || response.data?.message || response.data?.error || "Failed to save prescription");
            }

            // Show success message
            toast.success(response.data.message || "Prescription saved successfully!");

            // Call parent onSubmit with the response
            onSubmit({
                ...payload,
                response: response.data,
                submittedAt: new Date().toISOString()
            });

            // Reset form and close modal
            resetForm();
            setShowTravelDetails(false);
            onClose();

        } catch (error) {
            console.error("Error saving prescription:", error);
            toast.error(error.message || "Failed to save prescription");
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = (resetForm) => {
        resetForm();
        setShowTravelDetails(false);
        onClose();
    };

    return (
        <div className="checkup-overlay">
            <div className="checkup-box">
                <div className="hospital-header">
                    <h2>Shifa International Hospital</h2>
                    <h3>DOCTOR PRESCRIPTION</h3>
                </div>

                {/* Patient Info Header */}
                <div className="patient-info-header">
                    <div className="info-row">
                        <span><strong>Patient:</strong> {appointment.patientName}</span>
                        <span><strong>Patient ID:</strong> {appointment.patientId}</span>
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
                    enableReinitialize
                >
                    {({ isSubmitting, resetForm, submitForm, values, setFieldValue }) => (
                        <Form className="checkup-form detailed-form">

                            {/* Patient Allergies Section */}
                            <div className="form-section">
                                <label className="section-label">Patient Allergies</label>
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
                                        isLoading={loadingAllergies}
                                    />
                                </div>
                            </div>

                            {/* Doctor Note - Matches backend field name 'doc_note' */}
                            <div className="form-section">
                                <label className="section-label">Doctor Note</label>
                                <Field
                                    as="textarea"
                                    name="doc_note"
                                    placeholder="Enter doctor's notes..."
                                    rows="3"
                                />
                            </div>

                            {/* Other Examinations - Matches backend field name 'other_exm' */}
                            <div className="form-section">
                                <label className="section-label">Other Examinations</label>
                                <Field
                                    as="textarea"
                                    name="other_exm"
                                    placeholder="Enter other examination findings..."
                                    rows="3"
                                />
                            </div>

                            {/* Treatment Plan - Matches backend field name 'treat_plan' */}
                            <div className="form-section">
                                <label className="section-label">Treatment Plan</label>
                                <Field
                                    as="textarea"
                                    name="treat_plan"
                                    placeholder="Enter treatment plan..."
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
                                    { /*  <span>{showTravelDetails ? 'Yes' : 'No'}</span> */}
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
                                    </div>
                                )}
                            </div>

                            {/* Signature Section */}
                            <div className="form-section signature-section">
                                <div className="signature-row">
                                    <div className="signature-field">
                                        <label>Doctor Signature:</label>
                                        <Field
                                            type="text"
                                            name="doctor_sign"
                                            placeholder="Enter your name"
                                        />
                                    </div>
                                </div>

                                <div className="signature-row">
                                    <div className="signature-field">
                                        <label>Prescription Date:</label>
                                        <Field
                                            type="date"
                                            name="prescription_date"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="checkup-actions">
                                <button
                                    type="button"
                                    className="submit-btn"
                                    disabled={isSubmitting}
                                    onClick={submitForm}
                                >
                                    {isSubmitting ? "Saving..." : "Save Prescription"}
                                </button>
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => handleCancel(resetForm)}
                                    disabled={isSubmitting}
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