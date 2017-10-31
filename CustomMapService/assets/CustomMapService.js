/*
 * Custom Map Service Plugin
 *
 * Author       Sam Ansmink
 * Created for  NSCR (https://www.nscr.nl/)
 * License      GNU GPL
 *
 * This file contains the replacement JS code to initialize the map through a the configured server.
 */

$(document).ready(function()
{
    $(".location").each(function(index,element){
        var question = $(element).attr('name');
        var coordinates = $(element).val();
        var latLng = coordinates.split(" ");
        var question_id = question.substr(0,question.length-2);

        if ($("#mapservice_custommapservice_"+question_id).val() > 0){
            //  Maps
            if (osmaps[''+question] == undefined) {
                osmaps[''+question] = OpenMapTilesInitialize(question,latLng);
            }
        }
    });

});

/*
 * This function is copied from the LimeSurvey(2.72.3+171020) map.js function OSGeoInitialize
 * The four layers were reduced to 1 and the url was changed to a custom, configurable url.
 */
function OpenMapTilesInitialize(question,latLng){
    var currentProtocol = location.protocol
    var name = question.substr(0,question.length - 2);
    // tiles layers def
    // If not latLng is set the Map will center to Amsterdam, vondelpark because amsterdam is best
    var MapOption=LSmaps[name];

    if(isNaN(MapOption.latitude) || MapOption.latitude==""){
        MapOption.latitude=52.358121;
    }
    if(isNaN(MapOption.longitude) || MapOption.longitude==""){
        MapOption.longitude=4.863846;
    }

    if (window.CustomMapServiceUrl == null) {
        return;
    }

    var mapOSM = L.tileLayer(window.CustomMapServiceUrl, {
        maxZoom: 19,
        subdomains: ["a", "b", "c"],
        attribution: 'Map data © <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> contributors, CC-BY-SA.'
    });

    var baseLayers = {
        "Street Map": mapOSM
    };
    var overlays = {
    };
    var map = L.map("map_"+name, {
        zoom:MapOption.zoomLevel,
        minZoom:1,
        center: [MapOption.latitude, MapOption.longitude] ,
        maxBounds: ([[-90, -180],[90, 180]]),
        layers: [mapOSM]
    });
    //function zoomExtent(){ // todo: restrict to rect ?
    //	map.setView([15, 15],1);
    //}

    var pt1 = latLng[0].split("@");
    var pt2 = latLng[1].split("@");

    if ((pt1.length == 2) && (pt2.length == 2)) { // is Rect
        var isRect = true;
        lat = "";
        lng = "";
        minLat = pt1[0];
        minLng = pt1[1];
        maxLat = pt2[0];
        maxLng = pt2[1];
        map.fitBounds([[minLat, minLng],[maxLat, maxLng]]);
        map.setMaxBounds([[minLat, minLng],[maxLat, maxLng]]);
        UI_update("","");
    } else { // is default marker position
        var isRect = false;
        lat = latLng[0];
        lng = latLng[1];
    }

    if (isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
        lat=-9999; lng=-9999;
    }

    var marker = new L.marker([lat,lng], {title:'Current Location',id:1,draggable:'true'});
    map.addLayer(marker);

    var layerControl = L.control.layers(baseLayers, overlays, {
        collapsed: true
    }).addTo(map);

    map.on('click',
        function(e) {
            var coords = L.latLng(e.latlng.lat,e.latlng.lng);
            marker.setLatLng(coords);
            UI_update(e.latlng.lat,e.latlng.lng)
        }
    )

    // Zoom to 11 when switching to Aerial or Hybrid views - bug 10589
    var layer2Name, layer3Name, layerIndex = 0;
    for (var key in baseLayers) {
        if (!baseLayers.hasOwnProperty(key)) {
            continue;
        }
        if(layerIndex == 1) {
            layer2Name = key;
        }
        else if(layerIndex == 2) {
            layer3Name = key;
        }
        layerIndex++;
    }
    map.on('baselayerchange', function(e) {
        if(e.name == layer2Name || e.name == layer3Name) {
            map.setZoom(11);
        }
    });

    marker.on('dragend', function(e){
        var marker = e.target;
        var position = marker.getLatLng();
        UI_update(position.lat,position.lng)
    });

    function UI_update(lat,lng){
        if (isvalidCoord(lat) && isvalidCoord(lng)) {
            //$("#answer"+question).val(Math.round(lat*100000)/100000 + " " + Math.round(lng*100000)/100000);
            $("#answer"+name).val(Math.round(lat*100000)/100000 + ";" + Math.round(lng*100000)/100000).trigger("keyup");
            $("#answer_lat"+question).val(Math.round(lat*100000)/100000);
            $("#answer_lng"+question).val(Math.round(lng*100000)/100000);
        } else {
            //$("#answer"+question).val("");
            $("#answer"+name).val("").trigger("keyup");
            $("#answer_lat"+question).val("");
            $("#answer_lng"+question).val("");
        }

    }

    $('coords[name^='+name+']').each(function() {
        // Save current value of element
        $(this).data('oldVal', $(this));
        // Look for changes
        $(this).bind("propertychange keyup input cut paste", function(event){
            // If value has changed...
            if ($(this).data('oldVal') != $(this).val()) {
                // Updated stored value
                $(this).data('oldVal', $(this).val());
                var newLat = $("#answer_lat"+question).val();
                var newLng = $("#answer_lng"+question).val();
                if (isNumber(newLat) && isNumber(newLng)) {
                    $("#answer"+name).val(newLat + ";" + newLng);
                    marker.setLatLng(L.latLng(newLat,newLng));
                } else {
                    $("#answer"+name).val("-- --");
                    marker.setLatLng(L.latLng(9999,9999));
                }
            }
        });
    });

    function isNumber(n){
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    var mapQuestion = $('#question'+name.split('X')[2]);

    function resetMapTiles(mapQuestion) {

        //window.setTimeout(function(){

        if($(mapQuestion).css('display') == 'none' && $.support.leadingWhitespace) { // IE7-8 excluded (they work as-is)
            $(mapQuestion).css({
                'position': 'relative',
                'left': '-9999em'
            }).show();
            map.invalidateSize();
            $(mapQuestion).css({
                'position': 'relative',
                'left': 'auto'
            }).hide();
        }

        //},50);
    }

    resetMapTiles(mapQuestion);

    jQuery(window).resize(function() {
        window.setTimeout(function(){
            resetMapTiles(mapQuestion);
        },5);
    });

    return map;
}