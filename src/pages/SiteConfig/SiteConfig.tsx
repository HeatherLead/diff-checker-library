import React from 'react';
import { useConfigurationDiff } from '../../hooks/useConfigurationDiff';
import DataDiffTable from '../../components/DataDiffTable';
import VersionMismatchTable from '../../components/VersionMismatchTable';
import OnlySiteTable from '../../components/OnlySiteTable';
import { renderTrimTooltip } from '../../utils/cellRenderers';

export const siteConfigConfig = {
  apiKey: 'configurations',
  leftDataKey: 'config_data',
  rightDataKey: 'config_data',
  hasVersionMismatch: false,
  compare: (sourceDataset: any, targetDataset: any) => {
    const dataDiff: any[] = [];
    const onlySource: any[] = [];
    const onlyTarget: any[] = [];

    const toConfigMap = (dataset: any): Record<string, any> => {
      if (!dataset) return {};
      if (Array.isArray(dataset)) {
        const res: Record<string, any> = {};
        dataset.forEach((item: any) => {
          if (item) {
            const key = item.tag || item.name || item.id || item.type || '';
            if (key) res[key] = item;
          }
        });
        return res;
      }
      if (typeof dataset === 'object') return dataset as Record<string, any>;
      return {};
    };

    const map1 = toConfigMap(sourceDataset);
    const map2 = toConfigMap(targetDataset);

    for (const key in map1) {
      if (map1.hasOwnProperty(key) && !map2.hasOwnProperty(key) && key !== undefined) {
        onlySource.push({
          tag: key,
          id: map1[key]?.id || key,
          raw: map1[key]
        });
      }
    }

    for (const key in map2) {
      if (map2.hasOwnProperty(key) && !map1.hasOwnProperty(key) && key !== undefined) {
        onlyTarget.push({
          tag: key,
          id: map2[key]?.id || key,
          raw: map2[key]
        });
      }

      if (map1.hasOwnProperty(key) && map2.hasOwnProperty(key) && key !== undefined) {
        const item1 = map1[key] || {};
        const item2 = map2[key] || {};

        const clean1 = Object.fromEntries(
          Object.entries(item1).filter(([k]) => !["updated", "updated_by", "created", "created_by"].includes(k))
        );
        const clean2 = Object.fromEntries(
          Object.entries(item2).filter(([k]) => !["updated", "updated_by", "created", "created_by"].includes(k))
        );

        const hasDiff = JSON.stringify(clean1) !== JSON.stringify(clean2);

        dataDiff.push({
          tag: key,
          id: key,
          site_config_diff: hasDiff ? "View Diff" : "No Diff",
          hasDiff,
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
  getColumns: ({ openDiffViewer, openDataViewer, handleSyncConfiguration, handleCloneConfiguration, baseUrl1, baseUrl2 }: any) => {
    const sourceColDefs = [
      {
        field: 'tag',
        headerName: 'TAG',
        flex: 2,
        cellRenderer: (params: any) => renderTrimTooltip(params.value, 45)
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
        cellRenderer: (params: any) => renderTrimTooltip(params.value, 45)
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
        { field: 'tag', headerName: 'TAG', flex: 2, cellRenderer: (params: any) => renderTrimTooltip(params.value, 45) },
        {
          field: 'site_config_diff',
          headerName: 'SITE CONFIG DIFF',
          flex: 1.2,
          cellRenderer: (params: any) => params.value === 'View Diff' ? (
            <button onClick={() => openDiffViewer(params, 'site_config')} className="btn-gray">View Diff</button>
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

export interface SiteConfigProps {
  activeOption?: string;
}

const SiteConfig: React.FC<SiteConfigProps> = ({ activeOption = 'site_config' }) => {
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

export default SiteConfig;
