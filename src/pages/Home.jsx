import { useState } from 'react';
import { toast } from 'react-toastify';
import { Icon } from '@iconify/react';
import { fetchRegularUsers, updateUser, deleteUser } from '../utils/apiService';
import useDataFetch from '../hooks/useDataFetch';
import Pagination from "../components/Pagination";
import '../styles/Home.css';

export default function Home() {
    // Auto-fetch with refresh every 10 seconds + on window focus
    const { data: users, loading, error, refetch } = useDataFetch(fetchRegularUsers, 10000);

    const [showModal, setShowModal] = useState(false);
    const [editUserId, setEditUserId] = useState(null);
    const [editUser, setEditUser] = useState({ user_name: "", user_email: "" });

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
            user_email: user.user_email || ""
        });
        setShowModal(true);
    }

    async function handleUpdate(e) {
        e.preventDefault();
        if (!editUserId) { toast.error("User ID not found"); return; }


        try {
            await updateUser(editUserId, {
                name: editUser.user_name,
                email: editUser.user_email
            });
            toast.success("User updated successfully!");
            setShowModal(false);
            setEditUserId(null);
            await refetch();
        } catch (error) {
            toast.error(error.message);
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
                            <input className='input-a' type="text" placeholder="Name (letters only)" value={editUser.user_name} onChange={(e) => setEditUser({ ...editUser, user_name: e.target.value })} required />
                            <input className='input-a' type="email" placeholder="Email" value={editUser.user_email} onChange={(e) => setEditUser({ ...editUser, user_email: e.target.value })} required />
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