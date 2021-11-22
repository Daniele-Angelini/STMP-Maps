let rx = 0.00080, ry = 0.00110;
let center = [40.6715, 14.7933];
let center1 = 40.626319, center2 = 14.734752;
let EARTH_RADIUS = 6371;
var mymap;
var hexOnMap = [];
var centers = [];
var centriEsterni = [];
var hexOnMap;
var centri;

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
// return distance in meters
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
        mymap.removeLayer(hexOnMap[i]);
    }
}

function hexagonsOnMap(centers){
    var polyline = L.polyline([[centers[0].lat,centers[0].lng],[centers[1].lat,centers[1].lng]],{opacity:0},).addTo(mymap);
    cleanMap();
    hexOnMap  = [];
    //centriAttivi = [];
    //centriDisattivi = [];
    counter = 0;
    var popup = L.popup();

    for (j=0; j<centers.length; j++){
        //if(centers[j].active == 1){
            //centriAttivi.push(centers[j]);
            pos_x = [];
            pos_y = [];
            for(i=0;i<6;i++){
                pos_x[i] =  centers[j].lat + rx*Math.sin(i*Math.PI/3);
                pos_y[i] =  centers[j].lng + ry*Math.cos(i*Math.PI/3);
            }
            hex = hexagon(pos_x, pos_y);

            for(z=0;z<tavolaColori.length;z++){        //assegno il colore all'esagono in base al tempo di percorrenza
                if(pol[counter][2] < tavolaColori[z].time){
                    colore = tavolaColori[z].color;
                    break;
                }
            }

            poly = L.polygon(hex,{color:colore,opacity:0,fillOpacity:0.5,_leaflet_id:1,flagColor:colore,pol:pol[counter]},).addTo(mymap);
            hexOnMap.push(poly);
            poly.on('click', function() {
                mymap.removeLayer(polyline);
                polyline = L.polyline(this.options.pol[3][0]['path'],{color: 'black', opacity: 0.5, weight:5}).addTo(mymap);
                this.bindPopup("<b>Tempo:</b> "+time(this.options.pol[2]) + "<br>" + "<b>Distanza:</b> "+ space(this.options.pol[1])).openPopup();
            });
            poly.on('dblclick', function(){
                if(this.options.color != 'black'){
                    this.setStyle({color: 'black', fillOpacity:1});
                }
                else this.setStyle({color: this.options.flagColor, fillOpacity:0.5});
            });
            counter += 1;
        }
        /*else{
            centriDisattivi.push(centers[j]);
        }*/
    //}
}

function hexagonsOnMap2(centers){
    cleanMap();
    hexOnMap  = [];
    for (j=0; j<centers.length; j++){
        pos_x = [];
        pos_y = [];
        for(i=0;i<6;i++){
            pos_x[i] =  centers[j].lat + rx*Math.sin(i*Math.PI/3);
            pos_y[i] =  centers[j].lng + ry*Math.cos(i*Math.PI/3);
        }
        hex = hexagon(pos_x, pos_y);
        var poly;
        if(centers[j].active == 1){
            poly = L.polygon(hex,{color:'red',opacity:0,fillOpacity:0.5,_leaflet_id:1},).addTo(mymap);
        } else poly = L.polygon(hex,{color:'red',opacity:0,fillOpacity:0,_leaflet_id:0},).addTo(mymap);
        poly.on('click', function() {
            if(this.options._leaflet_id == 1){
                this.setStyle({fillOpacity:0, _leaflet_id:0});
            } else this.setStyle({fillOpacity:0.5, _leaflet_id:1});
        });
        /*poly.on('mouseover', function() {
            if(this.options._leaflet_id == 1){
                this.setStyle({fillOpacity:0, _leaflet_id:0});
            }
        });*/

        hexOnMap.push(poly);
    }
}

function nuoviEsagoni(){
    centers = [];
    // 72*44
    for(j=0;j<72;j++){
        for(k=0;k<44;k++){
            center = {};
            //centri delle file dispari
            center.lat = center1 + 1.732*rx*j;
            center.lng = center2 + 2.9995*ry*k;
            centers.push(center);
            //centri delle file pari
            center ={};
            center.lat = center1 + 1.732*rx*j + 0.866*rx;
            center.lng = center2 + 2.9995*ry*k + 1.5*ry;
            centers.push(center);
        }
    }
    hexagonsOnMap(centers);
}

function registraCentri(centri, tipo){
    data = {};
    data.tipo = tipo;
    data.dati = centri;
    $.ajax({
        type: 'POST',
        url: 'registraCentri',
        data:  JSON.stringify(data),
        dataType: 'json',
        success: function(result){
            console.log(result);
        }
    });
}

function archiviaCentri(){
    var i = 0;
    if ((centers.length>0))
    centri  =[];
    for(i=0;i<hexOnMap.length;i++) {
        if(hexOnMap[i].options._leaflet_id == 1){
            centers[i].active = 1;
        }
        else{
            centers[i].active = 0;
        }
        centri.push(centers[i]);
    } if (centers.length>0){
        registraCentri(centri, 'centri');
    } else alert ("Non ci sono esagoni da archiviare");
}

function archiviaCentriSbagliati(){
    centri = [];
    for(i=0;i<hexOnMap.length;i++){
        if(hexOnMap[i].options.color == 'black'){
            centri.push({"lat": centers[i]['lat'], "lng": centers[i]['lng'], "active": 1});
        }
    }
    if(centri.length>0){
        registraCentri(centri, 'sbagliati');
    }
    else alert("Non ci sono esagoni da archiviare");
}

function recuperaDati(){
    //cleanMap();
    $.ajax({
        type: "GET",
        url: "inviaCentri",
        data: {tipo: 'centri'},
        async: true,
        success: function(result){
            centers = [];
            for(i=0;i<result.length;i++){
                centers.push(result[i]);
            }
            hexagonsOnMap(centers);
        }
    });
}
function generaEsterni(){
    if(centriAttivi.length>0){
        //archiviaCentri();
        var cutOff = 0.00286;
        var d = 0;
        centriEsterni = [];
        for(i=0;i<centriAttivi.length;i++){
            contatore = 0;
            for(j=0;j<centriAttivi.length;j++){
                d = getDistance([centriAttivi[i].lat,centriAttivi[i].lng],[centriAttivi[j].lat,centriAttivi[j].lng]);
                if(Math.abs(d-200)<50) contatore ++;
            }
            if(contatore < 6){
                centriEsterni.push(centriAttivi[i]);
            }
            else{
                centriAttivi[i].active = 0;
                centriDisattivi.push(centriAttivi[i]);
            }
        }
        centers = centriEsterni.concat(centriDisattivi);
        hexagonsOnMap2(centers);
        console.log(centers);
    } else {alert("Non ci sono esagoni per individuare quelli esterni") };
}
function archiviaEsterni(){
    counter = 0;
    for(i=0;i<centers.length;i++){
        if(hexOnMap[i].options._leaflet_id == 1){
            centers[i].active = 1;
            counter += 1;
        }
        else{
            centers[i].active = 0;
        }
    }
    if (counter != 0){
        registraCentri(centers, 'esterni');
     } else alert("Non ci sono esagoni esterni");
}
function recuperaEsterni(){
    cleanMap();
    $.ajax({
        type: "GET",
        url: "inviaCentri",
        data: {tipo: 'esterni'},
        async: true,
        success: function(result){
            centriEsterni = [];
            for(i=0;i<result.length;i++){
                centriEsterni.push(result[i]);
            }
            hexagonsOnMap2(centriEsterni);
        }
    });
}
function creaTavolaColori(tavolaColori){
    var txt = '';
    var range = tavolaColori[1].time-tavolaColori[0].time;
    txt += '<div id="legendColor"><span id="colorSpan" style="background:'+ tavolaColori[0].color +'"></span><span id="livelliTempo"> < '+tavolaColori[0].time+'</span></div> ';
    for(i=1;i<(tavolaColori.length - 1);i++){
        txt += '<div id="legendColor"><span id="colorSpan" style="background:'+ tavolaColori[i].color +'"></span><span id="livelliTempo">'+tavolaColori[i-1].time+" - "+tavolaColori[i].time+'</span></div> ';
    }
    txt += '<div id="legendColor"><span id="colorSpan" style="background:'+ tavolaColori[i].color +'"></span><span id="livelliTempo"> > '+(tavolaColori[i-1].time + range)+'</span></div>';
    document.getElementById("tavolaColori").innerHTML = txt;
    for(i=0;i<tavolaColori.length;i++){
        tavolaColori[i].time *= 60;
    }
    ritiraPolyline();
}
function ritiraColori(){
    $.ajax({
        type:"GET",
        url: "ritiraColori",
        data: {tipo: 'color'},
        async: true,
        success: function(result){
            tavolaColori = [];
            for(i=0;i<result.length;i++){
                tavolaColori.push(result[i]);
            }
            creaTavolaColori(tavolaColori);
        }
    })
}

function ritiraVelocita(){
    $.ajax({
        type:"GET",
        url: "inviaVelocita",
        async: true,
        success: function(result){
            velocita = [];
            for(i=0; i < result.length;i++){
                velocita.push(result[i].time);
            }
        }
    })
}

function ritiraPolyline(){
    $.ajax({
        type: "GET",
        url: "inviaPolyline",
        async: true,
        success: function(result){
            pol = [];
            centers = [];
            for(i=0;i<result.length;i++){
                pol.push([result[i]['origin'], result[i]['distance'], result[i]['time'], JSON.parse(result[i]['path'])]);
                centers.push({'lat': result[i]['olat'], 'lng': result[i]['olng']});
            }
            hexagonsOnMap(centers);
        }
    })
}

function initialize(){
    mymap = L.map('mapid', {doubleClickZoom:false, zoomControl:false}).setView(center, 13);
    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 20,
        id: 'mapbox/streets-v11',
        accessToken: 'pk.eyJ1IjoiZGFuaWVsZWFuZ2VsaW5pIiwiYSI6ImNrNmkwOWg1bTAxdDczbW16M2F2OXlsbWEifQ.V8Sn6Ifwy9Z5jIBR4YI7yA'
    }).addTo(mymap);
    L.control.scale().addTo(mymap);
    L.control.zoom({position:'bottomright'}).addTo(mymap);
    ritiraColori();
    $("#pannello").click(function(){
        $("#pannel").hide();
        $("#pannello").hide();
        $("#non_pannello").show();
    });
    $("#non_pannello").click(function(){
        $("#pannel").show();
        $("#pannello").show();
        $("#non_pannello").hide();
    });
    $("#pannello2").click(function(){
        $("#pannel2").hide();
        $("#non_pannello2").show();
    });
    $("#non_pannello2").click(function(){
        $("#pannel2").show();
        $("#non_pannello2").hide();
    });
}

$(function(){
    initialize();
})

