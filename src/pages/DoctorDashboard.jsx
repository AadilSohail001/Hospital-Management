import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";
// import Pagination from "../components/Pagination.jsx";
import DoctorPrescriptionModal from "../components/DoctorPrescriptionModal";
import "../styles/DoctorDashboard.css";
import { getData } from "../utils/apiService";

export default function DoctorDashboard() {
    const navigate = useNavigate();
    const [doctor, setDoctor] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    // Doctor Prescription Modal State
    const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);


    useEffect(() => {
        const loadDashboardData = async () => {
            const stored = localStorage.getItem("currentUser");
            const token = localStorage.getItem("token");
            const currentUser = stored ? JSON.parse(stored) : null;

            if (!currentUser || !token || !(currentUser.role_ID == 1)) {
                navigate("/");
                return;
            }

            try {
                setLoading(true);
                // 1. Fetch Specializations (to map spec_ID to name)
                let specializations = [];
                try {
                    const specRes = await getData("/users/get-doctor-specialities");
                    if (specRes.status === 200) {
                        specializations = specRes.data;
                    }
                } catch (err) {
                    console.warn("Failed to fetch specializations", err);
                }

                // 2. Fetch Patients (to map patient_ID to name/contact)
                let patientsList = [];
                try {
                    const patRes = await getData("/patients/show-patients");
                    if (patRes.status === 200) {
                        const patData = patRes.data;
                        patientsList = patData.patients || patData.data || (Array.isArray(patData) ? patData : []) || [];
                    }
                } catch (err) {
                    console.warn("Failed to fetch patients", err);
                }

                // 3. Fetch Doctor Profile
                let currentDoctor = null;
                try {
                    const docRes = await getData("/users/show-all-doctors");

                    if (docRes.status === 200) {
                        const docData = docRes.data;
                        const allDoctors = Array.isArray(docData) ? docData : docData.users || [];
                        currentDoctor = allDoctors.find(d => d.user_Id == currentUser.id || d.email === currentUser.email);
                    }
                } catch (err) {
                    console.warn("Could not fetch doctor list:", err);
                }

                if (!currentDoctor) {
                    // Fallback to local user data if API fails (e.g. 403 Forbidden)
                    currentDoctor = {
                        user_Id: currentUser.id,
                        email: currentUser.email,
                        name: currentUser.name || "Doctor",
                        specialization: currentUser.speciality || currentUser.specialization || "General"
                    };
                }

                // Resolve specialization name
                let specName = currentDoctor.specialization || currentDoctor.speciality;
                const specId = currentDoctor.spec_ID || currentDoctor.spz_ID;
                if (specId && specializations.length > 0) {
                    const s = specializations.find(sp => sp.id == specId);
                    if (s) specName = s.speciality;
                }

                if (!specName && (currentUser.speciality || currentUser.specialization)) {
                    specName = currentUser.speciality || currentUser.specialization;
                }

                setDoctor({
                    ...currentDoctor,
                    name: currentDoctor.user_name || currentDoctor.name,
                    specialization: specName || "General"
                });

                // 4. Fetch Appointments
                try {
                    const apptRes = await getData(`/appointments/show-appointments?doctor_id=${currentDoctor.user_Id || currentDoctor.id}`);

                    if (apptRes.status === 200) {
                        const apptData = apptRes.data;
                        const myAppts = Array.isArray(apptData) ? apptData : apptData.appointments || apptData.data || [];

                        // Map to display format
                        const formattedAppts = myAppts.map(appt => {
                            const patient = Array.isArray(patientsList)
                                ? patientsList.find(p => p.id == appt.patient_ID || p.patient_id == appt.patient_ID)
                                : null;

                            return {
                                id: appt.id || appt.appointment_id,
                                patientName: String(patient?.patient_name || patient?.name || 'Unknown Patient'),
                                contact: String(patient?.contact || appt.contact || "Not provided"),
                                date: appt.appointment_date || appt.date,
                                time: appt.appointment_time || appt.time,
                                status: String(appt.appointment_status || appt.status || "Pending")
                            };
                        });

                        setAppointments(formattedAppts);
                    }
                } catch (apptErr) {
                    console.warn("Appointments endpoint not reachable", apptErr);
                }

            } catch (error) {
                console.error("Dashboard load error:", error);
                toast.error("Error loading dashboard");
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, [navigate]);

    const openPrescriptionModal = (appointment) => {
        setSelectedAppointment(appointment);
        setShowPrescriptionModal(true);
    };

    const closePrescriptionModal = () => {
        setSelectedAppointment(null);
        setShowPrescriptionModal(false);
    };



    if (loading) {
        return <div style={{ textAlign: "center", padding: "2rem" }}>Loading Dashboard...</div>;
    }

    if (!doctor) {
        return <div style={{ textAlign: "center", padding: "2rem" }}>Doctor profile not found.</div>;
    }

    const pendingAppointments = appointments.filter(a => a.status === "Pending").length;
    const completedAppointments = appointments.filter(a => a.status === "Checked").length;

    return (
        <div className="doctor-dashboard-page">
            {/* Header */}
            <header className="doctor-dashboard-header">
                <div className="dashboard-title-section">
                    <h1><Icon icon="mdi:doctor" /> Doctor Dashboard</h1>
                    <div className="doctor-profile-section">
                        <span className="doctor-welcome-message">Welcome, <strong>{doctor.name}</strong></span>
                        <span className="doctor-specialization">Specialization: {doctor.specialization}</span>
                    </div>
                </div>
            </header>

            {/* Statistics */}
            <div className="doctor-stats-container">
                <div className="doctor-stat-card">
                    <Icon icon="mdi:calendar" className="doctor-stat-icon" />
                    <span className="doctor-stat-number">{appointments.length}</span>
                    <span className="doctor-stat-label">Total Appointments</span>
                </div>
                <div className="doctor-stat-card pending">
                    <Icon icon="mdi:clock-outline" className="doctor-stat-icon" />
                    <span className="doctor-stat-number">{pendingAppointments}</span>
                    <span className="doctor-stat-label">Pending</span>
                </div>
                <div className="doctor-stat-card completed">
                    <Icon icon="mdi:check-circle" className="doctor-stat-icon" />
                    <span className="doctor-stat-number">{completedAppointments}</span>
                    <span className="doctor-stat-label">Completed</span>
                </div>
            </div>

            {/* Appointments Table */}
            <div className="doctor-appointments-section">
                <div className="doctor-section-header">
                    <h2><Icon icon="mdi:clipboard-list" /> Your Appointments</h2>
                    {appointments.length > 0 && (
                        <span className="doctor-appointment-count">{appointments.length} appointments</span>
                    )}
                </div>

                {appointments.length === 0 ? (
                    <div className="doctor-empty-state">
                        <Icon icon="mdi:calendar-remove" className="doctor-empty-icon" />
                        <p>No appointments scheduled for you yet.</p>
                        <p className="doctor-empty-subtitle">Patients will appear here when they book appointments with you.</p>
                    </div>
                ) : (
                    <div className="doctor-table-container">
                        <table className="doctor-appointments-table">
                            <thead>
                                <tr>
                                    <th>Patient Name</th>
                                    <th>Contact</th>
                                    <th>Date</th>
                                    <th>Time</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appointments.map((appt, index) => (
                                    <tr key={appt.id || index}>
                                        <td>{appt.patientName}</td>
                                        <td className={!appt.contact || appt.contact === "Not provided" ? "doctor-no-contact" : ""}>
                                            {appt.contact || "No contact"}
                                        </td>
                                        <td>{appt.date}</td>
                                        <td>{appt.time}</td>
                                        <td>
                                            <span className={`doctor-status-badge ${appt.status.toLowerCase()}`}>
                                                {appt.status}
                                            </span>
                                        </td>
                                        <button
                                            type="button"
                                            className="table-btn checkup"
                                            title="Doctor Prescription"
                                            onClick={() => openPrescriptionModal(appt)}
                                            disabled={appt.status === "Checked"}
                                        >
                                            <Icon icon="mdi:clipboard-check-outline" />
                                        </button>

                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            {/* Doctor Prescription Modal */}
            {showPrescriptionModal && (
                <div style={{ position: "fixed", inset: 0, zIndex: 99999 }}>
                    <DoctorPrescriptionModal
                        show
                        appointment={selectedAppointment}
                        onClose={closePrescriptionModal}
                        onSubmit={() => {
                            toast.success("Prescription saved");
                            closePrescriptionModal();
                        }}
                    />
                </div>
            )}

        </div>
    );
}