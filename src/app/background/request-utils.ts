import { BASE_URL } from './constants';

// Helper function to make authenticated GET requests
export async function makeRequest<T>(
	path: string,
	jwt: string,
	signal?: AbortSignal
): Promise<T> {
	const response = await fetch(`${BASE_URL}${path}`, {
		method: 'GET',
		headers: {
			Authorization: jwt,
			'Content-Type': 'application/json',
		},
		credentials: 'include',
		signal,
	});

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	const result = await response.json();
	return result.data || result;
}
