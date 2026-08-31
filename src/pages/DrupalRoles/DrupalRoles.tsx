import React from 'react';
import { useConfigurationDiff } from '../../hooks/useConfigurationDiff';
import DataDiffTable from '../../components/DataDiffTable';
import VersionMismatchTable from '../../components/VersionMismatchTable';
import OnlySiteTable from '../../components/OnlySiteTable';
import { renderTrimTooltip, renderTagLink } from '../../utils/cellRenderers';

export const drupalRolesConfig = {
  apiKey: 'drupal_roles',
  leftDataKey: 'tag',
  rightDataKey: 'tag',
  hasVersionMismatch: false,
  compare: (sourceDataset: any, targetDataset: any) => {
    const dataDiff: any[] = [];
    const onlySource: any[] = [];
    const onlyTarget: any[] = [];

    const map1 = sourceDataset || {};
    const map2 = targetDataset || {};

    const keys1 = Object.keys(map1);
    const keys2 = Object.keys(map2);

    keys1.forEach((key) => {
      if (map2.hasOwnProperty(key)) {
        dataDiff.push({
          tag: map1[key],
          raw1: { id: key, tag: map1[key] },
          raw2: { id: key, tag: map2[key] }
        });
      } else {
        onlySource.push({
          tag: map1[key],
          id: key,
          raw: { id: key, tag: map1[key] }
        });
      }
    });

    keys2.forEach((key) => {
      if (!map1.hasOwnProperty(key)) {
        onlyTarget.push({
          tag: map2[key],
          id: key,
          raw: { id: key, tag: map2[key] }
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
  getColumns: ({ handleCloneConfiguration, baseUrl1, baseUrl2 }: any) => {
    const sourceColDefs = [
      { field: 'tag', headerName: 'TAG', flex: 2, cellRenderer: (params: any) => renderTagLink(baseUrl1, 'drupal-roles', params.data.id || params.data.tag, params.value, 40) },
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
      { field: 'tag', headerName: 'TAG', flex: 2, cellRenderer: (params: any) => renderTagLink(baseUrl2, 'drupal-roles', params.data.id || params.data.tag, params.value, 40) },
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
        { field: 'tag', headerName: 'TAG', flex: 2, cellRenderer: (params: any) => renderTrimTooltip(params.value, 40) }
      ],
      sourceColDefs,
      targetColDefs,
      site1ColDefs: sourceColDefs,
      site2ColDefs: targetColDefs
    };
  }
};

export interface DrupalRolesProps {
  activeOption?: string;
}

const DrupalRoles: React.FC<DrupalRolesProps> = ({ activeOption = 'drupal_roles' }) => {
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

export default DrupalRoles;
