// Usar token propio de Mapbox
mapboxgl.accessToken = 'pk.eyJ1Ijoiam9yZ2VwYXRpbm8iLCJhIjoiY2tnc2R0c20zMWVvdTJ5bXRpZ3Z4bDN1dCJ9.2LgsqgR7lXR6YFH2IaNc-w';

function buildPopupHTML(feature) {
    const props = feature.properties;
    const center = turf.centroid(feature).geometry.coordinates;

    // Obtener datos R1 y R2 usando NPN
    const npn = props.CODIGO_CON || props.NPN;
    const r1 = r1Data[npn] || {};
    const r2 = r2Data[npn] || {};

    const area = Math.round(props.area || 0);
    const pisos = props.NUMERO_PIS || 'N/A';
    const codigo = props.CODIGO_CON || 'N/A';

    let popupHTML = `
        <strong>Código:</strong> <br> ${codigo}<br>
        <strong>Número de pisos:</strong> ${pisos}<br>
        <strong>Área (m²):</strong> ${area}<br>
    `;

    // Combinar R1 y R2, quitando 'NPN'
    const combinedData = { ...r1, ...r2 };
    delete combinedData.NPN;

    if (Object.keys(combinedData).length > 0) {
        let rows = Object.entries(combinedData).map(([key, value]) => `
            <tr>
                <td style="padding:2px 6px; border: 1px solid #ccc;"><strong>${key}</strong></td>
                <td style="padding:2px 6px; border: 1px solid #ccc;">${value}</td>
            </tr>
        `).join('');

        popupHTML += `
            <br><table style="border-collapse: collapse; margin-top: 4px; font-size: 11px;">
                ${rows}
            </table>
        `;
    } else {
        popupHTML += `
            <br><div style="font-size: 11px; color: #ccc; margin-top: 4px;">
                No hay información adicional para esta edificación
            </div>
        `;
    }

    return { html: `${popupHTML}<br><a style="font-size:9px;">&#9400 EffectiveActions</a>`, center };
}

const map = new mapboxgl.Map({
    style: 'mapbox://styles/mapbox/dark-v11',
    center: [-76.62000, 7.88400],
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

let r1Data = {};
let r2Data = {};

Promise.all([
  fetch('../src/data/R1.json').then(res => res.json()),
  fetch('../src/data/R2.json').then(res => res.json())
]).then(([r1, r2]) => {
  // Indexar por NPN para acceso rápido
  r1.forEach(d => {
    r1Data[d.NPN] = d;
  });
  r2.forEach(d => {
    r2Data[d.NPN] = d;
  });
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
                    'fill-opacity': 0.75,
                    "fill-outline-color": '#ffffff'
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
        { label: 'Área parcial (m²)', key: 'area' }
    ]);

    // Demoliciones totales
    addLayer('dem_total.geojson', 'dem_t', 'dem_total', '#E74C3C', [
        { label: 'Código', key: 'CODIGO_CON' },
        { label: 'Área demolida (m²)', key: 'area' }
    ]);

    // Construcciones aumento
    addLayer('cons_aumento.geojson', 'cons_a', 'c_aumento', '#F7DC6F', [
        { label: 'Código', key: 'CODIGO_CON' },
        { label: 'Incremento de área (m²)', key: 'area' }
    ]);

    // Construcciones nuevas
    addLayer('cons_nuevas.geojson', 'cons_n', 'c_nuevas', '#A569BD', [
        { label: 'Código', key: 'PK_PREDIOS' },
        { label: 'Área (m²)', key: 'area' }
    ]);

    // Construcciones viejas
    addLayer('cons_viejas.geojson', 'cons_v', 'c_viejas', '#AAB7B8', [
        { label: 'Código', key: 'CODIGO_CON' },
        { label: 'Número de pisos', key: 'NUMERO_PIS' },
        { label: 'Área (m²)', key: 'area' }
    ]);

    // Mover el layer "Construcciones viejas" al fondo
    map.on('sourcedata', () => {
        if (map.getLayer('c_viejas')) {
            map.moveLayer('c_viejas', 'dem_parcial'); // Mover "c_viejas" debajo del primer layer agregado
        }
    });

    // Mostrar popup al hacer clic en un polígono de c_viejas
    map.on('click', 'c_viejas', (e) => {
        const feature = e.features[0];
        const { html, center } = buildPopupHTML(feature);
        popup.setLngLat(center)
            .setHTML(html)
            .addTo(map);
    });
});

// Configurar el Geocoder para buscar en el layer 'c_viejas'
const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,
    marker: false, // Evitar que agregue un marcador automáticamente
    localGeocoder: function (query) {
        const matchingFeatures = [];

        // Consultar las features del layer 'c_viejas'
        const features = map.querySourceFeatures('cons_v'); // 'cons_v' es el sourceId del layer 'c_viejas'

        features.forEach((feature) => {
            const props = feature.properties;

            // Buscar coincidencias en el campo CODIGO_CON (puedes cambiar el campo de búsqueda)
            if (props.CODIGO_CON && props.CODIGO_CON.toLowerCase().includes(query.toLowerCase())) {
                matchingFeatures.push({
                    type: 'Feature',
                    geometry: feature.geometry,
                    properties: props,
                    place_name: `Código: ${props.CODIGO_CON}`, // Texto que se mostrará en el resultado
                    text: props.CODIGO_CON,
                    center: turf.centroid(feature).geometry.coordinates, // Centrar el mapa en el polígono
                    place_type: ['place']
                });
            }
        });

        return matchingFeatures;
    },
    placeholder: 'Buscar código catastral',
    localGeocoderOnly: true // Limitar la búsqueda a datos locales

});

// Agregar el Geocoder al mapa
map.addControl(geocoder, 'top-left');
// Add zoom and rotation controls to the map.
map.addControl(new mapboxgl.NavigationControl());

// Hacer zoom al polígono seleccionado y mostrar popup con datos
geocoder.on('result', (e) => {
    const feature = e.result;
    const { html, center } = buildPopupHTML(feature);
    popup
        .setLngLat(center)
        .setHTML(html)
        .addTo(map);
});
