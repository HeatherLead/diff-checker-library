import React, { useState, useMemo, memo } from 'react';
import { AGGridGenerator } from './AGGridGenerator';
import { getOptionConfig } from '../config';
import { useDiffChecker } from '../context/DiffCheckerContext';
import { getFilterableColumns, filterRowsByColDefs } from '../utils/filterUtils';
import { ensureAbsoluteUrl } from '../utils/cellRenderers';
import TableFilterBar from './TableFilterBar';

export const OnlySiteTable = memo(({
  activeOption: propActiveOption,
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

  const [showSite1Filters, setShowSite1Filters] = useState(false);
  const [site1FilterInputs, setSite1FilterInputs] = useState({});
  const [appliedSite1Filters, setAppliedSite1Filters] = useState({});

  const [showSite2Filters, setShowSite2Filters] = useState(false);
  const [site2FilterInputs, setSite2FilterInputs] = useState({});
  const [appliedSite2Filters, setAppliedSite2Filters] = useState({});

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

  const site1ColDefs = columns.site1ColDefs;
  const site2ColDefs = columns.site2ColDefs;

  // Dynamically extract filterable columns
  const site1FilterableCols = useMemo(() => {
    return getFilterableColumns(site1ColDefs);
  }, [site1ColDefs]);

  const site2FilterableCols = useMemo(() => {
    return getFilterableColumns(site2ColDefs);
  }, [site2ColDefs]);

  const handleSite1FilterInputChange = (field, value) => {
    setSite1FilterInputs((prev) => ({ ...prev, [field]: value }));
    setAppliedSite1Filters((prev) => ({ ...prev, [field]: value }));
  };

  const handleSite1Submit = () => {
    setAppliedSite1Filters({ ...site1FilterInputs });
  };

  const handleSite1Reset = () => {
    setSite1FilterInputs({});
    setAppliedSite1Filters({});
  };

  const handleSite2FilterInputChange = (field, value) => {
    setSite2FilterInputs((prev) => ({ ...prev, [field]: value }));
    setAppliedSite2Filters((prev) => ({ ...prev, [field]: value }));
  };

  const handleSite2Submit = () => {
    setAppliedSite2Filters({ ...site2FilterInputs });
  };

  const handleSite2Reset = () => {
    setSite2FilterInputs({});
    setAppliedSite2Filters({});
  };

  // Filtered rows logic
  const filteredSite1Rows = useMemo(() => {
    return filterRowsByColDefs(onlySite1Rows, appliedSite1Filters, site1FilterableCols);
  }, [onlySite1Rows, appliedSite1Filters, site1FilterableCols]);

  const filteredSite2Rows = useMemo(() => {
    return filterRowsByColDefs(onlySite2Rows, appliedSite2Filters, site2FilterableCols);
  }, [onlySite2Rows, appliedSite2Filters, site2FilterableCols]);

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
                onClick={() => setShowSite1Filters(!showSite1Filters)}
                className="dc-toggle-filter-btn"
              >
                <span>{showSite1Filters ? 'Hide filters' : 'Show filters'}</span>
                <span className={`dc-arrow-rotate ${showSite1Filters ? 'up' : 'down'}`}>▲</span>
              </button>
            </div>
          </div>

          {/* Global Filter Bar */}
          <TableFilterBar
            showFilters={showSite1Filters}
            filterableCols={site1FilterableCols}
            filterInputs={site1FilterInputs}
            onFilterInputChange={handleSite1FilterInputChange}
            onSubmit={handleSite1Submit}
            onReset={handleSite1Reset}
          />

          <div>
            <AGGridGenerator
              rowData={filteredSite1Rows}
              columnDefs={site1ColDefs}
              defaultColDef={{ minWidth: 130, resizable: true }}
              showFloatingFilter={false}
              minHeight="250px"
              maxHeight="440px"
            />
          </div>

          <div className="dc-records-footer">
            <div className="dc-records-count">
              Total Records: {filteredSite1Rows.length} records
            </div>
            {filteredSite1Rows.length > 0 && (
              <div className="dc-records-total-count">
                <span>Total Records: <span>{filteredSite1Rows.length}</span></span>
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="dc-grid-2col">
      {/* Left Side: ONLY SITE 1 DATATABLES */}
      <section className="dc-table-card">
        <div className="dc-table-header">
          <div className="dc-table-header-spacer"></div>
          <div className="dc-table-header-center-wide">
            <h3 className="dc-table-title">
              ONLY SITE 1 DATATABLES
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
              onClick={() => setShowSite1Filters(!showSite1Filters)}
              className="dc-toggle-filter-btn"
            >
              <span>{showSite1Filters ? 'Hide filters' : 'Show filters'}</span>
              <span className={`dc-arrow-rotate ${showSite1Filters ? 'up' : 'down'}`}>▲</span>
            </button>
          </div>
        </div>

        {/* Global Filter Bar for Site 1 */}
        <TableFilterBar
          showFilters={showSite1Filters}
          filterableCols={site1FilterableCols}
          filterInputs={site1FilterInputs}
          onFilterInputChange={handleSite1FilterInputChange}
          onSubmit={handleSite1Submit}
          onReset={handleSite1Reset}
        />

        <div>
          <AGGridGenerator
            rowData={filteredSite1Rows}
            columnDefs={site1ColDefs}
            defaultColDef={{ minWidth: 130, resizable: true }}
            showFloatingFilter={false}
            minHeight="250px"
            maxHeight="440px"
          />
        </div>

        <div className="dc-records-footer">
          <div className="dc-records-count">
            Total Records: {filteredSite1Rows.length} records
          </div>
          {filteredSite1Rows.length > 0 && (
            <div className="dc-records-total-count">
              <span>Total Records: <span>{filteredSite1Rows.length}</span></span>
            </div>
          )}
        </div>
      </section>

      {/* Right Side: ONLY SITE 2 DATATABLES */}
      <section className="dc-table-card">
        <div className="dc-table-header">
          <div className="dc-table-header-spacer"></div>
          <div className="dc-table-header-center-wide">
            <h3 className="dc-table-title">
              ONLY SITE 2 DATATABLES
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
              onClick={() => setShowSite2Filters(!showSite2Filters)}
              className="dc-toggle-filter-btn"
            >
              <span>{showSite2Filters ? 'Hide filters' : 'Show filters'}</span>
              <span className={`dc-arrow-rotate ${showSite2Filters ? 'up' : 'down'}`}>▲</span>
            </button>
          </div>
        </div>

        {/* Global Filter Bar for Site 2 */}
        <TableFilterBar
          showFilters={showSite2Filters}
          filterableCols={site2FilterableCols}
          filterInputs={site2FilterInputs}
          onFilterInputChange={handleSite2FilterInputChange}
          onSubmit={handleSite2Submit}
          onReset={handleSite2Reset}
        />

        <div>
          <AGGridGenerator
            rowData={filteredSite2Rows}
            columnDefs={site2ColDefs}
            defaultColDef={{ minWidth: 130, resizable: true }}
            showFloatingFilter={false}
            minHeight="250px"
            maxHeight="440px"
          />
        </div>

        <div className="dc-records-footer">
          <div className="dc-records-count">
            Total Records: {filteredSite2Rows.length} records
          </div>
          {filteredSite2Rows.length > 0 && (
            <div className="dc-records-total-count">
              <span>Total Records: <span>{filteredSite2Rows.length}</span></span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
});

export default OnlySiteTable;
