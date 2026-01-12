import { MessageResponse } from './constants';

// Send message to popup if it's open; ignores the absence of listeners.
export async function broadcastToPopup(message: MessageResponse) {
	try {
		chrome.runtime.sendMessage(message, () => {
			// Ignore errors when popup is closed.
			if (chrome.runtime.lastError) {
				return;
			}
		});
	} catch {
		// No popup open, that's fine.
	}
}
