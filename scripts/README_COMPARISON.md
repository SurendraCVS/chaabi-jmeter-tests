# JMeter Test Comparison Viewer

This is a dedicated visualization tool for comparing JMeter test results. It allows you to compare performance metrics between any two test runs, providing insights into performance improvements or regressions.

## Features

- **Test Selection**: Choose any two test runs from your historical data to compare
- **Visual Comparison**: View side-by-side comparisons with intuitive charts
- **Metric Overview**: Radar chart showing multiple metrics at once
- **Performance Summary**: At-a-glance indicators showing improvements or regressions
- **Detailed Metrics**: Complete table of all metrics with percentage changes
- **Interactive Graphs**: Bar charts showing key performance metrics

## Available Metrics

- Average Response Time (ms)
- Median Response Time (ms)
- 90th/95th/99th Percentile Response Times (ms)
- Min/Max Response Times (ms)
- Throughput (requests/second)
- Error Rate (%)
- Error Count
- Sample Count
- Network Bandwidth (KB/sec)

## How to Use

1. Run JMeter tests using the project's CI/CD pipeline or locally
2. Access the comparison viewer at `reports/comparison/index.html`
3. Select a baseline (previous) test from the dropdown
4. Select a current test to compare against
5. Click "Compare" to generate visualizations

## Running Locally

You can run the comparison viewer locally after generating test results:

```bash
# Make the script executable (if not already)
chmod +x ./scripts/launch_comparison_viewer.sh

# Run the comparison viewer
./scripts/launch_comparison_viewer.sh
```

## Integration with CI/CD

The comparison viewer is automatically set up when tests are run in the CI/CD pipeline. A link to the comparison tool is added to the main JMeter report page.

## Key Indicators

- **Green**: Indicates a performance improvement
- **Red**: Indicates a performance degradation
- **Gray**: Indicates no significant change

## Requirements

- Test history data must be available in `jmeter-pages/reports/history/history.json`
- Modern web browser with JavaScript enabled

## Files

- `comparison_viewer.html`: The main HTML file for the comparison UI
- `comparison_viewer.js`: JavaScript code for processing data and generating charts
- `launch_comparison_viewer.sh`: Shell script to set up and launch the comparison viewer 