const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const Hive = require('../models/Hive');
const auth = require('../middleware/auth');

// @route   GET /api/devices
// @desc    Get all devices for current user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const devices = await Device.find({ userId: req.user.id });
    res.json(devices);
  } catch (err) {
    console.error('Error fetching devices:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/devices/:id
// @desc    Get device by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const device = await Device.findOne({ id: req.params.id, userId: req.user.id });
    
    if (!device) {
      return res.status(404).json({ msg: 'Device not found' });
    }
    
    res.json(device);
  } catch (err) {
    console.error('Error fetching device:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST /api/devices
// @desc    Register a new device
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { id, name, type, firmware, batteryLevel } = req.body;
    
    // Check if device already exists
    let device = await Device.findOne({ id, userId: req.user.id });
    if (device) {
      return res.status(400).json({ msg: 'Device ID already exists for this user' });
    }
    
    // Create new device
    device = new Device({
      id,
      name,
      type: type || 'sensor',
      status: 'offline', // Default status is offline until connected
      userId: req.user.id,
      lastConnected: null,
      firmware,
      batteryLevel
    });
    
    await device.save();
    res.json(device);
  } catch (err) {
    console.error('Error registering device:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   PUT /api/devices/:id
// @desc    Update device
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, status, firmware, batteryLevel } = req.body;
    
    let device = await Device.findOne({ id: req.params.id, userId: req.user.id });
    
    if (!device) {
      return res.status(404).json({ msg: 'Device not found' });
    }
    
    // Update fields if provided
    if (name) device.name = name;
    if (status) device.status = status;
    if (firmware) device.firmware = firmware;
    if (batteryLevel !== undefined) device.batteryLevel = batteryLevel;
    
    // If status changed to online, update lastConnected
    if (status === 'online') {
      device.lastConnected = new Date();
    }
    
    await device.save();
    res.json(device);
  } catch (err) {
    console.error('Error updating device:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   PUT /api/devices/:id/associate/:hiveId
// @desc    Associate device with a hive
// @access  Private
router.put('/:id/associate/:hiveId', auth, async (req, res) => {
  try {
    const deviceId = req.params.id;
    const hiveId = req.params.hiveId;
    
    // Verify device exists and belongs to user
    const device = await Device.findOne({ id: deviceId, userId: req.user.id });
    if (!device) {
      return res.status(404).json({ msg: 'Device not found' });
    }
    
    // Verify hive exists and belongs to user
    const hive = await Hive.findOne({ id: hiveId, userId: req.user.id });
    if (!hive) {
      return res.status(404).json({ msg: 'Hive not found' });
    }
    
    // Associate device with hive
    device.hiveId = hiveId;
    await device.save();
    
    res.json(device);
  } catch (err) {
    console.error('Error associating device with hive:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   DELETE /api/devices/:id
// @desc    Delete a device
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const device = await Device.findOne({ id: req.params.id, userId: req.user.id });
    
    if (!device) {
      return res.status(404).json({ msg: 'Device not found' });
    }
    
    await Device.deleteOne({ _id: device._id });
    res.json({ msg: 'Device removed' });
  } catch (err) {
    console.error('Error deleting device:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router; 