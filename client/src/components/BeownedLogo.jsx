export default function BeownedLogo({ iconOnly = false, className = '' }) {
  if (iconOnly) {
    return (
      <img
        src="/icon.svg"
        alt="beOwned CRM"
        className={`w-8 h-8 rounded-lg shrink-0 ${className}`}
      />
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <img
        src="/beownedLogo.svg"
        alt="beOwned"
        className="h-6 w-auto shrink-0 dark:hidden"
      />
      <img
        src="/beownedLogo-dark.svg"
        alt="beOwned"
        className="h-6 w-auto shrink-0 hidden dark:block"
      />
      <span className="text-[10px] font-extrabold tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-900/60 px-1.5 py-0.5 rounded uppercase shrink-0">
        CRM
      </span>
    </div>
  );
}
