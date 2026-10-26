import React, { useState, useEffect } from 'react';
import { User, WalletInfo, EducationInstitution, Transaction, Language } from '../types';
import { translations } from '../i18n/translations';
import { GraduationCap, CheckCircle2, AlertCircle, ArrowRight, Loader2, UserCheck, ShieldCheck, FileText } from 'lucide-react';

interface EducationViewProps {
  currentUser: User | null;
  wallet: WalletInfo | null;
  language: Language;
  onSuccessTransaction: (txn: Transaction, newBalance: number) => void;
  onOpenFundWallet: () => void;
}

export const EducationView: React.FC<EducationViewProps> = ({
  currentUser,
  wallet,
  language,
  onSuccessTransaction,
  onOpenFundWallet
}) => {
  const t = translations[language];

  const [institutions, setInstitutions] = useState<EducationInstitution[]>([]);
  const [selectedInstCode, setSelectedInstCode] = useState<string>('BUK-KANO');
  const [studentId, setStudentId] = useState<string>('CST/22/COM/00482');
  const [feeCategory, setFeeCategory] = useState<string>('Tuition / Central Registration');

  const [invoiceProfile, setInvoiceProfile] = useState<any | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/education/institutions')
      .then(res => res.json())
      .then(data => {
        setInstitutions(data.institutions || []);
        if (data.institutions?.length > 0) {
          setSelectedInstCode(data.institutions[0].code);
          setFeeCategory(data.institutions[0].supportedFees[0]);
        }
      })
      .catch(console.error);
  }, []);

  const currentInstitution = institutions.find(i => i.code === selectedInstCode);

  const handleValidateInvoice = async () => {
    setError(null);
    setIsValidating(true);
    setInvoiceProfile(null);

    try {
      const res = await fetch('/api/v1/education/validate-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institutionCode: selectedInstCode,
          identifier: studentId,
          feeCategory
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to lookup student invoice.');
      setInvoiceProfile(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsValidating(false);
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!invoiceProfile) {
      setError('Please click "Lookup Student Invoice" to verify fee schedule first.');
      return;
    }

    if (!wallet || wallet.balance < invoiceProfile.totalPayable) {
      setError(`Insufficient wallet balance. Total payable is ₦${invoiceProfile.totalPayable.toLocaleString()}. Please fund your wallet.`);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/education/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id || 'usr_customer_1',
          institutionCode: selectedInstCode,
          identifier: studentId,
          feeCategory,
          studentName: invoiceProfile.studentName,
          invoiceNumber: invoiceProfile.invoiceNumber,
          amount: invoiceProfile.amount,
          serviceCharge: invoiceProfile.serviceCharge,
          phone: currentUser?.phone || '08031234567'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'School fee payment failed.');

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
      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-purple-700" />
          <span>{t.education}</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Direct tuition & portal fee payments for Bayero University Kano (BUK), Kano Poly, ABU Zaria & WAEC/JAMB/NECO PINs
        </p>
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

      <form onSubmit={handlePay} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        {/* Institution selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
            {t.selectInstitution}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {institutions.map((inst) => {
              const isSelected = selectedInstCode === inst.code;
              return (
                <button
                  key={inst.id}
                  type="button"
                  onClick={() => {
                    setSelectedInstCode(inst.code);
                    setFeeCategory(inst.supportedFees[0]);
                    setInvoiceProfile(null);
                  }}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-purple-600 bg-purple-50/50 ring-2 ring-purple-600 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900">{inst.name}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    State: {inst.state} · Category: {inst.category}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Fee Category */}
        {currentInstitution && currentInstitution.supportedFees.length > 1 && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              {t.feeCategory}
            </label>
            <select
              value={feeCategory}
              onChange={(e) => {
                setFeeCategory(e.target.value);
                setInvoiceProfile(null);
              }}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              {currentInstitution.supportedFees.map((fee) => (
                <option key={fee} value={fee}>{fee}</option>
              ))}
            </select>
          </div>
        )}

        {/* Student ID / Identifier input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            {t.studentIdOrInvoice}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={studentId}
              onChange={(e) => {
                setStudentId(e.target.value);
                setInvoiceProfile(null);
              }}
              placeholder="e.g. CST/22/COM/00482 or Candidate Name"
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm"
              required
            />
            <button
              type="button"
              onClick={handleValidateInvoice}
              disabled={isValidating || !studentId}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              {isValidating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
              <span>{t.validateInvoice}</span>
            </button>
          </div>
        </div>

        {/* Invoice Verification Box */}
        {invoiceProfile && (
          <div className="p-5 bg-purple-50/70 border border-purple-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-purple-200/80">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                Verified Institution Invoice
              </span>
              <span className="text-xs font-mono text-purple-800 font-semibold">{invoiceProfile.invoiceNumber}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
              <div>
                <span className="text-slate-500 block">Student / Candidate Name:</span>
                <span className="font-bold text-slate-900 text-sm">{invoiceProfile.studentName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Faculty / Department:</span>
                <span className="font-semibold text-slate-900">{invoiceProfile.faculty || 'Standard Verification'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">{t.academicSession}:</span>
                <span className="font-medium text-slate-800">{invoiceProfile.academicSession}</span>
              </div>
              <div>
                <span className="text-slate-500 block">{t.feeCategory}:</span>
                <span className="font-medium text-slate-800">{invoiceProfile.feeCategory}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-purple-200/80 flex items-baseline justify-between">
              <span className="text-xs text-slate-600">Total Payable (incl. ₦{invoiceProfile.serviceCharge} institutional processing fee):</span>
              <span className="text-lg font-black font-mono tabular-nums text-purple-900">
                ₦{invoiceProfile.totalPayable.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !invoiceProfile}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-purple-700 hover:bg-purple-800 text-white font-bold text-sm rounded-xl shadow-md transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing Official Payment with Institution Gateway...</span>
            </>
          ) : (
            <>
              <span>
                {t.paySchoolFees} (₦{invoiceProfile ? invoiceProfile.totalPayable.toLocaleString() : '0'})
              </span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
