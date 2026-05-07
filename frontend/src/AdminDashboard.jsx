import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const emptyTrainer = {
  name: '',
  specialization: '',
  phone: '',
  email: '',
  experience_years: ''
};

const emptyPlan = {
  plan_name: '',
  duration_months: '',
  price: '',
  description: ''
};

const emptyClass = {
  class_name: '',
  trainer_id: '',
  schedule_date: '',
  schedule_time: '',
  capacity: '',
  plan_ids: [] 
};

const emptyEquipment = {
  equipment_name: '',
  quantity: '',
  purchase_date: '',
  status: ''
};

const emptyPayment = {
  subscription_id: '',
  amount: '',
  payment_method: ''
};

const emptyWorkoutPlan = {
  member_id: '',
  trainer_id: '',
  exercises: []
};

const emptyWorkoutExercise = {
  workout_plan_id: '',
  exercise_name: '',
  sets: '',
  reps: '',
  schedule_day: ''
};

const emptyCatalogExercise = {
  exercise_name: '',
  description: ''
};

const emptyDietPlan = {
  member_id: '',
  trainer_id: '',
  calorie_target: '',
  meal_schedule: ''
};

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [overview, setOverview] = useState(null);
  const [members, setMembers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [classes, setClasses] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [payments, setPayments] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [revenueReport, setRevenueReport] = useState(null);
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [exercisesCatalog, setExercisesCatalog] = useState([]);
  const [workoutExercises, setWorkoutExercises] = useState([]);
  const [dietPlans, setDietPlans] = useState([]);

  const [trainerForm, setTrainerForm] = useState(emptyTrainer);
  const [planForm, setPlanForm] = useState(emptyPlan);
  const [classForm, setClassForm] = useState(emptyClass);
  const [equipmentForm, setEquipmentForm] = useState(emptyEquipment);
  const [paymentForm, setPaymentForm] = useState(emptyPayment);
  const [workoutPlanForm, setWorkoutPlanForm] = useState(emptyWorkoutPlan);
  const [workoutExerciseForm, setWorkoutExerciseForm] = useState(emptyWorkoutExercise);
  const [catalogExerciseForm, setCatalogExerciseForm] = useState(emptyCatalogExercise);
  const [dietPlanForm, setDietPlanForm] = useState(emptyDietPlan);

  const [editingTrainerId, setEditingTrainerId] = useState(null);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [editingClassId, setEditingClassId] = useState(null);
  const [editingEquipmentId, setEditingEquipmentId] = useState(null);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editingExerciseId, setEditingExerciseId] = useState(null);
  const [editingCatalogExerciseId, setEditingCatalogExerciseId] = useState(null);
  const [editingDietPlanId, setEditingDietPlanId] = useState(null);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [showMemberPassword, setShowMemberPassword] = useState(false);
  const [memberForm, setMemberForm] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    age: '',
    gender: '',
    fitness_goal: '',
    status: 'active'
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchJson = async (url, options) => {
    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await response.json() : null;
    if (!response.ok) {
      const fallback = isJson ? data?.error : `Request failed (${response.status})`;
      throw new Error(fallback || 'Request failed');
    }
    if (!isJson) {
      throw new Error('Server did not return JSON');
    }
    return data;
  };

  const loadOverview = async () => {
    const data = await fetchJson('http://localhost:5000/api/admin/overview');
    setOverview(data);
  };

  const loadMembers = async () => {
    const data = await fetchJson('http://localhost:5000/api/admin/members');
    setMembers(data);
  };

  const loadTrainers = async () => {
    const data = await fetchJson('http://localhost:5000/api/trainers');
    setTrainers(data);
  };

  const loadPlans = async () => {
    const data = await fetchJson('http://localhost:5000/api/admin/plans');
    setPlans(data);
  };

  const loadClasses = async () => {
    const data = await fetchJson('http://localhost:5000/api/admin/classes');
    setClasses(data);
  };

  const loadEquipment = async () => {
    const data = await fetchJson('http://localhost:5000/api/admin/equipment');
    setEquipment(data);
  };

  const loadPayments = async () => {
    const data = await fetchJson('http://localhost:5000/api/admin/payments');
    setPayments(data);
  };

  const loadPendingPayments = async () => {
    const data = await fetchJson('http://localhost:5000/api/admin/payments/pending');
    setPendingPayments(data);
  };

  const loadRevenueReport = async () => {
    const data = await fetchJson('http://localhost:5000/api/admin/payments/revenue-report');
    setRevenueReport(data);
  };

  const loadWorkoutPlans = async () => {
    const data = await fetchJson('http://localhost:5000/api/admin/workout-plans');
    setWorkoutPlans(data);
  };

  const loadExercisesCatalog = async () => {
    const data = await fetchJson('http://localhost:5000/api/admin/exercises');
    setExercisesCatalog(data);
  };

  const loadWorkoutExercises = async () => {
    const data = await fetchJson('http://localhost:5000/api/admin/workout-exercises');
    setWorkoutExercises(data);
  };

  const loadDietPlans = async () => {
    const data = await fetchJson('http://localhost:5000/api/admin/diet-plans');
    setDietPlans(data);
  };

  useEffect(() => {
    const loadAll = async () => {
      setError('');
      try {
        await Promise.all([
          loadOverview(),
          loadMembers(),
          loadTrainers(),
          loadPlans(),
          loadClasses(),
          loadEquipment(),
          loadPayments(),
          loadPendingPayments(),
          loadRevenueReport(),
          loadWorkoutPlans(),
          loadExercisesCatalog(),
          loadWorkoutExercises(),
          loadDietPlans()
        ]);
      } catch (err) {
        console.error(err);
        setError(err.message);
      }
    };

    loadAll();
  }, []);

  useEffect(() => {
    if (activeTab !== 'trainers') {
      return;
    }

    const refreshTrainers = async () => {
      setError('');
      try {
        await loadTrainers();
      } catch (err) {
        console.error(err);
        setError(err.message);
      }
    };

    refreshTrainers();
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/';
  };

  const handleMemberEdit = (member) => {
    setEditingMemberId(member.member_id);
    setShowMemberForm(true);
    setMemberForm({
      full_name: member.full_name || '',
      email: member.email || '',
      password: '',
      phone: member.phone || '',
      age: member.age ?? '',
      gender: member.gender || '',
      fitness_goal: member.fitness_goal || '',
      status: member.status || 'active'
    });
  };

  const handleMemberSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (editingMemberId) {
        const data = await fetchJson(`http://localhost:5000/api/admin/members/${editingMemberId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(memberForm)
        });
        setMembers((prev) => prev.map((m) => (m.member_id === data.member_id ? data : m)));
        setEditingMemberId(null);
        setShowMemberForm(false);
        setShowMemberPassword(false);
      } else {
        const data = await fetchJson('http://localhost:5000/api/admin/members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(memberForm)
        });
        setMembers((prev) => [data, ...prev]);
        setMemberForm({
          full_name: '',
          email: '',
          password: '',
          phone: '',
          age: '',
          gender: '',
          fitness_goal: '',
          status: 'active'
        });
        setShowMemberForm(false);
        setShowMemberPassword(false);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMemberDelete = async (memberId) => {
    if (!window.confirm('Delete this member?')) {
      return;
    }
    setError('');
    try {
      await fetchJson(`http://localhost:5000/api/admin/members/${memberId}`, { method: 'DELETE' });
      setMembers((prev) => prev.filter((m) => m.member_id !== memberId));
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const handleTrainerSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const url = editingTrainerId
        ? `http://localhost:5000/api/trainers/${editingTrainerId}`
        : 'http://localhost:5000/api/trainers';
      const method = editingTrainerId ? 'PUT' : 'POST';
      const data = await fetchJson(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trainerForm)
      });
      if (editingTrainerId) {
        setTrainers((prev) => prev.map((t) => (t.trainer_id === data.trainer_id ? data : t)));
      } else {
        setTrainers((prev) => [data, ...prev]);
      }
      setTrainerForm(emptyTrainer);
      setEditingTrainerId(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTrainerDelete = async (trainerId) => {
    setError('');
    try {
      await fetchJson(`http://localhost:5000/api/trainers/${trainerId}`, { method: 'DELETE' });
      setTrainers((prev) => prev.filter((t) => t.trainer_id !== trainerId));
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const handlePlanSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const url = editingPlanId
        ? `http://localhost:5000/api/admin/plans/${editingPlanId}`
        : 'http://localhost:5000/api/admin/plans';
      const method = editingPlanId ? 'PUT' : 'POST';
      const data = await fetchJson(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planForm)
      });
      if (editingPlanId) {
        setPlans((prev) => prev.map((p) => (p.plan_id === data.plan_id ? data : p)));
      } else {
        setPlans((prev) => [data, ...prev]);
      }
      setPlanForm(emptyPlan);
      setEditingPlanId(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  const handlePlanDelete = async (planId) => {
    setError('');
    try {
      await fetchJson(`http://localhost:5000/api/admin/plans/${planId}`, { method: 'DELETE' });
      setPlans((prev) => prev.filter((p) => p.plan_id !== planId));
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };
// 🔥 Add this helper function
function convertTo24Hour(time) {
  if (!time) return null;

  if (typeof time !== 'string') {
    return null;
  }

  const trimmed = time.trim();

  // If already in HH:MM (from input type="time")
  if (/^\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}:00`;
  }

  // Accept HH:MM:SS or HH:MM:SS.sss
  const hhmmssMatch = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(?:\.\d+)?$/.exec(trimmed);
  if (hhmmssMatch) {
    return `${hhmmssMatch[1]}:${hhmmssMatch[2]}:${hhmmssMatch[3]}`;
  }

  return null;
}
 const handleClassSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    const normalizedTime = convertTo24Hour(classForm.schedule_time);
    if (!normalizedTime) {
      setError('Schedule time is required and must be in 24-hour HH:MM or HH:MM:SS format');
      setLoading(false);
      return;
    }

    const payload = {
      class_name: classForm.class_name.trim(),

      trainer_id: classForm.trainer_id
        ? Number(classForm.trainer_id)
        : null,

      schedule_date: classForm.schedule_date || null,

      // 🔥 FIX: convert time properly
      schedule_time: normalizedTime,

      capacity: classForm.capacity
        ? Number(classForm.capacity)
        : null,

      plan_ids: (classForm.plan_ids || []).map(id => Number(id))
    };

    console.log("FINAL PAYLOAD:", payload); // optional debug

    const url = editingClassId
      ? `http://localhost:5000/api/admin/classes/${editingClassId}`
      : 'http://localhost:5000/api/admin/classes';

    const method = editingClassId ? 'PUT' : 'POST';

    const data = await fetchJson(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (editingClassId) {
      setClasses(prev =>
        prev.map(c => (c.class_id === data.class_id ? data : c))
      );
    } else {
      setClasses(prev => [data, ...prev]);
    }

    setClassForm(emptyClass);
    setEditingClassId(null);

  } catch (err) {
    console.error(err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

  const handleClassDelete = async (classId) => {
    setError('');
    try {
      await fetchJson(`http://localhost:5000/api/admin/classes/${classId}`, { method: 'DELETE' });
      setClasses((prev) => prev.filter((c) => c.class_id !== classId));
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const handleEquipmentSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const url = editingEquipmentId
        ? `http://localhost:5000/api/admin/equipment/${editingEquipmentId}`
        : 'http://localhost:5000/api/admin/equipment';
      const method = editingEquipmentId ? 'PUT' : 'POST';
      const data = await fetchJson(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(equipmentForm)
      });
      if (editingEquipmentId) {
        setEquipment((prev) => prev.map((item) => (item.equipment_id === data.equipment_id ? data : item)));
      } else {
        setEquipment((prev) => [data, ...prev]);
      }
      setEquipmentForm(emptyEquipment);
      setEditingEquipmentId(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEquipmentDelete = async (equipmentId) => {
    setError('');
    try {
      await fetchJson(`http://localhost:5000/api/admin/equipment/${equipmentId}`, { method: 'DELETE' });
      setEquipment((prev) => prev.filter((item) => item.equipment_id !== equipmentId));
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await fetchJson('http://localhost:5000/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentForm)
      });
      setPayments((prev) => [data, ...prev]);
      setPaymentForm(emptyPayment);
      // Reload related data
      await Promise.all([
        loadPendingPayments(),
        loadRevenueReport(),
        loadOverview()
      ]);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkoutPlanSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        member_id: workoutPlanForm.member_id,
        trainer_id: workoutPlanForm.trainer_id || null,
        exercises: workoutPlanForm.exercises
      };

      await fetchJson('http://localhost:5000/api/admin/workout-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      await loadWorkoutPlans();
      setWorkoutPlanForm(emptyWorkoutPlan);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkoutExerciseSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        workout_plan_id: workoutExerciseForm.workout_plan_id,
        exercise_name: workoutExerciseForm.exercise_name,
        sets: workoutExerciseForm.sets,
        reps: workoutExerciseForm.reps,
        schedule_day: workoutExerciseForm.schedule_day || null
      };

      const url = editingExerciseId
        ? `http://localhost:5000/api/admin/workout-exercises/${editingExerciseId}`
        : 'http://localhost:5000/api/admin/workout-exercises';
      const method = editingExerciseId ? 'PUT' : 'POST';

      await fetchJson(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      await Promise.all([loadWorkoutExercises(), loadWorkoutPlans(), loadExercisesCatalog()]);
      setWorkoutExerciseForm(emptyWorkoutExercise);
      setEditingExerciseId(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkoutExerciseDelete = async (exerciseId) => {
    if (!window.confirm('Delete this exercise?')) {
      return;
    }
    setError('');
    try {
      await fetchJson(`http://localhost:5000/api/admin/workout-exercises/${exerciseId}`, { method: 'DELETE' });
      await Promise.all([loadWorkoutExercises(), loadWorkoutPlans(), loadExercisesCatalog()]);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const handleCatalogExerciseSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        exercise_name: catalogExerciseForm.exercise_name,
        description: catalogExerciseForm.description
      };

      const url = editingCatalogExerciseId
        ? `http://localhost:5000/api/admin/exercises/${editingCatalogExerciseId}`
        : 'http://localhost:5000/api/admin/exercises';
      const method = editingCatalogExerciseId ? 'PUT' : 'POST';

      await fetchJson(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      await loadExercisesCatalog();
      setCatalogExerciseForm(emptyCatalogExercise);
      setEditingCatalogExerciseId(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCatalogExerciseDelete = async (exerciseId) => {
    if (!window.confirm('Delete this exercise from the catalog?')) {
      return;
    }
    setError('');
    try {
      await fetchJson(`http://localhost:5000/api/admin/exercises/${exerciseId}`, { method: 'DELETE' });
      await loadExercisesCatalog();
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const handleDietPlanSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        member_id: dietPlanForm.member_id,
        trainer_id: dietPlanForm.trainer_id || null,
        calorie_target: dietPlanForm.calorie_target,
        meal_schedule: dietPlanForm.meal_schedule
      };

      const url = editingDietPlanId
        ? `http://localhost:5000/api/admin/diet-plans/${editingDietPlanId}`
        : 'http://localhost:5000/api/admin/diet-plans';
      const method = editingDietPlanId ? 'PUT' : 'POST';

      await fetchJson(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      await loadDietPlans();
      setDietPlanForm(emptyDietPlan);
      setEditingDietPlanId(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDietPlanDelete = async (dietPlanId) => {
    if (!window.confirm('Delete this diet plan?')) {
      return;
    }
    setError('');
    try {
      await fetchJson(`http://localhost:5000/api/admin/diet-plans/${dietPlanId}`, { method: 'DELETE' });
      await loadDietPlans();
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  return (
    <div className="admin-dashboard-wrapper">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-header-content">
          <h1>Admin Dashboard</h1>
          <div className="admin-header-right">
            <span>Logged in as <strong>Admin</strong></span>
            <button className="admin-settings-btn" title="Logout" onClick={handleLogout}>⚙️</button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="admin-tabs-container">
        <div className="admin-tabs">
          <button 
            className={`admin-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={`admin-tab ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            Members
          </button>
          <button 
            className={`admin-tab ${activeTab === 'trainers' ? 'active' : ''}`}
            onClick={() => setActiveTab('trainers')}
          >
            Trainers
          </button>
          <button 
            className={`admin-tab ${activeTab === 'plans' ? 'active' : ''}`}
            onClick={() => setActiveTab('plans')}
          >
            Plans
          </button>
          <button 
            className={`admin-tab ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            Payments
          </button>
          <button 
            className={`admin-tab ${activeTab === 'classes' ? 'active' : ''}`}
            onClick={() => setActiveTab('classes')}
          >
            Classes
          </button>
          <button 
            className={`admin-tab ${activeTab === 'equipment' ? 'active' : ''}`}
            onClick={() => setActiveTab('equipment')}
          >
            Equipment
          </button>
          <button 
            className={`admin-tab ${activeTab === 'workout-plans' ? 'active' : ''}`}
            onClick={() => setActiveTab('workout-plans')}
          >
            Workout Plans
          </button>
          <button 
            className={`admin-tab ${activeTab === 'workout-exercises' ? 'active' : ''}`}
            onClick={() => setActiveTab('workout-exercises')}
          >
            Exercises
          </button>
          <button
            className={`admin-tab ${activeTab === 'diet-plans' ? 'active' : ''}`}
            onClick={() => setActiveTab('diet-plans')}
          >
            Diet Plans
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-content">
        {error && <div className="admin-error-banner">{error}</div>}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="admin-section-full">
            <h2>Overview</h2>
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <span>Members</span>
                <strong>{overview ? overview.members : '--'}</strong>
              </div>
              <div className="admin-stat-card">
                <span>Active Members</span>
                <strong>{overview ? overview.activeMembers : '--'}</strong>
              </div>
              <div className="admin-stat-card">
                <span>Trainers</span>
                <strong>{overview ? overview.trainers : '--'}</strong>
              </div>
              <div className="admin-stat-card">
                <span>Plans</span>
                <strong>{overview ? overview.plans : '--'}</strong>
              </div>
              <div className="admin-stat-card">
                <span>Total Revenue</span>
                <strong>{overview ? overview.revenue : '--'}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div className="admin-section-full">
            <div className="admin-section-header">
              <h2>Member Management</h2>
              <p>View members, update profiles, or manage access.</p>
              <button
                className="admin-btn-primary"
                onClick={() => {
                  setEditingMemberId(null);
                  setMemberForm({
                    full_name: '',
                    email: '',
                    password: '',
                    phone: '',
                    age: '',
                    gender: '',
                    fitness_goal: '',
                    status: 'active'
                  });
                  setShowMemberForm(true);
                  setShowMemberPassword(false);
                }}
              >
                Add Member
              </button>
            </div>
            <div className={`admin-grid-layout ${showMemberForm ? '' : 'admin-grid-single'}`}>
              {showMemberForm && (
                <form className="admin-form-panel" onSubmit={handleMemberSave}>
                  <h3>{editingMemberId ? 'Edit Member' : 'Add Member'}</h3>
                  <label className="admin-form-label" htmlFor="member-full-name">Full Name</label>
                  <input
                    className="admin-form-input"
                    id="member-full-name"
                    name="full_name"
                    value={memberForm.full_name}
                    onChange={(e) => setMemberForm({ ...memberForm, full_name: e.target.value })}
                    placeholder="Full name"
                    autoComplete="off"
                    required
                  />
                  <label className="admin-form-label" htmlFor="member-email">Email</label>
                  <input
                    className="admin-form-input"
                    id="member-email"
                    name="email"
                    value={memberForm.email}
                    onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                    placeholder="Email"
                    autoComplete="off"
                    required
                  />
                  {!editingMemberId && (
                    <div className="admin-password-wrapper">
                      <label className="admin-form-label" htmlFor="member-password">Password</label>
                      <input
                        className="admin-form-input"
                        type={showMemberPassword ? 'text' : 'password'}
                        id="member-password"
                        name="password"
                        value={memberForm.password}
                        onChange={(e) => setMemberForm({ ...memberForm, password: e.target.value })}
                        placeholder="Password (6+ characters)"
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        className="admin-eye-btn"
                        onClick={() => setShowMemberPassword((prev) => !prev)}
                        aria-label={showMemberPassword ? 'Hide password' : 'Show password'}
                      >
                        {showMemberPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  )}
                  <label className="admin-form-label" htmlFor="member-phone">Phone</label>
                  <input
                    className="admin-form-input"
                    id="member-phone"
                    name="phone"
                    value={memberForm.phone}
                    onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                    placeholder="Phone"
                    autoComplete="off"
                  />
                  <label className="admin-form-label" htmlFor="member-age">Age</label>
                  <input
                    className="admin-form-input"
                    type="number"
                    id="member-age"
                    name="age"
                    value={memberForm.age}
                    onChange={(e) => setMemberForm({ ...memberForm, age: e.target.value })}
                    placeholder="Age"
                    autoComplete="off"
                    min="0"
                    step="1"
                  />
                  <label className="admin-form-label" htmlFor="member-gender">Gender</label>
                  <input
                    className="admin-form-input"
                    id="member-gender"
                    name="gender"
                    value={memberForm.gender}
                    onChange={(e) => setMemberForm({ ...memberForm, gender: e.target.value })}
                    placeholder="Gender"
                    autoComplete="off"
                  />
                  <label className="admin-form-label" htmlFor="member-fitness-goal">Fitness Goal</label>
                  <input
                    className="admin-form-input"
                    id="member-fitness-goal"
                    name="fitness_goal"
                    value={memberForm.fitness_goal}
                    onChange={(e) => setMemberForm({ ...memberForm, fitness_goal: e.target.value })}
                    placeholder="Fitness goal"
                    autoComplete="off"
                  />
                  <label className="admin-form-label" htmlFor="member-status">Status</label>
                  <select
                    className="admin-form-input"
                    id="member-status"
                    name="status"
                    value={memberForm.status}
                    onChange={(e) => setMemberForm({ ...memberForm, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <div className="admin-card-actions">
                    <button className="admin-btn-primary" type="submit" disabled={loading}>
                      {loading ? 'Saving...' : editingMemberId ? 'Update Member' : 'Add Member'}
                    </button>
                    <button
                      type="button"
                      className="admin-btn-secondary"
                      onClick={() => {
                        setShowMemberForm(false);
                        setEditingMemberId(null);
                        setShowMemberPassword(false);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="admin-list-panel">
                <h3>Members</h3>
                {members.length === 0 ? (
                  <p className="admin-empty">No members found.</p>
                ) : (
                  members.map((member) => (
                    <div key={member.member_id} className="admin-card">
                      <div>
                        <h4>{member.full_name}</h4>
                        <p className="admin-card-email">{member.email}</p>
                        <div className="admin-card-meta">
                          {member.phone && <span>{member.phone}</span>}
                          <span className={`status-badge status-${member.status}`}>{member.status}</span>
                        </div>
                      </div>
                      <div className="admin-card-actions">
                        <button 
                          className="admin-btn-secondary"
                          onClick={() => handleMemberEdit(member)}
                        >
                          Edit
                        </button>
                        <button
                          className="admin-btn-danger"
                          onClick={() => handleMemberDelete(member.member_id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Trainers Tab */}
        {activeTab === 'trainers' && (
          <div className="admin-section-full">
            <div className="admin-section-header">
              <h2>Trainer Management</h2>
              <p>Add, edit, or remove trainers.</p>
              <button className="admin-btn-secondary" onClick={loadTrainers}>
                Refresh
              </button>
            </div>
            <div className="admin-grid-layout">
              <form className="admin-form-panel" onSubmit={handleTrainerSubmit}>
                <h3>{editingTrainerId ? 'Edit' : 'Add'} Trainer</h3>
                <label className="admin-form-label" htmlFor="trainer-name">Trainer Name</label>
                <input
                  className="admin-form-input"
                  id="trainer-name"
                  name="name"
                  value={trainerForm.name}
                  onChange={(e) => setTrainerForm({ ...trainerForm, name: e.target.value })}
                  placeholder="Trainer name"
                  required
                />
                <label className="admin-form-label" htmlFor="trainer-specialization">Specialization</label>
                <input
                  className="admin-form-input"
                  id="trainer-specialization"
                  name="specialization"
                  value={trainerForm.specialization}
                  onChange={(e) => setTrainerForm({ ...trainerForm, specialization: e.target.value })}
                  placeholder="Specialization"
                />
                <label className="admin-form-label" htmlFor="trainer-phone">Phone</label>
                <input
                  className="admin-form-input"
                  id="trainer-phone"
                  name="phone"
                  value={trainerForm.phone}
                  onChange={(e) => setTrainerForm({ ...trainerForm, phone: e.target.value })}
                  placeholder="Phone"
                />
                <label className="admin-form-label" htmlFor="trainer-email">Email</label>
                <input
                  className="admin-form-input"
                  id="trainer-email"
                  name="email"
                  value={trainerForm.email}
                  onChange={(e) => setTrainerForm({ ...trainerForm, email: e.target.value })}
                  placeholder="Email"
                />
                <label className="admin-form-label" htmlFor="trainer-experience">Experience (years)</label>
                <input
                  className="admin-form-input"
                  type="number"
                  id="trainer-experience"
                  name="experience_years"
                  value={trainerForm.experience_years}
                  onChange={(e) => setTrainerForm({ ...trainerForm, experience_years: e.target.value })}
                  placeholder="Experience (years)"
                  min="0"
                  step="1"
                />
                <button className="admin-btn-primary" type="submit" disabled={loading}>
                  {loading ? 'Saving...' : editingTrainerId ? 'Update' : 'Add Trainer'}
                </button>
              </form>

              <div className="admin-list-panel">
                <h3>Trainers</h3>
                {trainers.length === 0 ? (
                  <p className="admin-empty">No trainers yet.</p>
                ) : (
                  trainers.map((trainer) => (
                    <div key={trainer.trainer_id} className="admin-card">
                      <div>
                        <h4>{trainer.name}</h4>
                        <p className="admin-card-email">{trainer.specialization || 'General Trainer'}</p>
                        <div className="admin-card-meta">
                          {trainer.phone && <span>{trainer.phone}</span>}
                          {trainer.experience_years !== null && trainer.experience_years !== undefined && (
                            <span>{trainer.experience_years} yrs exp</span>
                          )}
                        </div>
                      </div>
                      <div className="admin-card-actions">
                        <button
                          className="admin-btn-secondary"
                          onClick={() => {
                            setEditingTrainerId(trainer.trainer_id);
                            setTrainerForm({
                              name: trainer.name || '',
                              specialization: trainer.specialization || '',
                              phone: trainer.phone || '',
                              email: trainer.email || '',
                              experience_years: trainer.experience_years ?? ''
                            });
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="admin-btn-danger"
                          onClick={() => handleTrainerDelete(trainer.trainer_id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Plans Tab */}
        {activeTab === 'plans' && (
          <div className="admin-section-full">
            <div className="admin-section-header">
              <h2>Membership Plans</h2>
              <p>Create, update, or delete membership plans.</p>
            </div>
            <div className="admin-grid-layout">
              <form className="admin-form-panel" onSubmit={handlePlanSubmit}>
                <h3>{editingPlanId ? 'Edit' : 'Add'} Plan</h3>
                <label className="admin-form-label" htmlFor="plan-name">Plan Name</label>
                <input
                  className="admin-form-input"
                  id="plan-name"
                  name="plan_name"
                  value={planForm.plan_name}
                  onChange={(e) => setPlanForm({ ...planForm, plan_name: e.target.value })}
                  placeholder="Plan name"
                  required
                />
                <label className="admin-form-label" htmlFor="plan-duration">Duration (months)</label>
                <input
                  className="admin-form-input"
                  type="number"
                  id="plan-duration"
                  name="duration_months"
                  value={planForm.duration_months}
                  onChange={(e) => setPlanForm({ ...planForm, duration_months: e.target.value })}
                  placeholder="Duration (months)"
                  min="0"
                  step="1"
                />
                <label className="admin-form-label" htmlFor="plan-price">Price</label>
                <input
                  className="admin-form-input"
                  type="number"
                  id="plan-price"
                  name="price"
                  value={planForm.price}
                  onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                  placeholder="Price"
                  min="0"
                  step="0.01"
                />
                <label className="admin-form-label" htmlFor="plan-description">Benefits / Description</label>
                <textarea
                  className="admin-form-input"
                  id="plan-description"
                  name="description"
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  placeholder="Description"
                  rows="3"
                ></textarea>
                <button className="admin-btn-primary" type="submit" disabled={loading}>
                  {loading ? 'Saving...' : editingPlanId ? 'Update' : 'Add Plan'}
                </button>
              </form>

              <div className="admin-list-panel">
                <h3>Plans</h3>
                {plans.length === 0 ? (
                  <p className="admin-empty">No plans found.</p>
                ) : (
                  plans.map((plan) => (
                    <div key={plan.plan_id} className="admin-card">
                      <div>
                        <h4>{plan.plan_name}</h4>
                        <p className="admin-card-email">{plan.description || 'No description'}</p>
                        <div className="admin-card-meta">
                          {plan.duration_months && <span>{plan.duration_months} months</span>}
                          {plan.price && <span>PKR {plan.price}</span>}
                        </div>
                      </div>
                      <div className="admin-card-actions">
                        <button
                          className="admin-btn-secondary"
                          onClick={() => {
                            setEditingPlanId(plan.plan_id);
                            setPlanForm({
                              plan_name: plan.plan_name || '',
                              duration_months: plan.duration_months ?? '',
                              price: plan.price ?? '',
                              description: plan.description || ''
                            });
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="admin-btn-danger"
                          onClick={() => handlePlanDelete(plan.plan_id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="admin-section-full">
            <div className="admin-section-header">
              <h2>Payment & Billing Management</h2>
              <p>Record payments, track transaction history, and monitor revenue.</p>
            </div>

            {/* Revenue Report Section */}
            {revenueReport && (
              <div className="admin-section">
                <h3>Revenue Report</h3>
                <div className="admin-stats-grid">
                  <div className="admin-stat-card">
                    <span>Total Revenue</span>
                    <strong>PKR {revenueReport.totals?.total_revenue || 0}</strong>
                  </div>
                  <div className="admin-stat-card">
                    <span>Total Transactions</span>
                    <strong>{revenueReport.totals?.total_transactions || 0}</strong>
                  </div>
                  <div className="admin-stat-card">
                    <span>Average Transaction</span>
                    <strong>PKR {revenueReport.totals?.avg_transaction ? Math.round(revenueReport.totals.avg_transaction) : 0}</strong>
                  </div>
                </div>
                {revenueReport.byMethod && revenueReport.byMethod.length > 0 && (
                  <div className="admin-section">
                    <h4>Revenue by Payment Method</h4>
                    <div className="admin-stats-grid">
                      {revenueReport.byMethod.map((method) => (
                        <div key={method.payment_method} className="admin-stat-card">
                          <span>{method.payment_method.charAt(0).toUpperCase() + method.payment_method.slice(1)}</span>
                          <strong>PKR {method.total_amount} ({method.transaction_count} txns)</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pending Payments Section */}
            <div className="admin-section">
              <h3>Pending & Overdue Payments</h3>
              {pendingPayments.length === 0 ? (
                <p className="admin-empty">No pending payments.</p>
              ) : (
                <div className="admin-list-panel">
                  {pendingPayments.map((payment) => (
                    <div key={payment.subscription_id} className="admin-card">
                      <div>
                        <h4>{payment.member_name}</h4>
                        <p className="admin-card-email">{payment.email}</p>
                        <div className="admin-card-meta">
                          <span className={`status-badge status-${payment.status === 'overdue' ? 'danger' : payment.status === 'due_soon' ? 'warning' : 'info'}`}>
                            {payment.status === 'overdue' ? 'Overdue' : payment.status === 'due_soon' ? 'Due Soon' : 'Active'}
                          </span>
                          <span>{payment.plan_name} - PKR {payment.price}</span>
                          {payment.days_remaining !== null && payment.days_remaining >= 0 && (
                            <span>{payment.days_remaining} days remaining</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="admin-grid-layout">
              {/* Record Payment Form */}
              <form className="admin-form-panel" onSubmit={handlePaymentSubmit}>
                <h3>Record New Payment</h3>
                <input
                  className="admin-form-input"
                  name="subscription_id"
                  value={paymentForm.subscription_id}
                  onChange={(e) => setPaymentForm({ ...paymentForm, subscription_id: e.target.value })}
                  placeholder="Subscription ID"
                  required
                />
                <input
                  className="admin-form-input"
                  type="number"
                  name="amount"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  placeholder="Amount (PKR)"
                  min="0"
                  step="0.01"
                  required
                />
                <select
                  className="admin-form-input"
                  name="payment_method"
                  value={paymentForm.payment_method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                  required
                >
                  <option value="">Select Payment Method</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="online">Online</option>
                </select>
                <button className="admin-btn-primary" type="submit" disabled={loading}>
                  {loading ? 'Recording...' : 'Record Payment'}
                </button>
              </form>

              {/* Transaction History */}
              <div className="admin-list-panel">
                <h3>Transaction History</h3>
                {payments.length === 0 ? (
                  <p className="admin-empty">No payments recorded yet.</p>
                ) : (
                  payments.map((payment) => (
                    <div key={payment.payment_id} className="admin-card">
                      <div>
                        <h4>{payment.member_name}</h4>
                        <p className="admin-card-email">{payment.plan_name} - Subscription #{payment.subscription_id}</p>
                        <div className="admin-card-meta">
                          <span className="status-badge status-completed">{payment.payment_method}</span>
                          <span><strong>PKR {payment.amount}</strong></span>
                          <span>{payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Classes Tab */}
        {activeTab === 'classes' && (
          <div className="admin-section-full">
            <div className="admin-section-header">
              <h2>Class & Schedule Management</h2>
              <button className="admin-btn-primary" onClick={() => setEditingClassId(null)}>
                + Create New Class
              </button>
            </div>
            <div className="admin-grid-layout">
              <form className="admin-form-panel" onSubmit={handleClassSubmit}>
                <h3>{editingClassId ? 'Edit' : 'Add'} Class</h3>
                <input
                  className="admin-form-input"
                  name="class_name"
                  value={classForm.class_name}
                  onChange={(e) => setClassForm({ ...classForm, class_name: e.target.value })}
                  placeholder="Class name"
                  required
                />
                <select
                  className="admin-form-input"
                  name="trainer_id"
                  value={classForm.trainer_id}
                  onChange={(e) => setClassForm({ ...classForm, trainer_id: e.target.value })}
                >
                  <option value="">Assign trainer</option>
                  {trainers.map((trainer) => (
                    <option key={trainer.trainer_id} value={trainer.trainer_id}>
                      {trainer.name}
                    </option>
                  ))}
                </select>
                <input
                  className="admin-form-input"
                  type="date"
                  name="schedule_date"
                  value={classForm.schedule_date}
                  onChange={(e) => setClassForm({ ...classForm, schedule_date: e.target.value })}
                />
                <input
                  className="admin-form-input"
                  type="time"
                  name="schedule_time"
                  value={classForm.schedule_time}
                  onChange={(e) => setClassForm({ ...classForm, schedule_time: e.target.value })}
                />
                <input
                  className="admin-form-input"
                  type="number"
                  name="capacity"
                  value={classForm.capacity}
                  onChange={(e) => setClassForm({ ...classForm, capacity: e.target.value })}
                  placeholder="Capacity"
                  min="0"
                  step="1"
                />
                <label htmlFor="plan_ids" style={{ fontSize: '14px', fontWeight: '500', marginTop: '10px', display: 'block' }}>
                  Link Membership Plans (Hold Ctrl/Cmd to select multiple):
                </label>
                <select
                  id="plan_ids"
                  className="admin-form-input"
                  name="plan_ids"
                  multiple
                  value={classForm.plan_ids}
                  onChange={(e) => {
                    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                    setClassForm({ ...classForm, plan_ids: selectedOptions });
                  }}
                  style={{ minHeight: '100px' }}
                >
                  {plans.map((plan) => (
                    <option key={plan.plan_id} value={plan.plan_id}>
                      {plan.plan_name} ({plan.duration_months} months) - PKR {plan.price}
                    </option>
                  ))}
                </select>
                <button className="admin-btn-primary" type="submit" disabled={loading}>
                  {loading ? 'Saving...' : editingClassId ? 'Update Class' : 'Add Class'}
                </button>
              </form>

              <div className="admin-list-panel">
                <h3>Classes</h3>
                {classes.length === 0 ? (
                  <p className="admin-empty">No classes scheduled.</p>
                ) : (
                  classes.map((gymClass) => (
                    <div key={gymClass.class_id} className="admin-card">
                      <div>
                        <h4>{gymClass.class_name}</h4>
                        <p className="admin-card-email">Instructor: {gymClass.trainer_id || 'Unassigned'}</p>
                        <div className="admin-card-meta">
                          {gymClass.schedule_date && <span>{String(gymClass.schedule_date).split('T')[0]}</span>}
                          {gymClass.schedule_time && <span>{String(gymClass.schedule_time).slice(0, 5)}</span>}
                          {gymClass.capacity && <span className="status-badge">{gymClass.capacity} seats</span>}
                        </div>
                        {gymClass.associated_plans && (
                          <p style={{ fontSize: '12px', marginTop: '8px', color: '#666' }}>
                            <strong>Plans:</strong> {gymClass.associated_plans}
                          </p>
                        )}
                      </div>
                      <div className="admin-card-actions">
                        <button
                          className="admin-btn-secondary"
                          onClick={() => {
                            setEditingClassId(gymClass.class_id);
                            setClassForm({
                              class_name: gymClass.class_name || '',
                              trainer_id: gymClass.trainer_id || '',
                              schedule_date: gymClass.schedule_date
                                ? String(gymClass.schedule_date).split('T')[0]
                                : '',
                              schedule_time: gymClass.schedule_time
                                ? String(gymClass.schedule_time).slice(0, 5)
                                : '',
                              capacity: gymClass.capacity ?? '',
                              plan_ids: gymClass.plan_ids ? gymClass.plan_ids.split(',').filter(id => id) : []
                            });
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="admin-btn-danger"
                          onClick={() => handleClassDelete(gymClass.class_id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Equipment Tab */}
        {activeTab === 'equipment' && (
          <div className="admin-section-full">
            <div className="admin-section-header">
              <h2>Equipment Management</h2>
              <p>Track gym equipment and maintenance status.</p>
            </div>
            <div className="admin-grid-layout">
              <form className="admin-form-panel" onSubmit={handleEquipmentSubmit}>
                <h3>{editingEquipmentId ? 'Edit' : 'Add'} Equipment</h3>
                <input
                  className="admin-form-input"
                  name="equipment_name"
                  value={equipmentForm.equipment_name}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, equipment_name: e.target.value })}
                  placeholder="Equipment name"
                  required
                />
                <input
                  className="admin-form-input"
                  type="number"
                  name="quantity"
                  value={equipmentForm.quantity}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, quantity: e.target.value })}
                  placeholder="Quantity"
                  min="0"
                  step="1"
                />
                <input
                  className="admin-form-input"
                  type="date"
                  name="purchase_date"
                  value={equipmentForm.purchase_date}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, purchase_date: e.target.value })}
                />
                <select
                  className="admin-form-input"
                  name="status"
                  value={equipmentForm.status}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, status: e.target.value })}
                >
                  <option value="">Status</option>
                  <option value="available">Available</option>
                  <option value="in_use">In Use</option>
                  <option value="maintenance">Maintenance</option>
                </select>
                <button className="admin-btn-primary" type="submit" disabled={loading}>
                  {loading ? 'Saving...' : editingEquipmentId ? 'Update' : 'Add Equipment'}
                </button>
              </form>

              <div className="admin-list-panel">
                <h3>Equipment</h3>
                {equipment.length === 0 ? (
                  <p className="admin-empty">No equipment listed.</p>
                ) : (
                  equipment.map((item) => (
                    <div key={item.equipment_id} className="admin-card">
                      <div>
                        <h4>{item.equipment_name}</h4>
                        <p className="admin-card-email">Status: {item.status || 'Unknown'}</p>
                        <div className="admin-card-meta">
                          {item.quantity !== null && item.quantity !== undefined && (
                            <span>{item.quantity} units</span>
                          )}
                          {item.purchase_date && <span>{String(item.purchase_date).split('T')[0]}</span>}
                        </div>
                      </div>
                      <div className="admin-card-actions">
                        <button
                          className="admin-btn-secondary"
                          onClick={() => {
                            setEditingEquipmentId(item.equipment_id);
                            setEquipmentForm({
                              equipment_name: item.equipment_name || '',
                              quantity: item.quantity ?? '',
                              purchase_date: item.purchase_date
                                ? String(item.purchase_date).split('T')[0]
                                : '',
                              status: item.status || ''
                            });
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="admin-btn-danger"
                          onClick={() => handleEquipmentDelete(item.equipment_id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'workout-plans' && (
          <div className="admin-section-full">
            <div className="admin-section-header">
              <h2>Workout Plan Management</h2>
              <p>Create workout plans and assign them to members.</p>
            </div>
            <div className="admin-grid-layout">
              <form className="admin-form-panel" onSubmit={handleWorkoutPlanSubmit}>
                <h3>Add Workout Plan</h3>
                <label className="admin-form-label" htmlFor="workout-member">Member</label>
                <select
                  className="admin-form-input"
                  id="workout-member"
                  name="member_id"
                  value={workoutPlanForm.member_id}
                  onChange={(e) => setWorkoutPlanForm({ ...workoutPlanForm, member_id: e.target.value })}
                  required
                >
                  <option value="">Select member</option>
                  {members.map((member) => (
                    <option key={member.member_id} value={member.member_id}>
                      {member.full_name} (#{member.member_id})
                    </option>
                  ))}
                </select>
                <label className="admin-form-label" htmlFor="workout-trainer">Trainer</label>
                <select
                  className="admin-form-input"
                  id="workout-trainer"
                  name="trainer_id"
                  value={workoutPlanForm.trainer_id}
                  onChange={(e) => setWorkoutPlanForm({ ...workoutPlanForm, trainer_id: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  {trainers.map((trainer) => (
                    <option key={trainer.trainer_id} value={trainer.trainer_id}>
                      {trainer.name}
                    </option>
                  ))}
                </select>

                <div className="admin-workout-exercise-header">
                  <span>Exercises</span>
                  <span className="admin-workout-exercise-hint">Select exercises and set sets/reps/day</span>
                </div>

                <div className="admin-workout-exercise-select">
                  {exercisesCatalog.length === 0 ? (
                    <p className="admin-empty">No exercises available.</p>
                  ) : (
                    exercisesCatalog.map((exercise) => {
                      const selected = workoutPlanForm.exercises.find(
                        (item) => item.exercise_id === exercise.exercise_id
                      );

                      return (
                        <div key={exercise.exercise_id} className="admin-workout-exercise-option">
                          <label>
                            <input
                              type="checkbox"
                              checked={Boolean(selected)}
                              onChange={(e) => {
                                const { checked } = e.target;
                                setWorkoutPlanForm((prev) => {
                                  const nextExercises = checked
                                    ? [
                                        ...prev.exercises,
                                        {
                                          exercise_id: exercise.exercise_id,
                                          sets: '',
                                          reps: '',
                                          schedule_day: ''
                                        }
                                      ]
                                    : prev.exercises.filter(
                                        (item) => item.exercise_id !== exercise.exercise_id
                                      );
                                  return { ...prev, exercises: nextExercises };
                                });
                              }}
                            />
                            <span className="admin-workout-exercise-name">{exercise.exercise_name}</span>
                          </label>
                          {selected && (
                            <div className="admin-workout-exercise-fields">
                              <div className="admin-exercise-field">
                                <label className="admin-exercise-label">Sets</label>
                                <input
                                  className="admin-form-input"
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={selected.sets}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setWorkoutPlanForm((prev) => ({
                                      ...prev,
                                      exercises: prev.exercises.map((item) =>
                                        item.exercise_id === exercise.exercise_id
                                          ? { ...item, sets: value }
                                          : item
                                      )
                                    }));
                                  }}
                                />
                              </div>
                              <div className="admin-exercise-field">
                                <label className="admin-exercise-label">Reps</label>
                                <input
                                  className="admin-form-input"
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={selected.reps}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setWorkoutPlanForm((prev) => ({
                                      ...prev,
                                      exercises: prev.exercises.map((item) =>
                                        item.exercise_id === exercise.exercise_id
                                          ? { ...item, reps: value }
                                          : item
                                      )
                                    }));
                                  }}
                                />
                              </div>
                              <div className="admin-exercise-field">
                                <label className="admin-exercise-label">Day</label>
                                <select
                                  className="admin-form-input"
                                  value={selected.schedule_day}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setWorkoutPlanForm((prev) => ({
                                      ...prev,
                                      exercises: prev.exercises.map((item) =>
                                        item.exercise_id === exercise.exercise_id
                                          ? { ...item, schedule_day: value }
                                          : item
                                      )
                                    }));
                                  }}
                                >
                                  <option value="">Any day</option>
                                  <option value="monday">Monday</option>
                                  <option value="tuesday">Tuesday</option>
                                  <option value="wednesday">Wednesday</option>
                                  <option value="thursday">Thursday</option>
                                  <option value="friday">Friday</option>
                                  <option value="saturday">Saturday</option>
                                  <option value="sunday">Sunday</option>
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                <button className="admin-btn-primary" type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Add Workout Plan'}
                </button>
              </form>

              <div className="admin-list-panel">
                <h3>Workout Plans</h3>
                {workoutPlans.length === 0 ? (
                  <p className="admin-empty">No workout plans yet.</p>
                ) : (
                  workoutPlans.map((plan) => (
                    <div key={plan.workout_plan_id} className="admin-card admin-card-stack">
                      <div>
                        <h4>Plan #{plan.workout_plan_id}</h4>
                        <p className="admin-card-email">
                          Member: {plan.member_name || plan.member_id} · Trainer: {plan.trainer_name || 'Unassigned'}
                        </p>
                        <div className="admin-card-meta">
                          {plan.created_date && (
                            <span>{String(plan.created_date).split('T')[0]}</span>
                          )}
                          <span>{plan.exercises ? plan.exercises.length : 0} exercises</span>
                        </div>
                        {plan.exercises && plan.exercises.length > 0 && (
                          <div className="admin-workout-exercise-list">
                            {plan.exercises.map((exercise) => (
                              <div key={exercise.exercise_id} className="admin-workout-exercise-item">
                                <span>{exercise.exercise_name}</span>
                                <span>{exercise.sets} sets</span>
                                <span>{exercise.reps} reps</span>
                                <span>{exercise.schedule_day || 'Any day'}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'workout-exercises' && (
          <div className="admin-section-full">
            <div className="admin-section-header">
              <h2>Exercise Catalog</h2>
              <p>Manage the exercise library used when building workout plans.</p>
            </div>
            <div className="admin-grid-layout">
              <form className="admin-form-panel" onSubmit={handleCatalogExerciseSubmit}>
                <h3>{editingCatalogExerciseId ? 'Edit' : 'Add'} Exercise</h3>
                <label className="admin-form-label" htmlFor="catalog-exercise-name">Exercise name</label>
                <input
                  className="admin-form-input"
                  id="catalog-exercise-name"
                  name="exercise_name"
                  value={catalogExerciseForm.exercise_name}
                  onChange={(e) => setCatalogExerciseForm({ ...catalogExerciseForm, exercise_name: e.target.value })}
                  placeholder="Exercise name"
                  required
                />
                <label className="admin-form-label" htmlFor="catalog-exercise-desc">Description</label>
                <textarea
                  className="admin-form-input"
                  id="catalog-exercise-desc"
                  name="description"
                  rows="4"
                  value={catalogExerciseForm.description}
                  onChange={(e) => setCatalogExerciseForm({ ...catalogExerciseForm, description: e.target.value })}
                  placeholder="How to perform the exercise"
                ></textarea>
                <div className="admin-card-actions">
                  <button className="admin-btn-primary" type="submit" disabled={loading}>
                    {loading ? 'Saving...' : editingCatalogExerciseId ? 'Update Exercise' : 'Add Exercise'}
                  </button>
                  {editingCatalogExerciseId && (
                    <button
                      type="button"
                      className="admin-btn-secondary"
                      onClick={() => {
                        setEditingCatalogExerciseId(null);
                        setCatalogExerciseForm(emptyCatalogExercise);
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              <div className="admin-list-panel">
                <h3>Exercises</h3>
                {exercisesCatalog.length === 0 ? (
                  <p className="admin-empty">No exercises yet.</p>
                ) : (
                  exercisesCatalog.map((exercise) => (
                    <div key={exercise.exercise_id} className="admin-card admin-card-stack">
                      <div>
                        <h4>{exercise.exercise_name}</h4>
                        <p className="admin-card-email">{exercise.description || 'No description yet.'}</p>
                      </div>
                      <div className="admin-card-actions">
                        <button
                          className="admin-btn-secondary"
                          onClick={() => {
                            setEditingCatalogExerciseId(exercise.exercise_id);
                            setCatalogExerciseForm({
                              exercise_name: exercise.exercise_name || '',
                              description: exercise.description || ''
                            });
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="admin-btn-danger"
                          onClick={() => handleCatalogExerciseDelete(exercise.exercise_id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'diet-plans' && (
          <div className="admin-section-full">
            <div className="admin-section-header">
              <h2>Diet Plans</h2>
              <p>Create diet plans with meal schedules and calorie targets.</p>
            </div>
            <div className="admin-grid-layout">
              <form className="admin-form-panel" onSubmit={handleDietPlanSubmit}>
                <h3>{editingDietPlanId ? 'Edit' : 'Add'} Diet Plan</h3>
                <label className="admin-form-label" htmlFor="diet-member">Member</label>
                <select
                  className="admin-form-input"
                  id="diet-member"
                  name="member_id"
                  value={dietPlanForm.member_id}
                  onChange={(e) => setDietPlanForm({ ...dietPlanForm, member_id: e.target.value })}
                  required
                >
                  <option value="">Select member</option>
                  {members.map((member) => (
                    <option key={member.member_id} value={member.member_id}>
                      {member.full_name} (#{member.member_id})
                    </option>
                  ))}
                </select>
                <label className="admin-form-label" htmlFor="diet-trainer">Trainer</label>
                <select
                  className="admin-form-input"
                  id="diet-trainer"
                  name="trainer_id"
                  value={dietPlanForm.trainer_id}
                  onChange={(e) => setDietPlanForm({ ...dietPlanForm, trainer_id: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  {trainers.map((trainer) => (
                    <option key={trainer.trainer_id} value={trainer.trainer_id}>
                      {trainer.name}
                    </option>
                  ))}
                </select>
                <label className="admin-form-label" htmlFor="diet-calories">Calorie target</label>
                <input
                  className="admin-form-input"
                  type="number"
                  id="diet-calories"
                  name="calorie_target"
                  value={dietPlanForm.calorie_target}
                  onChange={(e) => setDietPlanForm({ ...dietPlanForm, calorie_target: e.target.value })}
                  placeholder="Daily calories"
                  min="0"
                  step="1"
                  required
                />
                <label className="admin-form-label" htmlFor="diet-meals">Meal schedule</label>
                <textarea
                  className="admin-form-input"
                  id="diet-meals"
                  name="meal_schedule"
                  value={dietPlanForm.meal_schedule}
                  onChange={(e) => setDietPlanForm({ ...dietPlanForm, meal_schedule: e.target.value })}
                  placeholder="Breakfast / lunch / dinner"
                  rows="3"
                  required
                ></textarea>
                <div className="admin-card-actions">
                  <button className="admin-btn-primary" type="submit" disabled={loading}>
                    {loading ? 'Saving...' : editingDietPlanId ? 'Update Diet Plan' : 'Add Diet Plan'}
                  </button>
                  {editingDietPlanId && (
                    <button
                      type="button"
                      className="admin-btn-secondary"
                      onClick={() => {
                        setEditingDietPlanId(null);
                        setDietPlanForm(emptyDietPlan);
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              <div className="admin-list-panel">
                <h3>Diet Plans</h3>
                {dietPlans.length === 0 ? (
                  <p className="admin-empty">No diet plans yet.</p>
                ) : (
                  dietPlans.map((plan) => (
                    <div key={plan.diet_plan_id} className="admin-card admin-card-stack">
                      <div>
                        <h4>Plan #{plan.diet_plan_id}</h4>
                        <p className="admin-card-email">
                          Member: {plan.member_name || plan.member_id} · Trainer: {plan.trainer_name || 'Unassigned'}
                        </p>
                        <div className="admin-card-meta">
                          <span>{plan.calorie_target} kcal</span>
                        </div>
                        <p style={{ marginTop: '8px' }}>
                          {plan.meal_schedule}
                        </p>
                      </div>
                      <div className="admin-card-actions">
                        <button
                          className="admin-btn-secondary"
                          onClick={() => {
                            setEditingDietPlanId(plan.diet_plan_id);
                            setDietPlanForm({
                              member_id: plan.member_id ? String(plan.member_id) : '',
                              trainer_id: plan.trainer_id ? String(plan.trainer_id) : '',
                              calorie_target: plan.calorie_target ?? '',
                              meal_schedule: plan.meal_schedule || ''
                            });
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="admin-btn-danger"
                          onClick={() => handleDietPlanDelete(plan.diet_plan_id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
