import React, { useState, useEffect, useCallback } from 'react';
import socketRemote from './socketRemote';

const PhoneRemoteConnect = ({
    memberId,
    onSetComplete,
    onAddRep,
    onRemoveRep,
    onStartRest,
    onPauseRest,
    onFatigueUpdate,
    onEndWorkout,
    onWorkoutLogSubmit,
    localIP = 'localhost'
}) => {
    const [sessionToken, setSessionToken] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [qrUrl, setQrUrl] = useState('');

    // Create a new session
    const createSession = useCallback(async () => {
        if (!memberId) return;
        
        setLoading(true);
        setError('');
        try {
            const res = await fetch('http://localhost:5000/api/remote-sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ member_id: memberId, local_ip: localIP })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Failed to create session');
            
            setSessionToken(data.session_token);
            setQrUrl(`http://${localIP}:5174/connect/${data.session_token}`);
            setConnectionStatus('waiting');
            
            // Join the session room
            await socketRemote.joinSession(data.session_token, memberId);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [memberId, localIP]);

    // Setup socket event listeners
    useEffect(() => {
        if (!sessionToken) return;

        // Listen for phone connection
        const handlePhoneConnected = (data) => {
            setConnectionStatus('connected');
        };

        const handlePhoneDisconnected = (data) => {
            setConnectionStatus('disconnected');
        };

        const handleSetComplete = (data) => {
            onSetComplete?.(data);
        };

        const handleAddRep = (data) => {
            onAddRep?.(data);
        };

        const handleRemoveRep = (data) => {
            onRemoveRep?.(data);
        };

        const handleStartRest = (data) => {
            onStartRest?.(data);
        };

        const handlePauseRest = (data) => {
            onPauseRest?.(data);
        };

        const handleFatigueUpdate = (data) => {
            onFatigueUpdate?.(data);
        };

        const handleEndWorkout = (data) => {
            onEndWorkout?.(data);
            setConnectionStatus('ended');
        };

        const handleWorkoutLogSubmit = (data) => {
            onWorkoutLogSubmit?.(data);
        };

        socketRemote.on('phone-connected', handlePhoneConnected);
        socketRemote.on('phone-disconnected', handlePhoneDisconnected);
        socketRemote.on('set-complete', handleSetComplete);
        socketRemote.on('add-rep', handleAddRep);
        socketRemote.on('remove-rep', handleRemoveRep);
        socketRemote.on('start-rest', handleStartRest);
        socketRemote.on('pause-rest', handlePauseRest);
        socketRemote.on('fatigue-update', handleFatigueUpdate);
        socketRemote.on('end-workout', handleEndWorkout);
        socketRemote.on('workout-log-submit', handleWorkoutLogSubmit);

        return () => {
            socketRemote.off('phone-connected', handlePhoneConnected);
            socketRemote.off('phone-disconnected', handlePhoneDisconnected);
            socketRemote.off('set-complete', handleSetComplete);
            socketRemote.off('add-rep', handleAddRep);
            socketRemote.off('remove-rep', handleRemoveRep);
            socketRemote.off('start-rest', handleStartRest);
            socketRemote.off('pause-rest', handlePauseRest);
            socketRemote.off('fatigue-update', handleFatigueUpdate);
            socketRemote.off('end-workout', handleEndWorkout);
            socketRemote.off('workout-log-submit', handleWorkoutLogSubmit);
        };
    }, [sessionToken, onSetComplete, onAddRep, onRemoveRep, onStartRest, onPauseRest, onFatigueUpdate, onEndWorkout, onWorkoutLogSubmit]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            socketRemote.disconnect();
        };
    }, []);

    const getStatusColor = () => {
        switch (connectionStatus) {
            case 'waiting': return '#ffa500';
            case 'connected': return '#28a745';
            case 'disconnected': return '#dc3545';
            case 'ended': return '#6c757d';
            default: return '#6c757d';
        }
    };

    const getStatusText = () => {
        switch (connectionStatus) {
            case 'waiting': return 'Waiting for phone...';
            case 'connected': return 'Phone connected';
            case 'disconnected': return 'Phone disconnected';
            case 'ended': return 'Session ended';
            default: return 'Not connected';
        }
    };

    return (
        <div style={{
            border: '1px solid rgba(40, 199, 182, 0.1)',
            borderRadius: '16px',
            padding: '20px',
            maxWidth: '400px',
            backgroundColor: 'linear-gradient(145deg, #1a2f33 0%, #0f1f22 100%)',
            color: '#d7fffb'
        }}>
            <h3 style={{ marginBottom: '16px', marginTop: 0, color: '#d7fffb' }}>Phone Remote</h3>
            
            {!sessionToken ? (
                <button
                    onClick={createSession}
                    disabled={loading}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#28c7b6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px'
                    }}
                >
                    {loading ? 'Creating...' : 'Connect Phone'}
                </button>
            ) : (
                <>
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: '12px',
                            padding: '8px 12px',
                            backgroundColor: 'rgba(40, 199, 182, 0.1)',
                            borderRadius: '4px',
                            border: `2px solid ${getStatusColor()}`
                        }}>
                            <div style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                backgroundColor: getStatusColor(),
                                marginRight: '10px',
                                animation: connectionStatus === 'waiting' ? 'pulse 1.5s infinite' : 'none'
                            }} />
                            <span style={{ fontWeight: '500', color: '#d7fffb' }}>{getStatusText()}</span>
                        </div>
                    </div>

                    {connectionStatus !== 'ended' && (
                        <>
                            <div style={{ marginBottom: '16px' }}>
                                <p style={{ marginBottom: '8px', fontSize: '14px', color: '#8ca3a0' }}>
                                    Scan QR code with your phone:
                                </p>
                                <div style={{
                                    backgroundColor: 'rgba(40, 199, 182, 0.1)',
                                    padding: '16px',
                                    borderRadius: '4px',
                                    display: 'inline-block',
                                    border: '1px solid rgba(40, 199, 182, 0.2)'
                                }}>
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`}
                                        alt="QR Code"
                                        style={{ display: 'block', maxWidth: '100%', borderRadius: '0' }}
                                    />
                                </div>
                            </div>

                            <div style={{ fontSize: '12px', color: '#8ca3a0', wordBreak: 'break-all' }}>
                                <strong>URL:</strong> {qrUrl}
                            </div>
                        </>
                    )}

                    {error && (
                        <div style={{
                            marginTop: '12px',
                            padding: '8px 12px',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            color: '#fca5a5',
                            borderRadius: '4px',
                            fontSize: '14px',
                            border: '1px solid rgba(239, 68, 68, 0.3)'
                        }}>
                            {error}
                        </div>
                    )}
                </>
            )}

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div>
    );
};

export default PhoneRemoteConnect;
