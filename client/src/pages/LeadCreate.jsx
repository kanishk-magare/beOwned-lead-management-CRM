import { Link, useNavigate } from 'react-router-dom';
import LeadForm from '../components/LeadForm.jsx';
import { leadsApi } from '../api/leads.js';
import { useToast } from '../components/Toast.jsx';

export default function LeadCreate() {
  const navigate = useNavigate();
  const notify = useToast();

  // Handle lead creation form submission
  const handleSubmit = async (payload) => {
    const lead = await leadsApi.create(payload);
    notify(`Lead "${lead.name}" created`);
    navigate(`/leads/${lead.id}`);
  };

  return (
    <>
      <div className="flex items-end justify-between gap-4 mb-7 flex-wrap">
        <div>
          <Link
            to="/leads"
            className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-900 dark:hover:text-blue-400 inline-flex items-center gap-1.5 mb-2 group transition-colors"
          >
            <span className="transition-transform group-hover:-translate-x-0.5">←</span>
            Back to all leads
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Register New Lead
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Capture a property enquiry and buyer requirements. All fields are required.
          </p>
        </div>
      </div>
      <LeadForm onSubmit={handleSubmit} submitLabel="Register Lead" onCancel={() => navigate('/leads')} />
    </>
  );
}
