import { GeoJsonLayer } from '@deck.gl/layers';
import { MapView } from '@deck.gl/core';
import { MapboxOverlay } from '@deck.gl/mapbox';
import maplibregl from 'maplibre-gl';
import { getRandomFeatures } from './utils.js';

export function initializeDeckGL(targetId) {
  if (window.deckGLMap) {
    window.deckGLMap.finalize();
    window.deckGLMap = null;
  }
  if (window.deckGLBaseMap) {
    window.deckGLBaseMap.remove();
    window.deckGLBaseMap = null;
  }

  return new Promise((resolve, reject) => {
    console.log('[DeckGL] Создаём карту MapLibre...');
    const map = new maplibregl.Map({
      container: targetId,
      style: {
        version: 8,
        sources: {
          'osm-standard': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
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
    window.deckGLBaseMap = map;

    const urlParams = new URLSearchParams(window.location.search);
    const pointsCount = parseInt(urlParams.get('points')) || 10000;
    console.log('[DeckGL] Используем точек:', pointsCount);

    fetch('world_coordinates.geojson')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Ошибка загрузки GeoJSON: ${response.status}`);
        }
        return response.json();
      })
      .then(json => {
        console.log('[DeckGL] Данные GeoJSON успешно загружены');
        const selectedData = getRandomFeatures(json, pointsCount);

        const deckOverlay = new MapboxOverlay({
          layers: [
            new GeoJsonLayer({
              id: 'geojson-layer',
              data: selectedData,
              pointRadiusMinPixels: 6,
              getFillColor: [0, 0, 255],
              getLineColor: [255, 255, 255],
              lineWidthMinPixels: 2
            })
          ],
          views: new MapView({ repeat: true }),
          controller: true,
          getViewState: () => ({
            longitude: map.getCenter().lng,
            latitude: map.getCenter().lat,
            zoom: map.getZoom(),
            pitch: map.getPitch(),
            bearing: map.getBearing()
          })
        });


        // Синхронизация карты и слоя Deck.gl
        map.on('move', () => {
          deckOverlay.setProps({
            viewState: {
              longitude: map.getCenter().lng,
              latitude: map.getCenter().lat,
              zoom: map.getZoom(),
              pitch: map.getPitch(),
              bearing: map.getBearing()
            }
          });
        });
        
        map.on('zoom', () => {
          deckOverlay.setProps({
            viewState: {
              longitude: map.getCenter().lng,
              latitude: map.getCenter().lat,
              zoom: map.getZoom(),
              pitch: map.getPitch(),
              bearing: map.getBearing()
            }
          });
        });

        const addDeckOverlay = () => {
          console.log('[DeckGL] Карта готова. Добавляем overlay Deck.gl...');
          map.addControl(deckOverlay);
          const deckInstance = deckOverlay.deck || deckOverlay._deck;
          console.log('[DeckGL] Экземпляр Deck:', deckInstance);
          window.deckGLMap = deckInstance;
          resolve(deckInstance);
          deckInstance.redraw(true);
        };

        if (map.loaded()) {
          addDeckOverlay();
        } else {
          map.on('load', addDeckOverlay);
        }

        
      })
      .catch(error => {
        console.error('[DeckGL] Ошибка при загрузке или инициализации:', error);
        reject(error);
      });
  });
}