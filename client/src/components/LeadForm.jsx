import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { LEAD_SOURCES, LEAD_STATUSES, PROPERTY_TYPES } from '../constants.js';
import { toPayload, validateLead } from '../utils/validateLead.js';
import { formatBudget } from '../utils/format.js';
import LocationSelector from './LocationSelector.jsx';

const EMPTY = {
  name: '',
  phone: '',
  email: '',
  budget: '',
  location: '',
  propertyType: '',
  source: '',
  status: 'New',
};

/**
 * Shared create/edit form. `onSubmit(payload)` should return a promise;
 * if it rejects with an ApiError carrying `details`, those are shown per field.
 */
export default function LeadForm({ initialValues, onSubmit, submitLabel = 'Save', onCancel }) {
  const [values, setValues] = useState({ ...EMPTY, ...initialValues });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Update form state on field change and trigger validation if touched
  const handleChange = (e) => {
    const { name, value } = e.target;
    const next = { ...values, [name]: value };
    setValues(next);
    if (touched[name]) setErrors((prev) => ({ ...prev, [name]: validateLead(next)[name] }));
  };

  // Mark field as touched on blur to trigger inline error messages
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((t) => ({ ...t, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateLead(values)[name] }));
  };

  // Validate form fields and submit lead data
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const validation = validateLead(values);
    setErrors(validation);
    setTouched(Object.fromEntries(Object.keys(EMPTY).map((k) => [k, true])));
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    try {
      await onSubmit(toPayload(values));
    } catch (err) {
      if (err.details) setErrors(err.details);
      setFormError(err.message || 'Could not save the lead');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (name) =>
    `w-full text-sm text-slate-900 dark:text-slate-100 px-4 py-2.5 rounded-xl border bg-white dark:bg-[#101726] transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm focus:outline-none ${
      errors[name]
        ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
        : 'border-slate-200/90 dark:border-slate-700/80 focus:border-blue-900 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-slate-300 dark:hover:border-slate-600'
    }`;

  const field = (name, label, input) => (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
        <span>{label}</span>
        <span className="text-red-500 text-xs">*</span>
      </label>
      {input}
      {errors[name] && (
        <span className="text-xs text-red-600 dark:text-red-400 mt-0.5 font-medium flex items-center gap-1" id={`${name}-error`}>
          <AlertCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
          {errors[name]}
        </span>
      )}
    </div>
  );

  const common = (name) => ({
    id: name,
    name,
    value: values[name],
    onChange: handleChange,
    onBlur: handleBlur,
    className: inputClass(name),
    'aria-invalid': Boolean(errors[name]),
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
  });

  return (
    <form className="card max-w-3xl p-6 sm:p-8" onSubmit={handleSubmit} noValidate>
      {formError && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl mb-6 text-sm bg-red-50/90 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900/60 shadow-sm" role="alert">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" strokeWidth={2} />
          {formError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
        {field('name', 'Full Name', <input type="text" placeholder="e.g. Aarav Sharma" autoFocus {...common('name')} />)}
        {field(
          'phone',
          'Phone Number',
          <input type="tel" placeholder="10-digit mobile, e.g. 9876543210" inputMode="tel" {...common('phone')} />
        )}
        {field('email', 'Email Address', <input type="email" placeholder="name@example.com" {...common('email')} />)}
        {field(
          'budget',
          'Budget (₹)',
          <>
            <input type="number" min="1" step="1" placeholder="e.g. 7500000" {...common('budget')} />
            {Number(values.budget) > 0 && !errors.budget && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/60 text-xs font-bold text-blue-900 dark:text-blue-300 mt-1 w-fit shadow-sm">
                Estimated: {formatBudget(values.budget)}
              </div>
            )}
          </>
        )}
        {field(
          'location',
          'Target Location / Sector',
          <LocationSelector
            {...common('location')}
            onChange={(val) => handleChange({ target: { name: 'location', value: val } })}
            placeholder="e.g. Bandra, Mumbai or Whitefield, Bangalore"
          />
        )}
        {field(
          'propertyType',
          'Property Type',
          <select {...common('propertyType')}>
            <option value="">Select Property Type…</option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        )}
        {field(
          'source',
          'Lead Source',
          <select {...common('source')}>
            <option value="">Select Channel…</option>
            {LEAD_SOURCES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        )}
        {field(
          'status',
          'Pipeline Status',
          <select {...common('status')}>
            {LEAD_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        )}
      </div>

      <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80">
        {onCancel && (
          <button type="button" className="btn" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary px-6" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
