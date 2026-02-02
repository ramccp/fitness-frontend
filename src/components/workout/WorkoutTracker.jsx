import { useState, useEffect } from 'react';
import { Dumbbell, Plus, Trash2, Edit2, Clock, Flame, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { ContentLoader } from '../ui/Spinner';
import { formatDate } from '../../lib/utils';

const COMMON_EXERCISES = [
  'Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 'Barbell Row',
  'Pull-ups', 'Push-ups', 'Dumbbell Curl', 'Tricep Dips', 'Lunges',
  'Leg Press', 'Lat Pulldown', 'Chest Fly', 'Shoulder Raise', 'Plank'
];

export function WorkoutTracker() {
  const [loading, setLoading] = useState(true);
  const [workouts, setWorkouts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [expandedWorkout, setExpandedWorkout] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    duration: '',
    caloriesBurned: '',
    notes: '',
    exercises: [{ name: '', sets: '', reps: '', weight: '', unit: 'kg', notes: '' }]
  });

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/workout');
      setWorkouts(response.data.data.workouts);
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

    const validExercises = formData.exercises.filter(ex => ex.name && ex.sets && ex.reps);

    if (validExercises.length === 0) {
      setError('Please add at least one exercise');
      setSaving(false);
      return;
    }

    const payload = {
      name: formData.name || 'Workout',
      date: formData.date,
      duration: formData.duration ? parseInt(formData.duration) : undefined,
      caloriesBurned: formData.caloriesBurned ? parseInt(formData.caloriesBurned) : undefined,
      notes: formData.notes,
      exercises: validExercises.map(ex => ({
        name: ex.name,
        sets: parseInt(ex.sets),
        reps: parseInt(ex.reps),
        weight: ex.weight ? parseFloat(ex.weight) : 0,
        unit: ex.unit,
        notes: ex.notes
      }))
    };

    try {
      if (editingWorkout) {
        await api.put(`/workout/${editingWorkout._id}`, payload);
      } else {
        await api.post('/workout', payload);
      }
      setShowAddModal(false);
      setEditingWorkout(null);
      resetForm();
      fetchWorkouts();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this workout?')) return;

    try {
      await api.delete(`/workout/${id}`);
      fetchWorkouts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (workout) => {
    setEditingWorkout(workout);
    setFormData({
      name: workout.name || '',
      date: new Date(workout.date).toISOString().split('T')[0],
      duration: workout.duration?.toString() || '',
      caloriesBurned: workout.caloriesBurned?.toString() || '',
      notes: workout.notes || '',
      exercises: workout.exercises.length > 0
        ? workout.exercises.map(ex => ({
            name: ex.name,
            sets: ex.sets.toString(),
            reps: ex.reps.toString(),
            weight: ex.weight?.toString() || '',
            unit: ex.unit || 'kg',
            notes: ex.notes || ''
          }))
        : [{ name: '', sets: '', reps: '', weight: '', unit: 'kg', notes: '' }]
    });
    setShowAddModal(true);
  };

  const addExercise = () => {
    setFormData({
      ...formData,
      exercises: [...formData.exercises, { name: '', sets: '', reps: '', weight: '', unit: 'kg', notes: '' }]
    });
  };

  const removeExercise = (index) => {
    setFormData({
      ...formData,
      exercises: formData.exercises.filter((_, i) => i !== index)
    });
  };

  const updateExercise = (index, field, value) => {
    const updated = [...formData.exercises];
    updated[index][field] = value;
    setFormData({ ...formData, exercises: updated });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      date: new Date().toISOString().split('T')[0],
      duration: '',
      caloriesBurned: '',
      notes: '',
      exercises: [{ name: '', sets: '', reps: '', weight: '', unit: 'kg', notes: '' }]
    });
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingWorkout(null);
    resetForm();
    setError(null);
  };

  if (loading) {
    return <ContentLoader />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Workout Tracker</h1>
          <p className="text-muted-foreground">Log and track your workouts</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Workout
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Workouts</p>
              <p className="text-2xl font-bold">{workouts.length}</p>
            </div>
            <Dumbbell className="h-8 w-8 text-primary opacity-50" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Duration</p>
              <p className="text-2xl font-bold">
                {workouts.reduce((sum, w) => sum + (w.duration || 0), 0)} min
              </p>
            </div>
            <Clock className="h-8 w-8 text-primary opacity-50" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Calories Burned</p>
              <p className="text-2xl font-bold">
                {workouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0).toLocaleString()}
              </p>
            </div>
            <Flame className="h-8 w-8 text-warning opacity-50" />
          </div>
        </Card>
      </div>

      {/* Workout List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Workouts</CardTitle>
        </CardHeader>
        <CardContent>
          {workouts.length > 0 ? (
            <div className="space-y-4">
              {workouts.map((workout) => (
                <div
                  key={workout._id}
                  className="border border-border rounded-lg overflow-hidden"
                >
                  <div
                    className="flex items-center justify-between p-4 bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors"
                    onClick={() => setExpandedWorkout(expandedWorkout === workout._id ? null : workout._id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Dumbbell className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{workout.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(workout.date)} - {workout.exercises.length} exercises
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
                        {workout.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {workout.duration} min
                          </span>
                        )}
                        {workout.caloriesBurned && (
                          <span className="flex items-center gap-1">
                            <Flame className="h-4 w-4" />
                            {workout.caloriesBurned} cal
                          </span>
                        )}
                      </div>
                      {expandedWorkout === workout._id ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </div>
                  </div>

                  {expandedWorkout === workout._id && (
                    <div className="p-4 border-t border-border">
                      <div className="space-y-2 mb-4">
                        {workout.exercises.map((exercise, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 rounded-lg bg-secondary/20"
                          >
                            <div>
                              <p className="font-medium">{exercise.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {exercise.sets} sets x {exercise.reps} reps
                                {exercise.weight > 0 && ` @ ${exercise.weight} ${exercise.unit}`}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {workout.notes && (
                        <p className="text-sm text-muted-foreground mb-4">{workout.notes}</p>
                      )}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(workout)}>
                          <Edit2 className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(workout._id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No workouts logged yet. Add your first workout!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={closeModal}
        title={editingWorkout ? 'Edit Workout' : 'Add Workout'}
        className="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Workout Name"
              type="text"
              placeholder="e.g., Leg Day"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Duration (minutes)"
              type="number"
              min="1"
              placeholder="e.g., 60"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            />
            <Input
              label="Calories Burned"
              type="number"
              min="0"
              placeholder="e.g., 300"
              value={formData.caloriesBurned}
              onChange={(e) => setFormData({ ...formData, caloriesBurned: e.target.value })}
            />
          </div>

          {/* Exercises */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Exercises</label>
              <Button type="button" variant="outline" size="sm" onClick={addExercise}>
                <Plus className="h-4 w-4 mr-1" />
                Add Exercise
              </Button>
            </div>

            {formData.exercises.map((exercise, index) => (
              <div key={index} className="p-4 rounded-lg border border-border space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Input
                      placeholder="Exercise name"
                      value={exercise.name}
                      onChange={(e) => updateExercise(index, 'name', e.target.value)}
                      list={`exercises-${index}`}
                    />
                    <datalist id={`exercises-${index}`}>
                      {COMMON_EXERCISES.map(ex => (
                        <option key={ex} value={ex} />
                      ))}
                    </datalist>
                  </div>
                  {formData.exercises.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="ml-2 text-destructive"
                      onClick={() => removeExercise(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <Input
                    type="number"
                    min="1"
                    placeholder="Sets"
                    value={exercise.sets}
                    onChange={(e) => updateExercise(index, 'sets', e.target.value)}
                  />
                  <Input
                    type="number"
                    min="1"
                    placeholder="Reps"
                    value={exercise.reps}
                    onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="Weight"
                    value={exercise.weight}
                    onChange={(e) => updateExercise(index, 'weight', e.target.value)}
                  />
                  <select
                    className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
                    value={exercise.unit}
                    onChange={(e) => updateExercise(index, 'unit', e.target.value)}
                  >
                    <option value="kg">kg</option>
                    <option value="lbs">lbs</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

          <Input
            label="Notes (Optional)"
            type="text"
            placeholder="How did the workout go?"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 justify-end pt-4 sticky bottom-0 bg-card">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editingWorkout ? 'Update' : 'Save'} Workout
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
