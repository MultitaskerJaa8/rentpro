/**
 * RentEase API Client
 * Handles all HTTP requests to the backend server.
 * Set USE_DATABASE = true to use real MongoDB backend.
 * Set USE_DATABASE = false to use offline fallback (demo) data.
 */

// ========================================================
//  MODE SWITCH — yahan control karo
// ========================================================
const USE_DATABASE = true;   // true = real database | false = demo fallback
// ========================================================

const API_BASE = '/api';

// In-memory sample data fallback (used ONLY when USE_DATABASE = false)
const SAMPLE_PRODUCTS = [
  {
    _id: 'p1',
    name: 'Modern L-Shaped Sofa',
    description: 'Premium L-shaped sectional sofa with soft velvet upholstery, high-density foam cushions, and sturdy wooden frame. Perfect for contemporary living rooms. Features removable and washable covers.',
    category: 'Living Room',
    subcategory: 'Sofa',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
    brand: 'ComfortPlus',
    condition: 'New',
    deposit: 2500,
    tenureOptions: [
      { months: 3, monthlyRent: 1800, discount: 0 },
      { months: 6, monthlyRent: 1500, discount: 17 },
      { months: 12, monthlyRent: 1200, discount: 33 },
    ],
    features: ['L-Shaped Design', 'Velvet Upholstery', 'Removable Covers', 'High-Density Foam'],
    quantity: 5,
    availability: true,
    rating: 4.7,
    numReviews: 23,
  },
  {
    _id: 'p2',
    name: 'Queen Size Bed with Storage',
    description: 'Elegant queen-size bed with hydraulic storage, solid sheesham wood construction, and hand-carved detailing. Includes a premium 8-inch memory foam mattress.',
    category: 'Bedroom',
    subcategory: 'Bed',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800',
    brand: 'WoodCraft',
    condition: 'New',
    deposit: 3000,
    tenureOptions: [
      { months: 3, monthlyRent: 2200, discount: 0 },
      { months: 6, monthlyRent: 1800, discount: 18 },
      { months: 12, monthlyRent: 1400, discount: 36 },
    ],
    features: ['Hydraulic Storage', 'Sheesham Wood', 'Memory Foam Mattress Included', 'Hand-Carved'],
    quantity: 3,
    availability: true,
    rating: 4.8,
    numReviews: 45,
  },
  {
    _id: 'p3',
    name: 'Double Door Refrigerator 340L',
    description: 'Energy-efficient double door refrigerator with frost-free technology, digital inverter compressor, and convertible freezer. 3-star energy rating with 10-year warranty on compressor.',
    category: 'Appliances',
    subcategory: 'Refrigerator',
    image: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800',
    brand: 'CoolTech',
    condition: 'New',
    deposit: 2000,
    tenureOptions: [
      { months: 3, monthlyRent: 1500, discount: 0 },
      { months: 6, monthlyRent: 1200, discount: 20 },
      { months: 12, monthlyRent: 900, discount: 40 },
    ],
    features: ['Frost-Free', 'Digital Inverter', 'Convertible Freezer', '3-Star Rating'],
    quantity: 8,
    availability: true,
    rating: 4.5,
    numReviews: 67,
  },
  {
    _id: 'p4',
    name: 'Ergonomic Office Chair',
    description: 'Professional ergonomic office chair with adjustable lumbar support, breathable mesh back, 4D armrests, and synchro-tilt mechanism. Supports up to 150kg with smooth-rolling casters.',
    category: 'Office',
    subcategory: 'Chair',
    image: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800',
    brand: 'ErgoMax',
    condition: 'Like New',
    deposit: 1500,
    tenureOptions: [
      { months: 3, monthlyRent: 900, discount: 0 },
      { months: 6, monthlyRent: 700, discount: 22 },
      { months: 12, monthlyRent: 500, discount: 44 },
    ],
    features: ['Adjustable Lumbar', 'Mesh Back', '4D Armrests', '150kg Capacity'],
    quantity: 12,
    availability: true,
    rating: 4.6,
    numReviews: 89,
  },
  {
    _id: 'p5',
    name: '55" 4K Smart LED TV',
    description: 'Stunning 55-inch 4K Ultra HD Smart TV with Dolby Vision, HDR10+, built-in Chromecast, and 30W Dolby Atmos speakers. Runs on Google TV with access to all major streaming apps.',
    category: 'Electronics',
    subcategory: 'Television',
    image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800',
    brand: 'VisionMax',
    condition: 'New',
    deposit: 3500,
    tenureOptions: [
      { months: 3, monthlyRent: 2500, discount: 0 },
      { months: 6, monthlyRent: 2000, discount: 20 },
      { months: 12, monthlyRent: 1600, discount: 36 },
    ],
    features: ['4K UHD', 'Dolby Vision', 'Google TV', 'Dolby Atmos'],
    quantity: 6,
    availability: true,
    rating: 4.9,
    numReviews: 112,
  },
  {
    _id: 'p6',
    name: 'Front Load Washing Machine 7kg',
    description: 'Advanced front-loading washing machine with 1200 RPM spin speed, inverter motor, steam wash technology, and 15 wash programs. Anti-vibration design for quiet operation.',
    category: 'Appliances',
    subcategory: 'Washing Machine',
    image: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800',
    brand: 'CleanPro',
    condition: 'New',
    deposit: 2000,
    tenureOptions: [
      { months: 3, monthlyRent: 1400, discount: 0 },
      { months: 6, monthlyRent: 1100, discount: 21 },
      { months: 12, monthlyRent: 850, discount: 39 },
    ],
    features: ['1200 RPM', 'Inverter Motor', 'Steam Wash', '15 Programs'],
    quantity: 7,
    availability: true,
    rating: 4.4,
    numReviews: 56,
  },
  {
    _id: 'p7',
    name: '6-Seater Dining Table Set',
    description: 'Elegant 6-seater dining table crafted from premium mango wood with a natural finish. Includes 6 upholstered chairs with comfortable cushioning. Table dimensions: 72" x 36" x 30".',
    category: 'Kitchen',
    subcategory: 'Dining Table',
    image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800',
    brand: 'DineWell',
    condition: 'New',
    deposit: 3000,
    tenureOptions: [
      { months: 3, monthlyRent: 2000, discount: 0 },
      { months: 6, monthlyRent: 1600, discount: 20 },
      { months: 12, monthlyRent: 1200, discount: 40 },
    ],
    features: ['Mango Wood', '6 Upholstered Chairs', 'Natural Finish', 'Sturdy Build'],
    quantity: 4,
    availability: true,
    rating: 4.7,
    numReviews: 34,
  },
  {
    _id: 'p8',
    name: 'Split Air Conditioner 1.5 Ton',
    description: 'Energy-efficient 5-star inverter split AC with copper condenser, anti-dust filter, and dehumidifier mode. Cools rooms up to 180 sq ft. Comes with free installation.',
    category: 'Appliances',
    subcategory: 'Air Conditioner',
    image: 'https://images.unsplash.com/photo-1631545806609-3c480b4c1e7b?w=800',
    brand: 'ArcticAir',
    condition: 'New',
    deposit: 2500,
    tenureOptions: [
      { months: 3, monthlyRent: 1800, discount: 0 },
      { months: 6, monthlyRent: 1400, discount: 22 },
      { months: 12, monthlyRent: 1100, discount: 39 },
    ],
    features: ['5-Star Rating', 'Inverter', 'Copper Condenser', 'Free Installation'],
    quantity: 10,
    availability: true,
    rating: 4.6,
    numReviews: 78,
  },
  {
    _id: 'p9',
    name: 'Study Desk with Bookshelf',
    description: 'Compact and functional study desk with built-in bookshelf, cable management system, and drawer storage. Made from engineered wood with a scratch-resistant melamine finish.',
    category: 'Office',
    subcategory: 'Desk',
    image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800',
    brand: 'StudyPro',
    condition: 'New',
    deposit: 1200,
    tenureOptions: [
      { months: 3, monthlyRent: 700, discount: 0 },
      { months: 6, monthlyRent: 550, discount: 21 },
      { months: 12, monthlyRent: 400, discount: 43 },
    ],
    features: ['Built-in Bookshelf', 'Cable Management', 'Drawer Storage', 'Scratch-Resistant'],
    quantity: 9,
    availability: true,
    rating: 4.3,
    numReviews: 41,
  },
  {
    _id: 'p10',
    name: 'King Size Wardrobe',
    description: 'Spacious 6-door wardrobe with full-length mirror, built-in drawers, and hanging space. Features soft-close hinges and anti-tip wall mount for safety. Available in walnut finish.',
    category: 'Bedroom',
    subcategory: 'Wardrobe',
    image: 'https://images.unsplash.com/photo-1558997519-83ea9252edf8?w=800',
    brand: 'StorageKing',
    condition: 'New',
    deposit: 2800,
    tenureOptions: [
      { months: 3, monthlyRent: 1900, discount: 0 },
      { months: 6, monthlyRent: 1500, discount: 21 },
      { months: 12, monthlyRent: 1100, discount: 42 },
    ],
    features: ['6-Door', 'Full-Length Mirror', 'Soft-Close Hinges', 'Anti-Tip Mount'],
    quantity: 3,
    availability: true,
    rating: 4.5,
    numReviews: 29,
  },
  {
    _id: 'p11',
    name: 'Garden Patio Set',
    description: 'Weather-resistant 4-piece outdoor furniture set including 2-seater sofa, 2 armchairs, and a coffee table. Powder-coated steel frame with all-weather wicker and washable cushions.',
    category: 'Outdoor',
    subcategory: 'Patio Furniture',
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800',
    brand: 'OutdoorLiving',
    condition: 'New',
    deposit: 2200,
    tenureOptions: [
      { months: 3, monthlyRent: 1600, discount: 0 },
      { months: 6, monthlyRent: 1300, discount: 19 },
      { months: 12, monthlyRent: 1000, discount: 38 },
    ],
    features: ['Weather-Resistant', 'All-Weather Wicker', 'Washable Cushions', 'Steel Frame'],
    quantity: 4,
    availability: true,
    rating: 4.4,
    numReviews: 18,
  },
  {
    _id: 'p12',
    name: 'Microwave Oven 30L',
    description: 'Convection microwave oven with grill function, 30L capacity, and 10 power levels. Features auto-cook menus, child lock, and defrost by weight. Stainless steel interior.',
    category: 'Appliances',
    subcategory: 'Microwave',
    image: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=800',
    brand: 'QuickHeat',
    condition: 'Like New',
    deposit: 800,
    tenureOptions: [
      { months: 3, monthlyRent: 500, discount: 0 },
      { months: 6, monthlyRent: 400, discount: 20 },
      { months: 12, monthlyRent: 300, discount: 40 },
    ],
    features: ['Convection', 'Grill Function', 'Auto-Cook Menus', 'Child Lock'],
    quantity: 15,
    availability: true,
    rating: 4.3,
    numReviews: 95,
  },
];

// Backend availability tracking
let backendAvailable = null;
let pendingOrders = [];

const API = {
  /**
   * Generic fetch wrapper
   */
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (options.token) {
      config.headers['Authorization'] = `Bearer ${options.token}`;
      delete config.token;
    }

    // ============================================
    // DEMO MODE: agar USE_DATABASE = false hai
    // toh seedha fallback use karo
    // ============================================
    if (!USE_DATABASE) {
      return this.fallbackHandler(endpoint, config, options);
    }

    // ============================================
    // DATABASE MODE: real backend se baat karo
    // ============================================
    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      backendAvailable = true;
      return await response.json();
    } catch (error) {
      // Agar network fail ho (backend down) toh fallback use karo
      // taaki site crash na ho (safety net)
      if (
        error.name === 'TypeError' ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('Unexpected token')
      ) {
        console.warn('Backend unreachable, using offline data.');
        return this.fallbackHandler(endpoint, config, options);
      }
      throw error;
    }
  },

  /**
   * Fallback handler (offline demo mode)
   */
  async fallbackHandler(endpoint, config, options) {
    await new Promise(r => setTimeout(r, 200));

    // GET /products
    if (endpoint.startsWith('/products') && !endpoint.includes('/seed') && config.method !== 'POST' && config.method !== 'PUT' && config.method !== 'DELETE') {
      const pathParts = endpoint.replace('/products', '').split('?')[0];
      const queryStr = endpoint.split('?')[1] || '';
      const params = new URLSearchParams(queryStr);

      if (pathParts && pathParts.length > 1 && pathParts !== '/categories') {
        const id = pathParts.slice(1);
        const product = SAMPLE_PRODUCTS.find(p => p._id === id);
        if (product) return { ...product };
        throw new Error('Product not found');
      }

      if (pathParts === '/categories') {
        return [...new Set(SAMPLE_PRODUCTS.map(p => p.category))];
      }

      let products = [...SAMPLE_PRODUCTS];
      const category = params.get('category');
      const search = params.get('search');
      const sort = params.get('sort');

      if (category && category !== 'All') {
        products = products.filter(p => p.category === category);
      }
      if (search) {
        const q = search.toLowerCase();
        products = products.filter(p =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.brand && p.brand.toLowerCase().includes(q))
        );
      }
      if (sort === 'price_low') {
        products.sort((a, b) => Math.min(...a.tenureOptions.map(t => t.monthlyRent)) - Math.min(...b.tenureOptions.map(t => t.monthlyRent)));
      } else if (sort === 'price_high') {
        products.sort((a, b) => Math.min(...b.tenureOptions.map(t => t.monthlyRent)) - Math.min(...a.tenureOptions.map(t => t.monthlyRent)));
      } else if (sort === 'rating') {
        products.sort((a, b) => b.rating - a.rating);
      }
      return { count: products.length, products };
    }

    if (endpoint === '/products/seed' && config.method === 'POST') {
      return { message: 'Seeded (fallback mode)', count: SAMPLE_PRODUCTS.length };
    }

    if (endpoint === '/auth/register' && config.method === 'POST') {
      const body = JSON.parse(config.body);
      const token = 'demo-token-' + Date.now();
      return { _id: 'u' + Date.now(), name: body.name, email: body.email, phone: body.phone || '', address: {}, role: 'user', token };
    }

    if (endpoint === '/auth/login' && config.method === 'POST') {
      const body = JSON.parse(config.body);
      const token = 'demo-token-' + Date.now();
      return {
        _id: body.email.includes('admin') ? 'admin1' : 'u' + Date.now(),
        name: body.email.includes('admin') ? 'Admin' : body.email.split('@')[0],
        email: body.email, phone: '', address: {},
        role: body.email.includes('admin') ? 'admin' : 'user',
        token,
      };
    }

    if (endpoint === '/auth/me') {
      return { _id: 'demo1', name: 'Demo User', email: 'demo@rentease.com', role: 'user' };
    }

    if (endpoint === '/orders' && config.method === 'POST') {
      const body = JSON.parse(config.body);
      const order = { _id: 'ord' + Date.now(), ...body, status: 'Confirmed', paymentStatus: 'Paid', createdAt: new Date().toISOString() };
      pendingOrders.push(order);
      return order;
    }

    if (endpoint === '/orders/my-orders') {
      return { count: pendingOrders.length, orders: pendingOrders };
    }

    if (endpoint.startsWith('/orders') && !endpoint.includes('/my-orders') && config.method !== 'POST' && !endpoint.includes('/status') && !endpoint.includes('/maintenance')) {
      const parts = endpoint.split('?');
      const params = new URLSearchParams(parts[1] || '');
      const statusFilter = params.get('status');
      let orders = [...pendingOrders];
      if (statusFilter) orders = orders.filter(o => o.status === statusFilter);
      return { count: orders.length, total: orders.length, page: 1, pages: 1, orders };
    }

    const statusMatch = endpoint.match(/^\/orders\/([^/]+)\/status$/);
    if (statusMatch && config.method === 'PUT') {
      const id = statusMatch[1];
      const body = JSON.parse(config.body);
      const order = pendingOrders.find(o => o._id === id);
      if (order) { order.status = body.status; return order; }
      return { _id: id, status: body.status, message: 'Updated (demo)' };
    }

    const ticketMatch = endpoint.match(/^\/orders\/([^/]+)\/maintenance$/);
    if (ticketMatch && config.method === 'POST') {
      const id = ticketMatch[1];
      const body = JSON.parse(config.body);
      const order = pendingOrders.find(o => o._id === id);
      if (order) {
        if (!order.maintenanceTickets) order.maintenanceTickets = [];
        order.maintenanceTickets.push({ _id: 'tkt' + Date.now(), issue: body.issue, description: body.description, status: 'Open', raisedAt: new Date().toISOString() });
      }
      return order || { _id: id, maintenanceTickets: [body] };
    }

    console.warn('Unhandled fallback endpoint:', endpoint, config.method);
    return { success: true, message: 'Demo mode: operation simulated' };
  },

  // ===== Auth =====
  async register(userData) { return this.request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }); },
  async login(credentials) { return this.request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }); },
  async getProfile(token) { return this.request('/auth/me', { token }); },

  // ===== Products =====
  async getProducts(params = {}) { const qs = new URLSearchParams(params).toString(); return this.request(`/products${qs ? '?' + qs : ''}`); },
  async getProduct(id) { return this.request(`/products/${id}`); },
  async getCategories() { return this.request('/products/categories'); },
  async createProduct(data, token) { return this.request('/products', { method: 'POST', body: JSON.stringify(data), token }); },
  async updateProduct(id, data, token) { return this.request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data), token }); },
  async deleteProduct(id, token) { return this.request(`/products/${id}`, { method: 'DELETE', token }); },
  async seedProducts() { return this.request('/products/seed', { method: 'POST' }).catch(() => ({ message: 'Seed skipped' })); },

    // ===== Orders =====
  async createOrder(data, token) {
    return this.request('/orders', { method: 'POST', body: JSON.stringify(data), token });
  },
  async getMyOrders(token) {
    return this.request('/orders/my-orders', { token });
  },
  async getOrder(id, token) {
    return this.request(`/orders/${id}`, { token });
  },
  async getAllOrders(params, token) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/orders${qs ? '?' + qs : ''}`, { token });
  },
  async updateOrderStatus(id, status, token) {
    return this.request(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }), token });
  },
  async raiseMaintenanceTicket(orderId, data, token) {
    return this.request(`/orders/${orderId}/maintenance`, {
      method: 'POST',
      body: JSON.stringify(data),
      token
    });
  },
};