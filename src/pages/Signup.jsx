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
        role_ID: 2
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

        const { name, email, password, role_ID } = formData;

        // Validation
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
                    rid: role_ID || 2
                })
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle specific errors
                if (response.status === 401) {
                    throw new Error("Registration is currently disabled. Please contact an administrator.");
                }
                if (response.status === 422 && data.errors) {
                    const errorMsg = data.errors.map(err => err.msg).join(", ");
                    throw new Error(errorMsg);
                }
                throw new Error(data.message || data.alert || "Signup failed");
            }

            toast.success("Signup successful! Redirecting to login...");

            // Clear form and redirect
            setFormData({
                name: "",
                email: "",
                password: "",
                role_ID: 2
            });

            // Redirect to login after short delay
            setTimeout(() => {
                navigate("/login", { replace: true });
            }, 1500);

        } catch (error) {
            console.error("Signup error:", error);
            toast.error(error.message || "Signup failed. Please try again.");
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
                    placeholder="Full Name (letters only, no spaces)"
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
                            checked={formData.role_ID === 1}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, role_ID: e.target.checked ? 1 : 2 }))
                            }
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
