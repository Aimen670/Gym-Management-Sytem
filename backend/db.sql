CREATE TABLE members (
    member_id INT PRIMARY KEY IDENTITY(1,1),
    full_name VARCHAR(100) NOT NULL,
    age INT CHECK (age > 0 AND age <= 100),
    gender VARCHAR(10) CHECK (gender IN ('male','female','other')),
    phone VARCHAR(20) UNIQUE CHECK (LEN(phone) = 11 AND phone NOT LIKE '%[^0-9]%'),
    email VARCHAR(100) UNIQUE CHECK (email LIKE '%@%.%'),
    password VARCHAR(255) NOT NULL CHECK (LEN(password) >= 6),
    fitness_goal VARCHAR(MAX),
    join_date DATE DEFAULT GETDATE(),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive'))
);

CREATE TABLE admins (
    admin_id INT PRIMARY KEY IDENTITY(1,1),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE CHECK (email LIKE '%@%.%'),
    password VARCHAR(255) NOT NULL CHECK (LEN(password) >= 6),
    role VARCHAR(50) CHECK (role IN ('manager','supervisor','staff')),
    created_at DATETIME2 DEFAULT GETDATE()
);

CREATE TABLE trainers (
    trainer_id INT PRIMARY KEY IDENTITY(1,1),
    name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100),
    phone VARCHAR(20) CHECK (LEN(phone) = 11 AND phone NOT LIKE '%[^0-9]%'),
    email VARCHAR(100) CHECK (email LIKE '%@%.%'),
    experience_years INT CHECK (experience_years >= 0)
);

CREATE TABLE membership_plans (
    plan_id INT PRIMARY KEY IDENTITY(1,1),
    plan_name VARCHAR(50),
    duration_months INT CHECK (duration_months > 0),
    price DECIMAL(10,2) CHECK (price > 0),
    description TEXT
);

CREATE TABLE member_subscriptions (
    subscription_id INT PRIMARY KEY IDENTITY(1,1),
    member_id INT,
    plan_id INT,
    start_date DATE,
    end_date DATE,

    CONSTRAINT chk_subscription_dates CHECK (end_date > start_date),

    FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES membership_plans(plan_id) ON DELETE CASCADE
);

CREATE TABLE payments (
    payment_id INT PRIMARY KEY IDENTITY(1,1),
    subscription_id INT,
    amount DECIMAL(10,2) CHECK (amount > 0),
    payment_method VARCHAR(50) CHECK (payment_method IN ('cash','card','online')),
    payment_date DATE DEFAULT GETDATE(),
    FOREIGN KEY (subscription_id) REFERENCES member_subscriptions(subscription_id) ON DELETE CASCADE
);

CREATE TABLE trainer_sessions (
    session_id INT PRIMARY KEY IDENTITY(1,1),
    member_id INT,
    trainer_id INT,
    session_date DATE,
    session_time TIME,
    status VARCHAR(20) CHECK (status IN ('scheduled','completed','cancelled')),
    FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE,
    FOREIGN KEY (trainer_id) REFERENCES trainers(trainer_id) ON DELETE CASCADE
);

-- Optional: explicit trainer availability (used by some builds/endpoints).
-- The current app can also calculate availability from gym hours + existing sessions,
-- but defining this table prevents "Invalid object name 'trainer_availability'" errors.
IF OBJECT_ID('dbo.trainer_availability', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.trainer_availability (
        availability_id INT PRIMARY KEY IDENTITY(1,1),
        trainer_id INT NOT NULL,
        available_date DATE NOT NULL,
        start_time TIME(0) NOT NULL,
        end_time TIME(0) NOT NULL,
        is_active BIT NOT NULL CONSTRAINT DF_trainer_availability_is_active DEFAULT (1),
        FOREIGN KEY (trainer_id) REFERENCES trainers(trainer_id) ON DELETE CASCADE
    );
    CREATE INDEX IX_trainer_availability_trainer_date
        ON dbo.trainer_availability (trainer_id, available_date);
END


CREATE TABLE workout_plans (
    workout_plan_id INT PRIMARY KEY IDENTITY(1,1),
    member_id INT,
    trainer_id INT,
    created_date DATE DEFAULT GETDATE(),
    FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE,
    FOREIGN KEY (trainer_id) REFERENCES trainers(trainer_id) ON DELETE SET NULL
);

CREATE TABLE exercises (
    exercise_id INT PRIMARY KEY IDENTITY(1,1),
    exercise_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE workout_plan_exercises (
    plan_exercise_id INT PRIMARY KEY IDENTITY(1,1),
    workout_plan_id INT NOT NULL,
    exercise_id INT NOT NULL,
    sets INT NOT NULL CHECK (sets > 0),
    reps INT NOT NULL CHECK (reps > 0),
    schedule_day VARCHAR(20) CHECK (schedule_day IN ('monday','tuesday','wednesday','thursday','friday','saturday','sunday')),
    UNIQUE (workout_plan_id, exercise_id, schedule_day),
    FOREIGN KEY (workout_plan_id) REFERENCES workout_plans(workout_plan_id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(exercise_id) ON DELETE CASCADE
);

CREATE TABLE workout_logs (
    log_id INT PRIMARY KEY IDENTITY(1,1),
    member_id INT,
    workout_plan_id INT,
    exercise_id INT,
    weight_used DECIMAL(6,2) CHECK (weight_used >= 0),
    reps_completed INT CHECK (reps_completed >= 0),
    log_date DATE DEFAULT GETDATE(),
    FOREIGN KEY (member_id) REFERENCES members(member_id),
    FOREIGN KEY (workout_plan_id) REFERENCES workout_plans(workout_plan_id),
    FOREIGN KEY (exercise_id) REFERENCES exercises(exercise_id)
);

CREATE TABLE diet_plans (
    diet_plan_id INT PRIMARY KEY IDENTITY(1,1),
    member_id INT,
    trainer_id INT,
    calorie_target INT CHECK (calorie_target > 0),
    meal_schedule TEXT,
    FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE,
    FOREIGN KEY (trainer_id) REFERENCES trainers(trainer_id) ON DELETE SET NULL
);

CREATE TABLE body_measurements (
    measurement_id INT PRIMARY KEY IDENTITY(1,1),
    member_id INT,
    weight DECIMAL(5,2) CHECK (weight > 0),
    bmi DECIMAL(5,2) CHECK (bmi > 0),
    body_fat DECIMAL(5,2) CHECK (body_fat >= 0),
    muscle_mass DECIMAL(5,2) CHECK (muscle_mass >= 0),
    record_date DATE DEFAULT GETDATE(),
    FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE
);

CREATE TABLE fitness_goals (
    goal_id INT PRIMARY KEY IDENTITY(1,1),
    member_id INT,
    goal_type VARCHAR(50),
    target_value VARCHAR(50),
    start_date DATE,
    target_date DATE,

    CONSTRAINT chk_goal_dates CHECK (target_date > start_date),

    FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE
);

-- Classes represent group fitness sessions created by admins.
-- Admins can assign a trainer, define a schedule, and set a maximum participant capacity.
CREATE TABLE classes (
    class_id INT PRIMARY KEY IDENTITY(1,1),
    class_name VARCHAR(100),
    trainer_id INT,
    schedule_date DATE,
    schedule_time TIME,
    capacity INT CHECK (capacity > 0),
    FOREIGN KEY (trainer_id) REFERENCES trainers(trainer_id) ON DELETE SET NULL
);

-- Junction table linking classes to membership plans
-- This allows each class to be associated with multiple plans
-- Admins can specify which membership plans include access to a specific class
CREATE TABLE class_plans (
    class_plan_id INT PRIMARY KEY IDENTITY(1,1),
    class_id INT NOT NULL,
    plan_id INT NOT NULL,
    UNIQUE (class_id, plan_id),
    FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES membership_plans(plan_id) ON DELETE CASCADE
);

CREATE TABLE class_enrollments (
    enrollment_id INT PRIMARY KEY IDENTITY(1,1),
    class_id INT,
    member_id INT,
    FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE
);

CREATE TABLE equipment (
    equipment_id INT PRIMARY KEY IDENTITY(1,1),
    equipment_name VARCHAR(100),
    quantity INT CHECK (quantity >= 0),
    purchase_date DATE,
    status VARCHAR(50) CHECK (status IN ('available','in_use','maintenance'))
);

CREATE TABLE equipment_maintenance (
    maintenance_id INT PRIMARY KEY IDENTITY(1,1),
    equipment_id INT,
    maintenance_date DATE,
    description TEXT,
    FOREIGN KEY (equipment_id) REFERENCES equipment(equipment_id) ON DELETE CASCADE
);



-- Members Data
INSERT INTO members (full_name, age, gender, phone, email, password, fitness_goal, join_date, status) VALUES
('Ali Khan', 25, 'male', '03001234567', 'ali.khan@email.com', 'testpass123', 'Muscle Gain', '2025-01-10', 'active'),
('Ahmed Raza', 30, 'male', '03011234567', 'ahmed.raza@email.com', 'testpass123', 'Weight Loss', '2025-02-15', 'active'),
('Fatima Noor', 27, 'female', '03121234567', 'fatima.noor@email.com', 'testpass123', 'General Fitness', '2025-03-01', 'active'),
('Ayesha Malik', 22, 'female', '03221234567', 'ayesha.malik@email.com', 'testpass123', 'Weight Loss', '2025-02-20', 'active'),
('Hassan Ali', 28, 'male', '03331234567', 'hassan.ali@email.com', 'testpass123', 'Strength Training', '2025-01-05', 'active');

-- Admins Data
INSERT INTO admins (name, email, password, role, created_at) VALUES
('Usman Sheikh', 'usman@gym.com', 'admin123456', 'manager', GETDATE()),
('Hassan Tariq', 'hassan@gym.com', 'admin123456', 'supervisor', GETDATE()),
('Sara Admin', 'sara.admin@gym.com', 'admin123456', 'staff', GETDATE());

-- Trainers Data
INSERT INTO trainers (name, specialization, phone, email, experience_years) VALUES
('Bilal Ahmed', 'Strength Training', '03331234567', 'bilal@gym.com', 5),
('Sara Khan', 'Yoga Instructor', '03341234567', 'sara@gym.com', 4),
('Hamza Ali', 'Cardio Specialist', '03351234567', 'hamza@gym.com', 6),
('Zara Khan', 'Pilates', '03361234567', 'zara@gym.com', 3);

-- Membership Plans Data
INSERT INTO membership_plans (plan_name, duration_months, price, description) VALUES
('Monthly Plan', 1, 5000.00, 'Access to gym equipment and facilities'),
('Quarterly Plan', 3, 13000.00, 'Access to gym + group classes'),
('Yearly Plan', 12, 45000.00, 'Full access including trainer sessions and diet consultation');

-- Equipment Data
INSERT INTO equipment (equipment_name, quantity, purchase_date, status) VALUES
('Treadmill', 5, '2024-01-15', 'available'),
('Dumbbells Set', 20, '2024-02-10', 'in_use'),
('Bench Press', 3, '2024-03-01', 'available'),
('Rowing Machine', 4, '2024-01-20', 'available'),
('Barbell', 10, '2024-02-05', 'available'),
('Weight Plates', 30, '2024-02-15', 'in_use'),
('Elliptical Machine', 3, '2024-03-10', 'maintenance');

-- Workout Plans Data
INSERT INTO workout_plans (member_id, trainer_id, created_date) VALUES
(1, 1, '2025-03-05'),
(2, 2, '2025-03-12'),
(3, 3, '2025-03-18');

INSERT INTO exercises (exercise_name) VALUES
('Bench Press'),
('Incline Dumbbell Press'),
('Lat Pulldown'),
('Seated Row'),
('Squats'),
('Leg Press'),
('Hamstring Curl'),
('Deadlift'),
('Overhead Press');

INSERT INTO workout_plan_exercises (workout_plan_id, exercise_id, sets, reps, schedule_day) VALUES
(1, (SELECT exercise_id FROM exercises WHERE exercise_name = 'Bench Press'), 4, 8, 'monday'),
(1, (SELECT exercise_id FROM exercises WHERE exercise_name = 'Incline Dumbbell Press'), 3, 10, 'monday'),
(1, (SELECT exercise_id FROM exercises WHERE exercise_name = 'Lat Pulldown'), 4, 10, 'wednesday'),
(1, (SELECT exercise_id FROM exercises WHERE exercise_name = 'Seated Row'), 3, 12, 'wednesday'),
(2, (SELECT exercise_id FROM exercises WHERE exercise_name = 'Squats'), 4, 8, 'tuesday'),
(2, (SELECT exercise_id FROM exercises WHERE exercise_name = 'Leg Press'), 3, 12, 'tuesday'),
(2, (SELECT exercise_id FROM exercises WHERE exercise_name = 'Hamstring Curl'), 3, 12, 'thursday'),
(3, (SELECT exercise_id FROM exercises WHERE exercise_name = 'Deadlift'), 4, 6, 'friday'),
(3, (SELECT exercise_id FROM exercises WHERE exercise_name = 'Overhead Press'), 3, 8, 'friday');

-- Diet Plans Data
INSERT INTO diet_plans (member_id, trainer_id, calorie_target, meal_schedule) VALUES
(1, 1, 2800, 'Breakfast: oats + eggs; Lunch: chicken bowl; Dinner: salmon + rice'),
(2, 2, 2200, 'Breakfast: yogurt + fruit; Lunch: salad + chicken; Dinner: stir-fry + veggies'),
(3, 3, 2500, 'Breakfast: smoothie + toast; Lunch: tuna wrap; Dinner: turkey + sweet potato');

-- Classes Data (Group Fitness Classes)
INSERT INTO classes (class_name, trainer_id, schedule_date, schedule_time, capacity) VALUES
('Morning Yoga', 2, '2025-06-01', '07:00:00', 20),
('HIIT Training', 3, '2025-06-01', '09:00:00', 15),
('Strength Training', 1, '2025-06-01', '18:00:00', 12),
('Evening Pilates', 4, '2025-06-02', '17:00:00', 18),
('Cardio Blast', 3, '2025-06-02', '08:00:00', 25),
('Power Yoga', 2, '2025-06-03', '07:30:00', 20),
('Boot Camp', 1, '2025-06-03', '19:00:00', 15);

-- Class Plans Data (Link classes to membership plans)
INSERT INTO class_plans (class_id, plan_id) VALUES
-- Quarterly and Yearly plans include group classes
(1, 2), (1, 3), -- Morning Yoga
(2, 2), (2, 3), -- HIIT Training
(3, 2), (3, 3), -- Strength Training
(4, 2), (4, 3), -- Evening Pilates
(5, 2), (5, 3), -- Cardio Blast
(6, 2), (6, 3), -- Power Yoga
(7, 2), (7, 3); -- Boot Camp

-- Sample Class Enrollments
INSERT INTO class_enrollments (class_id, member_id) VALUES
(1, 2), (1, 4), -- Ali Khan and Ayesha Malik in Morning Yoga
(2, 1), (2, 5), -- Ahmed Raza and Hassan Ali in HIIT Training
(3, 3), -- Fatima Noor in Strength Training
(4, 2), (4, 3), -- Ahmed Raza and Fatima Noor in Evening Pilates
(5, 1), (5, 4), (5, 5); -- Ali Khan, Ayesha Malik, and Hassan Ali in Cardio Blast

-- ============================================================
-- GENERAL TRANSACTIONAL STORED PROCEDURE FOR CLASS UPDATE
-- ============================================================
-- This procedure updates class details and synchronizes plans
-- in a single atomic transaction.
-- ============================================================
GO
CREATE PROCEDURE sp_UpdateClassWithPlans
    @class_id INT,
    @class_name VARCHAR(100),
    @trainer_id INT,
    @schedule_date DATE,
    @schedule_time TIME,
    @capacity INT,
    @plan_ids_json NVARCHAR(MAX) -- JSON array of plan IDs, e.g., '[1, 2, 3]'
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- 1. Update Class Details
        UPDATE classes
        SET class_name = @class_name,
            trainer_id = @trainer_id,
            schedule_date = @schedule_date,
            schedule_time = @schedule_time,
            capacity = @capacity
        WHERE class_id = @class_id;

        -- Check if class exists
        IF @@ROWCOUNT = 0
        BEGIN
            THROW 50001, 'Class not found', 1;
        END

        -- 2. Synchronize Plans (Delete existing and insert new)
        -- Only if plan_ids_json is provided
        IF @plan_ids_json IS NOT NULL
        BEGIN
            DELETE FROM class_plans WHERE class_id = @class_id;

            INSERT INTO class_plans (class_id, plan_id)
            SELECT @class_id, value
            FROM OPENJSON(@plan_ids_json);
        END

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO



