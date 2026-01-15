// import { Navigate } from "react-router-dom";

// export default function ProtectedRoute({ children }) {
//     // Get user data from appData
//     const appData = JSON.parse(localStorage.getItem("appData")) || {};
//     const currentUser = appData.currentUser || null;

//     // If no user is logged in, redirect to login
//     if (!currentUser) {
//         return <Navigate to="/login" replace />;
//     }

//     return children;
// }

import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles }) {
    const token = localStorage.getItem("token");

    let user = null;
    try {
        const storedUser = localStorage.getItem("currentUser");
        user = storedUser ? JSON.parse(storedUser) : null;
        // eslint-disable-next-line no-unused-vars
    } catch (error) {
        console.error("Invalid user data in localStorage");
        user = null;
    }

    // Not authenticated
    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    // Role-based access
    if (allowedRoles && !allowedRoles.includes(user.role_ID)) {
        return <Navigate to="/" replace />;
    }

    return children;
}

