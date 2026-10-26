import React, { useState, useEffect } from 'react';
import { User, WalletInfo, Transaction, Language } from './types';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ReceiptModal } from './components/ReceiptModal';
import { FundWalletModal } from './components/FundWalletModal';
import { RoleSwitchModal } from './components/RoleSwitchModal';
import { GeminiChatbot } from './components/GeminiChatbot';
import { HomeView } from './pages/HomeView';
import { VtuView } from './pages/VtuView';
import { UtilitiesView } from './pages/UtilitiesView';
import { EducationView } from './pages/EducationView';
import { FlightsView } from './pages/FlightsView';
import { EstatesView } from './pages/EstatesView';
import { RetailerView } from './pages/RetailerView';
import { DevelopersView } from './pages/DevelopersView';
import { LegalView } from './pages/LegalView';
import { AdminPortal } from './components/AdminPortal';

export default function App() {
  const [portalMode, setPortalMode] = useState<'app' | 'admin'>('app');
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [legalInitialDoc, setLegalInitialDoc] = useState<'TERMS' | 'PRIVACY' | 'REFUND' | 'AML' | 'CONSUMER'>('TERMS');
  const [language, setLanguage] = useState<Language>('en');

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Modals
  const [selectedReceipt, setSelectedReceipt] = useState<Transaction | null>(null);
  const [isFundWalletOpen, setIsFundWalletOpen] = useState<boolean>(false);
  const [isRoleSwitchOpen, setIsRoleSwitchOpen] = useState<boolean>(false);

  // Fetch current session and wallet
  const fetchSession = async () => {
    try {
      const res = await fetch(`/api/v1/auth/me?userId=${currentUser?.id || 'usr_customer_1'}`);
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
        setWallet(data.wallet);
      }
    } catch (e) {
      console.error('Failed to load user session', e);
    }
  };

  // Fetch recent transactions
  const fetchTransactions = async () => {
    try {
      const res = await fetch(`/api/v1/wallet/transactions?userId=${currentUser?.id || ''}&limit=20`);
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch (e) {
      console.error('Failed to load transactions', e);
    }
  };

  useEffect(() => {
    fetchSession();
    fetchTransactions();
  }, []);

  // When active user changes
  useEffect(() => {
    if (currentUser) {
      fetchSession();
      fetchTransactions();
    }
  }, [currentUser?.id]);

  // Handle successful transaction completion
  const handleSuccessTransaction = (txn: Transaction, newBalance: number) => {
    if (wallet) {
      setWallet({ ...wallet, balance: newBalance });
    }
    setTransactions(prev => [txn, ...prev]);
    setSelectedReceipt(txn); // Automatically open official receipt!
  };

  const handleWalletFunded = (newBalance: number) => {
    if (wallet) {
      setWallet({ ...wallet, balance: newBalance });
    }
    fetchTransactions();
  };

  // Render Dedicated Admin Console Portal
  if (portalMode === 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 font-sans selection:bg-emerald-600 selection:text-white">
        <AdminPortal
          currentUser={currentUser}
          language={language}
          setLanguage={setLanguage}
          onExit={() => setPortalMode('app')}
          onOpenRoleSwitch={() => setIsRoleSwitchOpen(true)}
          onRefreshWallet={fetchSession}
        />

        <RoleSwitchModal
          isOpen={isRoleSwitchOpen}
          onClose={() => setIsRoleSwitchOpen(false)}
          currentUser={currentUser}
          onSelectUser={(user) => {
            setCurrentUser(user);
            if (user.role === 'superadmin' || user.role === 'admin' || user.role === 'finance') {
              setPortalMode('admin');
            } else {
              setPortalMode('app');
              if (user.role === 'retailer') setCurrentTab('retailer');
              else setCurrentTab('home');
            }
          }}
          language={language}
        />
      </div>
    );
  }

  // Render Customer / Retailer Main Application
  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-900 flex flex-col justify-between selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Bar Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser}
        wallet={wallet}
        language={language}
        setLanguage={setLanguage}
        onOpenFundWallet={() => setIsFundWalletOpen(true)}
        onOpenRoleSwitch={() => setIsRoleSwitchOpen(true)}
        onEnterAdmin={() => setPortalMode('admin')}
      />

      {/* Main Content Viewport */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {currentTab === 'home' && (
          <HomeView
            currentUser={currentUser}
            wallet={wallet}
            transactions={transactions}
            language={language}
            onNavigate={setCurrentTab}
            onOpenFundWallet={() => setIsFundWalletOpen(true)}
            onViewReceipt={(txn) => setSelectedReceipt(txn)}
          />
        )}

        {currentTab === 'vtu' && (
          <VtuView
            currentUser={currentUser}
            wallet={wallet}
            language={language}
            onSuccessTransaction={handleSuccessTransaction}
            onOpenFundWallet={() => setIsFundWalletOpen(true)}
          />
        )}

        {currentTab === 'utilities' && (
          <UtilitiesView
            currentUser={currentUser}
            wallet={wallet}
            language={language}
            onSuccessTransaction={handleSuccessTransaction}
            onOpenFundWallet={() => setIsFundWalletOpen(true)}
          />
        )}

        {currentTab === 'flights' && (
          <FlightsView
            currentUser={currentUser}
            wallet={wallet}
            language={language}
            onSuccessTransaction={handleSuccessTransaction}
            onOpenFundWallet={() => setIsFundWalletOpen(true)}
          />
        )}

        {currentTab === 'education' && (
          <EducationView
            currentUser={currentUser}
            wallet={wallet}
            language={language}
            onSuccessTransaction={handleSuccessTransaction}
            onOpenFundWallet={() => setIsFundWalletOpen(true)}
          />
        )}

        {currentTab === 'estates' && (
          <EstatesView
            currentUser={currentUser}
            language={language}
          />
        )}

        {currentTab === 'retailer' && (
          <RetailerView
            currentUser={currentUser}
            wallet={wallet}
            language={language}
            onRefreshWallet={fetchSession}
          />
        )}

        {currentTab === 'developers' && (
          <DevelopersView
            language={language}
          />
        )}

        {currentTab === 'legal' && (
          <LegalView
            language={language}
            initialDocument={legalInitialDoc}
            onNavigateHome={() => setCurrentTab('home')}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        language={language}
        onOpenLegal={(doc) => {
          if (doc) setLegalInitialDoc(doc);
          setCurrentTab('legal');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Modals */}
      <ReceiptModal
        transaction={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        language={language}
      />

      <FundWalletModal
        isOpen={isFundWalletOpen}
        onClose={() => setIsFundWalletOpen(false)}
        currentUser={currentUser}
        onSuccess={handleWalletFunded}
        language={language}
      />

      <RoleSwitchModal
        isOpen={isRoleSwitchOpen}
        onClose={() => setIsRoleSwitchOpen(false)}
        currentUser={currentUser}
        onSelectUser={(user) => {
          setCurrentUser(user);
          if (user.role === 'superadmin' || user.role === 'admin' || user.role === 'finance') {
            setPortalMode('admin');
          } else if (user.role === 'retailer') {
            setPortalMode('app');
            setCurrentTab('retailer');
          } else {
            setPortalMode('app');
            setCurrentTab('home');
          }
        }}
        language={language}
      />

      {/* AI Assistant Chatbot with Search Grounding */}
      <GeminiChatbot language={language} />
    </div>
  );
}
