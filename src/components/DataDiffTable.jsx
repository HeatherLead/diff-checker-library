import React, { useState, useMemo, useCallback, memo } from 'react';
import { AGGridGenerator } from './AGGridGenerator';
import { getOptionConfig } from '../config';
import { useDiffChecker } from '../context/DiffCheckerContext';
import { getFilterableColumns, filterRowsByColDefs } from '../utils/filterUtils';
import TableFilterBar from './TableFilterBar';
import { VIEW_DIFF_FIELDS, DIFF_CHANGES_FIELDS } from '../constants/constants';

const noop = () => { };

export const DataDiffTable = memo(({
  activeOption: propActiveOption,
  dataDiffRows = [],
  openDiffViewer: propOpenDiffViewer,
  handleSyncConfiguration: propHandleSyncConfiguration,
  showToast: propShowToast,
  baseUrl1: propBaseUrl1,
  baseUrl2: propBaseUrl2
}) => {
  const ctx = useDiffChecker();
  const activeOption = propActiveOption || ctx.activeOption;
  const openDiffViewer = propOpenDiffViewer || ctx.openDiffViewer || noop;
  const handleSyncConfiguration = propHandleSyncConfiguration || ctx.handleSyncConfiguration || noop;
  const showToast = propShowToast || ctx.showToast || noop;
  const baseUrl1 = propBaseUrl1 !== undefined ? propBaseUrl1 : ctx.baseUrl1;
  const baseUrl2 = propBaseUrl2 !== undefined ? propBaseUrl2 : ctx.baseUrl2;

  const [showDataDiffFilters, setShowDataDiffFilters] = useState(false);
  const [filterInputs, setFilterInputs] = useState({});
  const [appliedFilters, setAppliedFilters] = useState({});
  const [dataDiffFilterMode, setDataDiffFilterMode] = useState('only_diff');

  // Load configuration based on the active dropdown page option
  const config = getOptionConfig(activeOption);
  const columns = useMemo(() => {
    return config.getColumns({
      openDiffViewer,
      openDataViewer: noop,
      handleSyncConfiguration,
      handleCloneConfiguration: noop,
      showToast,
      baseUrl1,
      baseUrl2
    });
  }, [config, openDiffViewer, handleSyncConfiguration, showToast, baseUrl1, baseUrl2]);

  const dataDiffColDefs = columns.dataDiffColDefs;

  // Extract filterable columns dynamically from dataDiffColDefs
  const filterableCols = useMemo(() => {
    return getFilterableColumns(dataDiffColDefs);
  }, [dataDiffColDefs]);

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
  const filteredDataDiffRows = useMemo(() => {
    let list = filterRowsByColDefs(dataDiffRows, appliedFilters, filterableCols);

    if (dataDiffFilterMode === 'only_diff') {
      list = list.filter((r) => {
        return (
          VIEW_DIFF_FIELDS.some((field) => r[field] === 'View Diff') ||
          DIFF_CHANGES_FIELDS.some((field) => r[field] === 'Diff Changes')
        );
      });
    }
    return list;
  }, [dataDiffRows, appliedFilters, filterableCols, dataDiffFilterMode]);

  return (
    <section className="bg-white rounded-lg p-5">
      <div className="flex items-center justify-between border-b pb-2 mb-4">
        <div className="w-1/3"></div>
        <h3 className="text-center text-sm font-bold text-gray-700 uppercase tracking-wider w-1/3">
          DATA DIFF
        </h3>
        <div className="w-1/3 flex justify-end">
          <button
            onClick={() => setShowDataDiffFilters(!showDataDiffFilters)}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center space-x-1 cursor-pointer transition-colors duration-150 select-none"
          >
            <span>{showDataDiffFilters ? 'Hide filters' : 'Show filters'}</span>
            <span className={`inline-block text-[10px] transform transition-transform duration-300 ease-in-out ${showDataDiffFilters ? 'rotate-0' : 'rotate-180'}`}>▲</span>
          </button>
        </div>
      </div>

      {/* Global Filter Bar above Table */}
      <TableFilterBar
        showFilters={showDataDiffFilters}
        filterableCols={filterableCols}
        filterInputs={filterInputs}
        onFilterInputChange={handleFilterInputChange}
        onSubmit={handleSubmit}
        onReset={handleReset}
        rightControls={
          <div className="flex items-center border border-gray-300 rounded overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => setDataDiffFilterMode('all')}
              className={`px-4 py-1.5 text-xs cursor-pointer transition-colors ${dataDiffFilterMode === 'all'
                ? 'bg-[#7a1c4b] text-white font-medium'
                : 'bg-white text-gray-700 hover:bg-gray-100 font-normal'
                }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setDataDiffFilterMode('only_diff')}
              className={`px-4 py-1.5 text-xs cursor-pointer transition-colors ${dataDiffFilterMode === 'only_diff'
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
        rowData={filteredDataDiffRows}
        columnDefs={dataDiffColDefs}
        showFloatingFilter={false}
        minHeight="250px"
        maxHeight="460px"
      />

      <div className="mt-2 text-xs italic text-red-600 font-normal">
        Filtered Records: {filteredDataDiffRows.length} records | Actual Records: {dataDiffRows.length} records
      </div>
    </section>
  );
});

export default DataDiffTable;
