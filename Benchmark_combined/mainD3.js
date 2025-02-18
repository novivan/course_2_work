import * as d3 from 'd3';
import { tile as tileFn } from 'd3-tile';
import { getRandomFeatures } from './utils.js';

export function initializeD3() {
  const container = document.getElementById('map');
  container.innerHTML = "";

  // Извлекаем количество точек из URL
  const params = new URLSearchParams(window.location.search);
  const pointsCount = parseInt(params.get('points'), 10) || 10000;

  // Получаем реальные размеры контейнера (#map должен иметь размеры через CSS)
  const width = container.clientWidth;
  const height = container.clientHeight;

  // Создаём SVG, занимающее весь контейнер
  const svg = d3.select(container)
    .append('svg')
    .attr('width',  '100%')
    .attr('height', '100%')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  // Меркаторская проекция с автоматическим масштабированием под размеры контейнера
  const projection = d3.geoMercator();
  projection.fitSize([width, height], { type: "Sphere" });

  // Генератор пути (при необходимости)
  const path = d3.geoPath(projection);

  // Настраиваем генератор плиток для OSM
  const tileGenerator = tileFn()
    .size([width, height])
    .scale(projection.scale() * 2 * Math.PI)
    .translate(projection([0, 0]));

  const tiles = tileGenerator();

  // Отрисовываем слой плиток
  const raster = svg.append('g').attr('class', 'raster-tiles');
  raster.selectAll('image')
    .data(tiles)
    .enter()
    .append('image')
    .attr('xlink:href', d => `https://a.tile.openstreetmap.org/${d[2]}/${d[0]}/${d[1]}.png`)
    .attr('x', d => d[0] * 256)
    .attr('y', d => d[1] * 256)
    .attr('width', 256)
    .attr('height', 256);

  // Загружаем GeoJSON и рисуем точки
  const pointsLayer = svg.append('g').attr('class', 'points-layer');
  d3.json('world_coordinates.geojson')
    .then(geojson => {
      const selected = getRandomFeatures(geojson, pointsCount);
      const feats = selected.features || selected;

      pointsLayer.selectAll('circle')
        .data(feats)
        .enter()
        .append('circle')
        .attr('cx', d => {
          const coords = projection(d.geometry.coordinates);
          return coords ? coords[0] : 0;
        })
        .attr('cy', d => {
          const coords = projection(d.geometry.coordinates);
          return coords ? coords[1] : 0;
        })
        .attr('r', 3)
        .attr('fill', 'red')
        .attr('stroke', 'white')
        .attr('stroke-width', 0.5);
    })
    .catch(err => {
      console.error('[D3] Ошибка загрузки/отрисовки GeoJSON:', err);
    });

  // Сохраняем DOM-элемент SVG, а не d3-selection, для корректной работы в runBenchmark.js
  window.d3Map = svg.node();
  return container;
}