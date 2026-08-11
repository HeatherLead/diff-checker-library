import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DataTables from './pages/DataTables/DataTables';
import TaskEntity from './pages/TaskEntity/TaskEntity';
import SubTaskMaster from './pages/SubTaskMaster/SubTaskMaster';
import CustomForm from './pages/CustomForm/CustomForm';
import MasterConfig from './pages/MasterConfig/MasterConfig';
import SiteConfig from './pages/SiteConfig/SiteConfig';
import DropdownConfig from './pages/DropdownConfig/DropdownConfig';
import PermissionConfig from './pages/PermissionConfig/PermissionConfig';
import WorkFlowConfig from './pages/WorkFlowConfig/WorkFlowConfig';
import AttachmentTagList from './pages/AttachmentTagList/AttachmentTagList';
import RoleDepartmentList from './pages/RoleDepartmentList/RoleDepartmentList';
import DrupalRoles from './pages/DrupalRoles/DrupalRoles';
import ReactMenus from './pages/ReactMenus/ReactMenus';
import Templates from './pages/Templates/Templates';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DataTables />} />
        <Route path="/task-entity" element={<TaskEntity />} />
        <Route path="/subtask-master" element={<SubTaskMaster />} />
        <Route path="/custom-form" element={<CustomForm />} />
        <Route path="/master-config" element={<MasterConfig />} />
        <Route path="/site-config" element={<SiteConfig />} />
        <Route path="/dropdown-config" element={<DropdownConfig />} />
        <Route path="/permission-config" element={<PermissionConfig />} />
        <Route path="/workflow-config" element={<WorkFlowConfig />} />
        <Route path="/attachment-tag-list" element={<AttachmentTagList />} />
        <Route path="/role-department-list" element={<RoleDepartmentList />} />
        <Route path="/drupal-roles" element={<DrupalRoles />} />
        <Route path="/react-menus" element={<ReactMenus />} />
        <Route path="/templates" element={<Templates />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
