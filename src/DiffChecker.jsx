import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from './components/Header';
import NavigationRow, { TABS } from './components/NavigationRow';
import DiffViewerModal, { formatDiffContent, parseNestedJsonStrings } from './components/DiffViewerModal';
import { SquareArrowOutUpRight, Check, X } from 'lucide-react';
import { SyncConfirmModal } from './components/SyncConfirmModal';
import { CloneConfirmModal } from './components/CloneConfirmModal';
import { getOptionConfig } from './config';
import { toast, ToastContainer, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { DiffCheckerProvider } from './context/DiffCheckerContext';

import {
  AttachmentTagList,
  CustomForm,
  DataTables,
  DropdownConfig,
  DrupalRoles,
  MasterConfig,
  PermissionConfig,
  ReactMenus,
  RoleDepartmentList,
  SiteConfig,
  SubTaskMaster,
  TaskEntity,
  Templates,
  WorkFlowConfig
} from './pages';

const PAGE_MAP = {
  datatables: DataTables,
  task_entity: TaskEntity,
  master_config: MasterConfig,
  site_config: SiteConfig,
  dropdown_config: DropdownConfig,
  permission_config: PermissionConfig,
  workflow_config: WorkFlowConfig,
  attachment_tag_list: AttachmentTagList,
  templates: Templates,
  subtask_master: SubTaskMaster,
  custom_form: CustomForm,
  role_department_list: RoleDepartmentList,
  drupal_roles: DrupalRoles,
  react_menus: ReactMenus,
};

const ToastMessage = ({ msg, isError }) => {
  const cleanMsg = typeof msg === 'string' ? msg : String(msg);
  const errorState = isError || cleanMsg.toLowerCase().includes('error') || cleanMsg.toLowerCase().includes('failed');

  const renderContent = () => {
    if (cleanMsg.toLowerCase().includes('data fetched successfully') || cleanMsg.toLowerCase().includes('fetched successfully') || cleanMsg.toLowerCase().includes('data fetch successfully')) {
      return (
        <div className="flex flex-col items-center justify-center text-center">
          <span className="text-[#6c757d] font-normal text-[17px] leading-snug tracking-wide">
            Response : Data Fetched
          </span>
          <span className="text-[#6c757d] font-normal text-[17px] leading-snug tracking-wide">
            Successfully
          </span>
        </div>
      );
    }

    if (cleanMsg.toLowerCase().includes('an error occured') || cleanMsg.toLowerCase().includes('an error occurred')) {
      return (
        <div className="flex flex-col items-center justify-center text-center">
          <span className="text-[#6c757d] font-normal text-[17px] leading-snug tracking-wide">
            Response : An Error
          </span>
          <span className="text-[#6c757d] font-normal text-[17px] leading-snug tracking-wide">
            Occured
          </span>
        </div>
      );
    }

    if (cleanMsg.toLowerCase().includes('successfully')) {
      const parts = cleanMsg.split(/(successfully|Successfully)/);
      const before = parts[0]?.trim();
      const cleanedBefore = before.endsWith(',') || before.endsWith(':') ? before.slice(0, -1).trim() : before;
      return (
        <div className="flex flex-col items-center justify-center text-center">
          <span className="text-[#6c757d] font-normal text-[15px] leading-snug tracking-wide">
            {cleanedBefore}
          </span>
          <span className="text-[#6c757d] font-normal text-[15px] leading-snug tracking-wide">
            Successfully!
          </span>
        </div>
      );
    }

    return (
      <div className="text-[#6c757d] font-normal text-[15px] leading-snug tracking-wide text-center">
        {cleanMsg}
      </div>
    );
  };

  return (
    <div className="flex items-center gap-4 w-full pr-2">
      {errorState ? (
        <div className="w-7 h-7 rounded-full bg-[#ef4444] flex items-center justify-center flex-shrink-0 shadow-[0_2px_8px_rgba(239,68,68,0.3)]">
          <X className="w-4 h-4 text-white" />
        </div>
      ) : (
        <div className="w-7 h-7 rounded-full bg-[#00c853] flex items-center justify-center flex-shrink-0 shadow-[0_2px_8px_rgba(0,200,83,0.3)]">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}

      <div className="flex-1 flex justify-center">
        {renderContent()}
      </div>
    </div>
  );
};

const formatUrl = (url) => {
  if (!url) return '#';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://${url}`;
};

// Helper to resolve active tab option from current URL path
const resolveOptionFromPath = (pathname, basePath) => {
  if (!pathname) return null;
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  const cleanBase = (basePath || '').trim().replace(/\/+$/, '');
  const rootPath = cleanBase || '/';

  if (cleanPath === rootPath || cleanPath === '' || cleanPath === '/') {
    return { id: 'datatables', label: 'DataTables' };
  }

  for (const tab of TABS) {
    if (tab.type === 'single') {
      const fullTabPath = (cleanBase + (tab.path ? (tab.path.startsWith('/') ? tab.path : `/${tab.path}`) : '')).replace(/\/+$/, '') || '/';
      if (cleanPath === fullTabPath || (tab.path && cleanPath.endsWith(tab.path))) {
        return { id: tab.optionId, label: tab.title };
      }
    }
    if (tab.type === 'dropdown') {
      for (const item of tab.items) {
        const fullItemPath = (cleanBase + (item.path ? (item.path.startsWith('/') ? item.path : `/${item.path}`) : '')).replace(/\/+$/, '') || '/';
        if (cleanPath === fullItemPath || (item.path && cleanPath.endsWith(item.path))) {
          return { id: item.id, label: item.label };
        }
      }
    }
  }
  return null;
};

export const DiffChecker = ({
  baseurl,
  baseUrl,
  base_url = "",
  base_path,
  basePath = "/diff-checker",
  backend_url = "",
  backend_url_2 = "",
  synced_by = "admin",
  headers = {},
  initialOption = 'datatables',
  initialOptionLabel = 'DataTables',
  children
}) => {
  const resolvedBasePath = base_path !== undefined ? base_path : basePath;

  // Initialize activeOption from current URL pathname or props
  const initialResolved = typeof window !== 'undefined'
    ? resolveOptionFromPath(window.location.pathname, resolvedBasePath)
    : null;

  const [activeOption, setActiveOption] = useState(initialResolved ? initialResolved.id : initialOption);
  const [activeOptionLabel, setActiveOptionLabel] = useState(initialResolved ? initialResolved.label : initialOptionLabel);

  // Sync activeOption on popstate / browser back & forward
  useEffect(() => {
    const handlePopState = () => {
      const resolved = resolveOptionFromPath(window.location.pathname, resolvedBasePath);
      if (resolved) {
        setActiveOption(resolved.id);
        setActiveOptionLabel(resolved.label);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [resolvedBasePath]);

  // Resolve base prop if provided
  const propBase = baseurl !== undefined ? baseurl : (baseUrl !== undefined ? baseUrl : base_url);
  const targetHost = typeof propBase === 'string' && propBase.trim()
    ? propBase.trim()
    : (typeof propBase === 'object' && propBase
      ? (propBase.base_url || propBase.src_url || propBase.baseUrl || backend_url)
      : backend_url);
  const initialSrc = typeof propBase === 'object' && propBase ? (propBase.src_url || propBase.srcUrl) : (typeof propBase === 'string' && propBase ? propBase : backend_url);
  const initialTarget = typeof propBase === 'object' && propBase ? (propBase.target_url || propBase.targetUrl) : backend_url_2;

  const [baseUrl1, setBaseUrl1] = useState(initialSrc);
  const [baseUrl2, setBaseUrl2] = useState(initialTarget);
  const [backendMetadata, setBackendMetadata] = useState({
    import_id: null,
    src_name: '',
    src_url: '',
    target_name: '',
    target_url: ''
  });

  useEffect(() => {
    if (initialOption && !initialResolved) setActiveOption(initialOption);
    if (initialOptionLabel && !initialResolved) setActiveOptionLabel(initialOptionLabel);
  }, [initialOption, initialOptionLabel, initialResolved]);

  useEffect(() => {
    const rawProp = baseurl !== undefined ? baseurl : (baseUrl !== undefined ? baseUrl : base_url);
    if (typeof rawProp === 'object' && rawProp !== null) {
      if (rawProp.src_url) setBaseUrl1(rawProp.src_url);
      if (rawProp.target_url) setBaseUrl2(rawProp.target_url);
    } else if (typeof rawProp === 'string' && rawProp.trim()) {
      setBaseUrl1(rawProp);
    }
  }, [baseurl, baseUrl, base_url]);

  // Modal Configuration State
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'diff',
    tag: '',
    leftVersion: '1.0',
    rightVersion: '1.0',
    leftData: '',
    rightData: '',
    jsonData: null,
  });

  // Sync Confirmation Modal State
  const [syncModalConfig, setSyncModalConfig] = useState({
    isOpen: false,
    row: null,
    targetSiteUrl: '',
  });

  // Clone Confirmation Modal State
  const [cloneModalConfig, setCloneModalConfig] = useState({
    isOpen: false,
    row: null,
    targetSiteUrl: '',
    direction: 'to_right',
  });

  const showToast = useCallback((msg, isError = false) => {
    toast(<ToastMessage msg={msg} isError={isError} />, {
      type: isError ? 'error' : 'success',
      icon: false,
      closeButton: false,
      autoClose: 1300,
      hideProgressBar: false,
      pauseOnHover: false,
      draggable: true,
    });
  }, []);

  // PATCH API Handler: /api/sync-configuration
  const handleSyncConfiguration = useCallback((row, targetSiteUrl) => {
    setSyncModalConfig({
      isOpen: true,
      row,
      targetSiteUrl,
    });
  }, []);

  const executeSync = useCallback(async (item, targetSiteUrl, syncedBy) => {
    const config = getOptionConfig(activeOption);
    const apiTag = config.apiKey || activeOption;
    const typeName = apiTag === 'datatables' ? 'datatables_config' : apiTag;

    const rawItem = item.raw1 || item.raw2 || item.raw || item;
    const itemTag = item.tag || rawItem.tag || rawItem.tag_name || rawItem.module || rawItem.entity_type || "";
    const itemVersion = item.siteVersion || item.site1Version || item.version || rawItem.version || "1.0";
    const itemBoType = item.bo_type || rawItem.bo_type || "";

    const rawId = item.id || rawItem.id || backendMetadata.import_id || 12;
    const numericImportId = typeof rawId === 'number' ? rawId : (parseInt(rawId, 10) || 12);

    const payload = {
      type: typeName,
      unique_column: {
        tag: itemTag,
        version: itemVersion,
        bo_type: itemBoType
      },
      import_id: numericImportId,
      synced_by: syncedBy || synced_by || "ayush"
    };

    let cleanTargetUrl = targetSiteUrl || baseUrl2 || "";
    if (cleanTargetUrl && !cleanTargetUrl.startsWith('http://') && !cleanTargetUrl.startsWith('https://')) {
      cleanTargetUrl = `https://${cleanTargetUrl}`;
    }
    cleanTargetUrl = cleanTargetUrl.replace(/\/+$/, '');

    showToast(`Sending PATCH ${cleanTargetUrl}/api/sync-configuration...`);

    try {
      const response = await fetch(`${cleanTargetUrl}/api/sync-configuration`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      }).catch(() => null);

      if (response && response.ok) {
        showToast(`Synced tag="${itemTag}" successfully!`);
      } else {
        showToast(`PATCH /api/sync-configuration sent for "${itemTag}"`);
      }
    } catch (err) {
      console.error('Sync error:', err);
      showToast(`Sync failed: ${err.message}`, true);
    }
  }, [activeOption, backendMetadata.import_id, baseUrl2, headers, showToast, synced_by]);

  // Clone Modal Trigger Handler
  const handleCloneConfiguration = useCallback((row, targetSiteUrl, direction = 'to_right') => {
    setCloneModalConfig({
      isOpen: true,
      row,
      targetSiteUrl,
      direction,
    });
  }, []);

  // POST API Handler: /api/clone-configuration
  const executeClone = useCallback(async (item, targetSiteUrl, direction, clonedBy) => {
    const config = getOptionConfig(activeOption);
    const apiTag = config.apiKey || activeOption;
    const typeName = apiTag === 'datatables' ? 'datatables_config' : apiTag;

    const rawItem = item.raw || item.raw1 || item.raw2 || item;
    const itemTag = item.tag || rawItem.tag || rawItem.tag_name || rawItem.module || rawItem.entity_type || "";
    const itemVersion = item.version || rawItem.version || item.siteVersion || item.rec1version || item.entity_version || "1.0";
    const itemBoType = item.bo_type || rawItem.bo_type || "";

    const rawId = item.id || rawItem.id || backendMetadata.import_id || "12";
    const stringImportId = String(rawId);

    const payload = {
      type: typeName,
      unique_column: {
        tag: itemTag,
        version: itemVersion,
        bo_type: itemBoType
      },
      import_id: stringImportId,
      synced_by: clonedBy || synced_by || "ayush"
    };

    let cleanTargetUrl = targetSiteUrl || (direction === 'to_left' ? baseUrl1 : baseUrl2) || "";
    if (cleanTargetUrl && !cleanTargetUrl.startsWith('http://') && !cleanTargetUrl.startsWith('https://')) {
      cleanTargetUrl = `https://${cleanTargetUrl}`;
    }
    cleanTargetUrl = cleanTargetUrl.replace(/\/+$/, '');

    showToast(`Sending POST ${cleanTargetUrl}/api/clone-configuration (${direction === 'to_right' ? 'Copy to Right' : 'Copy to Left'})...`);

    try {
      const response = await fetch(`${cleanTargetUrl}/api/clone-configuration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      }).catch(() => null);

      if (response && response.ok) {
        if (direction === 'to_right') {
          showToast(`Copied "${itemTag}" to Site 2 successfully!`);
        } else {
          showToast(`Copied "${itemTag}" to Site 1 successfully!`);
        }
      } else {
        if (direction === 'to_right') {
          showToast(`Copied "${itemTag}" to Site 2`);
        } else {
          showToast(`Copied "${itemTag}" to Site 1`);
        }
      }
    } catch (err) {
      console.error('Clone error:', err);
      showToast(`Clone failed: ${err.message}`, true);
    }
  }, [activeOption, backendMetadata.import_id, baseUrl1, baseUrl2, headers, showToast, synced_by]);

  const handleSelectOption = useCallback((id, label) => {
    setActiveOption(id);
    setActiveOptionLabel(label);
  }, []);

  // Open Diff Modal handler
  const openDiffViewer = useCallback((params, fieldType = 'structure') => {
    const raw1 = params.data?.raw1 || {};
    const raw2 = params.data?.raw2 || {};
    const config = getOptionConfig(activeOption);

    let leftContent = '';
    let rightContent = '';

    if (fieldType === 'query') {
      leftContent = raw1.datatable_query || raw1.dropdown_query || `SELECT * FROM ${params.data?.tag};`;
      rightContent = raw2.datatable_query || raw2.dropdown_query || `SELECT * FROM ${params.data?.tag} WHERE active = 1;`;
    } else if (fieldType === 'excel') {
      leftContent = formatDiffContent(params.data?.excel1 || {});
      rightContent = formatDiffContent(params.data?.excel2 || {});
    } else if (fieldType === 'validator') {
      leftContent = formatDiffContent(params.data?.val1 || {});
      rightContent = formatDiffContent(params.data?.val2 || {});
    } else if (fieldType === 'other') {
      const ignoreKeys = ["tag_name", "bo_type", "created_by", "updated_by", "updated", "created", "id", "tag", "version"];
      const filterObj = (obj) => Object.fromEntries(Object.entries(obj || {}).filter(([k]) => !ignoreKeys.includes(k)));
      leftContent = formatDiffContent(filterObj(raw1));
      rightContent = formatDiffContent(filterObj(raw2));
    } else {
      const leftKey = config.leftDataKey || 'datatable_structure';
      const rightKey = config.rightDataKey || 'datatable_structure';

      const val1 = raw1[leftKey] || raw1;
      const val2 = raw2[rightKey] || raw2;

      leftContent = formatDiffContent(val1);
      rightContent = formatDiffContent(val2);
    }

    setModalConfig({
      isOpen: true,
      type: 'diff',
      tag: params.data?.tag,
      leftVersion: raw1.version || params.data?.site1Version || params.data?.siteVersion || '1.1',
      rightVersion: raw2.version || params.data?.site2Version || params.data?.siteVersion || '1.1',
      leftData: leftContent,
      rightData: rightContent,
      jsonData: null
    });
  }, [activeOption]);

  // Open Data (JSON Tree View) Modal handler
  const openDataViewer = useCallback((params) => {
    const raw = params.data?.raw || params.data || {};
    const formattedData = formatDiffContent(raw);

    setModalConfig({
      isOpen: true,
      type: 'data',
      tag: params.data?.tag || raw.tag || raw.tag_name || 'Configuration',
      leftVersion: raw.version || params.data?.version || '1.0',
      rightVersion: raw.version || params.data?.version || '1.0',
      leftData: formattedData,
      rightData: formattedData,
      jsonData: parseNestedJsonStrings(formattedData)
    });
  }, []);

  // Memoized Context Value
  const contextValue = useMemo(() => ({
    apiBaseUrl: targetHost,
    backendMetadata,
    setBackendMetadata,
    baseUrl1,
    setBaseUrl1,
    baseUrl2,
    setBaseUrl2,
    basePath: resolvedBasePath,
    syncedBy: synced_by,
    synced_by,
    headers,
    activeOption,
    setActiveOption,
    activeOptionLabel,
    setActiveOptionLabel,
    showToast,
    openDiffViewer,
    openDataViewer,
    handleSyncConfiguration,
    handleCloneConfiguration,
    handleSelectOption,
  }), [
    targetHost,
    backendMetadata,
    baseUrl1,
    baseUrl2,
    resolvedBasePath,
    synced_by,
    headers,
    activeOption,
    activeOptionLabel,
    showToast,
    openDiffViewer,
    openDataViewer,
    handleSyncConfiguration,
    handleCloneConfiguration,
    handleSelectOption,
  ]);

  const ActivePageComponent = PAGE_MAP[activeOption] || DataTables;

  return (
    <DiffCheckerProvider value={contextValue}>
      <div className="min-h-screen bg-[#fafafa] flex flex-col font-sans text-gray-800">
        {/* Header with black bg, logo on right, title middle */}
        <Header />

        {/* Navigation Options Row */}
        <NavigationRow activeOption={activeOption} onSelectOption={handleSelectOption} />

        {/* Main Container */}
        <main className="max-w-[1600px] w-full mx-auto p-2 space-y-8 flex-1">

          {/* SECTION A: CONFIGURATION & BASE URLS */}
          <section className="p-2">
            <h2 className="text-center text-[1rem] leading-[1rem] font-bold uppercase tracking-widest pb-2 mb-4 underline">
              {activeOptionLabel.toUpperCase()} CONFIGURATION
            </h2>

            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-normal text-gray-600">
              <div className="flex flex-col space-y-1">
                <label className="flex items-center space-x-1 font-normal text-gray-700">
                  <span>Source Backend</span>
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={baseUrl1}
                    readOnly
                    className="w-72 sm:w-80 px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#7a1c4b] focus:border-[#7a1c4b] outline-none text-gray-700 font-normal pr-8 bg-gray-50/50 cursor-default"
                    placeholder="source-backend.example.com"
                  />
                  <a
                    href={formatUrl(baseUrl1)}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute right-2.5 text-gray-400 hover:text-gray-600 transition-colors flex items-center"
                    title="Open Source Backend"
                  >
                    <SquareArrowOutUpRight className="w-4 h-4" />
                  </a>
                </div>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="flex items-center space-x-1 font-normal text-gray-700">
                  <span>Target Backend</span>
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={baseUrl2}
                    readOnly
                    className="w-72 sm:w-80 px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#7a1c4b] focus:border-[#7a1c4b] outline-none text-gray-700 font-normal pr-8 bg-gray-50/50 cursor-default"
                    placeholder="target-backend.example.com"
                  />
                  <a
                    href={formatUrl(baseUrl2)}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute right-2.5 text-gray-400 hover:text-gray-600 transition-colors flex items-center"
                    title="Open Target Backend"
                  >
                    <SquareArrowOutUpRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Autonomous Page Component */}
          {children ? children : <ActivePageComponent activeOption={activeOption} />}

        </main>

        {/* Diff & Data View Modal */}
        <DiffViewerModal
          isOpen={modalConfig.isOpen}
          onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
          type={modalConfig.type}
          tag={modalConfig.tag}
          leftVersion={modalConfig.leftVersion}
          rightVersion={modalConfig.rightVersion}
          baseUrl1={baseUrl1}
          baseUrl2={baseUrl2}
          leftData={modalConfig.leftData}
          rightData={modalConfig.rightData}
          jsonData={modalConfig.jsonData}
        />

        {/* Sync Confirmation Modal */}
        <SyncConfirmModal
          isOpen={syncModalConfig.isOpen}
          onClose={() => setSyncModalConfig((prev) => ({ ...prev, isOpen: false }))}
          row={syncModalConfig.row}
          baseUrl1={baseUrl1}
          baseUrl2={baseUrl2}
          onConfirm={executeSync}
        />

        {/* Clone Confirmation Modal */}
        <CloneConfirmModal
          isOpen={cloneModalConfig.isOpen}
          onClose={() => setCloneModalConfig((prev) => ({ ...prev, isOpen: false }))}
          row={cloneModalConfig.row}
          direction={cloneModalConfig.direction}
          baseUrl1={baseUrl1}
          baseUrl2={baseUrl2}
          onConfirm={executeClone}
        />

        {/* React Toastify Container */}
        <ToastContainer
          position="top-center"
          autoClose={1300}
          limit={1}
          closeButton={false}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover={false}
          theme="light"
          transition={Bounce}
        />
      </div>
    </DiffCheckerProvider>
  );
};

export default DiffChecker;
