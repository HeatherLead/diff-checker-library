import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { matchSorter } from 'match-sorter';
import Header from './components/Header';
import NavigationRow from './components/NavigationRow';
import { AgGridGenerator } from './components/agGridGenerator';
import DiffViewerModal from './components/DiffViewerModal';
import { SquareArrowOutUpRight } from 'lucide-react';
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
      form: { layout: "vertical", labelAlign: "left", colon: false, labelCol: 5, labelWrap: false },
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
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (initialOption) setActiveOption(initialOption);
    if (initialOptionLabel) setActiveOptionLabel(initialOptionLabel);
  }, [initialOption, initialOptionLabel]);

  // Filters State
  const [showDataDiffFilters, setShowDataDiffFilters] = useState(true);
  const [dataDiffTagFilter, setDataDiffTagFilter] = useState('');
  const [dataDiffFilterMode, setDataDiffFilterMode] = useState('only_diff');

  const [showVersionFilters, setShowVersionFilters] = useState(true);
  const [versionTagFilter, setVersionTagFilter] = useState('');
  const [site1VersionFilter, setSite1VersionFilter] = useState('');
  const [site2VersionFilter, setSite2VersionFilter] = useState('');
  const [versionFilterMode, setVersionFilterMode] = useState('only_diff');

  const [showSite1Filters, setShowSite1Filters] = useState(false);
  const [site1TagFilter, setSite1TagFilter] = useState('');

  const [showSite2Filters, setShowSite2Filters] = useState(false);
  const [site2TagFilter, setSite2TagFilter] = useState('');

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

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  useEffect(() => {
    if (backend_url) setBaseUrl1(backend_url);
    if (backend_url_2) setBaseUrl2(backend_url_2);
  }, [backend_url, backend_url_2]);

  // 1. GET API Handler: /api/get-configuration?diff_tag=
  const fetchConfiguration = useCallback(async (diffTag) => {
    setIsLoading(true);
    showToast(`Fetching configuration for diff_tag="${diffTag}"...`);

    const getUrl1 = `${baseUrl1}/api/get-configuration?diff_tag=${encodeURIComponent(diffTag)}`;
    const getUrl2 = `${baseUrl2}/api/get-configuration?diff_tag=${encodeURIComponent(diffTag)}`;

    try {
      const [res1, res2] = await Promise.allSettled([
        fetch(getUrl1).then((r) => r.json()),
        fetch(getUrl2).then((r) => r.json())
      ]);

      let site1Data = null;
      let site2Data = null;

      if (res1.status === 'fulfilled' && res1.value && res1.value.status_code === 1 && res1.value.data) {
        site1Data = res1.value.data[diffTag] || res1.value.data.datatables_config || res1.value.data;
      }
      if (res2.status === 'fulfilled' && res2.value && res2.value.status_code === 1 && res2.value.data) {
        site2Data = res2.value.data[diffTag] || res2.value.data.datatables_config || res2.value.data;
      }

      if (Array.isArray(site1Data)) setSite1Dataset(site1Data);
      if (Array.isArray(site2Data)) setSite2Dataset(site2Data);

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
    const payload = {
      type: activeOption === 'datatables' ? 'datatables_config' : activeOption,
      unique_column: {
        tag: item.tag,
        version: item.version || item.siteVersion || "1.0",
        bo_type: item.bo_type || ""
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
        showToast(`Synced tag="${item.tag}" successfully!`);
      } else {
        showToast(`PATCH /api/sync-configuration sent for "${item.tag}"`);
      }
    } catch (err) {
      console.error('Sync error:', err);
    }
  };

  // 3. POST API Handler: /api/clone-configuration
  const handleCloneConfiguration = async (item, targetSiteUrl, direction) => {
    const payload = {
      type: activeOption === 'datatables' ? 'datatables_config' : activeOption,
      unique_column: {
        tag: item.tag,
        version: item.version || "1.0",
        bo_type: item.bo_type || ""
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
    const map1 = new Map();
    const map2 = new Map();

    (site1Dataset || []).forEach((item) => map1.set(item.tag, item));
    (site2Dataset || []).forEach((item) => map2.set(item.tag, item));

    const dataDiff = [];
    const versionMismatch = [];
    const onlySite1 = [];
    const onlySite2 = [];

    map1.forEach((item1, tag) => {
      if (map2.has(tag)) {
        const item2 = map2.get(tag);

        if (item1.version && item2.version && item1.version !== item2.version) {
          versionMismatch.push({
            tag,
            site1Version: item1.version,
            site2Version: item2.version,
            datatableDiff: 'View Diff',
            queryDiff: 'View Diff',
            raw1: item1,
            raw2: item2
          });
        }

        const hasStructDiff = item1.datatable_structure !== item2.datatable_structure;
        const hasQueryDiff = item1.datatable_query !== item2.datatable_query;
        const hasOtherDiff = item1.title !== item2.title || item1.status !== item2.status;

        dataDiff.push({
          tag,
          siteVersion: item1.version || item2.version || '1.0',
          datatableDiff: hasStructDiff ? 'View Diff' : 'No Diff',
          queryDiff: hasQueryDiff ? 'View Diff' : 'No Diff',
          hasOtherDiff: hasOtherDiff || true,
          raw1: item1,
          raw2: item2
        });
      } else {
        onlySite1.push({
          tag,
          version: item1.version || '1.0',
          id: item1.id,
          raw: item1
        });
      }
    });

    map2.forEach((item2, tag) => {
      if (!map1.has(tag)) {
        onlySite2.push({
          tag,
          version: item2.version || '1.0',
          id: item2.id,
          raw: item2
        });
      }
    });

    return {
      dataDiffRows: dataDiff,
      versionMismatchRows: versionMismatch,
      onlySite1Rows: onlySite1,
      onlySite2Rows: onlySite2
    };
  }, [site1Dataset, site2Dataset]);

  // Open Diff Modal handler
  const openDiffViewer = (params, fieldType = 'structure') => {
    const raw1 = params.data.raw1 || {};
    const raw2 = params.data.raw2 || {};

    let leftContent = '';
    let rightContent = '';

    if (fieldType === 'query') {
      leftContent = raw1.datatable_query || `SELECT * FROM ${params.data.tag};`;
      rightContent = raw2.datatable_query || `SELECT * FROM ${params.data.tag} WHERE active = 1;`;
    } else if (fieldType === 'other') {
      leftContent = JSON.stringify({
        title: raw1.title || 'Datatable Config',
        status: raw1.status || 'active',
        datatable_menu_link: raw1.datatable_menu_link || params.data.tag,
        created: raw1.created || '1701253281',
        updated: raw1.updated || '1701508133'
      }, null, 2);
      rightContent = JSON.stringify({
        title: raw2.title || 'Datatable Config',
        status: raw2.status || 'active',
        datatable_menu_link: raw2.datatable_menu_link || params.data.tag,
        created: raw2.created || '1682322182',
        updated: raw2.updated || '1701587295'
      }, null, 2);
    } else {
      leftContent = raw1.datatable_structure || JSON.stringify({ form: { layout: 'vertical' }, schema: { type: 'object' } }, null, 2);
      rightContent = raw2.datatable_structure || JSON.stringify({ form: { labelCol: 5, wrapperCol: 12 }, schema: { type: 'object' } }, null, 2);
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

  // Open Data Viewer Modal handler (Image 2 format)
  const openDataViewer = (params) => {
    const raw = params.data.raw || {};
    const formattedData = {
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

  // AG-Grid Cell Renderers
  const datatableDiffRenderer = (params) => {
    if (params.value === 'View Diff') {
      return (
        <button
          onClick={() => openDiffViewer(params, 'structure')}
          className="btn-maroon-outline"
        >
          View Diff
        </button>
      );
    }
    return <span className="text-gray-500 font-normal">{params.value}</span>;
  };

  const queryDiffRenderer = (params) => {
    if (params.value === 'View Diff') {
      return (
        <button
          onClick={() => openDiffViewer(params, 'query')}
          className="btn-maroon-outline"
        >
          View Diff
        </button>
      );
    }
    return <span className="text-gray-500 font-normal">{params.value}</span>;
  };

  const otherDiffRenderer = (params) => {
    return (
      <button
        onClick={() => openDiffViewer(params, 'other')}
        className="btn-gray-outline"
      >
        Other
      </button>
    );
  };

  const siteConfigRenderer = (params) => {
    return (
      <button
        onClick={() => showToast(`Opening config editor for ${params.data.tag}`)}
        className="btn-maroon-outline"
      >
        Edit
      </button>
    );
  };

  const syncDataRenderer = (params) => {
    return (
      <button
        onClick={() => handleSyncConfiguration(params.data.raw1 || params.data, baseUrl2)}
        className="btn-maroon-outline"
      >
        Sync Data
      </button>
    );
  };

  const viewDataRenderer = (params) => {
    return (
      <button
        onClick={() => openDataViewer(params)}
        className="btn-maroon-outline"
      >
        View Data
      </button>
    );
  };

  const copyToRightRenderer = (params) => {
    return (
      <button
        onClick={() => handleCloneConfiguration(params.data.raw || params.data, baseUrl2, 'to_right')}
        className="btn-maroon-outline"
      >
        Copy To Right
      </button>
    );
  };

  const copyToLeftRenderer = (params) => {
    return (
      <button
        onClick={() => handleCloneConfiguration(params.data.raw || params.data, baseUrl1, 'to_left')}
        className="btn-maroon-outline"
      >
        Copy To Left
      </button>
    );
  };

  const versionHighlightRenderer = (params) => {
    return <span className="text-[#800040] font-normal text-sm">{params.value}</span>;
  };

  // AG Grid Column Definitions
  const dataDiffColDefs = useMemo(() => [
    { field: 'tag', headerName: 'TAG', flex: 1.5, cellClass: 'font-normal text-gray-700' },
    { field: 'siteVersion', headerName: 'SITE VERSION', flex: 1 },
    { field: 'datatableDiff', headerName: 'DATATABLE DIFF', flex: 1.2, cellRenderer: datatableDiffRenderer },
    { field: 'queryDiff', headerName: 'QUERY DIFF', flex: 1.2, cellRenderer: queryDiffRenderer },
    { field: 'otherDiff', headerName: 'OTHER DIFF', flex: 1, cellRenderer: otherDiffRenderer },
    { field: 'site1Config', headerName: 'SITE 1 CONFIG', flex: 1, cellRenderer: siteConfigRenderer },
    { field: 'site2Config', headerName: 'SITE 2 CONFIG', flex: 1, cellRenderer: siteConfigRenderer },
    { field: 'syncData', headerName: '', flex: 1.2, cellRenderer: syncDataRenderer },
  ], [baseUrl2]);

  const versionMismatchColDefs = useMemo(() => [
    { field: 'tag', headerName: 'TAG', flex: 2, cellClass: 'font-normal text-gray-700' },
    { field: 'site1Version', headerName: 'SITE1 VERSION', flex: 1.5, cellRenderer: versionHighlightRenderer },
    { field: 'site2Version', headerName: 'SITE2 VERSION', flex: 1.5, cellRenderer: versionHighlightRenderer },
    { field: 'datatableDiff', headerName: 'DATATABLE DIFF', flex: 1.5, cellRenderer: datatableDiffRenderer },
    { field: 'queryDiff', headerName: 'QUERY DIFF', flex: 1.5, cellRenderer: queryDiffRenderer },
  ], []);

  const site1ColDefs = useMemo(() => [
    { field: 'tag', headerName: 'TAG', flex: 2, cellClass: 'font-normal text-[#800040]' },
    { field: 'viewData', headerName: 'VIEW DATA', flex: 1.2, cellRenderer: viewDataRenderer },
  ], []);

  const site2ColDefs = useMemo(() => [
    { field: 'tag', headerName: 'TAG', flex: 2, cellClass: 'font-normal text-[#800040]' },
    { field: 'viewData', headerName: 'VIEW DATA', flex: 1.2, cellRenderer: viewDataRenderer },
  ], []);

  // match-sorter filtering logic
  const filteredDataDiffRows = useMemo(() => {
    let list = dataDiffRows;
    if (dataDiffTagFilter.trim()) {
      list = matchSorter(list, dataDiffTagFilter.trim(), {
        keys: ['tag', 'siteVersion', (item) => item.raw1?.title || ''],
        threshold: matchSorter.rankings.CONTAINS,
      });
    }
    if (dataDiffFilterMode === 'only_diff') {
      list = list.filter((r) => r.datatableDiff !== 'No Diff' || r.queryDiff !== 'No Diff');
    }
    return list;
  }, [dataDiffRows, dataDiffTagFilter, dataDiffFilterMode]);

  const filteredVersionMismatchRows = useMemo(() => {
    let list = versionMismatchRows;
    if (versionTagFilter.trim()) {
      list = matchSorter(list, versionTagFilter.trim(), {
        keys: ['tag', 'site1Version', 'site2Version'],
        threshold: matchSorter.rankings.CONTAINS,
      });
    }
    if (site1VersionFilter.trim()) {
      list = list.filter((r) => r.site1Version.includes(site1VersionFilter.trim()));
    }
    if (site2VersionFilter.trim()) {
      list = list.filter((r) => r.site2Version.includes(site2VersionFilter.trim()));
    }
    return list;
  }, [versionMismatchRows, versionTagFilter, site1VersionFilter, site2VersionFilter]);

  const filteredSite1Rows = useMemo(() => {
    let list = onlySite1Rows;
    if (site1TagFilter.trim()) {
      list = matchSorter(list, site1TagFilter.trim(), { keys: ['tag'] });
    }
    return list;
  }, [onlySite1Rows, site1TagFilter]);

  const filteredSite2Rows = useMemo(() => {
    let list = onlySite2Rows;
    if (site2TagFilter.trim()) {
      list = matchSorter(list, site2TagFilter.trim(), { keys: ['tag'] });
    }
    return list;
  }, [onlySite2Rows, site2TagFilter]);

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col font-sans text-gray-800">
      {/* Header with black bg, logo on right, title middle */}
      <Header />

      {/* Navigation Options Row */}
      <NavigationRow activeOption={activeOption} onSelectOption={handleSelectOption} />

      {/* Toast Notification Banner */}
      {notification && (
        <div className="fixed top-16 right-6 z-50 bg-[#7a1c4b] text-white px-4 py-2 rounded shadow-lg text-sm flex items-center space-x-2 animate-bounce">
          <span>ℹ️</span>
          <span>{notification}</span>
        </div>
      )}

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

        {/* SECTION B: DATA DIFF */}
        <section className="bg-white rounded-lg p-5">
          <div className="flex items-center justify-between border-b pb-2 mb-4">
            <div className="w-1/3"></div>
            <h3 className="text-center text-sm font-bold text-gray-700 uppercase tracking-wider w-1/3">
              DATA DIFF
            </h3>
            <div className="w-1/3 flex justify-end">
              <button
                onClick={() => setShowDataDiffFilters(!showDataDiffFilters)}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center space-x-1 cursor-pointer transition-colors duration-150 select-none"
              >
                <span>{showDataDiffFilters ? 'Hide filters' : 'Show filters'}</span>
                <span className={`inline-block text-[10px] transform transition-transform duration-300 ease-in-out ${showDataDiffFilters ? 'rotate-0' : 'rotate-180'}`}>▲</span>
              </button>
            </div>
          </div>

          {/* Unconditional Filter Mode Toggle (All vs Only Difference) */}
          <div className="flex justify-end gap-3 mb-3 text-xs">
            <div className="flex items-center border border-gray-300 rounded overflow-hidden">
              <button
                onClick={() => setDataDiffFilterMode('all')}
                className={`px-3 py-1 text-xs font-normal cursor-pointer ${dataDiffFilterMode === 'all'
                  ? 'bg-[#7a1c4b] text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
              >
                All
              </button>
              <button
                onClick={() => setDataDiffFilterMode('only_diff')}
                className={`px-3 py-1 text-xs font-normal cursor-pointer ${dataDiffFilterMode === 'only_diff'
                  ? 'bg-[#7a1c4b] text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
              >
                Only Difference
              </button>
            </div>
          </div>

          {/* AG Grid Table 1 */}
          <AgGridGenerator
            rowData={filteredDataDiffRows}
            columnDefs={dataDiffColDefs}
            showFloatingFilter={showDataDiffFilters}
            height="260px"
          />

          <div className="mt-2 text-xs italic text-red-600 font-normal">
            Filtered Records: {filteredDataDiffRows.length} records | Actual Records: {dataDiffRows.length} records
          </div>
        </section>

        {/* SECTION C: VERSION MISMATCH */}
        <section className="bg-white rounded-lg p-5">
          <div className="flex items-center justify-between border-b pb-2 mb-4">
            <div className="w-1/3"></div>
            <h3 className="text-center text-sm font-bold text-gray-700 uppercase tracking-wider w-1/3">
              VERSION MISMATCH
            </h3>
            <div className="w-1/3 flex justify-end">
              <button
                onClick={() => setShowVersionFilters(!showVersionFilters)}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center space-x-1 cursor-pointer transition-colors duration-150 select-none"
              >
                <span>{showVersionFilters ? 'Hide filters' : 'Show filters'}</span>
                <span className={`inline-block text-[10px] transform transition-transform duration-300 ease-in-out ${showVersionFilters ? 'rotate-0' : 'rotate-180'}`}>▲</span>
              </button>
            </div>
          </div>

          {/* Unconditional Filter Mode Toggle (All vs Only Difference) */}
          <div className="flex justify-end gap-3 mb-3 text-xs">
            <div className="flex items-center border border-gray-300 rounded overflow-hidden">
              <button
                onClick={() => setVersionFilterMode('all')}
                className={`px-3 py-1 text-xs font-normal cursor-pointer ${versionFilterMode === 'all'
                  ? 'bg-[#7a1c4b] text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
              >
                All
              </button>
              <button
                onClick={() => setVersionFilterMode('only_diff')}
                className={`px-3 py-1 text-xs font-normal cursor-pointer ${versionFilterMode === 'only_diff'
                  ? 'bg-[#7a1c4b] text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
              >
                Only Difference
              </button>
            </div>
          </div>

          {/* AG Grid Table 2 */}
          <AgGridGenerator
            rowData={filteredVersionMismatchRows}
            columnDefs={versionMismatchColDefs}
            showFloatingFilter={showVersionFilters}
            height="260px"
          />

          <div className="mt-2 text-xs italic text-red-600 font-normal">
            Filtered Records: {filteredVersionMismatchRows.length} records | Actual Records: {versionMismatchRows.length} records
          </div>
        </section>

        {/* SECTION D: SIDE-BY-SIDE ONLY SITE 1 & ONLY SITE 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Left Side: ONLY SITE 1 DATATABLES */}
          <section className="bg-white rounded-lg p-5">
            <div className="flex items-center justify-between border-b pb-2 mb-1">
              <div className="w-1/4"></div>
              <div className="text-center w-2/4">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                  ONLY SITE 1 DATATABLES
                </h3>
                <a
                  href={baseUrl1}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-600 hover:underline font-normal block truncate max-w-xs mx-auto"
                >
                  {baseUrl1}
                </a>
              </div>
              <div className="w-1/4 flex justify-end">
                <button
                  onClick={() => setShowSite1Filters(!showSite1Filters)}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center space-x-1 cursor-pointer transition-colors duration-150 select-none"
                >
                  <span>{showSite1Filters ? 'Hide filters' : 'Show filters'}</span>
                  <span className={`inline-block text-[10px] transform transition-transform duration-300 ease-in-out ${showSite1Filters ? 'rotate-0' : 'rotate-180'}`}>▲</span>
                </button>
              </div>
            </div>

            <div className="mt-4">
              <AgGridGenerator
                rowData={filteredSite1Rows}
                columnDefs={site1ColDefs}
                showFloatingFilter={showSite1Filters}
                height="240px"
              />
            </div>

            <div className="mt-2 text-xs italic text-gray-600 font-normal">
              Total Records: {filteredSite1Rows.length} records
            </div>
          </section>

          {/* Right Side: ONLY SITE 2 DATATABLES */}
          <section className="bg-white rounded-lg p-5">
            <div className="flex items-center justify-between border-b pb-2 mb-1">
              <div className="w-1/4"></div>
              <div className="text-center w-2/4">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                  ONLY SITE 2 DATATABLES
                </h3>
                <a
                  href={baseUrl2}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-600 hover:underline font-normal block truncate max-w-xs mx-auto"
                >
                  {baseUrl2}
                </a>
              </div>
              <div className="w-1/4 flex justify-end">
                <button
                  onClick={() => setShowSite2Filters(!showSite2Filters)}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center space-x-1 cursor-pointer transition-colors duration-150 select-none"
                >
                  <span>{showSite2Filters ? 'Hide filters' : 'Show filters'}</span>
                  <span className={`inline-block text-[10px] transform transition-transform duration-300 ease-in-out ${showSite2Filters ? 'rotate-0' : 'rotate-180'}`}>▲</span>
                </button>
              </div>
            </div>

            <div className="mt-4">
              <AgGridGenerator
                rowData={filteredSite2Rows}
                columnDefs={site2ColDefs}
                showFloatingFilter={showSite2Filters}
                height="240px"
              />
            </div>

            <div className="mt-2 text-xs italic text-gray-600 font-normal">
              Total Records: {filteredSite2Rows.length} records
            </div>
          </section>

        </div>

      </main>

      {/* Diff & Data View Modal (80% width, 70% height, backdrop blur) */}
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
    </div>
  );
};

export default DiffChecker;
