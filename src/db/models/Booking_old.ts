import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema({
  startDate: { 
    type: Date, 
    required: true 
  },
  endDate: { 
    type: Date, 
    required: true 
  },
  adults: { 
    type: Number, 
    required: true,
    min: 1 
  },
  children: { 
    type: Number, 
    default: 0 
  },
  cabinsCount: { 
    type: Number, 
    required: true, 
    enum: [1, 2] 
  },
  totalPrice: { 
    type: Number, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'cancelled'], 
    default: 'pending' 
  },
  customerName: { 
    type: String, 
    required: true 
  },
  customerEmail: { 
    type: String, 
    required: true 
  },
  customerPhone: { 
    type: String 
  },
  message: { 
    type: String 
  }
}, { timestamps: true });

export default mongoose.models.Booking || mongoose.model('Booking', BookingSchema);