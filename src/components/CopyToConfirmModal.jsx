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
    <div className="dc-modal-overlay">

      <div className="dc-modal-card">

        <div className="dc-modal-header">
          <h3 className="dc-modal-title">Confirm Data Clone</h3>
          <button
            onClick={onClose}
            className="dc-modal-close-btn"
            title="Close"
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="dc-modal-form">

          <p className="dc-modal-desc">
            Are you sure you want confirm data Clone?
          </p>

          <div className="dc-modal-compare-box">

            <div className="dc-modal-compare-site">
              <span className="dc-modal-site-label">
                {getSiteLabel(sourceUrl, false)}
              </span>
              <mark className="dc-modal-tag-badge">
                (tag: {itemTag})
              </mark>
              <p className="dc-modal-site-url">
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  title={sourceUrl}
                >
                  {sourceUrl}
                </a>
              </p>
            </div>

            <div className="dc-modal-swap-wrapper">
              <div className="dc-modal-arrow-circle">
                <ArrowRight style={{ width: '16px', height: '16px' }} />
              </div>
            </div>

            <div className="dc-modal-compare-site">
              <span className="dc-modal-site-label">
                {getSiteLabel(targetUrl, true)}
              </span>
              <mark className="dc-modal-tag-badge">
                (tag: {itemTag})
              </mark>
              <p className="dc-modal-site-url">
                <a
                  href={targetUrl}
                  target="_blank"
                  rel="noreferrer"
                  title={targetUrl}
                >
                  {targetUrl}
                </a>
              </p>
            </div>

          </div>

          <div className="dc-modal-input-group">
            <label htmlFor="confirmYes" className="dc-modal-label">
              To confirm the clone, type "yes" <span style={{ color: '#ef4444' }}>*</span>
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
              {submitting ? 'Cloning...' : 'Clone'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default CopyToConfirmModal;
