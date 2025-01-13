import maplibregl from 'maplibre-gl'; // Добавить импорт maplibregl

export function initializeMapLibreGL(targetId) {
    // Если карта уже инициализирована, удаляем её
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
      
        map.on('load', () => {
          fetch('world_coordinates.geojson')
            .then(response => response.json())
            .then(json => {
              map.addSource('points', {
                type: 'geojson',
                data: json
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

// mainOL.js
export function initializeOpenLayers(targetId) {
  // Если карта уже инициализирована, удаляем её
  if (window.openLayersMap) {
      window.openLayersMap.setTarget(null);
      window.openLayersMap = null;
  }

  const map = new Map({
    target: targetId,
    layers: [
      new TileLayer({
        source: new OSM()
      })
    ],
    view: new View({
      center: fromLonLat([0, 0]),
      zoom: 2
    })
  });

  fetch('world_coordinates.geojson')
    .then(response => response.json())
    .then(json => {
      const points = new GeoJSON().readFeatures(json, {
        featureProjection: 'EPSG:3857'
      });

      const vectorSource = new VectorSource({
        features: points
      });

      const vectorLayer = new VectorLayer({
        source: vectorSource,
        style: new Style({
          image: new CircleStyle({
            radius: 6,
            fill: new Fill({ color: 'blue' }),
            stroke: new Stroke({ color: 'white', width: 1 })
          })
        })
      });

      map.addLayer(vectorLayer);
    });

  window.openLayersMap = map;

  return map;
}