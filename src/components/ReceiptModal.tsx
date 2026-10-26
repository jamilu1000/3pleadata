import React from 'react';
import { Transaction, Language } from '../types';
import { translations } from '../i18n/translations';
import { CheckCircle2, Printer, X, ShieldCheck, Download, Share2 } from 'lucide-react';

interface ReceiptModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  language: Language;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  onClose,
  language
}) => {
  if (!transaction) return null;
  const t = translations[language];

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(transaction.createdAt).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Lagos'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 print:m-0 print:border-none print:shadow-none">
        {/* Modal Header Actions (hidden on print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{t.customerReceipt}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t.printReceipt}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div id="printable-receipt" className="p-6 sm:p-8 space-y-6">
          {/* Top Brand Banner */}
          <div className="text-center pb-5 border-b border-dashed border-slate-300">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-800 text-white font-extrabold text-xl shadow-sm mb-2">
              3A
            </div>
            <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">
              3PLE A DATA LIMITED
            </h2>
            <div className="text-[11px] font-mono text-emerald-800 font-semibold">
              RC NUMBER: 9746103
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Karkasara Road, Tarauni, Kano State, Nigeria
            </p>
            <p className="text-[11px] text-slate-400">
              support@3ple-a.ng · +234 (0) 803 000 0001
            </p>

            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.verifiedPayment}</span>
            </div>
          </div>

          {/* Amount Paid Big Display */}
          <div className="text-center py-2 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block mb-1">
              Total Amount Debited
            </span>
            <div className="text-3xl font-extrabold font-mono tabular-nums text-slate-900">
              ₦{transaction.netAmount.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Service: <span className="font-semibold text-slate-800">{transaction.serviceType.replace('_', ' ')}</span>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">{t.reference}</span>
              <span className="font-mono font-semibold text-slate-900 select-all">{transaction.reference}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">{t.date}</span>
              <span className="font-mono text-slate-800">{formattedDate}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Payer / Beneficiary</span>
              <span className="font-medium text-slate-900">{transaction.userName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Provider Gateway</span>
              <span className="text-slate-800">{transaction.providerName}</span>
            </div>
            {transaction.providerReference && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Supplier Reference</span>
                <span className="font-mono text-xs text-slate-600">{transaction.providerReference}</span>
              </div>
            )}

            {/* Service-Specific Highlights (Token, PNR, Matric, etc.) */}
            {transaction.metadata?.generatedToken && (
              <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-200 mt-3">
                <span className="text-xs font-bold text-emerald-900 block mb-1">
                  TOKEN / PIN CREDENTIAL:
                </span>
                <div className="text-base font-extrabold font-mono tracking-wider text-emerald-800 select-all">
                  {transaction.metadata.generatedToken}
                </div>
                {transaction.metadata?.unitsKwh && (
                  <span className="text-xs text-emerald-700 block mt-1">
                    Purchased Units: {transaction.metadata.unitsKwh} kWh
                  </span>
                )}
              </div>
            )}

            {transaction.metadata?.pnr && (
              <div className="bg-blue-50/70 p-3 rounded-lg border border-blue-200 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-blue-900">AIRLINE PNR:</span>
                  <span className="font-mono font-black text-blue-900 text-lg select-all">{transaction.metadata.pnr}</span>
                </div>
                <div className="text-xs text-blue-800 mt-1">
                  E-Ticket: {transaction.metadata.ticketNumber} · Route: {transaction.metadata.route}
                </div>
              </div>
            )}

            {transaction.metadata?.receiptNumber && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">School Receipt No</span>
                <span className="font-mono font-bold text-emerald-700">{transaction.metadata.receiptNumber}</span>
              </div>
            )}

            {/* Financial Ledger Breakdown */}
            <div className="pt-2 text-xs text-slate-500 space-y-1">
              <div className="flex justify-between">
                <span>Base Charge:</span>
                <span className="font-mono">₦{transaction.amount.toLocaleString()}</span>
              </div>
              {transaction.fee > 0 && (
                <div className="flex justify-between">
                  <span>Platform / Convenience Fee:</span>
                  <span className="font-mono">+₦{transaction.fee.toLocaleString()}</span>
                </div>
              )}
              {transaction.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Cashback / Discount Applied:</span>
                  <span className="font-mono">-₦{transaction.discount.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Verification Barcode & Security Note */}
          <div className="pt-4 border-t border-dashed border-slate-300 text-center space-y-2">
            {/* Visual Simulated Barcode */}
            <div className="flex items-center justify-center gap-[2px] h-9 mx-auto w-48 opacity-75">
              {[1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 3, 1, 2, 1, 3, 4, 1].map((w, i) => (
                <div key={i} className="bg-slate-800 h-full" style={{ width: `${w * 2}px` }} />
              ))}
            </div>
            <div className="text-[10px] text-slate-400 font-mono tracking-widest">
              SECURE LEDGER HASH: {transaction.id.toUpperCase()}
            </div>
            <p className="text-[11px] text-slate-500">
              This is a legally valid transaction receipt issued by 3PLE A. For electronic confirmation, query /api/v1/wallet/transactions/{transaction.reference}.
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end print:hidden">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
