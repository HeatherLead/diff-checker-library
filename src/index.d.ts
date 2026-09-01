import React from 'react';

export interface DiffCheckerProps {
  base_url?: string;
  base_path?: string;
  synced_by?: string;
  import_id?: number | string | null;
  headers?: Record<string, string>;
  initialOption?: string;
  initialOptionLabel?: string;
  children?: React.ReactNode;
}

export const DiffChecker: React.FC<DiffCheckerProps>;
export default DiffChecker;

export const Header: React.FC<any>;
export const NavigationRow: React.FC<any>;
export const AGGridGenerator: React.FC<any>;
export const DataDiffTable: React.FC<any>;
export const VersionMismatchTable: React.FC<any>;
export const OnlySiteTable: React.FC<any>;
export const DiffViewerModal: React.FC<any>;
export const SyncConfirmModal: React.FC<any>;
export const CopyToConfirmModal: React.FC<any>;
export const CONFIGS: Record<string, any>;
export const getOptionConfig: (activeOption: string) => any;
export const useConfigurationDiff: (diffTag: string, options?: { autoFetch?: boolean }) => any;
export const DiffCheckerProvider: React.FC<any>;
export const useDiffChecker: () => any;

export const renderTrimTooltip: (val: any, maxChar?: number) => any;
export const renderTagLink: (baseUrl: string, typeSlug: string, id: any, val: any, maxChar?: number) => any;
export const renderEditLink: (baseUrl: string, typeSlug: string, id: any, label?: string) => any;

// Autonomous Page Components & Configs
export const AttachmentTagList: React.FC<{ activeOption?: string }>;
export const attachmentTagListConfig: any;

export const CustomForm: React.FC<{ activeOption?: string }>;
export const customFormConfig: any;

export const DataTables: React.FC<{ activeOption?: string }>;
export const dataTablesConfig: any;
export const datatablesConfig: any;

export const DropdownConfig: React.FC<{ activeOption?: string }>;
export const dropdownConfigConfig: any;
export const dropdownConfig: any;

export const DrupalRoles: React.FC<{ activeOption?: string }>;
export const drupalRolesConfig: any;

export const MasterConfig: React.FC<{ activeOption?: string }>;
export const masterConfigConfig: any;

export const PermissionConfig: React.FC<{ activeOption?: string }>;
export const permissionConfig: any;

export const ReactMenus: React.FC<{ activeOption?: string }>;
export const reactMenusConfig: any;

export const RoleDepartmentList: React.FC<{ activeOption?: string }>;
export const roleDepartmentListConfig: any;

export const SiteConfig: React.FC<{ activeOption?: string }>;
export const siteConfigConfig: any;

export const SubTaskMaster: React.FC<{ activeOption?: string }>;
export const subTaskMasterConfig: any;

export const TaskEntity: React.FC<{ activeOption?: string }>;
export const taskEntityConfig: any;

export const Templates: React.FC<{ activeOption?: string }>;
export const templatesConfig: any;

export const WorkFlowConfig: React.FC<{ activeOption?: string }>;
export const workFlowConfigConfig: any;
export const workflowConfig: any;
