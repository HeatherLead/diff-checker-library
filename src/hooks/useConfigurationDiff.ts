import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import { useDiffChecker } from '../context/DiffCheckerContext';
import { getOptionConfig } from '../config';

export interface UseConfigurationDiffOptions {
  diffTag?: string;
  autoFetch?: boolean;
}

const extractDataset = (container: any, possibleKeys: string[] = []): any[] => {
  if (!container) return [];
  if (Array.isArray(container)) return container;
  if (typeof container === 'object') {
    // 1. Check direct key match
    for (const key of possibleKeys) {
      if (key && Array.isArray(container[key])) {
        return container[key];
      }
    }
    // 2. Find first property that is an Array
    const firstArrayVal = Object.values(container).find(Array.isArray);
    if (Array.isArray(firstArrayVal)) {
      return firstArrayVal as any[];
    }
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
  const [site1Data, setSite1Data] = useState<any[]>([]);
  const [site2Data, setSite2Data] = useState<any[]>([]);
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

    let site1: any[] = [];
    let site2: any[] = [];
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

        setBackendMetadata({
          import_id: payloadData.import_id || null,
          src_name: payloadData.src_name || '',
          src_url: payloadData.src_url || '',
          target_name: payloadData.target_name || '',
          target_url: payloadData.target_url || '',
        });

        const possibleKeys = [
          apiTag,
          diffTag,
          'datatables_config',
          'datatables',
          'data',
          'items',
          'list'
        ];

        // Extract site1 (src_data)
        if (payloadData.src_data !== undefined && payloadData.src_data !== null) {
          site1 = extractDataset(payloadData.src_data, possibleKeys);
        } else {
          site1 = extractDataset(payloadData, possibleKeys);
          if (!site1.length && Array.isArray(payloadData.site1)) {
            site1 = payloadData.site1;
          }
        }

        // Extract site2 (target_data)
        if (payloadData.target_data !== undefined && payloadData.target_data !== null && typeof payloadData.target_data === 'object' && !Array.isArray(payloadData.target_data)) {
          site2 = extractDataset(payloadData.target_data, possibleKeys);
        } else if (Array.isArray(payloadData.target_data)) {
          site2 = payloadData.target_data;
        } else {
          const targetKeys = [
            `${apiTag}_site2`,
            `${diffTag}_site2`,
            'datatables_config_site2',
            'site2',
            ...possibleKeys
          ];
          site2 = extractDataset(payloadData, targetKeys);
          if (!site2.length && Array.isArray(payloadData.site2)) {
            site2 = payloadData.site2;
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

    setSite1Data(site1 || []);
    setSite2Data(site2 || []);
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
  const { dataDiffRows, versionMismatchRows, onlySite1Rows, onlySite2Rows } = useMemo(() => {
    if (!config || typeof config.compare !== 'function') {
      return { dataDiffRows: [], versionMismatchRows: [], onlySite1Rows: [], onlySite2Rows: [] };
    }
    const res = config.compare(site1Data, site2Data) || {};
    return {
      dataDiffRows: res.dataDiffRows || res.dataDiff || [],
      versionMismatchRows: res.versionMismatchRows || res.versionMismatch || [],
      onlySite1Rows: res.onlySite1Rows || res.onlySite1 || [],
      onlySite2Rows: res.onlySite2Rows || res.onlySite2 || [],
    };
  }, [config, site1Data, site2Data]);

  // Generate column definitions
  const columns = useMemo(() => {
    if (!config || typeof config.getColumns !== 'function') {
      return { dataDiffColDefs: [], versionMismatchColDefs: [], site1ColDefs: [], site2ColDefs: [] };
    }
    return config.getColumns({
      openDiffViewer,
      openDataViewer,
      handleSyncConfiguration,
      handleCloneConfiguration,
      showToast,
      baseUrl1,
      baseUrl2,
    });
  }, [config, openDiffViewer, openDataViewer, handleSyncConfiguration, handleCloneConfiguration, showToast, baseUrl1, baseUrl2]);

  return {
    isLoading,
    error,
    site1Data,
    site2Data,
    setSite1Data,
    setSite2Data,
    dataDiffRows,
    versionMismatchRows,
    onlySite1Rows,
    onlySite2Rows,
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
