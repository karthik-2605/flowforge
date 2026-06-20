import client from './client';

export const getWorkers = () => client.get('/workers');

export const getQueueStats = () => client.get('/workers/queue-stats');

export const getSystemHealth = () => client.get('/health/system');
