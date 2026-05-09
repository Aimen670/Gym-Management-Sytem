-- Phone Remote Session Tracking Schema

-- Cleanup: Drop existing objects if they exist
IF OBJECT_ID('dbo.VW_session_statistics', 'V') IS NOT NULL
    DROP VIEW dbo.VW_session_statistics;
GO

IF OBJECT_ID('dbo.VW_active_sessions', 'V') IS NOT NULL
    DROP VIEW dbo.VW_active_sessions;
GO

IF OBJECT_ID('SP_get_session_statistics', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_get_session_statistics;
GO

IF OBJECT_ID('SP_get_session_by_token', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_get_session_by_token;
GO

IF OBJECT_ID('SP_log_remote_event', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_log_remote_event;
GO

IF OBJECT_ID('SP_update_session_status', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_update_session_status;
GO

IF OBJECT_ID('SP_create_remote_session', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_create_remote_session;
GO

IF OBJECT_ID('TRG_phone_remote_sessions_status_log', 'TR') IS NOT NULL
    DROP TRIGGER dbo.TRG_phone_remote_sessions_status_log;
GO

IF OBJECT_ID('dbo.phone_remote_events', 'U') IS NOT NULL
    DROP TABLE dbo.phone_remote_events;
GO

IF OBJECT_ID('dbo.phone_remote_sessions', 'U') IS NOT NULL
    DROP TABLE dbo.phone_remote_sessions;
GO

-- Phone Remote Session Tracking Schema

-- Create phone remote sessions table
IF OBJECT_ID('dbo.phone_remote_sessions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.phone_remote_sessions (
        session_id INT PRIMARY KEY IDENTITY(1,1),
        session_token UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        member_id INT NOT NULL,
        workout_plan_id INT,
        session_status VARCHAR(20) NOT NULL DEFAULT 'waiting' CHECK (session_status IN ('waiting', 'connected', 'disconnected', 'ended')),
        local_ip VARCHAR(50),
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        connected_at DATETIME2,
        disconnected_at DATETIME2,
        -- Rest timer tracking
        rest_start_time DATETIME2,
        rest_end_time DATETIME2,
        total_rest_seconds INT DEFAULT 0,
        FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE,
        FOREIGN KEY (workout_plan_id) REFERENCES workout_plans(workout_plan_id) ON DELETE NO ACTION
    );
    CREATE INDEX IX_phone_remote_sessions_token ON dbo.phone_remote_sessions(session_token);
    CREATE INDEX IX_phone_remote_sessions_member ON dbo.phone_remote_sessions(member_id);
END

-- Create phone remote session events log table
IF OBJECT_ID('dbo.phone_remote_events', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.phone_remote_events (
        event_id INT PRIMARY KEY IDENTITY(1,1),
        session_id INT NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        event_data NVARCHAR(MAX),
        event_timestamp DATETIME2 NOT NULL DEFAULT GETDATE(),
        FOREIGN KEY (session_id) REFERENCES phone_remote_sessions(session_id) ON DELETE CASCADE
    );
    CREATE INDEX IX_phone_remote_events_session ON dbo.phone_remote_events(session_id);
    CREATE INDEX IX_phone_remote_events_timestamp ON dbo.phone_remote_events(event_timestamp);
END

-- Create trigger to log session status changes
IF OBJECT_ID('TRG_phone_remote_sessions_status_log', 'TR') IS NULL
BEGIN
    EXEC('
    CREATE TRIGGER TRG_phone_remote_sessions_status_log
    ON dbo.phone_remote_sessions
    AFTER UPDATE
    AS
    BEGIN
        SET NOCOUNT ON;
        
        IF UPDATE(session_status)
        BEGIN
            INSERT INTO dbo.phone_remote_events (session_id, event_type, event_data)
            SELECT 
                i.session_id, 
                ''status_change'', 
                ''From: '' + ISNULL(d.session_status, ''NULL'') + '' To: '' + i.session_status
            FROM inserted i
            INNER JOIN deleted d ON i.session_id = d.session_id
            WHERE i.session_status <> d.session_status;
        END
    END
    ');
END

-- Create stored procedure to create a new remote session
IF OBJECT_ID('SP_create_remote_session', 'P') IS NULL
BEGIN
    EXEC('
    CREATE PROCEDURE SP_create_remote_session
        @member_id INT,
        @workout_plan_id INT = NULL,
        @local_ip VARCHAR(50) = NULL,
        @session_token UNIQUEIDENTIFIER OUTPUT
    AS
    BEGIN
        SET NOCOUNT ON;
        
        DECLARE @new_token UNIQUEIDENTIFIER = NEWID();
        
        INSERT INTO dbo.phone_remote_sessions (session_token, member_id, workout_plan_id, local_ip, session_status)
        VALUES (@new_token, @member_id, @workout_plan_id, @local_ip, ''waiting'');
        
        SET @session_token = @new_token;
        
        -- Log session creation event
        INSERT INTO dbo.phone_remote_events (session_id, event_type, event_data)
        VALUES (SCOPE_IDENTITY(), ''session_created'', ''Member ID: '' + CAST(@member_id AS VARCHAR(10)));
        
        SELECT @new_token AS session_token;
    END
    ');
END

-- Create stored procedure to update session status
IF OBJECT_ID('SP_update_session_status', 'P') IS NULL
BEGIN
    EXEC('
    CREATE PROCEDURE SP_update_session_status
        @session_token UNIQUEIDENTIFIER,
        @status VARCHAR(20)
    AS
    BEGIN
        SET NOCOUNT ON;
        
        UPDATE dbo.phone_remote_sessions
        SET session_status = @status,
            connected_at = CASE WHEN @status = ''connected'' AND connected_at IS NULL THEN GETDATE() ELSE connected_at END,
            disconnected_at = CASE WHEN @status IN (''disconnected'', ''ended'') THEN GETDATE() ELSE disconnected_at END
        WHERE session_token = @session_token;
        
        IF @@ROWCOUNT = 0
        BEGIN
            RAISERROR(''Session not found'', 16, 1);
        END
    END
    ');
END

-- Create stored procedure to log remote events
IF OBJECT_ID('SP_log_remote_event', 'P') IS NULL
BEGIN
    EXEC('
    CREATE PROCEDURE SP_log_remote_event
        @session_token UNIQUEIDENTIFIER,
        @event_type VARCHAR(50),
        @event_data NVARCHAR(MAX) = NULL
    AS
    BEGIN
        SET NOCOUNT ON;
        
        DECLARE @session_id INT;
        
        SELECT @session_id = session_id
        FROM dbo.phone_remote_sessions
        WHERE session_token = @session_token;
        
        IF @session_id IS NULL
        BEGIN
            RAISERROR(''Session not found'', 16, 1);
            RETURN;
        END
        
        INSERT INTO dbo.phone_remote_events (session_id, event_type, event_data)
        VALUES (@session_id, @event_type, @event_data);
    END
    ');
END

-- Create stored procedure to get session by token
IF OBJECT_ID('SP_get_session_by_token', 'P') IS NULL
BEGIN
    EXEC('
    CREATE PROCEDURE SP_get_session_by_token
        @session_token UNIQUEIDENTIFIER
    AS
    BEGIN
        SET NOCOUNT ON;
        
        SELECT 
            s.session_id,
            s.session_token,
            s.member_id,
            s.workout_plan_id,
            s.session_status,
            s.local_ip,
            s.created_at,
            s.connected_at,
            s.disconnected_at,
            m.full_name AS member_name
        FROM dbo.phone_remote_sessions s
        LEFT JOIN dbo.members m ON s.member_id = m.member_id
        WHERE s.session_token = @session_token
        AND s.session_status IN (''waiting'', ''connected'');
    END
    ');
END

-- Create stored procedure to get session statistics
IF OBJECT_ID('SP_get_session_statistics', 'P') IS NULL
BEGIN
    EXEC('
    CREATE PROCEDURE SP_get_session_statistics
        @session_token UNIQUEIDENTIFIER
    AS
    BEGIN
        SET NOCOUNT ON;
        
        DECLARE @session_id INT;
        
        SELECT @session_id = session_id
        FROM dbo.phone_remote_sessions
        WHERE session_token = @session_token;
        
        SELECT 
            e.event_type,
            COUNT(*) AS event_count,
            MIN(event_timestamp) AS first_occurrence,
            MAX(event_timestamp) AS last_occurrence
        FROM dbo.phone_remote_events e
        WHERE e.session_id = @session_id
        GROUP BY e.event_type
        ORDER BY event_count DESC;
    END
    ');
END

-- Create view for active sessions
IF OBJECT_ID('dbo.VW_active_sessions', 'V') IS NULL
BEGIN
    EXEC('
    CREATE VIEW dbo.VW_active_sessions AS
    SELECT 
        s.session_id,
        s.session_token,
        s.member_id,
        s.workout_plan_id,
        s.session_status,
        s.local_ip,
        s.created_at,
        s.connected_at,
        s.rest_start_time,
        s.rest_end_time,
        s.total_rest_seconds,
        m.full_name AS member_name,
        DATEDIFF(SECOND, s.rest_start_time, ISNULL(s.rest_end_time, GETDATE())) AS current_rest_seconds
    FROM dbo.phone_remote_sessions s
    LEFT JOIN dbo.members m ON s.member_id = m.member_id
    WHERE s.session_status IN (''waiting'', ''connected'')
    ');
END

-- Create view for session statistics
IF OBJECT_ID('dbo.VW_session_statistics', 'V') IS NULL
BEGIN
    EXEC('
    CREATE VIEW dbo.VW_session_statistics AS
    SELECT 
        s.session_id,
        s.session_token,
        s.member_id,
        s.session_status,
        s.created_at,
        s.connected_at,
        s.disconnected_at,
        s.total_rest_seconds,
        DATEDIFF(SECOND, s.connected_at, ISNULL(s.disconnected_at, GETDATE())) AS session_duration_seconds,
        (SELECT COUNT(*) FROM dbo.phone_remote_events e WHERE e.session_id = s.session_id) AS total_events,
        m.full_name AS member_name
    FROM dbo.phone_remote_sessions s
    LEFT JOIN dbo.members m ON s.member_id = m.member_id
    ');
END

-- Create stored procedure to start rest timer
IF OBJECT_ID('SP_start_rest_timer', 'P') IS NULL
BEGIN
    EXEC('
    CREATE PROCEDURE SP_start_rest_timer
        @session_token UNIQUEIDENTIFIER
    AS
    BEGIN
        SET NOCOUNT ON;
        
        UPDATE dbo.phone_remote_sessions
        SET rest_start_time = GETDATE(),
            rest_end_time = NULL
        WHERE session_token = @session_token;
        
        IF @@ROWCOUNT = 0
        BEGIN
            RAISERROR(''Session not found'', 16, 1);
        END
    END
    ');
END

-- Create stored procedure to stop rest timer
IF OBJECT_ID('SP_stop_rest_timer', 'P') IS NULL
BEGIN
    EXEC('
    CREATE PROCEDURE SP_stop_rest_timer
        @session_token UNIQUEIDENTIFIER
    AS
    BEGIN
        SET NOCOUNT ON;
        
        DECLARE @rest_start_time DATETIME2;
        DECLARE @rest_seconds INT;
        
        SELECT @rest_start_time = rest_start_time
        FROM dbo.phone_remote_sessions
        WHERE session_token = @session_token;
        
        IF @rest_start_time IS NULL
        BEGIN
            RAISERROR(''Rest timer not started'', 16, 1);
            RETURN;
        END
        
        SET @rest_seconds = DATEDIFF(SECOND, @rest_start_time, GETDATE());
        
        UPDATE dbo.phone_remote_sessions
        SET rest_end_time = GETDATE(),
            total_rest_seconds = total_rest_seconds + @rest_seconds,
            rest_start_time = NULL
        WHERE session_token = @session_token;
        
        IF @@ROWCOUNT = 0
        BEGIN
            RAISERROR(''Session not found'', 16, 1);
        END
    END
    ');
END
