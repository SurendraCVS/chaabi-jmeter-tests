#!/bin/bash

# JMeter Test History Updater
# This script updates the history.json file with the latest test results
# Run this script after each test to maintain a history of test results

echo "================================="
echo "JMeter Test History Updater"
echo "================================="

# Make sure we're running from the project root
if [[ ! -d "scripts" ]]; then
  echo "Error: Please run this script from the project root directory."
  echo "Current directory: $(pwd)"
  exit 1
fi

# Create directories if they don't exist
mkdir -p scripts/history
mkdir -p reports/history
HISTORY_FILE="scripts/history/history.json"

# Initialize history file if it doesn't exist
if [ ! -f "$HISTORY_FILE" ]; then
  echo '{"tests": []}' > "$HISTORY_FILE"
fi

# Clean any unrealistic values from existing history
if [ -f "$HISTORY_FILE" ]; then
  echo "Cleaning unrealistic values from existing history..."
  # Filter out entries with response time greater than 100,000 ms (100 seconds) which are likely errors
  jq '.tests = [.tests[] | select(.avg_response_time < 100000)]' "$HISTORY_FILE" > "${HISTORY_FILE}.tmp" && mv "${HISTORY_FILE}.tmp" "$HISTORY_FILE"
  echo "History cleaned."
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
  echo "Warning: jq is not installed. Using basic file operations instead."
  # Simple alternative: just keep the file as is if jq is not available
  if [ ! -f "$HISTORY_FILE" ]; then
    echo '{"tests": []}' > "$HISTORY_FILE"
  fi
else
  # Find the most recent report directories (excluding history directory)
  if [ -d "reports" ]; then
    REPORT_DIRS=$(find reports -mindepth 1 -maxdepth 1 -type d -not -path "*/history" | sort)
    
    # Process each report directory
    for REPORT_DIR in $REPORT_DIRS; do
      # Get timestamp from directory name or use folder modification time if not possible
      DIR_NAME=$(basename "$REPORT_DIR")
      if [[ $DIR_NAME =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}_[0-9]{2}-[0-9]{2}-[0-9]{2}$ ]]; then
        TIMESTAMP=$DIR_NAME
      else
        # Format the directory's modified time as timestamp
        TIMESTAMP=$(date -r "$REPORT_DIR" "+%Y-%m-%d_%H-%M-%S")
      fi
      
      # Check if this timestamp already exists in history.json
      TIMESTAMP_EXISTS=$(jq --arg ts "$TIMESTAMP" '.tests | map(select(.timestamp == $ts)) | length' "$HISTORY_FILE")
      
      if [ "$TIMESTAMP_EXISTS" -eq "0" ]; then
        echo "Processing report directory: $REPORT_DIR with timestamp $TIMESTAMP"
        
        # Get list of test results in this directory
        STATS_FILES=$(find "$REPORT_DIR" -name "statistics.json" -type f)
        
        for STATS_FILE in $STATS_FILES; do
          # Extract test name from the parent directory
          TEST_DIR=$(dirname "$STATS_FILE")
          TEST_NAME=$(basename "$TEST_DIR")
          
          echo "Processing test: $TEST_NAME from $STATS_FILE"
          
          # Read overall statistics (if file exists and contains valid JSON)
          if [ -f "$STATS_FILE" ] && jq empty "$STATS_FILE" 2>/dev/null; then
            # Extract success rate and response time
            ERROR_PCT=$(jq '.Total.errorPct' "$STATS_FILE" 2>/dev/null)
            SUCCESS_RATE=$(awk "BEGIN {print 100 - $ERROR_PCT}")
            AVG_RESPONSE_TIME=$(jq '.Total.meanResTime' "$STATS_FILE" 2>/dev/null)
            
            # Validate metrics to ensure they're realistic values
            if [ ! -z "$SUCCESS_RATE" ] && [ ! -z "$AVG_RESPONSE_TIME" ]; then
              # Ensure response time is a realistic value (less than 100 seconds)
              if (( $(echo "$AVG_RESPONSE_TIME < 100000" | bc -l) )); then
                # Add new test result to history
                jq --arg timestamp "$TIMESTAMP" \
                   --arg test "$TEST_NAME" \
                   --argjson success_rate "$SUCCESS_RATE" \
                   --argjson avg_response "$AVG_RESPONSE_TIME" \
                   --arg report_path "$REPORT_DIR" \
                   '.tests += [{"timestamp": $timestamp, "test": $test, "success_rate": $success_rate, "avg_response_time": $avg_response, "report_path": $report_path}]' \
                   "$HISTORY_FILE" > "${HISTORY_FILE}.tmp" && mv "${HISTORY_FILE}.tmp" "$HISTORY_FILE"
                
                echo "Added $TEST_NAME results to history.json with Success Rate: $SUCCESS_RATE%, Avg Response Time: $AVG_RESPONSE_TIME ms"
              else
                echo "Warning: Unrealistic response time ($AVG_RESPONSE_TIME ms) detected for $TEST_NAME. Skipping."
              fi
            else
              echo "Warning: Could not extract success rate or response time for $TEST_NAME"
            fi
          else
            echo "Warning: Statistics file for $TEST_NAME is missing or invalid"
          fi
        done
      else
        echo "Skipping already processed report: $REPORT_DIR"
      fi
    done
    
    # Sort tests by timestamp (newest first)
    jq '.tests = (.tests | sort_by(.timestamp) | reverse)' "$HISTORY_FILE" > "${HISTORY_FILE}.tmp" && mv "${HISTORY_FILE}.tmp" "$HISTORY_FILE"
  else
    echo "No reports directory found. Please run JMeter tests first."
  fi
fi

# Copy the history file to all required locations
mkdir -p reports/history
cp "$HISTORY_FILE" reports/history/history.json

echo "History file updated: $HISTORY_FILE"
echo "History files updated successfully!"
echo "You can now view and compare test history in the comparison viewer." 