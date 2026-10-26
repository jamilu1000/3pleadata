import React, { useState } from 'react';
import { Language } from '../types';
import { translations } from '../i18n/translations';
import {
  FileText,
  Shield,
  Scale,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Printer,
  Download,
  Search,
  BookOpen,
  Building,
  Mail,
  MapPin,
  ExternalLink,
  Lock,
  Globe2,
  ChevronRight
} from 'lucide-react';

interface LegalViewProps {
  language: Language;
  initialDocument?: 'TERMS' | 'PRIVACY' | 'REFUND' | 'AML' | 'CONSUMER';
  onNavigateHome?: () => void;
}

export const LegalView: React.FC<LegalViewProps> = ({
  language,
  initialDocument = 'TERMS',
  onNavigateHome
}) => {
  const t = translations[language];
  const [activeDoc, setActiveDoc] = useState<'TERMS' | 'PRIVACY' | 'REFUND' | 'AML' | 'CONSUMER'>(initialDocument);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handlePrint = () => {
    window.print();
  };

  const isHausa = language === 'ha';

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Page Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Scale className="w-64 h-64 text-emerald-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold uppercase tracking-wider">
              <Scale className="w-3.5 h-3.5" />
              <span>{isHausa ? 'Ka\'idojin Shari\'a da Kariyar Doka' : 'Regulatory & Statutory Compliance'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {t.legalDocuments}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {t.legalSubtitle}
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-4 text-[11px] font-mono text-emerald-300">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Nigeria Data Protection Act (NDPA 2023)
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                CBN Consumer Framework & BOFIA 2020
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                GDPR & FATF Global Compliance
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20 transition backdrop-blur-sm shadow-sm"
              title="Print document or Save as PDF"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>{t.downloadLegal}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs & Search Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        {/* Document Switcher Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1 bg-slate-100 rounded-xl">
          {[
            { id: 'TERMS', label: t.termsOfService, icon: FileText },
            { id: 'PRIVACY', label: t.privacyPolicy, icon: Lock },
            { id: 'REFUND', label: t.refundPolicy, icon: RotateCcw },
            { id: 'AML', label: t.amlPolicy, icon: Shield },
            { id: 'CONSUMER', label: t.consumerProtection, icon: BookOpen }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeDoc === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveDoc(tab.id as any)}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Clause Quick Filter */}
        <div className="relative shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isHausa ? 'Nemi sashe a cikin takarda...' : 'Search within clauses...'}
            className="pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 w-full md:w-64"
          />
        </div>
      </div>

      {/* Legal Document Content Canvas */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-8 print:border-none print:shadow-none print:p-0">
        
        {/* Document Metadata Header */}
        <div className="border-b border-slate-100 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <div className="text-base font-extrabold text-slate-900">
              3PLE A DATA LIMITED <span className="text-xs font-semibold text-emerald-800 font-mono">(RC: 9746103)</span>
            </div>
            <div>Karkasara Road, Tarauni, Kano State, Federal Republic of Nigeria</div>
            <div className="font-mono text-emerald-800 mt-0.5">
              Corporate Affairs Commission (CAC) Reg: RC 9746103 · Compliance Directorate · Ref: 3A/LEG/2026/DOC-04
            </div>
          </div>
          <div className="sm:text-right font-mono text-[11px] space-y-0.5">
            <div>{t.lastUpdated}</div>
            <div className="text-slate-600">{t.governingJurisdiction}</div>
            <div className="text-emerald-700 font-semibold">{t.dpoContact}</div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DOCUMENT 1: TERMS OF SERVICE */}
        {/* ========================================================================= */}
        {activeDoc === 'TERMS' && (
          <article className="space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed">
            <div className="border-l-4 border-emerald-700 pl-4 py-1">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">
                Master Terms of Service & Electronic Contracting Agreement
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Enacted pursuant to the Federal Competition and Consumer Protection Act (FCCPA) 2018, Cybercrimes (Prohibition, Prevention, etc.) Act 2015, and Evidence Act 2011.
              </p>
            </div>

            {isHausa && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs space-y-1">
                <strong>Takaitaccen Bayani (Hausa):</strong>
                <p>
                  Wadannan sharudda sun zama yarjejeniyar doka tsakaninka da kamfanin 3PLE A DATA LIMITED (RC: 9746103) mai ofis a Karkasara Road, Tarauni, Kano. Ta hanyar yin rijista ko sayen katin waya, data, kudin wutar lantarki, yanke tikitin jirgi ko neman gida, ka yarda ka bi wadannan ka'idoji karkashin dokokin Najeriya.
                </p>
              </div>
            )}

            <section className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                1. Electronic Contracting, Parties & Acceptance
              </h3>
              <p>
                This Master Terms of Service Agreement ("Agreement") constitutes a legally binding contract between you (the "User", "Customer", or "Retailer") and <strong>3PLE A DATA LIMITED (RC: 9746103)</strong>, a company incorporated under the Companies and Allied Matters Act (CAMA) in the Federal Republic of Nigeria with its principal operational headquarters situated at Karkasara Road, Tarauni, Kano State, Nigeria ("3PLE A", "we", "us", or "our").
              </p>
              <p>
                By creating an account, authenticating via OAuth or mobile credentials, funding a wallet, or clicking "I Agree", you acknowledge and agree that electronic transmission through our web interfaces and APIs satisfies all statutory requirements of written contracts pursuant to the <em>Cybercrimes (Prohibition, Prevention, etc.) Act 2015</em> and Section 84 of the <em>Evidence Act 2011</em>.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                2. Digital Stored-Value Wallet Operations
              </h3>
              <p>
                <strong>2.1 Nature of Digital Float:</strong> Your 3PLE A digital wallet is an electronic stored-value ledger account used exclusively for purchasing eligible digital utilities, airline tickets, and real estate inspection services. Digital wallet balances do NOT constitute banking deposits insured by the Nigeria Deposit Insurance Corporation (NDIC) and do not accrue interest. All funds are held in segregated, audited settlement accounts with licensed commercial banks supervised by the Central Bank of Nigeria (CBN).
              </p>
              <p>
                <strong>2.2 Double-Entry Mathematical Integrity:</strong> All wallet balance updates are governed by strict append-only double-entry cryptographic ledgers where total debits equal total credits. Any unauthorized credit resulting from technical system anomalies must be reported immediately and is subject to automated reversal without prior notice.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                3. Service-Specific Terms & Execution Rules
              </h3>
              
              <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="font-bold text-slate-900">3.1 Telecom VTU & Data Bundles:</h4>
                <p>
                  Airtime and data purchases are routed through direct aggregator connections to licensed Mobile Network Operators (MTN Nigeria, Airtel Africa, Globacom, and 9mobile). Customers bear sole responsibility for entering the correct recipient phone number (MSISDN). Once an operator switch confirms token injection or airtime delivery, the transaction is irrevocable, non-transferable, and non-refundable.
                </p>
              </div>

              <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="font-bold text-slate-900">3.2 Electricity & Power Utility Tokens (KEDCO & National DisCos):</h4>
                <p>
                  Payment for prepaid tokens or postpaid energy bills are generated via Standard Transfer Specification (STS) protocol directly through Kano Electricity Distribution Company (KEDCO) and other national DisCos. Customers must ensure meter number verification prior to payment authorization. STS tokens generated for a specific meter cannot be loaded onto another meter or refunded.
                </p>
              </div>

              <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="font-bold text-slate-900">3.3 Domestic & International Flight Ticketing:</h4>
                <p>
                  3PLE A acts solely as a licensed travel booking intermediary connecting travelers with scheduled air carriers (including Air Peace, Aero Contractors, Max Air, Ibom Air, Dana Air, and global GDS networks). The contract of carriage is directly between the passenger and the operating airline. All bookings are subject to the carrier's published tariffs and the <em>Nigerian Civil Aviation Authority (NCAA) Regulations Part 19 (Consumer Protection & Passenger Bill of Rights)</em>. Passenger names must strictly match valid government identification (NIN Slip, Voter ID, or International Passport).
                </p>
              </div>

              <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="font-bold text-slate-900">3.4 Kano & Northern Nigeria Real Estate Brokerage:</h4>
                <p>
                  Property listings displayed in Tarauni GRA, Nasarawa, Badawa, and Kano metropolis are curated from verified real estate developers and landlords. 3PLE A acts as a verified marketing, inspection scheduling, and escrow facilitation broker. In compliance with the <em>Land Use Act 1978</em>, buyers are advised to conduct independent legal title searches at the Kano State Ministry of Land and Physical Planning prior to executing title deeds.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                4. Limitation of Liability & Force Majeure
              </h3>
              <p>
                To the fullest extent permitted by Section 127 of the <em>Federal Competition and Consumer Protection Act (FCCPA) 2018</em>, 3PLE A and its directors, officers, or agents shall not be liable for indirect, punitive, or consequential damages resulting from upstream carrier network delays, airline schedule disruptions, national power grid failures, or telecommunication switch maintenance. In all events, 3PLE A's maximum aggregate liability shall be limited to the value of the specific transaction fee earned on the subject transaction.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                5. Dispute Resolution & Governing Law
              </h3>
              <p>
                This Agreement is governed by and construed in accordance with the substantive laws of the Federal Republic of Nigeria. In the event of any claim, dispute, or controversy arising out of or in connection with these services:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>The parties shall first attempt to resolve the dispute amicably through good-faith negotiations within thirty (30) calendar days of formal notice to <code>legal@3ple-a.ng</code>.</li>
                <li>Failing amicable resolution, the dispute shall be finally settled by binding arbitration in accordance with the <em>Arbitration and Mediation Act 2023</em> of Nigeria. The seat and venue of arbitration shall be Kano, Kano State, Nigeria, and proceedings shall be conducted in the English language.</li>
              </ul>
            </section>
          </article>
        )}

        {/* ========================================================================= */}
        {/* DOCUMENT 2: PRIVACY POLICY & DATA PROTECTION CHARTER */}
        {/* ========================================================================= */}
        {activeDoc === 'PRIVACY' && (
          <article className="space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed">
            <div className="border-l-4 border-emerald-700 pl-4 py-1">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">
                Privacy Policy & Data Protection Charter
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Compliance Notice: Nigeria Data Protection Act (NDPA) 2023, NDPC Guidelines & General Data Protection Regulation (EU GDPR) Regulation (EU) 2016/679.
              </p>
            </div>

            {isHausa && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs space-y-1">
                <strong>Takaitaccen Bayani kan Kare Sirri (Hausa):</strong>
                <p>
                  3PLE A tana kare bayanan ka na sirri karkashin Dokar Kare Bayanai ta Najeriya (NDPA 2023) da ka'idojin duniya na GDPR. Ba ma sayar da bayananka ga kowa, kuma ana adana lambar BVN, NIN, da lambobin banki cikin tsarin kariya mai matukar tsaro. Kana da ikon duba ko neman goge bayananka a kowane lokaci.
                </p>
              </div>
            )}

            <section className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                1. Data Controller Identity & DPO Governance
              </h3>
              <p>
                For the purposes of the <em>Nigeria Data Protection Act (NDPA) 2023</em> and applicable international privacy frameworks including the <em>General Data Protection Regulation (GDPR)</em>, <strong>3PLE A DATA LIMITED (RC: 9746103)</strong> is designated as the Data Controller of your personal data.
              </p>
              <p>
                We have formally appointed a certified Data Protection Officer (DPO) who is directly accessible for all privacy rights and inquiries via email at <code>dpo@3plea.com.ng</code> or by registered post at our headquarters at Karkasara Road, Tarauni, Kano State.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                2. Categories of Personal Data Processed
              </h3>
              <p>
                To deliver financial transactions and comply with CBN KYC/AML directives, we collect and process the following categories of data:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900">Identity & Demographic Data</div>
                  <div className="text-xs text-slate-500 mt-1">Full legal name, phone number, email address, physical residence, verified NIN, BVN validation hash, and passport data for flights.</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900">Financial & Transaction Data</div>
                  <div className="text-xs text-slate-500 mt-1">Wallet ledger movements, payment card tokens via PCI-DSS Level 1 processors, virtual bank account numbers, and utility meter records.</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900">Device & Telemetry Data</div>
                  <div className="text-xs text-slate-500 mt-1">IP address, geolocation for fraud prevention, device hardware identifiers, operating system version, and session timestamps.</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900">Aviation & Property Inquiries</div>
                  <div className="text-xs text-slate-500 mt-1">Airline passenger manifests, special assistance preferences, and property viewing schedules in Kano State.</div>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                3. Lawful Bases for Processing Under NDPA & GDPR
              </h3>
              <p>We process your data strictly under recognized lawful bases:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Contractual Performance (Art. 25(1)(a) NDPA, Art. 6(1)(b) GDPR):</strong> Required to fulfill recharge orders, issue electricity tokens, confirm flight e-tickets, and credit your digital wallet.</li>
                <li><strong>Legal & Regulatory Compliance (Art. 25(1)(b) NDPA, Art. 6(1)(c) GDPR):</strong> Mandated by the Central Bank of Nigeria (CBN), Nigerian Financial Intelligence Unit (NFIU), and anti-money laundering regulations.</li>
                <li><strong>Legitimate Interests (Art. 25(1)(e) NDPA, Art. 6(1)(f) GDPR):</strong> To protect system integrity, detect fraudulent attempts, maintain double-entry balance audits, and improve user experience.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                4. Your Statutory Rights as a Data Subject
              </h3>
              <p>
                Under Section 34 of the <em>Nigeria Data Protection Act 2023</em> and Articles 15–22 of the <em>GDPR</em>, you possess unequivocal rights:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Right of Access:</strong> Request a full copy of your personal data records held in our systems.</li>
                <li><strong>Right to Rectification:</strong> Request prompt correction of inaccurate or incomplete personal data.</li>
                <li><strong>Right to Erasure ("Right to be Forgotten"):</strong> Request deletion of your data where processing is no longer legally necessary, subject to our statutory 7-year anti-money laundering financial retention obligations under Nigerian law.</li>
                <li><strong>Right to Data Portability:</strong> Receive your transaction history and account records in a structured, machine-readable JSON/CSV format.</li>
                <li><strong>Right to Lodge Complaints:</strong> File an administrative complaint with the Nigeria Data Protection Commission (NDPC) at <code>info@ndpc.gov.ng</code>.</li>
              </ul>
            </section>
          </article>
        )}

        {/* ========================================================================= */}
        {/* DOCUMENT 3: REFUND & REVERSAL POLICY */}
        {/* ========================================================================= */}
        {activeDoc === 'REFUND' && (
          <article className="space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed">
            <div className="border-l-4 border-emerald-700 pl-4 py-1">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">
                Refund, Cancellation & Automated Reversal Policy
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Aligned with the Central Bank of Nigeria Consumer Protection Framework and NCAA Passenger Bill of Rights.
              </p>
            </div>

            {isHausa && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs space-y-1">
                <strong>Takaitaccen Bayani kan Mayar da Kudi (Hausa):</strong>
                <p>
                  Idan ka sayi katin waya ko kudin wuta kuma hanyar sadarwa ta samu matsala (bai shiga ba), tsarinmu yana gano hakan kuma ya mayar maka da kudin nan take cikin asusun ka. Game da tikitin jirgin sama, idan kamfanin jirgi ya soke tafiya, za a biya ka kudin ka kamar yadda dokar hukumar NCAA ta tanada.
                </p>
              </div>
            )}

            <section className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                1. Automated Instant Reversals for Failed VTU & Bills
              </h3>
              <p>
                <strong>1.1 Synchronous Gateway Timeouts:</strong> When a customer initiates an airtime recharge, data plan subscription, or electricity payment, 3PLE A implements real-time idempotency checks. If the upstream provider gateway (e.g. ClubKonnect, VTpass, Monnify, or Payora) returns a status of <code>FAILED</code>, <code>REJECTED</code>, or exceeds the 15-second network timeout threshold:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>The user's digital wallet balance is immediately credited via double-entry journal reversal.</li>
                <li>An in-app notification and electronic reversal receipt are automatically generated with a unique reference.</li>
                <li>Zero administrative deduction or penalty is charged for automated reversals.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                2. Airline Ticket Cancellations & Passenger Refunds
              </h3>
              <p>
                <strong>2.1 Involuntary Cancellations by Operating Airline:</strong> If an operating carrier (e.g., Air Peace, Aero Contractors, Max Air) cancels, reschedules by more than 2 hours, or terminates a flight itinerary, refunds are governed by Part 19 of the <em>Nigerian Civil Aviation Regulations (Nig. CARs)</em>. Customers are entitled to a full 100% refund without airline penalty fees. 3PLE A will credit the customer's wallet or original bank source within 14–21 business days upon receipt of funds from the operating carrier.
              </p>
              <p>
                <strong>2.2 Voluntary Customer Cancellation:</strong> If a customer cancels a confirmed e-ticket voluntarily:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Refund eligibility is strictly determined by the fare rules and ticket class (Economy Saver tickets are generally non-refundable).</li>
                <li>The operating carrier's published cancellation fee plus a 3PLE A administrative processing fee of ₦5,000 shall be deducted from the gross fare.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                3. Non-Refundable Deliveries
              </h3>
              <p>The following transactions are strictly non-refundable once successfully fulfilled:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Successfully Generated STS Electricity Tokens:</strong> Prepaid electricity tokens generated by DisCos are permanently bound to the specified meter and cannot be retracted, canceled, or refunded.</li>
                <li><strong>Carrier-Confirmed Airtime & Data Bundles:</strong> Once a telecom carrier confirms airtime injection into an MSISDN, telecommunication regulations prevent recovery of digital credit.</li>
                <li><strong>Dispatched Real Estate Inspection Logistics:</strong> Site inspection transportation and logistics fees are non-refundable once an agent has been dispatched to the property location.</li>
              </ul>
            </section>
          </article>
        )}

        {/* ========================================================================= */}
        {/* DOCUMENT 4: AML / CFT & KYC COMPLIANCE POLICY */}
        {/* ========================================================================= */}
        {activeDoc === 'AML' && (
          <article className="space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed">
            <div className="border-l-4 border-emerald-700 pl-4 py-1">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">
                Anti-Money Laundering (AML), Counter-Terrorist Financing (CFT) & KYC Policy
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Enacted pursuant to the Money Laundering (Prevention and Prohibition) Act 2022 and CBN AML/CFT Regulations.
              </p>
            </div>

            {isHausa && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs space-y-1">
                <strong>Takaitaccen Bayani kan Yaki da Halatta Kudaden Haram (Hausa):</strong>
                <p>
                  3PLE A tana aiki kafada da kafada da Hukumar Leken Asirin Kudade ta Najeriya (NFIU) da Babban Bankin Najeriya (CBN). Ba a yarda a yi amfani da manhajarmu don halatta kudin haram, tallafawa ta'addanci, ko zamba ba. Akwai matakan shaida (Tier 1, Tier 2, Tier 3) don tantance kowane mai amfani.
                </p>
              </div>
            )}

            <section className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                1. Institutional Statement of Commitment
              </h3>
              <p>
                3PLE A maintains an uncompromising zero-tolerance policy towards money laundering, terrorist financing, and proliferation financing. We comply fully with the <em>Money Laundering (Prevention and Prohibition) Act 2022 (MLPPA)</em>, the <em>Terrorism (Prevention and Prohibition) Act 2022 (TPPA)</em>, and the <em>Financial Action Task Force (FATF) 40 Recommendations</em>.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                2. CBN Tiered Customer Due Diligence (KYC) Matrix
              </h3>
              <p>
                In alignment with the Central Bank of Nigeria's Three-Tiered KYC Framework, account limits are strictly enforced:
              </p>

              <div className="overflow-x-auto pt-1">
                <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-50 font-bold text-slate-900 border-b border-slate-200">
                    <tr>
                      <th className="p-3">KYC Tier</th>
                      <th className="p-3">Verification Requirements</th>
                      <th className="p-3">Daily Transaction Limit</th>
                      <th className="p-3">Maximum Wallet Float</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    <tr>
                      <td className="p-3 font-bold text-emerald-800">Tier 1 (Basic)</td>
                      <td className="p-3 font-sans">Verified Mobile Number + Full Legal Name</td>
                      <td className="p-3">₦50,000</td>
                      <td className="p-3">₦300,000</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-emerald-800">Tier 2 (Standard)</td>
                      <td className="p-3 font-sans">BVN Validation + Valid National ID (NIN, Drivers License)</td>
                      <td className="p-3">₦200,000</td>
                      <td className="p-3">₦1,000,000</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-emerald-800">Tier 3 (Enhanced)</td>
                      <td className="p-3 font-sans">Utility Bill (KEDCO &lt;3 months) + CAC Documents (for Retailers)</td>
                      <td className="p-3">₦5,000,000+</td>
                      <td className="p-3">Custom Merchant Limit</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                3. Mandatory Sanctions Screening & Suspicious Transaction Reporting (STR)
              </h3>
              <p>
                <strong>3.1 Sanctions Lists:</strong> All customers and retailer accounts are automatedly screened against the Consolidated United Nations Security Council Sanctions List, the US Office of Foreign Assets Control (OFAC) Specially Designated Nationals list, and the Nigerian Sanctions Committee Consolidated List.
              </p>
              <p>
                <strong>3.2 NFIU Reporting:</strong> Pursuant to Section 7 of the <em>Money Laundering (Prevention and Prohibition) Act 2022</em>, any transaction exhibiting characteristics of smurfing, structuring, or unusual velocity shall be reported to the Nigerian Financial Intelligence Unit (NFIU) within twenty-four (24) hours. In strict observance of statutory "tipping-off" prohibitions, 3PLE A staff are prohibited by law from disclosing such reports to the customer.
              </p>
            </section>
          </article>
        )}

        {/* ========================================================================= */}
        {/* DOCUMENT 5: CONSUMER RIGHTS CHARTER */}
        {/* ========================================================================= */}
        {activeDoc === 'CONSUMER' && (
          <article className="space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed">
            <div className="border-l-4 border-emerald-700 pl-4 py-1">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">
                Consumer Rights Charter & Regulatory Escalation Channels
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Guaranteed rights under the Federal Competition and Consumer Protection Act (FCCPA) 2018.
              </p>
            </div>

            {isHausa && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs space-y-1">
                <strong>Takaitaccen Bayani kan Hakkin Masu Sayayya (Hausa):</strong>
                <p>
                  A 3PLE A, muna girmama hakkin kowane abokin ciniki. Kana da hakkin samun bayyananniyar rasit, kudin aiki na gaskiya ba tare da boyayyen caji ba, da kuma samun amsa mai gamsarwa cikin sauri idan ka fuskanci wata matsala.
                </p>
              </div>
            )}

            <section className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                1. Core Consumer Rights at 3PLE A
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>Right to Transparent Pricing</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    All fees, discounts, retailer margins, and payment gateway charges are displayed upfront before final authorization. No hidden surcharges or post-transaction deductions.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>Right to Timely Delivery & Receipts</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Immediate generation of cryptographic electronic receipts with tamper-evident reference codes, printable and downloadable directly from the application.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>Right to Redress & Fast Dispute Resolution</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Dedicated support triage desk resolving billing and transaction inquiries within a mandatory two-hour target response SLA.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>Right to Fair Contract Terms</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Unfair contract terms prohibited by Section 129 of FCCPA 2018 are null and void. Consumer protections are non-waivable.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                2. Complaint Escalation Hierarchy
              </h3>
              <p>Consumers may escalate unresolved disputes through our three-tier resolution architecture:</p>
              
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <span className="font-bold font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">Tier 1</span>
                  <div>
                    <div className="font-bold text-slate-900">In-App AI Assistant & Customer Support Desk</div>
                    <div className="text-slate-500">Instant triage via 3PLE A Gemini Support Assistant or email to <code>support@3ple-a.ng</code> (SLA: 2 hours).</div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <span className="font-bold font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">Tier 2</span>
                  <div>
                    <div className="font-bold text-slate-900">Legal & Regulatory Compliance Directorate</div>
                    <div className="text-slate-500">Formal escalation to <code>compliance@3ple-a.ng</code> or physical visit to Karkasara Road, Tarauni Kano HQ (SLA: 24–48 hours).</div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <span className="font-bold font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">Tier 3</span>
                  <div>
                    <div className="font-bold text-slate-900">Statutory Regulatory Bodies</div>
                    <div className="text-slate-500">
                      If unresolved within 14 business days, consumers may petition the <strong>Federal Competition and Consumer Protection Commission (FCCPC)</strong> at <code>contact@fccpc.gov.ng</code> or the <strong>Central Bank of Nigeria Consumer Protection Department (CPD)</strong> at <code>cpd@cbn.gov.ng</code>.
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </article>
        )}

        {/* Corporate Legal Footer Sign-off */}
        <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-emerald-700" />
            <span>Karkasara Road, Tarauni, Kano State, Nigeria</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="text-emerald-700 font-semibold hover:underline flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t.downloadLegal}</span>
            </button>
            <span>•</span>
            <span className="font-mono text-slate-400">RC 3A-NG-2026</span>
          </div>
        </div>

      </div>
    </div>
  );
};
