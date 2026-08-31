import React from 'react';
import { useConfigurationDiff } from '../../hooks/useConfigurationDiff';
import DataDiffTable from '../../components/DataDiffTable';
import VersionMismatchTable from '../../components/VersionMismatchTable';
import OnlySiteTable from '../../components/OnlySiteTable';
import { renderTrimTooltip, renderTagLink } from '../../utils/cellRenderers';

export const roleDepartmentListConfig = {
  apiKey: 'role_department_list',
  leftDataKey: 'attachment',
  rightDataKey: 'attachment',
  hasVersionMismatch: false,
  compare: (sourceDataset: any[], targetDataset: any[]) => {
    const dataDiff: any[] = [];
    const onlySource: any[] = [];
    const onlyTarget: any[] = [];

    const map1Map = new Map();
    (sourceDataset || []).forEach((item: any) => {
      const key = (item.role || item.tag || item.id || '').trim();
      if (key && !map1Map.has(key)) {
        map1Map.set(key, item);
      }
    });

    const map2Map = new Map();
    (targetDataset || []).forEach((item: any) => {
      const key = (item.role || item.tag || item.id || '').trim();
      if (key && !map2Map.has(key)) {
        map2Map.set(key, item);
      }
    });

    map1Map.forEach((record1: any, key: string) => {
      const record2 = map2Map.get(key);

      if (record2) {
        const clean1 = Object.fromEntries(Object.entries(record1).filter(([k]) => !["updated", "updated_by", "created", "created_by"].includes(k)));
        const clean2 = Object.fromEntries(Object.entries(record2).filter(([k]) => !["updated", "updated_by", "created", "created_by"].includes(k)));
        const hasDiff = JSON.stringify(clean1) !== JSON.stringify(clean2);

        dataDiff.push({
          id: record1.id || record2.id || key,
          tag: record1.role?.trim() || key,
          role_diff_status: hasDiff ? "Diff Changes" : "No diff",
          view_role_diff: hasDiff ? "View Diff" : "No diff",
          raw1: record1,
          raw2: record2
        });
      } else {
        onlySource.push({
          tag: record1.role?.trim() || key,
          id: record1.id || key,
          raw: record1
        });
      }
    });

    map2Map.forEach((record2: any, key: string) => {
      if (!map1Map.has(key)) {
        onlyTarget.push({
          tag: record2.role?.trim() || key,
          id: record2.id || key,
          raw: record2
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
  getColumns: ({ openDiffViewer, openDataViewer, handleCloneConfiguration, baseUrl1, baseUrl2 }: any) => {
    const sourceColDefs = [
      { field: 'tag', headerName: 'ROLE', flex: 2, cellRenderer: (params: any) => renderTagLink(baseUrl1, 'role-department-list', params.data.id || params.data.tag, params.value) },
      {
        field: 'viewData',
        headerName: 'VIEW DATA',
        flex: 1.2,
        cellRenderer: (params: any) => (
          <button onClick={() => openDataViewer(params)} className="btn-gray">View Data</button>
        )
      },
      {
        field: 'syncData',
        headerName: '',
        flex: 1.2,
        cellRenderer: (params: any) => (
          <button onClick={() => handleCloneConfiguration(params.data.raw, baseUrl2, 'to_right')} className="btn-gray">Copy to Right</button>
        )
      }
    ];

    const targetColDefs = [
      { field: 'tag', headerName: 'TAG', flex: 2, cellRenderer: (params: any) => renderTagLink(baseUrl2, 'role-department-list', params.data.id || params.data.tag, params.value) },
      {
        field: 'viewData',
        headerName: 'VIEW DATA',
        flex: 1.2,
        cellRenderer: (params: any) => (
          <button onClick={() => openDataViewer(params)} className="btn-gray">View Data</button>
        )
      },
      {
        field: 'syncData',
        headerName: '',
        flex: 1.2,
        cellRenderer: (params: any) => (
          <button onClick={() => handleCloneConfiguration(params.data.raw, baseUrl1, 'to_left')} className="btn-gray">Copy to Left</button>
        )
      }
    ];

    return {
      dataDiffColDefs: [
        { field: 'tag', headerName: 'TAG', flex: 1.5, cellRenderer: (params: any) => renderTrimTooltip(params.value, 35) },
        { field: 'role_diff_status', headerName: 'ROLE DIFF STATUS', flex: 1.5 },
        {
          field: 'view_role_diff',
          headerName: 'VIEW ROLE DIFF',
          flex: 1.2,
          cellRenderer: (params: any) => params.value === 'View Diff' ? (
            <button onClick={() => openDiffViewer(params, 'other')} className="btn-gray">View Diff</button>
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

export interface RoleDepartmentListProps {
  activeOption?: string;
}

const RoleDepartmentList: React.FC<RoleDepartmentListProps> = ({ activeOption = 'role_department_list' }) => {
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

export default RoleDepartmentList;
