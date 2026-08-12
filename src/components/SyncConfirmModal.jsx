import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, X } from 'lucide-react';

/**
 * SyncConfirmModal handles the confirmation before running a sync operation.
 * It displays side-by-side source and target configurations, allowing direction swap.
 */
export const SyncConfirmModal = ({
  isOpen,
  onClose,
  row,
  baseUrl1,
  baseUrl2,
  onConfirm
}) => {
  const [direction, setDirection] = useState('site1_to_site2'); // 'site1_to_site2' or 'site2_to_site1'
  const [confirmYes, setConfirmYes] = useState('');
  const [syncBy, setSyncBy] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reset inputs when modal opens/changes
  useEffect(() => {
    if (isOpen) {
      setConfirmYes('');
      setSyncBy('');
      setDirection('site1_to_site2');
      setSubmitting(false);
    }
  }, [isOpen, row]);

  if (!isOpen || !row) return null;

  // Resolve source and target variables based on selected sync direction
  const sourceTag = direction === 'site1_to_site2'
    ? (row.raw1?.tag || row.raw1?.tag_name || row.raw1?.module || row.tag || '')
    : (row.raw2?.tag || row.raw2?.tag_name || row.raw2?.module || row.tag || '');

  const targetTag = direction === 'site1_to_site2'
    ? (row.raw2?.tag || row.raw2?.tag_name || row.raw2?.module || row.tag || '')
    : (row.raw1?.tag || row.raw1?.tag_name || row.raw1?.module || row.tag || '');

  const sourceUrl = direction === 'site1_to_site2' ? baseUrl1 : baseUrl2;
  const targetUrl = direction === 'site1_to_site2' ? baseUrl2 : baseUrl1;

  const handleSwap = () => {
    setDirection((prev) => (prev === 'site1_to_site2' ? 'site2_to_site1' : 'site1_to_site2'));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (confirmYes.trim().toLowerCase() === 'yes' && syncBy.trim().length > 0) {
      setSubmitting(true);
      const sourceItem = direction === 'site1_to_site2' ? (row.raw1 || row) : (row.raw2 || row);
      try {
        await onConfirm(sourceItem, targetUrl, syncBy.trim());
      } catch (err) {
        console.error(err);
      } finally {
        setSubmitting(false);
        onClose();
      }
    }
  };

  const isFormValid = confirmYes.trim().toLowerCase() === 'yes' && syncBy.trim().length > 0;

  // Visual labels based on backend URLs
  const getSiteLabel = (url, isTarget = false) => {
    if (url.includes('.wcms.cloud')) {
      return 'Dev: ';
    }
    if (url.includes('.vectorflow.app')) {
      return 'Prod: ';
    }
    return isTarget ? 'Dev: ' : 'Prod: ';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 transition-all duration-300 animate-in fade-in duration-200">

      {/* Modal Card */}
      <div className="w-full max-w-[620px] bg-white rounded-xl shadow-2xl flex flex-col border border-gray-200 relative animate-in fade-in zoom-in-95 duration-200 overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 tracking-wider">Confirm Data Sync</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer outline-none"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-5">

          <p className="text-gray-600 text-sm font-medium text-left">
            Are you sure you want confirm data Sync?
          </p>

          {/* Site comparison side-by-side container */}
          <div className="border border-gray-200 rounded-lg p-4 bg-white flex flex-row items-center justify-between gap-3 relative shadow-xs">

            {/* Left Box (Source) */}
            <div className="flex-1 min-w-0 p-3 bg-gray-50/70 rounded-lg border border-gray-100 text-left">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                {getSiteLabel(sourceUrl, false)}
              </span>
              <mark className="bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-mono text-[11px] font-semibold ml-1">
                (tag: {sourceTag})
              </mark>
              <p className="mt-2 truncate">
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:underline text-xs font-medium break-all"
                  title={sourceUrl}
                >
                  {sourceUrl}
                </a>
              </p>
            </div>

            {/* Separator / Swap Action Center overlay */}
            <div className="w-10 flex-shrink-0 flex items-center justify-center relative h-12">
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <button
                  type="button"
                  onClick={handleSwap}
                  className="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center shadow-md hover:shadow-lg hover:border-[#820f4c] hover:text-[#820f4c] text-gray-500 transition-all cursor-pointer outline-none"
                  title="Swap Sync Direction"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Box (Target) */}
            <div className="flex-1 min-w-0 p-3 bg-gray-50/70 rounded-lg border border-gray-100 text-left">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                {getSiteLabel(targetUrl, true)}
              </span>
              <mark className="bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-mono text-[11px] font-semibold ml-1">
                (tag: {targetTag})
              </mark>
              <p className="mt-2 truncate">
                <a
                  href={targetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:underline text-xs font-medium break-all"
                  title={targetUrl}
                >
                  {targetUrl}
                </a>
              </p>
            </div>

          </div>

          {/* Yes Confirmation Input */}
          <div className="flex flex-col gap-1.5 text-left">
            <label htmlFor="confirmYes" className="text-xs font-semibold text-gray-700">
              To confirm the sync, type "yes" <span className="text-red-500">*</span>
            </label>
            <input
              id="confirmYes"
              type="text"
              required
              value={confirmYes}
              onChange={(e) => setConfirmYes(e.target.value)}
              placeholder='type "yes"'
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-[#820f4c] focus:border-[#820f4c] outline-none text-sm text-gray-700 transition-colors bg-[#fafafa]"
              autoComplete="off"
            />
          </div>

          {/* Sync By Name Input */}
          <div className="flex flex-col gap-1.5 text-left">
            <label htmlFor="syncBy" className="text-xs font-semibold text-gray-700">
              Sync by <span className="text-red-500">*</span>
            </label>
            <input
              id="syncBy"
              type="text"
              required
              value={syncBy}
              onChange={(e) => setSyncBy(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-[#820f4c] focus:border-[#820f4c] outline-none text-sm text-gray-700 transition-colors bg-[#fafafa]"
              autoComplete="off"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 mt-2 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-100 transition-colors duration-150 bg-white cursor-pointer inline-flex items-center justify-center shadow-xs outline-none"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={!isFormValid || submitting}
              className={`px-5 py-1.5 text-xs font-medium rounded border transition-colors duration-150 inline-flex items-center justify-center shadow-xs outline-none ${isFormValid && !submitting
                ? 'text-[#820f4c] border-[#820f4c] bg-white hover:bg-[#820f4c] hover:text-white cursor-pointer'
                : 'text-gray-300 border-gray-200 bg-gray-50 cursor-not-allowed'
                }`}
            >
              {submitting ? 'Syncing...' : 'Sync'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SyncConfirmModal;
