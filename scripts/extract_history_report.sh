#!/bin/bash

# Script to extract and view a historical JMeter report
# Usage: ./extract_history_report.sh <report_archive_name>

set -e

# Function to display usage
function display_usage {
  echo "Usage: $0 <report_archive_name>"
  echo "Example: $0 report_2023-04-12_15-30-45_a1b2c3d"
  echo ""
  echo "Available reports:"
  ls -1 ../history/ | grep .tar.gz | sed 's/\.tar\.gz$//'
}

# Check if parameter is provided
if [ $# -ne 1 ]; then
  echo "Error: Missing report name parameter."
  display_usage
  exit 1
fi

REPORT_NAME=$1
HISTORY_DIR="../history"
TEMP_DIR="../temp_report_view"

# Check if the report exists
if [ ! -f "${HISTORY_DIR}/${REPORT_NAME}.tar.gz" ]; then
  echo "Error: Report '${REPORT_NAME}' not found in the history directory."
  display_usage
  exit 1
fi

# Create temporary directory
mkdir -p ${TEMP_DIR}

echo "Extracting report ${REPORT_NAME}..."
tar -xzf "${HISTORY_DIR}/${REPORT_NAME}.tar.gz" -C ${TEMP_DIR}

# Display metadata
if [ -f "${TEMP_DIR}/report_${REPORT_NAME}/metadata.txt" ]; then
  echo ""
  echo "Report Metadata:"
  cat "${TEMP_DIR}/report_${REPORT_NAME}/metadata.txt"
  echo ""
fi

# Quick summary from JTL if available
if [ -f "${TEMP_DIR}/report_${REPORT_NAME}/results.jtl" ]; then
  echo "Test Summary:"
  grep "summary =" "${TEMP_DIR}/report_${REPORT_NAME}/results.jtl" || echo "No summary found in JTL file."
  echo ""
fi

echo "Report extracted to: ${TEMP_DIR}/report_${REPORT_NAME}"

# Provide instructions for viewing
echo ""
echo "NOTE: This script is primarily for developer use during local analysis."
echo "For normal usage, view reports directly on the GitHub Pages dashboard:"
echo "https://YOUR_GITHUB_USERNAME.github.io/chaabi-jmeter-tests/dashboard/"
echo ""
echo "For local development only:"
echo "You can open the extracted report by opening the index.html file in that directory:"
echo "file://${PWD}/${TEMP_DIR}/report_${REPORT_NAME}/index.html"
echo ""
echo "Remember to remove the temporary directory when you're done:"
echo "rm -rf ${TEMP_DIR}" 