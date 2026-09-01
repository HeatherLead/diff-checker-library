import React, { useState, useEffect, memo } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { useDiffChecker } from '../context/DiffCheckerContext';
import useLockBodyScroll from '../hooks/useLockBodyScroll';
import { ensureAbsoluteUrl, getEditPageUrl } from '../utils/cellRenderers';

export const SyncConfirmModal = memo(({
  isOpen,
  onClose,
  row,
  baseUrl1: propBaseUrl1,
  baseUrl2: propBaseUrl2,
  activeOption: propActiveOption,
  typeSlug: propTypeSlug,
  onConfirm
}) => {
  useLockBodyScroll(isOpen);

  const ctx = useDiffChecker();
  const baseUrl1 = propBaseUrl1 !== undefined ? propBaseUrl1 : ctx.baseUrl1;
  const baseUrl2 = propBaseUrl2 !== undefined ? propBaseUrl2 : ctx.baseUrl2;
  const activeOption = propActiveOption || ctx.activeOption || '';
  const typeSlug = propTypeSlug || ctx.typeSlug || activeOption || '';
  const defaultSyncedBy = ctx.syncedBy || '';

  const [confirmYes, setConfirmYes] = useState('');
  const [syncBy, setSyncBy] = useState(defaultSyncedBy);
  const [submitting, setSubmitting] = useState(false);

  // Reset inputs when modal opens/changes
  useEffect(() => {
    if (isOpen) {
      setConfirmYes('');
      setSyncBy(defaultSyncedBy);
      setSubmitting(false);
    }
  }, [isOpen, row, defaultSyncedBy]);

  if (!isOpen || !row) return null;

  const raw1 = row.raw1 || (row.raw && !row.raw2 ? row.raw : {}) || row;
  const raw2 = row.raw2 || {};

  const sourceTag = row.raw1?.tag || row.raw1?.tag_name || row.raw1?.module || row.tag || '';
  const targetTag = row.raw2?.tag || row.raw2?.tag_name || row.raw2?.module || row.tag || '';

  const sourceId = row.rect1id || row.id1 || row.raw1?.id || row.id || sourceTag || '';
  const targetId = row.rect2id || row.id2 || row.raw2?.id || row.id || targetTag || '';

  const sourceUrl = baseUrl1;
  const targetUrl = baseUrl2;

  const raw1WithTag = { ...(typeof raw1 === 'object' ? raw1 : {}), tag: sourceTag || row.tag || '', tag_name: sourceTag || row.tag_name || row.tag || '', id: sourceId };
  const raw2WithTag = { ...(typeof raw2 === 'object' ? raw2 : {}), tag: targetTag || row.tag || '', tag_name: targetTag || row.tag_name || row.tag || '', id: targetId };

  const resolvedSourceUrl = row.sourceEditUrl || row.leftEditUrl || getEditPageUrl(sourceUrl, typeSlug || activeOption, raw1WithTag);
  const resolvedTargetUrl = row.targetEditUrl || row.rightEditUrl || getEditPageUrl(targetUrl, typeSlug || activeOption, raw2WithTag);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (confirmYes.trim().toLowerCase() === 'yes' && syncBy.trim().length > 0) {
      setSubmitting(true);
      const sourceItem = row.raw1 || row;
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
    <div className="dc-modal-overlay">

      {/* Modal Card */}
      <div className="dc-modal-card">

        {/* Header */}
        <div className="dc-modal-header">
          <h3 className="dc-modal-title">Confirm Data Sync</h3>
          <button
            onClick={onClose}
            className="dc-modal-close-btn"
            title="Close"
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="dc-modal-form">

          <p className="dc-modal-desc">
            Are you sure you want confirm data Sync?
          </p>

          {/* Site comparison side-by-side container */}
          <div className="dc-modal-compare-box">

            {/* Left Box (Source) */}
            <div className="dc-modal-compare-site">
              <span className="dc-modal-site-label">
                {getSiteLabel(sourceUrl, false)}
              </span>
              <mark className="dc-modal-tag-badge">
                (tag: {sourceTag})
              </mark>
              <p className="dc-modal-site-url">
                <a
                  href={resolvedSourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  title={resolvedSourceUrl}
                >
                  {sourceUrl}
                </a>
              </p>
            </div>

            {/* Direction Indicator */}
            <div className="dc-modal-swap-wrapper">
              <div className="dc-modal-arrow-circle">
                <ArrowRight style={{ width: '16px', height: '16px' }} />
              </div>
            </div>

            {/* Right Box (Target) */}
            <div className="dc-modal-compare-site">
              <span className="dc-modal-site-label">
                {getSiteLabel(targetUrl, true)}
              </span>
              <mark className="dc-modal-tag-badge">
                (tag: {targetTag})
              </mark>
              <p className="dc-modal-site-url">
                <a
                  href={resolvedTargetUrl}
                  target="_blank"
                  rel="noreferrer"
                  title={resolvedTargetUrl}
                >
                  {targetUrl}
                </a>
              </p>
            </div>

          </div>

          {/* Yes Confirmation Input */}
          <div className="dc-modal-input-group">
            <label htmlFor="confirmYes" className="dc-modal-label">
              To confirm the sync, type "yes" <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="confirmYes"
              type="text"
              required
              value={confirmYes}
              onChange={(e) => setConfirmYes(e.target.value)}
              placeholder='type "yes"'
              className="dc-modal-input"
              autoComplete="off"
            />
          </div>

          {/* Sync By Name Input */}
          <div className="dc-modal-input-group">
            <label htmlFor="syncBy" className="dc-modal-label">
              Sync by <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="syncBy"
              type="text"
              required
              value={syncBy}
              onChange={(e) => setSyncBy(e.target.value)}
              placeholder="Enter your name"
              className="dc-modal-input"
              autoComplete="off"
            />
          </div>

          {/* Footer Actions */}
          <div className="dc-modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="dc-modal-btn-close"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={!isFormValid || submitting}
              className={`dc-modal-btn-action ${isFormValid && !submitting ? 'active' : 'disabled'}`}
            >
              {submitting ? 'Syncing...' : 'Sync'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default SyncConfirmModal;
