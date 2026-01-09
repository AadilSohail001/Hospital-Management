import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import MyInput from "../components/MyInputs";
import MyButton from "../components/MyButtons";
import "../styles/Signup.css";

export default function Signup() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        isDoctor: false
    });

    const [loading, setLoading] = useState(false);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleSignup = async (e) => {
        e.preventDefault();

        const { name, email, password, isDoctor } = formData;

        if (!name || !email || !password) {
            toast.error("All fields are required");
            return;
        }

        try {
            setLoading(true);

            const response = await fetch("http://localhost:8080/hospital/users/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    isDoctor
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Signup failed");
            }

            toast.success("Signup successful! Please login.");
            navigate("/login", { replace: true });

            setFormData({
                name: "",
                email: "",
                password: "",
                isDoctor: false
            });

        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="signup-container">
            <h2>Create Account</h2>

            <form onSubmit={handleSignup}>
                <MyInput
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                />

                <MyInput
                    type="email"
                    name="email"
                    placeholder="Email@xyz.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                />

                <MyInput
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                />

                <div className="checkbox-group">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            name="isDoctor"
                            checked={formData.isDoctor}
                            onChange={handleInputChange}
                        />
                        <span>Register as Doctor</span>
                    </label>
                </div>

                <MyButton
                    title={loading ? "Creating Account..." : "Sign Up"}
                    disabled={loading}
                />
            </form>
        </div>
    );
}
