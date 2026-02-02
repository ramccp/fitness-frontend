import { useState, useEffect } from 'react';
import { Footprints, Plus, Target, TrendingUp, Calendar } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import api from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { CircularProgress } from '../ui/Progress';
import { Badge } from '../ui/Badge';
import { ContentLoader } from '../ui/Spinner';
import { formatDate, formatNumber } from '../../lib/utils';

export function StepsTracker() {
  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState([]);
  const [todaySteps, setTodaySteps] = useState(null);
  const [weeklySummary, setWeeklySummary] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    count: '',
    goal: '10000',
    date: new Date().toISOString().split('T')[0],
    distance: '',
    caloriesBurned: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stepsRes, todayRes, weeklyRes] = await Promise.all([
        api.get('/steps', { limit: 30 }),
        api.get('/steps/today'),
        api.get('/steps/weekly')
      ]);
      setSteps(stepsRes.data.data.steps);
      setTodaySteps(todayRes.data.data);
      setWeeklySummary(weeklyRes.data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      await api.post('/steps', {
        count: parseInt(formData.count),
        goal: parseInt(formData.goal),
        date: formData.date,
        distance: formData.distance ? parseFloat(formData.distance) : undefined,
        caloriesBurned: formData.caloriesBurned ? parseInt(formData.caloriesBurned) : undefined
      });
      setShowAddModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      count: '',
      goal: todaySteps?.goal?.toString() || '10000',
      date: new Date().toISOString().split('T')[0],
      distance: '',
      caloriesBurned: ''
    });
  };

  const closeModal = () => {
    setShowAddModal(false);
    resetForm();
    setError(null);
  };

  if (loading) {
    return <ContentLoader />;
  }

  const chartData = [...steps].reverse().slice(-14);
  const goalLine = todaySteps?.goal || 10000;
  const totalSteps = steps.reduce((sum, s) => sum + s.count, 0);
  const avgSteps = steps.length > 0 ? Math.round(totalSteps / steps.length) : 0;
  const goalsMet = steps.filter(s => s.count >= s.goal).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Steps Tracker</h1>
          <p className="text-muted-foreground">Track your daily steps</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Log Steps
        </Button>
      </div>

      {/* Today's Progress */}
      <Card className="bg-gradient-to-r from-success/10 to-primary/10 border-success/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <p className="text-sm text-muted-foreground mb-1">Today's Steps</p>
              <p className="text-4xl font-bold">{formatNumber(todaySteps?.count || 0)}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Goal: {formatNumber(todaySteps?.goal || 10000)} steps
              </p>
            </div>
            <CircularProgress
              value={todaySteps?.count || 0}
              max={todaySteps?.goal || 10000}
              size={160}
            />
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{avgSteps.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Daily Avg</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{goalsMet}</p>
                <p className="text-sm text-muted-foreground">Goals Met</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Steps</p>
              <p className="text-2xl font-bold">{formatNumber(totalSteps)}</p>
            </div>
            <Footprints className="h-8 w-8 text-success opacity-50" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Daily Average</p>
              <p className="text-2xl font-bold">{formatNumber(avgSteps)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-primary opacity-50" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Days Tracked</p>
              <p className="text-2xl font-bold">{steps.length}</p>
            </div>
            <Calendar className="h-8 w-8 text-primary opacity-50" />
          </div>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Steps History (Last 14 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => formatDate(date, { month: 'short', day: 'numeric' })}
                  className="text-xs"
                />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px'
                  }}
                  labelFormatter={(date) => formatDate(date)}
                  formatter={(value) => [formatNumber(value), 'Steps']}
                />
                <ReferenceLine
                  y={goalLine}
                  stroke="var(--color-warning)"
                  strokeDasharray="3 3"
                  label={{ value: 'Goal', fill: 'var(--color-warning)', fontSize: 12 }}
                />
                <Bar
                  dataKey="count"
                  fill="var(--color-success)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No steps data yet. Log your first entry!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Summary */}
      {weeklySummary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Weekly Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium">Week</th>
                    <th className="text-left py-3 px-4 font-medium">Total Steps</th>
                    <th className="text-left py-3 px-4 font-medium">Daily Avg</th>
                    <th className="text-left py-3 px-4 font-medium">Best Day</th>
                    <th className="text-left py-3 px-4 font-medium">Goals Met</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklySummary.map((week) => (
                    <tr key={week.week} className="border-b border-border last:border-0">
                      <td className="py-3 px-4">Week {week.week}</td>
                      <td className="py-3 px-4 font-mono">{formatNumber(week.total)}</td>
                      <td className="py-3 px-4 font-mono">{formatNumber(week.avg)}</td>
                      <td className="py-3 px-4 font-mono">{formatNumber(week.max)}</td>
                      <td className="py-3 px-4">
                        <Badge variant={week.goalsMet > 0 ? 'success' : 'secondary'}>
                          {week.goalsMet}/{week.daysTracked} days
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {steps.length > 0 ? (
            <div className="space-y-2">
              {steps.slice(0, 7).map((entry) => (
                <div
                  key={entry._id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/50"
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      entry.count >= entry.goal ? 'bg-success/10' : 'bg-secondary'
                    }`}>
                      <Footprints className={`h-5 w-5 ${
                        entry.count >= entry.goal ? 'text-success' : 'text-muted-foreground'
                      }`} />
                    </div>
                    <div>
                      <p className="font-semibold">{formatNumber(entry.count)} steps</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(entry.date)} - Week {entry.week}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={entry.count >= entry.goal ? 'success' : 'outline'}>
                      {Math.round((entry.count / entry.goal) * 100)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No steps entries yet. Log your first entry!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={closeModal}
        title="Log Steps"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Step Count"
            type="number"
            min="0"
            max="100000"
            placeholder="e.g., 8500"
            value={formData.count}
            onChange={(e) => setFormData({ ...formData, count: e.target.value })}
            required
          />

          <Input
            label="Daily Goal"
            type="number"
            min="1000"
            max="100000"
            value={formData.goal}
            onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
            required
          />

          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Distance (km) - Optional"
              type="number"
              step="0.1"
              min="0"
              placeholder="e.g., 5.5"
              value={formData.distance}
              onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
            />
            <Input
              label="Calories Burned - Optional"
              type="number"
              min="0"
              placeholder="e.g., 300"
              value={formData.caloriesBurned}
              onChange={(e) => setFormData({ ...formData, caloriesBurned: e.target.value })}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Log Steps
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
