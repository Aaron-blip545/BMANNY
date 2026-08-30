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
const listeners = new Set<Listener>();

function emit(event: RealtimeEvent) {
  listeners.forEach((listener) => listener(event));
}

async function connect(): Promise<void> {
  if (pusher && channel) return;
  if (connecting) return connecting;

  const generation = connectionGeneration;
  connecting = (async () => {
    const [me, token, config] = await Promise.all([getMe(), getAuthToken(), getRealtimeConfig()]);
    if (!token || !config.app_key) throw new Error('Realtime authentication is unavailable.');
    if (generation !== connectionGeneration) return;

    const apiHost = new URL(getApiBaseUrl()).hostname;
    const useTls = config.scheme === 'https';
    connectedUserId = Number(me.user_id);

    pusher = new PusherConstructor(config.app_key, {
      cluster: 'mt1',
      wsHost: apiHost,
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

    channel = pusher.subscribe(`private-user.${connectedUserId}`);
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
  connect().catch((error) => console.warn('Realtime connection unavailable:', error.message));

  return () => {
    listeners.delete(listener);
  };
}

/** Call on sign-out so a later account cannot receive the prior account's events. */
export function disconnectRealtime(): void {
  connectionGeneration += 1;
  listeners.clear();
  if (channel) pusher?.unsubscribe(channel.name);
  pusher?.disconnect();
  channel = null;
  pusher = null;
  connectedUserId = null;
}
