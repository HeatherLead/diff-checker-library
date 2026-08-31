import { matchSorter } from 'match-sorter';
import { NON_FILTERABLE_EXACT_FIELDS, VIEW_DIFF_FIELDS, DIFF_CHANGES_FIELDS } from '../constants/constants';

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

export const getFilterableColumns = (colDefs) => {
  if (!Array.isArray(colDefs)) return [];
  return colDefs.filter(isFilterableColumn).map(col => ({
    field: col.field,
    label: formatFilterLabel(col.headerName || col.header || col.field),
    originalColDef: col
  }));
};

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

/**
 * Checks whether a data diff row represents an actual difference.
 */
export const isDiffRow = (r) => {
  if (!r || typeof r !== 'object') return false;

  // 1. Explicit boolean diff flags
  if (r.hasOtherDiff === true || r.hasDiff === true || r.hasStructDiff === true || r.hasQueryDiff === true) {
    return true;
  }

  // 2. Count comparisons (e.g. SubTaskMaster)
  if (r.countSite1 !== undefined && r.countSite2 !== undefined && r.countSite1 !== r.countSite2) {
    return true;
  }

  // 3. Check known VIEW_DIFF_FIELDS
  for (const field of VIEW_DIFF_FIELDS) {
    const val = r[field];
    if (typeof val === 'string' && val.trim().toLowerCase() === 'view diff') {
      return true;
    }
  }

  // 4. Check known DIFF_CHANGES_FIELDS
  for (const field of DIFF_CHANGES_FIELDS) {
    const val = r[field];
    if (typeof val === 'string' && val.trim().toLowerCase() === 'diff changes') {
      return true;
    }
  }

  // 5. Dynamic field check for any other diff / status fields
  for (const [key, val] of Object.entries(r)) {
    if (typeof val === 'string') {
      const lower = val.trim().toLowerCase();
      if (lower === 'view diff' || lower === 'diff changes') {
        return true;
      }
      if (
        (key.toLowerCase().includes('diff') || key.toLowerCase().includes('status')) &&
        (lower.includes('diff') || lower.includes('change')) &&
        !lower.includes('no diff') &&
        !lower.includes('no change') &&
        !lower.includes('no match')
      ) {
        return true;
      }
    }
  }

  return false;
};

