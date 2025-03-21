#!/usr/bin/env python3

# Script to generate trend charts from historical JMeter reports
# Usage: python3 generate_trend_chart.py

import os
import re
import glob
import json
import subprocess
import datetime
import argparse
from collections import defaultdict

def parse_args():
    parser = argparse.ArgumentParser(description='Generate trend charts from historical JMeter reports')
    parser.add_argument('--history-dir', default='../history',
                      help='Directory containing historical report archives (default: ../history)')
    parser.add_argument('--output-dir', default='../dashboard',
                      help='Directory to output trend charts (default: ../dashboard)')
    parser.add_argument('--max-reports', type=int, default=10,
                      help='Maximum number of reports to include in trend (default: 10)')
    return parser.parse_args()

def extract_metrics_from_archive(archive_path):
    """Extract key metrics from a JMeter report archive"""
    # Create a temporary directory for extraction
    temp_dir = "/tmp/jmeter_trend_temp"
    if not os.path.exists(temp_dir):
        os.makedirs(temp_dir)
    
    # Extract the archive
    subprocess.run(['tar', '-xzf', archive_path, '-C', temp_dir], check=True)
    
    # Find the results.jtl file
    jtl_file = None
    for root, dirs, files in os.walk(temp_dir):
        for file in files:
            if file == 'results.jtl':
                jtl_file = os.path.join(root, file)
                break
        if jtl_file:
            break
    
    if not jtl_file:
        print(f"Warning: No results.jtl found in {archive_path}")
        return None
    
    # Find metadata.txt file
    metadata_file = None
    for root, dirs, files in os.walk(temp_dir):
        for file in files:
            if file == 'metadata.txt':
                metadata_file = os.path.join(root, file)
                break
        if metadata_file:
            break
    
    # Read metadata
    metadata = {}
    if metadata_file:
        with open(metadata_file, 'r') as f:
            for line in f:
                if ':' in line:
                    key, value = line.strip().split(':', 1)
                    metadata[key.strip()] = value.strip()
    
    # Extract timestamp from archive name if not in metadata
    if 'Timestamp' not in metadata:
        match = re.search(r'report_(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})', archive_path)
        if match:
            metadata['Timestamp'] = match.group(1).replace('_', ' ')
    
    # Extract the last summary line from JTL
    summary_line = None
    with open(jtl_file, 'r') as f:
        for line in f:
            if 'summary =' in line:
                summary_line = line
    
    if not summary_line:
        print(f"Warning: No summary line found in {jtl_file}")
        return None
    
    # Extract metrics from summary line
    metrics = {}
    
    # Extract samples
    samples_match = re.search(r'#samples=(\d+)', summary_line)
    if samples_match:
        metrics['samples'] = int(samples_match.group(1))
    
    # Extract average response time
    avg_match = re.search(r'Avg:\s+(\d+(\.\d+)?)', summary_line)
    if avg_match:
        metrics['avg_response_time'] = float(avg_match.group(1))
    
    # Extract error rate
    error_match = re.search(r'Err:\s+(\d+(\.\d+)?)', summary_line)
    if error_match:
        metrics['error_rate'] = float(error_match.group(1))
    
    # Extract throughput
    tps_match = re.search(r'req/s:\s+(\d+(\.\d+)?)', summary_line)
    if tps_match:
        metrics['throughput'] = float(tps_match.group(1))
    
    # Cleanup
    subprocess.run(['rm', '-rf', temp_dir], check=True)
    
    # Combine metadata and metrics
    result = {
        'metadata': metadata,
        'metrics': metrics
    }
    
    return result

def generate_trend_charts(history_dir, output_dir, max_reports=10):
    """Generate trend charts from historical JMeter reports"""
    # Create output directory if it doesn't exist
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Find all report archives
    archives = glob.glob(os.path.join(history_dir, 'report_*.tar.gz'))
    archives.sort(key=lambda x: os.path.getmtime(x), reverse=True)
    
    # Limit to max_reports
    if max_reports > 0:
        archives = archives[:max_reports]
    
    if not archives:
        print(f"No report archives found in {history_dir}")
        return
    
    # Extract metrics from each archive
    all_data = []
    for archive in archives:
        print(f"Processing {os.path.basename(archive)}...")
        data = extract_metrics_from_archive(archive)
        if data:
            # Add filename
            data['filename'] = os.path.basename(archive).replace('.tar.gz', '')
            all_data.append(data)
    
    # Sort by timestamp
    all_data.sort(key=lambda x: x['metadata'].get('Timestamp', ''), reverse=False)
    
    # Prepare data for charts
    labels = []
    avg_response_times = []
    throughputs = []
    error_rates = []
    
    for data in all_data:
        # Use abbreviated timestamp for label
        ts = data['metadata'].get('Timestamp', '')
        if ts:
            try:
                dt = datetime.datetime.strptime(ts, '%Y-%m-%d %H-%M-%S')
                label = dt.strftime('%m-%d %H:%M')
            except ValueError:
                label = ts
        else:
            label = data['filename']
        
        labels.append(label)
        avg_response_times.append(data['metrics'].get('avg_response_time', 0))
        throughputs.append(data['metrics'].get('throughput', 0))
        error_rates.append(data['metrics'].get('error_rate', 0))
    
    # Create JSON data for charts
    chart_data = {
        'labels': labels,
        'datasets': [
            {
                'label': 'Avg Response Time (ms)',
                'data': avg_response_times,
                'borderColor': 'rgb(255, 99, 132)',
                'backgroundColor': 'rgba(255, 99, 132, 0.5)',
                'yAxisID': 'y-axis-1'
            },
            {
                'label': 'Throughput (req/s)',
                'data': throughputs,
                'borderColor': 'rgb(54, 162, 235)',
                'backgroundColor': 'rgba(54, 162, 235, 0.5)',
                'yAxisID': 'y-axis-2'
            },
            {
                'label': 'Error Rate (%)',
                'data': error_rates,
                'borderColor': 'rgb(255, 159, 64)',
                'backgroundColor': 'rgba(255, 159, 64, 0.5)',
                'yAxisID': 'y-axis-1'
            }
        ]
    }
    
    # Write data to JSON file
    with open(os.path.join(output_dir, 'trend_data.json'), 'w') as f:
        json.dump(chart_data, f, indent=2)
    
    # Create HTML file with Chart.js
    html_content = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JMeter Performance Trends</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body {{ font-family: Arial, sans-serif; margin: 20px; }}
    .chart-container {{ width: 90%; height: 400px; margin: 20px auto; }}
  </style>
</head>
<body>
  <h1>JMeter Performance Trends</h1>
  <p>Showing trends from the last {num_reports} test runs</p>
  
  <div class="chart-container">
    <canvas id="trendChart"></canvas>
  </div>
  
  <script>
    // Load chart data
    const chartData = {chart_data};
    
    // Create chart
    const ctx = document.getElementById('trendChart').getContext('2d');
    const chart = new Chart(ctx, {{
      type: 'line',
      data: chartData,
      options: {{
        responsive: true,
        maintainAspectRatio: false,
        scales: {{
          x: {{
            title: {{
              display: true,
              text: 'Test Run Date/Time'
            }}
          }},
          'y-axis-1': {{
            type: 'linear',
            position: 'left',
            title: {{
              display: true,
              text: 'Response Time (ms) / Error Rate (%)'
            }}
          }},
          'y-axis-2': {{
            type: 'linear',
            position: 'right',
            title: {{
              display: true,
              text: 'Throughput (req/s)'
            }},
            grid: {{
              drawOnChartArea: false
            }}
          }}
        }},
        plugins: {{
          tooltip: {{
            mode: 'index',
            intersect: false
          }}
        }}
      }}
    }});
  </script>
</body>
</html>
""".format(num_reports=len(all_data), chart_data=json.dumps(chart_data))
    
    with open(os.path.join(output_dir, 'trend_chart.html'), 'w') as f:
        f.write(html_content)
    
    print(f"Trend chart generated: {os.path.join(output_dir, 'trend_chart.html')}")
    
    # Create a link to the trend chart from the main dashboard
    with open(os.path.join(output_dir, 'index.html'), 'r') as f:
        dashboard_content = f.read()
    
    # Add link to trend chart if not already present
    if '<a href="trend_chart.html">' not in dashboard_content:
        # Find appropriate position to insert link
        if '<h2>Test Reports History</h2>' in dashboard_content:
            dashboard_content = dashboard_content.replace(
                '<h2>Test Reports History</h2>',
                '<h2>Test Reports History</h2>\n  <p><a href="trend_chart.html">View Performance Trends Chart</a></p>'
            )
        else:
            # If the marker is not found, append at the end of body
            dashboard_content = dashboard_content.replace(
                '</body>',
                '  <p><a href="trend_chart.html">View Performance Trends Chart</a></p>\n</body>'
            )
            
        with open(os.path.join(output_dir, 'index.html'), 'w') as f:
            f.write(dashboard_content)

if __name__ == "__main__":
    args = parse_args()
    generate_trend_charts(args.history_dir, args.output_dir, args.max_reports) 