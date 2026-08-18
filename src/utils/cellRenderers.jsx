import React from 'react';

// Common helper to trim and show tooltip for AG-Grid cells
export const renderTrimTooltip = (val, maxChar = 27) => {
  if (val === null || val === undefined || val === '') return '';
  let str = '';
  if (typeof val === 'object') {
    if (typeof val.tag === 'string') {
      str = val.tag;
    } else if (typeof val.label === 'string') {
      str = val.label;
    } else if (typeof val.name === 'string') {
      str = val.name;
    } else {
      try {
        str = JSON.stringify(val);
      } catch {
        str = String(val);
      }
    }
  } else {
    str = String(val);
  }

  if (!str) return '';
  if (str.length <= maxChar) return str;
  return (
    <span title={str}>
      {str.substring(0, maxChar)}...
    </span>
  );
};

// Common helper to render clickable TAG cell in OnlySite / diff tables
export const renderTagLink = (baseUrl, typeSlug, id, val, maxChar = 35) => {
  if (val === null || val === undefined || val === '') return '';
  let str = '';
  if (typeof val === 'object') {
    if (typeof val.tag === 'string') {
      str = val.tag;
    } else if (typeof val.label === 'string') {
      str = val.label;
    } else if (typeof val.name === 'string') {
      str = val.name;
    } else {
      try {
        str = JSON.stringify(val);
      } catch {
        str = String(val);
      }
    }
  } else {
    str = String(val);
  }

  if (!str) return '';

  const display = str.length > maxChar ? `${str.substring(0, maxChar)}...` : str;

  if (!id) {
    return (
      <span className="dc-tag-span" title={str}>
        {display}
      </span>
    );
  }

  let cleanUrl = typeof baseUrl === 'string' ? baseUrl.trim() : '';
  if (cleanUrl && !cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = `https://${cleanUrl}`;
  }
  cleanUrl = cleanUrl.replace(/\/+$/, '');

  if (!cleanUrl) {
    return (
      <span className="dc-tag-span" title={str}>
        {display}
      </span>
    );
  }

  const slug = typeSlug || 'datatables-config';
  const editUrl = `${cleanUrl}/${slug}/edit/${id}`;

  return (
    <a
      href={editUrl}
      target="_blank"
      rel="noreferrer"
      className="dc-tag-link"
      title={str}
      onClick={(e) => e.stopPropagation()}
    >
      {display}
    </a>
  );
};

// Common helper to render external edit links
export const renderEditLink = (baseUrl, typeSlug, id, label = 'Edit') => {
  if (!id) return <span className="btn-purple" style={{ opacity: 0.5, cursor: 'not-allowed' }}>Edit</span>;
  let cleanUrl = typeof baseUrl === 'string' ? baseUrl.trim() : '';
  if (cleanUrl && !cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = `https://${cleanUrl}`;
  }
  cleanUrl = cleanUrl.replace(/\/+$/, '');
  const editUrl = `${cleanUrl}/${typeSlug}/edit/${id}`;
  const isEdit = label === 'Edit' || label === 'edit';

  return (
    <a
      href={editUrl}
      target="_blank"
      rel="noreferrer"
      className={isEdit ? "btn-purple" : "dc-tag-link"}
      onClick={(e) => e.stopPropagation()}
    >
      {label}
    </a>
  );
};
