import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpenCheck,
  PlusCircle,
  LogOut,
  Settings,
  Sun,
  Moon,
  Store,
  ChevronDown,
  Menu,
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenNewTransaction: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onToggleSidebar?: () => void;
}

export function Navbar({
  currentView,
  onNavigate,
  onOpenNewTransaction,
  darkMode,
  onToggleDarkMode,
  onToggleSidebar,
}: NavbarProps) {
  const { user, business, logout, isOwner } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Left Section */}
          <div className="flex items-center gap-3 sm:gap-6">
            <button
              id="toggle-mobile-sidebar-btn"
              type="button"
              onClick={onToggleSidebar}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div
              onClick={() => onNavigate(isOwner ? 'dashboard' : 'customers')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
                <BookOpenCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">CreditTrack</span>
                  <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 rounded-md border border-emerald-200 dark:border-emerald-800">
                    Bahi-Khata
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                  {business?.business_name || 'Business Credit Manager'}
                </p>
              </div>
            </div>
          </div>

          {/* Right Section Actions */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Business Badge */}
            {business && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <Store className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
                  {business.business_name}
                </span>
              </div>
            )}

            {/* Quick Record Transaction Button */}
            <motion.button
              id="navbar-add-transaction-btn"
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenNewTransaction}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Add Transaction</span>
              <span className="sm:hidden">+ Udhaar</span>
            </motion.button>

            {/* Dark Mode Toggle */}
            <motion.button
              id="theme-toggle-btn"
              type="button"
              whileTap={{ scale: 0.88, rotate: 15 }}
              whileHover={{ scale: 1.08 }}
              onClick={onToggleDarkMode}
              className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </motion.button>

            {/* User Profile Dropdown */}
            <div className="relative">
              <motion.button
                id="user-profile-menu-btn"
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'O'}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </motion.button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    id="user-dropdown-menu"
                    initial={{ opacity: 0, scale: 0.95, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -6 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 400 }}
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-1.5 z-50 origin-top-right"
                  >
                  <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                        isOwner
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      }`}>
                        {isOwner ? 'OWNER' : 'STAFF'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                    {business && (
                      <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 mt-1">
                        {business.business_type}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      onNavigate('settings');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>{isOwner ? 'Store Settings & Staff' : 'My Staff Profile'}</span>
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                  <button
                    id="logout-btn"
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
