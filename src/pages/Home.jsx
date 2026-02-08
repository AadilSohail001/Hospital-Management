import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Icon } from '@iconify/react';
import { getData, updateUser, deleteUser } from '../utils/apiService';
import Pagination from "../components/Pagination";
import '../styles/Home.css';

export default function Home() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const recordsPerPage = 5;

    // Load users from backend
    const loadUsers = async (page = "firstPage") => {
        setLoading(true);
        try {

            // Build the URL based on page parameter
            let url = '/users/show-all';
            if (page && page !== "firstPage") {
                url += `?page=${page}`;
            }

            const response = await getData(url);

            if (response.status === 200) {
                const data = response.data;

                if (data && data.allUsers && Array.isArray(data.allUsers)) {
                    setUsers(data.allUsers);

                    // Set pagination values
                    setCurrentPage(Number(data.currentPage) || 1);
                    setTotalUsers(Number(data.totalUsers) || 0);

                    // Calculate total pages
                    const calculatedTotalPages = Math.ceil(Number(data.totalUsers) / recordsPerPage);
                    setTotalPages(calculatedTotalPages > 0 ? calculatedTotalPages : 1);

                } else {
                    setUsers([]);
                    setTotalUsers(0);
                    setTotalPages(0);
                    toast.info("No users found");
                }
            } else {
                setUsers([]);
                toast.error("Failed to load users");
            }
        } catch (error) {
            console.error("Error fetching users:", error);

            // More detailed error logging
            if (error.response) {

                if (error.response.status === 404) {
                    toast.error("Users endpoint not found. Check the API URL.");
                } else if (error.response.status === 500) {
                    toast.error("Server error. Please try again later.");
                }
            } else if (error.request) {
                console.error("No response received:", error.request);
                toast.error("No response from server. Check your connection.");
            } else {
                toast.error("Error loading users: " + error.message);
            }

            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers("firstPage");
    }, []);

    const [showModal, setShowModal] = useState(false);
    const [editUserId, setEditUserId] = useState(null);
    const [editUser, setEditUser] = useState({
        user_name: "",
        user_email: "",
        user_password: ""
    });

    async function handleDelete(index) {
        const userToDelete = users[index];
        if (!window.confirm(`Are you sure you want to delete ${userToDelete.user_name}?`)) return;

        try {
            await deleteUser(userToDelete.user_Id);
            toast.success("User deleted successfully!");

            // Handle pagination after deletion
            if (users.length === 1 && currentPage > 1) {
                await loadUsers(currentPage - 1);
            } else {
                await loadUsers(currentPage);
            }
        } catch (error) {
            console.error("Delete error:", error);
            toast.error(error.message || "Failed to delete user");
        }
    }

    function openEditModal(index) {
        const user = users[index];
        setEditUserId(user.user_Id);
        setEditUser({
            user_name: user.user_name || "",
            user_email: user.user_email || "",
            user_password: "" // Start with empty password field
        });
        setShowModal(true);
    }

    async function handleUpdate(e) {
        e.preventDefault();
        if (!editUserId) {
            toast.error("User ID not found");
            return;
        }

        try {
            // Check if password meets minimum requirements
            if (editUser.user_password && editUser.user_password.length < 8) {
                toast.error("Password must be at least 8 characters long");
                return;
            }

            // If password is empty, don't include it in the update
            const updateData = {
                name: editUser.user_name,
                email: editUser.user_email
            };

            // Only add password if it's provided
            if (editUser.user_password.trim() !== "") {
                updateData.password = editUser.user_password;
            }

            await updateUser(editUserId, updateData);

            toast.success("User updated successfully!");
            setShowModal(false);
            setEditUserId(null);
            setEditUser({ user_name: "", user_email: "", user_password: "" });
            await loadUsers(currentPage);

        } catch (error) {
            console.error("Full update error:", error);

            if (error.response?.data) {

                if (error.response.data.errors) {
                    const validationErrors = error.response.data.errors
                        .map(err => `${err.param}: ${err.msg}`)
                        .join(', ');
                    toast.error(`Validation errors: ${validationErrors}`);
                } else if (error.response.data.alert) {
                    toast.error(`Update failed: ${error.response.data.alert}`);
                } else if (error.response.data.error) {
                    toast.error(`Error: ${JSON.stringify(error.response.data.error)}`);
                } else if (error.response.data.message) {
                    toast.error(`Error: ${error.response.data.message}`);
                }
            } else {
                toast.error(error.message || "Failed to update user");
            }
        }
    }

    const handlePrevPage = () => {
        if (currentPage > 1) {
            const newPage = currentPage - 1;
            loadUsers(newPage);
        }
    };

    const handleNextPage = () => {

        if (currentPage < totalPages) {
            const newPage = currentPage + 1;
            loadUsers(newPage);
        }
    };

    return (
        <>
            <h2>Welcome to Our Website</h2>
            <p className="subtitle">Your gateway to awesome content.</p>
            <div className="users-section">
                <h3>Registered Users (Non-Doctors)</h3>

                {loading ? (
                    <div style={{ textAlign: "center", padding: "2rem" }}>
                        <Icon icon="eos-icons:loading" width="40" height="40" />
                        <p>Loading users...</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className="no-users">
                        <Icon icon="mdi:account-group-off" width="40" height="40" />
                        <p>No regular users registered yet.</p>
                        <button
                            onClick={() => loadUsers("firstPage")}
                            style={{ marginTop: '1rem' }}
                            className="save-btn"
                        >
                            Refresh Users
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="table-responsive">
                            <table className="users-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Password Hash</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user, index) => (
                                        <tr key={user.user_Id || index}>
                                            <td>{user.user_Id}</td>
                                            <td>{user.user_name}</td>
                                            <td>{user.user_email}</td>
                                            <td>
                                                <span className={`role-badge ${user.role === 'admin' ? 'admin' : 'user'}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{
                                                    fontFamily: 'monospace',
                                                    fontSize: '0.75em',
                                                    color: '#666',
                                                    wordBreak: 'break-all'
                                                }}>
                                                    {user.user_password.substring(0, 25)}...
                                                </span>
                                            </td>
                                            <td>
                                                <div className="actionhome-buttons">
                                                    <button
                                                        className="btn-edit"
                                                        onClick={() => openEditModal(index)}
                                                        title="Edit"
                                                        disabled={user.role === 'admin'} // Disable edit for admin
                                                    >
                                                        <Icon icon="nimbus:edit" width="16" height="16" />
                                                    </button>
                                                    <button
                                                        className="btn-delete"
                                                        onClick={() => handleDelete(index)}
                                                        title="Delete"
                                                        disabled={user.role === 'admin'} // Disable delete for admin
                                                    >
                                                        <Icon icon="weui:delete-on-filled" width="22" height="22" />
                                                    </button>
                                                </div>
                                                {user.role === 'admin' && (
                                                    <small style={{ color: '#999', fontSize: '0.7em', display: 'block' }}>
                                                        Admin users cannot be edited/deleted
                                                    </small>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination - Only show if there are multiple pages */}
                        {users.length > 0 && totalPages > 1 && (
                            <div style={{ marginTop: '20px' }}>
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPrev={handlePrevPage}
                                    onNext={handleNextPage}
                                />
                                <div style={{
                                    textAlign: 'center',
                                    marginTop: '10px',
                                    color: '#666',
                                    fontSize: '0.9em'
                                }}>
                                    Showing {users.length} of {totalUsers} users
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <h2>Edit User: <span className="edit-user-name">{editUser.user_name}</span></h2>
                        <form onSubmit={handleUpdate} className="modal-form">
                            <input
                                className='input-a'
                                type="text"
                                placeholder="Name"
                                value={editUser.user_name}
                                onChange={(e) => setEditUser({ ...editUser, user_name: e.target.value })}
                                required
                                disabled={loading}
                            />
                            <input
                                className='input-a'
                                type="email"
                                placeholder="Email"
                                value={editUser.user_email}
                                onChange={(e) => setEditUser({ ...editUser, user_email: e.target.value })}
                                required
                                disabled={loading}
                            />
                            <input
                                className='input-a'
                                type="password"
                                placeholder="New Password (optional, min 8 chars)"
                                value={editUser.user_password}
                                onChange={(e) => setEditUser({ ...editUser, user_password: e.target.value })}
                                minLength="8"
                                disabled={loading}
                            />
                            <small style={{ color: '#666', display: 'block', marginBottom: '1rem' }}>
                                Leave password empty to keep current password
                            </small>
                            <div className="modal-buttons">
                                <button
                                    type="submit"
                                    className="save-btn"
                                    disabled={loading}
                                >
                                    {loading ? "Saving..." : "Save"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="cancel-btn"
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}