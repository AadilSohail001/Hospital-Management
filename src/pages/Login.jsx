import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import MyInput from "../components/MyInputs";
import MyButton from "../components/MyButtons";
import "../styles/Login.css";

export default function Login() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const [loading, setLoading] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        const { email, password } = formData;

        if (!email || !password) {
            toast.error("All fields are required");
            return;
        }

        try {
            setLoading(true);

            const response = await fetch("http://localhost:8080/hospital/users/login-user", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Login failed");
            }

            // Store auth data
            localStorage.setItem("token", data.token);
            localStorage.setItem("currentUser", JSON.stringify(data.user));

            toast.success("Login successful");

            setFormData({
                email: "",
                password: ""
            });

            // Redirect based on role
            if (data.user.isDoctor) {
                navigate("/doctor-dashboard", { replace: true });
            } else {
                navigate("/", { replace: true });
            }

        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <h2>Login</h2>

            <form onSubmit={handleLogin}>
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

                <MyButton
                    title={loading ? "Logging in..." : "Log In"}
                    disabled={loading}
                />
            </form>
        </div>
    );
}
