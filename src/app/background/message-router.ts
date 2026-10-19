import type { TaskMessage, TaskMessageResponse } from '../../shared/tasks';
import { cancelTask, clearTask, startTask } from './task-runner';

const handleMessage = async (message: TaskMessage) => {
	switch (message.type) {
		case 'START_TASK':
			return startTask(message.scope, message.params);
		case 'CANCEL_TASK':
			return cancelTask(message.scope);
		case 'CLEAR_TASK':
			return clearTask(message.scope);
		case 'PING':
			// Waking the worker is enough: booting clears orphaned tasks
			return;
		default:
			throw new Error('Unknown message type');
	}
};

export function setupMessageListener() {
	chrome.runtime.onMessage.addListener(
		(message: TaskMessage, sender, sendResponse) => {
			if (sender.id !== chrome.runtime.id) return false;

			handleMessage(message)
				.then(() => sendResponse({ success: true } as TaskMessageResponse))
				.catch((error: Error) =>
					sendResponse({ success: false, error: error.message })
				);

			// Keep the channel open for the async response
			return true;
		}
	);
}
