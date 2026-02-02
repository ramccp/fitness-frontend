import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Play, Pause, Check, Target, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { Modal } from '../ui/Modal';
import { ContentLoader } from '../ui/Spinner';
import { formatDate } from '../../lib/utils';

export function PlanSetup() {
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    startDate: new Date().toISOString().split('T')[0],
    numberOfWeeks: 12,
    targetWeight: '',
    dailyStepsGoal: 10000,
    weeklyWorkoutGoal: 4
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchPlan();
  }, []);

  const fetchPlan = async () => {
    try {
      setLoading(true);
      const response = await api.get('/plan');
      setPlan(response.data.data);
    } catch (err) {
      if (err.response?.status !== 404) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {
      const response = await api.post('/plan', {
        startDate: formData.startDate,
        numberOfWeeks: parseInt(formData.numberOfWeeks),
        goals: {
          targetWeight: formData.targetWeight ? parseFloat(formData.targetWeight) : undefined,
          dailyStepsGoal: parseInt(formData.dailyStepsGoal),
          weeklyWorkoutGoal: parseInt(formData.weeklyWorkoutGoal)
        }
      });
      setPlan(response.data.data);
      setShowCreateModal(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setCreating(false);
    }
  };

  const handlePausePlan = async () => {
    try {
      const response = await api.put('/plan/pause');
      setPlan(response.data.data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResumePlan = async () => {
    try {
      const response = await api.put('/plan/resume');
      setPlan(response.data.data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeletePlan = async () => {
    if (!confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/plan/${plan._id}`);
      setPlan(null);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <ContentLoader />;
  }

  const weekOptions = Array.from({ length: 52 }, (_, i) => ({
    value: (i + 1).toString(),
    label: `${i + 1} ${i + 1 === 1 ? 'week' : 'weeks'}`
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Plan</h1>
          <p className="text-muted-foreground">Manage your fitness journey</p>
        </div>
        {!plan && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Calendar className="h-4 w-4 mr-2" />
            Create Plan
          </Button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {plan ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Plan Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Fitness Plan</CardTitle>
                  <CardDescription>
                    Started {formatDate(plan.startDate)}
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    plan.status === 'active' ? 'success' :
                    plan.status === 'paused' ? 'warning' : 'secondary'
                  }
                >
                  {plan.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Week {plan.currentWeek} of {plan.numberOfWeeks}</span>
                  <span className="text-muted-foreground">
                    {Math.round((plan.currentWeek / plan.numberOfWeeks) * 100)}%
                  </span>
                </div>
                <Progress
                  value={plan.currentWeek}
                  max={plan.numberOfWeeks}
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-secondary/50">
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-semibold">{formatDate(plan.startDate)}</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/50">
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-semibold">{formatDate(plan.endDate)}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {plan.status === 'active' && (
                  <Button variant="outline" onClick={handlePausePlan}>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause Plan
                  </Button>
                )}
                {plan.status === 'paused' && (
                  <Button onClick={handleResumePlan}>
                    <Play className="h-4 w-4 mr-2" />
                    Resume Plan
                  </Button>
                )}
                <Button variant="destructive" onClick={handleDeletePlan}>
                  Delete Plan
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Goals Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Goals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {plan.goals?.targetWeight && (
                <div className="p-4 rounded-lg bg-secondary/50">
                  <p className="text-sm text-muted-foreground">Target Weight</p>
                  <p className="text-xl font-bold">{plan.goals.targetWeight} kg</p>
                </div>
              )}
              <div className="p-4 rounded-lg bg-secondary/50">
                <p className="text-sm text-muted-foreground">Daily Steps Goal</p>
                <p className="text-xl font-bold">{plan.goals?.dailyStepsGoal?.toLocaleString() || '10,000'}</p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/50">
                <p className="text-sm text-muted-foreground">Weekly Workouts</p>
                <p className="text-xl font-bold">{plan.goals?.weeklyWorkoutGoal || 4} sessions</p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Active Plan</h3>
            <p className="text-muted-foreground mb-6">
              Create a plan to start tracking your fitness journey
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              Create Your Plan
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Plan Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Fitness Plan"
      >
        <form onSubmit={handleCreatePlan} className="space-y-4">
          <Input
            label="Start Date"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />

          <Select
            label="Duration"
            value={formData.numberOfWeeks}
            onChange={(e) => setFormData({ ...formData, numberOfWeeks: e.target.value })}
            options={weekOptions}
          />

          <Input
            label="Target Weight (kg) - Optional"
            type="number"
            step="0.1"
            placeholder="e.g., 70"
            value={formData.targetWeight}
            onChange={(e) => setFormData({ ...formData, targetWeight: e.target.value })}
          />

          <Input
            label="Daily Steps Goal"
            type="number"
            value={formData.dailyStepsGoal}
            onChange={(e) => setFormData({ ...formData, dailyStepsGoal: e.target.value })}
            required
          />

          <Input
            label="Weekly Workout Goal"
            type="number"
            min="1"
            max="14"
            value={formData.weeklyWorkoutGoal}
            onChange={(e) => setFormData({ ...formData, weeklyWorkoutGoal: e.target.value })}
            required
          />

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={creating}>
              Create Plan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
