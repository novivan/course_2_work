import { initializeGeoVis } from './mainGeoVis.js';

document.getElementById('startBenchmark').addEventListener('click', () => {
    const ol = document.getElementById('openLayersCheckbox').checked;
    const ml = document.getElementById('mapLibreGLCheckbox').checked;
    const deck = document.getElementById('deckGLCheckbox').checked;
    const lf = document.getElementById('leafletCheckbox').checked;
    const d3 = document.getElementById('d3Checkbox').checked;
    const geovis = document.getElementById('geovisCheckbox') && document.getElementById('geovisCheckbox').checked;

    const points_string = document.getElementById('pointsAmount').value;
    const points = parseInt(points_string);
    
    if (!ol && !ml && !deck && !lf && !d3 && !geovis) {
      alert('Выберите хотя бы одну библиотеку');
      return;
    }
    if (isNaN(points) || points < 0 || points > 1000000 || points_string.includes('.') || points_string.includes(',')) {
        alert('Введите корректное количество точек (целое число от 0 до 1000000 включительно)');
        return;
    }

    window.location.href = `benchmark.html?ol=${ol}&ml=${ml}&deck=${deck}&lf=${lf}&d3=${d3}&geovis=${geovis}&points=${points}`;
  });

document.addEventListener('DOMContentLoaded', () => {
    fetch('http://localhost:3000/api/results')
      .then(response => response.json())
      .then(data => {
        // Фильтруем результаты - оставляем только те, где points равно 100000
        const filteredData = data.filter(result => parseInt(result.points) === 100000);
  
        const minPerformanceByLib = {};
  
        filteredData.forEach(result => {
          const lib = result.library;
          const perf = parseFloat(result.overallPerformance);
          if (!minPerformanceByLib[lib] || perf < minPerformanceByLib[lib]) {
            minPerformanceByLib[lib] = perf;
          }
        });
  
        // Преобразуем объект в массив и сортируем по минимальному overallPerformance (меньше — лучше)
        const sortedLibraries = Object.entries(minPerformanceByLib)
          .map(([library, overallPerformance]) => ({ library, overallPerformance }))
          .sort((a, b) => a.overallPerformance - b.overallPerformance)
          .slice(0, 5);
  
        // Строим HTML-таблицу
        const table = document.createElement('table');
        table.style.width = '55%';
        table.style.borderCollapse = 'collapse';
        table.style.marginTop = '20px';
        table.style.marginLeft = 'auto';
        table.style.marginRight = 'auto';
  
        // Заголовок таблицы
        const headerRow = document.createElement('tr');
        ['Место в топе', 'Библиотека', 'Средневзвешенный показатель времени работы'].forEach(text => {
          const th = document.createElement('th');
          th.textContent = text;
          th.style.border = '1px solid #000';
          th.style.padding = '8px';
          headerRow.appendChild(th);
        });
        table.appendChild(headerRow);
  
        // Заполняем строки таблицы
        sortedLibraries.forEach((item, index) => {
          const row = document.createElement('tr');
  
          const rankCell = document.createElement('td');
          rankCell.textContent = index + 1;
          rankCell.style.border = '1px solid #000';
          rankCell.style.padding = '8px';
  
          const libCell = document.createElement('td');
          libCell.textContent = item.library;
          libCell.style.border = '1px solid #000';
          libCell.style.padding = '8px';
  
          const perfCell = document.createElement('td');
          perfCell.textContent = item.overallPerformance.toFixed(2);
          perfCell.style.border = '1px solid #000';
          perfCell.style.padding = '8px';
  
          row.appendChild(rankCell);
          row.appendChild(libCell);
          row.appendChild(perfCell);
          table.appendChild(row);
        });
  
        // Вставляем таблицу в элемент с id="benchmarkResults"
        const container = document.getElementById('benchmarkResults');
        if (container) {
          container.innerHTML = '';
          container.appendChild(table);
        } else {
          document.body.appendChild(table);
        }
      })
      .catch(error => {
        console.error('Ошибка при получении результатов бенчмарка:', error);
      });
  });