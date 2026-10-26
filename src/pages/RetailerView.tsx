import React, { useState, useEffect } from 'react';
import { User, WalletInfo, Language } from '../types';
import { translations } from '../i18n/translations';
import { Store, Key, Layers, TrendingUp, CheckCircle2, AlertCircle, ArrowRight, Loader2, Copy, Shield, RefreshCw } from 'lucide-react';

interface RetailerViewProps {
  currentUser: User | null;
  wallet: WalletInfo | null;
  language: Language;
  onRefreshWallet: () => void;
}

export const RetailerView: React.FC<RetailerViewProps> = ({
  currentUser,
  wallet,
  language,
  onRefreshWallet
}) => {
  const t = translations[language];

  const [activeTab, setActiveTab] = useState<'MARGINS' | 'BULK' | 'KEYS'>('MARGINS');
  const [pricingMatrix, setPricingMatrix] = useState<any>({ airtime: [], data: [] });

  // Bulk VTU state
  const [bulkInput, setBulkInput] = useState<string>(
    '08031122334, 1000, MTN\n08029988776, 500, AIRTEL\n08055566778, 2000, GLO\n08091144556, 1500, 9MOBILE'
  );
  const [isProcessingBulk, setIsProcessingBulk] = useState<boolean>(false);
  const [bulkResults, setBulkResults] = useState<any | null>(null);

  // API Keys state
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState<string>('My Production Reseller App');
  const [newKeyEnv, setNewKeyEnv] = useState<'LIVE' | 'SANDBOX'>('LIVE');
  const [generatedKeyResult, setGeneratedKeyResult] = useState<any | null>(null);
  const [isGeneratingKey, setIsGeneratingKey] = useState<boolean>(false);

  // Commission withdrawal state
  const [commissionAmount, setCommissionAmount] = useState<string>('10000');
  const [commissionBalance, setCommissionBalance] = useState<number>(28400);
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);

  const [notification, setNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPricing = () => {
    fetch('/api/v1/retailer/pricing-matrix')
      .then(res => res.json())
      .then(data => setPricingMatrix(data))
      .catch(console.error);
  };

  const fetchApiKeys = () => {
    fetch(`/api/v1/retailer/api-keys?userId=${currentUser?.id || 'usr_retailer_1'}`)
      .then(res => res.json())
      .then(data => setApiKeys(data.keys || []))
      .catch(console.error);
  };

  useEffect(() => {
    fetchPricing();
    fetchApiKeys();
  }, [currentUser]);

  // Handle Bulk VTU Execution
  const handleExecuteBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotification(null);
    setBulkResults(null);

    const lines = bulkInput.trim().split('\n');
    const items = lines.map(line => {
      const parts = line.split(',').map(p => p.trim());
      return {
        phone: parts[0] || '',
        amount: parts[1] || '0',
        network: parts[2] || 'MTN'
      };
    }).filter(i => i.phone && i.amount);

    if (items.length === 0) {
      setError('Please provide at least one valid phone and amount entry.');
      return;
    }

    setIsProcessingBulk(true);
    try {
      const res = await fetch('/api/v1/retailer/bulk-vtu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id || 'usr_retailer_1',
          items
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk VTU dispatch failed.');

      setBulkResults(data);
      setNotification(data.message);
      onRefreshWallet();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessingBulk(false);
    }
  };

  // Handle Generate API Key
  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsGeneratingKey(true);

    try {
      const res = await fetch('/api/v1/retailer/api-keys/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id || 'usr_retailer_1',
          keyName: newKeyName,
          environment: newKeyEnv
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate API Key.');

      setGeneratedKeyResult(data);
      fetchApiKeys();
      setNotification('API Key generated successfully! Save your secret key now.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGeneratingKey(false);
    }
  };

  // Handle Commission Transfer to Main Wallet
  const handleWithdrawCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const amount = parseFloat(commissionAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid transfer amount.');
      return;
    }

    setIsWithdrawing(true);
    try {
      const res = await fetch('/api/v1/wallet/withdraw-commission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id || 'usr_retailer_1',
          amount
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Commission transfer failed.');

      setCommissionBalance(data.commissionBalance);
      setNotification(data.message);
      onRefreshWallet();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Store className="w-6 h-6 text-emerald-700" />
            <span>{t.resellerHub}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Wholesale pricing, bulk transaction dispatching, and REST API credentials for resellers
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg shrink-0 text-xs">
          <button
            onClick={() => setActiveTab('MARGINS')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'MARGINS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{t.profitCalculator}</span>
          </button>
          <button
            onClick={() => setActiveTab('BULK')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'BULK' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{t.bulkRecharge}</span>
          </button>
          <button
            onClick={() => setActiveTab('KEYS')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'KEYS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>{t.apiCredentials}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {notification && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Retailer Commission Vault Card */}
      <div className="p-5 bg-gradient-to-r from-emerald-900 to-slate-900 rounded-2xl text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-emerald-300 font-bold">
            Accumulated Retailer Commission Vault
          </span>
          <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-white mt-1">
            ₦{commissionBalance.toLocaleString()}
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Earned from wholesale volume discounts and referral commissions.
          </p>
        </div>

        <form onSubmit={handleWithdrawCommission} className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="number"
            value={commissionAmount}
            onChange={(e) => setCommissionAmount(e.target.value)}
            className="w-32 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono font-bold text-white focus:outline-none"
            placeholder="10000"
            max={commissionBalance}
          />
          <button
            type="submit"
            disabled={isWithdrawing || commissionBalance < parseFloat(commissionAmount || '0')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all whitespace-nowrap disabled:opacity-50"
          >
            {isWithdrawing ? 'Transferring...' : 'Transfer to Wallet'}
          </button>
        </form>
      </div>

      {/* TAB 1: PROFIT MARGINS TABLE */}
      {activeTab === 'MARGINS' && (
        <div className="space-y-6">
          {/* Airtime Margins */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Airtime Wholesale Discounts & Profit Margins</h3>
              <p className="text-xs text-slate-500">Retailers receive up to 6.0% discount on recharge sales</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Network</th>
                    <th className="px-6 py-3">Customer Discount</th>
                    <th className="px-6 py-3">Retailer Buying Discount</th>
                    <th className="px-6 py-3">Net Retailer Margin</th>
                    <th className="px-6 py-3 text-right">Profit Per ₦1,000 Sale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {pricingMatrix.airtime.map((item: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/80">
                      <td className="px-6 py-3 font-bold text-slate-900">{item.name}</td>
                      <td className="px-6 py-3 text-slate-600">{item.customerDiscount}</td>
                      <td className="px-6 py-3 font-mono font-bold text-emerald-700">{item.retailerDiscount}</td>
                      <td className="px-6 py-3 font-mono text-emerald-800 font-semibold">{item.retailerMargin}</td>
                      <td className="px-6 py-3 font-mono font-bold text-right text-emerald-700 tabular-nums">
                        +{item.example1000Profit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Data Margins */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Data Wholesale Pricing Matrix</h3>
              <p className="text-xs text-slate-500">Breakdown of Provider Cost vs Retailer Buying Price vs Customer Retail Price</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Plan Name</th>
                    <th className="px-6 py-3">Network</th>
                    <th className="px-6 py-3">Supplier Cost</th>
                    <th className="px-6 py-3">Retailer Buys At</th>
                    <th className="px-6 py-3">Public Selling Price</th>
                    <th className="px-6 py-3 text-right">Retailer Profit Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {pricingMatrix.data.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50/80">
                      <td className="px-6 py-3 font-bold text-slate-900">{item.name}</td>
                      <td className="px-6 py-3 font-semibold text-slate-600">{item.network}</td>
                      <td className="px-6 py-3 font-mono text-slate-400">₦{item.providerCost}</td>
                      <td className="px-6 py-3 font-mono font-bold text-slate-800">₦{item.retailerPrice}</td>
                      <td className="px-6 py-3 font-mono font-bold text-emerald-800">₦{item.customerPrice}</td>
                      <td className="px-6 py-3 font-mono font-bold text-right text-emerald-700 tabular-nums">
                        +₦{item.retailerProfit} ({item.profitMarginPercent})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BULK VTU BATCH */}
      {activeTab === 'BULK' && (
        <form onSubmit={handleExecuteBulk} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Bulk Airtime & Data Dispatcher</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Paste up to 100 recharge orders in format: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">Phone, Amount, Network</code>
            </p>
          </div>

          <textarea
            rows={6}
            value={bulkInput}
            onChange={(e) => setBulkInput(e.target.value)}
            className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 leading-relaxed"
            placeholder="08031234567, 1000, MTN"
            required
          />

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Wholesale retailer discounts automatically deducted per transaction line.</span>
            <button
              type="submit"
              disabled={isProcessingBulk}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isProcessingBulk ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
              <span>Execute Bulk Dispatch</span>
            </button>
          </div>

          {/* Results table if processed */}
          {bulkResults && (
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>Batch Report ({bulkResults.batchReference}):</span>
                <span className="font-mono text-emerald-700">Total Debited: ₦{bulkResults.totalDebited.toLocaleString()}</span>
              </div>

              <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase">
                    <tr>
                      <th className="p-2">Phone</th>
                      <th className="p-2">Network</th>
                      <th className="p-2">Face Amount</th>
                      <th className="p-2">Wholesale Cost</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bulkResults.results.map((res: any, idx: number) => (
                      <tr key={idx}>
                        <td className="p-2 font-mono font-medium">{res.phone}</td>
                        <td className="p-2 font-bold">{res.network}</td>
                        <td className="p-2 font-mono">₦{res.amount}</td>
                        <td className="p-2 font-mono font-bold text-emerald-700">₦{res.cost}</td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${res.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                            {res.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </form>
      )}

      {/* TAB 3: RESELLER API KEYS */}
      {activeTab === 'KEYS' && (
        <div className="space-y-6">
          {/* Generate Key Card */}
          <form onSubmit={handleGenerateKey} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Generate Reseller API Credentials</h3>
              <p className="text-xs text-slate-500">
                Integrate 3PLE A VTU and bill payments directly into your own website or mobile application
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Key Application Name</label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Environment</label>
                <select
                  value={newKeyEnv}
                  onChange={(e) => setNewKeyEnv(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
                >
                  <option value="LIVE">LIVE (Production)</option>
                  <option value="SANDBOX">SANDBOX (Test Mode)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isGeneratingKey}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-2"
            >
              {isGeneratingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
              <span>Generate API Key Pair</span>
            </button>
          </form>

          {/* Generated Raw Secret Key Box (Only Shown Once) */}
          {generatedKeyResult && (
            <div className="p-5 bg-amber-50 border border-amber-300 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <Shield className="w-4 h-4 text-amber-700" />
                <span>IMPORTANT: Secret Key Created (Shown Once)</span>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-slate-600 block">Public Key:</span>
                <code className="text-xs font-mono font-bold bg-white p-2 rounded border block select-all">
                  {generatedKeyResult.apiKey.publicKey}
                </code>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-slate-600 block">Secret Key (Store in server .env):</span>
                <code className="text-xs font-mono font-bold text-emerald-800 bg-white p-2 rounded border block select-all">
                  {generatedKeyResult.rawSecretKey}
                </code>
              </div>
            </div>
          )}

          {/* Active Keys List */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Active API Keys</h3>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {apiKeys.length === 0 ? (
                <div className="p-6 text-center text-slate-400">No API keys registered yet.</div>
              ) : (
                apiKeys.map((key) => (
                  <div key={key.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{key.keyName}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${key.environment === 'LIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}`}>
                          {key.environment}
                        </span>
                      </div>
                      <div className="font-mono text-slate-500">
                        Public: <span className="font-bold text-slate-700">{key.publicKey}</span>
                      </div>
                      <div className="font-mono text-slate-400">
                        Secret: {key.maskedSecret}
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-slate-500">
                      <div>Rate Limit: {key.rateLimitPerMin} req/min</div>
                      <div>Daily Calls: {key.dailyUsageCount}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
