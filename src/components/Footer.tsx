import React, { useState } from 'react';
import { Language } from '../types';
import { translations } from '../i18n/translations';
import { ShieldCheck, MapPin, Mail, Phone, X, Scale, FileText, Lock, RotateCcw, Shield, ExternalLink, Printer } from 'lucide-react';

interface FooterProps {
  language: Language;
  onOpenLegal?: (doc?: 'TERMS' | 'PRIVACY' | 'REFUND' | 'AML' | 'CONSUMER') => void;
}

export const Footer: React.FC<FooterProps> = ({ language, onOpenLegal }) => {
  const t = translations[language];
  const [activePolicy, setActivePolicy] = useState<'TERMS' | 'PRIVACY' | 'REFUND' | 'AML' | 'CONSUMER' | null>(null);

  const handleOpenDoc = (doc: 'TERMS' | 'PRIVACY' | 'REFUND' | 'AML' | 'CONSUMER') => {
    if (onOpenLegal) {
      onOpenLegal(doc);
    } else {
      setActivePolicy(doc);
    }
  };

  const isHausa = language === 'ha';

  return (
    <footer className="mt-16 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-bold text-sm">
                3A
              </div>
              <span className="text-base font-extrabold tracking-tight text-slate-900">
                3PLE A DATA LIMITED
              </span>
              <span className="text-[10px] font-mono text-emerald-800 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                RC 9746103
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              Nigeria's premier multi-service digital platform. Secure double-entry VTU telecom recharges, Kano KEDCO electricity distribution, school fees processing, domestic flight bookings, and verified real estate management.
            </p>
            <div className="space-y-1 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Karkasara Road, Tarauni, Kano State, Nigeria</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>support@3ple-a.ng · compliance@3ple-a.ng</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>+234 (0) 803 000 0001 (Mon - Sat: 8:00 AM - 8:00 PM WAT)</span>
              </div>
            </div>
          </div>

          {/* Service Links */}
          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider">Services</h4>
            <ul className="space-y-1.5 text-slate-600">
              <li>MTN, Airtel, Glo & 9mobile VTU</li>
              <li>KEDCO Kano & National DisCos</li>
              <li>Bayero University Kano (BUK) Tuition</li>
              <li>Scheduled Domestic Flights</li>
              <li>Tarauni GRA & Kano Properties</li>
              <li>Reseller Wholesale API</li>
            </ul>
          </div>

          {/* Legal & Regulatory Compliance */}
          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-emerald-700" />
              <span>{isHausa ? 'Takardun Doka' : 'Legal & Compliance'}</span>
            </h4>
            <ul className="space-y-1.5 text-slate-600">
              <li>
                <button
                  onClick={() => handleOpenDoc('TERMS')}
                  className="hover:text-emerald-700 transition-colors text-left flex items-center gap-1.5 group"
                >
                  <FileText className="w-3 h-3 text-slate-400 group-hover:text-emerald-700" />
                  <span>{t.termsOfService}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleOpenDoc('PRIVACY')}
                  className="hover:text-emerald-700 transition-colors text-left flex items-center gap-1.5 group"
                >
                  <Lock className="w-3 h-3 text-slate-400 group-hover:text-emerald-700" />
                  <span>{t.privacyPolicy}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleOpenDoc('REFUND')}
                  className="hover:text-emerald-700 transition-colors text-left flex items-center gap-1.5 group"
                >
                  <RotateCcw className="w-3 h-3 text-slate-400 group-hover:text-emerald-700" />
                  <span>{t.refundPolicy}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleOpenDoc('AML')}
                  className="hover:text-emerald-700 transition-colors text-left flex items-center gap-1.5 group"
                >
                  <Shield className="w-3 h-3 text-slate-400 group-hover:text-emerald-700" />
                  <span>{t.amlPolicy}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleOpenDoc('CONSUMER')}
                  className="hover:text-emerald-700 transition-colors text-left flex items-center gap-1.5 group"
                >
                  <Scale className="w-3 h-3 text-slate-400 group-hover:text-emerald-700" />
                  <span>{t.consumerProtection}</span>
                </button>
              </li>
              <li className="pt-2 text-[11px] text-slate-400">
                Operating strictly under NDPA 2023, CBN Consumer Framework & FCCPA 2018.
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            © 2026 3PLE A DATA LIMITED (RC: 9746103). All rights reserved. Registered in Kano, Nigeria.
          </div>
          <div className="flex items-center gap-1 text-emerald-700 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Double-Entry Financial Ledger Verified • NDPA 2023 Compliant</span>
          </div>
        </div>
      </div>

      {/* Fallback In-Modal Reader if accessed directly */}
      {activePolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  {activePolicy === 'TERMS' && t.termsOfService}
                  {activePolicy === 'PRIVACY' && t.privacyPolicy}
                  {activePolicy === 'REFUND' && t.refundPolicy}
                  {activePolicy === 'AML' && t.amlPolicy}
                  {activePolicy === 'CONSUMER' && t.consumerProtection}
                </h3>
              </div>
              <button
                onClick={() => setActivePolicy(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 text-xs text-slate-600 space-y-4 leading-relaxed overflow-y-auto">
              <div className="p-3 rounded-lg bg-emerald-50 text-emerald-950 font-mono text-[11px] border border-emerald-200">
                Jurisdiction: Federal Republic of Nigeria · Kano State High Court · Regulated under NDPA 2023, FCCPA 2018 & CBN Guidelines.
              </div>

              {activePolicy === 'TERMS' && (
                <div className="space-y-3">
                  <p><strong>1. Electronic Contracting:</strong> By using 3PLE A services (Karkasara Road, Tarauni, Kano), you agree to be bound by these Terms of Service pursuant to the Cybercrimes Act 2015 and Evidence Act 2011.</p>
                  <p><strong>2. Digital Deliveries:</strong> All airtime, data bundles, electricity tokens, and school fees are delivered through automated provider API adapters. Wallets are debited atomically upon verified issuance.</p>
                  <p><strong>3. Domestic & International Flights:</strong> 3PLE A acts as a booking intermediary. Contract of carriage is governed by operating airline tariffs and NCAA Part 19 Passenger Bill of Rights.</p>
                  <p><strong>4. Real Estate Disclosures:</strong> In compliance with the Land Use Act 1978, all property listings in Kano State are subject to title searches at the Kano State Ministry of Land and Physical Planning.</p>
                </div>
              )}

              {activePolicy === 'PRIVACY' && (
                <div className="space-y-3">
                  <p><strong>1. Lawful Data Collection:</strong> In accordance with the Nigeria Data Protection Act 2023 (NDPA) and GDPR, 3PLE A collects necessary user details (Name, Phone number, Email, verified NIN/BVN hash) strictly for transaction execution and regulatory compliance.</p>
                  <p><strong>2. Redacted Secrets & Encryption:</strong> All payment credentials, tokens, and provider secrets are stored using AES-256 server-side encryption and never exposed in client bundles.</p>
                  <p><strong>3. Data Subject Rights:</strong> Users have the right to access, rectify, or request erasure of their records by contacting our DPO at <code>dpo@3plea.com.ng</code>.</p>
                </div>
              )}

              {activePolicy === 'REFUND' && (
                <div className="space-y-3">
                  <p><strong>1. Instant Reversals:</strong> Failed VTU and bill payments resulting from network timeouts are detected automatically and reversed to the customer's wallet ledger within seconds.</p>
                  <p><strong>2. Flight Cancellations:</strong> For flight schedule disruptions by the operating airline, refunds are credited back pursuant to NCAA Part 19 rules.</p>
                  <p><strong>3. Non-Refundable Items:</strong> Successfully generated Standard Transfer Specification (STS) electricity tokens and telecom-confirmed airtime cannot be reversed or refunded once delivered.</p>
                </div>
              )}

              {activePolicy === 'AML' && (
                <div className="space-y-3">
                  <p><strong>1. Statutory Compliance:</strong> Enacted pursuant to the Money Laundering (Prevention and Prohibition) Act 2022 (MLPPA) and Terrorism (Prevention and Prohibition) Act 2022.</p>
                  <p><strong>2. Tiered KYC:</strong> Tier 1 (Daily Limit: ₦50,000), Tier 2 (Daily Limit: ₦200,000), Tier 3 (Daily Limit: ₦5,000,000+ with CAC and proof of address).</p>
                  <p><strong>3. NFIU Reporting:</strong> Automated transaction monitoring and filing of Suspicious Transaction Reports (STRs) to the Nigerian Financial Intelligence Unit.</p>
                </div>
              )}

              {activePolicy === 'CONSUMER' && (
                <div className="space-y-3">
                  <p><strong>1. FCCPA 2018 Protections:</strong> Full disclosure of all rates, commissions, and fees prior to authorization. Prohibitions on unfair terms or unauthorized deductions.</p>
                  <p><strong>2. Dispute Escalation:</strong> Tier 1: In-app support (2-hour SLA); Tier 2: Compliance Directorate at Karkasara Road, Tarauni Kano (24-hour SLA); Tier 3: External regulatory escalation to FCCPC or CBN Consumer Protection Department.</p>
                </div>
              )}
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono">DPO: dpo@3plea.com.ng</span>
              <button
                onClick={() => {
                  setActivePolicy(null);
                  if (onOpenLegal) onOpenLegal(activePolicy);
                }}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold transition"
              >
                Open Full Document
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
