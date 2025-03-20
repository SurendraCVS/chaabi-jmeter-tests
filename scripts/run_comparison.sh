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
COMPARISON_DIR="./jmeter-pages/reports/comparison"

# Create required directories
mkdir -p "$HISTORY_DIR"
mkdir -p "$OUTPUT_DIR"
mkdir -p "$COMPARISON_DIR/history"

# Check if the script files are executable
if [ ! -x "$(command -v ./scripts/generate_history.sh)" ]; then
  chmod +x ./scripts/generate_history.sh
fi

# Step 1: Generate historical data (still needed for comparison tool)
echo "Step 1: Generating historical data..."
./scripts/generate_history.sh "$RESULTS_FILE" "$HISTORY_DIR" "$OUTPUT_DIR"

# Copy history.json to comparison directory to ensure it's accessible
echo "Copying history.json to comparison directory..."
cp "$OUTPUT_DIR/history.json" "$COMPARISON_DIR/history/history.json"

# Add link to comparison tool in the main JMeter report
echo "Adding link to comparison tool in the main report..."
if [ -f "./jmeter-pages/reports/index.html" ]; then
  # Create a temporary file
  TEMP_FILE=$(mktemp)
  
  # Insert link after the <body> tag - only for the comparison tool, not historical comparison
  awk '/<body>/ {
    print $0;
    print "<div style=\"text-align: center; margin: 20px;\">";
    print "  <a href=\"comparison/\" style=\"display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;\">View Comparison Tool</a>";
    print "</div>";
    next;
  }
  { print $0 }' "./jmeter-pages/reports/index.html" > "$TEMP_FILE"
  
  # Replace the original file with the modified one
  mv "$TEMP_FILE" "./jmeter-pages/reports/index.html"
  echo "Added link to comparison tool in the main report"
else
  echo "Warning: index.html not found in reports directory"
fi

# Print a summary of the history.json contents for debugging
echo "Checking history.json contents:"
if [ -f "$OUTPUT_DIR/history.json" ]; then
  echo "History file exists at $OUTPUT_DIR/history.json"
  echo "File size: $(stat -c%s "$OUTPUT_DIR/history.json") bytes"
  echo "Test count: $(grep -o '"date":' "$OUTPUT_DIR/history.json" | wc -l)"
else
  echo "Warning: history.json not found in $OUTPUT_DIR"
fi

if [ -f "$COMPARISON_DIR/history/history.json" ]; then
  echo "History file exists at $COMPARISON_DIR/history/history.json"
  echo "File size: $(stat -c%s "$COMPARISON_DIR/history/history.json") bytes"
  echo "Test count: $(grep -o '"date":' "$COMPARISON_DIR/history/history.json" | wc -l)"
else
  echo "Warning: history.json not found in $COMPARISON_DIR/history"
fi

echo "Comparison setup complete!"
echo "You can view the comparison tool at: ./jmeter-pages/reports/comparison/index.html" 
