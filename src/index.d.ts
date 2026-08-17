import React from 'react';

export interface DiffCheckerProps {
  base_url?: string | { src_url?: string; target_url?: string;[key: string]: any };
  baseUrl?: string | { src_url?: string; target_url?: string;[key: string]: any };
  baseurl?: string | { src_url?: string; target_url?: string;[key: string]: any };
  base_path?: string;
  basePath?: string;
  backend_url?: string;
  backend_url_2?: string;
  synced_by?: string;
  headers?: Record<string, string>;
  initialOption?: string;
  initialOptionLabel?: string;
  children?: React.ReactNode;
}

export const DiffChecker: React.FC<DiffCheckerProps>;
export default DiffChecker;

export const Header: React.FC<any>;
export const NavigationRow: React.FC<any>;
export const AgGridGenerator: React.FC<any>;
export const DataDiffTable: React.FC<any>;
export const VersionMismatchTable: React.FC<any>;
export const OnlySiteTable: React.FC<any>;
export const DiffViewerModal: React.FC<any>;
export const SyncConfirmModal: React.FC<any>;
export const CloneConfirmModal: React.FC<any>;
export const CONFIGS: Record<string, any>;
export const getOptionConfig: (activeOption: string) => any;
export const useConfigurationDiff: (diffTag: string, options?: { autoFetch?: boolean }) => any;
export const DiffCheckerProvider: React.FC<any>;
export const useDiffChecker: () => any;

// Autonomous Page Components
export const AttachmentTagList: React.FC<{ activeOption?: string }>;
export const CustomForm: React.FC<{ activeOption?: string }>;
export const DataTables: React.FC<{ activeOption?: string }>;
export const DropdownConfig: React.FC<{ activeOption?: string }>;
export const DrupalRoles: React.FC<{ activeOption?: string }>;
export const MasterConfig: React.FC<{ activeOption?: string }>;
export const PermissionConfig: React.FC<{ activeOption?: string }>;
export const ReactMenus: React.FC<{ activeOption?: string }>;
export const RoleDepartmentList: React.FC<{ activeOption?: string }>;
export const SiteConfig: React.FC<{ activeOption?: string }>;
export const SubTaskMaster: React.FC<{ activeOption?: string }>;
export const TaskEntity: React.FC<{ activeOption?: string }>;
export const Templates: React.FC<{ activeOption?: string }>;
export const WorkFlowConfig: React.FC<{ activeOption?: string }>;
