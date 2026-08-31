import React from 'react';
import ReactDiffViewer from 'react-diff-viewer-continued';
import JsonViewer from './JsonViewer';
import { Copy } from 'lucide-react';
import useLockBodyScroll from '../hooks/useLockBodyScroll';
import { ensureAbsoluteUrl, getEditPageUrl } from '../utils/cellRenderers';

export const parseNestedJsonStrings = (val) => {
  if (val === null || val === undefined) return val;

  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
      try {
        const parsed = JSON.parse(trimmed);
        return parseNestedJsonStrings(parsed);
      } catch (e) {
        return val;
      }
    }
    return val;
  }

  if (Array.isArray(val)) {
    return val.map((item) => parseNestedJsonStrings(item));
  }

  if (typeof val === 'object') {
    const res = {};
    for (const [k, v] of Object.entries(val)) {
      res[k] = parseNestedJsonStrings(v);
    }
    return res;
  }

  return val;
};

export const formatDiffContent = (val) => {
  if (val === null || val === undefined) return '';

  let parsedVal = val;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        parsedVal = JSON.parse(trimmed);
      } catch (e) {
        parsedVal = val;
      }
    }
  }

  if (typeof parsedVal === 'object' && parsedVal !== null) {
    const expandedVal = parseNestedJsonStrings(parsedVal);
    return JSON.stringify(expandedVal, null, 2);
  }

  return String(val);
};

export const DiffViewerModal = ({
  isOpen,
  onClose,
  type = 'diff', // 'diff' or 'data'
  tag = '',
  leftVersion = '1.0',
  rightVersion = '1.0',
  baseUrl1 = '',
  baseUrl2 = '',
  leftEditUrl = '',
  rightEditUrl = '',
  leftId = '',
  rightId = '',
  typeSlug = '',
  activeOption = '',
  leftData = '',
  rightData = '',
  jsonData = null,
}) => {
  useLockBodyScroll(isOpen);

  if (!isOpen) return null;

  const leftFormatted = formatDiffContent(leftData);
  const rightFormatted = formatDiffContent(rightData);

  const resolvedLeftUrl = leftEditUrl || getEditPageUrl(baseUrl1, typeSlug || activeOption, leftId || tag);
  const resolvedRightUrl = rightEditUrl || getEditPageUrl(baseUrl2, typeSlug || activeOption, rightId || tag);

  return (
    <div className="dc-modal-overlay">
      <div
        className="dc-modal-card-diff"
        style={{ width: '80vw', maxWidth: '80vw', height: '70vh', maxHeight: '70vh' }}
      >
        {type === 'diff' ? (
          <div className="dc-modal-header-diff">
            <div className="dc-diff-grid-headers">
              {/* Source Header */}
              <div>
                <h4 className="dc-diff-side-title">
                  Source - Tag: <span>{tag}</span> (v.{leftVersion})
                </h4>
                <a
                  href={resolvedLeftUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="dc-diff-side-url"
                >
                  {baseUrl1}
                </a>
              </div>

              {/* Target Header */}
              <div>
                <h4 className="dc-diff-side-title">
                  Target - Tag: <span>{tag}</span> (v.{rightVersion})
                </h4>
                <a
                  href={resolvedRightUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="dc-diff-side-url"
                >
                  {baseUrl2}
                </a>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="dc-modal-close-btn-text"
              title="Close"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="dc-modal-header">
            <h3 className="dc-modal-title">DATA</h3>
            <button
              onClick={onClose}
              className="dc-modal-close-btn-text"
              title="Close"
            >
              ✕
            </button>
          </div>
        )}

        {/* Modal Content Body */}
        <div className="dc-diff-modal-body">
          {type === 'diff' ? (
            <div className="diff-viewer-wrapper" style={{ fontSize: '12px', fontFamily: 'monospace', border: '1px solid #e5e7eb', borderRadius: '4px', overflow: 'auto', width: '100%' }}>
              <ReactDiffViewer
                oldValue={leftFormatted}
                newValue={rightFormatted}
                splitView={true}
                useDarkTheme={false}
                styles={{
                  variables: {
                    light: {
                      diffViewerBackground: '#ffffff',
                      diffViewerColor: '#212529',
                      addedBackground: '#e6ffec',
                      addedColor: '#24292e',
                      removedBackground: '#ffebe9',
                      removedColor: '#24292e',
                      wordAddedBackground: '#abf2bc',
                      wordRemovedBackground: '#ff8182',
                      addedGutterBackground: '#cdffd8',
                      removedGutterBackground: '#ffdce0',
                      gutterBackground: '#f6f8fa',
                      gutterBackgroundDark: '#f6f8fa',
                      highlightBackground: '#fffbdd',
                      highlightGutterBackground: '#fff5b1',
                    },
                  },
                  diffContainer: {
                    fontSize: '12px',
                    lineHeight: '18px',
                    fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  },
                  line: {
                    fontSize: '12px',
                    lineHeight: '18px',
                    textAlign: 'left',
                    fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  },
                  content: {
                    fontSize: '12px',
                    lineHeight: '18px',
                    textAlign: 'left',
                    justifyContent: 'flex-start',
                    fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  },
                  contentText: {
                    fontSize: '12px',
                    lineHeight: '18px',
                    textAlign: 'left',
                    fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    whiteSpace: 'pre',
                  },
                  wordDiff: {
                    fontSize: '12px',
                    lineHeight: '18px',
                    fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    display: 'inline',
                    textDecoration: 'none',
                  },
                  wordAdded: {
                    fontSize: '12px',
                    lineHeight: '18px',
                    fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  },
                  wordRemoved: {
                    fontSize: '12px',
                    lineHeight: '18px',
                    fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  },
                  gutter: {
                    fontSize: '12px',
                    lineHeight: '18px',
                    textAlign: 'right',
                    minWidth: '40px',
                    fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  },
                  marker: {
                    fontSize: '12px',
                    lineHeight: '18px',
                    textAlign: 'center',
                    width: '24px',
                    minWidth: '24px',
                    fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  },
                }}
              />
            </div>
          ) : (
            <JsonViewer data={parseNestedJsonStrings(jsonData || leftData)} rootKey={tag || 'data'} />
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="dc-diff-modal-footer">
          <span style={{ color: '#6b7280', fontWeight: 400 }}>
            Tag: <span style={{ color: '#374151', fontWeight: 400 }}>{tag}</span>
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {/* {type === 'diff' && (
              <button
                onClick={() => {
                  const textToCopy = `Left:\n${leftFormatted}\n\nRight:\n${rightFormatted}`;
                  navigator.clipboard.writeText(textToCopy);
                }}
                className="btn-gray-outline"
                style={{ padding: '4px 12px', fontSize: '12px' }}
              >
                Copy
                <Copy style={{ marginLeft: '12px' }} width={16} height={16} />
              </button>
            )} */}
            <button
              onClick={onClose}
              className="btn-maroon-solid"
              style={{ padding: '6px 36px', fontSize: '12px', fontWeight: 400 }}
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DiffViewerModal;
