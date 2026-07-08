/**
 * Vercel Serverless Function - RentEase API
 * Handles all /api/* routes with full admin support.
 */

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ---- Schemas ----
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true, select: false },
  phone: String,
  address: { street: String, city: String, state: String, zipCode: String },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
userSchema.methods.matchPassword = function(entered) {
  return bcrypt.compare(entered, this.password);
};

const tenureOptionSchema = new mongoose.Schema({
  months: { type: Number, required: true, enum: [3, 6, 12] },
  monthlyRent: { type: Number, required: true },
  discount: { type: Number, default: 0 },
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  category: String,
  subcategory: String,
  image: String,
  images: [String],
  brand: String,
  condition: String,
  deposit: Number,
  tenureOptions: [tenureOptionSchema],
  features: [String],
  availability: { type: Boolean, default: true },
  quantity: { type: Number, default: 1 },
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
}, { timestamps: true });

const ticketSchema = new mongoose.Schema({
  issue: String,
  description: String,
  status: { type: String, default: 'Open' },
  raisedAt: { type: Date, default: Date.now },
  resolvedAt: Date,
  adminNotes: String,
}, { _id: true });

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  tenure: { months: Number, monthlyRent: Number },
  totalRent: Number,
  deposit: Number,
  startDate: Date,
  endDate: Date,
  deliveryAddress: { street: String, city: String, state: String, zipCode: String },
  deliverySlot: { date: Date, timeSlot: String },
  status: { type: String, default: 'Confirmed' },
  paymentStatus: { type: String, default: 'Pending' },
  paymentMethod: { type: String, default: 'Cash on Delivery' },
  maintenanceTickets: [ticketSchema],
  notes: String,
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

// ---- Helpers ----
function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'rentease_secret', { expiresIn: '30d' });
}

async function auth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'rentease_secret');
    return await User.findById(decoded.id);
  } catch { return null; }
}

async function connectDb() {
  if (mongoose.connection.readyState >= 1) return;
  if (!process.env.MONGO_URI) return;
  await mongoose.connect(process.env.MONGO_URI);
}

// ---- Express App ----
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ============ AUTH ============
app.post('/api/auth/register', async (req, res) => {
  try {
    await connectDb();
    const { name, email, password, phone } = req.body;
    if (await User.findOne({ email })) return res.status(400).json({ message: 'User exists' });
    const u = await User.create({ name, email, password, phone });
    const token = signToken(u._id);
    res.status(201).json({ _id: u._id, name: u.name, email: u.email, role: u.role, phone: u.phone, token });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    await connectDb();
    const { email, password } = req.body;
    const u = await User.findOne({ email }).select('+password');
    if (!u || !(await u.matchPassword(password))) return res.status(401).json({ message: 'Invalid credentials' });
    const token = signToken(u._id);
    res.json({ _id: u._id, name: u.name, email: u.email, role: u.role, phone: u.phone, token });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get('/api/auth/me', async (req, res) => {
  const user = await auth(req);
  if (!user) return res.status(401).json({ message: 'Auth required' });
  res.json(user);
});

// ============ PRODUCTS ============
app.get('/api/products', async (req, res) => {
  try {
    await connectDb();
    const { category, search, sort } = req.query;
    const filter = {};
    if (category && category !== 'All') filter.category = category;
    if (search) filter.name = { $regex: search, $options: 'i' };
    let sortO = { createdAt: -1 };
    if (sort === 'price_low') sortO = { 'tenureOptions.0.monthlyRent': 1 };
    if (sort === 'price_high') sortO = { 'tenureOptions.0.monthlyRent': -1 };
    if (sort === 'rating') sortO = { rating: -1 };
    const products = await Product.find(filter).sort(sortO);
    res.json({ count: products.length, products });
  } catch (e) { res.status(500).json({ message: e.message, products: [] }); }
});

app.get('/api/products/categories', async (req, res) => {
  await connectDb();
  const cats = await Product.distinct('category');
  res.json(cats);
});

app.get('/api/products/:id', async (req, res) => {
  try {
    await connectDb();
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Not found' });
    res.json(p);
  } catch (e) { res.status(404).json({ message: 'Not found' }); }
});

// ADD PRODUCT (Admin)
app.post('/api/products', async (req, res) => {
  try {
    await connectDb();
    const user = await auth(req);
    if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// UPDATE PRODUCT (Admin)
app.put('/api/products/:id', async (req, res) => {
  try {
    await connectDb();
    const user = await auth(req);
    if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: 'Not found' });
    res.json(product);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// DELETE PRODUCT (Admin)
app.delete('/api/products/:id', async (req, res) => {
  try {
    await connectDb();
    const user = await auth(req);
    if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product removed' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// SEED PRODUCTS
app.post('/api/products/seed', async (req, res) => {
  try {
    await connectDb();
    const count = await Product.countDocuments();
    if (count > 0) return res.json({ message: 'Already seeded', count });

    const sample = [
      { name: 'Modern L-Shaped Sofa', description: 'Premium L-shaped sectional sofa with velvet upholstery and high-density foam.', category: 'Living Room', subcategory: 'Sofa', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800', brand: 'ComfortPlus', condition: 'New', deposit: 2500, tenureOptions: [{ months: 3, monthlyRent: 1800, discount: 0 }, { months: 6, monthlyRent: 1500, discount: 17 }, { months: 12, monthlyRent: 1200, discount: 33 }], features: ['L-Shaped', 'Velvet', 'Removable Covers'], quantity: 5, rating: 4.7, numReviews: 23 },
      { name: 'Queen Size Bed with Storage', description: 'Elegant queen-size bed with hydraulic storage and memory foam mattress.', category: 'Bedroom', subcategory: 'Bed', image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800', brand: 'WoodCraft', condition: 'New', deposit: 3000, tenureOptions: [{ months: 3, monthlyRent: 2200, discount: 0 }, { months: 6, monthlyRent: 1800, discount: 18 }, { months: 12, monthlyRent: 1400, discount: 36 }], features: ['Hydraulic Storage', 'Sheesham Wood'], quantity: 3, rating: 4.8, numReviews: 45 },
      { name: 'Double Door Refrigerator 340L', description: 'Energy-efficient frost-free refrigerator with digital inverter.', category: 'Appliances', subcategory: 'Refrigerator', image: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800', brand: 'CoolTech', condition: 'New', deposit: 2000, tenureOptions: [{ months: 3, monthlyRent: 1500, discount: 0 }, { months: 6, monthlyRent: 1200, discount: 20 }, { months: 12, monthlyRent: 900, discount: 40 }], features: ['Frost-Free', 'Inverter'], quantity: 8, rating: 4.5, numReviews: 67 },
      { name: 'Ergonomic Office Chair', description: 'Professional ergonomic chair with lumbar support and mesh back.', category: 'Office', subcategory: 'Chair', image: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800', brand: 'ErgoMax', condition: 'Like New', deposit: 1500, tenureOptions: [{ months: 3, monthlyRent: 900, discount: 0 }, { months: 6, monthlyRent: 700, discount: 22 }, { months: 12, monthlyRent: 500, discount: 44 }], features: ['Lumbar Support', 'Mesh Back'], quantity: 12, rating: 4.6, numReviews: 89 },
      { name: '55" 4K Smart LED TV', description: '55-inch 4K Ultra HD Smart TV with Dolby Vision and Google TV.', category: 'Electronics', subcategory: 'Television', image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800', brand: 'VisionMax', condition: 'New', deposit: 3500, tenureOptions: [{ months: 3, monthlyRent: 2500, discount: 0 }, { months: 6, monthlyRent: 2000, discount: 20 }, { months: 12, monthlyRent: 1600, discount: 36 }], features: ['4K UHD', 'Google TV'], quantity: 6, rating: 4.9, numReviews: 112 },
      { name: 'Front Load Washing Machine 7kg', description: 'Front-load washing machine with 1200 RPM and steam wash.', category: 'Appliances', subcategory: 'Washing Machine', image: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800', brand: 'CleanPro', condition: 'New', deposit: 2000, tenureOptions: [{ months: 3, monthlyRent: 1400, discount: 0 }, { months: 6, monthlyRent: 1100, discount: 21 }, { months: 12, monthlyRent: 850, discount: 39 }], features: ['1200 RPM', 'Steam Wash'], quantity: 7, rating: 4.4, numReviews: 56 },
      { name: '6-Seater Dining Table Set', description: '6-seater dining table in premium mango wood with upholstered chairs.', category: 'Kitchen', subcategory: 'Dining Table', image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800', brand: 'DineWell', condition: 'New', deposit: 3000, tenureOptions: [{ months: 3, monthlyRent: 2000, discount: 0 }, { months: 6, monthlyRent: 1600, discount: 20 }, { months: 12, monthlyRent: 1200, discount: 40 }], features: ['Mango Wood', '6 Chairs'], quantity: 4, rating: 4.7, numReviews: 34 },
      { name: 'Split Air Conditioner 1.5 Ton', description: '5-star inverter split AC with copper condenser and free installation.', category: 'Appliances', subcategory: 'Air Conditioner', image: 'https://images.unsplash.com/photo-1631545806609-3c480b4c1e7b?w=800', brand: 'ArcticAir', condition: 'New', deposit: 2500, tenureOptions: [{ months: 3, monthlyRent: 1800, discount: 0 }, { months: 6, monthlyRent: 1400, discount: 22 }, { months: 12, monthlyRent: 1100, discount: 39 }], features: ['5-Star', 'Inverter'], quantity: 10, rating: 4.6, numReviews: 78 },
      { name: 'Study Desk with Bookshelf', description: 'Compact study desk with built-in bookshelf and drawer storage.', category: 'Office', subcategory: 'Desk', image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800', brand: 'StudyPro', condition: 'New', deposit: 1200, tenureOptions: [{ months: 3, monthlyRent: 700, discount: 0 }, { months: 6, monthlyRent: 550, discount: 21 }, { months: 12, monthlyRent: 400, discount: 43 }], features: ['Bookshelf', 'Drawer'], quantity: 9, rating: 4.3, numReviews: 41 },
      { name: 'King Size Wardrobe', description: '6-door wardrobe with full-length mirror and soft-close hinges.', category: 'Bedroom', subcategory: 'Wardrobe', image: 'https://images.unsplash.com/photo-1558997519-83ea9252edf8?w=800', brand: 'StorageKing', condition: 'New', deposit: 2800, tenureOptions: [{ months: 3, monthlyRent: 1900, discount: 0 }, { months: 6, monthlyRent: 1500, discount: 21 }, { months: 12, monthlyRent: 1100, discount: 42 }], features: ['6-Door', 'Mirror'], quantity: 3, rating: 4.5, numReviews: 29 },
      { name: 'Garden Patio Set', description: 'Weather-resistant 4-piece outdoor furniture set with washable cushions.', category: 'Outdoor', subcategory: 'Patio Furniture', image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800', brand: 'OutdoorLiving', condition: 'New', deposit: 2200, tenureOptions: [{ months: 3, monthlyRent: 1600, discount: 0 }, { months: 6, monthlyRent: 1300, discount: 19 }, { months: 12, monthlyRent: 1000, discount: 38 }], features: ['Weather-Resistant', 'Steel Frame'], quantity: 4, rating: 4.4, numReviews: 18 },
      { name: 'Microwave Oven 30L', description: 'Convection microwave oven with grill function and auto-cook menus.', category: 'Appliances', subcategory: 'Microwave', image: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=800', brand: 'QuickHeat', condition: 'Like New', deposit: 800, tenureOptions: [{ months: 3, monthlyRent: 500, discount: 0 }, { months: 6, monthlyRent: 400, discount: 20 }, { months: 12, monthlyRent: 300, discount: 40 }], features: ['Convection', 'Grill'], quantity: 15, rating: 4.3, numReviews: 95 },
    ];
    await Product.insertMany(sample);
    res.status(201).json({ message: 'Seeded', count: sample.length });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ============ ORDERS ============
app.post('/api/orders', async (req, res) => {
  try {
    await connectDb();
    const user = await auth(req);
    if (!user) return res.status(401).json({ message: 'Auth required' });
    const { productId, tenureMonths, deliveryAddress, deliverySlot, notes, paymentMethod } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    const to = product.tenureOptions.find(t => t.months === parseInt(tenureMonths));
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + to.months);
    const order = await Order.create({
      user: user._id, product: productId,
      tenure: { months: to.months, monthlyRent: to.monthlyRent },
      totalRent: to.monthlyRent * to.months, deposit: product.deposit,
      startDate, endDate, deliveryAddress, deliverySlot, notes,
      paymentMethod: paymentMethod || 'Cash on Delivery', status: 'Pending',
    });
    if (product.quantity > 0) {
      product.quantity -= 1;
      if (product.quantity === 0) product.availability = false;
      await product.save();
    }
    const populated = await Order.findById(order._id).populate('product').populate('user', 'name email');
    res.status(201).json(populated);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get('/api/orders/my-orders', async (req, res) => {
  try {
    await connectDb();
    const user = await auth(req);
    if (!user) return res.status(401).json({ message: 'Auth required' });
    const orders = await Order.find({ user: user._id }).populate('product').sort({ createdAt: -1 });
    res.json({ count: orders.length, orders });
  } catch (e) { res.json({ count: 0, orders: [] }); }
});

app.get('/api/orders', async (req, res) => {
  try {
    await connectDb();
    const user = await auth(req);
    if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
    const { status } = req.query;
    const filter = status ? { status } : {};
    const orders = await Order.find(filter).populate('product').populate('user', 'name email').sort({ createdAt: -1 });
    res.json({ count: orders.length, orders });
  } catch (e) { res.json({ count: 0, orders: [] }); }
});

app.put('/api/orders/:id/status', async (req, res) => {
  try {
    await connectDb();
    const user = await auth(req);
    if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
    const order = await Order.findById(req.params.id);
    order.status = req.body.status;
    if (req.body.status === 'Returned' || req.body.status === 'Cancelled') {
      const product = await Product.findById(order.product);
      if (product) { product.quantity += 1; product.availability = true; await product.save(); }
    }
    await order.save();
    res.json(order);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.post('/api/orders/:id/maintenance', async (req, res) => {
  try {
    await connectDb();
    const user = await auth(req);
    if (!user) return res.status(401).json({ message: 'Auth required' });
    const order = await Order.findById(req.params.id);
    order.maintenanceTickets.push({ issue: req.body.issue, description: req.body.description });
    await order.save();
    res.json(order);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// 404 for API
app.use('/api/*', (req, res) => res.status(404).json({ message: 'API endpoint not found' }));

module.exports = app;
