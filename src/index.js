import './index.css';
import DiffChecker from './DiffChecker';
import Header from './components/Header';
import NavigationRow from './components/NavigationRow';
import { AgGridGenerator } from './components/agGridGenerator';
import DataDiffTable from './components/DataDiffTable';
import VersionMismatchTable from './components/VersionMismatchTable';
import OnlySiteTable from './components/OnlySiteTable';
import DiffViewerModal from './components/DiffViewerModal';
import { SyncConfirmModal } from './components/SyncConfirmModal';
import { CloneConfirmModal } from './components/CloneConfirmModal';
import { CONFIGS, getOptionConfig } from './config';
import { useConfigurationDiff } from './hooks/useConfigurationDiff';
import { DiffCheckerProvider, useDiffChecker } from './context/DiffCheckerContext';

// Export all autonomous page components
export * from './pages';

export {
  DiffChecker,
  Header,
  NavigationRow,
  AgGridGenerator,
  DataDiffTable,
  VersionMismatchTable,
  OnlySiteTable,
  DiffViewerModal,
  SyncConfirmModal,
  CloneConfirmModal,
  CONFIGS,
  getOptionConfig,
  useConfigurationDiff,
  DiffCheckerProvider,
  useDiffChecker,
};

export default DiffChecker;
