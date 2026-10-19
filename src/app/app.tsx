import React from 'react';
import { createRoot } from 'react-dom/client';
import Popup from './popup/popup';
import { getJwt } from '../shared/api';
import { initStore } from '../utils/store.util';
import '../styles/globals.scss';

const boot = async () => {
	const rootElement = document.getElementById('root');
	if (!rootElement) {
		console.error('Root element not found');
		return;
	}

	// Wake the service worker so it can clear tasks orphaned by a restart
	chrome.runtime.sendMessage({ type: 'PING' }).catch(() => undefined);

	// Load storage and auth before the first render so cached results show
	// immediately instead of flashing an empty/signed-out state.
	const [jwt] = await Promise.all([
		getJwt().catch(error => {
			console.error('Failed to read ITFin session:', error);
			return null;
		}),
		initStore().catch(error =>
			console.error('Failed to load storage:', error)
		),
	]);

	createRoot(rootElement).render(
		<React.StrictMode>
			<Popup jwt={jwt} />
		</React.StrictMode>
	);
};

boot();
