import { Router } from 'express';
import crypto from 'crypto';
import { db, PropertyListing, PropertyInquiry } from '../db.js';

const router = Router();

// Get property listings
router.get('/listings', (req, res) => {
  const { category, transactionType, location, minPrice, maxPrice, status = 'APPROVED' } = req.query;
  let listings = db.getProperties();

  if (status !== 'ALL') {
    listings = listings.filter(p => p.approvalStatus === status);
  }

  if (category && category !== 'ALL') {
    listings = listings.filter(p => p.category === category);
  }

  if (transactionType && transactionType !== 'ALL') {
    listings = listings.filter(p => p.transactionType === transactionType);
  }

  if (location) {
    const loc = (location as string).toLowerCase();
    listings = listings.filter(p => p.location.toLowerCase().includes(loc) || p.address.toLowerCase().includes(loc));
  }

  if (minPrice) {
    const min = parseFloat(minPrice as string);
    if (!isNaN(min)) listings = listings.filter(p => p.price >= min);
  }

  if (maxPrice) {
    const max = parseFloat(maxPrice as string);
    if (!isNaN(max)) listings = listings.filter(p => p.price <= max);
  }

  res.json({
    total: listings.length,
    listings
  });
});

// Single property details
router.get('/listings/:id', (req, res) => {
  const { id } = req.params;
  const prop = db.getProperties().find(p => p.id === id);
  if (!prop) {
    return res.status(404).json({ error: 'Property listing not found.' });
  }
  res.json({ property: prop });
});

// Submit viewing inquiry
router.post('/inquiries', (req, res) => {
  const { propertyId, inquirerName, inquirerEmail, inquirerPhone, preferredViewingDate, message } = req.body;

  if (!propertyId || !inquirerName || !inquirerPhone || !message) {
    return res.status(400).json({ error: 'Name, phone number, and inspection message are required.' });
  }

  const property = db.getProperties().find(p => p.id === propertyId);
  if (!property) return res.status(404).json({ error: 'Property not found.' });

  const inquiry: PropertyInquiry = {
    id: `inq_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
    propertyId,
    propertyTitle: property.title,
    inquirerName,
    inquirerEmail: inquirerEmail || '',
    inquirerPhone,
    preferredViewingDate,
    message,
    status: 'NEW',
    createdAt: new Date().toISOString()
  };

  db.addPropertyInquiry(inquiry);

  db.addAuditLog({
    actorId: 'public_lead',
    actorName: inquirerName,
    action: 'PROPERTY_INQUIRY',
    resource: 'Estate Module',
    details: `New inquiry submitted for property "${property.title}" by ${inquirerName} (${inquirerPhone}).`,
  });

  res.status(201).json({
    success: true,
    message: 'Inspection request received! A licensed 3PLE A representative will contact you within 2 business hours.',
    inquiry
  });
});

// Create property listing (by Estate Agent or Seller)
router.post('/listings', (req, res) => {
  const {
    userId = 'usr_agent_estate',
    title,
    category,
    transactionType,
    location,
    address,
    city = 'Kano',
    state = 'Kano State',
    price,
    period = 'outright',
    bedrooms,
    bathrooms,
    sizeSqm,
    description,
    features = [],
    images = []
  } = req.body;

  if (!title || !category || !location || !price || !description) {
    return res.status(400).json({ error: 'Title, category, location, price, and description are required.' });
  }

  const user = db.getUserById(userId);
  const now = new Date().toISOString();
  const propId = `prop_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

  const defaultImg = category === 'DUPLEX'
    ? '/src/assets/images/property_luxury_villa_1793020919834.jpg'
    : '/src/assets/images/property_modern_apartment_1793020920236.jpg';

  const newProperty: PropertyListing = {
    id: propId,
    title,
    category,
    transactionType,
    location,
    address: address || `${location}, Kano`,
    city,
    state,
    price: parseFloat(price),
    period,
    bedrooms: bedrooms ? parseInt(bedrooms, 10) : undefined,
    bathrooms: bathrooms ? parseInt(bathrooms, 10) : undefined,
    sizeSqm: sizeSqm ? parseFloat(sizeSqm) : undefined,
    description,
    features: Array.isArray(features) ? features : [features],
    images: images.length > 0 ? images : [defaultImg],
    agentName: user ? user.fullName : 'Licensed Estate Broker',
    agentPhone: user ? user.phone : '+2348065554321',
    agentId: userId,
    isVerified: user?.role === 'admin' || user?.role === 'superadmin',
    approvalStatus: (user?.role === 'admin' || user?.role === 'superadmin') ? 'APPROVED' : 'APPROVED', // For active demo testing
    createdAt: now,
  };

  db.addProperty(newProperty);

  db.addAuditLog({
    actorId: userId,
    actorName: user?.fullName || 'Agent',
    action: 'PROPERTY_LISTED',
    resource: 'Estate Module',
    details: `Property "${title}" listed in ${location} for ₦${parseFloat(price).toLocaleString()}. Status: APPROVED.`,
  });

  res.status(201).json({
    success: true,
    message: 'Property listing published successfully!',
    property: newProperty
  });
});

export default router;
