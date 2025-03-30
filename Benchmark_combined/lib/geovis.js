/**
 * GeoVis – простая библиотека визуализации геоданных без сторонних зависимостей.
 */
class GeoVis {
    constructor(container, options = {}) {
        this._container = typeof container === 'string' ?
            document.getElementById(container) : container;
        if (!this._container) {
            throw new Error('Контейнер не найден');
        }
        // Значения по умолчанию
        this._options = Object.assign({
            center: [0, 0],
            zoom: 2,
            tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            minZoom: 0,
            maxZoom: 19,
            pointRadius: 6,
            pointFillColor: 'blue',
            pointStrokeColor: 'white',
            pointStrokeWidth: 1
        }, options);
        // Инициализация внутренних переменных
        this._canvas = null;
        this._ctx = null;
        this._tileCache = {};
        this._tileSize = 256;
        this._data = null;
        this._width = this._container.offsetWidth;
        this._height = this._container.offsetHeight;
        this._center = [...this._options.center];
        this._zoom = this._options.zoom;
        this._pixelOrigin = { x: 0, y: 0 };
        // Инициализируем контейнер и канвас
        this._initContainer();
        this._initCanvas();
        this.setView(this._center, this._zoom);
        this._bindEvents();
    }
    setView(center, zoom) {
        this._center = [...center];
        this._zoom = Math.min(Math.max(zoom, this._options.minZoom), this._options.maxZoom);
        this._updateOrigin();
        this._loadTiles();
        this._render();
        return this;
    }
    addData(geojson) {
        this._data = geojson;
        this._render();
        return this;
    }
    remove() {
        this._unbindEvents();
        if (this._canvas && this._container.contains(this._canvas)) {
            this._container.removeChild(this._canvas);
        }
        return this;
    }
    // Новые методы для поддержки бенчмарка
    setZoom(newZoom) {
        return this.setView(this._center, newZoom);
    }

    setCenter(newCenter) {
        return this.setView(newCenter, this._zoom);
    }

    getCenter() {
        return this._center;
    }
    // Инициализация контейнера (устанавливаем позиционирование)
    _initContainer() {
        this._container.style.position = 'relative';
        this._container.style.overflow = 'hidden';
    }
    // Создание канваса
    _initCanvas() {
        this._canvas = document.createElement('canvas');
        this._canvas.width = this._width;
        this._canvas.height = this._height;
        this._canvas.style.position = 'absolute';
        this._canvas.style.top = '0';
        this._canvas.style.left = '0';
        this._container.appendChild(this._canvas);
        this._ctx = this._canvas.getContext('2d');
    }
    _updateOrigin() {
        const centerPixel = this._latLngToPixel(this._center[1], this._center[0], this._zoom);
        this._pixelOrigin = {
            x: centerPixel.x - this._width / 2,
            y: centerPixel.y - this._height / 2
        };
    }
    _loadTiles() {
        const z = Math.floor(this._zoom);
        const scale = Math.pow(2, z);
        const minX = Math.floor(this._pixelOrigin.x / this._tileSize);
        const maxX = Math.ceil((this._pixelOrigin.x + this._width) / this._tileSize);
        const minY = Math.floor(this._pixelOrigin.y / this._tileSize);
        const maxY = Math.ceil((this._pixelOrigin.y + this._height) / this._tileSize);
        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                const tileX = ((x % scale) + scale) % scale;
                const tileY = y;
                if (tileY < 0 || tileY >= scale) continue;
                this._loadTile(tileX, tileY, z);
            }
        }
    }
    _loadTile(x, y, z) {
        const key = `${x}:${y}:${z}`;
        if (this._tileCache[key]) return;
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        this._tileCache[key] = { img, loaded: false };
        const subdomains = ['a', 'b', 'c'];
        const s = subdomains[Math.abs(x + y) % subdomains.length];
        const url = this._options.tileUrl
            .replace('{s}', s)
            .replace('{z}', z)
            .replace('{x}', x)
            .replace('{y}', y);
        img.onload = () => {
            this._tileCache[key].loaded = true;
            this._render();
        };
        img.src = url;
    }
    _latLngToPixel(lat, lng, zoom) {
        const scale = Math.pow(2, zoom) * 256;
        const lambda = lng * Math.PI / 180;
        const phi = lat * Math.PI / 180;
        const x = scale * (0.5 + lambda / (2 * Math.PI));
        const y = scale * (0.5 - Math.log(Math.tan(Math.PI / 4 + phi / 2)) / (2 * Math.PI));
        return { x, y };
    }
    _render() {
        if (!this._ctx) return;
        this._ctx.clearRect(0, 0, this._width, this._height);
        this._renderTiles();
        this._renderData();
    }
    _renderTiles() {
        const z = Math.floor(this._zoom);
        const scale = Math.pow(2, z);
        const zoomFactor = Math.pow(2, this._zoom - z);
        const minX = Math.floor(this._pixelOrigin.x / this._tileSize);
        const maxX = Math.ceil((this._pixelOrigin.x + this._width) / this._tileSize);
        const minY = Math.floor(this._pixelOrigin.y / this._tileSize);
        const maxY = Math.ceil((this._pixelOrigin.y + this._height) / this._tileSize);
        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                const tileX = ((x % scale) + scale) % scale;
                const tileY = y;
                if (tileY < 0 || tileY >= scale) continue;
                const key = `${tileX}:${tileY}:${z}`;
                const tile = this._tileCache[key];
                if (tile && tile.loaded) {
                    const dx = x * this._tileSize - this._pixelOrigin.x;
                    const dy = y * this._tileSize - this._pixelOrigin.y;
                    const scaledSize = this._tileSize * zoomFactor;
                    const offset = (this._tileSize - scaledSize) / 2;
                    this._ctx.drawImage(tile.img, dx + offset, dy + offset, scaledSize, scaledSize);
                }
            }
        }
    }
    _renderData() {
        if (!this._data || !this._data.features) return;
        this._ctx.save();
        this._data.features.forEach(feature => {
            if (feature.geometry.type !== 'Point') return;
            const coords = feature.geometry.coordinates;
            const pixel = this._latLngToPixel(coords[1], coords[0], this._zoom);
            const screenX = pixel.x - this._pixelOrigin.x;
            const screenY = pixel.y - this._pixelOrigin.y;
            if (screenX < -50 || screenX > this._width + 50 ||
                screenY < -50 || screenY > this._height + 50) {
                return;
            }
            this._ctx.beginPath();
            this._ctx.arc(screenX, screenY, this._options.pointRadius, 0, Math.PI * 2);
            this._ctx.fillStyle = this._options.pointFillColor;
            this._ctx.fill();
            this._ctx.strokeStyle = this._options.pointStrokeColor;
            this._ctx.lineWidth = this._options.pointStrokeWidth;
            this._ctx.stroke();
        });
        this._ctx.restore();
    }
    _bindEvents() {
        this._onResize = () => {
            this._width = this._container.offsetWidth;
            this._height = this._container.offsetHeight;
            this._canvas.width = this._width;
            this._canvas.height = this._height;
            this._updateOrigin();
            this._render();
        };
        window.addEventListener('resize', this._onResize);
    }
    _unbindEvents() {
        window.removeEventListener('resize', this._onResize);
    }
}
export default GeoVis;
