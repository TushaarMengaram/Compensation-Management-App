import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { EmployeeLayout } from './layouts/EmployeeLayout.jsx';
import { AdminLayout } from './layouts/AdminLayout.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { EmployeeDashboardPage } from './pages/employee/EmployeeDashboardPage.jsx';
import { SalaryViewPage } from './pages/employee/SalaryViewPage.jsx';
import { SalaryHistoryPage } from './pages/employee/SalaryHistoryPage.jsx';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage.jsx';
import { AdminEmployeesPage } from './pages/admin/AdminEmployeesPage.jsx';
import { AdminEmployeeDetailPage } from './pages/admin/AdminEmployeeDetailPage.jsx';
import { AdminReviewCyclesPage } from './pages/admin/AdminReviewCyclesPage.jsx';
import { AdminCreateCyclePage } from './pages/admin/AdminCreateCyclePage.jsx';
import { AdminProposalsPage } from './pages/admin/AdminProposalsPage.jsx';

function HomeRedirect() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/employee'} replace />;
}

export default function App() {
  return (
    <>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/employee"
          element={
            <ProtectedRoute roles={['employee']}>
              <EmployeeLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<EmployeeDashboardPage />} />
          <Route path="salary" element={<SalaryViewPage />} />
          <Route path="history" element={<SalaryHistoryPage />} />
        </Route>

        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="employees" element={<AdminEmployeesPage />} />
          <Route path="employees/:id" element={<AdminEmployeeDetailPage />} />
          <Route path="cycles" element={<AdminReviewCyclesPage />} />
          <Route path="cycles/new" element={<AdminCreateCyclePage />} />
          <Route path="proposals" element={<AdminProposalsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
