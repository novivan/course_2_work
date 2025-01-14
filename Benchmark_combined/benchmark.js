import { initializeOpenLayers } from './mainOL.js';
import { initializeMapLibreGL } from './mainGL.js';
import { runBenchmarkForLibrary } from './runBenchmark.js';

let benchmarkResults = []; 

document.getElementById('runBenchmark').addEventListener('click', async () => {
  const runButton = document.getElementById('runBenchmark');
  runButton.disabled = true; 

  const openLayersSelected = document.getElementById('openLayersCheckbox').checked;
  const mapLibreGLSelected = document.getElementById('mapLibreGLCheckbox').checked;

  const results = [];

  const selectedLibraries = [];
  if (mapLibreGLSelected) {
    selectedLibraries.push({
      name: 'MapLibreGL',
      init: initializeMapLibreGL,
      cleanup: (map) => {
        map.remove();
        window.mapLibreMap = null;
      }
    });
  }
  if (openLayersSelected) {
    selectedLibraries.push({
      name: 'OpenLayers',
      init: initializeOpenLayers,
      cleanup: (map) => {
        map.setTarget(null);
        window.openLayersMap = null;
      }
    });
  }

  for (const lib of selectedLibraries) {
    try {
      if (!window[`${lib.name}Map`]) {
        const map = await lib.init('map');

        if (lib.name === 'OpenLayers') {
          window.openLayersMap = map;
          map.getView().on('change:center', () => {
            // Можно добавить дополнительную логику, если необходимо
          });
        } else if (lib.name === 'MapLibreGL') {
          window.mapLibreMap = map;
          map.on('render', () => {
            // Можно добавить дополнительную логику, если необходимо
          });
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 500)); // Ожидание 500 мс

      // Измеряем время выполнения бенчмарка
      const metricResults = await runBenchmarkForLibrary(lib.name);

      results.push({
        library: lib.name,
        loadTime: `${metricResults.dataLoadTime} ms`,
        renderTime: `${metricResults.renderTime} ms`,
        fps: metricResults.fps,
        memoryUsage: `${metricResults.memoryUsed} MB`,
        overallPerformance: metricResults.overallPerformance // Добавлено
      });

    } catch (error) {
      console.error(`Ошибка с библиотекой ${lib.name}:`, error);
      results.push({ library: lib.name, renderTime: 'Ошибка' });
    }
  }

  displayResults(results);
  runButton.disabled = false; // Активируем кнопку
});

document.getElementById('clearResults').addEventListener('click', () => {
  document.getElementById('benchmarkResults').innerHTML = '';
});

document.getElementById('downloadCSV').addEventListener('click', () => {
  if (benchmarkResults.length === 0) {
    alert('Нет результатов для скачивания.');
    return;
  }
  const csvRows = benchmarkResults.map(result => [
    result.library,
    result.loadTime,
    result.renderTime,
    result.fps,
    result.memoryUsage
  ]);
  let csvContent = 'Бибилиотека, Время загрузки, Время рендеринга, Средний FPS, Используемая память\n'
    + csvRows.map(e => e.join(',')).join('\n');

  const BOM = '\uFEFF';
  const finalContent = BOM + csvContent;
  const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + finalContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'benchmark_results.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

function displayResults(results) {
  benchmarkResults = results;

  if (results.length === 0) {
    document.getElementById('benchmarkResults').innerHTML = '<p>Нет результатов для отображения.</p>';
    return;
  }

  let tableHTML = `
    <table>
      <thead>
        <tr>
          <th>Библиотека</th>
          <th>Время загрузки</th>
          <th>Время рендеринга</th>
          <th>средний FPS</th>
          <th>Используемая память</th>
          <th>Общая производительность</th> <!-- Добавлен новый столбец -->
        </tr>
      </thead>
      <tbody>
  `;

  results.forEach(result => {
    tableHTML += `
      <tr>
        <td>${result.library}</td>
        <td>${result.loadTime}</td>
        <td>${result.renderTime}</td>
        <td>${result.fps}</td>
        <td>${result.memoryUsage}</td>
        <td>${result.overallPerformance}</td> <!-- Добавлено значение общего показателя -->
      </tr>
    `;
  });

  tableHTML += `
      </tbody>
    </table>
  `;

  document.getElementById('benchmarkResults').innerHTML = tableHTML;
}