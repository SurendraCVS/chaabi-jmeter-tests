#!/bin/bash

# Script to generate the HTML comparison page
# Usage: ./generate_comparison_page.sh <output_dir>

OUTPUT_DIR=$1

echo "Generating HTML comparison page..."

cat > "$OUTPUT_DIR/index.html" << 'EOL'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JMeter Historical Comparison</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/moment@2.29.4/moment.min.js"></script>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .container { max-width: 1200px; margin: 0 auto; }
    .chart-container { height: 300px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f2f2f2; }
    tr.current { background-color: #e6f7ff; font-weight: bold; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .header a { text-decoration: none; padding: 10px; background: #f2f2f2; border-radius: 4px; }
    .filters { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    .checkbox-group { display: flex; flex-wrap: wrap; gap: 15px; margin-top: 10px; }
    .checkbox-item { display: flex; align-items: center; }
    .checkbox-item input { margin-right: 5px; }
    .date-filter { display: flex; gap: 10px; margin-top: 10px; }
    .test-selection { display: flex; gap: 10px; margin-top: 15px; }
    .test-selection select { flex: 1; }
    .chart-container-large { height: 400px; margin-bottom: 30px; }
    .comparison-container { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
    .metric-value { font-size: 24px; font-weight: bold; }
    .metric-label { font-size: 14px; color: #666; }
    .metric-card { padding: 15px; border: 1px solid #ddd; border-radius: 5px; text-align: center; }
    .improvement { color: green; }
    .degradation { color: red; }
    .test-selector { margin-bottom: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>JMeter Historical Test Comparison</h1>
      <a href="../index.html">Back to Current Report</a>
    </div>
    
    <div class="filters">
      <h4>Filters</h4>
      
      <div class="row">
        <div class="col-md-6">
          <label>Date Range:</label>
          <div class="date-filter">
            <select id="dateRangeFilter" class="form-select">
              <option value="all">All Time</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="custom">Custom Range</option>
            </select>
            <input type="date" id="startDate" class="form-control" style="display:none">
            <input type="date" id="endDate" class="form-control" style="display:none">
            <button id="applyDateFilter" class="btn btn-primary" style="display:none">Apply</button>
          </div>
        </div>
        
        <div class="col-md-6">
          <label>Metrics to Display:</label>
          <div class="checkbox-group">
            <div class="checkbox-item">
              <input type="checkbox" id="avgRTCheckbox" checked>
              <label for="avgRTCheckbox">Avg Response Time</label>
            </div>
            <div class="checkbox-item">
              <input type="checkbox" id="minRTCheckbox">
              <label for="minRTCheckbox">Min Response Time</label>
            </div>
            <div class="checkbox-item">
              <input type="checkbox" id="maxRTCheckbox">
              <label for="maxRTCheckbox">Max Response Time</label>
            </div>
            <div class="checkbox-item">
              <input type="checkbox" id="medianRTCheckbox" checked>
              <label for="medianRTCheckbox">Median RT</label>
            </div>
            <div class="checkbox-item">
              <input type="checkbox" id="pct90RTCheckbox">
              <label for="pct90RTCheckbox">90th Percentile RT</label>
            </div>
            <div class="checkbox-item">
              <input type="checkbox" id="pct95RTCheckbox">
              <label for="pct95RTCheckbox">95th Percentile RT</label>
            </div>
            <div class="checkbox-item">
              <input type="checkbox" id="pct99RTCheckbox">
              <label for="pct99RTCheckbox">99th Percentile RT</label>
            </div>
            <div class="checkbox-item">
              <input type="checkbox" id="errorPctCheckbox" checked>
              <label for="errorPctCheckbox">Error %</label>
            </div>
            <div class="checkbox-item">
              <input type="checkbox" id="errorsCheckbox" checked>
              <label for="errorsCheckbox">Errors</label>
            </div>
            <div class="checkbox-item">
              <input type="checkbox" id="throughputCheckbox" checked>
              <label for="throughputCheckbox">Throughput</label>
            </div>
            <div class="checkbox-item">
              <input type="checkbox" id="kbPerSecCheckbox">
              <label for="kbPerSecCheckbox">KB/sec</label>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="test-selector">
      <h4>Compare Tests</h4>
      <div class="row">
        <div class="col-md-5">
          <select id="test1Selector" class="form-select"></select>
        </div>
        <div class="col-md-5">
          <select id="test2Selector" class="form-select"></select>
        </div>
        <div class="col-md-2">
          <button id="compareBtn" class="btn btn-primary w-100">Compare</button>
        </div>
      </div>
    </div>
    
    <div id="comparisonSection" style="display: none;">
      <h3>Side by Side Comparison</h3>
      <div class="comparison-container" id="comparisonContainer">
        <!-- Will be populated with comparison data -->
      </div>
    </div>
    
    <h3>Performance Trends</h3>
    <div id="chartsContainer">
      <!-- Charts will be dynamically added here based on selected metrics -->
    </div>
    
    <h3>Test Results History</h3>
    <div class="table-responsive">
      <table class="table table-striped">
        <thead>
          <tr>
            <th>Date</th>
            <th>Avg Response Time (ms)</th>
            <th>Min RT (ms)</th>
            <th>Max RT (ms)</th>
            <th>Median RT (ms)</th>
            <th>90th % RT (ms)</th>
            <th>95th % RT (ms)</th>
            <th>99th % RT (ms)</th>
            <th>Error Count</th>
            <th>Error %</th>
            <th>Throughput (req/s)</th>
            <th>KB/sec</th>
            <th>Samples</th>
          </tr>
        </thead>
        <tbody id="historyTable">
          <!-- Data will be loaded from history.json -->
        </tbody>
      </table>
    </div>
  </div>
  
  <script>
    // Global variables
    let allTests = [];
    let filteredTests = [];
    let charts = {};
    
    // Initialize the comparison page
    async function initComparison() {
      try {
        // Fetch the historical data
        const response = await fetch('history.json');
        if (!response.ok) {
          throw new Error('Failed to fetch history data');
        }
        
        const data = await response.json();
        
        // Sort tests by date (newest first)
        allTests = data.tests.sort((a, b) => {
          if (a.isCurrent) return -1;
          if (b.isCurrent) return 1;
          return new Date(b.date.replace(/_/g, ' ').replace(/-/g, ':')) - 
                 new Date(a.date.replace(/_/g, ' ').replace(/-/g, ':'));
        });
        
        // Set filtered tests initially to all tests
        filteredTests = [...allTests];
        
        // Initialize UI components
        initDateFilters();
        initMetricCheckboxes();
        populateTestSelectors();
        updateCharts();
        populateTable();
        
        // Set up event listeners
        document.getElementById('dateRangeFilter').addEventListener('change', handleDateRangeChange);
        document.getElementById('applyDateFilter').addEventListener('click', applyCustomDateFilter);
        document.querySelectorAll('.checkbox-group input[type="checkbox"]').forEach(checkbox => {
          checkbox.addEventListener('change', updateCharts);
        });
        document.getElementById('compareBtn').addEventListener('click', compareTests);
        
      } catch (error) {
        console.error('Error initializing comparison page:', error);
        document.body.innerHTML = `
          <div class="container">
            <div class="alert alert-danger">
              <h4>Error Loading Data</h4>
              <p>${error.message}</p>
            </div>
          </div>
        `;
      }
    }
    
    // Initialize date filters
    function initDateFilters() {
      const today = new Date();
      const startDateInput = document.getElementById('startDate');
      const endDateInput = document.getElementById('endDate');
      
      // Set default dates (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      startDateInput.valueAsDate = thirtyDaysAgo;
      endDateInput.valueAsDate = today;
    }
    
    // Handle date range filter change
    function handleDateRangeChange() {
      const dateRange = document.getElementById('dateRangeFilter').value;
      const startDateInput = document.getElementById('startDate');
      const endDateInput = document.getElementById('endDate');
      const applyButton = document.getElementById('applyDateFilter');
      
      if (dateRange === 'custom') {
        startDateInput.style.display = 'block';
        endDateInput.style.display = 'block';
        applyButton.style.display = 'block';
      } else {
        startDateInput.style.display = 'none';
        endDateInput.style.display = 'none';
        applyButton.style.display = 'none';
        
        // Apply the selected filter
        applyDateFilter(dateRange);
      }
    }
    
    // Apply date filter based on selection
    function applyDateFilter(dateRange) {
      const now = new Date();
      let startDate;
      
      switch(dateRange) {
        case '7d':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 90);
          break;
        case 'all':
        default:
          // No filtering, show all tests
          filteredTests = [...allTests];
          updateCharts();
          populateTable();
          populateTestSelectors();
          return;
      }
      
      // Filter tests based on date range
      filteredTests = allTests.filter(test => {
        // Always include current test
        if (test.isCurrent) return true;
        
        const testDate = new Date(test.date.replace(/_/g, ' ').replace(/-/g, ':'));
        return testDate >= startDate;
      });
      
      // Update UI with filtered data
      updateCharts();
      populateTable();
      populateTestSelectors();
    }
    
    // Apply custom date filter
    function applyCustomDateFilter() {
      const startDate = new Date(document.getElementById('startDate').value);
      const endDate = new Date(document.getElementById('endDate').value);
      
      // Add one day to end date to include the end date in the range
      endDate.setDate(endDate.getDate() + 1);
      
      // Filter tests based on custom date range
      filteredTests = allTests.filter(test => {
        // Always include current test
        if (test.isCurrent) return true;
        
        const testDate = new Date(test.date.replace(/_/g, ' ').replace(/-/g, ':'));
        return testDate >= startDate && testDate <= endDate;
      });
      
      // Update UI with filtered data
      updateCharts();
      populateTable();
      populateTestSelectors();
    }
    
    // Initialize metric checkboxes
    function initMetricCheckboxes() {
      // Set default checkboxes
      document.getElementById('avgRTCheckbox').checked = true;
      document.getElementById('throughputCheckbox').checked = true;
      document.getElementById('errorsCheckbox').checked = true;
    }
    
    // Populate test selectors for comparison
    function populateTestSelectors() {
      const test1Selector = document.getElementById('test1Selector');
      const test2Selector = document.getElementById('test2Selector');
      
      // Clear existing options
      test1Selector.innerHTML = '';
      test2Selector.innerHTML = '';
      
      // Add options for each test
      filteredTests.forEach((test, index) => {
        const option1 = document.createElement('option');
        const option2 = document.createElement('option');
        
        const displayDate = formatDate(test.date);
        const label = test.isCurrent ? `Current Test (${displayDate})` : displayDate;
        
        option1.value = index;
        option1.textContent = label;
        
        option2.value = index;
        option2.textContent = label;
        
        test1Selector.appendChild(option1);
        test2Selector.appendChild(option2);
      });
      
      // Set default selections (current test and previous test)
      if (filteredTests.length > 1) {
        test1Selector.selectedIndex = 0; // Current test
        test2Selector.selectedIndex = 1; // Second most recent test
      }
    }
    
    // Update charts based on selected metrics
    function updateCharts() {
      const chartsContainer = document.getElementById('chartsContainer');
      chartsContainer.innerHTML = '';
      
      // Get selected metrics
      const selectedMetrics = {
        avgResponseTime: document.getElementById('avgRTCheckbox').checked,
        minResponseTime: document.getElementById('minRTCheckbox').checked,
        maxResponseTime: document.getElementById('maxRTCheckbox').checked,
        medianResponseTime: document.getElementById('medianRTCheckbox').checked,
        pct90ResponseTime: document.getElementById('pct90RTCheckbox').checked,
        pct95ResponseTime: document.getElementById('pct95RTCheckbox').checked,
        pct99ResponseTime: document.getElementById('pct99RTCheckbox').checked,
        errorCount: document.getElementById('errorsCheckbox').checked,
        errorPct: document.getElementById('errorPctCheckbox').checked,
        throughput: document.getElementById('throughputCheckbox').checked,
        kbPerSec: document.getElementById('kbPerSecCheckbox').checked
      };
      
      // Create charts for selected metrics
      if (selectedMetrics.avgResponseTime) {
        createChart('avgResponseTime', 'Average Response Time (ms)', '#3498db');
      }
      
      if (selectedMetrics.minResponseTime) {
        createChart('minResponseTime', 'Min Response Time (ms)', '#2ecc71');
      }
      
      if (selectedMetrics.maxResponseTime) {
        createChart('maxResponseTime', 'Max Response Time (ms)', '#e74c3c');
      }
      
      if (selectedMetrics.medianResponseTime) {
        createChart('medianResponseTime', 'Median Response Time (ms)', '#34495e');
      }
      
      if (selectedMetrics.pct90ResponseTime) {
        createChart('pct90ResponseTime', '90th Percentile RT (ms)', '#16a085');
      }
      
      if (selectedMetrics.pct95ResponseTime) {
        createChart('pct95ResponseTime', '95th Percentile RT (ms)', '#d35400');
      }
      
      if (selectedMetrics.pct99ResponseTime) {
        createChart('pct99ResponseTime', '99th Percentile RT (ms)', '#c0392b');
      }
      
      if (selectedMetrics.errorCount) {
        createChart('errorCount', 'Error Count', '#e74c3c');
      }
      
      if (selectedMetrics.errorPct) {
        createChart('errorPct', 'Error Percentage (%)', '#e74c3c');
      }
      
      if (selectedMetrics.throughput) {
        createChart('throughput', 'Throughput (req/s)', '#9b59b6');
      }
      
      if (selectedMetrics.kbPerSec) {
        createChart('kbPerSec', 'KB/sec', '#f39c12');
      }
    }
    
    // Create a chart for a specific metric
    function createChart(metric, label, color) {
      const chartsContainer = document.getElementById('chartsContainer');
      
      // Create chart container
      const chartContainer = document.createElement('div');
      chartContainer.className = 'chart-container-large';
      chartsContainer.appendChild(chartContainer);
      
      // Create canvas for the chart
      const canvas = document.createElement('canvas');
      chartContainer.appendChild(canvas);
      
      // Prepare chart data
      const dates = filteredTests.map(test => formatDate(test.date));
      const metricValues = filteredTests.map(test => test[metric]);
      
      // Create chart
      const ctx = canvas.getContext('2d');
      const isErrorChart = metric === 'errorCount';
      
      charts[metric] = new Chart(ctx, {
        type: 'line',
        data: {
          labels: dates,
          datasets: [{
            label: label,
            data: metricValues,
            backgroundColor: `${color}33`, // Add transparency
            borderColor: color,
            borderWidth: 2,
            fill: true,
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }
    
    // Populate the history table
    function populateTable() {
      const tableBody = document.getElementById('historyTable');
      tableBody.innerHTML = '';
      
      filteredTests.forEach(test => {
        const row = document.createElement('tr');
        if (test.isCurrent) {
          row.className = 'current';
        }
        
        row.innerHTML = `
          <td>${formatDate(test.date)}</td>
          <td>${test.avgResponseTime}</td>
          <td>${test.minResponseTime}</td>
          <td>${test.maxResponseTime}</td>
          <td>${test.medianResponseTime}</td>
          <td>${test.pct90ResponseTime}</td>
          <td>${test.pct95ResponseTime}</td>
          <td>${test.pct99ResponseTime}</td>
          <td>${test.errorCount}</td>
          <td>${test.errorPct}%</td>
          <td>${test.throughput}</td>
          <td>${test.kbPerSec}</td>
          <td>${test.samples}</td>
        `;
        
        tableBody.appendChild(row);
      });
    }
    
    // Compare two selected tests
    function compareTests() {
      const test1Index = parseInt(document.getElementById('test1Selector').value);
      const test2Index = parseInt(document.getElementById('test2Selector').value);
      
      if (test1Index === test2Index) {
        alert('Please select two different tests to compare');
        return;
      }
      
      const test1 = filteredTests[test1Index];
      const test2 = filteredTests[test2Index];
      
      const comparisonSection = document.getElementById('comparisonSection');
      const comparisonContainer = document.getElementById('comparisonContainer');
      
      comparisonSection.style.display = 'block';
      comparisonContainer.innerHTML = '';
      
      // Calculate changes
      const avgRTChange = calculateChange(test1.avgResponseTime, test2.avgResponseTime);
      const minRTChange = calculateChange(test1.minResponseTime, test2.minResponseTime);
      const maxRTChange = calculateChange(test1.maxResponseTime, test2.maxResponseTime);
      const medianRTChange = calculateChange(test1.medianResponseTime, test2.medianResponseTime);
      const pct90RTChange = calculateChange(test1.pct90ResponseTime, test2.pct90ResponseTime);
      const pct95RTChange = calculateChange(test1.pct95ResponseTime, test2.pct95ResponseTime);
      const pct99RTChange = calculateChange(test1.pct99ResponseTime, test2.pct99ResponseTime);
      const errorChange = calculateChange(test1.errorCount, test2.errorCount);
      const errorPctChange = calculateChange(test1.errorPct, test2.errorPct, true);
      const throughputChange = calculateChange(test1.throughput, test2.throughput, true);
      const kbPerSecChange = calculateChange(test1.kbPerSec, test2.kbPerSec, true);
      
      // Create metric cards for each compared metric
      comparisonContainer.innerHTML = `
        <div class="metric-card">
          <div class="metric-label">Average Response Time</div>
          <div class="metric-value">${test1.avgResponseTime} ms</div>
          <div class="metric-comparison ${avgRTChange.class}">${avgRTChange.text}</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-label">Average Response Time</div>
          <div class="metric-value">${test2.avgResponseTime} ms</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-label">Min Response Time</div>
          <div class="metric-value">${test1.minResponseTime} ms</div>
          <div class="metric-comparison ${minRTChange.class}">${minRTChange.text}</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-label">Min Response Time</div>
          <div class="metric-value">${test2.minResponseTime} ms</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-label">Max Response Time</div>
          <div class="metric-value">${test1.maxResponseTime} ms</div>
          <div class="metric-comparison ${maxRTChange.class}">${maxRTChange.text}</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-label">Max Response Time</div>
          <div class="metric-value">${test2.maxResponseTime} ms</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-label">Median Response Time</div>
          <div class="metric-value">${test1.medianResponseTime} ms</div>
          <div class="metric-comparison ${medianRTChange.class}">${medianRTChange.text}</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-label">Median Response Time</div>
          <div class="metric-value">${test2.medianResponseTime} ms</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-label">90th Percentile RT</div>
          <div class="metric-value">${test1.pct90ResponseTime} ms</div>
          <div class="metric-comparison ${pct90RTChange.class}">${pct90RTChange.text}</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-label">90th Percentile RT</div>
          <div class="metric-value">${test2.pct90ResponseTime} ms</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-label">95th Percentile RT</div>
          <div class="metric-value">${test1.pct95ResponseTime} ms</div>
          <div class="metric-comparison ${pct95RTChange.class}">${pct95RTChange.text}</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-label">95th Percentile RT</div>
          <div class="metric-value">${test2.pct95ResponseTime} ms</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-label">99th Percentile RT</div>
          <div class="metric-value">${test1.pct99ResponseTime} ms</div>
          <div class="metric-comparison ${pct99RTChange.class}">${pct99RTChange.text}</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-label">99th Percentile RT</div>
          <div class="metric-value">${test2.pct99ResponseTime} ms</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-label">Error Count</div>
          <div class="metric-value">${test1.errorCount}</div>
          <div class="metric-comparison ${errorChange.class}">${errorChange.text}</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-label">Error Count</div>
          <div class="metric-value">${test2.errorCount}</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-label">Error Percentage</div>
          <div class="metric-value">${test1.errorPct}%</div>
          <div class="metric-comparison ${errorPctChange.class}">${errorPctChange.text}</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-label">Error Percentage</div>
          <div class="metric-value">${test2.errorPct}%</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-label">Throughput</div>
          <div class="metric-value">${test1.throughput} req/s</div>
          <div class="metric-comparison ${throughputChange.class}">${throughputChange.text}</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-label">Throughput</div>
          <div class="metric-value">${test2.throughput} req/s</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-label">KB/sec</div>
          <div class="metric-value">${test1.kbPerSec}</div>
          <div class="metric-comparison ${kbPerSecChange.class}">${kbPerSecChange.text}</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-label">KB/sec</div>
          <div class="metric-value">${test2.kbPerSec}</div>
        </div>
      `;
    }
    
    // Calculate change between two values
    function calculateChange(current, previous, higherIsBetter = false) {
      if (previous === 0) return { text: 'N/A', class: '' };
      
      const diff = current - previous;
      const percentChange = (diff / previous * 100).toFixed(2);
      
      let isImprovement;
      
      if (higherIsBetter) {
        // For metrics where higher is better (throughput, etc.)
        isImprovement = diff > 0;
      } else {
        // For metrics where lower is better (response time, errors)
        isImprovement = diff < 0;
      }
      
      const prefix = diff > 0 ? '+' : '';
      const text = `${prefix}${diff.toFixed(2)} (${prefix}${percentChange}%)`;
      const className = isImprovement ? 'improvement' : 'degradation';
      
      return { text, class: className };
    }
    
    // Format date for display
    function formatDate(dateStr) {
      return dateStr.replace(/_/g, ' ').replace(/-/g, ':');
    }
    
    // Initialize the page when DOM content is loaded
    window.addEventListener('DOMContentLoaded', initComparison);
  </script>
</body>
</html>
EOL

echo "HTML comparison page generated successfully!" 
