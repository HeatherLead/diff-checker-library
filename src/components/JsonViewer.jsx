import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

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
          <Check size={11} style={{ marginRight: '2px' }} /> Copied
        </span>
      ) : (
        <Copy size={13} strokeWidth={1.8} style={{ color: '#3b82f6' }} />
      )}
    </button>
  );
};

export const JsonViewer = ({ data, rootKey = 'data' }) => {
  const [collapsed, setCollapsed] = useState({});

  const toggleCollapse = (path) => {
    setCollapsed((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const renderPrimitiveValue = (val) => {
    if (val === null || val === undefined) {
      return <span className="dc-json-null">null</span>;
    }
    if (typeof val === 'boolean') {
      return <span className="dc-json-bool">{val ? 'true' : 'false'}</span>;
    }
    if (typeof val === 'number') {
      return (
        <>
          <span className="dc-json-number-tag">number</span>
          <span className="dc-json-number-val">{val}</span>
        </>
      );
    }
    if (typeof val === 'string') {
      return (
        <>
          <span className="dc-json-string-tag">string</span>
          <span className="dc-json-string-val">"{val}"</span>
        </>
      );
    }
    return <span>{String(val)}</span>;
  };

  const renderNode = (keyLabel, val, path, isIdx = false) => {
    // Check if string contains stringified JSON
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed && typeof parsed === 'object') {
            return renderNode(keyLabel, parsed, path + '_parsed', isIdx);
          }
        } catch (e) {
          // ignore parsing error, treat as plain string
        }
      }
    }

    // Array Node
    if (Array.isArray(val)) {
      const isCollapsed = collapsed[path];
      const itemCount = val.length;
      return (
        <div key={path} className="dc-json-node-container">
          <div className="dc-json-node-header">
            <button
              onClick={() => toggleCollapse(path)}
              className="dc-json-node-btn"
              type="button"
            >
              <span className="dc-json-arrow">{isCollapsed ? '►' : '▼'}</span>
              {keyLabel !== undefined && (
                <span className={isIdx ? "dc-json-key-idx" : "dc-json-key-name"}>
                  {isIdx ? `${keyLabel} :` : `"${keyLabel}" :`}
                </span>
              )}
              <span className="dc-json-bracket">[</span>
              <span className="dc-json-badge-count">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </span>
            </button>
            <CopyButton value={val} label="Copy array" />
          </div>

          {!isCollapsed && (
            <div className="dc-json-tree-branch">
              {val.map((item, idx) => renderNode(idx, item, `${path}_${idx}`, true))}
            </div>
          )}
        </div>
      );
    }

    // Object Node
    if (val !== null && typeof val === 'object') {
      const keys = Object.keys(val);
      const isCollapsed = collapsed[path];
      const itemCount = keys.length;
      return (
        <div key={path} className="dc-json-node-container">
          <div className="dc-json-node-header">
            <button
              onClick={() => toggleCollapse(path)}
              className="dc-json-node-btn"
              type="button"
            >
              <span className="dc-json-arrow">{isCollapsed ? '►' : '▼'}</span>
              {keyLabel !== undefined && (
                <span className={isIdx ? "dc-json-key-idx" : "dc-json-key-name"}>
                  {isIdx ? `${keyLabel} :` : `"${keyLabel}" :`}
                </span>
              )}
              <span className="dc-json-bracket">&#123;</span>
              <span className="dc-json-badge-count">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </span>
            </button>
            <CopyButton value={val} label="Copy object" />
          </div>

          {!isCollapsed && (
            <div className="dc-json-tree-branch">
              {keys.map((key) => renderNode(key, val[key], `${path}_${key}`, false))}
            </div>
          )}
        </div>
      );
    }

    // Primitive Row
    return (
      <div key={path} className="dc-json-row">
        {keyLabel !== undefined && (
          <span className={isIdx ? "dc-json-key-idx" : "dc-json-key-name"}>
            {isIdx ? `${keyLabel} :` : `"${keyLabel}" :`}
          </span>
        )}
        <span className="dc-json-val-wrapper">
          {renderPrimitiveValue(val)}
        </span>
        <CopyButton value={val} label="Copy value" />
      </div>
    );
  };

  const rootObject = typeof data === 'object' && data !== null ? data : { [rootKey]: data };
  const rootKeys = Object.keys(rootObject);
  const isRootCollapsed = collapsed['root'];

  return (
    <div className="dc-json-viewer">
      <div className="dc-json-node-container">
        <div className="dc-json-node-header">
          <button
            onClick={() => toggleCollapse('root')}
            className="dc-json-node-btn"
            type="button"
          >
            <span className="dc-json-arrow">{isRootCollapsed ? '►' : '▼'}</span>
            <span className="dc-json-key-name">"{rootKey}" :</span>
            <span className="dc-json-bracket">&#123;</span>
            <span className="dc-json-badge-count">
              {rootKeys.length} {rootKeys.length === 1 ? 'item' : 'items'}
            </span>
          </button>
          <CopyButton value={rootObject} label="Copy root object" />
        </div>

        {!isRootCollapsed && (
          <div className="dc-json-tree-root-branch">
            {rootKeys.map((key) => renderNode(key, rootObject[key], `root_${key}`, false))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JsonViewer;

