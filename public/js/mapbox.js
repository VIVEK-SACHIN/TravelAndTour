/* eslint-disable */

 export const displayMap = (locations) => {
  mapboxgl.accessToken =
  'pk.eyJ1Ijoidml2ZWtnZW5pdXMiLCJhIjoiY204NDQ3dWdhMW9iNTJxc2F3dGFxN28wZSJ9.goo4_765HCGhR4ViGLSrdg';

// Initialize Mapbox with worker configuration
window.mapboxgl.workerCount = 4;  // Optimal worker count for most devices
  // Initialize map
  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    scrollZoom: false
  });

  // Create bounds to fit all locations
  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach(loc => {
    // Create marker element
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker to map
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup with tour information
    new mapboxgl.Popup({
      offset: 30
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  // Fit map to bounds with padding
  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100
    }
  });
};

// Initialize map if element exists on page
if (document.getElementById('map')) {
  const locations = JSON.parse(document.getElementById('map').dataset.locations);
  displayMap(locations);
}