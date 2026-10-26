import React, { useState, useEffect } from 'react';
import { User, PropertyListing, Language } from '../types';
import { translations } from '../i18n/translations';
import { Building2, Home, MapPin, Bed, Bath, Maximize2, ShieldCheck, CheckCircle2, AlertCircle, Phone, Mail, Calendar, ArrowRight, Plus, Loader2 } from 'lucide-react';

interface EstatesViewProps {
  currentUser: User | null;
  language: Language;
}

export const EstatesView: React.FC<EstatesViewProps> = ({
  currentUser,
  language
}) => {
  const t = translations[language];

  const [listings, setListings] = useState<PropertyListing[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [txTypeFilter, setTxTypeFilter] = useState<string>('ALL');
  const [searchLocation, setSearchLocation] = useState<string>('');
  const [selectedProperty, setSelectedProperty] = useState<PropertyListing | null>(null);

  // Inquiry form modal
  const [showInquiryModal, setShowInquiryModal] = useState<boolean>(false);
  const [inquirerName, setInquirerName] = useState<string>(currentUser?.fullName || 'Amina Bello');
  const [inquirerEmail, setInquirerEmail] = useState<string>(currentUser?.email || 'amina.bello@gmail.com');
  const [inquirerPhone, setInquirerPhone] = useState<string>(currentUser?.phone || '+2348021234567');
  const [viewingDate, setViewingDate] = useState<string>('2026-11-02');
  const [message, setMessage] = useState<string>('I would like to arrange an official inspection viewing for this property.');

  // List Property Modal (for Agents / Resellers)
  const [showListModal, setShowListModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCategory, setNewCategory] = useState<PropertyListing['category']>('DUPLEX');
  const [newTxType, setNewTxType] = useState<PropertyListing['transactionType']>('SALE');
  const [newLocation, setNewLocation] = useState<string>('Tarauni GRA, Kano');
  const [newPrice, setNewPrice] = useState<string>('85000000');
  const [newBedrooms, setNewBedrooms] = useState<string>('4');
  const [newBathrooms, setNewBathrooms] = useState<string>('5');
  const [newDescription, setNewDescription] = useState<string>('Newly built executive property with C of O title, modern borehole, and serene neighborhood in Kano.');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchListings = () => {
    let url = `/api/v1/estates/listings?status=APPROVED`;
    if (categoryFilter !== 'ALL') url += `&category=${categoryFilter}`;
    if (txTypeFilter !== 'ALL') url += `&transactionType=${txTypeFilter}`;
    if (searchLocation) url += `&location=${encodeURIComponent(searchLocation)}`;

    fetch(url)
      .then(res => res.json())
      .then(data => setListings(data.listings || []))
      .catch(console.error);
  };

  useEffect(() => {
    fetchListings();
  }, [categoryFilter, txTypeFilter, searchLocation]);

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty) return;
    setIsLoading(true);

    try {
      const res = await fetch('/api/v1/estates/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: selectedProperty.id,
          inquirerName,
          inquirerEmail,
          inquirerPhone,
          preferredViewingDate: viewingDate,
          message
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit inspection request.');

      setStatusMessage(data.message);
      setShowInquiryModal(false);
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/v1/estates/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id || 'usr_agent_estate',
          title: newTitle,
          category: newCategory,
          transactionType: newTxType,
          location: newLocation,
          price: newPrice,
          bedrooms: newBedrooms,
          bathrooms: newBathrooms,
          description: newDescription
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to list property.');

      setStatusMessage('Property submitted and approved!');
      setShowListModal(false);
      fetchListings();
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-teal-700" />
            <span>{t.propertyMarketplace}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Verified luxury duplexes, serviced apartments, lands, and commercial plazas across Tarauni, Nassarawa & Kano Central
          </p>
        </div>

        <button
          onClick={() => setShowListModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-lg shadow-sm transition-all whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t.submitListing}</span>
        </button>
      </div>

      {statusMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Category buttons */}
        <div className="flex flex-wrap gap-1.5 text-xs w-full md:w-auto">
          {[
            { id: 'ALL', label: t.allCategories },
            { id: 'DUPLEX', label: t.duplex },
            { id: 'FLAT_APARTMENT', label: t.apartment },
            { id: 'COMMERCIAL', label: t.commercial },
            { id: 'LAND_PLOT', label: t.land },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                categoryFilter === cat.id
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Transaction Type & Search */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={txTypeFilter}
            onChange={(e) => setTxTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Types</option>
            <option value="SALE">{t.forSale}</option>
            <option value="RENT">{t.forRent}</option>
          </select>

          <input
            type="text"
            value={searchLocation}
            onChange={(e) => setSearchLocation(e.target.value)}
            placeholder="Search Tarauni, Bompai, BUK..."
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-600 w-full sm:w-48"
          />
        </div>
      </div>

      {/* Property Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((prop) => (
          <div
            key={prop.id}
            className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
          >
            {/* Image Container with Scrim and Verified Badge */}
            <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
              <img
                src={prop.images[0] || '/src/assets/images/property_luxury_villa_1793020919834.jpg'}
                alt={prop.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-slate-900/80 text-white backdrop-blur">
                  {prop.transactionType}
                </span>
                {prop.isVerified && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-700/90 text-white backdrop-blur">
                    <ShieldCheck className="w-3 h-3" />
                    Verified Title
                  </span>
                )}
              </div>
            </div>

            {/* Content Details */}
            <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold text-teal-700 uppercase tracking-wider">
                  {prop.category.replace('_', ' ')}
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1 line-clamp-2 leading-snug group-hover:text-teal-700 transition-colors">
                  {prop.title}
                </h3>
                <div className="flex items-center gap-1 text-xs text-slate-500 mt-1.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">{prop.location}</span>
                </div>
              </div>

              {/* Specs & Features */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center gap-4 text-xs text-slate-600">
                  {prop.bedrooms && (
                    <span className="flex items-center gap-1">
                      <Bed className="w-3.5 h-3.5 text-slate-400" />
                      <strong>{prop.bedrooms}</strong> {t.bedrooms}
                    </span>
                  )}
                  {prop.bathrooms && (
                    <span className="flex items-center gap-1">
                      <Bath className="w-3.5 h-3.5 text-slate-400" />
                      <strong>{prop.bathrooms}</strong> {t.bathrooms}
                    </span>
                  )}
                  {prop.sizeSqm && (
                    <span className="flex items-center gap-1">
                      <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                      <strong>{prop.sizeSqm}</strong> sqm
                    </span>
                  )}
                </div>

                <div className="flex items-baseline justify-between pt-2">
                  <div className="text-lg font-black font-mono tabular-nums text-slate-900">
                    ₦{prop.price.toLocaleString()}
                    {prop.period === 'yearly' && <span className="text-xs font-normal text-slate-500"> /year</span>}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedProperty(prop);
                      setShowInquiryModal(true);
                    }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-teal-700 text-white font-bold text-xs rounded-lg transition-colors"
                  >
                    {t.scheduleInspection}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Inquiry Form Modal */}
      {showInquiryModal && selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{t.scheduleInspection}</h3>
                <p className="text-xs text-slate-500 truncate max-w-sm">{selectedProperty.title}</p>
              </div>
              <button
                onClick={() => setShowInquiryModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInquirySubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Your Full Name</label>
                  <input
                    type="text"
                    value={inquirerName}
                    onChange={(e) => setInquirerName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={inquirerPhone}
                    onChange={(e) => setInquirerPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Inspection Date</label>
                <input
                  type="date"
                  value={viewingDate}
                  onChange={(e) => setViewingDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Message for Broker</label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs space-y-1">
                <div className="font-bold text-teal-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>Licensed 3PLE A Property Agent</span>
                </div>
                <div className="text-slate-600">
                  Broker: {selectedProperty.agentName} · Tel: {selectedProperty.agentPhone}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm rounded-xl shadow-md transition-all disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Book Inspection Appointment</span>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* List Property Modal */}
      {showListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">{t.submitListing}</h3>
              <button
                onClick={() => setShowListModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateListing} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Property Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Modern 4-Bedroom Semi-Detached Duplex"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="DUPLEX">Luxury Duplex</option>
                    <option value="FLAT_APARTMENT">Flat / Apartment</option>
                    <option value="COMMERCIAL">Commercial Plaza</option>
                    <option value="LAND_PLOT">Land / Plot</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Transaction</label>
                  <select
                    value={newTxType}
                    onChange={(e) => setNewTxType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="SALE">For Sale</option>
                    <option value="RENT">For Rent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Location / Neighborhood</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="e.g. Tarauni GRA, Kano"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Price (NGN ₦)</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bedrooms</label>
                  <input
                    type="number"
                    value={newBedrooms}
                    onChange={(e) => setNewBedrooms(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bathrooms</label>
                  <input
                    type="number"
                    value={newBathrooms}
                    onChange={(e) => setNewBathrooms(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description & Key Features</label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm rounded-xl shadow-md transition-all disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Publish Property Listing</span>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
