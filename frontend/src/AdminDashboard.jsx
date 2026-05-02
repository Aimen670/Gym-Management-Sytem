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
  capacity: ''
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

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [overview, setOverview] = useState(null);
  const [members, setMembers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [classes, setClasses] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [payments, setPayments] = useState([]);

  const [trainerForm, setTrainerForm] = useState(emptyTrainer);
  const [planForm, setPlanForm] = useState(emptyPlan);
  const [classForm, setClassForm] = useState(emptyClass);
  const [equipmentForm, setEquipmentForm] = useState(emptyEquipment);
  const [paymentForm, setPaymentForm] = useState(emptyPayment);

  const [editingTrainerId, setEditingTrainerId] = useState(null);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [editingClassId, setEditingClassId] = useState(null);
  const [editingEquipmentId, setEditingEquipmentId] = useState(null);
  const [editingMemberId, setEditingMemberId] = useState(null);
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
          loadPayments()
        ]);
      } catch (err) {
        console.error(err);
        setError(err.message);
      }
    };

    loadAll();
  }, []);

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

  const handleClassSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = { ...classForm, trainer_id: classForm.trainer_id || null };
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
        setClasses((prev) => prev.map((c) => (c.class_id === data.class_id ? data : c)));
      } else {
        setClasses((prev) => [data, ...prev]);
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
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
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
                  <input
                    className="admin-form-input"
                    name="full_name"
                    value={memberForm.full_name}
                    onChange={(e) => setMemberForm({ ...memberForm, full_name: e.target.value })}
                    placeholder="Full name"
                    autoComplete="off"
                    required
                  />
                  <input
                    className="admin-form-input"
                    name="email"
                    value={memberForm.email}
                    onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                    placeholder="Email"
                    autoComplete="off"
                    required
                  />
                  {!editingMemberId && (
                    <div className="admin-password-wrapper">
                      <input
                        className="admin-form-input"
                        type={showMemberPassword ? 'text' : 'password'}
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
                  <input
                    className="admin-form-input"
                    name="phone"
                    value={memberForm.phone}
                    onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                    placeholder="Phone"
                    autoComplete="off"
                  />
                  <input
                    className="admin-form-input"
                    type="number"
                    name="age"
                    value={memberForm.age}
                    onChange={(e) => setMemberForm({ ...memberForm, age: e.target.value })}
                    placeholder="Age"
                    autoComplete="off"
                  />
                  <input
                    className="admin-form-input"
                    name="gender"
                    value={memberForm.gender}
                    onChange={(e) => setMemberForm({ ...memberForm, gender: e.target.value })}
                    placeholder="Gender"
                    autoComplete="off"
                  />
                  <input
                    className="admin-form-input"
                    name="fitness_goal"
                    value={memberForm.fitness_goal}
                    onChange={(e) => setMemberForm({ ...memberForm, fitness_goal: e.target.value })}
                    placeholder="Fitness goal"
                    autoComplete="off"
                  />
                  <select
                    className="admin-form-input"
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
            </div>
            <div className="admin-grid-layout">
              <form className="admin-form-panel" onSubmit={handleTrainerSubmit}>
                <h3>{editingTrainerId ? 'Edit' : 'Add'} Trainer</h3>
                <input
                  className="admin-form-input"
                  name="name"
                  value={trainerForm.name}
                  onChange={(e) => setTrainerForm({ ...trainerForm, name: e.target.value })}
                  placeholder="Trainer name"
                  required
                />
                <input
                  className="admin-form-input"
                  name="specialization"
                  value={trainerForm.specialization}
                  onChange={(e) => setTrainerForm({ ...trainerForm, specialization: e.target.value })}
                  placeholder="Specialization"
                />
                <input
                  className="admin-form-input"
                  name="phone"
                  value={trainerForm.phone}
                  onChange={(e) => setTrainerForm({ ...trainerForm, phone: e.target.value })}
                  placeholder="Phone"
                />
                <input
                  className="admin-form-input"
                  name="email"
                  value={trainerForm.email}
                  onChange={(e) => setTrainerForm({ ...trainerForm, email: e.target.value })}
                  placeholder="Email"
                />
                <input
                  className="admin-form-input"
                  type="number"
                  name="experience_years"
                  value={trainerForm.experience_years}
                  onChange={(e) => setTrainerForm({ ...trainerForm, experience_years: e.target.value })}
                  placeholder="Experience (years)"
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
              <p>Create or update membership plans.</p>
            </div>
            <div className="admin-grid-layout">
              <form className="admin-form-panel" onSubmit={handlePlanSubmit}>
                <h3>{editingPlanId ? 'Edit' : 'Add'} Plan</h3>
                <input
                  className="admin-form-input"
                  name="plan_name"
                  value={planForm.plan_name}
                  onChange={(e) => setPlanForm({ ...planForm, plan_name: e.target.value })}
                  placeholder="Plan name"
                  required
                />
                <input
                  className="admin-form-input"
                  type="number"
                  name="duration_months"
                  value={planForm.duration_months}
                  onChange={(e) => setPlanForm({ ...planForm, duration_months: e.target.value })}
                  placeholder="Duration (months)"
                />
                <input
                  className="admin-form-input"
                  type="number"
                  name="price"
                  value={planForm.price}
                  onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                  placeholder="Price"
                />
                <textarea
                  className="admin-form-input"
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
              <h2>Payment & Billing</h2>
              <p>Track payments and add new transactions.</p>
            </div>
            <div className="admin-grid-layout">
              <form className="admin-form-panel" onSubmit={handlePaymentSubmit}>
                <h3>Record Payment</h3>
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
                  placeholder="Amount"
                  required
                />
                <select
                  className="admin-form-input"
                  name="payment_method"
                  value={paymentForm.payment_method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                  required
                >
                  <option value="">Payment method</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="online">Online</option>
                </select>
                <button className="admin-btn-primary" type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Record Payment'}
                </button>
              </form>

              <div className="admin-list-panel">
                <h3>Payments</h3>
                {payments.length === 0 ? (
                  <p className="admin-empty">No payments recorded.</p>
                ) : (
                  payments.map((payment) => (
                    <div key={payment.payment_id} className="admin-card">
                      <div>
                        <h4>Payment #{payment.payment_id}</h4>
                        <p className="admin-card-email">Subscription: {payment.subscription_id}</p>
                        <div className="admin-card-meta">
                          <span className="status-badge status-completed">{payment.payment_method}</span>
                          <span><strong>PKR {payment.amount}</strong></span>
                          {payment.payment_date && <span>{String(payment.payment_date).split('T')[0]}</span>}
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
                />
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
                              capacity: gymClass.capacity ?? ''
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
      </div>
    </div>
  );
}

export default AdminDashboard;
