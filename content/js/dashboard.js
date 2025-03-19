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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.5930232558139535, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 500, 1500, "https://chaabi-dev.ipxp.in/api/brands/?page=1&per_page=100000"], "isController": false}, {"data": [1.0, 500, 1500, "https://chaabi-dev.ipxp.in/api/logout/"], "isController": false}, {"data": [1.0, 500, 1500, "https://chaabi-dev.ipxp.in/api/user-data/"], "isController": false}, {"data": [0.5, 500, 1500, "https://chaabi-dev.ipxp.in/api/login/"], "isController": false}, {"data": [0.0, 500, 1500, "https://chaabi-dev.ipxp.in/login"], "isController": false}, {"data": [1.0, 500, 1500, "https://chaabi-dev.ipxp.in/api/site-report/?page=1&per_page=20&search="], "isController": false}, {"data": [0.0, 500, 1500, "Launch"], "isController": true}, {"data": [0.0, 500, 1500, "C_Login"], "isController": true}, {"data": [1.0, 500, 1500, "https://chaabi-dev.ipxp.in/api/status/operational/?page=1&per_page=100000"], "isController": false}, {"data": [0.75, 500, 1500, "https://chaabi-dev.ipxp.in/login-4"], "isController": false}, {"data": [0.5833333333333334, 500, 1500, "https://chaabi-dev.ipxp.in/login-3"], "isController": false}, {"data": [0.9166666666666666, 500, 1500, "https://chaabi-dev.ipxp.in/login-2"], "isController": false}, {"data": [0.08333333333333333, 500, 1500, "https://chaabi-dev.ipxp.in/login-1"], "isController": false}, {"data": [0.42857142857142855, 500, 1500, "https://chaabi-dev.ipxp.in/login-0"], "isController": false}, {"data": [1.0, 500, 1500, "https://chaabi-dev.ipxp.in/api/status/financial/?page=1&per_page=100000"], "isController": false}, {"data": [1.0, 500, 1500, "C_Logout"], "isController": true}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 40, 1, 2.5, 1029.1000000000001, 13, 5671, 756.5, 3030.5999999999995, 4592.749999999996, 5671.0, 4.179728317659353, 8062.4534678683385, 9.471431720219435], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["https://chaabi-dev.ipxp.in/api/brands/?page=1&per_page=100000", 1, 0, 0.0, 354.0, 354, 354, 354.0, 354.0, 354.0, 354.0, 2.824858757062147, 2.8717558262711864, 1.5007062146892656], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/api/logout/", 1, 0, 0.0, 341.0, 341, 341, 341.0, 341.0, 341.0, 341.0, 2.932551319648094, 3.124427236070381, 1.735474706744868], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/api/user-data/", 2, 0, 0.0, 356.5, 356, 357, 356.5, 357.0, 357.0, 357.0, 2.8011204481792715, 4.740568102240896, 1.4333858543417368], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/api/login/", 1, 0, 0.0, 1408.0, 1408, 1408, 1408.0, 1408.0, 1408.0, 1408.0, 0.7102272727272727, 0.9391091086647728, 0.3641301935369318], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/login", 1, 0, 0.0, 5671.0, 5671, 5671, 5671.0, 5671.0, 5671.0, 5671.0, 0.17633574325515783, 3897.180591220684, 3.169738306736025], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/api/site-report/?page=1&per_page=20&search=", 1, 0, 0.0, 361.0, 361, 361, 361.0, 361.0, 361.0, 361.0, 2.770083102493075, 2.818775969529086, 1.4959530817174516], "isController": false}, {"data": ["Launch", 1, 0, 0.0, 5671.0, 5671, 5671, 5671.0, 5671.0, 5671.0, 5671.0, 0.17633574325515783, 3897.180591220684, 3.169738306736025], "isController": true}, {"data": ["C_Login", 1, 0, 0.0, 3542.0, 3542, 3542, 3542.0, 3542.0, 3542.0, 3542.0, 0.282326369282891, 2.4827626517504235, 1.0421813241106719], "isController": true}, {"data": ["https://chaabi-dev.ipxp.in/api/status/operational/?page=1&per_page=100000", 1, 0, 0.0, 376.0, 376, 376, 376.0, 376.0, 376.0, 376.0, 2.6595744680851063, 2.742686170212766, 1.444065824468085], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/login-4", 6, 0, 0.0, 401.0, 13, 1552, 23.5, 1552.0, 1552.0, 1552.0, 1.5467904098994587, 63.04530404098995, 1.100174819541119], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/login-3", 6, 0, 0.0, 1089.6666666666667, 19, 2793, 843.5, 2793.0, 2793.0, 2793.0, 1.5455950540958268, 5624.918997134209, 1.0550497488408037], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/login-2", 6, 0, 0.0, 150.33333333333331, 14, 791, 25.5, 791.0, 791.0, 791.0, 1.5424164524421595, 2.020655928663239, 1.0664363753213366], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/login-1", 6, 0, 0.0, 2690.1666666666665, 773, 4632, 2675.0, 4632.0, 4632.0, 4632.0, 1.2953367875647668, 7113.03310361345, 11.036294729598447], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/login-0", 7, 1, 14.285714285714286, 803.2857142857143, 752, 1009, 773.0, 1009.0, 1009.0, 1009.0, 1.2343502027861046, 1.9381433499382823, 0.8377669833362722], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/api/status/financial/?page=1&per_page=100000", 1, 0, 0.0, 330.0, 330, 330, 330.0, 330.0, 330.0, 330.0, 3.0303030303030303, 3.095407196969697, 1.6394412878787878], "isController": false}, {"data": ["C_Logout", 1, 0, 0.0, 341.0, 341, 341, 341.0, 341.0, 341.0, 341.0, 2.932551319648094, 3.124427236070381, 1.735474706744868], "isController": true}]}, function(index, item){
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
