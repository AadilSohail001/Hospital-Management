import axios from 'axios';

const API_BASE_URL = "http://localhost:8080/hospital";

// Create axios instance with base configuration
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json"
    }
});

// Add request interceptor to attach token
api.interceptors.request.use(
    config => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => Promise.reject(error)
);

// Add response interceptor for error handling
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            // Token expired or invalid - user should re-login
            localStorage.removeItem("token");
            localStorage.removeItem("currentUser");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

export const getData = async (url) => {
    const response = await api.get(url);
    return response;
}

export const postData = async (url, data) => {
    const response = await api.post(url, data);
    return response;
}

/**
 * Fetch all users from database
 * @returns {Promise<Array>} Array of users with all fields
 */
export const fetchAllUsers = async () => {
    try {
        const response = await api.get("/users/show-all");
        return response.data.users || response.data.data || response.data || [];
    } catch (error) {
        console.error("Error fetching users:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Fetch all doctors from database (filtered role === "doctor")
 * @returns {Promise<Array>} Array of doctor users
 */
export const fetchAllDoctors = async () => {
    try {
        const allUsers = await fetchAllUsers();
        return allUsers.filter(user => user.role === "doctor" || user.role === "Doctor");
    } catch (error) {
        console.error("Error fetching doctors:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Fetch all non-doctor users (regular users/patients)
 * @returns {Promise<Array>} Array of regular users
 */
export const fetchRegularUsers = async () => {
    try {
        const allUsers = await fetchAllUsers();
        const currentUserStr = localStorage.getItem("currentUser");
        const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
        const currentUserId = currentUser?.user_Id;

        return allUsers.filter(user =>
            (user.role !== "doctor" && user.role !== "Doctor") && // Not a doctor
            user.user_Id !== currentUserId // Not the current logged-in user
        );
    } catch (error) {
        console.error("Error fetching regular users:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Update a user in the database
 * @param {number} userId - User ID to update
 * @param {Object} updateData - Data to update (name, email, password optional)
 * @returns {Promise<Object>} Response from backend
 */
export const updateUser = async (userId, updateData) => {
    try {
        if (!userId) {
            throw new Error("User ID is required");
        }

        const response = await api.post(`/users/update-user/${userId}`, updateData);
        return response.data;
    } catch (error) {
        console.error("Error updating user:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Delete a user from the database
 * @param {number} userId - User ID to delete
 * @returns {Promise<Object>} Response from backend
 */
export const deleteUser = async (userId) => {
    try {
        if (!userId) {
            throw new Error("User ID is required");
        }

        const response = await api.post(`/users/delete-user/${userId}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting user:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Create a new user (register)
 * NOTE: Backend register route may require authorization depending on configuration.
 * @param {Object} userData - User data (name, email, password, rid)
 * @returns {Promise<Object>} Response from backend
 */
export const createUser = async (userData) => {
    try {
        const response = await api.post(`/users/register`, userData);
        return response.data;
    } catch (error) {
        console.error("Error creating user:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Fetch all patients from database
 * @returns {Promise<Array>} Array of patients
 */
export const fetchAllPatients = async () => {
    try {
        const response = await api.get("/patients/show-patients");
        return Array.isArray(response.data) ? response.data : response.data.patients || [];
    } catch (error) {
        console.error("Error fetching patients:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Create a new patient
 * @param {Object} patientData - Patient data (p_name, p_condition, p_contact)
 * @returns {Promise<Object>} Response from backend
 */
export const createPatient = async (patientData) => {
    try {
        const response = await api.post(`/patients/register-patient`, patientData);
        return response.data;
    } catch (error) {
        console.error("Error creating patient:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Update a patient in the database
 * @param {number} patientId - Patient ID to update
 * @param {Object} updateData - Data to update (p_name, p_condition, p_contact)
 * @returns {Promise<Object>} Response from backend
 */
export const updatePatient = async (patientId, updateData) => {
    try {
        if (!patientId) {
            throw new Error("Patient ID is required");
        }

        const response = await api.post(`/patients/update-patient/${patientId}`, updateData);
        return response.data;
    } catch (error) {
        console.error("Error updating patient:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Delete a patient from the database
 * @param {number} patientId - Patient ID to delete
 * @returns {Promise<Object>} Response from backend
 */
export const deletePatient = async (patientId) => {
    try {
        if (!patientId) {
            throw new Error("Patient ID is required");
        }

        const response = await api.post(`/patients/delete-patient/${patientId}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting patient:", error.response?.data || error.message);
        throw error;
    }
};

export default {
    fetchAllUsers,
    fetchAllDoctors,
    fetchRegularUsers,
    updateUser,
    deleteUser,
    createUser,
    fetchAllPatients,
    createPatient,
    updatePatient,
    deletePatient
};
