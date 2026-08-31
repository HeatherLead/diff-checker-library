// Common helper to ensure URLs have a protocol (defaults to https://) so browser treats them as absolute external links
export const ensureAbsoluteUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^(?:https?:\/\/|\/\/)/i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

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

  const cleanUrl = ensureAbsoluteUrl(baseUrl).replace(/\/+$/, '');

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

export const OPTION_SLUG_MAP = {
  datatables: 'datatables-config',
  task_entity: 'task-entity-config',
  custom_form: 'custom-form-config',
  workflow_config: 'workflow-config',
  attachment_tag_list: 'attachment-tag-list',
  templates: 'templates',
  role_department_list: 'role-department-list',
  react_menus: 'react-menus',
  master_config: 'master-config',
  site_config: 'master-config',
  drupal_roles: 'drupal-roles',
  dropdown_config: 'dropdown-config',
  permission_config: 'permission-config',
  subtask_master: 'subtask-master',
};

export const getEditPageUrl = (baseUrl, typeSlugOrOption, id) => {
  if (!baseUrl) return '#';
  const cleanUrl = ensureAbsoluteUrl(baseUrl).replace(/\/+$/, '');
  if (!cleanUrl) return '#';
  const slug = OPTION_SLUG_MAP[typeSlugOrOption] || typeSlugOrOption || 'datatables-config';
  if (!id) return cleanUrl;
  return `${cleanUrl}/${slug}/edit/${id}`;
};

// Common helper to render external edit links
export const renderEditLink = (baseUrl, typeSlug, id, label = 'Edit') => {
  if (!id) return <span className="btn-purple" style={{ opacity: 0.5, cursor: 'not-allowed' }}>Edit</span>;
  const editUrl = getEditPageUrl(baseUrl, typeSlug, id);
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

