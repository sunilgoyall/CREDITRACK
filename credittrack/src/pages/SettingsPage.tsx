import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { StaffManagement } from '../components/settings/StaffManagement';
import {
  Store,
  User,
  Lock,
  Sparkles,
  RotateCcw,
  Check,
  AlertCircle,
  Building,
  Phone,
  MapPin,
  Mail,
  Trash2,
  ShieldCheck,
  QrCode,
} from 'lucide-react';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

interface SettingsPageProps {
  onNavigate: (view: string) => void;
}

export function SettingsPage({ onNavigate }: SettingsPageProps) {
  const { user, business, refreshUser, loadDemoData, logout, isOwner } = useAuth();

  // Business Profile Form State
  const [businessName, setBusinessName] = useState(business?.business_name || '');
  const [businessType, setBusinessType] = useState(business?.business_type || 'Kirana / Grocery Store');
  const [phone, setPhone] = useState(business?.phone || '');
  const [address, setAddress] = useState(business?.address || '');
  const [upiId, setUpiId] = useState(business?.upi_id || '');
  const [isSavingBusiness, setIsSavingBusiness] = useState(false);
  const [businessSuccess, setBusinessSuccess] = useState('');
  const [businessError, setBusinessError] = useState('');

  // User Profile Form State
  const [userName, setUserName] = useState(user?.name || '');
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [userSuccess, setUserSuccess] = useState('');
  const [userError, setUserError] = useState('');

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Demo seed state
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState('');

  // Reset confirmation state
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleUpdateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBusiness(true);
    setBusinessSuccess('');
    setBusinessError('');
    try {
      await api.business.update({
        business_name: businessName.trim(),
        business_type: businessType,
        phone: phone.trim(),
        address: address.trim(),
        upi_id: upiId.trim(),
      });
      await refreshUser();
      setBusinessSuccess('Store details and UPI ID updated successfully!');
      setTimeout(() => setBusinessSuccess(''), 3000);
    } catch (err: any) {
      setBusinessError(err.message || 'Failed to update store details.');
    } finally {
      setIsSavingBusiness(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingUser(true);
    setUserSuccess('');
    setUserError('');
    try {
      await api.auth.updateProfile({
        name: userName.trim(),
      });
      await refreshUser();
      setUserSuccess('Owner profile updated successfully!');
      setTimeout(() => setUserSuccess(''), 3000);
    } catch (err: any) {
      setUserError(err.message || 'Failed to update profile.');
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.auth.changePassword({
        currentPassword,
        newPassword,
      });
      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password. Verify your current password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLoadDemoData = async () => {
    setIsSeeding(true);
    setSeedSuccess('');
    try {
      await loadDemoData();
      setSeedSuccess('Demo Kirana Store data loaded! Check Dashboard or Customers.');
      setTimeout(() => setSeedSuccess(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to load demo data.');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleResetData = async () => {
    setIsResetting(true);
    try {
      await api.database.reset();
      setIsResetConfirmOpen(false);
      onNavigate('dashboard');
    } catch (err: any) {
      alert(err.message || 'Failed to reset store data.');
    } finally {
      setIsResetting(false);
    }
  };

  if (!isOwner) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Staff Account Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            View your operational credentials and update your password
          </p>
        </div>

        {/* Staff Role Banner */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center border border-blue-200 dark:border-blue-800">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">{user?.name}</h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">
                  STAFF ROLE
                </span>
              </div>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            <p><strong>Assigned Store:</strong> {business?.business_name || 'CreditTrack Store'}</p>
            <p className="mt-1 text-[11px] text-slate-400">
              Your account has staff permissions to view customers, add new customers, and record transactions. Store profile settings, staff management, and analytics are restricted to the business owner.
            </p>
          </div>
        </div>

        {/* Change Password Form */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-base pb-3 border-b border-slate-100 dark:border-slate-800">
            <Lock className="w-5 h-5 text-emerald-600" />
            <h2>Change My Password</h2>
          </div>

          {passwordSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{passwordSuccess}</span>
            </div>
          )}
          {passwordError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Current Password *
              </label>
              <input
                id="staff-current-password-input"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  New Password * (min 6 chars)
                </label>
                <input
                  id="staff-new-password-input"
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirm New Password *
                </label>
                <input
                  id="staff-confirm-password-input"
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                id="staff-change-password-btn"
                type="submit"
                disabled={isChangingPassword}
                className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isChangingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Store & Account Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Manage your business information, owner details, and data preferences
        </p>
      </div>

      {/* Business Details Card */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-base pb-3 border-b border-slate-100 dark:border-slate-800">
          <Store className="w-5 h-5 text-emerald-600" />
          <h2>Business Profile & Letterhead</h2>
        </div>

        {businessSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{businessSuccess}</span>
          </div>
        )}
        {businessError && (
          <div className="p-3 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{businessError}</span>
          </div>
        )}

        <form onSubmit={handleUpdateBusiness} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Shop / Store Name *
              </label>
              <input
                id="settings-business-name-input"
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Business Type
              </label>
              <select
                id="settings-business-type-select"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                <option value="Kirana / Grocery Store">Kirana / Grocery Store</option>
                <option value="Medical / Pharmacy">Medical / Pharmacy</option>
                <option value="Hardware & Sanitary">Hardware & Sanitary</option>
                <option value="Garments & Apparel">Garments & Apparel</option>
                <option value="Electronics & Mobile">Electronics & Mobile</option>
                <option value="Dairy & Sweets">Dairy & Sweets</option>
                <option value="Services & Repair">Services & Repair</option>
                <option value="Wholesale Distributor">Wholesale Distributor</option>
                <option value="Other">Other Business</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Store Contact Phone *
              </label>
              <input
                id="settings-business-phone-input"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Store Address (Printed on Statements)
              </label>
              <input
                id="settings-business-address-input"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Shop #14, Main Road Market"
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Store UPI ID for Dynamic QR Payments
            </label>
            <div className="relative">
              <QrCode className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                id="settings-business-upi-input"
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. yourstore@okhdfcbank or 9876543210@paytm"
                className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Embedded directly into customer dynamic QR codes with exact outstanding balance for instant UPI settlement.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              id="save-business-settings-btn"
              type="submit"
              disabled={isSavingBusiness}
              className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isSavingBusiness ? 'Saving Changes...' : 'Save Store Details'}
            </button>
          </div>
        </form>
      </div>

      {/* Owner Profile Card */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-base pb-3 border-b border-slate-100 dark:border-slate-800">
          <User className="w-5 h-5 text-emerald-600" />
          <h2>Owner Profile</h2>
        </div>

        {userSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{userSuccess}</span>
          </div>
        )}
        {userError && (
          <div className="p-3 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{userError}</span>
          </div>
        )}

        <form onSubmit={handleUpdateUser} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Owner Full Name
              </label>
              <input
                id="settings-owner-name-input"
                type="text"
                required
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Account Email (Login Identifier)
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              id="save-owner-settings-btn"
              type="submit"
              disabled={isSavingUser}
              className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isSavingUser ? 'Saving...' : 'Update Owner Name'}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password Card */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-base pb-3 border-b border-slate-100 dark:border-slate-800">
          <Lock className="w-5 h-5 text-emerald-600" />
          <h2>Security & Password</h2>
        </div>

        {passwordSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{passwordSuccess}</span>
          </div>
        )}
        {passwordError && (
          <div className="p-3 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Current Password *
              </label>
              <input
                id="current-password-input"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                New Password *
              </label>
              <input
                id="new-password-input"
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Confirm New Password *
              </label>
              <input
                id="confirm-password-input"
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              id="change-password-btn"
              type="submit"
              disabled={isChangingPassword}
              className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isChangingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Staff Management Section (RBAC) */}
      <StaffManagement />

      {/* Demo & Sample Data Management */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-base pb-3 border-b border-slate-100 dark:border-slate-800">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          <h2>Store Data Management</h2>
        </div>

        {seedSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{seedSuccess}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">Load Sample Kirana Customers</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Populate your store with 5 realistic customer accounts (Rahul, Amit, Priya, etc.) and itemized credit & repayment transactions.
            </p>
            <button
              id="settings-seed-demo-btn"
              type="button"
              onClick={handleLoadDemoData}
              disabled={isSeeding}
              className="mt-2 flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 hover:bg-emerald-200 rounded-xl border border-emerald-300 dark:border-emerald-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSeeding ? 'Loading Sample Data...' : 'Load Sample Kirana Data'}</span>
            </button>
          </div>

          <div className="p-4 bg-red-50/50 dark:bg-red-950/20 rounded-2xl border border-red-200/60 dark:border-red-900/40 space-y-2">
            <h3 className="text-xs font-bold text-red-900 dark:text-red-300">Reset Customer Ledger</h3>
            <p className="text-[11px] text-red-700/80 dark:text-red-400/80">
              Clear all customers and transaction history from your store ledger, returning your shop balance to a clean zero state.
            </p>
            <button
              id="settings-reset-data-btn"
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="mt-2 flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950/60 hover:bg-red-200 rounded-xl border border-red-300 dark:border-red-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Ledger to Zero</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Reset */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetData}
        title="Reset Store Ledger Data"
        message="Are you sure you want to clear all customer accounts and transaction entries for your store? Your user account will remain, but all credit history will be reset."
        confirmLabel="Reset Ledger"
        isDestructive={true}
        isLoading={isResetting}
      />
    </div>
  );
}
