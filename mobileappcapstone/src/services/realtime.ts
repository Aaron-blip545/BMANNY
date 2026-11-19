// Use Pusher's React Native build. The worker build expects browser-worker
// crypto APIs and does not use React Native's network lifecycle support.
import PusherModule from 'pusher-js/react-native';
import { getApiBaseUrl, getAuthToken, getMe, getRealtimeConfig } from './api';

export type RealtimeEvent =
  | { type: 'notification.created'; payload: any }
  | { type: 'chat.message.created'; payload: any };

type Listener = (event: RealtimeEvent) => void;

// The React Native bundle exports its constructor as `Pusher`; some Metro
// versions wrap that CommonJS export beneath `default`.
const PusherConstructor: any = (PusherModule as any).Pusher
  ?? (PusherModule as any).default?.Pusher
  ?? (PusherModule as any).default
  ?? PusherModule;

let pusher: any = null;
let channel: any = null;
let connectedUserId: number | null = null;
let connecting: Promise<void> | null = null;
let connectionGeneration = 0;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let isSubscribed = false;
const listeners = new Set<Listener>();

const RETRY_DELAY_MS = 4_000;

function emit(event: RealtimeEvent) {
  listeners.forEach((listener) => listener(event));
}

function clearConnection(): void {
  if (channel) pusher?.unsubscribe(channel.name);
  pusher?.disconnect();
  channel = null;
  pusher = null;
  connectedUserId = null;
  isSubscribed = false;
}

function scheduleReconnect(reason?: string): void {
  if (!listeners.size || retryTimer) return;

  if (reason) console.warn(`Realtime reconnecting: ${reason}`);
  retryTimer = setTimeout(() => {
    retryTimer = null;
    clearConnection();
    connect().catch((error) => {
      console.warn('Realtime connection unavailable:', error?.message ?? error);
      scheduleReconnect(error?.message);
    });
  }, RETRY_DELAY_MS);
}

async function connect(): Promise<void> {
  // A subscription may still be negotiating while another screen mounts.
  // Keep that single socket; its error handlers below will clear and retry it
  // if the private channel cannot be established.
  if (pusher && channel) return;
  if (connecting) return connecting;

  const generation = connectionGeneration;
  connecting = (async () => {
    const [me, token, config] = await Promise.all([getMe(), getAuthToken(), getRealtimeConfig()]);
    if (!token || !config.app_key) throw new Error('Realtime authentication is unavailable.');
    if (generation !== connectionGeneration) return;

    // A presentation tunnel provides a separate public hostname for Reverb.
    // On a normal LAN, the backend leaves `host` empty and we reuse the API
    // hostname so physical devices can still connect to the local server.
    const apiHost = new URL(getApiBaseUrl()).hostname;
    const reverbHost = config.host || apiHost;
    const useTls = config.scheme === 'https';
    connectedUserId = Number(me.user_id);

    const nextPusher = new PusherConstructor(config.app_key, {
      cluster: 'mt1',
      wsHost: reverbHost,
      wsPort: Number(config.port),
      wssPort: Number(config.port),
      forceTLS: useTls,
      enabledTransports: useTls ? ['wss'] : ['ws'],
      channelAuthorization: {
        transport: 'ajax',
        endpoint: `${getApiBaseUrl()}/broadcasting/auth`,
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      },
    });

    if (generation !== connectionGeneration) {
      nextPusher.disconnect();
      return;
    }

    pusher = nextPusher;
    pusher.connection.bind('error', (error: any) => {
      scheduleReconnect(error?.error?.data?.message ?? error?.error?.message ?? 'connection error');
    });
    pusher.connection.bind('disconnected', () => scheduleReconnect('connection disconnected'));

    channel = pusher.subscribe(`private-user.${connectedUserId}`);
    channel.bind('pusher:subscription_succeeded', () => {
      isSubscribed = true;
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
    });
    channel.bind('pusher:subscription_error', (error: any) => {
      isSubscribed = false;
      scheduleReconnect(error?.error ?? error?.message ?? 'private-channel authorization failed');
    });
    channel.bind('notification.created', (payload: any) => emit({ type: 'notification.created', payload }));
    channel.bind('chat.message.created', (payload: any) => emit({ type: 'chat.message.created', payload }));
  })().finally(() => {
    connecting = null;
  });

  return connecting;
}

/** Subscribe a mounted screen to this account's private Reverb channel. */
export function subscribeToRealtime(listener: Listener): () => void {
  listeners.add(listener);
  connect().catch((error) => {
    console.warn('Realtime connection unavailable:', error?.message ?? error);
    scheduleReconnect(error?.message);
  });

  return () => {
    listeners.delete(listener);
  };
}

/** Call on sign-out so a later account cannot receive the prior account's events. */
export function disconnectRealtime(): void {
  connectionGeneration += 1;
  listeners.clear();
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = null;
  clearConnection();
}
