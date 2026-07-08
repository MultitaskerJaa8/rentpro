const mongoose = require('mongoose');

const maintenanceTicketSchema = new mongoose.Schema(
  {
    issue: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Resolved'],
      default: 'Open',
    },
    raisedAt: {
      type: Date,
      default: Date.now,
    },
    resolvedAt: {
      type: Date,
    },
    adminNotes: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    tenure: {
      months: {
        type: Number,
        required: true,
        enum: [3, 6, 12],
      },
      monthlyRent: {
        type: Number,
        required: true,
      },
    },
    totalRent: {
      type: Number,
      required: true,
    },
    deposit: {
      type: Number,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    deliveryAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
    },
    deliverySlot: {
      date: { type: Date, required: true },
      timeSlot: {
        type: String,
        required: true,
        enum: [
          '9:00 AM - 12:00 PM',
          '12:00 PM - 3:00 PM',
          '3:00 PM - 6:00 PM',
          '6:00 PM - 9:00 PM',
        ],
      },
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Delivered', 'Active', 'Returned', 'Cancelled'],
      default: 'Pending',
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Refunded'],
      default: 'Pending',
    },
    paymentMethod: {                                    // ← YEH ADD KAR
      type: String,
      enum: ['Cash on Delivery', 'UPI on Delivery'],
      default: 'Cash on Delivery',
    },
    maintenanceTickets: [maintenanceTicketSchema],
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Calculate end date based on tenure
orderSchema.pre('save', function (next) {
  if (this.isModified('startDate') || this.isModified('tenure.months')) {
    const endDate = new Date(this.startDate);
    endDate.setMonth(endDate.getMonth() + this.tenure.months);
    this.endDate = endDate;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
