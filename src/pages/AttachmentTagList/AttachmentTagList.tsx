import React from 'react';
import { useConfigurationDiff } from '../../hooks/useConfigurationDiff';
import DataDiffTable from '../../components/DataDiffTable';
import VersionMismatchTable from '../../components/VersionMismatchTable';
import OnlySiteTable from '../../components/OnlySiteTable';
import { renderTrimTooltip, renderTagLink } from '../../utils/cellRenderers';

export const attachmentTagListConfig = {
  apiKey: 'bo_attachment_tagging',
  leftDataKey: 'attachment',
  rightDataKey: 'attachment',
  hasVersionMismatch: false,
  compare: (sourceDataset: any[], targetDataset: any[]) => {
    const map1 = sourceDataset || [];
    const map2 = targetDataset || [];

    const dataDiff: any[] = [];
    const onlySource: any[] = [];
    const onlyTarget: any[] = [];

    map1.forEach((record1: any) => {
      const record2 = map2.find(
        (record: any) =>
          record.tag_name?.trim() === record1.tag_name?.trim() &&
          record.bo_type === record1.bo_type
      );

      if (record2 !== undefined) {
        const clean1 = Object.fromEntries(
          Object.entries(record1).filter(
            ([key]) =>
              !["tag_name", "bo_type", "created_by", "updated_by", "updated", "created"].includes(key)
          )
        );
        const clean2 = Object.fromEntries(
          Object.entries(record2).filter(
            ([key]) =>
              !["tag_name", "bo_type", "created_by", "updated_by", "updated", "created"].includes(key)
          )
        );

        const hasDiff = JSON.stringify(clean1) !== JSON.stringify(clean2);

        dataDiff.push({
          id: record1.id || record2.id || record1.tag_name,
          tag: record1.tag_name?.trim(),
          bo_type: record1.bo_type?.trim() || '',
          msg_diff: hasDiff ? "Diff Changes" : "No diff",
          display_msg_diff: hasDiff ? "View Diff" : "No diff",
          raw1: record1,
          raw2: record2
        });
      } else {
        onlySource.push({
          tag: record1.tag_name?.trim(),
          bo_type: record1.bo_type?.trim() || '',
          task_names: record1.task_names || "",
          id: record1.id,
          raw: record1
        });
      }
    });

    map2.forEach((record2: any) => {
      const record1 = map1.find(
        (record: any) =>
          record.tag_name?.trim() === record2.tag_name?.trim() &&
          record.bo_type === record2.bo_type
      );

      if (record1 === undefined) {
        onlyTarget.push({
          tag: record2.tag_name?.trim(),
          bo_type: record2.bo_type?.trim() || '',
          task_names: record2.task_names || "",
          id: record2.id,
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
  getColumns: ({ openDiffViewer, openDataViewer, handleSyncConfiguration, handleCloneConfiguration, baseUrl1, baseUrl2 }: any) => {
    const sourceColDefs = [
      { field: 'tag', headerName: 'TAG', flex: 2, cellRenderer: (params: any) => renderTagLink(baseUrl1, 'attachment-tag-list', params.data.id, params.value) },
      { field: 'bo_type', headerName: 'BO TYPE', flex: 1 },
      { field: 'task_names', headerName: 'TASK NAMES', flex: 1.5, cellRenderer: (params: any) => renderTrimTooltip(params.value, 20) },
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
      { field: 'tag', headerName: 'TAG', flex: 2, cellRenderer: (params: any) => renderTagLink(baseUrl2, 'attachment-tag-list', params.data.id, params.value) },
      { field: 'bo_type', headerName: 'BO TYPE', flex: 1 },
      { field: 'task_names', headerName: 'TASK NAMES', flex: 1.5, cellRenderer: (params: any) => renderTrimTooltip(params.value, 20) },
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
        { field: 'bo_type', headerName: 'BO TYPE', flex: 1 },
        {
          field: 'display_msg_diff',
          headerName: 'DISPLAY MSG',
          flex: 1.2,
          cellRenderer: (params: any) => params.value === 'View Diff' ? (
            <button onClick={() => openDiffViewer(params, 'other')} className="btn-gray">View Diff</button>
          ) : <span className="dc-muted-text">{params.value}</span>
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
      sourceColDefs,
      targetColDefs,
      site1ColDefs: sourceColDefs,
      site2ColDefs: targetColDefs
    };
  }
};

export interface AttachmentTagListProps {
  activeOption?: string;
}

const AttachmentTagList: React.FC<AttachmentTagListProps> = ({ activeOption = 'attachment_tag_list' }) => {
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

export default AttachmentTagList;
