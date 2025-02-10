import { Deck } from '@deck.gl/core';
import { GeoJsonLayer } from '@deck.gl/layers';
import { MapView } from '@deck.gl/core';
import { MapboxOverlay as MapboxLayer } from '@deck.gl/mapbox';
import maplibregl from 'maplibre-gl';
import { getRandomFeatures } from './utils.js';





export function initializeDeckGL(targetId) {
    if (window.deckGLMap) {
        window.deckGLMap.finalize();
        window.deckGLMap = null;
    }

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

    fetch('world_coordinates.geojson')
        .then(response => response.json())
        .then(json => {
            const selectedData = getRandomFeatures(json, pointsCount);

            const deck = new Deck({
                initialViewState: {
                    longitude: 0,
                    latitude: 0,
                    zoom: 1
                },
                controller: true,
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
                views: new MapView({ repeat: true })
            });

            map.on('load', () => {
                map.addLayer(new MapboxLayer({ id: 'deckgl-layer', deck }));
                window.deckGLMap = deck;
            });
        })
        .catch(error => {
            console.error('Ошибка загрузки GeoJSON для DeckGL:', error);
        });

    return map;
}