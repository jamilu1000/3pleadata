import React from 'react';
import { User, Language } from '../types';
import { translations } from '../i18n/translations';
import { UserCheck, Shield, Store, Building, Briefcase, X, Check } from 'lucide-react';

interface RoleSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onSelectUser: (user: User) => void;
  language: Language;
}

export const RoleSwitchModal: React.FC<RoleSwitchModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectUser,
  language
}) => {
  if (!isOpen) return null;
  const t = translations[language];

  const demoAccounts = [
    {
      id: 'usr_customer_1',
      fullName: 'Amina Bello',
      role: 'customer',
      roleTitle: 'Customer / End User',
      description: 'Test wallet funding, airtime/data purchases, electricity token generation, flight booking, school fees payment, and real estate inspection inquiries.',
      icon: UserCheck,
      color: 'text-blue-600 bg-blue-50 border-blue-200'
    },
    {
      id: 'usr_retailer_1',
      fullName: 'Danladi Garba (Danladi VTU)',
      role: 'retailer',
      roleTitle: 'Retailer & Reseller Agent',
      description: 'Access the Retailer Portal, profit margins matrix, bulk VTU batch executor, commission earnings wallet, and generate Reseller API Keys.',
      icon: Store,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200'
    },
    {
      id: 'usr_agent_estate',
      fullName: 'Sani Mukhtar (Estate Broker)',
      role: 'agent',
      roleTitle: 'Licensed Estate Broker',
      description: 'List premium Kano properties (duplexes, serviced flats, commercial plazas), review buyer inquiries, and manage viewing schedules.',
      icon: Building,
      color: 'text-amber-700 bg-amber-50 border-amber-200'
    },
    {
      id: 'usr_finance_officer',
      fullName: 'Fatima Kabir (Chief Financial Officer)',
      role: 'finance',
      roleTitle: 'Finance & Compliance Officer',
      description: 'Inspect double-entry ledger journals, verify total debits equals total credits, approve refunds, and monitor revenue flows.',
      icon: Briefcase,
      color: 'text-purple-700 bg-purple-50 border-purple-200'
    },
    {
      id: 'usr_superadmin',
      fullName: 'Super Administrator',
      role: 'superadmin',
      roleTitle: 'Super Administrator HQ',
      description: 'Full system control: dynamic API provider registry, connection diagnostic tests, user role management, system pricing controls, and audit logs.',
      icon: Shield,
      color: 'text-rose-700 bg-rose-50 border-rose-200'
    }
  ];

  const handleSelect = async (account: typeof demoAccounts[0]) => {
    try {
      const res = await fetch('/api/v1/auth/switch-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: account.id })
      });
      const data = await res.json();
      if (data.success && data.user) {
        onSelectUser(data.user);
        onClose();
      }
    } catch (e) {
      console.error('Failed to switch user', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">{t.switchRole}</h3>
            <p className="text-xs text-slate-500">
              Easily evaluate all 5 platform roles without re-authenticating
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Roles list */}
        <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
          {demoAccounts.map((account) => {
            const Icon = account.icon;
            const isSelected = currentUser?.id === account.id;

            return (
              <button
                key={account.id}
                onClick={() => handleSelect(account)}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-4 ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white'
                }`}
              >
                <div className={`p-2.5 rounded-xl border shrink-0 ${account.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {account.fullName}
                    </h4>
                    {isSelected && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <Check className="w-3 h-3" />
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-semibold text-slate-600 mt-0.5">
                    {account.roleTitle}
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    {account.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
