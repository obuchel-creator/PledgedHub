const WebSocket = require('ws');

function setupRealtime(server) {
  const wss = new WebSocket.Server({ server });
  wss.on('connection', (ws, req) => {
    ws.send(JSON.stringify({ type: 'welcome', message: 'Connected to PledgeHub Realtime' }));
    ws.on('message', (msg) => {
      // Echo for now, can add authentication and custom events
      ws.send(JSON.stringify({ type: 'echo', message: msg }));
    });
  });
  // Broadcast helper
  wss.broadcast = function broadcast(data) {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };
  return wss;
}

module.exports = { setupRealtime };
