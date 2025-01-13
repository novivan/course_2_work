import { initializeOpenLayers } from './mainOL.js';
import { initializeMapLibreGL } from './mainGL.js';
import { runBenchmarkForLibrary } from './runBenchmark.js'; // Исправлен путь импорта

let benchmarkResults = []; // Добавлено для хранения результатов

document.getElementById('runBenchmark').addEventListener('click', async () => {
  const runButton = document.getElementById('runBenchmark');
  runButton.disabled = true; // Отключаем кнопку

  const openLayersSelected = document.getElementById('openLayersCheckbox').checked;
  const mapLibreGLSelected = document.getElementById('mapLibreGLCheckbox').checked;

  const results = [];

  const selectedLibraries = [];
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

  for (const lib of selectedLibraries) {
    try {
      // Инициализируем библиотеку и ждем завершения загрузки
      if (!window[`${lib.name}Map`]) {
        const map = await lib.init('map');

        // Присваиваем глобальные переменные карт
        if (lib.name === 'OpenLayers') {
          window.openLayersMap = map;
          // Ожидаем полного рендеринга OpenLayers
          map.getView().on('change:center', () => {
            // Можно добавить дополнительную логику, если необходимо
          });
        } else if (lib.name === 'MapLibreGL') {
          window.mapLibreMap = map;
          // Ожидаем события 'render' для MapLibreGL
          map.on('render', () => {
            // Можно добавить дополнительную логику, если необходимо
          });
        }
      }

      // Дополнительное ожидание перед запуском бенчмарка
      await new Promise((resolve) => setTimeout(resolve, 500)); // Ожидание 500 мс

      // Измеряем время выполнения бенчмарка
      const startTime = performance.now();
      const metricResults = await runBenchmarkForLibrary(lib.name);
      const endTime = performance.now();
      const duration = endTime - startTime;

      results.push({
        library: lib.name,
        loadTime: `${metricResults.dataLoadTime} ms`,
        renderTime: `${metricResults.renderTime} ms`,
        fps: metricResults.fps,
        memoryUsage: `${metricResults.memoryUsed} MB`,
        overallPerformance: metricResults.overallPerformance // Добавлено
      });

      // Очищаем карту после бенчмарка, если нужно
      // lib.cleanup(window[`${lib.name}Map`]);
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

  const csvHeaders = ['Библиотека', 'Время загрузки', 'Время рендеринга', 'FPS', 'Используемая память'];
  const csvRows = benchmarkResults.map(result => [
    result.library,
    result.loadTime,
    result.renderTime,
    result.fps,
    result.memoryUsage
  ]);

  let csvContent = 'data:text/csv;charset=utf-8,' 
    + csvHeaders.join(',') + '\n' 
    + csvRows.map(e => e.join(',')).join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'benchmark_results.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

function displayResults(results) {
  benchmarkResults = results; // Сохраняем результаты для скачивания

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