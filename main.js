const map = L.map('map').setView([39.5, -98.35], 4); // Center on USA
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

const markers = {};

// Load last known positions from localStorage
function loadLastKnown() {
  const data = localStorage.getItem('jetLocations');
  return data ? JSON.parse(data) : {};
}

// Save updated positions
function saveLastKnown(locations) {
  localStorage.setItem('jetLocations', JSON.stringify(locations));
}

async function loadTailsAndTrack() {
  // Load your tail numbers from tails.json
  const tailsRes = await fetch('tails.json');
  const tails = await tailsRes.json();
  const lastKnown = loadLastKnown();

  async function updateMap() {
    try {
      // Fetch OpenSky data from your Vercel proxy
      const res = await fetch('/api/states');
      const data = await res.json();
      const jets = data.states;

      const nowKnown = {};

      tails.forEach(tail => {
        const match = jets.find(j => j[1] === tail.toUpperCase());

        let lat, lon, infoText;
        if (match && match[6] && match[5]) {
          lat = match[6];
          lon = match[5];
          nowKnown[tail] = { lat, lon, ts: Date.now() };
          infoText = `Tail: ${tail}<br>Status: Live`;
        } else if (lastKnown[tail]) {
          lat = lastKnown[tail].lat;
          lon = lastKnown[tail].lon;
          infoText = `Tail: ${tail}<br>Status: Last known`;
        }

        if (lat && lon) {
          if (!markers[tail]) {
            markers[tail] = L.marker([lat, lon])
              .addTo(map)
              .bindPopup(infoText);
          } else {
            markers[tail].setLatLng([lat, lon]);
            markers[tail].bindPopup(infoText);
          }
        }
      });

      saveLastKnown({ ...lastKnown, ...nowKnown });

    } catch (err) {
      console.error("Error fetching aircraft data:", err);
    }
  }

  updateMap();
  setInterval(updateMap, 30000); // Update every 30s
}

loadTailsAndTrack();