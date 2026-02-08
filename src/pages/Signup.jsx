import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import MyInput from "../components/MyInputs";
import MyButton from "../components/MyButtons";
import "../styles/Signup.css";
import { postData } from "../utils/apiService";

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

        if (!name || !email || !password) {
            toast.error("All fields are required");
            return;
        }

        const token = localStorage.getItem("token");

        if (!token) {
            toast.error("You are not authorized to perform this action.");
            return;
        }

        try {
            setLoading(true);

            const response = await postData("/users/register", {
                name,
                email,
                password,
                rid: role_ID || 2
            });

            if (response.status !== 200 && response.status !== 201) {
                throw new Error(response.data?.message || "Signup failed");
            }

            toast.success("User registered successfully");

            setFormData({
                name: "",
                email: "",
                password: "",
                role_ID: 2
            });

            navigate("/"); // or wherever admin goes next

        } catch (error) {
            console.error("Signup error:", error);
            toast.error(error.message || "Signup failed");
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
