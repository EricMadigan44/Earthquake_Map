function markerSize(mag) {
  return Math.sqrt(mag) * 5;
}

function getColor(d) {
    return d > 5 ? '#d82a24' :
           d > 4  ? '#f45642' :
           d > 3  ? '#f48341' :
           d > 2  ? '#f4a341' :
           d > 1   ? '#f4e841' :
                      '#c8e83c';
}

function timeConverter(UNIX_timestamp){
  var a = new Date(UNIX_timestamp);
  return a
}

earthquakesURL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson"
quakeheatURL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson"
tectonicURL = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json"
volcanoesURL = "https://data.humdata.org/dataset/a60ac839-920d-435a-bf7d-25855602699d/resource/7234d067-2d74-449a-9c61-22ae6d98d928/download/volcano.json"

var streetmap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/outdoors-v10/tiles/256/{z}/{x}/{y}?" +
    "access_token=pk.eyJ1IjoicmllaGxlYSIsImEiOiJjamlhdWlzcnkxMndiM3FsbWl1aXE0MXJtIn0.g7oyFuzbGAh1O0SXpGI8nw");

var darkmap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/dark-v9/tiles/256/{z}/{x}/{y}?" +
    "access_token=pk.eyJ1IjoicmllaGxlYSIsImEiOiJjamlhdWlzcnkxMndiM3FsbWl1aXE0MXJtIn0.g7oyFuzbGAh1O0SXpGI8nw");

var lightmap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}?" +
    "access_token=pk.eyJ1IjoicmllaGxlYSIsImEiOiJjamlhdWlzcnkxMndiM3FsbWl1aXE0MXJtIn0.g7oyFuzbGAh1O0SXpGI8nw");

var satellitemap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}?" +
    "access_token=pk.eyJ1IjoicmllaGxlYSIsImEiOiJjamlhdWlzcnkxMndiM3FsbWl1aXE0MXJtIn0.g7oyFuzbGAh1O0SXpGI8nw");

var baseMaps = {
  "Satellite Map": satellitemap,
  "Street Map": streetmap,
  "Dark Map": darkmap,
  "Light Map": lightmap
};

d3.json(earthquakesURL, function(earthquakesData) {
	var earthquakes = L.geoJSON(earthquakesData, {
		pointToLayer: function(feature, latlng) {
			return L.circleMarker(latlng, {
				radius: markerSize(feature.properties.mag),
				fillColor: getColor(feature.properties.mag),
				color: "black",
				hue: markerSize(feature.properties.mag),
				weight: 0.25,
				opacity: 1,
				fillOpacity: 0.8
			})
		},
       onEachFeature: function (feature, layer) {
    var marker = layer.bindPopup('<p><b>Location:</b> '+feature.properties.place+'</br><b>Magnitude:</b> '+feature.properties.mag+'</br><b>Date/Time:</b> '+timeConverter(feature.properties.time).toGMTString());
    marker.on('click', function (event) {
  this.openPopup();
});
  }
	})

d3.json(tectonicURL, function(tectonicData) {
  var tectonics = L.geoJSON(tectonicData, {
  	    style: function(feature) {
      return {
       color: "darkorange"
      };
    }
})

 d3.json(volcanoesURL, function(volcData) {
  volcs = []
  volcanoes = L.markerClusterGroup();
  var vdata = L.geoJSON(volcData, {
  	onEachFeature: function (feature, layer) {
  		volcs.push(feature)
  	}
  })
  for (var i = 0; i < volcs.length; i++) {
  	if (volcs[i].properties.H_active == 1) {
  volcanoes.addLayer(L.marker([volcs[i].properties.Latitude, volcs[i].properties.Longitude])
    .bindPopup("<b>Volcano Name:</b> " +volcs[i].properties.V_Name+"</br><b>Country:</b> "+volcs[i].properties.Country+"</br><b>Population Exposure Index:</b> "+volcs[i].properties.PEI+"</br><b>Volcanic Explosivity Index:</b> "+volcs[i].properties.VEI_Holoce+"</br><b>Hazard Level:</b> "+volcs[i].properties.hazard+"</br><b>Risk Level:</b> "+volcs[i].properties.risk))
}
  }

d3.json(quakeheatURL, function(quakeData) {
quakes = []
  var quake = L.geoJSON(quakeData, {
    onEachFeature: function (feature) {
    	quakes.push([feature.geometry.coordinates[1], feature.geometry.coordinates[0]])
}
})

  var quake_heat = L.heatLayer(quakes, {
  	minOpacity: 0.1,
    blur: 20,
    maxZoom: 7,
    radius: 15
  })


  var myMap = L.map("map", {
	center: [
      38.9, -77
    ],
    zoom: 3,
    layers: [lightmap, earthquakes, quake_heat, tectonics],
    timeDimension: true,
    timeDimensionControl: true,
  });

  var overlayMaps = {
  	"This Week's Earthquakes": earthquakes,
    "Tectonic Plates": tectonics,
    "Volcanoes": volcanoes,
    "Common Earthquake Locations": quake_heat
  }

	L.control.layers(baseMaps, overlayMaps, {collapsed:false}).addTo(myMap);

var legend = L.control({position: 'bottomright'});

legend.onAdd = function (map) {

    var div = L.DomUtil.create('div', 'info legend'),
        grades = [0, 1, 2, 3, 4, 5],
        labels = [];
        div.innerHTML = "<h3 style='text-align: center; margin-left: 8px;'>Magnitude</br>of This Week's</br>Earthquakes</h3><ul>"

    // loop through our density intervals and generate a label with a colored square for each interval
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<li style="list-style: none"><i style="background:' + getColor(grades[i] + 1) + '"</li></i><li style="list-style: none">' +
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '</li></br>' : '+');
    }

    return div;
};

legend.addTo(myMap);

})
})
})
})