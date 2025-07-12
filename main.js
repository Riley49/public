const map = L.map('map').setView([39.5, -98.35], 4);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

const markers = {};

// Load from localStorage
function loadLastKnown() {
  const data = localStorage.getItem('jetLocations');
  return data ? JSON.parse(data) : {};
}

// Save to localStorage
function saveLastKnown(locations) {
  localStorage.setItem('jetLocations', JSON.stringify(locations));
}

async function loadTailsAndTrack() {
  const tailsRes = await fetch('tails.json');
  const tails = await tailsRes.json();
  const lastKnown = loadLastKnown();

  async function updateMap() {
    const res = await fetch('https://opensky-network.org/api/states/all');
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
        infoText = `Tail: ${tail}<br>Updated: Live`;
      } else if (lastKnown[tail]) {
        lat = lastKnown[tail].lat;
        lon = lastKnown[tail].lon;
        infoText = `Tail: ${tail}<br>Updated: Last known`;
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
  }

  updateMap();
  setInterval(updateMap, 30000);
}

loadTailsAndTrack();