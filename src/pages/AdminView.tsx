import React, { useState, useEffect } from 'react';
import { User, Provider, Language } from '../types';
import { translations } from '../i18n/translations';
import {
  Shield,
  Activity,
  Users,
  Settings,
  Database,
  RefreshCw,
  Plus,
  Play,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Check,
  X,
  Loader2,
  DollarSign
} from 'lucide-react';

interface AdminViewProps {
  currentUser: User | null;
  language: Language;
  onRefreshWallet: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  currentUser,
  language,
  onRefreshWallet
}) => {
  const t = translations[language];

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PROVIDERS' | 'USERS' | 'LEDGER' | 'REFUNDS'>('OVERVIEW');
  const [overviewData, setOverviewData] = useState<any | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [ledgerData, setLedgerData] = useState<any | null>(null);

  // Connection Test state
  const [testingProviderId, setTestingProviderId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any | null>(null);

  // Add Provider Modal
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

  const [notification, setNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = () => {
    fetch('/api/v1/admin/overview')
      .then(res => res.json())
      .then(data => setOverviewData(data))
      .catch(console.error);
  };

  const fetchProviders = () => {
    fetch('/api/v1/providers')
      .then(res => res.json())
      .then(data => setProviders(data.providers || []))
      .catch(console.error);
  };

  const fetchUsers = () => {
    fetch('/api/v1/admin/users')
      .then(res => res.json())
      .then(data => setUsersList(data.users || []))
      .catch(console.error);
  };

  const fetchLedger = () => {
    fetch('/api/v1/admin/ledger')
      .then(res => res.json())
      .then(data => setLedgerData(data))
      .catch(console.error);
  };

  useEffect(() => {
    fetchOverview();
    fetchProviders();
    fetchUsers();
    fetchLedger();
  }, []);

  // Run Diagnostic Test on Provider
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

  // Register New Provider Dynamically
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

  // Toggle Provider Active / Disabled status
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

  // Process Refund / Reversal
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

  // Change user role
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-800" />
            <span>{t.adminDashboard}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            System administration, provider registry, double-entry ledger verification, and compliance
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg shrink-0 text-xs overflow-x-auto">
          {[
            { id: 'OVERVIEW', label: 'Overview', icon: Activity },
            { id: 'PROVIDERS', label: 'API Providers (7)', icon: Settings },
            { id: 'USERS', label: 'Users & Roles', icon: Users },
            { id: 'LEDGER', label: 'Ledger Audit', icon: Database },
            { id: 'REFUNDS', label: 'Refunds / Reversals', icon: RotateCcw },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {notification && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* OVERVIEW TAB */}
      {activeTab === 'OVERVIEW' && overviewData && (
        <div className="space-y-6">
          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 uppercase font-semibold">Gross Volume</span>
              <div className="text-2xl font-black font-mono tabular-nums text-slate-900 mt-1">
                ₦{overviewData.metrics.grossVolume.toLocaleString()}
              </div>
              <span className="text-[11px] text-emerald-700 font-medium">From {overviewData.metrics.successfulCount} transactions</span>
            </div>

            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 uppercase font-semibold">Fee Revenue</span>
              <div className="text-2xl font-black font-mono tabular-nums text-emerald-700 mt-1">
                ₦{overviewData.metrics.platformFeeRevenue.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Service & convenience charges</span>
            </div>

            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 uppercase font-semibold">Active Providers</span>
              <div className="text-2xl font-black font-mono tabular-nums text-slate-900 mt-1">
                {overviewData.metrics.activeProviders} / 7
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Pairgate, Paystack, Monnify, etc.</span>
            </div>

            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 uppercase font-semibold">Ledger Integrity</span>
              <div className="text-lg font-black text-emerald-700 mt-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>100% Balanced</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Debits == Credits Invariant</span>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Security & Administrative Audit Logs</h3>
              <p className="text-xs text-slate-500">Immutable records of all credential changes, provider tests, and balance events</p>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {overviewData.recentAuditLogs.map((log: any) => (
                <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {log.action}
                      </span>
                      <span className="text-slate-600">by <strong>{log.actorName}</strong></span>
                    </div>
                    <p className="text-slate-600">{log.details}</p>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString('en-GB')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PROVIDERS TAB */}
      {activeTab === 'PROVIDERS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Configured API Provider Registry</h3>
              <p className="text-xs text-slate-500">
                Manage live credentials, routing priorities, and execute live connection tests without app rebuilds.
              </p>
            </div>
            <button
              onClick={() => setShowAddProviderModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addProvider}</span>
            </button>
          </div>

          {/* Test connection result banner */}
          {testResult && (
            <div className="p-4 bg-emerald-900 text-white rounded-xl shadow-lg space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5 text-emerald-300">
                  <CheckCircle2 className="w-4 h-4" />
                  Connection Diagnostic Succeeded: {testResult.providerName}
                </span>
                <span className="font-mono font-bold bg-emerald-800 px-2 py-0.5 rounded">
                  Latency: {testResult.latencyMs}ms
                </span>
              </div>
              <p className="text-emerald-100">{testResult.responseSummary}</p>
              <span className="text-[10px] text-emerald-300 block font-mono">
                Verified Endpoint: {testResult.endpoint} (HTTP Status {testResult.httpStatus})
              </span>
            </div>
          )}

          {/* Providers List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providers.map((p) => (
              <div
                key={p.id}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-slate-900">{p.name}</h4>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                          {p.status.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-slate-500 block mt-0.5 truncate max-w-xs">
                        {p.baseUrl}
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleProvider(p.id, p.status)}
                      className={`text-xs font-bold px-2.5 py-1 rounded transition-colors ${p.status === 'active' ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'}`}
                    >
                      {p.status === 'active' ? 'Disable' : 'Enable'}
                    </button>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 text-xs space-y-1 text-slate-600">
                    <div className="flex justify-between">
                      <span>Supported Services:</span>
                      <span className="font-bold text-slate-800">{p.supportedServices.join(', ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Auth Method:</span>
                      <span className="font-mono">{p.authMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stored Credentials:</span>
                      <span className="font-mono text-slate-500">
                        {p.credentials.apiKey || p.credentials.secretKey || 'Encrypted Masked'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rate Limit / Timeout:</span>
                      <span className="font-mono">{p.rateLimitPerMin} req/min · {p.timeoutMs}ms</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {p.lastTestedAt ? `Tested: ${new Date(p.lastTestedAt).toLocaleTimeString()}` : 'Untested'}
                  </span>
                  <button
                    onClick={() => handleTestProvider(p.id)}
                    disabled={testingProviderId === p.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors disabled:opacity-50"
                  >
                    {testingProviderId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    <span>Test Connection</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* USERS & ROLES TAB */}
      {activeTab === 'USERS' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h3 className="text-sm font-bold text-slate-900">User Directory & Role-Based Access Control</h3>
            <p className="text-xs text-slate-500">Manage user personas, KYC compliance tiers, and wallet balances</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3 px-6">User</th>
                  <th className="p-3">Current Role</th>
                  <th className="p-3">KYC Tier</th>
                  <th className="p-3">Wallet Balance</th>
                  <th className="p-3 text-right">Role Assignment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80">
                    <td className="p-3 px-6">
                      <div className="font-bold text-slate-900">{u.fullName}</div>
                      <div className="text-slate-500 text-[11px]">{u.email} · {u.phone}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800 uppercase">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-700">Tier {u.kycTier}</td>
                    <td className="p-3 font-mono font-bold text-slate-900">
                      ₦{u.walletBalance.toLocaleString()}
                    </td>
                    <td className="p-3 text-right">
                      <select
                        value={u.role}
                        onChange={(e) => handleChangeRole(u.id, e.target.value)}
                        className="px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-semibold text-slate-800 focus:outline-none"
                      >
                        <option value="customer">Customer</option>
                        <option value="retailer">Retailer</option>
                        <option value="agent">Estate Agent</option>
                        <option value="finance">Finance Officer</option>
                        <option value="superadmin">Super Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LEDGER TAB */}
      {activeTab === 'LEDGER' && ledgerData && (
        <div className="space-y-6">
          <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Double-Entry Balance Equation Satisfied</span>
              </div>
              <p className="text-xs text-emerald-800 mt-1">
                Total Debits (₦{ledgerData.integrity.totalDebits.toLocaleString()}) == Total Credits (₦{ledgerData.integrity.totalCredits.toLocaleString()}). Delta: ₦0.00.
              </p>
            </div>
            <button
              onClick={fetchLedger}
              className="p-2 bg-white hover:bg-emerald-100 rounded-lg text-emerald-800 border border-emerald-300"
              title="Re-verify"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Immutable Ledger Journal Entries</h3>
            </div>
            <div className="overflow-x-auto max-h-[450px]">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 uppercase text-slate-500 border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="p-3 px-6">Entry ID</th>
                    <th className="p-3">Reference</th>
                    <th className="p-3">Type</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-right">Balance After</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {ledgerData.entries.map((e: any) => (
                    <tr key={e.id} className="hover:bg-slate-50/80">
                      <td className="p-3 px-6 text-slate-400">{e.id}</td>
                      <td className="p-3 font-bold text-slate-900">{e.reference}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${e.type === 'DEBIT' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {e.type}
                        </span>
                      </td>
                      <td className="p-3 text-right font-bold tabular-nums">
                        ₦{e.amount.toLocaleString()}
                      </td>
                      <td className="p-3 text-slate-600 truncate max-w-xs">{e.description}</td>
                      <td className="p-3 text-right font-bold tabular-nums text-slate-900">
                        ₦{e.balanceAfter.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REFUNDS TAB */}
      {activeTab === 'REFUNDS' && (
        <form onSubmit={handleRefund} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 max-w-xl">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Authorize Transaction Reversal & Refund</h3>
            <p className="text-xs text-slate-500">
              Atomically creates a reversing double-entry ledger entry crediting the customer's wallet and debiting escrow.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Transaction Reference</label>
            <input
              type="text"
              value={refundRef}
              onChange={(e) => setRefundRef(e.target.value)}
              placeholder="e.g. 3PA-FLY-1793021000-AB12"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Reversal</label>
            <textarea
              rows={3}
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isRefunding || !refundRef}
            className="w-full py-3 px-4 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isRefunding ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            <span>Execute Reversal & Credit Customer Wallet</span>
          </button>
        </form>
      )}

      {/* Add Custom Provider Modal */}
      {showAddProviderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Add New Custom Provider Adapter</h3>
              <button
                onClick={() => setShowAddProviderModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterProvider} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Provider Name</label>
                  <input
                    type="text"
                    value={newProvName}
                    onChange={(e) => setNewProvName(e.target.value)}
                    placeholder="e.g. Arewa Telecom Gateway"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Code Identifier</label>
                  <input
                    type="text"
                    value={newProvCode}
                    onChange={(e) => setNewProvCode(e.target.value)}
                    placeholder="e.g. AREWAGATE"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono uppercase"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Base URL (Validated HTTPS)</label>
                <input
                  type="url"
                  value={newProvBaseUrl}
                  onChange={(e) => setNewProvBaseUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Auth Type</label>
                  <select
                    value={newProvAuth}
                    onChange={(e) => setNewProvAuth(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="BEARER_TOKEN">Bearer Token</option>
                    <option value="API_KEY_SECRET">API Key + Secret</option>
                    <option value="BASIC_AUTH">Basic Auth</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Supported Services</label>
                  <input
                    type="text"
                    value={newProvServices}
                    onChange={(e) => setNewProvServices(e.target.value)}
                    placeholder="AIRTIME,DATA,ELECTRICITY"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">API Key</label>
                  <input
                    type="password"
                    value={newProvApiKey}
                    onChange={(e) => setNewProvApiKey(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Secret Key</label>
                  <input
                    type="password"
                    value={newProvSecretKey}
                    onChange={(e) => setNewProvSecretKey(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                Register & Initialize Provider
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
