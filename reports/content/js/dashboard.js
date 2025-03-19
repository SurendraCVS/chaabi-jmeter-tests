/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 97.5, "KoPercent": 2.5};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.6627906976744186, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 500, 1500, "https://chaabi-dev.ipxp.in/api/brands/?page=1&per_page=100000"], "isController": false}, {"data": [1.0, 500, 1500, "https://chaabi-dev.ipxp.in/api/logout/"], "isController": false}, {"data": [1.0, 500, 1500, "https://chaabi-dev.ipxp.in/api/user-data/"], "isController": false}, {"data": [0.5, 500, 1500, "https://chaabi-dev.ipxp.in/api/login/"], "isController": false}, {"data": [0.0, 500, 1500, "https://chaabi-dev.ipxp.in/login"], "isController": false}, {"data": [1.0, 500, 1500, "https://chaabi-dev.ipxp.in/api/site-report/?page=1&per_page=20&search="], "isController": false}, {"data": [0.0, 500, 1500, "Launch"], "isController": true}, {"data": [0.0, 500, 1500, "C_Login"], "isController": true}, {"data": [1.0, 500, 1500, "https://chaabi-dev.ipxp.in/api/status/operational/?page=1&per_page=100000"], "isController": false}, {"data": [0.9166666666666666, 500, 1500, "https://chaabi-dev.ipxp.in/login-4"], "isController": false}, {"data": [0.9166666666666666, 500, 1500, "https://chaabi-dev.ipxp.in/login-3"], "isController": false}, {"data": [0.9166666666666666, 500, 1500, "https://chaabi-dev.ipxp.in/login-2"], "isController": false}, {"data": [0.08333333333333333, 500, 1500, "https://chaabi-dev.ipxp.in/login-1"], "isController": false}, {"data": [0.42857142857142855, 500, 1500, "https://chaabi-dev.ipxp.in/login-0"], "isController": false}, {"data": [1.0, 500, 1500, "https://chaabi-dev.ipxp.in/api/status/financial/?page=1&per_page=100000"], "isController": false}, {"data": [1.0, 500, 1500, "C_Logout"], "isController": true}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 40, 1, 2.5, 865.775, 13, 5693, 358.0, 2986.499999999999, 4594.999999999996, 5693.0, 4.151100041511, 2909.721580369189, 9.483175883405979], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["https://chaabi-dev.ipxp.in/api/brands/?page=1&per_page=100000", 1, 0, 0.0, 366.0, 366, 366, 366.0, 366.0, 366.0, 366.0, 2.73224043715847, 2.7455814549180326, 1.4515027322404372], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/api/logout/", 1, 0, 0.0, 326.0, 326, 326, 326.0, 326.0, 326.0, 326.0, 3.067484662576687, 3.220259777607362, 1.8153278374233128], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/api/user-data/", 2, 0, 0.0, 351.5, 351, 352, 351.5, 352.0, 352.0, 352.0, 2.840909090909091, 4.788485440340909, 1.4537464488636365], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/api/login/", 1, 0, 0.0, 1490.0, 1490, 1490, 1490.0, 1490.0, 1490.0, 1490.0, 0.6711409395973154, 0.8821833053691275, 0.3440908137583893], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/login", 1, 0, 0.0, 5693.0, 5693, 5693, 5693.0, 5693.0, 5693.0, 5693.0, 0.1756543123133673, 1964.7758211839102, 3.18630747189531], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/api/site-report/?page=1&per_page=20&search=", 1, 0, 0.0, 359.0, 359, 359, 359.0, 359.0, 359.0, 359.0, 2.785515320334262, 2.812717618384401, 1.504287082172702], "isController": false}, {"data": ["Launch", 1, 0, 0.0, 5693.0, 5693, 5693, 5693.0, 5693.0, 5693.0, 5693.0, 0.1756543123133673, 1964.7758211839102, 3.18630747189531], "isController": true}, {"data": ["C_Login", 1, 0, 0.0, 3601.0, 3601, 3601, 3601.0, 3601.0, 3601.0, 3601.0, 0.27770063871146905, 2.4263550923354624, 1.0251058733685088], "isController": true}, {"data": ["https://chaabi-dev.ipxp.in/api/status/operational/?page=1&per_page=100000", 1, 0, 0.0, 326.0, 326, 326, 326.0, 326.0, 326.0, 326.0, 3.067484662576687, 3.1154141104294477, 1.6655483128834354], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/login-4", 6, 0, 0.0, 161.16666666666669, 14, 820, 25.0, 820.0, 820.0, 820.0, 1.549186676994578, 63.14902449651433, 1.101879195713917], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/login-3", 6, 0, 0.0, 223.33333333333331, 14, 1009, 21.5, 1009.0, 1009.0, 1009.0, 1.5495867768595042, 2820.3702564081873, 1.100146080836777], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/login-2", 6, 0, 0.0, 149.16666666666669, 13, 806, 18.5, 806.0, 806.0, 806.0, 1.5444015444015444, 2.024010617760618, 1.0678088803088803], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/login-1", 6, 0, 0.0, 2694.5, 775, 4634, 2684.5, 4634.0, 4634.0, 4634.0, 1.294777729823047, 1221.1734934721621, 11.120041743094518], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/login-0", 7, 1, 14.285714285714286, 806.0, 751, 1026, 775.0, 1026.0, 1026.0, 1026.0, 1.2295801861935711, 1.930482061303355, 0.8345295209028633], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/api/status/financial/?page=1&per_page=100000", 1, 0, 0.0, 357.0, 357, 357, 357.0, 357.0, 357.0, 357.0, 2.8011204481792715, 2.8613007703081235, 1.5154499299719888], "isController": false}, {"data": ["C_Logout", 1, 0, 0.0, 326.0, 326, 326, 326.0, 326.0, 326.0, 326.0, 3.067484662576687, 3.220259777607362, 1.8153278374233128], "isController": true}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["Non HTTP response code: java.lang.Exception/Non HTTP response message: Maximum frame/iframe nesting depth exceeded.", 1, 100.0, 2.5], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 40, 1, "Non HTTP response code: java.lang.Exception/Non HTTP response message: Maximum frame/iframe nesting depth exceeded.", 1, "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/login-0", 7, 1, "Non HTTP response code: java.lang.Exception/Non HTTP response message: Maximum frame/iframe nesting depth exceeded.", 1, "", "", "", "", "", "", "", ""], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
