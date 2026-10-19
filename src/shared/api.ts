import { API_BASE_URL, ITFIN_ORIGIN, JWT_COOKIE_NAME } from './constants';

// ITFin is slow: a projects-summary request routinely takes 1-2.5 minutes and
// team tracking ~30s, so only give up on requests that are clearly stuck.
const REQUEST_TIMEOUT_MS = 5 * 60_000;

export class ApiError extends Error {
	constructor(message: string, readonly status?: number) {
		super(message);
		this.name = 'ApiError';
	}
}

export const isAuthError = (error: unknown) =>
	error instanceof ApiError && (error.status === 401 || error.status === 403);

export const getJwt = async (): Promise<string | null> => {
	const cookie = await chrome.cookies.get({
		url: `${ITFIN_ORIGIN}/`,
		name: JWT_COOKIE_NAME,
	});
	return cookie?.value || null;
};

const messageForStatus = (status: number) => {
	if (status === 401 || status === 403) {
		return 'Your ITFin session has expired. Log in to ITFin and try again.';
	}
	if (status === 429) {
		return 'ITFin is rate limiting requests. Wait a minute and try again.';
	}
	if (status >= 500) {
		return `ITFin is having trouble right now (HTTP ${status}). Try again later.`;
	}
	return `ITFin request failed (HTTP ${status}).`;
};

// Authenticated GET against the ITFin API. Times out after 5 minutes and honours
// the caller's abort signal.
export async function apiGet<T>(
	path: string,
	jwt: string,
	signal?: AbortSignal
): Promise<T> {
	const controller = new AbortController();
	const abort = () => controller.abort();
	const timer = setTimeout(abort, REQUEST_TIMEOUT_MS);
	signal?.addEventListener('abort', abort);
	if (signal?.aborted) abort();

	try {
		const response = await fetch(`${API_BASE_URL}${path}`, {
			headers: { Authorization: jwt },
			credentials: 'include',
			signal: controller.signal,
		});

		if (!response.ok) {
			throw new ApiError(messageForStatus(response.status), response.status);
		}

		const result = await response.json();
		return result.data ?? result;
	} catch (error) {
		if (signal?.aborted) throw error;
		if (controller.signal.aborted) {
			throw new ApiError('ITFin took too long to respond. Try again.');
		}
		if (error instanceof TypeError) {
			throw new ApiError('Network error. Check your connection and try again.');
		}
		throw error;
	} finally {
		clearTimeout(timer);
		signal?.removeEventListener('abort', abort);
	}
}

// Runs async jobs with at most `limit` in flight, preserving result order.
export async function mapWithConcurrency<T, R>(
	items: T[],
	limit: number,
	fn: (item: T) => Promise<R>
): Promise<R[]> {
	const results = new Array<R>(items.length);
	let next = 0;
	const worker = async () => {
		while (next < items.length) {
			const index = next++;
			results[index] = await fn(items[index]);
		}
	};
	await Promise.all(
		Array.from({ length: Math.min(limit, items.length) }, worker)
	);
	return results;
}
