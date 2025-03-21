/**
 * JMeter Test Comparison Viewer
 * 
 * This script handles the comparison of JMeter test results.
 */

// Global variables
let allTests = [];
let baselineTest = null;
let currentTest = null;

// Initialize the page when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Main initialization function
async function init() {
    try {
        console.log("Initializing JMeter Test Comparison Viewer...");
        
        // Fetch the test history data
        const historyData = await fetchHistoryData();
        
        if (historyData && historyData.tests && historyData.tests.length > 0) {
            allTests = historyData.tests;
            populateSelectors();
            setupEventListeners();
                } else {
            showError("No test data found. Please run some JMeter tests first.");
        }
    } catch (error) {
        showError("Error loading comparison viewer: " + error.message);
    }
}

// Fetch test history data
async function fetchHistoryData() {
    try {
        const response = await fetch('../history/history.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch history data: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching history data:", error);
        showError(`Error fetching history data: ${error.message}`);
        return null;
    }
}

// Populate test selectors with available tests
function populateSelectors() {
    const baselineSelector = document.getElementById('baselineSelector');
    const currentSelector = document.getElementById('currentSelector');
    
    // Clear existing options (except the first one)
    baselineSelector.innerHTML = '<option value="" selected>Select a baseline test...</option>';
    currentSelector.innerHTML = '<option value="" selected>Select a current test...</option>';
    
    // Create a unique list of test dates (timestamps)
    const uniqueDates = [...new Set(allTests.map(test => test.timestamp))];
    uniqueDates.sort().reverse(); // Sort in descending order
    
    // Add options for each unique date
    uniqueDates.forEach(date => {
        // Format the date for display
        const displayDate = formatTimestamp(date);
        
        // Add to baseline selector
        const baselineOption = document.createElement('option');
        baselineOption.value = date;
        baselineOption.textContent = displayDate;
        baselineSelector.appendChild(baselineOption);
        
        // Add to current selector
        const currentOption = document.createElement('option');
        currentOption.value = date;
        currentOption.textContent = displayDate;
        currentSelector.appendChild(currentOption);
    });
    
    // Pre-select the two most recent dates if available
    if (uniqueDates.length >= 2) {
        currentSelector.value = uniqueDates[0];
        baselineSelector.value = uniqueDates[1];
    } else if (uniqueDates.length === 1) {
        currentSelector.value = uniqueDates[0];
    }
}

// Set up event listeners
function setupEventListeners() {
    const compareBtn = document.getElementById('compareBtn');
    compareBtn.addEventListener('click', handleCompare);
}

// Handle the compare button click
function handleCompare() {
    const baselineSelector = document.getElementById('baselineSelector');
    const currentSelector = document.getElementById('currentSelector');
    
    const baselineTimestamp = baselineSelector.value;
    const currentTimestamp = currentSelector.value;
    
    if (!baselineTimestamp || !currentTimestamp) {
        alert('Please select both a baseline and current test.');
        return;
    }
    
    // Get tests from the selected timestamps
    const baselineTests = allTests.filter(test => test.timestamp === baselineTimestamp);
    const currentTests = allTests.filter(test => test.timestamp === currentTimestamp);
    
    if (baselineTests.length === 0 || currentTests.length === 0) {
        alert('Could not find test data for the selected timestamps.');
        return;
    }
    
    // Show the comparison content and hide the no data message
    document.getElementById('comparisonContent').style.display = 'block';
    document.getElementById('noDataMessage').style.display = 'none';
    
    // Create comparisons for each test type
    compareTestSets(baselineTests, currentTests);
}

// Compare sets of tests
function compareTestSets(baselineTests, currentTests) {
    // Get all unique test names
    const allTestNames = [...new Set([
        ...baselineTests.map(test => test.test),
        ...currentTests.map(test => test.test)
    ])];
    
    // Generate charts for the tests
    generateCharts(baselineTests, currentTests, allTestNames);
    
    // Generate the comparison table
    generateComparisonTable(baselineTests, currentTests, allTestNames);
}

// Generate comparison charts
function generateCharts(baselineTests, currentTests, testNames) {
    // Prepare data for the success rate chart
    const successChartCtx = document.getElementById('successRateChart').getContext('2d');
    
    const successRateData = {
        labels: testNames,
        datasets: [
            {
                label: 'Baseline Success Rate (%)',
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgb(54, 162, 235)',
                borderWidth: 1,
                data: testNames.map(testName => {
                    const test = baselineTests.find(t => t.test === testName);
                    return test ? test.success_rate : 0;
                })
            },
            {
                label: 'Current Success Rate (%)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderColor: 'rgb(75, 192, 192)',
                borderWidth: 1,
                data: testNames.map(testName => {
                    const test = currentTests.find(t => t.test === testName);
                    return test ? test.success_rate : 0;
                })
            }
        ]
    };
    
    // Create the success rate chart
    new Chart(successChartCtx, {
        type: 'bar',
        data: successRateData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Success Rate (%)'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Success Rate Comparison'
                }
            }
        }
    });
    
    // Prepare data for the response time chart
    const responseTimeCtx = document.getElementById('responseTimeChart').getContext('2d');
    
    const responseTimeData = {
        labels: testNames,
        datasets: [
            {
                label: 'Baseline Response Time (ms)',
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgb(54, 162, 235)',
                borderWidth: 1,
                data: testNames.map(testName => {
                    const test = baselineTests.find(t => t.test === testName);
                    return test ? test.avg_response_time : 0;
                })
            },
            {
                label: 'Current Response Time (ms)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderColor: 'rgb(75, 192, 192)',
                borderWidth: 1,
                data: testNames.map(testName => {
                    const test = currentTests.find(t => t.test === testName);
                    return test ? test.avg_response_time : 0;
                })
            }
        ]
    };
    
    // Create the response time chart
    new Chart(responseTimeCtx, {
        type: 'bar',
        data: responseTimeData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Average Response Time (ms)'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Response Time Comparison'
                }
            }
        }
    });
}

// Generate the comparison table
function generateComparisonTable(baselineTests, currentTests, testNames) {
    const tableBody = document.getElementById('comparisonTable');
    tableBody.innerHTML = '';
    
    // Add a row for each test
    testNames.forEach(testName => {
        const baselineTest = baselineTests.find(t => t.test === testName);
        const currentTest = currentTests.find(t => t.test === testName);
        
        if (baselineTest && currentTest) {
            // Success Rate row
            addComparisonRow(
                tableBody, 
                `${testName} - Success Rate (%)`, 
                baselineTest.success_rate.toFixed(2) + '%', 
                currentTest.success_rate.toFixed(2) + '%',
                calculateChange(baselineTest.success_rate, currentTest.success_rate),
                getStatusBadge(baselineTest.success_rate, currentTest.success_rate, true)
            );
            
            // Response Time row
            addComparisonRow(
                tableBody, 
                `${testName} - Response Time (ms)`, 
                baselineTest.avg_response_time.toFixed(2) + ' ms', 
                currentTest.avg_response_time.toFixed(2) + ' ms',
                calculateChange(baselineTest.avg_response_time, currentTest.avg_response_time, false),
                getStatusBadge(baselineTest.avg_response_time, currentTest.avg_response_time, false)
            );
        } else if (baselineTest) {
            // Only baseline test exists
            addComparisonRow(
                tableBody, 
                `${testName} - Success Rate (%)`, 
                baselineTest.success_rate.toFixed(2) + '%', 
                'N/A',
                'N/A',
                '<span class="badge bg-secondary">No Data</span>'
            );
            
            addComparisonRow(
                tableBody, 
                `${testName} - Response Time (ms)`, 
                baselineTest.avg_response_time.toFixed(2) + ' ms', 
                'N/A',
                'N/A',
                '<span class="badge bg-secondary">No Data</span>'
            );
        } else if (currentTest) {
            // Only current test exists
            addComparisonRow(
                tableBody, 
                `${testName} - Success Rate (%)`, 
                'N/A', 
                currentTest.success_rate.toFixed(2) + '%',
                'N/A',
                '<span class="badge bg-secondary">New Test</span>'
            );
            
            addComparisonRow(
                tableBody, 
                `${testName} - Response Time (ms)`, 
                'N/A', 
                currentTest.avg_response_time.toFixed(2) + ' ms',
                'N/A',
                '<span class="badge bg-secondary">New Test</span>'
            );
        }
    });
}

// Add a row to the comparison table
function addComparisonRow(tableBody, metric, baseline, current, change, status) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${metric}</td>
        <td>${baseline}</td>
        <td>${current}</td>
        <td>${change}</td>
        <td>${status}</td>
    `;
    tableBody.appendChild(row);
}

// Calculate the change between baseline and current values
function calculateChange(baseline, current, higherIsBetter = true) {
    if (typeof baseline !== 'number' || typeof current !== 'number') {
        return 'N/A';
    }
    
    const difference = current - baseline;
    const percentChange = (difference / baseline) * 100;
    
    const sign = difference > 0 ? '+' : '';
    return `${sign}${difference.toFixed(2)} (${sign}${percentChange.toFixed(2)}%)`;
}

// Get a status badge for the comparison
function getStatusBadge(baseline, current, higherIsBetter = true) {
    if (typeof baseline !== 'number' || typeof current !== 'number') {
        return '<span class="badge bg-secondary">No Data</span>';
    }
    
    const difference = current - baseline;
    const percentChange = (difference / baseline) * 100;
    
    // For success rate, higher is better
    // For response time, lower is better
    let isImprovement = higherIsBetter ? difference > 0 : difference < 0;
    
    // Consider small changes (less than 5%) as neutral
    if (Math.abs(percentChange) < 5) {
        return '<span class="badge bg-secondary">Neutral</span>';
    }
    
    if (isImprovement) {
        return '<span class="badge bg-success">Improved</span>';
    } else {
        return '<span class="badge bg-danger">Degraded</span>';
    }
}

// Format timestamp for display
function formatTimestamp(timestamp) {
    return timestamp.replace(/_/g, ' ').replace(/(\d{4})-(\d{2})-(\d{2}) (\d{2})-(\d{2})-(\d{2})/, '$1-$2-$3 $4:$5:$6');
}

// Show an error message
function showError(message) {
    const noDataMessage = document.getElementById('noDataMessage');
    noDataMessage.innerHTML = `
        <h4 class="alert-heading">Error</h4>
        <p>${message}</p>
        <p>Please check that your JMeter tests are running correctly and that the history.json file exists.</p>
    `;
    noDataMessage.className = 'alert alert-danger mt-4';
} 