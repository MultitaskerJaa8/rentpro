const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  raiseMaintenanceTicket,
  updateMaintenanceTicket,
} = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// All order routes require authentication
router.use(protect);

// User routes
router.post('/', createOrder);
router.get('/my-orders', getMyOrders);
router.get('/:id', getOrderById);
router.post('/:id/maintenance', raiseMaintenanceTicket);

// Admin routes
router.get('/', adminOnly, getAllOrders);
router.put('/:id/status', adminOnly, updateOrderStatus);
router.put('/:id/maintenance/:ticketId', adminOnly, updateMaintenanceTicket);

module.exports = router;
