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
  const [tagInput, setTagInput] = useState('');
  const [appliedTagFilter, setAppliedTagFilter] = useState('');
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
    const filterText = appliedTagFilter.trim();
    if (filterText) {
      list = matchSorter(list, filterText, {
        keys: [
          'tag',
          'siteVersion',
          'site1Version',
          'site2Version',
          (item) => item.raw1?.title || '',
          (item) => item.raw1?.tag || '',
          (item) => item.raw2?.tag || '',
        ],
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
  }, [dataDiffRows, appliedTagFilter, dataDiffFilterMode]);

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
      {showDataDiffFilters && (
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 text-xs">
          {/* Left: Tag Input + Submit + Reset */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setAppliedTagFilter(tagInput);
            }}
            className="flex items-center gap-3"
          >
            <fieldset className="border border-gray-300 rounded px-2.5 pt-0 pb-1 inline-flex items-center text-xs bg-white focus-within:border-[#7a1c4b]">
              <legend className="text-[11px] text-gray-500 px-1 font-normal leading-none -ml-1 select-none">
                Tag:
              </legend>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => {
                  setTagInput(e.target.value);
                  setAppliedTagFilter(e.target.value);
                }}
                placeholder=""
                className="outline-none bg-transparent text-xs text-gray-700 w-28 sm:w-36 h-5"
              />
            </fieldset>

            <button
              type="submit"
              onClick={(e) => {
                e.preventDefault();
                setAppliedTagFilter(tagInput);
              }}
              className="bg-[#7a1c4b] hover:bg-[#63143c] text-white font-medium text-xs px-7 py-1.5 rounded shadow-sm cursor-pointer transition-colors"
            >
              Submit
            </button>

            <button
              type="button"
              onClick={() => {
                setTagInput('');
                setAppliedTagFilter('');
              }}
              className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-normal text-xs px-7 py-1.5 rounded shadow-sm cursor-pointer transition-colors"
            >
              Reset
            </button>
          </form>

          {/* Right: Filter Mode Toggle (All vs Only Difference) */}
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
        </div>
      )}

      {/* AG Grid Table */}
      <AgGridGenerator
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
};

export default DataDiffTable;
