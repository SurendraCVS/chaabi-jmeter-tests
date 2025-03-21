# Chaabi JMeter Performance Tests

This repository contains JMeter performance tests for the Chaabi application, along with a CI/CD pipeline to automatically run tests and store historical test results for comparison.

## Overview

The project is designed to:

1. Run JMeter tests against the Chaabi application
2. Generate detailed performance reports
3. Save historical test results for trend analysis
4. Display test history in a dashboard with comparison capabilities
5. Automatically deploy reports to GitHub Pages

## Test Configuration

The main JMeter test plan (`C_1.jmx`) tests the Chaabi application with:
- Load: 100 virtual users
- Ramp-up period: 10 seconds
- Test duration: 60 seconds

These values can be adjusted in the GitHub workflow file.

## Repository Structure

```
chaabi-jmeter-tests/
├── .github/
│   └── workflows/
│       └── main.yml       # CI/CD workflow configuration
├── scripts/
│   ├── extract_history_report.sh  # Script to extract historical reports
│   ├── compare_reports.sh         # Script to compare two test reports
│   └── generate_trend_chart.py    # Script to generate performance trend charts
├── C_1.jmx                # JMeter test plan
├── README.md              # This file
└── .gitignore             # Git ignore file
```

## How It Works

### Automated Testing Pipeline

1. **Test Execution**: On every push to the main branch, GitHub Actions runs the JMeter test
2. **Report Generation**: JMeter generates HTML reports and JTL results
3. **Historical Storage**: A snapshot of the report is archived with metadata
4. **Dashboard Generation**: A dashboard of all test runs is created
5. **Trend Visualization**: Performance trends across test runs are visualized
6. **Deployment**: All reports are deployed to GitHub Pages

### Viewing Test Results

The GitHub Pages deployment provides:
- Current test results
- Historical test dashboard with interactive features:
  - Direct access to any historical report
  - Interactive comparison of any two historical reports
  - Visual trend analysis charts
  - Side-by-side comparison view with resizable panels

Access the reports at: `https://<username>.github.io/chaabi-jmeter-tests/`

### Report Features

The history dashboard includes:
- A chronological list of all test runs with timestamps and commit IDs
- Direct links to view any historical report
- A comparison tool to select and compare any two reports side by side
- Trend charts showing performance metrics over time
- Color-coded performance indicators (better/worse) when comparing reports

## Local Development

### Prerequisites

- Apache JMeter 5.6.2+
- Java JRE 11+
- Python 3.6+ (for trend analysis)

### Running Tests Locally

```bash
# Run JMeter test
jmeter -n -t C_1.jmx -l results.jtl -e -o ./reports

# For local development only:
# Extract a historical report for analysis
./scripts/extract_history_report.sh report_2023-04-12_15-30-45_a1b2c3d

# Compare two test reports locally
./scripts/compare_reports.sh report_2023-04-10_15-30-45_a1b2c3d report_2023-04-12_16-45-30_e5f6g7h

# Generate trend charts locally
python ./scripts/generate_trend_chart.py
```

## Historical Data Analysis

The project maintains a history of all test runs, allowing you to:

1. **View historical trends**: See how performance metrics change over time
2. **Compare specific test runs**: Directly compare two test executions through the web interface
3. **Identify performance regressions**: Spot when performance degrades

Key metrics tracked:
- Response time (ms)
- Throughput (requests/second)
- Error rate (%)
- Total samples processed

## Customization

You can customize the tests by:

1. Modifying the JMeter test plan (`C_1.jmx`)
2. Adjusting test parameters in the workflow file (`.github/workflows/main.yml`)
3. Enhancing the trend analysis in the Python scripts

## Troubleshooting

If you encounter issues:

1. Check the GitHub Actions logs for detailed error messages
2. Verify JMeter is correctly configured in the workflow
3. Ensure GitHub Pages is enabled for the repository
4. Check that the necessary permissions are set for GitHub Actions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
