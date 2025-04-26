const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['sensor', 'camera', 'gateway', 'other'], default: 'sensor' },
  status: { type: String, enum: ['online', 'offline', 'error'], default: 'offline' },
  hiveId: { type: String, ref: 'Hive.id' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lastConnected: { type: Date },
  firmware: { type: String },
  batteryLevel: { type: Number },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Device', deviceSchema); 