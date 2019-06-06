var dataURL = 'https://proxy.hxlstandard.org/data.json?force=on&url=https%3A%2F%2Fdocs.google.com%2Fspreadsheets%2Fd%2F1qoA7nu9fl9Bmhvw_S0lqlAC04staw-k8xuSm1s9dP9o%2Fedit%23gid%3D1850060283';
var categoryURL = 'https://proxy.hxlstandard.org/data.json?strip-headers=on&force=on&url=https%3A%2F%2Fdocs.google.com%2Fspreadsheets%2Fd%2F1qoA7nu9fl9Bmhvw_S0lqlAC04staw-k8xuSm1s9dP9o%2Fedit%23gid%3D531837332';

function hxlProxyToJSON(input){
    var output = [];
    var keys = [];

    input.forEach(function(e,i){
        if(i==0){
            e.forEach(function(e2,i2){
                var parts = e2.split('+');
                var key = parts[0]
                if(parts.length>1){
                    var atts = parts.splice(1,parts.length);
                    atts.sort();                    
                    atts.forEach(function(att){
                        key +='+'+att
                    });
                }
                keys.push(key);
            });
        } else {
            var row = {};
            e.forEach(function(e2,i2){
                row[keys[i2]] = e2;
            });
            output.push(row);
        }
    });
    return output;
}

function getDatasets(str) {
    //parse string for number and names of datasets
    var datasetString = String(str).split('name:');
    datasetString = (datasetString[1]!==undefined) ? datasetString[1].replace(/[()]/g, '') : '';
    var datasetArray = (datasetString!=='') ? datasetString.split('%20OR%20') : [];
    return datasetArray;
}

function formatName(name) {
    return name.replace(/_|-/g, ' ');
}

function createHeatMap(dataArray) {
    var itemWidth = 100,
        itemHeight = 34,
        cellWidth = itemWidth - 2,
        cellHeight = itemHeight - 2,
        margin = {top: 5, right: 0, bottom: 20, left: 120};
        
    var width = 750 - margin.right - margin.left,
        height = (countryTotal*itemHeight);

    var data = dataArray.map(function(item) {
        var newItem = {};
        var hasData = false;
        item.value.forEach(function(val) {
            hasData = (val=='') ? false : true;
        });
        newItem.country = item.country;
        newItem.indicator = item.indicator;
        newItem.value = (hasData) ? 1 : 0;
        newItem.dataset = item.value;
        return newItem;
    })

    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([0, 0])
        .direction(function(d,i) {
            var dir = 'e';
            if (d.indicator==='#output+crisis+data+subnational+url') {
                dir = 'w';
                $('.d3-tip').addClass('left');
            }
            else {
                $('.d3-tip').removeClass('left');
            }
            return dir;
        })
        .html(function(d, i) { 
            var links = '<ol>';
            var datasetArray = getDatasets(d.dataset);
            datasetArray.forEach(function(link, index) {
                var dataURL = 'https://data.humdata.org/search?q=name:('+link+')';
                links += '<li><a href='+dataURL+' target="_blank">' + formatName(link) + '</a></li>';
            });
            if (datasetArray.length>1) links += '</ol><a href='+d.dataset+' target="_blank">See all</a>';
            return links; 
        });

    var x_elements = d3.set(data.map(function( item ) { return item.indicator; } )).values(),
        y_elements = d3.set(data.map(function( item ) { return item.country; } )).values();

    var xScale = d3.scale.ordinal()
        .domain(x_elements)
        .range([0, 215, 315, 430, 530]);

    var xAxis = d3.svg.axis()
        .orient('top')
        .scale(xScale)
        .tickFormat(function (d, i) {
            return '';//subcategories[i];
        });

    var yScale = d3.scale.ordinal()
        .domain(y_elements)
        .rangeBands([0, y_elements.length * itemHeight]);

    var yAxis = d3.svg.axis()
        .scale(yScale)
        .tickFormat(function (d) {
            return d;
        })
        .orient('left');

    var colorRange = ['#f3f3f3', '#1bb580'];

    var svg = d3.select('.heatmap')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    var cells = svg.selectAll('rect')
        .data(data)
        .enter().append('g');

    cells.append('rect')
        .attr('width', function(d) { return (d.indicator==='#loc+education+url') ? cellWidth*2 : cellWidth; })
        .attr('height', cellHeight)
        .attr('class', 'cell')
        .attr('y', function(d) { return yScale(d.country); })
        .attr('x', function(d) { return xScale(d.indicator); })
        .attr('fill', function(d) { return colorRange[d.value]; })
    
    cells.append('text')
        .attr('y', function(d) { return yScale(d.country); })
        .attr('x', function(d) { return xScale(d.indicator); })
        .attr('transform', function(d) {
            return (d.indicator==='#loc+education+url') ? 'translate(73, 20)' : 'translate(23, 20)';
        })
        .attr('class', function(d) { 
            var cls = (d.dataset.length>0) ? 'cell-text cell-data' : 'cell-text';
            return cls; 
        })
        .text(function(d){ 
            var datasetArray = getDatasets(d.dataset);
            var t = '';
            if (datasetArray.length>0) {
               t = (datasetArray.length>1) ? datasetArray.length + ' datasets' : datasetArray.length + ' dataset';
            }
            return t; 
        });

    svg.append('g')
        .attr('class', 'y axis')
        .call(yAxis)
        .selectAll('text')
        .attr('class', 'wrap')
        .attr('transform', 'translate(-10, 0)')
        .call(wrap, 115)
        .each(function(){
            var breaks = d3.select(this).selectAll('tspan')[0].length;
            d3.select(this).selectAll('tspan').attr('y', -7 * (breaks-1));
        });

    svg.append('g')
        .attr('class', 'x axis')
        .call(xAxis)
        .selectAll('text')
        .attr('transform', 'translate(50, -10)')
        .attr('y', '-25')
        .style('text-anchor', 'middle')
        .call(wrap, itemWidth)
        .each(function(){
            var breaks = d3.select(this).selectAll('tspan')[0].length;
            d3.select(this).selectAll('tspan').attr('y', -14 * (breaks-1));
        });

    d3.selectAll('.cell-data').call(tip);
    d3.selectAll('.cell-data').on('mouseover', tip.show);
    d3.selectAll('.cell').on('mouseover', tip.hide);
    d3.selectAll('.d3-tip').on('mouseleave', tip.hide);
}

function createCategories(categories) {
    var catObj = {};
    for (var i=0; i<categories.length; i++) {
        var catKeys = Object.keys(categories[i]);
        for (var j=0; j<catKeys.length; j++) {
            if (categories[i][catKeys[j]]!=='') {
                if (i===0) {
                    $('.categoryLabels').append('<div>'+categories[i][catKeys[j]]+'</div>');
                }
                if (i===1) {
                    $('.categoryStats').append('<div><span>'+categories[i][catKeys[j]]+'</span> datasets <span class="pipe">|</span> <span>'+categories[i+1][catKeys[j]]+'</span> sources</div>');
                }
                if (i===3) {
                    $('.categorySublabel').append('<div>'+categories[i][catKeys[j]]+'</div>');
                }
                if (i===4) {
                    $('.categoryDescription').append('<div>'+categories[i][catKeys[j]]+'</div>');
                }
            }
        }
    }
}

//helper function to wrap svg text
function wrap(text, width) {
  text.each(function() {
    var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy")),
        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
      }
    }
  });
}

var dataCall = $.ajax({ 
    type: 'GET', 
    url: dataURL,
    dataType: 'json',
});

var categoryCall = $.ajax({ 
    type: 'GET', 
    url: categoryURL,
    dataType: 'json',
});

var countryTotal = 0;
$.when(dataCall, categoryCall).then(function(dataArgs, categoryArgs){
    var categories = hxlProxyToJSON(categoryArgs[0]);
    createCategories(categories);

    // get first row of data for headers
    var headers = dataArgs[0].shift();

    var data = hxlProxyToJSON(dataArgs[0]);
    var dataArray = [];
    //var headerArray = [];
    var columnIndex = 3; //skip columns A and B in dataset (country iso and hdx page)

    var cf = crossfilter(data);
    var countryDimension = cf.dimension(function(d) { return d['#country+name']; });
    var countries = countryDimension.group().all();
    countryTotal = countries.length;

    //consolidate duplicate country rows
    var newCountryArray = [];
    countries.forEach(function(country) {
        countryDimension.filter(function(d) { return d===country.key; });
        var dim = countryDimension.top(Infinity);
        var arr = [];
        for (var l=0; l<dim.length; l++){
            arr.push(dim[l]);
        }
        newCountryArray.push(arr);
    });

    //consolidate indicators for duplicate countries
    newCountryArray.forEach(function(d, i){
        var country = d[0]['#country+name'];
        var indicatorObject = {};
        for (var i=0; i<d.length; i++){
            var keys = Object.keys(d[i]);
            //skip columns A and B in dataset (country iso and hdx page)
            for (var j=columnIndex; j<keys.length; j++){
                if (indicatorObject[keys[j]]==undefined) indicatorObject[keys[j]] = [];
                if (d[i][keys[j]]!='') {
                    indicatorObject[keys[j]].push(d[i][keys[j]]);
                }
            }
        }
        
        //format data for heatmap
        var indicatorKeys = Object.keys(indicatorObject);
        for (var k=0; k<indicatorKeys.length; k++){
            dataArray.push({'country':d[0]['#country+name'], 'indicator':indicatorKeys[k], 'value':indicatorObject[indicatorKeys[k]]});
        }
    });

    //get headers
    // for (var k=columnIndex; k<headers.length; k++) {
    //     headerArray.push(headers[k]);
    // }

    //remove loader
    $('.sp-circle').remove();
    $('.viz-container').show();
    createHeatMap(dataArray);
});