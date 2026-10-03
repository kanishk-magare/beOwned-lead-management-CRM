import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, PanelLeftClose, PanelLeftOpen, ChevronRight } from 'lucide-react';
import ThemeToggle from './ThemeToggle.jsx';
import BeownedLogo from './BeownedLogo.jsx';

function getBreadcrumb(pathname) {
  if (pathname === '/dashboard' || pathname === '/') {
    return [{ label: 'Dashboard', path: '/dashboard' }];
  }
  if (pathname === '/leads') {
    return [{ label: 'Leads', path: '/leads' }];
  }
  if (pathname === '/leads/new') {
    return [
      { label: 'Leads', path: '/leads' },
      { label: 'New Lead' },
    ];
  }
  if (pathname.endsWith('/edit')) {
    return [
      { label: 'Leads', path: '/leads' },
      { label: 'Edit Lead' },
    ];
  }
  if (pathname.startsWith('/leads/')) {
    return [
      { label: 'Leads', path: '/leads' },
      { label: 'Lead Details' },
    ];
  }
  return [{ label: 'Overview' }];
}

export default function Layout() {
  const location = useLocation();
  const breadcrumbs = getBreadcrumb(location.pathname);

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('beowned_crm_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('beowned_crm_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] dark:bg-[#0a0f1d] text-slate-900 dark:text-slate-100 font-sans antialiased">
      {/* Collapsible Left Sidebar */}
      <aside
        className={`sticky top-0 h-screen z-30 flex flex-col shrink-0 bg-white dark:bg-[#101726] border-r border-slate-200/80 dark:border-slate-800/80 select-none transition-all duration-300 ease-in-out ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
        aria-label="Main Navigation"
      >
        {/* Sidebar Brand Header */}
        <div
          className={`h-14 flex items-center border-b border-slate-200/70 dark:border-slate-800/70 transition-all ${
            collapsed ? 'justify-center px-0' : 'px-5'
          }`}
        >
          <NavLink
            to="/dashboard"
            className="flex items-center hover:no-underline min-w-0"
            title="beOwned CRM"
          >
            <BeownedLogo iconOnly={collapsed} />
          </NavLink>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="p-3 flex flex-col gap-1.5 flex-1">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                collapsed ? 'justify-center px-0' : ''
              } ${
                isActive
                  ? 'bg-blue-50/90 dark:bg-blue-950/60 text-blue-900 dark:text-blue-400 font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
              }`
            }
            title={collapsed ? 'Dashboard' : undefined}
            aria-label="Dashboard"
          >
            <span className="w-5 h-5 inline-flex items-center justify-center shrink-0" aria-hidden="true">
              <LayoutDashboard size={19} strokeWidth={2} />
            </span>
            {!collapsed && <span className="truncate">Dashboard</span>}
          </NavLink>

          <NavLink
            to="/leads"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                collapsed ? 'justify-center px-0' : ''
              } ${
                isActive
                  ? 'bg-blue-50/90 dark:bg-blue-950/60 text-blue-900 dark:text-blue-400 font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
              }`
            }
            title={collapsed ? 'Leads' : undefined}
            aria-label="Leads"
          >
            <span className="w-5 h-5 inline-flex items-center justify-center shrink-0" aria-hidden="true">
              <Users size={19} strokeWidth={2} />
            </span>
            {!collapsed && <span className="truncate">Leads</span>}
          </NavLink>
        </nav>
      </aside>

      {/* Main Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar with single toggle and breadcrumb */}
        <header className="sticky top-0 z-20 bg-white/85 dark:bg-[#101726]/85 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-800/70 transition-colors">
          <div className="flex items-center justify-between h-14 px-4 sm:px-6 gap-3">
            <div className="flex items-center gap-2.5 min-w-0 max-w-fit">
              {/* The single, clear sidebar toggle button */}
              <button
                type="button"
                className="w-7 h-7 sm:w-8 sm:h-8 inline-flex items-center justify-center rounded-lg sm:rounded-xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-[#101726] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shrink-0 transition-all cursor-pointer shadow-sm"
                onClick={toggleSidebar}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? (
                  <PanelLeftOpen size={16} strokeWidth={2} />
                ) : (
                  <PanelLeftClose size={16} strokeWidth={2} />
                )}
              </button>

              {/* Breadcrumb Navigation - Compact width and spacing */}
              <nav aria-label="Breadcrumb" className="flex items-center text-xs sm:text-[13px] font-medium text-slate-500 dark:text-slate-400 min-w-0 truncate">
                {breadcrumbs.map((crumb, idx) => {
                  const isLast = idx === breadcrumbs.length - 1;
                  return (
                    <span key={crumb.label} className="inline-flex items-center min-w-0">
                      {idx > 0 && (
                        <ChevronRight className="mx-1 w-3 h-3 text-slate-300 dark:text-slate-600 shrink-0" strokeWidth={2} />
                      )}
                      {crumb.path && !isLast ? (
                        <NavLink to={crumb.path} className="hover:text-blue-900 dark:hover:text-blue-400 transition-colors truncate max-w-[90px] sm:max-w-none">
                          {crumb.label}
                        </NavLink>
                      ) : (
                        <span className={isLast ? 'text-slate-900 dark:text-slate-100 font-semibold truncate max-w-[140px] sm:max-w-xs' : 'truncate'}>
                          {crumb.label}
                        </span>
                      )}
                    </span>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-14 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
