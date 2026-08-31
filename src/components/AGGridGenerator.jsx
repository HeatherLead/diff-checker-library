import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-enterprise";
import {
  ESTIMATE_CHAR_PX,
  ESTIMATE_PADDING,
  ESTIMATE_ROW_SAMPLE,
  NON_FILTERABLE_EXACT_FIELDS,
  ROW_KEY_FIELDS,
  NON_FILTERABLE_HEADER_KEYWORDS,
  NON_FILTERABLE_FIELD_KEYWORDS,
} from "../constants/constants";

const stripHtmlForMeasure = (val) => {
  if (val == null) return "";
  const str = String(val);
  if (!str.includes("<")) return str.trim();
  return str.replace(/<[^>]*>/g, "").trim();
};

const parseColDim = (val) => {
  const parsed = parseInt(val, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const getHeaderTooltip = (col) => {
  if (col.headerTooltip !== undefined) return col.headerTooltip || undefined;
  const raw = col.headerName ?? col.header ?? col.title ?? col.id ?? col.field ?? "";
  if (typeof raw !== "string") return String(raw || "").trim() || undefined;
  const stripped = stripHtmlForMeasure(raw);
  return stripped || undefined;
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
  if (!colDef?.colId && !colDef?.field) return true;
  const colId = colDef.colId || colDef.field;
  if (colId === "selection" || colId.startsWith("ag-Grid-Selection")) return true;
  if (colDef.hasApiWidth) return true;
  if (colDef.width && colDef.flex === 0) return true;
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
  let id = null;
  for (let i = 0; i < ROW_KEY_FIELDS.length; i++) {
    const field = ROW_KEY_FIELDS[i];
    if (row[field] != null && row[field] !== "") {
      id = row[field];
      break;
    }
  }
  if (id == null || id === "") {
    if (rowSelectionId && row[rowSelectionId] != null && row[rowSelectionId] !== "") {
      id = row[rowSelectionId];
    }
  }
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
        className="btn-purple"
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

const isNonFilterableCol = (field, colObj) => {
  if (!colObj) colObj = {};
  if (colObj.filter === false || colObj.floatingFilter === false || colObj.isButton || colObj.isAction) {
    return true;
  }

  const strField = String(field || colObj.colId || colObj.field || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const strHeader = String(colObj.header || colObj.headerName || "").toLowerCase().trim();

  // If headerName is explicitly empty (often used for action/sync buttons like Copy to Left/Right)
  if (colObj.headerName === "" || colObj.header === "") {
    return true;
  }

  // Check exact field match
  if (strField && NON_FILTERABLE_EXACT_FIELDS.has(strField)) {
    return true;
  }

  // Check header text or field name for button-related keywords
  // BUT exclude status fields like dt_status, df_status, role_diff_status, status
  const isStatusField = strField.includes("status") || strHeader.includes("status");

  if (!isStatusField) {
    if (strHeader && NON_FILTERABLE_HEADER_KEYWORDS.some(kw => strHeader.includes(kw))) {
      return true;
    }

    if (strField && NON_FILTERABLE_FIELD_KEYWORDS.some(kw => strField.includes(kw))) {
      return true;
    }
  }

  // Check cellProps (if any)
  if (
    colObj.cellProps?.cellFun === "customeAPIBtn" ||
    String(colObj.cellProps?.props?.className || "").includes("btn") ||
    String(colObj.cellProps?.props?.className || "").includes("icon")
  ) {
    return true;
  }

  // Check cellRenderer function string representation
  if (typeof colObj.cellRenderer === "function") {
    if (colObj.cellRenderer === DefaultCellRenderer) {
      return false;
    }

    if (colObj.cellRenderer._isNonFilterable === undefined) {
      const fnStr = colObj.cellRenderer.toString();
      colObj.cellRenderer._isNonFilterable =
        fnStr.includes("<button") ||
        fnStr.includes("btn-") ||
        fnStr.includes("handleSync") ||
        fnStr.includes("handleClone") ||
        fnStr.includes("openDiffViewer") ||
        fnStr.includes("openDataViewer");
    }

    if (colObj.cellRenderer._isNonFilterable) {
      return true;
    }
  }

  return false;
};

/**
 * AGGridGenerator Component
 * Generates an AG-Grid instance styled and configured based on passed props.
 */
export const AGGridGenerator = ({
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
  height,
  minHeight = "250px",
  maxHeight = "460px",
  defaultColDef = {},
  gridOptions = {},
  onGridReady: externalOnGridReady,
  onCellClicked: externalOnCellClicked,
  themeClass = "ag-theme-alpine",
  noRowsMessage = "No Records Found",
  enableTotalRowCount = true,
  rowSelection = "multiple",
  enableCheckboxSelection = false,
  showFloatingFilter = false,
  showTableFilter,
  tooltipShowDelay = 1000,
  tooltipHideDelay = 8000,
  ...props
}) => {
  const gridRef = useRef();
  const isFilterVisible = showTableFilter !== undefined ? showTableFilter : showFloatingFilter;

  const effectiveRowData = useMemo(() => {
    if (Array.isArray(directRowData)) {
      return directRowData;
    }
    if (Array.isArray(viewData)) {
      return viewData;
    }
    return directRowData || viewData || [];
  }, [directRowData, viewData]);

  // Derive columnDefs from columnsData, table_config or direct columnDefs
  const derivedColumnDefs = useMemo(() => {
    let cols = [];

    if (Array.isArray(directColumnDefs) && directColumnDefs.length > 0) {
      cols = directColumnDefs.map((col) => {
        const isNonFilterable = isNonFilterableCol(col.field, col);
        const headerTooltip = getHeaderTooltip(col);
        return {
          ...col,
          headerTooltip,
          cellStyle: isNonFilterable ? { display: 'flex', alignItems: 'center', justifyContent: 'center', ...(col.cellStyle || {}) } : col.cellStyle,
          cellRenderer: col.cellRenderer || DefaultCellRenderer,
          filter: isNonFilterable ? false : col.filter ?? "agTextColumnFilter",
          floatingFilter: !isNonFilterable,
          suppressHeaderFilterButton: true,
          suppressHeaderMenuButton: true,
          suppressMenu: true,
          menuTabs: [],
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
          const headerName = col.header || col.title || col.id;
          const headerTooltip = getHeaderTooltip({ ...col, headerName });
          return {
            headerName,
            headerTooltip,
            field,
            colId: col.id,
            sortable: true,
            filter: isNonFilterable ? false : "agTextColumnFilter",
            floatingFilter: !isNonFilterable,
            suppressHeaderFilterButton: true,
            suppressHeaderMenuButton: true,
            suppressMenu: true,
            menuTabs: [],
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
          const headerName = key.replace(/_/g, " ").toUpperCase();
          return {
            headerName,
            headerTooltip: headerName,
            field: key,
            sortable: true,
            filter: isNonFilterable ? false : "agTextColumnFilter",
            floatingFilter: !isNonFilterable,
            suppressHeaderFilterButton: true,
            suppressHeaderMenuButton: true,
            suppressMenu: true,
            menuTabs: [],
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
            suppressHeaderFilterButton: true,
            suppressHeaderMenuButton: true,
            suppressMenu: true,
            menuTabs: [],
            headerTooltip: undefined,
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
    const api = params.api || params.columnApi;
    const colId = params.column.getColId();
    return [
      {
        name: "Sort Ascending",
        action: () => api.applyColumnState({
          state: [{ colId, sort: "asc" }],
          defaultState: { sort: null }
        }),
        icon: '<span style="font-size: 12px; font-weight: normal;">↑</span>'
      },
      {
        name: "Sort Descending",
        action: () => api.applyColumnState({
          state: [{ colId, sort: "desc" }],
          defaultState: { sort: null }
        }),
        icon: '<span style="font-size: 12px; font-weight: normal;">↓</span>'
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
      suppressHeaderFilterButton: true,
      suppressHeaderMenuButton: true,
      suppressMenu: true,
      menuTabs: [],
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
    },
    [externalOnGridReady]
  );

  const handleCellClicked = useCallback(
    (params) => {
      if (typeof externalOnCellClicked === "function") {
        externalOnCellClicked(params);
      } else if (typeof props.onCellClicked === "function") {
        props.onCellClicked(params);
      }
    },
    [externalOnCellClicked, props.onCellClicked]
  );

  const [headerContextMenu, setHeaderContextMenu] = useState(null);

  const gridContainerRef = useRef(null);

  useEffect(() => {
    const container = gridContainerRef.current;
    if (!container) return;

    const handleContextMenuCapture = (e) => {
      const headerCell = e.target.closest(".ag-header-cell");
      if (!headerCell) return;

      const colId = headerCell.getAttribute("col-id");
      if (!colId || colId === "ag-Grid-Selection") return;

      e.preventDefault();
      e.stopPropagation();

      const api = gridRef.current?.api;
      const col = api?.getColumn?.(colId);
      const colDef = col?.getColDef?.();
      const colName = colDef?.headerName || colDef?.field || colId;

      const x = Math.min(e.clientX, window.innerWidth - 210);
      const y = Math.min(e.clientY, window.innerHeight - 250);

      setHeaderContextMenu({
        x,
        y,
        colId,
        colName,
        pinned: col?.getPinned?.() || null,
      });
    };

    container.addEventListener("contextmenu", handleContextMenuCapture, true);
    return () => {
      container.removeEventListener("contextmenu", handleContextMenuCapture, true);
    };
  }, []);

  useEffect(() => {
    if (!headerContextMenu) return;
    const handleClose = () => setHeaderContextMenu(null);
    window.addEventListener("click", handleClose);
    window.addEventListener("scroll", handleClose, true);
    return () => {
      window.removeEventListener("click", handleClose);
      window.removeEventListener("scroll", handleClose, true);
    };
  }, [headerContextMenu]);


  const totalRowCount = useMemo(() => {
    if (tableData?.total_record_count != null) return tableData.total_record_count;
    if (tableData?.total_items != null) return tableData.total_items;
    return effectiveRowData.length;
  }, [tableData, effectiveRowData]);

  const containerHeight = useMemo(() => {
    if (height && !minHeight && !maxHeight) return height;
    const rows = effectiveRowData ? effectiveRowData.length : 0;
    const headerH = isFilterVisible ? 72 : 38;
    const contentH = headerH + Math.max(rows, 1) * 38 + 10;
    const minH = parseInt(String(minHeight || "250"), 10);
    const maxH = parseInt(String(maxHeight || "460"), 10);
    const targetH = Math.min(Math.max(contentH, minH), maxH);
    return `${targetH}px`;
  }, [effectiveRowData, isFilterVisible, height, minHeight, maxHeight]);

  return (
    <div className="dc-grid-wrapper">
      <div
        ref={gridContainerRef}
        className={`dc-grid-container ${themeClass} ${isFilterVisible ? 'ag-floating-filter-visible' : 'ag-floating-filter-hidden'}`}
        style={{ height: containerHeight, minHeight, maxHeight }}
      >
        <AgGridReact
          ref={gridRef}
          rowData={effectiveRowData}
          columnDefs={derivedColumnDefs}
          defaultColDef={standardDefaultColDef}
          onGridReady={handleGridReady}
          onCellClicked={handleCellClicked}
          getRowId={getRowId}
          rowSelection={rowSelection}
          getMainMenuItems={getMainMenuItems}
          headerHeight={38}
          floatingFiltersHeight={34}
          rowHeight={38}
          suppressCellFocus={true}
          suppressRowClickSelection={true}
          suppressMenuHide={true}
          suppressHeaderMenuButton={true}
          suppressHeaderFilterButton={true}
          animateRows={true}
          tooltipShowDelay={tooltipShowDelay}
          tooltipHideDelay={tooltipHideDelay}
          overlayNoRowsTemplate={`<span class="text-sm font-normal text-gray-500">${noRowsMessage}</span>`}
          {...gridOptions}
          {...props}
        />
      </div>

      {headerContextMenu && (
        <div
          className="dc-grid-context-menu"
          style={{ top: headerContextMenu.y, left: headerContextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="dc-grid-context-header">
            {headerContextMenu.colName}
          </div>

          <div className="dc-grid-context-section">
            <button
              type="button"
              className={`dc-grid-context-item ${headerContextMenu.pinned === "left" ? "active" : ""}`}
              onClick={() => {
                gridRef.current?.api?.applyColumnState({
                  state: [{ colId: headerContextMenu.colId, pinned: headerContextMenu.pinned === "left" ? null : "left" }],
                });
                setHeaderContextMenu(null);
              }}
            >
              <span>Pin Left</span>
              {headerContextMenu.pinned === "left" && <span>✓</span>}
            </button>
            <button
              type="button"
              className={`dc-grid-context-item ${headerContextMenu.pinned === "right" ? "active" : ""}`}
              onClick={() => {
                gridRef.current?.api?.applyColumnState({
                  state: [{ colId: headerContextMenu.colId, pinned: headerContextMenu.pinned === "right" ? null : "right" }],
                });
                setHeaderContextMenu(null);
              }}
            >
              <span>Pin Right</span>
              {headerContextMenu.pinned === "right" && <span>✓</span>}
            </button>
          </div>

          <button
            type="button"
            className="dc-grid-context-item"
            onClick={() => {
              if (gridRef.current?.api) {
                gridRef.current.api.autoSizeColumns([headerContextMenu.colId], false);
                clampColumnWidths(gridRef.current.api, [headerContextMenu.colId]);
              }
              setHeaderContextMenu(null);
            }}
          >
            <span>Autosize This Column</span>
          </button>

          <button
            type="button"
            className="dc-grid-context-item"
            onClick={() => {
              if (gridRef.current?.api) {
                applyColumnAutoSize(gridRef.current.api, derivedColumnDefs);
              }
              setHeaderContextMenu(null);
            }}
          >
            <span>Autosize All Columns</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AGGridGenerator;

