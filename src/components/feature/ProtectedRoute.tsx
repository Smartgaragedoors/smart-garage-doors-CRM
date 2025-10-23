
import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const user = localStorage.getItem('user');
    
    // If no user is logged in and not on login page, redirect to login
    if (!user && location.pathname !== '/login') {
      navigate('/login');
      return;
    }
    
    // If user is logged in and on login page, redirect to dashboard
    if (user && location.pathname === '/login') {
      navigate('/');
      return;
    }
  }, [navigate, location.pathname]);

  return <>{children}</>;
}
