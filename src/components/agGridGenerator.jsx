import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-enterprise";

const ESTIMATE_CHAR_PX = 7.5;
const ESTIMATE_PADDING = 40;
const ESTIMATE_ROW_SAMPLE = 100;

const stripHtmlForMeasure = (val) => {
  if (val == null) return "";
  return String(val).replace(/<[^>]*>/g, "").trim();
};

const parseColDim = (val) => {
  const parsed = parseInt(val, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};

/** Width estimation from header + row data for virtualized cols */
const estimateColumnWidthFromData = (column, rows) => {
  const isIconActionColumn =
    column.cellProps?.cellFun === "customeAPIBtn" &&
    String(column.cellProps?.props?.className || "").includes("icon");
  const isButtonColumn =
    (column.cellProps?.cellFun &&
      column.cellProps?.props?.className?.includes("btn")) ||
    isIconActionColumn;

  const configWidth = parseColDim(column.width);
  if (configWidth) return configWidth;
  if (isIconActionColumn) return 40;
  if (isButtonColumn) return 120;

  const minW = parseColDim(column.minWidth) || 50;
  const maxW = parseColDim(column.maxWidth) || 520;

  let maxLen = stripHtmlForMeasure(column.header || column.headerName || column.field).length;
  const accessor = column.accessor || column.field;
  const sample = Math.min(Array.isArray(rows) ? rows.length : 0, ESTIMATE_ROW_SAMPLE);

  for (let i = 0; i < sample; i++) {
    const len = stripHtmlForMeasure(rows[i]?.[accessor]).length;
    if (len > maxLen) maxLen = len;
  }

  const estimated = Math.ceil(maxLen * ESTIMATE_CHAR_PX) + ESTIMATE_PADDING;
  return Math.min(Math.max(estimated, minW), maxW);
};

const shouldSkipColumnAutoSize = (colDef) => {
  if (!colDef?.colId) return true;
  const colId = colDef.colId;
  if (colId === "selection" || colId.startsWith("ag-Grid-Selection")) return true;
  if (colDef.hasApiWidth) return true;
  return false;
};

const getAutoSizeColumnIds = (api, columnDefsList) => {
  const fromApi = (api.getColumns?.() || [])
    .filter((col) => col?.isVisible?.() !== false)
    .map((col) => col.getColId())
    .filter((colId) => {
      if (!colId) return false;
      const colDef = api.getColumn(colId)?.getColDef();
      return colDef && !shouldSkipColumnAutoSize(colDef);
    });

  if (fromApi.length > 0) return fromApi;

  return (columnDefsList || [])
    .filter((col) => col && !col.hide && !shouldSkipColumnAutoSize(col))
    .map((col) => col.colId || col.field)
    .filter(Boolean);
};

const clampColumnWidths = (api, colIds) => {
  if (!api || api.isDestroyed?.() || !colIds?.length) return;
  const toAdjust = [];
  colIds.forEach((colId) => {
    const col = api.getColumn(colId);
    if (!col) return;
    const colDef = col.getColDef();
    const actualWidth = col.getActualWidth();
    let minW = parseColDim(colDef?.minWidth);
    let maxW = parseColDim(colDef?.maxWidth);

    if (minW !== undefined && maxW !== undefined && minW > maxW) {
      minW = maxW;
    }

    let targetWidth = actualWidth;
    if (minW !== undefined && targetWidth < minW) {
      targetWidth = minW;
    }
    if (maxW !== undefined && targetWidth > maxW) {
      targetWidth = maxW;
    }
    if (targetWidth !== actualWidth) {
      toAdjust.push({ key: colId, newWidth: targetWidth });
    }
  });

  if (toAdjust.length > 0 && typeof api.setColumnWidths === "function") {
    api.setColumnWidths(toAdjust);
  }
};

const applyColumnAutoSize = (api, columnDefsList) => {
  if (!api || api.isDestroyed?.()) return;

  const colIds = getAutoSizeColumnIds(api, columnDefsList);
  if (!colIds.length) return;

  try {
    api.autoSizeColumns(colIds, false);
    clampColumnWidths(api, colIds);
  } catch (e) {
    console.warn("[AGGrid] autoSizeColumns failed", e);
  }
};

/** Stable row key resolver */
const resolveGridRowKey = (row, rowSelectionId) => {
  if (!row) return null;
  const id =
    row.id ||
    row.issue_id ||
    row.issue_encoded_id ||
    row.task_id ||
    row.bo_id ||
    row.initiative_id ||
    row.ticket_code ||
    row.user_id ||
    (rowSelectionId && row[rowSelectionId]) ||
    row.uid;
  return id != null && id !== "" ? String(id) : null;
};

/** Standard Cell Renderer matching design screenshot */
const DefaultCellRenderer = (params) => {
  const val = params.value;
  const fieldName = (params.colDef?.field || params.colDef?.headerName || "").toLowerCase();

  if (val == null || val === "") return null;

  // Status Badge Rendering (e.g. DELAYED)
  if (
    val === "DELAYED" ||
    val === "Delayed" ||
    fieldName.includes("status") ||
    fieldName.includes("delayed")
  ) {
    const isDelayed = String(val).toUpperCase().includes("DELAY");
    if (isDelayed) {
      return <span className="badge-black-delayed">DELAYED</span>;
    }
  }

  // Edit / Action Button Rendering
  if (
    val === "Edit" ||
    val === "edit" ||
    fieldName === "action" ||
    fieldName === "edit"
  ) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (typeof params.colDef?.onActionClick === "function") {
            params.colDef.onActionClick(params.data);
          }
        }}
        className="btn-maroon-outline"
      >
        Edit
      </button>
    );
  }

  // Blue Link Rendering (for IDs, codes, numeric references)
  if (
    (typeof val === "number" || /^\d+$/.test(String(val))) &&
    (fieldName.includes("id") || fieldName.includes("code") || fieldName.includes("ref") || fieldName.includes("initiative"))
  ) {
    return (
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (typeof params.colDef?.onLinkClick === "function") {
            params.colDef.onLinkClick(params.data, val);
          }
        }}
        className="ag-blue-link"
      >
        {val}
      </a>
    );
  }

  // React Elements or plain text
  if (React.isValidElement(val)) {
    return val;
  }

  return <span>{String(val)}</span>;
};

const NON_FILTERABLE_FIELDS = new Set([
  "syncData",
  "datatableDiff",
  "queryDiff",
  "otherDiff",
  "viewData",
  "action",
  "site1Config",
  "site2Config",
]);

/**
 * AgGridGenerator Component
 * Generates an AG-Grid instance styled and configured based on passed props.
 */
export const AgGridGenerator = ({
  view_name,
  datatable_id,
  datatable_title,
  table_config,
  filter_config,
  columnsData,
  viewData,
  tableData,
  rowData: directRowData,
  columnDefs: directColumnDefs,
  height = "320px",
  defaultColDef = {},
  gridOptions = {},
  onGridReady: externalOnGridReady,
  themeClass = "ag-theme-alpine",
  noRowsMessage = "No Records Found",
  enableTotalRowCount = true,
  rowSelection = "multiple",
  enableCheckboxSelection = false,
  showFloatingFilter = true,
  showTableFilter,
  ...props
}) => {
  const gridRef = useRef();
  const isFilterVisible = showTableFilter !== undefined ? showTableFilter : showFloatingFilter;

  const effectiveRowData = useMemo(() => {
    if (Array.isArray(directRowData) && directRowData.length > 0) {
      return directRowData;
    }
    if (Array.isArray(viewData) && viewData.length > 0) {
      return viewData;
    }
    return directRowData || viewData || [];
  }, [directRowData, viewData]);

  // Derive columnDefs from columnsData, table_config or direct columnDefs
  const derivedColumnDefs = useMemo(() => {
    let cols = [];

    const isNonFilterableCol = (field, colObj) => {
      if (colObj?.filter === false || colObj?.floatingFilter === false) return true;
      if (!field) return false;
      const lower = String(field).toLowerCase();
      return NON_FILTERABLE_FIELDS.has(field) || NON_FILTERABLE_FIELDS.has(lower);
    };

    if (Array.isArray(directColumnDefs) && directColumnDefs.length > 0) {
      cols = directColumnDefs.map((col) => {
        const isNonFilterable = isNonFilterableCol(col.field, col);
        return {
          ...col,
          cellRenderer: col.cellRenderer || DefaultCellRenderer,
          filter: isNonFilterable ? false : col.filter ?? "agTextColumnFilter",
          floatingFilter: isNonFilterable ? false : true,
          floatingFilterComponentParams: {
            suppressFilterButton: true,
          },
        };
      });
    } else {
      const webCols = columnsData?.["web"]?.[0]?.tableColumns || table_config?.tableColumns;
      if (Array.isArray(webCols) && webCols.length > 0) {
        cols = webCols.map((col) => {
          const field = col.accessor || col.id;
          const isNonFilterable = isNonFilterableCol(field, col);
          return {
            headerName: col.header || col.title || col.id,
            field,
            colId: col.id,
            sortable: true,
            filter: isNonFilterable ? false : "agTextColumnFilter",
            floatingFilter: isNonFilterable ? false : true,
            floatingFilterComponentParams: {
              suppressFilterButton: true,
            },
            resizable: true,
            minWidth: parseColDim(col.minWidth) || 100,
            maxWidth: parseColDim(col.maxWidth),
            width: estimateColumnWidthFromData(col, effectiveRowData),
            hide: col.excludeFromDisplay || col.initialStateHidden || false,
            cellRenderer: DefaultCellRenderer,
          };
        });
      } else if (effectiveRowData.length > 0) {
        const sample = effectiveRowData[0];
        cols = Object.keys(sample).map((key) => {
          const isNonFilterable = isNonFilterableCol(key, {});
          return {
            headerName: key.replace(/_/g, " ").toUpperCase(),
            field: key,
            sortable: true,
            filter: isNonFilterable ? false : "agTextColumnFilter",
            floatingFilter: isNonFilterable ? false : true,
            floatingFilterComponentParams: {
              suppressFilterButton: true,
            },
            resizable: true,
            cellRenderer: DefaultCellRenderer,
          };
        });
      }
    }

    // Prepend selection checkbox column ONLY if explicitly enabled
    if (enableCheckboxSelection && cols.length > 0 && cols[0]?.colId !== "ag-Grid-Selection") {
      const hasSelectionCol = cols.some((c) => c.headerCheckboxSelection || c.checkboxSelection);
      if (!hasSelectionCol) {
        cols = [
          {
            colId: "ag-Grid-Selection",
            headerCheckboxSelection: true,
            checkboxSelection: true,
            width: 44,
            minWidth: 44,
            maxWidth: 44,
            pinned: "left",
            resizable: false,
            sortable: false,
            filter: false,
            floatingFilter: false,
            headerClass: "ag-selection-checkbox-header",
          },
          ...cols,
        ];
      }
    }

    return cols;
  }, [directColumnDefs, columnsData, table_config, effectiveRowData, enableCheckboxSelection]);

  // Main menu items popup configuration matching screenshot exactly
  const getMainMenuItems = useCallback((params) => {
    return [
      {
        name: "Sort Ascending",
        action: () => params.columnApi.applyColumnState({
          state: [{ colId: params.column.getColId(), sort: "asc" }],
          defaultState: { sort: null }
        }),
        icon: '<span style="font-size: 14px; font-weight: normal;">↑</span>'
      },
      {
        name: "Sort Descending",
        action: () => params.columnApi.applyColumnState({
          state: [{ colId: params.column.getColId(), sort: "desc" }],
          defaultState: { sort: null }
        }),
        icon: '<span style="font-size: 14px; font-weight: normal;">↓</span>'
      },
      "separator",
      "pinSubMenu",
      "separator",
      "autoSizeThis",
      "autoSizeAll"
    ];
  }, []);

  const standardDefaultColDef = useMemo(
    () => ({
      sortable: true,
      resizable: true,
      filter: "agTextColumnFilter",
      floatingFilter: true,
      flex: 1,
      minWidth: 110,
      headerClass: "font-normal text-gray-700",
      ...defaultColDef,
    }),
    [defaultColDef]
  );

  const getRowId = useCallback(
    (params) => {
      const resolved = resolveGridRowKey(params.data);
      return resolved || String(params.defaultId);
    },
    []
  );

  const handleGridReady = useCallback(
    (params) => {
      gridRef.current = params;
      if (typeof externalOnGridReady === "function") {
        externalOnGridReady(params);
      }
      setTimeout(() => {
        applyColumnAutoSize(params.api, derivedColumnDefs);
      }, 100);
    },
    [externalOnGridReady, derivedColumnDefs]
  );

  useEffect(() => {
    if (gridRef.current?.api && derivedColumnDefs.length > 0) {
      applyColumnAutoSize(gridRef.current.api, derivedColumnDefs);
    }
  }, [derivedColumnDefs, effectiveRowData]);

  const totalRowCount = useMemo(() => {
    if (tableData?.total_record_count != null) return tableData.total_record_count;
    if (tableData?.total_items != null) return tableData.total_items;
    return effectiveRowData.length;
  }, [tableData, effectiveRowData]);

  return (
    <div className="w-full flex flex-col gap-2">
      {enableTotalRowCount && totalRowCount > 0 && (
        <div className="flex justify-between items-center px-1 text-xs text-gray-500 font-normal">
          <span>Total Records: <span className="text-gray-800 font-normal">{totalRowCount}</span></span>
        </div>
      )}
      <div
        className={`${themeClass} ${isFilterVisible ? 'ag-floating-filter-visible' : 'ag-floating-filter-hidden'} w-full shadow-sm border border-gray-200 rounded-md overflow-hidden bg-white text-xs`}
        style={{ height }}
      >
        <AgGridReact
          ref={gridRef}
          rowData={effectiveRowData}
          columnDefs={derivedColumnDefs}
          defaultColDef={standardDefaultColDef}
          onGridReady={handleGridReady}
          getRowId={getRowId}
          rowSelection={rowSelection}
          getMainMenuItems={getMainMenuItems}
          headerHeight={38}
          floatingFiltersHeight={34}
          rowHeight={38}
          suppressCellFocus={true}
          animateRows={true}
          overlayNoRowsTemplate={`<span class="text-sm font-normal text-gray-500">${noRowsMessage}</span>`}
          {...gridOptions}
          {...props}
        />
      </div>
    </div>
  );
};

export default AgGridGenerator;

