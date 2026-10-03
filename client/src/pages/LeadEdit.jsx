import { Link, useNavigate, useParams } from 'react-router-dom';
import LeadForm from '../components/LeadForm.jsx';
import { leadsApi } from '../api/leads.js';
import useAsync from '../hooks/useAsync.js';
import { useToast } from '../components/Toast.jsx';
import { ErrorMessage, Loader } from '../components/Feedback.jsx';

export default function LeadEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const notify = useToast();
  const { data: lead, error, loading, reload } = useAsync((signal) => leadsApi.get(id, signal), [id]);

  // Handle lead update form submission
  const handleSubmit = async (payload) => {
    await leadsApi.update(id, payload);
    notify('Lead updated');
    navigate(`/leads/${id}`);
  };

  return (
    <>
      <div className="flex items-end justify-between gap-4 mb-7 flex-wrap">
        <div>
          <Link
            to={`/leads/${id}`}
            className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-900 dark:hover:text-blue-400 inline-flex items-center gap-1.5 mb-2 group transition-colors"
          >
            <span className="transition-transform group-hover:-translate-x-0.5">←</span>
            Back to lead overview
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Edit Lead Details
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Update contact details, budget specifications, and property interests.
          </p>
        </div>
      </div>
      {loading && <Loader />}
      <ErrorMessage error={error} onRetry={error?.status === 404 ? undefined : reload} />
      {lead && !loading && (
        <LeadForm
          initialValues={{ ...lead, budget: String(lead.budget) }}
          onSubmit={handleSubmit}
          submitLabel="Save Changes"
          onCancel={() => navigate(`/leads/${id}`)}
        />
      )}
    </>
  );
}
