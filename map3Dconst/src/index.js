
// The value for 'accessToken' begins with 'pk...'
mapboxgl.accessToken = 
    'pk.eyJ1IjoibWttZCIsImEiOiJjajBqYjJpY2owMDE0Mndsbml0d2V1ZXczIn0.el8wQmA-TSJp2ggX8fJ1rA';
const map = new mapboxgl.Map({
    container: 'map', //container id
    // Replace YOUR_STYLE_URL with your style URL.
    style: 'mapbox://styles/mkmd/ck9eg99c72gwg1imtdbugc9yn', //Africapolis-mastermap
    center: [7, 20], //center on data region
    zoom: 3, //adjust to data extent
});

// Create a popup, specify its options and properties, and add it to the map.
const popup = new mapboxgl.Popup({
    className: "MBpopup",
    closeButton: false,
    closeOnClick: false,
    maxWidth: 200,
});

// Map
map.on('load', () => {
    //Add country labels from Mapbox tileset
    map.addSource('country-labels', {
        url: 'mapbox://mkmd.9rvgto2u',
        type: 'vector'
    });
    map.addLayer({
        id: 'map-labels',
        type: 'symbol',
        source: 'country-labels',
        'source-layer': 'Africa_country_official_point-5smbpe',
        filter: [ //Filter only African countries
            "all",
            [
            "match",
            ["get", "ISO3_CODE"],
            [
                "AGO",
                "BDI",
                "BEN",
                "BFA",
                "BWA",
                "CAF",
                "CIV",
                "CMR",
                "COD",
                "COG",
                "CPV",
                "DJI",
                "DZA",
                "EGY",
                "ERI",
                "ETH",
                "GAB",
                "GHA",
                "GIN",
                "GMB",
                "GNB",
                "GNQ",
                "KEN",
                "LBR",
                "LBY",
                "LSO",
                "MAR",
                "MLI",
                "MOZ",
                "MRT",
                "MWI",
                "NAM",
                "NER",
                "NGA",
                "RWA",
                "SDN",
                "SEN",
                "SLE",
                "SOM",
                "SSD",
                "STP",
                "SWZ",
                "TCD",
                "TGO",
                "TUN",
                "TZA",
                "UGA",
                "ZAF",
                "ZMB",
                "ZWE",
                "MDG",
                "SYC",
                "COM",
            ],
            true,
            false,
            ],
        ],
        layout: {
            "text-field": ["get", "NAME_EN"], //Change to NAME_FR for French
            "text-font": ["Arial Unicode MS Bold", "Arial Unicode MS Regular"],
        },
        paint: {
            "text-color": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            "hsl(0,0%,0%)",
            "#6d6d6f",
            ],
            "text-halo-color": "hsl(0, 0%, 100%)",
            "text-halo-width": 1.25,
            "text-opacity": ["step", ["zoom"], 0, 3, 1, 22, 1],
        },
    });
    //Add layer from external source - new conflict cells
    map.addSource('newcellsconflict', {
        type: 'geojson',
        data: 'https://jpatinoq.github.io/testData/newcellsconflict.geojson'
        //'../src/data/map_suicide_attacks_gender_2011_22.geojson' //CHANGE TO UPDATE
        });
    // Add layer of 2022 cells
    map.addLayer({
        id: 'newcellsconflict-layer-2022',
        type: 'fill',
        source: 'newcellsconflict',
        paint: {
            'fill-color': '#440154',
            'fill-outline-color': '#D3D3D3',
            'fill-opacity': 0.7
        },
        filter: ['==', 'Year', 2022] // Filter data for 2022
    });
    // Add layer of 2023 cells
    map.addLayer({
        id: 'newcellsconflict-layer-2023',
        type: 'fill',
        source: 'newcellsconflict',
        paint: {
            'fill-color': '#FDE725',
            'fill-outline-color': '#D3D3D3',
            'fill-opacity': 0.7
        },
        filter: ['==', 'Year', 2023] // Filter data for 2022
    });
});

//Add an event listener that runs when a user hovers on the map element.
// for 2022 layer
map.on('mouseenter', ['newcellsconflict-layer-2022'], (e) => {
    // change the cursor style as a UI indicator
    map.getCanvas().style.cursor = 'pointer';
    // Copy coordinates array
    const coordinates = e.features[0].geometry.coordinates.slice();
    const description = 
        `<p style="color:white; font-size: 90%">
            Year: ${e.features[0].properties.Year}<br> 
            Type of conlfict: ${e.features[0].properties.SCDi_en}<br>
        </p>`;

    // Ensure that if the map is zoomed out such that multiple
    // copies of the feature are visible, the popup appears
    // over the copy being pointed to.
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    popup.setLngLat(e.lngLat).setHTML(description).addTo(map);
});

map.on('mouseleave', ['newcellsconflict-layer-2022'], () => {
    map.getCanvas().style.cursor = '';
    popup.remove();
});

// for 2023 layer
map.on('mouseenter', ['newcellsconflict-layer-2023'], (e) => {
    // change the cursor style as a UI indicator
    map.getCanvas().style.cursor = 'pointer';
    // Copy coordinates array
    const coordinates = e.features[0].geometry.coordinates.slice();
    const description = 
        `<p style="color:white; font-size: 90%">
            Year: ${e.features[0].properties.Year}<br> 
            Type of conlfict: ${e.features[0].properties.SCDi_en}<br>
        </p>`;

    // Ensure that if the map is zoomed out such that multiple
    // copies of the feature are visible, the popup appears
    // over the copy being pointed to.
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    popup.setLngLat(e.lngLat).setHTML(description).addTo(map);
});

map.on('mouseleave', ['newcellsconflict-layer-2023'], () => {
    map.getCanvas().style.cursor = '';
    popup.remove();
});
    
// Add event listeners to the "years" buttons to show/hide by year
// Add event listeners to the buttons
document.getElementById('year-2022').addEventListener('click', function() {
    toggleLayer('newcellsconflict-layer-2022');
  });
  
  document.getElementById('year-2023').addEventListener('click', function() {
    toggleLayer('newcellsconflict-layer-2023');
  });
  
  // Function to toggle layer visibility
  function toggleLayer(layerId) {
    var visibility = map.getLayoutProperty(layerId, 'visibility');
  
    if (visibility === 'visible') {
      map.setLayoutProperty(layerId, 'visibility', 'none');
    } else {
      map.setLayoutProperty(layerId, 'visibility', 'visible');
    }
  }

// Add fullscreen control
map.addControl(new mapboxgl.FullscreenControl(), 'top-left');
    
// Add zoom control ( + / -, reset orientation to North)
map.addControl(new mapboxgl.NavigationControl({showCompass: false}), 'top-left');
    
// Add a scale bar in metric units
const scalebar = new mapboxgl.ScaleControl({
    maxWidth: 100,
    unit: 'metric'
});
map.addControl(scalebar);


