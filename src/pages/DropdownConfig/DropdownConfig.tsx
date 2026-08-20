import React from 'react';
import { useConfigurationDiff } from '../../hooks/useConfigurationDiff';
import DataDiffTable from '../../components/DataDiffTable';
import VersionMismatchTable from '../../components/VersionMismatchTable';
import OnlySiteTable from '../../components/OnlySiteTable';
import { renderTrimTooltip, renderTagLink } from '../../utils/cellRenderers';

export const dropdownConfigConfig = {
  apiKey: 'dropdown',
  leftDataKey: 'dropdown_query',
  rightDataKey: 'dropdown_query',
  hasVersionMismatch: false,
  hasOnlySiteTables: false,
  hasNonMatchTable: true,
  compare: (site1Dataset: any[], site2Dataset: any[]) => {
    const dataDiff: any[] = [];
    const nonMatch: any[] = [];

    const map1 = site1Dataset || [];
    const map2 = site2Dataset || [];

    map1.forEach((record1: any) => {
      const record2 = map2.find((o: any) => o.tag === record1.tag);

      if (record2) {
        const hasDiff = record1.dropdown_query !== record2.dropdown_query;
        dataDiff.push({
          tag: record1.tag,
          rec1version: record1.version,
          rec2version: record2.version,
          query_status: hasDiff ? "Diff Changes" : "No change",
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

    return { dataDiff, versionMismatch: [], onlySite1: nonMatch, onlySite2: [] };
  },
  getColumns: ({ openDiffViewer, openDataViewer, baseUrl1 }: any) => {
    return {
      dataDiffColDefs: [
        { field: 'tag', headerName: 'TAG', flex: 1.5, cellRenderer: (params: any) => renderTrimTooltip(params.value, 35) },
        { field: 'rec1version', headerName: 'SITE VERSION', flex: 1 },
        { field: 'query_status', headerName: 'QUERY DIFF STATUS', flex: 1.5 },
        {
          field: 'query_diff',
          headerName: 'QUERY DIFF',
          flex: 1.2,
          cellRenderer: (params: any) => params.data.query_status === 'Diff Changes' ? (
            <button onClick={() => openDiffViewer(params, 'structure')} className="btn-gray">View Diff</button>
          ) : <span className="dc-muted-text">{params.data.query_status === 'No change' ? 'No diff' : ''}</span>
        }
      ],
      site1ColDefs: [
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
      ],
      site2ColDefs: []
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

export default DropdownConfig;
