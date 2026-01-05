import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
    // Get user data from appData
    const appData = JSON.parse(localStorage.getItem("appData")) || {};
    const currentUser = appData.currentUser || null;

    // If no user is logged in, redirect to login
    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    return children;
}