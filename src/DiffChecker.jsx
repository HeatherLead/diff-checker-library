import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from './components/Header';
import NavigationRow from './components/NavigationRow';
import DiffViewerModal from './components/DiffViewerModal';
import DataDiffTable from './components/DataDiffTable';
import VersionMismatchTable from './components/VersionMismatchTable';
import OnlySiteTable from './components/OnlySiteTable';
import { SquareArrowOutUpRight } from 'lucide-react';
import { getOptionConfig } from './config';
import { toast, ToastContainer, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ToastMessage = ({ msg }) => {
  const cleanMsg = typeof msg === 'string' ? msg : String(msg);

  const renderContent = () => {
    if (cleanMsg.toLowerCase().includes('data fetched successfully') || cleanMsg.toLowerCase().includes('fetched successfully')) {
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
      {/* Left Success Icon (Green check) */}
      <div className="w-7 h-7 rounded-full bg-[#00c853] flex items-center justify-center flex-shrink-0 shadow-[0_2px_8px_rgba(0,200,83,0.3)]">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
          <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
        </svg>
      </div>

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

export const DiffChecker = ({
  backend_url = "https://tms-next-be.wcms.cloud",
  backend_url_2 = "https://dev-sutradhar-be.wcms.cloud",
  synced_by = "ayush",
  initialOption = 'datatables',
  initialOptionLabel = 'DataTables'
}) => {
  // Navigation & Config State
  const [activeOption, setActiveOption] = useState(initialOption);
  const [activeOptionLabel, setActiveOptionLabel] = useState(initialOptionLabel);
  const [baseUrl1, setBaseUrl1] = useState(backend_url);
  const [baseUrl2, setBaseUrl2] = useState(backend_url_2);
  const [isLoading, setIsLoading] = useState(false);


  useEffect(() => {
    if (initialOption) setActiveOption(initialOption);
    if (initialOptionLabel) setActiveOptionLabel(initialOptionLabel);
  }, [initialOption, initialOptionLabel]);

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

  const showToast = useCallback((msg) => {
    toast(<ToastMessage msg={msg} />, {
      icon: false,
      closeButton: false,
      autoClose: 1300,
      hideProgressBar: false,
      pauseOnHover: false,
      draggable: true,
      progress: undefined,
    });
  }, []);

  useEffect(() => {
    if (backend_url) setBaseUrl1(backend_url);
    if (backend_url_2) setBaseUrl2(backend_url_2);
  }, [backend_url, backend_url_2]);

  // 1. GET API Handler: /api/get-configuration?diff_tag=
  const fetchConfiguration = useCallback(async (diffTag) => {
    setIsLoading(true);
    showToast(`Fetching configuration for diff_tag="${diffTag}"...`);

    const config = getOptionConfig(diffTag);
    const apiTag = config.apiKey || diffTag;

    const getUrl1 = `${baseUrl1}/api/get-configuration?diff_tag=${encodeURIComponent(apiTag)}`;
    const getUrl2 = `${baseUrl2}/api/get-configuration?diff_tag=${encodeURIComponent(apiTag)}`;

    try {
      const [res1, res2] = await Promise.allSettled([
        fetch(getUrl1).then((r) => r.json()),
        fetch(getUrl2).then((r) => r.json())
      ]);

      let site1Data = null;
      let site2Data = null;

      if (res1.status === 'fulfilled' && res1.value && res1.value.status_code === 1 && res1.value.data) {
        site1Data = res1.value.data[apiTag] || res1.value.data[diffTag] || res1.value.data.datatables_config || res1.value.data;
      }
      if (res2.status === 'fulfilled' && res2.value && res2.value.status_code === 1 && res2.value.data) {
        site2Data = res2.value.data[apiTag] || res2.value.data[diffTag] || res2.value.data.datatables_config || res2.value.data;
      }

      if (site1Data) {
        setSite1Dataset(site1Data);
      } else {
        setSite1Dataset([]);
      }
      
      if (site2Data) {
        setSite2Dataset(site2Data);
      } else {
        setSite2Dataset([]);
      }

      if (!site1Data && !site2Data) {
        console.log(`GET API unavailable at ${getUrl1}. Using sample data diff for diff_tag="${diffTag}".`);
      } else {
        showToast(`Configuration loaded for diff_tag="${diffTag}"`);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl1, baseUrl2]);

  useEffect(() => {
    fetchConfiguration(activeOption);
  }, [activeOption, fetchConfiguration]);

  // 2. PATCH API Handler: /api/sync-configuration
  const handleSyncConfiguration = async (item, targetSiteUrl) => {
    const config = getOptionConfig(activeOption);
    const apiTag = config.apiKey || activeOption;

    const payload = {
      type: apiTag === 'datatables' ? 'datatables_config' : apiTag,
      unique_column: {
        tag: item.tag || item.tag_name || item.module || "",
        version: item.version || item.siteVersion || item.rec1version || item.entity_version || "1.0",
        bo_type: item.bo_type || "",
        permission: item.permission || ""
      },
      import_id: item.id ? parseInt(item.id, 10) : 12,
      synced_by: synced_by
    };

    showToast(`Sending PATCH ${targetSiteUrl}/api/sync-configuration...`);

    try {
      const response = await fetch(`${targetSiteUrl}/api/sync-configuration`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => null);

      if (response && response.ok) {
        const result = await response.json();
        showToast(`Synced tag="${item.tag || item.tag_name || item.module}" successfully!`);
      } else {
        showToast(`PATCH /api/sync-configuration sent for "${item.tag || item.tag_name || item.module}"`);
      }
    } catch (err) {
      console.error('Sync error:', err);
    }
  };

  // 3. POST API Handler: /api/clone-configuration
  const handleCloneConfiguration = async (item, targetSiteUrl, direction) => {
    const config = getOptionConfig(activeOption);
    const apiTag = config.apiKey || activeOption;

    const payload = {
      type: apiTag === 'datatables' ? 'datatables_config' : apiTag,
      unique_column: {
        tag: item.tag || item.tag_name || item.module || "",
        version: item.version || item.siteVersion || item.rec1version || item.entity_version || "1.0",
        bo_type: item.bo_type || "",
        permission: item.permission || ""
      },
      import_id: String(item.id || "12"),
      synced_by: synced_by
    };

    showToast(`Sending POST ${targetSiteUrl}/api/clone-configuration (${direction})...`);

    try {
      await fetch(`${targetSiteUrl}/api/clone-configuration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => null);

      if (direction === 'to_right') {
        setSite2Dataset((prev) => [...prev, item]);
        showToast(`Copied "${item.tag}" to Site 2`);
      } else {
        setSite1Dataset((prev) => [...prev, item]);
        showToast(`Copied "${item.tag}" to Site 1`);
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
    return config.compare(site1Dataset, site2Dataset);
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
      leftContent = JSON.stringify(params.data.excel1 || {}, null, 2);
      rightContent = JSON.stringify(params.data.excel2 || {}, null, 2);
    } else if (fieldType === 'validator') {
      leftContent = JSON.stringify(params.data.val1 || {}, null, 2);
      rightContent = JSON.stringify(params.data.val2 || {}, null, 2);
    } else if (fieldType === 'other') {
      const ignoreKeys = ["tag_name", "bo_type", "created_by", "updated_by", "updated", "created", "id", "tag", "version"];
      const filterObj = (obj) => Object.fromEntries(Object.entries(obj || {}).filter(([k]) => !ignoreKeys.includes(k)));
      leftContent = JSON.stringify(filterObj(raw1), null, 2);
      rightContent = JSON.stringify(filterObj(raw2), null, 2);
    } else {
      const leftKey = config.leftDataKey || 'datatable_structure';
      const rightKey = config.rightDataKey || 'datatable_structure';
      
      const val1 = raw1[leftKey] || raw1;
      const val2 = raw2[rightKey] || raw2;
      
      leftContent = typeof val1 === 'string' ? val1 : JSON.stringify(val1, null, 2);
      rightContent = typeof val2 === 'string' ? val2 : JSON.stringify(val2, null, 2);
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
      jsonData: formattedData
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
        <section className="bg-whit p-2">
          <h2 className="text-center text-[1rem] leading-[1rem] font-bold uppercase tracking-widest pb-2 mb-4 underline">
            {activeOptionLabel.toUpperCase()} CONFIGURATION
          </h2>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-normal text-gray-600">
            <div className="flex flex-col space-y-1">
              <label className="flex items-center space-x-1">
                <span>Imported Backend</span>
                <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={baseUrl1}
                  onChange={(e) => setBaseUrl1(e.target.value)}
                  readOnly
                  className="w-72 sm:w-80 px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#7a1c4b] focus:border-[#7a1c4b] outline-none text-gray-700 font-normal pr-8"
                />
                <a
                  href={baseUrl1}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute right-2.5 text-gray-400 hover:text-gray-600 transition-colors flex items-center"
                >
                  <SquareArrowOutUpRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="flex items-center space-x-1">
                <span>Current Backend</span>
                <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={baseUrl2}
                  onChange={(e) => setBaseUrl2(e.target.value)}
                  readOnly
                  className="w-72 sm:w-80 px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#7a1c4b] focus:border-[#7a1c4b] outline-none text-gray-700 font-normal pr-8"
                />
                <a
                  href={baseUrl2}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute right-2.5 text-gray-400 hover:text-gray-600 transition-colors flex items-center"
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

      {/* React Toastify Container */}
      <ToastContainer
        position="top-center"
        autoClose={1300}
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
