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
    
    // Check if hive already exists globally
    let existingHive = await Hive.findOne({ id });
    if (existingHive) {
      // Check if it belongs to the current user (optional, for potentially different message)
      if (existingHive.userId.toString() === req.user.id) {
        return res.status(400).json({ msg: 'You have already registered this hive ID.' });
      } else {
        return res.status(400).json({ msg: 'This Hive ID is already registered by another user.' });
      }
    }
    
    // Fetch sensor data from Firebase
    try {
      // Add cache-busting parameter to avoid cached responses
      const timestamp = Date.now();
      const url = `${FIREBASE_DATABASE_URL}/hives/${id}/sensors.json?_cb=${timestamp}`;
      console.log(`Attempting to fetch Firebase data from: ${url}`);
      
      const response = await axios.get(url);
      const sensorData = response.data;
      
      if (!sensorData) {
        console.log(`No sensor data found for hive ID: ${id}`);
        return res.status(404).json({ msg: 'Hive ID not found in simulator database' });
      }
      
      console.log(`Successfully fetched sensor data for hive ${id}:`, sensorData);
      
      // Create a valid object for history based on available sensor data
      const history = {};
      if (sensorData.temperature !== undefined) history.temperature = [sensorData.temperature];
      if (sensorData.humidity !== undefined) history.humidity = [sensorData.humidity];
      if (sensorData.weight !== undefined) history.weight = [sensorData.weight];
      if (sensorData.varroa !== undefined) history.varroa = [sensorData.varroa];
      
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
        history
      });
      
      try {
        await newHive.save();
        console.log(`Hive ${id} successfully created for user ${req.user.id}`);
        res.json(newHive);
      } catch (saveError) {
        // Check for MongoDB duplicate key error (code 11000)
        if (saveError.code === 11000) {
          console.error(`Error saving hive: Duplicate key error for ID ${id}`);
          // Determine if it's the same user or another user based on the existing document
          // Note: This requires another query, might be simpler to just return the generic message
          let conflictingHive = await Hive.findOne({ id });
          if (conflictingHive && conflictingHive.userId.toString() === req.user.id) {
             return res.status(400).json({ msg: 'You have already registered this hive ID.' });
          } else {
             return res.status(400).json({ msg: 'This Hive ID is already registered by another user.' });
          }
        } else {
          // Re-throw other save errors to be caught by the outer catch block
          throw saveError;
        }
      }
      
    } catch (error) {
      console.error('Error fetching from Firebase or processing:', error);
      
      // Print full error details for debugging
      if (error.response) {
        console.error(`Firebase response error: Status ${error.response.status}`, 
          error.response.data || 'No response data');
        
        // Handle specific HTTP error responses
        if (error.response.status === 404) {
          return res.status(404).json({ msg: 'Hive ID not found in simulator database' });  
        }
        return res.status(400).json({ msg: `Error connecting to simulator database: ${error.response.status}` });
      } else if (error.request) {
        // Request was made but no response received
        console.error('Firebase request error (no response):', error.request);
        return res.status(500).json({ msg: 'Error connecting to simulator database: No response' });
      } else {
        // Something else happened
        return res.status(500).json({ msg: `Error connecting to simulator database: ${error.message}` });
      }
    }
  } catch (err) {
    console.error('Error creating hive:', err);
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
    
    // Check if sensors are provided directly in the request
    if (req.body.sensors) {
      // Use provided sensors data
      const sensorData = req.body.sensors;
      console.log(`Using provided sensor data for hive ${hiveId}`);
      
      // Update sensor data
      hive.sensors = sensorData;
      hive.status = determineHiveStatus(sensorData);
      hive.lastUpdated = new Date();
      
      // Update history
      updateHiveHistory(hive, sensorData);
      
      await hive.save();
      return res.json(hive);
    }
    
    // Otherwise, fetch fresh sensor data from Firebase
    try {
      // Add cache-busting parameter
      const timestamp = Date.now();
      const url = `${FIREBASE_DATABASE_URL}/hives/${hiveId}/sensors.json?_cb=${timestamp}`;
      console.log(`Fetching sensor data from Firebase: ${url}`);
      
      const response = await axios.get(url);
      const sensorData = response.data;
      
      if (!sensorData) {
        console.log(`No sensor data found in Firebase for hive ${hiveId}`);
        return res.status(404).json({ msg: 'Hive sensor data not found in simulator' });
      }
      
      console.log(`Successfully fetched sensor data for ${hiveId}:`, sensorData);
      
      // Update sensor data
      hive.sensors = sensorData;
      hive.status = determineHiveStatus(sensorData);
      hive.lastUpdated = new Date();
      
      // Update history
      updateHiveHistory(hive, sensorData);
      
      await hive.save();
      res.json(hive);
      
    } catch (error) {
      console.error(`Error fetching from Firebase for hive ${hiveId}:`, error);
      
      if (error.response) {
        console.error(`Firebase response error: Status ${error.response.status}`, 
          error.response.data || 'No response data');
        return res.status(error.response.status).json({ 
          msg: `Error connecting to simulator database: ${error.response.status}` 
        });
      } else if (error.request) {
        console.error('Firebase request error (no response):', error.request);
        return res.status(500).json({ msg: 'Error connecting to simulator database: No response' });
      } else {
        return res.status(500).json({ msg: `Error connecting to simulator database: ${error.message}` });
      }
    }
  } catch (err) {
    console.error('Error updating hive sensors:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Helper function to update hive history with new sensor data
function updateHiveHistory(hive, sensorData) {
  // Initialize history object if needed
  if (!hive.history) {
    hive.history = {};
  }
  
  if (sensorData.temperature !== undefined) {
        if (!hive.history.temperature) hive.history.temperature = [];
        hive.history.temperature.push(sensorData.temperature);
        if (hive.history.temperature.length > 30) {
          hive.history.temperature.shift();
        }
      }
      
  if (sensorData.humidity !== undefined) {
        if (!hive.history.humidity) hive.history.humidity = [];
        hive.history.humidity.push(sensorData.humidity);
        if (hive.history.humidity.length > 30) {
          hive.history.humidity.shift();
        }
      }
      
  if (sensorData.weight !== undefined) {
        if (!hive.history.weight) hive.history.weight = [];
        hive.history.weight.push(sensorData.weight);
        if (hive.history.weight.length > 30) {
          hive.history.weight.shift();
        }
      }
      
  if (sensorData.varroa !== undefined) {
        if (!hive.history.varroa) hive.history.varroa = [];
        hive.history.varroa.push(sensorData.varroa);
        if (hive.history.varroa.length > 30) {
          hive.history.varroa.shift();
        }
      }
}

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