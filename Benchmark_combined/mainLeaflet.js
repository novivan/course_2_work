import L from 'leaflet';
import { getRandomFeatures } from './utils.js';
import 'leaflet/dist/leaflet.css';

export function initializeLeaflet(targetId) {
    if (window.leafletMap) {
        window.leafletMap.remove();
        window.leafletMap = null;
    }

    const map = L.map(targetId, { worldCopyJump: true }).setView([0, 0], 2);
    window.leafletMap = map;

    // Создаем плиточный слой и ждём его загрузки
    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    });
    const tileLayerPromise = new Promise(resolve => {
        tileLayer.on('load', resolve);
    });
    tileLayer.addTo(map);

    const urlParams = new URLSearchParams(window.location.search);
    const pointsCount = parseInt(urlParams.get('points')) || 10000;

    // Загружаем и добавляем GeoJSON-слой
    const geojsonPromise = fetch('world_coordinates.geojson')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Ошибка загрузки GeoJSON: ${response.status}`);
            }
            return response.json();
        })
        .then(json => {
            console.log('[Leaflet] Данные GeoJSON успешно загружены');
            const selectedData = getRandomFeatures(json, pointsCount);
            // Предполагается, что опции для отрисовки настроены в функции pointToLayer
            const geojsonLayer = L.geoJSON(selectedData, {
                pointToLayer: function(feature, latlng) {
                    return L.circleMarker(latlng, {
                        radius: 6,
                        fillColor: 'blue',
                        color: 'white',
                        weight: 1,
                        fillOpacity: 1
                    });
                }
            });
            geojsonLayer.addTo(map);
        })
        .catch(error => {
            console.error(error);
        });


        return Promise.all([tileLayerPromise, geojsonPromise]).then(() => {
            map.setView([0, 0], 2);
            // Небольшая задержка для гарантии отрисовки
            return new Promise(resolve => setTimeout(() => resolve(map), 100));
        });
}