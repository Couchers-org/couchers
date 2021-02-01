/// TODO: This mock may not be necessary if redux is removed.
window.URL.createObjectURL = jest.fn();

const mapboxgl = require("maplibre-gl");
module.exports = mapboxgl
