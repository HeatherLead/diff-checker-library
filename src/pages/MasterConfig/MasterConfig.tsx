import React from 'react';
import { useConfigurationDiff } from '../../hooks/useConfigurationDiff';
import DataDiffTable from '../../components/DataDiffTable';
import VersionMismatchTable from '../../components/VersionMismatchTable';
import OnlySiteTable from '../../components/OnlySiteTable';
import { renderTrimTooltip } from '../../utils/cellRenderers';

export const masterConfigConfig = {
  apiKey: 'master_config',
  leftDataKey: 'master_config',
  rightDataKey: 'master_config',
  hasVersionMismatch: false,
  compare: (site1Dataset: any, site2Dataset: any) => {
    const dataDiff: any[] = [];
    const onlySite1: any[] = [];
    const onlySite2: any[] = [];

    const map1 = site1Dataset || {};
    const map2 = site2Dataset || {};

    for (const key in map1) {
      if (map1.hasOwnProperty(key) && !map2.hasOwnProperty(key) && key !== undefined) {
        onlySite1.push({
          tag: key,
          version: map1[key]?.version,
          sitecount: map1[key]?.data_count || "NA",
          raw: map1[key]
        });
      }
    }

    for (const key in map2) {
      if (map2.hasOwnProperty(key) && !map1.hasOwnProperty(key) && key !== undefined) {
        onlySite2.push({
          tag: key,
          version: map2[key]?.version,
          sitecount: map2[key]?.data_count || "NA",
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
          dt_status: hasDiff ? "Diff Changes" : "No change",
          datatableDiff: hasDiff ? "View Diff" : "No Diff",
          site1count: item1?.data_count || "NA",
          site2count: item2?.data_count || "NA",
          raw1: item1,
          raw2: item2
        });
      }
    }

    return { dataDiff, versionMismatch: [], onlySite1, onlySite2 };
  },
  getColumns: ({ openDiffViewer, handleCloneConfiguration, baseUrl1, baseUrl2 }: any) => {
    return {
      dataDiffColDefs: [
        { field: 'tag', headerName: 'TAG', flex: 1.5, cellClass: 'font-normal text-gray-700', cellRenderer: (params: any) => renderTrimTooltip(params.value, 35) },
        { field: 'rec1version', headerName: 'SITE VERSION', flex: 1 },
        { field: 'dt_status', headerName: 'MASTER CONFIG DIFF STATUS', flex: 1.5 },
        {
          field: 'datatableDiff',
          headerName: 'MASTER CONFIG DIFF',
          flex: 1.2,
          cellRenderer: (params: any) => params.value === 'View Diff' ? (
            <button onClick={() => openDiffViewer(params, 'other')} className="btn-gray">View Diff</button>
          ) : <span className="text-gray-500 font-normal">{params.value}</span>
        },
        { field: 'site1count', headerName: 'SITE 1 COUNT', flex: 1 },
        { field: 'site2count', headerName: 'SITE 2 COUNT', flex: 1 }
      ],
      site1ColDefs: [
        { field: 'tag', headerName: 'TAG', flex: 2, cellClass: 'font-normal text-[#800040]', cellRenderer: (params: any) => renderTrimTooltip(params.value, 35) },
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
      ],
      site2ColDefs: [
        { field: 'tag', headerName: 'TAG', flex: 2, cellClass: 'font-normal text-[#800040]', cellRenderer: (params: any) => renderTrimTooltip(params.value, 35) },
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
      ]
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

export default MasterConfig;
