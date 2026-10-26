import React, { useState, useEffect } from 'react';
import { User, WalletInfo, FlightRoute, FlightBooking, Transaction, Language } from '../types';
import { translations } from '../i18n/translations';
import { Plane, Calendar, UserCheck, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, Loader2, Luggage, Clock, QrCode } from 'lucide-react';

interface FlightsViewProps {
  currentUser: User | null;
  wallet: WalletInfo | null;
  language: Language;
  onSuccessTransaction: (txn: Transaction, newBalance: number) => void;
  onOpenFundWallet: () => void;
}

export const FlightsView: React.FC<FlightsViewProps> = ({
  currentUser,
  wallet,
  language,
  onSuccessTransaction,
  onOpenFundWallet
}) => {
  const t = translations[language];

  const [origin, setOrigin] = useState<string>('KAN');
  const [destination, setDestination] = useState<string>('LOS');
  const [tripType, setTripType] = useState<'ONE_WAY' | 'ROUND_TRIP'>('ONE_WAY');
  const [departureDate, setDepartureDate] = useState<string>('2026-11-05');
  const [cabinClass, setCabinClass] = useState<string>('ALL');

  const [flights, setFlights] = useState<FlightRoute[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [selectedFlight, setSelectedFlight] = useState<FlightRoute | null>(null);

  // Booking Modal
  const [showBookingModal, setShowBookingModal] = useState<boolean>(false);
  const [passengerTitle, setPassengerTitle] = useState<string>('Mr');
  const [firstName, setFirstName] = useState<string>('Amina');
  const [lastName, setLastName] = useState<string>('Bello');
  const [gender, setGender] = useState<string>('Female');
  const [ninOrPassport, setNinOrPassport] = useState<string>('NIN-89102948190');
  const [contactEmail, setContactEmail] = useState<string>('amina.bello@gmail.com');
  const [contactPhone, setContactPhone] = useState<string>('08021234567');

  const [issuedTicket, setIssuedTicket] = useState<FlightBooking | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const airports = [
    { code: 'KAN', name: 'Mallam Aminu Kano Intl (KAN)', city: 'Kano' },
    { code: 'LOS', name: 'Murtala Muhammed Intl (LOS)', city: 'Lagos' },
    { code: 'ABV', name: 'Nnamdi Azikiwe Intl (ABV)', city: 'Abuja' },
    { code: 'PHC', name: 'Port Harcourt Intl (PHC)', city: 'Port Harcourt' },
  ];

  const searchFlights = () => {
    setIsSearching(true);
    fetch(`/api/v1/flights/search?origin=${origin}&destination=${destination}&cabinClass=${cabinClass}&tripType=${tripType}`)
      .then(res => res.json())
      .then(data => {
        setFlights(data.flights || []);
        setIsSearching(false);
      })
      .catch(err => {
        console.error(err);
        setIsSearching(false);
      });
  };

  useEffect(() => {
    searchFlights();
  }, [origin, destination, cabinClass, tripType]);

  const handleSelectFlight = (flight: FlightRoute) => {
    setSelectedFlight(flight);
    setShowBookingModal(true);
  };

  const handleBookFlight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFlight) return;
    setError(null);
    setSuccess(null);

    const fee = Math.round(selectedFlight.price * 0.02);
    const total = selectedFlight.price + fee;

    if (!wallet || wallet.balance < total) {
      setError(`Insufficient wallet balance. Flight fare + taxes is ₦${total.toLocaleString()}. Please fund your wallet.`);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/flights/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id || 'usr_customer_1',
          flightId: selectedFlight.id,
          departureDate,
          passengers: [
            {
              title: passengerTitle,
              firstName,
              lastName,
              gender,
              dob: '1995-06-14',
              ninOrPassport
            }
          ],
          contactEmail,
          contactPhone
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Flight booking failed.');

      setSuccess(data.message);
      setIssuedTicket(data.booking);
      setShowBookingModal(false);
      onSuccessTransaction(data.transaction, data.newBalance);
      searchFlights(); // Refresh seat count
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Travel Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-12 items-center">
          <div className="md:col-span-7 p-6 sm:p-10 space-y-3 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-medium">
              <Plane className="w-3.5 h-3.5" />
              <span>Direct Kano Scheduled Flights & E-Tickets</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              {t.flights}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md">
              Instant domestic and regional flight reservations on Max Air, Air Peace, Ibom Air, and United Nigeria Airlines.
            </p>
          </div>

          <div className="md:col-span-5 relative h-48 md:h-full min-h-[180px]">
            <img
              src="/src/assets/images/travel_flight_skyline_1793020919655.jpg"
              alt="Passenger jet soaring in golden skies"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover opacity-85"
            />
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-slate-900 via-slate-900/40 to-transparent" />
          </div>
        </div>
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

      {/* Issued E-Ticket Banner */}
      {issuedTicket && (
        <div className="p-6 bg-slate-900 text-white rounded-2xl border border-sky-500/40 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="font-bold text-sm text-emerald-400 uppercase tracking-wide">
                E-Ticket Confirmed & Issued
              </span>
            </div>
            <span className="font-mono text-xs text-slate-400">Supplier: MySubWallet Aviation API</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block">Passenger:</span>
              <span className="text-white font-bold text-sm">
                {issuedTicket.passengers[0].firstName} {issuedTicket.passengers[0].lastName}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Airline / Flight:</span>
              <span className="text-white font-bold text-sm">
                {issuedTicket.airline} ({issuedTicket.flightNumber})
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">PNR Reference:</span>
              <span className="text-sky-400 font-mono font-black text-base select-all">
                {issuedTicket.pnr}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">E-Ticket Number:</span>
              <span className="text-slate-200 font-mono text-xs select-all">
                {issuedTicket.ticketNumber}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Search Criteria Bar */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {/* Origin */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.origin}
            </label>
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-600"
            >
              {airports.map(a => (
                <option key={a.code} value={a.code}>{a.name}</option>
              ))}
            </select>
          </div>

          {/* Destination */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.destination}
            </label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-600"
            >
              {airports.filter(a => a.code !== origin).map(a => (
                <option key={a.code} value={a.code}>{a.name}</option>
              ))}
            </select>
          </div>

          {/* Departure Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.departureDate}
            </label>
            <input
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-600"
            />
          </div>

          {/* Cabin Class */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.cabinClass}
            </label>
            <select
              value={cabinClass}
              onChange={(e) => setCabinClass(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-600"
            >
              <option value="ALL">All Classes</option>
              <option value="ECONOMY">Economy</option>
              <option value="ECONOMY_FLEX">Economy Flex</option>
              <option value="BUSINESS">Business Class</option>
            </select>
          </div>
        </div>
      </div>

      {/* Flights Results List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Available Flights ({flights.length})
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            {origin} → {destination} · Departure: {departureDate}
          </span>
        </div>

        {flights.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
            No scheduled flights found matching this route. Try changing origin or destination airport.
          </div>
        ) : (
          flights.map((flight) => (
            <div
              key={flight.id}
              className="p-5 bg-white rounded-xl border border-slate-200 hover:border-sky-500 transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-slate-900">{flight.airline}</span>
                  <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                    {flight.flightNumber}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {flight.cabinClass.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-600">
                  <span className="font-mono font-bold text-slate-900">{flight.departureTime}</span>
                  <div className="flex items-center gap-1 text-slate-400">
                    <span>—</span>
                    <span className="text-[10px]">{flight.duration}</span>
                    <span>→</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">{flight.arrivalTime}</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-500 flex items-center gap-1">
                    <Luggage className="w-3.5 h-3.5" />
                    {flight.baggageAllowance}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-5 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">{t.amount}</span>
                  <span className="text-xl font-black font-mono tabular-nums text-slate-900">
                    ₦{flight.price.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold block">
                    {flight.availableSeats} {t.seatsLeft}
                  </span>
                </div>

                <button
                  onClick={() => handleSelectFlight(flight)}
                  className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg shadow-sm transition-all whitespace-nowrap"
                >
                  {t.bookNow}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Booking Details Modal */}
      {showBookingModal && selectedFlight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Passenger Information & Fare Validation</h3>
                <p className="text-xs text-slate-500">
                  {selectedFlight.airline} {selectedFlight.flightNumber} · {selectedFlight.origin} → {selectedFlight.destination}
                </p>
              </div>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBookFlight} className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Title</label>
                  <select
                    value={passengerTitle}
                    onChange={(e) => setPassengerTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="Mr">Mr</option>
                    <option value="Mrs">Mrs</option>
                    <option value="Miss">Miss</option>
                    <option value="Dr">Dr</option>
                    <option value="Alhaji">Alhaji</option>
                    <option value="Hajiya">Hajiya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">NIN or Passport Number</label>
                  <input
                    type="text"
                    value={ninOrPassport}
                    onChange={(e) => setNinOrPassport(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                    required
                  />
                </div>
              </div>

              {/* Price summary */}
              <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl space-y-1.5 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span>Base Airfare:</span>
                  <span className="font-mono">₦{selectedFlight.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Aviation & Booking Fee (2%):</span>
                  <span className="font-mono">₦{Math.round(selectedFlight.price * 0.02).toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-sky-200 flex justify-between text-sm font-bold text-slate-900">
                  <span>Total Payable:</span>
                  <span className="font-mono text-sky-800">
                    ₦{(selectedFlight.price + Math.round(selectedFlight.price * 0.02)).toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm rounded-xl shadow-md transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Issuing PNR & E-Ticket...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Booking (₦{(selectedFlight.price + Math.round(selectedFlight.price * 0.02)).toLocaleString()})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
