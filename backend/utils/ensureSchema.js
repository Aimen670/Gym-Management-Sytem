const { getPool } = require('../db');

async function ensureMinimumSchema() {
  const pool = getPool();

  // Create the minimum missing objects that the app expects in runtime.
  // This is intentionally narrow (not a full migration system).
  await pool.request().query(`
    IF OBJECT_ID('dbo.class_plans', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.class_plans (
        class_plan_id INT IDENTITY(1,1) PRIMARY KEY,
        class_id INT NOT NULL,
        plan_id INT NOT NULL,
        CONSTRAINT UQ_class_plans UNIQUE (class_id, plan_id),
        CONSTRAINT FK_class_plans_classes FOREIGN KEY (class_id)
          REFERENCES dbo.classes(class_id) ON DELETE CASCADE,
        CONSTRAINT FK_class_plans_membership_plans FOREIGN KEY (plan_id)
          REFERENCES dbo.membership_plans(plan_id) ON DELETE CASCADE
      );
    END

    IF OBJECT_ID('dbo.trainer_availability', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.trainer_availability (
        availability_id INT IDENTITY(1,1) PRIMARY KEY,
        trainer_id INT NOT NULL,
        available_date DATE NOT NULL,
        start_time TIME(0) NOT NULL,
        end_time TIME(0) NOT NULL,
        is_active BIT NOT NULL CONSTRAINT DF_trainer_availability_is_active DEFAULT (1),
        CONSTRAINT FK_trainer_availability_trainers FOREIGN KEY (trainer_id)
          REFERENCES dbo.trainers(trainer_id) ON DELETE CASCADE
      );

      CREATE INDEX IX_trainer_availability_trainer_date
        ON dbo.trainer_availability (trainer_id, available_date);
    END
  `);
}

module.exports = { ensureMinimumSchema };

