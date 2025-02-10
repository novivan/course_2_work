import { runBenchmarkForLibrary } from './runBenchmark.js';
import { initializeOpenLayers } from './mainOL.js';
import { initializeMapLibreGL } from './mainGL.js';
import { initializeDeckGL } from './mainDeckGL.js';

let allBenchmarkResults = [];

const params = new URLSearchParams(window.location.search);
const openLayersSelected = params.get('ol') === 'true';
const mapLibreGLSelected = params.get('ml') === 'true';
const deckGLSelected = params.get('deck') === 'true';

const points = parseInt(params.get('points'));
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
if (deckGLSelected) {
    selectedLibraries.push({
        name: 'DeckGL',
        init: initializeDeckGL,
        cleanup: (map) => {
            map.remove();
            window.deckGLMap = null;
        }
    });
}

async function runBenchmark() {
    const results = [];
    for (const lib of selectedLibraries) {
        const map = await lib.init('map');
        const metrics = await runBenchmarkForLibrary(lib.name);
        results.push(metrics);
        lib.cleanup(map);
    }
    
    const timestamp = new Date().toISOString();
    const resultsWithMetadata = results.map(result => ({
        ...result,
        timestamp,
        points,
        userAgent: navigator.userAgent
    }));

    try {
        await fetch('http://localhost:3000/api/results', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(resultsWithMetadata)
        });

        const response = await fetch('http://localhost:3000/api/results');
        allBenchmarkResults = await response.json();
    } catch (error) {
        console.error('Failed to communicate with server: ', error);
    }

    displayResults(results);
}

function formatDate(isoString) {
    const date = new Date(isoString);
    return `${date.toLocaleDateString('ru-Ru', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    })} ${date.toLocaleTimeString('ru-Ru', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    })}`
}

document.getElementById('downloadCSV').addEventListener('click', () => {
    if (allBenchmarkResults.length === 0) {
        alert('Пока нет результатов для скачивания');
        return;
    }

    const csvRows = [
        ['Дата и время', 'Библиотека', 'Кол-во точек', 'Среднее Время загрузки (мс)', 'Время рендеринга (мс)', 'Средний FPS', 'Используемая память (MB)', 'Средневзвешенный показатель времени работы'],
        ...allBenchmarkResults.map(result => [
            `="${formatDate(result.timestamp)}"`,
            result.library,
            `="${result.points}"`,
            `="${result.dataLoadTime}"`,
            `="${result.renderTime}"`,
            `="${result.fps}"`,
            `="${result.memoryUsed}"`,
            `="${result.overallPerformance}"`
        ])
    ];
    
    const BOM = '\uFEFF';
    const csvContent = BOM + csvRows.map(row => row.join(';')).join('\n');
    const blob = new Blob([csvContent], {type : 'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.setAttribute('href', url);
    link.setAttribute('download', `benchmark_results_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
})

document.getElementById('restartBenchmark').addEventListener('click', async () => {
    document.getElementById('benchmarkResults').innerHTML = '';
    await runBenchmark();
});

function displayResults(results) {
const tableHTML = `
    <table>
        <thead>
            <tr>
                <th>Библиотека</th>
                <th>Кол-во точек</th>
                <th>Среднее Время загрузки данных (мс)</th>
                <th>Время рендеринга (мс)</th>
                <th>Средний FPS</th>
                <th>Используемая память (MB)</th>
                <th>Средневзвешенный показатель времени работы</th>
            </tr>
        </thead>
        <tbody>
            ${results.map(result => {
                console.log('Result object:', result);
                return `
                    <tr>
                        <td>${result.library || 'N/A'}</td>
                        <td>${points || 'N/A'}</td>
                        <td>${result.dataLoadTime || 'N/A'}</td>
                        <td>${result.renderTime || 'N/A'}</td>
                        <td>${result.fps || 'N/A'}</td>
                        <td>${result.memoryUsed || 'N/A'}</td>
                        <td>${result.overallPerformance || 'N/A'}</td>
                    </tr>
                `;
            }).join('')}
        </tbody>
    </table>
`;
document.getElementById('benchmarkResults').innerHTML = tableHTML;
}

runBenchmark();