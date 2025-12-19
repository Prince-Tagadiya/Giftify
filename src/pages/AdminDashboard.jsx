import React, { useEffect, useState } from 'react'
import { Link } from 'wouter'
import { Link as LinkIcon, Shield, ArrowLeft, RefreshCw, Trash2, User } from 'lucide-react'
import { useToast } from '../components/ToastContext'
import DashboardLayout from '../components/DashboardLayout'

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { collection, getDocs } = await import('firebase/firestore');
            const { db } = await import('../firebase');
            
            const fetchPromise = getDocs(collection(db, "users"));
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000));
            
            const querySnapshot = await Promise.race([fetchPromise, timeoutPromise]);
            
            const usersList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            setUsers(usersList);
            setLoading(false);
        } catch (err) {
            console.error("Fetch error:", err);
            addToast("Failed to load users", 'error');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleRoleChange = async (userId, newRole) => {
        if (!confirm(`Change role to ${newRole}?`)) return;

        try {
            const { doc, updateDoc } = await import('firebase/firestore');
            const { db } = await import('../firebase');
            
            await updateDoc(doc(db, "users", userId), { role: newRole });
            
            fetchUsers();
            addToast(`Role updated to ${newRole}`, 'success');
        } catch (error) {
            addToast('Error updating role', 'error');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!confirm("Are you sure you want to DELETE this user? This action cannot be undone.")) return;

        try {
            const { doc, deleteDoc } = await import('firebase/firestore');
            const { db } = await import('../firebase');
            
            await deleteDoc(doc(db, "users", userId));
            
            fetchUsers();
            addToast('User deleted successfully', 'success');
        } catch (error) {
            console.error("Delete error", error);
            addToast('Error deleting user', 'error');
        }
    };

    const handleVerifyUser = async (userId, currentStatus) => {
        try {
            const { doc, updateDoc } = await import('firebase/firestore');
            const { db } = await import('../firebase');
            
            await updateDoc(doc(db, "users", userId), { verified: !currentStatus });
            
            fetchUsers();
            addToast(`User ${!currentStatus ? 'verified' : 'unverified'}`, 'success');
        } catch (error) {
            console.error("Verify error", error);
            addToast('Error updating verification', 'error');
        }
    };

    const fans = users.filter(u => u.role === 'fan');
    const creators = users.filter(u => u.role === 'creator');

    return (
        <DashboardLayout role="admin">
            {/* Header Stats */}
            <div className="flex justify-between items-center mb-8">
                 <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 w-full md:w-auto">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                        <User size={24} />
                    </div>
                    <div>
                        <div className="text-slate-500 text-xs font-bold uppercase">Total Users</div>
                        <div className="text-2xl font-extrabold text-slate-800">{users.length}</div>
                    </div>
                 </div>
            </div>

            <div className="space-y-8">
                {/* Creators Section */}
                <UserTable 
                    title="Creators" 
                    users={creators} 
                    icon="🦁" 
                    color="text-emerald-600"
                    bgColor="bg-emerald-50"
                    onRoleChange={handleRoleChange}
                    onDelete={handleDeleteUser}
                    onVerify={handleVerifyUser}
                    targetRole="fan"
                    showVerify={true}
                />

                {/* Fans Section */}
                <UserTable 
                    title="Fans" 
                    users={fans} 
                    icon="🦄" 
                    color="text-blue-600" 
                    bgColor="bg-blue-50"
                    onRoleChange={handleRoleChange}
                    onDelete={handleDeleteUser}
                    targetRole="creator"
                />
            </div>
        </DashboardLayout>
    )
}

const UserTable = ({ title, users, icon, color, bgColor, onRoleChange, onDelete, onVerify, targetRole, showVerify }) => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span>{icon}</span> {title}
                <span className="text-sm bg-slate-100 text-slate-500 px-2 py-1 rounded-full">{users.length}</span>
            </h2>
        </div>

        {users.length === 0 ? (
            <p className="text-center py-12 text-slate-400">No {title.toLowerCase()} found.</p>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-100">
                            <th className="p-4 font-bold">Name</th>
                            <th className="p-4 font-bold">Email</th>
                            <th className="p-4 font-bold">Role</th>
                            {showVerify && <th className="p-4 font-bold">Verified</th>}
                            <th className="p-4 font-bold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 font-bold text-slate-700">{user.firstName} {user.lastName}</td>
                                <td className="p-4 text-slate-500 text-sm">{user.email}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase ${bgColor} ${color}`}>
                                        {user.role}
                                    </span>
                                </td>
                                {showVerify && (
                                    <td className="p-4">
                                        <button 
                                            onClick={() => onVerify(user.id, user.verified)}
                                            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${user.verified ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}
                                        >
                                            {user.verified ? 'Verified' : 'Unverified'}
                                        </button>
                                    </td>
                                )}
                                <td className="p-4 text-right flex justify-end gap-2">
                                    <button 
                                        onClick={() => onRoleChange(user.id, targetRole)}
                                        className="px-3 py-1.5 bg-white text-slate-500 border border-slate-200 text-xs font-bold rounded-lg hover:bg-slate-100 flex items-center gap-1 transition-colors"
                                        title={`Switch to ${targetRole}`}
                                    >
                                        <RefreshCw size={14} /> Switch Role
                                    </button>
                                    <button 
                                        onClick={() => onDelete(user.id)}
                                        className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 text-xs font-bold rounded-lg hover:bg-red-100 flex items-center gap-1 transition-colors"
                                        title="Delete User"
                                    >
                                        <Trash2 size={14} /> Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
    </div>
)

export default AdminDashboard
