// Background service worker entry point. Modules under `./background` do the
// actual work; this file just boots them.
import { setupMessageListener } from './background/message-router';
import { migrateLegacyStorage } from './background/migrations';

setupMessageListener();

chrome.runtime.onInstalled.addListener(() => {
	migrateLegacyStorage().catch(error =>
		console.error('Failed to migrate storage:', error)
	);
});
