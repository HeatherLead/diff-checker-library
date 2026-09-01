import React from 'react';
import { useConfigurationDiff } from '../../hooks/useConfigurationDiff';
import DataDiffTable from '../../components/DataDiffTable';
import VersionMismatchTable from '../../components/VersionMismatchTable';
import NonMatchTable from '../../components/NonMatchTable';
import OnlySiteTable from '../../components/OnlySiteTable';
import { renderTrimTooltip, renderTagLink } from '../../utils/cellRenderers';

export const dropdownConfigConfig = {
  apiKey: 'dropdown',
  leftDataKey: 'dropdown_query',
  rightDataKey: 'dropdown_query',
  hasVersionMismatch: false,
  hasOnlySiteTables: false,
  hasNonMatchTable: true,
  compare: (sourceDataset: any, targetDataset: any) => {
    const dataDiff: any[] = [];
    const nonMatch: any[] = [];

    const toList = (dataset: any): any[] => {
      if (!dataset) return [];
      if (Array.isArray(dataset)) return dataset.filter(Boolean);
      if (typeof dataset === 'object') return Object.values(dataset).filter(Boolean);
      return [];
    };

    const map1 = toList(sourceDataset);
    const map2 = toList(targetDataset);

    map1.forEach((record1: any) => {
      const record2 = map2.find((o: any) => o.tag === record1.tag);

      if (record2) {
        const hasDiff = record1.dropdown_query !== record2.dropdown_query;
        dataDiff.push({
          id: record1.id || record2.id || record1.tag,
          tag: record1.tag,
          rec1version: record1.version,
          rec2version: record2.version,
          query_status: hasDiff ? "Diff Changes" : "No Diff",
          dropdown_query: record1.dropdown_query,
          raw1: record1,
          raw2: record2
        });
      } else {
        nonMatch.push({
          tag: record1.tag,
          id: record1.id || record1.tag,
          rec1version: record1.version,
          query_status: "No Match",
          query: record1.dropdown_query,
          raw: record1
        });
      }
    });

    map2.forEach((record2: any) => {
      const record1 = map1.find((o: any) => o.tag === record2.tag);
      if (!record1) {
        nonMatch.push({
          tag: record2.tag,
          id: record2.id || record2.tag,
          rec1version: record2.version,
          query_status: "No Match",
          query: record2.dropdown_query,
          raw: record2
        });
      }
    });

    return {
      dataDiff,
      versionMismatch: [],
      onlySource: nonMatch,
      onlyTarget: [],
      onlySite1: nonMatch,
      onlySite2: [],
      nonMatchRows: nonMatch
    };
  },
  getColumns: ({ openDiffViewer, openDataViewer, baseUrl1 }: any) => {
    const sourceColDefs = [
      { field: 'tag', headerName: 'TAG', flex: 2, cellRenderer: (params: any) => renderTagLink(baseUrl1, 'dropdown-config', params.data.id || params.data.tag, params.value) },
      { field: 'rec1version', headerName: 'SITE VERSION', flex: 1 },
      {
        field: 'view_query',
        headerName: 'VIEW QUERY',
        flex: 1.2,
        cellRenderer: (params: any) => (
          <button onClick={() => openDataViewer({ data: { tag: params.data.tag, raw: { query: params.data.query } } })} className="btn-gray">View</button>
        )
      }
    ];

    return {
      dataDiffColDefs: [
        { field: 'tag', headerName: 'TAG', flex: 1.5, cellRenderer: (params: any) => renderTrimTooltip(params.value, 35) },
        { field: 'rec1version', headerName: 'SITE VERSION', flex: 1 },
        {
          field: 'query_diff',
          headerName: 'QUERY DIFF',
          flex: 1.2,
          cellRenderer: (params: any) => params.data.query_status === 'Diff Changes' ? (
            <button onClick={() => openDiffViewer(params, 'structure')} className="btn-gray">View Diff</button>
          ) : <span className="dc-muted-text">{params.data.query_status === 'No Diff' ? 'No Diff' : ''}</span>
        }
      ],
      sourceColDefs,
      targetColDefs: [],
      site1ColDefs: sourceColDefs,
      site2ColDefs: [],
      nonMatchColDefs: sourceColDefs
    };
  }
};

export const dropdownConfig = dropdownConfigConfig;

export interface DropdownConfigProps {
  activeOption?: string;
}

const DropdownConfig: React.FC<DropdownConfigProps> = ({ activeOption = 'dropdown_config' }) => {
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

      {/* SECTION 3: NON MATCH TABLE */}
      {config?.hasNonMatchTable ? (
        <NonMatchTable
          activeOption={activeOption}
          nonMatchRows={onlySourceRows}
        />
      ) : (
        <OnlySiteTable
          activeOption={activeOption}
          onlySourceRows={onlySourceRows}
          onlyTargetRows={onlyTargetRows}
        />
      )}
    </div>
  );
};

export default DropdownConfig;
