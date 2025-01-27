import { runBenchmarkForLibrary } from './runBenchmark.js';
import { initializeOpenLayers } from './mainOL.js';
import { initializeMapLibreGL } from './mainGL.js';

const params = new URLSearchParams(window.location.search);
const openLayersSelected = params.get('ol') === 'true';
const mapLibreGLSelected = params.get('ml') === 'true';
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

let benchmarkResults = [];

async function runBenchmark() {
    const results = [];
    for (const lib of selectedLibraries) {
        const map = await lib.init('map');
        const metrics = await runBenchmarkForLibrary(lib.name);
        results.push(metrics);
        lib.cleanup(map);
    }
    benchmarkResults = results;
    displayResults(results);
}

document.getElementById('downloadCSV').addEventListener('click', () => {
    if (benchmarkResults.length === 0) {
        alert('Нет результатов для скачивания');
        return;
    }

    const csvRows = [
        ['Библиотека', 'Кол-во точек', 'Время загрузки (мс)', 'Время рендеринга (мс)', 'Средний FPS', 'Используемая память (MB)', 'Общий показатель'],
        ...benchmarkResults.map(result => [
            result.library,
            points,
            result.dataLoadTime,
            result.renderTime,
            result.fps,
            result.memoryUsed,
            result.overallPerformance
        ])
    ];
    
    const BOM = '\uFEFF';
    const csvContent = BOM + csvRows.map(row => row.join(';')).join('\n');
    const blob = new Blob([csvContent], {type : 'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.setAttribute('href', url);
    link.setAttribute('download', 'benchmark_results.csv');
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
                <th>Время загрузки данных (мс)</th>
                <th>Время рендеринга (мс)</th>
                <th>Средний FPS</th>
                <th>Используемая память (MB)</th>
                <th>Общий показатель</th>
            </tr>
        </thead>
        <tbody>
            ${results.map(result => {
                console.log('Result object:', result); // Для отладки
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