/**
 * Test Deletion API Handler
 * 
 * This script handles API requests to delete test runs from the history.
 * It's designed to work with the delete functionality in the comparison page.
 */

// Import required Node.js modules
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

// Create an Express app
const app = express();

// Configure middleware
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Parse JSON request bodies

// Define the delete endpoint
app.delete('/api/test/:id', (req, res) => {
  try {
    const testId = req.params.id;
    
    if (!testId) {
      return res.status(400).json({ error: 'No test ID provided' });
    }
    
    // Define paths
    const historyDir = path.join(__dirname, '../jmeter-pages/history');
    const outputDir = path.join(__dirname, '../jmeter-pages/reports/history');
    const jtlFile = path.join(historyDir, `results_${testId}.jtl`);
    const historyJson = path.join(outputDir, 'history.json');
    
    // Verify the JTL file exists
    if (!fs.existsSync(jtlFile)) {
      return res.status(404).json({ error: 'Test file not found' });
    }
    
    // Load the history JSON
    if (!fs.existsSync(historyJson)) {
      return res.status(500).json({ error: 'History file not found' });
    }
    
    const historyData = JSON.parse(fs.readFileSync(historyJson, 'utf8'));
    
    if (!historyData.tests) {
      return res.status(500).json({ error: 'Invalid history data format' });
    }
    
    // Filter out the test to delete
    const newTests = historyData.tests.filter(test => !test.id || test.id !== testId);
    
    // Update the history.json file
    historyData.tests = newTests;
    fs.writeFileSync(historyJson, JSON.stringify(historyData, null, 2));
    
    // Delete the JTL file
    fs.unlinkSync(jtlFile);
    
    // Return success
    return res.status(200).json({ success: true, message: 'Test deleted successfully' });
    
  } catch (error) {
    console.error('Error handling delete request:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Define a port
const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
  console.log(`Test deletion API server running on port ${PORT}`);
});

// Export the app for testing
module.exports = app; 
