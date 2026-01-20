import { Icon } from "@iconify/react";
import { NavLink, useNavigate } from "react-router-dom";

export default function Sidebar() {
    const navigate = useNavigate();

    const getCurrentUser = () => {
        try {
            const stored = localStorage.getItem("currentUser");
            return stored ? JSON.parse(stored) : null;
            // eslint-disable-next-line no-unused-vars
        } catch (err) {
            return null;
        }
    };

    const user = getCurrentUser();

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("currentUser");
        navigate("/login", { replace: true });
    };

    if (!user) {
        return null;
    }

    const isDoctor = user.role_ID === 1 || user.isDoctor === true || user.isDoctor === "1";

    return (
        <aside className="sidebar">
            <h2 className="sidebar-title">Dashboard</h2>

            <ul className="nav-list">
                {isDoctor ? (
                    // DOCTOR LINKS - Only 3 options
                    <>
                        <li>
                            <NavLink
                                to="/doctor-dashboard"
                                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                            >
                                <Icon icon="mdi:doctor" />
                                <span>Doctor Dashboard</span>
                            </NavLink>
                        </li>

                        <li>
                            <NavLink
                                to="/about"
                                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                            >
                                <Icon icon="mdi:information" />
                                <span>About</span>
                            </NavLink>
                        </li>

                        <li>
                            <NavLink
                                to="/contact"
                                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                            >
                                <Icon icon="mdi:contact-mail" />
                                <span>Contact Us</span>
                            </NavLink>
                        </li>
                    </>
                ) : (
                    // USER LINKS
                    <>
                        <li>
                            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                                <Icon icon="mdi:home" />
                                <span>Home</span>
                            </NavLink>
                        </li>

                        <li>
                            <NavLink to="/patients" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                                <Icon icon="mdi:account-group" />
                                <span>Patients</span>
                            </NavLink>
                        </li>

                        <li>
                            <NavLink to="/doctors" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                                <Icon icon="mdi:doctor" />
                                <span>Doctors</span>
                            </NavLink>
                        </li>

                        <li>
                            <NavLink to="/appointment" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                                <Icon icon="mdi:calendar" />
                                <span>Appointments</span>
                            </NavLink>
                        </li>

                        <li>
                            <NavLink to="/about" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                                <Icon icon="mdi:information" />
                                <span>About</span>
                            </NavLink>
                        </li>

                        <li>
                            <NavLink to="/contact" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                                <Icon icon="mdi:contact-mail" />
                                <span>Contact Us</span>
                            </NavLink>
                        </li>

                        <li>
                            <NavLink to="/signup" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                                <Icon icon="mdi:register" />
                                <span>Sign Up</span>
                            </NavLink>
                        </li>
                    </>
                )}

                {/* LOGOUT BUTTON */}
                <li>
                    <button onClick={handleLogout} className="nav-link logout-btn">
                        <Icon icon="mdi:logout" />
                        <span>Logout</span>
                    </button>
                </li>
            </ul>
        </aside>
    );
}