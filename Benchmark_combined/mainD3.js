import * as d3 from 'd3';
import maplibregl from 'maplibre-gl';
import { getRandomFeatures } from './utils.js';
import _ from 'lodash';


export function initializeD3(targetId) {
    return new Promise((resolve, reject) => {
      const container = document.getElementById(targetId);
      if (!container) {
        reject('Контейнер для карты не найден!');
        return;
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
  
      map.on('load', () => {
        // Создаем отдельный div для SVG
        const overlayContainer = document.createElement('div');
        overlayContainer.style.position = 'absolute';
        overlayContainer.style.top = '0';
        overlayContainer.style.left = '0';
        overlayContainer.style.pointerEvents = 'none';
        container.appendChild(overlayContainer);
  
        // Создаем SVG в новом контейнере
        const svg = d3.select(overlayContainer)
                      .append('svg')
                      .style('position', 'absolute')
                      .style('top', 0)
                      .style('left', 0)
                      .attr('width', container.offsetWidth)
                      .attr('height', container.offsetHeight);
  
        // Создаем группу для точек
        const pointGroup = svg.append('g');
  
        function renderPoints(geojson) {
            // Создаем расширенный набор данных только один раз
            const expandedPointsData = geojson.features.flatMap(feat => {
              const lon = feat.geometry.coordinates[0];
              const lat = feat.geometry.coordinates[1];
              return [
                { coordinates: [lon, lat] },
                { coordinates: [lon + 360, lat] },
                { coordinates: [lon - 360, lat] }
              ];
            });
          
            // Используем один enter() для всех точек
            const points = pointGroup.selectAll('circle')
              .data(expandedPointsData);
          
            points.exit().remove();
          
            const enterPoints = points.enter()
              .append('circle')
              .attr('r', 6)
              .style('fill', 'blue')
              .style('stroke', '#FFFFFF')
              .style('stroke-width', '2px')
              .style('display', 'none');
          
            // Объединяем enter и update selections
            const allPoints = enterPoints.merge(points);
          
            function updatePositions() {
              // Получаем границы видимой области один раз
              const [[minLng], [maxLng]] = map.getBounds().toArray();
              const width = container.offsetWidth;
              const height = container.offsetHeight;
          
              // Обновляем все точки за одну операцию
              allPoints.each(function(d) {
                const point = map.project(d.coordinates);
                const visible = point.x >= 0 && point.x <= width && 
                               point.y >= 0 && point.y <= height;
                
                // Обновляем только если точка изменила состояние видимости
                if (visible) {
                  d3.select(this)
                    .style('display', 'block')
                    .attr('cx', point.x)
                    .attr('cy', point.y);
                } else {
                  d3.select(this)
                    .style('display', 'none');
                }
              });
            }
          
            // Используем throttle для ограничения частоты обновлений
            const throttledUpdate = _.throttle(updatePositions, 16); // 60fps
          
            map.on('move', throttledUpdate);
            map.on('resize', () => {
              svg
                .attr('width', container.offsetWidth)
                .attr('height', container.offsetHeight);
              throttledUpdate();
            });
          
            updatePositions();
          }
  
        d3.json('world_coordinates.geojson')
          .then(data => {
            const urlParams = new URLSearchParams(window.location.search);
            const pointsCount = parseInt(urlParams.get('points')) || 10000;
            const selectedData = getRandomFeatures(data, pointsCount);
            renderPoints(selectedData);
            
            window.d3Map = map;
            resolve({ map, svg });
          })
          .catch(error => {
            console.error('Ошибка загрузки GeoJSON:', error);
            reject(error);
          });
      });
    });
  }