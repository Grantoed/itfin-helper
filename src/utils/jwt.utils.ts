export const checkJWT = () => {
	chrome.cookies?.get(
		{ url: 'https://keenethics.itfin.io/', name: 'itfin-jwt' },
		function (cookie) {
			if (cookie) {
				chrome.storage.local.set({ authToken: cookie.value });
			} else {
				chrome.storage.local.remove('authToken');
			}
		}
	);
};

// Fetch token from Chrome storage
export const getJWT = async () => {
	return new Promise<{ authToken?: string }>(resolve => {
		chrome.storage.local.get(['authToken'], result => resolve(result));
	});
};
