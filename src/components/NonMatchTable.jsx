import React, { useState, useMemo, useCallback, memo } from 'react';
import { AGGridGenerator } from './AGGridGenerator';
import { getOptionConfig } from '../config';
import { useDiffChecker } from '../context/DiffCheckerContext';
import { getFilterableColumns, filterRowsByColDefs } from '../utils/filterUtils';
import TableFilterBar from './TableFilterBar';

const noop = () => { };

export const NonMatchTable = memo(({
  activeOption: propActiveOption,
  nonMatchRows,
  onlySourceRows,
  onlySite1Rows = [],
  openDataViewer: propOpenDataViewer,
  openDiffViewer: propOpenDiffViewer,
  baseUrl1: propBaseUrl1,
  baseUrl2: propBaseUrl2,
  showToast: propShowToast,
}) => {
  const ctx = useDiffChecker();
  const activeOption = propActiveOption || ctx.activeOption;
  const openDataViewer = propOpenDataViewer || ctx.openDataViewer || noop;
  const openDiffViewer = propOpenDiffViewer || ctx.openDiffViewer || noop;
  const showToast = propShowToast || ctx.showToast || noop;
  const baseUrl1 = propBaseUrl1 !== undefined ? propBaseUrl1 : ctx.baseUrl1;
  const baseUrl2 = propBaseUrl2 !== undefined ? propBaseUrl2 : ctx.baseUrl2;

  const effectiveRows = useMemo(() => {
    if (Array.isArray(nonMatchRows)) return nonMatchRows;
    if (Array.isArray(onlySourceRows)) return onlySourceRows;
    if (Array.isArray(onlySite1Rows)) return onlySite1Rows;
    return [];
  }, [nonMatchRows, onlySourceRows, onlySite1Rows]);

  const [showFilters, setShowFilters] = useState(true);
  const [filterInputs, setFilterInputs] = useState({});
  const [appliedFilters, setAppliedFilters] = useState({});
  const [filterMode, setFilterMode] = useState('only_diff');

  // Load configuration based on the active dropdown page option
  const config = getOptionConfig(activeOption);

  const columns = useMemo(() => {
    if (!config) return {};
    return config.getColumns({
      openDiffViewer,
      openDataViewer,
      handleSyncConfiguration: noop,
      handleCloneConfiguration: noop,
      showToast,
      baseUrl1,
      baseUrl2
    });
  }, [config, openDiffViewer, openDataViewer, showToast, baseUrl1, baseUrl2]);

  const nonMatchColDefs = columns.nonMatchColDefs || columns.sourceColDefs || columns.site1ColDefs || [];

  // Extract filterable columns dynamically from nonMatchColDefs
  const filterableCols = useMemo(() => {
    return getFilterableColumns(nonMatchColDefs);
  }, [nonMatchColDefs]);

  const handleFilterInputChange = useCallback((field, value) => {
    setFilterInputs((prev) => ({ ...prev, [field]: value }));
    setAppliedFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(() => {
    setAppliedFilters({ ...filterInputs });
  }, [filterInputs]);

  const handleReset = useCallback(() => {
    setFilterInputs({});
    setAppliedFilters({});
  }, []);

  // Filtered rows logic
  const filteredRows = useMemo(() => {
    let list = filterRowsByColDefs(effectiveRows, appliedFilters, filterableCols);
    return list;
  }, [effectiveRows, appliedFilters, filterableCols, filterMode]);

  return (
    <section className="dc-table-card">
      <div className="dc-table-header">
        <div className="dc-table-header-left"></div>
        <h3 className="dc-table-title dc-table-header-center">
          NON MATCH RECORD
        </h3>
        <div className="dc-table-header-right">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="dc-toggle-filter-btn"
          >
            <span>{showFilters ? 'Hide filters' : 'Show filters'}</span>
            <span className={`dc-arrow-rotate ${showFilters ? 'up' : 'down'}`}>▲</span>
          </button>
        </div>
      </div>

      {/* Global Filter Bar above Table */}
      <TableFilterBar
        showFilters={showFilters}
        filterableCols={filterableCols}
        filterInputs={filterInputs}
        onFilterInputChange={handleFilterInputChange}
        onSubmit={handleSubmit}
        onReset={handleReset}
        rightControls={
          <div className="dc-filter-mode-group">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`dc-filter-mode-btn ${filterMode === 'all' ? 'active' : ''}`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('only_diff')}
              className={`dc-filter-mode-btn ${filterMode === 'only_diff' ? 'active' : ''}`}
            >
              Only Difference
            </button>
          </div>
        }
      />

      {/* AG Grid Table */}
      <AGGridGenerator
        rowData={filteredRows}
        columnDefs={nonMatchColDefs}
        showFloatingFilter={false}
        minHeight="250px"
        maxHeight="460px"
        noRowsMessage="We couldn't find any matches!!"
      />

      <div className="dc-records-footer">
        <div className="dc-records-count-filtered">
          Filtered Records: {filteredRows.length} records | Actual Records: {effectiveRows.length} records
        </div>
      </div>
    </section>
  );
});

export default NonMatchTable;
