import * as d3 from 'd3';
import { tile as tileFn } from 'd3-tile';
import { getRandomFeatures } from './utils.js';

export function initializeD3(targetId) {
  // Получаем контейнер по ID и очищаем его содержимое
  const container = document.getElementById(targetId);
  container.innerHTML = "";

  // Получаем размеры контейнера (например, задаются через CSS: #map { width: 100%; height: 70vh; })
  const width = container.clientWidth;
  const height = container.clientHeight;
  console.log(width, height);

  // Создаем SVG, который занимает весь контейнер
  const svg = d3.select(container)
    .append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMin meet');

  // Создаем основную группу, к которой будут привязаны все элементы карты.
  // Именно этот элемент (mapGroup) будет возвращен, чтобы benchmark мог менять его transform.
  const mapGroup = svg.append('g').attr('class', 'mapGroup');

  // Создаем меркаторскую проекцию, центрируя карту по контейнеру
  // Здесь масштаб рассчитывается так, чтобы ширина земного шара (360°) равнялась ширине контейнера.
  const projection = d3.geoMercator()
    .scale(width / (2 * Math.PI))
    .translate([width / 2, height / 2]);
  const path = d3.geoPath().projection(projection);

  // Генератор плиток для OpenStreetMap.
  // Требуется умножение масштаба на 2π, как требует d3-tile.
  const tileGenerator = tileFn()
    .size([width, height])
    .scale(projection.scale() * 2 * Math.PI)
    .translate(projection.translate());


  const tiles = tileGenerator();
  const tileSize = 256;

  // Добавляем группу для подложки (OSM-тайлы) внутрь mapGroup
  const raster = mapGroup.append('g').attr('class', 'raster');
  raster.selectAll('image')
    .data(tiles)
    .enter()
    .append('image')
    .attr('xlink:href', d => `https://a.tile.openstreetmap.org/${d[2]}/${d[0]}/${d[1]}.png`)
    .attr('x', d => (d[0] + tiles.translate[0] / tileSize) * tileSize)
    .attr('x', d => d[0] * tileSize)
    //.attr('y', d => (d[1] + tiles.translate[1] / tileSize) * tileSize)
    .attr('y', d => d[1] * tileSize)
    //.attr('width', tileSize)
    .attr('height', tileSize);

  // Загружаем GeoJSON, отбираем нужное количество точек и отрисовываем их
  const pointsLayer = mapGroup.append('g').attr('class', 'points-layer');
  const urlParams = new URLSearchParams(window.location.search);
  const pointsCount = parseInt(urlParams.get('points')) || 10000;
  d3.json('world_coordinates.geojson')
    .then(json => {
      const selectedData = getRandomFeatures(json, pointsCount);
      const features = selectedData.features || selectedData;

      pointsLayer.selectAll('circle')
        .data(features)
        .enter()
        .append('circle')
        .attr('cx', d => projection(d.geometry.coordinates)[0])
        .attr('cy', d => projection(d.geometry.coordinates)[1])
        .attr('r', 4)
        .attr('fill', 'red')
        .attr('stroke', 'white')
        .attr('stroke-width', 1);
    })
    .catch(err => console.error('[D3] Ошибка загрузки/отрисовки GeoJSON:', err));

  // Возвращаем основную группу, чтобы benchmark мог применять к ней переходы (pan/zoom)
  window.d3Map = mapGroup.node();
  return mapGroup.node();
}