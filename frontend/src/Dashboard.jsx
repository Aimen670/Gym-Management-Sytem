import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import ClassCard from './components/ClassCard';
import Toast from './components/Toast';
import PhoneRemoteConnect from './PhoneRemoteConnect';

function memberIdFromToken(token) {
  if (!token || typeof token !== 'string') return null;
  const m = /^simple-token-(\d+)$/.exec(token.trim());
  return m ? parseInt(m[1], 10) : null;
}

function readStoredMemberProfile() {
  try {
    const raw = localStorage.getItem('memberProfile');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function readJsonBody(res) {
  const text = await res.text();
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('<')) {
    throw new Error(
      'Could not load data from the gym server (got a web page instead). Use the app URL from your dev server (e.g. http://localhost:5173) and ensure the backend is running.'
    );
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    throw new Error('Invalid response from server. Please try again.');
  }
}

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(value) {
  if (value == null) return '';
  if (typeof value === 'string' && /^\d{1,2}:\d{2}/.test(value)) {
    const [h, m] = value.split(':');
    const hour = String(parseInt(h, 10)).padStart(2, '0');
    return `${hour}:${m.slice(0, 2)}`;
  }
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  return String(value);
}

function formatScheduleDay(value) {
  if (!value) return '—';
  const day = String(value).toLowerCase();
  const map = {
    monday: 'Mon',
    tuesday: 'Tue',
    wednesday: 'Wed',
    thursday: 'Thu',
    friday: 'Fri',
    saturday: 'Sat',
    sunday: 'Sun'
  };
  return map[day] || day.charAt(0).toUpperCase() + day.slice(1);
}

function normalizeSlotTimeToHHMM(value) {
  if (value == null) return '';
  if (typeof value === 'string') {
    const m = /^(\d{1,2}):(\d{2})/.exec(value.trim());
    if (!m) return '';
    const hh = String(parseInt(m[1], 10)).padStart(2, '0');
    return `${hh}:${m[2]}`;
  }
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }
  return '';
}

function Dashboard() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState('overview');
  const [dashboard, setDashboard] = useState(null);
  const [trainers, setTrainers] = useState([]);
  const [trainerAvailabilityById, setTrainerAvailabilityById] = useState({});
  const [trainerAvailabilityBusy, setTrainerAvailabilityBusy] = useState(false);
  const [trainerAvailabilityError, setTrainerAvailabilityError] = useState('');
  const [expandedAvailability, setExpandedAvailability] = useState(() => new Set());
  const [membershipPlans, setMembershipPlans] = useState([]);
  const [bookingTrainerId, setBookingTrainerId] = useState(null);
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [bookingSlots, setBookingSlots] = useState([]);
  const [bookingSlot, setBookingSlot] = useState('');
  const [bookingNote, setBookingNote] = useState('');
  const [bookingBusy, setBookingBusy] = useState(false);
  const [bookedSessions, setBookedSessions] = useState([]);
  const [measurementForm, setMeasurementForm] = useState(() => ({
    weight: '',
    bmi: '',
    body_fat: '',
    muscle_mass: '',
    record_date: new Date().toISOString().slice(0, 10)
  }));
  const [measurementNote, setMeasurementNote] = useState('');
  const [measurementBusy, setMeasurementBusy] = useState(false);
  const [workoutLogForm, setWorkoutLogForm] = useState(() => ({
    workout_plan_id: '',
    exercise_id: '',
    weight_used: '',
    reps_completed: '',
    log_date: new Date().toISOString().slice(0, 10)
  }));
  const [workoutLogNote, setWorkoutLogNote] = useState('');
  const [workoutLogBusy, setWorkoutLogBusy] = useState(false);
  const [fitnessGoals, setFitnessGoals] = useState([]);
  const [fitnessGoalForm, setFitnessGoalForm] = useState(() => ({
    goal_type: '',
    target_value: '',
    start_date: new Date().toISOString().slice(0, 10),
    target_date: ''
  }));
  const [fitnessGoalBusy, setFitnessGoalBusy] = useState(false);
  const [fitnessGoalNote, setFitnessGoalNote] = useState('');
  const [classes, setClasses] = useState([]);
  const [classEnrollments, setClassEnrollments] = useState({});
  const [enrollmentBusy, setEnrollmentBusy] = useState(false);
  const [subscribeBusyId, setSubscribeBusyId] = useState(null);
  const [subscribeNote, setSubscribeNote] = useState('');
  const [planPayMethod, setPlanPayMethod] = useState({});
  const [planStartDate, setPlanStartDate] = useState({});
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [cachedProfile] = useState(readStoredMemberProfile);
  
  // Phone remote workout tracking state
  const [currentSet, setCurrentSet] = useState(0);
  const [currentReps, setCurrentReps] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [fatigueLevel, setFatigueLevel] = useState('moderate');

  const memberId = useMemo(() => memberIdFromToken(localStorage.getItem('token')), []);

  useEffect(() => {
    if (!memberId) {
      navigate('/login', { replace: true });
      return;
    }

    const load = async () => {
      setError('');
      try {
        const [dashRes, trainersRes, plansRes, classesRes] = await Promise.all([
          fetch(`/api/member/${memberId}/dashboard`),
          fetch('/api/trainers'),
          fetch('/api/membership-plans'),
          fetch('/api/classes')
        ]);

        const dashData = await readJsonBody(dashRes);
        if (!dashRes.ok) {
          throw new Error(dashData?.error || 'Could not load your dashboard');
        }
        setDashboard(dashData);
        if (dashData?.profile) {
          localStorage.setItem('memberProfile', JSON.stringify(dashData.profile));
        }

        const trainerData = await readJsonBody(trainersRes);
        if (trainersRes.ok && Array.isArray(trainerData)) {
          setTrainers(trainerData);
        }

        const plansData = await readJsonBody(plansRes);
        if (plansRes.ok && Array.isArray(plansData)) {
          setMembershipPlans(plansData);
        }

        const classesData = await readJsonBody(classesRes);
        if (classesRes.ok && Array.isArray(classesData)) {
          setClasses(classesData);
        }

        // Load fitness goals
        const fitnessGoalsRes = await fetch(`/api/fitness-goals/member/${memberId}`);
        const fitnessGoalsData = await readJsonBody(fitnessGoalsRes);
        if (fitnessGoalsRes.ok && Array.isArray(fitnessGoalsData)) {
          setFitnessGoals(fitnessGoalsData);
        }

        // Load booked trainer sessions
        await loadBookedSessions();
      } catch (err) {
        console.error(err);
        setError(err.message);
      }
    };

    load();
  }, [memberId, navigate]);

  useEffect(() => {
    let cancelled = false;

    const loadAllAvailability = async () => {
      if (!bookingDate) return;
      setTrainerAvailabilityError('');
      setTrainerAvailabilityBusy(true);
      try {
        const res = await fetch(`/api/trainers/availability?date=${encodeURIComponent(bookingDate)}`);
        const data = await readJsonBody(res);
        if (!res.ok) throw new Error(data?.error || 'Could not load trainer availability');
        if (cancelled) return;

        const nextMap = {};
        for (const row of Array.isArray(data?.trainers) ? data.trainers : []) {
          if (row?.trainer_id != null) nextMap[row.trainer_id] = row;
        }
        setTrainerAvailabilityById(nextMap);
        setExpandedAvailability(new Set());
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setTrainerAvailabilityById({});
          setTrainerAvailabilityError(e.message);
        }
      } finally {
        if (!cancelled) setTrainerAvailabilityBusy(false);
      }
    };

    loadAllAvailability();
    return () => {
      cancelled = true;
    };
  }, [bookingDate]);

  useEffect(() => {
    // Load enrollments for all classes
    classes.forEach(async (classItem) => {
      await loadClassEnrollments(classItem.class_id);
    });
  }, [classes]);

  async function refreshDashboard() {
    if (!memberId) return;
    try {
      const dashRes = await fetch(`/api/member/${memberId}/dashboard`);
      const dashData = await readJsonBody(dashRes);
      if (dashRes.ok && dashData) {
        setDashboard(dashData);
        if (dashData.profile) {
          localStorage.setItem('memberProfile', JSON.stringify(dashData.profile));
        }
      }
      await loadBookedSessions();
    } catch (err) {
      console.error(err);
    }
  }

  async function loadTrainerSlots(trainerId, dateStr) {
    if (!trainerId || !dateStr) return;
    setBookingNote('');
    setBookingSlots([]);
    setBookingSlot('');
    try {
      const res = await fetch(`/api/trainers/${trainerId}/available-slots?date=${encodeURIComponent(dateStr)}`);
      const data = await readJsonBody(res);
      if (!res.ok) throw new Error(data?.error || 'Could not load availability');
      const rawSlots = Array.isArray(data?.slots) ? data.slots : [];
      const normalized = rawSlots
        .map((s) => {
          const start_time = normalizeSlotTimeToHHMM(s.start_time);
          const end_time = normalizeSlotTimeToHHMM(s.end_time);
          if (!start_time || !end_time) return null;
          return { start_time, end_time };
        })
        .filter(Boolean);
      setBookingSlots(normalized);
    } catch (e) {
      console.error(e);
      setBookingNote(e.message);
    }
  }

  async function handleBookSession() {
    if (!memberId || !bookingTrainerId || !bookingDate || !bookingSlot) return;
    setBookingBusy(true);
    setBookingNote('');
    try {
      // Always send an ISO datetime with timezone (UTC) so the backend can parse reliably.
      const start_datetime = new Date(`${bookingDate}T${bookingSlot}:00`).toISOString();
      const res = await fetch(`/api/member/${memberId}/trainer-sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainer_id: bookingTrainerId,
          start_datetime
        })
      });
      const data = await readJsonBody(res);
      if (!res.ok) throw new Error(data?.error || 'Could not book session');
      setBookingNote('Session booked successfully.');
      await refreshDashboard();
      await loadTrainerSlots(bookingTrainerId, bookingDate);
      await loadBookedSessions();
    } catch (e) {
      console.error(e);
      setBookingNote(e.message);
    } finally {
      setBookingBusy(false);
    }
  }

  async function loadBookedSessions() {
    if (!memberId) return;
    try {
      const res = await fetch(`/api/member/${memberId}/trainer-sessions`);
      const data = await readJsonBody(res);
      if (!res.ok) throw new Error(data?.error || 'Failed to load sessions');
      setBookedSessions(data);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDeleteSession(sessionId) {
    if (!window.confirm('Are you sure you want to cancel this session?')) return;
    
    try {
      const res = await fetch(`/api/member/${memberId}/trainer-sessions/${sessionId}`, {
        method: 'DELETE'
      });
      const data = await readJsonBody(res);
      if (!res.ok) throw new Error(data?.error || 'Failed to delete session');
      await loadBookedSessions();
      await refreshDashboard();
    } catch (e) {
      console.error(e);
      setError(e.message);
    }
  }

  // Phone remote callback functions
  const handleSetComplete = () => {
    setCurrentSet(prev => prev + 1);
    setCurrentReps(0);
    console.log('Set complete. New set:', currentSet + 1);
  };

  const handleAddRep = () => {
    setCurrentReps(prev => prev + 1);
    console.log('Rep added. Total reps:', currentReps + 1);
  };

  const handleRemoveRep = () => {
    setCurrentReps(prev => Math.max(0, prev - 1));
    console.log('Rep removed. Total reps:', Math.max(0, currentReps - 1));
  };

  const handleStartRest = () => {
    setIsResting(true);
    console.log('Rest timer started');
  };

  const handlePauseRest = () => {
    setIsResting(false);
    console.log('Rest timer paused');
  };

  const handleFatigueUpdate = (data) => {
    setFatigueLevel(data.level || 'moderate');
    console.log('Fatigue level updated:', data.level);
  };

  const handleEndWorkout = () => {
    console.log('Workout ended. Sets:', currentSet);
    setActiveNav('overview');
  };

  const handleWorkoutLogFromPhone = async (data) => {
    console.log('Workout log data from phone:', data);

    setWorkoutLogForm((prev) => ({
      ...prev,
      workout_plan_id: data.workout_plan_id,
      exercise_id: data.exercise_id,
      weight_used: data.weight_used,
      reps_completed: data.reps_completed,
      log_date: data.log_date
    }));

    showToast('Workout data received from phone', 'success');

    // Ensure the workout logs list (dashboard?.workoutLogs) refreshes immediately
    // after the phone saves the log via sockets.
    await refreshDashboard();
  };

  function durationLabel(months) {
    if (months === 1) return '1 month';
    if (months === 3) return '3 months (quarterly)';
    if (months === 12) return '12 months (yearly)';
    return `${months} months`;
  }

  async function handleSubscribe(plan) {
    if (!memberId || !plan?.plan_id) return;
    const paymentMethod = planPayMethod[plan.plan_id] || 'card';
    const startRaw = planStartDate[plan.plan_id];
    setSubscribeNote('');
    setSubscribeBusyId(plan.plan_id);
    try {
      const body = {
        plan_id: plan.plan_id,
        payment_method: paymentMethod
      };
      if (startRaw && String(startRaw).trim()) {
        body.start_date = startRaw;
      }
      const res = await fetch(`/api/member/${memberId}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await readJsonBody(res);
      if (!res.ok) {
        throw new Error(data?.error || 'Could not subscribe');
      }
      setSubscribeNote(
        `You are now subscribed to ${data.plan_name}. Active ${formatDate(data.start_date)} – ${formatDate(data.end_date)}.`
      );
      await refreshDashboard();
    } catch (err) {
      console.error(err);
      setSubscribeNote(err.message);
    } finally {
      setSubscribeBusyId(null);
    }
  }

  async function handleMeasurementSubmit(e) {
    e.preventDefault();
    if (!memberId) return;
    setMeasurementBusy(true);
    setMeasurementNote('');
    try {
      const payload = {
        weight: measurementForm.weight,
        bmi: measurementForm.bmi,
        body_fat: measurementForm.body_fat,
        muscle_mass: measurementForm.muscle_mass,
        record_date: measurementForm.record_date || undefined
      };

      const res = await fetch(`/api/member/${memberId}/body-measurements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await readJsonBody(res);
      if (!res.ok) {
        throw new Error(data?.error || 'Could not save measurement');
      }
      setMeasurementNote('Measurement saved.');
      setMeasurementForm({
        weight: '',
        bmi: '',
        body_fat: '',
        muscle_mass: '',
        record_date: new Date().toISOString().slice(0, 10)
      });
      await refreshDashboard();
    } catch (err) {
      console.error(err);
      setMeasurementNote(err.message);
    } finally {
      setMeasurementBusy(false);
    }
  }

  async function handleWorkoutLogSubmit(e) {
    e.preventDefault();
    if (!memberId) return;
    setWorkoutLogBusy(true);
    setWorkoutLogNote('');
    try {
      const payload = {
        workout_plan_id: workoutLogForm.workout_plan_id,
        exercise_id: workoutLogForm.exercise_id,
        weight_used: workoutLogForm.weight_used,
        reps_completed: workoutLogForm.reps_completed,
        log_date: workoutLogForm.log_date || undefined
      };
      const res = await fetch(`/api/member/${memberId}/workout-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await readJsonBody(res);
      if (!res.ok) {
        throw new Error(data?.error || 'Could not save workout log');
      }
      setWorkoutLogNote('Workout log saved.');
      setWorkoutLogForm((prev) => ({
        ...prev,
        exercise_id: '',
        weight_used: '',
        reps_completed: ''
      }));
      await refreshDashboard();
    } catch (err) {
      console.error(err);
      setWorkoutLogNote(err.message);
    } finally {
      setWorkoutLogBusy(false);
    }
  }

  const showDetailedProgress = (progress, goal) => {
    let progressMessage = `📊 **Progress Report for ${goal.goal_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}**\n\n`;
    
    // Add measurement comparison if available
    if (progress.measurementComparison) {
      const comp = progress.measurementComparison;
      switch (comp.type) {
        case 'weight_loss':
          progressMessage += `📉 **Weight Loss Progress:**\n`;
          progressMessage += `• Starting Weight: ${comp.startWeight} kg\n`;
          progressMessage += `• Current Weight: ${comp.currentWeight} kg\n`;
          progressMessage += `• Target Weight: ${comp.targetWeight} kg\n`;
          progressMessage += `• Weight Lost: ${comp.weightLoss.toFixed(1)} kg\n`;
          progressMessage += `• Progress: ${Math.round(comp.progressPercentage)}%\n\n`;
          break;
          
        case 'muscle_gain':
          progressMessage += `💪 **Muscle Gain Progress:**\n`;
          progressMessage += `• Starting Muscle Mass: ${comp.startMuscle} kg\n`;
          progressMessage += `• Current Muscle Mass: ${comp.currentMuscle} kg\n`;
          progressMessage += `• Target Muscle Mass: ${comp.targetMuscle} kg\n`;
          progressMessage += `• Muscle Gained: ${comp.muscleGain.toFixed(1)} kg\n`;
          progressMessage += `• Progress: ${Math.round(comp.progressPercentage)}%\n\n`;
          break;
          
        case 'strength_training':
          progressMessage += `🏋️ **Strength Training Progress:**\n`;
          progressMessage += `• Average Weight Increase: ${comp.avgWeightIncrease.toFixed(1)} kg\n`;
          progressMessage += `• Total Strength Workouts: ${comp.totalWorkouts}\n`;
          progressMessage += `• Progress: ${Math.round(comp.progressPercentage)}%\n\n`;
          break;
          
        case 'endurance_improvement':
          progressMessage += `🏃 **Endurance Progress:**\n`;
          progressMessage += `• Average Reps Increase: ${comp.avgRepsIncrease}\n`;
          progressMessage += `• Total Endurance Workouts: ${comp.totalWorkouts}\n`;
          progressMessage += `• Progress: ${Math.round(comp.progressPercentage)}%\n\n`;
          break;
          
        case 'general_fitness':
          progressMessage += `🌟 **General Fitness Progress:**\n`;
          progressMessage += `• Total Workouts: ${comp.totalWorkouts}\n`;
          progressMessage += `• Workout Frequency: ${(comp.workoutFrequency * 7).toFixed(1)} workouts/week\n`;
          progressMessage += `• Days Active: ${comp.daysSinceStart}\n`;
          progressMessage += `• Progress: ${Math.round(comp.progressPercentage)}%\n\n`;
          break;
      }
    }
    
    // Add time-based progress
    if (progress.progressDetails) {
      const details = progress.progressDetails;
      progressMessage += `⏰ **Time Progress:**\n`;
      progressMessage += `• Days Elapsed: ${details.daysElapsed}\n`;
      progressMessage += `• Days Remaining: ${details.daysRemaining}\n`;
      progressMessage += `• Time Progress: ${Math.round(details.timeProgress)}%\n`;
      progressMessage += `• Status: ${details.isOnTrack ? '✅ On Track' : '⚠️ Behind Schedule'}\n\n`;
    }
    
    // Add recommendations
    if (progress.recommendations && progress.recommendations.length > 0) {
      progressMessage += `💡 **Recommendations:**\n`;
      progress.recommendations.forEach((rec, index) => {
        progressMessage += `${index + 1}. ${rec}\n`;
      });
    }
    
    // Show as a detailed toast message that stays open until manually closed
    showToast(progressMessage, 'info', 0);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('memberProfile');
    navigate('/login', { replace: true });
  };

  const showToast = (message, type = 'success', duration = 3000) => {
    setToast({ message, type, duration, id: Date.now() });
  };

  const hideToast = () => {
    setToast(null);
  };

  const loadClassEnrollments = async (classId) => {
    try {
      const res = await fetch(`/api/classes/${classId}/enrollments`);
      const data = await readJsonBody(res);
      if (res.ok) {
        setClassEnrollments(prev => ({ ...prev, [classId]: data }));
      }
    } catch (err) {
      console.error('Failed to load class enrollments:', err);
    }
  };

  const handleEnrollInClass = async (classId) => {
    if (!memberId) return;
    
    setEnrollmentBusy(true);
    try {
      const res = await fetch(`/api/classes/${classId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: memberId })
      });
      
      const data = await readJsonBody(res);
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to enroll in class');
      }
      
      // Refresh class enrollments
      await loadClassEnrollments(classId);
      
      // Refresh dashboard to update overview with new enrollment
      await refreshDashboard();
      
      // Show success message
      setError('');
      showToast('Successfully enrolled in class!', 'success');
    } catch (err) {
      console.error('Enrollment error:', err);
      const errorMessage = err.message.toLowerCase();
      
      // Check if error is related to expired/invalid membership
      if (errorMessage.includes('no active subscription') || 
          errorMessage.includes('expired') || 
          errorMessage.includes('please subscribe')) {
        // Show specific popup for expired membership
        showToast('You cannot enroll in this class because your membership has expired. Please renew your membership to continue.', 'error', 5000);
        setError('');
      } else if (errorMessage.includes('upgrade your plan') || 
                 errorMessage.includes('monthly plan') ||
                 errorMessage.includes('membership plan does not include access')) {
        // Show specific popup for monthly membership restriction
        showToast('Upgrade your membership to Quarterly or Yearly plan to enroll in group classes.', 'error', 5000);
        setError('');
      } else {
        setError(err.message);
      }
    } finally {
      setEnrollmentBusy(false);
    }
  };

  const handleUnenrollFromClass = async (enrollmentId) => {
    setEnrollmentBusy(true);
    try {
      const res = await fetch(`/api/enrollments/${enrollmentId}`, {
        method: 'DELETE'
      });
      
      const data = await readJsonBody(res);
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to unenroll from class');
      }
      
      // Refresh all class enrollments
      for (const classId of Object.keys(classEnrollments)) {
        await loadClassEnrollments(parseInt(classId));
      }
      
      // Refresh dashboard to update overview after unenrollment
      await refreshDashboard();
      
      // Show success message
      setError('');
      showToast('Successfully unenrolled from class!', 'success');
    } catch (err) {
      console.error('Unenrollment error:', err);
      setError(err.message);
    } finally {
      setEnrollmentBusy(false);
    }
  };

  async function handleFitnessGoalSubmit(e) {
    e.preventDefault();
    if (!memberId) return;
    setFitnessGoalBusy(true);
    setFitnessGoalNote('');
    try {
      const payload = {
        member_id: memberId,
        goal_type: fitnessGoalForm.goal_type,
        target_value: fitnessGoalForm.target_value,
        start_date: fitnessGoalForm.start_date || undefined,
        target_date: fitnessGoalForm.target_date || undefined
      };

      const res = await fetch('/api/fitness-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await readJsonBody(res);
      if (!res.ok) {
        throw new Error(data?.error || 'Could not save fitness goal');
      }
      setFitnessGoalNote('Fitness goal created successfully.');
      setFitnessGoalForm({
        goal_type: '',
        target_value: '',
        start_date: new Date().toISOString().slice(0, 10),
        target_date: ''
      });
      
      // Refresh fitness goals
      const fitnessGoalsRes = await fetch(`/api/fitness-goals/member/${memberId}`);
      const fitnessGoalsData = await readJsonBody(fitnessGoalsRes);
      if (fitnessGoalsRes.ok && Array.isArray(fitnessGoalsData)) {
        setFitnessGoals(fitnessGoalsData);
      }
    } catch (err) {
      console.error(err);
      setFitnessGoalNote(err.message);
    } finally {
      setFitnessGoalBusy(false);
    }
  }

  async function handleDeleteFitnessGoal(goalId) {
    if (!memberId || !goalId) return;
    setFitnessGoalBusy(true);
    setFitnessGoalNote('');
    try {
      const res = await fetch(`/api/fitness-goals/${goalId}`, {
        method: 'DELETE'
      });
      const data = await readJsonBody(res);
      if (!res.ok) {
        throw new Error(data?.error || 'Could not delete fitness goal');
      }
      setFitnessGoalNote('Fitness goal deleted successfully.');
      
      // Refresh fitness goals
      const fitnessGoalsRes = await fetch(`/api/fitness-goals/member/${memberId}`);
      const fitnessGoalsData = await readJsonBody(fitnessGoalsRes);
      if (fitnessGoalsRes.ok && Array.isArray(fitnessGoalsData)) {
        setFitnessGoals(fitnessGoalsData);
      }
    } catch (err) {
      console.error(err);
      setFitnessGoalNote(err.message);
    } finally {
      setFitnessGoalBusy(false);
    }
  }

  async function loadGoalProgress(goalId) {
    if (!goalId) return null;
    try {
      const res = await fetch(`/api/fitness-goals/${goalId}/progress`);
      const data = await readJsonBody(res);
      if (res.ok) {
        // Get the goal details to compare with measurements
        const goal = fitnessGoals.find(g => g.goal_id === goalId);
        if (goal && bodyMeasurements && bodyMeasurements.length > 0) {
          return analyzeProgressWithMeasurements(data, goal, bodyMeasurements);
        }
        return data;
      }
      return null;
    } catch (err) {
      console.error('Failed to load goal progress:', err);
      return null;
    }
  }

  function analyzeProgressWithMeasurements(progressData, goal, measurements) {
    const latestMeasurement = measurements[measurements.length - 1];
    const startMeasurement = measurements.find(m => 
      new Date(m.record_date) >= new Date(goal.start_date)
    );
    
    const analysis = {
      ...progressData,
      measurementComparison: null,
      recommendations: [],
      progressDetails: {}
    };

    // Analyze based on goal type
    switch (goal.goal_type) {
      case 'weight_loss':
        if (latestMeasurement?.weight && startMeasurement?.weight) {
          const weightLoss = startMeasurement.weight - latestMeasurement.weight;
          const targetWeight = parseFloat(goal.target_value) || 0;
          const initialWeight = startMeasurement.weight;
          const currentWeight = latestMeasurement.weight;
          const targetLoss = initialWeight - targetWeight;
          const progressPercentage = targetLoss > 0 ? (weightLoss / targetLoss) * 100 : 0;
          
          analysis.measurementComparison = {
            type: 'weight_loss',
            startWeight: initialWeight,
            currentWeight: currentWeight,
            targetWeight: targetWeight,
            weightLoss: weightLoss,
            progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
            unit: 'kg'
          };
          
          // Add recommendations
          if (progressPercentage < 25) {
            analysis.recommendations.push('Focus on consistent cardio and calorie deficit');
          } else if (progressPercentage < 75) {
            analysis.recommendations.push('Great progress! Keep maintaining current routine');
          } else {
            analysis.recommendations.push('Almost there! Time to focus on maintenance');
          }
        }
        break;
        
      case 'muscle_gain':
        if (latestMeasurement?.muscle_mass && startMeasurement?.muscle_mass) {
          const muscleGain = latestMeasurement.muscle_mass - startMeasurement.muscle_mass;
          const targetMuscle = parseFloat(goal.target_value) || 0;
          const initialMuscle = startMeasurement.muscle_mass;
          const currentMuscle = latestMeasurement.muscle_mass;
          const targetGain = targetMuscle - initialMuscle;
          const progressPercentage = targetGain > 0 ? (muscleGain / targetGain) * 100 : 0;
          
          analysis.measurementComparison = {
            type: 'muscle_gain',
            startMuscle: initialMuscle,
            currentMuscle: currentMuscle,
            targetMuscle: targetMuscle,
            muscleGain: muscleGain,
            progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
            unit: 'kg'
          };
          
          // Add recommendations
          if (progressPercentage < 25) {
            analysis.recommendations.push('Increase protein intake and focus on compound exercises');
          } else if (progressPercentage < 75) {
            analysis.recommendations.push('Excellent progress! Continue with strength training');
          } else {
            analysis.recommendations.push('Goal nearly achieved! Focus on muscle definition');
          }
        }
        break;
        
      case 'strength_training':
        // Analyze workout logs for strength progress
        const strengthLogs = workoutLogs.filter(log => 
          log.log_date >= goal.start_date && 
          parseFloat(log.weight_used) > 0
        );
        
        if (strengthLogs.length > 0) {
          const avgWeightIncrease = calculateStrengthProgress(strengthLogs);
          analysis.measurementComparison = {
            type: 'strength_training',
            avgWeightIncrease: avgWeightIncrease,
            totalWorkouts: strengthLogs.length,
            progressPercentage: Math.min(100, avgWeightIncrease * 10) // Estimate progress
          };
          
          analysis.recommendations.push('Keep progressively overloading weights');
          if (avgWeightIncrease < 2) {
            analysis.recommendations.push('Consider increasing weight more frequently');
          }
        }
        break;
        
      case 'endurance_improvement':
        // Analyze workout logs for endurance (reps/duration)
        const enduranceLogs = workoutLogs.filter(log => 
          log.log_date >= goal.start_date && 
          parseFloat(log.reps_completed) > 0
        );
        
        if (enduranceLogs.length > 0) {
          const avgRepsIncrease = calculateEnduranceProgress(enduranceLogs);
          analysis.measurementComparison = {
            type: 'endurance_improvement',
            avgRepsIncrease: avgRepsIncrease,
            totalWorkouts: enduranceLogs.length,
            progressPercentage: Math.min(100, avgRepsIncrease * 5) // Estimate progress
          };
          
          analysis.recommendations.push('Focus on increasing reps and reducing rest time');
          if (avgRepsIncrease < 3) {
            analysis.recommendations.push('Try adding more cardio sessions');
          }
        }
        break;
        
      case 'general_fitness':
        // General fitness based on overall activity
        const totalWorkouts = workoutLogs.filter(log => log.log_date >= goal.start_date).length;
        const daysSinceStart = Math.ceil((new Date() - new Date(goal.start_date)) / (1000 * 60 * 60 * 24));
        const workoutFrequency = totalWorkouts / daysSinceStart;
        
        analysis.measurementComparison = {
          type: 'general_fitness',
          totalWorkouts: totalWorkouts,
          workoutFrequency: workoutFrequency,
          daysSinceStart: daysSinceStart,
          progressPercentage: Math.min(100, workoutFrequency * 20 * 7) // Target 3-4 workouts per week
        };
        
        if (workoutFrequency < 0.3) {
          analysis.recommendations.push('Increase workout frequency to 3-4 times per week');
        } else if (workoutFrequency < 0.6) {
          analysis.recommendations.push('Good consistency! Try adding variety to workouts');
        } else {
          analysis.recommendations.push('Excellent consistency! Focus on progressive overload');
        }
        break;
    }

    // Add time-based analysis
    const daysElapsed = Math.ceil((new Date() - new Date(goal.start_date)) / (1000 * 60 * 60 * 24));
    const totalDays = Math.ceil((new Date(goal.target_date) - new Date(goal.start_date)) / (1000 * 60 * 60 * 24));
    const timeProgress = Math.min(100, (daysElapsed / totalDays) * 100);
    
    analysis.progressDetails = {
      daysElapsed,
      totalDays,
      timeProgress,
      daysRemaining: Math.max(0, totalDays - daysElapsed),
      isOnTrack: analysis.measurementComparison?.progressPercentage >= timeProgress
    };

    return analysis;
  }

  function calculateStrengthProgress(logs) {
    if (logs.length < 2) return 0;
    
    const sortedLogs = logs.sort((a, b) => new Date(a.log_date) - new Date(b.log_date));
    const firstLog = sortedLogs[0];
    const lastLog = sortedLogs[sortedLogs.length - 1];
    
    return parseFloat(lastLog.weight_used) - parseFloat(firstLog.weight_used);
  }

  function calculateEnduranceProgress(logs) {
    if (logs.length < 2) return 0;
    
    const sortedLogs = logs.sort((a, b) => new Date(a.log_date) - new Date(b.log_date));
    const firstLog = sortedLogs[0];
    const lastLog = sortedLogs[sortedLogs.length - 1];
    
    return parseFloat(lastLog.reps_completed) - parseFloat(firstLog.reps_completed);
  }

  const profile = dashboard?.profile || cachedProfile;
  const subscription = dashboard?.subscription;
  const upcomingClasses = dashboard?.upcomingClasses ?? [];
  const upcomingSessions = dashboard?.upcomingSessions ?? [];
  const workoutPlans = dashboard?.workoutPlans ?? [];
  const dietPlans = dashboard?.dietPlans ?? [];
  const bodyMeasurements = dashboard?.bodyMeasurements ?? [];
  const workoutLogs = dashboard?.workoutLogs ?? [];
  const workoutLogStats = dashboard?.workoutLogStats ?? {};
  const completed30 = dashboard?.stats?.completed_sessions_last_30 ?? 0;

  const selectedLogPlan = useMemo(() => {
    if (!workoutLogForm.workout_plan_id) return null;
    return workoutPlans.find((plan) => String(plan.workout_plan_id) === String(workoutLogForm.workout_plan_id));
  }, [workoutLogForm.workout_plan_id, workoutPlans]);

  const logPlanExercises = useMemo(() => {
    if (!selectedLogPlan?.exercises) return [];
    return selectedLogPlan.exercises.filter((exercise) => exercise.exercise_catalog_id != null);
  }, [selectedLogPlan]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const daysLeft =
    subscription && subscription.subscription_status === 'active' && subscription.days_remaining != null
      ? Math.max(0, subscription.days_remaining)
      : null;

  const scheduleItems = useMemo(() => {
    const rows = [];
    upcomingClasses.forEach((c) => {
      rows.push({
        key: `c-${c.enrollment_id}`,
        type: 'Class',
        title: c.class_name,
        date: c.schedule_date,
        time: c.schedule_time,
        meta: c.trainer_name ? `with ${c.trainer_name}` : ''
      });
    });
    upcomingSessions.forEach((s) => {
      rows.push({
        key: `s-${s.session_id}`,
        type: 'Session',
        title: s.trainer_name ? `Trainer: ${s.trainer_name}` : 'Trainer session',
        date: s.session_date,
        time: s.session_time,
        meta: s.status ? s.status : ''
      });
    });
    rows.sort((a, b) => {
      const da = new Date(a.date).getTime();
      const db = new Date(b.date).getTime();
      if (da !== db) return da - db;
      return String(a.time).localeCompare(String(b.time));
    });
    return rows;
  }, [upcomingClasses, upcomingSessions]);

  if (!memberId) {
    return null;
  }

  return (
    <div className="member-dashboard">
            <aside className="member-sidebar">
        <div className="member-brand">
          <span className="member-brand-mark" aria-hidden />
          <div>
            <strong>Gym Member</strong>
            <span>Your training hub</span>
          </div>
        </div>

        <nav className="member-nav" aria-label="Member sections">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'membership', label: 'Membership' },
            { id: 'fitness-goals', label: 'Fitness Goals' },
            { id: 'classes', label: 'Group Classes' },
            { id: 'schedule', label: 'Schedule' },
            { id: 'workouts', label: 'Workout plans' },
            { id: 'diet', label: 'Diet plans' },
            { id: 'measurements', label: 'Body measurements' },
            { id: 'trainers', label: 'Trainers' },
            { id: 'workout-log', label: 'Workout log' }
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              className={`member-nav-item ${activeNav === item.id ? 'active' : ''}`}
              onClick={() => setActiveNav(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="member-sidebar-footer">
          <p className="member-sidebar-hint">Staff access?</p>
          <Link to="/admin-login" className="member-sidebar-link">
            Admin portal →
          </Link>
          <button type="button" className="member-logout" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>

      <div className="member-main">
        <header className="member-header">
          <div className="member-header-text">
            <h1>
              {greeting}
              {profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
            </h1>
            <p>Track membership, classes, and trainer time in one place.</p>
          </div>
          <div className="member-header-user">
            <div className="member-avatar" aria-hidden>
              {(profile?.full_name || profile?.email || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <strong>{profile?.full_name || 'Member'}</strong>
              <span className="member-email">{profile?.email || '—'}</span>
            </div>
          </div>
        </header>

        {error && <div className="member-error-banner">{error}</div>}
        
        {toast && (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={hideToast}
          />
        )}

        <div className="member-panels">
          {activeNav === 'overview' && (
            <>
              <section className="member-stats" aria-label="Summary">
                <article className="member-stat-card">
                  <span className="member-stat-label">Plan status</span>
                  <strong className="member-stat-value">
                    {subscription?.subscription_status === 'active' ? 'Active' : subscription ? 'Expired' : 'No plan'}
                  </strong>
                  <p className="member-stat-foot">
                    {daysLeft != null ? `${daysLeft} days left on current period` : 'Subscribe to unlock full access'}
                  </p>
                </article>
                <article className="member-stat-card">
                  <span className="member-stat-label">Sessions (30d)</span>
                  <strong className="member-stat-value">{completed30}</strong>
                  <p className="member-stat-foot">Completed trainer sessions</p>
                </article>
                <article className="member-stat-card">
                  <span className="member-stat-label">Upcoming</span>
                  <strong className="member-stat-value">{scheduleItems.length}</strong>
                  <p className="member-stat-foot">Classes & sessions scheduled</p>
                </article>
                <article className="member-stat-card">
                  <span className="member-stat-label">Goal</span>
                  <strong className="member-stat-value member-stat-goal">
                    {profile?.fitness_goal ? 'Set' : '—'}
                  </strong>
                  <p className="member-stat-foot">
                    {profile?.fitness_goal || 'Add a goal with staff on your next visit'}
                  </p>
                </article>
              </section>

              <div className="member-grid-2">
                <section className="member-card member-card-pad">
                  <h2>Next on your calendar</h2>
                  {scheduleItems.length === 0 ? (
                    <p className="member-muted">No upcoming classes or trainer sessions. Check the Schedule tab.</p>
                  ) : (
                    <ul className="member-timeline">
                      {scheduleItems.slice(0, 4).map((row) => (
                        <li key={row.key}>
                          <div className="member-timeline-date">
                            <span>{formatDate(row.date)}</span>
                            <span className="member-timeline-time">{formatTime(row.time)}</span>
                          </div>
                          <div>
                            <span className="member-pill">{row.type}</span>
                            <h3>{row.title}</h3>
                            {row.meta && <p className="member-muted">{row.meta}</p>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="member-card member-card-pad member-card-accent">
                  <h2>Your membership</h2>
                  {subscription ? (
                    <>
                      <p className="member-plan-name">{subscription.plan_name}</p>
                      <p className="member-muted">
                        {subscription.start_date && subscription.end_date
                          ? `${formatDate(subscription.start_date)} – ${formatDate(subscription.end_date)}`
                          : ''}
                      </p>
                      <p className="member-plan-price">
                        {subscription.price != null ? `Rs. ${Number(subscription.price).toLocaleString()}` : ''}
                      </p>
                      <p className="member-plan-desc">{subscription.description || ''}</p>
                    </>
                  ) : (
                    <p className="member-muted">No subscription on file. Contact the front desk to choose a plan.</p>
                  )}
                </section>
              </div>
            </>
          )}

          {activeNav === 'membership' && (
            <section className="member-card member-card-pad member-card-wide">
              <h2>Membership details</h2>
              <div className="member-detail-grid">
                <div>
                  <span className="member-detail-label">Full name</span>
                  <p>{profile?.full_name || '—'}</p>
                </div>
                <div>
                  <span className="member-detail-label">Email</span>
                  <p>{profile?.email || '—'}</p>
                </div>
                <div>
                  <span className="member-detail-label">Phone</span>
                  <p>{profile?.phone || '—'}</p>
                </div>
                <div>
                  <span className="member-detail-label">Member since</span>
                  <p>{formatDate(profile?.join_date)}</p>
                </div>
                <div>
                  <span className="member-detail-label">Account status</span>
                  <p className="member-capitalize">{profile?.status || '—'}</p>
                </div>
                <div>
                  <span className="member-detail-label">Fitness goal</span>
                  <p>{profile?.fitness_goal || '—'}</p>
                </div>
              </div>
              {subscription && (
                <div className="member-membership-box">
                  <h3>Current plan</h3>
                  <p>
                    <strong>{subscription.plan_name}</strong>
                    {subscription.subscription_status === 'expired' && (
                      <span className="member-badge member-badge-warn">Expired</span>
                    )}
                    {subscription.subscription_status === 'active' && (
                      <span className="member-badge member-badge-ok">Active</span>
                    )}
                  </p>
                  <p className="member-muted">
                    Renews / ends on {formatDate(subscription.end_date)}
                    {daysLeft != null && subscription.subscription_status === 'active'
                      ? ` · ${daysLeft} days remaining`
                      : ''}
                  </p>
                  {subscription.price != null && (
                    <p className="member-muted">
                      Price on plan: Rs. {Number(subscription.price).toLocaleString()} · Duration:{' '}
                      {durationLabel(subscription.duration_months)}
                    </p>
                  )}
                </div>
              )}

              <div className="member-plans-section">
                <h3 className="member-plans-heading">Browse membership plans</h3>
                <p className="member-muted member-plans-intro">
                  Subscribe to monthly, quarterly, or yearly access. Choose an activation start date or leave it blank
                  for today—the system stores duration, price, start and end dates, and logs your payment method.
                </p>
                {subscribeNote && (
                  <p
                    className={
                      subscribeNote.includes('Could not') || subscribeNote.includes('Invalid')
                        ? 'member-subscribe-msg member-subscribe-msg-err'
                        : 'member-subscribe-msg member-subscribe-msg-ok'
                    }
                  >
                    {subscribeNote}
                  </p>
                )}
                <div className="member-plan-offer-grid">
                  {membershipPlans.length === 0 ? (
                    <p className="member-muted">No plans available right now.</p>
                  ) : (
                    membershipPlans.map((plan) => (
                      <article key={plan.plan_id} className="member-plan-offer-card">
                        <div className="member-plan-offer-head">
                          <h4>{plan.plan_name}</h4>
                          <span className="member-plan-offer-duration">{durationLabel(plan.duration_months)}</span>
                        </div>
                        <p className="member-plan-offer-price">
                          Rs. {plan.price != null ? Number(plan.price).toLocaleString() : '—'}
                        </p>
                        {plan.description && <p className="member-muted">{plan.description}</p>}
                        <label className="member-plan-field-label">
                          Activation start date
                          <input
                            type="date"
                            className="member-plan-date-input"
                            value={planStartDate[plan.plan_id] || ''}
                            onChange={(e) =>
                              setPlanStartDate((prev) => ({ ...prev, [plan.plan_id]: e.target.value }))
                            }
                            disabled={subscribeBusyId === plan.plan_id}
                          />
                        </label>
                        <span className="member-plan-field-hint">Leave blank to start today.</span>
                        <label className="member-plan-pay-label">
                          Pay with
                          <select
                            className="member-plan-pay-select"
                            value={planPayMethod[plan.plan_id] || 'card'}
                            onChange={(e) =>
                              setPlanPayMethod((prev) => ({ ...prev, [plan.plan_id]: e.target.value }))
                            }
                            disabled={subscribeBusyId === plan.plan_id}
                          >
                            <option value="card">Card</option>
                            <option value="online">Online</option>
                          </select>
                        </label>
                        <button
                          type="button"
                          className="member-plan-subscribe-btn"
                          disabled={subscribeBusyId === plan.plan_id}
                          onClick={() => handleSubscribe(plan)}
                        >
                          {subscribeBusyId === plan.plan_id ? 'Subscribing…' : 'Subscribe'}
                        </button>
                      </article>
                    ))
                  )}
                </div>
              </div>
            </section>
          )}

          {activeNav === 'fitness-goals' && (
            <div className="fitness-goals-container">
              <section className="fitness-goals-section">
                <div className="fitness-goals-header">
                  <h2>Your Fitness Goals</h2>
                  <p>Set and track your personal fitness goals with progress monitoring.</p>
                </div>
                
                {fitnessGoalNote && (
                  <div className={`fitness-note ${fitnessGoalNote.includes('success') ? 'fitness-note-success' : 'fitness-note-error'}`}>
                    {fitnessGoalNote}
                  </div>
                )}

                <div className="fitness-goals-list">
                  {fitnessGoals.length === 0 ? (
                    <div className="fitness-goal-empty">
                      No fitness goals set yet. Create your first goal below!
                    </div>
                  ) : (
                    fitnessGoals.map((goal) => (
                      <div key={goal.goal_id} className="fitness-goal-card">
                        <div className="fitness-goal-header">
                          <h3>{goal.goal_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                          <span className={`fitness-goal-status fitness-goal-${goal.status || 'active'}`}>
                            {goal.status || 'active'}
                          </span>
                        </div>
                        
                        <div className="fitness-progress-bar">
                          <div className="fitness-progress-fill" style={{width: `${goal.progress_percentage || 0}%`}}></div>
                        </div>
                        
                        {goal.progress_percentage && (
                          <div className="fitness-progress-text">
                            {Math.round(goal.progress_percentage)}% Complete
                          </div>
                        )}
                        
                        <div className="fitness-goal-details">
                          <p><strong>Target:</strong> {goal.target_value}</p>
                          <p><strong>Start:</strong> {formatDate(goal.start_date)}</p>
                          <p><strong>Target Date:</strong> {formatDate(goal.target_date)}</p>
                        </div>
                        <div className="fitness-goal-actions">
                          <button 
                            className="fitness-goal-btn fitness-goal-btn-progress"
                            onClick={() => {
                              // Load and show detailed progress
                              loadGoalProgress(goal.goal_id).then(progress => {
                                if (progress) {
                                  showDetailedProgress(progress, goal);
                                } else {
                                  showToast('Progress data not available', 'error');
                                }
                              });
                            }}
                          >
                            View Progress
                          </button>
                          <button 
                            className="fitness-goal-btn fitness-goal-btn-delete"
                            onClick={() => handleDeleteFitnessGoal(goal.goal_id)}
                            disabled={fitnessGoalBusy}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="fitness-goals-section">
                <div className="fitness-goals-header">
                  <h2>Create New Goal</h2>
                  <p>Set a new fitness goal to track your progress.</p>
                </div>
                
                <form onSubmit={handleFitnessGoalSubmit} className="fitness-goal-form">
                  <div className="fitness-form-group">
                    <label htmlFor="goal_type">Goal Type</label>
                    <select
                      id="goal_type"
                      value={fitnessGoalForm.goal_type}
                      onChange={(e) => setFitnessGoalForm(prev => ({ ...prev, goal_type: e.target.value }))}
                      required
                      disabled={fitnessGoalBusy}
                    >
                      <option value="">Select a goal type</option>
                      <option value="weight_loss">Weight Loss</option>
                      <option value="muscle_gain">Muscle Gain</option>
                      <option value="endurance_improvement">Endurance Improvement</option>
                      <option value="strength_training">Strength Training</option>
                      <option value="general_fitness">General Fitness</option>
                    </select>
                  </div>

                  <div className="fitness-form-group">
                    <label htmlFor="target_value">Target Value</label>
                    <input
                      id="target_value"
                      type="text"
                      value={fitnessGoalForm.target_value}
                      onChange={(e) => setFitnessGoalForm(prev => ({ ...prev, target_value: e.target.value }))}
                      placeholder="e.g., 10 kg, 30 minutes, 50 lbs"
                      required
                      disabled={fitnessGoalBusy}
                    />
                  </div>

                  <div className="fitness-form-group">
                    <label htmlFor="start_date">Start Date</label>
                    <input
                      id="start_date"
                      type="date"
                      value={fitnessGoalForm.start_date}
                      onChange={(e) => setFitnessGoalForm(prev => ({ ...prev, start_date: e.target.value }))}
                      required
                      disabled={fitnessGoalBusy}
                    />
                  </div>

                  <div className="fitness-form-group">
                    <label htmlFor="target_date">Target Date</label>
                    <input
                      id="target_date"
                      type="date"
                      value={fitnessGoalForm.target_date}
                      onChange={(e) => setFitnessGoalForm(prev => ({ ...prev, target_date: e.target.value }))}
                      required
                      disabled={fitnessGoalBusy}
                      min={fitnessGoalForm.start_date}
                    />
                  </div>

                  <button
                    type="submit"
                    className="fitness-submit-btn"
                    disabled={fitnessGoalBusy || !fitnessGoalForm.goal_type || !fitnessGoalForm.target_value || !fitnessGoalForm.target_date}
                  >
                    {fitnessGoalBusy ? 'Creating...' : 'Create Goal'}
                  </button>
                </form>
              </section>
            </div>
          )}

          {activeNav === 'classes' && (
            <section className="member-card member-card-pad member-card-wide">
              <h2>Group Fitness Classes</h2>
              <p className="member-muted">Browse and enroll in group fitness classes. Quarterly and Yearly plans include access to all classes.</p>
              
              {classes.length === 0 ? (
                <p className="member-muted">No classes available at the moment.</p>
              ) : (
                <div className="classes-grid">
                  {classes.map((classItem) => {
                    const enrollments = classEnrollments[classItem.class_id] || [];
                    
                    return (
                      <ClassCard
                        key={classItem.class_id}
                        classItem={classItem}
                        enrollments={enrollments}
                        memberId={memberId}
                        enrollmentBusy={enrollmentBusy}
                        onEnroll={handleEnrollInClass}
                        onUnenroll={handleUnenrollFromClass}
                      />
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {activeNav === 'schedule' && (
            <section className="member-card member-card-pad member-card-wide">
              <h2>Schedule</h2>
              {scheduleItems.length === 0 ? (
                <p className="member-muted">Nothing scheduled yet.</p>
              ) : (
                <ul className="member-schedule-list">
                  {scheduleItems.map((row) => (
                    <li key={row.key}>
                      <div>
                        <span className="member-pill">{row.type}</span>
                        <h3>{row.title}</h3>
                        {row.meta && <p className="member-muted">{row.meta}</p>}
                      </div>
                      <div className="member-schedule-when">
                        <span>{formatDate(row.date)}</span>
                        <span>{formatTime(row.time)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {activeNav === 'workouts' && (
            <section className="member-card member-card-pad member-card-wide">
              <h2>Workout plans</h2>
              <p className="member-muted">View the routines your trainer assigned, with sets, reps, and schedules.</p>
              {workoutPlans.length === 0 ? (
                <p className="member-muted" style={{ marginTop: 12 }}>
                  No workout plans assigned yet. Ask your trainer to create one.
                </p>
              ) : (
                <div className="member-workout-grid">
                  {workoutPlans.map((plan) => (
                    <article key={plan.workout_plan_id} className="member-workout-card">
                      <div className="member-workout-head">
                        <div>
                          <h3>Plan #{plan.workout_plan_id}</h3>
                          <p className="member-muted">
                            Trainer: {plan.trainer_name || 'Unassigned'}
                          </p>
                        </div>
                        <span className="member-workout-date">Created {formatDate(plan.created_date)}</span>
                      </div>

                      {plan.exercises && plan.exercises.length > 0 ? (
                        <div className="member-workout-table">
                          <div className="member-workout-row member-workout-row-head">
                            <span>Exercise</span>
                            <span>Sets</span>
                            <span>Reps</span>
                            <span>Schedule</span>
                          </div>
                          {plan.exercises.map((exercise) => (
                            <div key={exercise.exercise_id} className="member-workout-row">
                              <span>{exercise.exercise_name || '—'}</span>
                              <span>{exercise.sets ?? '—'}</span>
                              <span>{exercise.reps ?? '—'}</span>
                              <span className="member-workout-day">{formatScheduleDay(exercise.schedule_day)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="member-muted" style={{ marginTop: 10 }}>
                          No exercises listed for this plan.
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeNav === 'diet' && (
            <section className="member-card member-card-pad member-card-wide">
              <h2>Diet plans</h2>
              {dietPlans.length === 0 ? (
                <p className="member-muted">No diet plans assigned yet. Check back later.</p>
              ) : (
                <div className="member-grid-2">
                  {dietPlans.map((plan) => (
                    <article key={plan.diet_plan_id} className="member-card member-card-pad">
                      <h3>Plan #{plan.diet_plan_id}</h3>
                      <p className="member-muted">
                        Trainer: {plan.trainer_name || 'Unassigned'}
                      </p>
                      <p className="member-pill">{plan.calorie_target} kcal daily</p>
                      <h4>Meal schedule</h4>
                      <p>{plan.meal_schedule}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeNav === 'measurements' && (
            <section className="member-card member-card-pad member-card-wide">
              <h2>Body measurements</h2>
              <p className="member-muted">Record weight, BMI, body fat percentage, and muscle mass.</p>

              <form className="member-membership-box" onSubmit={handleMeasurementSubmit}>
                <div className="member-detail-grid">
                  <div>
                    <span className="member-detail-label">Weight (kg)</span>
                    <input
                      type="number"
                      className="member-input"
                      value={measurementForm.weight}
                      onChange={(e) => setMeasurementForm({ ...measurementForm, weight: e.target.value })}
                      min="0"
                      step="0.1"
                      required
                    />
                  </div>
                  <div>
                    <span className="member-detail-label">BMI</span>
                    <input
                      type="number"
                      className="member-input"
                      value={measurementForm.bmi}
                      onChange={(e) => setMeasurementForm({ ...measurementForm, bmi: e.target.value })}
                      min="0"
                      step="0.1"
                      required
                    />
                  </div>
                  <div>
                    <span className="member-detail-label">Body fat (%)</span>
                    <input
                      type="number"
                      className="member-input"
                      value={measurementForm.body_fat}
                      onChange={(e) => setMeasurementForm({ ...measurementForm, body_fat: e.target.value })}
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <span className="member-detail-label">Muscle mass (kg)</span>
                    <input
                      type="number"
                      className="member-input"
                      value={measurementForm.muscle_mass}
                      onChange={(e) => setMeasurementForm({ ...measurementForm, muscle_mass: e.target.value })}
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <span className="member-detail-label">Record date</span>
                    <input
                      type="date"
                      className="member-input"
                      value={measurementForm.record_date}
                      onChange={(e) => setMeasurementForm({ ...measurementForm, record_date: e.target.value })}
                    />
                  </div>
                </div>

                {measurementNote && (
                  <p
                    className={
                      measurementNote.toLowerCase().includes('could not') ||
                      measurementNote.toLowerCase().includes('invalid') ||
                      measurementNote.toLowerCase().includes('failed')
                        ? 'member-subscribe-msg member-subscribe-msg-err'
                        : 'member-subscribe-msg member-subscribe-msg-ok'
                    }
                    style={{ marginTop: 12 }}
                  >
                    {measurementNote}
                  </p>
                )}

                <button
                  type="submit"
                  className="member-plan-subscribe-btn"
                  style={{ marginTop: 12 }}
                  disabled={measurementBusy}
                >
                  {measurementBusy ? 'Saving…' : 'Save measurement'}
                </button>
              </form>

              <div className="member-workout-grid" style={{ marginTop: 20 }}>
                {bodyMeasurements.length === 0 ? (
                  <p className="member-muted">No measurements saved yet.</p>
                ) : (
                  bodyMeasurements.map((row) => (
                    <article key={row.measurement_id} className="member-workout-card">
                      <div className="member-workout-head">
                        <div>
                          <h3>Measurement #{row.measurement_id}</h3>
                          <p className="member-muted">Recorded {formatDate(row.record_date)}</p>
                        </div>
                      </div>
                      <div className="member-workout-table">
                        <div className="member-workout-row member-workout-row-head">
                          <span>Weight</span>
                          <span>BMI</span>
                          <span>Body fat</span>
                          <span>Muscle mass</span>
                        </div>
                        <div className="member-workout-row">
                          <span>{row.weight ?? '—'} kg</span>
                          <span>{row.bmi ?? '—'}</span>
                          <span>{row.body_fat ?? '—'}%</span>
                          <span>{row.muscle_mass ?? '—'} kg</span>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          )}

          {activeNav === 'trainers' && (
            <section className="member-card member-card-pad member-card-wide">
              <h2>Training team</h2>
              <p className="member-muted member-trainers-intro">
                Meet the coaches available at the gym. Availability below matches the date you pick for booking (09:00–17:00,
                1-hour slots, minus already scheduled sessions).
              </p>

              <div className="member-membership-box member-booking-box">
                <h3>Book a personal training session</h3>
                <div className="member-booking-grid">
                  <div>
                    <span className="member-detail-label">Trainer</span>
                    <select
                      className="member-input"
                      value={bookingTrainerId ?? ''}
                      onChange={(e) => {
                        const id = e.target.value ? parseInt(e.target.value, 10) : null;
                        setBookingTrainerId(id);
                        if (id) loadTrainerSlots(id, bookingDate);
                      }}
                    >
                      <option value="">Select trainer…</option>
                      {trainers.map((t) => (
                        <option key={t.trainer_id} value={t.trainer_id}>
                          {t.name} {t.specialization ? `(${t.specialization})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="member-detail-label">Date</span>
                    <input
                      type="date"
                      className="member-input"
                      value={bookingDate}
                      onChange={(e) => {
                        const d = e.target.value;
                        setBookingDate(d);
                        if (bookingTrainerId) loadTrainerSlots(bookingTrainerId, d);
                      }}
                    />
                  </div>
                  <div>
                    <span className="member-detail-label">Time</span>
                    <select
                      className="member-input"
                      value={bookingSlot}
                      onChange={(e) => setBookingSlot(e.target.value)}
                      disabled={!bookingTrainerId}
                    >
                      <option value="">{bookingTrainerId ? 'Select time…' : 'Choose trainer first'}</option>
                      {bookingSlots.map((s) => (
                        <option key={s.start_time} value={s.start_time}>
                          {s.start_time} – {s.end_time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {bookingNote && (
                  <p
                    className={
                      bookingNote.toLowerCase().includes('could not') ||
                      bookingNote.toLowerCase().includes('invalid') ||
                      bookingNote.toLowerCase().includes('conflict') ||
                      bookingNote.toLowerCase().includes('not available')
                        ? 'member-subscribe-msg member-subscribe-msg-err'
                        : 'member-subscribe-msg member-subscribe-msg-ok'
                    }
                    style={{ marginTop: 12 }}
                  >
                    {bookingNote}
                  </p>
                )}

                <button
                  type="button"
                  className="member-plan-subscribe-btn"
                  style={{ marginTop: 12 }}
                  disabled={!bookingTrainerId || !bookingSlot || bookingBusy}
                  onClick={handleBookSession}
                >
                  {bookingBusy ? 'Booking…' : 'Book session'}
                </button>
                <p className="member-muted" style={{ marginTop: 8 }}>
                  Availability is calculated from gym hours (09:00–17:00) minus existing scheduled sessions.
                </p>
              </div>

              <div style={{ marginTop: '24px' }}>
                <h3>Your Booked Sessions</h3>
                {bookedSessions.length === 0 ? (
                  <p className="member-muted">No trainer sessions booked yet.</p>
                ) : (
                  <ul className="member-schedule-list">
                    {bookedSessions.map((session) => (
                      <li key={session.session_id}>
                        <div>
                          <span className="member-pill">{session.status || 'Scheduled'}</span>
                          <h3>{session.trainer_name || 'Trainer'}</h3>
                          {session.specialization && <p className="member-muted">{session.specialization}</p>}
                        </div>
                        <div className="member-schedule-when">
                          <span>{formatDate(session.session_date)}</span>
                          <span>{formatTime(session.session_time)}</span>
                        </div>
                        <button
                          type="button"
                          className="member-plan-subscribe-btn"
                          style={{ padding: '6px 12px', fontSize: '14px', marginTop: '8px' }}
                          onClick={() => handleDeleteSession(session.session_id)}
                        >
                          Cancel
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {trainerAvailabilityError && (
                <div className="member-error-banner" style={{ margin: '12px 0 16px' }}>
                  {trainerAvailabilityError}
                </div>
              )}

              <div className="member-trainer-grid">
                {trainers.length === 0 ? (
                  <p className="member-muted">No trainers listed.</p>
                ) : (
                  trainers.map((trainer) => (
                    <article key={trainer.trainer_id} className="member-trainer-card">
                      <div className="member-trainer-avatar" aria-hidden>
                        {(trainer.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <h3>{trainer.name}</h3>
                      <p className="member-trainer-spec">{trainer.specialization || 'General training'}</p>
                      <div className="member-trainer-availability">
                        <div className="member-trainer-availability-head">
                          <span className="member-detail-label">Availability</span>
                          {trainerAvailabilityBusy ? (
                            <span className="member-trainer-availability-pill member-trainer-availability-pill-muted">
                              Loading…
                            </span>
                          ) : (
                            <span
                              className={`member-trainer-availability-pill ${
                                (trainerAvailabilityById[trainer.trainer_id]?.slot_count ?? 0) > 0
                                  ? 'member-trainer-availability-pill-ok'
                                  : 'member-trainer-availability-pill-warn'
                              }`}
                            >
                              {(trainerAvailabilityById[trainer.trainer_id]?.slot_count ?? 0) > 0
                                ? `${trainerAvailabilityById[trainer.trainer_id].slot_count} open slot${
                                    trainerAvailabilityById[trainer.trainer_id].slot_count === 1 ? '' : 's'
                                  }`
                                : 'Fully booked'}
                            </span>
                          )}
                        </div>

                        {!trainerAvailabilityBusy && !trainerAvailabilityError && (
                          <div className="member-trainer-slot-chips" aria-label="Open time slots">
                            {(() => {
                              const row = trainerAvailabilityById[trainer.trainer_id];
                              const slots = row?.slots || [];
                              const expanded = expandedAvailability.has(trainer.trainer_id);
                              const visibleSlots = expanded ? slots : slots.slice(0, 6);

                              return (
                                <>
                                  {visibleSlots.map((s) => (
                              <span key={`${trainer.trainer_id}-${s.start_time}`} className="member-trainer-slot-chip">
                                {s.start_time}–{s.end_time}
                              </span>
                                  ))}

                                  {(row?.slot_count ?? 0) > 6 && !expanded && (
                                    <button
                                      type="button"
                                      className="member-trainer-slot-more"
                                      onClick={() =>
                                        setExpandedAvailability((prev) => {
                                          const next = new Set(prev);
                                          next.add(trainer.trainer_id);
                                          return next;
                                        })
                                      }
                                    >
                                      +{(row.slot_count || 0) - 6} more
                                    </button>
                                  )}

                                  {(row?.slot_count ?? 0) > 6 && expanded && (
                                    <button
                                      type="button"
                                      className="member-trainer-slot-more"
                                      onClick={() =>
                                        setExpandedAvailability((prev) => {
                                          const next = new Set(prev);
                                          next.delete(trainer.trainer_id);
                                          return next;
                                        })
                                      }
                                    >
                                      Show less
                                    </button>
                                  )}
                                </>
                              );
                            })()}
                            {(trainerAvailabilityById[trainer.trainer_id]?.slot_count ?? 0) === 0 && (
                              <span className="member-muted member-trainer-slot-empty">No open 1-hour slots this day.</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="member-trainer-meta">
                        {trainer.experience_years != null && (
                          <span>{trainer.experience_years} yrs experience</span>
                        )}
                        {trainer.email && <span>{trainer.email}</span>}
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          )}

          {activeNav === 'workout-log' && (
            <section className="member-card member-card-pad member-card-wide">
              <h2>Workout log</h2>
              <p className="member-muted">Log completed workouts and track progress over time.</p>

              <section className="member-stats" aria-label="Workout log stats">
                <article className="member-stat-card">
                  <span className="member-stat-label">Total logs</span>
                  <strong className="member-stat-value">{workoutLogStats.total_logs ?? 0}</strong>
                  <p className="member-stat-foot">
                    {workoutLogStats.last_log_date
                      ? `Last log ${formatDate(workoutLogStats.last_log_date)}`
                      : 'No workouts logged yet'}
                  </p>
                </article>
                <article className="member-stat-card">
                  <span className="member-stat-label">Frequency</span>
                  <strong className="member-stat-value">{workoutLogStats.logs_last_7 ?? 0}</strong>
                  <p className="member-stat-foot">
                    {workoutLogStats.logs_last_30 ?? 0} logs in the last 30 days
                  </p>
                </article>
                <article className="member-stat-card">
                  <span className="member-stat-label">Unique exercises</span>
                  <strong className="member-stat-value">{workoutLogStats.unique_exercises ?? 0}</strong>
                  <p className="member-stat-foot">Distinct exercises logged</p>
                </article>
                <article className="member-stat-card">
                  <span className="member-stat-label">Max weight</span>
                  <strong className="member-stat-value">
                    {workoutLogStats.max_weight != null
                      ? `${Number(workoutLogStats.max_weight).toFixed(1)} kg`
                      : '—'}
                  </strong>
                  <p className="member-stat-foot">
                    Avg: {workoutLogStats.avg_weight != null ? `${Number(workoutLogStats.avg_weight).toFixed(1)} kg` : '—'}
                  </p>
                </article>
              </section>

              {/* Phone Remote Control */}
              <div style={{ marginBottom: '24px' }}>
                <PhoneRemoteConnect
                  memberId={memberId}
                  onSetComplete={handleSetComplete}
                  onAddRep={handleAddRep}
                  onRemoveRep={handleRemoveRep}
                  onStartRest={handleStartRest}
                  onPauseRest={handlePauseRest}
                  onFatigueUpdate={handleFatigueUpdate}
                  onEndWorkout={handleEndWorkout}
                  onWorkoutLogSubmit={handleWorkoutLogFromPhone}
                />
              </div>

              {/* Live workout tracking display */}
              <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: 'linear-gradient(145deg, #1a2f33 0%, #0f1f22 100%)', borderRadius: '16px', border: '1px solid rgba(40, 199, 182, 0.1)' }}>
                <h3 style={{ marginTop: 0, marginBottom: '12px', color: '#d7fffb' }}>Live Workout Tracking</h3>
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                  <div>
                    <span className="member-detail-label">Current Set</span>
                    <strong className="member-stat-value">{currentSet}</strong>
                  </div>
                  <div>
                    <span className="member-detail-label">Current Reps</span>
                    <strong className="member-stat-value">{currentReps}</strong>
                  </div>
                  <div>
                    <span className="member-detail-label">Resting</span>
                    <strong className="member-stat-value">{isResting ? 'Yes' : 'No'}</strong>
                  </div>
                  <div>
                    <span className="member-detail-label">Fatigue</span>
                    <strong className="member-stat-value" style={{ textTransform: 'capitalize' }}>{fatigueLevel}</strong>
                  </div>
                </div>
              </div>

              <form className="member-membership-box" onSubmit={handleWorkoutLogSubmit}>
                <h3>Log a workout</h3>
                <div className="member-detail-grid">
                  <div>
                    <span className="member-detail-label">Workout plan</span>
                    <select
                      className="member-input"
                      value={workoutLogForm.workout_plan_id}
                      onChange={(e) => {
                        const value = e.target.value;
                        setWorkoutLogForm((prev) => ({
                          ...prev,
                          workout_plan_id: value,
                          exercise_id: ''
                        }));
                      }}
                      required
                    >
                      <option value="">Select plan…</option>
                      {workoutPlans.map((plan) => (
                        <option key={plan.workout_plan_id} value={plan.workout_plan_id}>
                          Plan #{plan.workout_plan_id} {plan.trainer_name ? `(${plan.trainer_name})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="member-detail-label">Exercise</span>
                    <select
                      className="member-input"
                      value={workoutLogForm.exercise_id}
                      onChange={(e) => setWorkoutLogForm((prev) => ({ ...prev, exercise_id: e.target.value }))}
                      disabled={!workoutLogForm.workout_plan_id}
                      required
                    >
                      <option value="">{workoutLogForm.workout_plan_id ? 'Select exercise…' : 'Choose plan first'}</option>
                      {logPlanExercises.map((exercise) => (
                        <option key={exercise.exercise_id} value={exercise.exercise_catalog_id}>
                          {exercise.exercise_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="member-detail-label">Weight (kg)</span>
                    <input
                      type="number"
                      className="member-input"
                      value={workoutLogForm.weight_used}
                      onChange={(e) => setWorkoutLogForm((prev) => ({ ...prev, weight_used: e.target.value }))}
                      min="0"
                      step="0.5"
                      required
                    />
                  </div>
                  <div>
                    <span className="member-detail-label">Reps completed</span>
                    <input
                      type="number"
                      className="member-input"
                      value={workoutLogForm.reps_completed}
                      onChange={(e) => setWorkoutLogForm((prev) => ({ ...prev, reps_completed: e.target.value }))}
                      min="0"
                      step="1"
                      required
                    />
                  </div>
                  <div>
                    <span className="member-detail-label">Log date</span>
                    <input
                      type="date"
                      className="member-input"
                      value={workoutLogForm.log_date}
                      onChange={(e) => setWorkoutLogForm((prev) => ({ ...prev, log_date: e.target.value }))}
                    />
                  </div>
                </div>

                {workoutLogNote && (
                  <p
                    className={
                      workoutLogNote.toLowerCase().includes('could not') ||
                      workoutLogNote.toLowerCase().includes('invalid') ||
                      workoutLogNote.toLowerCase().includes('failed')
                        ? 'member-subscribe-msg member-subscribe-msg-err'
                        : 'member-subscribe-msg member-subscribe-msg-ok'
                    }
                    style={{ marginTop: 12 }}
                  >
                    {workoutLogNote}
                  </p>
                )}

                <button
                  type="submit"
                  className="member-plan-subscribe-btn"
                  style={{ marginTop: 12 }}
                  disabled={workoutLogBusy || workoutPlans.length === 0}
                >
                  {workoutLogBusy ? 'Saving…' : 'Save workout log'}
                </button>
                {workoutPlans.length === 0 && (
                  <p className="member-muted" style={{ marginTop: 10 }}>
                    No workout plans assigned yet. Ask your trainer to set one up.
                  </p>
                )}
              </form>

              <div className="member-workout-grid" style={{ marginTop: 20 }}>
                {workoutLogs.length === 0 ? (
                  <p className="member-muted">No workout logs yet.</p>
                ) : (
                  workoutLogs.map((log) => (
                    <article key={log.log_id} className="member-workout-card">
                      <div className="member-workout-head">
                        <div>
                          <h3>{log.exercise_name || 'Workout'}</h3>
                          <p className="member-muted">Plan #{log.workout_plan_id}</p>
                        </div>
                        <span className="member-workout-date">Logged {formatDate(log.log_date)}</span>
                      </div>
                      <div className="member-workout-table">
                        <div className="member-workout-row member-workout-row-head">
                          <span>Weight</span>
                          <span>Reps</span>
                          <span>Exercise</span>
                          <span>Date</span>
                        </div>
                        <div className="member-workout-row">
                          <span>
                            {log.weight_used != null ? `${Number(log.weight_used).toFixed(1)} kg` : '—'}
                          </span>
                          <span>{log.reps_completed ?? '—'}</span>
                          <span>{log.exercise_name || '—'}</span>
                          <span>{formatDate(log.log_date)}</span>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
