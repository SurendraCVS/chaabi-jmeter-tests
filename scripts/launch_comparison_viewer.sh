#!/bin/bash

# Script to launch the JMeter Test Comparison Viewer
# Usage: ./launch_comparison_viewer.sh

set -e

# Define directories
SCRIPTS_DIR="$(dirname "$0")"
BASE_DIR="$(dirname "$SCRIPTS_DIR")"
REPORTS_DIR="$BASE_DIR/jmeter-pages/reports"
HISTORY_DIR="$REPORTS_DIR/history"
VIEWER_DIR="$REPORTS_DIR/comparison"

# Create the comparison viewer directory
mkdir -p "$VIEWER_DIR"

# Copy the comparison viewer files to the reports directory
cp "$SCRIPTS_DIR/comparison_viewer.html" "$VIEWER_DIR/index.html"
cp "$SCRIPTS_DIR/comparison_viewer.js" "$VIEWER_DIR/comparison_viewer.js"

# Check if history.json exists
if [ ! -f "$HISTORY_DIR/history.json" ]; then
    echo "Error: No history data found at $HISTORY_DIR/history.json"
    echo "Please run a test first to generate historical data."
    exit 1
fi

# Add a link to the comparison viewer in the main report
if [ -f "$REPORTS_DIR/index.html" ]; then
    # Check if the link already exists
    if ! grep -q "View Comparison Tool" "$REPORTS_DIR/index.html"; then
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
    fi
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