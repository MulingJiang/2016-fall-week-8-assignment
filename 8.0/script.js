console.log('8.0');
console.log("muling");

var m = {t:100,r:100,b:100,l:100};
var outerWidth = document.getElementById('canvas').clientWidth,
    outerHeight = document.getElementById('canvas').clientHeight;
var w = outerWidth - m.l - m.r,
    h = outerHeight - m.t - m.b;

var plot = d3.select('.canvas')
    .append('svg')
    .attr('width',outerWidth)
    .attr('height',outerHeight)
    .append('g')
    .attr('transform','translate(' + m.l + ',' + m.t + ')');

//d3.set to hold a unique array of airlines
var airlines = d3.set();

//Scale
var scaleX = d3.scaleTime()
    .range([0,w]);
var scaleColor = d3.scaleOrdinal()
    .range(['#fd6b5a','#03afeb','orange','#06ce98','blue']);
var scaleY = d3.scaleLinear()
    .domain([0,1000])
    .range([h,0]);

//Axis
var axisX = d3.axisBottom()
    .scale(scaleX)
    .tickSize(-h);
var axisY = d3.axisLeft()
    .scale(scaleY)
    .tickSize(-w);

//Line generator
var lineGenerator = d3.line()
    .x(function(d){return scaleX(d.year)})
    .y(function(d){return scaleY(d.value)})
    .x(function(d){return scaleX(new Date(d.key))})
    .y(function(d){return scaleY(d.averagePrice)})
    .curve(d3.curveCardinal);

d3.queue()
    .defer(d3.csv, '../data/bos-sfo-flight-fare.csv',parse)
    .await(function(err, data){

        //Mine the data to set the scales
        scaleX.domain( d3.extent(data,function(d){return d.travelDate}) );
        scaleColor.domain( airlines.values() );

        //Add buttons
        d3.select('.btn-group')
            .selectAll('.btn')
            .data( airlines.values() )
            .enter()
            .append('a')
            .html(function(d){return d})
            
            .style('background',function(d){return scaleColor(d)})
            .style('border-color','white')
            .on('click',function(d){
                function drawByAirline(data){
                    return data.airline ==d;
                } 
                //Hint: how do we filter flights for particular airlines?
                //data.filter(...)
                var FF = data.filter(drawByAirline)
                draw(FF);
     /* d3.select("#B6").on("click",function(){draw();})

        d3.select("#UA").on("click",function(){draw();})

        d3.select("#SY").on("click",function(){draw();})

        d3.select("#VX").on("click",function(){draw();})

        d3.select("#AS").on("click",function(){draw();})*/
                
                //How do we then update the dots?
            });

        //Draw axis
        plot.append('g').attr('class','axis axis-x')
            .attr('transform','translate(0,'+h+')')
            .call(axisX);
        plot.append('g').attr('class','axis axis-y')
            .call(axisY);

        //append the path only once
        plot.append("path")
            .attr("class","time-series");
        
        draw(data);

       

    });

function draw(rows){
    //IMPORTANT: data transformation

    rows.sort(function(a,b){
        return a.travelDate - b.travelDate;
    });

    var flightsByTravelDate = d3.nest().key(function(d){return d.travelDate})
        .entries(rows);

    flightsByTravelDate.forEach(function(day){
       day.averagePrice = d3.mean(day.values, function(d){return d.price});
    });

    console.log(flightsByTravelDate);

    //Draw dots
var node = plot.selectAll(".flight")
           .data(rows,function(d){return d.id});

var nodeEnter = node.enter()
        .append("circle")
        .attr("class","flight")
 /*     .merge(node)
        .attr("r",3)
        .attr("cx",function(d){return scaleX(d.travelDate)})
        .attr("cy",function(d){return scaleY(d.price)})
        .style("fill",function(d){return scaleColor(d.airline)})
        .style("fill-opacity",.75);
*/      .on("click",function(d,i){
           console.log(d);
           console.log(i);
           console.log(this); })

        .on("mouseenter",function(d){
            var tooltip = d3.select(".custom-tooltip");
            tooltip.select(".title")
                   .html(d.airline);
            tooltip.select(".value")
                   .html("$"+d.price);
            tooltip.transition().style("opacity",1);

            d3.select(this).style("stroke-width","3px");
        })

        .on("mousemove",function(d){
            var tooltip = d3.select(".custom-tooltip");
            var xy = d3.mouse( d3.select(".container").node() );
            tooltip
                 .style("left",xy[0]+10+"px")
                 .style("top",xy[1]+10+"px");
        
        })

        .on("mouseleave",function(d){
            var tooltip =d3.select(".custom-tooltip");
            tooltip.transition().style("opacity",0);

            d3.select(this).style("stroke-width","0px");
        });

    node.exit().remove()
    
    node
        .merge(nodeEnter)
        .attr("r",3)
        .transition()
        .duration(5000)
        .attr("cx",function(d){return scaleX(d.travelDate)})
        .attr("cy",function(d){return scaleY(d.price)})
        .style("fill",function(d){return scaleColor(d.airline)})
        .style("fill-opacity",.75);
   
    nodeEnter.exit().remove()
    //Draw <path>

    plot.select(".time-series")
        .datum(flightsByTravelDate)
        .transition()
        .duration(3000)
        .attr("d",function(d){
            return lineGenerator(d);
        })
        .style("fill","none")
        .style("stroke-width","1px")
     //   .style("stroke",function(color){
     //       return scaleColor(color[0].value[0].airline)
     //   });
        .style("stroke","grey");
}

function parse(d){

    if( !airlines.has(d.airline) ){
        airlines.add(d.airline);
    }

    return {
        airline: d.airline,
        price: +d.price,
        travelDate: new Date(d.travelDate),
        duration: +d.duration,
        id: d.id
    }
}