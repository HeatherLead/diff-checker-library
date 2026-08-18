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
    <div className={`dc-filter-bar ${showFilters ? 'open' : 'closed'}`}>
      <div className="dc-filter-bar-inner">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (onSubmit) onSubmit();
          }}
          className="dc-filter-form"
        >
          {filterableCols.map((col) => {
            const val = filterInputs[col.field] ?? '';
            return (
              <fieldset
                key={col.field}
                className="dc-filter-fieldset"
              >
                <legend className="dc-filter-legend">
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
                  className="dc-filter-input"
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
            className="dc-filter-btn-submit"
          >
            Submit
          </button>

          <button
            type="button"
            onClick={() => {
              if (onReset) onReset();
            }}
            className="dc-filter-btn-reset"
          >
            Reset
          </button>
        </form>
        {rightControls && (
          <div style={{ display: 'flex', alignItems: 'center' }}>{rightControls}</div>
        )}
      </div>
    </div>
  );
};

export default TableFilterBar;
