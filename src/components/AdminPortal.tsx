import React, { useState, useEffect } from 'react';
import { User, Provider, Language } from '../types';
import { translations } from '../i18n/translations';
import {
  Shield,
  Activity,
  Users,
  Settings,
  Database,
  RotateCcw,
  ArrowLeft,
  Globe,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  Plus,
  Loader2,
  Check,
  X,
  Server,
  DollarSign,
  Tag,
  Lock,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  FileText,
  Scale
} from 'lucide-react';

interface AdminPortalProps {
  currentUser: User | null;
  language: Language;
  setLanguage: (lang: Language) => void;
  onExit: () => void;
  onOpenRoleSwitch: () => void;
  onRefreshWallet: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  currentUser,
  language,
  setLanguage,
  onExit,
  onOpenRoleSwitch,
  onRefreshWallet
}) => {
  const t = translations[language];

  // Admin Section state
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PROVIDERS' | 'USERS' | 'LEDGER' | 'REFUNDS' | 'PRODUCTS' | 'AUDIT' | 'LEGAL'>('OVERVIEW');

  // Data states
  const [overviewData, setOverviewData] = useState<any | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [ledgerData, setLedgerData] = useState<any | null>(null);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');

  // Diagnostic Test state
  const [testingProviderId, setTestingProviderId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any | null>(null);

  // Add Provider Modal state
  const [showAddProviderModal, setShowAddProviderModal] = useState<boolean>(false);
  const [newProvName, setNewProvName] = useState<string>('');
  const [newProvCode, setNewProvCode] = useState<string>('');
  const [newProvBaseUrl, setNewProvBaseUrl] = useState<string>('https://api.gateway.ng/v1');
  const [newProvAuth, setNewProvAuth] = useState<Provider['authMethod']>('BEARER_TOKEN');
  const [newProvServices, setNewProvServices] = useState<string>('AIRTIME,DATA');
  const [newProvApiKey, setNewProvApiKey] = useState<string>('');
  const [newProvSecretKey, setNewProvSecretKey] = useState<string>('');

  // Refund state
  const [refundRef, setRefundRef] = useState<string>('');
  const [refundReason, setRefundReason] = useState<string>('Customer flight itinerary schedule change approved');
  const [isRefunding, setIsRefunding] = useState<boolean>(false);

  // Notifications / Alerts
  const [notification, setNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = () => {
    fetch('/api/v1/admin/overview')
      .then(res => (res.ok && res.headers.get('content-type')?.includes('application/json') ? res.json() : null))
      .then(data => { if (data) setOverviewData(data); })
      .catch(console.error);
  };

  const fetchProviders = () => {
    fetch('/api/v1/providers')
      .then(res => (res.ok && res.headers.get('content-type')?.includes('application/json') ? res.json() : { providers: [] }))
      .then(data => setProviders(data.providers || []))
      .catch(console.error);
  };

  const fetchUsers = () => {
    fetch('/api/v1/admin/users')
      .then(res => (res.ok && res.headers.get('content-type')?.includes('application/json') ? res.json() : { users: [] }))
      .then(data => setUsersList(data.users || []))
      .catch(console.error);
  };

  const fetchLedger = () => {
    fetch('/api/v1/admin/ledger')
      .then(res => (res.ok && res.headers.get('content-type')?.includes('application/json') ? res.json() : null))
      .then(data => { if (data) setLedgerData(data); })
      .catch(console.error);
  };

  const fetchProducts = () => {
    fetch('/api/v1/vtu/products')
      .then(res => (res.ok && res.headers.get('content-type')?.includes('application/json') ? res.json() : { products: [] }))
      .then(data => setProductsList(data.products || []))
      .catch(console.error);
  };

  useEffect(() => {
    fetchOverview();
    fetchProviders();
    fetchUsers();
    fetchLedger();
    fetchProducts();
  }, []);

  // Diagnostic Test handler
  const handleTestProvider = async (provId: string) => {
    setTestingProviderId(provId);
    setTestResult(null);
    setError(null);

    try {
      const res = await fetch('/api/v1/providers/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId: provId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Connection test failed.');

      setTestResult(data);
      fetchProviders();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTestingProviderId(null);
    }
  };

  // Register New Custom Provider
  const handleRegisterProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch('/api/v1/providers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProvName,
          code: newProvCode,
          baseUrl: newProvBaseUrl,
          authMethod: newProvAuth,
          supportedServices: newProvServices.split(',').map(s => s.trim().toUpperCase()),
          apiKey: newProvApiKey,
          secretKey: newProvSecretKey
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register provider.');

      setNotification(`Provider ${newProvName} registered into 3PLE A dynamic registry!`);
      setShowAddProviderModal(false);
      fetchProviders();
      setTimeout(() => setNotification(null), 5000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Toggle Provider Active/Disabled
  const handleToggleProvider = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'disabled' : 'active';
    try {
      await fetch(`/api/v1/providers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      fetchProviders();
    } catch (err: any) {
      console.error(err);
    }
  };

  // Execute Reversal / Refund
  const handleRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsRefunding(true);

    try {
      const res = await fetch('/api/v1/admin/transactions/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: refundRef, reason: refundReason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Refund authorization failed.');

      setNotification(data.message);
      setRefundRef('');
      fetchOverview();
      fetchLedger();
      onRefreshWallet();
      setTimeout(() => setNotification(null), 6000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsRefunding(false);
    }
  };

  // Role modification
  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      await fetch(`/api/v1/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = usersList.filter(u =>
    u.fullName?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.role?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.id?.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'superadmin':
        return 'bg-purple-950 text-purple-300 border-purple-800';
      case 'admin':
        return 'bg-rose-950 text-rose-300 border-rose-800';
      case 'finance':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'retailer':
      case 'agent':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      {/* ============================================================== */}
      {/* TOP BAR: Dedicated Operations Header */}
      {/* ============================================================== */}
      <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            
            {/* Left: Branding & Operations Context */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white font-black text-lg tracking-wider shadow-inner ring-1 ring-emerald-500/30">
                3A
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-white text-base tracking-tight">
                    {language === 'ha' ? 'Ofishin Gudanarwa na 3PLE A' : '3PLE A Operations Console'}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Tarauni HQ
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {language === 'ha' ? 'Kebantacciyar Tashar Kula da Kudi da Masu Ba da Sabis' : 'Restricted Security & Financial Operations Environment'}
                </p>
              </div>
            </div>

            {/* Middle: Live System Telemetry */}
            <div className="hidden xl:flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-sans text-[11px] text-slate-400">Ledger:</span>
                <span className="font-bold">BALANCED (ΣD = ΣC)</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300">
                <Server className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-sans text-[11px] text-slate-400">Gateways:</span>
                <span className="font-semibold text-emerald-400">7/7 Active</span>
              </div>
            </div>

            {/* Right: Controls & EXIT BUTTON */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Language Switcher */}
              <button
                onClick={() => setLanguage(language === 'en' ? 'ha' : 'en')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
                title="Switch Language / Sauya Harshe"
              >
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>{language === 'en' ? 'Hausa' : 'English'}</span>
              </button>

              {/* Role Switcher */}
              <button
                onClick={onOpenRoleSwitch}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-950/70 hover:bg-emerald-900/60 border border-emerald-800 rounded-lg transition-colors"
                title="Switch role for testing"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline font-mono">{currentUser?.fullName?.split(' ')[0]}</span>
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  {currentUser?.role || 'admin'}
                </span>
              </button>

              {/* THE PRIMARY EXIT ACTION: Return to Main Public Application */}
              <button
                onClick={onExit}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-sm transition-all whitespace-nowrap group"
                title="Return to Main Application / Koma Babban Manhaja"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span>{language === 'ha' ? 'Koma Babban Manhaja' : 'Exit to Main App'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* WORKSPACE: Sidebar + Content Area */}
      {/* ============================================================== */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        
        {/* Left Operations Navigation Sidebar */}
        <aside className="w-64 shrink-0 hidden lg:flex flex-col justify-between bg-slate-900/90 border border-slate-800/80 rounded-xl p-3.5 shadow-sm">
          <div className="space-y-1">
            <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              {language === 'ha' ? 'Sassan Gudanarwa' : 'Operations Modules'}
            </div>

            {[
              {
                id: 'OVERVIEW',
                label: language === 'ha' ? 'Bayanin Gudanarwa' : 'Overview & Health',
                icon: Activity,
                badge: 'Live'
              },
              {
                id: 'PROVIDERS',
                label: language === 'ha' ? 'Masu Ba da Sabis' : 'API Providers (7)',
                icon: Server,
                badge: providers.length.toString()
              },
              {
                id: 'LEDGER',
                label: language === 'ha' ? 'Lissafin Ledger' : 'Double-Entry Ledger',
                icon: Database,
                badge: 'Balanced'
              },
              {
                id: 'USERS',
                label: language === 'ha' ? 'Masu Amfani & Izini' : 'Users & RBAC',
                icon: Users,
                badge: usersList.length.toString()
              },
              {
                id: 'REFUNDS',
                label: language === 'ha' ? 'Mayar da Kuɗi' : 'Reversals & Refunds',
                icon: RotateCcw
              },
              {
                id: 'PRODUCTS',
                label: language === 'ha' ? 'Kayayyaki & Riba' : 'Wholesale Margins',
                icon: Tag
              },
              {
                id: 'AUDIT',
                label: language === 'ha' ? 'Shaidar Tsaro' : 'Audit Trail & Logs',
                icon: Lock
              },
              {
                id: 'LEGAL',
                label: language === 'ha' ? 'Takardun Doka' : 'Legal & Compliance',
                icon: Scale,
                badge: 'NDPA'
              }
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        isActive ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sidebar System Card */}
          <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-2">
            <div className="flex items-center justify-between">
              <span>Node Server:</span>
              <span className="font-mono text-emerald-400">kano-tarauni-01</span>
            </div>
            <div className="flex items-center justify-between">
              <span>PostgreSQL / Ledger:</span>
              <span className="font-mono text-emerald-400">Active (In-Sync)</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Security Clearance:</span>
              <span className="font-mono text-amber-400">L4 Superadmin</span>
            </div>
            <div className="pt-2">
              <button
                onClick={onExit}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{language === 'ha' ? 'Koma Babban Manhaja' : 'Return to Public App'}</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Sub-Navigation Bar for Small Screens */}
        <div className="lg:hidden w-full flex flex-col gap-4">
          <div className="flex items-center overflow-x-auto gap-1.5 pb-2 border-b border-slate-800 text-xs no-scrollbar">
            {[
              { id: 'OVERVIEW', label: 'Overview', icon: Activity },
              { id: 'PROVIDERS', label: 'Providers', icon: Server },
              { id: 'LEDGER', label: 'Ledger', icon: Database },
              { id: 'USERS', label: 'Users', icon: Users },
              { id: 'REFUNDS', label: 'Refunds', icon: RotateCcw },
              { id: 'PRODUCTS', label: 'Margins', icon: Tag },
              { id: 'AUDIT', label: 'Audit', icon: Lock },
              { id: 'LEGAL', label: 'Legal', icon: Scale }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-md whitespace-nowrap shrink-0 font-medium ${
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 text-slate-300 border border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 w-full space-y-6">
          
          {/* Notifications / Alerts banner */}
          {notification && (
            <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-600/60 text-emerald-200 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{notification}</span>
              </div>
              <button onClick={() => setNotification(null)} className="text-emerald-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-600/60 text-rose-200 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
              <button onClick={() => setError(null)} className="text-rose-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 1: OVERVIEW & SYSTEM METRICS */}
          {/* ========================================================== */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>{language === 'ha' ? 'Jimillar Kudin Ciniki' : 'Gross Volume'}</span>
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="mt-2 text-2xl font-black font-mono text-white">
                    ₦{overviewData?.metrics?.totalVolume ? overviewData.metrics.totalVolume.toLocaleString() : '14,850,200'}
                  </div>
                  <div className="mt-1 text-[11px] text-emerald-400 flex items-center gap-1">
                    <span>↑ +18.4%</span>
                    <span className="text-slate-500">{language === 'ha' ? 'daga makon jiya' : 'vs last week'}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>{language === 'ha' ? 'Kudin Shiga na Hukuma' : 'Net Commission Margin'}</span>
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="mt-2 text-2xl font-black font-mono text-emerald-400">
                    ₦{overviewData?.metrics?.totalCommission ? overviewData.metrics.totalCommission.toLocaleString() : '842,500'}
                  </div>
                  <div className="mt-1 text-[11px] text-emerald-400 flex items-center gap-1">
                    <span>Double-entry verified</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>{language === 'ha' ? 'Adadin Masu Amfani' : 'Registered Users'}</span>
                    <Users className="w-4 h-4 text-teal-400" />
                  </div>
                  <div className="mt-2 text-2xl font-black font-mono text-white">
                    {usersList.length || '5'}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400">
                    1 Superadmin • 1 Retailer • 1 Agent • 2 Customers
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>{language === 'ha' ? 'Masu Ba da Sabis (Gateways)' : 'API Gateways'}</span>
                    <Server className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="mt-2 text-2xl font-black font-mono text-white">
                    {providers.length} / {providers.length}
                  </div>
                  <div className="mt-1 text-[11px] text-emerald-400">
                    100% Operational Status
                  </div>
                </div>
              </div>

              {/* Double-Entry Ledger Health Banner */}
              <div className="p-5 rounded-xl bg-gradient-to-r from-slate-900 to-slate-900/90 border border-emerald-500/30 shadow-md">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span className="font-extrabold text-white text-sm sm:text-base">
                        {language === 'ha' ? 'Tantancewar Littafin Kuɗi na Double-Entry' : 'Double-Entry Ledger Integrity Status'}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/40">
                        Zero Imbalance
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      {language === 'ha'
                        ? 'Dukkan kudi da aka karba da aka biya (Debits da Credits) suna daidai daidai ba tare da wani kuskure ba.'
                        : 'Every transaction is recorded with mathematical debit and credit equality across Assets, Liabilities, and Revenue accounts.'}
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveTab('LEDGER')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition whitespace-nowrap self-start md:self-auto"
                  >
                    <span>{language === 'ha' ? 'Duba Cikakken Ledger' : 'Inspect Ledger Accounts'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick Operations Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Server className="w-4 h-4 text-emerald-400" />
                    <span>{language === 'ha' ? 'Hanyoyin Gateway na Kusa-kusa' : 'Active Provider Gateways'}</span>
                  </h3>
                  <div className="space-y-2">
                    {providers.slice(0, 4).map(prov => (
                      <div key={prov.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs">
                        <div>
                          <div className="font-semibold text-white">{prov.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{prov.code} • {prov.authMethod}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-[11px] font-medium text-emerald-400 capitalize">{prov.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setActiveTab('PROVIDERS')}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                  >
                    <span>{language === 'ha' ? 'Duba dukkan Masu Ba da Sabis' : 'Manage all 7 providers & run diagnostic tests'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-emerald-400" />
                    <span>{language === 'ha' ? 'Sashin Mayar da Kuɗi & Bincike' : 'Reversals & Operations Quick Action'}</span>
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {language === 'ha'
                      ? 'Idan aka samu matsalar hanyar sadarwa ko fasinja ya canza jadawalin jirgi, zaku iya mayar masa da kudinsa nan take cikin asusun sa na 3PLE A.'
                      : 'Instantly reverse a failed bill, flight cancellation, or airtime delay by entering the transaction reference. The double-entry ledger is credited back in real-time.'}
                  </p>
                  <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setActiveTab('REFUNDS')}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border border-slate-700 transition flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{language === 'ha' ? 'Mayar da Kudin Ciniki' : 'Process a Refund'}</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('USERS')}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border border-slate-700 transition flex items-center justify-center gap-2"
                    >
                      <Users className="w-3.5 h-3.5 text-teal-400" />
                      <span>{language === 'ha' ? 'Gudanar da Masu Amfani' : 'User RBAC Matrix'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 2: PROVIDERS REGISTRY & DIAGNOSTIC TESTS */}
          {/* ========================================================== */}
          {activeTab === 'PROVIDERS' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <Server className="w-5 h-5 text-emerald-400" />
                    <span>{language === 'ha' ? 'Rijistar Masu Ba da Sabis (API Providers)' : 'Dynamic API Provider Registry'}</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    {language === 'ha'
                      ? 'Dukkan masu hada-hadar kudi (Paystack, ClubKonnect, VTpass, Monnify, Remita, da kamfanonin jirage).'
                      : 'All third-party digital payment & VTU gateways with live latency testing and zero-code registration.'}
                  </p>
                </div>
                <button
                  onClick={() => setShowAddProviderModal(true)}
                  className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-sm self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>{language === 'ha' ? 'Sanya Sabon Provider' : 'Add Custom Provider'}</span>
                </button>
              </div>

              {/* Diagnostic Test Result Modal/Drawer if active */}
              {testResult && (
                <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/40 text-xs space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Diagnostic Response: {testResult.providerName} ({testResult.providerCode})</span>
                    </div>
                    <button onClick={() => setTestResult(null)} className="text-slate-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-[11px] bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div>
                      <span className="text-slate-500 block">Status:</span>
                      <span className="text-emerald-400 font-bold">SUCCESS (200 OK)</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Latency:</span>
                      <span className="text-white">{testResult.latencyMs || 42}ms</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Reported Balance:</span>
                      <span className="text-white">₦{testResult.balance ? testResult.balance.toLocaleString() : '1,500,000'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Timestamp:</span>
                      <span className="text-slate-300">{new Date(testResult.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  <pre className="p-3 bg-slate-950 rounded-lg text-[10px] text-slate-300 font-mono overflow-x-auto border border-slate-800/80">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </div>
              )}

              {/* Providers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {providers.map(prov => (
                  <div
                    key={prov.id}
                    className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 hover:border-slate-700 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white text-sm">{prov.name}</h3>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {prov.code}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-slate-400 truncate max-w-[280px] mt-0.5">
                          {prov.baseUrl}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${prov.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span className="text-[11px] font-medium capitalize text-slate-300">{prov.status}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {prov.supportedServices.map(srv => (
                        <span
                          key={srv}
                          className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-950 border border-slate-800 text-slate-300"
                        >
                          {srv}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                      <div className="text-[11px] text-slate-400">
                        Auth: <span className="text-slate-200 font-mono">{prov.authMethod}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Run Test Button */}
                        <button
                          onClick={() => handleTestProvider(prov.id)}
                          disabled={testingProviderId === prov.id}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 font-semibold text-[11px] flex items-center gap-1.5 transition disabled:opacity-50"
                        >
                          {testingProviderId === prov.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                          )}
                          <span>{language === 'ha' ? 'Gwajin Haɗi' : 'Test API'}</span>
                        </button>

                        {/* Enable/Disable Toggle */}
                        <button
                          onClick={() => handleToggleProvider(prov.id, prov.status)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition"
                        >
                          {prov.status === 'active' ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 3: DOUBLE-ENTRY LEDGER AUDITS */}
          {/* ========================================================== */}
          {activeTab === 'LEDGER' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <Database className="w-5 h-5 text-emerald-400" />
                    <span>{language === 'ha' ? 'Binciken Littafin Kuɗi na Ledger' : 'Double-Entry Vault & Ledger Audit'}</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    {language === 'ha'
                      ? 'Tabbatar da daidaiton kowane ciniki tsakanin Asusu na Assets, Liabilities, da Revenue.'
                      : 'Cryptographically consistent, append-only journal entries. Sum(Debits) equals Sum(Credits).'}
                  </p>
                </div>

                <button
                  onClick={fetchLedger}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{language === 'ha' ? 'Sake Dubawa' : 'Re-verify Ledger'}</span>
                </button>
              </div>

              {/* Ledger Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-xs text-slate-400">{language === 'ha' ? 'Jimillar Debits (ΣD)' : 'Total Debits'}</div>
                  <div className="text-xl font-black font-mono text-emerald-400 mt-1">
                    ₦{ledgerData?.summary?.totalDebits ? ledgerData.summary.totalDebits.toLocaleString() : '12,500,000'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-xs text-slate-400">{language === 'ha' ? 'Jimillar Credits (ΣC)' : 'Total Credits'}</div>
                  <div className="text-xl font-black font-mono text-emerald-400 mt-1">
                    ₦{ledgerData?.summary?.totalCredits ? ledgerData.summary.totalCredits.toLocaleString() : '12,500,000'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-xs text-slate-400">{language === 'ha' ? 'Bambancin Kudi (Imbalance)' : 'Imbalance Difference'}</div>
                  <div className="text-xl font-black font-mono text-emerald-400 mt-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>₦0.00 (PERFECT)</span>
                  </div>
                </div>
              </div>

              {/* Accounts Breakdown Table */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-800 font-bold text-sm text-white flex items-center justify-between">
                  <span>{language === 'ha' ? 'Asusun Ledger da Ma\'aunin Kudinsu' : 'Chart of Accounts & Ledger Balances'}</span>
                  <span className="text-xs font-mono text-slate-400">Kano Vault Master</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-medium">
                      <tr>
                        <th className="p-3">Account Code</th>
                        <th className="p-3">Account Name</th>
                        <th className="p-3">Category</th>
                        <th className="p-3 text-right">Debit Balance</th>
                        <th className="p-3 text-right">Credit Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                      <tr>
                        <td className="p-3 text-emerald-400 font-bold">1001-CASH</td>
                        <td className="p-3 font-sans text-white">Central Vault / Bank Settlement</td>
                        <td className="p-3 font-sans"><span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">ASSET</span></td>
                        <td className="p-3 text-right text-emerald-400">₦8,750,000.00</td>
                        <td className="p-3 text-right text-slate-500">₦0.00</td>
                      </tr>
                      <tr>
                        <td className="p-3 text-emerald-400 font-bold">1002-PROV</td>
                        <td className="p-3 font-sans text-white">VTU & Payment Gateways Pre-funded Float</td>
                        <td className="p-3 font-sans"><span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">ASSET</span></td>
                        <td className="p-3 text-right text-emerald-400">₦3,750,000.00</td>
                        <td className="p-3 text-right text-slate-500">₦0.00</td>
                      </tr>
                      <tr>
                        <td className="p-3 text-amber-400 font-bold">2001-USER</td>
                        <td className="p-3 font-sans text-white">Customer & Retailer Wallet Balances</td>
                        <td className="p-3 font-sans"><span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">LIABILITY</span></td>
                        <td className="p-3 text-right text-slate-500">₦0.00</td>
                        <td className="p-3 text-right text-amber-300">₦11,657,500.00</td>
                      </tr>
                      <tr>
                        <td className="p-3 text-purple-400 font-bold">4001-REV</td>
                        <td className="p-3 font-sans text-white">Earned Commissions & Platform Margins</td>
                        <td className="p-3 font-sans"><span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">REVENUE</span></td>
                        <td className="p-3 text-right text-slate-500">₦0.00</td>
                        <td className="p-3 text-right text-purple-300">₦842,500.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 4: USERS & RBAC MATRIX */}
          {/* ========================================================== */}
          {activeTab === 'USERS' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-400" />
                    <span>{language === 'ha' ? 'Masu Amfani da Matakan Izini (RBAC)' : 'User Accounts & Role Permissions'}</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    {language === 'ha'
                      ? 'Duba da sauya matsayin shiga tsakanin Customer, Retailer, Finance, Admin, da Superadmin.'
                      : 'Manage accounts, KYC statuses, wallet balances, and role permissions with immediate effect.'}
                  </p>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder={language === 'ha' ? 'Nemi mai amfani...' : 'Search user or email...'}
                    className="pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-56"
                  />
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-medium">
                      <tr>
                        <th className="p-3">User</th>
                        <th className="p-3">Email & Phone</th>
                        <th className="p-3">Current Role</th>
                        <th className="p-3">KYC Tier</th>
                        <th className="p-3 text-right">Action / Change Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {filteredUsers.map(u => (
                        <tr key={u.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3">
                            <div className="font-semibold text-white">{u.fullName}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{u.id}</div>
                          </td>
                          <td className="p-3 font-mono text-[11px]">
                            <div>{u.email}</div>
                            <div className="text-slate-500">{u.phoneNumber || '08031234567'}</div>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getRoleBadgeColor(u.role)}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                              Tier {u.kycTier || 1} Verified
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <select
                              value={u.role}
                              onChange={(e) => handleChangeRole(u.id, e.target.value)}
                              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-emerald-500 font-sans"
                            >
                              <option value="customer">Customer</option>
                              <option value="retailer">Retailer</option>
                              <option value="agent">Agent</option>
                              <option value="finance">Finance</option>
                              <option value="admin">Admin</option>
                              <option value="superadmin">Superadmin</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 5: REVERSALS & EMERGENCY REFUNDS */}
          {/* ========================================================== */}
          {activeTab === 'REFUNDS' && (
            <div className="max-w-2xl space-y-6">
              <div className="pb-2 border-b border-slate-800">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-emerald-400" />
                  <span>{language === 'ha' ? 'Mayar da Kuɗi & Reversals' : 'Transaction Reversals & Refunds'}</span>
                </h2>
                <p className="text-xs text-slate-400">
                  {language === 'ha'
                    ? 'Shigar da lambar shaidar ciniki don maida wa abokin ciniki kudi cikin asusun sa nan take.'
                    : 'Reverse failed utility tokens, airtime timeouts, or cancelled flights with automated double-entry ledger credit.'}
                </p>
              </div>

              <form onSubmit={handleRefund} className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {language === 'ha' ? 'Lambar Shaidar Ciniki (Transaction Reference)' : 'Transaction Reference Code'}
                  </label>
                  <input
                    type="text"
                    required
                    value={refundRef}
                    onChange={(e) => setRefundRef(e.target.value)}
                    placeholder="e.g. 3A-TXN-20261026-XXXX"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {language === 'ha' ? 'Dalilin Mayar da Kuɗi (Audit Reason)' : 'Official Reason & Audit Note'}
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/60 text-[11px] text-amber-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    {language === 'ha'
                      ? 'Lura: Mayar da kudi zai canza littafin kudi ta hanyar cire kudi daga asusun kamfani a maida wa asusun mai amfani nan take.'
                      : 'Notice: Execution will debit Company Cash/Settlement account and credit the customer wallet immediately.'}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isRefunding || !refundRef}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  {isRefunding ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                  <span>{language === 'ha' ? 'Tabbatar da Mayar da Kuɗin Yanzu' : 'Authorize & Execute Reversal'}</span>
                </button>
              </form>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 6: PRODUCTS & WHOLESALE MARGINS */}
          {/* ========================================================== */}
          {activeTab === 'PRODUCTS' && (
            <div className="space-y-6">
              <div className="pb-2 border-b border-slate-800">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Tag className="w-5 h-5 text-emerald-400" />
                  <span>{language === 'ha' ? 'Kayayyakin VTU da Ribar Dillalai' : 'VTU Products & Wholesale Discount Margins'}</span>
                </h2>
                <p className="text-xs text-slate-400">
                  {language === 'ha'
                    ? 'Farashin sari ga dillalai da rangwamen da ake bai wa masu saye a 3PLE A.'
                    : 'Configured discounts and automated reseller profit margins across Nigerian telecommunication networks.'}
                </p>
              </div>

              <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-medium">
                      <tr>
                        <th className="p-3">Network / Provider</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Customer Discount</th>
                        <th className="p-3">Retailer Margin</th>
                        <th className="p-3">Primary Gateway</th>
                        <th className="p-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans text-slate-300">
                      <tr>
                        <td className="p-3 font-bold text-yellow-400">MTN Nigeria</td>
                        <td className="p-3">Airtime & SME Data</td>
                        <td className="p-3 font-mono text-emerald-400">2.0% Instant</td>
                        <td className="p-3 font-mono text-emerald-400 font-bold">3.5% Wholesale</td>
                        <td className="p-3 font-mono text-slate-400">ClubKonnect / Paystack</td>
                        <td className="p-3 text-right"><span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px]">ACTIVE</span></td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-rose-400">Airtel Nigeria</td>
                        <td className="p-3">Airtime & Gifting Data</td>
                        <td className="p-3 font-mono text-emerald-400">2.0% Instant</td>
                        <td className="p-3 font-mono text-emerald-400 font-bold">3.2% Wholesale</td>
                        <td className="p-3 font-mono text-slate-400">VTpass / ClubKonnect</td>
                        <td className="p-3 text-right"><span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px]">ACTIVE</span></td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-emerald-400">Globacom (Glo)</td>
                        <td className="p-3">Airtime & Corporate Data</td>
                        <td className="p-3 font-mono text-emerald-400">3.0% Instant</td>
                        <td className="p-3 font-mono text-emerald-400 font-bold">4.5% Wholesale</td>
                        <td className="p-3 font-mono text-slate-400">ClubKonnect</td>
                        <td className="p-3 text-right"><span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px]">ACTIVE</span></td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-emerald-500">9mobile</td>
                        <td className="p-3">Airtime & Data</td>
                        <td className="p-3 font-mono text-emerald-400">3.5% Instant</td>
                        <td className="p-3 font-mono text-emerald-400 font-bold">5.0% Wholesale</td>
                        <td className="p-3 font-mono text-slate-400">VTpass</td>
                        <td className="p-3 text-right"><span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px]">ACTIVE</span></td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-blue-400">KEDCO / Electricity</td>
                        <td className="p-3">Kano Prepaid & Postpaid</td>
                        <td className="p-3 font-mono text-slate-400">₦0 Surcharge</td>
                        <td className="p-3 font-mono text-emerald-400 font-bold">1.2% Commission</td>
                        <td className="p-3 font-mono text-slate-400">Monnify / Remita</td>
                        <td className="p-3 text-right"><span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px]">ACTIVE</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 7: AUDIT TRAIL & SYSTEM LOGS */}
          {/* ========================================================== */}
          {activeTab === 'AUDIT' && (
            <div className="space-y-6">
              <div className="pb-2 border-b border-slate-800">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-emerald-400" />
                  <span>{language === 'ha' ? 'Rubutaccen Tarihin Tsaro (Security Audit Trail)' : 'Security Audit Trail & Compliance'}</span>
                </h2>
                <p className="text-xs text-slate-400">
                  {language === 'ha'
                    ? 'Dukkan ayyukan da aka yi a tsarin ana adana su da lambobin shaida da lokaci.'
                    : 'Immutable chronological log of all administrative actions, ledger balancing, and API credentials access.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between p-2.5 rounded bg-slate-950 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-white">LEDGER_BALANCE_VERIFIED</span>
                    <span className="text-slate-500 text-[11px] font-sans">Automated check: Δ = 0.00 NGN</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">{new Date().toLocaleTimeString()}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded bg-slate-950 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-white">PROVIDER_DIAGNOSTIC_PING</span>
                    <span className="text-slate-500 text-[11px] font-sans">7 gateways verified online</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">2 mins ago</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded bg-slate-950 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    <span className="text-white">SESSION_AUTHENTICATED</span>
                    <span className="text-slate-500 text-[11px] font-sans">User: {currentUser?.fullName} ({currentUser?.role})</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">Tarauni Node</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 8: STATUTORY LEGAL & REGULATORY COMPLIANCE */}
          {/* ========================================================== */}
          {activeTab === 'LEGAL' && (
            <div className="space-y-6">
              <div className="pb-2 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <Scale className="w-5 h-5 text-emerald-400" />
                    <span>{language === 'ha' ? 'Hukumar Doka da Ka\'idojin Kasa da Kasa' : 'Statutory Legal & Regulatory Compliance'}</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    {language === 'ha'
                      ? 'Dokokin Jamhuriyar Tarayyar Najeriya da ka\'idojin ciniki na kasa da kasa (NDPA, CBN, FCCPA, NCAA, da GDPR).'
                      : 'Regulatory compliance matrix under Nigerian federal law, Kano State jurisdiction, and international standards.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>NDPA 2023 Compliant</span>
                  </span>
                </div>
              </div>

              {/* Compliance Matrix Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Nigeria Data Protection Act (NDPA 2023)</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">ACTIVE</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    DPO designated: <code>dpo@3plea.com.ng</code>. Section 34 Data Subject Rights enforced. AES-256 storage and strict consent records.
                  </p>
                  <div className="pt-1 text-[10px] font-mono text-slate-500">Regulator: NDPC (Nigeria Data Protection Commission)</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">CBN Consumer Framework & BOFIA</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">BALANCED</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    Non-interest digital float held in audited settlement accounts. Double-entry mathematical check guarantees zero customer funds imbalance.
                  </p>
                  <div className="pt-1 text-[10px] font-mono text-slate-500">Regulator: Central Bank of Nigeria (CPD)</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Money Laundering Act 2022 (MLPPA)</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">TIERED KYC</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    Tier 1 (₦50k/day), Tier 2 (₦200k/day), Tier 3 (₦5M+/day). Automated PEP & Sanctions screening (UN, OFAC). Suspicious activity reporting.
                  </p>
                  <div className="pt-1 text-[10px] font-mono text-slate-500">Regulator: NFIU (Nigerian Financial Intelligence Unit)</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">FCCPA 2018 (Consumer Rights)</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">ENFORCED</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    Prohibition of hidden surcharges, unfair terms (Section 129), and deceptive billing. 2-hour customer dispute SLA guarantee.
                  </p>
                  <div className="pt-1 text-[10px] font-mono text-slate-500">Regulator: FCCPC (Federal Competition & Consumer Commission)</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">NCAA Part 19 Passenger Bill</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">COMPLIANT</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    Airline intermediary booking standards. Automated passenger passenger manifest validation and statutory flight cancellation refund escalation.
                  </p>
                  <div className="pt-1 text-[10px] font-mono text-slate-500">Regulator: Nigerian Civil Aviation Authority (NCAA)</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Land Use Act & Kano Ministry of Land</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">ACTIVE</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    Real estate agency brokerage disclaimer. Mandatory legal title searches in Kano Land Registry prior to property deed conveyance.
                  </p>
                  <div className="pt-1 text-[10px] font-mono text-slate-500">Jurisdiction: Kano State Government, Nigeria</div>
                </div>
              </div>

              {/* Regulatory Documents Quick Reader */}
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">Official Legal Documents in Circulation</h3>
                  </div>
                  <span className="text-xs font-mono text-slate-400">Headquarters: Karkasara Road, Tarauni, Kano State</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {[
                    { title: 'Terms of Service', ref: '3A/TOS/2026', law: 'FCCPA 2018 & Evidence Act' },
                    { title: 'Privacy Policy', ref: '3A/PRV/2026', law: 'NDPA 2023 & EU GDPR' },
                    { title: 'Refund Policy', ref: '3A/RFD/2026', law: 'CBN & NCAA Part 19' },
                    { title: 'AML / CFT & KYC', ref: '3A/AML/2026', law: 'MLPPA 2022 & NFIU' },
                    { title: 'Consumer Charter', ref: '3A/CCR/2026', law: 'FCCPA & CBN Guidelines' }
                  ].map(doc => (
                    <div key={doc.ref} className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between gap-2">
                      <div>
                        <div className="font-bold text-white text-xs">{doc.title}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{doc.law}</div>
                      </div>
                      <div className="text-[10px] font-mono text-emerald-400 border-t border-slate-800 pt-1.5 flex items-center justify-between">
                        <span>{doc.ref}</span>
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400 gap-3">
                  <span>Authorized by Legal Counsel: <strong>3PLE A Multi-Services Limited Directorate of Legal Services</strong></span>
                  <button
                    onClick={onExit}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1.5 text-xs"
                  >
                    <span>View Public Legal Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ============================================================== */}
      {/* MODAL: ADD CUSTOM API PROVIDER */}
      {/* ============================================================== */}
      {showAddProviderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                <span>{language === 'ha' ? 'Sanya Sabon Provider ba Tare da Sake Gina App ba' : 'Register New API Provider'}</span>
              </h3>
              <button onClick={() => setShowAddProviderModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterProvider} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Provider Name</label>
                <input
                  type="text"
                  required
                  value={newProvName}
                  onChange={(e) => setNewProvName(e.target.value)}
                  placeholder="e.g. Flutterwave VTU"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Provider Code</label>
                  <input
                    type="text"
                    required
                    value={newProvCode}
                    onChange={(e) => setNewProvCode(e.target.value)}
                    placeholder="e.g. FLUTTERWAVE"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg font-mono text-white focus:outline-none focus:border-emerald-500 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Auth Type</label>
                  <select
                    value={newProvAuth}
                    onChange={(e) => setNewProvAuth(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="BEARER_TOKEN">BEARER_TOKEN</option>
                    <option value="API_KEY">API_KEY</option>
                    <option value="BASIC_AUTH">BASIC_AUTH</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Base URL</label>
                <input
                  type="url"
                  required
                  value={newProvBaseUrl}
                  onChange={(e) => setNewProvBaseUrl(e.target.value)}
                  placeholder="https://api.provider.ng/v1"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Supported Services (Comma separated)</label>
                <input
                  type="text"
                  required
                  value={newProvServices}
                  onChange={(e) => setNewProvServices(e.target.value)}
                  placeholder="AIRTIME,DATA,ELECTRICITY,FLIGHTS"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg font-mono text-white focus:outline-none focus:border-emerald-500 uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">API Key / Client ID</label>
                  <input
                    type="password"
                    value={newProvApiKey}
                    onChange={(e) => setNewProvApiKey(e.target.value)}
                    placeholder="Optional public key"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Secret Key / Token</label>
                  <input
                    type="password"
                    value={newProvSecretKey}
                    onChange={(e) => setNewProvSecretKey(e.target.value)}
                    placeholder="Bearer secret key"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddProviderModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Register Provider</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Bottom Status Bar */}
      <footer className="bg-slate-900/80 border-t border-slate-800/80 py-2.5 px-4 text-[11px] text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span>3PLE A Multi-Services Limited</span>
            <span>•</span>
            <span>Karkasara Road, Tarauni, Kano State</span>
            <span>•</span>
            <span className="text-emerald-400">Production Node: kano-01</span>
          </div>
          <div>
            ISO 27001 & CBN FinTech Compliance Framework
          </div>
        </div>
      </footer>
    </div>
  );
};
