import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { LoginForm } from './components/auth/LoginForm';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Dashboard } from './components/dashboard/Dashboard';
import { PlanSetup } from './components/plan/PlanSetup';
import { WeightTracker } from './components/weight/WeightTracker';
import { WorkoutTracker } from './components/workout/WorkoutTracker';
import { StepsTracker } from './components/steps/StepsTracker';
import { MealTracker } from './components/meals/MealTracker';
import { Analytics } from './components/analytics/Analytics';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { Settings } from './components/settings/Settings';
import { PageLoader } from './components/ui/Spinner';

function App() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginForm />
        }
      />

      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/plan" element={<PlanSetup />} />
        <Route path="/weight" element={<WeightTracker />} />
        <Route path="/workout" element={<WorkoutTracker />} />
        <Route path="/steps" element={<StepsTracker />} />
        <Route path="/meals" element={<MealTracker />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Settings />} />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Redirect root to dashboard or login */}
      <Route
        path="/"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
        }
      />

      {/* 404 - Redirect to dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
