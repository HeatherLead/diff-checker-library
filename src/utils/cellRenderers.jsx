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

  const editUrl = getEditPageUrl(baseUrl, typeSlug, id);

  if (!editUrl || editUrl === '#' || editUrl === baseUrl) {
    return (
      <span className="dc-tag-span" title={str}>
        {display}
      </span>
    );
  }

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

export const extractRecordId = (record, option = '') => {
  if (record === null || record === undefined) return '';
  if (typeof record === 'string' || typeof record === 'number') {
    return String(record).trim();
  }
  if (typeof record === 'object') {
    if (option === 'react_menus' || option === 'drupalMenues_react-menu') {
      return record.menu_id || record.id || '';
    }
    if (option === 'role_department_list') {
      return record.role_dept_id || record.id || record.role || '';
    }
    if (option === 'attachment_tag_list' || option === 'bo_attachment_tagging') {
      return record.tag_id || record.id || '';
    }
    if (option === 'workflow_config' || option === 'workflow') {
      return record.wf_id || record.id || '';
    }
    if (option === 'templates' || option === 'input_file_tagging') {
      return record.tag_id || record.id || '';
    }
    return record.tag_id || record.wf_id || record.role_dept_id || record.menu_id || record.id || record.rect1id || record.rect2id || record.tag || record.tag_name || '';
  }
  return '';
};

export const OPTION_SLUG_MAP = {
  datatables: 'datatables-config',
  datatables_config: 'datatables-config',
  task_entity: 'task-entity-config',
  entity_forms: 'task-entity-config',
  custom_form: 'custom-form-config',
  workflow_config: 'workflow-config',
  workflow: 'workflow-config',
  attachment_tag_list: 'attachment-tag',
  bo_attachment_tagging: 'attachment-tag',
  templates: 'input-file-tag',
  input_file_tag: 'input-file-tag',
  input_file_tagging: 'input-file-tag',
  role_department_list: 'role-department-list-config',
  react_menus: 'admin/structure/menu/item',
  'drupalMenues_react-menu': 'admin/structure/menu/item',
  drupalMenues_react_menu: 'admin/structure/menu/item',
  master_config: 'master-config',
  site_config: 'master-config',
  configurations: 'master-config',
  drupal_roles: 'drupal-roles',
  dropdown_config: 'dropdown-config',
  dropdown: 'dropdown-config',
  permission_config: 'permission-config',
  permissions: 'permission-config',
  subtask_master: 'subtask-master',
};

export const getEditPageUrl = (baseUrl, typeSlugOrOption, idOrRaw) => {
  if (!baseUrl) return '#';
  const cleanUrl = ensureAbsoluteUrl(baseUrl).replace(/\/+$/, '');
  if (!cleanUrl) return '#';

  const option = typeSlugOrOption || '';
  const id = extractRecordId(idOrRaw, option);
  if (!id) return cleanUrl;

  // React Menus has custom format {baseUrl}/admin/structure/menu/item/{menu_id}/edit
  if (
    option === 'react_menus' ||
    option === 'drupalMenues_react-menu' ||
    option === 'drupalMenues_react_menu' ||
    option === 'admin/structure/menu/item'
  ) {
    return `${cleanUrl}/admin/structure/menu/item/${id}/edit`;
  }

  const slug = OPTION_SLUG_MAP[option] || (option ? option.replace(/_/g, '-') : 'datatables-config');

  return `${cleanUrl}/${slug}/edit/${id}`;
};

// Common helper to render external edit links
export const renderEditLink = (baseUrl, typeSlug, idOrRaw, label = 'Edit') => {
  const id = extractRecordId(idOrRaw, typeSlug);
  if (!id) return <span className="btn-purple" style={{ opacity: 0.5, cursor: 'not-allowed' }}>Edit</span>;
  const editUrl = getEditPageUrl(baseUrl, typeSlug, idOrRaw);
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

