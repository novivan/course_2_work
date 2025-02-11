import L from 'leaflet';
import { getRandomFeatures } from './utils.js';
import 'leaflet/dist/leaflet.css';

export function initializeLeaflet(targetId) {
    if (window.leafletMap) {
        window.leafletMap.remove();
        window.leafletMap = null;
    }

    const map = L.map(targetId).setView([0, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    }).addTo(map);

    const urlParams = new URLSearchParams(window.location.search);
    const pointsCount = parseInt(urlParams.get('points')) || 10000;

    fetch('world_coordinates.geojson')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Ошибка загрузки GeoJSON: ${response.status}`);
            }
            return response.json();
        })
        .then(json => {
            console.log('[Leaflet] Данные GeoJSON успешно загружены');
            const selectedData = getRandomFeatures(json, pointsCount);
            L.geoJSON(selectedData, {
                pointToLayer: function(feature, latlng) {
                    return L.circleMarker(latlng, {
                        radius: 6,
                        fillColor: 'blue',
                        color: 'white',
                        weight: 1,
                        fillOpacity: 1
                    });
                }
            }).addTo(map);
        })
        .catch(error => {
            console.error(error);
        });

    window.leafletMap = map;
    return map;
}