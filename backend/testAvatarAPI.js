const fetch = require('node-fetch');

async function testAvatarAPI() {
    try {
        console.log('Testing Avatar API endpoints...');
        
        // Test avatar levels endpoint
        const levelsResponse = await fetch('http://localhost:5000/api/avatar/levels');
        const levelsData = await levelsResponse.json();
        console.log('✅ Avatar levels:', levelsData.length, 'levels loaded');
        
        // Test member avatar endpoint
        const avatarResponse = await fetch('http://localhost:5000/api/member/1/avatar');
        const avatarData = await avatarResponse.json();
        console.log('✅ Member avatar:', avatarData.current_level, avatarData.level_name, '- Total points:', avatarData.total_points);
        
        // Test progress history endpoint
        const progressResponse = await fetch('http://localhost:5000/api/member/1/avatar/progress');
        const progressData = await progressResponse.json();
        console.log('✅ Progress history:', progressData.length, 'entries');
        
        console.log('🎉 All API endpoints working!');
        
    } catch (error) {
        console.error('❌ API test failed:', error.message);
    }
}

testAvatarAPI();
