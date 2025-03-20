#!/bin/bash

# JMeter Comparison Viewer Launcher
# This script launches the comparison viewer in a web browser

echo "================================="
echo "JMeter Comparison Viewer Launcher"
echo "================================="

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if history directory exists, create if not
if [ ! -d "../reports/history" ]; then
    echo "Creating history directory..."
    mkdir -p "../reports/history"
fi

# Check if history.json exists, create a sample file if not
if [ ! -f "../reports/history/history.json" ]; then
    echo "Creating sample history.json file..."
    cat > "../reports/history/history.json" << EOF
{
    "tests": [
        {
            "id": "2024_03_20_10_00_00",
            "date": "2024_03_20_10_00_00",
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
        },
        {
            "id": "2024_03_19_10_00_00",
            "date": "2024_03_19_10_00_00",
            "samples": 950,
            "fail": 15,
            "errorPct": 1.58,
            "avgResponseTime": 300,
            "minResponseTime": 60,
            "maxResponseTime": 1500,
            "medianResponseTime": 240,
            "pct90ResponseTime": 450,
            "pct95ResponseTime": 600,
            "pct99ResponseTime": 900,
            "throughput": 18.2,
            "kbReceived": 140.5,
            "kbSent": 80.1,
            "isCurrent": false
        }
    ],
    "lastUpdated": "2024-03-20T10:00:00Z"
}
EOF
    echo "Sample history.json file created."
fi

# Debug information
echo "Checking history.json..."
if [ -f "../reports/history/history.json" ]; then
    echo "✅ history.json exists at: $(realpath "../reports/history/history.json")"
    echo "Contents:"
    cat "../reports/history/history.json" | head -20
    echo "..."
else
    echo "❌ history.json not found!"
fi

echo ""
echo "Checking comparison_viewer.html..."
if [ -f "comparison_viewer.html" ]; then
    echo "✅ comparison_viewer.html exists at: $(realpath "comparison_viewer.html")"
else
    echo "❌ comparison_viewer.html not found!"
fi

echo ""
echo "Checking comparison_viewer.js..."
if [ -f "comparison_viewer.js" ]; then
    echo "✅ comparison_viewer.js exists at: $(realpath "comparison_viewer.js")"
else
    echo "❌ comparison_viewer.js not found!"
fi

# Start a simple HTTP server
echo ""
echo "Starting HTTP server..."

# Check if Python is available
if command -v python3 &>/dev/null; then
    echo "Using Python 3 HTTP server"
    python3 -m http.server 8000 &
    SERVER_PID=$!
elif command -v python &>/dev/null; then
    echo "Using Python HTTP server"
    python -m SimpleHTTPServer 8000 &
    SERVER_PID=$!
else
    echo "❌ Python not found. Cannot start HTTP server."
    exit 1
fi

echo "HTTP server started on port 8000 (PID: $SERVER_PID)"

# Open the browser
echo ""
echo "Opening comparison viewer in browser..."

# Determine the correct command to open a browser
if command -v xdg-open &>/dev/null; then
    # Linux
    xdg-open http://localhost:8000/comparison_viewer.html
elif command -v open &>/dev/null; then
    # macOS
    open http://localhost:8000/comparison_viewer.html
elif command -v start &>/dev/null; then
    # Windows
    start http://localhost:8000/comparison_viewer.html
else
    echo "❌ Could not detect a way to open a browser. Please manually visit:"
    echo "   http://localhost:8000/comparison_viewer.html"
fi

echo ""
echo "Press Ctrl+C to stop the server when done"

# Wait for Ctrl+C
trap "kill $SERVER_PID; echo 'Server stopped.'; exit" INT
wait $SERVER_PID 