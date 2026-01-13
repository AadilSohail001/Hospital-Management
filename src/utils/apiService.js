/**
 * API Service for CRUD operations with the backend
 * Handles all database operations and returns fresh data
 */

const API_BASE_URL = "http://localhost:8080/hospital";

// Helper to get JWT token
const getToken = () => localStorage.getItem("token");

// Helper to get auth headers
const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${getToken()}`
});

/**
 * Fetch all users from database
 * @returns {Promise<Array>} Array of users with all fields
 */

export const fetchAllUsers = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/users/show-all`, {
            method: "GET",
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch users: ${response.statusText}`);
        }

        const data = await response.json();
        return data.users || data.data || data || [];
    } catch (error) {
        console.error("Error fetching users:", error);
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
        console.error("Error fetching doctors:", error);
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
        console.error("Error fetching regular users:", error);
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

        const response = await fetch(`${API_BASE_URL}/users/update-user/${userId}`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(updateData)
        });

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.alert || responseData.message || "Update failed");
        }

        return responseData;
    } catch (error) {
        console.error("Error updating user:", error);
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

        const response = await fetch(`${API_BASE_URL}/users/delete-user/${userId}`, {
            method: "POST",
            headers: getAuthHeaders()
        });

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.message || "Delete failed");
        }

        return responseData;
    } catch (error) {
        console.error("Error deleting user:", error);
        throw error;
    }
};

/**
 * Create a new user (register)
 * NOTE: Backend register route requires authorization. 
 * Only admins/authenticated users can create new users.
 * @param {Object} userData - User data (name, email, password, rid)
 * @returns {Promise<Object>} Response from backend
 */
export const createUser = async (userData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/users/register`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(userData)
        });

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.message || "Registration failed");
        }

        return responseData;
    } catch (error) {
        console.error("Error creating user:", error);
        throw error;
    }
};

export default {
    fetchAllUsers,
    fetchAllDoctors,
    fetchRegularUsers,
    updateUser,
    deleteUser,
    createUser
};
