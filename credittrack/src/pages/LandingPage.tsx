import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  BookOpenCheck,
  ShieldCheck,
  Smartphone,
  FileSpreadsheet,
  MessageCircle,
  ArrowRight,
  Store,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Receipt,
  Users,
  Lock,
  ChevronRight,
  HelpCircle,
  Sparkles,
  Server,
  Mail,
} from 'lucide-react';
import { formatINR } from '../lib/formatters';

interface LandingPageProps {
  onLoginSuccess: () => void;
}

export function LandingPage({ onLoginSuccess }: LandingPageProps) {
  const { login, loginWithGoogle, register } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'google' | null>(null);

  // Login form state (strictly empty by default)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Register form state (strictly empty by default)
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regBusinessName, setRegBusinessName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regBusinessType, setRegBusinessType] = useState('');
  const [regError, setRegError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Google / Gmail specific state
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleStoreName, setGoogleStoreName] = useState('');
  const [googleError, setGoogleError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleClientId, setGoogleClientId] = useState('');

  // Fetch optional Google OAuth client ID from server config
  useEffect(() => {
    fetch('/api/auth/google/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.clientId) {
          setGoogleClientId(data.clientId);
        }
      })
      .catch(() => {});
  }, []);

  // Initialize Google Identity Services if client ID is set
  useEffect(() => {
    if (googleClientId && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response: any) => {
            if (response.credential) {
              setIsGoogleLoading(true);
              setGoogleError('');
              try {
                await loginWithGoogle({ credential: response.credential });
                onLoginSuccess();
              } catch (err: any) {
                setGoogleError(err.message || 'Google authentication failed.');
              } finally {
                setIsGoogleLoading(false);
              }
            }
          },
        });
      } catch (e) {
        console.warn('Google GSI init failed:', e);
      }
    }
  }, [googleClientId]);

  const handleNativeGoogleClick = () => {
    if (googleClientId && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.prompt();
        return;
      } catch (err) {
        console.warn('Google prompt fallback:', err);
      }
    }
    // Switch to Google/Gmail authentication view in modal
    setAuthMode('google');
  };

  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.trim()) {
      setGoogleError('Please enter your Google or Gmail address.');
      return;
    }
    setGoogleError('');
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle({
        email: googleEmail.trim(),
        name: googleEmail.split('@')[0],
        businessName: googleStoreName.trim() || undefined,
      });
      onLoginSuccess();
    } catch (err: any) {
      setGoogleError(err.message || 'Failed to authenticate with Google. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      await login({ email: loginEmail, password: loginPassword });
      onLoginSuccess();
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setIsRegistering(true);
    try {
      await register({
        name: regName,
        email: regEmail,
        password: regPassword,
        businessName: regBusinessName,
        phone: regPhone,
        businessType: regBusinessType || 'General Store',
      });
      onLoginSuccess();
    } catch (err: any) {
      setRegError(err.message || 'Registration failed. Please check the fields and try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-xs">
              <BookOpenCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">CreditTrack</span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 rounded-md border border-emerald-200 dark:border-emerald-800">
                Digital Bahi-Khata
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              id="landing-google-header-btn"
              type="button"
              onClick={handleNativeGoogleClick}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Google Sign-In</span>
            </button>

            <button
              id="landing-login-nav-btn"
              type="button"
              onClick={() => setAuthMode('login')}
              className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Sign In
            </button>

            <button
              id="landing-register-nav-btn"
              type="button"
              onClick={() => setAuthMode('register')}
              className="px-4 py-1.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Create Account
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 sm:pt-16 sm:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                <Store className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero Demo Clutter • Starts 100% Clean Slate</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Digital Credit & Udhaar Ledger for Your Shop.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Replace bulky paper bahi-khata and lost bills with <strong>CreditTrack</strong>. Record customer credit (udhaar), track repayments (jama), and calculate exact balances automatically with zero errors.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <button
                  id="hero-google-btn"
                  type="button"
                  onClick={handleNativeGoogleClick}
                  className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3 text-sm font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-sm transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google / Gmail</span>
                </button>

                <button
                  id="hero-get-started-btn"
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <span>Create Empty Store Ledger</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Badges */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200/80 dark:border-slate-800 text-left">
                <div>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Clean</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Zero Dummy Data</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">Google</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">1-Click Sign-In</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Self-Host</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Host Anywhere</p>
                </div>
              </div>
            </div>

            {/* Right Interactive Ledger Visualizer */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
                      CT
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Clean Store Counter</p>
                      <p className="text-[10px] text-slate-400">Digital Bahi-Khata System</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 rounded-md border border-emerald-200 dark:border-emerald-800">
                    Ready to Use
                  </span>
                </div>

                {/* Outstanding balance preview */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow-sm space-y-2">
                  <p className="text-[11px] uppercase tracking-wider text-emerald-100 font-bold">Total Customer Outstanding</p>
                  <p className="text-2xl font-black">₹0.00</p>
                  <p className="text-xs text-emerald-100 font-medium pt-1 border-t border-emerald-500/40">
                    Clean slate ready for your first store customer
                  </p>
                </div>

                {/* Features Highlights */}
                <div className="space-y-2 pt-1">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center gap-3 border border-slate-100 dark:border-slate-800">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                      ✓
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Add Customers with 1 Click</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Name, mobile number, optional address & notes</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center gap-3 border border-slate-100 dark:border-slate-800">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                      ✓
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Instant Balance Math</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Automatic addition of credit and subtraction of jama</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center gap-3 border border-slate-100 dark:border-slate-800">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                      ✓
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">WhatsApp Udhaar Reminders</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Polite reminder in Hindi or English with exact balance</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    100% Private to your store • Self-host anytime
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison: Old Paper Bahi-Khata vs CreditTrack */}
      <section className="py-16 bg-white dark:bg-slate-900 border-y border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">
              The Digital Upgrade
            </h2>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Why Shopkeepers Are Replacing Paper Ledgers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* The Old Way */}
            <div className="p-6 sm:p-8 rounded-2xl bg-red-50/50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/40 space-y-4">
              <div className="flex items-center gap-2.5 text-red-700 dark:text-red-400 font-bold text-lg">
                <XCircle className="w-5 h-5" />
                <h3>Traditional Paper Bahi-Khata</h3>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span>Notebooks get torn, wet, misplaced, or lost forever during store cleaning.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span>Manual addition mistakes lead to awkward arguments with regular customers.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span>Flipping through hundreds of scribbled pages to find one customer bill.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span>No way to send professional receipts or WhatsApp statements.</span>
                </li>
              </ul>
            </div>

            {/* The CreditTrack Way */}
            <div className="p-6 sm:p-8 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 space-y-4">
              <div className="flex items-center gap-2.5 text-emerald-700 dark:text-emerald-400 font-bold text-lg">
                <CheckCircle2 className="w-5 h-5" />
                <h3>CreditTrack Digital Ledger</h3>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Reliable persistent storage ensures records are safely kept forever.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Automated math guarantees exact balance down to the paisa.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Instant customer search by Name or Mobile number in less than a second.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>1-click WhatsApp reminders and printable customer account statements.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">
              Features Built For Speed
            </h2>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Everything Your Counter Needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Automated Udhaar Balance</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Add credit, receive partial or full payments, and let the system calculate the exact running balance automatically.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                <MessageCircle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">WhatsApp Udhaar Reminders</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Send polite payment reminders in Hindi or English with one tap directly to your customer's WhatsApp.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                <Receipt className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Printable Grahak Statements</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Generate official statements with store header, transaction breakdown, and running balance for customer verification.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Mobile-First Shop UI</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Clean, touch-friendly interface designed for shopkeepers operating on mobile devices behind a busy cash counter.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">CSV & Ledger Export</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Export your full customer list and transaction ledger into Excel/CSV spreadsheets anytime for tax filing and accounting.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                <Server className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Self-Host Anywhere</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Deploy locally or on your own VPS with Docker. Works with JSON file storage or PostgreSQL with zero vendor lock-in.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 bg-gradient-to-br from-emerald-600 to-teal-800 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Ready for a Modern, Error-Free Shop Ledger?
          </h2>
          <p className="text-emerald-100 text-sm sm:text-base max-w-xl mx-auto">
            Get started in seconds. No demo filler, no confusing setups — just clean, reliable credit tracking.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              id="cta-google-btn"
              type="button"
              onClick={handleNativeGoogleClick}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-slate-900 bg-white hover:bg-emerald-50 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign in with Google / Gmail</span>
            </button>

            <button
              id="cta-get-started-btn"
              type="button"
              onClick={() => setAuthMode('register')}
              className="w-full sm:w-auto px-6 py-3.5 text-sm font-bold text-white bg-emerald-900/60 hover:bg-emerald-900/80 rounded-xl border border-emerald-400/40 shadow-xs transition-all cursor-pointer"
            >
              Register with Email
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-900 text-center text-xs text-slate-500 dark:text-slate-400">
        <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
          CreditTrack — Digital Customer Credit & Udhaar Management
        </p>
        <p>Built for small businesses, Kirana stores, and independent retailers. Self-host friendly.</p>
      </footer>

      {/* Auth Modal (Google / Login / Register) */}
      {authMode && (
        <div
          id="auth-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAuthMode(null);
          }}
        >
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-6 sm:p-8 animate-in zoom-in-95">
            {/* Header */}
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto mb-3 shadow-xs">
                <BookOpenCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {authMode === 'google'
                  ? 'Sign In with Google / Gmail'
                  : authMode === 'login'
                  ? 'Sign In to CreditTrack'
                  : 'Create Your Store Account'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {authMode === 'google'
                  ? 'Connect seamlessly with your Google or Gmail account'
                  : authMode === 'login'
                  ? 'Access your shop ledger and customer credit accounts'
                  : 'Start tracking customer credit with a clean empty ledger'}
              </p>
            </div>

            {/* Google / Gmail Auth View */}
            {authMode === 'google' ? (
              <div className="space-y-4">
                {googleError && (
                  <div className="p-3 text-xs font-medium text-red-700 bg-red-50 dark:bg-red-950/50 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-900">
                    {googleError}
                  </div>
                )}

                <form onSubmit={handleGoogleSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Google / Gmail Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="google-email-input"
                        type="email"
                        required
                        value={googleEmail}
                        onChange={(e) => setGoogleEmail(e.target.value)}
                        placeholder="yourname@gmail.com"
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Store Name (Optional)
                    </label>
                    <input
                      id="google-store-name-input"
                      type="text"
                      value={googleStoreName}
                      onChange={(e) => setGoogleStoreName(e.target.value)}
                      placeholder="e.g. My General Store"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <button
                    id="submit-google-auth-btn"
                    type="submit"
                    disabled={isGoogleLoading}
                    className="w-full py-2.5 flex items-center justify-center gap-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 mt-1"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>{isGoogleLoading ? 'Connecting...' : 'Sign In with Gmail / Google'}</span>
                  </button>
                </form>

                <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
                  <span>Prefer standard password? </span>
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Email / Password
                  </button>
                </div>
              </div>
            ) : authMode === 'login' ? (
              /* Standard Login Form */
              <div className="space-y-4">
                {/* Google Sign In Button */}
                <button
                  id="modal-google-login-btn"
                  type="button"
                  onClick={handleNativeGoogleClick}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 text-xs sm:text-sm font-semibold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google / Gmail</span>
                </button>

                <div className="relative flex items-center justify-center">
                  <div className="border-t border-slate-200 dark:border-slate-700 w-full" />
                  <span className="bg-white dark:bg-slate-900 px-2 text-[11px] font-medium text-slate-400 uppercase tracking-wider shrink-0">
                    or email login
                  </span>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                  {loginError && (
                    <div className="p-3 text-xs font-medium text-red-700 bg-red-50 dark:bg-red-950/50 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-900">
                      {loginError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Email Address
                    </label>
                    <input
                      id="login-email-input"
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="e.g. shopowner@example.com"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Password
                    </label>
                    <input
                      id="login-password-input"
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <button
                    id="submit-login-btn"
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isLoggingIn ? 'Signing In...' : 'Sign In'}
                  </button>

                  <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
                    <span>Don't have an account? </span>
                    <button
                      type="button"
                      onClick={() => setAuthMode('register')}
                      className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      Register Free
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* Register Form (Strictly empty fields by default) */
              <div className="space-y-4">
                <button
                  id="modal-google-reg-btn"
                  type="button"
                  onClick={handleNativeGoogleClick}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 text-xs sm:text-sm font-semibold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Quick Sign Up with Google</span>
                </button>

                <div className="relative flex items-center justify-center">
                  <div className="border-t border-slate-200 dark:border-slate-700 w-full" />
                  <span className="bg-white dark:bg-slate-900 px-2 text-[11px] font-medium text-slate-400 uppercase tracking-wider shrink-0">
                    or fill store details
                  </span>
                </div>

                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  {regError && (
                    <div className="p-3 text-xs font-medium text-red-700 bg-red-50 dark:bg-red-950/50 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-900">
                      {regError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Owner Name *
                      </label>
                      <input
                        id="reg-name-input"
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="e.g. Sunil Kumar"
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Shop / Store Name *
                      </label>
                      <input
                        id="reg-business-name-input"
                        type="text"
                        required
                        value={regBusinessName}
                        onChange={(e) => setRegBusinessName(e.target.value)}
                        placeholder="e.g. Kumar General Store"
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Phone Number *
                      </label>
                      <input
                        id="reg-phone-input"
                        type="tel"
                        required
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="e.g. 9876543210"
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Store Category
                      </label>
                      <select
                        id="reg-business-type-select"
                        value={regBusinessType}
                        onChange={(e) => setRegBusinessType(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Select store category...</option>
                        <option value="Kirana / Grocery Store">Kirana / Grocery Store</option>
                        <option value="Medical / Pharmacy">Medical / Pharmacy</option>
                        <option value="Hardware & Sanitary">Hardware & Sanitary</option>
                        <option value="Garments & Apparel">Garments & Apparel</option>
                        <option value="Electronics & Mobile">Electronics & Mobile</option>
                        <option value="Dairy & Sweets">Dairy & Sweets</option>
                        <option value="Services & Repair">Services & Repair</option>
                        <option value="Wholesale Distributor">Wholesale Distributor</option>
                        <option value="Other">Other Retail Business</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address *
                    </label>
                    <input
                      id="reg-email-input"
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="e.g. owner@example.com"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Password (min. 6 characters) *
                    </label>
                    <input
                      id="reg-password-input"
                      type="password"
                      required
                      minLength={6}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <button
                    id="submit-register-btn"
                    type="submit"
                    disabled={isRegistering}
                    className="w-full py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 mt-1"
                  >
                    {isRegistering ? 'Creating Store Account...' : 'Register Store Account'}
                  </button>

                  <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
                    <span>Already have an account? </span>
                    <button
                      type="button"
                      onClick={() => setAuthMode('login')}
                      className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      Sign In
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
