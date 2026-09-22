import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { CustomersPage } from './pages/CustomersPage';
import { CustomerDetailPage } from './pages/CustomerDetailPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { StatementPage } from './pages/StatementPage';
import { SettingsPage } from './pages/SettingsPage';
import { AddCustomerModal } from './components/modals/AddCustomerModal';
import { RecordTransactionModal } from './components/modals/RecordTransactionModal';
import { WhatsAppModal } from './components/modals/WhatsAppModal';
import { SettlementCelebrationDialog } from './components/common/SettlementCelebrationDialog';
import { Customer, TransactionType } from './types';
import { ShieldAlert, WifiOff, Download } from 'lucide-react';

function MainApp() {
  const { isAuthenticated, isLoading, business, isOwner } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // Monitor network connectivity
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // Automatically redirect staff to customers if they land on dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && !isOwner && currentView === 'dashboard') {
      setCurrentView('customers');
    }
  }, [isLoading, isAuthenticated, isOwner, currentView]);

  // Dark mode state
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('credittrack_theme') === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('credittrack_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('credittrack_theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  // Modal states
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [recordTxState, setRecordTxState] = useState<{
    isOpen: boolean;
    defaultCustomerId?: string;
    defaultType?: TransactionType;
  }>({
    isOpen: false,
  });
  const [whatsAppState, setWhatsAppState] = useState<{
    isOpen: boolean;
    customer: Customer | null;
  }>({
    isOpen: false,
    customer: null,
  });
  const [celebrationState, setCelebrationState] = useState<{
    isOpen: boolean;
    customerName?: string;
    amountSettled?: number;
  }>({
    isOpen: false,
  });

  // Action Triggers
  const handleOpenAddCustomer = () => {
    setIsAddCustomerOpen(true);
  };

  const handleOpenTransactionModal = (customerId?: string, type?: TransactionType) => {
    setRecordTxState({
      isOpen: true,
      defaultCustomerId: customerId,
      defaultType: type || 'CREDIT',
    });
  };

  const handleOpenWhatsAppModal = (customer: Customer) => {
    setWhatsAppState({
      isOpen: true,
      customer,
    });
  };

  // When transaction or customer added, refresh key views by bumping key or nav
  const [refreshKey, setRefreshKey] = useState(0);
  const handleDataChanged = () => {
    setRefreshKey((k) => k + 1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 animate-pulse flex items-center justify-center text-white font-black">
          CT
        </div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Loading CreditTrack...
        </p>
      </div>
    );
  }

  // If not logged in, show the comprehensive marketing & auth landing page
  if (!isAuthenticated) {
    return <LandingPage onLoginSuccess={() => setCurrentView('dashboard')} />;
  }

  // Parse view (e.g. "customer-123", "statement-123")
  const isCustomerDetail = currentView.startsWith('customer-');
  const isStatement = currentView.startsWith('statement-');
  const activeCustomerId = isCustomerDetail
    ? currentView.replace('customer-', '')
    : isStatement
    ? currentView.replace('statement-', '')
    : null;

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors selection:bg-emerald-500 selection:text-white">
      {/* Offline Status Alert Banner */}
      {!isOnline && (
        <div className="bg-amber-500 text-amber-950 px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-xs shrink-0 z-50">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>Offline Mode — You are browsing cached ledger data. Changes will sync once internet connectivity returns.</span>
        </div>
      )}

      {/* PWA Home Screen Install Prompt Banner */}
      {installPrompt && (
        <div className="bg-emerald-700 text-white px-4 py-2 text-xs font-medium flex items-center justify-between gap-3 shadow-xs shrink-0 z-50">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 shrink-0" />
            <span>Install CreditTrack on your device for fast offline ledger access!</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                installPrompt.prompt();
                setInstallPrompt(null);
              }}
              className="px-3 py-1 bg-white text-emerald-800 rounded-lg font-bold text-[11px] hover:bg-emerald-50 transition-colors cursor-pointer"
            >
              Install App
            </button>
            <button
              type="button"
              onClick={() => setInstallPrompt(null)}
              className="text-emerald-200 hover:text-white text-xs px-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={setCurrentView}
        onOpenNewTransaction={() => handleOpenTransactionModal()}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        onToggleSidebar={() => setMobileSidebarOpen(true)}
      />

      {/* Main Container with Desktop Sidebar */}
      <div className="flex flex-1 max-w-7xl w-full mx-auto pb-16 lg:pb-8">
        <Sidebar
          currentView={currentView}
          onNavigate={setCurrentView}
          isOpenMobile={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        {/* Dynamic Route View with smooth fade-and-slide page transitions */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="min-h-full"
            >
              {currentView === 'dashboard' && (
                isOwner ? (
                  <DashboardPage
                    key={refreshKey}
                    onNavigate={setCurrentView}
                    onOpenCreditModal={() => handleOpenTransactionModal(undefined, 'CREDIT')}
                    onOpenPaymentModal={() => handleOpenTransactionModal(undefined, 'PAYMENT')}
                    onOpenAddCustomerModal={handleOpenAddCustomer}
                    onOpenWhatsAppModal={handleOpenWhatsAppModal}
                  />
                ) : (
                  <div className="p-8 max-w-md mx-auto my-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-800">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">Owner Access Restricted</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        The overarching business analytics dashboard is restricted to store owners. As a staff member, you can manage customer accounts and record transactions.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentView('customers')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      Go to Customers Ledger
                    </button>
                  </div>
                )
              )}

              {currentView === 'customers' && (
                <CustomersPage
                  key={refreshKey}
                  onNavigate={setCurrentView}
                  onOpenAddCustomerModal={handleOpenAddCustomer}
                  onOpenTransactionModal={(cid, type) => handleOpenTransactionModal(cid, type)}
                  onOpenWhatsAppModal={handleOpenWhatsAppModal}
                />
              )}

              {isCustomerDetail && activeCustomerId && (
                <CustomerDetailPage
                  key={`${activeCustomerId}-${refreshKey}`}
                  customerId={activeCustomerId}
                  onBack={() => setCurrentView('customers')}
                  onNavigate={setCurrentView}
                  onOpenCreditModal={(cid) => handleOpenTransactionModal(cid, 'CREDIT')}
                  onOpenPaymentModal={(cid) => handleOpenTransactionModal(cid, 'PAYMENT')}
                  onOpenWhatsAppModal={handleOpenWhatsAppModal}
                />
              )}

              {isStatement && activeCustomerId && (
                <StatementPage
                  key={activeCustomerId}
                  customerId={activeCustomerId}
                  onBack={() => setCurrentView(`customer-${activeCustomerId}`)}
                />
              )}

              {currentView === 'transactions' && (
                <TransactionsPage
                  key={refreshKey}
                  onNavigate={setCurrentView}
                  onOpenNewTransaction={() => handleOpenTransactionModal()}
                />
              )}

              {currentView === 'settings' && (
                <SettingsPage onNavigate={setCurrentView} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav
        currentView={currentView}
        onNavigate={setCurrentView}
        onOpenNewTransaction={() => handleOpenTransactionModal()}
      />

      {/* Global Add Customer Modal */}
      <AddCustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        onCustomerAdded={(newCustomer) => {
          handleDataChanged();
          setCurrentView(`customer-${newCustomer.id}`);
        }}
      />

      {/* Global Record Transaction Modal */}
      <RecordTransactionModal
        isOpen={recordTxState.isOpen}
        onClose={() => setRecordTxState({ isOpen: false })}
        defaultCustomerId={recordTxState.defaultCustomerId}
        defaultType={recordTxState.defaultType}
        onSuccess={(updatedCustomer) => {
          if (updatedCustomer && updatedCustomer.outstandingBalance <= 0 && updatedCustomer.totalPaid > 0) {
            setCelebrationState({
              isOpen: true,
              customerName: updatedCustomer.name,
              amountSettled: updatedCustomer.totalPaid,
            });
          }
        }}
        onTransactionRecorded={() => {
          handleDataChanged();
        }}
      />

      {/* Settlement Celebration Dialog */}
      <SettlementCelebrationDialog
        isOpen={celebrationState.isOpen}
        onClose={() => setCelebrationState({ isOpen: false })}
        customerName={celebrationState.customerName}
        amountSettled={celebrationState.amountSettled}
      />

      {/* WhatsApp Payment Reminder Modal */}
      <WhatsAppModal
        isOpen={whatsAppState.isOpen}
        onClose={() => setWhatsAppState({ isOpen: false, customer: null })}
        customer={whatsAppState.customer}
        business={business}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
