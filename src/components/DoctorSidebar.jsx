// import { Link, useLocation, useNavigate } from "react-router-dom";
// import { Icon } from "@iconify/react";
// import "./Layout.css";

// export default function DoctorSidebar() {
//     const location = useLocation();
//     const navigate = useNavigate();
//     const currentPath = location.pathname;

//     const handleLogout = () => {
//         localStorage.removeItem("doctorSession");
//         navigate("/doctor-login", { replace: true });
//     };

//     return (
//         <nav className="sidebar-nav">
//             <div className="sidebar-header">
//                 <h2>Doctor Panel</h2>
//             </div>

//             <ul className="nav-menu">

//                 <li>
//                     <Link
//                         to="/doctor-dashboard"
//                         className={currentPath === "/doctor-dashboard"
//                             ? "nav-link active"
//                             : "nav-link"}
//                     >
//                         <Icon icon="mdi:view-dashboard" />
//                         <span>Doctor Dashboard</span>
//                     </Link>
//                 </li>

//                 <li>
//                     <Link
//                         to="/doctor/contact"
//                         className={currentPath === "/doctor/contact"
//                             ? "nav-link active"
//                             : "nav-link"}
//                     >
//                         <Icon icon="mdi:contact-mail" />
//                         <span>Contact Us</span>
//                     </Link>
//                 </li>

//                 <li>
//                     <Link
//                         to="/doctor/about"
//                         className={currentPath === "/doctor/about"
//                             ? "nav-link active"
//                             : "nav-link"}
//                     >
//                         <Icon icon="mdi:information" />
//                         <span>About</span>
//                     </Link>
//                 </li>

//                 <li className="nav-divider"></li>

//                 <li>
//                     <button
//                         onClick={handleLogout}
//                         className="nav-link logout-btn"
//                     >
//                         <Icon icon="mdi:logout" />
//                         <span>Logout</span>
//                     </button>
//                 </li>

//             </ul>
//         </nav>
//     );
// }
