var GEO_map;
var GEO_cities;
var GEO_ploylines=[];

var MY_MAPTYPE_ID = 'custom_style';
var GEO_myMapOption = [
  {
    "featureType": "administrative",
    "stylers": [
      { "visibility": "off" }
    ]
  }
];

function GEO_initMap() {
  var mapOptions = {
    center: new google.maps.LatLng(29.833444, 113.618953), //赤壁
    zoom: 8,
    mapTypeId: google.maps.MapTypeId.TERRAIN//TERRAIN
  };

  GEO_map = new google.maps.Map(document.getElementById("map_canvas"),
      mapOptions);

  GEO_map.setOptions({styles: GEO_myMapOption});

  d3.json("mapdata/location2.json",function(error,data) {
    GEO_cities = data;
    GEO_markCities(GEO_cities);
  });

  GEO_searchByChapter(49,50);
}

function GEO_markCities(data)
{
  var markers = new Array();
  for(var i = 0; i < data.length; i ++)
  {
    var tempLatLng2 = new google.maps.LatLng(data[i].lat, data[i].lng);
  var p = data[i].power;
    /*markers[i] = new google.maps.Marker({
      position:tempLatLng2,
      map:GEO_map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 5,
        fillColor: "#ff0000",
        strokeColor: "red"
      },
      title:data[i].name
    });*/
  markers[i] = new MarkerWithLabel({
       position: tempLatLng2,
       draggable: false,
       raiseOnDrag: true,
       map: GEO_map,
       labelContent: (data[i].power==null)?data[i].name:data[i].name+"("+data[i].power+")",
       labelAnchor: new google.maps.Point(22, 0),
       labelClass: "labels", // the CSS class for the label
       labelStyle: {opacity: 1.0}
     });
  }
}

function getLatLng(from, to){
    var latlng = [];
    for(var i = 0; i < GEO_cities.length; i++){
        if(GEO_cities[i].name == from)
           latlng.push({status:"from",lat:GEO_cities[i].lat,lng:GEO_cities[i].lng});
        else if(GEO_cities[i].name == to)
           latlng.push({status:"to",lat:GEO_cities[i].lat,lng:GEO_cities[i].lng});
    }
    return latlng;
}

function GEO_searchByChapter(start, end){
    var result = [];
    d3.json("mapdata/moving.json",function(error,data) {

        var pp = [];
        for(var i = 0; i < data.length; i ++){
            if(data[i].seq > end)
                break;
            if(data[i].seq < start)
                continue;

            var color;
            pp.push(data[i].people[0]);
            for(var t = 0; t < ST_LineInfo.length; t ++) {
              if(ST_LineInfo[t].people == data[i].people[0]) {
                  color = ST_LineInfo[t].circle.fill;
                  break;
              }
            }
            result.push({from:data[i].src, to:data[i].des, cr:color});
        }

        GEO_clearLine();
        for(var i = 0; i < result.length; i++){
           GEO_showLine(getLatLng(result[i].from, result[i].to), result[i].cr, pp);
        }
    });
}

function compare(list1, list2){
    for(var i = 0; i < list1.length; i++)
      for(var j = 0; j < list2.length; j++)
          if(list1[i].people == list2[j])
              return true;
    return false;
}

function GEO_searchByPeople(people){
    var result = [];
    d3.json("mapdata/moving.json",function(error,data) {
        for(var i = 0; i < data.length; i ++){
            var cmp = compare(people, data[i].people);
            if(cmp) {
              var color;
              for(var t = 0 ; t < people.length; t ++) {
                for(var k = 0; k < data[i].people.length; k ++) {
                    if(people[t].people == data[i].people[k])
                    {
                       color = people[t].circle.fill;
                    }
                }
              }

              result.push({from:data[i].src, to:data[i].des, cr:color});}
        }

        var pp =[];
        people.forEach(function(d) {
          pp.push(d.people);
        });

        GEO_clearLine();
        for(var i = 0; i < result.length; i++){
              GEO_showLine(getLatLng(result[i].from, result[i].to), result[i].cr, pp);
        }
    });
}

function GEO_clearLine(){
    for(var i = 0; i < GEO_ploylines.length; i++)
        GEO_ploylines[i].getPath().clear();
    for(var i = 0; i < GEO_ploylines.length; i++)
        GEO_ploylines.pop();
}

function GEO_showLine(data, color,people){
    var src, des;
    if(data.length != 2)
        return;
    if(data[0].status == "from"){
        src = new google.maps.LatLng(data[0].lat, data[0].lng);
        des = new google.maps.LatLng(data[1].lat, data[1].lng);
    }else{
        des = new google.maps.LatLng(data[0].lat, data[0].lng);
        src = new google.maps.LatLng(data[1].lat, data[1].lng);
    }
    var symbol ={
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
    };
    var flightPath = new google.maps.Polyline({ 
        path: [src,des],
        icons: [{
          icon: symbol,
          offset: '100%'
        }],
        editable: false,
        strokeColor: color,
        strokeOpacity: 1.0,
        strokeWeight: 4
      });
    flightPath.people = people;

    google.maps.event.addListener(flightPath, 'click', function() {
        //console.log(flightPath.people);
        for(var i = 0; i < flightPath.people.length; i ++) {
          for(var j = 0; j < ST_LineInfo.length; j ++) {
            if(ST_LineInfo[j].people == flightPath.people[i])
            {
              ST_setdown(ST_LineInfo[j]);
            }
          }
          //ST_setdown22(people[i]);
        }
    });
    flightPath.setMap(GEO_map);
    GEO_ploylines.push(flightPath);
}
