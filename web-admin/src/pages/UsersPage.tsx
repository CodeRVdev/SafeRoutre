import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import type { UserRecord, UserStats, UserDetailsData } from '../api/users';
import {
  getUsersApi,
  getUserStatsApi,
  getUserDetailsApi,
  updateUserRoleApi,
  deactivateUserApi,
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
  Calendar,
  Building2,
  IdCard,
  AlertTriangle,
  Clock,
  Shield,
} from 'lucide-react';

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

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

  // Modal states
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetailsData | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [roleUpdateRole, setRoleUpdateRole] = useState<string>('student');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [deactivateConfirmOpen, setDeactivateConfirmOpen] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

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

  const handleOpenUserModal = async (userId: number) => {
    setSelectedUserId(userId);
    setModalLoading(true);
    setActionSuccessMsg(null);
    setActionErrorMsg(null);
    setDeactivateConfirmOpen(false);

    try {
      const res = await getUserDetailsApi(userId);
      setUserDetails(res.data);
      setRoleUpdateRole(res.data.user.role);
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Failed to fetch user details.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedUserId(null);
    setUserDetails(null);
    setActionSuccessMsg(null);
    setActionErrorMsg(null);
    setDeactivateConfirmOpen(false);
  };

  const handleUpdateRole = async () => {
    if (!selectedUserId || !userDetails) return;
    setIsUpdatingRole(true);
    setActionSuccessMsg(null);
    setActionErrorMsg(null);

    try {
      const res = await updateUserRoleApi(selectedUserId, roleUpdateRole);
      setActionSuccessMsg(res.message || 'Role updated successfully.');
      setUserDetails((prev) =>
        prev ? { ...prev, user: { ...prev.user, role: res.user.role } } : null
      );
      fetchUsers();
      fetchStats();
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Failed to update user role.');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleDeactivateAccount = async () => {
    if (!selectedUserId || !userDetails) return;
    setIsDeactivating(true);
    setActionSuccessMsg(null);
    setActionErrorMsg(null);

    try {
      const res = await deactivateUserApi(selectedUserId);
      setActionSuccessMsg(res.message || 'User account deactivated.');
      setUserDetails((prev) =>
        prev ? { ...prev, user: { ...prev.user, is_active: false } } : null
      );
      setDeactivateConfirmOpen(false);
      fetchUsers();
      fetchStats();
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Failed to deactivate account.');
    } finally {
      setIsDeactivating(false);
    }
  };

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

        <button
          onClick={() => {
            fetchUsers();
            fetchStats();
          }}
          className="flex items-center space-x-2 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Refresh List</span>
        </button>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-cyan-400 mb-2" />
                    Loading user directory...
                  </td>
                </tr>
              )}

              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No registered personnel matching search criteria found.
                  </td>
                </tr>
              )}

              {!loading &&
                users.map((user) => (
                  <tr
                    key={user.user_id}
                    onClick={() => handleOpenUserModal(user.user_id)}
                    className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-semibold text-white">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center font-bold text-xs">
                          {user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <span>{user.full_name}</span>
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
                  </tr>
                ))}
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

      {/* User Detail & Management Modal */}
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
              <button
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
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
                {actionSuccessMsg && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl">
                    {actionSuccessMsg}
                  </div>
                )}
                {actionErrorMsg && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl">
                    {actionErrorMsg}
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

                {/* Admin Management Actions Panel */}
                {isAdmin && (
                  <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-4">
                    <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Administrator Actions</span>
                    </h4>

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

                      {/* Deactivate Account Action */}
                      <div>
                        {userDetails.user.is_active ? (
                          <button
                            onClick={() => setDeactivateConfirmOpen(true)}
                            className="px-3 py-1.5 bg-rose-600/20 text-rose-400 border border-rose-500/40 hover:bg-rose-600 hover:text-white font-bold text-xs rounded-xl transition-all w-full sm:w-auto"
                          >
                            Deactivate Account
                          </button>
                        ) : (
                          <span className="text-xs text-rose-400 font-bold bg-rose-500/10 px-3 py-1 rounded-xl border border-rose-500/20">
                            Account Deactivated
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Deactivation Confirmation Dialog */}
                    {deactivateConfirmOpen && (
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
                            onClick={() => setDeactivateConfirmOpen(false)}
                            className="px-3 py-1.5 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-700 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            disabled={isDeactivating}
                            onClick={handleDeactivateAccount}
                            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-colors shadow-lg shadow-rose-600/30"
                          >
                            {isDeactivating ? 'Deactivating...' : 'Confirm Deactivation'}
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
