import React, { useState } from 'react';

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
      className="dc-json-copy-btn"
    >
      {copied ? (
        <span className="dc-json-copied-badge">
          ✓ Copied
        </span>
      ) : (
        <svg
          style={{ width: '14px', height: '14px', color: '#3b82f6' }}
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

export const JsonViewer = ({ data, rootKey = 'data' }) => {
  const [collapsed, setCollapsed] = useState({});

  const toggleCollapse = (path) => {
    setCollapsed((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const renderValue = (val, path) => {
    if (val === null || val === undefined) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', fontFamily: 'monospace' }}>
          <span className="dc-json-null">null</span>
          <CopyButton value={val} label="Copy null" />
        </span>
      );
    }

    if (typeof val === 'boolean') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', fontFamily: 'monospace' }}>
          <span className="dc-json-bool">{val ? 'true' : 'false'}</span>
          <CopyButton value={val} label="Copy boolean" />
        </span>
      );
    }

    if (typeof val === 'number') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', fontFamily: 'monospace' }}>
          <span className="dc-json-number-tag">number</span>
          <span className="dc-json-number-val">{val}</span>
          <CopyButton value={val} label="Copy number" />
        </span>
      );
    }

    if (typeof val === 'string') {
      let parsedJson = null;
      const trimmed = val.trim();
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
          parsedJson = JSON.parse(trimmed);
        } catch (e) {
          parsedJson = null;
        }
      }

      if (parsedJson && typeof parsedJson === 'object') {
        return renderValue(parsedJson, path + '_parsed');
      }

      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', fontFamily: 'monospace' }}>
          <span className="dc-json-string-tag">string</span>
          <span className="dc-json-string-val">"{val}"</span>
          <CopyButton value={val} label="Copy string value" />
        </span>
      );
    }

    if (Array.isArray(val)) {
      const isCollapsed = collapsed[path];
      const itemCount = val.length;
      return (
        <div style={{ display: 'inline-block', width: '100%' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center' }}>
            <button
              onClick={() => toggleCollapse(path)}
              className="dc-json-node-btn"
              type="button"
            >
              <span style={{ fontSize: '10px', color: '#6b7280' }}>{isCollapsed ? '►' : '▼'}</span>
              <span style={{ color: '#111827', fontWeight: 400 }}>[</span>
              <span className="dc-json-badge-count">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </span>
            </button>
            <CopyButton value={val} label="Copy array object" />
          </div>

          {!isCollapsed && (
            <div className="dc-json-tree-branch">
              {val.map((item, idx) => (
                <div key={idx} className="dc-json-row">
                  <span className="dc-json-key-idx">{idx} :</span>
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
        <div style={{ display: 'inline-block', width: '100%' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center' }}>
            <button
              onClick={() => toggleCollapse(path)}
              className="dc-json-node-btn"
              type="button"
            >
              <span style={{ fontSize: '10px', color: '#6b7280' }}>{isCollapsed ? '►' : '▼'}</span>
              <span style={{ color: '#111827', fontWeight: 400 }}>&#123;</span>
              <span className="dc-json-badge-count">
                {keys.length} {keys.length === 1 ? 'item' : 'items'}
              </span>
            </button>
            <CopyButton value={val} label="Copy object" />
          </div>

          {!isCollapsed && (
            <div className="dc-json-tree-branch">
              {keys.map((key) => (
                <div key={key} className="dc-json-row">
                  <span className="dc-json-key-name">"{key}" :</span>
                  {renderValue(val[key], `${path}_${key}`)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', fontFamily: 'monospace' }}>
        <span>{String(val)}</span>
        <CopyButton value={val} label="Copy value" />
      </span>
    );
  };

  const rootObject = typeof data === 'object' && data !== null ? data : { [rootKey]: data };
  const rootKeys = Object.keys(rootObject);
  const isRootCollapsed = collapsed['root'];

  return (
    <div className="dc-json-viewer">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 400 }}>
        <button
          onClick={() => toggleCollapse('root')}
          className="dc-json-node-btn"
          type="button"
        >
          <span style={{ fontSize: '12px', color: '#6b7280' }}>{isRootCollapsed ? '►' : '▼'}</span>
          <span style={{ color: '#111827', fontWeight: 400 }}>"{rootKey}" :</span>
          <span style={{ color: '#111827', fontWeight: 400 }}>&#123;</span>
          <span className="dc-json-badge-count">
            {rootKeys.length} {rootKeys.length === 1 ? 'item' : 'items'}
          </span>
        </button>
        <CopyButton value={rootObject} label="Copy root object" />
      </div>

      {!isRootCollapsed && (
        <div className="dc-json-tree-root-branch">
          {rootKeys.map((key) => (
            <div key={key} className="dc-json-row">
              <span className="dc-json-key-name">"{key}" :</span>
              {renderValue(rootObject[key], `root_${key}`)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JsonViewer;
