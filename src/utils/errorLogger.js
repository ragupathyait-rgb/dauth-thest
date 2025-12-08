// Lightweight client for posting error logs to the backend

import { generateOpenApiToken } from "../lib/cryptoToken";

// Central function to post error payloads
export async function reportError({
	endpoint = '',
	message = '',
	error = '',
	userId = '',
	level = 'error',
	apps = 'DAuth-admin-portal',
	source = 'web',
	metadata = {},
}) {
	// Normalize timestamp to UTC for consistent server-side processing
	const occurredAtUtc = new Date().toISOString();
	const occurredAtUnixMs = Date.now();

	// Derive some non-breaking context when available (works in edge/client)
	const runtime = typeof window === 'undefined' ? 'edge/server' : 'browser';
	const url = (() => {
		try { return typeof window !== 'undefined' ? window.location?.href : undefined; } catch { return undefined; }
	})();
	const userAgent = (() => {
		try { return typeof navigator !== 'undefined' ? navigator.userAgent : undefined; } catch { return undefined; }
	})();

	// Defensive normalization for possibly-null inputs
	const safeEndpoint = endpoint ?? '';
	const safeMessage = message ?? '';
	const safeErrorString = toErrorString(error ?? '');
	const safeUserId = userId ?? '';

	// Remove null/undefined recursively from objects/arrays
	const removeNilDeep = (value) => {
		if (value === null || value === undefined) return undefined;
		if (Array.isArray(value)) {
			const cleaned = value.map(removeNilDeep).filter(v => v !== undefined);
			return cleaned;
		}
		if (typeof value === 'object') {
			const entries = Object.entries(value)
				.map(([k, v]) => [k, removeNilDeep(v)])
				.filter(([, v]) => v !== undefined);
			return Object.fromEntries(entries);
		}
		return value;
	};

	const payload = {
		source,
		apps,
		level,
		endpoint: safeEndpoint,
		message: safeMessage,
		error: safeErrorString,
		user_id: safeUserId || undefined,
		occurred_at_utc: occurredAtUtc,
		occurred_at_unix_ms: occurredAtUnixMs,
		metadata: {
			method: metadata.method || undefined,
			status: metadata.status ?? undefined,
			url: url || metadata.url || undefined,
			userAgent: userAgent || metadata.userAgent || undefined,
			runtime,
			...metadata,
		},
	};


	const sanitizedPayload = removeNilDeep(payload);

	try {
		const BASE_URL = import.meta.env.VITE_BASE_URL;
		const ERROR_LOG_URL = `${BASE_URL}/logs`;
		const token = await generateOpenApiToken();
		await fetch(ERROR_LOG_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(token && { 'x-api-token': `${token}` })
			},
			body: JSON.stringify(sanitizedPayload),
			keepalive: true,
		});
	} catch (error) {
		console.log(error)
		// Swallow to avoid secondary failures; logging errors must never crash the app
	}
}

// Helpers to serialize errors safely
export function toErrorString(err) {
	console.log(err, 'err')
	if (!err) return '';
	if (err instanceof Error) {
		return `${err.name}: ${err.message}${err.stack ? `\n${err.stack}` : ''}`;
	}
	if (typeof err === 'object') {
		try {
			return JSON.stringify(err);
		} catch {
			return String(err);
		}
	}
	return String(err);
}