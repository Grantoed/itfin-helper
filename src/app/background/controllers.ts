import { broadcastToPopup } from './messaging';
import { ClearScope } from './constants';

export type ControllerKey = Exclude<ClearScope, 'all'>;

const controllers: Record<ControllerKey, AbortController | null> = {
	projectIncome: null,
	workLogs: null,
	vacations: null,
};

export const hasActiveController = (scope: ControllerKey) => Boolean(controllers[scope]);

export const setController = (scope: ControllerKey, controller: AbortController) => {
	controllers[scope] = controller;
};

export const clearController = (scope: ControllerKey) => {
	controllers[scope] = null;
};

export function abortForScope(scope: ClearScope) {
	if (scope === 'all' || scope === 'projectIncome') {
		controllers.projectIncome?.abort();
		broadcastToPopup({
			type: 'PROJECT_INCOME_CANCELLED',
			success: false,
			error: 'Cancelled by user',
		});
		controllers.projectIncome = null;
	}
	if (scope === 'all' || scope === 'workLogs') {
		controllers.workLogs?.abort();
		broadcastToPopup({
			type: 'WORK_LOGS_CANCELLED',
			success: false,
			error: 'Cancelled by user',
		});
		controllers.workLogs = null;
	}
	if (scope === 'all' || scope === 'vacations') {
		controllers.vacations?.abort();
		broadcastToPopup({
			type: 'VACATIONS_CANCELLED',
			success: false,
			error: 'Cancelled by user',
		});
		controllers.vacations = null;
	}
}
