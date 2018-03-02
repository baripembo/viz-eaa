let dataURL = 'https://data.humdata.org/hxlproxy/data.json?tagger-match-all=on&tagger-01-header=country&tagger-01-tag=%23country&tagger-03-header=open%2Fclosed%2Faffected+facilities&tagger-03-tag=%23open%2Bclosed%2Baffected%2Bfacilities&tagger-04-header=crisis+impacts&tagger-04-tag=%23crisis%2Bimpacts&tagger-05-header=response+monitoring+and+impacts&tagger-05-tag=%23response%2Bmonitoring%2Bimpacts&tagger-06-header=security+incidents&tagger-06-tag=%23security%2Bincidents&tagger-07-header=facility+and+program+status&tagger-07-tag=%23facility%2Bprogram%2Bstatus&url=https%3A%2F%2Fdocs.google.com%2Fspreadsheets%2Fd%2F1LG0luRT45he4plKVe3Zn4Rq5x0jXPTAP-t6ZIM6Qx_g%2Fedit%23gid%3D860850203&header-row=1';//'https://data.humdata.org/hxlproxy/data.json?filter01=add&add-tag01=%23indicator%2Blocation&add-value01=urban&filter02=append&force=on&tagger-match-all=on&tagger-01-header=country&tagger-01-tag=%23country&tagger-03-header=impacts+of+crisis+on+students&tagger-03-tag=%23impact%2Bcrisis%2Bstudents&tagger-04-header=impacts+of+crisis+on+facilities&tagger-04-tag=%23impact%2Bcrisis%2Bfacilities&tagger-05-header=impacts+of+crisis+on+educators&tagger-05-tag=%23impact%2Bcrisis%2Beducators&tagger-06-header=status+of+students&tagger-06-tag=%23status%2Bstudents&tagger-07-header=status+of+facilities&tagger-07-tag=%23status%2Bfacilities&tagger-08-header=status+of+educators&tagger-08-tag=%23status%2Beducators&header-row=1&url=https%3A%2F%2Fdocs.google.com%2Fspreadsheets%2Fd%2F1qoA7nu9fl9Bmhvw_S0lqlAC04staw-k8xuSm1s9dP9o%2Fedit%23gid%3D860850203';

function hxlProxyToJSON(input){
    let output = [];
    let keys = [];

    input.forEach(function(e,i){
        if(i==1){
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


function createHeatMap(categories, dataArray) {
    let itemWidth = 80,
        itemHeight = 46,
        cellWidth = itemWidth - 2,
        cellHeight = itemHeight - 2,
        margin = {top: 120, right: 20, bottom: 20, left: 110};
        
    let width = 750 - margin.right - margin.left,
        height = (total*itemHeight) - margin.top - margin.bottom;

    let data = dataArray.map(function(item) {
        let newItem = {};
        newItem.country = item.country;
        newItem.indicator = item.indicator;
        let hasData = false;
        item.value.forEach(function(val) {
            hasData = (val=='') ? false : true;
        });
        newItem.value = (hasData) ? 1 : 0;
        newItem.dataset = item.value;
        return newItem;
    })

    let x_elements = d3.set(data.map(function( item ) { return item.indicator; } )).values(),
        y_elements = d3.set(data.map(function( item ) { return item.country; } )).values();

    let xScale = d3.scale.ordinal()
        .domain(x_elements)
        .rangeBands([0, x_elements.length * itemWidth]);

    let xAxis = d3.svg.axis()
        .scale(xScale)
        .tickFormat(function (d, i) {
            return categories[i];
        })
        .orient('top');

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
        .enter().append('g').append('rect')
        .attr('class', 'cell')
        .attr('width', cellWidth)
        .attr('height', cellHeight)
        .attr('y', function(d) { return yScale(d.country); })
        .attr('x', function(d) { return xScale(d.indicator); })
        .attr('fill', function(d) { return colorRange[d.value]; });

    svg.append('g')
        .attr('class', 'y axis')
        .call(yAxis)
        .selectAll('text')
        .attr('transform', function (d) {
            return 'translate(-10, 0)';
        })
        .call(wrap, 100);

    svg.append('g')
        .attr('class', 'x axis')
        .call(xAxis)
        .selectAll('text')
        .attr('font-weight', '700')
        .style('text-anchor', 'middle')
        .attr('y', '-40')
        .call(wrap, xScale.rangeBand());
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

let total = 0;
$.when(dataCall).then(function(dataArgs){
    let data = hxlProxyToJSON(dataArgs);
    let dataArray = [];
    let headerArray = [];

    let cf = crossfilter(data);
    total = cf.size();
    var countryDimension = cf.dimension(function(d) { return d['#country']; });
    let countries = countryDimension.group().all();

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
        let country = d[0]['#country'];
        var indicatorObject = {};
        for (let i=0; i<d.length; i++){
            let keys = Object.keys(d[i]);
            //skip columns A and B in dataset (country and hdx page)
            for (let j=2; j<keys.length; j++){
                if (indicatorObject[keys[j]]==undefined) indicatorObject[keys[j]] = [];
                indicatorObject[keys[j]].push(d[i][keys[j]]);
            }
        }

        //format data for heatmap
        let indicatorKeys = Object.keys(indicatorObject);
        for (let k=0; k<indicatorKeys.length; k++){
            dataArray.push({'country':d[0]['#country'], 'indicator':indicatorKeys[k], 'value':indicatorObject[indicatorKeys[k]]});
        }
    });

    // data.forEach(function(d, i){
    //     let country = d['#country'];
    //     if (country!=undefined) {
    //         countryDimension.filter(function(d) { return d===country; }); 
    //         console.log(country, countryDimension.top(Infinity));
    //         let keys = Object.keys(d);
    //         //skip columns A and B in dataset (country and hdx page)
    //         for (let i=2; i<keys.length; i++){
    //           dataArray.push({'country':d['#country'], 'indicator':keys[i], 'value':d[keys[i]]});
    //         }
    //     }
    // });

    //get headers
    for (let j=2; j<dataArgs[0].length; j++) {
        let header = dataArgs[0][j];
        if (header.indexOf('Open/Closed/Affected')>-1) {
            header = 'Open / Closed / Affected Facilities';
        }
        headerArray.push(header);
    }

    createHeatMap(headerArray, dataArray);
});
