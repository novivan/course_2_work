export function getRandomFeatures(geojson, count) {
    const { features } = geojson;
    if (count >= features.length) return geojson;
    
    const step = features.length / count;
    return {
        type: "FeatureCollection",
        features: Array.from({length: count}, (_, i) => features[Math.floor(i * step)])
    };
}