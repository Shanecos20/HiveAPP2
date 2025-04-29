const mongoose = require('mongoose');

const hiveSchema = new mongoose.Schema({
  id: { type: String, required: true }, // External ID from Firebase/simulator
  name: { type: String, required: true, default: 'New Hive' },
  location: { type: String, required: true, default: 'Unknown location' },
  notes: { type: String, default: '' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['healthy', 'warning', 'critical', 'offline'], default: 'offline' },
  lastUpdated: { type: Date, default: Date.now },
  sensors: {
    temperature: { type: Number },
    humidity: { type: Number },
    weight: { type: Number },
    varroa: { type: Number },
    timestamp: { type: Number }, // Changed from Date to Number (unix timestamp)
    heater: { type: Boolean },
    fan: { type: Boolean }
  },
  history: {
    temperature: { type: [Number], default: [] },
    humidity: { type: [Number], default: [] },
    weight: { type: [Number], default: [] },
    varroa: { type: [Number], default: [] }
  },
  createdAt: { type: Date, default: Date.now }
});

// Added compound index for uniqueness per user
hiveSchema.index({ id: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Hive', hiveSchema); 