import React from 'react';
import { useConfigurationDiff } from '../../hooks/useConfigurationDiff';
import DataDiffTable from '../../components/DataDiffTable';
import VersionMismatchTable from '../../components/VersionMismatchTable';
import OnlySiteTable from '../../components/OnlySiteTable';
import { renderTrimTooltip, renderTagLink } from '../../utils/cellRenderers';

export const reactMenusConfig = {
  apiKey: 'drupalMenues_react-menu',
  leftDataKey: 'other_diff',
  rightDataKey: 'other_diff',
  hasVersionMismatch: false,
  compare: (sourceDataset: any, targetDataset: any) => {
    const dataDiff: any[] = [];
    const onlySource: any[] = [];
    const onlyTarget: any[] = [];

    const toList = (dataset: any): any[] => {
      if (!dataset) return [];
      if (Array.isArray(dataset)) return dataset.filter(Boolean);
      if (typeof dataset === 'object') return Object.values(dataset).filter(Boolean);
      return [];
    };

    const list1 = toList(sourceDataset);
    const list2 = toList(targetDataset);

    const matchesItem = (a: any, b: any) => {
      if (!a || !b) return false;
      if (a.url && b.url && a.url === b.url) return true;
      if (a.encoded_uri && b.encoded_uri && a.encoded_uri === b.encoded_uri) return true;
      if (a.uri && b.uri && a.uri === b.uri) return true;
      if (a.menu_id && b.menu_id && a.menu_id === b.menu_id) return true;
      if (a.title && b.title && a.title === b.title) return true;
      return false;
    };

    list1.forEach((s1_val: any) => {
      const s2_val = list2.find((s2: any) => matchesItem(s1_val, s2));

      if (s2_val) {
        const clean1 = Object.fromEntries(
          Object.entries(s1_val).filter(([k]) => !["title", "updated", "updated_by", "created", "created_by"].includes(k))
        );
        const clean2 = Object.fromEntries(
          Object.entries(s2_val).filter(([k]) => !["title", "updated", "updated_by", "created", "created_by"].includes(k))
        );

        const hasDiff = JSON.stringify(clean1) !== JSON.stringify(clean2);

        dataDiff.push({
          tag: s1_val.title || s1_val.url || s1_val.menu_id,
          id: s1_val.menu_id || s1_val.id || s1_val.url,
          df_status: hasDiff ? "Diff Changes" : "No Diff",
          otherDiff: hasDiff ? "View Diff" : "No Diff",
          url: s1_val.url,
          roles: s1_val.roles,
          status: s1_val.status,
          raw1: s1_val,
          raw2: s2_val
        });
      } else {
        onlySource.push({
          tag: s1_val.title || s1_val.url || s1_val.menu_id,
          id: s1_val.menu_id || s1_val.id || s1_val.url,
          roles: s1_val.roles,
          status: s1_val.status,
          description: s1_val.description,
          raw: s1_val
        });
      }
    });

    list2.forEach((s2_val: any) => {
      const s1_val = list1.find((s1: any) => matchesItem(s2_val, s1));
      if (!s1_val) {
        onlyTarget.push({
          tag: s2_val.title || s2_val.url || s2_val.menu_id,
          id: s2_val.menu_id || s2_val.id || s2_val.url,
          roles: s2_val.roles,
          status: s2_val.status,
          description: s2_val.description,
          raw: s2_val
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
      { field: 'tag', headerName: 'TAG', flex: 2, cellRenderer: (params: any) => renderTagLink(baseUrl1, 'react_menus', params.data.raw || params.data.id, params.value) },
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
      { field: 'tag', headerName: 'TAG', flex: 2, cellRenderer: (params: any) => renderTagLink(baseUrl2, 'react_menus', params.data.raw || params.data.id, params.value) },
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
        { field: 'df_status', headerName: 'ROLES DIFF', flex: 1.5 },
        {
          field: 'otherDiff',
          headerName: 'OTHER DIFF',
          flex: 1.2,
          cellRenderer: (params: any) => params.value === 'View Diff' ? (
            <button onClick={() => openDiffViewer(params, 'other')} className="btn-gray">Other</button>
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

export interface ReactMenusProps {
  activeOption?: string;
}

const ReactMenus: React.FC<ReactMenusProps> = ({ activeOption = 'react_menus' }) => {
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

export default ReactMenus;
