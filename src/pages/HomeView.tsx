import React from 'react';
import { User, WalletInfo, Transaction, Language } from '../types';
import { translations } from '../i18n/translations';
import {
  Smartphone,
  Wifi,
  Zap,
  Tv,
  GraduationCap,
  Plane,
  Building2,
  Store,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
  Search,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';

interface HomeViewProps {
  currentUser: User | null;
  wallet: WalletInfo | null;
  transactions: Transaction[];
  language: Language;
  onNavigate: (tab: string) => void;
  onOpenFundWallet: () => void;
  onViewReceipt: (txn: Transaction) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  currentUser,
  wallet,
  transactions,
  language,
  onNavigate,
  onOpenFundWallet,
  onViewReceipt
}) => {
  const t = translations[language];

  const quickServices = [
    { id: 'vtu', name: t.buyAirtime, subtext: 'MTN, Airtel, Glo, 9mobile', icon: Smartphone, color: 'bg-emerald-600 text-white' },
    { id: 'vtu-data', name: t.buyData, subtext: 'SME & Corporate bundles', icon: Wifi, color: 'bg-blue-600 text-white' },
    { id: 'utilities', name: t.payElectricity, subtext: 'KEDCO Kano, AEDC, EKEDC', icon: Zap, color: 'bg-amber-600 text-white' },
    { id: 'cable', name: t.cableTv, subtext: 'DStv, GOtv, StarTimes', icon: Tv, color: 'bg-indigo-600 text-white' },
    { id: 'education', name: t.schoolFees, subtext: 'BUK, Kano Poly, WAEC, JAMB', icon: GraduationCap, color: 'bg-purple-600 text-white' },
    { id: 'flights', name: t.bookFlight, subtext: 'Domestic & Regional e-Tickets', icon: Plane, color: 'bg-sky-600 text-white' },
    { id: 'estates', name: t.findProperty, subtext: 'Kano Luxury Duplexes & Lands', icon: Building2, color: 'bg-teal-600 text-white' },
    { id: 'retailer', name: t.retailerHub, subtext: 'Bulk VTU & Reseller Margins', icon: Store, color: 'bg-slate-800 text-white' },
  ];

  const getStatusBadge = (status: Transaction['status']) => {
    switch (status) {
      case 'SUCCESSFUL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            {t.success}
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" />
            {t.pending}
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <AlertCircle className="w-3 h-3" />
            {t.failed}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Banner Split with Generated High-Fidelity Asset */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          {/* Left Column: Value Proposition & Wallet Snapshot */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6 z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium mb-4">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Headquarters: Karkasara Road, Tarauni, Kano State</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {language === 'en'
                  ? 'All-in-One Fintech & Digital Services Engine'
                  : 'Tsarin Kudi da Harkokin Dijital Na Zamani a Kano'}
              </h1>
              <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
                {language === 'en'
                  ? 'Instant VTU airtime & data recharge, Kano KEDCO electricity tokens, school fees validation for BUK & ABU, scheduled domestic flights, and prime real estate management.'
                  : 'Sayi katin waya, fakitin data, kudin wuta na KEDCO, kudin makarantar BUK da ABU, tikitin jirgin sama, da filaye da gidaje masu inganci a Kano.'}
              </p>
            </div>

            {/* Wallet Quick Card in Hero */}
            <div className="p-5 rounded-xl bg-slate-800/80 backdrop-blur border border-slate-700/80 max-w-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {t.walletBalance} ({currentUser?.fullName || 'User'})
                </span>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                  Double-Entry Ledger Verified
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <div className="text-3xl sm:text-4xl font-black font-mono tabular-nums text-white">
                  ₦{wallet ? wallet.balance.toLocaleString() : '0.00'}
                </div>
                <button
                  onClick={onOpenFundWallet}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow transition-all whitespace-nowrap"
                >
                  + {t.fundWallet}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Graphic */}
          <div className="lg:col-span-5 relative min-h-[260px] lg:min-h-full">
            <img
              src="/src/assets/images/fintech_hero_banner_1793020918457.jpg"
              alt="3PLE A Mobile Banking & Digital Services visual"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover opacity-85"
            />
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-slate-900 via-slate-900/40 to-transparent" />
          </div>
        </div>
      </div>

      {/* Quick Services Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            {t.quickActions}
          </h2>
          <span className="text-xs text-slate-500">
            Available 24/7 with instant automated delivery
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {quickServices.map((service) => {
            const Icon = service.icon;
            return (
              <button
                key={service.id}
                onClick={() => {
                  if (service.id === 'vtu-data') onNavigate('vtu');
                  else if (service.id === 'cable') onNavigate('utilities');
                  else onNavigate(service.id);
                }}
                className="group p-5 bg-white rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all text-left flex flex-col justify-between"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${service.color} shadow-sm group-hover:scale-105 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {service.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                    {service.subtext}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Transactions List with Receipts */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h3 className="text-sm font-bold text-slate-900">{t.recentTransactions}</h3>
            <p className="text-xs text-slate-500">Immutable double-entry ledger records</p>
          </div>
          <button
            onClick={() => onNavigate('admin')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
          >
            {t.viewAll} →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">{t.reference}</th>
                <th className="px-6 py-3">Service</th>
                <th className="px-6 py-3">Recipient / Provider</th>
                <th className="px-6 py-3 text-right">{t.amount}</th>
                <th className="px-6 py-3 text-center">{t.status}</th>
                <th className="px-6 py-3 text-right">{t.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400 text-xs">
                    No transactions recorded yet. Fund your wallet or recharge airtime to see entries here.
                  </td>
                </tr>
              ) : (
                transactions.slice(0, 5).map((txn) => (
                  <tr key={txn.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-mono text-xs font-medium text-slate-900 whitespace-nowrap">
                      {txn.reference}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span className="font-semibold text-slate-800">
                        {txn.serviceType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                      {txn.metadata?.phone || txn.metadata?.meterNumber || txn.metadata?.route || txn.providerName}
                    </td>
                    <td className="px-6 py-3.5 font-mono font-bold text-right tabular-nums text-slate-900 whitespace-nowrap">
                      ₦{txn.netAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 text-center whitespace-nowrap">
                      {getStatusBadge(txn.status)}
                    </td>
                    <td className="px-6 py-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => onViewReceipt(txn)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>{t.viewReceipt}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
