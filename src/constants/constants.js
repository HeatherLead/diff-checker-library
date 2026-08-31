export const ESTIMATE_CHAR_PX = 7.5;
export const ESTIMATE_PADDING = 40;
export const ESTIMATE_ROW_SAMPLE = 100;

export const NON_FILTERABLE_EXACT_FIELDS = new Set([
  "syncdata",
  "synchdata",
  "sync_data",
  "sync",
  "syncdatabtn",
  "datatablediff",
  "querydiff",
  "otherdiff",
  "other_diff",
  "rolediff",
  "role_diff",
  "dtdiff",
  "dt_diff",
  "dfdiff",
  "df_diff",
  "customformdiff",
  "diff",
  "viewdata",
  "view_data",
  "view",
  "viewbtn",
  "action",
  "actions",
  "edit",
  "site1config",
  "site2config",
  "site1_config",
  "site2_config",
  "sourceconfig",
  "targetconfig",
  "source_config",
  "target_config",
  "sourcecount",
  "targetcount",
  "source_count",
  "target_count",
  "onlysource",
  "onlytarget",
  "only_source",
  "only_target",
  "siteconfig",
  "copyleft",
  "copyright",
  "copytoleft",
  "copytoright",
  "copy_left",
  "copy_right",
  "copy_to_left",
  "copy_to_right",
]);

export const ROW_KEY_FIELDS = [
  "id",
  "tag",
  "tag_name",
  "issue_id",
  "issue_encoded_id",
  "task_id",
  "bo_id",
  "initiative_id",
  "ticket_code",
  "user_id",
  "module",
  "entity_type",
  "uid"
];

export const NON_FILTERABLE_HEADER_KEYWORDS = [
  "diff",
  "edit",
  "view",
  "copy",
  "sync",
  "action",
  "config"
];

export const NON_FILTERABLE_FIELD_KEYWORDS = [
  "diff",
  "edit",
  "view",
  "copy",
  "sync",
  "action"
];

export const VIEW_DIFF_FIELDS = [
  "datatableDiff",
  "queryDiff",
  "otherDiff",
  "role_diff",
  "view_role_diff",
  "excel_diff",
  "validator_diff",
  "display_msg_diff",
  "custom_form_diff"
];

export const DIFF_CHANGES_FIELDS = [
  "dt_status",
  "df_status",
  "role_diff_status",
  "wf_status",
  "query_status",
  "msg_diff",
  "other_status",
  "other_diff",
  "excel_diff_status",
  "validator_diff_status"
];

export const TABS = [
  {
    id: "datatables",
    type: "single",
    title: "DataTables",
    optionId: "datatables",
    path: "",
  },
  {
    id: "task_entity",
    type: "single",
    title: "Task Entity",
    path: "/task-entity",
    optionId: "task_entity"
  },
  {
    id: "configurations",
    type: "dropdown",
    title: "Configurations",
    items: [
      { id: "master_config", label: "Master Config", path: "/master-config" },
      { id: "site_config", label: "Site Config", path: "/site-config" },
      { id: "dropdown_config", label: "Dropdown Config", path: "/dropdown-config" },
      { id: "permission_config", label: "Permission Config", path: "/permission-config" },
    ]
  },
  {
    id: "workflow_config",
    type: "single",
    title: "WorkFlow Config",
    path: "/workflow-config",
    optionId: "workflow_config"
  },
  {
    id: "attachment_tag_list",
    type: "single",
    title: "Attachment Tag List",
    path: "/attachment-tag-list",
    optionId: "attachment_tag_list"
  },
  {
    id: "templates",
    type: "single",
    title: "Templates",
    path: "/templates",
    optionId: "templates"
  },
  {
    id: "utilities_modules",
    type: "dropdown",
    title: "Utilities & Modules",
    items: [
      { id: "subtask_master", label: "SubTask Master", path: "/subtask-master" },
      { id: "custom_form", label: "Custom Form", path: "/custom-form" },
      { id: "role_department_list", label: "Role Department List", path: "/role-department-list" },
      { id: "drupal_roles", label: "Drupal Roles", path: "/drupal-roles" },
      { id: "react_menus", label: "React Menus", path: "/react-menus" },
    ]
  },
];