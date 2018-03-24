let dataURL = 'https://proxy.hxlstandard.org/data.json?force=on&url=https%3A%2F%2Fdocs.google.com%2Fspreadsheets%2Fd%2F1qoA7nu9fl9Bmhvw_S0lqlAC04staw-k8xuSm1s9dP9o%2Fedit%23gid%3D607057075';
let categoryURL = 'https://proxy.hxlstandard.org/data.json?strip-headers=on&force=on&url=https%3A%2F%2Fdocs.google.com%2Fspreadsheets%2Fd%2F1qoA7nu9fl9Bmhvw_S0lqlAC04staw-k8xuSm1s9dP9o%2Fedit%23gid%3D1825036435';

function hxlProxyToJSON(input){
    let output = [];
    let keys = [];

    input.forEach(function(e,i){
        if(i==0){
            e.forEach(function(e2,i2){
                let parts = e2.split('+');
                let key = parts[0]
                if(parts.length>1){
                    let atts = parts.splice(1,parts.length);
                    atts.sort();                    
                    atts.forEach(function(att){
                        key +='+'+att
                    });
                }
                keys.push(key);
            });
        } else {
            let row = {};
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
    let datasetString = String(str).split('name:');
    datasetString = (datasetString[1]!==undefined) ? datasetString[1].replace(/[()]/g, '') : '';
    let datasetArray = (datasetString!=='') ? datasetString.split('%20OR%20') : [];
    return datasetArray;
}

function formatName(name) {
    return name.replace(/_|-/g, ' ');
}

function createHeatMap(dataArray) {
    let itemWidth = 100,
        itemHeight = 34,
        cellWidth = itemWidth - 2,
        cellHeight = itemHeight - 2,
        margin = {top: 5, right: 20, bottom: 20, left: 150};
        
    let width = 790 - margin.right - margin.left,
        height = (countryTotal*itemHeight);

    let data = dataArray.map(function(item) {
        let newItem = {};
        let hasData = false;
        item.value.forEach(function(val) {
            hasData = (val=='') ? false : true;
        });
        newItem.country = item.country;
        newItem.indicator = item.indicator;
        newItem.value = (hasData) ? 1 : 0;
        newItem.dataset = item.value;
        return newItem;
    })

    let tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([0, 0])
        .html(function(d) { 
            let links = '<ul>';
            let datasetArray = getDatasets(d.dataset);
            datasetArray.forEach(function(link, index) {
                let dataURL = 'https://data.humdata.org/search?q=name:('+link+')';
                links += '<li><a href='+dataURL+' target="_blank">' + (index+1) + '. ' + formatName(link) + '</a></li>';
            });
            if (datasetArray.length>1) links += '<li><a href='+d.dataset+' target="_blank">See all</a></li>';
            links += '</ul>';
            return links; 
        });

    let x_elements = d3.set(data.map(function( item ) { return item.indicator; } )).values(),
        y_elements = d3.set(data.map(function( item ) { return item.country; } )).values();

    let xScale = d3.scale.ordinal()
        .domain(x_elements)
        .range([0, 215, 315, 430, 530]);

    let xAxis = d3.svg.axis()
        .orient('top')
        .scale(xScale)
        .tickFormat(function (d, i) {
            return '';//subcategories[i];
        });

    let yScale = d3.scale.ordinal()
        .domain(y_elements)
        .rangeBands([0, y_elements.length * itemHeight]);

    let yAxis = d3.svg.axis()
        .scale(yScale)
        .tickFormat(function (d) {
            return d;
        })
        .orient('left');

    let colorRange = ['#f3f3f3', '#1bb580'];

    let svg = d3.select('.heatmap')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    let cells = svg.selectAll('rect')
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
            let cls = (d.dataset.length>0) ? 'cell-text cell-data' : 'cell-text';
            return cls; 
        })
        .text(function(d){ 
            let datasetArray = getDatasets(d.dataset);
            let t = '';
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
    let catObj = {};
    for (let i=0; i<categories.length; i++) {
        let catKeys = Object.keys(categories[i]);
        for (let j=0; j<catKeys.length; j++) {
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

let dataCall = $.ajax({ 
    type: 'GET', 
    url: dataURL,
    dataType: 'json',
});

let categoryCall = $.ajax({ 
    type: 'GET', 
    url: categoryURL,
    dataType: 'json',
});

let countryTotal = 0;
$.when(dataCall, categoryCall).then(function(dataArgs, categoryArgs){
    let categories = hxlProxyToJSON(categoryArgs[0]);
    createCategories(categories);

    // get first row of data for headers
    let headers = dataArgs[0].shift();

    let data = hxlProxyToJSON(dataArgs[0]);
    let dataArray = [];
    //let headerArray = [];
    let columnIndex = 3; //skip columns A and B in dataset (country iso and hdx page)

    let cf = crossfilter(data);
    let countryDimension = cf.dimension(function(d) { return d['#country+name']; });
    let countries = countryDimension.group().all();
    countryTotal = countries.length;

    //consolidate duplicate country rows
    let newCountryArray = [];
    countries.forEach(function(country) {
        countryDimension.filter(function(d) { return d===country.key; });
        let dim = countryDimension.top(Infinity);
        let arr = [];
        for (let i=0; i<dim.length; i++){
            arr.push(dim[i]);
        }
        newCountryArray.push(arr);
    });

    //consolidate indicators for duplicate countries
    newCountryArray.forEach(function(d, i){
        let country = d[0]['#country+name'];
        let indicatorObject = {};
        for (let i=0; i<d.length; i++){
            let keys = Object.keys(d[i]);
            //skip columns A and B in dataset (country iso and hdx page)
            for (let j=columnIndex; j<keys.length; j++){
                if (indicatorObject[keys[j]]==undefined) indicatorObject[keys[j]] = [];
                if (d[i][keys[j]]!='') {
                    indicatorObject[keys[j]].push(d[i][keys[j]]);
                }
            }
        }
        
        //format data for heatmap
        let indicatorKeys = Object.keys(indicatorObject);
        for (let k=0; k<indicatorKeys.length; k++){
            dataArray.push({'country':d[0]['#country+name'], 'indicator':indicatorKeys[k], 'value':indicatorObject[indicatorKeys[k]]});
        }
    });

    //get headers
    // for (let k=columnIndex; k<headers.length; k++) {
    //     headerArray.push(headers[k]);
    // }

    //remove loader
    $('.sp-circle').remove();
    $('.viz-container').show();
    createHeatMap(dataArray);
});
