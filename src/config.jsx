import {
  dataTablesConfig,
  attachmentTagListConfig,
  customFormConfig,
  drupalRolesConfig,
  reactMenusConfig,
  masterConfigConfig,
  siteConfigConfig,
  permissionConfig,
  taskEntityConfig,
  subTaskMasterConfig,
  dropdownConfigConfig,
  roleDepartmentListConfig,
  workFlowConfigConfig,
  templatesConfig
} from './pages';

export { renderTrimTooltip, renderTagLink, renderEditLink, ensureAbsoluteUrl, getEditPageUrl, OPTION_SLUG_MAP } from './utils/cellRenderers';

export const CONFIGS = {
  datatables: dataTablesConfig,
  attachment_tag_list: attachmentTagListConfig,
  custom_form: customFormConfig,
  drupal_roles: drupalRolesConfig,
  react_menus: reactMenusConfig,
  master_config: masterConfigConfig,
  site_config: siteConfigConfig || masterConfigConfig,
  permission_config: permissionConfig,
  task_entity: taskEntityConfig,
  subtask_master: subTaskMasterConfig,
  dropdown_config: dropdownConfigConfig,
  role_department_list: roleDepartmentListConfig,
  workflow_config: workFlowConfigConfig,
  templates: templatesConfig,
};

export const getOptionConfig = (activeOption) => {
  return CONFIGS[activeOption] || CONFIGS.datatables;
};

export default CONFIGS;
