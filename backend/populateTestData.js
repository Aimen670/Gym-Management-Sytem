const { connectToDatabase } = require('./db');

async function populateClassTestData() {
    try {
        await connectToDatabase();
        console.log('Connected to database');

        // Sample class data
        const sampleClasses = [
            {
                class_name: 'Morning Yoga Flow',
                trainer_id: 2,
                schedule_date: '2025-06-15',
                schedule_time: '07:00',
                capacity: 20,
                plan_ids: [2, 3] // Quarterly and Yearly plans
            },
            {
                class_name: 'HIIT Bootcamp',
                trainer_id: 3,
                schedule_date: '2025-06-15',
                schedule_time: '09:00',
                capacity: 15,
                plan_ids: [2, 3]
            },
            {
                class_name: 'Strength & Conditioning',
                trainer_id: 1,
                schedule_date: '2025-06-15',
                schedule_time: '18:00',
                capacity: 12,
                plan_ids: [2, 3]
            },
            {
                class_name: 'Evening Pilates',
                trainer_id: 4,
                schedule_date: '2025-06-16',
                schedule_time: '17:00',
                capacity: 18,
                plan_ids: [2, 3]
            },
            {
                class_name: 'Cardio Blast',
                trainer_id: 3,
                schedule_date: '2025-06-16',
                schedule_time: '08:00',
                capacity: 25,
                plan_ids: [2, 3]
            },
            {
                class_name: 'Power Yoga',
                trainer_id: 2,
                schedule_date: '2025-06-17',
                schedule_time: '07:30',
                capacity: 20,
                plan_ids: [2, 3]
            },
            {
                class_name: 'Functional Training',
                trainer_id: 1,
                schedule_date: '2025-06-17',
                schedule_time: '19:00',
                capacity: 15,
                plan_ids: [2, 3]
            },
            {
                class_name: 'Weekend Yoga Workshop',
                trainer_id: 2,
                schedule_date: '2025-06-18',
                schedule_time: '10:00',
                capacity: 25,
                plan_ids: [2, 3]
            }
        ];

        // Import the class model
        const { createClass } = require('./models/classModel');

        console.log('Creating sample classes...');
        
        for (const classData of sampleClasses) {
            try {
                const createdClass = await createClass(classData);
                console.log(`✓ Created class: ${createdClass.class_name} (ID: ${createdClass.class_id})`);
            } catch (error) {
                console.log(`✗ Failed to create ${classData.class_name}: ${error.message}`);
            }
        }

        console.log('\nClass test data population completed!');

    } catch (error) {
        console.error('Error populating test data:', error);
    } finally {
        process.exit(0);
    }
}

populateClassTestData();
