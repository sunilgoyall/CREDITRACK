import React from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, Plus, Receipt, Settings } from 'lucide-react';

interface MobileNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenNewTransaction: () => void;
}

export function MobileNav({
  currentView,
  onNavigate,
  onOpenNewTransaction,
}: MobileNavProps) {
  const { isOwner } = useAuth();
  const isCustomers = currentView === 'customers' || currentView.startsWith('customer-');

  const navItems = [
    ...(isOwner
      ? [{ id: 'dashboard', label: 'Home', icon: LayoutDashboard, isActive: currentView === 'dashboard' }]
      : []),
    { id: 'customers', label: 'Customers', icon: Users, isActive: isCustomers },
    { id: 'transactions', label: 'Ledger', icon: Receipt, isActive: currentView === 'transactions' },
    { id: 'settings', label: isOwner ? 'Settings' : 'Account', icon: Settings, isActive: currentView === 'settings' },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-3 py-1.5 flex items-center justify-around shadow-lg">
      {navItems.slice(0, 2).map((item) => {
        const Icon = item.icon;
        return (
          <motion.button
            key={item.id}
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => onNavigate(item.id)}
            className={`relative flex flex-col items-center py-1 px-3 rounded-xl cursor-pointer ${
              item.isActive
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {item.isActive && (
              <motion.div
                layoutId="activeMobileNavIndicator"
                className="absolute inset-0 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl -z-10"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              />
            )}
            <Icon className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{item.label}</span>
          </motion.button>
        );
      })}

      {/* Floating Center Action Button with bouncy spring */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={onOpenNewTransaction}
        className="w-12 h-12 -mt-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-600/30 transition-shadow cursor-pointer"
        aria-label="Add Transaction"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </motion.button>

      {navItems.slice(2).map((item) => {
        const Icon = item.icon;
        return (
          <motion.button
            key={item.id}
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => onNavigate(item.id)}
            className={`relative flex flex-col items-center py-1 px-3 rounded-xl cursor-pointer ${
              item.isActive
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {item.isActive && (
              <motion.div
                layoutId="activeMobileNavIndicator"
                className="absolute inset-0 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl -z-10"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              />
            )}
            <Icon className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{item.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
