const WebSocket = require('ws')
const wss = new WebSocket.Server({ port: 8080 })

// Store all connected clients
const clients = new Map()
// Store latest location per userId
const locations = new Map()

wss.on('connection', (ws) => {
  console.log('New client connected')
  let clientUserId = null
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message)
      console.log('Received:', data)
      
      if (data.type === 'START_SOS') {
        clientUserId = data.userId
        clients.set(data.userId + '_sender', ws)
        locations.set(data.userId, {
          lat: data.lat,
          lng: data.lng
        })
        console.log('SOS started for:', data.userId)
      }
      
      if (data.type === 'UPDATE_LOCATION') {
        // Store latest location
        locations.set(data.userId, {
          lat: data.lat,
          lng: data.lng
        })
        
        // Broadcast to ALL watchers of this userId
        const watcherKey = data.userId + '_watcher'
        wss.clients.forEach((client) => {
          if (client.readyState === 
              WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'LOCATION_UPDATE',
              userId: data.userId,
              lat: data.lat,
              lng: data.lng,
              timestamp: Date.now()
            }))
          }
        })
      }
      
      if (data.type === 'SUBSCRIBE') {
        // Watcher subscribing to a userId
        clientUserId = data.userId + '_watcher'
        clients.set(clientUserId, ws)
        console.log('Watcher subscribed to:', 
          data.userId)
        
        // Send last known location immediately
        const lastLocation = 
          locations.get(data.userId)
        if (lastLocation) {
          ws.send(JSON.stringify({
            type: 'LOCATION_UPDATE',
            userId: data.userId,
            lat: lastLocation.lat,
            lng: lastLocation.lng,
            timestamp: Date.now()
          }))
        }
      }
      
      if (data.type === 'STOP_SOS') {
        locations.delete(data.userId)
        wss.clients.forEach((client) => {
          if (client.readyState === 
              WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'SOS_STOPPED',
              userId: data.userId
            }))
          }
        })
      }
      
    } catch(e) {
      console.error('Parse error:', e)
    }
  })
  
  ws.on('close', () => {
    console.log('Client disconnected')
  })
})

console.log('WebSocket server running on port 8080')
