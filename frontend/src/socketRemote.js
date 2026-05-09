import { io } from 'socket.io-client';

const SOCKET_URL = `http://${window.location.hostname}:5000`;

class SocketRemote {
    constructor() {
        this.socket = null;
        this.listeners = {};
    }

    connect() {
        if (this.socket?.connected) return this.socket;

        this.socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        this.socket.on('connect', () => {
            console.log('Socket connected:', this.socket.id);
        });

        this.socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
            this.emit('error', error);
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    // Desktop: Join a session room
    joinSession(sessionToken, memberId) {
        if (!this.socket) this.connect();
        
        return new Promise((resolve, reject) => {
            this.socket.emit('join-session', { sessionToken, memberId }, (response) => {
                if (response?.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response);
                }
            });
        });
    }

    // Phone: Connect to a session
    connectToSession(sessionToken) {
        if (!this.socket) this.connect();
        
        return new Promise((resolve, reject) => {
            this.socket.emit('phone-connect', { sessionToken }, (response) => {
                if (response?.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response);
                }
            });
        });
    }

    // Phone actions
    emitSetComplete(data = {}) {
        this.socket?.emit('set-complete', data);
    }

    emitAddRep(data = {}) {
        this.socket?.emit('add-rep', data);
    }

    emitRemoveRep(data = {}) {
        this.socket?.emit('remove-rep', data);
    }

    emitStartRest(data = {}) {
        this.socket?.emit('start-rest', data);
    }

    emitPauseRest(data = {}) {
        this.socket?.emit('pause-rest', data);
    }

    emitFatigueUpdate(level, data = {}) {
        this.socket?.emit('fatigue-update', { level, ...data });
    }

    emitEndWorkout(data = {}) {
        this.socket?.emit('end-workout', data);
    }

    emitWorkoutLogSubmit(data = {}) {
        this.socket?.emit('workout-log-submit', data);
    }

    // Event listeners
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
        this.socket?.on(event, callback);
    }

    off(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
        this.socket?.off(event, callback);
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }

    // Remove all listeners
    removeAllListeners() {
        Object.keys(this.listeners).forEach(event => {
            this.listeners[event].forEach(callback => {
                this.socket?.off(event, callback);
            });
        });
        this.listeners = {};
    }
}

// Create singleton instance
const socketRemote = new SocketRemote();

export default socketRemote;
