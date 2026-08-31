import React from 'react';
import { useConfigurationDiff } from '../../hooks/useConfigurationDiff';
import DataDiffTable from '../../components/DataDiffTable';
import VersionMismatchTable from '../../components/VersionMismatchTable';
import OnlySiteTable from '../../components/OnlySiteTable';
import { renderTrimTooltip, renderTagLink } from '../../utils/cellRenderers';

export const permissionConfig = {
  apiKey: 'permissions',
  leftDataKey: 'other_diff',
  rightDataKey: 'other_diff',
  hasVersionMismatch: false,
  compare: (sourceDataset: any[], targetDataset: any[]) => {
    const dataDiff: any[] = [];
    const onlySource: any[] = [];
    const onlyTarget: any[] = [];

    const map1Map = new Map();
    (sourceDataset || []).forEach((obj: any) => {
      const key = `${obj.module}-${obj.permission}`.trim();
      if (!map1Map.has(key)) {
        map1Map.set(key, obj);
      }
    });

    const map2Map = new Map();
    (targetDataset || []).forEach((obj: any) => {
      const key = `${obj.module}-${obj.permission}`.trim();
      if (!map2Map.has(key)) {
        map2Map.set(key, obj);
      }
    });

    map1Map.forEach((ele: any, key: string) => {
      const match = map2Map.get(key);
      if (match) {
        const clean1 = Object.fromEntries(
          Object.entries(ele).filter(
            ([k]) => !["module", "permission", "permission_label", "updated", "updated_by", "created", "created_by"].includes(k)
          )
        );
        const clean2 = Object.fromEntries(
          Object.entries(match).filter(
            ([k]) => !["module", "permission", "permission_label", "updated", "updated_by", "created", "created_by"].includes(k)
          )
        );

        const hasDiff = JSON.stringify(clean1) !== JSON.stringify(clean2);

        dataDiff.push({
          id: ele.id || match.id || key,
          tag: ele.module,
          permission: ele.permission,
          permission_label: ele.permission_label,
          role_diff_status: hasDiff ? "Diff Changes" : "No diff",
          role_diff: hasDiff ? "View Diff" : "No Diff",
          raw1: ele,
          raw2: match
        });
      } else {
        onlySource.push({
          id: ele.id || key,
          tag: ele.module,
          permission: ele.permission,
          permission_label: ele.permission_label,
          raw: ele
        });
      }
    });

    map2Map.forEach((ele: any, key: string) => {
      if (!map1Map.has(key)) {
        onlyTarget.push({
          id: ele.id || key,
          tag: ele.module,
          permission: ele.permission,
          permission_label: ele.permission_label,
          raw: ele
        });
      }
    });

    return {
      dataDiff,
      versionMismatch: [],
      onlySource,
      onlyTarget,
      onlySite1: onlySource,
      onlySite2: onlyTarget
    };
  },
  getColumns: ({ openDiffViewer, openDataViewer, baseUrl1, baseUrl2 }: any) => {
    const sourceColDefs = [
      { field: 'tag', headerName: 'MODULE', flex: 2, cellRenderer: (params: any) => renderTagLink(baseUrl1, 'permission-config', params.data.id || params.data.tag, params.value, 30) },
      { field: 'permission_label', headerName: 'PERMISSION', flex: 1.5, cellRenderer: (params: any) => renderTrimTooltip(params.data.permission_label, 30) },
      {
        field: 'viewData',
        headerName: 'VIEW DATA',
        flex: 1.2,
        cellRenderer: (params: any) => (
          <button onClick={() => openDataViewer(params)} className="btn-gray">View Data</button>
        )
      }
    ];

    const targetColDefs = [
      { field: 'tag', headerName: 'MODULE', flex: 2, cellRenderer: (params: any) => renderTagLink(baseUrl2, 'permission-config', params.data.id || params.data.tag, params.value, 30) },
      { field: 'permission_label', headerName: 'PERMISSION', flex: 1.5, cellRenderer: (params: any) => renderTrimTooltip(params.data.permission_label, 30) },
      {
        field: 'viewData',
        headerName: 'VIEW DATA',
        flex: 1.2,
        cellRenderer: (params: any) => (
          <button onClick={() => openDataViewer(params)} className="btn-gray">View Data</button>
        )
      }
    ];

    return {
      dataDiffColDefs: [
        { field: 'tag', headerName: 'MODULE', flex: 1.5, cellRenderer: (params: any) => renderTrimTooltip(params.value, 30) },
        { field: 'permission_label', headerName: 'PERMISSION', flex: 1.5, cellRenderer: (params: any) => renderTrimTooltip(params.data.permission_label, 30) },
        { field: 'role_diff_status', headerName: 'ROLE DIFF STATUS', flex: 1.5 },
        {
          field: 'role_diff',
          headerName: 'ROLE DIFF',
          flex: 1.2,
          cellRenderer: (params: any) => params.value === 'View Diff' ? (
            <button onClick={() => openDiffViewer(params, 'other')} className="btn-gray">Show Diff</button>
          ) : <span className="dc-muted-text">{params.value}</span>
        }
      ],
      sourceColDefs,
      targetColDefs,
      site1ColDefs: sourceColDefs,
      site2ColDefs: targetColDefs
    };
  }
};

export interface PermissionConfigProps {
  activeOption?: string;
}

const PermissionConfig: React.FC<PermissionConfigProps> = ({ activeOption = 'permission_config' }) => {
  const {
    dataDiffRows,
    versionMismatchRows,
    onlySourceRows,
    onlyTargetRows,
    config,
  } = useConfigurationDiff(activeOption);

  return (
    <div className="dc-page-container">
      {/* SECTION 1: DATA DIFF TABLE */}
      <DataDiffTable
        activeOption={activeOption}
        dataDiffRows={dataDiffRows}
      />

      {/* SECTION 2: VERSION MISMATCH TABLE */}
      {(config?.hasVersionMismatch || versionMismatchRows.length > 0) && (
        <VersionMismatchTable
          activeOption={activeOption}
          versionMismatchRows={versionMismatchRows}
        />
      )}

      {/* SECTION 3: SIDE-BY-SIDE ONLY SITE TABLES */}
      <OnlySiteTable
        activeOption={activeOption}
        onlySourceRows={onlySourceRows}
        onlyTargetRows={onlyTargetRows}
      />
    </div>
  );
};

export default PermissionConfig;
