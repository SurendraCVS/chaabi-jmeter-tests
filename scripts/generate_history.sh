#!/bin/bash

# Script to generate historical comparison data and visualizations
# Usage: ./generate_history.sh <results_jtl_file> <history_dir> <output_dir>

set -e

RESULTS_FILE=$1
HISTORY_DIR=$2
OUTPUT_DIR=$3
CURRENT_DATE=$(date +'%Y-%m-%d_%H-%M-%S')

# Create required directories
mkdir -p "$OUTPUT_DIR"
mkdir -p "$HISTORY_DIR"

# Save current test results to history
cp "$RESULTS_FILE" "$HISTORY_DIR/results_$CURRENT_DATE.jtl"

echo "Generating historical comparison data..."

# Extract metrics from current test
echo "Processing current test results..."
CURR_SAMPLES=$(grep "summary =" "$RESULTS_FILE" | grep -oP 'samples=\K[0-9]+' || echo "0")
CURR_FAIL=$(grep "summary =" "$RESULTS_FILE" | grep -oP 'Err: *\K[0-9]+' || echo "0")
# Calculate error percentage
if [ "$CURR_SAMPLES" -eq 0 ]; then
  CURR_ERROR_PCT="0.00"
else
  CURR_ERROR_PCT=$(echo "scale=2; 100 * $CURR_FAIL / $CURR_SAMPLES" | bc)
fi
CURR_AVG_RT=$(grep "summary =" "$RESULTS_FILE" | grep -oP 'average=\K[0-9]+' || echo "0")
CURR_MIN_RT=$(grep "summary =" "$RESULTS_FILE" | grep -oP 'min=\K[0-9]+' || echo "0")
CURR_MAX_RT=$(grep "summary =" "$RESULTS_FILE" | grep -oP 'max=\K[0-9]+' || echo "0")
CURR_MEDIAN_RT=$(grep "summary =" "$RESULTS_FILE" | grep -oP 'median=\K[0-9]+' || echo "0")
CURR_PCT90_RT=$(grep "summary =" "$RESULTS_FILE" | grep -oP '90%=\K[0-9]+' || echo "0")
CURR_PCT95_RT=$(grep "summary =" "$RESULTS_FILE" | grep -oP '95%=\K[0-9]+' || echo "0")
CURR_PCT99_RT=$(grep "summary =" "$RESULTS_FILE" | grep -oP '99%=\K[0-9]+' || echo "0")
CURR_THROUGHPUT=$(grep "summary =" "$RESULTS_FILE" | grep -oP 'Throughput=\K[0-9.]+' || echo "0")
CURR_KB_RECEIVED=$(grep "summary =" "$RESULTS_FILE" | grep -oP 'received_KB/sec=\K[0-9.]+' || echo "0")
CURR_KB_SENT=$(grep "summary =" "$RESULTS_FILE" | grep -oP 'sent_KB/sec=\K[0-9.]+' || echo "0")

# Create JSON data file
echo "Creating JSON data file..."
echo "{" > "$OUTPUT_DIR/history.json"
echo "  \"tests\": [" >> "$OUTPUT_DIR/history.json"

# Add current test
echo "    {" >> "$OUTPUT_DIR/history.json"
echo "      \"date\": \"$CURRENT_DATE\"," >> "$OUTPUT_DIR/history.json"
echo "      \"samples\": $CURR_SAMPLES," >> "$OUTPUT_DIR/history.json"
echo "      \"fail\": $CURR_FAIL," >> "$OUTPUT_DIR/history.json"
echo "      \"errorPct\": $CURR_ERROR_PCT," >> "$OUTPUT_DIR/history.json"
echo "      \"avgResponseTime\": $CURR_AVG_RT," >> "$OUTPUT_DIR/history.json"
echo "      \"minResponseTime\": $CURR_MIN_RT," >> "$OUTPUT_DIR/history.json"
echo "      \"maxResponseTime\": $CURR_MAX_RT," >> "$OUTPUT_DIR/history.json"
echo "      \"medianResponseTime\": $CURR_MEDIAN_RT," >> "$OUTPUT_DIR/history.json"
echo "      \"pct90ResponseTime\": $CURR_PCT90_RT," >> "$OUTPUT_DIR/history.json"
echo "      \"pct95ResponseTime\": $CURR_PCT95_RT," >> "$OUTPUT_DIR/history.json"
echo "      \"pct99ResponseTime\": $CURR_PCT99_RT," >> "$OUTPUT_DIR/history.json"
echo "      \"throughput\": $CURR_THROUGHPUT," >> "$OUTPUT_DIR/history.json"
echo "      \"kbReceived\": $CURR_KB_RECEIVED," >> "$OUTPUT_DIR/history.json"
echo "      \"kbSent\": $CURR_KB_SENT," >> "$OUTPUT_DIR/history.json"
echo "      \"isCurrent\": true" >> "$OUTPUT_DIR/history.json"
echo "    }" >> "$OUTPUT_DIR/history.json"

# Process historical data
COUNT=0
for file in "$HISTORY_DIR"/results_*.jtl; do
  if [[ -f "$file" && "$file" != "$HISTORY_DIR/results_$CURRENT_DATE.jtl" ]]; then
    TEST_DATE=$(basename "$file" | sed 's/results_\(.*\)\.jtl/\1/')

    echo "Processing historical file: $file"
    SAMPLES=$(grep "summary =" "$file" | grep -oP 'samples=\K[0-9]+' || echo "0")
    FAIL=$(grep "summary =" "$file" | grep -oP 'Err: *\K[0-9]+' || echo "0")
    # Calculate error percentage
    if [ "$SAMPLES" -eq 0 ]; then
      ERROR_PCT="0.00"
    else
      ERROR_PCT=$(echo "scale=2; 100 * $FAIL / $SAMPLES" | bc)
    fi
    AVG_RT=$(grep "summary =" "$file" | grep -oP 'average=\K[0-9]+' || echo "0")
    MIN_RT=$(grep "summary =" "$file" | grep -oP 'min=\K[0-9]+' || echo "0")
    MAX_RT=$(grep "summary =" "$file" | grep -oP 'max=\K[0-9]+' || echo "0")
    MEDIAN_RT=$(grep "summary =" "$file" | grep -oP 'median=\K[0-9]+' || echo "0")
    PCT90_RT=$(grep "summary =" "$file" | grep -oP '90%=\K[0-9]+' || echo "0")
    PCT95_RT=$(grep "summary =" "$file" | grep -oP '95%=\K[0-9]+' || echo "0")
    PCT99_RT=$(grep "summary =" "$file" | grep -oP '99%=\K[0-9]+' || echo "0")
    THROUGHPUT=$(grep "summary =" "$file" | grep -oP 'Throughput=\K[0-9.]+' || echo "0")
    KB_RECEIVED=$(grep "summary =" "$file" | grep -oP 'received_KB/sec=\K[0-9.]+' || echo "0")
    KB_SENT=$(grep "summary =" "$file" | grep -oP 'sent_KB/sec=\K[0-9.]+' || echo "0")

    echo "," >> "$OUTPUT_DIR/history.json"
    echo "    {" >> "$OUTPUT_DIR/history.json"
    echo "      \"date\": \"$TEST_DATE\"," >> "$OUTPUT_DIR/history.json"
    echo "      \"samples\": $SAMPLES," >> "$OUTPUT_DIR/history.json"
    echo "      \"fail\": $FAIL," >> "$OUTPUT_DIR/history.json"
    echo "      \"errorPct\": $ERROR_PCT," >> "$OUTPUT_DIR/history.json"
    echo "      \"avgResponseTime\": $AVG_RT," >> "$OUTPUT_DIR/history.json"
    echo "      \"minResponseTime\": $MIN_RT," >> "$OUTPUT_DIR/history.json"
    echo "      \"maxResponseTime\": $MAX_RT," >> "$OUTPUT_DIR/history.json"
    echo "      \"medianResponseTime\": $MEDIAN_RT," >> "$OUTPUT_DIR/history.json"
    echo "      \"pct90ResponseTime\": $PCT90_RT," >> "$OUTPUT_DIR/history.json"
    echo "      \"pct95ResponseTime\": $PCT95_RT," >> "$OUTPUT_DIR/history.json"
    echo "      \"pct99ResponseTime\": $PCT99_RT," >> "$OUTPUT_DIR/history.json"
    echo "      \"throughput\": $THROUGHPUT," >> "$OUTPUT_DIR/history.json"
    echo "      \"kbReceived\": $KB_RECEIVED," >> "$OUTPUT_DIR/history.json"
    echo "      \"kbSent\": $KB_SENT," >> "$OUTPUT_DIR/history.json"
    echo "      \"isCurrent\": false" >> "$OUTPUT_DIR/history.json"
    echo "    }" >> "$OUTPUT_DIR/history.json"

    COUNT=$((COUNT+1))
    # Keep the most recent 20 tests
    if [ "$COUNT" -ge 20 ]; then
      break
    fi
  fi
done

echo "  ]" >> "$OUTPUT_DIR/history.json"
echo "}" >> "$OUTPUT_DIR/history.json"

echo "Historical comparison data generated successfully!" 
