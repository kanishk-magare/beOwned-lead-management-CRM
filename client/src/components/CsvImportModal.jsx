import { useState, useRef, useEffect } from 'react';
import {
  Upload,
  X,
  Info,
  Download,
  FileSpreadsheet,
  Check,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { leadsApi } from '../api/leads.js';
import { useToast } from './Toast.jsx';

export default function CsvImportModal({ isOpen, onClose, onImportSuccess }) {
  const notify = useToast();
  const fileInputRef = useRef(null);
  const pollTimerRef = useRef(null);
  const downloadedRef = useRef(false);

  const [file, setFile] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState('idle'); // 'idle' | 'uploading' | 'processing' | 'completed' | 'failed'
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const handleReset = () => {
    stopPolling();
    setFile(null);
    setJobId(null);
    setStatus('idle');
    setResult(null);
    setError('');
    downloadedRef.current = false;
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Reset or clean up when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      handleReset();
    } else {
      stopPolling();
    }
  }, [isOpen]);

  // Clean up on component unmount
  useEffect(() => () => stopPolling(), []);

  const handleClose = () => {
    if (status === 'completed' && onImportSuccess) {
      onImportSuccess();
    }
    onClose();
  };

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.toLowerCase().endsWith('.csv')) {
      notify('Please select a valid .csv file', 'error');
      return;
    }
    setFile(selected);
    setError('');
  };

  const handleUpload = async () => {
    if (!file) return;

    setStatus('uploading');
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await leadsApi.uploadCsv(formData);
      const newJobId = res?.jobId || res?.data?.jobId;

      if (!newJobId) throw new Error('No job ID returned from server');

      setJobId(newJobId);
      setStatus('processing');
      startPolling(newJobId);
    } catch (err) {
      setStatus('failed');
      setError(err.message || 'Failed to upload CSV file');
    }
  };

  const startPolling = (id) => {
    stopPolling();

    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await leadsApi.getImportStatus(id);
        const data = res?.jobId || res?.status ? res : res?.data || res;
        if (!data) return;

        if (data.status === 'Completed') {
          stopPolling();
          setStatus('completed');
          setResult(data.result);

          const inserted = data.result?.insertedCount ?? data.result?.successCount ?? 0;
          notify(`${inserted} leads imported successfully!`);

          // Auto-download invalid CSV if errors occurred
          if (data.result?.invalidCount > 0 && !downloadedRef.current) {
            downloadedRef.current = true;
            downloadInvalidCsv(id);
          }

          if (onImportSuccess) onImportSuccess();
        } else if (data.status === 'Failed') {
          stopPolling();
          setStatus('failed');
          setError(data.error || 'Import failed during processing');
        }
      } catch (err) {
        stopPolling();
        setStatus('failed');
        setError(err.message || 'Error checking import status');
      }
    }, 800);
  };

  const downloadInvalidCsv = (id) => {
    const link = document.createElement('a');
    link.href = leadsApi.getInvalidCsvUrl(id);
    link.setAttribute('download', `invalid_leads_job_${id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isBusy = status === 'uploading' || status === 'processing';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs">
      <div
        className="bg-white dark:bg-[#111827] rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 grid place-items-center">
              <Upload size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                Import Leads via CSV
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bulk upload up to 500 leads with background processing
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isBusy}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-30 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Sample CSV helper */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#161f30] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Info size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Need the standard CSV format with required headers?</span>
            </div>
            <a
              href={leadsApi.getSampleCsvUrl()}
              download="sample_leads_template.csv"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700/60 shadow-xs transition-colors shrink-0"
            >
              <Download size={13} />
              Sample CSV
            </a>
          </div>

          {/* 1. File Selection */}
          {status === 'idle' && (
            <div>
              <label
                htmlFor="csv-file-input"
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                  file
                    ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20'
                    : 'border-slate-300 dark:border-slate-700 hover:border-blue-500 bg-slate-50/50 dark:bg-slate-900/30'
                }`}
              >
                <input
                  id="csv-file-input"
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 grid place-items-center mb-3 shadow-xs text-blue-600 dark:text-blue-400">
                  <FileSpreadsheet size={22} />
                </div>
                {file ? (
                  <div>
                    <p className="font-semibold text-sm text-slate-900 dark:text-white break-all">{file.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {(file.size / 1024).toFixed(1)} KB — Click to change file
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium text-sm text-slate-800 dark:text-slate-200">Click to choose CSV file</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Max 500 leads per import file (.csv)</p>
                  </div>
                )}
              </label>

              {error && (
                <div className="mt-3 p-3.5 rounded-xl text-xs bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60 whitespace-pre-line leading-relaxed">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* 2. Loading State */}
          {isBusy && (
            <div className="py-8 text-center space-y-4">
              <Loader2 size={36} className="animate-spin text-blue-600 dark:text-blue-400 mx-auto" />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {status === 'uploading' ? 'Uploading CSV file…' : 'Processing leads in background…'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Parsing in a worker thread. This only takes a moment…
                </p>
              </div>
            </div>
          )}

          {/* 3. Completed State */}
          {status === 'completed' && result && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-300 text-sm flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/60 grid place-items-center shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5">
                  <Check size={14} strokeWidth={2.5} />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-950 dark:text-emerald-200">
                    {result.insertedCount ?? result.successCount ?? 0} leads imported successfully
                  </h4>
                  <p className="text-xs text-emerald-800 dark:text-emerald-400 mt-0.5">
                    Processed {result.totalRows} row{result.totalRows === 1 ? '' : 's'} from your file.
                  </p>
                </div>
              </div>

              {result.invalidCount > 0 && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-300 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold flex items-center gap-1.5">
                      <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
                      {result.invalidCount} invalid row{result.invalidCount === 1 ? '' : 's'} skipped
                    </span>
                    <button
                      type="button"
                      onClick={() => downloadInvalidCsv(jobId)}
                      className="inline-flex items-center gap-1 font-bold text-amber-800 dark:text-amber-300 underline hover:no-underline cursor-pointer"
                    >
                      <Download size={12} strokeWidth={2.5} />
                      Download Invalid CSV
                    </button>
                  </div>
                  <p className="text-amber-800/80 dark:text-amber-400/90 text-[11px]">
                    The CSV report with failure reasons was automatically downloaded.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 4. Failed State */}
          {status === 'failed' && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-900 dark:text-red-300 text-sm flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/60 grid place-items-center shrink-0 text-red-600 dark:text-red-400 mt-0.5">
                <X size={14} strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-red-950 dark:text-red-200">Import Failed</h4>
                <div className="text-xs text-red-800 dark:text-red-400 mt-1.5 whitespace-pre-line leading-relaxed">
                  {error || 'An error occurred during CSV processing'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50/60 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
          {status === 'idle' && (
            <>
              <button type="button" className="btn btn-ghost" onClick={handleClose}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" disabled={!file} onClick={handleUpload}>
                <Upload size={15} />
                Upload & Import
              </button>
            </>
          )}

          {isBusy && (
            <button type="button" className="btn btn-primary" disabled>
              Processing…
            </button>
          )}

          {status === 'completed' && (
            <>
              <button type="button" className="btn btn-ghost" onClick={handleReset}>
                Import Another File
              </button>
              <button type="button" className="btn btn-primary" onClick={handleClose}>
                Done
              </button>
            </>
          )}

          {status === 'failed' && (
            <>
              <button type="button" className="btn btn-ghost" onClick={handleClose}>
                Close
              </button>
              <button type="button" className="btn btn-primary" onClick={handleReset}>
                Try Again
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
