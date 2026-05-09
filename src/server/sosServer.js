import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });
console.log('SOS WebSocket Server running on ws://localhost:8080');

// Map of tracking sessions: userId -> { lat, lng, name, lastUpdated }
const activeTrackingSessions = new Map();

wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'START_SOS':
          console.log(`SOS Started for user: ${data.userId}`);
          activeTrackingSessions.set(data.userId, {
            lat: data.lat,
            lng: data.lng,
            name: data.name || 'Anonymous',
            pin: data.pin || '1234', // Store the PIN
            lastUpdated: Date.now()
          });
          broadcastToAll(data);
          break;

        case 'UPDATE_LOCATION':
          if (activeTrackingSessions.has(data.userId)) {
            const session = activeTrackingSessions.get(data.userId);
            session.lat = data.lat;
            session.lng = data.lng;
            session.lastUpdated = Date.now();
            broadcastToAll(data);
          }
          break;

        case 'STOP_SOS':
          console.log(`SOS Stopped for user: ${data.userId}`);
          activeTrackingSessions.delete(data.userId);
          broadcastToAll(data);
          break;

        case 'VALIDATE_PIN':
          if (activeTrackingSessions.has(data.userId)) {
            const session = activeTrackingSessions.get(data.userId);
            const isValid = session.pin === data.pin;
            ws.send(JSON.stringify({
              type: 'PIN_VALIDATION_RESULT',
              userId: data.userId,
              isValid: isValid
            }));
          } else {
            ws.send(JSON.stringify({
              type: 'PIN_VALIDATION_RESULT',
              userId: data.userId,
              isValid: false,
              error: 'Session not found'
            }));
          }
          break;
          
        case 'GET_LOCATION':
          // A tracking client is requesting current location
          if (activeTrackingSessions.has(data.userId)) {
            const session = activeTrackingSessions.get(data.userId);
            ws.send(JSON.stringify({
              type: 'UPDATE_LOCATION',
              userId: data.userId,
              lat: session.lat,
              lng: session.lng,
              name: session.name
            }));
          }
          break;
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

function broadcastToAll(messageObj) {
  const msgString = JSON.stringify(messageObj);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN
      client.send(msgString);
    }
  });
}
