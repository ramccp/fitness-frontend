import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Scale,
  Dumbbell,
  Footprints,
  Utensils,
  TrendingUp,
  TrendingDown,
  Flame,
  Target,
  Calendar,
  ArrowRight
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import api from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { StatsCard } from './StatsCard';
import { Button } from '../ui/Button';
import { Progress, CircularProgress } from '../ui/Progress';
import { Badge } from '../ui/Badge';
import { ContentLoader } from '../ui/Spinner';
import { formatNumber } from '../../lib/utils';

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [weightData, setWeightData] = useState([]);
  const [stepsData, setStepsData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [overviewRes, weightRes, stepsRes] = await Promise.all([
        api.get('/analytics/overview'),
        api.get('/analytics/weight', { period: 'month' }),
        api.get('/analytics/steps', { period: 'week' })
      ]);

      setOverview(overviewRes.data.data);
      setWeightData(weightRes.data.data.entries?.slice(-14) || []);
      setStepsData(stepsRes.data.data.daily?.slice(-7) || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ContentLoader />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Failed to load dashboard data</p>
        <Button onClick={fetchDashboardData}>Retry</Button>
      </div>
    );
  }

  const stepsPercentage = overview?.today?.steps
    ? Math.round((overview.today.steps / overview.today.stepsGoal) * 100)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Track your fitness progress</p>
        </div>
        {!overview?.plan && (
          <Link to="/plan">
            <Button>
              <Calendar className="h-4 w-4 mr-2" />
              Start a Plan
            </Button>
          </Link>
        )}
      </div>

      {/* Plan Progress */}
      {overview?.plan && (
        <Card className="bg-gradient-to-r from-primary/10 to-success/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={overview.plan.status === 'active' ? 'success' : 'warning'}>
                    {overview.plan.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Week {overview.plan.currentWeek} of {overview.plan.totalWeeks}
                  </span>
                </div>
                <h3 className="text-lg font-semibold">Your Fitness Plan</h3>
                <p className="text-sm text-muted-foreground">
                  {overview.plan.progressPercentage}% complete
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Progress
                  value={overview.plan.progressPercentage}
                  max={100}
                  className="w-32 sm:w-48"
                />
                <Link to="/plan">
                  <Button variant="outline" size="sm">
                    View Plan
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Current Weight"
          value={overview?.weight?.current ? `${overview.weight.current} ${overview.weight.unit}` : '--'}
          subtitle={
            overview?.weight?.change
              ? `${overview.weight.change > 0 ? '+' : ''}${overview.weight.change} ${overview.weight.unit} total`
              : 'No data yet'
          }
          icon={Scale}
          trend={overview?.weight?.change ? (overview.weight.change > 0 ? null : Math.abs(overview.weight.change * 2)) : null}
        />
        <StatsCard
          title="Today's Steps"
          value={formatNumber(overview?.today?.steps || 0)}
          subtitle={`Goal: ${formatNumber(overview?.today?.stepsGoal || 10000)}`}
          icon={Footprints}
        />
        <StatsCard
          title="Weekly Workouts"
          value={`${overview?.weekly?.workouts || 0}/${overview?.weekly?.workoutGoal || 4}`}
          subtitle="This week"
          icon={Dumbbell}
        />
        <StatsCard
          title="Today's Calories"
          value={formatNumber(overview?.today?.calories || 0)}
          subtitle={`${overview?.today?.mealsLogged || 0} meals logged`}
          icon={Utensils}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weight Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Weight Trend</CardTitle>
            <Link to="/weight">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {weightData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={weightData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    className="text-xs"
                  />
                  <YAxis domain={['auto', 'auto']} className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px'
                    }}
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    dot={{ fill: 'var(--color-primary)', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Scale className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No weight data yet</p>
                  <Link to="/weight">
                    <Button variant="link" size="sm">Log your weight</Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Steps Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Weekly Steps</CardTitle>
            <Link to="/steps">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {stepsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stepsData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px'
                    }}
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <Bar
                    dataKey="count"
                    fill="var(--color-success)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Footprints className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No steps data yet</p>
                  <Link to="/steps">
                    <Button variant="link" size="sm">Log your steps</Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Today's Progress */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Steps Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Steps Goal</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <CircularProgress
              value={overview?.today?.steps || 0}
              max={overview?.today?.stepsGoal || 10000}
              size={140}
            />
            <div className="mt-4 text-center">
              <p className="text-2xl font-bold">
                {formatNumber(overview?.today?.steps || 0)}
              </p>
              <p className="text-sm text-muted-foreground">
                of {formatNumber(overview?.today?.stepsGoal || 10000)} steps
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Streak */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current Streak</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-[calc(100%-4rem)]">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Flame className="h-8 w-8 text-warning" />
                <span className="text-4xl font-bold">{overview?.streak || 0}</span>
              </div>
              <p className="text-muted-foreground">
                {overview?.streak === 1 ? 'day' : 'days'} in a row
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/weight" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Scale className="h-4 w-4 mr-2" />
                Log Weight
              </Button>
            </Link>
            <Link to="/workout" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Dumbbell className="h-4 w-4 mr-2" />
                Log Workout
              </Button>
            </Link>
            <Link to="/steps" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Footprints className="h-4 w-4 mr-2" />
                Log Steps
              </Button>
            </Link>
            <Link to="/meals" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Utensils className="h-4 w-4 mr-2" />
                Log Meal
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
