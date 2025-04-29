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
    const { id, name, location, notes, force = false } = req.body;
    console.log(`[POST /hives] Creating new hive with ID: ${id} for user: ${req.user.id}, force=${force}`);
    
    if (!id || !name || !location) {
      console.log('[POST /hives] Missing required fields');
      return res.status(400).json({ msg: 'Please provide all required fields (id, name, location)' });
    }
    
    // Check if hive already exists for this user with detailed debugging
    try {
      let existingHive = await Hive.findOne({ id, userId: req.user.id });
      
      console.log(`[POST /hives] Database check result for hive ID ${id}, user ${req.user.id}:`, 
        existingHive ? 'Found existing hive' : 'No existing hive found');
      
      if (existingHive) {
        if (force) {
          // If force flag is set, delete the existing hive first
          console.log(`[POST /hives] Force flag set - removing existing hive: ${id}`);
          await Hive.deleteOne({ _id: existingHive._id });
          console.log(`[POST /hives] Existing hive removed successfully`);
        } else {
          console.log(`[POST /hives] Hive ID ${id} already exists for user ${req.user.id} - returning existing hive`);
          return res.json(existingHive); // Return the existing hive instead of error
        }
      }
    } catch (findError) {
      console.error(`[POST /hives] Error checking for existing hive:`, findError);
      // Continue with creation attempt despite error
    }
    
    console.log(`[POST /hives] Fetching sensor data from Firebase for hive: ${id}`);
    
    // Fetch sensor data from Firebase with better error handling
    try {
      // Add cache-busting parameter to avoid cached responses
      const timestamp = Date.now();
      const firebaseUrl = `${FIREBASE_DATABASE_URL}/hives/${id}/sensors.json?_cb=${timestamp}`;
      console.log(`[POST /hives] Requesting: ${firebaseUrl}`);
      
      const response = await axios.get(firebaseUrl);
      const sensorData = response.data;
      
      if (!sensorData) {
        console.log(`[POST /hives] No sensor data found for hive: ${id}`);
        return res.status(404).json({ msg: 'Hive ID not found in simulator database' });
      }
      
      console.log(`[POST /hives] Sensor data retrieved successfully for hive: ${id}`);
      
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
          temperature: sensorData.temperature ? [sensorData.temperature] : [],
          humidity: sensorData.humidity ? [sensorData.humidity] : [],
          weight: sensorData.weight ? [sensorData.weight] : [],
          varroa: sensorData.varroa ? [sensorData.varroa] : []
        }
      });
      
      try {
        await newHive.save();
        console.log(`[POST /hives] Hive ${id} successfully created for user ${req.user.id}`);
        return res.json(newHive);
      } catch (saveError) {
        console.error(`[POST /hives] Error saving hive to database:`, saveError);
        if (saveError.code === 11000) { // Duplicate key error
          return res.status(400).json({ msg: 'Hive ID already exists for this user' });
        }
        return res.status(500).json({ msg: 'Error saving hive to database' });
      }
    } catch (error) {
      console.error('[POST /hives] Error fetching from Firebase:', error);
      
      // Detailed logging for debugging
      if (error.response) {
        console.error(`[POST /hives] Firebase response error:`, {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
        
        // Handle specific HTTP error responses
        if (error.response.status === 404) {
          return res.status(404).json({ msg: 'Hive ID not found in simulator database' });  
        }
        return res.status(400).json({ msg: `Error connecting to simulator database: ${error.response.status}` });
      } else if (error.request) {
        // Request was made but no response received
        console.error(`[POST /hives] Firebase request error:`, error.request);
        return res.status(500).json({ msg: 'Error connecting to simulator database: No response' });
      } else {
        // Something else happened
        console.error(`[POST /hives] Firebase other error:`, error.message);
        return res.status(500).json({ msg: `Error connecting to simulator database: ${error.message}` });
      }
    }
  } catch (err) {
    console.error('[POST /hives] Server error:', err);
    return res.status(500).json({ msg: 'Server error' });
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

// @route   DELETE /api/hives/debug/reset
// @desc    Reset all hives for a user - FOR DEBUGGING ONLY
// @access  Private
router.delete('/debug/reset', auth, async (req, res) => {
  try {
    // This should only be enabled in development
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ msg: 'This operation is not allowed in production' });
    }
    
    console.log(`[DEBUG] Resetting all hives for user: ${req.user.id}`);
    const result = await Hive.deleteMany({ userId: req.user.id });
    
    console.log(`[DEBUG] Reset result:`, result);
    return res.json({ 
      msg: 'All hives reset for debugging', 
      count: result.deletedCount 
    });
  } catch (err) {
    console.error('Error resetting hives:', err);
    return res.status(500).json({ msg: 'Server error during reset' });
  }
});

module.exports = router; 