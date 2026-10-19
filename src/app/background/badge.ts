import type { TaskScope } from '../../shared/tasks';

// Toolbar icon badge. Fetches can take minutes, so the icon shows "…" while
// any task runs and, once the popup was closed, "✓" or "!" when one ends.
// Opening the popup clears finished marks.

type Outcome = 'done' | 'error';

const BADGES = {
	error: { text: '!', color: '#cb4839' }, // ITFin danger
	running: { text: '…', color: '#464a53' }, // ITFin secondary
	done: { text: '✓', color: '#10834e' }, // ITFin success
} as const;

const outcomes = new Map<TaskScope, Outcome>();
let runningCount = 0;

const isPopupOpen = async () => {
	// runtime.getContexts exists from Chrome 116
	if (!chrome.runtime.getContexts) return false;
	const contexts = await chrome.runtime.getContexts({
		contextTypes: [chrome.runtime.ContextType.POPUP],
	});
	return contexts.length > 0;
};

const render = async () => {
	const outcomeValues = Array.from(outcomes.values());
	const badge = outcomeValues.includes('error')
		? BADGES.error
		: runningCount > 0
		? BADGES.running
		: outcomeValues.includes('done')
		? BADGES.done
		: null;

	try {
		await chrome.action.setBadgeText({ text: badge?.text ?? '' });
		if (badge) {
			await chrome.action.setBadgeBackgroundColor({ color: badge.color });
			await chrome.action.setBadgeTextColor?.({ color: '#ffffff' });
		}
	} catch (error) {
		console.error('Failed to update badge:', error);
	}
};

export const badgeTaskStarted = (scope: TaskScope, running: number) => {
	outcomes.delete(scope);
	runningCount = running;
	return render();
};

export const badgeTaskEnded = async (
	scope: TaskScope,
	running: number,
	outcome: Outcome | null
) => {
	runningCount = running;
	outcomes.delete(scope);
	// The person is looking at the result already
	if (outcome && !(await isPopupOpen().catch(() => false))) {
		outcomes.set(scope, outcome);
	}
	return render();
};

export const clearFinishedBadges = () => {
	outcomes.clear();
	return render();
};
