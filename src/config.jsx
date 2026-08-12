import React from 'react';

// Common helper to trim and show tooltip for AG-Grid cells
const renderTrimTooltip = (val, maxChar = 27) => {
  if (val === null || val === undefined || val === '') return '';
  let str = '';
  if (typeof val === 'object') {
    if (typeof val.tag === 'string') {
      str = val.tag;
    } else if (typeof val.label === 'string') {
      str = val.label;
    } else if (typeof val.name === 'string') {
      str = val.name;
    } else {
      try {
        str = JSON.stringify(val);
      } catch {
        str = String(val);
      }
    }
  } else {
    str = String(val);
  }

  if (!str) return '';
  if (str.length <= maxChar) return str;
  return (
    <span title={str}>
      {str.substring(0, maxChar)}...
    </span>
  );
};

export const CONFIGS = {
  datatables: {
    apiKey: 'datatables',
    leftDataKey: 'datatable_structure',
    rightDataKey: 'datatable_structure',
    hasVersionMismatch: true,
    compare: (site1Dataset, site2Dataset) => {
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
              datatableDiff: item1.datatable_structure !== item2.datatable_structure ? 'View Diff' : 'No Diff',
              queryDiff: item1.datatable_query !== item2.datatable_query ? 'View Diff' : 'No Diff',
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
            otherDiff: 'View Diff',
            hasOtherDiff,
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
            tag: item2.tag || tag,
            version: item2.version || '1.0',
            id: item2.id,
            raw: item2
          });
        }
      });

      return { dataDiff, versionMismatch, onlySite1, onlySite2 };
    },
    getColumns: ({ openDiffViewer, openDataViewer, handleSyncConfiguration, handleCloneConfiguration, showToast, baseUrl1, baseUrl2 }) => {
      return {
        dataDiffColDefs: [
          { field: 'tag', headerName: 'TAG', flex: 1.5, cellClass: 'font-normal text-gray-700', cellRenderer: (params) => renderTrimTooltip(params.value, 35) },
          { field: 'siteVersion', headerName: 'SITE VERSION', flex: 1 },
          {
            field: 'datatableDiff',
            headerName: 'DATATABLE DIFF',
            flex: 1.2,
            cellRenderer: (params) => params.value === 'View Diff' ? (
              <button onClick={() => openDiffViewer(params, 'structure')} className="btn-gray">View Diff</button>
            ) : <span className="text-gray-500 font-normal">{params.value}</span>
          },
          {
            field: 'queryDiff',
            headerName: 'QUERY DIFF',
            flex: 1.2,
            cellRenderer: (params) => params.value === 'View Diff' ? (
              <button onClick={() => openDiffViewer(params, 'query')} className="btn-gray">View Diff</button>
            ) : <span className="text-gray-500 font-normal">{params.value}</span>
          },
          {
            field: 'otherDiff',
            headerName: 'OTHER DIFF',
            flex: 1,
            cellRenderer: (params) => (
              <button onClick={() => openDiffViewer(params, 'other')} className="btn-gray">Other</button>
            )
          },
          {
            field: 'site1Config',
            headerName: 'SITE 1 CONFIG',
            flex: 1,
            cellRenderer: (params) => (
              <button onClick={() => showToast(`Opening config editor for ${params.data.tag}`)} className="btn-purple">Edit</button>
            )
          },
          {
            field: 'site2Config',
            headerName: 'SITE 2 CONFIG',
            flex: 1,
            cellRenderer: (params) => (
              <button onClick={() => showToast(`Opening config editor for ${params.data.tag}`)} className="btn-purple">Edit</button>
            )
          },
          {
            field: 'syncData',
            headerName: '',
            flex: 1.2,
            cellRenderer: (params) => (
              <button onClick={() => handleSyncConfiguration(params.data, baseUrl2)} className="btn-purple">Sync Data</button>
            )
          }
        ],
        versionMismatchColDefs: [
          { field: 'tag', headerName: 'TAG', flex: 2, cellClass: 'font-normal text-gray-700', cellRenderer: (params) => renderTrimTooltip(params.value, 35) },
          { field: 'site1Version', headerName: 'SITE1 VERSION', flex: 1.5, cellRenderer: (params) => <span className="text-[#800040] font-normal text-sm">{params.value}</span> },
          { field: 'site2Version', headerName: 'SITE2 VERSION', flex: 1.5, cellRenderer: (params) => <span className="text-[#800040] font-normal text-sm">{params.value}</span> },
          {
            field: 'datatableDiff',
            headerName: 'DATATABLE DIFF',
            flex: 1.5,
            cellRenderer: (params) => params.value === 'View Diff' ? (
              <button onClick={() => openDiffViewer(params, 'structure')} className="btn-gray">View Diff</button>
            ) : <span className="text-gray-500 font-normal">{params.value}</span>
          },
          {
            field: 'queryDiff',
            headerName: 'QUERY DIFF',
            flex: 1.5,
            cellRenderer: (params) => params.value === 'View Diff' ? (
              <button onClick={() => openDiffViewer(params, 'query')} className="btn-gray">View Diff</button>
            ) : <span className="text-gray-500 font-normal">{params.value}</span>
          }
        ],
        site1ColDefs: [
          { field: 'tag', headerName: 'TAG', flex: 2, cellClass: 'font-normal text-[#800040]', cellRenderer: (params) => renderTrimTooltip(params.value, 35) },
          {
            field: 'viewData',
            headerName: 'VIEW DATA',
            flex: 1.2,
            cellRenderer: (params) => (
              <button onClick={() => openDataViewer(params)} className="btn-gray">View Data</button>
            )
          },
          {
            field: 'syncData',
            headerName: '',
            flex: 1.2,
            cellRenderer: (params) => (
              <button onClick={() => handleCloneConfiguration(params.data.raw, baseUrl2, 'to_right')} className="btn-gray">Copy to Right</button>
            )
          }
        ],
        site2ColDefs: [
          { field: 'tag', headerName: 'TAG', flex: 2, cellClass: 'font-normal text-[#800040]', cellRenderer: (params) => renderTrimTooltip(params.value, 35) },
          {
            field: 'viewData',
            headerName: 'VIEW DATA',
            flex: 1.2,
            cellRenderer: (params) => (
              <button onClick={() => openDataViewer(params)} className="btn-gray">View Data</button>
            )
          },
          {
            field: 'syncData',
            headerName: '',
            flex: 1.2,
            cellRenderer: (params) => (
              <button onClick={() => handleCloneConfiguration(params.data.raw, baseUrl1, 'to_left')} className="btn-gray">Copy to Left</button>
            )
          }
        ]
      };
    }
  },

  attachment_tag_list: {
    apiKey: 'bo_attachment_tagging',
    leftDataKey: 'attachment',
    rightDataKey: 'attachment',
    hasVersionMismatch: false,
    compare: (site1Dataset, site2Dataset) => {
      const map1 = site1Dataset || [];
      const map2 = site2Dataset || [];

      const dataDiff = [];
      const onlySite1 = [];
      const onlySite2 = [];

      map1.forEach((record1) => {
        const record2 = map2.find(
          (record) =>
            record.tag_name?.trim() === record1.tag_name?.trim() &&
            record.bo_type === record1.bo_type
        );

        if (record2 !== undefined) {
          const clean1 = Object.fromEntries(
            Object.entries(record1).filter(
              ([key]) =>
                !["tag_name", "bo_type", "created_by", "updated_by", "updated", "created"].includes(key)
            )
          );
          const clean2 = Object.fromEntries(
            Object.entries(record2).filter(
              ([key]) =>
                !["tag_name", "bo_type", "created_by", "updated_by", "updated", "created"].includes(key)
            )
          );

          const hasDiff = JSON.stringify(clean1) !== JSON.stringify(clean2);

          dataDiff.push({
            tag: record1.tag_name?.trim(),
            bo_type: record1.bo_type?.trim() || '',
            msg_diff: hasDiff ? "Diff Changes" : "No change",
            display_msg_diff: hasDiff ? "View Diff" : "No diff",
            raw1: record1,
            raw2: record2
          });
        } else {
          onlySite1.push({
            tag: record1.tag_name?.trim(),
            bo_type: record1.bo_type?.trim() || '',
            task_names: record1.task_names || "",
            id: record1.id,
            raw: record1
          });
        }
      });

      map2.forEach((record2) => {
        const record1 = map1.find(
          (record) =>
            record.tag_name?.trim() === record2.tag_name?.trim() &&
            record.bo_type === record2.bo_type
        );

        if (record1 === undefined) {
          onlySite2.push({
            tag: record2.tag_name?.trim(),
            bo_type: record2.bo_type?.trim() || '',
            task_names: record2.task_names || "",
            id: record2.id,
            raw: record2
          });
        }
      });

      return { dataDiff, versionMismatch: [], onlySite1, onlySite2 };
    },
    getColumns: ({ openDiffViewer, openDataViewer, handleSyncConfiguration, handleCloneConfiguration, showToast, baseUrl1, baseUrl2 }) => {
      return {
        dataDiffColDefs: [
          { field: 'tag', headerName: 'TAG', flex: 1.5, cellClass: 'font-normal text-gray-700', cellRenderer: (params) => renderTrimTooltip(params.value, 35) },
          { field: 'bo_type', headerName: 'BO TYPE', flex: 1 },
          {
            field: 'display_msg_diff',
            headerName: 'DISPLAY MSG',
            flex: 1.2,
            cellRenderer: (params) => params.value === 'View Diff' ? (
              <button onClick={() => openDiffViewer(params, 'other')} className="btn-gray">View Diff</button>
            ) : <span className="text-gray-500 font-normal">{params.value}</span>
          },
          {
            field: 'syncData',
            headerName: '',
            flex: 1.2,
            cellRenderer: (params) => (
              <button onClick={() => handleSyncConfiguration(params.data, baseUrl2)} className="btn-purple">Sync Data</button>
            )
          }
        ],
        site1ColDefs: [
          { field: 'tag', headerName: 'TAG', flex: 2, cellClass: 'font-normal text-[#800040]', cellRenderer: (params) => renderTrimTooltip(params.value, 35) },
          { field: 'bo_type', headerName: 'BO TYPE', flex: 1 },
          { field: 'task_names', headerName: 'TASK NAMES', flex: 1.5, cellRenderer: (params) => renderTrimTooltip(params.value, 20) },
          {
            field: 'viewData',
            headerName: 'VIEW DATA',
            flex: 1.2,
            cellRenderer: (params) => (
              <button onClick={() => openDataViewer(params)} className="btn-gray">View Data</button>
            )
          },
          {
            field: 'syncData',
            headerName: '',
            flex: 1.2,
            cellRenderer: (params) => (
              <button onClick={() => handleCloneConfiguration(params.data.raw, baseUrl2, 'to_right')} className="btn-gray">Copy to Right</button>
            )
          }
        ],
        site2ColDefs: [
          { field: 'tag', headerName: 'TAG', flex: 2, cellClass: 'font-normal text-[#800040]', cellRenderer: (params) => renderTrimTooltip(params.value, 35) },
          { field: 'bo_type', headerName: 'BO TYPE', flex: 1 },
          { field: 'task_names', headerName: 'TASK NAMES', flex: 1.5, cellRenderer: (params) => renderTrimTooltip(params.value, 20) },
          {
            field: 'viewData',
            headerName: 'VIEW DATA',
            flex: 1.2,
            cellRenderer: (params) => (
              <button onClick={() => openDataViewer(params)} className="btn-gray">View Data</button>
            )
          },
          {
            field: 'syncData',
            headerName: '',
            flex: 1.2,
            cellRenderer: (params) => (
              <button onClick={() => handleCloneConfiguration(params.data.raw, baseUrl1, 'to_left')} className="btn-gray">Copy to Left</button>
            )
          }
        ]
      };
    }
  },

  custom_form: {
    apiKey: 'custom_form',
    leftDataKey: 'form_structure',
    rightDataKey: 'form_structure',
    hasVersionMismatch: true,
    compare: (site1Dataset, site2Dataset) => {
      const dataDiff = [];
      const versionMismatch = [];
      const onlySite1 = [];
      const onlySite2 = [];

      const map1 = site1Dataset || [];
      const map2 = site2Dataset || [];

      map1.forEach((record1) => {
        const record2 = map2.find(
          (record) => record.tag === record1.tag && record.version === record1.version
        );

        const non_matched_versions_rec = map2.find(
          (record) => record.tag === record1.tag && record.version !== record1.version
        );

        if (non_matched_versions_rec !== undefined) {
          versionMismatch.push({
            rect1id: record1.id,
            rect2id: non_matched_versions_rec.id,
            tag: record1.tag,
            site1Version: record1.version,
            site2Version: non_matched_versions_rec.version,
            dt_status: record1.form_structure === non_matched_versions_rec.form_structure ? "No change" : "Diff Changes",
            datatableDiff: record1.form_structure === non_matched_versions_rec.form_structure ? "No diff" : "View Diff",
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
            rec1version: record1.version,
            rec2version: record2.version,
            rect1id: record1.id,
            rect2id: record2.id,
            dt_status: record1.form_structure === record2.form_structure ? "No change" : "Diff Changes",
            datatableDiff: record1.form_structure === record2.form_structure ? "No Diff" : "View Diff",
            other_diff: hasOtherDiff ? "Diff Changes" : "No change",
            otherDiff: hasOtherDiff ? "View Diff" : "No Diff",
            raw1: record1,
            raw2: record2
          });
        }
      });

      map1.forEach((record1) => {
        if (!map2.some((record2) => record2.tag === record1.tag)) {
          onlySite1.push({
            tag: record1.tag,
            version: record1.version,
            id: record1.id,
            raw: record1
          });
        }
      });

      map2.forEach((record2) => {
        if (!map1.some((record1) => record1.tag === record2.tag)) {
          onlySite2.push({
            tag: record2.tag,
            version: record2.version,
            id: record2.id,
            raw: record2
          });
        }
      });

      return { dataDiff, versionMismatch, onlySite1, onlySite2 };
    },
    getColumns: ({ openDiffViewer, openDataViewer, handleSyncConfiguration, handleCloneConfiguration, showToast, baseUrl1, baseUrl2 }) => {
      const renderEditLink = (url, id, label) => {
        if (!url || !id) return '';
        return (
          <a
            href={`${url}/custom-form-config/edit/${id}`}
            target="_blank"
            rel="noreferrer"
            className="text-[#800040] hover:underline font-semibold"
          >
            {label}
          </a>
        );
      };

      return {
        dataDiffColDefs: [
          { field: 'tag', headerName: 'TAG', flex: 1.5, cellClass: 'font-normal text-gray-700', cellRenderer: (params) => renderEditLink(baseUrl1, params.data.rect1id, params.value) },
          { field: 'siteVersion', headerName: 'SITE VERSION', flex: 1 },
          { field: 'dt_status', headerName: 'CUSTOM FORM DIFF STATUS', flex: 1.5 },
          {
            field: 'datatableDiff',
            headerName: 'CUSTOM FORM DIFF',
            flex: 1.2,
            cellRenderer: (params) => params.value === 'View Diff' ? (
              <button onClick={() => openDiffViewer(params, 'structure')} className="btn-gray">View Diff</button>
            ) : <span className="text-gray-500 font-normal">{params.value}</span>
          },
          { field: 'other_diff', headerName: 'OTHER DIFF STATUS', flex: 1.2 },
          {
            field: 'otherDiff',
            headerName: 'OTHER DIFF',
            flex: 1,
            cellRenderer: (params) => params.value === 'View Diff' ? (
              <button onClick={() => openDiffViewer(params, 'other')} className="btn-gray">Other</button>
            ) : <span className="text-gray-500 font-normal">{params.value}</span>
          },
          {
            field: 'site1Config',
            headerName: 'SITE 1 CONFIG',
            flex: 1,
            cellRenderer: (params) => renderEditLink(baseUrl1, params.data.rect1id, 'Edit')
          },
          {
            field: 'site2Config',
            headerName: 'SITE 2 CONFIG',
            flex: 1,
            cellRenderer: (params) => renderEditLink(baseUrl2, params.data.rect2id, 'Edit')
          },
          {
            field: 'syncData',
            headerName: '',
            flex: 1.2,
            cellRenderer: (params) => (
              <button onClick={() => handleSyncConfiguration(params.data, baseUrl2)} className="btn-purple">Sync Data</button>
            )
          }
        ],
        versionMismatchColDefs: [
          { field: 'tag', headerName: 'TAG', flex: 2, cellClass: 'font-normal text-gray-700', cellRenderer: (params) => renderTrimTooltip(params.value, 35) },
          {
            field: 'site1Version',
            headerName: 'SITE1 VERSION',
            flex: 1.5,
            cellRenderer: (params) => renderEditLink(baseUrl1, params.data.rect1id, params.value)
          },
          {
            field: 'site2Version',
            headerName: 'SITE2 VERSION',
            flex: 1.5,
            cellRenderer: (params) => renderEditLink(baseUrl2, params.data.rect2id, params.value)
          },
          { field: 'dt_status', headerName: 'CUSTOM FORM DIFF STATUS', flex: 1.5 },
          {
            field: 'datatableDiff',
            headerName: 'CUSTOM FORM DIFF',
            flex: 1.5,
            cellRenderer: (params) => params.value === 'View Diff' ? (
              <button onClick={() => openDiffViewer(params, 'structure')} className="btn-gray">View Diff</button>
            ) : <span className="text-gray-500 font-normal">{params.value}</span>
          }
        ],
        site1ColDefs: [
          {
            field: 'tag',
            headerName: 'TAG',
            flex: 2,
            cellClass: 'font-normal text-[#800040]',
            cellRenderer: (params) => renderEditLink(baseUrl1, params.data.id, params.value)
          },
          {
            field: 'viewData',
            headerName: 'VIEW DATA',
            flex: 1.2,
            cellRenderer: (params) => (
              <button onClick={() => openDataViewer(params)} className="btn-gray">View Data</button>
            )
          },
          {
            field: 'syncData',
            headerName: '',
            flex: 1.2,
            cellRenderer: (params) => (
              <button onClick={() => handleCloneConfiguration(params.data.raw, baseUrl2, 'to_right')} className="btn-gray">Copy to Right</button>
            )
          }
        ],
        site2ColDefs: [
          {
            field: 'tag',
            headerName: 'TAG',
            flex: 2,
            cellClass: 'font-normal text-[#800040]',
            cellRenderer: (params) => renderEditLink(baseUrl2, params.data.id, params.value)
          },
          {
            field: 'viewData',
            headerName: 'VIEW DATA',
            flex: 1.2,
            cellRenderer: (params) => (
              <button onClick={() => openDataViewer(params)} className="btn-gray">View Data</button>
            )
          },
          {
            field: 'syncData',
            headerName: '',
            flex: 1.2,
            cellRenderer: (params) => (
              <button onClick={() => handleCloneConfiguration(params.data.raw, baseUrl1, 'to_left')} className="btn-gray">Copy to Left</button>
            )
          }
        ]
      };
    }
  },

  drupal_roles: {
    apiKey: 'drupal_roles',
    leftDataKey: 'tag',
    rightDataKey: 'tag',
    hasVersionMismatch: false,
    compare: (site1Dataset, site2Dataset) => {
      const dataDiff = [];
      const onlySite1 = [];
      const onlySite2 = [];

      const map1 = site1Dataset || {};
      const map2 = site2Dataset || {};

      const keys1 = Object.keys(map1);
      const keys2 = Object.keys(map2);

      keys1.forEach((key) => {
        if (map2.hasOwnProperty(key)) {
          dataDiff.push({
            tag: map1[key],
            raw1: { id: key, tag: map1[key] },
            raw2: { id: key, tag: map2[key] }
          });
        } else {
          onlySite1.push({
            tag: map1[key],
            id: key,
            raw: { id: key, tag: map1[key] }
          });
        }
      });

      keys2.forEach((key) => {
        if (!map1.hasOwnProperty(key)) {
          onlySite2.push({
            tag: map2[key],
            id: key,
            raw: { id: key, tag: map2[key] }
          });
        }
      });

      return { dataDiff, versionMismatch: [], onlySite1, onlySite2 };
    },
    getColumns: ({ openDiffViewer, openDataViewer, handleSyncConfiguration, handleCloneConfiguration, showToast, baseUrl1, baseUrl2 }) => {
      return {
        dataDiffColDefs: [
          { field: 'tag', headerName: 'TAG', flex: 2, cellClass: 'font-normal text-gray-700', cellRenderer: (params) => renderTrimTooltip(params.value, 40) }
        ],
        site1ColDefs: [
          { field: 'tag', headerName: 'TAG', flex: 2, cellClass: 'font-normal text-[#800040]', cellRenderer: (params) => renderTrimTooltip(params.value, 40) },
          {
            field: 'syncData',
            headerName: '',
            flex: 1.2,
            cellRenderer: (params) => (
              <button onClick={() => handleCloneConfiguration(params.data.raw, baseUrl2, 'to_right')} className="btn-gray">Copy to Right</button>
            )
          }
        ],
        site2ColDefs: [
          { field: 'tag', headerName: 'TAG', flex: 2, cellClass: 'font-normal text-[#800040]', cellRenderer: (params) => renderTrimTooltip(params.value, 40) },
          {
            field: 'syncData',
            headerName: '',
            flex: 1.2,
            cellRenderer: (params) => (
              <button onClick={() => handleCloneConfiguration(params.data.raw, baseUrl1, 'to_left')} className="btn-gray">Copy to Left</button>
            )
          }
        ]
      };
    }
  },

  react_menus: {
    apiKey: 'drupalMenues_react-menu',
    leftDataKey: 'other_diff',
    rightDataKey: 'other_diff',
    hasVersionMismatch: false,
    compare: (site1Dataset, site2Dataset) => {
      const dataDiff = [];
      const onlySite1 = [];
      const onlySite2 = [];

      const list1 = Object.values(site1Dataset || {});
      const list2 = Object.values(site2Dataset || {});

      list1.forEach((s1_val) => {
        const s2_val = list2.find((s2) => s2.url === s1_val.url);

        if (s2_val) {
          const clean1 = Object.fromEntries(
            Object.entries(s1_val).filter(([k]) => !["title", "updated", "updated_by", "created", "created_by"].includes(k))
          );
          const clean2 = Object.fromEntries(
            Object.entries(s2_val).filter(([k]) => !["title", "updated", "updated_by", "created", "created_by"].includes(k))
          );

          const hasDiff = JSON.stringify(clean1) !== JSON.stringify(clean2);

          dataDiff.push({
            tag: s1_val.title,
            df_status: hasDiff ? "Diff Changes" : "No change",
            otherDiff: hasDiff ? "View Diff" : "No Diff",
            url: s1_val.url,
            raw1: s1_val,
            raw2: s2_val
          });
        } else {
          onlySite1.push({
            tag: s1_val.title,
            roles: s1_val.roles,
            status: s1_val.status,
            description: s1_val.description,
            raw: s1_val
          });
        }
      });

      list2.forEach((s2_val) => {
        const s1_val = list1.find((s1) => s1.url === s2_val.url);
        if (!s1_val) {
          onlySite2.push({
            tag: s2_val.title,
            roles: s2_val.roles,
            status: s2_val.status,
            description: s2_val.description,
            raw: s2_val
          });
        }
      });

      return { dataDiff, versionMismatch: [], onlySite1, onlySite2 };
    },
    getColumns: ({ openDiffViewer, openDataViewer, handleSyncConfiguration, handleCloneConfiguration, showToast, baseUrl1, baseUrl2 }) => {
      return {
        dataDiffColDefs: [
          { field: 'tag', headerName: 'TAG', flex: 1.5, cellClass: 'font-normal text-gray-700', cellRenderer: (params) => renderTrimTooltip(params.value, 35) },
          { field: 'df_status', headerName: 'ROLES DIFF', flex: 1.5 },
          {
            field: 'otherDiff',
            headerName: 'OTHER DIFF',
            flex: 1.2,
            cellRenderer: (params) => params.value === 'View Diff' ? (
              <button onClick={() => openDiffViewer(params, 'other')} className="btn-gray">Other</button>
            ) : <span className="text-gray-500 font-normal">{params.value}</span>
          }
        ],
        site1ColDefs: [
          { field: 'tag', headerName: 'TAG', flex: 2, cellClass: 'font-normal text-[#800040]', cellRenderer: (params) => renderTrimTooltip(params.value, 35) },
          {
            field: 'viewData',
            headerName: 'VIEW DATA',
            flex: 1.2,
            cellRenderer: (params) => (
              <button onClick={() => openDataViewer(params)} className="btn-gray">View Data</button>
            )
          },
          {
            field: 'syncData',
            headerName: '',
            flex: 1.2,
            cellRenderer: (params) => (
              <button onClick={() => handleCloneConfiguration(params.data.raw, baseUrl2, 'to_right')} className="btn-gray">Copy to Right</button>
            )
          }
        ],
        site2ColDefs: [
          { field: 'tag', headerName: 'TAG', flex: 2, cellClass: 'font-normal text-[#800040]', cellRenderer: (params) => renderTrimTooltip(params.value, 35) },
          {
            field: 'viewData',
            headerName: 'VIEW DATA',
            flex: 1.2,
            cellRenderer: (params) => (
              <button onClick={() => openDataViewer(params)} className="btn-gray">View Data</button>
            )
          },
          {
            field: 'syncData',
            headerName: '',
            flex: 1.2,
            cellRenderer: (params) => (
              <button onClick={() => handleCloneConfiguration(params.data.raw, baseUrl1, 'to_left')} className="btn-gray">Copy to Left</button>
            )
          }
        ]
      };
    }
  },

  master_config: {
    apiKey: 'master_config',
    leftDataKey: 'master_config',
    rightDataKey: 'master_config',
    hasVersionMismatch: false,
    compare: (site1Dataset, site2Dataset) => {
      const dataDiff = [];
      const onlySite1 = [];
      const onlySite2 = [];

      const map1 = site1Dataset || {};
      const map2 = site2Dataset || {};

      for (const key in map1) {
        if (map1.hasOwnProperty(key) && !map2.hasOwnProperty(key) && key !== undefined) {
          onlySite1.push({
            tag: key,
            version: map1[key]?.version,
            sitecount: map1[key]?.data_count || "NA",
            raw: map1[key]
          });
        }
      }

      for (const key in map2) {
        if (map2.hasOwnProperty(key) && !map1.hasOwnProperty(key) && key !== undefined) {
          onlySite2.push({
            tag: key,
            version: map2[key]?.version,
            sitecount: map2[key]?.data_count || "NA",
            raw: map2[key]
          });
        }

        if (map1.hasOwnProperty(key) && map2.hasOwnProperty(key) && key !== undefined) {
          const item1 = map1[key];
          const item2 = map2[key];

          const hasDiff = item1?.config_json !== item2?.config_json;

          dataDiff.push({
            tag: key,
            rec1version: item1?.version,
            rec2version: item2?.version,
            dt_status: hasDiff ? "Diff Changes" : "No change",
            datatableDiff: hasDiff ? "View Diff" : "No Diff",
            site1count: item1?.data_count || "NA",
            site2count: item2?.data_count || "NA",
            raw1: item1,
            raw2: item2
          });
        }
      }

      return { dataDiff, versionMismatch: [], onlySite1, onlySite2 };
    },
    getColumns: ({ openDiffViewer, openDataViewer, handleSyncConfiguration, handleCloneConfiguration, showToast, baseUrl1, baseUrl2 }) => {
      return {
        dataDiffColDefs: [
          { field: 'tag', headerName: 'TAG', flex: 1.5, cellClass: 'font-normal text-gray-700', cellRenderer: (params) => renderTrimTooltip(params.value, 35) },
          { field: 'rec1version', headerName: 'SITE VERSION', flex: 1 },
          { field: 'dt_status', headerName: 'MASTER CONFIG DIFF STATUS', flex: 1.5 },
          {
            field: 'datatableDiff',
            headerName: 'MASTER CONFIG DIFF',
            flex: 1.2,
            cellRenderer: (params) => params.value === 'View Diff' ? (
              <button onClick={() => openDiffViewer(params, 'other')} className="btn-gray">View Diff</button>
            ) : <span className="text-gray-500 font-normal">{params.value}</span>
          },
          { field: 'site1count', headerName: 'SITE 1 COUNT', flex: 1 },
          { field: 'site2count', headerName: 'SITE 2 COUNT', flex: 1 }
        ],
        site1ColDefs: [
          { field: 'tag', headerName: 'TAG', flex: 2, cellClass: 'font-normal text-[#800040]', cellRenderer: (params) => renderTrimTooltip(params.value, 35) },
          { field: 'version', headerName: 'SITE VERSION', flex: 1 },
          { field: 'sitecount', headerName: 'SITE COUNT', flex: 1 },
          {
            field: 'syncData',
            headerName: '',
            flex: 1.2,
            cellRenderer: (params) => (
              <button onClick={() => handleCloneConfiguration(params.data.raw, baseUrl2, 'to_right')} className="btn-gray">Copy to Right</button>
            )
          }
        ],
        site2ColDefs: [
          { field: 'tag', headerName: 'TAG', flex: 2, cellClass: 'font-normal text-[#800040]', cellRenderer: (params) => renderTrimTooltip(params.value, 35) },
          { field: 'version', headerName: 'SITE VERSION', flex: 1 },
          { field: 'sitecount', headerName: 'SITE COUNT', flex: 1 },
          {
            field: 'syncData',
            headerName: '',
            flex: 1.2,
            cellRenderer: (params) => (
              <button onClick={() => handleCloneConfiguration(params.data.raw, baseUrl1, 'to_left')} className="btn-gray">Copy to Left</button>
            )
          }
        ]
      };
    }
  },

  permission_config: {
    apiKey: 'permissions',
    leftDataKey: 'other_diff',
    rightDataKey: 'other_diff',
    hasVersionMismatch: false,
    compare: (site1Dataset, site2Dataset) => {
      const dataDiff = [];
      const onlySite1 = [];
      const onlySite2 = [];

      const map1 = site1Dataset || [];
      const map2 = site2Dataset || [];

      const idsResp1 = new Set(map1.map((obj) => `${obj.module}-${obj.permission}`.trim()));
      const idsResp2 = new Set(map2.map((obj) => `${obj.module}-${obj.permission}`.trim()));

      const similar = map1.filter((obj) => idsResp2.has(`${obj.module}-${obj.permission}`.trim()));

      similar.forEach((ele) => {
        const match = map2.find((item) => `${item.module}-${item.permission}`.trim() === `${ele.module}-${ele.permission}`.trim());

        const clean1 = Object.fromEntries(
          Object.entries(ele).filter(
            ([key]) => !["module", "permission", "permission_label", "updated", "updated_by", "created", "created_by"].includes(key)
          )
        );
        const clean2 = Object.fromEntries(
          Object.entries(match).filter(
            ([key]) => !["module", "permission", "permission_label", "updated", "updated_by", "created", "created_by"].includes(key)
          )
        );

        const hasDiff = JSON.stringify(clean1) !== JSON.stringify(clean2);

        dataDiff.push({
          tag: ele.module,
          permission: ele.permission,
          permission_label: ele.permission_label,
          role_diff_status: hasDiff ? "Diff Changes" : "No change",
          role_diff: hasDiff ? "View Diff" : "No Diff",
          raw1: ele,
          raw2: match
        });
      });

      map1.forEach((ele) => {
        if (!idsResp2.has(`${ele.module}-${ele.permission}`.trim())) {
          onlySite1.push({
            tag: ele.module,
            permission: ele.permission,
            permission_label: ele.permission_label,
            raw: ele
          });
        }
      });

      map2.forEach((ele) => {
        if (!idsResp1.has(`${ele.module}-${ele.permission}`.trim())) {
          onlySite2.push({
            tag: ele.module,
            permission: ele.permission,
            permission_label: ele.permission_label,
            raw: ele
          });
        }
      });

      return { dataDiff, versionMismatch: [], onlySite1, onlySite2 };
    },
    getColumns: ({ openDiffViewer, openDataViewer, handleSyncConfiguration, handleCloneConfiguration, showToast, baseUrl1, baseUrl2 }) => {
      return {
        dataDiffColDefs: [
          { field: 'tag', headerName: 'MODULE', flex: 1.5, cellClass: 'font-normal text-gray-700', cellRenderer: (params) => renderTrimTooltip(params.value, 30) },
          { field: 'permission_label', headerName: 'PERMISSION', flex: 1.5, cellRenderer: (params) => renderTrimTooltip(params.data.permission_label, 30) },
          { field: 'role_diff_status', headerName: 'ROLE DIFF STATUS', flex: 1.5 },
          {
            field: 'role_diff',
            headerName: 'ROLE DIFF',
            flex: 1.2,
            cellRenderer: (params) => params.value === 'View Diff' ? (
              <button onClick={() => openDiffViewer(params, 'other')} className="btn-gray">Show Diff</button>
            ) : <span className="text-gray-500 font-normal">{params.value}</span>
          }
        ],
        site1ColDefs: [
          { field: 'tag', headerName: 'MODULE', flex: 2, cellClass: 'font-normal text-[#800040]', cellRenderer: (params) => renderTrimTooltip(params.value, 30) },
          { field: 'permission_label', headerName: 'PERMISSION', flex: 1.5, cellRenderer: (params) => renderTrimTooltip(params.data.permission_label, 30) },
          {
            field: 'viewData',
            headerName: 'VIEW DATA',
            flex: 1.2,
            cellRenderer: (params) => (
              <button onClick={() => openDataViewer(params)} className="btn-gray">View Data</button>
            )
          }
        ],
        site2ColDefs: [
          { field: 'tag', headerName: 'MODULE', flex: 2, cellClass: 'font-normal text-[#800040]', cellRenderer: (params) => renderTrimTooltip(params.value, 30) },
          { field: 'permission_label', headerName: 'PERMISSION', flex: 1.5, cellRenderer: (params) => renderTrimTooltip(params.data.permission_label, 30) },
          {
            field: 'viewData',
            headerName: 'VIEW DATA',
            flex: 1.2,
            cellRenderer: (params) => (
              <button onClick={() => openDataViewer(params)} className="btn-gray">View Data</button>
            )
          }
        ]
      };
    }
  },

  task_entity: {
    apiKey: 'entity_forms',
    leftDataKey: 'entity_config',
    rightDataKey: 'entity_config',
    hasVersionMismatch: true,
    compare: (site1Dataset, site2Dataset) => {
      const dataDiff = [];
      const versionMismatch = [];
      const onlySite1 = [];
      const onlySite2 = [];

      const map1 = site1Dataset || [];
      const map2 = site2Dataset || [];

      map1.forEach((record1) => {
        const record2 = map2.find(
          (record) => record.entity_type === record1.entity_type && record.entity_version === record1.entity_version
        );

        const non_matched_versions_rec = map2.find(
          (record) => record.entity_type === record1.entity_type && record.entity_version !== record1.entity_version
        );

        if (non_matched_versions_rec !== undefined) {
          versionMismatch.push({
            rect1id: record1.id,
            rect2id: non_matched_versions_rec.id,
            tag: record1.entity_type,
            site1Version: record1.entity_version,
            site2Version: non_matched_versions_rec.entity_version,
            dt_status: record1.entity_config === non_matched_versions_rec.entity_config ? "No change" : "Diff Changes",
            datatableDiff: record1.entity_config === non_matched_versions_rec.entity_config ? "No diff" : "View Diff",
            raw1: record1,
            raw2: non_matched_versions_rec
          });
        }

        if (record2 !== undefined) {
          const clean1 = Object.fromEntries(
            Object.entries(record1).filter(
              ([key]) => !["entity_type", "entity_version", "id", "updated", "updated_by", "created", "created_by"].includes(key)
            )
          );
          const clean2 = Object.fromEntries(
            Object.entries(record2).filter(
              ([key]) => !["entity_type", "entity_version", "id", "updated", "updated_by", "created", "created_by"].includes(key)
            )
          );

          const hasOtherDiff = JSON.stringify(clean1) !== JSON.stringify(clean2);

          dataDiff.push({
            tag: record1.entity_type,
            siteVersion: record1.entity_version,
            rec1version: record1.entity_version,
            rec2version: record2.entity_version,
            rect1id: record1.id,
            rect2id: record2.id,
            dt_status: record1.entity_config === record2.entity_config ? "No change" : "Diff Changes",
            datatableDiff: record1.entity_config === record2.entity_config ? "No Diff" : "View Diff",
            other_diff: hasOtherDiff ? "Diff Changes" : "No change",
            otherDiff: hasOtherDiff ? "View Diff" : "No Diff",
            raw1: record1,
            raw2: record2
          });
        }
      });

      map1.forEach((record1) => {
        if (!map2.some((record2) => record2.entity_type === record1.entity_type)) {
          onlySite1.push({
            tag: record1.entity_type,
            version: record1.entity_version,
            id: record1.id,
            raw: record1
          });
        }
      });

      map2.forEach((record2) => {
        if (!map1.some((record1) => record1.entity_type === record2.entity_type)) {
          onlySite2.push({
            tag: record2.entity_type,
            version: record2.entity_version,
            id: record2.id,
            raw: record2
          });
        }
      });

      return { dataDiff, versionMismatch, onlySite1, onlySite2 };
    },
    getColumns: ({ openDiffViewer, openDataViewer, handleSyncConfiguration, handleCloneConfiguration, showToast, baseUrl1, baseUrl2 }) => {
      const renderEditLink = (url, id, label) => {
        if (!url || !id) return '';
        return (
          <a
            href={`${url}/task-entity-config/edit/${id}`}
            target="_blank"
            rel="noreferrer"
            className="text-[#800040] hover:underline font-semibold"
          >
            {label}
          </a>
        );
      };

      return {
        dataDiffColDefs: [
          { field: 'tag', headerName: 'TAG', flex: 1.5, cellClass: 'font-normal text-gray-700', cellRenderer: (params) => renderEditLink(baseUrl1, params.data.rect1id, params.value) },
          { field: 'siteVersion', headerName: 'SITE VERSION', flex: 1 },
          { field: 'dt_status', headerName: 'TASK ENTITY DIFF STATUS', flex: 1.5 },
          {
            field: 'datatableDiff',
            headerName: 'TASK ENTITY DIFF',
            flex: 1.2,
            cellRenderer: (params) => params.value === 'View Diff' ? (
              <button onClick={() => openDiffViewer(params, 'structure')} className="btn-gray">View Diff</button>
            ) : <span className="text-gray-500 font-normal">{params.value}</span>
          },
          { field: 'other_diff', headerName: 'OTHER DIFF STATUS', flex: 1.2 },
          {
            field: 'otherDiff',
            headerName: 'OTHER DIFF',
            flex: 1,
            cellRenderer: (params) => params.value === 'View Diff' ? (
              <button onClick={() => openDiffViewer(params, 'other')} className="btn-gray">Other</button>
            ) : <span className="text-gray-500 font-normal">{params.value}</span>
          },
          {
            field: 'site1Config',
            headerName: 'SITE 1 CONFIG',
            flex: 1,
            cellRenderer: (params) => renderEditLink(baseUrl1, params.data.rect1id, 'Edit')
          },
          {
            field: 'site2Config',
            headerName: 'SITE 2 CONFIG',
            flex: 1,
            cellRenderer: (params) => renderEditLink(baseUrl2, params.data.rect2id, 'Edit')
          },
          {
            field: 'syncData',
            headerName: '',
            flex: 1.2,
            cellRenderer: (params) => (
              <button onClick={() => handleSyncConfiguration(params.data, baseUrl2)} className="btn-purple">Sync Data</button>
            )
          }
        ],
        versionMismatchColDefs: [
          { field: 'tag', headerName: 'TAG', flex: 2, cellClass: 'font-normal text-gray-700', cellRenderer: (params) => renderTrimTooltip(params.value, 35) },
          {
            field: 'site1Version',
            headerName: 'SITE1 VERSION',
            flex: 1.5,
            cellRenderer: (params) => renderEditLink(baseUrl1, params.data.rect1id, params.value)
          },
          {
            field: 'site2Version',
            headerName: 'SITE2 VERSION',
            flex: 1.5,
            cellRenderer: (params) => renderEditLink(baseUrl2, params.data.rect2id, params.value)
          },
          { field: 'dt_status', headerName: 'TASK ENTITY DIFF STATUS', flex: 1.5 },
          {
            field: 'datatableDiff',
            headerName: 'TASK ENTITY DIFF',
            flex: 1.5,
            cellRenderer: (params) => params.value === 'View Diff' ? (
              <button onClick={() => openDiffViewer(params, 'structure')} className="btn-gray">View Diff</button>
            ) : <span className="text-gray-500 font-normal">{params.value}</span>
          }
        ],
        site1ColDefs: [
          {
            field: 'tag',
            headerName: 'TAG',
            flex: 2,
            cellClass: 'font-normal text-[#800040]',
            cellRenderer: (params) => renderEditLink(baseUrl1, params.data.id, params.value)
          },
          {
            field: 'viewData',
            headerName: 'VIEW DATA',
            flex: 1.2,
            cellRenderer: (params) => (
              <button onClick={() => openDataViewer(params)} className="btn-gray">View Data</button>
            )
          },
          {
            field: 'syncData',
            headerName: '',
            flex: 1.2,
            cellRenderer: (params) => (
              <button onClick={() => handleCloneConfiguration(params.data.raw, baseUrl2, 'to_right')} className="btn-gray">Copy to Right</button>
            )
          }
        ],
        site2ColDefs: [
          {
            field: 'tag',
            headerName: 'TAG',
            flex: 2,
            cellClass: 'font-normal text-[#800040]',
            cellRenderer: (params) => renderEditLink(baseUrl2, params.data.id, params.value)
          },
          {
            field: 'viewData',
            headerName: 'VIEW DATA',
            flex: 1.2,
            cellRenderer: (params) => (
              <button onClick={() => openDataViewer(params)} className="btn-gray">View Data</button>
            )
          },
          {
            field: 'syncData',
            headerName: '',
            flex: 1.2,
            cellRenderer: (params) => (
              <button onClick={() => handleCloneConfiguration(params.data.raw, baseUrl1, 'to_left')} className="btn-gray">Copy to Left</button>
            )
          }
        ]
      };
    }
  },

  subtask_master: {
    apiKey: 'subtask_master',
    leftDataKey: 'subtask_master',
    rightDataKey: 'subtask_master',
    hasVersionMismatch: false,
    hasOnlySiteTables: false,
    compare: (site1Dataset, site2Dataset) => {
      const countDuplicates = (array) => {
        const counts = {};
        (array || []).forEach((obj) => {
          if (!obj.wf_code || !obj.task_name) return;
          const key = `${obj.wf_code.trim()}-${obj.task_name.trim()}`;
          counts[key] = (counts[key] || 0) + 1;
        });
        return counts;
      };

      const left_counts = countDuplicates(site1Dataset);
      const right_counts = countDuplicates(site2Dataset);

      const dataDiff = [];
      const seen = new Set();

      const processArray = (arr) => {
        (arr || []).forEach((obj) => {
          if (!obj.wf_code || !obj.task_name) return;
          const key = `${obj.wf_code.trim()}-${obj.task_name.trim()}`;
          if (!seen.has(key)) {
            dataDiff.push({
              wf_code: obj.wf_code.trim(),
              task_name: obj.task_name.trim(),
              countSite1: left_counts[key] || 0,
              countSite2: right_counts[key] || 0,
              raw1: obj,
              raw2: obj
            });
            seen.add(key);
          }
        });
      };

      processArray(site1Dataset);
      processArray(site2Dataset);

      return { dataDiff, versionMismatch: [], onlySite1: [], onlySite2: [] };
    },
    getColumns: () => {
      return {
        dataDiffColDefs: [
          { field: 'task_name', headerName: 'TASK NAME', flex: 1.5, cellClass: 'font-normal text-gray-700', cellRenderer: (params) => renderTrimTooltip(params.value, 40) },
          { field: 'wf_code', headerName: 'WORKFLOW CODE', flex: 1.5, cellRenderer: (params) => renderTrimTooltip(params.value, 40) },
          { field: 'countSite1', headerName: 'SITE1 COUNT', flex: 1 },
          { field: 'countSite2', headerName: 'SITE2 COUNT', flex: 1 }
        ],
        site1ColDefs: [],
        site2ColDefs: []
      };
    }
  },

  dropdown_config: {
    apiKey: 'dropdown',
    leftDataKey: 'dropdown_query',
    rightDataKey: 'dropdown_query',
    hasVersionMismatch: false,
    hasOnlySiteTables: false,
    hasNonMatchTable: true,
    compare: (site1Dataset, site2Dataset) => {
      const dataDiff = [];
      const nonMatch = [];

      const map1 = site1Dataset || [];
      const map2 = site2Dataset || [];

      map1.forEach((record1) => {
        const record2 = map2.find((o) => o.tag === record1.tag);

        if (record2) {
          const hasDiff = record1.dropdown_query !== record2.dropdown_query;
          dataDiff.push({
            tag: record1.tag,
            rec1version: record1.version,
            rec2version: record2.version,
            query_status: hasDiff ? "Diff Changes" : "No change",
            dropdown_query: record1.dropdown_query,
            raw1: record1,
            raw2: record2
          });
        } else {
          nonMatch.push({
            tag: record1.tag,
            rec1version: record1.version,
            query_status: "No Match",
            query: record1.dropdown_query,
            raw: record1
          });
        }
      });

      map2.forEach((record2) => {
        const record1 = map1.find((o) => o.tag === record2.tag);
        if (!record1) {
          nonMatch.push({
            tag: record2.tag,
            rec1version: record2.version,
            query_status: "No Match",
            query: record2.dropdown_query,
            raw: record2
          });
        }
      });

      return { dataDiff, versionMismatch: [], onlySite1: nonMatch, onlySite2: [] };
    },
    getColumns: ({ openDiffViewer, openDataViewer }) => {
      return {
        dataDiffColDefs: [
          { field: 'tag', headerName: 'TAG', flex: 1.5, cellClass: 'font-normal text-gray-700', cellRenderer: (params) => renderTrimTooltip(params.value, 35) },
          { field: 'rec1version', headerName: 'SITE VERSION', flex: 1 },
          { field: 'query_status', headerName: 'QUERY DIFF STATUS', flex: 1.5 },
          {
            field: 'query_diff',
            headerName: 'QUERY DIFF',
            flex: 1.2,
            cellRenderer: (params) => params.data.query_status === 'Diff Changes' ? (
              <button onClick={() => openDiffViewer(params, 'structure')} className="btn-gray">View Diff</button>
            ) : <span className="text-gray-500 font-normal">{params.data.query_status === 'No change' ? 'No diff' : ''}</span>
          }
        ],
        site1ColDefs: [
          { field: 'tag', headerName: 'TAG', flex: 2, cellClass: 'font-normal text-[#800040]', cellRenderer: (params) => renderTrimTooltip(params.value, 35) },
          { field: 'rec1version', headerName: 'SITE VERSION', flex: 1 },
          {
            field: 'view_query',
            headerName: 'VIEW QUERY',
            flex: 1.2,
            cellRenderer: (params) => (
              <button onClick={() => openDataViewer({ data: { tag: params.data.tag, raw: { query: params.data.query } } })} className="btn-gray">View</button>
            )
          }
        ],
        site2ColDefs: []
      };
    }
  },

  role_department_list: {
    apiKey: 'role_department_list',
    leftDataKey: 'attachment',
    rightDataKey: 'attachment',
    hasVersionMismatch: false,
    compare: (site1Dataset, site2Dataset) => {
      const dataDiff = [];
      const onlySite1 = [];
      const onlySite2 = [];

      const map1 = site1Dataset || [];
      const map2 = site2Dataset || [];

      map1.forEach((record1) => {
        const record2 = map2.find((r) => r.role?.trim() === record1.role?.trim());

        if (record2) {
          const clean1 = Object.fromEntries(Object.entries(record1).filter(([k]) => !["updated", "updated_by", "created", "created_by"].includes(k)));
          const clean2 = Object.fromEntries(Object.entries(record2).filter(([k]) => !["updated", "updated_by", "created", "created_by"].includes(k)));
          const hasDiff = JSON.stringify(clean1) !== JSON.stringify(clean2);

          dataDiff.push({
            tag: record1.role?.trim(),
            role_diff_status: hasDiff ? "Diff Changes" : "No change",
            view_role_diff: hasDiff ? "View Diff" : "No diff",
            raw1: record1,
            raw2: record2
          });
        } else {
          onlySite1.push({
            tag: record1.role?.trim(),
            raw: record1
          });
        }
      });

      map2.forEach((record2) => {
        const record1 = map1.find((r) => r.role?.trim() === record2.role?.trim());
        if (!record1) {
          onlySite2.push({
            tag: record2.role?.trim(),
            raw: record2
          });
        }
      });

      return { dataDiff, versionMismatch: [], onlySite1, onlySite2 };
    },
    getColumns: ({ openDiffViewer, openDataViewer, handleCloneConfiguration, baseUrl1, baseUrl2 }) => {
      return {
        dataDiffColDefs: [
          { field: 'tag', headerName: 'TAG', flex: 1.5, cellClass: 'font-normal text-gray-700', cellRenderer: (params) => renderTrimTooltip(params.value, 35) },
          { field: 'role_diff_status', headerName: 'ROLE DIFF STATUS', flex: 1.5 },
          {
            field: 'view_role_diff',
            headerName: 'VIEW ROLE DIFF',
            flex: 1.2,
            cellRenderer: (params) => params.value === 'View Diff' ? (
              <button onClick={() => openDiffViewer(params, 'other')} className="btn-gray">View Diff</button>
            ) : <span className="text-gray-500 font-normal">{params.value}</span>
          }
        ],
        site1ColDefs: [
          { field: 'tag', headerName: 'ROLE', flex: 2, cellClass: 'font-normal text-[#800040]', cellRenderer: (params) => renderTrimTooltip(params.value, 35) },
          {
            field: 'viewData',
            headerName: 'VIEW DATA',
            flex: 1.2,
            cellRenderer: (params) => (
              <button onClick={() => openDataViewer(params)} className="btn-gray">View Data</button>
            )
          },
          {
            field: 'syncData',
            headerName: '',
            flex: 1.2,
            cellRenderer: (params) => (
              <button onClick={() => handleCloneConfiguration(params.data.raw, baseUrl2, 'to_right')} className="btn-gray">Copy to Right</button>
            )
          }
        ],
        site2ColDefs: [
          { field: 'tag', headerName: 'TAG', flex: 2, cellClass: 'font-normal text-[#800040]', cellRenderer: (params) => renderTrimTooltip(params.value, 35) },
          {
            field: 'viewData',
            headerName: 'VIEW DATA',
            flex: 1.2,
            cellRenderer: (params) => (
              <button onClick={() => openDataViewer(params)} className="btn-gray">View Data</button>
            )
          },
          {
            field: 'syncData',
            headerName: '',
            flex: 1.2,
            cellRenderer: (params) => (
              <button onClick={() => handleCloneConfiguration(params.data.raw, baseUrl1, 'to_left')} className="btn-gray">Copy to Left</button>
            )
          }
        ]
      };
    }
  },

  workflow_config: {
    apiKey: 'workflow',
    leftDataKey: 'wf_json',
    rightDataKey: 'wf_json',
    hasVersionMismatch: false,
    compare: (site1Dataset, site2Dataset) => {
      const dataDiff = [];
      const onlySite1 = [];
      const onlySite2 = [];

      const map1 = site1Dataset || [];
      const map2 = site2Dataset || [];

      map1.forEach((record1) => {
        const record2 = map2.find((r) => r.wf_code === record1.wf_code);

        if (record2) {
          const hasDiff = record1.wf_json !== record2.wf_json;

          dataDiff.push({
            tag: record1.wf_name,
            rect1id: record1.wf_id,
            rect2id: record2.wf_id,
            wf_status: hasDiff ? "Diff Changes" : "No change",
            datatableDiff: hasDiff ? "View Diff" : "No Diff",
            version_site1: record1.version,
            version_site2: record2.version,
            raw1: record1,
            raw2: record2
          });
        } else {
          onlySite1.push({
            tag: record1.wf_code,
            wf_id: record1.wf_id,
            version: record1.version,
            raw: record1
          });
        }
      });

      map2.forEach((record2) => {
        const record1 = map1.find((r) => r.wf_code === record2.wf_code);
        if (!record1) {
          onlySite2.push({
            tag: record2.wf_code,
            wf_id: record2.wf_id,
            version: record2.version,
            raw: record2
          });
        }
      });

      return { dataDiff, versionMismatch: [], onlySite1, onlySite2 };
    },
    getColumns: ({ openDiffViewer, openDataViewer, baseUrl1, baseUrl2 }) => {
      const renderEditLink = (url, id, label) => {
        if (!url || !id) return '';
        return (
          <a
            href={`${url}/workflow-config/edit/${id}`}
            target="_blank"
            rel="noreferrer"
            className="text-[#800040] hover:underline font-semibold"
          >
            {label}
          </a>
        );
      };

      return {
        dataDiffColDefs: [
          { field: 'tag', headerName: 'TAG', flex: 1.5, cellClass: 'font-normal text-gray-700', cellRenderer: (params) => renderTrimTooltip(params.value, 35) },
          { field: 'wf_status', headerName: 'MASTER CONFIG DIFF STATUS', flex: 1.5 },
          {
            field: 'datatableDiff',
            headerName: 'MASTER CONFIG DIFF',
            flex: 1.2,
            cellRenderer: (params) => params.value === 'View Diff' ? (
              <button onClick={() => openDiffViewer(params, 'structure')} className="btn-gray">View Diff</button>
            ) : <span className="text-gray-500 font-normal">{params.value}</span>
          },
          {
            field: 'version_site1',
            headerName: 'SITE1 VERSION',
            flex: 1.2,
            cellRenderer: (params) => renderEditLink(baseUrl1, params.data.rect1id, params.value)
          },
          {
            field: 'version_site2',
            headerName: 'SITE2 VERSION',
            flex: 1.2,
            cellRenderer: (params) => renderEditLink(baseUrl2, params.data.rect2id, params.value)
          }
        ],
        site1ColDefs: [
          { field: 'tag', headerName: 'TAG', flex: 2, cellClass: 'font-normal text-[#800040]', cellRenderer: (params) => renderTrimTooltip(params.value, 35) },
          {
            field: 'version',
            headerName: 'SITE1 VERSION',
            flex: 1.2,
            cellRenderer: (params) => renderEditLink(baseUrl1, params.data.wf_id, params.value)
          },
          {
            field: 'viewData',
            headerName: 'VIEW DATA',
            flex: 1.2,
            cellRenderer: (params) => (
              <button onClick={() => openDataViewer({ data: { tag: params.data.tag, raw: JSON.parse(params.data.raw.wf_json || '{}') } })} className="btn-gray">View Data</button>
            )
          }
        ],
        site2ColDefs: [
          { field: 'tag', headerName: 'TAG', flex: 2, cellClass: 'font-normal text-[#800040]', cellRenderer: (params) => renderTrimTooltip(params.value, 35) },
          {
            field: 'version',
            headerName: 'SITE2 VERSION',
            flex: 1.2,
            cellRenderer: (params) => renderEditLink(baseUrl2, params.data.wf_id, params.value)
          },
          {
            field: 'viewData',
            headerName: 'VIEW DATA',
            flex: 1.2,
            cellRenderer: (params) => (
              <button onClick={() => openDataViewer({ data: { tag: params.data.tag, raw: JSON.parse(params.data.raw.wf_json || '{}') } })} className="btn-gray">View Data</button>
            )
          }
        ]
      };
    }
  },

  templates: {
    apiKey: 'input_file_tagging',
    leftDataKey: 'templates',
    rightDataKey: 'templates',
    hasVersionMismatch: false,
    compare: (site1Dataset, site2Dataset) => {
      const dataDiff = [];
      const onlySite1 = [];
      const onlySite2 = [];

      const map1 = site1Dataset || [];
      const map2 = site2Dataset || [];

      const tagsIn1 = new Set(map1.map((obj) => obj.tag_name?.trim()).filter(Boolean));
      const tagsIn2 = new Set(map2.map((obj) => obj.tag_name?.trim()).filter(Boolean));

      const parseCSVLine = (line) => {
        const result = [];
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

      const parseCSVToCleanedArray = (base64Str) => {
        if (!base64Str) return [];
        try {
          const decodedText = atob(base64Str);
          const lines = decodedText.split(/\r?\n/).filter((line) => line.trim() !== "");
          if (lines.length === 0) return [];
          return parseCSVLine(lines[0]);
        } catch (error) {
          return [];
        }
      };

      const parseValidatorJson = (jsonStr) => {
        if (!jsonStr) return {};
        try { return JSON.parse(jsonStr); } catch (e) { return {}; }
      };

      const filterRecord = (rec) => {
        const filtered = Object.fromEntries(
          Object.entries(rec).filter(
            ([key]) => !["tag_name", "tag_id", "template_id", "created_by", "updated_by", "updated", "created"].includes(key)
          )
        );
        if (filtered.file_base64) {
          filtered.file_base64 = parseCSVToCleanedArray(filtered.file_base64);
        }
        return filtered;
      };

      map1.forEach((record1) => {
        if (!record1.tag_name) return;
        const tag1 = record1.tag_name.trim();

        const record2Exact = map2.find(
          (record) => record.tag_name?.trim() === tag1 && record.version === record1.version
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
              task_names: record1.task_names || "",
              raw: record1
            });
          }
        }
      });

      map2.forEach((record2) => {
        if (!record2.tag_name) return;
        const tag2 = record2.tag_name.trim();
        if (!tagsIn1.has(tag2)) {
          onlySite2.push({
            tag: tag2,
            bo_type: (record2.business_unit || "").trim(),
            task_names: record2.task_names || "",
            raw: record2
          });
        }
      });

      return { dataDiff, versionMismatch: [], onlySite1, onlySite2 };
    },
    getColumns: ({ openDiffViewer, openDataViewer, handleSyncConfiguration, handleCloneConfiguration, baseUrl1, baseUrl2 }) => {
      return {
        dataDiffColDefs: [
          { field: 'tag', headerName: 'TAG', flex: 1.5, cellClass: 'font-normal text-gray-700', cellRenderer: (params) => renderTrimTooltip(params.value, 35) },
          { field: 'bo_type', headerName: 'BO TYPE', flex: 1 },
          {
            field: 'excel_diff',
            headerName: 'EXCEL DIFF',
            flex: 1.2,
            cellRenderer: (params) => params.value === 'View Diff' ? (
              <button onClick={() => openDiffViewer(params, 'excel')} className="btn-gray">View Diff</button>
            ) : <span className="text-gray-500 font-normal">{params.value}</span>
          },
          {
            field: 'validator_diff',
            headerName: 'VALIDATOR DIFF',
            flex: 1.2,
            cellRenderer: (params) => params.value === 'View Diff' ? (
              <button onClick={() => openDiffViewer(params, 'validator')} className="btn-gray">View Diff</button>
            ) : <span className="text-gray-500 font-normal">{params.value}</span>
          },
          {
            field: 'syncData',
            headerName: '',
            flex: 1.2,
            cellRenderer: (params) => (
              <button onClick={() => handleSyncConfiguration(params.data, baseUrl2)} className="btn-purple">Sync Data</button>
            )
          }
        ],
        site1ColDefs: [
          { field: 'tag', headerName: 'TAG', flex: 2, cellClass: 'font-normal text-[#800040]', cellRenderer: (params) => renderTrimTooltip(params.value, 35) },
          { field: 'bo_type', headerName: 'BO TYPE', flex: 1 },
          { field: 'task_names', headerName: 'TASK NAMES', flex: 1.5, cellRenderer: (params) => renderTrimTooltip(params.value, 20) },
          {
            field: 'viewData',
            headerName: 'VIEW DATA',
            flex: 1.2,
            cellRenderer: (params) => (
              <button onClick={() => openDataViewer(params)} className="btn-gray">View Data</button>
            )
          },
          {
            field: 'syncData',
            headerName: '',
            flex: 1.2,
            cellRenderer: (params) => (
              <button onClick={() => handleCloneConfiguration(params.data.raw, baseUrl2, 'to_right')} className="btn-gray">Copy to Right</button>
            )
          }
        ],
        site2ColDefs: [
          { field: 'tag', headerName: 'TAG', flex: 2, cellClass: 'font-normal text-[#800040]', cellRenderer: (params) => renderTrimTooltip(params.value, 35) },
          { field: 'bo_type', headerName: 'BO TYPE', flex: 1 },
          { field: 'task_names', headerName: 'TASK NAMES', flex: 1.5, cellRenderer: (params) => renderTrimTooltip(params.value, 20) },
          {
            field: 'viewData',
            headerName: 'VIEW DATA',
            flex: 1.2,
            cellRenderer: (params) => (
              <button onClick={() => openDataViewer(params)} className="btn-gray">View Data</button>
            )
          },
          {
            field: 'syncData',
            headerName: '',
            flex: 1.2,
            cellRenderer: (params) => (
              <button onClick={() => handleCloneConfiguration(params.data.raw, baseUrl1, 'to_left')} className="btn-gray">Copy to Left</button>
            )
          }
        ]
      };
    }
  }
};

export const getOptionConfig = (activeOption) => {
  return CONFIGS[activeOption] || CONFIGS.datatables;
};
