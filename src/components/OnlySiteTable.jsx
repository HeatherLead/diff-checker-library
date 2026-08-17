import React, { useState, useMemo, memo } from 'react';
import { AGGridGenerator } from './AGGridGenerator';
import { getOptionConfig } from '../config';
import { useDiffChecker } from '../context/DiffCheckerContext';
import { getFilterableColumns, filterRowsByColDefs } from '../utils/filterUtils';
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
      <div className="grid grid-cols-1 gap-6">
        <section className="bg-white rounded-lg p-5 min-w-0 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between border-b pb-2 mb-4">
            <div className="w-1/4"></div>
            <div className="text-center w-2/4">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                NON MATCH RECORD
              </h3>
            </div>
            <div className="w-1/4 flex justify-end">
              <button
                onClick={() => setShowSite1Filters(!showSite1Filters)}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center space-x-1 cursor-pointer transition-colors duration-150 select-none"
              >
                <span>{showSite1Filters ? 'Hide filters' : 'Show filters'}</span>
                <span className={`inline-block text-[10px] transform transition-transform duration-300 ease-in-out ${showSite1Filters ? 'rotate-0' : 'rotate-180'}`}>▲</span>
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

          <div className="mt-2 text-xs italic text-gray-600 font-normal">
            Total Records: {filteredSite1Rows.length} records
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left Side: ONLY SITE 1 DATATABLES */}
      <section className="bg-white rounded-lg p-5 min-w-0 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between border-b pb-2 mb-4">
          <div className="w-1/4"></div>
          <div className="text-center w-2/4">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
              ONLY SITE 1 DATATABLES
            </h3>
            <a
              href={baseUrl1}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-indigo-600 hover:underline font-normal block truncate max-w-xs mx-auto"
            >
              {baseUrl1}
            </a>
          </div>
          <div className="w-1/4 flex justify-end">
            <button
              onClick={() => setShowSite1Filters(!showSite1Filters)}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center space-x-1 cursor-pointer transition-colors duration-150 select-none"
            >
              <span>{showSite1Filters ? 'Hide filters' : 'Show filters'}</span>
              <span className={`inline-block text-[10px] transform transition-transform duration-300 ease-in-out ${showSite1Filters ? 'rotate-0' : 'rotate-180'}`}>▲</span>
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

        <div className="mt-2 text-xs italic text-gray-600 font-normal">
          Total Records: {filteredSite1Rows.length} records
        </div>
      </section>

      {/* Right Side: ONLY SITE 2 DATATABLES */}
      <section className="bg-white rounded-lg p-5 min-w-0 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between border-b pb-2 mb-4">
          <div className="w-1/4"></div>
          <div className="text-center w-2/4">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
              ONLY SITE 2 DATATABLES
            </h3>
            <a
              href={baseUrl2}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-indigo-600 hover:underline font-normal block truncate max-w-xs mx-auto"
            >
              {baseUrl2}
            </a>
          </div>
          <div className="w-1/4 flex justify-end">
            <button
              onClick={() => setShowSite2Filters(!showSite2Filters)}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center space-x-1 cursor-pointer transition-colors duration-150 select-none"
            >
              <span>{showSite2Filters ? 'Hide filters' : 'Show filters'}</span>
              <span className={`inline-block text-[10px] transform transition-transform duration-300 ease-in-out ${showSite2Filters ? 'rotate-0' : 'rotate-180'}`}>▲</span>
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

        <div className="mt-2 text-xs italic text-gray-600 font-normal">
          Total Records: {filteredSite2Rows.length} records
        </div>
      </section>
    </div>
  );
});

export default OnlySiteTable;
