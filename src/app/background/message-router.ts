import { abortForScope } from './controllers';
import { ClearScope, MessageRequest } from './constants';
import { getCachedData, clearRequestState, clearStoredData } from './storage';
import { handleProjectIncomeRequest } from './requests/project-income';
import { handleWorkLogsRequest } from './requests/work-logs';
import { handleVacationsRequest } from './requests/vacations';

export function setupMessageListener() {
	chrome.runtime.onMessage.addListener(
		(message: MessageRequest, _sender, sendResponse) => {
			(async () => {
				try {
					switch (message.type) {
						// IMPORTANT: handleProjectIncomeRequest is awaited so that
						// sendResponse is only called after the entire fetch completes.
						// Chrome's onMessage contract keeps the service worker alive as
						// long as a sendResponse call is pending (return true below), so
						// awaiting here prevents the SW from being terminated mid-fetch.
						case 'FETCH_PROJECT_INCOME':
							await handleProjectIncomeRequest(
								message.payload.jwt,
								message.payload.fromDate,
								message.payload.toDate
							);
							sendResponse({ success: true });
							break;

						case 'FETCH_WORK_LOGS':
							handleWorkLogsRequest(
								message.payload.jwt,
								message.payload.teamId,
								message.payload.fromDate,
								message.payload.toDate,
								message.payload.hideFreelancers
							);
							sendResponse({ success: true });
							break;

						case 'FETCH_VACATIONS':
							handleVacationsRequest(
								message.payload.jwt,
								message.payload.fromDate,
								message.payload.toDate,
								message.payload.filterType
							);
							sendResponse({ success: true });
							break;

						case 'GET_CACHED_DATA': {
							const cachedData = await getCachedData();
							sendResponse({ success: true, data: cachedData });
							break;
						}

						case 'CLEAR_REQUEST_STATE':
							await clearRequestState();
							sendResponse({ success: true });
							break;

						case 'CLEAR_ALL_DATA': {
							const scope: ClearScope = message.payload?.scope || 'all';
							abortForScope(scope);
							await clearStoredData(scope);
							sendResponse({ success: true });
							break;
						}

						default:
							sendResponse({ success: false, error: 'Unknown message type' });
					}
				} catch (error: any) {
					sendResponse({ success: false, error: error.message });
				}
			})();

			// Returning true keeps the message channel open so sendResponse can
			// be called asynchronously. This also signals Chrome to keep the
			// service worker alive until sendResponse fires.
			return true;
		}
	);
}
