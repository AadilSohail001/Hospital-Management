import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
// import Pagination from "../components/Pagination.jsx";
import "../styles/DoctorDashboard.css";

export default function DoctorDashboard() {
    const navigate = useNavigate();
    const [doctor, setDoctor] = useState(null);
    const [appointments, setAppointments] = useState([]);

    useEffect(() => {
        const appData = JSON.parse(localStorage.getItem("appData")) || {};
        const currentUser = appData.currentUser;


        if (!currentUser || !currentUser.isDoctor) {
            navigate("/");
            return;
        }

        // Get doctor's full details from doctors array
        const doctorsData = JSON.parse(localStorage.getItem("doctors")) || [];
        const currentDoctor = doctorsData.find(d => d.email === currentUser.email);

        if (!currentDoctor) {
            alert("Doctor details not found!");
            navigate("/");
            return;
        }

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDoctor(currentDoctor);

        // Get appointments and filter by this doctor
        const allAppointments = JSON.parse(localStorage.getItem("appointments")) || [];

        // Logs for debugging
        // console.log("Current Doctor:", currentDoctor);
        // console.log("All Appointments:", allAppointments);
        const myAppointments = allAppointments.filter(appt => {
            // Match by doctorId (primary)
            if (appt.doctorId == currentDoctor.id) {
                // console.log("Matched by ID:", appt);
                return true;
            }

            if (appt.doctorEmail && appt.doctorEmail === currentDoctor.email) {
                // console.log("Matched by Email:", appt);
                return true;
            }

            if (appt.doctorName && appt.doctorName.includes(currentDoctor.name)) {
                // console.log("Matched by Name:", appt);
                return true;
            }
            return false;
        });

        // console.log("My Appointments:", myAppointments);
        setAppointments(myAppointments);
    }, [navigate]);


    const updateAppointmentDoctorId = () => {
        const allAppointments = JSON.parse(localStorage.getItem("appointments")) || [];
        const doctorsData = JSON.parse(localStorage.getItem("doctors")) || [];
        const appData = JSON.parse(localStorage.getItem("appData")) || {};
        const currentUser = appData.currentUser;

        if (!currentUser || !currentUser.isDoctor) return;

        const currentDoctor = doctorsData.find(d => d.email === currentUser.email);
        if (!currentDoctor) return;


        const updatedAppointments = allAppointments.map(appt => {
            if (appt.doctorName && appt.doctorName.includes(currentDoctor.name)) {
                return {
                    ...appt,
                    doctorId: currentDoctor.id,
                    doctorEmail: currentDoctor.email
                };
            }
            return appt;
        });

        localStorage.setItem("appointments", JSON.stringify(updatedAppointments));
        // console.log("Updated appointments:", updatedAppointments);
    };

    if (!doctor) {
        return <div>Loading...</div>;
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
                        <button
                            onClick={updateAppointmentDoctorId}
                            className="sync-btn"
                            style={{
                                marginLeft: '10px',
                                padding: '5px 10px',
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Sync Appointments
                        </button>
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
                        <p style={{ color: 'red', marginTop: '10px' }}>
                            <strong>Info:</strong> Doctor ID: {doctor.id}, Doctor Name: {doctor.name}
                        </p>
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