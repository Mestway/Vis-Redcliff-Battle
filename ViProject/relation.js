var REL_margin = {top: 1, right: 1, bottom: 6, left: 1},
    REL_width = 600 - REL_margin.left - REL_margin.right,
    REL_height = 600 - REL_margin.top - REL_margin.bottom;

var REL_force;
var REL_svg;
var REL_link;
var REL_node;
var REL_color;
var REL_nodes;
var REL_links;
var REL_data;

function REL_process_data(nodes, links) {
	var nodeMap = {};
	nodes.forEach(function(d, i) { nodeMap[d.name] = i; });
	links.forEach(function(x) {
		x.source = nodeMap[x.source],
		x.target = nodeMap[x.target],
		x.value = x.value;
	});
}

function REL_initGraph() {

	REL_color = d3.scale.category20();

	d3.json("Data/relation.json", function(error, data) {

		REL_svg = d3.select("#relation").append("svg")
		    .attr("width", REL_width + REL_margin.left + REL_margin.right)
		    .attr("height", REL_height + REL_margin.top + REL_margin.bottom);

		REL_data = data;

		REL_build_graph(data);

		REL_nodes.forEach(function(d) {
			var isIn = false;
			for(var i = 0; i < ST_LineInfo.length; i ++) {
				if(ST_LineInfo[i].people == d.name) {
					isIn = true;
					break;
				}
			}
			if(!isIn) {
				var tempColorSave = {};
					tempColorSave.people = d.name;
					tempColorSave.color = "#000";
					tempColorSave.opacity = .2;
					tempColorSave.begin = {};
					tempColorSave.begin.x = -1;
					tempColorSave.begin.y = -1;
					tempColorSave.end = {};
					tempColorSave.end.x = -1;
					tempColorSave.end.y = -1;
					tempColorSave.circle = {};
					tempColorSave.circle.fill = ST_color(d.name.replace(/ .*/, ""));
					tempColorSave.selected = false;
					tempColorSave.important = false;
					ST_LineInfo.push(tempColorSave);
			}
		});

		d3.json("Data/distribution.json",function(data) {
			dictionary = data;
			for(var i = 0; i < ST_LineInfo.length; i ++) {
				for(var j = 0; j < dictionary.length; j ++) {
					if(ST_LineInfo[i].people == dictionary[j].name) {
						ST_LineInfo[i].side = parseInt(dictionary[j].class);
					}
				}
			}
		});


		var nameslot = [];
		ST_LineInfo.forEach(function(d) {
			nameslot.push(d.people);
		});

		nameslot.sort(sortByName);
		function sortByName(a,b) {
			return a - b;
		}

		d3.select("#chslt")
        .selectAll("option")
        .data(nameslot)
        .enter()
        .append("option")
        .attr("value",function(d) {
            return d;
        })
        .attr("name",function(d) {
            return d;
        })
        .style("width","15px")
        .text(function(d) {
            return d;
        });

		REL_force = d3.layout.force()
				.charge(-300)
				.linkDistance(50)
				.size([REL_width , REL_height]);

		REL_force.nodes(REL_nodes)
			.links(REL_links)
			.start()
			.on("tick", tick);

		REL_svg.selectAll(".REL_link")
				.data(REL_links)
				.enter().append("line")
				.attr("class", "REL_link")
				.style("stroke",function(d) {
					if(d.value == 0) {
						return "#0000FF";						
					} else return "#FF0000"
				});

		REL_svg.selectAll(".REL_node")
				.data(REL_nodes)
				.enter().append("circle")
				.attr("class", "REL_node")
				.attr("r", function(d) {
					for(var i = 0; i < ST_LineInfo.length; i ++) {
						if(ST_LineInfo[i].people == d.name) {
							if(ST_LineInfo[i].important)
								return 15;
							else return 8;
						}
					}
				})
				.attr("stroke","grey")
				.style("stroke-width", "2px")
				.style("fill", function(d) { 
					for(var i = 0; i < ST_LineInfo.length; i ++) {
						if(ST_LineInfo[i].people == d.name) {
							return ST_LineInfo[i].circle.fill;
						}
					}
				})
				.style("stroke", function(d) { 
					for(var i = 0; i < ST_LineInfo.length; i ++) {
						if(ST_LineInfo[i].people == d.name) {
							return d3.rgb(ST_LineInfo[i].circle.fill).darker();
						}
					}
					return d3.rgb(REL_color(d.name.replace(/ .*/, ""))).darker(); 
				})
				.on("click",function(data) {
						ST_LineInfo.forEach(function(d) {
							if(d.people == data.name) {
								ST_mousedown(d);
							}
						})
				});

		REL_link = REL_svg.selectAll(".REL_link");
		REL_node = REL_svg.selectAll(".REL_node");

		REL_node.append("title")
				.text(function(d) { return d.name;});

		 function tick() {
		    REL_node.attr("cx", function(d) { return d.x = Math.max(10, Math.min(REL_width - 15, d.x)); })
		        .attr("cy", function(d) { return d.y = Math.max(10, Math.min(REL_height - 15, d.y)); });

		    REL_link.attr("x1", function(d) { return d.source.x; })
		        .attr("y1", function(d) { return d.source.y; })
		        .attr("x2", function(d) { return d.target.x; })
		        .attr("y2", function(d) { return d.target.y; });
		}
	});
}

function REL_build_graph(data) {
	var tempnodes = new Array();
	REL_nodes = new Array();
	REL_links = new Array();

	for(var i = 0; i < data.length; i ++)
	{
		if(!REL_contains(tempnodes, data[i].src))
			tempnodes.push(data[i].src);
		if(!REL_contains(tempnodes, data[i].dst))
			tempnodes.push(data[i].dst);
	
		var templink = new Object();
		templink.source = data[i].src;
		templink.target = data[i].dst;
		templink.value = data[i].rel;
		REL_links.push(templink);
	}

	for(var i = 0; i < tempnodes.length; i ++)
	{
		var ttemp  = new Object();
		ttemp.name = tempnodes[i];
		REL_nodes.push(ttemp);
	}
	
	REL_process_data(REL_nodes, REL_links);
}

function REL_update(nodes, links) {
	REL_force.nodes(nodes)
		.links(links)
		.alpha(-100)
		.start();

	REL_link = REL_svg.selectAll(".REL_link");
	REL_node = REL_svg.selectAll(".REL_node");

	REL_link = REL_link.data(links);
	REL_link.exit().remove();
	REL_link.enter().append("line")
			.attr("class", "REL_link")
			.style("stroke",function(d) {
					if(d.value == 0) {
						return "#0000FF";						
					} else return "#FF0000"
			});

	REL_node = REL_node.data(nodes);
	REL_node.exit().remove();
	REL_node.enter().append("circle")
				.attr("class", "REL_node")
				.attr("r", function(d) {
				  for(var i = 0; i < ST_LineInfo.length; i ++) {
						if(ST_LineInfo[i].people == d.name) {
							if(ST_LineInfo[i].important)
								return 15;
							else return 8;
						}
					}
				})
				.attr("stroke","grey")
				.style("stroke-width", "2px")
				.style("fill", function(d) { 
					for(var i = 0; i < ST_LineInfo.length; i ++) {
						if(ST_LineInfo[i].people == d.name) {
							return ST_LineInfo[i].circle.fill;
						}
					}
				})
				.style("stroke", function(d) { 
					for(var i = 0; i < ST_LineInfo.length; i ++) {
						if(ST_LineInfo[i].people == d.name) {
							return d3.rgb(ST_LineInfo[i].circle.fill).darker();
						}
					}
					return d3.rgb(REL_color(d.name.replace(/ .*/, ""))).darker(); 
				})
				.on("click",function(data) {
					ST_LineInfo.forEach(function(d) {
							if(d.people == data.name) {
								ST_mousedown(d);
							}
						})
				});
	
	REL_node.append("title")
		.text(function(d) { return d.name;});
}

function REL_chapter_filter(left, right) {
	var temp_data = [];
	var current_focus_left = left;
	var current_focus_right = right;
	REL_data.forEach(function(d) {
		if(d.chapter <= right && d.chapter >= left) {
			temp_data.push(d);
		}
	});
	REL_nodes = [];
	REL_links = [];
	REL_build_graph(temp_data);
	REL_update([],[]);
	REL_update(REL_nodes, REL_links);
}

function REL_contains(arr, element) {
	for(var i = 0; i < arr.length; i ++)
	{
		if(arr[i] == element)
			return true;
	}
	return false;
}

function REL_repaint() {
	d3.selectAll(".REL_node")
		.attr("r", function(d) {
			for(var i = 0; i < ST_LineInfo.length; i ++) {
				if(ST_LineInfo[i].people == d.name) {
					if(ST_LineInfo[i].selected) {
						return 25;
					}
				}
			}
			for(var i = 0; i < ST_LineInfo.length; i ++) {
				if(ST_LineInfo[i].people == d.name) {
					if(ST_LineInfo[i].important)
						return 15;
					else return 8;
				}
			}
		})
		.attr("stroke","grey")
		.style("stroke-width", "2px")
		.style("fill", function(d) { 
			for(var i = 0; i < ST_LineInfo.length; i ++) {
				if(ST_LineInfo[i].people == d.name) {
					return ST_LineInfo[i].circle.fill;
				}
			}
		})
		.style("stroke", function(d) { 
			for(var i = 0; i < ST_LineInfo.length; i ++) {
				if(ST_LineInfo[i].people == d.name) {
					return d3.rgb(ST_LineInfo[i].circle.fill).darker();
				}
			}
			return d3.rgb(REL_color(d.name.replace(/ .*/, ""))).darker(); 
		})
		.style("fill-opacity",function(d) {
			for(var i = 0; i < ST_LineInfo.length; i ++) {
				if(ST_LineInfo[i].people == d.name) {
					if(ST_LineInfo[i].selected) {
						return 1;
					}
				}
			}
			return .9;
		});
}

function REL_click(data) {
	ST_LineInfo.forEach(function(d) {
		if(d.people == data.name) {
			ST_mousedown(d);
		}
	})
}