// models/Hive.js
const mongoose = require('mongoose');

const hiveSchema = new mongoose.Schema({
  id:        { type: String, required: true },              // no `unique: true` here
  name:      { type: String, required: true },
  location:  { type: String, required: true },
  notes:     { type: String },
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status:    { type: String, enum: ['healthy','warning','critical','offline'], default: 'offline' },
  lastUpdated:{ type: Date, default: Date.now },
  sensors: {
    temperature:{ type: Number },
    humidity:   { type: Number },
    weight:     { type: Number },
    varroa:     { type: Number },
    timestamp:  { type: Date }
  },
  history: {
    temperature:[Number],
    humidity:   [Number],
    weight:     [Number],
    varroa:     [Number]
  },
  createdAt:  { type: Date, default: Date.now }
});

// ← enforce one hive-ID per user
hiveSchema.index({ id: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Hive', hiveSchema);
