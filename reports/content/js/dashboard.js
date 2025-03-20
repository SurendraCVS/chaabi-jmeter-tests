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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.6627906976744186, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 500, 1500, "https://chaabi-dev.ipxp.in/api/brands/?page=1&per_page=100000"], "isController": false}, {"data": [1.0, 500, 1500, "https://chaabi-dev.ipxp.in/api/logout/"], "isController": false}, {"data": [1.0, 500, 1500, "https://chaabi-dev.ipxp.in/api/user-data/"], "isController": false}, {"data": [0.5, 500, 1500, "https://chaabi-dev.ipxp.in/api/login/"], "isController": false}, {"data": [0.0, 500, 1500, "https://chaabi-dev.ipxp.in/login"], "isController": false}, {"data": [1.0, 500, 1500, "https://chaabi-dev.ipxp.in/api/site-report/?page=1&per_page=20&search="], "isController": false}, {"data": [0.0, 500, 1500, "Launch"], "isController": true}, {"data": [0.0, 500, 1500, "C_Login"], "isController": true}, {"data": [1.0, 500, 1500, "https://chaabi-dev.ipxp.in/api/status/operational/?page=1&per_page=100000"], "isController": false}, {"data": [0.9166666666666666, 500, 1500, "https://chaabi-dev.ipxp.in/login-4"], "isController": false}, {"data": [0.9166666666666666, 500, 1500, "https://chaabi-dev.ipxp.in/login-3"], "isController": false}, {"data": [0.9166666666666666, 500, 1500, "https://chaabi-dev.ipxp.in/login-2"], "isController": false}, {"data": [0.16666666666666666, 500, 1500, "https://chaabi-dev.ipxp.in/login-1"], "isController": false}, {"data": [0.35714285714285715, 500, 1500, "https://chaabi-dev.ipxp.in/login-0"], "isController": false}, {"data": [1.0, 500, 1500, "https://chaabi-dev.ipxp.in/api/status/financial/?page=1&per_page=100000"], "isController": false}, {"data": [1.0, 500, 1500, "C_Logout"], "isController": true}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 40, 1, 2.5, 775.125, 11, 5700, 306.0, 2498.099999999999, 3823.099999999997, 5700.0, 4.369197160021845, 3062.1107617080834, 10.007338885854725], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["https://chaabi-dev.ipxp.in/api/brands/?page=1&per_page=100000", 1, 0, 0.0, 304.0, 304, 304, 304.0, 304.0, 304.0, 304.0, 3.289473684210526, 3.3055355674342106, 1.7475328947368423], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/api/logout/", 1, 0, 0.0, 279.0, 279, 279, 279.0, 279.0, 279.0, 279.0, 3.5842293906810037, 3.762740815412186, 2.121135752688172], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/api/user-data/", 2, 0, 0.0, 305.5, 303, 308, 305.5, 308.0, 308.0, 308.0, 3.2679738562091503, 5.514705882352941, 1.6722834967320261], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/api/login/", 1, 0, 0.0, 1340.0, 1340, 1340, 1340.0, 1340.0, 1340.0, 1340.0, 0.746268656716418, 0.9794776119402985, 0.3826084421641791], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/login", 1, 0, 0.0, 5700.0, 5700, 5700, 5700.0, 5700.0, 5700.0, 5700.0, 0.17543859649122806, 1962.104920504386, 3.196271929824561], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/api/site-report/?page=1&per_page=20&search=", 1, 0, 0.0, 328.0, 328, 328, 328.0, 328.0, 328.0, 328.0, 3.048780487804878, 3.102372332317073, 1.646460556402439], "isController": false}, {"data": ["Launch", 1, 0, 0.0, 5700.0, 5700, 5700, 5700.0, 5700.0, 5700.0, 5700.0, 0.17543859649122806, 1962.104920504386, 3.196271929824561], "isController": true}, {"data": ["C_Login", 1, 0, 0.0, 3156.0, 3156, 3156, 3156.0, 3156.0, 3156.0, 3156.0, 0.3168567807351077, 2.7715685400823826, 1.1696471007604563], "isController": true}, {"data": ["https://chaabi-dev.ipxp.in/api/status/operational/?page=1&per_page=100000", 1, 0, 0.0, 291.0, 291, 291, 291.0, 291.0, 291.0, 291.0, 3.4364261168384878, 3.50354381443299, 1.865871993127148], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/login-4", 6, 0, 0.0, 140.5, 14, 689, 32.0, 689.0, 689.0, 689.0, 1.8524235875270143, 75.50616027323248, 1.317560396727385], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/login-3", 6, 0, 0.0, 206.33333333333334, 14, 911, 21.0, 911.0, 911.0, 911.0, 1.8484288354898337, 3364.279774626463, 1.3123122689463955], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/login-2", 6, 0, 0.0, 118.33333333333333, 11, 630, 14.5, 630.0, 630.0, 630.0, 1.8524235875270143, 1.9808631136153134, 1.3051988460944737], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/login-1", 6, 0, 0.0, 2238.3333333333335, 631, 3856, 2234.5, 3856.0, 3856.0, 3856.0, 1.55561317085818, 1466.7890260403162, 13.380703914959813], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/login-0", 7, 1, 14.285714285714286, 806.9999999999999, 628, 1807, 641.0, 1807.0, 1807.0, 1807.0, 1.2278547623223997, 1.9279443847570603, 0.8333584568496756], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/api/status/financial/?page=1&per_page=100000", 1, 0, 0.0, 282.0, 282, 282, 282.0, 282.0, 282.0, 282.0, 3.5460992907801416, 3.608433067375887, 1.9184951241134753], "isController": false}, {"data": ["C_Logout", 1, 0, 0.0, 279.0, 279, 279, 279.0, 279.0, 279.0, 279.0, 3.5842293906810037, 3.762740815412186, 2.121135752688172], "isController": true}]}, function(index, item){
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
