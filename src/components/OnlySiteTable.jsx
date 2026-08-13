import React, { useState, useMemo } from 'react';
import { matchSorter } from 'match-sorter';
import { AgGridGenerator } from './agGridGenerator';
import { getOptionConfig } from '../config';

export const OnlySiteTable = ({
  activeOption,
  onlySite1Rows = [],
  onlySite2Rows = [],
  baseUrl1,
  baseUrl2,
  openDataViewer,
  handleCloneConfiguration
}) => {
  const [showSite1Filters, setShowSite1Filters] = useState(true);
  const [site1TagInput, setSite1TagInput] = useState('');
  const [appliedSite1TagFilter, setAppliedSite1TagFilter] = useState('');

  const [showSite2Filters, setShowSite2Filters] = useState(true);
  const [site2TagInput, setSite2TagInput] = useState('');
  const [appliedSite2TagFilter, setAppliedSite2TagFilter] = useState('');

  // Load configuration based on the active dropdown page option
  const config = getOptionConfig(activeOption);

  const columns = useMemo(() => {
    return config.getColumns({
      openDiffViewer: () => {},
      openDataViewer,
      handleSyncConfiguration: () => {},
      handleCloneConfiguration,
      showToast: () => {},
      baseUrl1,
      baseUrl2
    });
  }, [activeOption, openDataViewer, handleCloneConfiguration, baseUrl1, baseUrl2]);

  const site1ColDefs = columns.site1ColDefs;
  const site2ColDefs = columns.site2ColDefs;

  // Filtered rows logic
  const filteredSite1Rows = useMemo(() => {
    let list = onlySite1Rows;
    const filterText = appliedSite1TagFilter.trim();
    if (filterText) {
      list = matchSorter(list, filterText, { keys: ['tag', 'title', (item) => item.raw?.title || ''] });
    }
    return list;
  }, [onlySite1Rows, appliedSite1TagFilter]);

  const filteredSite2Rows = useMemo(() => {
    let list = onlySite2Rows;
    const filterText = appliedSite2TagFilter.trim();
    if (filterText) {
      list = matchSorter(list, filterText, { keys: ['tag', 'title', (item) => item.raw?.title || ''] });
    }
    return list;
  }, [onlySite2Rows, appliedSite2TagFilter]);

  // If this configuration option does not show site-specific tables, do not render anything
  if (config.hasOnlySiteTables === false) {
    return null;
  }

  // Unified non-matching records view
  if (config.hasNonMatchTable) {
    return (
      <div className="grid grid-cols-1 gap-6">
        <section className="bg-white rounded-lg p-5">
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
          {showSite1Filters && (
            <div className="flex items-center justify-between gap-4 mb-4 text-xs">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setAppliedSite1TagFilter(site1TagInput);
                }}
                className="flex items-center gap-3"
              >
                <fieldset className="border border-gray-300 rounded px-2.5 pt-0 pb-1 inline-flex items-center text-xs bg-white focus-within:border-[#7a1c4b]">
                  <legend className="text-[11px] text-gray-500 px-1 font-normal leading-none -ml-1 select-none">
                    Tag:
                  </legend>
                  <input
                    type="text"
                    value={site1TagInput}
                    onChange={(e) => {
                      setSite1TagInput(e.target.value);
                      setAppliedSite1TagFilter(e.target.value);
                    }}
                    placeholder=""
                    className="outline-none bg-transparent text-xs text-gray-700 w-28 sm:w-36 h-5"
                  />
                </fieldset>

                <button
                  type="submit"
                  onClick={(e) => {
                    e.preventDefault();
                    setAppliedSite1TagFilter(site1TagInput);
                  }}
                  className="bg-[#7a1c4b] hover:bg-[#63143c] text-white font-medium text-xs px-7 py-1.5 rounded shadow-sm cursor-pointer transition-colors"
                >
                  Submit
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSite1TagInput('');
                    setAppliedSite1TagFilter('');
                  }}
                  className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-normal text-xs px-7 py-1.5 rounded shadow-sm cursor-pointer transition-colors"
                >
                  Reset
                </button>
              </form>
            </div>
          )}

          <div>
            <AgGridGenerator
              rowData={filteredSite1Rows}
              columnDefs={site1ColDefs}
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
      <section className="bg-white rounded-lg p-5">
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
        {showSite1Filters && (
          <div className="flex items-center justify-between gap-4 mb-4 text-xs">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setAppliedSite1TagFilter(site1TagInput);
              }}
              className="flex items-center gap-3"
            >
              <fieldset className="border border-gray-300 rounded px-2.5 pt-0 pb-1 inline-flex items-center text-xs bg-white focus-within:border-[#7a1c4b]">
                <legend className="text-[11px] text-gray-500 px-1 font-normal leading-none -ml-1 select-none">
                  Tag:
                </legend>
                <input
                  type="text"
                  value={site1TagInput}
                  onChange={(e) => {
                    setSite1TagInput(e.target.value);
                    setAppliedSite1TagFilter(e.target.value);
                  }}
                  placeholder=""
                  className="outline-none bg-transparent text-xs text-gray-700 w-24 sm:w-32 h-5"
                />
              </fieldset>

              <button
                type="submit"
                onClick={(e) => {
                  e.preventDefault();
                  setAppliedSite1TagFilter(site1TagInput);
                }}
                className="bg-[#7a1c4b] hover:bg-[#63143c] text-white font-medium text-xs px-5 py-1.5 rounded shadow-sm cursor-pointer transition-colors"
              >
                Submit
              </button>

              <button
                type="button"
                onClick={() => {
                  setSite1TagInput('');
                  setAppliedSite1TagFilter('');
                }}
                className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-normal text-xs px-5 py-1.5 rounded shadow-sm cursor-pointer transition-colors"
              >
                Reset
              </button>
            </form>
          </div>
        )}

        <div>
          <AgGridGenerator
            rowData={filteredSite1Rows}
            columnDefs={site1ColDefs}
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
      <section className="bg-white rounded-lg p-5">
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
        {showSite2Filters && (
          <div className="flex items-center justify-between gap-4 mb-4 text-xs">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setAppliedSite2TagFilter(site2TagInput);
              }}
              className="flex items-center gap-3"
            >
              <fieldset className="border border-gray-300 rounded px-2.5 pt-0 pb-1 inline-flex items-center text-xs bg-white focus-within:border-[#7a1c4b]">
                <legend className="text-[11px] text-gray-500 px-1 font-normal leading-none -ml-1 select-none">
                  Tag:
                </legend>
                <input
                  type="text"
                  value={site2TagInput}
                  onChange={(e) => {
                    setSite2TagInput(e.target.value);
                    setAppliedSite2TagFilter(e.target.value);
                  }}
                  placeholder=""
                  className="outline-none bg-transparent text-xs text-gray-700 w-24 sm:w-32 h-5"
                />
              </fieldset>

              <button
                type="submit"
                onClick={(e) => {
                  e.preventDefault();
                  setAppliedSite2TagFilter(site2TagInput);
                }}
                className="bg-[#7a1c4b] hover:bg-[#63143c] text-white font-medium text-xs px-5 py-1.5 rounded shadow-sm cursor-pointer transition-colors"
              >
                Submit
              </button>

              <button
                type="button"
                onClick={() => {
                  setSite2TagInput('');
                  setAppliedSite2TagFilter('');
                }}
                className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-normal text-xs px-5 py-1.5 rounded shadow-sm cursor-pointer transition-colors"
              >
                Reset
              </button>
            </form>
          </div>
        )}

        <div>
          <AgGridGenerator
            rowData={filteredSite2Rows}
            columnDefs={site2ColDefs}
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
};

export default OnlySiteTable;
