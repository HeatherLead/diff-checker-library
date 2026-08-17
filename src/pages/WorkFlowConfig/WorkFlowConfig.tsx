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
  compare: (site1Dataset: any[], site2Dataset: any[]) => {
    const dataDiff: any[] = [];
    const onlySite1: any[] = [];
    const onlySite2: any[] = [];

    const map1 = site1Dataset || [];
    const map2 = site2Dataset || [];

    map1.forEach((record1: any) => {
      const record2 = map2.find((r: any) => r.wf_code === record1.wf_code);

      if (record2) {
        const hasDiff = record1.wf_json !== record2.wf_json;

        dataDiff.push({
          tag: record1.wf_name,
          rect1id: record1.wf_id,
          rect2id: record2.wf_id,
          wf_status: hasDiff ? "Diff Changes" : "No change",
          datatableDiff: hasDiff ? "View Diff" : "No Diff",
          version_site1: record1.version,
          version_site2: record2.version,
          raw1: record1,
          raw2: record2
        });
      } else {
        onlySite1.push({
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
        onlySite2.push({
          tag: record2.wf_code,
          wf_id: record2.wf_id,
          id: record2.wf_id || record2.id,
          version: record2.version,
          raw: record2
        });
      }
    });

    return { dataDiff, versionMismatch: [], onlySite1, onlySite2 };
  },
  getColumns: ({ openDiffViewer, openDataViewer, baseUrl1, baseUrl2 }: any) => {
    return {
      dataDiffColDefs: [
        { field: 'tag', headerName: 'TAG', flex: 1.5, cellClass: 'font-normal text-gray-700', cellRenderer: (params: any) => renderTrimTooltip(params.value, 35) },
        { field: 'wf_status', headerName: 'MASTER CONFIG DIFF STATUS', flex: 1.5 },
        {
          field: 'datatableDiff',
          headerName: 'MASTER CONFIG DIFF',
          flex: 1.2,
          cellRenderer: (params: any) => params.value === 'View Diff' ? (
            <button onClick={() => openDiffViewer(params, 'structure')} className="btn-gray">View Diff</button>
          ) : <span className="text-gray-500 font-normal">{params.value}</span>
        },
        {
          field: 'version_site1',
          headerName: 'SITE1 VERSION',
          flex: 1.2,
          cellRenderer: (params: any) => renderEditLink(baseUrl1, 'workflow-config', params.data.rect1id, params.value)
        },
        {
          field: 'version_site2',
          headerName: 'SITE2 VERSION',
          flex: 1.2,
          cellRenderer: (params: any) => renderEditLink(baseUrl2, 'workflow-config', params.data.rect2id, params.value)
        }
      ],
      site1ColDefs: [
        { field: 'tag', headerName: 'TAG', flex: 2, cellClass: 'font-normal text-[#800040]', cellRenderer: (params: any) => renderTagLink(baseUrl1, 'workflow-config', params.data.wf_id || params.data.id, params.value) },
        {
          field: 'version',
          headerName: 'SITE1 VERSION',
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
      ],
      site2ColDefs: [
        { field: 'tag', headerName: 'TAG', flex: 2, cellClass: 'font-normal text-[#800040]', cellRenderer: (params: any) => renderTagLink(baseUrl2, 'workflow-config', params.data.wf_id || params.data.id, params.value) },
        {
          field: 'version',
          headerName: 'SITE2 VERSION',
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
      ]
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

export default WorkFlowConfig;
