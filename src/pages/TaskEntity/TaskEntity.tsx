import React from 'react';
import { useConfigurationDiff } from '../../hooks/useConfigurationDiff';
import DataDiffTable from '../../components/DataDiffTable';
import VersionMismatchTable from '../../components/VersionMismatchTable';
import OnlySiteTable from '../../components/OnlySiteTable';
import { renderTrimTooltip, renderTagLink, renderEditLink } from '../../utils/cellRenderers';

export const taskEntityConfig = {
  apiKey: 'entity_forms',
  leftDataKey: 'entity_config',
  rightDataKey: 'entity_config',
  hasVersionMismatch: true,
  compare: (sourceDataset: any[], targetDataset: any[]) => {
    const dataDiff: any[] = [];
    const versionMismatch: any[] = [];
    const onlySource: any[] = [];
    const onlyTarget: any[] = [];

    const map1 = sourceDataset || [];
    const map2 = targetDataset || [];

    map1.forEach((record1: any) => {
      const record2 = map2.find(
        (record: any) => record.entity_type === record1.entity_type && record.entity_version === record1.entity_version
      );

      const non_matched_versions_rec = map2.find(
        (record: any) => record.entity_type === record1.entity_type && record.entity_version !== record1.entity_version
      );

      if (non_matched_versions_rec !== undefined) {
        versionMismatch.push({
          rect1id: record1.id,
          rect2id: non_matched_versions_rec.id,
          tag: record1.entity_type,
          sourceVersion: record1.entity_version,
          targetVersion: non_matched_versions_rec.entity_version,
          site1Version: record1.entity_version,
          site2Version: non_matched_versions_rec.entity_version,
          dt_status: record1.entity_config === non_matched_versions_rec.entity_config ? "No diff" : "Diff Changes",
          datatableDiff: record1.entity_config === non_matched_versions_rec.entity_config ? "No diff" : "View Diff",
          raw1: record1,
          raw2: non_matched_versions_rec
        });
      }

      if (record2 !== undefined) {
        const clean1 = Object.fromEntries(
          Object.entries(record1).filter(
            ([key]) => !["entity_type", "entity_version", "id", "updated", "updated_by", "created", "created_by"].includes(key)
          )
        );
        const clean2 = Object.fromEntries(
          Object.entries(record2).filter(
            ([key]) => !["entity_type", "entity_version", "id", "updated", "updated_by", "created", "created_by"].includes(key)
          )
        );

        const hasOtherDiff = JSON.stringify(clean1) !== JSON.stringify(clean2);

        dataDiff.push({
          tag: record1.entity_type,
          siteVersion: record1.entity_version,
          sourceVersion: record1.entity_version,
          targetVersion: record2.entity_version,
          rec1version: record1.entity_version,
          rec2version: record2.entity_version,
          rect1id: record1.id,
          rect2id: record2.id,
          dt_status: record1.entity_config === record2.entity_config ? "No diff" : "Diff Changes",
          datatableDiff: record1.entity_config === record2.entity_config ? "No Diff" : "View Diff",
          other_diff: hasOtherDiff ? "Diff Changes" : "No diff",
          otherDiff: hasOtherDiff ? "View Diff" : "No Diff",
          raw1: record1,
          raw2: record2
        });
      }
    });

    map1.forEach((record1: any) => {
      if (!map2.some((record2: any) => record2.entity_type === record1.entity_type)) {
        onlySource.push({
          tag: record1.entity_type,
          version: record1.entity_version,
          id: record1.id,
          raw: record1
        });
      }
    });

    map2.forEach((record2: any) => {
      if (!map1.some((record1: any) => record1.entity_type === record2.entity_type)) {
        onlyTarget.push({
          tag: record2.entity_type,
          version: record2.entity_version,
          id: record2.id,
          raw: record2
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
      {
        field: 'tag',
        headerName: 'TAG',
        flex: 2,
        cellRenderer: (params: any) => renderTagLink(baseUrl1, 'task-entity-config', params.data.id, params.value)
      },
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
      {
        field: 'tag',
        headerName: 'TAG',
        flex: 2,
        cellRenderer: (params: any) => renderTagLink(baseUrl2, 'task-entity-config', params.data.id, params.value)
      },
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
        { field: 'dt_status', headerName: 'TASK ENTITY DIFF STATUS', flex: 1.5 },
        {
          field: 'datatableDiff',
          headerName: 'TASK ENTITY DIFF',
          flex: 1.2,
          cellRenderer: (params: any) => params.value === 'View Diff' ? (
            <button onClick={() => openDiffViewer(params, 'structure')} className="btn-gray">View Diff</button>
          ) : <span className="dc-muted-text">{params.value}</span>
        },
        { field: 'other_diff', headerName: 'OTHER DIFF STATUS', flex: 1.2 },
        {
          field: 'otherDiff',
          headerName: 'OTHER DIFF',
          flex: 1,
          cellRenderer: (params: any) => params.value === 'View Diff' ? (
            <button onClick={() => openDiffViewer(params, 'other')} className="btn-gray">Other</button>
          ) : <span className="dc-muted-text">{params.value}</span>
        },
        {
          field: 'site1Config',
          headerName: 'SOURCE CONFIG',
          flex: 1,
          cellRenderer: (params: any) => renderEditLink(baseUrl1, 'task-entity-config', params.data.rect1id, 'Edit')
        },
        {
          field: 'site2Config',
          headerName: 'TARGET CONFIG',
          flex: 1,
          cellRenderer: (params: any) => renderEditLink(baseUrl2, 'task-entity-config', params.data.rect2id, 'Edit')
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
        {
          field: 'site1Version',
          headerName: 'SOURCE VERSION',
          flex: 1.5,
          cellRenderer: (params: any) => renderEditLink(baseUrl1, 'task-entity-config', params.data.rect1id, params.value)
        },
        {
          field: 'site2Version',
          headerName: 'TARGET VERSION',
          flex: 1.5,
          cellRenderer: (params: any) => renderEditLink(baseUrl2, 'task-entity-config', params.data.rect2id, params.value)
        },
        { field: 'dt_status', headerName: 'TASK ENTITY DIFF STATUS', flex: 1.5 },
        {
          field: 'datatableDiff',
          headerName: 'TASK ENTITY DIFF',
          flex: 1.5,
          cellRenderer: (params: any) => params.value === 'View Diff' ? (
            <button onClick={() => openDiffViewer(params, 'structure')} className="btn-gray">View Diff</button>
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

export interface TaskEntityProps {
  activeOption?: string;
}

const TaskEntity: React.FC<TaskEntityProps> = ({ activeOption = 'task_entity' }) => {
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

export default TaskEntity;
