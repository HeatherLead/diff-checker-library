import { matchSorter } from 'match-sorter';

const NON_FILTERABLE_EXACT_FIELDS = new Set([
  'syncdata',
  'synchdata',
  'sync_data',
  'sync',
  'syncdatabtn',
  'datatablediff',
  'querydiff',
  'otherdiff',
  'rolediff',
  'dtdiff',
  'dt_diff',
  'dfdiff',
  'df_diff',
  'customformdiff',
  'diff',
  'viewdata',
  'view_data',
  'view',
  'viewquery',
  'view_query',
  'viewbtn',
  'action',
  'actions',
  'edit',
  'site1config',
  'site2config',
  'site1_config',
  'site2_config',
  'siteconfig',
  'copyleft',
  'copyright',
  'copytoleft',
  'copytoright',
  'copy_left',
  'copy_right',
  'copy_to_left',
  'copy_to_right',
  'exceldiff',
  'excel_diff',
  'validatordiff',
  'validator_diff',
  'displaymsgdiff',
  'display_msg_diff',
  'viewrolediff',
  'view_role_diff'
]);

/**
 * Checks if a column definition is a searchable text/data column
 * and excludes action buttons, diff buttons, config links, and sync buttons.
 */
export const isFilterableColumn = (col) => {
  if (!col || !col.field) return false;
  if (col.filter === false || col.floatingFilter === false || col.isButton || col.isAction) return false;

  const rawHeader = String(col.headerName ?? col.header ?? '').trim();
  if (!rawHeader) return false;

  const strField = String(col.field).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (NON_FILTERABLE_EXACT_FIELDS.has(strField)) return false;

  const headerLower = rawHeader.toLowerCase();

  // Exclude action / button headers
  if (
    headerLower === 'view data' ||
    headerLower === 'view query' ||
    headerLower === 'view role diff' ||
    headerLower === 'site 1 config' ||
    headerLower === 'site 2 config' ||
    headerLower === 'display msg' ||
    headerLower === 'excel diff' ||
    headerLower === 'validator diff' ||
    headerLower === 'datatable diff' ||
    headerLower === 'query diff' ||
    headerLower === 'other diff' ||
    headerLower === 'custom form diff' ||
    headerLower === 'master config diff' ||
    headerLower === 'role diff' ||
    headerLower === 'task entity diff'
  ) {
    return false;
  }

  // If header ends with " DIFF" and is NOT a STATUS
  if (headerLower.endsWith(' diff') && !headerLower.includes('status')) {
    return false;
  }

  return true;
};

/**
 * Transforms column header text into a user-friendly filter label (e.g. "SITE VERSION" -> "Site Version")
 */
export const formatFilterLabel = (headerName) => {
  if (!headerName) return '';
  const str = String(headerName).trim();
  return str
    .split(/\s+/)
    .map(word => {
      if (/^BO$/i.test(word)) return 'BO';
      if (/^SITE1$/i.test(word)) return 'Site 1';
      if (/^SITE2$/i.test(word)) return 'Site 2';
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

/**
 * Extracts all filterable column definitions from a list of colDefs
 */
export const getFilterableColumns = (colDefs) => {
  if (!Array.isArray(colDefs)) return [];
  return colDefs.filter(isFilterableColumn).map(col => ({
    field: col.field,
    label: formatFilterLabel(col.headerName || col.header || col.field),
    originalColDef: col
  }));
};

/**
 * Filters rows based on active filter criteria across multiple column fields
 */
export const filterRowsByColDefs = (rows, appliedFilters, filterableCols) => {
  if (!Array.isArray(rows)) return [];
  if (!appliedFilters || Object.keys(appliedFilters).length === 0) return rows;

  let list = rows;

  filterableCols.forEach(({ field }) => {
    const filterValue = (appliedFilters[field] ?? '').trim();
    if (!filterValue) return;

    list = matchSorter(list, filterValue, {
      keys: [
        field,
        (item) => item[field],
        (item) => item.raw?.[field],
        (item) => item.raw1?.[field],
        (item) => item.raw2?.[field],
        // Additional fallback matchers for tag / title / name
        ...(field === 'tag'
          ? [
            'title',
            'tag_name',
            'role',
            'wf_name',
            'wf_code',
            'module',
            'entity_type',
            (item) => item.raw?.title || '',
            (item) => item.raw1?.title || '',
            (item) => item.raw2?.title || '',
            (item) => item.raw1?.tag || '',
            (item) => item.raw2?.tag || '',
          ]
          : []),
      ],
      threshold: matchSorter.rankings.CONTAINS,
    });
  });

  return list;
};
