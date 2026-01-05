import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Icon } from '@iconify/react';
import { getLocalStorageData } from '../utils/functions';
import Pagination from "../components/Pagination";
import '../styles/Home.css';

export default function Home() {
    const [users, setUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editIndex, setEditIndex] = useState(null);
    const [editUser, setEditUser] = useState({ name: "", email: "", password: "" });

    // PAGINATION LOGIC
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 3;

    // Load data on component mount - using useCallback to prevent unnecessary re-renders
    const loadUsers = useCallback(() => {
        const storeddata = getLocalStorageData("appData") || {
            users: [],
            currentUser: null
        };

        // Filter out doctors from the users list
        const regularUsers = storeddata.users.filter(user =>
            user.isDoctor !== "1" && user.isDoctor !== true
        );

        return regularUsers;
    }, []);

    // Initialize users on mount
    useEffect(() => {
        const regularUsers = loadUsers();
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUsers(regularUsers);
    }, [loadUsers]);

    // Calculate pagination values
    const lastIndex = currentPage * recordsPerPage;
    const firstIndex = lastIndex - recordsPerPage;
    const paginatedUsers = users.slice(firstIndex, lastIndex);
    const totalPages = Math.ceil(users.length / recordsPerPage);

    // DELETE USER
    function handleDelete(index) {
        const updatedUsers = users.filter((_, i) => i !== index);
        setUsers(updatedUsers);

        // Update localStorage - CORRECTED LOGIC
        const storeddata = getLocalStorageData("appData") || { users: [], currentUser: null };
        const userToDelete = users[index]; // Get the user to delete

        // Find the index in appData.users array
        const userIndexInAppData = storeddata.users.findIndex(u =>
            u.email === userToDelete.email &&
            (u.isDoctor !== "1" && u.isDoctor !== true) // Make sure it's not a doctor
        );

        if (userIndexInAppData !== -1) {
            // Remove from appData
            const updatedAppDataUsers = storeddata.users.filter((_, i) => i !== userIndexInAppData);

            // Also remove from doctors array if somehow marked as doctor
            const doctorsArray = JSON.parse(localStorage.getItem("doctors")) || [];
            const updatedDoctors = doctorsArray.filter(d => d.email !== userToDelete.email);

            // Save both updates
            localStorage.setItem("appData", JSON.stringify({
                ...storeddata,
                users: updatedAppDataUsers
            }));
            localStorage.setItem("doctors", JSON.stringify(updatedDoctors));
        }

        toast("User deleted successfully!");

        // Reset to first page if current page has no users
        if (paginatedUsers.length === 1 && currentPage > 1) {
            setCurrentPage(prev => Math.max(1, prev - 1));
        }
    }

    // OPEN MODAL
    function openEditModal(index) {
        setEditIndex(index);
        setEditUser({ ...users[index] });
        setShowModal(true);
    }

    // UPDATE USER
    function handleUpdate(e) {
        e.preventDefault();
        const updatedUsers = [...users];
        updatedUsers[editIndex] = editUser;
        setUsers(updatedUsers);

        // Update localStorage
        const storeddata = getLocalStorageData("appData") || { users: [], currentUser: null };
        const userToUpdate = users[editIndex];

        // Find the user in appData
        const userIndexInAppData = storeddata.users.findIndex(u =>
            u.email === userToUpdate.email &&
            (u.isDoctor !== "1" && u.isDoctor !== true)
        );

        if (userIndexInAppData !== -1) {
            // Update the user in appData
            const updatedAppDataUsers = [...storeddata.users];
            updatedAppDataUsers[userIndexInAppData] = {
                ...editUser,
                id: storeddata.users[userIndexInAppData].id, // Keep original ID
                isDoctor: "0" // Ensure it's marked as regular user
            };

            // Also check if this user exists in doctors array (shouldn't, but just in case)
            const doctorsArray = JSON.parse(localStorage.getItem("doctors")) || [];
            const doctorIndex = doctorsArray.findIndex(d => d.email === userToUpdate.email);

            if (doctorIndex !== -1) {
                // Remove from doctors array since it's now a regular user
                doctorsArray.splice(doctorIndex, 1);
                localStorage.setItem("doctors", JSON.stringify(doctorsArray));
            }

            localStorage.setItem("appData", JSON.stringify({
                ...storeddata,
                users: updatedAppDataUsers
            }));
        }

        toast("User updated successfully!");
        setShowModal(false);
    }

    const handleNavigation = (direction) => {
        if (direction === 'next' && currentPage < totalPages) {
            setCurrentPage(prev => prev + 1);
        } else if (direction === 'prev' && currentPage > 1) {
            setCurrentPage(prev => prev - 1);
        }
    };

    // Handle page change directly
    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

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
                                    <tr key={index}>
                                        <td>{user.name}</td>
                                        <td>{user.email}</td>
                                        <td>{user.password}</td>
                                        <td>
                                            <div className="actionhome-buttons">
                                                <button
                                                    className="btn-edit"
                                                    onClick={() => openEditModal(index)}
                                                    title="Edit User"
                                                >
                                                    <Icon icon="nimbus:edit" width="16" height="16" />
                                                </button>
                                                <button
                                                    className="btn-delete"
                                                    onClick={() => handleDelete(index)}
                                                    title="Delete User"
                                                >
                                                    <Icon icon="weui:delete-on-filled" width="22" height="22" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPrev={() => handleNavigation("prev")}
                            onNext={() => handleNavigation("next")}
                            onPageChange={handlePageChange}
                        />
                    </div>
                )}
            </div>

            {/* MODAL */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <h2>Edit User: <span className="edit-user-name">{editUser.name}</span></h2>
                        <form onSubmit={handleUpdate} className="modal-form">
                            <input
                                className='input-a'
                                type="text"
                                placeholder="Name"
                                value={editUser.name}
                                onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                                required
                            />
                            <input
                                className='input-a'
                                type="email"
                                placeholder="Email"
                                value={editUser.email}
                                onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                                required
                            />
                            <input
                                className='input-a'
                                type="text"
                                placeholder="Password"
                                value={editUser.password}
                                onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}
                                required
                            />
                            <div className="modal-buttons">
                                <button type="submit" className="save-btn">Save Changes</button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="cancel-btn"
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