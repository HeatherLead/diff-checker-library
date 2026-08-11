import React, { useState, useMemo } from 'react';
import { matchSorter } from 'match-sorter';
import { AgGridGenerator } from './agGridGenerator';
import { getOptionConfig } from '../config';

export const VersionMismatchTable = ({
  activeOption,
  versionMismatchRows = [],
  openDiffViewer,
  baseUrl1,
  baseUrl2
}) => {
  const [showVersionFilters, setShowVersionFilters] = useState(true);
  const [versionTagFilter, setVersionTagFilter] = useState('');
  const [site1VersionFilter, setSite1VersionFilter] = useState('');
  const [site2VersionFilter, setSite2VersionFilter] = useState('');
  const [versionFilterMode, setVersionFilterMode] = useState('only_diff');

  // Load configuration based on the active dropdown page option
  const config = getOptionConfig(activeOption);

  // If this configuration option does not have version mismatch records, do not render anything
  if (!config.hasVersionMismatch) {
    return null;
  }

  const columns = config.getColumns({
    openDiffViewer,
    openDataViewer: () => {},
    handleSyncConfiguration: () => {},
    handleCloneConfiguration: () => {},
    showToast: () => {},
    baseUrl1,
    baseUrl2
  });

  const versionMismatchColDefs = columns.versionMismatchColDefs;

  // Filtered rows logic
  const filteredVersionMismatchRows = useMemo(() => {
    let list = versionMismatchRows;
    if (versionTagFilter.trim()) {
      list = matchSorter(list, versionTagFilter.trim(), {
        keys: ['tag', 'site1Version', 'site2Version'],
        threshold: matchSorter.rankings.CONTAINS,
      });
    }
    if (site1VersionFilter.trim()) {
      list = list.filter((r) => r.site1Version.includes(site1VersionFilter.trim()));
    }
    if (site2VersionFilter.trim()) {
      list = list.filter((r) => r.site2Version.includes(site2VersionFilter.trim()));
    }
    return list;
  }, [versionMismatchRows, versionTagFilter, site1VersionFilter, site2VersionFilter]);

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

      {/* Unconditional Filter Mode Toggle (All vs Only Difference) */}
      <div className="flex justify-end gap-3 mb-3 text-xs">
        <div className="flex items-center border border-gray-300 rounded overflow-hidden">
          <button
            onClick={() => setVersionFilterMode('all')}
            className={`px-3 py-1 text-xs font-normal cursor-pointer ${versionFilterMode === 'all'
              ? 'bg-[#7a1c4b] text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
          >
            All
          </button>
          <button
            onClick={() => setVersionFilterMode('only_diff')}
            className={`px-3 py-1 text-xs font-normal cursor-pointer ${versionFilterMode === 'only_diff'
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
        rowData={filteredVersionMismatchRows}
        columnDefs={versionMismatchColDefs}
        showFloatingFilter={showVersionFilters}
        height="260px"
      />

      <div className="mt-2 text-xs italic text-red-600 font-normal">
        Filtered Records: {filteredVersionMismatchRows.length} records | Actual Records: {versionMismatchRows.length} records
      </div>
    </section>
  );
};

export default VersionMismatchTable;
