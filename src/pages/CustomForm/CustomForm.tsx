import React from 'react';
import { useConfigurationDiff } from '../../hooks/useConfigurationDiff';
import DataDiffTable from '../../components/DataDiffTable';
import VersionMismatchTable from '../../components/VersionMismatchTable';
import OnlySiteTable from '../../components/OnlySiteTable';
import { renderTrimTooltip, renderTagLink, renderEditLink } from '../../utils/cellRenderers';

export const customFormConfig = {
  apiKey: 'custom_form',
  leftDataKey: 'custom_form_field_data',
  rightDataKey: 'custom_form_field_data',
  hasVersionMismatch: true,
  compare: (sourceDataset: any, targetDataset: any) => {
    const dataDiff: any[] = [];
    const versionMismatch: any[] = [];
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
      const record2 = map2.find(
        (record: any) => record.tag === record1.tag && record.version === record1.version
      );

      const non_matched_versions_rec = map2.find(
        (record: any) => record.tag === record1.tag && record.version !== record1.version
      );

      if (non_matched_versions_rec !== undefined) {
        versionMismatch.push({
          rect1id: record1.id,
          rect2id: non_matched_versions_rec.id,
          tag: record1.tag,
          sourceVersion: record1.version,
          targetVersion: non_matched_versions_rec.version,
          site1Version: record1.version,
          site2Version: non_matched_versions_rec.version,
          dt_status: record1.custom_form_field_data === non_matched_versions_rec.custom_form_field_data ? "No Diff" : "Diff Changes",
          datatableDiff: record1.custom_form_field_data === non_matched_versions_rec.custom_form_field_data ? "No Diff" : "View Diff",
          raw1: record1,
          raw2: non_matched_versions_rec
        });
      }

      if (record2 !== undefined) {
        const clean1 = Object.fromEntries(
          Object.entries(record1).filter(
            ([key]) => !["tag", "version", "id", "updated", "updated_by", "created", "created_by"].includes(key)
          )
        );
        const clean2 = Object.fromEntries(
          Object.entries(record2).filter(
            ([key]) => !["tag", "version", "id", "updated", "updated_by", "created", "created_by"].includes(key)
          )
        );

        const hasOtherDiff = JSON.stringify(clean1) !== JSON.stringify(clean2);

        dataDiff.push({
          tag: record1.tag,
          siteVersion: record1.version,
          sourceVersion: record1.version,
          targetVersion: record2.version,
          rec1version: record1.version,
          rec2version: record2.version,
          rect1id: record1.id,
          rect2id: record2.id,
          dt_status: record1.custom_form_field_data === record2.custom_form_field_data ? "No Diff" : "Diff Changes",
          datatableDiff: record1.custom_form_field_data === record2.custom_form_field_data ? "No Diff" : "View Diff",
          other_diff: hasOtherDiff ? "Diff Changes" : "No Diff",
          otherDiff: hasOtherDiff ? "View Diff" : "No Diff",
          raw1: record1,
          raw2: record2
        });
      }
    });

    map1.forEach((record1: any) => {
      if (!map2.some((record2: any) => record2.tag === record1.tag)) {
        onlySource.push({
          tag: record1.tag,
          version: record1.version,
          id: record1.id,
          raw: record1
        });
      }
    });

    map2.forEach((record2: any) => {
      if (!map1.some((record1: any) => record1.tag === record2.tag)) {
        onlyTarget.push({
          tag: record2.tag,
          version: record2.version,
          id: record2.id,
          raw: record2
        });
      }
    });

    return {
      dataDiff,
      versionMismatch,
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
        cellRenderer: (params: any) => renderTagLink(baseUrl1, 'custom-form-config', params.data.id, params.value)
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
        cellRenderer: (params: any) => renderTagLink(baseUrl2, 'custom-form-config', params.data.id, params.value)
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
        { field: 'tag', headerName: 'TAG', flex: 1.5, cellRenderer: (params: any) => renderTrimTooltip(params.value, 35) },
        { field: 'siteVersion', headerName: 'SITE VERSION', flex: 1 },
        {
          field: 'datatableDiff',
          headerName: 'CUSTOM FORM DIFF',
          flex: 1.2,
          cellRenderer: (params: any) => params.value === 'View Diff' ? (
            <button onClick={() => openDiffViewer(params, 'structure')} className="btn-gray">View Diff</button>
          ) : <span className="dc-muted-text">{params.value}</span>
        },
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
          headerName: 'SOURCE CONFIG',
          flex: 1,
          cellRenderer: (params: any) => renderEditLink(baseUrl1, 'custom-form-config', params.data.rect1id, 'Edit')
        },
        {
          field: 'site2Config',
          headerName: 'TARGET CONFIG',
          flex: 1,
          cellRenderer: (params: any) => renderEditLink(baseUrl2, 'custom-form-config', params.data.rect2id, 'Edit')
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
          headerName: 'SOURCE VERSION',
          flex: 1.5,
          cellRenderer: (params: any) => renderEditLink(baseUrl1, 'custom-form-config', params.data.rect1id, params.value)
        },
        {
          field: 'site2Version',
          headerName: 'TARGET VERSION',
          flex: 1.5,
          cellRenderer: (params: any) => renderEditLink(baseUrl2, 'custom-form-config', params.data.rect2id, params.value)
        },
        {
          field: 'datatableDiff',
          headerName: 'CUSTOM FORM DIFF',
          flex: 1.5,
          cellRenderer: (params: any) => params.value === 'View Diff' ? (
            <button onClick={() => openDiffViewer(params, 'structure')} className="btn-gray">View Diff</button>
          ) : <span className="dc-muted-text">{params.value}</span>
        }
      ],
      sourceColDefs,
      targetColDefs,
      site1ColDefs: sourceColDefs,
      site2ColDefs: targetColDefs
    };
  }
};

export interface CustomFormProps {
  activeOption?: string;
}

const CustomForm: React.FC<CustomFormProps> = ({ activeOption = 'custom_form' }) => {
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

export default CustomForm;
