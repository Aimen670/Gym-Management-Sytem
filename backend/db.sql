
CREATE TABLE members (
    member_id INT PRIMARY KEY IDENTITY(1,1),
    full_name VARCHAR(100) NOT NULL,
    age INT,
    gender VARCHAR(10),
    phone VARCHAR(20) UNIQUE,
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255) NOT NULL,
    fitness_goal TEXT,
    join_date DATE DEFAULT GETDATE(),
    status VARCHAR(20) DEFAULT 'active'
);


CREATE TABLE admins (
    admin_id INT PRIMARY KEY IDENTITY(1,1),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50)
);


CREATE TABLE trainers (
    trainer_id INT PRIMARY KEY IDENTITY(1,1),
    name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    experience_years INT
);


CREATE TABLE membership_plans (
    plan_id INT PRIMARY KEY IDENTITY(1,1),
    plan_name VARCHAR(50),
    duration_months INT,
    price DECIMAL(10,2),
    description TEXT
);


CREATE TABLE member_subscriptions (
    subscription_id INT PRIMARY KEY IDENTITY(1,1),
    member_id INT,
    plan_id INT,
    start_date DATE,
    end_date DATE,
    FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES membership_plans(plan_id) ON DELETE CASCADE
);


CREATE TABLE payments (
    payment_id INT PRIMARY KEY IDENTITY(1,1),
    subscription_id INT,
    amount DECIMAL(10,2),
    payment_method VARCHAR(50),
    payment_date DATE,
    FOREIGN KEY (subscription_id) REFERENCES member_subscriptions(subscription_id) ON DELETE CASCADE
);


CREATE TABLE trainer_sessions (
    session_id INT PRIMARY KEY IDENTITY(1,1),
    member_id INT,
    trainer_id INT,
    session_date DATE,
    session_time TIME,
    status VARCHAR(20),
    FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE,
    FOREIGN KEY (trainer_id) REFERENCES trainers(trainer_id) ON DELETE CASCADE
);

CREATE TABLE workout_plans (
    workout_plan_id INT PRIMARY KEY IDENTITY(1,1),
    member_id INT,
    trainer_id INT,
    created_date DATE,
    FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE,
    FOREIGN KEY (trainer_id) REFERENCES trainers(trainer_id) ON DELETE SET NULL
);


CREATE TABLE workout_exercises (
    exercise_id INT PRIMARY KEY IDENTITY(1,1),
    workout_plan_id INT,
    exercise_name VARCHAR(100),
    sets INT,
    reps INT,
    schedule_day VARCHAR(20),
    FOREIGN KEY (workout_plan_id) REFERENCES workout_plans(workout_plan_id) ON DELETE CASCADE
);

CREATE TABLE workout_logs (
    log_id INT PRIMARY KEY IDENTITY(1,1),
    member_id INT,
    workout_plan_id INT,
    exercise_id INT,
    weight_used DECIMAL(6,2),
    reps_completed INT,
    log_date DATE,

    FOREIGN KEY (member_id) REFERENCES members(member_id),
    FOREIGN KEY (workout_plan_id) REFERENCES workout_plans(workout_plan_id),
    FOREIGN KEY (exercise_id) REFERENCES workout_exercises(exercise_id)
);

CREATE TABLE diet_plans (
    diet_plan_id INT PRIMARY KEY IDENTITY(1,1),
    member_id INT,
    trainer_id INT,
    calorie_target INT,
    meal_schedule TEXT,
    FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE,
    FOREIGN KEY (trainer_id) REFERENCES trainers(trainer_id) ON DELETE SET NULL
);

CREATE TABLE body_measurements (
    measurement_id INT PRIMARY KEY IDENTITY(1,1),
    member_id INT,
    weight DECIMAL(5,2),
    bmi DECIMAL(5,2),
    body_fat DECIMAL(5,2),
    muscle_mass DECIMAL(5,2),
    record_date DATE,
    FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE
);

CREATE TABLE fitness_goals (
    goal_id INT PRIMARY KEY IDENTITY(1,1),
    member_id INT,
    goal_type VARCHAR(50),
    target_value VARCHAR(50),
    start_date DATE,
    target_date DATE,
    FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE
);

CREATE TABLE classes (
    class_id INT PRIMARY KEY IDENTITY(1,1),
    class_name VARCHAR(100),
    trainer_id INT,
    schedule_date DATE,
    schedule_time TIME,
    capacity INT,
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
    quantity INT,
    purchase_date DATE,
    status VARCHAR(50)
);

CREATE TABLE equipment_maintenance (
    maintenance_id INT PRIMARY KEY IDENTITY(1,1),
    equipment_id INT,
    maintenance_date DATE,
    description TEXT,
    FOREIGN KEY (equipment_id) REFERENCES equipment(equipment_id) ON DELETE CASCADE
);



INSERT INTO members VALUES
('ali khan',25,'male','03001234567','ali.khan@email.com','testpass123','muscle gain','2025-01-10','active'),
('ahmed raza',30,'male','03011234567','ahmed.raza@email.com','testpass123','weight loss','2025-02-15','active'),
('fatima noor',27,'female','03121234567','fatima.noor@email.com','testpass123','fitness','2025-03-01','active'),
('ayesha malik',22,'female','03221234567','ayesha.malik@email.com','testpass123','weight loss','2025-02-20','active');

INSERT INTO admins VALUES
('usman sheikh','usman@gym.com','$2b$admin1','manager'),
('hassan tariq','hassan@gym.com','$2b$admin2','supervisor');

INSERT INTO trainers VALUES
('bilal ahmed','strength training','03331234567','bilal@gym.com',5),
('sara khan','yoga instructor','03341234567','sara@gym.com',4),
('hamza ali','cardio specialist','03351234567','hamza@gym.com',6);

INSERT INTO membership_plans VALUES
('monthly plan',1,5000,'access to gym equipment'),
('quarterly plan',3,13000,'access to gym + group classes'),
('yearly plan',12,45000,'full access including trainer sessions');

SELECT * FROM members;
SELECT * FROM admins;
SELECT * FROM trainers;
SELECT * FROM membership_plans;