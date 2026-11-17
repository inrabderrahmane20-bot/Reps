import { AsyncLocalStorage } from 'node:async_hooks';
export const securityContext = new AsyncLocalStorage<{requestId: string; actorId?: string; method: string; path: string}>();
