import React from 'react';
import { useConfigurationDiff } from '../../hooks/useConfigurationDiff';
import DataDiffTable from '../../components/DataDiffTable';
import VersionMismatchTable from '../../components/VersionMismatchTable';
import OnlySiteTable from '../../components/OnlySiteTable';
import { renderTrimTooltip, renderTagLink } from '../../utils/cellRenderers';

export const templatesConfig = {
  apiKey: 'input_file_tagging',
  leftDataKey: 'templates',
  rightDataKey: 'templates',
  hasVersionMismatch: false,
  compare: (site1Dataset: any[], site2Dataset: any[]) => {
    const dataDiff: any[] = [];
    const onlySite1: any[] = [];
    const onlySite2: any[] = [];

    const map1 = site1Dataset || [];
    const map2 = site2Dataset || [];

    const tagsIn1 = new Set(map1.map((obj: any) => obj.tag_name?.trim()).filter(Boolean));
    const tagsIn2 = new Set(map2.map((obj: any) => obj.tag_name?.trim()).filter(Boolean));

    const parseCSVLine = (line: string) => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const parseCSVToCleanedArray = (base64Str: string) => {
      if (!base64Str) return [];
      try {
        const decodedText = atob(base64Str);
        const lines = decodedText.split(/\r?\n/).filter((line: string) => line.trim() !== "");
        if (lines.length === 0) return [];
        return parseCSVLine(lines[0]);
      } catch (error) {
        return [];
      }
    };

    const parseValidatorJson = (jsonStr: string) => {
      if (!jsonStr) return {};
      try { return JSON.parse(jsonStr); } catch (e) { return {}; }
    };

    const filterRecord = (rec: any) => {
      const filtered: Record<string, any> = Object.fromEntries(
        Object.entries(rec).filter(
          ([key]) => !["tag_name", "tag_id", "template_id", "created_by", "updated_by", "updated", "created"].includes(key)
        )
      );
      if (filtered.file_base64 && typeof filtered.file_base64 === "string") {
        filtered.file_base64 = parseCSVToCleanedArray(filtered.file_base64);
      }
      return filtered;
    };

    map1.forEach((record1: any) => {
      if (!record1.tag_name) return;
      const tag1 = record1.tag_name.trim();

      const record2Exact = map2.find(
        (record: any) => record.tag_name?.trim() === tag1 && record.version === record1.version
      );

      if (record2Exact !== undefined) {
        const clean1 = filterRecord(record1);
        const clean2 = filterRecord(record2Exact);
        const hasDiff = JSON.stringify(clean1) !== JSON.stringify(clean2);

        const excel1 = { excel_diff: record1.file_base64 ? parseCSVToCleanedArray(record1.file_base64) : [] };
        const excel2 = { excel_diff: record2Exact.file_base64 ? parseCSVToCleanedArray(record2Exact.file_base64) : [] };
        const hasExcelDiff = JSON.stringify(excel1) !== JSON.stringify(excel2);

        const val1 = record1.validator_json ? parseValidatorJson(record1.validator_json) : {};
        const val2 = record2Exact.validator_json ? parseValidatorJson(record2Exact.validator_json) : {};
        const hasValDiff = JSON.stringify(val1) !== JSON.stringify(val2);

        dataDiff.push({
          tag: tag1,
          bo_type: (record1.business_unit || "").trim(),
          rec1version: record1.version || "",
          rec2version: record2Exact.version || "",
          msg_diff: hasDiff ? "Diff Changes" : "No change",
          excel_diff: hasExcelDiff ? "View Diff" : "No diff",
          excel1,
          excel2,
          validator_diff: hasValDiff ? "View Diff" : "No diff",
          val1,
          val2,
          raw1: record1,
          raw2: record2Exact
        });
      } else {
        if (!tagsIn2.has(tag1)) {
          onlySite1.push({
            tag: tag1,
            bo_type: (record1.business_unit || "").trim(),
            id: record1.id,
            raw: record1
          });
        }
      }
    });

    map2.forEach((record2: any) => {
      if (!record2.tag_name) return;
      const tag2 = record2.tag_name.trim();
      if (!tagsIn1.has(tag2)) {
        onlySite2.push({
          tag: tag2,
          bo_type: (record2.business_unit || "").trim(),
          id: record2.id,
          raw: record2
        });
      }
    });

    return { dataDiff, versionMismatch: [], onlySite1, onlySite2 };
  },
  getColumns: ({ openDiffViewer, openDataViewer, handleSyncConfiguration, handleCloneConfiguration, baseUrl1, baseUrl2 }: any) => {
    return {
      dataDiffColDefs: [
        { field: 'tag', headerName: 'TAG', flex: 1.5, cellRenderer: (params: any) => renderTrimTooltip(params.value, 35) },
        { field: 'bo_type', headerName: 'BO TYPE', flex: 1 },
        {
          field: 'excel_diff',
          headerName: 'EXCEL DIFF',
          flex: 1.2,
          cellRenderer: (params: any) => params.value === 'View Diff' ? (
            <button onClick={() => openDiffViewer(params, 'excel')} className="btn-gray">View Diff</button>
          ) : <span className="dc-muted-text">{params.value}</span>
        },
        {
          field: 'validator_diff',
          headerName: 'VALIDATOR DIFF',
          flex: 1.2,
          cellRenderer: (params: any) => params.value === 'View Diff' ? (
            <button onClick={() => openDiffViewer(params, 'validator')} className="btn-gray">View Diff</button>
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
      site1ColDefs: [
        { field: 'tag', headerName: 'TAG', flex: 2, cellRenderer: (params: any) => renderTagLink(baseUrl1, 'templates', params.data.id, params.value) },
        { field: 'bo_type', headerName: 'BO TYPE', flex: 1 },
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
      ],
      site2ColDefs: [
        { field: 'tag', headerName: 'TAG', flex: 2, cellRenderer: (params: any) => renderTagLink(baseUrl2, 'templates', params.data.id, params.value) },
        { field: 'bo_type', headerName: 'BO TYPE', flex: 1 },
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
      ]
    };
  }
};

export interface TemplatesProps {
  activeOption?: string;
}

const Templates: React.FC<TemplatesProps> = ({ activeOption = 'templates' }) => {
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

export default Templates;
