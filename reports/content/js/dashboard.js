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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.6744186046511628, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 500, 1500, "https://chaabi-dev.ipxp.in/api/brands/?page=1&per_page=100000"], "isController": false}, {"data": [1.0, 500, 1500, "https://chaabi-dev.ipxp.in/api/logout/"], "isController": false}, {"data": [1.0, 500, 1500, "https://chaabi-dev.ipxp.in/api/user-data/"], "isController": false}, {"data": [0.5, 500, 1500, "https://chaabi-dev.ipxp.in/api/login/"], "isController": false}, {"data": [0.0, 500, 1500, "https://chaabi-dev.ipxp.in/login"], "isController": false}, {"data": [1.0, 500, 1500, "https://chaabi-dev.ipxp.in/api/site-report/?page=1&per_page=20&search="], "isController": false}, {"data": [0.0, 500, 1500, "Launch"], "isController": true}, {"data": [0.0, 500, 1500, "C_Login"], "isController": true}, {"data": [1.0, 500, 1500, "https://chaabi-dev.ipxp.in/api/status/operational/?page=1&per_page=100000"], "isController": false}, {"data": [0.9166666666666666, 500, 1500, "https://chaabi-dev.ipxp.in/login-4"], "isController": false}, {"data": [0.9166666666666666, 500, 1500, "https://chaabi-dev.ipxp.in/login-3"], "isController": false}, {"data": [0.9166666666666666, 500, 1500, "https://chaabi-dev.ipxp.in/login-2"], "isController": false}, {"data": [0.16666666666666666, 500, 1500, "https://chaabi-dev.ipxp.in/login-1"], "isController": false}, {"data": [0.42857142857142855, 500, 1500, "https://chaabi-dev.ipxp.in/login-0"], "isController": false}, {"data": [1.0, 500, 1500, "https://chaabi-dev.ipxp.in/api/status/financial/?page=1&per_page=100000"], "isController": false}, {"data": [1.0, 500, 1500, "C_Logout"], "isController": true}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 40, 1, 2.5, 826.4499999999999, 13, 5458, 346.5, 2861.099999999999, 4384.749999999996, 5458.0, 4.383081306158229, 3072.3342176542296, 10.013136402859962], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["https://chaabi-dev.ipxp.in/api/brands/?page=1&per_page=100000", 1, 0, 0.0, 319.0, 319, 319, 319.0, 319.0, 319.0, 319.0, 3.134796238244514, 3.1745934561128526, 1.665360501567398], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/api/logout/", 1, 0, 0.0, 350.0, 350, 350, 350.0, 350.0, 350.0, 350.0, 2.857142857142857, 3.02734375, 1.6908482142857144], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/api/user-data/", 2, 0, 0.0, 348.5, 343, 354, 348.5, 354.0, 354.0, 354.0, 2.865329512893983, 4.832445379656161, 1.466242836676218], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/api/login/", 1, 0, 0.0, 1320.0, 1320, 1320, 1320.0, 1320.0, 1320.0, 1320.0, 0.7575757575757576, 0.9994969223484848, 0.38840553977272724], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/login", 1, 0, 0.0, 5458.0, 5458, 5458, 5458.0, 5458.0, 5458.0, 5458.0, 0.18321729571271528, 2049.3745562706117, 3.323497331898131], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/api/site-report/?page=1&per_page=20&search=", 1, 0, 0.0, 331.0, 331, 331, 331.0, 331.0, 331.0, 331.0, 3.0211480362537766, 3.1037575528700905, 1.6315379531722054], "isController": false}, {"data": ["Launch", 1, 0, 0.0, 5458.0, 5458, 5458, 5458.0, 5458.0, 5458.0, 5458.0, 0.18321729571271528, 2049.3745562706117, 3.323497331898131], "isController": true}, {"data": ["C_Login", 1, 0, 0.0, 3304.0, 3304, 3304, 3304.0, 3304.0, 3304.0, 3304.0, 0.3026634382566586, 2.6553987590799033, 1.1172537076271187], "isController": true}, {"data": ["https://chaabi-dev.ipxp.in/api/status/operational/?page=1&per_page=100000", 1, 0, 0.0, 322.0, 322, 322, 322.0, 322.0, 322.0, 322.0, 3.105590062111801, 3.166246118012422, 1.686238354037267], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/login-4", 6, 0, 0.0, 159.33333333333334, 17, 799, 22.5, 799.0, 799.0, 799.0, 1.6116035455278002, 65.6946158172173, 1.1462740061778136], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/login-3", 6, 0, 0.0, 214.0, 14, 971, 19.0, 971.0, 971.0, 971.0, 1.6137708445400754, 2937.189275568182, 1.1457142616998386], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/login-2", 6, 0, 0.0, 148.83333333333334, 13, 781, 21.0, 781.0, 781.0, 781.0, 1.6116035455278002, 2.1133935166532365, 1.1142727639000807], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/login-1", 6, 0, 0.0, 2567.3333333333335, 720, 4422, 2561.5, 4422.0, 4422.0, 4422.0, 1.3568521031207597, 1279.7122784514927, 11.653159981343284], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/login-0", 7, 1, 14.285714285714286, 772.7142857142857, 719, 1005, 739.0, 1005.0, 1005.0, 1005.0, 1.2827560930914423, 2.015043751145318, 0.87062059052593], "isController": false}, {"data": ["https://chaabi-dev.ipxp.in/api/status/financial/?page=1&per_page=100000", 1, 0, 0.0, 315.0, 315, 315, 315.0, 315.0, 315.0, 315.0, 3.1746031746031744, 3.2428075396825395, 1.7175099206349207], "isController": false}, {"data": ["C_Logout", 1, 0, 0.0, 350.0, 350, 350, 350.0, 350.0, 350.0, 350.0, 2.857142857142857, 3.02734375, 1.6908482142857144], "isController": true}]}, function(index, item){
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
