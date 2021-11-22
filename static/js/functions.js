let rx = 0.00080, ry = 0.00110;
let center = [40.6715, 14.7933];
let center1 = 40.626319, center2 = 14.734752;
let EARTH_RADIUS = 6371;
let tavolaColori = [["#9E0142",5], ["#D13C4B",10], ["#F0704A",15], ["#FCAC63",20], ["#FEDD8D",25], ["#A9DDA2",30], ["#69BDA9",35], ["#4EA4B0",40], ["#4288B5",45], ["#4A6CAE",50], ["#5E4FA2",55]]
let iconOspedale = L.divIcon({html: '<i id="icona1" class="fas fa-hospital-symbol" style="font-size:18px;color:red;position:relative;left:-5px;top:-5px"></i>', iconSize: [10,10]})
let iconParcheggio = L.divIcon({html: '<i class="fas fa-parking" style="font-size:18px;color:blue;position:relative;left:-4px;top:-4px"></i>', iconSize: [10,10]})
let iconCentroCommerciale = L.divIcon({html: '<i class="fas fa-shopping-car" style="font-size:15px;color:green"></i>', iconSize: [15,15]})
var mymap;
var hexOnMap = [];
var centers = [];
var markers = [];
var tooltips = [];
var polyline = [];
var hexOnMap;
var centri;
var input = {poi: "", mezzo: ""};
//
function hexagon(pos_x,pos_y){       //funzione per costruire gli esagoni
    var poly = [
        [ pos_x[0], pos_y[0] ],
        [ pos_x[1], pos_y[1] ],
        [ pos_x[2], pos_y[2] ],
        [ pos_x[3], pos_y[3] ],
        [ pos_x[4], pos_y[4] ],
        [ pos_x[5], pos_y[5] ]
    ];
    return poly;
}
function Polyline(path){
    new_path = [];
    for(i=0;i<path.length;i++){
        new_path.push([path[i][1],path[i][0]]);
    }
    return new_path;
}

function getDistance(origin, destination) {
// ritorna la distanza in metri
    let lon1 = toRadian(origin[1]);
    let lat1 = toRadian(origin[0]);
    let lon2 = toRadian(destination[1]);
    let lat2 = toRadian(destination[0]);
    let deltaLat = lat2 - lat1;
    let deltaLon = lon2 - lon1;
    let a = Math.pow(Math.sin(deltaLat/2), 2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(deltaLon/2), 2);
    let c = 2 * Math.asin(Math.sqrt(a));
    return c * EARTH_RADIUS * 1000;
}

function toRadian(degree) {
    return degree*Math.PI/180;
}

function time(secondiTotali){
    var minuti = Math.floor(secondiTotali/60);
    var secondi = secondiTotali - minuti*60;
    return(minuti+" min e "+secondi+" s");
}

function space(metriTotali){
    if(metriTotali>=1000) {
        km = Math.floor(metriTotali/1000);
        metri = metriTotali - km*1000;
        return(km+" Km e "+metri+" m");
    }
    else return(metriTotali+" m");
}

function cleanMap(){
    for (i=0;i<hexOnMap.length;i++){
        mymap.removeLayer(hexOnMap[i].esagono);
    }
    mymap.removeLayer(polyline);
}

function removeMarker(){
    for(i=0;i<markers.length;i++){
        mymap.removeLayer(markers[i]);
        mymap.removeLayer(tooltips[i]);
    }
    tooltips = [];
    markers = [];
}

function removeOpacita(){
    for(i=0;i<hexOnMap.length;i++){
        hexOnMap[i].esagono._path.style.strokeOpacity = 0;
    }
}

function buttonShow(){
    document.getElementById("hospital").style.opacity = 1;
    document.getElementById("shopping").style.opacity = 1;
    document.getElementById("parking").style.opacity = 1;
    document.getElementById("walking").style.opacity = 1;
    document.getElementById("bus-alt").style.opacity = 1;
    document.getElementById("car").style.opacity = 1;
}

function hexagonsOnMap(centers){
    var polyline = L.polyline([[centers[0].lat,centers[0].lng],[centers[1].lat,centers[1].lng]],{opacity:0},).addTo(mymap);
    for(j=0; j<centers.length;j++){
        pos_x = [];
        pos_y = [];
        for(i=0;i<6;i++){
            pos_x[i] =  centers[j].lat + rx*Math.sin(i*Math.PI/3);
            pos_y[i] =  centers[j].lng + ry*Math.cos(i*Math.PI/3);
        }
        hex = hexagon(pos_x, pos_y);
        poly = L.polygon(hex,{opacity:0,fillOpacity:0.5},);
        hexOnMap.push({"id": centers[j].id,"esagono": poly});
    }
}

function plotTratte(tratte,tipo){
    var popup = L.popup();
    for(i=0;i<tratte.length;i++){
        for(z=0;z<tavolaColori.length;z++){
            if(tratte[i].time < tavolaColori[z][1]){
                colore = tavolaColori[z][0];
                break;
            }
        }
        hexOnMap[i].esagono.setStyle({color:colore,tratte:tratte[i]}).addTo(mymap);
        hexOnMap[i].esagono.on('click', function() {
            mymap.removeLayer(polyline);
            removeOpacita();
            this._path.style.stroke = "#9E0142";
            this._path.style.strokeOpacity = 1;
            polyline = L.polyline(JSON.parse(this.options.tratte.path)[0].path,{color: 'black', opacity: 0.5, weight:2}).addTo(mymap);
            this.bindPopup("<b>Tempo:</b> "+time(this.options.tratte.time) + "<br>" + "<b>Distanza:</b> "+ space(this.options.tratte.distance)).openPopup();
        });
    }
}

function getPoints(){
    $.ajax({
        type: "GET",
        url: "getPoints",
        async: true,
        success: function(result){
            hexagonsOnMap(result);
        }
    });
}

function creaTavolaColori(){
    var txt = '';
    var range = tavolaColori[1][1]-tavolaColori[0][1];
    txt += '<div id="legendColor"><span id="colorSpan" style="background:'+ tavolaColori[0][0] +'"></span><span id="livelliTempo"> < '+tavolaColori[0][1]+'</span></div> ';
    for(i=1;i<(tavolaColori.length - 1);i++){
        txt += '<div id="legendColor"><span id="colorSpan" style="background:'+ tavolaColori[i][0] +'"></span><span id="livelliTempo">'+tavolaColori[i-1][1]+" - "+tavolaColori[i][1]+'</span></div> ';
    }
    txt += '<div id="legendColor"><span id="colorSpan" style="background:'+ tavolaColori[i][0] +'"></span><span id="livelliTempo"> > '+(tavolaColori[i-1][1] + range)+'</span></div>';
    document.getElementById("tavolaColori").innerHTML = txt;
    for(i=0;i<tavolaColori.length;i++){
        tavolaColori[i][1] *= 60;
    }
}

function ritiraPoi(tipo){
    $.ajax({
        type: "GET",
        url: "getPois",
        data: {type: tipo},
        async: true,
        success: function(result){
            showMarkers(result, tipo);
            console.log(result);
        }
    })
}

function showMarkers(poi, tipo){
    var i = 0;
    if(tipo == "hospital"){
        for(i=0;i<poi.length;i++){
            var marker = L.marker([poi[i].lat, poi[i].lng],{icon:iconOspedale, id: 1, poi: poi[i].id}).addTo(mymap);
            var tooltip = marker.bindTooltip(poi[i].name,{permanent:true, className:'tooltipPOI', direction:'top'}).openTooltip();
            tooltips.push(tooltip);
            markers.push(marker);
            marker.on('click',function(){
                this.valueOf().options.id = 0;
                showPoi("hospital", this.valueOf().options.poi);
            });
        }
    }
    else if(tipo == "parking"){
        for(i=0;i<poi.length;i++){
            var marker = L.marker([poi[i].lat, poi[i].lng],{icon:iconParcheggio, id: 1, poi: poi[i].id}).addTo(mymap);
            var tooltip = marker.bindTooltip(poi[i].name,{permanent:true, className:'tooltipPOI', direction:'top'}).openTooltip();
            tooltips.push(tooltip);
            markers.push(marker);
            marker.on('click', function(){
                this.valueOf().id = 0;
                showPoi("parking", this.valueOf().poi);
            });
        }
    }
    else if(tipo == "shopping"){
        for(i=0;i<poi.length;i++){
            var marker = L.marker([poi[i].lat, poi[i].lng],{icon:iconCentroCommerciale, id: 1, poi: poi[i].id}).addTo(mymap);
            var tooltip = marker.bindTooltip(poi[i].name,{permanent:true, className:'tooltipPOI', direction:'top'}).openTooltip();
            tooltips.push(tooltip);
            markers.push(marker);
            marker.on('click', function(){
                this.valueOf()._icon.style.opacity = 1;
                this.valueOf().id = 0;
                showPoi("shopping", this.valueOf().poi);
            });
        }
    }
}

function ritiraTratte(tipo){
    $.ajax({
        type: "GET",
        url: "getAccessibility",
        data: {type: tipo, mezzo: input.mezzo},
        async: true,
        success: function(result){
            plotTratte(result,tipo);
        }
    })
}

function ritiraTratte2(tipo,punto){
    $.ajax({
        type: "GET",
        url: "getAccessibility",
        data: {poi: punto, mezzo: input.mezzo},
        async: true,
        success: function(result){
            plotTratte(result,tipo);
        }
    })
}

function showPoi(tipo, punto){
    cleanMap();
    for(i=0;i<markers.length;i++){
        if(markers[i].valueOf().options.id == 1){
            markers[i].valueOf()._icon.style.opacity = 0.3;
        }
        else markers[i].valueOf().id = 1;
    }

    ritiraTratte2(tipo,punto);
}

function initialize(){
    mymap = L.map('mapid', {zoomControl:false}).setView(center, 13);
    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 20,
        id: 'mapbox/streets-v11',
        accessToken: 'pk.eyJ1IjoiZGFuaWVsZWFuZ2VsaW5pIiwiYSI6ImNrNmkwOWg1bTAxdDczbW16M2F2OXlsbWEifQ.V8Sn6Ifwy9Z5jIBR4YI7yA'
    }).addTo(mymap);
    L.control.scale().addTo(mymap);
    L.control.zoom({position:'bottomright'}).addTo(mymap);
    creaTavolaColori();
    getPoints();
    $("#closeLegenda").click(function(){
        $("#pannelloLegenda").hide();
        $("#closeLegenda").hide();
        $("#openLegenda").show();
    });
    $("#openLegenda").click(function(){
        $("#pannelloLegenda").show();
        $("#closeLegenda").show();
        $("#openLegenda").hide();
    });
    $("#closeOrari").click(function(){
        $("#pannelloOrari").hide();
        $("#closeOrari").hide();
        $("#openOrari").show();
    });
    $("#openOrari").click(function(){
        $("#pannelloOrari").show();
        $("#closeOrari").show();
        $("#openOrari").hide();
    });
    $("#closeCity").click(function(){
        $("#pannelloCity").hide();
        $("#closeCity").hide();
        $("#openCity").show();
    });
    $("#openCity").click(function(){
        $("#pannelloCity").show();
        $("#closeCity").show();
        $("#openCity").hide();
    });
    $("#hospital").click(function(){
        document.getElementById("hospital").style.opacity = 1;
        document.getElementById("parking").style.opacity = 0.3;
        document.getElementById("shopping").style.opacity = 0.3;
        //document.getElementById("walking").style.opacity = 0.3;
        removeMarker();
        cleanMap();
        input.poi = "hospital";
        if(input.mezzo == "transit" || input.mezzo == "driving" ){
            ritiraTratte("hospital");
            ritiraPoi("hospital");
        }
    });
    $("#parking").click(function(){
        document.getElementById("parking").style.opacity = 1;
        document.getElementById("hospital").style.opacity = 0.3;
        document.getElementById("shopping").style.opacity = 0.3;
        //document.getElementById("bus-alt").style.opacity = 0.3;
        //document.getElementById("car").style.opacity = 0.3;
        removeMarker();
        cleanMap();
        input.poi = "parking";
        if(input.mezzo == "walking"){
            ritiraTratte("parking");
            ritiraPoi("parking");
        }
    });
    $("#shopping").click(function(){
        document.getElementById("shopping").style.opacity = 1;
        document.getElementById("parking").style.opacity = 0.3;
        document.getElementById("hospital").style.opacity = 0.3;
        //document.getElementById("walking").style.opacity = 0.3;
        removeMarker();
        cleanMap();
        input.poi = "shopping";
        if(input.mezzo == "transit" || input.mezzo == "driving" ){
            ritiraTratte("shopping");
            ritiraPoi("shopping");
        }
    });
    $("#walking").click(function(){
        buttonShow();
        document.getElementById("hospital").style.opacity = 0.3;
        document.getElementById("shopping").style.opacity = 0.3;
        document.getElementById("bus-alt").style.opacity = 0.3;
        document.getElementById("car").style.opacity = 0.3;
        input.mezzo = "walking";
    });
    $("#bus-alt").click(function(){
        buttonShow();
        document.getElementById("parking").style.opacity = 0.3;
        document.getElementById("walking").style.opacity = 0.3;
        document.getElementById("car").style.opacity = 0.3;
        input.mezzo = "transit";
    });
    $("#car").click(function(){
        buttonShow();
        document.getElementById("parking").style.opacity = 0.3;
        document.getElementById("bus-alt").style.opacity = 0.3;
        document.getElementById("walking").style.opacity = 0.3;
        input.mezzo = "driving";
    });
    $(document).ready(function(){
        $("#information").tooltip();
    });
    $(document).ready(function(){
        $("#hospitalTooltip").tooltip();
    });
    $(document).ready(function(){
        $("#shoppingTooltip").tooltip();
    });
    $(document).ready(function(){
        $("#parkingTooltip").tooltip();
    });
    $(document).ready(function(){
        $("#bus-altTooltip").tooltip();
    });
    $(document).ready(function(){
        $("#carTooltip").tooltip();
    });
    $(document).ready(function(){
        $("#walkingTooltip").tooltip();
    });
}

$(function(){
    initialize();
})