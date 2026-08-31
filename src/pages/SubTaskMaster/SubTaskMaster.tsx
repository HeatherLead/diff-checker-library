import React from 'react';
import { useConfigurationDiff } from '../../hooks/useConfigurationDiff';
import DataDiffTable from '../../components/DataDiffTable';
import VersionMismatchTable from '../../components/VersionMismatchTable';
import OnlySiteTable from '../../components/OnlySiteTable';
import { renderTrimTooltip } from '../../utils/cellRenderers';

export const subTaskMasterConfig = {
  apiKey: 'subtask_master',
  leftDataKey: 'subtask_master',
  rightDataKey: 'subtask_master',
  hasVersionMismatch: false,
  hasOnlySiteTables: false,
  compare: (sourceDataset: any[], targetDataset: any[]) => {
    const countDuplicates = (array: any[]) => {
      const counts: Record<string, number> = {};
      (array || []).forEach((obj: any) => {
        if (!obj.wf_code || !obj.task_name) return;
        const key = `${obj.wf_code.trim()}-${obj.task_name.trim()}`;
        counts[key] = (counts[key] || 0) + 1;
      });
      return counts;
    };

    const left_counts = countDuplicates(sourceDataset);
    const right_counts = countDuplicates(targetDataset);

    const dataDiff: any[] = [];
    const seen = new Set<string>();

    const processArray = (arr: any[]) => {
      (arr || []).forEach((obj: any) => {
        if (!obj.wf_code || !obj.task_name) return;
        const key = `${obj.wf_code.trim()}-${obj.task_name.trim()}`;
        if (!seen.has(key)) {
          dataDiff.push({
            wf_code: obj.wf_code.trim(),
            task_name: obj.task_name.trim(),
            countSource: left_counts[key] || 0,
            countTarget: right_counts[key] || 0,
            countSite1: left_counts[key] || 0,
            countSite2: right_counts[key] || 0,
            raw1: obj,
            raw2: obj
          });
          seen.add(key);
        }
      });
    };

    processArray(sourceDataset);
    processArray(targetDataset);

    return {
      dataDiff,
      versionMismatch: [],
      onlySource: [],
      onlyTarget: [],
      onlySite1: [],
      onlySite2: []
    };
  },
  getColumns: () => {
    return {
      dataDiffColDefs: [
        { field: 'task_name', headerName: 'TASK NAME', flex: 1.5, cellRenderer: (params: any) => renderTrimTooltip(params.value, 40) },
        { field: 'wf_code', headerName: 'WORKFLOW CODE', flex: 1.5, cellRenderer: (params: any) => renderTrimTooltip(params.value, 40) },
        { field: 'countSite1', headerName: 'SOURCE COUNT', flex: 1 },
        { field: 'countSite2', headerName: 'TARGET COUNT', flex: 1 }
      ],
      sourceColDefs: [],
      targetColDefs: [],
      site1ColDefs: [],
      site2ColDefs: []
    };
  }
};

export interface SubTaskMasterProps {
  activeOption?: string;
}

const SubTaskMaster: React.FC<SubTaskMasterProps> = ({ activeOption = 'subtask_master' }) => {
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

export default SubTaskMaster;
