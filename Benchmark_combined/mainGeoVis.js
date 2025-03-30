import GeoVis from './lib/geovis.js';

export function initializeGeoVis(targetId) {
    return new Promise((resolve, reject) => {
        const container = document.getElementById(targetId);
        if (!container) {
            reject('Контейнер не найден!');
            return;
        }
        try {
            const geoVis = new GeoVis(container);
            // Загружаем данные GeoJSON (предполагается, что файл world_coordinates.geojson существует)
            fetch('world_coordinates.geojson')
                .then(response => response.json())
                .then(json => {
                    // Здесь можно добавить отбор случайных точек, если требуется
                    geoVis.addData(json);
                    // Сохраняем экземпляр карты для последующей очистки
                    window.geoVisMap = geoVis;
                    resolve(geoVis);
                })
                .catch(err => reject(err));
        } catch (e) {
            reject(e);
        }
    });
}
