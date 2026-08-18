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
  compare: (site1Dataset: any[], site2Dataset: any[]) => {
    const dataDiff: any[] = [];
    const versionMismatch: any[] = [];
    const onlySite1: any[] = [];
    const onlySite2: any[] = [];

    const map1 = site1Dataset || [];
    const map2 = site2Dataset || [];

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
          site1Version: record1.entity_version,
          site2Version: non_matched_versions_rec.entity_version,
          dt_status: record1.entity_config === non_matched_versions_rec.entity_config ? "No change" : "Diff Changes",
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
          rec1version: record1.entity_version,
          rec2version: record2.entity_version,
          rect1id: record1.id,
          rect2id: record2.id,
          dt_status: record1.entity_config === record2.entity_config ? "No change" : "Diff Changes",
          datatableDiff: record1.entity_config === record2.entity_config ? "No Diff" : "View Diff",
          other_diff: hasOtherDiff ? "Diff Changes" : "No change",
          otherDiff: hasOtherDiff ? "View Diff" : "No Diff",
          raw1: record1,
          raw2: record2
        });
      }
    });

    map1.forEach((record1: any) => {
      if (!map2.some((record2: any) => record2.entity_type === record1.entity_type)) {
        onlySite1.push({
          tag: record1.entity_type,
          version: record1.entity_version,
          id: record1.id,
          raw: record1
        });
      }
    });

    map2.forEach((record2: any) => {
      if (!map1.some((record1: any) => record1.entity_type === record2.entity_type)) {
        onlySite2.push({
          tag: record2.entity_type,
          version: record2.entity_version,
          id: record2.id,
          raw: record2
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
          headerName: 'SITE 1 CONFIG',
          flex: 1,
          cellRenderer: (params: any) => renderEditLink(baseUrl1, 'task-entity-config', params.data.rect1id, 'Edit')
        },
        {
          field: 'site2Config',
          headerName: 'SITE 2 CONFIG',
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
          headerName: 'SITE1 VERSION',
          flex: 1.5,
          cellRenderer: (params: any) => renderEditLink(baseUrl1, 'task-entity-config', params.data.rect1id, params.value)
        },
        {
          field: 'site2Version',
          headerName: 'SITE2 VERSION',
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
      site1ColDefs: [
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
      ],
      site2ColDefs: [
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
      ]
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

export default TaskEntity;
