import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";
// import Pagination from "../components/Pagination.jsx";
import "../styles/DoctorDashboard.css";

const API_BASE_URL = "http://localhost:8080/hospital";

export default function DoctorDashboard() {
    const navigate = useNavigate();
    const [doctor, setDoctor] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            const stored = localStorage.getItem("currentUser");
            const token = localStorage.getItem("token");
            const currentUser = stored ? JSON.parse(stored) : null;

            if (!currentUser || !token || !(currentUser.role_ID === 1 || currentUser.isDoctor)) {
                navigate("/");
                return;
            }

            try {
                setLoading(true);

                // 1. Fetch Specializations (to map spec_ID to name)
                let specializations = [];
                try {
                    const specRes = await fetch(`${API_BASE_URL}/users/get-doctor-specialities`, {
                        headers: { "Authorization": `Bearer ${token}` }
                    });
                    if (specRes.ok) {
                        specializations = await specRes.json();
                    }
                } catch (err) {
                    console.warn("Failed to fetch specializations", err);
                }

                // 2. Fetch Doctor Profile
                let currentDoctor = null;
                try {
                    const docRes = await fetch(`${API_BASE_URL}/users/show-all-doctors`, {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        }
                    });

                    if (docRes.ok) {
                        const docData = await docRes.json();
                        const allDoctors = Array.isArray(docData) ? docData : docData.users || [];
                        currentDoctor = allDoctors.find(d => d.user_Id === currentUser.id || d.email === currentUser.email);
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
                        specialization: "General"
                    };
                }

                // Resolve specialization name
                let specName = currentDoctor.specialization || currentDoctor.speciality;
                if (currentDoctor.spec_ID && specializations.length > 0) {
                    const s = specializations.find(sp => sp.id === currentDoctor.spec_ID);
                    if (s) specName = s.speciality;
                }

                setDoctor({
                    ...currentDoctor,
                    name: currentDoctor.user_name || currentDoctor.name,
                    specialization: specName || "General"
                });

                // 3. Fetch Appointments
                try {
                    const apptRes = await fetch(`${API_BASE_URL}/appointments/show-appointments`, {
                        headers: { "Authorization": `Bearer ${token}` }
                    });

                    if (apptRes.ok) {
                        const apptData = await apptRes.json();
                        const allAppts = Array.isArray(apptData) ? apptData : apptData.appointments || [];

                        // Filter appointments for this doctor
                        const myAppts = allAppts.filter(a =>
                            a.doctor_id === currentDoctor.user_Id ||
                            a.doctorId === currentDoctor.user_Id
                        );

                        // Map to display format
                        const formattedAppts = myAppts.map(a => ({
                            id: a.id || a.appointment_id,
                            patientName: a.patient_name || a.patientName || "Unknown",
                            contact: a.contact || a.patient_contact || "N/A",
                            date: a.date || a.appointment_date,
                            time: a.time || a.appointment_time,
                            status: a.status || "Pending"
                        }));

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
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}