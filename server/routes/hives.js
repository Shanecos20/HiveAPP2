const express = require('express');
const router = express.Router();
const Hive = require('../models/Hive');
const auth = require('../middleware/auth');
const axios = require('axios');

// Firebase database URL for sensor data
const FIREBASE_DATABASE_URL = 'https://hive-f7c39-default-rtdb.europe-west1.firebasedatabase.app';

// Helper to determine hive status based on sensor data
const determineHiveStatus = (sensors) => {
  if (!sensors) return 'offline';
  
  const { temperature, humidity, varroa } = sensors;
  
  if (temperature > 40 || temperature < 5 || humidity > 90 || humidity < 20 || varroa > 5) {
    return 'critical';
  } else if (temperature > 35 || temperature < 10 || humidity > 80 || humidity < 30 || varroa > 3) {
    return 'warning';
  } else {
    return 'healthy';
  }
};

// @route   GET /api/hives
// @desc    Get all hives for current user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const hives = await Hive.find({ userId: req.user.id });
    res.json(hives);
  } catch (err) {
    console.error('Error fetching hives:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/hives/:id
// @desc    Get hive by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const hive = await Hive.findOne({ id: req.params.id, userId: req.user.id });
    
    if (!hive) {
      return res.status(404).json({ msg: 'Hive not found' });
    }
    
    res.json(hive);
  } catch (err) {
    console.error('Error fetching hive:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST /api/hives
// @desc    Create a new hive
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { id, name, location, notes } = req.body;
    
    // Check if hive already exists
    let existingHive = await Hive.findOne({ id, userId: req.user.id });
    if (existingHive) {
      return res.status(400).json({ msg: 'Hive ID already exists for this user' });
    }
    
    // Fetch sensor data from Firebase
    try {
      const response = await axios.get(`${FIREBASE_DATABASE_URL}/hives/${id}/sensors.json`);
      const sensorData = response.data;
      
      if (!sensorData) {
        return res.status(404).json({ msg: 'Hive ID not found in simulator database' });
      }
      
      // Create new hive with sensor data
      const newHive = new Hive({
        id,
        name,
        location,
        notes,
        userId: req.user.id,
        sensors: sensorData,
        status: determineHiveStatus(sensorData),
        lastUpdated: new Date(),
        history: {
          temperature: [sensorData.temperature],
          humidity: [sensorData.humidity],
          weight: [sensorData.weight],
          varroa: [sensorData.varroa]
        }
      });
      
      await newHive.save();
      res.json(newHive);
      
    } catch (error) {
      console.error('Error fetching from Firebase:', error.message);
      return res.status(400).json({ msg: 'Error connecting to simulator database' });
    }
  } catch (err) {
    console.error('Error creating hive:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   PUT /api/hives/:id
// @desc    Update a hive
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, location, notes } = req.body;
    const hiveId = req.params.id;
    
    let hive = await Hive.findOne({ id: hiveId, userId: req.user.id });
    
    if (!hive) {
      return res.status(404).json({ msg: 'Hive not found' });
    }
    
    // Update fields
    hive.name = name || hive.name;
    hive.location = location || hive.location;
    hive.notes = notes !== undefined ? notes : hive.notes;
    
    await hive.save();
    res.json(hive);
  } catch (err) {
    console.error('Error updating hive:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   PUT /api/hives/:id/sensors
// @desc    Update a hive's sensor data
// @access  Private
router.put('/:id/sensors', auth, async (req, res) => {
  try {
    const hiveId = req.params.id;
    
    // First check if the hive exists
    let hive = await Hive.findOne({ id: hiveId, userId: req.user.id });
    
    if (!hive) {
      return res.status(404).json({ msg: 'Hive not found' });
    }
    
    // Fetch fresh sensor data from Firebase
    try {
      const response = await axios.get(`${FIREBASE_DATABASE_URL}/hives/${hiveId}/sensors.json`);
      const sensorData = response.data;
      
      if (!sensorData) {
        return res.status(404).json({ msg: 'Hive sensor data not found in simulator' });
      }
      
      // Update sensor data
      hive.sensors = sensorData;
      hive.status = determineHiveStatus(sensorData);
      hive.lastUpdated = new Date();
      
      // Update history
      if (sensorData.temperature) {
        if (!hive.history.temperature) hive.history.temperature = [];
        hive.history.temperature.push(sensorData.temperature);
        if (hive.history.temperature.length > 30) {
          hive.history.temperature.shift();
        }
      }
      
      if (sensorData.humidity) {
        if (!hive.history.humidity) hive.history.humidity = [];
        hive.history.humidity.push(sensorData.humidity);
        if (hive.history.humidity.length > 30) {
          hive.history.humidity.shift();
        }
      }
      
      if (sensorData.weight) {
        if (!hive.history.weight) hive.history.weight = [];
        hive.history.weight.push(sensorData.weight);
        if (hive.history.weight.length > 30) {
          hive.history.weight.shift();
        }
      }
      
      if (sensorData.varroa) {
        if (!hive.history.varroa) hive.history.varroa = [];
        hive.history.varroa.push(sensorData.varroa);
        if (hive.history.varroa.length > 30) {
          hive.history.varroa.shift();
        }
      }
      
      await hive.save();
      res.json(hive);
      
    } catch (error) {
      console.error('Error fetching from Firebase:', error.message);
      return res.status(400).json({ msg: 'Error connecting to simulator database' });
    }
  } catch (err) {
    console.error('Error updating hive sensors:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   DELETE /api/hives/:id
// @desc    Delete a hive
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const hive = await Hive.findOne({ id: req.params.id, userId: req.user.id });
    
    if (!hive) {
      return res.status(404).json({ msg: 'Hive not found' });
    }
    
    await Hive.deleteOne({ _id: hive._id });
    res.json({ msg: 'Hive removed' });
  } catch (err) {
    console.error('Error deleting hive:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router; 