import { useEffect, useState } from 'react';

export type Appearance = 'light' | 'dark' | 'system';

// The staff portal uses one approved, light presentation.  Ignore any legacy
// browser preference saved while the experimental dark theme was available.
const applyTheme = () => {
    document.documentElement.classList.remove('dark');
};

export function initializeTheme() {
    localStorage.setItem('appearance', 'light');
    applyTheme();
}

export function useAppearance() {
    const [appearance, setAppearance] = useState<Appearance>('light');

    const updateAppearance = (_mode: Appearance) => {
        setAppearance('light');
        localStorage.setItem('appearance', 'light');
        applyTheme();
    };

    useEffect(() => {
        updateAppearance('light');
    }, []);

    return { appearance, updateAppearance };
}
