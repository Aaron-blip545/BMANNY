import { useCallback, useEffect, useState } from 'react';

export type Appearance = 'light' | 'dark' | 'system';

const prefersDark = () => {
    if (typeof window === 'undefined') {
        return false;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const applyTheme = (appearance: Appearance) => {
    if (typeof document === 'undefined') {
        return;
    }

    const isDark = appearance === 'dark' || (appearance === 'system' && prefersDark());

    document.documentElement.classList.toggle('dark', isDark);
};

const mediaQuery = () => {
    if (typeof window === 'undefined') {
        return null;
    }

    return window.matchMedia('(prefers-color-scheme: dark)');
};

const handleSystemThemeChange = () => {
    const currentAppearance = (localStorage.getItem('appearance') as Appearance | null) || 'light';
    applyTheme(currentAppearance);
};

export function initializeTheme() {
    if (typeof window === 'undefined') {
        return;
    }

    const savedAppearance = (localStorage.getItem('appearance') as Appearance | null) || 'light';
    applyTheme(savedAppearance);
    mediaQuery()?.addEventListener('change', handleSystemThemeChange);
}

export function useAppearance() {
    const [appearance, setAppearance] = useState<Appearance>('light');

    const updateAppearance = useCallback((mode: Appearance) => {
        setAppearance(mode);
        localStorage.setItem('appearance', mode);
        applyTheme(mode);
    }, []);

    useEffect(() => {
        const savedAppearance = (localStorage.getItem('appearance') as Appearance | null) || 'light';
        setAppearance(savedAppearance);
        applyTheme(savedAppearance);

        const mq = mediaQuery();
        mq?.addEventListener('change', handleSystemThemeChange);
        return () => mq?.removeEventListener('change', handleSystemThemeChange);
    }, []);

    return { appearance, updateAppearance } as const;
}
