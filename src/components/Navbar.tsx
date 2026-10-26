import React, { useState } from 'react';
import { User, WalletInfo, Language } from '../types';
import { translations } from '../i18n/translations';
import { Wallet, Globe, UserCheck, Shield, ChevronDown, Building2, Plane, GraduationCap, Zap, Smartphone, Plus } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: User | null;
  wallet: WalletInfo | null;
  language: Language;
  setLanguage: (lang: Language) => void;
  onOpenFundWallet: () => void;
  onOpenRoleSwitch: () => void;
  onEnterAdmin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  wallet,
  language,
  setLanguage,
  onOpenFundWallet,
  onOpenRoleSwitch,
  onEnterAdmin
}) => {
  const t = translations[language];
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'superadmin':
      case 'admin':
        return 'Admin';
      case 'retailer':
      case 'agent':
        return 'Retailer';
      case 'finance':
        return 'Finance';
      default:
        return 'Customer';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Brand Wordmark (Single text element wordmark as per Top Bar Contract) */}
          <button
            onClick={() => setCurrentTab('home')}
            className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 group focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-bold text-lg tracking-wider shadow-sm group-hover:bg-emerald-800 transition-colors">
              3A
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors leading-none">
                3PLE A
              </span>
              <span className="text-[10px] text-emerald-800 font-semibold tracking-wide uppercase">
                DATA LIMITED · RC 9746103
              </span>
            </div>
          </button>

          {/* Zone 2: Navigation Links (single-line, whitespace-nowrap shrink-0) */}
          <nav className="hidden md:flex items-center gap-5 lg:gap-7 text-sm font-medium text-slate-600">
            <button
              onClick={() => setCurrentTab('home')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 ${
                currentTab === 'home' ? 'text-emerald-700 font-semibold border-b-2 border-emerald-700' : ''
              }`}
            >
              {t.home}
            </button>
            <button
              onClick={() => setCurrentTab('vtu')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 ${
                currentTab === 'vtu' ? 'text-emerald-700 font-semibold border-b-2 border-emerald-700' : ''
              }`}
            >
              {t.vtuAirtime}
            </button>
            <button
              onClick={() => setCurrentTab('utilities')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 ${
                currentTab === 'utilities' ? 'text-emerald-700 font-semibold border-b-2 border-emerald-700' : ''
              }`}
            >
              {t.billsUtilities}
            </button>
            <button
              onClick={() => setCurrentTab('flights')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 ${
                currentTab === 'flights' ? 'text-emerald-700 font-semibold border-b-2 border-emerald-700' : ''
              }`}
            >
              {t.flights}
            </button>
            <button
              onClick={() => setCurrentTab('education')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 ${
                currentTab === 'education' ? 'text-emerald-700 font-semibold border-b-2 border-emerald-700' : ''
              }`}
            >
              {t.education}
            </button>
            <button
              onClick={() => setCurrentTab('estates')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 ${
                currentTab === 'estates' ? 'text-emerald-700 font-semibold border-b-2 border-emerald-700' : ''
              }`}
            >
              {t.realEstate}
            </button>
            {(currentUser?.role === 'retailer' || currentUser?.role === 'agent' || currentUser?.role === 'reseller' || currentUser?.role === 'superadmin') && (
              <button
                onClick={() => setCurrentTab('retailer')}
                className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 ${
                  currentTab === 'retailer' ? 'text-emerald-700 font-semibold border-b-2 border-emerald-700' : ''
                }`}
              >
                {t.retailerHub}
              </button>
            )}
            <button
              onClick={() => setCurrentTab('developers')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 ${
                currentTab === 'developers' ? 'text-emerald-700 font-semibold border-b-2 border-emerald-700' : ''
              }`}
            >
              {t.developerApi}
            </button>
            <button
              onClick={() => setCurrentTab('legal')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 ${
                currentTab === 'legal' ? 'text-emerald-700 font-semibold border-b-2 border-emerald-700' : ''
              }`}
            >
              {language === 'ha' ? 'Takardun Doka' : 'Legal & Compliance'}
            </button>
          </nav>

          {/* Zone 3: 1 primary action & controls cluster */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'ha' : 'en')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0"
              title="Switch Language / Sauya Harshe"
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>{language === 'en' ? 'Hausa' : 'English'}</span>
            </button>

            {/* Role Tester Switcher button */}
            <button
              onClick={onOpenRoleSwitch}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors whitespace-nowrap shrink-0"
              title="Switch user role for testing"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="truncate max-w-[110px]">{currentUser ? currentUser.fullName.split(' ')[0] : 'Role'}</span>
              <span className="text-[10px] font-semibold bg-emerald-200/80 px-1 rounded text-emerald-900">
                {getRoleLabel(currentUser?.role)}
              </span>
            </button>

            {/* Dedicated Admin Operations Console Button */}
            <button
              onClick={onEnterAdmin}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg shadow-2xs transition-colors whitespace-nowrap shrink-0 group"
              title={language === 'ha' ? 'Shiga Kebantaccen Ofishin Admin' : 'Switch to Admin Operations Console'}
            >
              <Shield className="w-3.5 h-3.5 text-emerald-700 group-hover:scale-105 transition-transform" />
              <span className="hidden sm:inline">{language === 'ha' ? 'Ofishin Admin' : 'Admin Portal'}</span>
              <span className="text-[9px] font-mono font-bold bg-slate-900 text-white px-1.5 py-0.5 rounded">
                HQ
              </span>
            </button>

            {/* Wallet Balance Display */}
            {wallet && (
              <div className="hidden lg:flex flex-col items-end pr-1 text-right">
                <span className="text-[10px] text-slate-500 font-medium">{t.available}</span>
                <span className="text-sm font-bold font-mono tabular-nums text-slate-900">
                  ₦{wallet.balance.toLocaleString()}
                </span>
              </div>
            )}

            {/* Primary Action Button: Fund Wallet */}
            <button
              onClick={onOpenFundWallet}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-all whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{t.fundWallet}</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Sub-bar */}
        <div className="flex md:hidden overflow-x-auto py-2 gap-2 border-t border-slate-100 no-scrollbar text-xs">
          <button
            onClick={() => setCurrentTab('home')}
            className={`px-3 py-1 rounded-md whitespace-nowrap shrink-0 ${currentTab === 'home' ? 'bg-emerald-700 text-white font-medium' : 'text-slate-600 bg-slate-50'}`}
          >
            {t.home}
          </button>
          <button
            onClick={() => setCurrentTab('vtu')}
            className={`px-3 py-1 rounded-md whitespace-nowrap shrink-0 ${currentTab === 'vtu' ? 'bg-emerald-700 text-white font-medium' : 'text-slate-600 bg-slate-50'}`}
          >
            {t.vtuAirtime}
          </button>
          <button
            onClick={() => setCurrentTab('utilities')}
            className={`px-3 py-1 rounded-md whitespace-nowrap shrink-0 ${currentTab === 'utilities' ? 'bg-emerald-700 text-white font-medium' : 'text-slate-600 bg-slate-50'}`}
          >
            {t.billsUtilities}
          </button>
          <button
            onClick={() => setCurrentTab('flights')}
            className={`px-3 py-1 rounded-md whitespace-nowrap shrink-0 ${currentTab === 'flights' ? 'bg-emerald-700 text-white font-medium' : 'text-slate-600 bg-slate-50'}`}
          >
            {t.flights}
          </button>
          <button
            onClick={() => setCurrentTab('education')}
            className={`px-3 py-1 rounded-md whitespace-nowrap shrink-0 ${currentTab === 'education' ? 'bg-emerald-700 text-white font-medium' : 'text-slate-600 bg-slate-50'}`}
          >
            {t.education}
          </button>
          <button
            onClick={() => setCurrentTab('estates')}
            className={`px-3 py-1 rounded-md whitespace-nowrap shrink-0 ${currentTab === 'estates' ? 'bg-emerald-700 text-white font-medium' : 'text-slate-600 bg-slate-50'}`}
          >
            {t.realEstate}
          </button>
          <button
            onClick={() => setCurrentTab('retailer')}
            className={`px-3 py-1 rounded-md whitespace-nowrap shrink-0 ${currentTab === 'retailer' ? 'bg-emerald-700 text-white font-medium' : 'text-slate-600 bg-slate-50'}`}
          >
            {t.retailerHub}
          </button>
          <button
            onClick={() => setCurrentTab('developers')}
            className={`px-3 py-1 rounded-md whitespace-nowrap shrink-0 ${currentTab === 'developers' ? 'bg-emerald-700 text-white font-medium' : 'text-slate-600 bg-slate-50'}`}
          >
            {t.developerApi}
          </button>
          <button
            onClick={() => setCurrentTab('legal')}
            className={`px-3 py-1 rounded-md whitespace-nowrap shrink-0 ${currentTab === 'legal' ? 'bg-emerald-700 text-white font-medium' : 'text-slate-600 bg-slate-50'}`}
          >
            {language === 'ha' ? 'Doka' : 'Legal'}
          </button>
        </div>
      </div>
    </header>
  );
};
