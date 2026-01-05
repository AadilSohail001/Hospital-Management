import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Patients from "./pages/Patients";
import Doctors from "./pages/Doctors";
import Appointment from "./pages/Appointment";
import DoctorDashboard from "./pages/DoctorDashboard";

function App() {
  return (
    <Routes>
      {/* ========== PUBLIC AUTH ROUTES ========== */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* ========== PROTECTED ROUTES ========== */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* User Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/appointment" element={<Appointment />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />

        {/* Doctor Routes */}
        <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
      </Route>
    </Routes>
  );
}

export default App;