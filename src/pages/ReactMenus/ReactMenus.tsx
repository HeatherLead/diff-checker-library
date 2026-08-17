import React from 'react';
import { useConfigurationDiff } from '../../hooks/useConfigurationDiff';
import DataDiffTable from '../../components/DataDiffTable';
import VersionMismatchTable from '../../components/VersionMismatchTable';
import OnlySiteTable from '../../components/OnlySiteTable';
import { renderTrimTooltip } from '../../utils/cellRenderers';

export const reactMenusConfig = {
  apiKey: 'drupalMenues_react-menu',
  leftDataKey: 'other_diff',
  rightDataKey: 'other_diff',
  hasVersionMismatch: false,
  compare: (site1Dataset: any, site2Dataset: any) => {
    const dataDiff: any[] = [];
    const onlySite1: any[] = [];
    const onlySite2: any[] = [];

    const list1 = Object.values(site1Dataset || {}) as any[];
    const list2 = Object.values(site2Dataset || {}) as any[];

    list1.forEach((s1_val: any) => {
      const s2_val = list2.find((s2: any) => s2.url === s1_val.url);

      if (s2_val) {
        const clean1 = Object.fromEntries(
          Object.entries(s1_val).filter(([k]) => !["title", "updated", "updated_by", "created", "created_by"].includes(k))
        );
        const clean2 = Object.fromEntries(
          Object.entries(s2_val).filter(([k]) => !["title", "updated", "updated_by", "created", "created_by"].includes(k))
        );

        const hasDiff = JSON.stringify(clean1) !== JSON.stringify(clean2);

        dataDiff.push({
          tag: s1_val.title,
          df_status: hasDiff ? "Diff Changes" : "No change",
          otherDiff: hasDiff ? "View Diff" : "No Diff",
          url: s1_val.url,
          raw1: s1_val,
          raw2: s2_val
        });
      } else {
        onlySite1.push({
          tag: s1_val.title,
          roles: s1_val.roles,
          status: s1_val.status,
          description: s1_val.description,
          raw: s1_val
        });
      }
    });

    list2.forEach((s2_val: any) => {
      const s1_val = list1.find((s1: any) => s1.url === s2_val.url);
      if (!s1_val) {
        onlySite2.push({
          tag: s2_val.title,
          roles: s2_val.roles,
          status: s2_val.status,
          description: s2_val.description,
          raw: s2_val
        });
      }
    });

    return { dataDiff, versionMismatch: [], onlySite1, onlySite2 };
  },
  getColumns: ({ openDiffViewer, openDataViewer, handleCloneConfiguration, baseUrl1, baseUrl2 }: any) => {
    return {
      dataDiffColDefs: [
        { field: 'tag', headerName: 'TAG', flex: 1.5, cellClass: 'font-normal text-gray-700', cellRenderer: (params: any) => renderTrimTooltip(params.value, 35) },
        { field: 'df_status', headerName: 'ROLES DIFF', flex: 1.5 },
        {
          field: 'otherDiff',
          headerName: 'OTHER DIFF',
          flex: 1.2,
          cellRenderer: (params: any) => params.value === 'View Diff' ? (
            <button onClick={() => openDiffViewer(params, 'other')} className="btn-gray">Other</button>
          ) : <span className="text-gray-500 font-normal">{params.value}</span>
        }
      ],
      site1ColDefs: [
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

export interface ReactMenusProps {
  activeOption?: string;
}

const ReactMenus: React.FC<ReactMenusProps> = ({ activeOption = 'react_menus' }) => {
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

export default ReactMenus;
