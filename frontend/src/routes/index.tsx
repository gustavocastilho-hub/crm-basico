import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ClientsPage } from '../pages/ClientsPage';
import { ClientDetailPage } from '../pages/ClientDetailPage';
import { PipelinePage } from '../pages/PipelinePage';
import { TasksPage } from '../pages/TasksPage';
import { UsersPage } from '../pages/UsersPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/clientes', element: <ClientsPage /> },
      { path: '/clientes/:id', element: <ClientDetailPage /> },
      { path: '/pipeline', element: <PipelinePage /> },
      { path: '/tarefas', element: <TasksPage /> },
      {
        path: '/usuarios',
        element: (
          <ProtectedRoute adminOnly>
            <UsersPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
