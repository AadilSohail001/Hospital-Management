import { useState } from 'react';
import { toast } from 'react-toastify';
import { Icon } from '@iconify/react';
import { fetchRegularUsers, updateUser, deleteUser } from '../utils/apiService';
import useDataFetch from '../hooks/useDataFetch';
import Pagination from "../components/Pagination";
import '../styles/Home.css';

export default function Home() {
    const { data: users, loading, error, refetch } = useDataFetch(fetchRegularUsers);

    const [showModal, setShowModal] = useState(false);
    const [editUserId, setEditUserId] = useState(null);
    const [editUser, setEditUser] = useState({
        user_name: "",
        user_email: "",
        user_password: ""
    });

    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 3;
    const lastIndex = currentPage * recordsPerPage;
    const firstIndex = lastIndex - recordsPerPage;
    const paginatedUsers = users.slice(firstIndex, lastIndex);
    const totalPages = Math.ceil(users.length / recordsPerPage);

    async function handleDelete(index) {
        const actualIndex = firstIndex + index;
        const userToDelete = users[actualIndex];
        if (!window.confirm(`Delete ${userToDelete.user_name}?`)) return;

        try {
            await deleteUser(userToDelete.user_Id);
            toast.success("User deleted successfully!");
            await refetch();
            if (paginatedUsers.length === 1 && currentPage > 1) {
                setCurrentPage(prev => Math.max(1, prev - 1));
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    function openEditModal(index) {
        const actualIndex = firstIndex + index;
        const user = users[actualIndex];
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
            // The backend has a bug: it expects oldUserData.password but should expect oldUserData.user_password
            // Until backend is fixed, we need to work around this

            // Option 1: Send minimum valid password (if validation requires it)
            const updateData = {
                name: editUser.user_name,
                email: editUser.user_email,
                password: editUser.user_password || "MinimumPass123!" // Minimum valid password
            };

            console.log("Updating user with data:", updateData);

            // Try to update
            const response = await updateUser(editUserId, updateData);
            console.log("Update response:", response);

            toast.success("User updated successfully!");
            setShowModal(false);
            setEditUserId(null);
            setEditUser({ user_name: "", user_email: "", user_password: "" });
            await refetch();

        } catch (error) {
            console.error("Full update error:", error);

            // Log the actual error response from backend
            if (error.response?.data) {
                console.error("Backend error response:", error.response.data);

                if (error.response.data.errors) {
                    // Show validation errors
                    const validationErrors = error.response.data.errors
                        .map(err => `${err.param}: ${err.msg}`)
                        .join(', ');
                    toast.error(`Validation errors: ${validationErrors}`);
                } else if (error.response.data.alert) {
                    toast.error(`Update failed: ${error.response.data.alert}`);
                } else if (error.response.data.error) {
                    toast.error(`Error: ${JSON.stringify(error.response.data.error)}`);
                }
            } else {
                toast.error(error.message || "Failed to update user");
            }
        }
    }

    if (loading && users.length === 0) return <div style={{ textAlign: "center", padding: "2rem" }}>Loading...</div>;
    if (error && users.length === 0) return <div style={{ textAlign: "center", padding: "2rem", color: "red" }}>Error: {error}</div>;

    return (
        <>
            <h2>Welcome to Our Website</h2>
            <p className="subtitle">Your gateway to awesome content.</p>
            <div className="users-section">
                <h3>Registered Users (Non-Doctors)</h3>
                {users.length === 0 ? (
                    <div className="no-users">
                        <Icon icon="mdi:account-group-off" width="40" height="40" />
                        <p>No regular users registered yet.</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Password</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedUsers.map((user, index) => (
                                    <tr key={user.user_Id || index}>
                                        <td>{user.user_name || "N/A"}</td>
                                        <td>{user.user_email || "N/A"}</td>
                                        <td><span style={{ fontFamily: 'monospace', fontSize: '0.85em' }}>{(user.user_password || "N/A").substring(0, 20)}...</span></td>
                                        <td>
                                            <div className="actionhome-buttons">
                                                <button className="btn-edit" onClick={() => openEditModal(index)} title="Edit"><Icon icon="nimbus:edit" width="16" height="16" /></button>
                                                <button className="btn-delete" onClick={() => handleDelete(index)} title="Delete"><Icon icon="weui:delete-on-filled" width="22" height="22" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPrev={() => currentPage > 1 && setCurrentPage(prev => prev - 1)} onNext={() => currentPage < totalPages && setCurrentPage(prev => prev + 1)} onPageChange={setCurrentPage} />
                    </div>
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
                                placeholder="Name (letters only)"
                                value={editUser.user_name}
                                onChange={(e) => setEditUser({ ...editUser, user_name: e.target.value })}
                                required
                            />
                            <input
                                className='input-a'
                                type="email"
                                placeholder="Email"
                                value={editUser.user_email}
                                onChange={(e) => setEditUser({ ...editUser, user_email: e.target.value })}
                                required
                            />
                            <input
                                className='input-a'
                                type="password"
                                placeholder="New Password (minimum 8 characters)"
                                value={editUser.user_password}
                                onChange={(e) => setEditUser({ ...editUser, user_password: e.target.value })}
                                minLength="8"
                                required
                            />
                            <small style={{ color: '#666', display: 'block', marginBottom: '1rem' }}>
                                Password is required (minimum 8 characters)
                            </small>
                            <div className="modal-buttons">
                                <button type="submit" className="save-btn">Save</button>
                                <button type="button" onClick={() => setShowModal(false)} className="cancel-btn">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}