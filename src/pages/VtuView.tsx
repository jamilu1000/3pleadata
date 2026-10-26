import React, { useState, useEffect } from 'react';
import { User, WalletInfo, AirtimeProduct, DataPlan, Transaction, Language } from '../types';
import { translations } from '../i18n/translations';
import { Smartphone, Wifi, CheckCircle2, AlertCircle, ArrowRight, Loader2, Sparkles, Shield } from 'lucide-react';

interface VtuViewProps {
  currentUser: User | null;
  wallet: WalletInfo | null;
  language: Language;
  onSuccessTransaction: (txn: Transaction, newBalance: number) => void;
  onOpenFundWallet: () => void;
}

export const VtuView: React.FC<VtuViewProps> = ({
  currentUser,
  wallet,
  language,
  onSuccessTransaction,
  onOpenFundWallet
}) => {
  const t = translations[language];

  const [activeTab, setActiveTab] = useState<'AIRTIME' | 'DATA'>('AIRTIME');
  const [network, setNetwork] = useState<'MTN' | 'AIRTEL' | 'GLO' | '9MOBILE'>('MTN');
  const [phone, setPhone] = useState<string>('08031234567');
  const [airtimeAmount, setAirtimeAmount] = useState<string>('1000');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('dp_mtn_sme_2gb');

  const [airtimeProducts, setAirtimeProducts] = useState<AirtimeProduct[]>([]);
  const [dataPlans, setDataPlans] = useState<DataPlan[]>([]);
  const [dataFilterType, setDataFilterType] = useState<string>('ALL');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/vtu/airtime/products')
      .then(res => res.json())
      .then(data => setAirtimeProducts(data.products || []))
      .catch(console.error);

    fetch('/api/v1/vtu/data/plans')
      .then(res => res.json())
      .then(data => setDataPlans(data.plans || []))
      .catch(console.error);
  }, []);

  // Auto-detect Nigerian network by phone number prefix
  const handlePhoneChange = (val: string) => {
    setPhone(val);
    const clean = val.replace(/\D/g, '');
    if (clean.length >= 4) {
      const prefix = clean.slice(0, 4);
      if (['0803', '0806', '0703', '0706', '0813', '0816', '0810', '0814', '0903', '0906', '0913', '0916'].includes(prefix)) {
        setNetwork('MTN');
      } else if (['0802', '0808', '0708', '0812', '0701', '0902', '0901', '0904', '0907', '0912'].includes(prefix)) {
        setNetwork('AIRTEL');
      } else if (['0805', '0807', '0705', '0815', '0811', '0905', '0915'].includes(prefix)) {
        setNetwork('GLO');
      } else if (['0809', '0818', '0817', '0909', '0908'].includes(prefix)) {
        setNetwork('9MOBILE');
      }
    }
  };

  const networks = [
    { id: 'MTN', name: 'MTN Nigeria', color: 'border-yellow-400 bg-yellow-50/60 text-yellow-900', badge: 'bg-yellow-400 text-yellow-950' },
    { id: 'AIRTEL', name: 'Airtel NG', color: 'border-red-400 bg-red-50/60 text-red-900', badge: 'bg-red-600 text-white' },
    { id: 'GLO', name: 'Glo Mobile', color: 'border-green-500 bg-green-50/60 text-green-900', badge: 'bg-green-600 text-white' },
    { id: '9MOBILE', name: '9mobile', color: 'border-emerald-700 bg-emerald-50/60 text-emerald-900', badge: 'bg-emerald-800 text-white' }
  ];

  const airtimePresets = ['100', '200', '500', '1000', '2000', '5000', '10000'];

  const currentProduct = airtimeProducts.find(p => p.network === network);
  const isRetailer = currentUser?.role === 'retailer' || currentUser?.role === 'agent' || currentUser?.role === 'reseller';
  const discountPercent = currentProduct
    ? (isRetailer ? currentProduct.retailerDiscountPercent : currentProduct.customerDiscountPercent)
    : 2.0;

  const numAmount = parseFloat(airtimeAmount) || 0;
  const discountAmount = Math.round((numAmount * (discountPercent / 100)) * 100) / 100;
  const netPayable = Math.max(0, numAmount - discountAmount);

  // Filter data plans for selected network
  const filteredPlans = dataPlans.filter(p => {
    if (p.network !== network) return false;
    if (dataFilterType === 'ALL') return true;
    return p.type === dataFilterType;
  });

  const selectedDataPlan = dataPlans.find(p => p.id === selectedPlanId);

  // Submit Airtime Recharge
  const handleAirtimeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (numAmount < 50) {
      setError('Minimum airtime recharge is ₦50.');
      return;
    }

    if (!wallet || wallet.balance < netPayable) {
      setError(`Insufficient wallet balance. Total cost is ₦${netPayable.toLocaleString()}. Please fund your wallet.`);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/vtu/airtime/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id || 'usr_customer_1',
          network,
          phone,
          amount: numAmount
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Airtime transaction failed.');

      setSuccess(data.message);
      onSuccessTransaction(data.transaction, data.newBalance);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Data Purchase
  const handleDataSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedDataPlan) {
      setError('Please select a data bundle.');
      return;
    }

    const price = isRetailer ? selectedDataPlan.retailerPrice : selectedDataPlan.customerPrice;
    if (!wallet || wallet.balance < price) {
      setError(`Insufficient wallet balance. Plan costs ₦${price.toLocaleString()}. Please fund your wallet.`);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/vtu/data/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id || 'usr_customer_1',
          planId: selectedDataPlan.id,
          phone
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Data subscription failed.');

      setSuccess(data.message);
      onSuccessTransaction(data.transaction, data.newBalance);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header and Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {t.vtuAirtime}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Instant automated GSM top-up with up to 6.0% commission and discounts
          </p>
        </div>

        {/* Segmented Tab Control */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg shrink-0">
          <button
            onClick={() => setActiveTab('AIRTIME')}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'AIRTIME'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Airtime Recharge</span>
          </button>
          <button
            onClick={() => setActiveTab('DATA')}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'DATA'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Data Bundles</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-xs text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          {error.includes('fund') && (
            <button
              onClick={onOpenFundWallet}
              className="px-2.5 py-1 bg-red-700 text-white rounded font-bold hover:bg-red-800"
            >
              Fund Now
            </button>
          )}
        </div>
      )}

      {success && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Network Selector Strip */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          {t.selectNetwork}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {networks.map((net) => {
            const isSelected = network === net.id;
            return (
              <button
                key={net.id}
                type="button"
                onClick={() => setNetwork(net.id as any)}
                className={`p-3.5 rounded-xl border text-left transition-all relative ${
                  isSelected
                    ? `${net.color} ring-2 ring-emerald-600 shadow-sm`
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${net.badge}`}>
                    {net.id}
                  </span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-700" />}
                </div>
                <div className="text-xs font-bold text-slate-900 mt-2">{net.name}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {isRetailer ? 'Up to 6% Margin' : 'Instant Cashback'}
                </div>
              </button>
            );
          })}
        </div>

        {/* Phone number input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            {t.phoneNumber} (Nigerian GSM)
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="0803 123 4567"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
            required
          />
          <span className="text-[11px] text-slate-500 mt-1 block">
            Auto-detects MTN, Airtel, Glo, and 9mobile network routing.
          </span>
        </div>
      </div>

      {/* AIRTIME TAB */}
      {activeTab === 'AIRTIME' && (
        <form onSubmit={handleAirtimeSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {t.enterAmount}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₦</span>
              <input
                type="number"
                min="50"
                step="50"
                value={airtimeAmount}
                onChange={(e) => setAirtimeAmount(e.target.value)}
                placeholder="1000"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-base"
                required
              />
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-2 mt-3">
              {airtimePresets.map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setAirtimeAmount(p)}
                  className={`px-3 py-1 text-xs rounded-md font-mono transition-colors ${
                    airtimeAmount === p
                      ? 'bg-emerald-700 text-white font-bold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  ₦{parseInt(p, 10).toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing & Cashback Summary */}
          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between text-slate-700">
              <span>Face Value Airtime:</span>
              <span className="font-mono font-bold">₦{numAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-emerald-800 font-semibold">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                {isRetailer ? 'Retailer Discount (' + discountPercent + '%):' : 'Instant Customer Discount (' + discountPercent + '%):'}
              </span>
              <span className="font-mono">-₦{discountAmount.toLocaleString()}</span>
            </div>
            <div className="pt-2 border-t border-emerald-200 flex justify-between text-sm font-black text-slate-900">
              <span>Net Amount Debited From Wallet:</span>
              <span className="font-mono text-emerald-700">₦{netPayable.toLocaleString()}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Delivering Airtime via Pairgate API...</span>
              </>
            ) : (
              <>
                <span>{t.purchaseAirtime} (₦{netPayable.toLocaleString()})</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* DATA TAB */}
      {activeTab === 'DATA' && (
        <form onSubmit={handleDataSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {network} {t.dataPlans}
            </label>
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setDataFilterType('ALL')}
                className={`px-2.5 py-1 rounded ${dataFilterType === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setDataFilterType('SME')}
                className={`px-2.5 py-1 rounded ${dataFilterType === 'SME' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                SME Data
              </button>
              <button
                type="button"
                onClick={() => setDataFilterType('CORPORATE')}
                className={`px-2.5 py-1 rounded ${dataFilterType === 'CORPORATE' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                Corporate Gifting
              </button>
            </div>
          </div>

          {/* Data plan grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
            {filteredPlans.map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              const price = isRetailer ? plan.retailerPrice : plan.customerPrice;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {plan.type} · {plan.validity}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-0.5">{plan.name}</h4>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-base font-extrabold font-mono tabular-nums text-emerald-700">
                      ₦{price.toLocaleString()}
                    </span>
                    {isRetailer && (
                      <span className="text-[11px] text-slate-500 font-mono">
                        Profit: ₦{(plan.customerPrice - plan.retailerPrice).toLocaleString()}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <button
            type="submit"
            disabled={isLoading || !selectedDataPlan}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Activating Data Bundle...</span>
              </>
            ) : (
              <>
                <span>
                  {t.subscribeData} (₦{(isRetailer ? selectedDataPlan?.retailerPrice : selectedDataPlan?.customerPrice)?.toLocaleString() || 0})
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};
