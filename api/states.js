// api/states.js
export default async function handler(req, res) {
  const response = await fetch('https://opensky-network.org/api/states/all');
  const data = await response.json();

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json(data);
}