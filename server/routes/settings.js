const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const auth = require('../middleware/auth');

// @route   GET /api/settings
// @desc    Get user settings
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let settings = await Settings.findOne({ userId: req.user.id });
    
    // If no settings exist, create default settings
    if (!settings) {
      settings = new Settings({ userId: req.user.id });
      await settings.save();
    }
    
    res.json(settings);
  } catch (err) {
    console.error('Error fetching settings:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   PUT /api/settings
// @desc    Update user settings
// @access  Private
router.put('/', auth, async (req, res) => {
  try {
    const updates = req.body;
    delete updates.userId; // Prevent userId from being changed
    
    let settings = await Settings.findOne({ userId: req.user.id });
    
    if (!settings) {
      // Create new settings if none exist
      settings = new Settings({ 
        userId: req.user.id,
        ...updates 
      });
    } else {
      // Update existing settings
      // Handle nested updates for notifications and preferences
      if (updates.notifications) {
        if (!settings.notifications) settings.notifications = {};
        
        // Update top level notifications properties
        if (updates.notifications.enabled !== undefined) {
          settings.notifications.enabled = updates.notifications.enabled;
        }
        
        // Update alert thresholds
        if (updates.notifications.alertThresholds) {
          if (!settings.notifications.alertThresholds) settings.notifications.alertThresholds = {};
          
          // Handle temperature thresholds
          if (updates.notifications.alertThresholds.temperature) {
            if (!settings.notifications.alertThresholds.temperature) {
              settings.notifications.alertThresholds.temperature = {};
            }
            if (updates.notifications.alertThresholds.temperature.min !== undefined) {
              settings.notifications.alertThresholds.temperature.min = updates.notifications.alertThresholds.temperature.min;
            }
            if (updates.notifications.alertThresholds.temperature.max !== undefined) {
              settings.notifications.alertThresholds.temperature.max = updates.notifications.alertThresholds.temperature.max;
            }
          }
          
          // Handle humidity thresholds
          if (updates.notifications.alertThresholds.humidity) {
            if (!settings.notifications.alertThresholds.humidity) {
              settings.notifications.alertThresholds.humidity = {};
            }
            if (updates.notifications.alertThresholds.humidity.min !== undefined) {
              settings.notifications.alertThresholds.humidity.min = updates.notifications.alertThresholds.humidity.min;
            }
            if (updates.notifications.alertThresholds.humidity.max !== undefined) {
              settings.notifications.alertThresholds.humidity.max = updates.notifications.alertThresholds.humidity.max;
            }
          }
          
          // Handle varroa thresholds
          if (updates.notifications.alertThresholds.varroa) {
            if (!settings.notifications.alertThresholds.varroa) {
              settings.notifications.alertThresholds.varroa = {};
            }
            if (updates.notifications.alertThresholds.varroa.max !== undefined) {
              settings.notifications.alertThresholds.varroa.max = updates.notifications.alertThresholds.varroa.max;
            }
          }
        }
      }
      
      // Update preferences
      if (updates.preferences) {
        if (!settings.preferences) settings.preferences = {};
        if (updates.preferences.temperatureUnit !== undefined) {
          settings.preferences.temperatureUnit = updates.preferences.temperatureUnit;
        }
        if (updates.preferences.weightUnit !== undefined) {
          settings.preferences.weightUnit = updates.preferences.weightUnit;
        }
        if (updates.preferences.dataRefreshInterval !== undefined) {
          settings.preferences.dataRefreshInterval = updates.preferences.dataRefreshInterval;
        }
      }
    }
    
    settings.updatedAt = Date.now();
    await settings.save();
    res.json(settings);
  } catch (err) {
    console.error('Error updating settings:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router; 