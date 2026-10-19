// In-memory mirror of chrome.storage.local for the popup.
//
// The whole storage area is read once before the first render (initStore), so
// components render cached results synchronously with no loading flash.
// chrome.storage.onChanged keeps the mirror current; components subscribe via
// useStorageValue.
import { useSyncExternalStore } from 'react';

type Snapshot = Record<string, unknown>;

let snapshot: Snapshot = {};
const listeners = new Set<() => void>();

const emit = () => listeners.forEach(listener => listener());

const subscribe = (listener: () => void) => {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
};

export async function initStore() {
	// Changes that land while the initial read is in flight are newer than it
	const changedDuringInit = new Set<string>();
	let initialized = false;

	chrome.storage.onChanged.addListener((changes, area) => {
		if (area !== 'local') return;
		const next = { ...snapshot };
		for (const [key, change] of Object.entries(changes)) {
			if (!initialized) changedDuringInit.add(key);
			if ('newValue' in change) next[key] = change.newValue;
			else delete next[key];
		}
		snapshot = next;
		emit();
	});

	const stored = await chrome.storage.local.get(null);
	for (const key of changedDuringInit) delete stored[key];
	snapshot = { ...snapshot, ...stored };
	initialized = true;
	emit();
}

export const getStorageValue = <T>(key: string): T | undefined =>
	snapshot[key] as T | undefined;

export const setStorageValue = (key: string, value: unknown) => {
	// Update the mirror right away so controlled inputs don't lag a frame
	snapshot = { ...snapshot, [key]: value };
	emit();
	chrome.storage.local
		.set({ [key]: value })
		.catch(error => console.error(`Failed to save ${key}:`, error));
};

export function useStorageValue<T>(key: string): T | undefined {
	return useSyncExternalStore(subscribe, () => snapshot[key] as T | undefined);
}

// Like useState, but persisted in chrome.storage.local
export function usePersistentState<T>(
	key: string,
	defaultValue: T
): [T, (value: T) => void] {
	const stored = useStorageValue<T>(key);
	return [stored ?? defaultValue, value => setStorageValue(key, value)];
}
