import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import JobForm from '@/components/jobs/JobForm';
import { createJob } from '@/api/jobs.api';
import { toast } from '@/components/ui/toast';

export default function CreateJobPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (body) => {
    setSubmitting(true);
    try {
      await createJob(body);
      toast({ title: 'Job created', variant: 'success' });
      navigate('/jobs');
    } catch {
      // interceptor surfaces the error; just stop the spinner
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <Link
        to="/jobs"
        className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to jobs
      </Link>
      <h1 className="mb-6 text-3xl font-bold text-foreground">Create Job</h1>
      <div className="max-w-2xl">
        <JobForm onSubmit={handleSubmit} submitting={submitting} />
      </div>
    </div>
  );
}
