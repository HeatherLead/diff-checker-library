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
  compare: (sourceDataset: any, targetDataset: any) => {
    const dataDiff: any[] = [];
    const versionMismatch: any[] = [];
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

    const tagsSource = new Set(list1.map((item: any) => item.tag?.trim()).filter(Boolean));
    const tagsTarget = new Set(list2.map((item: any) => item.tag?.trim()).filter(Boolean));

    list1.forEach((record1: any) => {
      const tag1 = record1.tag?.trim();

      // 1. Same tag AND same version -> goes to Data Diff
      const record2SameVersion = list2.find(
        (record: any) => record.tag?.trim() === tag1 && record.version === record1.version
      );

      // 2. Same tag BUT different version -> goes to Version Mismatch
      const record2DiffVersion = list2.find(
        (record: any) => record?.tag?.trim() === tag1 && record?.version !== record1?.version
      );

      if (record2DiffVersion !== undefined) {
        const hasStructDiff = record1.datatable_structure !== record2DiffVersion.datatable_structure;
        const hasQueryDiff = record1.datatable_query !== record2DiffVersion.datatable_query;

        versionMismatch.push({
          rect1id: record1.id,
          rect2id: record2DiffVersion.id,
          tag: record1.tag,
          sourceVersion: record1.version || '1.0',
          targetVersion: record2DiffVersion.version || '1.0',
          site1Version: record1.version || '1.0',
          site2Version: record2DiffVersion.version || '1.0',
          rec1version: record1.version || '1.0',
          rec2version: record2DiffVersion.version || '1.0',
          dt_status: hasStructDiff ? "Diff Changes" : "No Diff",
          query_status: hasQueryDiff ? "Diff Changes" : "No Diff",
          datatableDiff: hasStructDiff ? "View Diff" : "No Diff",
          queryDiff: hasQueryDiff ? "View Diff" : "No Diff",
          raw1: record1,
          raw2: record2DiffVersion
        });
      }

      if (record2SameVersion !== undefined) {
        const hasStructDiff = record1.datatable_structure !== record2SameVersion.datatable_structure;
        const hasQueryDiff = record1.datatable_query !== record2SameVersion.datatable_query;

        const ignoreKeys = [
          "datatable_query",
          "datatable_structure",
          "id",
          "tag",
          "version",
          "updated",
          "updated_by",
          "created",
          "created_by",
        ];
        const clean1 = Object.fromEntries(
          Object.entries(record1).filter(([k]) => !ignoreKeys.includes(k))
        );
        const clean2 = Object.fromEntries(
          Object.entries(record2SameVersion).filter(([k]) => !ignoreKeys.includes(k))
        );

        const hasOtherDiff = JSON.stringify(clean1) !== JSON.stringify(clean2);

        dataDiff.push({
          tag: record1.tag,
          siteVersion: record1.version || '1.0',
          sourceVersion: record1.version || '1.0',
          targetVersion: record2SameVersion.version || '1.0',
          rec1version: record1.version || '1.0',
          rec2version: record2SameVersion.version || '1.0',
          rect1id: record1.id,
          rect2id: record2SameVersion.id,
          id: record1.id,
          dt_status: hasStructDiff ? "Diff Changes" : "No Diff",
          query_status: hasQueryDiff ? "Diff Changes" : "No Diff",
          other_status: hasOtherDiff ? "Diff Changes" : "No Diff",
          datatableDiff: hasStructDiff ? 'View Diff' : 'No Diff',
          queryDiff: hasQueryDiff ? 'View Diff' : 'No Diff',
          otherDiff: hasOtherDiff ? 'View Diff' : 'No Diff',
          hasOtherDiff,
          raw1: record1,
          raw2: record2SameVersion,
          others: {
            record1: clean1,
            record2: clean2
          }
        });
      }
    });

    // 3. Only Source
    list1.forEach((item: any) => {
      const tag = item.tag?.trim();
      if (!tag || !tagsTarget.has(tag)) {
        onlySource.push({
          tag: item.tag,
          version: item.version || '1.0',
          id: item.id,
          raw: item
        });
      }
    });

    // 4. Only Target
    list2.forEach((item: any) => {
      const tag = item.tag?.trim();
      if (!tag || !tagsSource.has(tag)) {
        onlyTarget.push({
          tag: item.tag,
          version: item.version || '1.0',
          id: item.id,
          raw: item
        });
      }
    });

    return {
      dataDiff,
      versionMismatch,
      onlySource,
      onlyTarget,
      onlySite1: onlySource,
      onlySite2: onlyTarget
    };
  },
  getColumns: ({ openDiffViewer, openDataViewer, handleSyncConfiguration, handleCloneConfiguration, baseUrl1, baseUrl2 }: any) => {
    const sourceColDefs = [
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
    ];

    const targetColDefs = [
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
    ];

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
          headerName: 'SOURCE CONFIG',
          flex: 1,
          cellRenderer: (params: any) => {
            const id = params.data.raw1?.id || params.data.rect1id || params.data.id || "38";
            return renderEditLink(baseUrl1, 'datatables-config', id, 'Edit');
          }
        },
        {
          field: 'site2Config',
          headerName: 'TARGET CONFIG',
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
        { field: 'site1Version', headerName: 'SOURCE VERSION', flex: 1.5, cellRenderer: (params: any) => <span className="dc-tag-span" style={{ fontSize: '12px' }}>{params.value}</span> },
        { field: 'site2Version', headerName: 'TARGET VERSION', flex: 1.5, cellRenderer: (params: any) => <span className="dc-tag-span" style={{ fontSize: '12px' }}>{params.value}</span> },
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
      sourceColDefs,
      targetColDefs,
      site1ColDefs: sourceColDefs,
      site2ColDefs: targetColDefs
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

export default DataTables;
