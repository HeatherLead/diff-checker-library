import React, { useState, useEffect, memo } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { useDiffChecker } from '../context/DiffCheckerContext';
import useLockBodyScroll from '../hooks/useLockBodyScroll';

export const CopyToConfirmModal = memo(({
  isOpen,
  onClose,
  row,
  direction = 'to_right',
  baseUrl1: propBaseUrl1,
  baseUrl2: propBaseUrl2,
  onConfirm
}) => {
  useLockBodyScroll(isOpen);

  const ctx = useDiffChecker();
  const baseUrl1 = propBaseUrl1 !== undefined ? propBaseUrl1 : ctx.baseUrl1;
  const baseUrl2 = propBaseUrl2 !== undefined ? propBaseUrl2 : ctx.baseUrl2;
  const defaultSyncedBy = ctx.syncedBy || '';

  const [confirmYes, setConfirmYes] = useState('');
  const [syncBy, setSyncBy] = useState(defaultSyncedBy);
  const [submitting, setSubmitting] = useState(false);

  // Reset inputs when modal opens or item changes
  useEffect(() => {
    if (isOpen) {
      setConfirmYes('');
      setSyncBy(defaultSyncedBy);
      setSubmitting(false);
    }
  }, [isOpen, row, defaultSyncedBy]);

  if (!isOpen || !row) return null;

  const rawItem = row.raw || row.raw1 || row.raw2 || row;
  const itemTag = row.tag || rawItem.tag || rawItem.tag_name || rawItem.module || rawItem.entity_type || '';

  const isToRight = direction === 'to_right' || direction === 'site1_to_site2';
  const sourceUrl = isToRight ? baseUrl1 : baseUrl2;
  const targetUrl = isToRight ? baseUrl2 : baseUrl1;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (confirmYes.trim().toLowerCase() === 'yes' && syncBy.trim().length > 0) {
      setSubmitting(true);
      try {
        await onConfirm(row, targetUrl, isToRight ? 'to_right' : 'to_left', syncBy.trim());
      } catch (err) {
        console.error(err);
      } finally {
        setSubmitting(false);
        onClose();
      }
    }
  };

  const isFormValid = confirmYes.trim().toLowerCase() === 'yes' && syncBy.trim().length > 0;

  const getSiteLabel = (url, isTarget = false) => {
    if (!url) return isTarget ? 'Target: ' : 'Source: ';
    if (url.includes('.wcms.cloud')) {
      return 'Dev: ';
    }
    if (url.includes('.vectorflow.app')) {
      return 'Prod: ';
    }
    return isTarget ? 'Target: ' : 'Source: ';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 transition-all duration-300 animate-in fade-in duration-200 overscroll-contain">

      <div
        className="w-full max-w-[620px] h-auto max-h-[90vh] my-auto bg-white rounded-xl shadow-2xl flex flex-col border border-gray-200 relative animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex-shrink-0"
        style={{ height: 'auto', maxHeight: '90vh' }}
      >

        <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-gray-100 flex-shrink-0">
          <h3 className="text-lg font-bold text-gray-800 tracking-wider">Confirm Data Clone</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer outline-none"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="px-6 py-5 flex flex-col gap-5 overflow-y-auto max-h-[calc(90vh-70px)] h-auto"
          style={{ height: 'auto', maxHeight: 'calc(90vh - 70px)' }}
        >

          <p className="text-gray-600 text-sm font-medium text-left">
            Are you sure you want confirm data Clone?
          </p>

          <div className="border border-gray-200 rounded-lg p-4 bg-white flex flex-row items-center justify-between gap-3 relative shadow-xs">

            <div className="flex-1 min-w-0 p-3 bg-gray-50/70 rounded-lg border border-gray-100 text-left">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                {getSiteLabel(sourceUrl, false)}
              </span>
              <mark className="bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-mono text-[11px] font-semibold ml-1">
                (tag: {itemTag})
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

            <div className="w-10 flex-shrink-0 flex items-center justify-center relative h-12">
              <div className="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center shadow-xs text-[#820f4c]">
                <ArrowRight className="w-4 h-4 text-[#820f4c]" />
              </div>
            </div>

            <div className="flex-1 min-w-0 p-3 bg-gray-50/70 rounded-lg border border-gray-100 text-left">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                {getSiteLabel(targetUrl, true)}
              </span>
              <mark className="bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-mono text-[11px] font-semibold ml-1">
                (tag: {itemTag})
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

          <div className="flex flex-col gap-1.5 text-left">
            <label htmlFor="confirmYes" className="text-xs font-semibold text-gray-700">
              To confirm the clone, type "yes" <span className="text-red-500">*</span>
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
              {submitting ? 'Cloning...' : 'Clone'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default CopyToConfirmModal;
