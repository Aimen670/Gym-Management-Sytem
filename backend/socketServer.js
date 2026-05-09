const { Server } = require('socket.io');
const { sql, getPool } = require('./db');

let io;

function initializeSocketServer(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: ['http://localhost:5174', 'http://localhost:5173', 'http://localhost:3000', 'http://192.168.100.220:5174'],
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    // Socket.IO event handlers
    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        // Desktop joins a session room
        socket.on('join-session', async (data) => {
            try {
                const { sessionToken, memberId } = data;
                
                // Verify session exists in database
                const pool = getPool();
                const result = await pool.request()
                    .input('session_token', sql.UniqueIdentifier, sessionToken)
                    .input('member_id', sql.Int, memberId)
                    .query(`
                        SELECT session_id, session_status 
                        FROM phone_remote_sessions 
                        WHERE session_token = @session_token 
                        AND member_id = @member_id
                    `);

                if (result.recordset.length === 0) {
                    socket.emit('error', { message: 'Invalid session token' });
                    return;
                }

                const session = result.recordset[0];
                const roomName = `session-${sessionToken}`;
                
                socket.join(roomName);
                socket.data.sessionToken = sessionToken;
                socket.data.sessionId = session.session_id;
                socket.data.isDesktop = true;

                console.log(`Desktop joined session: ${sessionToken}`);
                
                // Send current status to desktop
                socket.emit('session-status', { 
                    status: session.session_status,
                    room: roomName
                });
            } catch (error) {
                console.error('Error joining session:', error);
                socket.emit('error', { message: 'Failed to join session' });
            }
        });

        // Phone connects to a session
        socket.on('phone-connect', async (data) => {
            try {
                const { sessionToken } = data;
                
                // Verify session exists and is waiting
                const pool = getPool();
                const result = await pool.request()
                    .input('session_token', sql.UniqueIdentifier, sessionToken)
                    .query('EXEC SP_get_session_by_token @session_token');

                if (result.recordset.length === 0) {
                    socket.emit('error', { message: 'Invalid or expired session token' });
                    return;
                }

                const session = result.recordset[0];
                const roomName = `session-${sessionToken}`;
                
                socket.join(roomName);
                socket.data.sessionToken = sessionToken;
                socket.data.sessionId = session.session_id;
                socket.data.isPhone = true;

                // Update session status in database
                await pool.request()
                    .input('session_token', sql.UniqueIdentifier, sessionToken)
                    .input('status', sql.VarChar(20), 'connected')
                    .query('EXEC SP_update_session_status @session_token, @status');

                // Log phone connection event
                await pool.request()
                    .input('session_token', sql.UniqueIdentifier, sessionToken)
                    .input('event_type', sql.VarChar(50), 'phone_connected')
                    .input('event_data', sql.NVarChar, JSON.stringify({ socketId: socket.id }))
                    .query('EXEC SP_log_remote_event @session_token, @event_type, @event_data');

                // Notify desktop that phone is connected
                io.to(roomName).emit('phone-connected', { 
                    connected: true,
                    timestamp: new Date().toISOString()
                });

                console.log(`Phone connected to session: ${sessionToken}`);
                
                // Send success to phone
                socket.emit('connection-established', { success: true });
            } catch (error) {
                console.error('Error connecting phone:', error);
                socket.emit('error', { message: 'Failed to connect phone' });
            }
        });

        // Phone disconnects
        socket.on('disconnect', async () => {
            if (socket.data.isPhone && socket.data.sessionToken) {
                try {
                    const roomName = `session-${socket.data.sessionToken}`;
                    
                    // Update session status in database
                    const pool = getPool();
                    await pool.request()
                        .input('session_token', sql.UniqueIdentifier, socket.data.sessionToken)
                        .input('status', sql.VarChar(20), 'disconnected')
                        .query('EXEC SP_update_session_status @session_token, @status');

                    // Log phone disconnection event
                    await pool.request()
                        .input('session_token', sql.UniqueIdentifier, socket.data.sessionToken)
                        .input('event_type', sql.VarChar(50), 'phone_disconnected')
                        .input('event_data', sql.NVarChar, JSON.stringify({ socketId: socket.id }))
                        .query('EXEC SP_log_remote_event @session_token, @event_type, @event_data');

                    // Notify desktop
                    io.to(roomName).emit('phone-disconnected', { 
                        connected: false,
                        timestamp: new Date().toISOString()
                    });

                    console.log(`Phone disconnected from session: ${socket.data.sessionToken}`);
                } catch (error) {
                    console.error('Error handling phone disconnect:', error);
                }
            }
        });

        // Phone actions
        socket.on('set-complete', async (data) => {
            if (!socket.data.isPhone || !socket.data.sessionToken) return;
            
            const roomName = `session-${socket.data.sessionToken}`;
            
            try {
                // Log event to database
                const pool = getPool();
                await pool.request()
                    .input('session_token', sql.UniqueIdentifier, socket.data.sessionToken)
                    .input('event_type', sql.VarChar(50), 'set_complete')
                    .input('event_data', sql.NVarChar, JSON.stringify(data))
                    .query('EXEC SP_log_remote_event @session_token, @event_type, @event_data');

                // Forward to desktop
                io.to(roomName).emit('set-complete', data);
            } catch (error) {
                console.error('Error handling set-complete:', error);
            }
        });

        socket.on('workout-log-submit', async (data) => {
            if (!socket.data.isPhone || !socket.data.sessionToken) return;
            
            const roomName = `session-${socket.data.sessionToken}`;
            
            try {
                const pool = getPool();
                await pool.request()
                    .input('session_token', sql.UniqueIdentifier, socket.data.sessionToken)
                    .input('event_type', sql.VarChar(50), 'workout_log_submit')
                    .input('event_data', sql.NVarChar, JSON.stringify(data))
                    .query('EXEC SP_log_remote_event @session_token, @event_type, @event_data');

                io.to(roomName).emit('workout-log-submit', data);
            } catch (error) {
                console.error('Error handling workout-log-submit:', error);
            }
        });

        socket.on('add-rep', async (data) => {
            if (!socket.data.isPhone || !socket.data.sessionToken) return;
            
            const roomName = `session-${socket.data.sessionToken}`;
            
            try {
                const pool = getPool();
                await pool.request()
                    .input('session_token', sql.UniqueIdentifier, socket.data.sessionToken)
                    .input('event_type', sql.VarChar(50), 'add_rep')
                    .input('event_data', sql.NVarChar, JSON.stringify(data))
                    .query('EXEC SP_log_remote_event @session_token, @event_type, @event_data');

                io.to(roomName).emit('add-rep', data);
            } catch (error) {
                console.error('Error handling add-rep:', error);
            }
        });

        socket.on('remove-rep', async (data) => {
            if (!socket.data.isPhone || !socket.data.sessionToken) return;
            
            const roomName = `session-${socket.data.sessionToken}`;
            
            try {
                const pool = getPool();
                await pool.request()
                    .input('session_token', sql.UniqueIdentifier, socket.data.sessionToken)
                    .input('event_type', sql.VarChar(50), 'remove_rep')
                    .input('event_data', sql.NVarChar, JSON.stringify(data))
                    .query('EXEC SP_log_remote_event @session_token, @event_type, @event_data');

                io.to(roomName).emit('remove-rep', data);
            } catch (error) {
                console.error('Error handling remove-rep:', error);
            }
        });

        socket.on('start-rest', async (data) => {
            if (!socket.data.isPhone || !socket.data.sessionToken) return;
            
            const roomName = `session-${socket.data.sessionToken}`;
            
            try {
                const pool = getPool();
                await pool.request()
                    .input('session_token', sql.UniqueIdentifier, socket.data.sessionToken)
                    .query('EXEC SP_start_rest_timer @session_token');
                
                await pool.request()
                    .input('session_token', sql.UniqueIdentifier, socket.data.sessionToken)
                    .input('event_type', sql.VarChar(50), 'start_rest')
                    .input('event_data', sql.NVarChar, JSON.stringify(data))
                    .query('EXEC SP_log_remote_event @session_token, @event_type, @event_data');

                io.to(roomName).emit('start-rest', data);
            } catch (error) {
                console.error('Error handling start-rest:', error);
            }
        });

        socket.on('pause-rest', async (data) => {
            if (!socket.data.isPhone || !socket.data.sessionToken) return;
            
            const roomName = `session-${socket.data.sessionToken}`;
            
            try {
                const pool = getPool();
                await pool.request()
                    .input('session_token', sql.UniqueIdentifier, socket.data.sessionToken)
                    .query('EXEC SP_stop_rest_timer @session_token');
                
                await pool.request()
                    .input('session_token', sql.UniqueIdentifier, socket.data.sessionToken)
                    .input('event_type', sql.VarChar(50), 'pause_rest')
                    .input('event_data', sql.NVarChar, JSON.stringify(data))
                    .query('EXEC SP_log_remote_event @session_token, @event_type, @event_data');

                io.to(roomName).emit('pause-rest', data);
            } catch (error) {
                console.error('Error handling pause-rest:', error);
            }
        });

        socket.on('fatigue-update', async (data) => {
            if (!socket.data.isPhone || !socket.data.sessionToken) return;
            
            const roomName = `session-${socket.data.sessionToken}`;
            
            try {
                const pool = getPool();
                await pool.request()
                    .input('session_token', sql.UniqueIdentifier, socket.data.sessionToken)
                    .input('event_type', sql.VarChar(50), 'fatigue_update')
                    .input('event_data', sql.NVarChar, JSON.stringify(data))
                    .query('EXEC SP_log_remote_event @session_token, @event_type, @event_data');

                io.to(roomName).emit('fatigue-update', data);
            } catch (error) {
                console.error('Error handling fatigue-update:', error);
            }
        });

        socket.on('end-workout', async (data) => {
            if (!socket.data.isPhone || !socket.data.sessionToken) return;
            
            const roomName = `session-${socket.data.sessionToken}`;
            
            try {
                // Update session status to ended
                const pool = getPool();
                await pool.request()
                    .input('session_token', sql.UniqueIdentifier, socket.data.sessionToken)
                    .input('status', sql.VarChar(20), 'ended')
                    .query('EXEC SP_update_session_status @session_token, @status');

                // Log event
                await pool.request()
                    .input('session_token', sql.UniqueIdentifier, socket.data.sessionToken)
                    .input('event_type', sql.VarChar(50), 'end_workout')
                    .input('event_data', sql.NVarChar, JSON.stringify(data))
                    .query('EXEC SP_log_remote_event @session_token, @event_type, @event_data');

                io.to(roomName).emit('end-workout', data);
            } catch (error) {
                console.error('Error handling end-workout:', error);
            }
        });
    });

    return io;
}

function getIO() {
    return io;
}

module.exports = { initializeSocketServer, getIO };
