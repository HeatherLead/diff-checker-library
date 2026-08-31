import React, { useState, useMemo, memo } from 'react';
import { AGGridGenerator } from './AGGridGenerator';
import { getOptionConfig } from '../config';
import { useDiffChecker } from '../context/DiffCheckerContext';
import { getFilterableColumns, filterRowsByColDefs } from '../utils/filterUtils';
import { ensureAbsoluteUrl } from '../utils/cellRenderers';
import TableFilterBar from './TableFilterBar';

export const OnlySiteTable = memo(({
  activeOption: propActiveOption,
  onlySourceRows,
  onlyTargetRows,
  onlySite1Rows = [],
  onlySite2Rows = [],
  baseUrl1: propBaseUrl1,
  baseUrl2: propBaseUrl2,
  openDataViewer: propOpenDataViewer,
  handleCloneConfiguration: propHandleCloneConfiguration
}) => {
  const ctx = useDiffChecker();
  const activeOption = propActiveOption || ctx.activeOption;
  const baseUrl1 = propBaseUrl1 !== undefined ? propBaseUrl1 : ctx.baseUrl1;
  const baseUrl2 = propBaseUrl2 !== undefined ? propBaseUrl2 : ctx.baseUrl2;
  const openDataViewer = propOpenDataViewer || ctx.openDataViewer || (() => { });
  const handleCloneConfiguration = propHandleCloneConfiguration || ctx.handleCloneConfiguration || (() => { });

  const effectiveSourceRows = onlySourceRows !== undefined ? onlySourceRows : onlySite1Rows;
  const effectiveTargetRows = onlyTargetRows !== undefined ? onlyTargetRows : onlySite2Rows;

  const [showSourceFilters, setShowSourceFilters] = useState(false);
  const [sourceFilterInputs, setSourceFilterInputs] = useState({});
  const [appliedSourceFilters, setAppliedSourceFilters] = useState({});

  const [showTargetFilters, setShowTargetFilters] = useState(false);
  const [targetFilterInputs, setTargetFilterInputs] = useState({});
  const [appliedTargetFilters, setAppliedTargetFilters] = useState({});

  // Load configuration based on the active dropdown page option
  const config = getOptionConfig(activeOption);

  const columns = useMemo(() => {
    if (!config) return {};
    return config.getColumns({
      openDiffViewer: () => { },
      openDataViewer,
      handleSyncConfiguration: () => { },
      handleCloneConfiguration,
      showToast: () => { },
      baseUrl1,
      baseUrl2
    });
  }, [config, openDataViewer, handleCloneConfiguration, baseUrl1, baseUrl2]);

  const sourceColDefs = columns.sourceColDefs || columns.site1ColDefs;
  const targetColDefs = columns.targetColDefs || columns.site2ColDefs;

  // Dynamically extract filterable columns
  const sourceFilterableCols = useMemo(() => {
    return getFilterableColumns(sourceColDefs);
  }, [sourceColDefs]);

  const targetFilterableCols = useMemo(() => {
    return getFilterableColumns(targetColDefs);
  }, [targetColDefs]);

  const handleSourceFilterInputChange = (field, value) => {
    setSourceFilterInputs((prev) => ({ ...prev, [field]: value }));
    setAppliedSourceFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleSourceSubmit = () => {
    setAppliedSourceFilters({ ...sourceFilterInputs });
  };

  const handleSourceReset = () => {
    setSourceFilterInputs({});
    setAppliedSourceFilters({});
  };

  const handleTargetFilterInputChange = (field, value) => {
    setTargetFilterInputs((prev) => ({ ...prev, [field]: value }));
    setAppliedTargetFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleTargetSubmit = () => {
    setAppliedTargetFilters({ ...targetFilterInputs });
  };

  const handleTargetReset = () => {
    setTargetFilterInputs({});
    setAppliedTargetFilters({});
  };

  // Filtered rows logic
  const filteredSourceRows = useMemo(() => {
    return filterRowsByColDefs(effectiveSourceRows, appliedSourceFilters, sourceFilterableCols);
  }, [effectiveSourceRows, appliedSourceFilters, sourceFilterableCols]);

  const filteredTargetRows = useMemo(() => {
    return filterRowsByColDefs(effectiveTargetRows, appliedTargetFilters, targetFilterableCols);
  }, [effectiveTargetRows, appliedTargetFilters, targetFilterableCols]);

  // If this configuration option does not show site-specific tables, do not render anything
  if (config.hasOnlySiteTables === false) {
    return null;
  }

  // Unified non-matching records view
  if (config.hasNonMatchTable) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        <section className="dc-table-card">
          <div className="dc-table-header">
            <div className="dc-table-header-spacer"></div>
            <div className="dc-table-header-center-wide">
              <h3 className="dc-table-title">
                NON MATCH RECORD
              </h3>
            </div>
            <div className="dc-table-header-right-quarter">
              <button
                onClick={() => setShowSourceFilters(!showSourceFilters)}
                className="dc-toggle-filter-btn"
              >
                <span>{showSourceFilters ? 'Hide filters' : 'Show filters'}</span>
                <span className={`dc-arrow-rotate ${showSourceFilters ? 'up' : 'down'}`}>▲</span>
              </button>
            </div>
          </div>

          {/* Global Filter Bar */}
          <TableFilterBar
            showFilters={showSourceFilters}
            filterableCols={sourceFilterableCols}
            filterInputs={sourceFilterInputs}
            onFilterInputChange={handleSourceFilterInputChange}
            onSubmit={handleSourceSubmit}
            onReset={handleSourceReset}
          />

          <div>
            <AGGridGenerator
              rowData={filteredSourceRows}
              columnDefs={sourceColDefs}
              defaultColDef={{ minWidth: 130, resizable: true }}
              showFloatingFilter={false}
              minHeight="250px"
              maxHeight="440px"
            />
          </div>

          <div className="dc-records-footer">
            <div className="dc-records-count">
              Total Records: {filteredSourceRows.length} records
            </div>
            {filteredSourceRows.length > 0 && (
              <div className="dc-records-total-count">
                <span>Total Records: <span>{filteredSourceRows.length}</span></span>
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  const optionUpper = ctx.activeOptionLabel ? ctx.activeOptionLabel.toUpperCase() : 'DATATABLES';

  return (
    <div className="dc-grid-2col">
      {/* Left Side: ONLY SOURCE */}
      <section className="dc-table-card">
        <div className="dc-table-header">
          <div className="dc-table-header-spacer"></div>
          <div className="dc-table-header-center-wide">
            <h3 className="dc-table-title">
              ONLY SOURCE {optionUpper}
            </h3>
            <a
              href={ensureAbsoluteUrl(baseUrl1)}
              target="_blank"
              rel="noreferrer"
              className="dc-table-url"
            >
              {baseUrl1}
            </a>
          </div>
          <div className="dc-table-header-right-quarter">
            <button
              onClick={() => setShowSourceFilters(!showSourceFilters)}
              className="dc-toggle-filter-btn"
            >
              <span>{showSourceFilters ? 'Hide filters' : 'Show filters'}</span>
              <span className={`dc-arrow-rotate ${showSourceFilters ? 'up' : 'down'}`}>▲</span>
            </button>
          </div>
        </div>

        {/* Global Filter Bar for Source */}
        <TableFilterBar
          showFilters={showSourceFilters}
          filterableCols={sourceFilterableCols}
          filterInputs={sourceFilterInputs}
          onFilterInputChange={handleSourceFilterInputChange}
          onSubmit={handleSourceSubmit}
          onReset={handleSourceReset}
        />

        <div>
          <AGGridGenerator
            rowData={filteredSourceRows}
            columnDefs={sourceColDefs}
            defaultColDef={{ minWidth: 130, resizable: true }}
            showFloatingFilter={false}
            minHeight="250px"
            maxHeight="440px"
          />
        </div>

        <div className="dc-records-footer">
          <div className="dc-records-count">
            Total Records: {filteredSourceRows.length} records
          </div>
          {filteredSourceRows.length > 0 && (
            <div className="dc-records-total-count">
              <span>Total Records: <span>{filteredSourceRows.length}</span></span>
            </div>
          )}
        </div>
      </section>

      {/* Right Side: ONLY TARGET */}
      <section className="dc-table-card">
        <div className="dc-table-header">
          <div className="dc-table-header-spacer"></div>
          <div className="dc-table-header-center-wide">
            <h3 className="dc-table-title">
              ONLY TARGET {optionUpper}
            </h3>
            <a
              href={ensureAbsoluteUrl(baseUrl2)}
              target="_blank"
              rel="noreferrer"
              className="dc-table-url"
            >
              {baseUrl2}
            </a>
          </div>
          <div className="dc-table-header-right-quarter">
            <button
              onClick={() => setShowTargetFilters(!showTargetFilters)}
              className="dc-toggle-filter-btn"
            >
              <span>{showTargetFilters ? 'Hide filters' : 'Show filters'}</span>
              <span className={`dc-arrow-rotate ${showTargetFilters ? 'up' : 'down'}`}>▲</span>
            </button>
          </div>
        </div>

        {/* Global Filter Bar for TARGET */}
        <TableFilterBar
          showFilters={showTargetFilters}
          filterableCols={targetFilterableCols}
          filterInputs={targetFilterInputs}
          onFilterInputChange={handleTargetFilterInputChange}
          onSubmit={handleTargetSubmit}
          onReset={handleTargetReset}
        />

        <div>
          <AGGridGenerator
            rowData={filteredTargetRows}
            columnDefs={targetColDefs}
            defaultColDef={{ minWidth: 130, resizable: true }}
            showFloatingFilter={false}
            minHeight="250px"
            maxHeight="440px"
          />
        </div>

        <div className="dc-records-footer">
          <div className="dc-records-count">
            Total Records: {filteredTargetRows.length} records
          </div>
          {filteredTargetRows.length > 0 && (
            <div className="dc-records-total-count">
              <span>Total Records: <span>{filteredTargetRows.length}</span></span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
});

export default OnlySiteTable;
