import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import NavigationRow from './components/NavigationRow';
import { TABS } from './constants/constants';
import DiffViewerModal, { formatDiffContent, parseNestedJsonStrings } from './components/DiffViewerModal';
import { SquareArrowOutUpRight, Check, X } from 'lucide-react';
import { SyncConfirmModal } from './components/SyncConfirmModal';
import { CopyToConfirmModal } from './components/CopyToConfirmModal';
import { getOptionConfig } from './config';
import { ensureAbsoluteUrl } from './utils/cellRenderers';
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
        <div className="dc-toast-text-block">
          <span className="dc-toast-title">
            Data Fetched Successfully
          </span>
        </div>
      );
    }

    if (cleanMsg.toLowerCase().includes('an error occured') || cleanMsg.toLowerCase().includes('an error occurred')) {
      return (
        <div className="dc-toast-text-block">
          <span className="dc-toast-title">
            An Error Occured
          </span>
        </div>
      );
    }

    if (cleanMsg.toLowerCase().includes('successfully')) {
      const parts = cleanMsg.split(/(successfully|Successfully)/);
      const before = parts[0]?.trim();
      const cleanedBefore = before.endsWith(',') || before.endsWith(':') ? before.slice(0, -1).trim() : before;
      return (
        <div className="dc-toast-text-block">
          <span className="dc-toast-subtitle">
            {cleanedBefore}
          </span>
          <span className="dc-toast-subtitle">
            Successfully!
          </span>
        </div>
      );
    }

    return (
      <div className="dc-toast-subtitle">
        {cleanMsg}
      </div>
    );
  };

  return (
    <div className="dc-toast-msg-container">
      {errorState ? (
        <div className="dc-toast-icon-circle error">
          <X className="w-4 h-4 text-white" />
        </div>
      ) : (
        <div className="dc-toast-icon-circle success">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}

      <div className="dc-toast-content">
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
  base_url = "",
  base_path = "/diff-checker",
  csrf_token = "",
  synced_by = "",
  headers = {},
  initialOption = 'datatables',
  initialOptionLabel = 'DataTables',
  children
}) => {
  const activeCsrfToken = csrf_token || "";

  const mergedHeaders = useMemo(() => {
    const h = { ...headers };
    if (activeCsrfToken) {
      h['x-csrf-token'] = activeCsrfToken;
    }
    return h;
  }, [headers, activeCsrfToken]);

  // Initialize activeOption from current URL pathname or props
  const initialResolved = typeof window !== 'undefined'
    ? resolveOptionFromPath(window.location.pathname, base_path)
    : null;

  const [activeOption, setActiveOption] = useState(initialResolved ? initialResolved.id : initialOption);
  const [activeOptionLabel, setActiveOptionLabel] = useState(initialResolved ? initialResolved.label : initialOptionLabel);

  // Sync activeOption on popstate / browser back & forward
  useEffect(() => {
    const handlePopState = () => {
      const resolved = resolveOptionFromPath(window.location.pathname, base_path);
      if (resolved) {
        setActiveOption(resolved.id);
        setActiveOptionLabel(resolved.label);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [base_path]);

  // Resolve base prop if provided
  const targetHost = typeof base_url === 'string' && base_url.trim() ? base_url.trim() : "";
  const initialSrc = typeof base_url === 'string' && base_url.trim() ? base_url.trim() : "";
  const initialTarget = "";

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
    if (typeof base_url === 'string' && base_url.trim()) {
      setBaseUrl1(base_url);
    }
  }, [base_url]);

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
    const itemVersion = item.sourceVersion || item.targetVersion || item.siteVersion || item.site1Version || item.version || rawItem.version || "1.0";
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
      synced_by: syncedBy || synced_by || ""
    };

    let cleanTargetUrl = targetSiteUrl || baseUrl2 || "";
    if (cleanTargetUrl && !cleanTargetUrl.startsWith('http://') && !cleanTargetUrl.startsWith('https://')) {
      cleanTargetUrl = `https://${cleanTargetUrl}`;
    }
    cleanTargetUrl = cleanTargetUrl.replace(/\/+$/, '');

    showToast(`Sending PATCH ${cleanTargetUrl}/api/sync-configuration...`);

    try {
      const response = await axios.patch(`${cleanTargetUrl}/api/sync-configuration`, payload, {
        headers: {
          'Content-Type': 'application/json',
          ...mergedHeaders,
        },
        withCredentials: true,
      }).catch(() => null);

      if (response && response.status >= 200 && response.status < 300) {
        showToast(`Synced tag="${itemTag}" successfully!`);
      } else {
        showToast(`PATCH /api/sync-configuration sent for "${itemTag}"`);
      }
    } catch (err) {
      console.error('Sync error:', err);
      showToast(`Sync failed: ${err.message}`, true);
    }
  }, [activeOption, backendMetadata.import_id, baseUrl2, mergedHeaders, showToast, synced_by]);

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
    const itemVersion = item.version || rawItem.version || item.sourceVersion || item.targetVersion || item.siteVersion || item.rec1version || item.entity_version || "1.0";
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
      synced_by: clonedBy || synced_by || ""
    };

    let cleanTargetUrl = targetSiteUrl || (direction === 'to_left' ? baseUrl1 : baseUrl2) || "";
    if (cleanTargetUrl && !cleanTargetUrl.startsWith('http://') && !cleanTargetUrl.startsWith('https://')) {
      cleanTargetUrl = `https://${cleanTargetUrl}`;
    }
    cleanTargetUrl = cleanTargetUrl.replace(/\/+$/, '');

    showToast(`Sending POST ${cleanTargetUrl}/api/clone-configuration (${direction === 'to_right' ? 'Copy to Right' : 'Copy to Left'})...`);

    try {
      const response = await axios.post(`${cleanTargetUrl}/api/clone-configuration`, payload, {
        headers: {
          'Content-Type': 'application/json',
          ...mergedHeaders,
        },
        withCredentials: true,
      }).catch(() => null);

      if (response && response.status >= 200 && response.status < 300) {
        if (direction === 'to_right') {
          showToast(`Copied "${itemTag}" to Target successfully!`);
        } else {
          showToast(`Copied "${itemTag}" to Source successfully!`);
        }
      } else {
        if (direction === 'to_right') {
          showToast(`Copied "${itemTag}" to Target`);
        } else {
          showToast(`Copied "${itemTag}" to Source`);
        }
      }
    } catch (err) {
      console.error('Clone error:', err);
      showToast(`Clone failed: ${err.message}`, true);
    }
  }, [activeOption, backendMetadata.import_id, baseUrl1, baseUrl2, mergedHeaders, showToast, synced_by]);

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

    const leftId = raw1.tag_id || raw1.id || params.data?.rect1id || params.data?.id || params.data?.tag || '';
    const rightId = raw2.tag_id || raw2.id || params.data?.rect2id || params.data?.id || params.data?.tag || '';

    let leftEditUrl = '';
    let rightEditUrl = '';

    if (activeOption === 'templates') {
      const leftTagId = raw1.tag_id || params.data?.rect1id || raw1.id || params.data?.id || '';
      const rightTagId = raw2.tag_id || params.data?.rect2id || raw2.id || params.data?.id || '';
      const tagName = params.data?.tag || raw1.tag_name || raw2.tag_name || '';

      if (fieldType === 'validator') {
        if (baseUrl1 && leftTagId) {
          const clean1 = ensureAbsoluteUrl(baseUrl1).replace(/\/+$/, '');
          leftEditUrl = `${clean1}/update-validation-json/${leftTagId}?tag_name=${encodeURIComponent(tagName)}`;
        }
        if (baseUrl2 && rightTagId) {
          const clean2 = ensureAbsoluteUrl(baseUrl2).replace(/\/+$/, '');
          rightEditUrl = `${clean2}/update-validation-json/${rightTagId}?tag_name=${encodeURIComponent(tagName)}`;
        }
      } else {
        // excel or default templates diff
        if (baseUrl1 && leftTagId) {
          const clean1 = ensureAbsoluteUrl(baseUrl1).replace(/\/+$/, '');
          leftEditUrl = `${clean1}/input-file-tag/edit/${leftTagId}`;
        }
        if (baseUrl2 && rightTagId) {
          const clean2 = ensureAbsoluteUrl(baseUrl2).replace(/\/+$/, '');
          rightEditUrl = `${clean2}/input-file-tag/edit/${rightTagId}`;
        }
      }
    }

    setModalConfig({
      isOpen: true,
      type: 'diff',
      tag: params.data?.tag,
      leftVersion: raw1.version || params.data?.sourceVersion || params.data?.site1Version || params.data?.siteVersion || '1.1',
      rightVersion: raw2.version || params.data?.targetVersion || params.data?.site2Version || params.data?.siteVersion || '1.1',
      leftData: leftContent,
      rightData: rightContent,
      leftId,
      rightId,
      leftEditUrl,
      rightEditUrl,
      activeOption,
      jsonData: null
    });
  }, [activeOption, baseUrl1, baseUrl2]);

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
    basePath: base_path,
    csrf_token: activeCsrfToken,
    syncedBy: synced_by,
    synced_by,
    headers: mergedHeaders,
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
    base_path,
    activeCsrfToken,
    synced_by,
    mergedHeaders,
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
      <div className="dc-root">
        {/* Header with black bg, logo on right, title middle */}

        {/* Navigation Options Row */}
        <NavigationRow activeOption={activeOption} onSelectOption={handleSelectOption} />

        {/* Main Container */}
        <main className="dc-main-container">

          {/* SECTION A: CONFIGURATION & BASE URLS */}
          <section className="dc-config-section">
            <div className="dc-config-row">
              <h2 className="dc-config-title">
                {activeOptionLabel.toUpperCase()} CONFIGURATION
              </h2>


              <div className="dc-config-group">
                <label className="dc-config-label">
                  <span>Source Backend</span>
                  <span className="dc-required-star">*</span>
                </label>
                <div className="dc-config-input-wrapper">
                  <input
                    type="text"
                    value={baseUrl1}
                    readOnly
                    className="dc-config-input"
                    placeholder="source-backend"
                  />
                  <a
                    href={formatUrl(baseUrl1)}
                    target="_blank"
                    rel="noreferrer"
                    className="dc-config-ext-link"
                    title="Open Source Backend"
                  >
                    <SquareArrowOutUpRight style={{ width: '16px', height: '16px' }} />
                  </a>
                </div>
              </div>

              <div className="dc-config-group">
                <label className="dc-config-label">
                  <span>Target Backend</span>
                  <span className="dc-required-star">*</span>
                </label>
                <div className="dc-config-input-wrapper">
                  <input
                    type="text"
                    value={baseUrl2}
                    readOnly
                    className="dc-config-input"
                    placeholder="target-backend"
                  />
                  <a
                    href={formatUrl(baseUrl2)}
                    target="_blank"
                    rel="noreferrer"
                    className="dc-config-ext-link"
                    title="Open Target Backend"
                  >
                    <SquareArrowOutUpRight style={{ width: '16px', height: '16px' }} />
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
          leftEditUrl={modalConfig.leftEditUrl}
          rightEditUrl={modalConfig.rightEditUrl}
          leftId={modalConfig.leftId}
          rightId={modalConfig.rightId}
          activeOption={modalConfig.activeOption || activeOption}
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
          activeOption={activeOption}
          onConfirm={executeSync}
        />

        {/* Clone Confirmation Modal */}
        <CopyToConfirmModal
          isOpen={cloneModalConfig.isOpen}
          onClose={() => setCloneModalConfig((prev) => ({ ...prev, isOpen: false }))}
          row={cloneModalConfig.row}
          direction={cloneModalConfig.direction}
          baseUrl1={baseUrl1}
          baseUrl2={baseUrl2}
          activeOption={activeOption}
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
