let map = L.map('map').setView([20.5937, 78.9629], 5);
let allMarkers = [];

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
}).addTo(map);

// Filter function
function filterStations(type) {
  allMarkers.forEach(({ marker, data }) => {
    const isRail = data.tags?.railway === 'station';
    const isMetro = data.tags?.station === 'subway';

    if (
      type === 'all' ||
      (type === 'railway' && isRail) ||
      (type === 'subway' && isMetro)
    ) {
      map.addLayer(marker);
    } else {
      map.removeLayer(marker);
    }
  });
}

// Get location and fetch stations
navigator.geolocation.getCurrentPosition(async (position) => {
  const { latitude, longitude } = position.coords;
  map.setView([latitude, longitude], 14);

  L.marker([latitude, longitude])
    .addTo(map)
    .bindPopup("You are here")
    .openPopup();

  const radius = 2000;
  const query = `
    [out:json];
    (
      node["railway"="station"](around:${radius},${latitude},${longitude});
      node["station"="subway"](around:${radius},${latitude},${longitude});
    );
    out body;
  `;

  try {
    const url = "https://overpass.kumi.systems/api/interpreter?data=" + encodeURIComponent(query);
    const response = await fetch(url);
    const data = await response.json();

    document.getElementById("loader").style.display = "none";

    data.elements.forEach(station => {
      const lat = station.lat;
      const lon = station.lon;
      const name = station.tags?.name || "Unnamed Station";
      const type = station.tags?.station ? '🚇 Metro' : '🚉 Rail';

      const marker = L.marker([lat, lon])
        .bindPopup(`<strong>${name}</strong><br>${type}`)
        .addTo(map);

      allMarkers.push({ marker, data: station });
    });
  } catch (err) {
    alert("Failed to load station data.");
    console.error(err);
  }
}, () => {
  alert("Geolocation access denied.");
});
