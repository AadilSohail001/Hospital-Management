import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import MyInput from "../components/MyInputs";
import MyButton from "../components/MyButtons";
import "../styles/Login.css";
import { postData } from "../utils/apiService";

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

            const response = await postData("/users/login-user", { email, password });

            if (response.status !== 200 && response.status !== 202) {
                throw new Error(response.data?.message || "Login failed");
            }
            const data = response.data;

            // Store token
            localStorage.setItem("token", data.token);

            // Decode JWT payload to extract user info (don't store password)
            const decodeToken = (token) => {
                try {
                    const payload = token.split('.')[1];
                    let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
                    while (base64.length % 4) base64 += '=';
                    const jsonPayload = atob(base64);
                    return JSON.parse(jsonPayload);
                } catch (err) {
                    console.error('Failed to decode token', err);
                    return null;
                }
            };

            const payload = decodeToken(data.token);
            const userFromToken = payload
                ? {
                    id: payload.id ?? payload.user_id ?? payload.userId,
                    role_ID: payload.role_id ?? payload.role_ID ?? payload.roleId,
                    email: payload.email,
                    name: payload.name || payload.user_name || payload.sub,
                    speciality: data.speciality || data.specialization,
                    doc_id: data.doc_id
                }
                : null;

            if (userFromToken) {
                localStorage.setItem("currentUser", JSON.stringify(userFromToken));
            }

            toast.success("Login successful");

            setFormData({ email: "", password: "" });

            // Redirect based on role (mapped from token)
            const role = userFromToken?.role_ID;
            if (role === 1) {
                navigate("/doctor-dashboard", { replace: true });
            } else if (role === 2) {
                navigate("/", { replace: true });
            } else {
                toast.error("Invalid user role");
            }
            // if (data.user.role_ID === 2) { // Assuming 2 is the role ID for doctors
            //     navigate("/doctor-dashboard", { replace: true });
            // } else {
            //     navigate("/", { replace: true });
            // }

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
