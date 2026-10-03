import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { leadsApi } from '../api/leads.js';
import useAsync from '../hooks/useAsync.js';
import useDebounce from '../hooks/useDebounce.js';
import { useToast } from '../components/Toast.jsx';
import { LEAD_SOURCES, LEAD_STATUSES, SORT_OPTIONS } from '../constants.js';
import { formatBudget, formatDate, formatPhone, getInitials } from '../utils/format.js';
import { Trash2, Upload, Download, Plus, Search } from 'lucide-react';
import StatusBadge from '../components/StatusBadge.jsx';
import Pagination from '../components/Pagination.jsx';
import { EmptyState, ErrorMessage, Loader } from '../components/Feedback.jsx';
import CsvImportModal from '../components/CsvImportModal.jsx';

const PAGE_SIZE = 10;

export default function LeadsList() {
  const navigate = useNavigate();
  const notify = useToast();
  const [params, setParams] = useSearchParams();

  const search = params.get('search') || '';
  const source = params.get('source') || '';
  const status = params.get('status') || '';
  const sort = params.get('sort') || 'date:desc';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const [sortBy, order] = sort.split(':');

  // Search box is local state, debounced into the URL
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebounce(searchInput);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleting, setDeleting] = useState(false);

  // CSV Import Modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Update query parameters in the URL for search, filters, sorting, and pagination
  const updateParams = (changes, resetPage = true) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (resetPage) next.delete('page');
    setParams(next, { replace: true });
  };

  useEffect(() => {
    if (debouncedSearch.trim() !== search) updateParams({ search: debouncedSearch.trim() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const { data, error, loading, reload } = useAsync(
    (signal) => leadsApi.list({ search, source, status, sortBy, order, page, limit: PAGE_SIZE }, signal),
    [search, source, status, sortBy, order, page]
  );

  const leads = data?.data || [];
  const pagination = data?.pagination;
  const hasFilters = Boolean(search || source || status);

  // Bulk selection calculations
  const visibleIds = leads.map((l) => l.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
  const someVisibleSelected = visibleIds.some((id) => selectedIds.includes(id));
  const isIndeterminate = someVisibleSelected && !allVisibleSelected;

  // Select or deselect all visible leads on the current page
  const handleSelectAll = () => {
    if (allVisibleSelected) {
      // Deselect all visible on this page
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      // Select all visible on this page
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  // Toggle selection for a single lead row
  const handleToggleRow = (id, e) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Delete selected leads with user confirmation
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0 || deleting) return;
    const count = selectedIds.length;
    const confirmMessage = `Are you sure you want to permanently delete ${count} selected lead${
      count === 1 ? '' : 's'
    }? This action cannot be undone.`;

    if (!window.confirm(confirmMessage)) return;

    setDeleting(true);
    try {
      await Promise.all(selectedIds.map((id) => leadsApi.remove(id)));
      notify(`${count} lead${count === 1 ? '' : 's'} deleted successfully`);
      setSelectedIds([]);
      reload();
    } catch (err) {
      notify(err.message || 'Failed to delete selected leads', 'error');
      reload();
    } finally {
      setDeleting(false);
    }
  };

  // Toggle table column sorting order (asc / desc)
  const toggleSort = (field) => {
    const nextOrder = sortBy === field && order === 'desc' ? 'asc' : 'desc';
    updateParams({ sort: `${field}:${nextOrder}` });
  };

  const sortIndicator = (field) => (sortBy === field ? (order === 'asc' ? ' ▲' : ' ▼') : '');

  // Reset all active search filters
  const clearFilters = () => {
    setSearchInput('');
    setParams(new URLSearchParams(), { replace: true });
  };

  const selectClass =
    'w-auto min-w-[140px] text-sm text-slate-800 dark:text-slate-200 px-3.5 py-2.5 rounded-xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-[#101726] focus:outline-none focus:border-blue-900 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-sm transition-all';

  return (
    <>
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Leads
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {pagination ? `${pagination.total} total buyer & investor inquiries` : 'All client leads'}
            {hasFilters && ' matching active filters'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <button
              type="button"
              className="btn btn-danger flex items-center gap-1.5"
              onClick={handleDeleteSelected}
              disabled={deleting}
              title={`Delete ${selectedIds.length} selected lead(s)`}
            >
              <Trash2 size={15} strokeWidth={2} aria-hidden="true" />
              {deleting ? 'Deleting…' : `Delete (${selectedIds.length})`}
            </button>
          )}
          <button
            type="button"
            className="btn flex items-center gap-1.5"
            onClick={() => setIsImportModalOpen(true)}
            title="Import Leads from CSV file"
          >
            <Upload size={15} strokeWidth={2} aria-hidden="true" />
            Import CSV
          </button>
          <a
            href={leadsApi.exportCsvUrl({ search, source, status, sortBy, order })}
            download="leads_export.csv"
            className="btn flex items-center gap-1.5 hover:no-underline"
            title={hasFilters ? 'Export filtered leads to CSV' : 'Export all leads to CSV'}
          >
            <Download size={15} strokeWidth={2} aria-hidden="true" />
            Export CSV
          </a>
          <Link to="/leads/new" className="btn btn-primary">
            <Plus size={16} strokeWidth={2.5} />
            Add Lead
          </Link>
        </div>
      </div>

      {/* Search & Filter Panel */}
      <div className="card p-3.5 sm:p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Search size={16} strokeWidth={2} />
          </span>
          <input
            type="search"
            className="w-full text-sm text-slate-900 dark:text-slate-100 pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-[#101726] focus:outline-none focus:border-blue-900 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm transition-all"
            placeholder="Search by name, location, phone…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search leads"
          />
        </div>
        <select value={source} onChange={(e) => updateParams({ source: e.target.value })} aria-label="Filter by source" className={selectClass}>
          <option value="">All sources</option>
          {LEAD_SOURCES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => updateParams({ status: e.target.value })} aria-label="Filter by status" className={selectClass}>
          <option value="">All statuses</option>
          {LEAD_STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select value={sort} onChange={(e) => updateParams({ sort: e.target.value })} aria-label="Sort leads" className={selectClass}>
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {hasFilters && (
          <button type="button" className="btn btn-ghost" onClick={clearFilters}>
            Reset
          </button>
        )}
      </div>

      {/* Bulk Selection Notification Bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between px-5 py-3 mb-5 bg-blue-50/90 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-900/60 rounded-2xl text-sm text-blue-900 dark:text-blue-300 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
            <span>
              <strong className="font-semibold">{selectedIds.length}</strong> lead
              {selectedIds.length === 1 ? '' : 's'} selected
            </span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <button
              type="button"
              className="text-xs font-semibold text-blue-800 dark:text-blue-400 underline hover:no-underline cursor-pointer"
              onClick={() => setSelectedIds([])}
            >
              Clear selection
            </button>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-danger flex items-center gap-1.5"
            onClick={handleDeleteSelected}
            disabled={deleting}
          >
            <Trash2 size={14} strokeWidth={2} aria-hidden="true" />
            {deleting ? 'Deleting…' : `Delete Selected (${selectedIds.length})`}
          </button>
        </div>
      )}

      <ErrorMessage error={error} onRetry={reload} />

      <div className="card p-0 overflow-hidden shadow-sm border border-slate-200/80 dark:border-slate-800/80">
        {loading && !data ? (
          <Loader />
        ) : leads.length === 0 && !error ? (
          <EmptyState title={hasFilters ? 'No leads match your search criteria' : 'No leads registered yet'}>
            {hasFilters ? (
              <button type="button" className="btn btn-sm mt-3" onClick={clearFilters}>
                Clear filters
              </button>
            ) : (
              <Link to="/leads/new" className="btn btn-primary btn-sm mt-3">
                + Add your first lead
              </Link>
            )}
          </EmptyState>
        ) : (
          <div className={`w-full transition-opacity ${loading ? 'opacity-60' : ''}`}>
            <table className="w-full text-left text-sm border-collapse table-fixed">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#0f172a]/70 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th className="w-10 sm:w-11 px-2 py-3.5 text-center">
                    <input
                      type="checkbox"
                      ref={(el) => {
                        if (el) el.indeterminate = isIndeterminate;
                      }}
                      checked={allVisibleSelected}
                      onChange={handleSelectAll}
                      aria-label="Select all visible leads"
                      className="w-4 h-4 rounded-md border-slate-300 dark:border-slate-600 text-blue-900 dark:text-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-[#101726] cursor-pointer transition-colors accent-blue-900 dark:accent-blue-500 align-middle"
                    />
                  </th>
                  <th className="px-3 sm:px-4 py-3.5 w-auto sm:w-[26%] lg:w-[22%]">Client &amp; Property</th>
                  <th className="px-3 sm:px-4 py-3.5 w-[26%] sm:w-[22%] lg:w-[18%]">Contact</th>
                  <th className="px-3 sm:px-4 py-3.5 w-[18%] sm:w-[14%] lg:w-[12%] whitespace-nowrap">
                    <button
                      type="button"
                      className="bg-transparent border-0 p-0 text-inherit font-inherit uppercase tracking-wider cursor-pointer hover:text-blue-900 dark:hover:text-blue-400 transition-colors"
                      onClick={() => toggleSort('budget')}
                    >
                      Budget{sortIndicator('budget')}
                    </button>
                  </th>
                  <th className="hidden md:table-cell px-3 sm:px-4 py-3.5 md:w-[16%] lg:w-[13%]">Location</th>
                  <th className="hidden lg:table-cell px-3 sm:px-4 py-3.5 lg:w-[11%]">Source</th>
                  <th className="px-3 sm:px-4 py-3.5 w-[18%] sm:w-[14%] lg:w-[12%] whitespace-nowrap">Status</th>
                  <th className="hidden sm:table-cell px-3 sm:px-4 py-3.5 sm:w-[12%] lg:w-[10%] whitespace-nowrap">
                    <button
                      type="button"
                      className="bg-transparent border-0 p-0 text-inherit font-inherit uppercase tracking-wider cursor-pointer hover:text-blue-900 dark:hover:text-blue-400 transition-colors"
                      onClick={() => toggleSort('date')}
                    >
                      Added{sortIndicator('date')}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {leads.map((lead) => {
                  const isSelected = selectedIds.includes(lead.id);
                  const initials = getInitials(lead.name);

                  return (
                    <tr
                      key={lead.id}
                      className={`cursor-pointer transition-all duration-150 focus:outline-none group ${
                        isSelected
                          ? 'bg-blue-100/90 dark:bg-blue-950/70 hover:bg-blue-200/90 dark:hover:bg-blue-900/80'
                          : 'hover:bg-slate-200/90 dark:hover:bg-slate-800 focus:bg-slate-200/90 dark:focus:bg-slate-800'
                      }`}
                      tabIndex={0}
                      onClick={() => navigate(`/leads/${lead.id}`)}
                      onKeyDown={(e) => e.key === 'Enter' && navigate(`/leads/${lead.id}`)}
                    >
                      <td
                        className="w-10 sm:w-11 px-2 py-3.5 text-center align-middle"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleToggleRow(lead.id, e)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Select ${lead.name}`}
                          className="w-4 h-4 rounded-md border-slate-300 dark:border-slate-600 text-blue-900 dark:text-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-[#101726] cursor-pointer transition-colors accent-blue-900 dark:accent-blue-500 align-middle"
                        />
                      </td>
                      <td className="px-3 sm:px-4 py-3.5 align-middle">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 group-hover:bg-blue-900 group-hover:text-white group-hover:border-blue-900 dark:group-hover:bg-blue-600 dark:group-hover:text-white dark:group-hover:border-blue-600 text-xs font-bold grid place-items-center shrink-0 transition-all">
                            {initials}
                          </span>
                          <div className="min-w-0 flex-1">
                            <strong className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-900 dark:group-hover:text-blue-400 block truncate text-sm transition-colors" title={lead.name}>
                              {lead.name}
                            </strong>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate" title={lead.propertyType}>
                              {lead.propertyType}
                            </div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate md:hidden" title={`${lead.location} · ${lead.source}`}>
                              {lead.location} · {lead.source}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-3.5 align-middle text-slate-700 dark:text-slate-300 min-w-0">
                        <div className="font-medium text-slate-800 dark:text-slate-200 text-xs sm:text-sm truncate" title={lead.phone}>
                          {formatPhone(lead.phone)}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate" title={lead.email}>
                          {lead.email}
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-3.5 align-middle whitespace-nowrap text-slate-900 dark:text-white font-semibold text-xs sm:text-sm">
                        {formatBudget(lead.budget)}
                      </td>
                      <td className="hidden md:table-cell px-3 sm:px-4 py-3.5 align-middle text-slate-700 dark:text-slate-300 text-xs sm:text-sm truncate" title={lead.location}>
                        {lead.location}
                      </td>
                      <td className="hidden lg:table-cell px-3 sm:px-4 py-3.5 align-middle text-slate-700 dark:text-slate-300 text-xs sm:text-sm truncate" title={lead.source}>
                        {lead.source}
                      </td>
                      <td className="px-3 sm:px-4 py-3.5 align-middle">
                        <StatusBadge status={lead.status} />
                      </td>
                      <td className="hidden sm:table-cell px-3 sm:px-4 py-3.5 align-middle whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(lead.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {pagination && (
          <Pagination
            {...pagination}
            onChange={(p) => updateParams({ page: p > 1 ? String(p) : '' }, false)}
          />
        )}
      </div>

      <CsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={() => {
          reload();
        }}
      />
    </>
  );
}
