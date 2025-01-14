import { fromLonLat } from 'ol/proj';

async function loadGeoJsonData() {
  const loadStart = performance.now();

  const response = await fetch('./world_coordinates.geojson');
  const geojsonData = await response.json();
  // При необходимости добавить слой с geojsonData на карту
  const loadEnd = performance.now();
  return (loadEnd - loadStart).toFixed(2);
}

export async function runBenchmarkForLibrary(library) {
  // Замеряем только загрузку данных
  const dataLoadTime = await loadGeoJsonData();

  let map;
  if (library === 'OpenLayers' && window.openLayersMap) {
    map = window.openLayersMap;
    //await performActionsOpenLayers(window.openLayersMap);
  } else if (library === 'MapLibreGL' && window.mapLibreMap) {
    map = window.mapLibreMap;
    //await performActionsMapLibreGL(window.mapLibreMap);
  } else {
    console.error(`Не удалось найти карту для библиотеки ${library}`);
  }

  const renderStart = performance.now();
  await performanceActions(map, library);
  
  const renderEnd = performance.now();
  const renderTime = (renderEnd - renderStart).toFixed(2);

  // Примерная оценка FPS (замер по requestAnimationFrame в течение короткого промежутка):
  let frames = [];
  const fpsStart = performance.now();
  const fpsDuration = 1000; // 1 сек
  let lastFrameTime = fpsStart;
  await new Promise(resolve => {
    function trackFrame(time) {
      frames.push(time - lastFrameTime);
      lastFrameTime = time;
      if (time - fpsStart < fpsDuration) {
        requestAnimationFrame(trackFrame);
      } else {
        resolve();
      }
    }
    requestAnimationFrame(trackFrame);
  });
  const avgDeltaMs = frames.reduce((sum, delta) => sum + delta, 0) / frames.length;
  const approximateFps = (1000 / avgDeltaMs).toFixed(1);

  // Пример использования памяти (только если доступно performance.memory):
  const memoryUsedMB = performance.memory
    ? (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)
    : 'N/A';

  // Определение весов
  const weights = {
    dataLoadTime: 0.3,
    renderTime: 0.3,
    fps: 0.2,
    memoryUsed: 0.2
  };

  // Нормализация значений (предполагается, что меньшие значения лучше для времени и памяти, большее для FPS)
  const normalizedDataLoadTime = 1 / parseFloat(dataLoadTime);
  const normalizedRenderTime = 1 / parseFloat(renderTime);
  const normalizedFps = parseFloat(approximateFps);
  const normalizedMemoryUsed = 1 / parseFloat(memoryUsedMB);

  // Вычисление среднего взвешенного значения
  const overallPerformance = (
    normalizedDataLoadTime * weights.dataLoadTime +
    normalizedRenderTime * weights.renderTime +
    normalizedFps * weights.fps +
    normalizedMemoryUsed * weights.memoryUsed
  ).toFixed(2);

  return {  
    dataLoadTime,
    renderTime,
    fps: approximateFps,
    memoryUsed: memoryUsedMB,
    overallPerformance
  };
}

function performanceActions(map, library) {
  return new Promise((resolve) => {
    const actions = [
      { type: 'zoom', value: 4 },
      { type: 'zoom', value: 2 },
      { type: 'pan', value: [37.6173, 55.7558] }, // Москва
      { type: 'pan', value: [0, 0] },
      { type: 'zoom', value: 3 },
      { type: 'zoom', value: 1 },
      { type: 'pan', value: [-74.006, 40.7128] }, // Нью-Йорк
      { type: 'pan', value: [139.6917, 35.6895] }, // Токио
      { type: 'zoom', value: 5 },
      { type: 'zoom', value: 2 },
      { type: 'pan', value: [2.3522, 48.8566] }, // Париж
      { type: 'pan', value: [151.2093, -33.8688] }, // Сидней
      { type: 'zoom', value: 6 },
      { type: 'zoom', value: 1 }
    ];

    sequentiallyExecuteActions(map, actions, resolve, library);
  });
}

function sequentiallyExecuteActions(map, actions, callback, library) {
    let index = 0;
    function executeNext() {
      if (index >= actions.length) {
        callback();
        return;
      }
      const action = actions[index];
      if (library == 'OpenLayers') {
        if (action.type == 'zoom') {
          map.getView().animate( {zoom: action.value, duration: 100 }, () => {
            map.once('rendercomplete', () => {
              index++;
              executeNext();
            });
          });
        } else if (action.type == 'pan') {
          map.getView().animate({center: fromLonLat(action.value), duration: 100}, () => {
            map.once('rendercomplete', () => {
              index++;
              executeNext();
            });
          });
        }
      } else if (library == 'MapLibreGL') {
        if (action.type == 'zoom') {
          map.zoomTo(action.value, {duration : 100});
          map.once('zoomend', () => {
            map.once('render', () => {
              index++;
              executeNext();
            });
          });
        } else if (action.type == 'pan') {
          map.easeTo({center: action.value, duration : 100 });
          map.once('moveend', () => {
            map.once('render', () => {
              index++;
              executeNext();
            });
          });
        }
      }
    }
    executeNext();
}
