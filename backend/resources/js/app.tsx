import '../css/app.css';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { route as routeFn } from 'ziggy-js';
import { initializeTheme } from './hooks/use-appearance';
import { configureEcho } from '@laravel/echo-react';

type ReverbConfig = {
    app_key?: string;
    host?: string | null;
    port?: number;
    scheme?: string;
};

function configureRealtime(config: ReverbConfig) {
    if (config.app_key) {
        configureEcho({
            broadcaster: 'reverb',
            key: config.app_key,
            wsHost: config.host || window.location.hostname,
            wsPort: Number(config.port ?? 8080),
            wssPort: Number(config.port ?? 8080),
            forceTLS: (config.scheme ?? 'http') === 'https',
            enabledTransports: ['ws', 'wss'],
        });
        return;
    }

    configureEcho({ broadcaster: 'null' });
}

declare global {
    const route: typeof routeFn;
}

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

async function boot() {
    const fallback: ReverbConfig = {
        app_key: import.meta.env.VITE_REVERB_APP_KEY,
        host: import.meta.env.VITE_REVERB_HOST,
        port: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
        scheme: import.meta.env.VITE_REVERB_SCHEME ?? 'http',
    };

    try {
        const response = await fetch('/api/realtime/public-config');
        configureRealtime(response.ok ? await response.json() : fallback);
    } catch {
        configureRealtime(fallback);
    }

    createInertiaApp({
        title: (title) => `${title} - ${appName}`,
        resolve: (name) => resolvePageComponent([`./pages/${name}.tsx`, `./pages/${name}.jsx`], import.meta.glob(['./pages/**/*.tsx', './pages/**/*.jsx'])),
        setup({ el, App, props }) {
            const root = createRoot(el);

            root.render(<App {...props} />);
        },
        progress: {
            color: '#4B5563',
        },
    });
}

void boot();

// This will set light / dark mode on load...
initializeTheme();
