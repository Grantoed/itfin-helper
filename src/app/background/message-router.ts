import { abortForScope } from './controllers';
import { ClearScope, MessageRequest } from './constants';
import { getCachedData, clearRequestState, clearStoredData } from './storage';
import { handleProjectIncomeRequest } from './requests/project-income';
import { handleWorkLogsRequest } from './requests/work-logs';
import { handleVacationsRequest } from './requests/vacations';

export function setupMessageListener() {
	chrome.runtime.onMessage.addListener(
		(message: MessageRequest, sender, sendResponse) => {
			(async () => {
				try {
					switch (message.type) {
						case 'FETCH_PROJECT_INCOME':
							handleProjectIncomeRequest(
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

			// Return true to indicate we will send a response asynchronously
			return true;
		}
	);
}
