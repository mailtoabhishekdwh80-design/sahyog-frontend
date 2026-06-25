// lib/useWebSocket.ts
// Real-time WebSocket hook for Sahyog

import { useEffect, useRef, useCallback } from 'react';
import { tokenStore } from './api';

const WS_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1')
  .replace('http://', 'ws://')
  .replace('https://', 'wss://')
  .replace('/api/v1', '');

type WSMessage = {
  type: string;
  payload: any;
};

type Handler = (msg: WSMessage) => void;

export function useWebSocket(onMessage: Handler) {
  const wsRef       = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handlerRef  = useRef<Handler>(onMessage);
  const mountedRef  = useRef(true);

  // Keep handler ref current
  useEffect(() => { handlerRef.current = onMessage; }, [onMessage]);

  const connect = useCallback(() => {
    const token = tokenStore.get();
    if (!token || !mountedRef.current) return;

    // Close existing connection
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }

    const url = `${WS_BASE}/ws?token=${token}`;
    const ws  = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WS] Connected');
      // Start heartbeat
      const hb = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);
      ws.onclose = () => clearInterval(hb);
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'pong') return; // ignore heartbeat responses
        handlerRef.current(msg);
      } catch {}
    };

    ws.onerror = () => {
      console.warn('[WS] Error — will reconnect');
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      console.log('[WS] Disconnected — reconnecting in 3s');
      reconnectRef.current = setTimeout(connect, 3000);
    };
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [connect]);

  // Subscribe to a channel
  const subscribe = useCallback((channelId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type:    'channel.join',
        payload: { channelId },
      }));
    }
  }, []);

  // Send typing indicator
  const sendTyping = useCallback((channelId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type:    'typing.start',
        payload: { channelId },
      }));
    }
  }, []);

  return { subscribe, sendTyping };
}
