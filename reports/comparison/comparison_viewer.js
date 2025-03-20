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
        // Try multiple possible paths to find history.json
        let response;
        let historyPaths = [
            '../reports/history/history.json',
            '../../history/history.json',
            '../history/history.json',
            './history/history.json'
        ];
        
        // Try each path until one works
        for (const path of historyPaths) {
            try {
                response = await fetch(path);
                if (response.ok) {
                    console.log(`Found history.json at: ${path}`);
                    break;
                }
            } catch (e) {
                console.log(`Path ${path} failed: ${e.message}`);
                // Continue to next path
            }
        }
        
        if (!response || !response.ok) {
            throw new Error('Failed to fetch history data from any known location');
        }
        
        const data = await response.json();
        
        // Sort tests by date (newest first)
        allTests = data.tests.sort((a, b) => {
            if (a.isCurrent) return -1;
            if (b.isCurrent) return 1;
            return new Date(b.date.replace(/_/g, ' ').replace(/-/g, ':')) - 
                   new Date(a.date.replace(/_/g, ' ').replace(/-/g, ':'));
        });
        
        // Check if we have tests to display
        if (allTests.length === 0) {
            throw new Error('No test history data available');
        }
        
        // Populate test selectors
        populateTestSelectors();
        
        // Set up event listeners
        document.getElementById('compareBtn').addEventListener('click', compareTests);
        
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
                </div>
            </div>
        `;
    }
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