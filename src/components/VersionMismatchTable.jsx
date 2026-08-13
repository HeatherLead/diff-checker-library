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
  const [tagInput, setTagInput] = useState('');
  const [site1VersionInput, setSite1VersionInput] = useState('');
  const [site2VersionInput, setSite2VersionInput] = useState('');

  const [appliedTagFilter, setAppliedTagFilter] = useState('');
  const [appliedSite1VersionFilter, setAppliedSite1VersionFilter] = useState('');
  const [appliedSite2VersionFilter, setAppliedSite2VersionFilter] = useState('');

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
    const tagText = appliedTagFilter.trim();
    const site1Text = appliedSite1VersionFilter.trim();
    const site2Text = appliedSite2VersionFilter.trim();

    if (tagText) {
      list = matchSorter(list, tagText, {
        keys: ['tag', (item) => item.raw1?.title || '', (item) => item.raw1?.tag || '', (item) => item.raw2?.tag || ''],
        threshold: matchSorter.rankings.CONTAINS,
      });
    }

    if (site1Text) {
      list = list.filter((r) => {
        const v1 = String(r.site1Version || r.raw1?.version || '').toLowerCase();
        return v1.includes(site1Text.toLowerCase());
      });
    }

    if (site2Text) {
      list = list.filter((r) => {
        const v2 = String(r.site2Version || r.raw2?.version || '').toLowerCase();
        return v2.includes(site2Text.toLowerCase());
      });
    }

    return list;
  }, [versionMismatchRows, appliedTagFilter, appliedSite1VersionFilter, appliedSite2VersionFilter]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    setAppliedTagFilter(tagInput);
    setAppliedSite1VersionFilter(site1VersionInput);
    setAppliedSite2VersionFilter(site2VersionInput);
  };

  const handleReset = () => {
    setTagInput('');
    setSite1VersionInput('');
    setSite2VersionInput('');
    setAppliedTagFilter('');
    setAppliedSite1VersionFilter('');
    setAppliedSite2VersionFilter('');
  };

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
      {showVersionFilters && (
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 text-xs">
          {/* Left: Tag + Site 1 Version + Site 2 Version Inputs + Submit + Reset */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-wrap items-center gap-3"
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
                className="outline-none bg-transparent text-xs text-gray-700 w-24 sm:w-28 h-5"
              />
            </fieldset>

            <fieldset className="border border-gray-300 rounded px-2.5 pt-0 pb-1 inline-flex items-center text-xs bg-white focus-within:border-[#7a1c4b]">
              <legend className="text-[11px] text-gray-500 px-1 font-normal leading-none -ml-1 select-none">
                Site 1 Version:
              </legend>
              <input
                type="text"
                value={site1VersionInput}
                onChange={(e) => {
                  setSite1VersionInput(e.target.value);
                  setAppliedSite1VersionFilter(e.target.value);
                }}
                placeholder=""
                className="outline-none bg-transparent text-xs text-gray-700 w-24 sm:w-28 h-5"
              />
            </fieldset>

            <fieldset className="border border-gray-300 rounded px-2.5 pt-0 pb-1 inline-flex items-center text-xs bg-white focus-within:border-[#7a1c4b]">
              <legend className="text-[11px] text-gray-500 px-1 font-normal leading-none -ml-1 select-none">
                Site 2 Version:
              </legend>
              <input
                type="text"
                value={site2VersionInput}
                onChange={(e) => {
                  setSite2VersionInput(e.target.value);
                  setAppliedSite2VersionFilter(e.target.value);
                }}
                placeholder=""
                className="outline-none bg-transparent text-xs text-gray-700 w-24 sm:w-28 h-5"
              />
            </fieldset>

            <button
              type="submit"
              onClick={handleSubmit}
              className="bg-[#7a1c4b] hover:bg-[#63143c] text-white font-medium text-xs px-6 py-1.5 rounded shadow-sm cursor-pointer transition-colors"
            >
              Submit
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-normal text-xs px-6 py-1.5 rounded shadow-sm cursor-pointer transition-colors"
            >
              Reset
            </button>
          </form>

          {/* Right: Filter Mode Toggle (All vs Only Difference) */}
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
        </div>
      )}

      {/* AG Grid Table */}
      <AgGridGenerator
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
};

export default VersionMismatchTable;
