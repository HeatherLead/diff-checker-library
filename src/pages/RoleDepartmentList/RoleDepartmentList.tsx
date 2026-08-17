import React from 'react';
import { useConfigurationDiff } from '../../hooks/useConfigurationDiff';
import DataDiffTable from '../../components/DataDiffTable';
import VersionMismatchTable from '../../components/VersionMismatchTable';
import OnlySiteTable from '../../components/OnlySiteTable';
import { renderTrimTooltip } from '../../utils/cellRenderers';

export const roleDepartmentListConfig = {
  apiKey: 'role_department_list',
  leftDataKey: 'attachment',
  rightDataKey: 'attachment',
  hasVersionMismatch: false,
  compare: (site1Dataset: any[], site2Dataset: any[]) => {
    const dataDiff: any[] = [];
    const onlySite1: any[] = [];
    const onlySite2: any[] = [];

    const map1 = site1Dataset || [];
    const map2 = site2Dataset || [];

    map1.forEach((record1: any) => {
      const record2 = map2.find((r: any) => r.role?.trim() === record1.role?.trim());

      if (record2) {
        const clean1 = Object.fromEntries(Object.entries(record1).filter(([k]) => !["updated", "updated_by", "created", "created_by"].includes(k)));
        const clean2 = Object.fromEntries(Object.entries(record2).filter(([k]) => !["updated", "updated_by", "created", "created_by"].includes(k)));
        const hasDiff = JSON.stringify(clean1) !== JSON.stringify(clean2);

        dataDiff.push({
          tag: record1.role?.trim(),
          role_diff_status: hasDiff ? "Diff Changes" : "No change",
          view_role_diff: hasDiff ? "View Diff" : "No diff",
          raw1: record1,
          raw2: record2
        });
      } else {
        onlySite1.push({
          tag: record1.role?.trim(),
          raw: record1
        });
      }
    });

    map2.forEach((record2: any) => {
      const record1 = map1.find((r: any) => r.role?.trim() === record2.role?.trim());
      if (!record1) {
        onlySite2.push({
          tag: record2.role?.trim(),
          raw: record2
        });
      }
    });

    return { dataDiff, versionMismatch: [], onlySite1, onlySite2 };
  },
  getColumns: ({ openDiffViewer, openDataViewer, handleCloneConfiguration, baseUrl1, baseUrl2 }: any) => {
    return {
      dataDiffColDefs: [
        { field: 'tag', headerName: 'TAG', flex: 1.5, cellClass: 'font-normal text-gray-700', cellRenderer: (params: any) => renderTrimTooltip(params.value, 35) },
        { field: 'role_diff_status', headerName: 'ROLE DIFF STATUS', flex: 1.5 },
        {
          field: 'view_role_diff',
          headerName: 'VIEW ROLE DIFF',
          flex: 1.2,
          cellRenderer: (params: any) => params.value === 'View Diff' ? (
            <button onClick={() => openDiffViewer(params, 'other')} className="btn-gray">View Diff</button>
          ) : <span className="text-gray-500 font-normal">{params.value}</span>
        }
      ],
      site1ColDefs: [
        { field: 'tag', headerName: 'ROLE', flex: 2, cellClass: 'font-normal text-[#800040]', cellRenderer: (params: any) => renderTrimTooltip(params.value, 35) },
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
      ],
      site2ColDefs: [
        { field: 'tag', headerName: 'TAG', flex: 2, cellClass: 'font-normal text-[#800040]', cellRenderer: (params: any) => renderTrimTooltip(params.value, 35) },
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
      ]
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
    onlySite1Rows,
    onlySite2Rows,
    config,
  } = useConfigurationDiff(activeOption);

  return (
    <div className="space-y-6">
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

export default RoleDepartmentList;
