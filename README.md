# JMeter Test History and Visualization

This project provides tools to track JMeter test history and visualize performance trends over time.

## Features

- Automated collection of JMeter test results
- Historical tracking of test performance
- Visualization dashboard with charts and tables
- GitHub Actions workflow for automatic updates

## Directory Structure

```
chaabi-jmeter-tests/
├── .github/workflows/           # GitHub Actions workflows
│   └── update-history.yml       # Workflow to update history files
├── reports/                     # JMeter test reports
│   ├── [timestamp]/             # Individual test runs
│   └── history/                 # History tracking
│       ├── history.json         # Test history data
│       └── index.html           # Visualization dashboard
├── scripts/
│   ├── history/                 # History data storage
│   │   └── history.json         # Master history file
│   └── update_history.sh        # Script to update history
└── README.md                    # This documentation
```

## Setting Up

1. Clone this repository
2. Make sure your JMeter tests output their results to the `reports/[timestamp]` directory
3. Run JMeter tests or place existing results in the reports directory

## Tracking Test History

The system automatically tracks test history using the `update_history.sh` script. This script:

1. Scans the `reports` directory for test results
2. Extracts key metrics (success rate, response time)
3. Updates the history.json file with new data
4. Preserves historical trends for visualization

### Manual Update

To manually update the history file:

```bash
# Run from the project root
./scripts/update_history.sh
```

### Automatic Updates

The GitHub Actions workflow automatically updates the history file when:

- New test results are pushed to the repository
- The workflow is manually triggered

## Viewing the Dashboard

To view the visualization dashboard:

1. After running the update script, open `reports/history/index.html` in a web browser
2. The dashboard shows:
   - Success rate trends over time
   - Response time trends over time
   - Latest test results summary
   - Complete test history table

## Customization

- **Test Categories**: The system automatically groups tests by name
- **Colors**: Thresholds for success/warning/error are adjustable in the dashboard code
- **Metrics**: The update script can be modified to track additional metrics

## Troubleshooting

- If test results aren't appearing, check that your JMeter output includes statistics.json files
- Ensure the update script has execute permissions (`chmod +x scripts/update_history.sh`)
- For GitHub Actions issues, check the workflow run logs

## License

This project is open source and available under the MIT License.