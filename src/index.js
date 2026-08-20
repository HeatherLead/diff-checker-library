import './styles/index.scss';
import DiffChecker from './DiffChecker';
import NavigationRow from './components/NavigationRow';
import { AGGridGenerator } from './components/AGGridGenerator';
import DataDiffTable from './components/DataDiffTable';
import VersionMismatchTable from './components/VersionMismatchTable';
import OnlySiteTable from './components/OnlySiteTable';
import DiffViewerModal from './components/DiffViewerModal';
import { SyncConfirmModal } from './components/SyncConfirmModal';
import { CopyToConfirmModal } from './components/CopyToConfirmModal';
import { CONFIGS, getOptionConfig, renderTrimTooltip, renderTagLink, renderEditLink, ensureAbsoluteUrl } from './config';
import { useConfigurationDiff } from './hooks/useConfigurationDiff';
import { DiffCheckerProvider, useDiffChecker } from './context/DiffCheckerContext';

// Export all autonomous page components
export * from './pages';

export {
  DiffChecker,
  NavigationRow,
  AGGridGenerator,
  DataDiffTable,
  VersionMismatchTable,
  OnlySiteTable,
  DiffViewerModal,
  SyncConfirmModal,
  CopyToConfirmModal,
  CONFIGS,
  getOptionConfig,
  useConfigurationDiff,
  DiffCheckerProvider,
  useDiffChecker,
  renderTrimTooltip,
  renderTagLink,
  renderEditLink,
  ensureAbsoluteUrl,
};

export default DiffChecker;
