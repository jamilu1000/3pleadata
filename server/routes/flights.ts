import { Router } from 'express';
import crypto from 'crypto';
import { db, FlightBooking, Transaction } from '../db.js';

const router = Router();

// Search flights
router.get('/search', (req, res) => {
  const { origin, destination, cabinClass, tripType } = req.query;
  let flights = db.getFlights();

  if (origin) {
    const origStr = (origin as string).toUpperCase();
    flights = flights.filter(f => f.origin.toUpperCase().includes(origStr));
  }

  if (destination) {
    const destStr = (destination as string).toUpperCase();
    flights = flights.filter(f => f.destination.toUpperCase().includes(destStr));
  }

  if (cabinClass && cabinClass !== 'ALL') {
    flights = flights.filter(f => f.cabinClass === cabinClass);
  }

  res.json({
    count: flights.length,
    flights,
    tripType: tripType || 'ONE_WAY'
  });
});

// Revalidate fare
router.post('/revalidate', (req, res) => {
  const { flightId, passengersCount = 1 } = req.body;
  const flight = db.getFlights().find(f => f.id === flightId);

  if (!flight) {
    return res.status(404).json({ error: 'Selected flight itinerary no longer available.' });
  }

  const count = parseInt(passengersCount, 10) || 1;
  const baseFare = flight.price * count;
  const taxesAndNcaaCharges = Math.round(baseFare * 0.05); // 5% NCAA & terminal charges
  const totalAmount = baseFare + taxesAndNcaaCharges;

  res.json({
    flight,
    passengersCount: count,
    baseFare,
    taxesAndNcaaCharges,
    totalAmount,
    priceGuaranteedUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 mins lock
    isAvailable: flight.availableSeats >= count
  });
});

// Book flight & issue e-ticket
router.post('/book', (req, res) => {
  const { userId = 'usr_customer_1', flightId, departureDate, passengers, contactEmail, contactPhone } = req.body;

  if (!flightId || !passengers || !Array.isArray(passengers) || passengers.length === 0) {
    return res.status(400).json({ error: 'Flight and passenger details are required.' });
  }

  const flight = db.getFlights().find(f => f.id === flightId);
  if (!flight) return res.status(404).json({ error: 'Flight itinerary not found.' });

  const user = db.getUserById(userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const wallet = db.getWalletByUserId(userId);
  if (!wallet) return res.status(404).json({ error: 'Wallet not found.' });

  const passengersCount = passengers.length;
  const baseFare = flight.price * passengersCount;
  const fee = Math.round(baseFare * 0.02); // 2% booking service fee
  const totalCost = baseFare + fee;

  if (wallet.balance < totalCost) {
    return res.status(400).json({
      error: `Insufficient wallet balance. Total cost: ₦${totalCost.toLocaleString()}, Available balance: ₦${wallet.balance.toLocaleString()}`
    });
  }

  const bookingReference = `3PA-FLY-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  const pnr = `${flight.airlineCode}${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const ticketNumber = `074-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
  const now = new Date().toISOString();

  // Double-entry ledger: Debit customer, credit provider escrow
  const ledgerResult = db.executeDoubleEntryTransaction({
    reference: bookingReference,
    description: `${flight.airline} ${flight.flightNumber} booking (${flight.origin} -> ${flight.destination})`,
    entries: [
      { accountId: wallet.id, userId, type: 'DEBIT', amount: totalCost },
      { accountId: 'wlt_sys_escrow', type: 'CREDIT', amount: totalCost }
    ]
  });

  if (!ledgerResult.success) {
    return res.status(500).json({ error: ledgerResult.error });
  }

  const booking: FlightBooking = {
    id: `bk_${Date.now()}`,
    bookingReference,
    pnr,
    userId,
    flightId: flight.id,
    airline: flight.airline,
    flightNumber: flight.flightNumber,
    route: `${flight.origin} → ${flight.destination}`,
    departureDate: departureDate || '2026-11-05',
    passengers,
    cabinClass: flight.cabinClass,
    amount: baseFare,
    fee,
    status: 'TICKETED',
    ticketNumber,
    createdAt: now,
  };

  db.addFlightBooking(booking);

  // Decrement available seats
  flight.availableSeats = Math.max(0, flight.availableSeats - passengersCount);

  // Record transaction
  const txn: Transaction = {
    id: `txn_${Date.now()}`,
    reference: bookingReference,
    userId,
    userName: user.fullName,
    serviceType: 'FLIGHT',
    providerId: 'prov_mysubwallet',
    providerName: 'MySubWallet Travel & Aviation',
    amount: baseFare,
    fee,
    discount: 0,
    netAmount: totalCost,
    status: 'SUCCESSFUL',
    metadata: {
      pnr,
      ticketNumber,
      airline: flight.airline,
      flightNumber: flight.flightNumber,
      route: `${flight.origin} to ${flight.destination}`,
      departureDate: departureDate || '2026-11-05',
      departureTime: flight.departureTime,
      passengersCount,
      passengers,
      contactEmail,
      contactPhone
    },
    providerReference: `msw_pnr_${pnr}`,
    createdAt: now,
    updatedAt: now,
  };

  db.addTransaction(txn);

  db.addAuditLog({
    actorId: userId,
    actorName: user.fullName,
    action: 'FLIGHT_BOOKED',
    resource: 'Travel Module',
    details: `Issued e-ticket ${ticketNumber} with PNR ${pnr} on ${flight.airline} flight ${flight.flightNumber}. Total: ₦${totalCost.toLocaleString()}`,
  });

  res.json({
    success: true,
    message: `Flight successfully ticketed! E-Ticket Number: ${ticketNumber}, PNR: ${pnr}`,
    booking,
    transaction: txn,
    newBalance: wallet.balance
  });
});

// Get user bookings
router.get('/bookings', (req, res) => {
  const userId = req.query.userId as string;
  let bookings = db.getFlightBookings();
  if (userId) {
    bookings = bookings.filter(b => b.userId === userId);
  }
  res.json({ bookings });
});

export default router;
