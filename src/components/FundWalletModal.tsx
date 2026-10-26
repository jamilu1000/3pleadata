import React, { useState } from 'react';
import { User, Language } from '../types';
import { translations } from '../i18n/translations';
import { CreditCard, Landmark, CheckCircle2, AlertCircle, X, Shield, ArrowRight, Loader2 } from 'lucide-react';

interface FundWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onSuccess: (newBalance: number) => void;
  language: Language;
}

export const FundWalletModal: React.FC<FundWalletModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSuccess,
  language
}) => {
  if (!isOpen) return null;
  const t = translations[language];

  const [amount, setAmount] = useState<string>('5000');
  const [gateway, setGateway] = useState<'PAYSTACK' | 'MONNIFY'>('PAYSTACK');
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'TRANSFER' | 'USSD'>('CARD');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const presets = ['2000', '5000', '10000', '25000', '50000', '100000'];

  const handleFund = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 100) {
      setError('Minimum funding amount is ₦100.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/wallet/fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id || 'usr_customer_1',
          amount: numAmount,
          gateway,
          paymentMethod
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Payment gateway failed to initialize.');
      }

      setSuccessMessage(data.message || `Wallet successfully credited with ₦${numAmount.toLocaleString()}!`);
      setTimeout(() => {
        onSuccess(data.newBalance);
        onClose();
        setSuccessMessage(null);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'An error occurred during payment processing.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{t.fundWallet}</h3>
              <p className="text-xs text-slate-500">Paystack & Monnify Instant Settlement</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleFund} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2 text-xs text-emerald-800 font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Amount input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Enter Amount (NGN ₦)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₦</span>
              <input
                type="number"
                min="100"
                step="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="5,000"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-base"
                required
              />
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {presets.map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setAmount(p)}
                  className={`px-2.5 py-1 text-xs rounded-md font-mono transition-colors ${
                    amount === p
                      ? 'bg-emerald-700 text-white font-bold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  ₦{parseInt(p, 10).toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Gateway Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Payment Gateway
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGateway('PAYSTACK')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  gateway === 'PAYSTACK'
                    ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Paystack</span>
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${gateway === 'PAYSTACK' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'}`}>
                    {gateway === 'PAYSTACK' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <span className="text-[11px] text-slate-500 mt-2">Cards, Bank Transfer, Apple Pay</span>
              </button>

              <button
                type="button"
                onClick={() => setGateway('MONNIFY')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  gateway === 'MONNIFY'
                    ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Monnify</span>
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${gateway === 'MONNIFY' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'}`}>
                    {gateway === 'MONNIFY' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <span className="text-[11px] text-slate-500 mt-2">Dedicated Virtual Account, USSD</span>
              </button>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`py-2 px-3 rounded-lg border text-center font-medium transition-colors ${
                  paymentMethod === 'CARD'
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50'
                }`}
              >
                Debit Card
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('TRANSFER')}
                className={`py-2 px-3 rounded-lg border text-center font-medium transition-colors ${
                  paymentMethod === 'TRANSFER'
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50'
                }`}
              >
                Bank Transfer
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('USSD')}
                className={`py-2 px-3 rounded-lg border text-center font-medium transition-colors ${
                  paymentMethod === 'USSD'
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50'
                }`}
              >
                USSD (*737#)
              </button>
            </div>
          </div>

          {/* Security Banner */}
          <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-500">
            <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>256-bit encrypted transaction with instant double-entry ledger settlement.</span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authorizing Gateway...</span>
              </>
            ) : (
              <>
                <span>Pay ₦{parseFloat(amount || '0').toLocaleString()}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
