export class WebSocketClient {
  constructor(onMessageCallback, onStatusChangeCallback) {
    this.onMessage = onMessageCallback;
    this.onStatusChange = onStatusChangeCallback;
    this.ws = null;
    this.pingInterval = null;
  }

  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = window.location.port;

    // Connect to backend on port 8000 for local dev or via host proxy
    const isLocalDev = port === '5173' || host === 'localhost' || host === '127.0.0.1';
    const wsUrl = isLocalDev
      ? `${protocol}//${host}:8000/ws/events`
      : `${protocol}//${window.location.host}/ws/events`;

    try {
      console.log('[DASHBOARD] WebSocket connecting to:', wsUrl);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[DASHBOARD] WebSocket connected successfully');
        if (this.onStatusChange) this.onStatusChange('CONNECTED');
        this.startPing();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event_type !== 'PONG' && this.onMessage) {
            console.log('[DASHBOARD] WebSocket message received:', data.event_type || data.event || data.status);
            this.onMessage(data);
          }
        } catch (e) {
          console.error("Error parsing WebSocket message:", e);
        }
      };

      this.ws.onclose = () => {
        if (this.onStatusChange) this.onStatusChange('DISCONNECTED');
        this.stopPing();
        // Reconnect attempt after 2s
        setTimeout(() => this.connect(), 2000);
      };

      this.ws.onerror = (err) => {
        console.warn('[DASHBOARD] WebSocket error, fallback to polling:', err);
        if (this.onStatusChange) this.onStatusChange('ERROR');
      };
    } catch (err) {
      console.error("WebSocket connection error:", err);
    }
  }

  startPing() {
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send("ping");
      }
    }, 15000);
  }

  stopPing() {
    if (this.pingInterval) clearInterval(this.pingInterval);
  }

  disconnect() {
    this.stopPing();
    if (this.ws) this.ws.close();
  }
}
