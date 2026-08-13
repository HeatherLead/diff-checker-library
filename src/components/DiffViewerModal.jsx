import React from 'react';
import ReactDiffViewer from 'react-diff-viewer-continued';
import JsonViewer from './JsonViewer';
import { Copy } from 'lucide-react';
import useLockBodyScroll from '../hooks/useLockBodyScroll';

/**
 * Recursively parses stringified JSON inside objects, arrays, or strings
 * so that any nested JSON strings (e.g. datatable_structure, entity_config, params_structure)
 * are expanded into actual JavaScript objects/arrays.
 */
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

/**
 * Format stringified JSON or plain text for optimal side-by-side diff display
 */
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
  baseUrl1 = 'https://tms-next-be.wcms.cloud',
  baseUrl2 = 'https://dev-sutradhar-be.wcms.cloud',
  leftData = '',
  rightData = '',
  jsonData = null,
}) => {
  useLockBodyScroll(isOpen);

  if (!isOpen) return null;

  const leftFormatted = formatDiffContent(leftData);
  const rightFormatted = formatDiffContent(rightData);

  return (
    /* Modal Backdrop: Blurred background (backdrop-blur-md) with dark overlay */
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 transition-all duration-300 overscroll-contain">

      {/* Modal Dialog Box: 80% width and 70% height */}
      <div className="w-[80vw] h-[70vh] max-w-[80vw] max-h-[70vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 relative animate-in fade-in zoom-in-95 duration-200">

        {/* Modal Header */}
        {type === 'diff' ? (
          <div className="px-6 py-3 border-b border-gray-200 bg-white flex items-center justify-between shadow-sm">
            <div className="grid grid-cols-2 gap-6 w-full pr-8">
              {/* Left Side Header */}
              <div>
                <h4 className="text-sm font-bold text-gray-800 tracking-tight">
                  Left Side - Tag: <span className="text-[#800040]">{tag}</span> (v.{leftVersion})
                </h4>
                <a
                  href={baseUrl1}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-600 hover:underline font-medium block truncate"
                >
                  {baseUrl1}
                </a>
              </div>

              {/* Right Side Header */}
              <div>
                <h4 className="text-sm font-bold text-gray-800 tracking-tight">
                  Right Side - Tag: <span className="text-[#800040]">{tag}</span> (v.{rightVersion})
                </h4>
                <a
                  href={baseUrl2}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-600 hover:underline font-medium block truncate"
                >
                  {baseUrl2}
                </a>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 text-xl font-bold p-1 rounded-md hover:bg-gray-100 transition-colors"
              title="Close"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between shadow-sm">
            <h3 className="text-base font-bold text-gray-800 tracking-wider">DATA</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 text-xl font-bold p-1 rounded-md hover:bg-gray-100 transition-colors"
              title="Close"
            >
              ✕
            </button>
          </div>
        )}

        {/* Modal Content Body */}
        <div className="flex-1 overflow-auto bg-white p-4">
          {type === 'diff' ? (
            <div className="diff-viewer-wrapper text-xs font-mono border border-gray-200 rounded overflow-hidden">
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
                  line: {
                    fontSize: '12px',
                    lineHeight: '18px',
                  },
                }}
              />
            </div>
          ) : (
            <JsonViewer data={parseNestedJsonStrings(jsonData || leftData)} rootKey={tag || 'data'} />
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-2.5 bg-gray-50 border-t border-gray-200 flex justify-between items-center text-xs">
          <span className="text-gray-500 font-normal">
            Tag: <span className="text-gray-700 font-normal">{tag}</span>
          </span>
          <div className="flex space-x-2">
            {type === 'diff' && (
              <button
                onClick={() => {
                  const textToCopy = `Left:\n${leftFormatted}\n\nRight:\n${rightFormatted}`;
                  navigator.clipboard.writeText(textToCopy);
                }}
                className="btn-gray-outline py-1 px-3 text-xs"
              >
                Copy
                <Copy className='ml-3' width={16} height={16} />
              </button>
            )}
            <button
              onClick={onClose}
              className="btn-maroon-solid py-1 px-4 text-xs font-normal"
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
