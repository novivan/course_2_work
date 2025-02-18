import * as d3 from 'd3';
import { tile as tileFn } from 'd3-tile';
import { getRandomFeatures } from './utils.js';

export function initializeD3(targetId) {
  // Очищаем элемент, куда будем рисовать карту
  const container = document.getElementById(targetId);
  container.innerHTML = "";

  // Получаем размеры контейнера (они задаются только через CSS, например, #map { width: 100%; height: 70vh; } )
  const width = container.clientWidth;
  const height = container.clientHeight;

  // Создаем SVG, который займет весь контейнер
  const svg = d3.select(container)
    .append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  // Создаем меркаторскую проекцию, вписывающую всю сферу (землю) в размеры контейнера
  const projection = d3.geoMercator()
    .fitSize([width, height], { type: 'Sphere' });
  const path = d3.geoPath().projection(projection);

  // Генератор плиток для OSM. Масштаб умножаем на 2π, как требуется d3-tile.
  const tileGenerator = tileFn()
    .size([width, height])
    .scale(projection.scale() * 2 * Math.PI)
    .translate(projection([0, 0]));

  // Генерируем массив плиток
  const tiles = tileGenerator();

  // Добавляем группу для подложки (тайлами)
  const raster = svg.append('g').attr('class', 'raster');
  raster.selectAll('image')
    .data(tiles)
    .enter()
    .append('image')
    // Для каждого элемента массива плиток обращаемся по индексам: d[0] = x, d[1] = y, d[2] = z (уровень зума)
    .attr('xlink:href', d => `https://a.tile.openstreetmap.org/${d[2]}/${d[0]}/${d[1]}.png`)
    .attr('x', d => d[0] * 256)
    .attr('y', d => d[1] * 256)
    .attr('width', 256)
    .attr('height', 256);

  // Загружаем GeoJSON, отбираем нужное количество точек и отрисовываем их
  const urlParams = new URLSearchParams(window.location.search);
  const pointsCount = parseInt(urlParams.get('points')) || 10000;

  const pointsLayer = svg.append('g').attr('class', 'points-layer');
  d3.json('world_coordinates.geojson')
    .then(json => {
      const selectedData = getRandomFeatures(json, pointsCount);
      // Если getRandomFeatures возвращает FeatureCollection, берем поле features
      const features = selectedData.features || selectedData;

      pointsLayer.selectAll('circle')
        .data(features)
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
        .attr('r', 4)
        .attr('fill', 'red')
        .attr('stroke', 'white')
        .attr('stroke-width', 1);
    })
    .catch(err => console.error('[D3] Ошибка загрузки/отрисовки GeoJSON:', err));

  // Сохраняем DOM-элемент SVG для последующей очистки в бенчмарке
  window.d3Map = svg.node();
  return container;
}