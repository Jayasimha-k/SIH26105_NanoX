export class WebSocketClient {
  constructor(onMessageCallback, onStatusChangeCallback) {
    this.onMessage = onMessageCallback;
    this.onStatusChange = onStatusChangeCallback;
    this.ws = null;
    this.pingInterval = null;
  }

  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/events`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        if (this.onStatusChange) this.onStatusChange('CONNECTED');
        this.startPing();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event_type !== 'PONG' && this.onMessage) {
            this.onMessage(data);
          }
        } catch (e) {
          console.error("Error parsing WebSocket message:", e);
        }
      };

      this.ws.onclose = () => {
        if (this.onStatusChange) this.onStatusChange('DISCONNECTED');
        this.stopPing();
        // Reconnect attempt after 3s
        setTimeout(() => this.connect(), 3000);
      };

      this.ws.onerror = () => {
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
