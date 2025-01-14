import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import GeoJSON from 'ol/format/GeoJSON';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { Style, Circle as CircleStyle, Fill, Stroke } from 'ol/style';
import { fromLonLat } from 'ol/proj';


export function initializeOpenLayers(targetId) {
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
        }),
        renderMode: 'image'
      });

      map.addLayer(vectorLayer);
    });

  window.openLayersMap = map;

  return map;
}