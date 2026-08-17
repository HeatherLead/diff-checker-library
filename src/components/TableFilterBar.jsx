import React from 'react';

export const TableFilterBar = ({
  showFilters,
  filterableCols = [],
  filterInputs = {},
  onFilterInputChange,
  onSubmit,
  onReset,
  rightControls = null,
}) => {
  if (!filterableCols || filterableCols.length === 0) {
    return null;
  }

  return (
    <div
      className={`transition-all duration-300 ease-in-out overflow-hidden ${showFilters
        ? 'max-h-96 opacity-100 mb-4 transform translate-y-0'
        : 'max-h-0 opacity-0 mb-0 transform -translate-y-2 pointer-events-none'
        }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (onSubmit) onSubmit();
          }}
          className="flex flex-wrap items-center gap-3"
        >
          {filterableCols.map((col) => {
            const val = filterInputs[col.field] ?? '';
            return (
              <fieldset
                key={col.field}
                className="border border-gray-300 rounded px-2.5 pt-0 pb-1 inline-flex items-center text-xs bg-white focus-within:border-[#7a1c4b]"
              >
                <legend className="text-[11px] text-gray-500 px-1 font-normal leading-none -ml-1 select-none">
                  {col.label}:
                </legend>
                <input
                  type="text"
                  value={val}
                  onChange={(e) => {
                    if (onFilterInputChange) {
                      onFilterInputChange(col.field, e.target.value);
                    }
                  }}
                  placeholder=""
                  className="outline-none bg-transparent text-xs text-gray-700 w-24 sm:w-32 h-5"
                />
              </fieldset>
            );
          })}

          <button
            type="submit"
            onClick={(e) => {
              e.preventDefault();
              if (onSubmit) onSubmit();
            }}
            className="bg-[#7a1c4b] hover:bg-[#63143c] text-white font-medium text-xs px-5 sm:px-7 py-1.5 rounded shadow-sm cursor-pointer transition-colors"
          >
            Submit
          </button>

          <button
            type="button"
            onClick={() => {
              if (onReset) onReset();
            }}
            className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-normal text-xs px-5 sm:px-7 py-1.5 rounded shadow-sm cursor-pointer transition-colors"
          >
            Reset
          </button>
        </form>
        {rightControls && (
          <div className="flex items-center">{rightControls}</div>
        )}
      </div>
    </div>
  );
};

export default TableFilterBar;
