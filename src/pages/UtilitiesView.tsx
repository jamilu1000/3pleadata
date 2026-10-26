import React, { useState, useEffect } from 'react';
import { User, WalletInfo, ElectricityDisCo, CableTVBouquet, Transaction, Language } from '../types';
import { translations } from '../i18n/translations';
import { Zap, Tv, CheckCircle2, AlertCircle, ArrowRight, Loader2, UserCheck, ShieldCheck, Copy } from 'lucide-react';

interface UtilitiesViewProps {
  currentUser: User | null;
  wallet: WalletInfo | null;
  language: Language;
  onSuccessTransaction: (txn: Transaction, newBalance: number) => void;
  onOpenFundWallet: () => void;
}

export const UtilitiesView: React.FC<UtilitiesViewProps> = ({
  currentUser,
  wallet,
  language,
  onSuccessTransaction,
  onOpenFundWallet
}) => {
  const t = translations[language];

  const [activeTab, setActiveTab] = useState<'ELECTRICITY' | 'CABLE'>('ELECTRICITY');

  // Electricity State
  const [discos, setDiscos] = useState<ElectricityDisCo[]>([]);
  const [selectedDisCo, setSelectedDisCo] = useState<string>('KEDCO');
  const [meterNumber, setMeterNumber] = useState<string>('45029184712');
  const [meterType, setMeterType] = useState<'PREPAID' | 'POSTPAID'>('PREPAID');
  const [electricAmount, setElectricAmount] = useState<string>('5000');
  const [customerProfile, setCustomerProfile] = useState<any | null>(null);
  const [isValidatingMeter, setIsValidatingMeter] = useState<boolean>(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  // Cable State
  const [cableProvider, setCableProvider] = useState<'DSTV' | 'GOTV' | 'STARTIMES'>('DSTV');
  const [bouquets, setBouquets] = useState<CableTVBouquet[]>([]);
  const [selectedBouquetId, setSelectedBouquetId] = useState<string>('dstv_yanga');
  const [smartcard, setSmartcard] = useState<string>('1092837412');
  const [smartcardProfile, setSmartcardProfile] = useState<any | null>(null);
  const [isValidatingCard, setIsValidatingCard] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/vtu/electricity/discos')
      .then(res => res.json())
      .then(data => {
        setDiscos(data.discos || []);
        if (data.discos?.length > 0) setSelectedDisCo(data.discos[0].code);
      })
      .catch(console.error);

    fetch('/api/v1/vtu/cable/bouquets')
      .then(res => res.json())
      .then(data => setBouquets(data.bouquets || []))
      .catch(console.error);
  }, []);

  // Validate Meter
  const handleValidateMeter = async () => {
    setError(null);
    setIsValidatingMeter(true);
    setCustomerProfile(null);

    try {
      const res = await fetch('/api/v1/vtu/electricity/validate-meter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discoCode: selectedDisCo,
          meterNumber,
          meterType
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to validate meter.');
      setCustomerProfile(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsValidatingMeter(false);
    }
  };

  // Pay Electricity
  const handlePayElectricity = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setGeneratedToken(null);

    const numAmount = parseFloat(electricAmount);
    if (isNaN(numAmount) || numAmount < 1000) {
      setError('Minimum electricity recharge is ₦1,000.');
      return;
    }

    const currentDisCo = discos.find(d => d.code === selectedDisCo);
    const fee = currentDisCo?.fee || 100;
    const totalCharge = numAmount + fee;

    if (!wallet || wallet.balance < totalCharge) {
      setError(`Insufficient wallet balance. Total cost is ₦${totalCharge.toLocaleString()} (including ₦${fee} service fee). Please fund your wallet.`);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/vtu/electricity/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id || 'usr_customer_1',
          discoCode: selectedDisCo,
          meterNumber,
          meterType,
          customerName: customerProfile?.customerName,
          amount: numAmount,
          phone: currentUser?.phone || '08031234567'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment failed.');

      setSuccess(data.message);
      if (data.token) setGeneratedToken(data.token);
      onSuccessTransaction(data.transaction, data.newBalance);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Validate Cable Smartcard
  const handleValidateCard = async () => {
    setError(null);
    setIsValidatingCard(true);
    try {
      const res = await fetch('/api/v1/vtu/cable/validate-smartcard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: cableProvider, smartcardNumber: smartcard })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Smartcard validation failed.');
      setSmartcardProfile(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsValidatingCard(false);
    }
  };

  // Pay Cable TV
  const handlePayCable = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const bouquet = bouquets.find(b => b.id === selectedBouquetId);
    if (!bouquet) {
      setError('Please select a bouquet.');
      return;
    }

    const total = bouquet.customerPrice + (bouquet.fee || 50);
    if (!wallet || wallet.balance < total) {
      setError(`Insufficient wallet balance. Total is ₦${total.toLocaleString()}. Please fund your wallet.`);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/vtu/cable/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id || 'usr_customer_1',
          bouquetId: bouquet.id,
          smartcardNumber: smartcard,
          customerName: smartcardProfile?.customerName,
          phone: currentUser?.phone || '08031234567'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Subscription renewal failed.');

      setSuccess(data.message);
      onSuccessTransaction(data.transaction, data.newBalance);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBouquets = bouquets.filter(b => b.provider === cableProvider);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header and Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {t.billsUtilities}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Instant KEDCO electricity token generation, AEDC, EKEDC & Cable TV renewals
          </p>
        </div>

        <div className="flex items-center p-1 bg-slate-100 rounded-lg shrink-0">
          <button
            onClick={() => setActiveTab('ELECTRICITY')}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'ELECTRICITY'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Electricity DisCos</span>
          </button>
          <button
            onClick={() => setActiveTab('CABLE')}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'CABLE'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Cable TV</span>
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
              Fund Wallet
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

      {/* Generated Token Showcase (Prepaid Success) */}
      {generatedToken && (
        <div className="p-6 bg-emerald-900 text-white rounded-2xl shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-emerald-300 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              Generated STS 20-Digit Standard Token
            </span>
            <span className="text-xs font-mono text-emerald-200">KEDCO / Pairgate Gateway</span>
          </div>
          <div className="p-4 bg-emerald-950/80 rounded-xl border border-emerald-700 flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-black font-mono tracking-widest text-emerald-200 select-all">
              {generatedToken}
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(generatedToken)}
              className="p-2 hover:bg-emerald-800 rounded-lg text-emerald-300 hover:text-white transition-colors"
              title="Copy Token"
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-emerald-200">
            Enter this 20-digit token on your prepaid keypad (CIU) and press the Enter (blue/red) button to load credit.
          </p>
        </div>
      )}

      {/* ELECTRICITY TAB */}
      {activeTab === 'ELECTRICITY' && (
        <form onSubmit={handlePayElectricity} className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
            {/* DisCo Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                {t.selectDisCo}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {discos.map((disco) => {
                  const isSelected = selectedDisCo === disco.code;
                  return (
                    <button
                      key={disco.id}
                      type="button"
                      onClick={() => {
                        setSelectedDisCo(disco.code);
                        setCustomerProfile(null);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-900">{disco.shortName}</div>
                      <div className="text-[11px] text-slate-500 mt-1">Fee: ₦{disco.fee}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Meter type toggle */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                {t.meterType}
              </label>
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                <button
                  type="button"
                  onClick={() => setMeterType('PREPAID')}
                  className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-colors ${
                    meterType === 'PREPAID'
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50'
                  }`}
                >
                  {t.prepaid}
                </button>
                <button
                  type="button"
                  onClick={() => setMeterType('POSTPAID')}
                  className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-colors ${
                    meterType === 'POSTPAID'
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50'
                  }`}
                >
                  {t.postpaid}
                </button>
              </div>
            </div>

            {/* Meter Number with Verify button */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t.meterNumber}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={meterNumber}
                  onChange={(e) => {
                    setMeterNumber(e.target.value);
                    setCustomerProfile(null);
                  }}
                  placeholder="e.g. 45029184712"
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={handleValidateMeter}
                  disabled={isValidatingMeter || !meterNumber}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
                >
                  {isValidatingMeter ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                  <span>{t.validateMeter}</span>
                </button>
              </div>
            </div>

            {/* Customer Details Verification Box */}
            {customerProfile && (
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold uppercase tracking-wider mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Consumer Verification Confirmed</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-slate-500 block">{t.customerName}:</span>
                    <span className="font-bold text-slate-900">{customerProfile.customerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">{t.customerAddress}:</span>
                    <span className="font-medium text-slate-900">{customerProfile.customerAddress}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t.enterAmount}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₦</span>
                <input
                  type="number"
                  min="1000"
                  step="500"
                  value={electricAmount}
                  onChange={(e) => setElectricAmount(e.target.value)}
                  placeholder="5000"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-base"
                  required
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>Convenience fee: ₦100</span>
                <span>
                  Est. Units: <strong className="text-slate-800 font-mono">{(parseFloat(electricAmount || '0') / 68.5).toFixed(1)} kWh</strong>
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Contacting {selectedDisCo} Gateway...</span>
                </>
              ) : (
                <>
                  <span>
                    {t.payPowerBill} (₦{(parseFloat(electricAmount || '0') + 100).toLocaleString()})
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* CABLE TAB */}
      {activeTab === 'CABLE' && (
        <form onSubmit={handlePayCable} className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
            {/* Cable Provider */}
            <div className="grid grid-cols-3 gap-3">
              {(['DSTV', 'GOTV', 'STARTIMES'] as const).map((prov) => (
                <button
                  key={prov}
                  type="button"
                  onClick={() => {
                    setCableProvider(prov);
                    setSmartcardProfile(null);
                  }}
                  className={`py-3 px-4 rounded-xl border font-bold text-xs transition-all ${
                    cableProvider === prov
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-600'
                      : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50'
                  }`}
                >
                  {prov}
                </button>
              ))}
            </div>

            {/* Smartcard */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Smartcard / IUC Number
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={smartcard}
                  onChange={(e) => {
                    setSmartcard(e.target.value);
                    setSmartcardProfile(null);
                  }}
                  placeholder="e.g. 1092837412"
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={handleValidateCard}
                  disabled={isValidatingCard || !smartcard}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
                >
                  {isValidatingCard ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                  <span>Verify IUC</span>
                </button>
              </div>
            </div>

            {smartcardProfile && (
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs space-y-1">
                <div className="text-emerald-800 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Card Owner: {smartcardProfile.customerName}</span>
                </div>
                <div className="text-slate-600">
                  Current Bouquet: {smartcardProfile.currentBouquet} · Expiry Date: {smartcardProfile.dueDate}
                </div>
              </div>
            )}

            {/* Bouquets */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                Select {cableProvider} Package
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
                {filteredBouquets.map((b) => {
                  const isSelected = selectedBouquetId === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBouquetId(b.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900">{b.name}</div>
                        <div className="text-sm font-mono font-bold text-emerald-700 mt-1">
                          ₦{b.customerPrice.toLocaleString()}
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Activating Subscription...</span>
                </>
              ) : (
                <>
                  <span>Renew {cableProvider} Subscription</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
