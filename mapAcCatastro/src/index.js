// Usar token propio de Mapbox
mapboxgl.accessToken = 'pk.eyJ1Ijoiam9yZ2VwYXRpbm8iLCJhIjoiY2tnc2R0c20zMWVvdTJ5bXRpZ3Z4bDN1dCJ9.2LgsqgR7lXR6YFH2IaNc-w';

const map = new mapboxgl.Map({
    style: 'mapbox://styles/mapbox/dark-v11',
    center: [-76.63290500, 7.88156614],
    zoom: 14,
    pitch: 0,
    bearing: 0,
    container: 'map',
    antialias: true
});

let popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    className: 'custom-popup'
});

// Función para agregar capas
function addLayer(geojsonFile, sourceId, layerId, color, popupFields) {
    fetch(`../src/data/${geojsonFile}`)
        .then((response) => response.json())
        .then((data) => {
            map.addSource(sourceId, {
                type: 'geojson',
                data: data
            });

            map.addLayer({
                id: layerId,
                source: sourceId,
                type: 'fill',
                minzoom: 12,
                paint: {
                    'fill-color': color,
                    'fill-opacity': 0.75
                }
            });

            // Evento mousemove para mostrar popups
            map.on('mousemove', layerId, (e) => {
                const feature = e.features[0];
                const popupContent = popupFields
                    .map((field) => {
                        let value = feature.properties[field.key];
                        // Redondear el valor de 'area' sin decimales
                        if (field.key === 'area') {
                            value = Math.round(value);
                        }
                        return `<strong>${field.label}:</strong> ${value}`;
                    })
                    .join('<br>');

                popup
                    .setLngLat(e.lngLat)
                    .setHTML(`${popupContent}<br><a style="font-size:9px;">&#9400 EffectiveActions</a>`)
                    .addTo(map);
            });

            // Cambiar cursor al pasar sobre el layer
            map.on('mouseenter', layerId, () => {
                map.getCanvas().style.cursor = 'pointer';
            });

            // Cerrar popup y restaurar cursor al salir
            map.on('mouseleave', layerId, () => {
                map.getCanvas().style.cursor = '';
                popup.remove();
            });
        });
}

// Cargar capas en el orden definido
map.on('style.load', () => {
    const layers = map.getStyle().layers;
    const labelLayerId = layers.find((layer) => layer.type === 'symbol' && layer.layout['text-field']).id;

    // Demoliciones parciales
    addLayer('dem_parcial.geojson', 'dem_p', 'dem_parcial', '#F5B041', [
        { label: 'Código', key: 'CODIGO_CON' },
        { label: 'Área parcial (&#13217;)', key: 'area' }
    ]);

    // Demoliciones totales
    addLayer('dem_total.geojson', 'dem_t', 'dem_total', '#E74C3C', [
        { label: 'Código', key: 'CODIGO_CON' },
        { label: 'Área demolida (&#13217;)', key: 'area' }
    ]);

    // Construcciones aumento
    addLayer('cons_aumento.geojson', 'cons_a', 'c_aumento', '#F7DC6F', [
        { label: 'Código', key: 'CODIGO_CON' },
        { label: 'Incremento de área (&#13217;)', key: 'area' }
    ]);

    // Construcciones nuevas
    addLayer('cons_nuevas.geojson', 'cons_n', 'c_nuevas', '#A569BD', [
        { label: 'Código', key: 'PK_PREDIOS' },
        { label: 'Área (&#13217;)', key: 'area' }
    ]);

    // Construcciones viejas
    addLayer('cons_viejas.geojson', 'cons_v', 'c_viejas', '#AAB7B8', [
        { label: 'Código', key: 'CODIGO_CON' },
        { label: 'Número de pisos', key: 'NUMERO_PIS' },
        { label: 'Área (&#13217;)', key: 'area' }
    ]);

    // Mover el layer "Construcciones viejas" al fondo
    map.on('sourcedata', () => {
        if (map.getLayer('c_viejas')) {
            map.moveLayer('c_viejas', 'dem_parcial'); // Mover "c_viejas" debajo del primer layer agregado
        }
    });
});

