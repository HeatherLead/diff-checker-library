import React, { useState, useMemo, memo } from 'react';
import { AGGridGenerator } from './AGGridGenerator';
import { getOptionConfig } from '../config';
import { useDiffChecker } from '../context/DiffCheckerContext';
import { getFilterableColumns, filterRowsByColDefs } from '../utils/filterUtils';
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
    return list;
  }, [versionMismatchRows, appliedFilters, filterableCols]);

  return (
    <section className="bg-white rounded-lg p-5">
      <div className="flex items-center justify-between border-b pb-2 mb-4">
        <div className="w-1/3"></div>
        <h3 className="text-center text-sm font-bold text-gray-700 uppercase tracking-wider w-1/3">
          VERSION MISMATCH
        </h3>
        <div className="w-1/3 flex justify-end">
          <button
            onClick={() => setShowVersionFilters(!showVersionFilters)}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center space-x-1 cursor-pointer transition-colors duration-150 select-none"
          >
            <span>{showVersionFilters ? 'Hide filters' : 'Show filters'}</span>
            <span className={`inline-block text-[10px] transform transition-transform duration-300 ease-in-out ${showVersionFilters ? 'rotate-0' : 'rotate-180'}`}>▲</span>
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
          <div className="flex items-center border border-gray-300 rounded overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => setVersionFilterMode('all')}
              className={`px-4 py-1.5 text-xs cursor-pointer transition-colors ${versionFilterMode === 'all'
                ? 'bg-[#7a1c4b] text-white font-medium'
                : 'bg-white text-gray-700 hover:bg-gray-100 font-normal'
                }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setVersionFilterMode('only_diff')}
              className={`px-4 py-1.5 text-xs cursor-pointer transition-colors ${versionFilterMode === 'only_diff'
                ? 'bg-[#7a1c4b] text-white font-medium'
                : 'bg-white text-gray-700 hover:bg-gray-100 font-normal'
                }`}
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

      <div className="mt-2 text-xs italic text-red-600 font-normal">
        Filtered Records: {filteredVersionMismatchRows.length} records | Actual Records: {versionMismatchRows.length} records
      </div>
    </section>
  );
});

export default VersionMismatchTable;
