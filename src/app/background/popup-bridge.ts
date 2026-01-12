// Keep an open channel for popup-driven updates if needed later.
export function setupPopupBridge() {
	chrome.runtime.onConnect.addListener(port => {
		port.onMessage.addListener(() => {
			// Reserved for future popup-side messages; currently no-op.
		});
	});
}
