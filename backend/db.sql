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

CREATE TABLE workout_plans (
    workout_plan_id INT PRIMARY KEY IDENTITY(1,1),
    member_id INT,
    trainer_id INT,
    created_date DATE DEFAULT GETDATE(),
    FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE,
    FOREIGN KEY (trainer_id) REFERENCES trainers(trainer_id) ON DELETE SET NULL
);

CREATE TABLE workout_exercises (
    exercise_id INT PRIMARY KEY IDENTITY(1,1),
    workout_plan_id INT,
    exercise_name VARCHAR(100),
    sets INT CHECK (sets > 0),
    reps INT CHECK (reps > 0),
    schedule_day VARCHAR(20) CHECK (schedule_day IN ('monday','tuesday','wednesday','thursday','friday','saturday','sunday')),
    FOREIGN KEY (workout_plan_id) REFERENCES workout_plans(workout_plan_id) ON DELETE CASCADE
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
    FOREIGN KEY (exercise_id) REFERENCES workout_exercises(exercise_id)
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

CREATE TABLE classes (
    class_id INT PRIMARY KEY IDENTITY(1,1),
    class_name VARCHAR(100),
    trainer_id INT,
    schedule_date DATE,
    schedule_time TIME,
    capacity INT CHECK (capacity > 0),
    FOREIGN KEY (trainer_id) REFERENCES trainers(trainer_id) ON DELETE SET NULL
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


