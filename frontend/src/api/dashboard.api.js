import client from './client';

export const getDashboard = () => client.get('/dashboard');

export const getTrends = () => client.get('/dashboard/trends');
