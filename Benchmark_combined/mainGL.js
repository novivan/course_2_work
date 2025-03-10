import maplibregl from 'maplibre-gl';
import {getRandomFeatures} from './utils.js';

export function initializeMapLibreGL(targetId) {
    if (window.mapLibreMap) {
        window.mapLibreMap.remove();
        window.mapLibreMap = null;
    }

    return new Promise((resolve, reject) => {
        const map = new maplibregl.Map({
          container: targetId,
          style: {
            version: 8,
            sources: {
              'osm-standard': {
                type: 'raster',
                tiles: [
                  'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
                ],
                tileSize: 256
              }
            },
            layers: [
              {
                id: 'osm-standard-layer',
                type: 'raster',
                source: 'osm-standard',
                minzoom: 0,
                maxzoom: 19
              }
            ]
          },
          center: [0, 0],
          zoom: 1
        });
        
        const urlParams = new URLSearchParams(window.location.search);
        const pointsCount = parseInt(urlParams.get('points')) || 10000;

        map.on('load', () => {
          fetch('world_coordinates.geojson')
            .then(response => response.json())
            .then(json => {
              const selectedData = getRandomFeatures(json, pointsCount);
              map.addSource('points', {
                type: 'geojson',
                data: selectedData
              });
      
              map.addLayer({
                id: 'points-layer',
                type: 'circle',
                source: 'points',
                paint: {
                  'circle-radius': 6,
                  'circle-color': 'blue',
                  'circle-stroke-width': 2,
                  'circle-stroke-color': '#FFFFFF'
                }
              });
              window.mapLibreMap = map;
              resolve(map);
            })
            .catch(error => {
              console.error('Ошибка загрузки GeoJSON для MapLibreGL:', error);
              reject(error);
            });
        });
    });
}