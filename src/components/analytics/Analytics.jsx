import { useState, useEffect } from 'react';
import {
  BarChart3,
  Scale,
  Footprints,
  Dumbbell,
  Utensils,
  TrendingUp,
  TrendingDown,
  Calendar
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import api from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ContentLoader } from '../ui/Spinner';
import { formatDate, formatNumber } from '../../lib/utils';

const COLORS = ['#0070f3', '#00dc82', '#f5a623', '#ee0000', '#7c3aed'];

export function Analytics() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [weightData, setWeightData] = useState(null);
  const [stepsData, setStepsData] = useState(null);
  const [workoutData, setWorkoutData] = useState(null);
  const [mealData, setMealData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [weightRes, stepsRes, workoutRes, mealRes] = await Promise.all([
        api.get('/analytics/weight', { period }),
        api.get('/analytics/steps', { period }),
        api.get('/analytics/workouts', { period }),
        api.get('/analytics/meals', { period })
      ]);
      setWeightData(weightRes.data.data);
      setStepsData(stepsRes.data.data);
      setWorkoutData(workoutRes.data.data);
      setMealData(mealRes.data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ContentLoader />;
  }

  const periodOptions = [
    { value: 'week', label: 'Last Week' },
    { value: 'month', label: 'Last Month' },
    { value: '3months', label: 'Last 3 Months' }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Detailed insights into your fitness journey</p>
        </div>
        <div className="flex gap-2">
          {periodOptions.map(opt => (
            <Button
              key={opt.value}
              variant={period === opt.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Weight Analytics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Weight Analytics
            </CardTitle>
            {weightData?.summary && (
              <Badge variant={weightData.summary.totalChange < 0 ? 'success' : 'warning'}>
                {weightData.summary.totalChange > 0 ? '+' : ''}
                {weightData.summary.totalChange} kg
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Weight Chart */}
            <div className="lg:col-span-2">
              {weightData?.entries?.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={weightData.entries}>
                    <defs>
                      <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0070f3" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0070f3" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
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
                    />
                    <Area
                      type="monotone"
                      dataKey="weight"
                      stroke="#0070f3"
                      fill="url(#weightGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  No weight data available
                </div>
              )}
            </div>

            {/* Weight Stats */}
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-secondary/50">
                <p className="text-sm text-muted-foreground">Starting Weight</p>
                <p className="text-2xl font-bold">
                  {weightData?.summary?.startWeight || '--'} kg
                </p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/50">
                <p className="text-sm text-muted-foreground">Current Weight</p>
                <p className="text-2xl font-bold">
                  {weightData?.summary?.currentWeight || '--'} kg
                </p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/50">
                <p className="text-sm text-muted-foreground">Total Entries</p>
                <p className="text-2xl font-bold">
                  {weightData?.summary?.totalEntries || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Weekly Averages */}
          {weightData?.weeklyAverage?.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium mb-4">Weekly Averages</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3">Week</th>
                      <th className="text-left py-2 px-3">Avg</th>
                      <th className="text-left py-2 px-3">Min</th>
                      <th className="text-left py-2 px-3">Max</th>
                      <th className="text-left py-2 px-3">Entries</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weightData.weeklyAverage.slice(-8).map((week) => (
                      <tr key={week.week} className="border-b border-border last:border-0">
                        <td className="py-2 px-3">Week {week.week}</td>
                        <td className="py-2 px-3 font-mono">{week.avg} kg</td>
                        <td className="py-2 px-3 font-mono text-muted-foreground">{week.min} kg</td>
                        <td className="py-2 px-3 font-mono text-muted-foreground">{week.max} kg</td>
                        <td className="py-2 px-3">{week.entries}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Steps Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Footprints className="h-5 w-5" />
            Steps Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-4">
            <div className="lg:col-span-3">
              {stepsData?.daily?.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stepsData.daily}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => formatDate(date, { weekday: 'short' })}
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
                    <Bar dataKey="count" fill="#00dc82" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  No steps data available
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                <p className="text-sm text-muted-foreground">Total Steps</p>
                <p className="text-2xl font-bold">
                  {formatNumber(stepsData?.overall?.totalSteps || 0)}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/50">
                <p className="text-sm text-muted-foreground">Daily Average</p>
                <p className="text-2xl font-bold">
                  {formatNumber(stepsData?.overall?.avgSteps || 0)}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/50">
                <p className="text-sm text-muted-foreground">Best Day</p>
                <p className="text-2xl font-bold">
                  {formatNumber(stepsData?.overall?.maxSteps || 0)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workout Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            Workout Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Weekly Workouts */}
            <div>
              <h4 className="font-medium mb-4">Weekly Workouts</h4>
              {workoutData?.weekly?.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={workoutData.weekly}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="week" tickFormatter={(w) => `W${w}`} className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="workouts" fill="#0070f3" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No workout data available
                </div>
              )}
            </div>

            {/* Top Exercises */}
            <div>
              <h4 className="font-medium mb-4">Top Exercises</h4>
              {workoutData?.topExercises?.length > 0 ? (
                <div className="space-y-3">
                  {workoutData.topExercises.slice(0, 5).map((exercise, index) => (
                    <div
                      key={exercise.name}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground">
                          #{index + 1}
                        </span>
                        <span className="font-medium">{exercise.name}</span>
                      </div>
                      <Badge variant="secondary">{exercise.count}x</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No exercise data available
                </div>
              )}
            </div>
          </div>

          {/* Workout Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="p-4 rounded-lg bg-secondary/50 text-center">
              <p className="text-2xl font-bold">{workoutData?.overall?.totalWorkouts || 0}</p>
              <p className="text-sm text-muted-foreground">Total Workouts</p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50 text-center">
              <p className="text-2xl font-bold">{workoutData?.overall?.totalDuration || 0}</p>
              <p className="text-sm text-muted-foreground">Total Minutes</p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50 text-center">
              <p className="text-2xl font-bold">{workoutData?.overall?.avgDuration || 0}</p>
              <p className="text-sm text-muted-foreground">Avg Duration</p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50 text-center">
              <p className="text-2xl font-bold">{formatNumber(workoutData?.overall?.totalCalories || 0)}</p>
              <p className="text-sm text-muted-foreground">Calories Burned</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nutrition Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            Nutrition Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Daily Calories */}
            <div>
              <h4 className="font-medium mb-4">Daily Calories</h4>
              {mealData?.daily?.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={mealData.daily.slice(-14)}>
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
                    />
                    <Line
                      type="monotone"
                      dataKey="totalCalories"
                      stroke="#f5a623"
                      strokeWidth={2}
                      dot={{ fill: '#f5a623' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No nutrition data available
                </div>
              )}
            </div>

            {/* Meal Type Distribution */}
            <div>
              <h4 className="font-medium mb-4">Meal Type Distribution</h4>
              {mealData?.mealTypes?.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={mealData.mealTypes}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="count"
                      nameKey="type"
                      label={({ type, percent }) => `${type} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {mealData.mealTypes.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No meal data available
                </div>
              )}
            </div>
          </div>

          {/* Average Macros */}
          {mealData?.averages && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div className="p-4 rounded-lg bg-warning/10 border border-warning/20 text-center">
                <p className="text-2xl font-bold">{mealData.averages.dailyCalories}</p>
                <p className="text-sm text-muted-foreground">Avg Daily Calories</p>
              </div>
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-center">
                <p className="text-2xl font-bold">{mealData.averages.dailyProtein}g</p>
                <p className="text-sm text-muted-foreground">Avg Daily Protein</p>
              </div>
              <div className="p-4 rounded-lg bg-success/10 border border-success/20 text-center">
                <p className="text-2xl font-bold">{mealData.averages.dailyCarbs}g</p>
                <p className="text-sm text-muted-foreground">Avg Daily Carbs</p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/50 text-center">
                <p className="text-2xl font-bold">{mealData.averages.dailyFats}g</p>
                <p className="text-sm text-muted-foreground">Avg Daily Fats</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
