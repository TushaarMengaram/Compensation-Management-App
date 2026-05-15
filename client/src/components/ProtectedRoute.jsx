import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { TOKEN_KEY } from '../services/api.js';

export function ProtectedRoute({ children, roles }) {
  const { user, isAuthenticated } = useAuth();
  const token = localStorage.getItem(TOKEN_KEY);

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/employee'} replace />;
  }
  return children;
}
