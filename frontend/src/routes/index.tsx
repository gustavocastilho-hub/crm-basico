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
import { SettingsPage } from '../pages/SettingsPage';
import { ContractFormPage } from '../pages/ContractFormPage';
import { OnboardingFormPage } from '../pages/OnboardingFormPage';
import { SdrPage } from '../pages/SdrPage';
import { CommissionsPage } from '../pages/CommissionsPage';
import { ImprovementsPage } from '../pages/ImprovementsPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/formulario-contrato/:token',
    element: <ContractFormPage />,
  },
  {
    path: '/formulario-negocio/:token',
    element: <OnboardingFormPage />,
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
      { path: '/sdr', element: <SdrPage /> },
      { path: '/comissoes', element: <CommissionsPage /> },
      { path: '/melhorias', element: <ImprovementsPage /> },
      { path: '/configuracoes', element: <SettingsPage /> },
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
