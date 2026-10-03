import { Link } from 'react-router-dom';
import {
  RefreshCw,
  Users,
  CheckCircle2,
  IndianRupee,
  TrendingUp,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { dashboardApi } from '../api/leads.js';
import useAsync from '../hooks/useAsync.js';
import BarList from '../components/BarList.jsx';
import PieChart from '../components/PieChart.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { EmptyState, ErrorMessage, Loader } from '../components/Feedback.jsx';
import { formatBudget, formatDate, getInitials } from '../utils/format.js';

const STATUS_COLORS = {
  New: 'var(--c-new)',
  Contacted: 'var(--c-contacted)',
  'Site Visit': 'var(--c-visit)',
  Closed: 'var(--c-closed)',
};

// Main dashboard view displaying pipeline metrics, source distribution, and recent leads
export default function Dashboard() {
  const { data: stats, error, loading, reload } = useAsync(
    (signal) => dashboardApi.stats(signal),
    []
  );

  return (
    <>
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time pipeline metrics and lead performance overview
          </p>
        </div>
        <button type="button" className="btn" onClick={reload} disabled={loading}>
          <RefreshCw
            className={`w-4 h-4 text-slate-500 dark:text-slate-400 ${loading ? 'animate-spin' : ''}`}
            strokeWidth={2}
          />
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <ErrorMessage error={error} onRetry={reload} />

      {stats && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <StatCard
              label="Total leads"
              value={stats.totalLeads}
              hint={`${stats.newThisWeek} added this week`}
              icon={<Users size={18} strokeWidth={2} />}
              accent="blue"
            />
            <StatCard
              label="Conversion rate"
              value={`${stats.conversionRate}%`}
              hint={`${stats.closedLeads} of ${stats.totalLeads} closed`}
              icon={<CheckCircle2 size={18} strokeWidth={2} />}
              accent="emerald"
            />
            <StatCard
              label="Avg. budget"
              value={formatBudget(stats.averageBudget)}
              hint="Across all inquiries"
              icon={<IndianRupee size={18} strokeWidth={2} />}
              accent="purple"
            />
            <StatCard
              label="Closed value"
              value={formatBudget(stats.closedValue)}
              hint="Sum of closed deals"
              icon={<TrendingUp size={18} strokeWidth={2} />}
              accent="amber"
            />
          </div>

          {stats.totalLeads === 0 ? (
            <div className="card">
              <EmptyState title="No leads yet">
                <Link to="/leads/new" className="btn btn-primary btn-sm mt-3 inline-flex items-center gap-1.5">
                  <Plus size={14} strokeWidth={2.5} />
                  Add your first lead
                </Link>
              </EmptyState>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
              <section className="card">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Leads by source</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Acquisition channel breakdown</p>
                  </div>
                </div>
                <PieChart items={stats.leadsBySource} labelKey="source" />
              </section>

              <section className="card">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Status distribution</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Pipeline stage funnel</p>
                  </div>
                </div>
                <BarList
                  items={stats.statusDistribution}
                  labelKey="status"
                  colorFor={(s) => STATUS_COLORS[s]}
                />
              </section>

              <section className="card lg:col-span-2">
                <div className="flex items-baseline justify-between mb-5">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent leads</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Latest captured buyer enquiries</p>
                  </div>
                  <Link
                    to="/leads"
                    className="text-xs font-semibold text-blue-900 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 group"
                  >
                    View all leads
                    <ArrowRight size={13} strokeWidth={2} className="transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
                <ul className="divide-y divide-slate-100 dark:divide-slate-800/80 list-none p-0 m-0">
                  {stats.recentLeads.map((l) => {
                    const initials = getInitials(l.name);

                    return (
                      <li key={l.id} className="py-3 px-2 -mx-2 rounded-xl hover:bg-slate-200/80 dark:hover:bg-slate-800/80 transition-colors">
                        <Link to={`/leads/${l.id}`} className="flex items-center justify-between gap-4 group">
                          <div className="flex items-center gap-3.5 min-w-0">
                            <span className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/70 border border-blue-100 dark:border-blue-900/60 text-blue-900 dark:text-blue-400 text-xs font-bold grid place-items-center shrink-0">
                              {initials}
                            </span>
                            <div className="min-w-0">
                              <strong className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-900 dark:group-hover:text-blue-400 transition-colors truncate block">
                                {l.name}
                              </strong>
                              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <span>{l.source}</span>
                                <span>·</span>
                                <span className="font-medium text-slate-700 dark:text-slate-300">{formatBudget(l.budget)}</span>
                                <span>·</span>
                                <span>{formatDate(l.createdAt)}</span>
                              </span>
                            </div>
                          </div>
                          <div className="shrink-0">
                            <StatusBadge status={l.status} />
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </div>
          )}
        </>
      )}
    </>
  );
}

function StatCard({ label, value, hint, icon, accent = 'blue' }) {
  const accentStyles = {
    blue: 'bg-blue-50/80 text-blue-900 border-blue-200/60 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-900/60',
    emerald: 'bg-emerald-50/80 text-emerald-900 border-emerald-200/60 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-900/60',
    purple: 'bg-purple-50/80 text-purple-900 border-purple-200/60 dark:bg-purple-950/60 dark:text-purple-400 dark:border-purple-900/60',
    amber: 'bg-amber-50/80 text-amber-900 border-amber-200/60 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-900/60',
  };

  return (
    <div className="card flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700/80">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {label}
        </span>
        {icon && (
          <span className={`w-8 h-8 rounded-xl border grid place-items-center shrink-0 ${accentStyles[accent] || accentStyles.blue}`}>
            {icon}
          </span>
        )}
      </div>
      <div className="mt-3">
        <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {value}
        </span>
        {hint && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}
