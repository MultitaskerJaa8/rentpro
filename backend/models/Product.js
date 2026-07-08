const mongoose = require('mongoose');

const tenureOptionSchema = new mongoose.Schema(
  {
    months: {
      type: Number,
      required: true,
      enum: [3, 6, 12],
    },
    monthlyRent: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      maxlength: 2000,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Living Room',
        'Bedroom',
        'Kitchen',
        'Office',
        'Electronics',
        'Appliances',
        'Outdoor',
      ],
    },
    subcategory: {
      type: String,
      trim: true,
      default: '',
    },
    image: {
      type: String,
      default: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
    },
    images: [String],
    brand: {
      type: String,
      trim: true,
      default: '',
    },
    condition: {
      type: String,
      enum: ['New', 'Like New', 'Good', 'Fair'],
      default: 'Good',
    },
    deposit: {
      type: Number,
      required: true,
      default: 0,
    },
    tenureOptions: {
      type: [tenureOptionSchema],
      required: true,
      validate: {
        validator: function (v) {
          return v.length > 0;
        },
        message: 'At least one tenure option is required',
      },
    },
    features: [String],
    specifications: {
      type: Map,
      of: String,
      default: {},
    },
    availability: {
      type: Boolean,
      default: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Index for search and filtering
productSchema.index({ category: 1, availability: 1 });
productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
