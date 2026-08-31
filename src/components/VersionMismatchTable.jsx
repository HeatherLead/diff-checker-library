import React, { useState, useMemo, memo } from 'react';
import { AGGridGenerator } from './AGGridGenerator';
import { getOptionConfig } from '../config';
import { useDiffChecker } from '../context/DiffCheckerContext';
import { getFilterableColumns, filterRowsByColDefs, isDiffRow } from '../utils/filterUtils';
import TableFilterBar from './TableFilterBar';

export const VersionMismatchTable = memo(({
  activeOption: propActiveOption,
  versionMismatchRows = [],
  openDiffViewer: propOpenDiffViewer,
  baseUrl1: propBaseUrl1,
  baseUrl2: propBaseUrl2
}) => {
  const ctx = useDiffChecker();
  const activeOption = propActiveOption || ctx.activeOption;
  const openDiffViewer = propOpenDiffViewer || ctx.openDiffViewer || (() => { });
  const baseUrl1 = propBaseUrl1 !== undefined ? propBaseUrl1 : ctx.baseUrl1;
  const baseUrl2 = propBaseUrl2 !== undefined ? propBaseUrl2 : ctx.baseUrl2;

  const [showVersionFilters, setShowVersionFilters] = useState(false);
  const [filterInputs, setFilterInputs] = useState({});
  const [appliedFilters, setAppliedFilters] = useState({});
  const [versionFilterMode, setVersionFilterMode] = useState('only_diff');

  // Load configuration based on the active dropdown page option
  const config = getOptionConfig(activeOption);

  const columns = useMemo(() => {
    if (!config || !config.hasVersionMismatch) return {};
    return config.getColumns({
      openDiffViewer,
      openDataViewer: () => { },
      handleSyncConfiguration: () => { },
      handleCloneConfiguration: () => { },
      showToast: () => { },
      baseUrl1,
      baseUrl2
    });
  }, [config, openDiffViewer, baseUrl1, baseUrl2]);

  const versionMismatchColDefs = columns?.versionMismatchColDefs;

  // Extract filterable columns dynamically from versionMismatchColDefs
  const filterableCols = useMemo(() => {
    return getFilterableColumns(versionMismatchColDefs);
  }, [versionMismatchColDefs]);

  // If this configuration option does not have version mismatch records, do not render anything
  if (!config || !config.hasVersionMismatch) {
    return null;
  }

  const handleFilterInputChange = (field, value) => {
    setFilterInputs((prev) => ({ ...prev, [field]: value }));
    setAppliedFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    setAppliedFilters({ ...filterInputs });
  };

  const handleReset = () => {
    setFilterInputs({});
    setAppliedFilters({});
  };

  // Filtered rows logic
  const filteredVersionMismatchRows = useMemo(() => {
    let list = filterRowsByColDefs(versionMismatchRows, appliedFilters, filterableCols);
    if (versionFilterMode === 'only_diff') {
      list = list.filter(isDiffRow);
    }
    return list;
  }, [versionMismatchRows, appliedFilters, filterableCols, versionFilterMode]);

  return (
    <section className="dc-table-card">
      <div className="dc-table-header">
        <div className="dc-table-header-left"></div>
        <h3 className="dc-table-title dc-table-header-center">
          VERSION MISMATCH
        </h3>
        <div className="dc-table-header-right">
          <button
            onClick={() => setShowVersionFilters(!showVersionFilters)}
            className="dc-toggle-filter-btn"
          >
            <span>{showVersionFilters ? 'Hide filters' : 'Show filters'}</span>
            <span className={`dc-arrow-rotate ${showVersionFilters ? 'up' : 'down'}`}>▲</span>
          </button>
        </div>
      </div>

      {/* Global Filter Bar above Table */}
      <TableFilterBar
        showFilters={showVersionFilters}
        filterableCols={filterableCols}
        filterInputs={filterInputs}
        onFilterInputChange={handleFilterInputChange}
        onSubmit={handleSubmit}
        onReset={handleReset}
        rightControls={
          <div className="dc-filter-mode-group">
            <button
              type="button"
              onClick={() => setVersionFilterMode('all')}
              className={`dc-filter-mode-btn ${versionFilterMode === 'all' ? 'active' : ''}`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setVersionFilterMode('only_diff')}
              className={`dc-filter-mode-btn ${versionFilterMode === 'only_diff' ? 'active' : ''}`}
            >
              Only Difference
            </button>
          </div>
        }
      />

      {/* AG Grid Table */}
      <AGGridGenerator
        rowData={filteredVersionMismatchRows}
        columnDefs={versionMismatchColDefs}
        showFloatingFilter={false}
        minHeight="250px"
        maxHeight="460px"
      />

      <div className="dc-records-footer">
        <div className="dc-records-count-filtered">
          Filtered Records: {filteredVersionMismatchRows.length} records | Actual Records: {versionMismatchRows.length} records
        </div>
        {filteredVersionMismatchRows.length > 0 && (
          <div className="dc-records-total-count">
            <span>Total Records: <span>{filteredVersionMismatchRows.length}</span></span>
          </div>
        )}
      </div>
    </section>
  );
});

export default VersionMismatchTable;
