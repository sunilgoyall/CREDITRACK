import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { StaffUser } from '../../types';
import { formatDate } from '../../lib/formatters';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Trash2,
  AlertCircle,
  Check,
  Lock,
  Mail,
  User,
  Info,
} from 'lucide-react';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Modal } from '../common/Modal';

export function StaffManagement() {
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add staff modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Delete staff confirmation state
  const [deletingStaffId, setDeletingStaffId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchStaff = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await api.staff.list();
      setStaffList(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load staff accounts.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    if (!name.trim()) {
      setModalError('Please enter the staff member name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setModalError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setModalError('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.staff.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      setSuccess(`Staff account for ${name.trim()} created successfully!`);
      setName('');
      setEmail('');
      setPassword('');
      setIsAddModalOpen(false);
      await fetchStaff();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setModalError(err.message || 'Failed to create staff account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStaff = async () => {
    if (!deletingStaffId) return;
    setIsDeleting(true);
    try {
      await api.staff.delete(deletingStaffId);
      setSuccess('Staff account removed successfully.');
      setDeletingStaffId(null);
      await fetchStaff();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to remove staff account.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Staff Accounts & Access Control (RBAC)
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              Role-Based
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Create logins for store employees to record customer credit & collections securely
          </p>
        </div>

        <button
          id="add-staff-btn"
          type="button"
          onClick={() => {
            setModalError('');
            setIsAddModalOpen(true);
          }}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* RBAC Permission Explanation Callout */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
          <p className="font-bold text-slate-900 dark:text-white">Enforced Staff Permissions:</p>
          <ul className="list-disc list-inside space-y-0.5 text-slate-500 dark:text-slate-400">
            <li><strong className="text-emerald-600">Allowed:</strong> View customers, add new customers, and record credit/payment transactions.</li>
            <li><strong className="text-rose-600">Restricted:</strong> Cannot delete ledger records, modify store settings, or view overarching business analytics.</li>
          </ul>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-xs font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Staff Accounts List */}
      {isLoading ? (
        <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
          Loading staff accounts...
        </div>
      ) : staffList.length === 0 ? (
        <div className="py-10 text-center text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
          <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="font-semibold text-slate-700 dark:text-slate-300">No staff members created yet</p>
          <p className="text-[11px] text-slate-400">Click &quot;Add Staff Member&quot; to provide employee logins for your store.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Staff Member</th>
                <th className="px-4 py-3">Email / Login</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Added On</th>
                <th className="px-3 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {staffList.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <span>{member.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 font-medium">
                    {member.email}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      STAFF
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 text-xs">
                    {formatDate(member.created_at)}
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => setDeletingStaffId(member.id)}
                      className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                      title="Deactivate staff account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Staff Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Store Staff Member"
      >
        <form onSubmit={handleAddStaff} className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Create an employee credential. Staff accounts can view customer balances and record credit/payment entries, but cannot delete records or view overarching analytics.
          </p>

          {modalError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Staff Full Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                id="staff-name-input"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Staff Login Email *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                id="staff-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. ramesh.staff@store.com"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Temporary Password * (min 6 characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                id="staff-password-input"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="confirm-create-staff-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {isSubmitting ? 'Creating...' : 'Create Staff Login'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Staff Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingStaffId}
        title="Remove Staff Member"
        message="Are you sure you want to deactivate and remove this staff account? They will immediately lose login access to your store ledger."
        confirmLabel={isDeleting ? 'Removing...' : 'Remove Staff'}
        isDestructive
        onConfirm={handleDeleteStaff}
        onClose={() => setDeletingStaffId(null)}
      />
    </div>
  );
}
