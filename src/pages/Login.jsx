import { useState } from 'react';
import MyInput from '../components/MyInputs';
import MyButton from '../components/MyButtons';
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import '../styles/Login.css';

export default function Login() {
    const navigate = useNavigate();

    // State for form fields
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    function handleLogin(e) {
        e.preventDefault();

        const { email, password } = formData;

        if (!email || !password) {
            alert("Please fill all fields");
            return;
        }

        // Get all data
        const appData = JSON.parse(localStorage.getItem("appData")) || {
            users: [],
            currentUser: null
        };

        const doctorsData = JSON.parse(localStorage.getItem("doctors")) || [];

        // Check in all users (including doctors)
        let foundUser = null;
        let isUserDoctor = false;

        for (let i = 0; i < appData.users.length; i++) {
            const user = appData.users[i];
            if (user.email === email && user.password === password) {
                foundUser = user;
                // Check if it's a doctor
                isUserDoctor = user.isDoctor === "1";
                break;
            }
        }

        if (!foundUser) {
            for (let i = 0; i < doctorsData.length; i++) {
                const user = doctorsData[i];
                if (user.email === email && user.password === password) {
                    foundUser = user;
                    isUserDoctor = "1";
                    break;
                }
            }
        }

        if (!foundUser) {
            alert("Invalid email or password");
            return;
        }

        // Update appData with current user
        appData.currentUser = {
            id: foundUser.id,
            name: foundUser.name,
            email: foundUser.email,
            password: foundUser.password,
            isDoctor: isUserDoctor ? "1" : "0",
            specialization: foundUser.specialization,
            contact: foundUser.contact
        };

        if (isUserDoctor) {
            const doctorExists = doctorsData.some(doc => doc.email === email);
            if (!doctorExists) {
                doctorsData.push({
                    id: foundUser.id,
                    name: foundUser.name,
                    email: foundUser.email,
                    password: foundUser.password,
                    specialization: foundUser.specialization,
                    contact: foundUser.contact,
                    isDoctor: "1"
                });
                localStorage.setItem("doctors", JSON.stringify(doctorsData));
            }
        }

        // Save to localStorage
        localStorage.setItem("appData", JSON.stringify(appData));

        console.log("Login successful! User:", appData.currentUser);
        console.log("Is doctor?", isUserDoctor);

        toast.success("Login successful!");

        // Reset form
        setFormData({
            email: '',
            password: ''
        });

        // Redirect based on user type
        if (isUserDoctor) {
            // console.log("Redirecting to /doctor-dashboard");
            navigate("/doctor-dashboard", { replace: true });
        } else {
            // console.log("Redirecting to /");
            navigate("/", { replace: true });
        }
    }

    return (
        <div className='login-container'>
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
                <MyInput
                    type='email'
                    name='email'
                    placeholder='Email@xyz.com'
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                />
                <MyInput
                    type='password'
                    name='password'
                    placeholder='Password'
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                />
                <MyButton title="Log In" />
            </form>
        </div>
    );
}