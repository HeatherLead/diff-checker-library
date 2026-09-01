import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import { useDiffChecker } from '../context/DiffCheckerContext';
import { getOptionConfig } from '../config';

export interface UseConfigurationDiffOptions {
  diffTag?: string;
  autoFetch?: boolean;
}

const extractDataset = (container: any, possibleKeys: string[] = []): any => {
  if (!container) return [];
  if (Array.isArray(container)) return container;
  if (typeof container === 'object') {
    // 1. Check direct key match in possibleKeys
    for (const key of possibleKeys) {
      if (key && container[key] !== undefined && container[key] !== null) {
        return container[key];
      }
    }
    // 2. Find first property that is an Array
    const firstArrayVal = Object.values(container).find(Array.isArray);
    if (Array.isArray(firstArrayVal)) {
      return firstArrayVal;
    }
    // 3. Container itself is the dataset dictionary/object
    return container;
  }
  return [];
};

export function useConfigurationDiff(diffTag: string, options: { autoFetch?: boolean } = {}) {
  const { autoFetch = true } = options;

  const ctx = useDiffChecker();
  const apiBaseUrl = (ctx.apiBaseUrl || ctx.baseUrl1 || "").trim();
  const baseUrl1 = ctx.baseUrl1 || "";
  const baseUrl2 = ctx.baseUrl2 || "";
  const csrfToken = ctx.csrf_token || "";
  const headers = ctx.headers || {};
  const setBaseUrl1 = ctx.setBaseUrl1 || (() => { });
  const setBaseUrl2 = ctx.setBaseUrl2 || (() => { });
  const setBackendMetadata = ctx.setBackendMetadata || (() => { });
  const openDiffViewer = ctx.openDiffViewer || (() => { });
  const openDataViewer = ctx.openDataViewer || (() => { });
  const handleSyncConfiguration = ctx.handleSyncConfiguration || (() => { });
  const handleCloneConfiguration = ctx.handleCloneConfiguration || (() => { });
  const showToast = ctx.showToast || (() => { });

  const [isLoading, setIsLoading] = useState(false);
  const [sourceData, setSourceData] = useState<any>([]);
  const [targetData, setTargetData] = useState<any>([]);
  const [error, setError] = useState<any>(null);

  const lastFetchedKeyRef = useRef<string | null>(null);

  const config = useMemo(() => getOptionConfig(diffTag), [diffTag]);

  // Resolve API tag
  const apiTag = useMemo(() => {
    if (diffTag === 'datatables' || diffTag === 'datatables_config' || !diffTag) {
      return 'datatables_config';
    }
    return (config && config.apiKey && config.apiKey !== 'datatables') ? config.apiKey : diffTag;
  }, [diffTag, config]);

  const fetchData = useCallback(async (force = false) => {
    if (!apiBaseUrl) {
      return;
    }

    if (!force && lastFetchedKeyRef.current === apiTag) {
      return;
    }
    lastFetchedKeyRef.current = apiTag;

    setIsLoading(true);
    setError(null);

    let cleanBaseUrl = apiBaseUrl;

    if (!cleanBaseUrl.startsWith('http://') && !cleanBaseUrl.startsWith('https://')) {
      cleanBaseUrl = `https://${cleanBaseUrl}`;
    }
    cleanBaseUrl = cleanBaseUrl.replace(/\/+$/, '');

    const getUrl = `${cleanBaseUrl}/api/get-configuration?diff_tag=${encodeURIComponent(apiTag)}`;

    let result: any = null;
    let fetchError = false;

    try {
      const reqHeaders: Record<string, string> = {
        'Accept': 'application/json',
        ...headers,
      };
      if (csrfToken && !reqHeaders['x-csrf-token']) {
        reqHeaders['x-csrf-token'] = csrfToken;
      }

      const response = await axios.get(getUrl, {
        headers: reqHeaders,
        withCredentials: true,
      });

      result = response.data;
    } catch (err: any) {
      console.warn(`[useConfigurationDiff] Failed to fetch from API ${getUrl}:`, err);
      fetchError = true;
      setError(err);
      if (err?.response?.data) {
        result = err.response.data;
      }
    }

    let sourceDataset: any = [];
    let targetDataset: any = [];
    let isErrorState = false;

    try {
      if (result && (result.status_code === 1 || result.status === 'success' || result.data) && result.data) {
        const payloadData = result.data;

        if (payloadData.src_url) {
          setBaseUrl1((prev: string) => prev !== payloadData.src_url ? payloadData.src_url : prev);
        }
        if (payloadData.target_url) {
          setBaseUrl2((prev: string) => prev !== payloadData.target_url ? payloadData.target_url : prev);
        }

        const extractedImportId = payloadData.import_id ?? result.import_id ?? payloadData.data?.import_id ?? null;

        setBackendMetadata((prev: any) => ({
          ...prev,
          import_id: extractedImportId ?? prev?.import_id ?? null,
          src_name: payloadData.src_name || result.src_name || prev?.src_name || '',
          src_url: payloadData.src_url || result.src_url || prev?.src_url || '',
          target_name: payloadData.target_name || result.target_name || prev?.target_name || '',
          target_url: payloadData.target_url || result.target_url || prev?.target_url || '',
        }));

        const possibleKeys = [
          apiTag,
          diffTag,
          'configurations',
          'master_config',
          'site_config',
          'drupal_roles',
          'drupalMenues_react-menu',
          'react_menus',
          'role_department_list',
          'dropdown',
          'dropdown_config',
          'permissions',
          'permission_config',
          'workflow',
          'workflow_config',
          'bo_attachment_tagging',
          'attachment_tag_list',
          'input_file_tagging',
          'templates',
          'subtask_master',
          'custom_form',
          'entity_forms',
          'task_entity',
          'datatables_config',
          'datatables',
          'data',
          'items',
          'list'
        ];

        // Extract source (src_data)
        if (payloadData.src_data !== undefined && payloadData.src_data !== null) {
          sourceDataset = extractDataset(payloadData.src_data, possibleKeys);
        } else {
          sourceDataset = extractDataset(payloadData, possibleKeys);
          if ((!sourceDataset || (Array.isArray(sourceDataset) && !sourceDataset.length)) && Array.isArray(payloadData.site1)) {
            sourceDataset = payloadData.site1;
          }
        }

        // Extract target (target_data)
        if (payloadData.target_data !== undefined && payloadData.target_data !== null) {
          targetDataset = extractDataset(payloadData.target_data, possibleKeys);
        } else {
          const targetKeys = [
            `${apiTag}_site2`,
            `${diffTag}_site2`,
            `${apiTag}_target`,
            `${diffTag}_target`,
            'datatables_config_site2',
            'site2',
            'target',
            ...possibleKeys
          ];
          targetDataset = extractDataset(payloadData, targetKeys);
          if ((!targetDataset || (Array.isArray(targetDataset) && !targetDataset.length)) && Array.isArray(payloadData.site2)) {
            targetDataset = payloadData.site2;
          }
        }
      } else {
        if (fetchError || !result) {
          isErrorState = true;
        }
      }
    } catch (err) {
      console.error('Error processing dataset:', err);
      isErrorState = true;
      setError(err);
    }

    setSourceData(sourceDataset ?? []);
    setTargetData(targetDataset ?? []);
    setIsLoading(false);

    if (isErrorState) {
      showToast(result?.message || 'An error occured', true);
    }
  }, [apiBaseUrl, apiTag, csrfToken, diffTag, headers, setBaseUrl1, setBaseUrl2, setBackendMetadata, showToast]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [apiTag, autoFetch, fetchData]);

  // Compute dataset diffs
  const { dataDiffRows, versionMismatchRows, onlySourceRows, onlyTargetRows } = useMemo(() => {
    if (!config || typeof config.compare !== 'function') {
      return { dataDiffRows: [], versionMismatchRows: [], onlySourceRows: [], onlyTargetRows: [] };
    }
    const res = config.compare(sourceData, targetData) || {};
    const srcRows = res.onlySourceRows || res.onlySource || res.onlySite1Rows || res.onlySite1 || [];
    const tgtRows = res.onlyTargetRows || res.onlyTarget || res.onlySite2Rows || res.onlySite2 || [];
    return {
      dataDiffRows: res.dataDiffRows || res.dataDiff || [],
      versionMismatchRows: res.versionMismatchRows || res.versionMismatch || [],
      onlySourceRows: srcRows,
      onlyTargetRows: tgtRows,
      nonMatchRows: res.nonMatchRows || res.nonMatch || srcRows,
    };
  }, [config, sourceData, targetData]);

  // Generate column definitions
  const columns = useMemo(() => {
    if (!config || typeof config.getColumns !== 'function') {
      return { dataDiffColDefs: [], versionMismatchColDefs: [], sourceColDefs: [], targetColDefs: [], site1ColDefs: [], site2ColDefs: [], nonMatchColDefs: [] };
    }
    const rawCols = config.getColumns({
      openDiffViewer,
      openDataViewer,
      handleSyncConfiguration,
      handleCloneConfiguration,
      showToast,
      baseUrl1,
      baseUrl2,
    }) || {};

    const sourceColDefs = rawCols.sourceColDefs || rawCols.site1ColDefs || [];
    const targetColDefs = rawCols.targetColDefs || rawCols.site2ColDefs || [];
    const nonMatchColDefs = rawCols.nonMatchColDefs || sourceColDefs;

    return {
      ...rawCols,
      sourceColDefs,
      targetColDefs,
      site1ColDefs: sourceColDefs,
      site2ColDefs: targetColDefs,
      nonMatchColDefs,
    };
  }, [config, openDiffViewer, openDataViewer, handleSyncConfiguration, handleCloneConfiguration, showToast, baseUrl1, baseUrl2]);

  return {
    isLoading,
    error,
    sourceData,
    targetData,
    site1Data: sourceData,
    site2Data: targetData,
    setSourceData,
    setTargetData,
    setSite1Data: setSourceData,
    setSite2Data: setTargetData,
    dataDiffRows,
    versionMismatchRows,
    onlySourceRows,
    onlyTargetRows,
    onlySite1Rows: onlySourceRows,
    onlySite2Rows: onlyTargetRows,
    nonMatchRows: onlySourceRows,
    columns,
    refetch: () => fetchData(true),
    config,
    baseUrl1,
    baseUrl2,
    openDiffViewer,
    openDataViewer,
    handleSyncConfiguration,
    handleCloneConfiguration,
    showToast,
  };
}

export default useConfigurationDiff;
