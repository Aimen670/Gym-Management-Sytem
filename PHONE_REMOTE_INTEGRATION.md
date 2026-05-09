# Phone-as-Gym-Remote Integration Instructions

## Database Setup

Run the database schema to create the required tables, triggers, and stored procedures:

```bash
# In your SQL Server Management Studio or using sqlcmd:
# Run the contents of backend/phoneRemoteSchema.sql
```

The schema creates:
- `phone_remote_sessions` table with session tracking
- `phone_remote_events` table for logging all remote events
- Trigger `TRG_phone_remote_sessions_status_log` to auto-log status changes
- Stored procedures for session management and event logging

## Integration into Existing Workout Page

### Step 1: Import the Component

In your workout component (e.g., Dashboard.jsx or Workout.jsx):

```jsx
import PhoneRemoteConnect from './PhoneRemoteConnect';
```

### Step 2: Add the Component to Your Workout UI

Add the PhoneRemoteConnect component to your workout page where you want the QR code to appear:

```jsx
// Get your member ID (from localStorage, token, or state)
const memberId = memberIdFromToken(localStorage.getItem('token'));

// Define callback functions to handle phone actions
const handleSetComplete = (data) => {
  console.log('Set complete from phone:', data);
  // Your existing logic to mark a set as complete
  // e.g., increment completed sets counter, update UI
};

const handleAddRep = (data) => {
  console.log('Add rep from phone:', data);
  // Your existing logic to add a rep
  // e.g., increment rep counter for current exercise
};

const handleRemoveRep = (data) => {
  console.log('Remove rep from phone:', data);
  // Your existing logic to remove a rep
  // e.g., decrement rep counter for current exercise
};

const handleStartRest = (data) => {
  console.log('Start rest from phone:', data);
  // Your existing logic to start rest timer
  // e.g., start countdown timer
};

const handlePauseRest = (data) => {
  console.log('Pause rest from phone:', data);
  // Your existing logic to pause rest timer
  // e.g., pause countdown timer
};

const handleFatigueUpdate = (data) => {
  console.log('Fatigue update from phone:', data);
  // Your existing logic to handle fatigue level
  // e.g., update fatigue indicator, log to workout stats
};

const handleEndWorkout = (data) => {
  console.log('End workout from phone:', data);
  // Your existing logic to end the workout
  // e.g., save workout data, show summary, navigate away
};

// In your JSX, add the component:
<PhoneRemoteConnect
  memberId={memberId}
  onSetComplete={handleSetComplete}
  onAddRep={handleAddRep}
  onRemoveRep={handleRemoveRep}
  onStartRest={handleStartRest}
  onPauseRest={handlePauseRest}
  onFatigueUpdate={handleFatigueUpdate}
  onEndWorkout={handleEndWorkout}
  localIP="192.168.100.220" // Your local network IP (run `ipconfig` or `ifconfig` to find it)
/>
```

### Step 3: Example Integration in Dashboard.jsx

Here's a complete example of how to integrate it into the workout-log section of Dashboard.jsx:

```jsx
// At the top of the file:
import PhoneRemoteConnect from './PhoneRemoteConnect';

// Inside your Dashboard component, add state for workout tracking:
const [currentSet, setCurrentSet] = useState(0);
const [currentReps, setCurrentReps] = useState(0);
const [isResting, setIsResting] = useState(false);
const [fatigueLevel, setFatigueLevel] = useState('moderate');

// Add callback functions:
const handleSetComplete = () => {
  setCurrentSet(prev => prev + 1);
  setCurrentReps(0);
  console.log('Set completed. New set:', currentSet + 1);
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
  // Save workout data
  console.log('Workout ended. Sets:', currentSet);
  // Navigate away or show summary
  navigate('/dashboard');
};

// In your JSX, inside the workout-log section:
{activeNav === 'workout-log' && (
  <section className="member-card member-card-pad member-card-wide">
    <h2>Workout log</h2>
    
    {/* Add the Phone Remote component here */}
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
        localIP="192.168.100.220"
      />
    </div>

    {/* Your existing workout log UI */}
    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
      <div>
        <span className="member-detail-label">Current Set</span>
        <strong className="member-stat-value">{currentSet}</strong>
      </div>
      <div>
        <span className="member-detail-label">Current Reps</span>
        <strong className="member-stat-value">{currentReps}</strong>
      </div>
      <div>
        <span className="member-detail-label">Fatigue</span>
        <strong className="member-stat-value">{fatigueLevel}</strong>
      </div>
    </div>

    {/* Rest of your workout log form */}
    {/* ... */}
  </section>
)}
```

### Step 4: Find Your Local IP

To get your local network IP:
- Windows: Run `ipconfig` in command prompt, look for IPv4 Address under your active network adapter
- Mac/Linux: Run `ifconfig` or `ip a` in terminal, look for inet address

Example: `192.168.100.220` or `172.20.10.2`

### Step 5: Test the Feature

1. Start both backend and frontend servers
2. On desktop: Navigate to your workout page
3. Click "Connect Phone" button
4. A QR code will appear
5. On your phone: Open your phone's camera or QR scanner
6. Scan the QR code (make sure phone is on the same WiFi network)
7. Phone will open the remote control interface
8. Use the phone buttons to control the workout
9. Desktop will receive the actions and execute your callback functions

## Files Created

### Backend:
- `backend/socketServer.js` - Socket.IO server configuration and event handlers
- `backend/routes/phoneRemoteRoutes.js` - API routes for session management
- `backend/phoneRemoteSchema.sql` - Database schema with triggers and stored procedures
- `backend/server.js` - Updated to include Socket.IO and new routes

### Frontend:
- `frontend/src/socketRemote.js` - Socket.IO client utility
- `frontend/src/PhoneRemoteConnect.jsx` - Desktop component with QR code
- `frontend/src/PhoneRemote.jsx` - Mobile remote control component
- `frontend/src/App.jsx` - Updated with /connect/:sessionToken route

## Socket.IO Events

### Desktop Emits:
- `join-session` - Join a session room as desktop

### Phone Emits:
- `phone-connect` - Connect to a session as phone
- `set-complete` - Mark current set as complete
- `add-rep` - Add one rep
- `remove-rep` - Remove one rep
- `start-rest` - Start rest timer
- `pause-rest` - Pause rest timer
- `fatigue-update` - Update fatigue level (easy, moderate, hard, failure)
- `end-workout` - End the workout session

### Server Emits to Desktop:
- `phone-connected` - Phone has connected
- `phone-disconnected` - Phone has disconnected
- `set-complete` - Phone marked set complete
- `add-rep` - Phone added a rep
- `remove-rep` - Phone removed a rep
- `start-rest` - Phone started rest
- `pause-rest` - Phone paused rest
- `fatigue-update` - Phone updated fatigue
- `end-workout` - Phone ended workout

## Database Queries

The system uses SQL triggers and stored procedures to log all session events:

- Trigger: `TRG_phone_remote_sessions_status_log` - Auto-logs status changes
- SP: `SP_create_remote_session` - Creates new session with token
- SP: `SP_update_session_status` - Updates session status
- SP: `SP_log_remote_event` - Logs any remote event
- SP: `SP_get_session_by_token` - Retrieves session info
- SP: `SP_get_session_statistics` - Gets session event statistics

All events are automatically logged to `phone_remote_events` table with timestamps for analytics and debugging.
