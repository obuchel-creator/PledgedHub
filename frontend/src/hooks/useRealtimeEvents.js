import React, { useEffect, useState } from "react";

export default function useRealtimeEvents() {
  const [events, setEvents] = useState([]);
  useEffect(() => {
    let ws;
    try {
      ws = new window.WebSocket("ws://localhost:5001");
      ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          setEvents((prev) => [...prev, data]);
        } catch {}
      };
      ws.onopen = () => {
        ws.send(JSON.stringify({ type: "subscribe", channel: "dashboard" }));
      };
    } catch {}
    return () => { ws && ws.close(); };
  }, []);
  return events;
}
