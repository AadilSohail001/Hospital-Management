import { useState } from 'react';
import MyInput from '../components/MyInputs';
import MyButton from '../components/MyButtons';
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import '../styles/Signup.css';

export default function Signup() {
    const navigate = useNavigate();

    // State for form fields
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        isDoctor: false
    });

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    function handleSignup(e) {
        e.preventDefault();

        const { name, email, password, isDoctor } = formData;

        if (!name || !email || !password) {
            alert("Please fill all required fields");
            return;
        }

        // Get or initialize appData
        let appData = localStorage.getItem("appData");
        try {
            appData = JSON.parse(appData) || { users: [], currentUser: null };
        } catch {
            appData = { users: [], currentUser: null };
        }

        // Get or initialize doctors data
        let doctorsData = localStorage.getItem("doctors");
        try {
            doctorsData = JSON.parse(doctorsData) || [];
        } catch {
            doctorsData = [];
        }

        // Check if user already exists
        const userExists = appData.users.some(user => user.email === email);
        if (userExists) {
            alert("User already exists!");
            return;
        }

        // Create user object
        const userObj = {
            id: Date.now().toString(),
            name,
            email,
            password,
            isDoctor: isDoctor ? "1" : "0"
        };

        if (isDoctor) {
            const doctorObj = {
                ...userObj,
                isDoctor: "1",
                specialization: "To be added",
                contact: "To be added"
            };

            doctorsData.push(doctorObj);
            appData.users.push(doctorObj);
        } else {
            appData.users.push(userObj);
        }

        // Save to localStorage
        localStorage.setItem("appData", JSON.stringify(appData));
        if (isDoctor) {
            localStorage.setItem("doctors", JSON.stringify(doctorsData));
        }

        toast.success("Signup successful! Please login now.");
        navigate("/login", { replace: true });

        // Reset form
        setFormData({
            name: '',
            email: '',
            password: '',
            isDoctor: false
        });
    }

    return (
        <div className='signup-container'>
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
                        <span>Register as a Doctor</span>
                    </label>
                </div>

                <MyButton title="Sign Up" />
            </form>
        </div>
    );
}