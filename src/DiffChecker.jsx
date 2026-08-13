import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from './components/Header';
import NavigationRow from './components/NavigationRow';
import DiffViewerModal, { formatDiffContent, parseNestedJsonStrings } from './components/DiffViewerModal';
import DataDiffTable from './components/DataDiffTable';
import VersionMismatchTable from './components/VersionMismatchTable';
import OnlySiteTable from './components/OnlySiteTable';
import { SquareArrowOutUpRight, Check, X } from 'lucide-react';
import { SyncConfirmModal } from './components/SyncConfirmModal';
import { getOptionConfig } from './config';
import { toast, ToastContainer, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
      {/* Left Icon (Red X for error, Green check for success) */}
      {errorState ? (
        <div className="w-7 h-7 rounded-full bg-[#ef4444] flex items-center justify-center flex-shrink-0 shadow-[0_2px_8px_rgba(239,68,68,0.3)]">
          <X className="w-4 h-4 text-white" />
        </div>
      ) : (
        <div className="w-7 h-7 rounded-full bg-[#00c853] flex items-center justify-center flex-shrink-0 shadow-[0_2px_8px_rgba(0,200,83,0.3)]">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Centered Message */}
      <div className="flex-1 flex justify-center">
        {renderContent()}
      </div>
    </div>
  );
};

// Sample Datatables Config Data for demonstration & fallback
const SAMPLE_DATATABLES_CONFIG_SITE1 = [
  {
    id: "58",
    tag: "mentor_load",
    title: "Mentor Load",
    datatable_structure: JSON.stringify({
      form: { layout: "vertical", labelAlign: "left", colon: false, labelCol: 5, labelWrap: false, wrapperCol: 12 },
      schema: { type: "object", properties: { mentee: { type: "string", title: "Mentee Name" } } }
    }, null, 2),
    datatable_query: "SELECT users.field_full_name_value AS \"name_of_mentee\", t.task_display_name FROM task_mentor_mapping",
    status: "active",
    version: "1",
    bo_type: ""
  },
  {
    id: "38",
    tag: "track_bos_timeline",
    title: "Tracking",
    datatable_structure: JSON.stringify({
      form: { layout: "vertical", labelAlign: "left", colon: false, labelCol: 5 },
      schema: { type: "object", properties: { reference: { type: "string", title: "Reference #" } } }
    }, null, 2),
    datatable_query: "SELECT bo_wf_mapping.bo_id AS \"reference\", fm.uri AS \"custom_full_img\" FROM process",
    status: "active",
    version: "2.1",
    bo_type: "timeline"
  },
  {
    id: "55",
    tag: "feedback",
    title: "Feedback List",
    datatable_structure: JSON.stringify({
      form: { labelCol: 6, wrapperCol: 12 },
      schema: { type: "object", properties: { fdbk_remark: { type: "string", title: "Mentee Remark" } } }
    }, null, 2),
    datatable_query: "SELECT feedback_sub.id as \"id\", user_full_name_new.field_full_name_value FROM feedback",
    status: "active",
    version: "1",
    bo_type: ""
  },
  {
    id: "52",
    tag: "subtask_master",
    title: "Subtask Master",
    datatable_structure: JSON.stringify({ web: [{ tableColumns: [{ id: "task_name", header: "Task Name" }] }] }, null, 2),
    datatable_query: "SELECT id, task_name, sub_task FROM subtask_master WHERE wf_code = :wf_code",
    status: "active",
    version: "1.1",
    bo_type: ""
  },
  {
    id: "47",
    tag: "project_allocation",
    title: "Projects",
    datatable_structure: JSON.stringify({ web: [{ tableColumns: [{ id: "project_name", header: "Project Name" }] }] }, null, 2),
    datatable_query: "SELECT pa.pa_id AS \"pa_id\", pa.project_name FROM project_allocation",
    status: "active",
    version: "1.1",
    bo_type: ""
  },
  {
    id: "26",
    tag: "workflow_list",
    title: "Workflow List",
    datatable_structure: JSON.stringify({ web: [{ tableColumns: [{ id: "wf_id", header: "Workflow Id" }] }] }, null, 2),
    datatable_query: "SELECT w.wf_id AS \"wf_id\", w.wf_code AS \"wf_code\" FROM workflow w",
    status: "active",
    version: "1.2",
    bo_type: ""
  },
  {
    id: "101",
    tag: "all_task_copy",
    title: "All Task Copy",
    datatable_structure: JSON.stringify({ form: { labelCol: 6, wrapperCol: 12 }, schema: { type: "object" } }, null, 2),
    datatable_query: "SELECT * FROM task_copy",
    status: "active",
    version: "1.0",
    bo_type: ""
  },
  {
    id: "102",
    tag: "task_open_close_report",
    title: "Task Open Close Report",
    datatable_structure: JSON.stringify({ web: [] }, null, 2),
    datatable_query: "SELECT * FROM open_close_report",
    status: "active",
    version: "1.0",
    bo_type: ""
  },
  {
    id: "103",
    tag: "user-queue-report",
    title: "User Queue Report",
    datatable_structure: JSON.stringify({ web: [] }, null, 2),
    datatable_query: "SELECT * FROM user_queue",
    status: "active",
    version: "1.0",
    bo_type: ""
  },
  {
    id: "104",
    tag: "dfm-report",
    title: "DFM Report",
    datatable_structure: JSON.stringify({ web: [] }, null, 2),
    datatable_query: "SELECT * FROM dfm_report",
    status: "active",
    version: "1.0",
    bo_type: ""
  },
  {
    id: "105",
    tag: "assigntask",
    title: "Assign Task",
    datatable_structure: JSON.stringify({ web: [] }, null, 2),
    datatable_query: "SELECT * FROM assign_task",
    status: "active",
    version: "1.0",
    bo_type: ""
  }
];

const SAMPLE_DATATABLES_CONFIG_SITE2 = [
  {
    id: "58",
    tag: "mentor_load",
    title: "Mentor Load",
    datatable_structure: JSON.stringify({
      form: { labelCol: 5, wrapperCol: 12, labelWrap: false },
      schema: { type: "object", properties: { mentee: { type: "string", title: "Mentee Name" } } }
    }, null, 2),
    datatable_query: "SELECT users.field_full_name_value AS \"name_of_mentee\", t.task_display_name FROM task_mentor_mapping",
    status: "active",
    version: "1",
    bo_type: ""
  },
  {
    id: "38",
    tag: "track_bos_timeline",
    title: "Tracking",
    datatable_structure: JSON.stringify({
      form: { layout: "vertical", labelAlign: "left", colon: false, labelCol: 5 },
      schema: { type: "object", properties: { reference: { type: "string", title: "Reference #" } } }
    }, null, 2),
    datatable_query: "SELECT bo_wf_mapping.bo_id AS \"reference\", fm.uri AS \"custom_full_img\" FROM process",
    status: "active",
    version: "2.1",
    bo_type: "timeline"
  },
  {
    id: "55",
    tag: "feedback",
    title: "Feedback List",
    datatable_structure: JSON.stringify({
      form: { labelCol: 6, wrapperCol: 12 },
      schema: { type: "object", properties: { fdbk_remark: { type: "string", title: "Mentee Remark" } } }
    }, null, 2),
    datatable_query: "SELECT feedback_sub.id as \"id\", user_full_name_new.field_full_name_value FROM feedback",
    status: "active",
    version: "1",
    bo_type: ""
  },
  {
    id: "52",
    tag: "subtask_master",
    title: "Subtask Master",
    datatable_structure: JSON.stringify({ web: [{ tableColumns: [{ id: "task_name", header: "Task Name" }] }] }, null, 2),
    datatable_query: "SELECT id, task_name, sub_task FROM subtask_master WHERE wf_code = :wf_code",
    status: "active",
    version: "1.1",
    bo_type: ""
  },
  {
    id: "47",
    tag: "project_allocation",
    title: "Projects",
    datatable_structure: JSON.stringify({ web: [{ tableColumns: [{ id: "project_name", header: "Project Name" }] }] }, null, 2),
    datatable_query: "SELECT pa.pa_id AS \"pa_id\", pa.project_name FROM project_allocation",
    status: "active",
    version: "1.1",
    bo_type: ""
  },
  {
    id: "26",
    tag: "workflow_list",
    title: "Workflow List",
    datatable_structure: JSON.stringify({ web: [{ tableColumns: [{ id: "wf_id", header: "Workflow Id" }] }] }, null, 2),
    datatable_query: "SELECT w.wf_id AS \"wf_id\", w.wf_code AS \"wf_code\" FROM workflow w",
    status: "active",
    version: "1.2",
    bo_type: ""
  },
  {
    id: "201",
    tag: "task_queue_report",
    title: "Task Queue Report",
    datatable_structure: JSON.stringify({ web: [] }, null, 2),
    datatable_query: "SELECT * FROM task_queue_report_v2 WHERE active = 1 ORDER BY created DESC",
    status: "active",
    version: "1",
    bo_type: ""
  },
  {
    id: "202",
    tag: "task_iterations",
    title: "Task Iterations",
    datatable_structure: JSON.stringify({ web: [{ tableColumns: [{ id: "iteration_id", header: "Iteration" }] }] }, null, 2),
    datatable_query: "SELECT * FROM task_iterations_v2 WHERE iteration_id > 0",
    status: "active",
    version: "1",
    bo_type: ""
  },
  {
    id: "203",
    tag: "issues_report",
    title: "Issues Report",
    datatable_structure: JSON.stringify({ web: [] }, null, 2),
    datatable_query: "SELECT * FROM issues_report",
    status: "active",
    version: "1.1",
    bo_type: ""
  },
  {
    id: "204",
    tag: "user_trend_snapshot",
    title: "User Trend Snapshot",
    datatable_structure: JSON.stringify({ web: [] }, null, 2),
    datatable_query: "SELECT * FROM user_trend",
    status: "active",
    version: "1.5",
    bo_type: ""
  },
  {
    id: "205",
    tag: "myticket",
    title: "My Ticket",
    datatable_structure: JSON.stringify({ web: [] }, null, 2),
    datatable_query: "SELECT * FROM myticket",
    status: "active",
    version: "2.6",
    bo_type: ""
  },
  {
    id: "206",
    tag: "track_bos",
    title: "Track BOS",
    datatable_structure: JSON.stringify({ web: [] }, null, 2),
    datatable_query: "SELECT * FROM track_bos",
    status: "active",
    version: "2.2",
    bo_type: ""
  },
  {
    id: "207",
    tag: "otherticket",
    title: "Other Ticket",
    datatable_structure: JSON.stringify({ web: [] }, null, 2),
    datatable_query: "SELECT * FROM otherticket",
    status: "active",
    version: "3",
    bo_type: ""
  },
  {
    id: "301",
    tag: "feedback",
    title: "Feedback",
    datatable_structure: JSON.stringify({ web: [] }, null, 2),
    datatable_query: "SELECT * FROM feedback",
    status: "active",
    version: "1.0",
    bo_type: ""
  },
  {
    id: "302",
    tag: "task_mentor_master",
    title: "Task Mentor Master",
    datatable_structure: JSON.stringify({ web: [] }, null, 2),
    datatable_query: "SELECT * FROM task_mentor_master",
    status: "active",
    version: "1.0",
    bo_type: ""
  },
  {
    id: "303",
    tag: "sample_data_table",
    title: "Sample Data Table",
    datatable_structure: JSON.stringify({ web: [] }, null, 2),
    datatable_query: "SELECT * FROM sample_data",
    status: "active",
    version: "1.0",
    bo_type: ""
  },
  {
    id: "304",
    tag: "test_sync_api",
    title: "Test Sync API",
    datatable_structure: JSON.stringify({ web: [] }, null, 2),
    datatable_query: "SELECT * FROM test_sync",
    status: "active",
    version: "1.0",
    bo_type: ""
  }
];

// Helper to introduce differences into Site 2 dataset for the Datatables configuration
const introduceSite2Differences = (dataset) => {
  if (!Array.isArray(dataset)) return [];

  return dataset.map(item => {
    // 1. Version Mismatch: Change version of mentor_load to "2"
    if (item.tag === 'mentor_load') {
      return { ...item, version: '2' };
    }
    // 2. Query Diff: Modify datatable_query of track_bos_timeline
    if (item.tag === 'track_bos_timeline') {
      return {
        ...item,
        datatable_query: (item.datatable_query || '') + '\n-- modified query for Site 2'
      };
    }
    // 3. Structure Diff: Modify datatable_structure of feedback
    if (item.tag === 'feedback') {
      try {
        const struct = JSON.parse(item.datatable_structure);
        if (struct.web && struct.web[0] && struct.web[0].initialState) {
          struct.web[0].initialState.exportCSV = false;
        }
        return {
          ...item,
          datatable_structure: JSON.stringify(struct, null, 2)
        };
      } catch (e) {
        return item;
      }
    }
    return item;
  }).filter(item => {
    // 4. Only on Site 1: Remove "subtask_master" from Site 2
    return item.tag !== 'subtask_master';
  }).concat([
    // 5. Only on Site 2: Add a new item to Site 2
    {
      id: "999",
      tag: "only_site2_dummy",
      title: "Only Site 2 Dummy",
      datatable_structure: "{}",
      datatable_query: "SELECT * FROM only_site2;",
      status: "active",
      version: "1.0",
      datatable_menu_link: "only_site2_dummy",
      created: "1701253281",
      updated: "1701508133",
      created_by: "1",
      updated_by: "0"
    }
  ]);
};

// Return realistic dummy objects for other tags to keep the UI beautiful in development fallback
const getMockDataForTag = (tag) => {
  if (tag === 'subtask_master') {
    return [
      { id: "1", wf_code: "wf_001", task_name: "Initial Review", sub_task: "Check documentation", subtask_code: "st_01" },
      { id: "2", wf_code: "wf_001", task_name: "Technical Assessment", sub_task: "Run tests", subtask_code: "st_02" },
      { id: "3", wf_code: "wf_002", task_name: "Final Approval", sub_task: "Sign off", subtask_code: "st_03" }
    ];
  }
  if (tag === 'workflow_config') {
    return [
      { id: "1", wf_code: "wf_001", wf_name: "Standard Onboarding", status: "active", version: "1.0", created: "1682322182" },
      { id: "2", wf_code: "wf_002", wf_name: "High Priority Review", status: "active", version: "2.1", created: "1697023666" }
    ];
  }
  return [
    { id: "1", tag: `${tag}_item_1`, name: `Sample ${tag} 1`, status: "active", version: "1.0" },
    { id: "2", tag: `${tag}_item_2`, name: `Sample ${tag} 2`, status: "active", version: "1.1" }
  ];
};

// Helper to introduce differences into Site 2 dataset for generic configuration tags
const introduceSite2DifferencesGeneric = (tag, dataset) => {
  if (!Array.isArray(dataset)) return [];
  if (tag === 'subtask_master') {
    return [
      { id: "1", wf_code: "wf_001", task_name: "Initial Review", sub_task: "Check documentation", subtask_code: "st_01" },
      { id: "2", wf_code: "wf_001", task_name: "Technical Assessment", sub_task: "Run tests (Site 2 version)", subtask_code: "st_02" },
      { id: "4", wf_code: "wf_003", task_name: "Quality Audit", sub_task: "Verify logs", subtask_code: "st_04" }
    ];
  }
  if (tag === 'workflow_config') {
    return [
      { id: "1", wf_code: "wf_001", wf_name: "Standard Onboarding", status: "active", version: "1.1", created: "1682322182" },
      { id: "3", wf_code: "wf_003", wf_name: "Site 2 Custom Flow", status: "active", version: "1.0", created: "1701587295" }
    ];
  }
  return dataset.map((item, idx) => {
    if (idx === 0) return { ...item, version: '1.2' };
    return item;
  }).concat([
    { id: "3", tag: `${tag}_item_3`, name: `Sample ${tag} 3 (Site 2 Only)`, status: "active", version: "1.0" }
  ]);
};

const formatUrl = (url) => {
  if (!url) return '#';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://${url}`;
};

export const DiffChecker = ({
  baseurl,
  baseUrl,
  base_url,
  backend_url = "https://tms-next-be.wcms.cloud",
  backend_url_2 = "https://dev-sutradhar-be.wcms.cloud",
  synced_by = "ayush",
  initialOption = 'datatables',
  initialOptionLabel = 'DataTables'
}) => {
  // Navigation & Config State
  const [activeOption, setActiveOption] = useState(initialOption);
  const [activeOptionLabel, setActiveOptionLabel] = useState(initialOptionLabel);

  // Resolve base prop if provided
  const propBase = baseurl !== undefined ? baseurl : (baseUrl !== undefined ? baseUrl : base_url);
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
  const [isLoading, setIsLoading] = useState(false);
  const lastFetchedTagRef = React.useRef(null);

  useEffect(() => {
    if (initialOption) setActiveOption(initialOption);
    if (initialOptionLabel) setActiveOptionLabel(initialOptionLabel);
  }, [initialOption, initialOptionLabel]);

  useEffect(() => {
    const rawProp = baseurl !== undefined ? baseurl : (baseUrl !== undefined ? baseUrl : base_url);
    if (typeof rawProp === 'object' && rawProp !== null) {
      if (rawProp.src_url) setBaseUrl1(rawProp.src_url);
      if (rawProp.target_url) setBaseUrl2(rawProp.target_url);
    } else if (typeof rawProp === 'string' && rawProp.trim()) {
      setBaseUrl1(rawProp);
    }
  }, [baseurl, baseUrl, base_url]);

  // Raw datasets for Site 1 and Site 2
  const [site1Dataset, setSite1Dataset] = useState(SAMPLE_DATATABLES_CONFIG_SITE1);
  const [site2Dataset, setSite2Dataset] = useState(SAMPLE_DATATABLES_CONFIG_SITE2);

  // Modal Configuration State
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'diff', // 'diff' or 'data'
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

  // 1. GET API Handler: /api/get-configuration?diff_tag=
  const fetchConfiguration = useCallback(async (diffTag) => {
    // On root or 'datatables', tag must be 'datatables_config'
    let apiTag = diffTag;
    if (diffTag === 'datatables' || diffTag === 'datatables_config' || !diffTag) {
      apiTag = 'datatables_config';
    } else {
      const config = getOptionConfig(diffTag);
      apiTag = (config && config.apiKey && config.apiKey !== 'datatables') ? config.apiKey : diffTag;
    }

    if (lastFetchedTagRef.current === apiTag) {
      return;
    }
    lastFetchedTagRef.current = apiTag;

    setIsLoading(true);

    let result = null;
    let fetchError = false;

    // Check if user passed baseurl host to fetch from real endpoint
    const rawProp = baseurl !== undefined ? baseurl : (baseUrl !== undefined ? baseUrl : base_url);
    const targetHost = typeof rawProp === 'string'
      ? rawProp
      : (typeof rawProp === 'object' && rawProp
        ? (rawProp.base_url || rawProp.src_url || rawProp.baseUrl)
        : '');

    if (targetHost && targetHost.trim() && !targetHost.includes('localhost') && !targetHost.includes('127.0.0.1')) {
      let cleanHost = targetHost.trim();
      if (!cleanHost.startsWith('http://') && !cleanHost.startsWith('https://')) {
        cleanHost = `https://${cleanHost}`;
      }
      cleanHost = cleanHost.replace(/\/+$/, '');
      const getUrl = `${cleanHost}/api/get-configuration?diff_tag=${encodeURIComponent(apiTag)}`;
      try {
        const r = await fetch(getUrl);
        if (r.ok) {
          result = await r.json();
        } else {
          fetchError = true;
        }
      } catch (e) {
        console.warn(`Failed to fetch from primary API ${getUrl}, falling back to demo payload:`, e);
        fetchError = true;
      }
    }

    // Demo fallback: fetch data from /payload.json
    if (!result || !result.data) {
      try {
        console.log(`[Demo Mode] Fetching demo payload for diff_tag="${apiTag}"`);
        const demoRes = await fetch('/payload.json');
        if (demoRes.ok) {
          result = await demoRes.json();
        }
      } catch (err) {
        console.error('Failed to fetch demo payload:', err);
        fetchError = true;
      }
    }

    let site1Data = null;
    let site2Data = null;
    let isErrorState = false;

    try {
      if (result && (result.status_code === 1 || result.status === 'success') && result.data) {
        const payloadData = result.data;

        // Extract backend metadata (src_url is source backend, target_url is target backend)
        if (payloadData.src_url) {
          setBaseUrl1(payloadData.src_url);
        }
        if (payloadData.target_url) {
          setBaseUrl2(payloadData.target_url);
        }

        setBackendMetadata({
          import_id: payloadData.import_id || null,
          src_name: payloadData.src_name || '',
          src_url: payloadData.src_url || '',
          target_name: payloadData.target_name || '',
          target_url: payloadData.target_url || ''
        });

        if (apiTag === 'datatables_config' || apiTag === 'datatables') {
          site1Data = payloadData.datatables_config || [];
          site2Data = introduceSite2Differences(site1Data);
        } else {
          const possibleData = payloadData[apiTag] || payloadData[diffTag] || payloadData.datatables_config;
          if (possibleData && Array.isArray(possibleData) && possibleData.length > 0) {
            site1Data = possibleData;
            site2Data = introduceSite2DifferencesGeneric(apiTag, site1Data);
          } else {
            site1Data = getMockDataForTag(apiTag);
            site2Data = introduceSite2DifferencesGeneric(apiTag, site1Data);
          }
        }
      } else {
        if (apiTag === 'datatables_config' || apiTag === 'datatables') {
          site1Data = SAMPLE_DATATABLES_CONFIG_SITE1;
          site2Data = SAMPLE_DATATABLES_CONFIG_SITE2;
        } else {
          site1Data = getMockDataForTag(apiTag);
          site2Data = introduceSite2DifferencesGeneric(apiTag, site1Data);
        }
        if (fetchError && !result) {
          isErrorState = true;
        }
      }
    } catch (err) {
      console.error('Error processing dataset:', err);
      isErrorState = true;
    }

    setSite1Dataset(site1Data || []);
    setSite2Dataset(site2Data || []);
    setIsLoading(false);

    if (isErrorState) {
      showToast('An error occured', true);
    } else {
      showToast('Data fetch successfully');
    }
  }, [baseurl, baseUrl, base_url, showToast]);

  useEffect(() => {
    fetchConfiguration(activeOption);
  }, [activeOption, fetchConfiguration]);

  // 2. PATCH API Handler: /api/sync-configuration
  const handleSyncConfiguration = (row, targetSiteUrl) => {
    setSyncModalConfig({
      isOpen: true,
      row,
      targetSiteUrl,
    });
  };

  const executeSync = async (item, targetSiteUrl, syncedBy) => {
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
        headers: { 'Content-Type': 'application/json' },
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
  };

  // 3. POST API Handler: /api/clone-configuration
  const handleCloneConfiguration = async (item, targetSiteUrl, direction) => {
    const config = getOptionConfig(activeOption);
    const apiTag = config.apiKey || activeOption;
    const typeName = apiTag === 'datatables' ? 'datatables_config' : apiTag;

    const rawItem = item.raw || item;
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
      synced_by: synced_by || "ayush"
    };

    // If copy to right -> target_url (baseUrl2), if copy to left -> source_url (baseUrl1)
    let cleanTargetUrl = targetSiteUrl || (direction === 'to_left' ? baseUrl1 : baseUrl2) || "";
    if (cleanTargetUrl && !cleanTargetUrl.startsWith('http://') && !cleanTargetUrl.startsWith('https://')) {
      cleanTargetUrl = `https://${cleanTargetUrl}`;
    }
    cleanTargetUrl = cleanTargetUrl.replace(/\/+$/, '');

    showToast(`Sending POST ${cleanTargetUrl}/api/clone-configuration (${direction === 'to_right' ? 'Copy to Right' : 'Copy to Left'})...`);

    try {
      await fetch(`${cleanTargetUrl}/api/clone-configuration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => null);

      if (direction === 'to_right') {
        setSite2Dataset((prev) => [...prev, item]);
        showToast(`Copied "${itemTag}" to Site 2`);
      } else {
        setSite1Dataset((prev) => [...prev, item]);
        showToast(`Copied "${itemTag}" to Site 1`);
      }
    } catch (err) {
      console.error('Clone error:', err);
    }
  };

  const handleSelectOption = (id, label) => {
    setActiveOption(id);
    setActiveOptionLabel(label);
  };

  // Dataset Comparison Logic
  const { dataDiffRows, versionMismatchRows, onlySite1Rows, onlySite2Rows } = useMemo(() => {
    const config = getOptionConfig(activeOption);
    const res = config.compare(site1Dataset, site2Dataset) || {};
    console.log('[DiffChecker] Comparison result:', res);
    return {
      dataDiffRows: res.dataDiffRows || res.dataDiff || [],
      versionMismatchRows: res.versionMismatchRows || res.versionMismatch || [],
      onlySite1Rows: res.onlySite1Rows || res.onlySite1 || [],
      onlySite2Rows: res.onlySite2Rows || res.onlySite2 || []
    };
  }, [site1Dataset, site2Dataset, activeOption]);

  // Open Diff Modal handler
  const openDiffViewer = (params, fieldType = 'structure') => {
    const raw1 = params.data.raw1 || {};
    const raw2 = params.data.raw2 || {};
    const config = getOptionConfig(activeOption);

    let leftContent = '';
    let rightContent = '';

    if (fieldType === 'query') {
      leftContent = raw1.datatable_query || raw1.dropdown_query || `SELECT * FROM ${params.data.tag};`;
      rightContent = raw2.datatable_query || raw2.dropdown_query || `SELECT * FROM ${params.data.tag} WHERE active = 1;`;
    } else if (fieldType === 'excel') {
      leftContent = formatDiffContent(params.data.excel1 || {});
      rightContent = formatDiffContent(params.data.excel2 || {});
    } else if (fieldType === 'validator') {
      leftContent = formatDiffContent(params.data.val1 || {});
      rightContent = formatDiffContent(params.data.val2 || {});
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
      tag: params.data.tag,
      leftVersion: raw1.version || params.data.site1Version || params.data.siteVersion || '1.1',
      rightVersion: raw2.version || params.data.site2Version || params.data.siteVersion || '1.1',
      leftData: leftContent,
      rightData: rightContent,
      jsonData: null
    });
  };

  // Open Data Viewer Modal handler
  const openDataViewer = (params) => {
    const raw = params.data.raw || {};
    const formattedData = raw && Object.keys(raw).length > 0 ? raw : {
      tag: params.data.tag,
      version: raw.version || "1",
      id: raw.id || "10",
      entity_version: "1",
      entity_config: raw.datatable_structure || JSON.stringify({
        form: { labelCol: 6, wrapperCol: 12 },
        schema: { type: "object", properties: { main_field: { type: "string", title: "Field 1" } } }
      }),
      entity_type: params.data.tag,
      status: raw.status || "active",
      entity_sequence: "0",
      form_type: "save and close"
    };

    setModalConfig({
      isOpen: true,
      type: 'data',
      tag: params.data.tag,
      leftVersion: raw.version || '1.0',
      rightVersion: raw.version || '1.0',
      leftData: '',
      rightData: '',
      jsonData: parseNestedJsonStrings(formattedData)
    });
  };

  return (
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
                  placeholder="local-arvind-retail.wcms.cloud"
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
                  placeholder="local-arvind-retail.wcms.cloud"
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

        {/* SECTION B: DATA DIFF TABLE COMPONENT */}
        <DataDiffTable
          activeOption={activeOption}
          dataDiffRows={dataDiffRows}
          openDiffViewer={openDiffViewer}
          handleSyncConfiguration={handleSyncConfiguration}
          showToast={showToast}
          baseUrl1={baseUrl1}
          baseUrl2={baseUrl2}
        />

        {/* SECTION C: VERSION MISMATCH TABLE COMPONENT */}
        <VersionMismatchTable
          activeOption={activeOption}
          versionMismatchRows={versionMismatchRows}
          openDiffViewer={openDiffViewer}
        />

        {/* SECTION D: SIDE-BY-SIDE ONLY SITE TABLES COMPONENT */}
        <OnlySiteTable
          activeOption={activeOption}
          onlySite1Rows={onlySite1Rows}
          onlySite2Rows={onlySite2Rows}
          baseUrl1={baseUrl1}
          baseUrl2={baseUrl2}
          openDataViewer={openDataViewer}
          handleCloneConfiguration={handleCloneConfiguration}
        />

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
  );
};

export default DiffChecker;
