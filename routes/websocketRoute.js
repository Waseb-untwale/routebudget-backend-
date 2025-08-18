const WebSocket = require("ws");

const clients = new Set();
const latestGPS = new Map();

function setupWebSocketServer(server) {
  const wss = new WebSocket.Server({ server });

  wss.on("connection", (ws) => {
    console.log("WebSocket client connected");
    clients.add(ws);

    ws.on("close", () => {
      clients.delete(ws);
      console.log("WebSocket client disconnected");
    });
  });

  function broadcastGPS(imei, lat, lon) {
    const data = JSON.stringify({ imei, lat, lon });
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
    latestGPS.set(imei, { lat, lon });
  }

  return {
    broadcastGPS,
    latestGPS,
  }; // ✅ This is important
}

module.exports = {
  setupWebSocketServer,
};
