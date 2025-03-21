#!/bin/bash

# Script to generate the dashboard HTML
# Usage: ./generate_dashboard.sh <history_dir> <output_dir> <templates_dir>

set -e

# Check parameters
if [ $# -lt 3 ]; then
  echo "Usage: $0 <history_dir> <output_dir> <templates_dir>"
  exit 1
fi

HISTORY_DIR="$1"
OUTPUT_DIR="$2"
TEMPLATES_DIR="$3"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Copy dashboard template
cp "$TEMPLATES_DIR/dashboard-index.html" "$OUTPUT_DIR/index.html"

# Replace date placeholder
sed -i "s|CURRENT_DATE|$(date)|g" "$OUTPUT_DIR/index.html"

# Create temporary files for report rows and options
ROWS_FILE=$(mktemp)
OPTIONS_FILE=$(mktemp)

# List all history archives (newest first)
ls -t "$HISTORY_DIR"/*.tar.gz 2>/dev/null | while read report; do
  filename=$(basename "$report" .tar.gz)
  timestamp=$(echo $filename | cut -d'_' -f2-3)
  commit=$(echo $filename | cut -d'_' -f4)
  
  # Add row to dashboard table
  echo "    <tr>" >> "$ROWS_FILE"
  echo "      <td>$timestamp</td>" >> "$ROWS_FILE"
  echo "      <td>$commit</td>" >> "$ROWS_FILE"
  echo "      <td><a href='/chaabi-jmeter-tests/historical-reports/$filename/index.html'>View Report</a></td>" >> "$ROWS_FILE"
  echo "    </tr>" >> "$ROWS_FILE"
  
  # Add option for select boxes
  echo "        <option value='$filename'>$timestamp ($commit)</option>" >> "$OPTIONS_FILE"
done

# Replace placeholders in dashboard HTML
if [ -s "$ROWS_FILE" ]; then
  ROWS=$(cat "$ROWS_FILE")
  sed -i "s|<!-- REPORT_ROWS -->|$ROWS|" "$OUTPUT_DIR/index.html"
fi

if [ -s "$OPTIONS_FILE" ]; then
  OPTIONS=$(cat "$OPTIONS_FILE")
  # Replace first occurrence
  sed -i "s|<!-- REPORT_OPTIONS -->|$OPTIONS|" "$OUTPUT_DIR/index.html"
  # Replace second occurrence
  sed -i "s|<!-- REPORT_OPTIONS -->|$OPTIONS|" "$OUTPUT_DIR/index.html"
fi

# Copy comparison template
cp "$TEMPLATES_DIR/compare.html" "$OUTPUT_DIR/../compare.html"

# Clean up temporary files
rm -f "$ROWS_FILE" "$OPTIONS_FILE"

echo "Dashboard generated at $OUTPUT_DIR/index.html" 