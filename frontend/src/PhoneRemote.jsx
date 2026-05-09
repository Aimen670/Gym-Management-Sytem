import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socketRemote from './socketRemote';

const PhoneRemote = () => {
    const { sessionToken } = useParams();
    const navigate = useNavigate();
    const [connectionStatus, setConnectionStatus] = useState('connecting');
    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState('');
    const [fetchError, setFetchError] = useState('');
    const [rawResponse, setRawResponse] = useState('');
    const [memberId, setMemberId] = useState(null);
    
    // Workout log form state
    const [workoutPlans, setWorkoutPlans] = useState([]);
    const [exercises, setExercises] = useState([]);
    const [selectedPlan, setSelectedPlan] = useState('');
    const [selectedExercise, setSelectedExercise] = useState('');
    const [weight, setWeight] = useState('');
    const [reps, setReps] = useState('');
    const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
    
    // Rest timer state
    const [isResting, setIsResting] = useState(false);
    const [restSeconds, setRestSeconds] = useState(0);
    const [restInterval, setRestInterval] = useState(null);

    useEffect(() => {
        if (!sessionToken) {
            setError('Invalid session token');
            return;
        }

        const connect = async () => {
            try {
                await socketRemote.connectToSession(sessionToken);
                // member_id will be received via 'connection-established' socket event
                console.log('Socket connection initiated');
            } catch (err) {
                console.error(err);
                setError('Failed to connect to session. Please check the session token.');
                setConnectionStatus('error');
            }
        };

        connect();

        const handleConnectionEstablished = (data) => {
            console.log('Connection established with data:', data);
            if (data?.success) {
                setConnectionStatus('connected');
                if (data.member_id) {
                    setMemberId(data.member_id);
                    console.log('Member ID received from socket:', data.member_id);
                }
            }
        };

        socketRemote.on('connection-established', handleConnectionEstablished);

        return () => {
            socketRemote.off('connection-established', handleConnectionEstablished);
            if (restInterval) clearInterval(restInterval);
            socketRemote.disconnect();
        };
    }, [sessionToken]);

    useEffect(() => {
        if (memberId) {
            const fetchWorkoutPlans = async () => {
                try {
                    console.log('Fetching workout plans for memberId:', memberId);
                    const res = await fetch(`http://192.168.100.220:5000/api/member-workout-plans/${memberId}`);
                    console.log('Response status:', res.status);
                    const data = await res.json();
                    console.log('Workout plans data:', data);
                    if (res.ok) {
                        setWorkoutPlans(data);
                    } else {
                        console.error('Failed to fetch workout plans:', data.error);
                    }
                } catch (err) {
                    console.error('Error fetching workout plans:', err);
                }
            };

            fetchWorkoutPlans();
        }
    }, [memberId]);

    useEffect(() => {
        if (selectedPlan) {
            const fetchExercises = async () => {
                try {
                    const res = await fetch(`http://192.168.100.220:5000/api/workout-plans/${selectedPlan}/exercises`);
                    const data = await res.json();
                    if (res.ok) {
                        setExercises(data);
                    }
                } catch (err) {
                    console.error('Failed to fetch exercises:', err);
                }
            };

            fetchExercises();
        }
    }, [selectedPlan]);

    const showFeedback = (message) => {
        setFeedback(message);
        setTimeout(() => setFeedback(''), 2000);
    };

    const handleStartRest = () => {
        setIsResting(true);
        setRestSeconds(0);
        
        const interval = setInterval(() => {
            setRestSeconds(prev => prev + 1);
        }, 1000);
        
        setRestInterval(interval);
        
        socketRemote.emitStartRest();
        showFeedback('Rest timer started');
    };

    const handleStopRest = () => {
        setIsResting(false);
        if (restInterval) {
            clearInterval(restInterval);
            setRestInterval(null);
        }
        
        socketRemote.emitPauseRest({ duration: restSeconds });
        showFeedback(`Rest stopped: ${formatTime(restSeconds)}`);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSubmitWorkout = () => {
        if (!selectedPlan || !selectedExercise || !weight || !reps) {
            setError('Please fill all required fields');
            return;
        }

        const workoutData = {
            workout_plan_id: parseInt(selectedPlan),
            exercise_id: parseInt(selectedExercise),
            weight_used: parseFloat(weight),
            reps_completed: parseInt(reps),
            log_date: logDate
        };

        socketRemote.emit('workout-log-submit', workoutData);
        showFeedback('Workout log sent to desktop');
        
        setSelectedExercise('');
        setWeight('');
        setReps('');
    };

    const handleSetComplete = () => {
        socketRemote.emitSetComplete();
        showFeedback('Set Complete!');
    };

    const handleAddRep = () => {
        socketRemote.emitAddRep();
        showFeedback('+1 Rep');
    };

    const handleRemoveRep = () => {
        socketRemote.emitRemoveRep();
        showFeedback('-1 Rep');
    };

    const handlePauseRest = () => {
        socketRemote.emitPauseRest();
        showFeedback('Rest Paused');
    };

    const handleFatigueUpdate = (level) => {
        socketRemote.emitFatigueUpdate(level);
        showFeedback(`Fatigue: ${level}`);
    };

    const handleEndWorkout = () => {
        if (window.confirm('Are you sure you want to end the workout?')) {
            socketRemote.emitEndWorkout();
            showFeedback('Workout Ended');
            setTimeout(() => {
                navigate('/');
            }, 2000);
        }
    };

    const Input = ({ label, value, onChange, type = 'text', required = false }) => (
        <div style={{ marginBottom: '16px' }}>
            <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                color: '#8ca3a0',
                fontSize: '14px',
                fontWeight: '500'
            }}>
                {label}
                {required && <span style={{ color: '#ef4444' }}> *</span>}
            </label>
            <input
                type={type}
                value={value}
                onChange={onChange}
                required={required}
                style={{
                    width: '100%',
                    padding: '14px',
                    backgroundColor: '#0d1314',
                    border: '1px solid #243032',
                    borderRadius: '8px',
                    color: '#e6f4f2',
                    fontSize: '16px',
                    outline: 'none'
                }}
            />
        </div>
    );

    const Select = ({ label, value, onChange, options, required = false, disabled = false }) => (
        <div style={{ marginBottom: '16px' }}>
            <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                color: '#8ca3a0',
                fontSize: '14px',
                fontWeight: '500'
            }}>
                {label}
                {required && <span style={{ color: '#ef4444' }}> *</span>}
            </label>
            <select
                value={value}
                onChange={onChange}
                required={required}
                disabled={disabled}
                style={{
                    width: '100%',
                    padding: '14px',
                    backgroundColor: disabled ? '#0a0f10' : '#0d1314',
                    border: '1px solid #243032',
                    borderRadius: '8px',
                    color: disabled ? '#666' : '#e6f4f2',
                    fontSize: '16px',
                    outline: 'none'
                }}
            >
                <option value="">{label}...</option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );

    const Button = ({ onClick, children, color, disabled = false, fullWidth = false }) => (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                padding: '16px 24px',
                fontSize: '16px',
                fontWeight: 'bold',
                border: 'none',
                borderRadius: '12px',
                backgroundColor: color,
                color: 'white',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                width: fullWidth ? '100%' : 'auto',
                marginBottom: '12px',
                minHeight: '56px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
                transition: 'transform 0.1s ease'
            }}
        >
            {children}
        </button>
    );

    if (connectionStatus === 'error') {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                padding: '20px',
                backgroundColor: '#0b1517'
            }}>
                <div style={{
                    textAlign: 'center',
                    backgroundColor: '#121818',
                    padding: '40px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                    color: '#e6fffb'
                }}>
                    <h2 style={{ color: '#dc3545', marginTop: 0 }}>Connection Failed</h2>
                    <p style={{ color: '#999999', marginBottom: '20px' }}>{error}</p>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#28c7b6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '16px'
                        }}
                    >
                        Go to Home
                    </button>
                </div>
            </div>
        );
    }

    if (connectionStatus === 'connecting') {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                backgroundColor: '#0b1517'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        border: '5px solid #1a2f33',
                        borderTop: '5px solid #28c7b6',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 20px'
                    }} />
                    <p style={{ color: '#e6fffb', fontSize: '18px' }}>Connecting to workout...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#0b1517',
            padding: '20px',
            maxWidth: '500px',
            margin: '0 auto'
        }}>
            <div style={{
                backgroundColor: '#121818',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
            }}>
                <h1 style={{
                    textAlign: 'center',
                    marginTop: 0,
                    marginBottom: '8px',
                    color: '#d7fffb'
                }}>
                    Workout Remote
                </h1>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '24px',
                    padding: '12px',
                    backgroundColor: 'rgba(40, 199, 182, 0.1)',
                    borderRadius: '8px',
                    border: '2px solid #28c7b6'
                }}>
                    <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: '#28c7b6',
                        marginRight: '10px'
                    }} />
                    <span style={{ fontWeight: '600', color: '#28c7b6' }}>Connected</span>
                    {memberId && <span style={{ marginLeft: '10px', color: '#8ca3a0', fontSize: '12px' }}>(Member ID: {memberId})</span>}
                </div>

                {feedback && (
                    <div style={{
                        textAlign: 'center',
                        padding: '12px',
                        backgroundColor: 'rgba(74, 222, 128, 0.1)',
                        color: '#86efac',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        border: '1px solid rgba(74, 222, 128, 0.3)'
                    }}>
                        {feedback}
                    </div>
                )}

                {/* Rest Timer */}
                <div style={{
                    marginBottom: '24px',
                    padding: '20px',
                    backgroundColor: 'rgba(40, 199, 182, 0.05)',
                    borderRadius: '12px',
                    border: '1px solid rgba(40, 199, 182, 0.2)'
                }}>
                    <h3 style={{ 
                        marginTop: 0, 
                        marginBottom: '16px', 
                        color: '#d7fffb',
                        textAlign: 'center'
                    }}>
                        Rest Timer
                    </h3>
                    <div style={{
                        textAlign: 'center',
                        marginBottom: '16px'
                    }}>
                        <span style={{
                            fontSize: '48px',
                            fontWeight: 'bold',
                            color: '#28c7b6',
                            fontFamily: 'monospace'
                        }}>
                            {formatTime(restSeconds)}
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        {!isResting ? (
                            <Button 
                                onClick={handleStartRest} 
                                color="#28c7b6"
                                fullWidth
                            >
                                ▶ Start Rest
                            </Button>
                        ) : (
                            <Button 
                                onClick={handleStopRest} 
                                color="#ffc107"
                                fullWidth
                            >
                                ⏸ Stop Rest
                            </Button>
                        )}
                    </div>
                </div>

                {/* Workout Log Form */}
                <div style={{
                    marginBottom: '24px',
                    padding: '20px',
                    backgroundColor: 'rgba(40, 199, 182, 0.05)',
                    borderRadius: '12px',
                    border: '1px solid rgba(40, 199, 182, 0.2)'
                }}>
                    <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#28c7b6', fontSize: '20px' }}>
                        Log Workout
                    </h3>

                    <div style={{ marginBottom: '16px', padding: '8px', backgroundColor: '#0d1314', borderRadius: '8px', fontSize: '12px', color: '#8ca3a0' }}>
                        Member ID: {memberId || 'Not loaded'} | Plans: {workoutPlans.length}
                        {fetchError && <div style={{color: '#ef4444', marginTop: '4px'}}>Error: {fetchError}</div>}
                        {rawResponse && <pre style={{marginTop: '8px', fontSize: '10px', overflow: 'auto', maxHeight: '100px'}}>{rawResponse}</pre>}
                    </div>

                    <Select
                        label="Workout Plan"
                        value={selectedPlan}
                        onChange={(e) => setSelectedPlan(e.target.value)}
                        options={workoutPlans.map(plan => ({
                            value: plan.workout_plan_id,
                            label: `Plan #${plan.workout_plan_id} ${plan.trainer_name ? `(${plan.trainer_name})` : ''}`
                        }))}
                        required
                    />

                    <Select
                        label="Exercise"
                        value={selectedExercise}
                        onChange={(e) => setSelectedExercise(e.target.value)}
                        options={exercises.map(ex => ({
                            value: ex.exercise_id,
                            label: ex.exercise_name
                        }))}
                        required
                        disabled={!selectedPlan}
                    />

                    <Input
                        label="Weight (kg)"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        type="number"
                        required
                    />

                    <Input
                        label="Reps"
                        value={reps}
                        onChange={(e) => setReps(e.target.value)}
                        type="number"
                        required
                    />

                    <Input
                        label="Date"
                        value={logDate}
                        onChange={(e) => setLogDate(e.target.value)}
                        type="date"
                    />

                    <Button
                        onClick={handleSubmitWorkout}
                        color="#28c7b6"
                        fullWidth
                    >
                        ✓ Submit Workout Log
                    </Button>
                </div>

                {error && (
                    <div style={{
                        marginTop: '12px',
                        padding: '12px',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: '#fca5a5',
                        borderRadius: '8px',
                        fontSize: '14px',
                        border: '1px solid rgba(239, 68, 68, 0.3)'
                    }}>
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PhoneRemote;
