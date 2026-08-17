import './index.css';
import DiffChecker from './DiffChecker';
import Header from './components/Header';
import NavigationRow from './components/NavigationRow';
import { AGGridGenerator } from './components/AGGridGenerator';
import DataDiffTable from './components/DataDiffTable';
import VersionMismatchTable from './components/VersionMismatchTable';
import OnlySiteTable from './components/OnlySiteTable';
import DiffViewerModal from './components/DiffViewerModal';
import { SyncConfirmModal } from './components/SyncConfirmModal';
import { CopyToConfirmModal } from './components/CopyToConfirmModal';
import { CONFIGS, getOptionConfig, renderTrimTooltip, renderTagLink, renderEditLink } from './config';
import { useConfigurationDiff } from './hooks/useConfigurationDiff';
import { DiffCheckerProvider, useDiffChecker } from './context/DiffCheckerContext';

// Export all autonomous page components
export * from './pages';

export {
  DiffChecker,
  Header,
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
};

export default DiffChecker;
