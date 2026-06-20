import { useState, useEffect, useCallback } from 'react';
import { getJobs } from '../api/jobs.api';

export function useJobs(filters = {}) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const key = JSON.stringify(filters);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getJobs(JSON.parse(key));
      setJobs(data.data);
    } catch {
      // interceptor surfaces the error
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return { jobs, loading, refetch: fetchJobs };
}
