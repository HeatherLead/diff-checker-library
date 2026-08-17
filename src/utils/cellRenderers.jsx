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

// Common helper to render external edit links
export const renderEditLink = (baseUrl, typeSlug, id, label = 'Edit') => {
  if (!id) return <span className="btn-purple opacity-50 cursor-not-allowed">Edit</span>;
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
      className={isEdit ? "btn-purple inline-flex items-center justify-center cursor-pointer" : "text-[#800040] hover:underline font-semibold"}
      onClick={(e) => e.stopPropagation()}
    >
      {label}
    </a>
  );
};
