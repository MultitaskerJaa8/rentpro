const Product = require('../models/Product');

// @desc    Get all products with optional filters
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, sort, availability } = req.query;

    let filter = {};

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (availability !== undefined) {
      filter.availability = availability === 'true';
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'price_low') {
      sortOption = { 'tenureOptions.0.monthlyRent': 1 };
    } else if (sort === 'price_high') {
      sortOption = { 'tenureOptions.0.monthlyRent': -1 };
    } else if (sort === 'rating') {
      sortOption = { rating: -1 };
    } else if (sort === 'newest') {
      sortOption = { createdAt: -1 };
    }

    const products = await Product.find(filter)
      .sort(sortOption)
      .populate('addedBy', 'name');

    res.json({
      count: products.length,
      products,
    });
  } catch (error) {
    console.error('Get Products Error:', error.message);
    res.status(500).json({ message: 'Server error fetching products' });
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('addedBy', 'name');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Get Product Error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(500).json({ message: 'Server error fetching product' });
  }
};

// @desc    Create a new product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      subcategory,
      image,
      images,
      brand,
      condition,
      deposit,
      tenureOptions,
      features,
      specifications,
      quantity,
    } = req.body;

    if (!name || !description || !category || !deposit || !tenureOptions) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const product = await Product.create({
      name,
      description,
      category,
      subcategory: subcategory || '',
      image: image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
      images: images || [],
      brand: brand || '',
      condition: condition || 'Good',
      deposit,
      tenureOptions,
      features: features || [],
      specifications: specifications || {},
      quantity: quantity || 1,
      addedBy: req.user._id,
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Create Product Error:', error.message);
    res.status(500).json({ message: 'Server error creating product' });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );

    res.json(updatedProduct);
  } catch (error) {
    console.error('Update Product Error:', error.message);
    res.status(500).json({ message: 'Server error updating product' });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product removed successfully' });
  } catch (error) {
    console.error('Delete Product Error:', error.message);
    res.status(500).json({ message: 'Server error deleting product' });
  }
};

// @desc    Seed products (for initial data)
// @route   POST /api/products/seed
// @access  Public (for demo)
const seedProducts = async (req, res) => {
  try {
    const count = await Product.countDocuments();
    if (count > 0) {
      return res.json({ message: 'Products already seeded', count });
    }

    const sampleProducts = [
      {
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
        rating: 4.7,
        numReviews: 23,
      },
      {
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
        rating: 4.8,
        numReviews: 45,
      },
      {
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
        rating: 4.5,
        numReviews: 67,
      },
      {
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
        rating: 4.6,
        numReviews: 89,
      },
      {
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
        rating: 4.9,
        numReviews: 112,
      },
      {
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
        rating: 4.4,
        numReviews: 56,
      },
      {
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
        rating: 4.7,
        numReviews: 34,
      },
      {
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
        rating: 4.6,
        numReviews: 78,
      },
      {
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
        rating: 4.3,
        numReviews: 41,
      },
      {
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
        rating: 4.5,
        numReviews: 29,
      },
      {
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
        rating: 4.4,
        numReviews: 18,
      },
      {
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
        rating: 4.3,
        numReviews: 95,
      },
    ];

    await Product.insertMany(sampleProducts);
    res.status(201).json({ message: 'Products seeded successfully', count: sampleProducts.length });
  } catch (error) {
    console.error('Seed Products Error:', error.message);
    res.status(500).json({ message: 'Server error seeding products' });
  }
};

// @desc    Get all categories
// @route   GET /api/products/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json(categories);
  } catch (error) {
    console.error('Get Categories Error:', error.message);
    res.status(500).json({ message: 'Server error fetching categories' });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  seedProducts,
  getCategories,
};
