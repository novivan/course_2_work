import { fromLonLat } from 'ol/proj';

let DUR = 500;

async function loadGeoJsonData() {
  let progress = document.getElementById('progressBar');
  const NUM_LOADS = 20;
  let loadTimes = [];

  for (let i = 0; i < NUM_LOADS; i++) {
    const loadStart = performance.now();
    const response = await fetch('./world_coordinates.geojson');
    const geojsonData = await response.json();
    const loadEnd = performance.now();

    loadTimes.push(loadEnd - loadStart);
    if (i % 2 == 0) {
      progress.value = i / 2;
    }
  }
  const averageLoadTime = (loadTimes.reduce((a, b) => a + b, 0)/ NUM_LOADS).toFixed(3);
  return averageLoadTime;
}

export async function runBenchmarkForLibrary(library) {
  let progress = document.getElementById('progressBar');
  progress.value = 0;

  const dataLoadTime = await loadGeoJsonData();

  let map;
  if (library === 'OpenLayers' && window.openLayersMap) {
    map = window.openLayersMap;
  } else if (library === 'MapLibreGL' && window.mapLibreMap) {
    map = window.mapLibreMap;
  } else {
    console.error(`Не удалось найти карту для библиотеки ${library}`);
  }

  progress.value = 10;


  const renderStart = performance.now();
  await performanceActions(map, library);
  
  const renderEnd = performance.now();
  const renderTime = (renderEnd - renderStart).toFixed(2);


  let frames = [];
  const fpsStart = performance.now();
  const fpsDuration = 1000;
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

  const memoryUsedMB = performance.memory
    ? (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)
    : 'N/A';

  // Веса
  const weights = {
    dataLoadTime: 2 / 15.1,
    renderTime: 0.1 / 15.1,
    fps: 10 / 15.1,
    memoryUsed: 3 / 15.1
  };


  const overallPerformance = (
    weights.dataLoadTime * parseFloat(dataLoadTime)+
    weights.renderTime * parseFloat(renderTime) -
    weights.fps * parseFloat(approximateFps) +
    weights.memoryUsed * parseFloat(memoryUsedMB)
  ).toFixed(2);

  return {  
    library: library,
    dataLoadTime: dataLoadTime,
    renderTime: renderTime,
    fps: approximateFps,
    memoryUsed: memoryUsedMB,
    overallPerformance: overallPerformance
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
      { type: 'zoom', value: 1 },

      
      { type: 'pan', value: [18.4241, -33.9249] }, // Кейптаун
      { type: 'zoom', value: 4 },
      { type: 'pan', value: [-122.4194, 37.7749] },// Сан-Франциско
      { type: 'zoom', value: 3 },
      { type: 'pan', value: [-43.1729, -22.9068] },// Рио-де-Жанейро
      { type: 'zoom', value: 2 },
      { type: 'pan', value: [-0.1276, 51.5072] },  // Лондон
      { type: 'zoom', value: 5 },
      { type: 'pan', value: [103.8519, 1.3521] },  // Сингапур
      { type: 'zoom', value: 4 },
      { type: 'pan', value: [55.2708, 25.2048] },  // Дубай
      { type: 'zoom', value: 3 },
      { type: 'pan', value: [13.4050, 52.5200] },  // Берлин
      { type: 'zoom', value: 5 },
      { type: 'pan', value: [114.1095, 22.3964] }, // Гонконг
      { type: 'zoom', value: 2 },
      { type: 'pan', value: [126.9780, 37.5665] }, // Сеул
      { type: 'zoom', value: 4 },
      { type: 'pan', value: [28.9795, 41.0082] },  // Стамбул
      { type: 'zoom', value: 6 },
      { type: 'pan', value: [12.4964, 41.9028] },  // Рим
      { type: 'zoom', value: 3 },
      { type: 'pan', value: [4.9041, 52.3676] },   // Амстердам
      { type: 'zoom', value: 5 },

      { type: 'pan', value: [37.6176, 55.7558] }, // Москва 2
      { type: 'zoom', value: 3 },
      { type: 'pan', value: [139.6917, 35.6895] }, // Токио 2
      { type: 'zoom', value: 4 },
      { type: 'pan', value: [-74.0060, 40.7128] }, // Нью-Йорк 2
      { type: 'zoom', value: 2 },
      { type: 'pan', value: [2.3522, 48.8566] }, // Париж 2
      { type: 'zoom', value: 3 },
      { type: 'pan', value: [151.2093, -33.8688] }, // Сидней 2
      { type: 'zoom', value: 5 },
      { type: 'pan', value: [18.4241, -33.9249] }, // Кейптаун 2
      { type: 'zoom', value: 4 },
      { type: 'pan', value: [-122.4194, 37.7749] }, // Сан-Франциско 2
      { type: 'zoom', value: 3 },
      { type: 'pan', value: [-43.1729, -22.9068] }, // Рио-де-Жанейро 2
      { type: 'zoom', value: 2 },
      { type: 'pan', value: [-0.1276, 51.5072] }, // Лондон 2
      { type: 'zoom', value: 5 },
      { type: 'pan', value: [103.8519, 1.3521] }, // Сингапур 2
      { type: 'zoom', value: 4 },
      { type: 'pan', value: [55.2708, 25.2048] }, // Дубай 2
      { type: 'zoom', value: 3 },
      { type: 'pan', value: [13.4050, 52.5200] }, // Берлин 2
      { type: 'zoom', value: 5 },
      { type: 'pan', value: [114.1095, 22.3964] }, // Гонконг 2
      { type: 'zoom', value: 2 },
      
      { type: 'pan', value: [126.9780, 37.5665] }, // Сеул 2
      { type: 'zoom', value: 4 },
      { type: 'pan', value: [28.9795, 41.0082] }, // Стамбул 2
      { type: 'zoom', value: 6 },
      { type: 'pan', value: [12.4964, 41.9028] }, // Рим 2
      { type: 'zoom', value: 3 },
      { type: 'pan', value: [4.9041, 52.3676] }, // Амстердам 2
      { type: 'zoom', value: 5 },
      /* Почему-то дальше OpenLaters показывает белый прямоугольник вместо карты

      { type: 'pan', value: [37.7749, -122.4194] }, // Сан-Франциско 3
      { type: 'zoom', value: 3 },
      { type: 'pan', value: [48.8566, 2.3522] }, // Париж 3
      { type: 'zoom', value: 4 },
      { type: 'pan', value: [34.0522, -118.2437] }, // Лос-Анджелес
      { type: 'zoom', value: 2 },
      { type: 'pan', value: [35.6895, 139.6917] }, // Токио 3
      { type: 'zoom', value: 5 },
      { type: 'pan', value: [55.7558, 37.6173] }, // Москва 3
      { type: 'zoom', value: 4 },
      { type: 'pan', value: [19.0402, 47.4979] }, // Будапешт
      { type: 'zoom', value: 3 },
      { type: 'pan', value: [30.5234, 50.4501] }, // Киев
      { type: 'zoom', value: 5 },
      { type: 'pan', value: [31.2357, 30.0444] }, // Каир
      { type: 'zoom', value: 4 },
      { type: 'pan', value: [37.6173, 55.7558] }, // Москва 4
      { type: 'zoom', value: 3 },
      { type: 'pan', value: [144.9631, -37.8136] }, // Мельбурн
      { type: 'zoom', value: 2 },
      { type: 'pan', value: [127.0294, 37.5326] }, // Сеул 2
      { type: 'zoom', value: 5 },
      { type: 'pan', value: [121.4737, 31.2304] }, // Шанхай
      { type: 'zoom', value: 4 },
      { type: 'pan', value: [116.4074, 39.9042] }, // Пекин
      { type: 'zoom', value: 3 },
      { type: 'pan', value: [139.6917, 35.6895] }, // Токио 4
      { type: 'zoom', value: 5 },
      { type: 'pan', value: [19.0402, 47.4979] }, // Будапешт 2
      { type: 'zoom', value: 4 },
      { type: 'pan', value: [13.4050, 52.5200] }, // Берлин 3
      { type: 'zoom', value: 3 },
      { type: 'pan', value: [55.7558, 37.6173] }, // Москва 5
      { type: 'zoom', value: 5 },
      { type: 'pan', value: [34.0522, -118.2437] }, // Лос-Анджелес 2
      { type: 'zoom', value: 4 },
       */
    ];

    sequentiallyExecuteActions(map, actions, resolve, library);
  });
}


function sequentiallyExecuteActions(map, actions, callback, library) {
    let progress = document.getElementById('progressBar');
    let index = 0;
    function executeNext() {
      if (index >= actions.length) {
        callback();
        return;
      }
      const action = actions[index];
      if (library == 'OpenLayers') {
        if (action.type == 'zoom') {
          map.getView().animate( {zoom: action.value, duration: DUR }, () => {
            map.once('rendercomplete', () => {
              index++;
              progress.value = 10 + 90 * index/actions.length; 
              executeNext();
            });
          });
        } else if (action.type == 'pan') {
          map.getView().animate({center: fromLonLat(action.value), duration: DUR}, () => {
            map.once('rendercomplete', () => {
              index++;
              progress.value = 10 + 90 * index/actions.length; 
              executeNext();
            });
          });
        }
      } else if (library == 'MapLibreGL') {
        if (action.type == 'zoom') {
          map.zoomTo(action.value, {duration : DUR});
          map.once('idle', () => {
            index++;
            progress.value = 10 + 90 * index/actions.length; 
            executeNext();
          });
        } else if (action.type == 'pan') {
          map.easeTo({center: action.value, duration : DUR });
          map.once('idle', () => {
            index++;
            progress.value = 10 + 90 * index/actions.length;  
            executeNext();
          });
        }
      }
    }
    progress.value = 10 + 90 * index/actions.length;
    executeNext();
}
