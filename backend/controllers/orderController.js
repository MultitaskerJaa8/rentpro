const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Create a new rental order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const {
      productId,
      tenureMonths,
      deliveryAddress,
      deliverySlot,
      notes,
      paymentMethod,
    } = req.body;

    if (!productId || !tenureMonths || !deliveryAddress || !deliverySlot) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!product.availability || product.quantity < 1) {
      return res.status(400).json({ message: 'Product is currently unavailable' });
    }

    const tenureOption = product.tenureOptions.find(
      (t) => t.months === parseInt(tenureMonths)
    );
    if (!tenureOption) {
      return res.status(400).json({ message: 'Invalid tenure option' });
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + tenureOption.months);

    const order = await Order.create({
      user: req.user._id,
      product: productId,
      tenure: {
        months: tenureOption.months,
        monthlyRent: tenureOption.monthlyRent,
      },
      totalRent: tenureOption.monthlyRent * tenureOption.months,
      deposit: product.deposit,
      startDate,
      endDate,
      deliveryAddress,
      deliverySlot,
      notes: notes || '',
      paymentMethod: paymentMethod || 'Cash on Delivery',   // ← YEH ADD KAR
    });
    // Reduce product quantity
    product.quantity -= 1;
    if (product.quantity === 0) {
      product.availability = false;
    }
    await product.save();

    const populatedOrder = await Order.findById(order._id)
      .populate('product', 'name image category')
      .populate('user', 'name email');

    res.status(201).json(populatedOrder);
  } catch (error) {
    console.error('Create Order Error:', error.message);
    res.status(500).json({ message: 'Server error creating order' });
  }
};

// @desc    Get logged in user's orders
// @route   GET /api/orders/my-orders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('product', 'name image category brand')
      .sort({ createdAt: -1 });

    res.json({ count: orders.length, orders });
  } catch (error) {
    console.error('Get My Orders Error:', error.message);
    res.status(500).json({ message: 'Server error fetching orders' });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('product', 'name image category brand tenureOptions')
      .populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user owns this order or is admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get Order Error:', error.message);
    res.status(500).json({ message: 'Server error fetching order' });
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private/Admin
const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Order.countDocuments(filter);

    const orders = await Order.find(filter)
      .populate('product', 'name image category')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      count: orders.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      orders,
    });
  } catch (error) {
    console.error('Get All Orders Error:', error.message);
    res.status(500).json({ message: 'Server error fetching orders' });
  }
};

// @desc    Update order status (Admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Confirmed', 'Delivered', 'Active', 'Returned', 'Cancelled'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;

    // If returned or cancelled, make product available again
    if (status === 'Returned' || status === 'Cancelled') {
      const product = await Product.findById(order.product);
      if (product) {
        product.quantity += 1;
        product.availability = true;
        await product.save();
      }
    }

    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate('product', 'name image category')
      .populate('user', 'name email');

    res.json(updatedOrder);
  } catch (error) {
    console.error('Update Order Status Error:', error.message);
    res.status(500).json({ message: 'Server error updating order status' });
  }
};

// @desc    Raise a maintenance ticket
// @route   POST /api/orders/:id/maintenance
// @access  Private
const raiseMaintenanceTicket = async (req, res) => {
  try {
    const { issue, description } = req.body;

    if (!issue || !description) {
      return res.status(400).json({ message: 'Please provide issue and description' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user owns this order
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    order.maintenanceTickets.push({
      issue,
      description,
      status: 'Open',
      raisedAt: new Date(),
    });

    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate('product', 'name image category')
      .populate('user', 'name email');

    res.json(updatedOrder);
  } catch (error) {
    console.error('Maintenance Ticket Error:', error.message);
    res.status(500).json({ message: 'Server error raising maintenance ticket' });
  }
};

// @desc    Update maintenance ticket status (Admin)
// @route   PUT /api/orders/:id/maintenance/:ticketId
// @access  Private/Admin
const updateMaintenanceTicket = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const ticket = order.maintenanceTickets.id(req.params.ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (status) ticket.status = status;
    if (adminNotes) ticket.adminNotes = adminNotes;
    if (status === 'Resolved') ticket.resolvedAt = new Date();

    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate('product', 'name image category')
      .populate('user', 'name email');

    res.json(updatedOrder);
  } catch (error) {
    console.error('Update Ticket Error:', error.message);
    res.status(500).json({ message: 'Server error updating ticket' });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  raiseMaintenanceTicket,
  updateMaintenanceTicket,
};
