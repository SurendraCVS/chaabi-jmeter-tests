/**
 * JMeter Test Comparison Viewer
 * 
 * This script handles the functionality of comparing test reports with visual graphs.
 * It loads test history data and generates visualizations for comparing metrics.
 */

// Global variables
let allTests = [];
let baselineTest = null;
let currentTest = null;
let charts = {};

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

async function init() {
    try {
        console.log("Initializing JMeter Test Comparison Viewer...");
        
        // Debug the tab elements
        debugTabElements();
        
        // Try multiple possible paths to find history.json
        let response;
        let historyPaths = [
            './history/history.json',                // Current directory
            '../reports/history/history.json',       // One level up in reports
            'history/history.json',                  // Relative from current
            '../history/history.json',               // One level up
            '../../history/history.json',            // Two levels up
            './jmeter-pages/history/history.json',   // In jmeter-pages subdirectory
            '../jmeter-pages/history/history.json',  // One level up in jmeter-pages
            '/history/history.json',                 // From root
            '/jmeter-pages/history/history.json',    // From root in jmeter-pages
            '/chaabi-jmeter-tests/reports/history/history.json', // Full path from root
            './reports/history/history.json',        // Relative to current in reports
            'reports/history/history.json'           // No leading ./
        ];
        
        console.log("Attempting to load history.json from multiple paths...");
        console.log("Current window location:", window.location.href);
        
        // Try each path until one works
        for (const path of historyPaths) {
            try {
                console.log(`Trying path: ${path}`);
                response = await fetch(path, {
                    method: 'GET',
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    }
                });
                
                if (response.ok) {
                    console.log(`Found history.json at: ${path}`);
                    break;
                } else {
                    console.log(`Path ${path} returned status: ${response.status}`);
                }
            } catch (e) {
                console.log(`Path ${path} failed: ${e.message}`);
                // Continue to next path
            }
        }
        
        if (!response || !response.ok) {
            throw new Error('Failed to fetch history data from any known location');
        }
        
        console.log("Successfully loaded history.json, parsing data...");
        const data = await response.json();
        console.log("History data:", data);
        
        if (!data || !data.tests || !Array.isArray(data.tests)) {
            throw new Error('History data is not in the expected format. Expected a "tests" array.');
        }
        
        // Sort tests by date (newest first)
        allTests = data.tests.sort((a, b) => {
            if (a.isCurrent) return -1;
            if (b.isCurrent) return 1;
            return new Date(b.date?.replace(/_/g, ' ')?.replace(/-/g, ':') || 0) - 
                   new Date(a.date?.replace(/_/g, ' ')?.replace(/-/g, ':') || 0);
        });
        
        console.log(`Found ${allTests.length} tests in history`);
        
        // Check if we have tests to display
        if (allTests.length === 0) {
            // Create a sample test if no tests are available
            console.log("No tests found, creating sample test data for demonstration");
            createSampleTestData();
        }
        
        // Populate test selectors and history list
        populateTestSelectors();
        populateHistoryList();
        
        // Set up event listeners
        document.getElementById('compareBtn').addEventListener('click', compareTests);
        setupHistoryEventListeners();
        
        // Make sure Bootstrap tab functionality is working
        setupTabNavigation();
        
        // Add a direct access button to the history tab
        addHistoryAccessButton();
        
    } catch (error) {
        console.error('Error initializing comparison viewer:', error);
        document.body.innerHTML = `
            <div class="container">
                <div class="alert alert-danger mt-5">
                    <h4>Error Loading Data</h4>
                    <p>${error.message}</p>
                    <p>This might happen if:</p>
                    <ul>
                        <li>No tests have been run yet</li>
                        <li>The history.json file is not in the expected location</li>
                        <li>There was an error processing the history data</li>
                    </ul>
                    <p>Please run a test first to generate historical data.</p>
                    <p>Attempted to load from the following paths:</p>
                    <ul>
                        ${historyPaths.map(path => `<li>${path}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    }
}

/**
 * Debug tab elements to check what might be wrong
 */
function debugTabElements() {
    console.log("Debugging tab elements...");
    
    // Check if history tab exists
    const historyTab = document.getElementById('history-tab');
    if (historyTab) {
        console.log("✅ History tab found:", historyTab);
    } else {
        console.error("❌ History tab not found");
        // Try to create it if it doesn't exist
        createHistoryTabIfMissing();
    }
    
    // Check if history pane exists
    const historyPane = document.getElementById('history');
    if (historyPane) {
        console.log("✅ History pane found:", historyPane);
    } else {
        console.error("❌ History pane not found");
    }
    
    // Check Bootstrap
    if (typeof bootstrap !== 'undefined') {
        console.log("✅ Bootstrap JS is loaded");
    } else {
        console.error("❌ Bootstrap JS is not loaded");
    }
}

/**
 * Creates the history tab if it doesn't exist
 */
function createHistoryTabIfMissing() {
    console.log("Attempting to create missing history tab...");
    
    const viewTabs = document.getElementById('viewTabs');
    if (!viewTabs) {
        console.error("Cannot find the tabs container");
        return;
    }
    
    // Create history tab if missing
    if (!document.getElementById('history-tab')) {
        const historyTabLi = document.createElement('li');
        historyTabLi.className = 'nav-item';
        historyTabLi.setAttribute('role', 'presentation');
        historyTabLi.innerHTML = `
            <button class="nav-link" id="history-tab" data-bs-toggle="tab" data-bs-target="#history" 
                    type="button" role="tab" aria-controls="history" aria-selected="false">
                Test History
            </button>
        `;
        viewTabs.appendChild(historyTabLi);
        console.log("Created history tab");
    }
    
    // Create history pane if missing
    const viewTabsContent = document.getElementById('viewTabsContent');
    if (viewTabsContent && !document.getElementById('history')) {
        const historyPane = document.createElement('div');
        historyPane.className = 'tab-pane fade';
        historyPane.id = 'history';
        historyPane.setAttribute('role', 'tabpanel');
        historyPane.setAttribute('aria-labelledby', 'history-tab');
        historyPane.innerHTML = `
            <div class="history-tab">
                <h3>Test History</h3>
                <div class="history-list" id="historyList">
                    <!-- History items will be populated here -->
                    <div class="text-center my-5">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="mt-3">Loading history data...</p>
                    </div>
                </div>
            </div>
        `;
        viewTabsContent.appendChild(historyPane);
        console.log("Created history pane");
    }
}

/**
 * Adds a direct access button to the history tab
 */
function addHistoryAccessButton() {
    const container = document.querySelector('.container');
    if (!container) return;
    
    const buttonDiv = document.createElement('div');
    buttonDiv.className = 'text-center mt-3 mb-3';
    buttonDiv.innerHTML = `
        <button id="directHistoryButton" class="btn btn-primary">
            <i class="bi bi-clock-history"></i> View Test History
        </button>
    `;
    
    // Insert after the debug info if it exists, otherwise at the beginning
    const debugInfo = document.getElementById('debugInfo');
    if (debugInfo) {
        debugInfo.after(buttonDiv);
    } else {
        container.prepend(buttonDiv);
    }
    
    // Add click handler
    document.getElementById('directHistoryButton').addEventListener('click', () => {
        console.log("Direct history button clicked");
        const historyTab = document.getElementById('history-tab');
        if (historyTab) {
            console.log("Clicking history tab");
            historyTab.click();
        } else {
            console.error("Cannot find history tab");
            alert("History tab not found. Please check the console for more details.");
        }
    });
}

/**
 * Creates sample test data when no real tests are available yet
 * This is only for demonstration purposes until real tests are run
 */
function createSampleTestData() {
    // Create two sample tests
    const currentDate = new Date();
    const previousDate = new Date();
    previousDate.setDate(currentDate.getDate() - 1);
    
    // Format dates in the expected format
    const currentDateStr = currentDate.toISOString().replace(/:/g, '-').replace(/\..+/g, '').replace('T', '_');
    const previousDateStr = previousDate.toISOString().replace(/:/g, '-').replace(/\..+/g, '').replace('T', '_');
    
    // Create sample test data
    allTests = [
        {
            id: currentDateStr,
            date: currentDateStr,
            samples: 1000,
            fail: 10,
            errorPct: 1.0,
            avgResponseTime: 250,
            minResponseTime: 50,
            maxResponseTime: 1200,
            medianResponseTime: 200,
            pct90ResponseTime: 400,
            pct95ResponseTime: 500,
            pct99ResponseTime: 700,
            throughput: 20.5,
            kbReceived: 150.2,
            kbSent: 85.3,
            isCurrent: true
        },
        {
            id: previousDateStr,
            date: previousDateStr,
            samples: 950,
            fail: 15,
            errorPct: 1.58,
            avgResponseTime: 300,
            minResponseTime: 60,
            maxResponseTime: 1500,
            medianResponseTime: 240,
            pct90ResponseTime: 450,
            pct95ResponseTime: 600,
            pct99ResponseTime: 900,
            throughput: 18.2,
            kbReceived: 140.5,
            kbSent: 80.1,
            isCurrent: false
        }
    ];
    
    console.log("Created sample test data:", allTests);
}

/**
 * Populates the test selector dropdowns with available tests
 */
function populateTestSelectors() {
    const baselineSelector = document.getElementById('baselineSelector');
    const currentSelector = document.getElementById('currentSelector');
    
    // Clear existing options
    baselineSelector.innerHTML = '';
    currentSelector.innerHTML = '';
    
    // Add options for each test
    allTests.forEach((test, index) => {
        const baselineOption = document.createElement('option');
        const currentOption = document.createElement('option');
        
        const displayDate = formatDate(test.date);
        const label = test.isCurrent ? `Current Test (${displayDate})` : displayDate;
        
        baselineOption.value = index;
        baselineOption.textContent = label;
        
        currentOption.value = index;
        currentOption.textContent = label;
        
        baselineSelector.appendChild(baselineOption);
        currentSelector.appendChild(currentOption);
    });
    
    // Set default selections (current test and previous test)
    if (allTests.length > 1) {
        currentSelector.selectedIndex = 0; // Current test
        baselineSelector.selectedIndex = 1; // Second most recent test
    }
}

/**
 * Populates the history list with all available test runs
 */
function populateHistoryList() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    
    // Add selection controls at the top
    const selectionControls = document.createElement('div');
    selectionControls.className = 'mb-3 p-2 bg-light rounded';
    selectionControls.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <div>
                <h5 class="mb-0">Select tests to compare</h5>
                <small class="text-muted">Select two test runs to compare their results</small>
            </div>
            <button id="historyCompareBtn" class="btn btn-primary" disabled>Compare Selected</button>
        </div>
        <div id="selectedTests" class="d-flex gap-2">
            <span class="badge bg-secondary p-2">No tests selected</span>
        </div>
    `;
    historyList.appendChild(selectionControls);
    
    // Create a container for the test items
    const testsContainer = document.createElement('div');
    testsContainer.className = 'history-items mt-3';
    historyList.appendChild(testsContainer);

    // Add test items
    allTests.forEach((test, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.setAttribute('data-test-index', index);

        const date = formatDate(test.date);
        const status = test.isCurrent ? ' (Current)' : '';
        
        historyItem.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div class="form-check">
                    <input class="form-check-input test-selector" type="checkbox" value="${index}" id="test-${index}">
                    <label class="form-check-label" for="test-${index}">
                        <strong>${date}${status}</strong>
                        <div class="text-muted small">
                            Samples: ${test.samples} | 
                            Avg RT: ${test.avgResponseTime}ms | 
                            Error Rate: ${test.errorPct}%
                        </div>
                    </label>
                </div>
                <div>
                    <button class="btn btn-sm btn-outline-secondary view-btn me-2" data-test-index="${index}">
                        <i class="bi bi-eye"></i> View
                    </button>
                    <button class="btn btn-sm btn-outline-primary quick-compare-btn" data-test-index="${index}">
                        Quick Compare
                    </button>
                </div>
            </div>
        `;

        testsContainer.appendChild(historyItem);
    });
}

/**
 * Sets up event listeners for history functionality
 */
function setupHistoryEventListeners() {
    const historyList = document.getElementById('historyList');
    
    // Track selected tests
    let selectedTests = [];
    const compareBtn = document.getElementById('historyCompareBtn');
    const updateCompareBtn = () => {
        compareBtn.disabled = selectedTests.length !== 2;
    };
    
    // Update selected tests display
    const updateSelectedDisplay = () => {
        const selectedDisplay = document.getElementById('selectedTests');
        if (selectedTests.length === 0) {
            selectedDisplay.innerHTML = `<span class="badge bg-secondary p-2">No tests selected</span>`;
        } else {
            selectedDisplay.innerHTML = selectedTests.map(index => {
                const test = allTests[index];
                const date = formatDate(test.date);
                return `
                    <span class="badge bg-primary p-2 d-flex align-items-center">
                        ${date}
                        <button class="btn-close btn-close-white ms-2" data-remove-index="${index}" aria-label="Remove"></button>
                    </span>
                `;
            }).join('');
            
            // Add event listeners to the remove buttons
            selectedDisplay.querySelectorAll('.btn-close').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const removeIndex = e.target.getAttribute('data-remove-index');
                    selectedTests = selectedTests.filter(index => index != removeIndex);
                    
                    // Also uncheck the corresponding checkbox
                    const checkbox = document.getElementById(`test-${removeIndex}`);
                    if (checkbox) checkbox.checked = false;
                    
                    updateSelectedDisplay();
                    updateCompareBtn();
                });
            });
        }
    };
    
    // Handle checkbox selection
    historyList.addEventListener('change', (e) => {
        if (e.target.matches('.test-selector')) {
            const index = parseInt(e.target.value);
            
            if (e.target.checked) {
                // If already have 2 selected, remove the oldest one
                if (selectedTests.length >= 2) {
                    const oldestIndex = selectedTests[0];
                    const oldCheckbox = document.getElementById(`test-${oldestIndex}`);
                    if (oldCheckbox) oldCheckbox.checked = false;
                    selectedTests.shift();
                }
                selectedTests.push(index);
            } else {
                selectedTests = selectedTests.filter(i => i !== index);
            }
            
            updateSelectedDisplay();
            updateCompareBtn();
        }
    });
    
    // Handle compare button click
    compareBtn.addEventListener('click', () => {
        if (selectedTests.length === 2) {
            // Set the current test as the newest selected one
            document.getElementById('currentSelector').value = selectedTests[1];
            
            // Set the baseline as the older selected test
            document.getElementById('baselineSelector').value = selectedTests[0];
            
            // Switch to compare tab and trigger comparison
            document.getElementById('compare-tab').click();
            compareTests();
        }
    });
    
    // Handle quick compare button
    historyList.addEventListener('click', (e) => {
        const quickCompareBtn = e.target.closest('.quick-compare-btn');
        if (quickCompareBtn) {
            const selectedIndex = parseInt(quickCompareBtn.getAttribute('data-test-index'));
            
            // Set the current test as the selected one
            document.getElementById('currentSelector').value = selectedIndex;
            
            // Set the baseline as the next most recent test or the oldest if this is the oldest
            const baselineIndex = selectedIndex === allTests.length - 1 ? 0 : selectedIndex + 1;
            document.getElementById('baselineSelector').value = baselineIndex;
            
            // Switch to compare tab and trigger comparison
            document.getElementById('compare-tab').click();
            compareTests();
        }
    });
    
    // Handle view test button
    historyList.addEventListener('click', (e) => {
        const viewBtn = e.target.closest('.view-btn');
        if (viewBtn) {
            const testIndex = parseInt(viewBtn.getAttribute('data-test-index'));
            const test = allTests[testIndex];
            
            // Show test details in a modal or new view
            showTestDetails(test);
        }
    });

    // Handle tab switching
    const viewTabs = document.getElementById('viewTabs');
    if (viewTabs) {
        viewTabs.addEventListener('shown.bs.tab', (e) => {
            if (e.target.id === 'history-tab') {
                // Refresh history list when switching to history tab
                populateHistoryList();
                
                // Reset selected tests
                selectedTests = [];
                updateSelectedDisplay();
                updateCompareBtn();
            }
        });
    }
}

/**
 * Shows detailed information for a single test
 */
function showTestDetails(test) {
    // Create modal for test details if it doesn't exist
    let modal = document.getElementById('testDetailsModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'testDetailsModal';
        modal.tabIndex = '-1';
        modal.setAttribute('aria-labelledby', 'testDetailsModalLabel');
        modal.setAttribute('aria-hidden', 'true');
        
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="testDetailsModalLabel">Test Details</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div id="testDetailsContent"></div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    // Populate test details
    const content = document.getElementById('testDetailsContent');
    const date = formatDate(test.date);
    
    content.innerHTML = `
        <h4>${date} ${test.isCurrent ? '(Current)' : ''}</h4>
        
        <div class="row mt-4">
            <div class="col-md-6">
                <div class="card mb-3">
                    <div class="card-header bg-light">Performance Metrics</div>
                    <div class="card-body">
                        <table class="table table-striped">
                            <tr>
                                <th>Total Samples</th>
                                <td>${test.samples}</td>
                            </tr>
                            <tr>
                                <th>Failed Samples</th>
                                <td>${test.fail}</td>
                            </tr>
                            <tr>
                                <th>Error Rate</th>
                                <td>${test.errorPct}%</td>
                            </tr>
                            <tr>
                                <th>Throughput</th>
                                <td>${test.throughput.toFixed(2)} req/sec</td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="card mb-3">
                    <div class="card-header bg-light">Response Times</div>
                    <div class="card-body">
                        <table class="table table-striped">
                            <tr>
                                <th>Average</th>
                                <td>${test.avgResponseTime} ms</td>
                            </tr>
                            <tr>
                                <th>Median</th>
                                <td>${test.medianResponseTime} ms</td>
                            </tr>
                            <tr>
                                <th>90% Percentile</th>
                                <td>${test.pct90ResponseTime} ms</td>
                            </tr>
                            <tr>
                                <th>95% Percentile</th>
                                <td>${test.pct95ResponseTime} ms</td>
                            </tr>
                            <tr>
                                <th>99% Percentile</th>
                                <td>${test.pct99ResponseTime} ms</td>
                            </tr>
                            <tr>
                                <th>Min</th>
                                <td>${test.minResponseTime} ms</td>
                            </tr>
                            <tr>
                                <th>Max</th>
                                <td>${test.maxResponseTime} ms</td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-header bg-light">Network</div>
                    <div class="card-body">
                        <table class="table table-striped">
                            <tr>
                                <th>KB Received/sec</th>
                                <td>${test.kbReceived.toFixed(2)} KB/sec</td>
                            </tr>
                            <tr>
                                <th>KB Sent/sec</th>
                                <td>${test.kbSent.toFixed(2)} KB/sec</td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Show the modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

/**
 * Formats a date string to a more readable format
 */
function formatDate(dateStr) {
    const date = new Date(dateStr.replace(/_/g, ' ').replace(/-/g, ':'));
    return date.toLocaleString();
}

/**
 * Compares two selected tests and generates visualizations
 */
function compareTests() {
    const baselineIndex = parseInt(document.getElementById('baselineSelector').value);
    const currentIndex = parseInt(document.getElementById('currentSelector').value);
    
    // Validate that two different tests were selected
    if (baselineIndex === currentIndex) {
        alert('Please select two different tests to compare');
        return;
    }
    
    // Get the selected tests
    baselineTest = allTests[baselineIndex];
    currentTest = allTests[currentIndex];
    
    // Clear any existing charts
    Object.values(charts).forEach(chart => chart.destroy?.());
    charts = {};
    
    // Show the comparison content
    document.getElementById('comparisonContent').style.display = 'block';
    
    // Generate all comparison visualizations
    generateSummary();
    generateRadarChart();
    generateBarCharts();
    generateComparisonTable();
    
    // Scroll to the comparison content
    document.getElementById('comparisonContent').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Generates a summary of key differences between the tests
 */
function generateSummary() {
    // Response Time Summary
    const avgRTDiff = calculatePercentChange(baselineTest.avgResponseTime, currentTest.avgResponseTime);
    const responseTimeSummary = document.getElementById('responseTimeSummary');
    const responseTimeIndicator = document.getElementById('responseTimeIndicator');
    
    if (avgRTDiff < 0) {
        // Improvement
        responseTimeSummary.textContent = `Average response time improved by ${Math.abs(avgRTDiff).toFixed(2)}% from ${baselineTest.avgResponseTime}ms to ${currentTest.avgResponseTime}ms.`;
        responseTimeIndicator.textContent = 'Improved';
        responseTimeIndicator.className = 'performance-indicator good';
    } else if (avgRTDiff > 0) {
        // Degradation
        responseTimeSummary.textContent = `Average response time degraded by ${avgRTDiff.toFixed(2)}% from ${baselineTest.avgResponseTime}ms to ${currentTest.avgResponseTime}ms.`;
        responseTimeIndicator.textContent = 'Degraded';
        responseTimeIndicator.className = 'performance-indicator bad';
    } else {
        // No change
        responseTimeSummary.textContent = `No change in average response time (${currentTest.avgResponseTime}ms).`;
        responseTimeIndicator.textContent = 'No Change';
        responseTimeIndicator.className = 'performance-indicator neutral';
    }
    
    // Throughput Summary
    const throughputDiff = calculatePercentChange(baselineTest.throughput, currentTest.throughput);
    const throughputSummary = document.getElementById('throughputSummary');
    const throughputIndicator = document.getElementById('throughputIndicator');
    
    if (throughputDiff > 0) {
        // Improvement
        throughputSummary.textContent = `Throughput improved by ${throughputDiff.toFixed(2)}% from ${baselineTest.throughput.toFixed(2)} req/s to ${currentTest.throughput.toFixed(2)} req/s.`;
        throughputIndicator.textContent = 'Improved';
        throughputIndicator.className = 'performance-indicator good';
    } else if (throughputDiff < 0) {
        // Degradation
        throughputSummary.textContent = `Throughput degraded by ${Math.abs(throughputDiff).toFixed(2)}% from ${baselineTest.throughput.toFixed(2)} req/s to ${currentTest.throughput.toFixed(2)} req/s.`;
        throughputIndicator.textContent = 'Degraded';
        throughputIndicator.className = 'performance-indicator bad';
    } else {
        // No change
        throughputSummary.textContent = `No change in throughput (${currentTest.throughput.toFixed(2)} req/s).`;
        throughputIndicator.textContent = 'No Change';
        throughputIndicator.className = 'performance-indicator neutral';
    }
    
    // Error Rate Summary
    const errorDiff = calculatePercentChange(baselineTest.errorPct, currentTest.errorPct);
    const errorSummary = document.getElementById('errorSummary');
    const errorIndicator = document.getElementById('errorIndicator');
    
    if (errorDiff < 0) {
        // Improvement
        errorSummary.textContent = `Error rate improved by ${Math.abs(errorDiff).toFixed(2)}% from ${baselineTest.errorPct}% to ${currentTest.errorPct}%.`;
        errorIndicator.textContent = 'Improved';
        errorIndicator.className = 'performance-indicator good';
    } else if (errorDiff > 0) {
        // Degradation
        errorSummary.textContent = `Error rate degraded by ${errorDiff.toFixed(2)}% from ${baselineTest.errorPct}% to ${currentTest.errorPct}%.`;
        errorIndicator.textContent = 'Degraded';
        errorIndicator.className = 'performance-indicator bad';
    } else {
        // No change
        errorSummary.textContent = `No change in error rate (${currentTest.errorPct}%).`;
        errorIndicator.textContent = 'No Change';
        errorIndicator.className = 'performance-indicator neutral';
    }
    
    // Overall Performance Summary
    const overallSummary = document.getElementById('overallSummary');
    
    // Calculate an overall score based on response time, throughput, and error rate
    // Lower response time, higher throughput, and lower error rate are better
    const responseTimeScore = avgRTDiff < 0 ? 1 : avgRTDiff === 0 ? 0 : -1;
    const throughputScore = throughputDiff > 0 ? 1 : throughputDiff === 0 ? 0 : -1;
    const errorScore = errorDiff < 0 ? 1 : errorDiff === 0 ? 0 : -1;
    
    const overallScore = responseTimeScore + throughputScore + errorScore;
    
    if (overallScore > 0) {
        overallSummary.textContent = 'Overall performance has improved compared to baseline.';
        overallSummary.className = 'improvement';
    } else if (overallScore < 0) {
        overallSummary.textContent = 'Overall performance has degraded compared to baseline.';
        overallSummary.className = 'degradation';
    } else {
        overallSummary.textContent = 'Overall performance is similar to baseline.';
        overallSummary.className = 'neutral';
    }
}

/**
 * Generates a radar chart for comparing multiple metrics at once
 */
function generateRadarChart() {
    const ctx = document.getElementById('radarChart').getContext('2d');
    
    // Normalize values for radar chart (all metrics on a scale of 0-100)
    // For response times, lower is better, so we invert the scale
    const normalizeRT = (value, max) => 100 - (value / max * 100);
    const normalizeTP = (value, max) => (value / max * 100);
    
    const maxAvgRT = Math.max(baselineTest.avgResponseTime, currentTest.avgResponseTime);
    const maxMedianRT = Math.max(baselineTest.medianResponseTime, currentTest.medianResponseTime);
    const maxPct90RT = Math.max(baselineTest.pct90ResponseTime, currentTest.pct90ResponseTime);
    const maxTP = Math.max(baselineTest.throughput, currentTest.throughput);
    const maxKB = Math.max(baselineTest.kbReceived, currentTest.kbReceived);
    
    // Prepare radar chart data
    const radarData = {
        labels: [
            'Avg Response Time', 
            'Median Response Time', 
            '90% Response Time', 
            'Throughput', 
            'KB/sec',
            'Error Rate'
        ],
        datasets: [
            {
                label: 'Baseline',
                data: [
                    normalizeRT(baselineTest.avgResponseTime, maxAvgRT),
                    normalizeRT(baselineTest.medianResponseTime, maxMedianRT),
                    normalizeRT(baselineTest.pct90ResponseTime, maxPct90RT),
                    normalizeTP(baselineTest.throughput, maxTP),
                    normalizeTP(baselineTest.kbReceived, maxKB),
                    100 - baselineTest.errorPct
                ],
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(54, 162, 235, 1)'
            },
            {
                label: 'Current',
                data: [
                    normalizeRT(currentTest.avgResponseTime, maxAvgRT),
                    normalizeRT(currentTest.medianResponseTime, maxMedianRT),
                    normalizeRT(currentTest.pct90ResponseTime, maxPct90RT),
                    normalizeTP(currentTest.throughput, maxTP),
                    normalizeTP(currentTest.kbReceived, maxKB),
                    100 - currentTest.errorPct
                ],
                backgroundColor: 'rgba(40, 167, 69, 0.2)',
                borderColor: 'rgba(40, 167, 69, 1)',
                pointBackgroundColor: 'rgba(40, 167, 69, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(40, 167, 69, 1)'
            }
        ]
    };
    
    // Create radar chart
    charts.radar = new Chart(ctx, {
        type: 'radar',
        data: radarData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            elements: {
                line: {
                    borderWidth: 3
                }
            },
            scales: {
                r: {
                    angleLines: {
                        display: false
                    },
                    suggestedMin: 0,
                    suggestedMax: 100,
                    ticks: {
                        display: false
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            return tooltipItems[0].label;
                        },
                        label: function(context) {
                            const metric = context.label;
                            const index = context.dataIndex;
                            
                            if (index === 0) { // Avg Response Time
                                return `${metric}: ${(index === 0 ? baselineTest : currentTest).avgResponseTime}ms`;
                            } else if (index === 1) { // Median Response Time
                                return `${metric}: ${(index === 0 ? baselineTest : currentTest).medianResponseTime}ms`;
                            } else if (index === 2) { // 90% Response Time
                                return `${metric}: ${(index === 0 ? baselineTest : currentTest).pct90ResponseTime}ms`;
                            } else if (index === 3) { // Throughput
                                return `${metric}: ${(index === 0 ? baselineTest : currentTest).throughput.toFixed(2)} req/s`;
                            } else if (index === 4) { // KB/sec
                                return `${metric}: ${(index === 0 ? baselineTest : currentTest).kbReceived.toFixed(2)} KB/s`;
                            } else if (index === 5) { // Error Rate
                                return `${metric}: ${(index === 0 ? baselineTest : currentTest).errorPct}%`;
                            }
                        }
                    }
                }
            }
        }
    });
}

/**
 * Generates bar charts for individual metrics
 */
function generateBarCharts() {
    // Generate Average Response Time Chart
    const avgRTCtx = document.getElementById('avgResponseTimeChart').getContext('2d');
    charts.avgRT = createComparisonChart(avgRTCtx, 'Average Response Time (ms)', 
        baselineTest.avgResponseTime, currentTest.avgResponseTime, false);
    
    // Generate Throughput Chart
    const tpCtx = document.getElementById('throughputChart').getContext('2d');
    charts.tp = createComparisonChart(tpCtx, 'Throughput (req/sec)', 
        baselineTest.throughput, currentTest.throughput, true);
    
    // Generate Error Rate Chart
    const errCtx = document.getElementById('errorRateChart').getContext('2d');
    charts.err = createComparisonChart(errCtx, 'Error Rate (%)', 
        baselineTest.errorPct, currentTest.errorPct, false);
    
    // Generate 90th Percentile Response Time Chart
    const pct90Ctx = document.getElementById('pct90Chart').getContext('2d');
    charts.pct90 = createComparisonChart(pct90Ctx, '90th Percentile Response Time (ms)', 
        baselineTest.pct90ResponseTime, currentTest.pct90ResponseTime, false);
    
    // Generate Median Response Time Chart
    const medianCtx = document.getElementById('medianChart').getContext('2d');
    charts.median = createComparisonChart(medianCtx, 'Median Response Time (ms)', 
        baselineTest.medianResponseTime, currentTest.medianResponseTime, false);
    
    // Generate KB/sec Chart
    const kbCtx = document.getElementById('kbPerSecChart').getContext('2d');
    charts.kb = createComparisonChart(kbCtx, 'KB/sec', 
        baselineTest.kbReceived, currentTest.kbReceived, true);
}

/**
 * Creates a comparison bar chart for two values
 */
function createComparisonChart(ctx, label, baselineValue, currentValue, higherIsBetter) {
    // Calculate percent change
    const percentChange = calculatePercentChange(baselineValue, currentValue);
    
    // Determine if current value is better or worse
    let changeClass;
    if (higherIsBetter) {
        changeClass = percentChange > 0 ? 'improvement' : (percentChange < 0 ? 'degradation' : 'neutral');
    } else {
        changeClass = percentChange < 0 ? 'improvement' : (percentChange > 0 ? 'degradation' : 'neutral');
    }
    
    // Colors for the change indicator
    const changeColor = changeClass === 'improvement' ? '#28a745' : 
                       (changeClass === 'degradation' ? '#dc3545' : '#6c757d');
    
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Baseline', 'Current'],
            datasets: [{
                label: label,
                data: [baselineValue, currentValue],
                backgroundColor: ['rgba(54, 162, 235, 0.7)', 'rgba(40, 167, 69, 0.7)'],
                borderColor: ['rgba(54, 162, 235, 1)', 'rgba(40, 167, 69, 1)'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        afterLabel: function(context) {
                            if (context.dataIndex === 1) { // Only show change for current value
                                return `Change: ${percentChange > 0 ? '+' : ''}${percentChange.toFixed(2)}%`;
                            }
                            return '';
                        }
                    }
                },
                annotation: {
                    annotations: {
                        line1: {
                            type: 'line',
                            yMin: baselineValue,
                            yMax: baselineValue,
                            borderColor: 'rgba(54, 162, 235, 0.5)',
                            borderWidth: 2,
                            borderDash: [5, 5]
                        }
                    }
                }
            }
        }
    });
}

/**
 * Generates a detailed comparison table
 */
function generateComparisonTable() {
    const tableBody = document.getElementById('comparisonTable');
    tableBody.innerHTML = '';
    
    // Define metrics to display
    const metrics = [
        { name: 'Average Response Time (ms)', baseKey: 'avgResponseTime', currentKey: 'avgResponseTime', higherIsBetter: false },
        { name: 'Median Response Time (ms)', baseKey: 'medianResponseTime', currentKey: 'medianResponseTime', higherIsBetter: false },
        { name: '90th Percentile RT (ms)', baseKey: 'pct90ResponseTime', currentKey: 'pct90ResponseTime', higherIsBetter: false },
        { name: '95th Percentile RT (ms)', baseKey: 'pct95ResponseTime', currentKey: 'pct95ResponseTime', higherIsBetter: false },
        { name: '99th Percentile RT (ms)', baseKey: 'pct99ResponseTime', currentKey: 'pct99ResponseTime', higherIsBetter: false },
        { name: 'Min Response Time (ms)', baseKey: 'minResponseTime', currentKey: 'minResponseTime', higherIsBetter: false },
        { name: 'Max Response Time (ms)', baseKey: 'maxResponseTime', currentKey: 'maxResponseTime', higherIsBetter: false },
        { name: 'Throughput (req/sec)', baseKey: 'throughput', currentKey: 'throughput', higherIsBetter: true, format: true },
        { name: 'Error Rate (%)', baseKey: 'errorPct', currentKey: 'errorPct', higherIsBetter: false, format: true },
        { name: 'Error Count', baseKey: 'fail', currentKey: 'fail', higherIsBetter: false },
        { name: 'Sample Count', baseKey: 'samples', currentKey: 'samples', higherIsBetter: true },
        { name: 'KB Received/sec', baseKey: 'kbReceived', currentKey: 'kbReceived', higherIsBetter: true, format: true },
        { name: 'KB Sent/sec', baseKey: 'kbSent', currentKey: 'kbSent', higherIsBetter: true, format: true }
    ];
    
    // Add rows for each metric
    metrics.forEach(metric => {
        const row = document.createElement('tr');
        
        // Get values
        const baseValue = baselineTest[metric.baseKey];
        const currentValue = currentTest[metric.currentKey];
        const percentChange = calculatePercentChange(baseValue, currentValue);
        
        // Determine if current value is better or worse
        let changeClass;
        if (metric.higherIsBetter) {
            changeClass = percentChange > 0 ? 'improvement' : (percentChange < 0 ? 'degradation' : 'neutral');
        } else {
            changeClass = percentChange < 0 ? 'improvement' : (percentChange > 0 ? 'degradation' : 'neutral');
        }
        
        // Format values if needed
        const formattedBaseValue = metric.format ? baseValue.toFixed(2) : baseValue;
        const formattedCurrentValue = metric.format ? currentValue.toFixed(2) : currentValue;
        
        // Create cells
        const nameCell = document.createElement('td');
        nameCell.textContent = metric.name;
        
        const baseCell = document.createElement('td');
        baseCell.textContent = formattedBaseValue;
        
        const currentCell = document.createElement('td');
        currentCell.textContent = formattedCurrentValue;
        
        const changeCell = document.createElement('td');
        changeCell.className = changeClass;
        changeCell.textContent = `${percentChange > 0 ? '+' : ''}${percentChange.toFixed(2)}%`;
        
        // Add cells to row
        row.appendChild(nameCell);
        row.appendChild(baseCell);
        row.appendChild(currentCell);
        row.appendChild(changeCell);
        
        // Add row to table
        tableBody.appendChild(row);
    });
}

/**
 * Calculates the percentage change between two values
 */
function calculatePercentChange(baseValue, currentValue) {
    if (baseValue === 0) {
        return currentValue === 0 ? 0 : 100;
    }
    return ((currentValue - baseValue) / Math.abs(baseValue)) * 100;
}

/**
 * Setup Bootstrap tab navigation manually to ensure it works
 */
function setupTabNavigation() {
    // Get all tab elements
    const tabs = document.querySelectorAll('[data-bs-toggle="tab"]');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    console.log(`Found ${tabs.length} tabs and ${tabPanes.length} tab panes`);
    
    // Create tab click handlers manually
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Deactivate all tabs
            tabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            
            // Hide all tab panes
            tabPanes.forEach(pane => {
                pane.classList.remove('show', 'active');
            });
            
            // Activate the clicked tab
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            
            // Show the corresponding tab pane
            const targetId = tab.getAttribute('data-bs-target');
            const targetPane = document.querySelector(targetId);
            if (targetPane) {
                targetPane.classList.add('show', 'active');
                
                // If this is the history tab, refresh the history list
                if (tab.id === 'history-tab') {
                    console.log("Showing history tab, refreshing history list");
                    populateHistoryList();
                }
            }
            
            console.log(`Switched to tab: ${tab.id}, target: ${targetId}`);
        });
    });

    // Add a button to directly access history for debugging
    const container = document.querySelector('.container');
    if (container) {
        const debugButton = document.createElement('div');
        debugButton.className = 'mt-3 mb-3';
        debugButton.innerHTML = `
            <button id="showHistoryBtn" class="btn btn-outline-secondary">
                <i class="bi bi-clock-history"></i> Direct Access to History Tab
            </button>
        `;
        container.insertBefore(debugButton, container.firstChild);
        
        // Add event listener to this button
        document.getElementById('showHistoryBtn').addEventListener('click', () => {
            console.log("Showing history tab via direct access button");
            const historyTab = document.getElementById('history-tab');
            if (historyTab) {
                historyTab.click();
            } else {
                console.error("History tab element not found");
            }
        });
    }
} 