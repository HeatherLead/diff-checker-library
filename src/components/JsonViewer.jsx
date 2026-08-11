import React, { useState } from 'react';

/**
 * CopyButton Component
 * Displays a copy icon on hover matching the UI design in the user screenshot.
 * Copies objects, arrays, or primitive values to clipboard on click.
 */
const CopyButton = ({ value, label = "Copy" }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    let textToCopy = '';
    if (value === null || value === undefined) {
      textToCopy = 'null';
    } else if (typeof value === 'object') {
      textToCopy = JSON.stringify(value, null, 2);
    } else {
      textToCopy = String(value);
    }

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      type="button"
      title={copied ? "Copied!" : label}
      className="inline-flex items-center justify-center ml-1.5 p-0.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-all duration-150 focus:outline-none opacity-0 group-hover:opacity-100 cursor-pointer"
    >
      {copied ? (
        <span className="inline-flex items-center text-[10px] text-green-600 font-semibold px-1 bg-green-50 rounded border border-green-200">
          ✓ Copied
        </span>
      ) : (
        /* Clipboard icon with arrow matching screenshot style */
        <svg
          className="w-3.5 h-3.5 text-[#3b82f6]"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      )}
    </button>
  );
};

/**
 * JsonViewer Component
 * Renders an interactive, styled JSON tree viewer matching the requested design.
 * Features collapsible nodes, object/array item counts, line/object hover copy buttons.
 */
export const JsonViewer = ({ data, rootKey = 'data' }) => {
  const [collapsed, setCollapsed] = useState({});

  const toggleCollapse = (path) => {
    setCollapsed((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const renderValue = (val, path) => {
    if (val === null || val === undefined) {
      return (
        <span className="inline-flex items-center font-mono group">
          <span className="text-gray-400 italic">null</span>
          <CopyButton value={val} label="Copy null" />
        </span>
      );
    }

    if (typeof val === 'boolean') {
      return (
        <span className="inline-flex items-center font-mono group">
          <span className="text-purple-600 font-normal">{val ? 'true' : 'false'}</span>
          <CopyButton value={val} label="Copy boolean" />
        </span>
      );
    }

    if (typeof val === 'number') {
      return (
        <span className="inline-flex items-center font-mono group">
          <span className="text-[#c77d4c] text-[11px] mr-1.5 font-normal">number</span>
          <span className="text-[#b91c1c] font-normal">{val}</span>
          <CopyButton value={val} label="Copy number" />
        </span>
      );
    }

    if (typeof val === 'string') {
      // Check if string contains stringified JSON (e.g. datatable_structure or entity_config)
      let parsedJson = null;
      if ((val.startsWith('{') && val.endsWith('}')) || (val.startsWith('[') && val.endsWith(']'))) {
        try {
          parsedJson = JSON.parse(val);
        } catch (e) {
          parsedJson = null;
        }
      }

      if (parsedJson && typeof parsedJson === 'object') {
        return renderValue(parsedJson, path + '_parsed');
      }

      return (
        <span className="inline-flex items-center font-mono group">
          <span className="text-[#c77d4c] text-[11px] mr-1.5 font-normal">string</span>
          <span className="text-[#a33d26] break-all">"{val}"</span>
          <CopyButton value={val} label="Copy string value" />
        </span>
      );
    }

    if (Array.isArray(val)) {
      const isCollapsed = collapsed[path];
      const itemCount = val.length;
      return (
        <div className="inline-block w-full">
          <div className="inline-flex items-center group">
            <button
              onClick={() => toggleCollapse(path)}
              className="text-gray-700 hover:text-gray-900 font-mono font-normal inline-flex items-center space-x-1 cursor-pointer focus:outline-none"
              type="button"
            >
              <span className="text-[10px] text-gray-500">{isCollapsed ? '►' : '▼'}</span>
              <span className="text-gray-900 font-normal">[</span>
              <span className="text-gray-400 font-mono text-xs italic font-normal">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </span>
            </button>
            <CopyButton value={val} label="Copy array object" />
          </div>

          {!isCollapsed && (
            <div className="pl-6 border-l border-gray-200 my-1 space-y-1">
              {val.map((item, idx) => (
                <div key={idx} className="font-mono text-xs group flex flex-wrap items-baseline hover:bg-gray-50/80 rounded px-1 -mx-1 transition-colors">
                  <span className="text-purple-600 font-normal mr-1.5">{idx} :</span>
                  {renderValue(item, `${path}_${idx}`)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (typeof val === 'object') {
      const keys = Object.keys(val);
      const isCollapsed = collapsed[path];
      return (
        <div className="inline-block w-full">
          <div className="inline-flex items-center group">
            <button
              onClick={() => toggleCollapse(path)}
              className="text-gray-800 hover:text-black font-mono font-normal inline-flex items-center space-x-1 cursor-pointer focus:outline-none"
              type="button"
            >
              <span className="text-[10px] text-gray-500">{isCollapsed ? '►' : '▼'}</span>
              <span className="text-gray-900 font-normal">&#123;</span>
              <span className="text-gray-400 font-mono text-xs italic font-normal">
                {keys.length} {keys.length === 1 ? 'item' : 'items'}
              </span>
            </button>
            <CopyButton value={val} label="Copy object" />
          </div>

          {!isCollapsed && (
            <div className="pl-6 border-l border-gray-200 my-1 space-y-1.5 w-full">
              {keys.map((key) => (
                <div key={key} className="font-mono text-xs group flex flex-wrap items-baseline hover:bg-gray-50/80 rounded px-1 -mx-1 transition-colors">
                  <span className="text-gray-800 font-normal mr-1.5">"{key}" :</span>
                  {renderValue(val[key], `${path}_${key}`)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <span className="inline-flex items-center font-mono group">
        <span>{String(val)}</span>
        <CopyButton value={val} label="Copy value" />
      </span>
    );
  };

  const rootObject = typeof data === 'object' && data !== null ? data : { [rootKey]: data };
  const rootKeys = Object.keys(rootObject);
  const isRootCollapsed = collapsed['root'];

  return (
    <div className="font-mono text-xs text-gray-800 p-4 bg-white select-text overflow-y-auto max-h-full">
      <div className="flex items-center space-x-2 mb-2 group font-normal">
        <button
          onClick={() => toggleCollapse('root')}
          className="inline-flex items-center space-x-1.5 text-gray-800 hover:text-black focus:outline-none cursor-pointer"
          type="button"
        >
          <span className="text-xs text-gray-500">{isRootCollapsed ? '►' : '▼'}</span>
          <span className="text-gray-900 font-normal">"{rootKey}" :</span>
          <span className="text-gray-900 font-normal">&#123;</span>
          <span className="text-gray-400 text-xs font-normal italic">
            {rootKeys.length} {rootKeys.length === 1 ? 'item' : 'items'}
          </span>
        </button>
        <CopyButton value={rootObject} label="Copy root object" />
      </div>

      {!isRootCollapsed && (
        <div className="pl-6 border-l-2 border-gray-200 space-y-2">
          {rootKeys.map((key) => (
            <div key={key} className="group flex flex-wrap items-baseline hover:bg-gray-50/80 rounded px-1 -mx-1 transition-colors">
              <span className="text-gray-800 font-normal mr-1.5">"{key}" :</span>
              {renderValue(rootObject[key], `root_${key}`)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JsonViewer;
