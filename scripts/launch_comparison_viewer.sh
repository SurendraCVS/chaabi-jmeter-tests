#!/bin/bash

# Script to launch the JMeter Test Comparison Viewer
# Usage: ./launch_comparison_viewer.sh

set -e

# Define directories
SCRIPTS_DIR="$(dirname "$0")"
BASE_DIR="$(dirname "$SCRIPTS_DIR")"
REPORTS_DIR="$BASE_DIR/jmeter-pages/reports"
HISTORY_DIR="$BASE_DIR/jmeter-pages/history"
VIEWER_DIR="$REPORTS_DIR/comparison"

echo "Setting up JMeter Test Comparison Viewer..."
echo "Scripts directory: $SCRIPTS_DIR"
echo "Base directory: $BASE_DIR"
echo "Reports directory: $REPORTS_DIR"
echo "History directory: $HISTORY_DIR"
echo "Viewer directory: $VIEWER_DIR"

# Create the comparison viewer directory
mkdir -p "$VIEWER_DIR"
mkdir -p "$VIEWER_DIR/history"
echo "Created comparison viewer directories"

# Copy the comparison viewer files to the reports directory
cp "$SCRIPTS_DIR/comparison_viewer.html" "$VIEWER_DIR/index.html"
cp "$SCRIPTS_DIR/comparison_viewer.js" "$VIEWER_DIR/comparison_viewer.js"
echo "Copied comparison viewer files"

# Check all possible locations for history.json and copy it to the comparison viewer directory
FOUND_HISTORY=false

# Define all possible locations of history.json
HISTORY_LOCATIONS=(
  "$HISTORY_DIR/history.json"
  "$REPORTS_DIR/history/history.json"
  "$BASE_DIR/history/history.json"
)

for LOCATION in "${HISTORY_LOCATIONS[@]}"; do
  if [ -f "$LOCATION" ]; then
    echo "Found history.json at $LOCATION"
    cp "$LOCATION" "$VIEWER_DIR/history/history.json"
    FOUND_HISTORY=true
    break
  fi
done

# Create a minimal history file if none was found
if [ "$FOUND_HISTORY" = false ]; then
  echo "Warning: No history data found in any known location"
  echo "Creating a sample history file with current date for demonstration"
  
  # Get current date in the format expected by the history.json
  CURRENT_DATE=$(date +"%Y-%m-%d_%H-%M-%S")
  
  # Create a sample history.json with one test
  cat > "$VIEWER_DIR/history/history.json" << EOF
{
  "tests": [
    {
      "id": "$CURRENT_DATE",
      "date": "$CURRENT_DATE",
      "samples": 1000,
      "fail": 10,
      "errorPct": 1.0,
      "avgResponseTime": 250,
      "minResponseTime": 50,
      "maxResponseTime": 1200,
      "medianResponseTime": 200,
      "pct90ResponseTime": 400,
      "pct95ResponseTime": 500,
      "pct99ResponseTime": 700,
      "throughput": 20.5,
      "kbReceived": 150.2,
      "kbSent": 85.3,
      "isCurrent": true
    }
  ]
}
EOF
fi

echo "History file details:"
ls -la "$VIEWER_DIR/history/history.json" || echo "File not found"
cat "$VIEWER_DIR/history/history.json" | head -20 || echo "Cannot display file contents"

# Add a link to the comparison viewer in the main report
if [ -f "$REPORTS_DIR/index.html" ]; then
    # Check if the link already exists
    if ! grep -q "View Comparison Tool" "$REPORTS_DIR/index.html"; then
        echo "Adding link to main report"
        # Create a temporary file
        TEMP_FILE=$(mktemp)
        
        # Insert link after the <body> tag or after existing historical comparison link
        if grep -q "View Historical Comparison" "$REPORTS_DIR/index.html"; then
            # Add after the existing link div
            awk '/<div style="text-align: center; margin: 20px;"><a href="history\/"/ {
                print $0;
                print "    <a href=\"comparison/\" style=\"display: inline-block; margin-left: 10px; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;\">View Comparison Tool</a>";
                next;
            }
            { print $0 }' "$REPORTS_DIR/index.html" > "$TEMP_FILE"
        else
            # Add after body tag
            awk '/<body>/ {
                print $0;
                print "<div style=\"text-align: center; margin: 20px;\">";
                print "    <a href=\"comparison/\" style=\"display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;\">View Comparison Tool</a>";
                print "</div>";
                next;
            }
            { print $0 }' "$REPORTS_DIR/index.html" > "$TEMP_FILE"
        fi
        
        # Replace the original file with the modified one
        mv "$TEMP_FILE" "$REPORTS_DIR/index.html"
        echo "Added link to comparison tool in the main report"
    else
        echo "Link to comparison tool already exists in the main report"
    fi
else
    echo "Warning: Main report index.html not found at $REPORTS_DIR/index.html"
fi

# Display success message
echo "Comparison viewer has been set up successfully!"
echo "You can access it at: $VIEWER_DIR/index.html"

# Try to open the viewer in a browser if possible
if command -v xdg-open >/dev/null 2>&1; then
    echo "Opening comparison viewer in your default browser..."
    xdg-open "file://$VIEWER_DIR/index.html" >/dev/null 2>&1 || echo "Could not open browser automatically."
elif command -v open >/dev/null 2>&1; then
    echo "Opening comparison viewer in your default browser..."
    open "file://$VIEWER_DIR/index.html" >/dev/null 2>&1 || echo "Could not open browser automatically."
else
    echo "To view the comparison tool, open $VIEWER_DIR/index.html in your browser."
fi

echo "Comparison tool setup complete!" 