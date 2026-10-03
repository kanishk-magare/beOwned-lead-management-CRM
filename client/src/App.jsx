import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import LeadsList from './pages/LeadsList.jsx';
import LeadCreate from './pages/LeadCreate.jsx';
import LeadEdit from './pages/LeadEdit.jsx';
import LeadDetail from './pages/LeadDetail.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="leads" element={<LeadsList />} />
        <Route path="leads/new" element={<LeadCreate />} />
        <Route path="leads/:id" element={<LeadDetail />} />
        <Route path="leads/:id/edit" element={<LeadEdit />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
