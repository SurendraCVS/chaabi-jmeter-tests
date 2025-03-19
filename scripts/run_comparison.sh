#!/bin/bash

# Main script to run the JMeter historical comparison
# Usage: ./run_comparison.sh <results_jtl_file>

set -e

# Check if the results file was provided
if [ -z "$1" ]; then
  echo "Error: JMeter results file (.jtl) is required"
  echo "Usage: ./run_comparison.sh <results_jtl_file>"
  exit 1
fi

RESULTS_FILE=$1
HISTORY_DIR="./jmeter-pages/history"
OUTPUT_DIR="./jmeter-pages/reports/history"

# Create required directories
mkdir -p "$HISTORY_DIR"
mkdir -p "$OUTPUT_DIR"

# Check if the script files are executable
if [ ! -x "$(command -v ./scripts/generate_history.sh)" ]; then
  chmod +x ./scripts/generate_history.sh
fi

if [ ! -x "$(command -v ./scripts/generate_comparison_page.sh)" ]; then
  chmod +x ./scripts/generate_comparison_page.sh
fi

# Step 1: Generate historical data
echo "Step 1: Generating historical data..."
./scripts/generate_history.sh "$RESULTS_FILE" "$HISTORY_DIR" "$OUTPUT_DIR"

# Step 2: Generate comparison HTML page
echo "Step 2: Generating comparison HTML page..."
./scripts/generate_comparison_page.sh "$OUTPUT_DIR"

# Step 3: Add link to main JMeter report
echo "Step 3: Adding link to main JMeter report..."
if [ -f "./jmeter-pages/reports/index.html" ]; then
  # Create a temporary file
  TEMP_FILE=$(mktemp)
  
  # Insert link after the <body> tag
  awk '/<body>/ {
    print $0;
    print "<div style=\"text-align: center; margin: 20px;\"><a href=\"history/\" style=\"display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;\">View Historical Comparison</a></div>";
    next;
  }
  { print $0 }' "./jmeter-pages/reports/index.html" > "$TEMP_FILE"
  
  # Replace the original file with the modified one
  mv "$TEMP_FILE" "./jmeter-pages/reports/index.html"
  echo "Added link to historical comparison in the main report"
else
  echo "Warning: index.html not found in reports directory"
fi

echo "Historical comparison setup complete!"
echo "You can view the comparison at: ./jmeter-pages/reports/history/index.html" 
