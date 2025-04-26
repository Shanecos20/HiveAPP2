const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  notifications: {
    enabled: { type: Boolean, default: true },
    alertThresholds: {
      temperature: {
        min: { type: Number, default: 10 },
        max: { type: Number, default: 40 }
      },
      humidity: {
        min: { type: Number, default: 30 },
        max: { type: Number, default: 80 }
      },
      varroa: {
        max: { type: Number, default: 3 }
      }
    }
  },
  preferences: {
    temperatureUnit: { type: String, enum: ['celsius', 'fahrenheit'], default: 'celsius' },
    weightUnit: { type: String, enum: ['kg', 'lb'], default: 'kg' },
    dataRefreshInterval: { type: Number, default: 30 }
  },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Settings', settingsSchema); 