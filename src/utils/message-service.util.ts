// Utility for communicating with background script

export interface MessageRequest {
	type: string;
	payload?: any;
}

export interface MessageResponse {
	type: string;
	success: boolean;
	data?: any;
	error?: string;
	progress?: string;
}

export class MessageService {
	private static listeners: Map<string, Set<(response: MessageResponse) => void>> =
		new Map();
	private static messageListenerSetUp = false;

	// Send message to background script
	static async sendMessage(
		type: string,
		payload?: any
	): Promise<MessageResponse> {
		return new Promise((resolve, reject) => {
			chrome.runtime.sendMessage({ type, payload }, response => {
				if (chrome.runtime.lastError) {
					reject(new Error(chrome.runtime.lastError.message));
				} else {
					resolve(response);
				}
			});
		});
	}

	// Listen for messages from background script
	static onMessage(
		type: string,
		callback: (response: MessageResponse) => void
	): () => void {
		if (!this.listeners.has(type)) {
			this.listeners.set(type, new Set());
		}
		this.listeners.get(type)!.add(callback);

		// Set up chrome message listener if not already set up
		if (!this.messageListenerSetUp) {
			this.messageListenerSetUp = true;
			chrome.runtime.onMessage.addListener(
				(message: MessageResponse, sender, sendResponse) => {
					const typeListeners = this.listeners.get(message.type);
					if (typeListeners) {
						typeListeners.forEach(cb => cb(message));
					}
					return false; // We don't need to send a response
				}
			);
		}

		// Return unsubscribe function
		return () => {
			const typeListeners = this.listeners.get(type);
			if (typeListeners) {
				typeListeners.delete(callback);
				if (typeListeners.size === 0) {
					this.listeners.delete(type);
				}
			}
		};
	}

	// Get cached data from storage
	static async getCachedData(): Promise<any> {
		try {
			const response = await this.sendMessage('GET_CACHED_DATA');
			return response.data || {};
		} catch (error) {
			console.error('Failed to get cached data:', error);
			// Fallback: try to get directly from storage
			try {
				const result = await chrome.storage.local.get([
					'projectIncome',
					'workLogs',
					'vacations',
					'requestState',
				]);
				return result;
			} catch (storageError) {
				console.error('Failed to get cached data from storage:', storageError);
				return {};
			}
		}
	}
}
