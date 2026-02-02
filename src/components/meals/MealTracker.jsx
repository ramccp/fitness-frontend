import { useState, useEffect } from 'react';
import { Utensils, Plus, Trash2, Edit2, Clock, Flame, Apple } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import api from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { ContentLoader } from '../ui/Spinner';
import { formatDate, getMealTypeLabel } from '../../lib/utils';

const MEAL_TYPES = [
  { value: 'upon_wakeup', label: 'Upon Wakeup' },
  { value: 'pre_workout', label: 'Pre-Workout' },
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'snacks', label: 'Snacks' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'other', label: 'Other' }
];

const MACRO_COLORS = {
  protein: '#0070f3',
  carbs: '#00dc82',
  fats: '#f5a623'
};

export function MealTracker() {
  const [loading, setLoading] = useState(true);
  const [todayMeals, setTodayMeals] = useState({ meals: [], totals: {} });
  const [allMeals, setAllMeals] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const [formData, setFormData] = useState({
    mealType: 'breakfast',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    items: [{ name: '', quantity: '', calories: '', protein: '', carbs: '', fats: '' }]
  });

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [todayRes, allRes] = await Promise.all([
        api.get(`/meals/date/${selectedDate}`),
        api.get('/meals', { limit: 50 })
      ]);
      setTodayMeals(todayRes.data.data);
      setAllMeals(allRes.data.data.meals);
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

    const validItems = formData.items.filter(item => item.name && item.quantity);

    if (validItems.length === 0) {
      setError('Please add at least one food item');
      setSaving(false);
      return;
    }

    const payload = {
      mealType: formData.mealType,
      date: formData.date,
      notes: formData.notes,
      items: validItems.map(item => ({
        name: item.name,
        quantity: item.quantity,
        calories: item.calories ? parseInt(item.calories) : 0,
        protein: item.protein ? parseInt(item.protein) : 0,
        carbs: item.carbs ? parseInt(item.carbs) : 0,
        fats: item.fats ? parseInt(item.fats) : 0
      }))
    };

    try {
      if (editingMeal) {
        await api.put(`/meals/${editingMeal._id}`, payload);
      } else {
        await api.post('/meals', payload);
      }
      setShowAddModal(false);
      setEditingMeal(null);
      resetForm();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this meal?')) return;

    try {
      await api.delete(`/meals/${id}`);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (meal) => {
    setEditingMeal(meal);
    setFormData({
      mealType: meal.mealType,
      date: new Date(meal.date).toISOString().split('T')[0],
      notes: meal.notes || '',
      items: meal.items.length > 0
        ? meal.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            calories: item.calories?.toString() || '',
            protein: item.protein?.toString() || '',
            carbs: item.carbs?.toString() || '',
            fats: item.fats?.toString() || ''
          }))
        : [{ name: '', quantity: '', calories: '', protein: '', carbs: '', fats: '' }]
    });
    setShowAddModal(true);
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { name: '', quantity: '', calories: '', protein: '', carbs: '', fats: '' }]
    });
  };

  const removeItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const updateItem = (index, field, value) => {
    const updated = [...formData.items];
    updated[index][field] = value;
    setFormData({ ...formData, items: updated });
  };

  const resetForm = () => {
    setFormData({
      mealType: 'breakfast',
      date: selectedDate,
      notes: '',
      items: [{ name: '', quantity: '', calories: '', protein: '', carbs: '', fats: '' }]
    });
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingMeal(null);
    resetForm();
    setError(null);
  };

  if (loading) {
    return <ContentLoader />;
  }

  const macroData = [
    { name: 'Protein', value: todayMeals.dailyTotals?.protein || 0, color: MACRO_COLORS.protein },
    { name: 'Carbs', value: todayMeals.dailyTotals?.carbs || 0, color: MACRO_COLORS.carbs },
    { name: 'Fats', value: todayMeals.dailyTotals?.fats || 0, color: MACRO_COLORS.fats }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Meal Tracker</h1>
          <p className="text-muted-foreground">Track your daily nutrition</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Meal
          </Button>
        </div>
      </div>

      {/* Daily Summary */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calories */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Today's Calories</p>
              <p className="text-3xl font-bold">{todayMeals.dailyTotals?.calories || 0}</p>
            </div>
            <Flame className="h-8 w-8 text-warning opacity-50" />
          </div>
          <p className="text-sm text-muted-foreground">
            {todayMeals.meals?.length || 0} meals logged
          </p>
        </Card>

        {/* Macros Chart */}
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">Macros Distribution</p>
          {macroData.length > 0 ? (
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie
                  data={macroData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  dataKey="value"
                >
                  {macroData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[120px] flex items-center justify-center text-muted-foreground text-sm">
              No data yet
            </div>
          )}
        </Card>

        {/* Macro Details */}
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-4">Macro Breakdown</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ background: MACRO_COLORS.protein }} />
                <span className="text-sm">Protein</span>
              </div>
              <span className="font-mono font-medium">{todayMeals.dailyTotals?.protein || 0}g</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ background: MACRO_COLORS.carbs }} />
                <span className="text-sm">Carbs</span>
              </div>
              <span className="font-mono font-medium">{todayMeals.dailyTotals?.carbs || 0}g</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ background: MACRO_COLORS.fats }} />
                <span className="text-sm">Fats</span>
              </div>
              <span className="font-mono font-medium">{todayMeals.dailyTotals?.fats || 0}g</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Today's Meals */}
      <Card>
        <CardHeader>
          <CardTitle>Meals for {formatDate(selectedDate)}</CardTitle>
        </CardHeader>
        <CardContent>
          {todayMeals.meals?.length > 0 ? (
            <div className="space-y-4">
              {MEAL_TYPES.map(mealType => {
                const mealsOfType = todayMeals.meals.filter(m => m.mealType === mealType.value);
                if (mealsOfType.length === 0) return null;

                return (
                  <div key={mealType.value}>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2 uppercase tracking-wider">
                      {mealType.label}
                    </h4>
                    {mealsOfType.map(meal => (
                      <div
                        key={meal._id}
                        className="p-4 rounded-lg border border-border bg-secondary/20 mb-2"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Utensils className="h-4 w-4 text-primary" />
                            <span className="font-medium">{getMealTypeLabel(meal.mealType)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(meal)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => handleDelete(meal._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {meal.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <span>{item.name} - {item.quantity}</span>
                              <span className="text-muted-foreground font-mono">
                                {item.calories > 0 && `${item.calories} cal`}
                              </span>
                            </div>
                          ))}
                        </div>
                        {meal.notes && (
                          <p className="text-sm text-muted-foreground mt-2">{meal.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Utensils className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No meals logged for this date</p>
              <Button variant="link" onClick={() => setShowAddModal(true)}>
                Log your first meal
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={closeModal}
        title={editingMeal ? 'Edit Meal' : 'Add Meal'}
        className="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Meal Type"
              value={formData.mealType}
              onChange={(e) => setFormData({ ...formData, mealType: e.target.value })}
              options={MEAL_TYPES}
            />
            <Input
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          {/* Food Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Food Items</label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>

            {formData.items.map((item, index) => (
              <div key={index} className="p-4 rounded-lg border border-border space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Food name"
                      value={item.name}
                      onChange={(e) => updateItem(index, 'name', e.target.value)}
                    />
                    <Input
                      placeholder="Quantity (e.g., 200g, 1 cup)"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    />
                  </div>
                  {formData.items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <Input
                    type="number"
                    min="0"
                    placeholder="Calories"
                    value={item.calories}
                    onChange={(e) => updateItem(index, 'calories', e.target.value)}
                  />
                  <Input
                    type="number"
                    min="0"
                    placeholder="Protein (g)"
                    value={item.protein}
                    onChange={(e) => updateItem(index, 'protein', e.target.value)}
                  />
                  <Input
                    type="number"
                    min="0"
                    placeholder="Carbs (g)"
                    value={item.carbs}
                    onChange={(e) => updateItem(index, 'carbs', e.target.value)}
                  />
                  <Input
                    type="number"
                    min="0"
                    placeholder="Fats (g)"
                    value={item.fats}
                    onChange={(e) => updateItem(index, 'fats', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <Input
            label="Notes (Optional)"
            type="text"
            placeholder="Any additional notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 justify-end pt-4 sticky bottom-0 bg-card">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editingMeal ? 'Update' : 'Save'} Meal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
