import React from 'react';
import { useConfigurationDiff } from '../../hooks/useConfigurationDiff';
import DataDiffTable from '../../components/DataDiffTable';
import VersionMismatchTable from '../../components/VersionMismatchTable';
import OnlySiteTable from '../../components/OnlySiteTable';
import { renderTrimTooltip, renderTagLink, renderEditLink } from '../../utils/cellRenderers';

export const workFlowConfigConfig = {
  apiKey: 'workflow',
  leftDataKey: 'wf_json',
  rightDataKey: 'wf_json',
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

    const map1 = toList(sourceDataset);
    const map2 = toList(targetDataset);

    map1.forEach((record1: any) => {
      const record2 = map2.find((r: any) => r.wf_code === record1.wf_code);

      if (record2) {
        const hasDiff = record1.wf_json !== record2.wf_json;

        dataDiff.push({
          id: record1.wf_id || record1.id || record1.wf_code,
          tag: record1.wf_name,
          rect1id: record1.wf_id,
          rect2id: record2.wf_id,
          wf_status: hasDiff ? "Diff Changes" : "No Diff",
          datatableDiff: hasDiff ? "View Diff" : "No Diff",
          version_source: record1.version,
          version_target: record2.version,
          version_site1: record1.version,
          version_site2: record2.version,
          raw1: record1,
          raw2: record2
        });
      } else {
        onlySource.push({
          tag: record1.wf_code,
          wf_id: record1.wf_id,
          id: record1.wf_id || record1.id,
          version: record1.version,
          raw: record1
        });
      }
    });

    map2.forEach((record2: any) => {
      const record1 = map1.find((r: any) => r.wf_code === record2.wf_code);
      if (!record1) {
        onlyTarget.push({
          tag: record2.wf_code,
          wf_id: record2.wf_id,
          id: record2.wf_id || record2.id,
          version: record2.version,
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
  getColumns: ({ openDiffViewer, openDataViewer, baseUrl1, baseUrl2 }: any) => {
    const sourceColDefs = [
      { field: 'tag', headerName: 'TAG', flex: 2, cellRenderer: (params: any) => renderTagLink(baseUrl1, 'workflow-config', params.data.wf_id || params.data.id, params.value) },
      {
        field: 'version',
        headerName: 'SOURCE VERSION',
        flex: 1.2,
        cellRenderer: (params: any) => renderEditLink(baseUrl1, 'workflow-config', params.data.wf_id, params.value)
      },
      {
        field: 'viewData',
        headerName: 'VIEW DATA',
        flex: 1.2,
        cellRenderer: (params: any) => (
          <button onClick={() => openDataViewer({ data: { tag: params.data.tag, raw: JSON.parse(params.data.raw.wf_json || '{}') } })} className="btn-gray">View Data</button>
        )
      }
    ];

    const targetColDefs = [
      { field: 'tag', headerName: 'TAG', flex: 2, cellRenderer: (params: any) => renderTagLink(baseUrl2, 'workflow-config', params.data.wf_id || params.data.id, params.value) },
      {
        field: 'version',
        headerName: 'TARGET VERSION',
        flex: 1.2,
        cellRenderer: (params: any) => renderEditLink(baseUrl2, 'workflow-config', params.data.wf_id, params.value)
      },
      {
        field: 'viewData',
        headerName: 'VIEW DATA',
        flex: 1.2,
        cellRenderer: (params: any) => (
          <button onClick={() => openDataViewer({ data: { tag: params.data.tag, raw: JSON.parse(params.data.raw.wf_json || '{}') } })} className="btn-gray">View Data</button>
        )
      }
    ];

    return {
      dataDiffColDefs: [
        { field: 'tag', headerName: 'TAG', flex: 1.5, cellRenderer: (params: any) => renderTrimTooltip(params.value, 35) },
        { field: 'wf_status', headerName: 'MASTER CONFIG DIFF STATUS', flex: 1.5 },
        {
          field: 'datatableDiff',
          headerName: 'MASTER CONFIG DIFF',
          flex: 1.2,
          cellRenderer: (params: any) => params.value === 'View Diff' ? (
            <button onClick={() => openDiffViewer(params, 'structure')} className="btn-gray">View Diff</button>
          ) : <span className="dc-muted-text">{params.value}</span>
        },
        {
          field: 'version_site1',
          headerName: 'SOURCE VERSION',
          flex: 1.2,
          cellRenderer: (params: any) => renderEditLink(baseUrl1, 'workflow-config', params.data.rect1id, params.value)
        },
        {
          field: 'version_site2',
          headerName: 'TARGET VERSION',
          flex: 1.2,
          cellRenderer: (params: any) => renderEditLink(baseUrl2, 'workflow-config', params.data.rect2id, params.value)
        }
      ],
      sourceColDefs,
      targetColDefs,
      site1ColDefs: sourceColDefs,
      site2ColDefs: targetColDefs
    };
  }
};

export const workflowConfig = workFlowConfigConfig;

export interface WorkFlowConfigProps {
  activeOption?: string;
}

const WorkFlowConfig: React.FC<WorkFlowConfigProps> = ({ activeOption = 'workflow_config' }) => {
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

export default WorkFlowConfig;
