import React from 'react';
import { useConfigurationDiff } from '../../hooks/useConfigurationDiff';
import DataDiffTable from '../../components/DataDiffTable';
import VersionMismatchTable from '../../components/VersionMismatchTable';
import OnlySiteTable from '../../components/OnlySiteTable';
import { renderTrimTooltip, renderTagLink } from '../../utils/cellRenderers';

export const masterConfigConfig = {
  apiKey: 'master_config',
  leftDataKey: 'master_config',
  rightDataKey: 'master_config',
  hasVersionMismatch: false,
  compare: (sourceDataset: any, targetDataset: any) => {
    const dataDiff: any[] = [];
    const onlySource: any[] = [];
    const onlyTarget: any[] = [];

    const map1 = sourceDataset || {};
    const map2 = targetDataset || {};

    for (const key in map1) {
      if (map1.hasOwnProperty(key) && !map2.hasOwnProperty(key) && key !== undefined) {
        onlySource.push({
          tag: key,
          id: map1[key]?.id || key,
          version: map1[key]?.version,
          sitecount: map1[key]?.data_count || "NA",
          sourceCount: map1[key]?.data_count || "NA",
          raw: map1[key]
        });
      }
    }

    for (const key in map2) {
      if (map2.hasOwnProperty(key) && !map1.hasOwnProperty(key) && key !== undefined) {
        onlyTarget.push({
          tag: key,
          id: map2[key]?.id || key,
          version: map2[key]?.version,
          sitecount: map2[key]?.data_count || "NA",
          targetCount: map2[key]?.data_count || "NA",
          raw: map2[key]
        });
      }

      if (map1.hasOwnProperty(key) && map2.hasOwnProperty(key) && key !== undefined) {
        const item1 = map1[key];
        const item2 = map2[key];

        const hasDiff = item1?.config_json !== item2?.config_json;

        dataDiff.push({
          tag: key,
          rec1version: item1?.version,
          rec2version: item2?.version,
          dt_status: hasDiff ? "Diff Changes" : "No diff",
          datatableDiff: hasDiff ? "View Diff" : "No Diff",
          site1count: item1?.data_count || "NA",
          site2count: item2?.data_count || "NA",
          sourceCount: item1?.data_count || "NA",
          targetCount: item2?.data_count || "NA",
          raw1: item1,
          raw2: item2
        });
      }
    }

    return {
      dataDiff,
      versionMismatch: [],
      onlySource,
      onlyTarget,
      onlySite1: onlySource,
      onlySite2: onlyTarget
    };
  },
  getColumns: ({ openDiffViewer, handleCloneConfiguration, baseUrl1, baseUrl2 }: any) => {
    const sourceColDefs = [
      { field: 'tag', headerName: 'TAG', flex: 2, cellRenderer: (params: any) => renderTagLink(baseUrl1, 'master-config', params.data.id || params.data.tag, params.value) },
      { field: 'version', headerName: 'SITE VERSION', flex: 1 },
      { field: 'sitecount', headerName: 'SITE COUNT', flex: 1 },
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
      { field: 'tag', headerName: 'TAG', flex: 2, cellRenderer: (params: any) => renderTagLink(baseUrl2, 'master-config', params.data.id || params.data.tag, params.value) },
      { field: 'version', headerName: 'SITE VERSION', flex: 1 },
      { field: 'sitecount', headerName: 'SITE COUNT', flex: 1 },
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
        { field: 'rec1version', headerName: 'SITE VERSION', flex: 1 },
        { field: 'dt_status', headerName: 'MASTER CONFIG DIFF STATUS', flex: 1.5 },
        {
          field: 'datatableDiff',
          headerName: 'MASTER CONFIG DIFF',
          flex: 1.2,
          cellRenderer: (params: any) => params.value === 'View Diff' ? (
            <button onClick={() => openDiffViewer(params, 'other')} className="btn-gray">View Diff</button>
          ) : <span className="dc-muted-text">{params.value}</span>
        },
        { field: 'site1count', headerName: 'SOURCE COUNT', flex: 1 },
        { field: 'site2count', headerName: 'TARGET COUNT', flex: 1 }
      ],
      sourceColDefs,
      targetColDefs,
      site1ColDefs: sourceColDefs,
      site2ColDefs: targetColDefs
    };
  }
};

export interface MasterConfigProps {
  activeOption?: string;
}

const MasterConfig: React.FC<MasterConfigProps> = ({ activeOption = 'master_config' }) => {
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

export default MasterConfig;
