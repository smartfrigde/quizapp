document.addEventListener('DOMContentLoaded', function() {
    const loadQuizBtn = document.getElementById('loadQuizBtn');
    const createQuizBtn = document.getElementById('createQuizBtn');
    const checkBtn = document.getElementById('checkBtn');

    loadQuizBtn.addEventListener('click', function() {
        console.log('Load Quiz clicked');
        window.location.href = 'views://loadview/index.html';
    });

    createQuizBtn.addEventListener('click', function() {
        console.log('Create Quiz clicked');
        window.location.href = 'views://createview/index.html';
    });

    checkBtn.addEventListener('click', function() {
        console.log('Check Answers clicked');
        window.location.href = 'views://checkview/index.html';
    });
});