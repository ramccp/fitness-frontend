import { useState, useEffect, useRef, useMemo } from 'react';
import { Scale, Plus, Upload, Trash2, Edit2, TrendingDown, TrendingUp, Calendar, List } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import api from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { ContentLoader } from '../ui/Spinner';
import { formatDate, formatNumber } from '../../lib/utils';

export function WeightTracker() {
  const [loading, setLoading] = useState(true);
  const [weights, setWeights] = useState([]);
  const [weeklySummary, setWeeklySummary] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingWeight, setEditingWeight] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('individual'); // 'individual' or 'week'

  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    weight: '',
    unit: 'kg',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    week: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [weightsRes, weeklyRes] = await Promise.all([
        api.get('/weight'),
        api.get('/weight/weekly')
      ]);
      setWeights(weightsRes.data.data.weights);
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

    try {
      if (editingWeight) {
        await api.put(`/weight/${editingWeight._id}`, {
          weight: parseFloat(formData.weight),
          unit: formData.unit,
          date: formData.date,
          notes: formData.notes,
          week: formData.week ? parseInt(formData.week) : undefined
        });
      } else {
        await api.post('/weight', {
          weight: parseFloat(formData.weight),
          unit: formData.unit,
          date: formData.date,
          notes: formData.notes,
          week: formData.week ? parseInt(formData.week) : undefined
        });
      }
      setShowAddModal(false);
      setEditingWeight(null);
      resetForm();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      await api.delete(`/weight/${id}`);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (weight) => {
    setEditingWeight(weight);
    setFormData({
      weight: weight.weight.toString(),
      unit: weight.unit,
      date: new Date(weight.date).toISOString().split('T')[0],
      notes: weight.notes || '',
      week: weight.week?.toString() || ''
    });
    setShowAddModal(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadResult(null);
    setError(null);

    try {
      const response = await api.uploadFile('/weight/bulk-upload', file);
      setUploadResult(response.data);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const resetForm = () => {
    setFormData({
      weight: '',
      unit: 'kg',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      week: ''
    });
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setEditingWeight(null);
    resetForm();
    setError(null);
  };

  // Group weights by week for week view mode (must be before loading check for hooks order)
  const weeklyGroupedData = useMemo(() => {
    if (weights.length === 0) return [];

    const weekMap = new Map();

    weights.forEach((entry) => {
      const week = entry.week;
      if (!weekMap.has(week)) {
        weekMap.set(week, {
          week,
          entries: [],
          totalWeight: 0,
          unit: entry.unit
        });
      }
      const weekData = weekMap.get(week);
      weekData.entries.push(entry);
      weekData.totalWeight += entry.weight;
    });

    // Calculate averages and sort by week
    const result = Array.from(weekMap.values()).map((weekData) => ({
      week: weekData.week,
      entries: weekData.entries.sort((a, b) => new Date(b.date) - new Date(a.date)),
      avgWeight: Math.round((weekData.totalWeight / weekData.entries.length) * 10) / 10,
      unit: weekData.unit,
      minWeight: Math.min(...weekData.entries.map(e => e.weight)),
      maxWeight: Math.max(...weekData.entries.map(e => e.weight)),
      entryCount: weekData.entries.length
    }));

    return result.sort((a, b) => b.week - a.week);
  }, [weights]);

  // Chart data for week view (weekly averages)
  const weeklyChartData = useMemo(() => {
    return [...weeklyGroupedData].reverse().map((week) => ({
      week: `Week ${week.week}`,
      weight: week.avgWeight,
      avgWeight: week.avgWeight
    }));
  }, [weeklyGroupedData]);

  if (loading) {
    return <ContentLoader />;
  }

  const chartData = [...weights].reverse().slice(-30);
  const latestWeight = weights[0]?.weight;
  const previousWeight = weights[1]?.weight;
  const weightChange = latestWeight && previousWeight ? latestWeight - previousWeight : null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Weight Tracker</h1>
          <p className="text-muted-foreground">Track your weight progress</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowUploadModal(true)}>
            <Upload className="h-4 w-4 mr-2" />
            CSV Upload
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </Button>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">View:</span>
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setViewMode('individual')}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm transition-colors ${
              viewMode === 'individual'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background hover:bg-secondary'
            }`}
          >
            <List className="h-4 w-4" />
            Individual
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm transition-colors ${
              viewMode === 'week'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background hover:bg-secondary'
            }`}
          >
            <Calendar className="h-4 w-4" />
            By Week
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current Weight</p>
              <p className="text-2xl font-bold">
                {latestWeight ? `${latestWeight} kg` : '--'}
              </p>
            </div>
            <Scale className="h-8 w-8 text-primary opacity-50" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Last Change</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">
                  {weightChange !== null ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} kg` : '--'}
                </p>
                {weightChange !== null && (
                  weightChange < 0 ? (
                    <TrendingDown className="h-5 w-5 text-success" />
                  ) : weightChange > 0 ? (
                    <TrendingUp className="h-5 w-5 text-warning" />
                  ) : null
                )}
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div>
            <p className="text-sm text-muted-foreground">Total Entries</p>
            <p className="text-2xl font-bold">{weights.length}</p>
          </div>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{viewMode === 'week' ? 'Weekly Average Weight' : 'Weight Trend'}</CardTitle>
        </CardHeader>
        <CardContent>
          {viewMode === 'individual' ? (
            chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => formatDate(date, { month: 'short', day: 'numeric' })}
                    className="text-xs"
                  />
                  <YAxis domain={['auto', 'auto']} className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px'
                    }}
                    labelFormatter={(date) => formatDate(date)}
                    formatter={(value) => [`${value} kg`, 'Weight']}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    dot={{ fill: 'var(--color-primary)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No weight data yet. Add your first entry!
              </div>
            )
          ) : (
            weeklyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="week"
                    className="text-xs"
                  />
                  <YAxis domain={['auto', 'auto']} className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px'
                    }}
                    formatter={(value) => [`${value} kg`, 'Avg Weight']}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgWeight"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    dot={{ fill: 'var(--color-primary)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No weight data yet. Add your first entry!
              </div>
            )
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
                    <th className="text-left py-3 px-4 font-medium">Avg Weight</th>
                    <th className="text-left py-3 px-4 font-medium">Min</th>
                    <th className="text-left py-3 px-4 font-medium">Max</th>
                    <th className="text-left py-3 px-4 font-medium">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklySummary.map((week) => (
                    <tr key={week.week} className="border-b border-border last:border-0">
                      <td className="py-3 px-4">Week {week.week}</td>
                      <td className="py-3 px-4 font-mono">{week.avgWeight} kg</td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">{week.minWeight} kg</td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">{week.maxWeight} kg</td>
                      <td className="py-3 px-4">
                        <Badge variant={week.change < 0 ? 'success' : week.change > 0 ? 'warning' : 'secondary'}>
                          {week.change > 0 ? '+' : ''}{week.change} kg
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

      {/* Recent Entries / Weekly View */}
      <Card>
        <CardHeader>
          <CardTitle>{viewMode === 'week' ? 'Weights by Week' : 'Recent Entries'}</CardTitle>
        </CardHeader>
        <CardContent>
          {viewMode === 'individual' ? (
            weights.length > 0 ? (
              <div className="space-y-2">
                {weights.slice(0, 10).map((weight) => (
                  <div
                    key={weight._id}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Scale className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{weight.weight} {weight.unit}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(weight.date)} - Week {weight.week}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {weight.notes && (
                        <span className="text-sm text-muted-foreground max-w-[150px] truncate">
                          {weight.notes}
                        </span>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(weight)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(weight._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No weight entries yet. Add your first entry!
              </div>
            )
          ) : (
            weeklyGroupedData.length > 0 ? (
              <div className="space-y-4">
                {weeklyGroupedData.map((weekData) => (
                  <div key={weekData.week} className="border border-border rounded-lg overflow-hidden">
                    {/* Week Header */}
                    <div className="flex items-center justify-between p-4 bg-secondary/50">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">Week {weekData.week}</p>
                          <p className="text-sm text-muted-foreground">
                            {weekData.entryCount} {weekData.entryCount === 1 ? 'entry' : 'entries'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">{weekData.avgWeight} {weekData.unit}</p>
                        <p className="text-xs text-muted-foreground">Average</p>
                      </div>
                    </div>
                    {/* Week Stats */}
                    <div className="px-4 py-2 bg-background border-t border-border flex gap-4 text-sm">
                      <span className="text-muted-foreground">
                        Min: <span className="font-mono text-foreground">{weekData.minWeight} {weekData.unit}</span>
                      </span>
                      <span className="text-muted-foreground">
                        Max: <span className="font-mono text-foreground">{weekData.maxWeight} {weekData.unit}</span>
                      </span>
                    </div>
                    {/* Individual Entries */}
                    <div className="divide-y divide-border">
                      {weekData.entries.map((entry) => (
                        <div
                          key={entry._id}
                          className="flex items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Scale className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{entry.weight} {entry.unit}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(entry.date)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {entry.notes && (
                              <span className="text-sm text-muted-foreground max-w-[120px] truncate">
                                {entry.notes}
                              </span>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(entry)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDelete(entry._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No weight entries yet. Add your first entry!
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={closeAddModal}
        title={editingWeight ? 'Edit Weight Entry' : 'Add Weight Entry'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Weight"
              type="number"
              step="0.1"
              min="20"
              max="500"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              required
            />
            <Select
              label="Unit"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              options={[
                { value: 'kg', label: 'Kilograms (kg)' },
                { value: 'lbs', label: 'Pounds (lbs)' }
              ]}
            />
          </div>

          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />

          <Input
            label="Week Number (Optional)"
            type="number"
            min="1"
            placeholder="Auto-calculated if empty"
            value={formData.week}
            onChange={(e) => setFormData({ ...formData, week: e.target.value })}
          />

          <Input
            label="Notes (Optional)"
            type="text"
            placeholder="e.g., Morning weigh-in"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={closeAddModal}>
              Cancel
            </Button>
            <Button type="submit">
              {editingWeight ? 'Update' : 'Add'} Entry
            </Button>
          </div>
        </form>
      </Modal>

      {/* CSV Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setUploadResult(null);
          setError(null);
        }}
        title="CSV Bulk Upload"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-secondary/50">
            <p className="font-medium mb-2">CSV Format:</p>
            <code className="text-sm font-mono block">Week,Date,Weight,Notes</code>
            <p className="text-sm text-muted-foreground mt-2">Example:</p>
            <code className="text-xs font-mono block whitespace-pre">
{`Week,Date,Weight,Notes
1,2025-01-01,75.5,Starting weight
1,2025-01-08,74.8,Good progress
2,2025-01-15,74.2,Consistent`}
            </code>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />

          <Button
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
            loading={uploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            Select CSV File
          </Button>

          {uploadResult && (
            <div className="p-4 rounded-lg bg-success/10 text-success">
              <p>{uploadResult.message}</p>
              {uploadResult.data?.errors?.length > 0 && (
                <div className="mt-2 text-sm text-warning">
                  <p>Errors:</p>
                  <ul className="list-disc list-inside">
                    {uploadResult.data.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </Modal>
    </div>
  );
}
