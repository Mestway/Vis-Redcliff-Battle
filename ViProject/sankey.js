var width = 1600;
d3.sankey = function() {
  var sankey = {},
      nodeWidth = 24,
      nodePadding = 8,
      size = [1, 1],
      nodes = [],
      links = [];

  sankey.nodeWidth = function(_) {
    if (!arguments.length) return nodeWidth;
    nodeWidth = +_;
    return sankey;
  };

  sankey.nodePadding = function(_) {
    if (!arguments.length) return nodePadding;
    nodePadding = +_;
    return sankey;
  };

  sankey.nodes = function(_) {
    if (!arguments.length) return nodes;
    nodes = _;
    return sankey;
  };

  sankey.links = function(_) {
    if (!arguments.length) return links;
    links = _;
    return sankey;
  };

  sankey.size = function(_) {
    if (!arguments.length) return size;
    size = _;
    return sankey;
  };

  sankey.layout = function(iterations) {
    computeNodeLinks();
    computeNodeValues();
    computeNodeBreadths();
    computeNodeDepths(iterations);
    computeLinkDepths();
    computeLinkDepths();
    return sankey;
  };

  sankey.relayout = function() {
    computeLinkDepths();
    return sankey;
  };

  sankey.link = function() {
    var curvature = .9;

    function link(d) {
      var x00 = d.source.x + d.source.dx / 2,//MODIFY:it used to be d.source.x + d.source.dx
          x0 = d.source.x + d.source.dx,
          x01 = d.target.x + d.target.dx / 2 ,
          x1 = d.target.x;
          xi = d3.interpolateNumber(x0, x1),
          x2 = xi(curvature),
          x3 = xi(1-curvature),
          y0 = d.source.y + d.sy + d.dy / 2,
          y1 = d.target.y + d.ty + d.dy / 2;
      return "M" + x00 + "," + y0
           + "L" + x0 + "," + y0
           + "C" + x2 + "," + y0
           + " " + x3 + "," + y1
           + " " + x1 + "," + y1
           + "L" + x01 + "," + y1;
    }

    link.curvature = function(_) {
      if (!arguments.length) return curvature;
      curvature = +_;
      return link;
    };

    return link;
  };

  // Populate the sourceLinks and targetLinks for each node.
  // Also, if the source and target are not objects, assume they are indices.
  function computeNodeLinks() {
    nodes.forEach(function(node) {
      node.sourceLinks = [];
      node.targetLinks = [];
    });
    links.forEach(function(link) {
      var source = link.source,
          target = link.target;
      if (typeof source === "number") source = link.source = nodes[link.source];
      if (typeof target === "number") target = link.target = nodes[link.target];
      source.sourceLinks.push(link);
      target.targetLinks.push(link);
    });
  }

  // Compute the value (size) of each node by summing the associated links.
  function computeNodeValues() {
    nodes.forEach(function(node) {
      node.value = Math.max(
        d3.sum(node.sourceLinks, value),
        d3.sum(node.targetLinks, value)
      );
    });
  }

  // Iteratively assign the breadth (x-position) for each node.
  // Nodes are assigned the maximum breadth of incoming neighbors plus one;
  // nodes with no incoming links are assigned breadth zero, while
  // nodes with no outgoing links are assigned the maximum breadth.
  function computeNodeBreadths() {

    var extra_margin = 3;

    var remainingNodes = nodes,
        nextNodes,
        curNodes,
        x = 0;

    var currentC = 100;

    nodes.forEach(function(node) {
      if(node.event.seqNum <= currentC) {
        currentC = node.event.seqNum;
      }
    });

    currentC += 0.3;

    while (remainingNodes.length) {
      nextNodes = [];
      curNodes = [];

      remainingNodes.forEach(function(node,i) {
        node.x = x;
        node.dx = nodeWidth;
        if(node.event.seqNum > currentC)
        {
          nextNodes.push(node);
        }
        else
        {
          curNodes.push(node);
        }

        //node.sourceLinks.forEach(function(link) {
        //  nextNodes.push(link.target);
        //});

      });

      var len = curNodes.length;
      var nxt = 0
      curNodes.forEach(function(node, i) {
        /* use nestforx to help nest the nodes in the d3.nest()*/
        node.nestforx = node.x;
        node.x = node.x + (i / len) * extra_margin;
        node.nestforx = nxt;
        nxt ++;
      });

      remainingNodes = nextNodes;
      ++x;
      currentC += 0.3;
    }

    /*move a no ouput link out*/
    //moveSinksRight(x);
    scaleNodeBreadths((width - nodeWidth - 5) / (x + extra_margin - 1));
  }

  function moveSourcesRight() {
    nodes.forEach(function(node) {
      if (!node.targetLinks.length) {
        node.x = d3.min(node.sourceLinks, function(d) { return d.target.x; }) - 1;
      }
    });
  }

  function moveSinksRight(x) {
    nodes.forEach(function(node) {
      if (!node.sourceLinks.length) {
        node.x = x - 1;
      }
    });
  }

  function scaleNodeBreadths(kx) {
    nodes.forEach(function(node) {
      node.x *= kx;
    });
  }

  function computeNodeDepths(iterations) {
    var nodesByBreadth = d3.nest()
        .key(function(d) { return d.nestforx; })
        .sortKeys(d3.ascending)
        .entries(nodes)
        .map(function(d) { return d.values; });
    //
    initializeNodeDepth();
    /*resolveCollisions();
    for (var alpha = 1; iterations > 0; --iterations) {
      relaxRightToLeft(alpha *= .99);
      resolveCollisions();
      relaxLeftToRight(alpha);
      resolveCollisions();
    }*/

    function initializeNodeDepth() {
      var ky = d3.min(nodesByBreadth, function(nodes) {
        return (size[1] - (nodes.length - 1) * nodePadding) / d3.sum(nodes, value);
      });

      var ky = 18;
      var maxNode = 0;
     

      nodesByBreadth.forEach(function(nodes) {
        nodes.forEach(function(node, i) {
          if(maxNode < node.event.eventHeight) {
            maxNode = node.event.eventHeight;
          }
        });
      });

      var ht = d3.scale.linear().domain([0, maxNode]).range([1, 200]);

      nodesByBreadth.forEach(function(nodes) {
        nodes.forEach(function(node, i) {
          if(maxNode < node.event.eventHeight) {
            maxNode = node.event.eventHeight;
          }
        });
        nodes.forEach(function(node, i) {
          node.y = ht(node.event.eventHeight);
          //used to be: node.y = i;
          node.dy = node.value * ky;
        });
      });

      links.forEach(function(link) {
        link.dy = link.value * ky;
      });
    }

    function relaxLeftToRight(alpha) {
      nodesByBreadth.forEach(function(nodes, breadth) {
        nodes.forEach(function(node) {
          if (node.targetLinks.length) {
            var y = d3.sum(node.targetLinks, weightedSource) / d3.sum(node.targetLinks, value);
            node.y += (y - center(node)) * alpha;
          }
        });
      });

      function weightedSource(link) {
        return center(link.source) * link.value;
      }
    }

    function relaxRightToLeft(alpha) {
      nodesByBreadth.slice().reverse().forEach(function(nodes) {
        nodes.forEach(function(node) {
          if (node.sourceLinks.length) {
            var y = d3.sum(node.sourceLinks, weightedTarget) / d3.sum(node.sourceLinks, value);
            node.y += (y - center(node)) * alpha;
          }
        });
      });

      function weightedTarget(link) {
        return center(link.target) * link.value;
      }
    }

    function resolveCollisions() {
      nodesByBreadth.forEach(function(nodes) {
        var node,
            dy,
            y0 = 0,
            n = nodes.length,
            i;

        // Push any overlapping nodes down.
        nodes.sort(ascendingDepth);
        for (i = 0; i < n; ++i) {
          node = nodes[i];
          dy = y0 - node.y;
          if (dy > 0) node.y += dy;
          y0 = node.y + node.dy + nodePadding;
        }

        // If the bottommost node goes outside the bounds, push it back up.
        dy = y0 - nodePadding - size[1];
        if (dy > 0) {
          y0 = node.y -= dy;

          // Push any overlapping nodes back up.
          for (i = n - 2; i >= 0; --i) {
            node = nodes[i];
            dy = node.y + node.dy + nodePadding - y0;
            if (dy > 0) node.y -= dy;
            y0 = node.y;
          }
        }
      });
    }

    function ascendingDepth(a, b) {
      return a.y - b.y;
    }
  }

  function computeLinkDepths() {
    nodes.forEach(function(node) {
      node.targetLinks.sort(SortByStrange);
      //node.targetLinks.sort(ascendingSourceDepth);
      //node.sourceLinks.sort(sortByName);
      //node.targetLinks.sort(sortByName);

      //do some calculation to handle to end point of a line
      var tempTarget = [];
      var tempSave = [];
      for(var i = 0; i < node.targetLinks.length; i ++) {
        var isIn = false;
        for(var j = 0; j < node.sourceLinks.length; j ++) {
          if(node.targetLinks[i].people == node.sourceLinks[j].people) {
            isIn = true;
          }
        }
        if(isIn) {
          tempTarget.push(node.targetLinks[i]);
        } else {
          tempSave.push(node.targetLinks[i])
        }
      }
      for(var i = 0; i < tempSave.length; i ++) {
        tempTarget.push(tempSave[i]);
      }
      node.targetLinks = tempTarget;


      /*make sure each line represents a certain person */
      var tempArray = [];
      var tempSource = [];

      for(var i = 0; i < node.targetLinks.length; i ++) {
        for(var j = 0; j < node.sourceLinks.length; j ++) {
          if(node.sourceLinks[j].people == node.targetLinks[i].people) {
            tempArray.push(node.sourceLinks[j]);
          }
        }
      }

      node.sourceLinks.forEach(function(link) {
        var isIn = false;
        for(var i = 0; i < node.targetLinks.length; i ++) {
          if(link.people == node.targetLinks[i].people) {
            isIn = true;
          }
        }
        if(!isIn) {
          tempSource.push(link);
        }
      });

      for(var i = 0; i < tempSource.length; i ++) {
        tempArray.push(tempSource[i]);
      }
      node.sourceLinks = tempArray;

    });
    nodes.forEach(function(node) {
      var sy = 0, ty = 0;
      node.sourceLinks.forEach(function(link) {
        link.sy = sy;
        sy += link.dy;
      });
      node.targetLinks.forEach(function(link) {
        link.ty = ty;
        ty += link.dy;
      });
    });

    function ascendingSourceDepth(a, b) {
      return a.source.y - b.source.y;
    }

    function sortByName(a,b) {
      return hash(a.people) - hash(b.people);_
    }

    function hash(str){
      var hash = 1315423911,i,ch;
      for (i = str.length - 1; i >= 0; i--) {
          ch = str.charCodeAt(i);
          hash ^= ((hash << 5) + ch + (hash >> 2));
      }

        return  (hash & 0x7FFFFFFF);
    }

    function SortByStrange(a, b)
    {
        if(a.source.y - b.source.y != 0)
            return a.source.y - b.source.y;

        return a.sy - b.sy;
    }

    function ascendingTargetDepth(a, b) {
      return a.target.y - b.target.y;
    }
  }

  function center(node) {
    return node.y + node.dy / 2;
  }

  function value(link) {
    return link.value;
  }

  return sankey;
};