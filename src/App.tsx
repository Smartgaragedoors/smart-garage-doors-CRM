
import { BrowserRouter } from 'react-router-dom';
import { useRoutes } from 'react-router-dom';
import routes from './router/config';
import ProtectedRoute from './components/feature/ProtectedRoute';

function AppRoutes() {
  const element = useRoutes(routes);
  return element;
}

function App() {
  return (
    <BrowserRouter basename={__BASE_PATH__}>
      <ProtectedRoute>
        <AppRoutes />
      </ProtectedRoute>
    </BrowserRouter>
  );
}

export default App;
