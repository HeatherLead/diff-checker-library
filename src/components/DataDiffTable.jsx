import React, { useState, useMemo } from 'react';
import { matchSorter } from 'match-sorter';
import { AgGridGenerator } from './agGridGenerator';
import { getOptionConfig } from '../config';

export const DataDiffTable = ({
  activeOption,
  dataDiffRows = [],
  openDiffViewer,
  handleSyncConfiguration,
  showToast,
  baseUrl1,
  baseUrl2
}) => {
  const [showDataDiffFilters, setShowDataDiffFilters] = useState(true);
  const [dataDiffTagFilter, setDataDiffTagFilter] = useState('');
  const [dataDiffFilterMode, setDataDiffFilterMode] = useState('only_diff');

  // Load configuration based on the active dropdown page option
  const config = getOptionConfig(activeOption);
  const columns = useMemo(() => {
    return config.getColumns({
      openDiffViewer,
      openDataViewer: () => {},
      handleSyncConfiguration,
      handleCloneConfiguration: () => {},
      showToast,
      baseUrl1,
      baseUrl2
    });
  }, [activeOption, openDiffViewer, handleSyncConfiguration, showToast, baseUrl1, baseUrl2]);

  const dataDiffColDefs = columns.dataDiffColDefs;

  // Filtered rows logic
  const filteredDataDiffRows = useMemo(() => {
    let list = dataDiffRows;
    if (dataDiffTagFilter.trim()) {
      list = matchSorter(list, dataDiffTagFilter.trim(), {
        keys: ['tag', 'siteVersion', (item) => item.raw1?.title || ''],
        threshold: matchSorter.rankings.CONTAINS,
      });
    }
    if (dataDiffFilterMode === 'only_diff') {
      list = list.filter((r) => {
        return (
          r.datatableDiff === 'View Diff' ||
          r.queryDiff === 'View Diff' ||
          r.otherDiff === 'View Diff' ||
          r.role_diff === 'View Diff' ||
          r.dt_status === 'Diff Changes' ||
          r.df_status === 'Diff Changes' ||
          r.role_diff_status === 'Diff Changes'
        );
      });
    }
    return list;
  }, [dataDiffRows, dataDiffTagFilter, dataDiffFilterMode]);

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

      {/* Unconditional Filter Mode Toggle (All vs Only Difference) */}
      <div className="flex justify-end gap-3 mb-3 text-xs">
        <div className="flex items-center border border-gray-300 rounded overflow-hidden">
          <button
            onClick={() => setDataDiffFilterMode('all')}
            className={`px-3 py-1 text-xs font-normal cursor-pointer ${dataDiffFilterMode === 'all'
              ? 'bg-[#7a1c4b] text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
          >
            All
          </button>
          <button
            onClick={() => setDataDiffFilterMode('only_diff')}
            className={`px-3 py-1 text-xs font-normal cursor-pointer ${dataDiffFilterMode === 'only_diff'
              ? 'bg-[#7a1c4b] text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
          >
            Only Difference
          </button>
        </div>
      </div>

      {/* AG Grid Table */}
      <AgGridGenerator
        rowData={filteredDataDiffRows}
        columnDefs={dataDiffColDefs}
        showFloatingFilter={showDataDiffFilters}
        height="260px"
      />

      <div className="mt-2 text-xs italic text-red-600 font-normal">
        Filtered Records: {filteredDataDiffRows.length} records | Actual Records: {dataDiffRows.length} records
      </div>
    </section>
  );
};

export default DataDiffTable;
