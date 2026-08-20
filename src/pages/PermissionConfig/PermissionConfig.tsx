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
  compare: (site1Dataset: any[], site2Dataset: any[]) => {
    const dataDiff: any[] = [];
    const onlySite1: any[] = [];
    const onlySite2: any[] = [];

    const map1 = site1Dataset || [];
    const map2 = site2Dataset || [];

    const idsResp1 = new Set(map1.map((obj: any) => `${obj.module}-${obj.permission}`.trim()));
    const idsResp2 = new Set(map2.map((obj: any) => `${obj.module}-${obj.permission}`.trim()));

    const similar = map1.filter((obj: any) => idsResp2.has(`${obj.module}-${obj.permission}`.trim()));

    similar.forEach((ele: any) => {
      const match = map2.find((item: any) => `${item.module}-${item.permission}`.trim() === `${ele.module}-${ele.permission}`.trim());

      const clean1 = Object.fromEntries(
        Object.entries(ele).filter(
          ([key]) => !["module", "permission", "permission_label", "updated", "updated_by", "created", "created_by"].includes(key)
        )
      );
      const clean2 = Object.fromEntries(
        Object.entries(match).filter(
          ([key]) => !["module", "permission", "permission_label", "updated", "updated_by", "created", "created_by"].includes(key)
        )
      );

      const hasDiff = JSON.stringify(clean1) !== JSON.stringify(clean2);

      dataDiff.push({
        tag: ele.module,
        permission: ele.permission,
        permission_label: ele.permission_label,
        role_diff_status: hasDiff ? "Diff Changes" : "No change",
        role_diff: hasDiff ? "View Diff" : "No Diff",
        raw1: ele,
        raw2: match
      });
    });

    map1.forEach((ele: any) => {
      if (!idsResp2.has(`${ele.module}-${ele.permission}`.trim())) {
        onlySite1.push({
          tag: ele.module,
          permission: ele.permission,
          permission_label: ele.permission_label,
          id: ele.id || ele.permission || ele.module,
          raw: ele
        });
      }
    });

    map2.forEach((ele: any) => {
      if (!idsResp1.has(`${ele.module}-${ele.permission}`.trim())) {
        onlySite2.push({
          tag: ele.module,
          permission: ele.permission,
          permission_label: ele.permission_label,
          id: ele.id || ele.permission || ele.module,
          raw: ele
        });
      }
    });

    return { dataDiff, versionMismatch: [], onlySite1, onlySite2 };
  },
  getColumns: ({ openDiffViewer, openDataViewer, baseUrl1, baseUrl2 }: any) => {
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
      site1ColDefs: [
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
      ],
      site2ColDefs: [
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
      ]
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
    onlySite1Rows,
    onlySite2Rows,
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
        onlySite1Rows={onlySite1Rows}
        onlySite2Rows={onlySite2Rows}
      />
    </div>
  );
};

export default PermissionConfig;
