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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.7441860465116279, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 500, 1500, "https://chaabi-dev.ipxp.in/api/brands/?page=1&per_page=100000"], "isController": false}, {"data": [1.0, 500, 1500, "https://chaabi-dev.ipxp.in/api/logout/"], "isController": false}, {"data": [1.0, 500, 1500, "https://chaabi-dev.ipxp.in/api/user-data/"], "isController": false}, {"data": [0.0, 500, 1500, "https://chaabi-dev.ipxp.in/api/login/"], "isController": false}, {"data": [0.0, 500, 1500, "https://chaabi-dev.ipxp.in/login"], "isController": false}, {"data": [1.0, 500, 1500, "https://chaabi-dev.ipxp.in/api/site-report/?page=1&per_page=20&search="], "isController": false}, {"data": [0.0, 500, 1500, "Launch"], "isController": true}, {"data": [0.0, 500, 1500, "C_Login"], "isController": true}, {"data": [1.0, 500, 1500, "https://chaabi-dev.ipxp.in/api/status/operational/?page=1&per_page=100000"], "isController": false}, {"data": [0.8333333333333334, 500, 1500, "https://chaabi-dev.ipxp.in/login-4"], "isController": false}, {"data": [1.0, 500, 1500, "https://chaabi-dev.ipxp.in/login-3"], "isController": false}, {"data": [0.9166666666666666, 500, 1500, "https://chaabi-dev.ipxp.in/login-2"], "isController": false}, {"data": [0.4166666666666667, 500, 1500, "https://chaabi-dev.ipxp.in/login-1"], "isController": false}, {"data": [0.7142857142857143, 500, 1500, "https://chaabi-dev.ipxp.in/login-0"], "isController": false}, {"data": [1.0, 500, 1500, "https://chaabi-dev.ipxp.in/api/status/financial/?page=1&per_page=100000"], "isController": false}, {"data": [1.0, 500, 1500, "C_Logout"], "isController": true}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 40, 1, 2.5, 601.7499999999999, 16, 3512, 262.0, 1662.3999999999999, 1800.7999999999997, 3512.0, 4.910988336402701, 6252.805593922652, 11.06806802486188], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["https://chaabi-dev.ipxp.in/api/brands/?page=1&per_page=100000", 1, 0, 0.0, 407.0, 407, 407, 407.0, 407.0, 407.0, 407.0, 2.457002457002457, 2.483396038083538, 1.3052825552825553], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/api/logout/", 1, 0, 0.0, 396.0, 396, 396, 396.0, 396.0, 396.0, 396.0, 2.5252525252525255, 2.6756826073232323, 1.494436553030303], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/api/user-data/", 2, 0, 0.0, 424.5, 407, 442, 424.5, 442.0, 442.0, 442.0, 2.352941176470588, 3.9705882352941178, 1.2040441176470589], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/api/login/", 1, 0, 0.0, 1721.0, 1721, 1721, 1721.0, 1721.0, 1721.0, 1721.0, 0.5810575246949448, 0.7660426350958744, 0.29790546920395117], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/login", 1, 0, 0.0, 3512.0, 3512, 3512, 3512.0, 3512.0, 3512.0, 3512.0, 0.2847380410022779, 4806.070870853502, 5.094697643792711], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/api/site-report/?page=1&per_page=20&search=", 1, 0, 0.0, 423.0, 423, 423, 423.0, 423.0, 423.0, 423.0, 2.3640661938534278, 2.3871527777777777, 1.2766880910165486], "isController": false}, {"data": ["Launch", 1, 0, 0.0, 3512.0, 3512, 3512, 3512.0, 3512.0, 3512.0, 3512.0, 0.2847380410022779, 4806.070870853502, 5.094697643792711], "isController": true}, {"data": ["C_Login", 1, 0, 0.0, 4220.0, 4220, 4220, 4220.0, 4220.0, 4220.0, 4220.0, 0.23696682464454977, 2.0732283027251186, 0.8747408175355451], "isController": true}, {"data": ["https://chaabi-dev.ipxp.in/api/status/operational/?page=1&per_page=100000", 1, 0, 0.0, 410.0, 410, 410, 410.0, 410.0, 410.0, 410.0, 2.4390243902439024, 2.486661585365854, 1.324314024390244], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/login-4", 6, 0, 0.0, 395.5, 32, 1805, 129.5, 1805.0, 1805.0, 1805.0, 3.3240997229916895, 268.2192477493075, 2.274497922437673], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/login-3", 6, 0, 0.0, 154.0, 16, 336, 144.0, 336.0, 336.0, 336.0, 13.186813186813186, 35994.25867101648, 9.001545329670328], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/login-2", 6, 0, 0.0, 214.16666666666666, 17, 1043, 52.0, 1043.0, 1043.0, 1043.0, 4.56968773800457, 4.893968964204113, 3.2197555693069306], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/login-1", 6, 0, 0.0, 1356.3333333333335, 1146, 1585, 1333.0, 1585.0, 1585.0, 1585.0, 3.7854889589905363, 10828.402873619874, 32.04665319400631], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/login-0", 7, 1, 14.285714285714286, 460.2857142857142, 32, 1671, 113.0, 1671.0, 1671.0, 1671.0, 2.127659574468085, 2.8584488981762917, 1.444065824468085], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/api/status/financial/?page=1&per_page=100000", 1, 0, 0.0, 410.0, 410, 410, 410.0, 410.0, 410.0, 410.0, 2.4390243902439024, 2.477134146341464, 1.3195503048780488], "isController": false}, {"data": ["C_Logout", 1, 0, 0.0, 396.0, 396, 396, 396.0, 396.0, 396.0, 396.0, 2.5252525252525255, 2.6756826073232323, 1.494436553030303], "isController": true}]}, function(index, item){
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
