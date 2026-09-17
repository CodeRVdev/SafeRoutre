import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import type { UserRecord, UserStats, UserDetailsData, CreateUserPayload, UpdateUserPayload } from '../api/users';
import {
  getUsersApi,
  getUserStatsApi,
  getUserDetailsApi,
  createUserApi,
  updateUserApi,
  updateUserRoleApi,
  deactivateUserApi,
  reactivateUserApi,
} from '../api/users';
import {
  Users,
  GraduationCap,
  BookOpen,
  Briefcase,
  ShieldCheck,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  UserCheck,
  UserX,
  UserPlus,
  Calendar,
  Building2,
  IdCard,
  AlertTriangle,
  Clock,
  Shield,
  Edit,
  Eye,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const isCoordinator = currentUser?.role === 'coordinator';
  const canManageUsers = isAdmin || isCoordinator;

  // Data states
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Banner notification state
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // View Details Modal state
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetailsData | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [roleUpdateRole, setRoleUpdateRole] = useState<string>('student');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [detailDeactivateConfirmOpen, setDetailDeactivateConfirmOpen] = useState(false);
  const [isDetailDeactivating, setIsDetailDeactivating] = useState(false);
  const [detailModalSuccessMsg, setDetailModalSuccessMsg] = useState<string | null>(null);
  const [detailModalErrorMsg, setDetailModalErrorMsg] = useState<string | null>(null);

  // Create User Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<CreateUserPayload>({
    full_name: '',
    email: '',
    password: '',
    role: 'student',
    id_number: '',
    department: '',
  });

  // Edit User Modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    full_name: string;
    email: string;
    role: 'admin' | 'coordinator' | 'student' | 'faculty' | 'staff';
    id_number: string;
    department: string;
    is_active: boolean;
    password: string;
  }>({
    full_name: '',
    email: '',
    role: 'student',
    id_number: '',
    department: '',
    is_active: true,
    password: '',
  });

  // Row Deactivation / Reactivation Confirmation state
  const [confirmTargetUser, setConfirmTargetUser] = useState<UserRecord | null>(null);
  const [confirmActionType, setConfirmActionType] = useState<'deactivate' | 'reactivate'>('deactivate');
  const [isConfirmSubmitting, setIsConfirmSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getUsersApi({
        search: search.trim() || undefined,
        role: selectedRole !== 'all' ? selectedRole : undefined,
        page,
        limit: 10,
      });

      setUsers(res.data.users);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [search, selectedRole, page]);

  const fetchStats = async () => {
    try {
      const res = await getUserStatsApi();
      setStats(res.data);
    } catch (err: any) {
      console.error('Failed to fetch user stats:', err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Dismiss banner after 5 seconds
  useEffect(() => {
    if (banner) {
      const timer = setTimeout(() => setBanner(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [banner]);

  // --------------------------------------------------------------------------
  // CREATE USER HANDLERS
  // --------------------------------------------------------------------------
  const handleOpenCreateModal = () => {
    setCreateForm({
      full_name: '',
      email: '',
      password: '',
      role: 'student',
      id_number: '',
      department: '',
    });
    setCreateError(null);
    setCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setCreateModalOpen(false);
    setCreateError(null);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    // Validation
    if (!createForm.full_name.trim()) {
      setCreateError('Full name is required.');
      return;
    }
    if (!createForm.email.trim()) {
      setCreateError('Email address is required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(createForm.email.trim())) {
      setCreateError('Please provide a valid email address.');
      return;
    }
    if (!createForm.password || createForm.password.length < 6) {
      setCreateError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setIsCreating(true);
      const res = await createUserApi({
        full_name: createForm.full_name.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        role: createForm.role,
        id_number: createForm.id_number?.trim() || undefined,
        department: createForm.department?.trim() || undefined,
      });

      setBanner({
        type: 'success',
        message: `User ${res.user.full_name} (${res.user.role}) created successfully!`,
      });
      setCreateModalOpen(false);
      fetchUsers();
      fetchStats();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create user account.');
    } finally {
      setIsCreating(false);
    }
  };

  // --------------------------------------------------------------------------
  // EDIT USER HANDLERS
  // --------------------------------------------------------------------------
  const handleOpenEditModal = (user: UserRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingUserId(user.user_id);
    setEditForm({
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      id_number: user.id_number || '',
      department: user.department || '',
      is_active: user.is_active,
      password: '',
    });
    setEditError(null);
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEditingUserId(null);
    setEditError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;
    setEditError(null);

    // Validation
    if (!editForm.full_name.trim()) {
      setEditError('Full name is required.');
      return;
    }
    if (!editForm.email.trim()) {
      setEditError('Email address is required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editForm.email.trim())) {
      setEditError('Please provide a valid email address.');
      return;
    }
    if (editForm.password && editForm.password.length < 6) {
      setEditError('New password must be at least 6 characters long.');
      return;
    }

    try {
      setIsUpdating(true);
      const payload: UpdateUserPayload = {
        full_name: editForm.full_name.trim(),
        email: editForm.email.trim(),
        role: editForm.role,
        id_number: editForm.id_number.trim() || null,
        department: editForm.department.trim() || null,
        is_active: editForm.is_active,
      };

      if (editForm.password && editForm.password.trim() !== '') {
        payload.password = editForm.password;
      }

      const res = await updateUserApi(editingUserId, payload);
      setBanner({
        type: 'success',
        message: `User ${res.user.full_name} updated successfully!`,
      });

      // Update detail modal if open
      if (userDetails && userDetails.user.user_id === editingUserId) {
        setUserDetails((prev) => (prev ? { ...prev, user: res.user } : null));
      }

      setEditModalOpen(false);
      setEditingUserId(null);
      fetchUsers();
      fetchStats();
    } catch (err: any) {
      setEditError(err.message || 'Failed to update user account.');
    } finally {
      setIsUpdating(false);
    }
  };

  // --------------------------------------------------------------------------
  // ROW DEACTIVATE / REACTIVATE CONFIRMATION
  // --------------------------------------------------------------------------
  const handleOpenRowConfirm = (user: UserRecord, action: 'deactivate' | 'reactivate', e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmTargetUser(user);
    setConfirmActionType(action);
  };

  const handleCloseRowConfirm = () => {
    setConfirmTargetUser(null);
    setIsConfirmSubmitting(false);
  };

  const handleConfirmActionSubmit = async () => {
    if (!confirmTargetUser) return;
    try {
      setIsConfirmSubmitting(true);
      if (confirmActionType === 'deactivate') {
        const res = await deactivateUserApi(confirmTargetUser.user_id);
        setBanner({
          type: 'success',
          message: `Account for ${res.user.full_name} has been deactivated.`,
        });
      } else {
        const res = await reactivateUserApi(confirmTargetUser.user_id);
        setBanner({
          type: 'success',
          message: `Account for ${res.user.full_name} has been reactivated.`,
        });
      }

      // If details modal is open for this user, refresh it
      if (userDetails && userDetails.user.user_id === confirmTargetUser.user_id) {
        setUserDetails((prev) =>
          prev ? { ...prev, user: { ...prev.user, is_active: confirmActionType === 'reactivate' } } : null
        );
      }

      handleCloseRowConfirm();
      fetchUsers();
      fetchStats();
    } catch (err: any) {
      setBanner({
        type: 'error',
        message: err.message || `Failed to ${confirmActionType} account.`,
      });
      handleCloseRowConfirm();
    } finally {
      setIsConfirmSubmitting(false);
    }
  };

  // --------------------------------------------------------------------------
  // USER DETAIL MODAL HANDLERS
  // --------------------------------------------------------------------------
  const handleOpenUserModal = async (userId: number) => {
    setSelectedUserId(userId);
    setModalLoading(true);
    setDetailModalSuccessMsg(null);
    setDetailModalErrorMsg(null);
    setDetailDeactivateConfirmOpen(false);

    try {
      const res = await getUserDetailsApi(userId);
      setUserDetails(res.data);
      setRoleUpdateRole(res.data.user.role);
    } catch (err: any) {
      setDetailModalErrorMsg(err.message || 'Failed to fetch user details.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedUserId(null);
    setUserDetails(null);
    setDetailModalSuccessMsg(null);
    setDetailModalErrorMsg(null);
    setDetailDeactivateConfirmOpen(false);
  };

  const handleUpdateRole = async () => {
    if (!selectedUserId || !userDetails) return;
    setIsUpdatingRole(true);
    setDetailModalSuccessMsg(null);
    setDetailModalErrorMsg(null);

    try {
      const res = await updateUserRoleApi(selectedUserId, roleUpdateRole);
      setDetailModalSuccessMsg(res.message || 'Role updated successfully.');
      setUserDetails((prev) =>
        prev ? { ...prev, user: { ...prev.user, role: res.user.role } } : null
      );
      fetchUsers();
      fetchStats();
    } catch (err: any) {
      setDetailModalErrorMsg(err.message || 'Failed to update user role.');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleDetailDeactivateAccount = async () => {
    if (!selectedUserId || !userDetails) return;
    setIsDetailDeactivating(true);
    setDetailModalSuccessMsg(null);
    setDetailModalErrorMsg(null);

    try {
      const res = await deactivateUserApi(selectedUserId);
      setDetailModalSuccessMsg(res.message || 'User account deactivated.');
      setUserDetails((prev) =>
        prev ? { ...prev, user: { ...prev.user, is_active: false } } : null
      );
      setDetailDeactivateConfirmOpen(false);
      fetchUsers();
      fetchStats();
    } catch (err: any) {
      setDetailModalErrorMsg(err.message || 'Failed to deactivate account.');
    } finally {
      setIsDetailDeactivating(false);
    }
  };

  const handleDetailReactivateAccount = async () => {
    if (!selectedUserId || !userDetails) return;
    setIsDetailDeactivating(true);
    setDetailModalSuccessMsg(null);
    setDetailModalErrorMsg(null);

    try {
      const res = await reactivateUserApi(selectedUserId);
      setDetailModalSuccessMsg(res.message || 'User account reactivated.');
      setUserDetails((prev) =>
        prev ? { ...prev, user: { ...prev.user, is_active: true } } : null
      );
      fetchUsers();
      fetchStats();
    } catch (err: any) {
      setDetailModalErrorMsg(err.message || 'Failed to reactivate account.');
    } finally {
      setIsDetailDeactivating(false);
    }
  };

  // Badge helpers
  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'coordinator':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'faculty':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'staff':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'student':
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'injured':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse';
      case 'need_help':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'safe':
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  };

  return (
    <div className="flex-1 p-4 lg:p-8 max-w-[1920px] mx-auto w-full space-y-6">
      {/* Global Notification Banner */}
      {banner && (
        <div
          className={`flex items-center justify-between p-4 rounded-2xl border text-xs font-semibold animate-fadeIn ${
            banner.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/60 border-rose-500/50 text-rose-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            {banner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            <span>{banner.message}</span>
          </div>
          <button
            onClick={() => setBanner(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-400" />
            <span>Campus User Directory & Accountability</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Polonoling National High School — Manage registered personnel, roles, and safety records
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          {canManageUsers && (
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-cyan-600/20"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add User</span>
            </button>
          )}

          <button
            onClick={() => {
              fetchUsers();
              fetchStats();
            }}
            className="flex items-center space-x-2 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refresh List</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Users */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Total Personnel</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white">{stats?.total || 0}</p>
        </div>

        {/* Students */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Students</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-400">{stats?.student || 0}</p>
        </div>

        {/* Faculty */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Faculty</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-blue-400">{stats?.faculty || 0}</p>
        </div>

        {/* Staff */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Staff</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-amber-400">{stats?.staff || 0}</p>
        </div>

        {/* Coordinators & Admins */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Safety Officers</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-cyan-400">
            {(stats?.coordinator || 0) + (stats?.admin || 0)}
          </p>
        </div>
      </div>

      {/* Filters Header (Search & Role Dropdown) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-slate-800">
        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name or email..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-9 py-2 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          {search && (
            <button
              onClick={() => {
                setSearch('');
                setPage(1);
              }}
              className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Role Filter Dropdown */}
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">Filter Role:</span>
          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              setPage(1);
            }}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500 w-full sm:w-auto"
          >
            <option value="all">All Roles</option>
            <option value="student">Student</option>
            <option value="faculty">Faculty</option>
            <option value="staff">Staff</option>
            <option value="coordinator">Coordinator</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-2xl">
          {error}
        </div>
      )}

      {/* Roster Table */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            User Directory ({total})
          </h3>
          <span className="text-xs text-slate-400">
            Page {page} of {totalPages}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-bold tracking-wider sticky top-0">
              <tr>
                <th className="py-3 px-4">User Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">ID Number</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-cyan-400 mb-2" />
                    Loading user directory...
                  </td>
                </tr>
              )}

              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 space-y-2">
                    <Users className="w-8 h-8 mx-auto text-slate-600" />
                    <p className="font-semibold text-slate-400">No registered personnel found.</p>
                    <p className="text-[11px] text-slate-500">Try adjusting your search query or role filter.</p>
                  </td>
                </tr>
              )}

              {!loading &&
                users.map((user) => {
                  const isSelf = currentUser?.user_id === user.user_id;

                  return (
                    <tr
                      key={user.user_id}
                      onClick={() => handleOpenUserModal(user.user_id)}
                      className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-semibold text-white">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center font-bold text-xs">
                            {user.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="flex items-center gap-1.5">
                              {user.full_name}
                              {isSelf && (
                                <span className="text-[9px] px-1.5 py-0.2 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded font-normal">
                                  You
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{user.email}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${getRoleBadgeStyle(
                            user.role
                          )}`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{user.department || 'N/A'}</td>
                      <td className="py-3 px-4 text-slate-400">{user.id_number || 'N/A'}</td>
                      <td className="py-3 px-4">
                        {user.is_active ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
                            <UserCheck className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 inline-flex items-center gap-1">
                            <UserX className="w-3 h-3" /> Deactivated
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div
                          className="flex items-center justify-end space-x-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* View button */}
                          <button
                            title="View Details"
                            onClick={() => handleOpenUserModal(user.user_id)}
                            className="p-1.5 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit button */}
                          {canManageUsers && (
                            <button
                              title="Edit User"
                              onClick={(e) => handleOpenEditModal(user, e)}
                              className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}

                          {/* Deactivate/Reactivate button */}
                          {canManageUsers && (
                            <>
                              {user.is_active ? (
                                <button
                                  disabled={isSelf}
                                  title={isSelf ? 'Cannot deactivate your own account (Self-Protected)' : 'Deactivate Account'}
                                  onClick={(e) => handleOpenRowConfirm(user, 'deactivate', e)}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    isSelf
                                      ? 'text-slate-600 cursor-not-allowed opacity-40'
                                      : 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10'
                                  }`}
                                >
                                  <UserX className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  title="Reactivate Account"
                                  onClick={(e) => handleOpenRowConfirm(user, 'reactivate', e)}
                                  className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                >
                                  <UserCheck className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <span className="text-xs text-slate-400">
              Showing {(page - 1) * 10 + 1} - {Math.min(page * 10, total)} of {total} users
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-white px-2">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* CREATE USER MODAL */}
      {/* ========================================================================= */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-lg w-full rounded-3xl border border-slate-800 p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Create New User</h3>
                  <p className="text-xs text-slate-400">Register new personnel or safety officer</p>
                </div>
              </div>
              <button
                onClick={handleCloseCreateModal}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.full_name}
                    onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                    placeholder="e.g. Maria Santos"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Email Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="e.g. maria.santos@polonoling.edu.ph"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Initial Password <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    placeholder="Minimum 6 characters"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Role */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Role <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={createForm.role}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        role: e.target.value as CreateUserPayload['role'],
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                    <option value="staff">Staff</option>
                    <option value="coordinator">Coordinator (Safety Officer)</option>
                    <option value="admin">Admin (System Administrator)</option>
                  </select>
                </div>

                {/* Department / Grade Section */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Department / Section
                  </label>
                  <input
                    type="text"
                    value={createForm.department || ''}
                    onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                    placeholder="e.g. Science Dept"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* ID Number */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    ID Number
                  </label>
                  <input
                    type="text"
                    value={createForm.id_number || ''}
                    onChange={(e) => setCreateForm({ ...createForm, id_number: e.target.value })}
                    placeholder="e.g. PNHS-2026-042"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-600/20 flex items-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create User</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT USER MODAL */}
      {/* ========================================================================= */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-lg w-full rounded-3xl border border-slate-800 p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Edit User Profile</h3>
                  <p className="text-xs text-slate-400">Update account credentials & safety status</p>
                </div>
              </div>
              <button
                onClick={handleCloseEditModal}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            {currentUser?.user_id === editingUserId && (
              <div className="p-3 bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs rounded-xl flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span>Self-Protection Active: You cannot deactivate or demote your own administrator account.</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Email Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Role */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Role {currentUser?.user_id === editingUserId && '(Locked)'}
                  </label>
                  <select
                    disabled={currentUser?.user_id === editingUserId}
                    value={editForm.role}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        role: e.target.value as any,
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                    <option value="staff">Staff</option>
                    <option value="coordinator">Coordinator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {/* Account Status */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Status {currentUser?.user_id === editingUserId && '(Locked)'}
                  </label>
                  <select
                    disabled={currentUser?.user_id === editingUserId}
                    value={editForm.is_active ? 'active' : 'deactivated'}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        is_active: e.target.value === 'active',
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="active">Active</option>
                    <option value="deactivated">Deactivated</option>
                  </select>
                </div>

                {/* Department */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Department / Section
                  </label>
                  <input
                    type="text"
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* ID Number */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    ID Number
                  </label>
                  <input
                    type="text"
                    value={editForm.id_number}
                    onChange={(e) => setEditForm({ ...editForm, id_number: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Reset Password */}
                <div className="space-y-1 sm:col-span-2 pt-2 border-t border-slate-800">
                  <label className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Reset Password (Optional)</span>
                  </label>
                  <input
                    type="password"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    placeholder="Leave blank to keep current password"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <p className="text-[10px] text-slate-500">
                    If provided, must be at least 6 characters long.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
                >
                  {isUpdating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ROW DEACTIVATE / REACTIVATE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {confirmTargetUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full rounded-3xl border border-slate-800 p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center space-x-2 text-rose-400">
              {confirmActionType === 'deactivate' ? (
                <AlertTriangle className="w-6 h-6 flex-shrink-0 text-rose-400" />
              ) : (
                <CheckCircle2 className="w-6 h-6 flex-shrink-0 text-emerald-400" />
              )}
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                {confirmActionType === 'deactivate' ? 'Confirm Deactivation' : 'Confirm Reactivation'}
              </h4>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {confirmActionType === 'deactivate' ? (
                <>
                  Are you sure you want to deactivate{' '}
                  <strong className="text-white">{confirmTargetUser.full_name}</strong>'s account?
                  They will immediately be prevented from logging in or filing emergency check-ins.
                </>
              ) : (
                <>
                  Are you sure you want to reactivate{' '}
                  <strong className="text-white">{confirmTargetUser.full_name}</strong>'s account?
                  They will once again be able to log in to SafeRoute.
                </>
              )}
            </p>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                onClick={handleCloseRowConfirm}
                className="px-3.5 py-1.5 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={isConfirmSubmitting}
                onClick={handleConfirmActionSubmit}
                className={`px-4 py-1.5 text-white font-bold text-xs rounded-xl transition-all shadow-lg ${
                  confirmActionType === 'deactivate'
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                }`}
              >
                {isConfirmSubmitting ? (
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Processing...
                  </span>
                ) : confirmActionType === 'deactivate' ? (
                  'Confirm Deactivation'
                ) : (
                  'Confirm Reactivation'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* USER DETAIL & MANAGEMENT MODAL */}
      {/* ========================================================================= */}
      {selectedUserId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-2xl w-full rounded-3xl border border-slate-800 p-6 space-y-6 max-h-[90vh] overflow-y-auto relative shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold text-base">
                  {userDetails?.user.full_name.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-wide">
                    {userDetails?.user.full_name || 'User Details'}
                  </h3>
                  <p className="text-xs text-slate-400">{userDetails?.user.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {canManageUsers && userDetails && (
                  <button
                    onClick={() => {
                      const u = userDetails.user;
                      handleCloseModal();
                      handleOpenEditModal(u);
                    }}
                    className="p-2 text-blue-400 hover:text-blue-300 rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs font-semibold"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>
                )}
                <button
                  onClick={handleCloseModal}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {modalLoading && (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 mx-auto" />
                <p className="text-xs">Fetching profile & check-in records...</p>
              </div>
            )}

            {!modalLoading && userDetails && (
              <>
                {/* Action Feedback Banners */}
                {detailModalSuccessMsg && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl">
                    {detailModalSuccessMsg}
                  </div>
                )}
                {detailModalErrorMsg && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl">
                    {detailModalErrorMsg}
                  </div>
                )}

                {/* Profile Overview Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                      <Shield className="w-3 h-3 text-cyan-400" /> Current Role
                    </span>
                    <span
                      className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getRoleBadgeStyle(
                        userDetails.user.role
                      )}`}
                    >
                      {userDetails.user.role}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-cyan-400" /> Department
                    </span>
                    <p className="text-xs font-semibold text-white mt-1">
                      {userDetails.user.department || 'N/A'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                      <IdCard className="w-3 h-3 text-cyan-400" /> ID Number
                    </span>
                    <p className="text-xs font-semibold text-white mt-1">
                      {userDetails.user.id_number || 'N/A'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-cyan-400" /> Registered
                    </span>
                    <p className="text-xs font-semibold text-white mt-1">
                      {new Date(userDetails.user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Check-In History Section */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span>Emergency Check-In History ({userDetails.checkins.length})</span>
                  </h4>

                  <div className="overflow-x-auto max-h-48 rounded-xl border border-slate-800">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900 text-slate-400 uppercase text-[9px] font-bold tracking-wider sticky top-0">
                        <tr>
                          <th className="py-2 px-3">Status</th>
                          <th className="py-2 px-3">Alert Title</th>
                          <th className="py-2 px-3">Evacuation Zone</th>
                          <th className="py-2 px-3">Message</th>
                          <th className="py-2 px-3">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {userDetails.checkins.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-slate-500">
                              No emergency check-ins recorded for this account yet.
                            </td>
                          </tr>
                        )}

                        {userDetails.checkins.map((item) => (
                          <tr key={item.checkin_id} className="hover:bg-slate-800/40">
                            <td className="py-2 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${getStatusBadgeStyle(
                                  item.status
                                )}`}
                              >
                                {item.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-semibold text-white">{item.alert_title}</td>
                            <td className="py-2 px-3 text-emerald-400">{item.zone_name || 'Evacuation Point'}</td>
                            <td className="py-2 px-3 text-amber-300 italic">{item.message ? `"${item.message}"` : '-'}</td>
                            <td className="py-2 px-3 text-slate-400">
                              {new Date(item.checked_in_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Management Actions Panel */}
                {canManageUsers && (
                  <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-4">
                    <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>{isAdmin ? 'Administrator Actions' : 'Coordinator Actions'}</span>
                    </h4>

                    {currentUser?.user_id === userDetails.user.user_id ? (
                      <div className="p-3 bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs rounded-xl flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-purple-400" />
                        <span>Self-Protection Active: This is your active administrator account. Role modification and deactivation are locked.</span>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2 border-t border-slate-800">
                        {/* Change Role Form */}
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-semibold text-slate-300">Change Role:</span>
                          <select
                            value={roleUpdateRole}
                            onChange={(e) => setRoleUpdateRole(e.target.value)}
                            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500"
                          >
                            <option value="student">Student</option>
                            <option value="faculty">Faculty</option>
                            <option value="staff">Staff</option>
                            <option value="coordinator">Coordinator</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button
                            disabled={isUpdatingRole || roleUpdateRole === userDetails.user.role}
                            onClick={handleUpdateRole}
                            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md"
                          >
                            {isUpdatingRole ? 'Updating...' : 'Update Role'}
                          </button>
                        </div>

                        {/* Deactivate / Reactivate Account Action */}
                        <div>
                          {userDetails.user.is_active ? (
                            <button
                              onClick={() => setDetailDeactivateConfirmOpen(true)}
                              className="px-3 py-1.5 bg-rose-600/20 text-rose-400 border border-rose-500/40 hover:bg-rose-600 hover:text-white font-bold text-xs rounded-xl transition-all w-full sm:w-auto"
                            >
                              Deactivate Account
                            </button>
                          ) : (
                            <button
                              disabled={isDetailDeactivating}
                              onClick={handleDetailReactivateAccount}
                              className="px-3 py-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-600 hover:text-white font-bold text-xs rounded-xl transition-all w-full sm:w-auto"
                            >
                              {isDetailDeactivating ? 'Reactivating...' : 'Reactivate Account'}
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Deactivation Confirmation Dialog inside modal */}
                    {detailDeactivateConfirmOpen && (
                      <div className="p-4 bg-rose-950/40 border border-rose-500/50 rounded-2xl space-y-3 animate-fadeIn">
                        <div className="flex items-center space-x-2 text-rose-400">
                          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                          <h5 className="text-xs font-bold uppercase">Confirm Account Deactivation</h5>
                        </div>
                        <p className="text-xs text-slate-300">
                          Are you sure you want to deactivate{' '}
                          <strong className="text-white">{userDetails.user.full_name}</strong>'s account?
                          They will no longer be able to log in or submit safety check-ins.
                        </p>
                        <div className="flex justify-end space-x-2 pt-2">
                          <button
                            onClick={() => setDetailDeactivateConfirmOpen(false)}
                            className="px-3 py-1.5 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-700 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            disabled={isDetailDeactivating}
                            onClick={handleDetailDeactivateAccount}
                            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-colors shadow-lg shadow-rose-600/30"
                          >
                            {isDetailDeactivating ? 'Deactivating...' : 'Confirm Deactivation'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
