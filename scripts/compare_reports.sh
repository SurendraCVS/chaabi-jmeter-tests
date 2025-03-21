#!/bin/bash

# Script to compare two historical JMeter reports
# Usage: ./compare_reports.sh <report1_name> <report2_name>

set -e

# Function to display usage
function display_usage {
  echo "Usage: $0 <report1_name> <report2_name>"
  echo "Example: $0 report_2023-04-10_15-30-45_a1b2c3d report_2023-04-12_16-45-30_e5f6g7h"
  echo ""
  echo "Available reports:"
  ls -1 ../history/ | grep .tar.gz | sed 's/\.tar\.gz$//'
}

# Check if parameters are provided
if [ $# -ne 2 ]; then
  echo "Error: Missing report name parameters."
  display_usage
  exit 1
fi

REPORT1_NAME=$1
REPORT2_NAME=$2
HISTORY_DIR="../history"
TEMP_DIR="../temp_comparison"
COMPARE_DIR="${TEMP_DIR}/comparison"

# Check if the reports exist
if [ ! -f "${HISTORY_DIR}/${REPORT1_NAME}.tar.gz" ]; then
  echo "Error: Report '${REPORT1_NAME}' not found in the history directory."
  display_usage
  exit 1
fi

if [ ! -f "${HISTORY_DIR}/${REPORT2_NAME}.tar.gz" ]; then
  echo "Error: Report '${REPORT2_NAME}' not found in the history directory."
  display_usage
  exit 1
fi

# Create temporary directories
mkdir -p ${TEMP_DIR}/report1
mkdir -p ${TEMP_DIR}/report2
mkdir -p ${COMPARE_DIR}

echo "Extracting report ${REPORT1_NAME}..."
tar -xzf "${HISTORY_DIR}/${REPORT1_NAME}.tar.gz" -C ${TEMP_DIR}/report1

echo "Extracting report ${REPORT2_NAME}..."
tar -xzf "${HISTORY_DIR}/${REPORT2_NAME}.tar.gz" -C ${TEMP_DIR}/report2

# Get the actual directory names after extraction
REPORT1_DIR=$(find ${TEMP_DIR}/report1 -type d -name "report_*" | head -1)
REPORT2_DIR=$(find ${TEMP_DIR}/report2 -type d -name "report_*" | head -1)

# Extract timestamps from metadata files
REPORT1_TS=$(grep "Timestamp:" ${REPORT1_DIR}/metadata.txt | cut -d' ' -f2-)
REPORT2_TS=$(grep "Timestamp:" ${REPORT2_DIR}/metadata.txt | cut -d' ' -f2-)

# Create comparison HTML
echo "Creating comparison report..."
cat > ${COMPARE_DIR}/index.html << EOL
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JMeter Report Comparison</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    tr:hover {background-color: #f5f5f5;}
    .better { background-color: #d4edda; }
    .worse { background-color: #f8d7da; }
    .neutral { background-color: #fff3cd; }
    .comparison-container { display: flex; margin-top: 20px; }
    .report-frame { flex: 1; margin: 0 10px; border: 1px solid #ddd; }
    iframe { width: 100%; height: 600px; border: none; }
  </style>
</head>
<body>
  <h1>JMeter Report Comparison</h1>
  
  <h2>Report Information</h2>
  <table>
    <tr>
      <th>Attribute</th>
      <th>Report 1 (Base)</th>
      <th>Report 2 (Comparison)</th>
    </tr>
    <tr>
      <td>Report Name</td>
      <td>${REPORT1_NAME}</td>
      <td>${REPORT2_NAME}</td>
    </tr>
    <tr>
      <td>Timestamp</td>
      <td>${REPORT1_TS}</td>
      <td>${REPORT2_TS}</td>
    </tr>
    <tr>
      <td>Commit</td>
      <td>$(grep "Commit:" ${REPORT1_DIR}/metadata.txt | cut -d' ' -f2-)</td>
      <td>$(grep "Commit:" ${REPORT2_DIR}/metadata.txt | cut -d' ' -f2-)</td>
    </tr>
  </table>

  <h2>Performance Metrics Comparison</h2>
EOL

# Extract and compare statistics from JTL files if available
if [ -f "${REPORT1_DIR}/results.jtl" ] && [ -f "${REPORT2_DIR}/results.jtl" ]; then
  # Extract the last summary line from each JTL file
  SUMMARY1=$(grep "summary =" "${REPORT1_DIR}/results.jtl" | tail -1)
  SUMMARY2=$(grep "summary =" "${REPORT2_DIR}/results.jtl" | tail -1)
  
  # Extract key metrics using grep and awk
  # Example: Extracting average response time
  AVG1=$(echo $SUMMARY1 | grep -o "Avg: [0-9.]*" | awk '{print $2}')
  AVG2=$(echo $SUMMARY2 | grep -o "Avg: [0-9.]*" | awk '{print $2}')
  
  # Extract more metrics
  SAMPLES1=$(echo $SUMMARY1 | grep -o "#samples=[0-9]*" | cut -d'=' -f2)
  SAMPLES2=$(echo $SUMMARY2 | grep -o "#samples=[0-9]*" | cut -d'=' -f2)
  
  ERRORS1=$(echo $SUMMARY1 | grep -o "Err: *[0-9.]*" | awk '{print $2}')
  ERRORS2=$(echo $SUMMARY2 | grep -o "Err: *[0-9.]*" | awk '{print $2}')
  
  TPS1=$(echo $SUMMARY1 | grep -o "req/s: [0-9.]*" | awk '{print $2}')
  TPS2=$(echo $SUMMARY2 | grep -o "req/s: [0-9.]*" | awk '{print $2}')
  
  # Create metrics comparison table
  cat >> ${COMPARE_DIR}/index.html << EOL
  <table>
    <tr>
      <th>Metric</th>
      <th>Report 1 (Base)</th>
      <th>Report 2 (Comparison)</th>
      <th>Difference</th>
    </tr>
EOL

  # Helper function to compare values and add appropriate class
  function compare_metric {
    local name=$1
    local val1=$2
    local val2=$3
    local better_if_lower=$4
    
    # Calculate difference
    local diff=$(echo "scale=2; $val2 - $val1" | bc)
    local percent_diff=$(echo "scale=2; ($diff / $val1) * 100" | bc 2>/dev/null || echo "N/A")
    
    # Determine if better or worse
    local class="neutral"
    if (( $(echo "$diff < 0" | bc -l) )); then
      if [ "$better_if_lower" = true ]; then
        class="better"
      else
        class="worse"
      fi
    elif (( $(echo "$diff > 0" | bc -l) )); then
      if [ "$better_if_lower" = true ]; then
        class="worse"
      else
        class="better"
      fi
    fi
    
    echo "    <tr class=\"${class}\">"
    echo "      <td>${name}</td>"
    echo "      <td>${val1}</td>"
    echo "      <td>${val2}</td>"
    echo "      <td>${diff} (${percent_diff}%)</td>"
    echo "    </tr>"
  }
  
  # Add rows for each metric
  compare_metric "Samples" $SAMPLES1 $SAMPLES2 false >> ${COMPARE_DIR}/index.html
  compare_metric "Avg Response Time (ms)" $AVG1 $AVG2 true >> ${COMPARE_DIR}/index.html
  compare_metric "Error Rate" $ERRORS1 $ERRORS2 true >> ${COMPARE_DIR}/index.html
  compare_metric "Throughput (req/s)" $TPS1 $TPS2 false >> ${COMPARE_DIR}/index.html
  
  echo "  </table>" >> ${COMPARE_DIR}/index.html
else
  echo "  <p>JTL files not found or format not recognized.</p>" >> ${COMPARE_DIR}/index.html
fi

# Add links to view individual reports
cat >> ${COMPARE_DIR}/index.html << EOL
  <h2>View Individual Reports</h2>
  <div class="comparison-container">
    <div class="report-frame">
      <h3>Report 1 (Base): ${REPORT1_NAME}</h3>
      <iframe src="../report1/$(basename ${REPORT1_DIR})/index.html"></iframe>
    </div>
    <div class="report-frame">
      <h3>Report 2 (Comparison): ${REPORT2_NAME}</h3>
      <iframe src="../report2/$(basename ${REPORT2_DIR})/index.html"></iframe>
    </div>
  </div>
</body>
</html>
EOL

echo "Comparison report created: ${COMPARE_DIR}/index.html"

# Provide instructions for viewing
echo ""
echo "NOTE: This script is primarily for developer use during local analysis."
echo "For normal usage, view trend reports directly on the GitHub Pages dashboard:"
echo "https://YOUR_GITHUB_USERNAME.github.io/chaabi-jmeter-tests/dashboard/trend_chart.html"
echo ""
echo "For local development only:"
echo "You can open the generated comparison file in your browser:"
echo "file://${PWD}/${COMPARE_DIR}/index.html"
echo ""
echo "Remember to remove the temporary directory when you're done:"
echo "rm -rf ${TEMP_DIR}" 