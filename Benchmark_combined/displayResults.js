let benchmarkResults = []; // Добавлено для хранения результатов

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
          <th>FPS</th>
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

// Убедитесь, что эта функция не дублируется в `benchmark.js`
// Если `benchmark.js` содержит свою собственную функцию `displayResults`, можно удалить эту функцию из `displayResults.js`
