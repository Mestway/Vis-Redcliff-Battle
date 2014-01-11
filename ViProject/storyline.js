var ST_margin = {top: 1, right: 15, bottom: 6, left: 35},
    ST_width = 1600 - ST_margin.left - ST_margin.right,
    ST_height = 280 - ST_margin.top - ST_margin.bottom;

var ST_graph;

function ST_process_data() {
	var nodeMap = {};
	ST_graph.nodes.forEach(function(d, i) { nodeMap[d.name] = i; d.dbon = false;});
	ST_graph.links.forEach(function(x) {
		x.source = nodeMap[x.source],
		x.target = nodeMap[x.target],
		x.value = x.value;
	});
}

var ST_svg;
var ST_left_chapter = 42;
var ST_right_chapter = 50;
var ST_event_left_bound = 0;
var ST_event_right_bound = 20;
var ST_event_state = [];
var ST_LineInfo = [];
var ST_MidPoints = [];
var sankey;
var ST_line_info_init = false;
var ST_color;

var ST_point = 0;
var ST_color_set;
var ST_showname = false;


function ST_initGraph(filename) {

	var formatNumber = d3.format(",.0f"),
    format = function(d) { return formatNumber(d); };
    ST_color = d3.scale.category20();
    ST_color_set = d3.scale.category20b();

	ST_event_state = [];

	var dictionary;
	

    d3.json("Data/" + filename, function(error, data) {

    	data.nodes.forEach(function(node) {
    		var tempNode = {};
    		tempNode.event_no = node.event.event_no;
    		tempNode.chapter = node.event.seqNum;
    		ST_event_state.push(tempNode);
    	});

    	ST_event_left_bound = 50;
    	ST_event_right_bound = 0;

    	ST_event_state.forEach(function(d) {
    		if(d.chapter <= ST_right_chapter && d.chapter >= ST_left_chapter) {
    			if(ST_event_left_bound >= d.event_no)
    				ST_event_left_bound = d.event_no;
    			if(ST_event_right_bound <= d.event_no)
    				ST_event_right_bound = d.event_no;
    		}
    	});

    	function inEventBound(d) {
    		if(d <= ST_event_right_bound && d >= ST_event_left_bound) {
    			return true;
    		}
    		else
    			return false;
    	}

    	ST_graph = {};
    	ST_graph.nodes = [];
    	ST_graph.links = [];
    	data.nodes.forEach(function(node) {
    		if(inEventBound(node.event.event_no)) {
    			ST_graph.nodes.push(node);
    		}
    	});
    	ST_graph.nodes.forEach(function(node) {
    		node.dbon = false;
    	});
    	data.links.forEach(function(link) {
    		var src = parseInt(link.source.substring(5,link.source.length));
    		var dst = parseInt(link.target.substring(5,link.target.length));
    		if(inEventBound(src) && inEventBound(dst)) {
    			ST_graph.links.push(link);
    		}
    	});

    	//ST_graph = data;
		ST_process_data();

		sankey = d3.sankey()
	    .size([ST_width, ST_height])
	    .nodeWidth(20)
	    .nodePadding(10);

		sankey.nodes(ST_graph.nodes)
			.links(ST_graph.links)
			.layout(32);

		var path = sankey.link();

		var svg = d3.select("#storyline").append("svg")
			.attr("class","story")
		    .attr("width", ST_width + ST_margin.left + ST_margin.right)
		    .attr("height", ST_height + ST_margin.top + ST_margin.bottom)
		  	.append("g")
		    .attr("transform", "translate(" + ST_margin.left + "," + ST_margin.top + ")");

		function initLineInfo() {
			if(!ST_line_info_init) {
				ST_line_info_init = true;
				//save the attributes for each person(each line)
				for(var i = 0; i < ST_graph.links.length; i ++) {
					var d = ST_graph.links[i];
					var isIn = false;
					for(var j = 0; j < ST_LineInfo.length; j ++) {
						var tempdd = ST_LineInfo[j];
						if(tempdd.people == d.people) {	
							isIn = true;
						}
					}
					if(!isIn) {
						var tempColorSave = {};
						tempColorSave.people = d.people;
						tempColorSave.color = "#000";
						tempColorSave.opacity = .2;
						tempColorSave.begin = {};
						tempColorSave.begin.x = -1;
						tempColorSave.begin.y = -1;
						tempColorSave.end = {};
						tempColorSave.end.x = -1;
						tempColorSave.end.y = -1;
						tempColorSave.circle = {};
						tempColorSave.circle.fill = ST_color(d.people.replace(/ .*/, ""));
						tempColorSave.selected = false;
						tempColorSave.important = true;
						ST_LineInfo.push(tempColorSave);
					}
				}
			}

			ST_MidPoints = [];
			ST_graph.links.forEach(function(d, i) {
				var tempO = {};
				tempO.x = -1;
				tempO.y = -1;
				tempO.visible = false;
				tempO.id = i;
				tempO.people = d.people;
				ST_MidPoints.push(tempO);

				var tempO2 = {};
				tempO2.x = -1;
				tempO2.y = -1;
				tempO2.visible = false;
				tempO2.id = i + 0.5;
				tempO2.people = d.people;
				ST_MidPoints.push(tempO2);
			});

		}

		initLineInfo();
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

		var link = svg.append("g").selectAll(".ST_link")
					.data(ST_graph.links)
					.enter().append("path")
					.attr("class", "ST_link")
					.attr("d", path)
					.on("mouseover",function(selected) {
		                d3.selectAll(".ST_link")
		                	.style("stroke",function(d) {
		                		if(d.people == selected.people) {
		                			return "#FF0000";
		                		}
		                		for(var i = 0; i < ST_LineInfo.length; i ++) {
		                			if(ST_LineInfo[i].people == d.people) {
		                				return ST_LineInfo[i].color;
		                			}
		                		}
		                	});
		                d3.selectAll(".ST_link")
		                	.style("stroke-opacity",function(d) {
		                		if(d.people == selected.people) {
		                			return "1";
		                		} else {
		                			for(var i = 0; i < ST_LineInfo.length; i ++) {
		                				if(ST_LineInfo[i].people == d.people) {
		                					return ST_LineInfo[i].opacity;
		                				}
		                			}
		                		}
		                	});
		                d3.select("#ST_StartPoint")
		                	.selectAll("circle")
		                	.attr("fill",function(d) {
		                		return d.circle.fill;
		                	});
		                d3.select("#ST_EndPoint")
		                	.selectAll("circle")
		                	.attr("fill",function(d) {
		                		return d.circle.fill;
		                	});
		            })
					.on("click",function(selected) {
						ST_mousedown(selected);
					})
		            .on("mouseout",function(selected) {
		                d3.selectAll(".ST_link")
		                	.style("stroke",function(d) {
		                		for(var i = 0; i < ST_LineInfo.length; i ++) {
		                			if(ST_LineInfo[i].people == d.people) {
		                				return ST_LineInfo[i].color;
		                			}
		                		}
		                	});
		                d3.selectAll(".ST_link")
		                	.style("stroke-opacity",function(d) {
		                		for(var i = 0; i < ST_LineInfo.length; i ++) {
		                			if(ST_LineInfo[i].people == d.people) {
		                				return ST_LineInfo[i].opacity;
		                			}
		                		}
		                	});
		            })
					.style("stroke-width", function(d) { return Math.max(1, d.dy / 8); })
					.sort(function(a, b) { return b.dy - a.dy; });

		function ComputeLineInfo() {
			ST_graph.links.forEach(function(d) {
				for(var i = 0; i < ST_LineInfo.length; i ++) {
							ST_LineInfo[i].begin.x = -1;
							ST_LineInfo[i].begin.y = -1 ;
							ST_LineInfo[i].end.x = -1;
							ST_LineInfo[i].end.y = -1;
						}
					});
			ST_graph.links.forEach(function(d) {
				for(var i = 0; i < ST_LineInfo.length; i ++) {
					if(ST_LineInfo[i].people == d.people) {
						if(ST_LineInfo[i].begin.x == -1 || ST_LineInfo[i].begin.x >= d.source.x) {
							ST_LineInfo[i].begin.x = d.source.x + d.source.dx * 2 / 3;
							ST_LineInfo[i].begin.y = d.source.y + d.sy + d.dy / 2 ;
						}
						if(ST_LineInfo[i].end.x == -1 || ST_LineInfo[i].end.x <= d.target.x) {
							ST_LineInfo[i].end.x = d.target.x + d.target.dx / 3;
							ST_LineInfo[i].end.y = d.target.y + d.ty + d.dy / 2;
						}
					}
				}
			});
		
			ST_graph.links.forEach(function(d, di) {
				var tempAdd = {};
				var t_x1 = d.source.x + d.source.dx * 2 / 3;
				var t_y1 = d.source.y + d.sy + d.dy / 2 ;
				var t_x2 = d.target.x + d.target.dx / 3;
				var t_y2 = d.target.y + d.ty + d.dy / 2;
				var isInA = false,isInB = false;
				for(var i = 0; i < ST_LineInfo.length; i ++) {
					if(ST_LineInfo[i].begin.x == t_x1 && ST_LineInfo[i].begin.y == t_y1) {
						isInA = true;
					}
					if(ST_LineInfo[i].end.x == t_x2 && ST_LineInfo[i].end.y == t_y2) {
						isInB = true;
					}
				}
				if(!isInA) {
					tempAdd.x = d.source.x + d.source.dx / 2;
					tempAdd.y = d.source.y + d.sy + d.dy /2 ;
					for(var j = 0; j < ST_MidPoints.length; j ++) {
						if(ST_MidPoints[j].id == di) {
							ST_MidPoints[j].x = tempAdd.x;
							ST_MidPoints[j].y = tempAdd.y;
							ST_MidPoints[j].visible = true;
						}
					}
				}
				if(!isInB){
					tempAdd.x = d.target.x + d.target.dx / 2;
					tempAdd.y = d.target.y + d.ty + d.dy /2 ;
					for(var j = 0; j < ST_MidPoints.length; j ++) {
						if(ST_MidPoints[j].id == di+0.5) {
							ST_MidPoints[j].x = tempAdd.x;
							ST_MidPoints[j].y = tempAdd.y;
							ST_MidPoints[j].visible = true;
						}
					}
				}
			});
		}

		ComputeLineInfo();

	  	link.append("title")
	      .text(function(d) { return d.source.event.seqNum + " → " + d.target.event.seqNum + "\n" + d.people; });

	    var startpoints = svg.append("g")
	    					.attr("id","ST_StartPoint")
	    					.selectAll("circle")
	    					.data(ST_LineInfo)
	    					.enter().append("circle")
	    					.attr("cx",function(d) {
	    						return d.begin.x;
	    					})
	    					.attr("cy", function(d) {
	    						return d.begin.y;
	    					})
	    					.attr("r", "4")
	    					.attr("fill",function(d) {
		                		return d.circle.fill;
		                	});

	    var endpoints = svg.append("g")
	    					.attr("id","ST_EndPoint")
	    					.selectAll("circle")
	    					.data(ST_LineInfo)
	    					.enter().append("circle")
	    					.attr("cx",function(d) {
	    						return d.end.x;
	    					})				
	    					.attr("cy",function(d) {
	    						return d.end.y;
	    					})
	    					.attr("r","4")
	    					.attr("fill",function(d) {
		                		return d.circle.fill;
		                	});

	   	svg.append("g").attr("id","ST_MidPoint")
	   		.selectAll("circle")
	   		.data(ST_MidPoints)
	   		.enter().append("circle")
	   		.attr("cx", function(d) {
	   			return d.x;
	   		})
	   		.attr("cy", function(d) {
	   			return d.y;
	   		})
	   		.attr("r", function(d) {
	   			if(d.visible == false)
	   				return 0;
	   			else 
	   				return 2;
	   		})
	   		.attr("fill",function(d) {
	   			for(var i = 0; i < ST_LineInfo.length; i ++) {
	   				if(ST_LineInfo[i].people == d.people) {
	   					return ST_LineInfo[i].circle.fill;
	   				}
	   			}
	   		})
	   		.attr("fill-opacity", function(d) {
	   			return .2;
	   		});

		var node = svg.append("g").selectAll(".ST_node")
		  .data(ST_graph.nodes)
		.enter().append("g")
		  .attr("class", "ST_node")
		  .attr("transform", function(d) {return "translate(" + d.x + "," + d.y + ")"; })
		.call(d3.behavior.drag()
		  .origin(function(d) { return d; })
		  .on("dragstart", function() { this.parentNode.appendChild(this); })
		  .on("drag", dragmove))
		  .on("dblclick",function(d) {
		  	d.dbon = !d.dbon;
		  	ST_resetRect();

		  	if(d.dbon) {

		  		var inName = [];
		  		d.sourceLinks.forEach(function(d) {
		  			inName.push(d);
		  			ST_setdown(d);
		  		});
		  		d.targetLinks.forEach(function(d) {
		  			var isIn = false;
		  			for(var k = 0; k < inName.length; k ++) {
		  				if(d.people == inName[k].people)
		  					isIn = true;
		  			}
		  			if(!isIn){
		  				ST_setdown(d);
		  			}
		  		});
		  	} else {

		  		var inName = [];
		  		d.sourceLinks.forEach(function(d) {
		  			inName.push(d);
		  			ST_setoff(d);
		  		});
		  		d.targetLinks.forEach(function(d) {
		  			var isIn = false;
		  			for(var k = 0; k < inName.length; k ++) {
		  				if(d.people == inName[k].people)
		  					isIn = true;
		  			}
		  			if(!isIn){
		  				ST_setoff(d);
		  			}
		  		});
		  	}
		  });

		node.append("rect")
			.attr("height", function(d) { return d.dy; })
			.attr("width", sankey.nodeWidth())
			.style("fill", function(d) { 
				return "#000";
				d.color = color(d.name.replace(/ .*/, "")); })
			.style("fill-opacity", ".05")
			//.style("stroke", function(d) { return d3.rgb(d.color).darker(2); })
			.append("title")
			.text(function(d) { 
				var pps = "";
				for(var i = 0; i < d.event.people.length; i ++) {
					pps += d.event.people[i] + ",";
				}
				return "回合" + d.event.seqNum + " : " + d.event.description + "\n" + pps; 
			});

		node.append("text")
			.attr("x", -6)
			.attr("y", function(d) { return d.dy / 2; })
			.attr("dy", ".35em")
			.attr("text-anchor", "end")
			.attr("transform", null)
			.text(function(d) { 
				if(ST_showname) {
					var people = "";
					for(var i = 0; i < d.event.people.length; i ++) {
						people += d.event.people[i] + ",";
					}
					return d.event.seqNum +" " +people; 
				} else {
					return d.event.seqNum;
				}
			})
			.filter(function(d) { return d.x < width / 2; })
			.attr("x", 6 + sankey.nodeWidth())
			.attr("text-anchor", "start");

		function dragmove(d) {
			d3.select(this).attr("transform", "translate(" + d.x + "," + (d.y = Math.max(0, Math.min(ST_height - d.dy, d3.event.y))) + ")");
			sankey.relayout();
			ComputeLineInfo();

			var sp = svg.select("#ST_StartPoint")
				.selectAll("circle")
				.attr("cx",function(d) {
					return d.begin.x;
				})
				.attr("cy", function(d) {
					return d.begin.y;
				})
				.attr("r", "4");

			svg.select("#ST_EndPoint")
				.selectAll("circle")
				.attr("cx",function(d) {
					return d.end.x;
				})
				.attr("cy",function(d) {
					return d.end.y;
				})

			svg.select("#ST_MidPoint")
				.selectAll("circle")
				.attr("cx",function(d) {
					return d.x;
				})
				.attr("cy",function(d) {
					return d.y;
				})
				.attr("r", "2")
				.attr("fill", function(d) {
					for(var i = 0; i < ST_LineInfo.length; i ++) {
						if(ST_LineInfo[i].people == d.people) {
							return ST_LineInfo[i].circle.fill;
						}
					}
				});

			link.attr("d", path);
	  	}
	});
}

function ST_mousedown(data) {
	for(var i = 0; i < ST_LineInfo.length; i ++) {
		if(ST_LineInfo[i].people == data.people) {
			if(ST_LineInfo[i].selected) {
				ST_LineInfo[i].selected = false;
				ST_LineInfo[i].color = "#000";
				ST_LineInfo[i].opacity = .2;
				ST_point --;
			} else {
				ST_LineInfo[i].selected = true;
				ST_LineInfo[i].color = ST_color_set(ST_point);
				ST_LineInfo[i].opacity = 1;
				ST_point ++;
			}
			ST_resetLine();
		}
	}
	REL_repaint();
	ST_updateMap();
}

function ST_setdown(data) {
	for(var i = 0; i < ST_LineInfo.length; i ++) {
		if(ST_LineInfo[i].people == data.people) {
			if(ST_LineInfo[i].selected == false)
				ST_point ++;

			ST_LineInfo[i].selected = true;
			ST_LineInfo[i].color = ST_color_set(ST_point);
			ST_LineInfo[i].opacity = 1;
		}
		ST_resetLine();
	}
	REL_repaint();
	ST_updateMap();
}

function ST_setdown22(data) {
	for(var i = 0; i < ST_LineInfo.length; i ++) {
		if(ST_LineInfo[i].people == data.people) {
			if(ST_LineInfo[i].selected == false)
				ST_point ++;

			ST_LineInfo[i].selected = true;
			ST_LineInfo[i].color = ST_color_set(ST_point);
			ST_LineInfo[i].opacity = 1;
		}
		ST_resetLine();
	}
	REL_repaint();
}

function ST_setoff(data) {
	for(var i = 0; i < ST_LineInfo.length; i ++) {
		if(ST_LineInfo[i].people == data.people) {
			if(ST_LineInfo[i].selected == true)
				ST_point --;

			ST_LineInfo[i].selected = false;
			ST_LineInfo[i].color = "#000000";
			ST_LineInfo[i].opacity = .2;
		}
		ST_resetLine();
	}
	REL_repaint();
	ST_updateMap();
}

function ST_resetLine() {
	d3.selectAll(".ST_link")
    	.style("stroke",function(d) {
    		for(var i = 0; i < ST_LineInfo.length; i ++) {
    			if(ST_LineInfo[i].people == d.people) {
    				return ST_LineInfo[i].color;
    			}
    		}
    	});
    d3.selectAll(".ST_link")
		.style("stroke-opacity",function(d) {
			for(var i = 0; i < ST_LineInfo.length; i ++) {
				if(ST_LineInfo[i].people == d.people) {
					return ST_LineInfo[i].opacity;
				}
			}
		});
}

function ST_resetRect() {
	d3.selectAll(".ST_node")
		.selectAll("rect")
		.style("fill-opacity",function(d) {
			if(d.dbon) return .2;
			else return .05;
		});
}

function ST_updateMap(){
	var nameList = [];
	ST_LineInfo.forEach(function(d) {
		if(d.selected) {
			nameList.push(d);
		}
	});
	GEO_searchByPeople(nameList);
}