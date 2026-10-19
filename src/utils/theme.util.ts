import { PREF_KEYS } from '../shared/constants';
import { getStorageValue } from './store.util';

export type Theme = 'dark' | 'light';

// The saved choice, or the system preference until one is made
export const resolveTheme = (saved?: Theme): Theme =>
	saved ??
	(window.matchMedia?.('(prefers-color-scheme: light)').matches
		? 'light'
		: 'dark');

export const applyTheme = (theme: Theme) => {
	document.documentElement.dataset.theme = theme;
};

export const applySavedTheme = () =>
	applyTheme(resolveTheme(getStorageValue<Theme>(PREF_KEYS.THEME)));
