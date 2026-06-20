import client from './client';

// Job + execution endpoints.
// Job routes are wrapped in { success, data }; execution routes return raw.

export const getJobs = (params) => client.get('/jobs', { params });

export const getJob = (id) => client.get(`/jobs/${id}`);

export const createJob = (data) => client.post('/jobs', data);

export const updateJob = (id, data) => client.put(`/jobs/${id}`, data);

export const deleteJob = (id) => client.delete(`/jobs/${id}`);

export const pauseJob = (id) => client.patch(`/jobs/${id}/pause`);

export const resumeJob = (id) => client.patch(`/jobs/${id}/resume`);

export const getCronPreview = (expression) =>
  client.get('/jobs/cron-preview', { params: { expression } });

export const getExecutions = (jobId) =>
  client.get('/executions', { params: { jobId } });

export const retryExecution = (executionId) =>
  client.post(`/executions/${executionId}/retry`);
