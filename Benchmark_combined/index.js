document.getElementById('startBenchmark').addEventListener('click', () => {
    const ol = document.getElementById('openLayersCheckbox').checked;
    const ml = document.getElementById('mapLibreGLCheckbox').checked;
    const deck = document.getElementById('deckGLCheckbox').checked;
    const lf = document.getElementById('leafletCheckbox').checked;

    const points_before_parseInt = document.getElementById('pointsAmount').value;
    const points = parseInt(points_before_parseInt);
    
    if (!ol && !ml && !deck && !lf) {
      alert('Выберите хотя бы одну библиотеку');
      return;
    }
    if (isNaN(points) || points < 0 || points > 1000000 || points_before_parseInt.includes('.') || points_before_parseInt.includes(',')) {
        alert('Введите корректное количество точек (целое число от 0 до 1000000 включительно)');
        return;
    }

    window.location.href = `benchmark.html?ol=${ol}&ml=${ml}&deck=${deck}&lf=${lf}&points=${points}`;
  });