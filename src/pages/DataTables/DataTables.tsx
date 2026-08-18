import React from 'react';
import { useConfigurationDiff } from '../../hooks/useConfigurationDiff';
import DataDiffTable from '../../components/DataDiffTable';
import VersionMismatchTable from '../../components/VersionMismatchTable';
import OnlySiteTable from '../../components/OnlySiteTable';
import { renderTrimTooltip, renderTagLink, renderEditLink } from '../../utils/cellRenderers';

export const dataTablesConfig = {
  apiKey: 'datatables',
  leftDataKey: 'datatable_structure',
  rightDataKey: 'datatable_structure',
  hasVersionMismatch: true,
  compare: (site1Dataset: any[], site2Dataset: any[]) => {
    const map1 = new Map();
    const map2 = new Map();

    (site1Dataset || []).forEach((item: any) => map1.set(item.tag, item));
    (site2Dataset || []).forEach((item: any) => map2.set(item.tag, item));

    const dataDiff: any[] = [];
    const versionMismatch: any[] = [];
    const onlySite1: any[] = [];
    const onlySite2: any[] = [];

    map1.forEach((item1: any, tag: string) => {
      if (map2.has(tag)) {
        const item2 = map2.get(tag);

        if (item1.version && item2.version && item1.version !== item2.version) {
          versionMismatch.push({
            tag,
            site1Version: item1.version,
            site2Version: item2.version,
            datatableDiff: item1.datatable_structure !== item2.datatable_structure ? 'View Diff' : 'No Diff',
            queryDiff: item1.datatable_query !== item2.datatable_query ? 'View Diff' : 'No Diff',
            raw1: item1,
            raw2: item2
          });
        }

        const hasStructDiff = item1.datatable_structure !== item2.datatable_structure;
        const hasQueryDiff = item1.datatable_query !== item2.datatable_query;
        const hasOtherDiff = item1.title !== item2.title || item1.status !== item2.status;

        dataDiff.push({
          tag,
          siteVersion: item1.version || item2.version || '1.0',
          datatableDiff: hasStructDiff ? 'View Diff' : 'No Diff',
          queryDiff: hasQueryDiff ? 'View Diff' : 'No Diff',
          otherDiff: 'View Diff',
          hasOtherDiff,
          raw1: item1,
          raw2: item2
        });
      } else {
        onlySite1.push({
          tag,
          version: item1.version || '1.0',
          id: item1.id,
          raw: item1
        });
      }
    });

    map2.forEach((item2: any, tag: string) => {
      if (!map1.has(tag)) {
        onlySite2.push({
          tag: item2.tag || tag,
          version: item2.version || '1.0',
          id: item2.id,
          raw: item2
        });
      }
    });

    return { dataDiff, versionMismatch, onlySite1, onlySite2 };
  },
  getColumns: ({ openDiffViewer, openDataViewer, handleSyncConfiguration, handleCloneConfiguration, baseUrl1, baseUrl2 }: any) => {
    return {
      dataDiffColDefs: [
        { field: 'tag', headerName: 'TAG', flex: 1.5, cellRenderer: (params: any) => renderTrimTooltip(params.value, 35) },
        { field: 'siteVersion', headerName: 'SITE VERSION', flex: 1 },
        {
          field: 'datatableDiff',
          headerName: 'DATATABLE DIFF',
          flex: 1.2,
          cellRenderer: (params: any) => params.value === 'View Diff' ? (
            <button onClick={() => openDiffViewer(params, 'structure')} className="btn-gray">View Diff</button>
          ) : <span className="dc-muted-text">{params.value}</span>
        },
        {
          field: 'queryDiff',
          headerName: 'QUERY DIFF',
          flex: 1.2,
          cellRenderer: (params: any) => params.value === 'View Diff' ? (
            <button onClick={() => openDiffViewer(params, 'query')} className="btn-gray">View Diff</button>
          ) : <span className="dc-muted-text">{params.value}</span>
        },
        {
          field: 'otherDiff',
          headerName: 'OTHER DIFF',
          flex: 1,
          cellRenderer: (params: any) => (
            <button onClick={() => openDiffViewer(params, 'other')} className="btn-gray">Other</button>
          )
        },
        {
          field: 'site1Config',
          headerName: 'SITE 1 CONFIG',
          flex: 1,
          cellRenderer: (params: any) => {
            const id = params.data.raw1?.id || params.data.rect1id || params.data.id || "38";
            return renderEditLink(baseUrl1, 'datatables-config', id, 'Edit');
          }
        },
        {
          field: 'site2Config',
          headerName: 'SITE 2 CONFIG',
          flex: 1,
          cellRenderer: (params: any) => {
            const id = params.data.raw2?.id || params.data.rect2id || params.data.id || "38";
            return renderEditLink(baseUrl2, 'datatables-config', id, 'Edit');
          }
        },
        {
          field: 'syncData',
          headerName: '',
          flex: 1.2,
          cellRenderer: (params: any) => (
            <button onClick={() => handleSyncConfiguration(params.data, baseUrl2)} className="btn-purple">Sync Data</button>
          )
        }
      ],
      versionMismatchColDefs: [
        { field: 'tag', headerName: 'TAG', flex: 2, cellRenderer: (params: any) => renderTrimTooltip(params.value, 35) },
        { field: 'site1Version', headerName: 'SITE1 VERSION', flex: 1.5, cellRenderer: (params: any) => <span className="dc-tag-span" style={{ fontSize: '14px' }}>{params.value}</span> },
        { field: 'site2Version', headerName: 'SITE2 VERSION', flex: 1.5, cellRenderer: (params: any) => <span className="dc-tag-span" style={{ fontSize: '14px' }}>{params.value}</span> },
        {
          field: 'datatableDiff',
          headerName: 'DATATABLE DIFF',
          flex: 1.5,
          cellRenderer: (params: any) => params.value === 'View Diff' ? (
            <button onClick={() => openDiffViewer(params, 'structure')} className="btn-gray">View Diff</button>
          ) : <span className="dc-muted-text">{params.value}</span>
        },
        {
          field: 'queryDiff',
          headerName: 'QUERY DIFF',
          flex: 1.5,
          cellRenderer: (params: any) => params.value === 'View Diff' ? (
            <button onClick={() => openDiffViewer(params, 'query')} className="btn-gray">View Diff</button>
          ) : <span className="dc-muted-text">{params.value}</span>
        }
      ],
      site1ColDefs: [
        { field: 'tag', headerName: 'TAG', flex: 2, cellRenderer: (params: any) => renderTagLink(baseUrl1, 'datatables-config', params.data.id, params.value) },
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
        { field: 'tag', headerName: 'TAG', flex: 2, cellRenderer: (params: any) => renderTagLink(baseUrl2, 'datatables-config', params.data.id, params.value) },
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

export const datatablesConfig = dataTablesConfig;

export interface DataTablesProps {
  activeOption?: string;
}

const DataTables: React.FC<DataTablesProps> = ({ activeOption = 'datatables' }) => {
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

export default DataTables;
