import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Pencil, Trash2, Search, X, Plus } from 'lucide-react';
import { leadsApi } from '../api/leads.js';
import useAsync from '../hooks/useAsync.js';
import { useToast } from '../components/Toast.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Pagination from '../components/Pagination.jsx';
import { EmptyState, ErrorMessage, Loader } from '../components/Feedback.jsx';
import { LEAD_STATUSES } from '../constants.js';
import { formatCurrency, formatDate, formatPhone, formatRelativeTime } from '../utils/format.js';

const NOTES_PAGE_SIZE = 5;

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const notify = useToast();
  const { data: lead, error, loading, reload, setData } = useAsync((signal) => leadsApi.get(id, signal), [id]);

  const [statusSaving, setStatusSaving] = useState(false);
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteSearch, setNoteSearch] = useState('');
  const [page, setPage] = useState(1);

  if (loading && !lead) return <Loader />;
  if (error && !lead) {
    return (
      <>
        <Link to="/leads" className="text-xs text-slate-500 dark:text-slate-400 hover:text-blue-900 dark:hover:text-blue-400 inline-block mb-2">
          ← Back to leads
        </Link>
        <ErrorMessage error={error} onRetry={error.status === 404 ? undefined : reload} />
      </>
    );
  }
  if (!lead) return null;

  const filteredNotes = lead.notes.filter((n) =>
    n.content.toLowerCase().includes(noteSearch.trim().toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredNotes.length / NOTES_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedNotes = filteredNotes.slice(
    (currentPage - 1) * NOTES_PAGE_SIZE,
    currentPage * NOTES_PAGE_SIZE
  );

  // Filter notes by search query
  const handleSearchChange = (e) => {
    setNoteSearch(e.target.value);
    setPage(1);
  };

  // Reset note search input
  const clearSearch = () => {
    setNoteSearch('');
    setPage(1);
  };

  // Update lead pipeline status
  const changeStatus = async (status) => {
    if (status === lead.status || statusSaving) return;
    setStatusSaving(true);
    try {
      const updated = await leadsApi.updateStatus(id, status);
      setData((prev) => ({ ...prev, ...updated }));
      notify(`Status changed to ${status}`);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setStatusSaving(false);
    }
  };

  // Add a new note to the lead's activity timeline
  const addNote = async (e) => {
    e.preventDefault();
    const content = note.trim();
    if (!content) return setNoteError('Note cannot be empty');
    if (content.length > 2000) return setNoteError('Note must be at most 2000 characters');

    setNoteSaving(true);
    setNoteError('');
    try {
      const created = await leadsApi.addNote(id, content);
      setData((prev) => ({ ...prev, notes: [created, ...prev.notes] }));
      setNote('');
      setNoteSearch('');
      setPage(1);
    } catch (err) {
      setNoteError(err.details?.content || err.message);
    } finally {
      setNoteSaving(false);
    }
  };

  // Remove a note from the lead's timeline
  const removeNote = async (noteId) => {
    try {
      await leadsApi.removeNote(id, noteId);
      setData((prev) => ({ ...prev, notes: prev.notes.filter((n) => n.id !== noteId) }));
      const remaining = filteredNotes.filter((n) => n.id !== noteId);
      const nextTotalPages = Math.max(1, Math.ceil(remaining.length / NOTES_PAGE_SIZE));
      if (page > nextTotalPages) {
        setPage(nextTotalPages);
      }
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  // Delete lead record with confirmation
  const deleteLead = async () => {
    if (!window.confirm(`Delete lead "${lead.name}"? This cannot be undone.`)) return;
    try {
      await leadsApi.remove(id);
      notify('Lead deleted');
      navigate('/leads');
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const details = [
    ['Phone', <a href={`tel:+91${lead.phone}`} className="text-blue-900 dark:text-blue-400 hover:underline">{formatPhone(lead.phone)}</a>],
    ['Budget', formatCurrency(lead.budget)],
    ['Location', lead.location],
    ['Property type', lead.propertyType],
    ['Source', lead.source],
    ['Created', formatDate(lead.createdAt, true)],
    ['Last updated', formatDate(lead.updatedAt, true)],
  ];

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
          <div className="flex items-center gap-3.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {lead.name}
            </h1>
            <StatusBadge status={lead.status} />
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Lead #{lead.id} · Captured via {lead.source}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to={`/leads/${id}/edit`} className="btn">
            <Pencil size={15} strokeWidth={2} />
            Edit Lead
          </Link>
          <button type="button" className="btn btn-danger" onClick={deleteLead}>
            <Trash2 size={15} strokeWidth={2} />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        <div className="lg:col-span-5 flex flex-col gap-6">
          <section className="card">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Buyer Profile</h2>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Details</span>
            </div>
            <dl className="divide-y divide-slate-100 dark:divide-slate-800/80 m-0">
              {details.map(([label, value]) => (
                <div key={label} className="flex justify-between items-center gap-4 py-3 text-sm">
                  <dt className="text-slate-500 dark:text-slate-400 text-xs font-medium">{label}</dt>
                  <dd className="font-semibold text-slate-900 dark:text-white text-right break-words">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="card">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Pipeline Stage</h2>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Change Status</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5" role="radiogroup" aria-label="Lead status">
              {LEAD_STATUSES.map((s, i) => {
                const currentIdx = LEAD_STATUSES.indexOf(lead.status);
                const isActive = lead.status === s;
                const isDone = i < currentIdx;
                return (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'border-blue-900 bg-blue-50 text-blue-900 dark:border-blue-500 dark:bg-blue-950/70 dark:text-blue-300 font-semibold shadow-sm'
                        : 'border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-[#101726] text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                    onClick={() => changeStatus(s)}
                    disabled={statusSaving}
                  >
                    <span
                      className={`w-6 h-6 rounded-full text-[11px] font-bold grid place-items-center transition-colors ${
                        isActive
                          ? 'bg-blue-900 text-white dark:bg-blue-600'
                          : isDone
                          ? 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {isDone ? '✓' : i + 1}
                    </span>
                    <span className="truncate w-full text-center">{s}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <section className="card lg:col-span-7 flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Notes &amp; Activity Log</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Interaction history and follow-up updates</p>
            </div>
            {lead.notes.length > 0 && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {noteSearch.trim()
                  ? `${filteredNotes.length} of ${lead.notes.length}`
                  : `${lead.notes.length} note${lead.notes.length === 1 ? '' : 's'}`}
              </span>
            )}
          </div>

          <form onSubmit={addNote} className="mb-5" noValidate>
            <textarea
              rows={3}
              placeholder="Record a call summary, property preferences, or site visit feedback…"
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                if (noteError) setNoteError('');
              }}
              aria-invalid={Boolean(noteError)}
              maxLength={2000}
              className="w-full text-sm text-slate-900 dark:text-slate-100 px-3.5 py-2.5 rounded-xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-[#101726] focus:outline-none focus:border-blue-900 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-y placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm transition-all"
            />
            <div className="flex justify-between items-center mt-2.5">
              <span className={noteError ? 'text-xs text-red-600 dark:text-red-400 font-medium' : 'text-xs text-slate-400 dark:text-slate-500'}>
                {noteError || `${note.length}/2000 characters`}
              </span>
              <button type="submit" className="btn btn-primary btn-sm flex items-center gap-1.5" disabled={noteSaving || !note.trim()}>
                {noteSaving ? (
                  'Adding…'
                ) : (
                  <>
                    <Plus size={13} strokeWidth={2.5} />
                    Add Note
                  </>
                )}
              </button>
            </div>
          </form>

          {lead.notes.length > 0 && (
            <div className="relative mb-4 flex items-center w-full">
              <span className="absolute left-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Search size={15} strokeWidth={2} />
              </span>
              <input
                type="search"
                className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-[#101726] focus:outline-none focus:border-blue-900 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm transition-all"
                placeholder="Search notes history…"
                value={noteSearch}
                onChange={handleSearchChange}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') clearSearch();
                }}
                aria-label="Search notes"
              />
              {noteSearch && (
                <button
                  type="button"
                  className="absolute right-3 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer bg-transparent border-0 p-0 flex items-center justify-center"
                  onClick={clearSearch}
                  aria-label="Clear search"
                  title="Clear search"
                >
                  <X size={14} strokeWidth={2} />
                </button>
              )}
            </div>
          )}

          <div className="flex flex-col">
            {lead.notes.length === 0 ? (
              <EmptyState title="No notes recorded yet">
                Log calls, meetings, and property follow-ups above.
              </EmptyState>
            ) : filteredNotes.length === 0 ? (
              <div className="text-center py-8 px-4 text-slate-500 dark:text-slate-400 flex flex-col items-center gap-2">
                <strong className="text-slate-900 dark:text-slate-100 font-semibold">No matching notes found</strong>
                <span className="text-xs">No notes match &ldquo;{noteSearch}&rdquo;</span>
                <button type="button" className="btn btn-sm mt-2" onClick={clearSearch}>
                  Clear search
                </button>
              </div>
            ) : (
              <>
                <ul className="flex flex-col gap-3 list-none p-0 m-0">
                  {paginatedNotes.map((n) => (
                    <li
                      key={n.id}
                      className="bg-slate-50/70 dark:bg-[#0f172a]/70 border border-slate-200/70 dark:border-slate-800/80 rounded-xl p-4 text-sm shadow-sm transition-all hover:border-slate-300 dark:hover:border-slate-700/80"
                    >
                      <p className="mb-2 text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words text-sm leading-relaxed">
                        {n.content}
                      </p>
                      <div className="flex justify-between items-center text-xs text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                        <span>{formatDate(n.createdAt, true)} ({formatRelativeTime(n.createdAt)})</span>
                        <button
                          type="button"
                          className="link-btn hover:underline"
                          onClick={() => removeNote(n.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-4">
                  <Pagination
                    page={currentPage}
                    totalPages={totalPages}
                    total={filteredNotes.length}
                    limit={NOTES_PAGE_SIZE}
                    onChange={setPage}
                  />
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
