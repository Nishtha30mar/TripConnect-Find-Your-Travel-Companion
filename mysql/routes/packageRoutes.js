import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET all unique destinations
router.get('/destinations', (req, res) => {
  const query = `
    SELECT DISTINCT destination 
    FROM packages 
    WHERE is_active = 1 
    ORDER BY destination ASC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Database error' 
      });
    }
    
    const destinations = results.map(row => row.destination);
    res.json({ success: true, destinations });
  });
});

// POST search packages
router.post('/search', (req, res) => {
  const {
    destination,
    budgetMin = 1,
    budgetMax = 1000000,
    travellers = 1,
    startDate,
    endDate
  } = req.body;

  // Validate required fields
  if (!destination) {
    return res.status(400).json({ 
      success: false, 
      message: 'Destination is required' 
    });
  }

  // Calculate duration from dates if provided
  let durationDays = null;
  if (startDate && endDate) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Validate dates
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid date format' 
        });
      }
      
      if (end < start) {
        return res.status(400).json({ 
          success: false, 
          message: 'End date must be after start date' 
        });
      }
      
      durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    } catch (error) {
      console.error('Error calculating duration:', error);
    }
  }

  // Build query with flexible filters
  let query = `
    SELECT 
      package_id,
      destination,
      title,
      description,
      price_per_person,
      duration_days,
      min_travellers,
      max_travellers,
      included_features,
      details,
      image_url
    FROM packages 
    WHERE is_active = 1 
    AND destination = ?
    AND price_per_person BETWEEN ? AND ?
  `;

  const params = [destination, budgetMin, budgetMax];

  // Add travellers filter
  if (travellers) {
    query += ' AND ? BETWEEN min_travellers AND max_travellers';
    params.push(travellers);
  }

  // Add duration filter if dates are provided
  if (durationDays && durationDays > 0) {
    // Allow packages with duration +/- 2 days of requested duration
    query += ' AND ABS(duration_days - ?) <= 2';
    params.push(durationDays);
  }

  query += ' ORDER BY price_per_person ASC';

  console.log('Search query:', query);
  console.log('Search params:', params);

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Database error' 
      });
    }
    
    res.json({ 
      success: true, 
      packages: results,
      count: results.length
    });
  });
});

// GET package by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  // Validate ID
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid package ID' 
    });
  }
  
  const query = `
    SELECT 
      package_id,
      destination,
      title,
      description,
      price_per_person,
      duration_days,
      min_travellers,
      max_travellers,
      included_features,
      details,
      image_url,
      is_active
    FROM packages 
    WHERE package_id = ? AND is_active = 1
  `;
  
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Database error' 
      });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Package not found or inactive' 
      });
    }
    
    res.json({ 
      success: true, 
      package: results[0] 
    });
  });
});

export default router;