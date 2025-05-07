let prevExercises = [];
let yearPlan = {};
let meals = [];
let resources = {};
let exerciseTodos = JSON.parse(localStorage.getItem('exerciseTodos')) || {};
let customTodos = JSON.parse(localStorage.getItem('customTodos')) || { tasks: [], columns: [] };
let imageTexts = JSON.parse(localStorage.getItem('imageTexts')) || [];
let notepads = JSON.parse(localStorage.getItem('notepads')) || [];
let journals = JSON.parse(localStorage.getItem('journals')) || [];
let summaries = JSON.parse(localStorage.getItem('summaries')) || [];
let spotifyPlayer = null;
let youtubePlayers = [];
let localAudioPlayers = [];
let timers = {};
let codeEditor = null;

const path = window.location.pathname;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    initializePage();
    initializeSaveAll();
    initializeDeleteAll();
});

// Theme Toggle
function initializeTheme() {
    const themeToggle = document.getElementById('themeToggle');
    if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.classList.add('dark');
        document.getElementById('sunIcon').classList.remove('hidden');
        document.getElementById('moonIcon').classList.add('hidden');
    }
    themeToggle.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        if (document.documentElement.classList.contains('dark')) {
            localStorage.setItem('theme', 'dark');
            document.getElementById('sunIcon').classList.remove('hidden');
            document.getElementById('moonIcon').classList.add('hidden');
        } else {
            localStorage.setItem('theme', 'light');
            document.getElementById('sunIcon').classList.add('hidden');
            document.getElementById('moonIcon').classList.remove('hidden');
        }
    });
}

// Page-Specific Initialization
function initializePage() {
    if (path === '/') initializeOverall();
    else if (path === '/exercise_todo') initializeExerciseTodo();
    else if (path === '/custom_todo') initializeCustomTodo();
    else if (path === '/exercise_videos') initializeExerciseVideos();
    else if (path === '/important_videos') initializeImportantVideos();
    else if (path === '/songs') initializeSongs();
    else if (path === '/blog') initializeBlog();
    else if (path === '/code_editor') initializeCodeEditor();
}

// Overall Page
function initializeOverall() {
    fetch('/api/prev_exercises').then(res => res.json()).then(data => {
        prevExercises = data;
        displayPrevExercises();
    });
    fetch('/api/year_plan').then(res => res.json()).then(data => {
        yearPlan = data;
        displayYearPlan();
    });
    fetch('/api/meals').then(res => res.json()).then(data => {
        meals = data;
        displayMeals();
    });
    document.getElementById('levelSelect').addEventListener('change', displayYearPlan);
}

function displayPrevExercises() {
    const container = document.getElementById('prevExercises');
    container.innerHTML = '';
    prevExercises.forEach(ex => {
        const card = document.createElement('div');
        card.className = 'bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow hover:shadow-lg transition cursor-pointer';
        card.innerHTML = `
            <h3 class="text-lg font-medium">${ex.name}</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">${ex.description}</p>
            <a href="${ex.video}" target="_blank" class="text-blue-500 hover:underline">Watch Video</a>
        `;
        card.addEventListener('click', () => showModal(ex));
        container.appendChild(card);
    });
}

function displayYearPlan() {
    const level = document.getElementById('levelSelect').value;
    const container = document.getElementById('yearPlan');
    container.innerHTML = '';
    if (yearPlan[level]) {
        yearPlan[level].forEach(month => {
            const section = document.createElement('div');
            section.className = 'mb-4';
            section.innerHTML = `<h3 class="text-lg font-medium">Month ${month.month}</h3>`;
            const ul = document.createElement('ul');
            ul.className = 'list-disc pl-5';
            month.exercises.forEach(ex => {
                const li = document.createElement('li');
                li.className = 'cursor-pointer hover:text-blue-500';
                li.innerHTML = `${ex.name}: ${ex.description} (<a href="${ex.video}" target="_blank" class="text-blue-500 hover:underline">Video</a>)`;
                li.addEventListener('click', () => showModal(ex));
                ul.appendChild(li);
            });
            section.appendChild(ul);
            container.appendChild(section);
        });
    }
}

function displayMeals() {
    const container = document.getElementById('meals');
    container.innerHTML = '';
    meals.forEach(meal => {
        const card = document.createElement('div');
        card.className = 'bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow hover:shadow-lg transition cursor-pointer';
        card.innerHTML = `
            <h3 class="text-lg font-medium">${meal.name}</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">${meal.description}</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">Nutrients: ${meal.nutrients}</p>
        `;
        card.addEventListener('click', () => showModal(meal));
        container.appendChild(card);
    });
}

function showModal(item) {
    const modal = document.getElementById('modal');
    document.getElementById('modalTitle').textContent = item.name;
    document.getElementById('modalDescription').textContent = item.description;
    document.getElementById('modalNutrients').textContent = item.nutrients ? `Nutrients: ${item.nutrients}` : '';
    const videoLink = document.getElementById('modalVideo');
    if (item.video) {
        videoLink.href = item.video;
        videoLink.textContent = 'Watch Video';
        videoLink.classList.remove('hidden');
    } else {
        videoLink.classList.add('hidden');
    }
    modal.classList.remove('hidden');
    document.getElementById('closeModal').addEventListener('click', () => modal.classList.add('hidden'));
}

// Exercise Todo
function initializeExerciseTodo() {
    fetch('/api/year_plan').then(res => res.json()).then(data => {
        yearPlan = data;
        displayExerciseTodos();
    });
    fetch('/api/meals').then(res => res.json()).then(data => {
        meals = data;
    });
    document.getElementById('levelSelect').addEventListener('change', displayExerciseTodos);
    document.getElementById('monthSelect').addEventListener('change', displayExerciseTodos);
    document.getElementById('weekSelect').addEventListener('change', displayExerciseTodos);
    document.getElementById('saveTodos').addEventListener('click', saveExerciseTodos);
    document.getElementById('deleteTodos').addEventListener('click', deleteExerciseTodos);
}

function displayExerciseTodos() {
    const level = document.getElementById('levelSelect').value;
    const month = parseInt(document.getElementById('monthSelect').value);
    const week = parseInt(document.getElementById('weekSelect').value);
    const container = document.getElementById('todoList');
    container.innerHTML = '';

    if (level === 'rest') {
        container.innerHTML = '<p class="text-lg">Rest Day: No exercises or diet todos.</p>';
        return;
    }

    const monthData = yearPlan[level]?.find(m => m.month === month + 1);
    if (!monthData) return;

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const todos = exerciseTodos[`${level}_${month}_${week}`] || days.map(day => ({
        day,
        exercises: monthData.exercises.map(ex => ({ ...ex, completed: false, timer: ex.duration })),
        diet: meals.map(meal => ({ ...meal, completed: false }))
    }));

    todos.forEach((todo, index) => {
        const section = document.createElement('div');
        section.className = 'mb-6';
        section.innerHTML = `<h3 class="text-lg font-medium mb-2">${todo.day}</h3>`;
        const exerciseList = document.createElement('div');
        exerciseList.innerHTML = '<h4 class="font-medium">Exercises (45 min total)</h4>';
        todo.exercises.forEach((ex, i) => {
            const id = `${level}_${month}_${week}_${index}_${i}`;
            const div = document.createElement('div');
            div.className = 'flex items-center justify-between py-2';
            div.innerHTML = `
                <div class="flex items-center space-x-2">
                    <input type="checkbox" class="checkbox" id="ex_${id}" ${ex.completed ? 'checked' : ''}>
                    <span>${ex.name}: ${ex.description}</span>
                </div>
                <div class="timer">
                    <span id="timer_${id}">${formatTime(ex.timer)}</span>
                    <button id="start_${id}" class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">Start</button>
                    <button id="reset_${id}" class="bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600">Reset</button>
                </div>
            `;
            exerciseList.appendChild(div);
            setupTimer(id, ex);
        });
        const dietList = document.createElement('div');
        dietList.innerHTML = '<h4 class="font-medium mt-4">Diet</h4>';
        todo.diet.forEach((meal, i) => {
            const id = `${level}_${month}_${week}_${index}_diet_${i}`;
            const div = document.createElement('div');
            div.className = 'flex items-center space-x-2 py-2';
            div.innerHTML = `
                <input type="checkbox" class="checkbox" id="diet_${id}" ${meal.completed ? 'checked' : ''}>
                <span>${meal.name}: ${meal.description}</span>
            `;
            dietList.appendChild(div);
            document.getElementById(`diet_${id}`).addEventListener('change', () => {
                todo.diet[i].completed = document.getElementById(`diet_${id}`).checked;
                saveToLocalStorage();
            });
        });
        section.appendChild(exerciseList);
        section.appendChild(dietList);
        container.appendChild(section);
    });
    exerciseTodos[`${level}_${month}_${week}`] = todos;
    saveToLocalStorage();
}

function setupTimer(id, ex) {
    document.getElementById(`ex_${id}`).addEventListener('change', () => {
        ex.completed = document.getElementById(`ex_${id}`).checked;
        saveToLocalStorage();
    });
    document.getElementById(`start_${id}`).addEventListener('click', () => {
        if (!timers[id]) {
            timers[id] = setInterval(() => {
                if (ex.timer > 0) {
                    ex.timer--;
                    document.getElementById(`timer_${id}`).textContent = formatTime(ex.timer);
                    saveToLocalStorage();
                } else {
                    clearInterval(timers[id]);
                    delete timers[id];
                }
            }, 1000);
        }
    });
    document.getElementById(`reset_${id}`).addEventListener('click', () => {
        clearInterval(timers[id]);
        delete timers[id];
        ex.timer = ex.duration;
        document.getElementById(`timer_${id}`).textContent = formatTime(ex.timer);
        saveToLocalStorage();
    });
}

function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

function saveExerciseTodos() {
    const level = document.getElementById('levelSelect').value;
    const month = document.getElementById('monthSelect').value;
    const week = document.getElementById('weekSelect').value;
    const todos = exerciseTodos[`${level}_${month}_${week}`];
    const data = JSON.stringify(todos, null, 2);
    const blob = new Blob([data], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `exercise_todos_${level}_${month}_${week}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
}

function deleteExerciseTodos() {
    const level = document.getElementById('levelSelect').value;
    const month = document.getElementById('monthSelect').value;
    const week = document.getElementById('weekSelect').value;
    delete exerciseTodos[`${level}_${month}_${week}`];
    localStorage.setItem('exerciseTodos', JSON.stringify(exerciseTodos));
    displayExerciseTodos();
}

// Custom Todo
function initializeCustomTodo() {
    document.getElementById('addCustomTask').addEventListener('click', addCustomTask);
    document.getElementById('saveCustomTodos').addEventListener('click', saveCustomTodos);
    displayCustomTodos();
}

function addCustomTask() {
    const task = document.getElementById('customTask').value;
    const columns = document.getElementById('customColumns').value.split(',').map(col => col.trim());
    if (task) {
        customTodos.tasks.push({ task, values: columns });
        customTodos.columns = columns;
        document.getElementById('customTask').value = '';
        document.getElementById('customColumns').value = '';
        displayCustomTodos();
        saveToLocalStorage();
    }
}

function displayCustomTodos() {
    const container = document.getElementById('customTodoList');
    container.innerHTML = '';
    if (customTodos.tasks.length === 0) return;
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = '<th>Task</th>' + customTodos.columns.map(col => `<th>${col}</th>`).join('');
    thead.appendChild(headerRow);
    const tbody = document.createElement('tbody');
    customTodos.tasks.forEach((task, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${task.task}</td>` + task.values.map(val => `<td>${val}</td>`).join('');
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 ml-2';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => {
            customTodos.tasks.splice(index, 1);
            displayCustomTodos();
            saveToLocalStorage();
        });
        row.cells[0].appendChild(deleteBtn);
        tbody.appendChild(row);
    });
    table.appendChild(thead);
    table.appendChild(tbody);
    container.appendChild(table);
}

function saveCustomTodos() {
    localStorage.setItem('customTodos', JSON.stringify(customTodos));
    alert('Custom todos saved to LocalStorage!');
}

// Exercise Videos
function initializeExerciseVideos() {
    fetch('/api/resources').then(res => res.json()).then(data => {
        resources = data;
        displayExerciseVideos();
    });
    document.getElementById('addVideo').addEventListener('click', addExerciseVideo);
    document.getElementById('addImageText').addEventListener('click', addImageText);
    displayImageTexts();
}

function displayExerciseVideos() {
    const container = document.getElementById('exercise_videos');
    container.innerHTML = '';
    resources.exercise_videos.forEach(video => {
        const li = document.createElement('li');
        li.className = 'mb-2';
        li.innerHTML = `
            <span>${video.title}: <a href="${video.url}" target="_blank" class="text-blue-500 hover:underline">${video.url}</a>
            (<a href="${video.reddit}" target="_blank" class="text-blue-500 hover:underline">Reddit</a>,
            <a href="${video.x}" target="_blank" class="text-blue-500 hover:underline">X</a>)</span>
            <button class="edit-video bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 ml-2" data-title="${video.title}">Edit</button>
            <button class="delete-video bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 ml-2" data-title="${video.title}">Delete</button>
        `;
        container.appendChild(li);
    });
    document.querySelectorAll('.edit-video').forEach(btn => {
        btn.addEventListener('click', () => editVideo(btn.dataset.title));
    });
    document.querySelectorAll('.delete-video').forEach(btn => {
        btn.addEventListener('click', () => deleteVideo(btn.dataset.title, 'exercise_videos'));
    });
}

function addExerciseVideo() {
    const title = document.getElementById('videoTitle').value;
    const url = document.getElementById('videoUrl').value;
    const reddit = document.getElementById('redditUrl').value;
    const x = document.getElementById('xUrl').value;
    if (title && url) {
        fetch('/api/update_links', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resource: { category: 'exercise_videos', title, url, reddit, x } })
        }).then(() => {
            resources.exercise_videos.push({ title, url, reddit, x });
            displayExerciseVideos();
            document.getElementById('videoTitle').value = '';
            document.getElementById('videoUrl').value = '';
            document.getElementById('redditUrl').value = '';
            document.getElementById('xUrl').value = '';
        });
    }
}

function editVideo(title) {
    const video = resources.exercise_videos.find(v => v.title === title);
    document.getElementById('videoTitle').value = video.title;
    document.getElementById('videoUrl').value = video.url;
    document.getElementById('redditUrl').value = video.reddit;
    document.getElementById('xUrl').value = video.x;
    resources.exercise_videos = resources.exercise_videos.filter(v => v.title !== title);
    displayExerciseVideos();
}

function deleteVideo(title, category) {
    fetch('/api/delete_resource', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, title })
    }).then(() => {
        resources[category] = resources[category].filter(v => v.title !== title);
        if (category === 'exercise_videos') displayExerciseVideos();
        else displayImportantVideos();
    });
}

function addImageText() {
    const file = document.getElementById('imageInput').files[0];
    const text = document.getElementById('imageText').value;
    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            imageTexts.push({ image: reader.result, text });
            localStorage.setItem('imageTexts', JSON.stringify(imageTexts));
            displayImageTexts();
            document.getElementById('imageInput').value = '';
            document.getElementById('imageText').value = '';
        };
        reader.readAsDataURL(file);
    }
}

function displayImageTexts() {
    const container = document.getElementById('imageTextList');
    container.innerHTML = '';
    imageTexts.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow';
        div.innerHTML = `
            <img src="${item.image}" class="image-item mb-2">
            <p>${item.text}</p>
            <button class="edit-image bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 mt-2" data-index="${index}">Edit</button>
            <button class="delete-image bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 mt-2" data-index="${index}">Delete</button>
        `;
        container.appendChild(div);
    });
    document.querySelectorAll('.edit-image').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = btn.dataset.index;
            const item = imageTexts[index];
            document.getElementById('imageText').value = item.text;
            imageTexts.splice(index, 1);
            displayImageTexts();
            saveToLocalStorage();
        });
    });
    document.querySelectorAll('.delete-image').forEach(btn => {
        btn.addEventListener('click', () => {
            imageTexts.splice(btn.dataset.index, 1);
            displayImageTexts();
            saveToLocalStorage();
        });
    });
}

// Important Videos
function initializeImportantVideos() {
    fetch('/api/resources').then(res => res.json()).then(data => {
        resources = data;
        displayImportantVideos();
    });
    document.getElementById('addImpVideo').addEventListener('click', addImportantVideo);
    document.getElementById('addNotepad').addEventListener('click', addNotepad);
    displayNotepads();
}

function displayImportantVideos() {
    const container = document.getElementById('important_videos');
    container.innerHTML = '';
    resources.important_videos.forEach(video => {
        const li = document.createElement('li');
        li.className = 'mb-2';
        li.innerHTML = `
            <span>${video.title}: <a href="${video.url}" target="_blank" class="text-blue-500 hover:underline">${video.url}</a></span>
            <button class="edit-imp-video bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 ml-2" data-title="${video.title}">Edit</button>
            <button class="delete-imp-video bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 ml-2" data-title="${video.title}">Delete</button>
        `;
        container.appendChild(li);
    });
    document.querySelectorAll('.edit-imp-video').forEach(btn => {
        btn.addEventListener('click', () => {
            const video = resources.important_videos.find(v => v.title === title);
            document.getElementById('impVideoTitle').value = video.title;
            document.getElementById('impVideoUrl').value = video.url;
            resources.important_videos = resources.important_videos.filter(v => v.title !== title);
            displayImportantVideos();
        });
    });
    document.querySelectorAll('.delete-imp-video').forEach(btn => {
        btn.addEventListener('click', () => deleteVideo(btn.dataset.title, 'important_videos'));
    });
}

function addImportantVideo() {
    const title = document.getElementById('impVideoTitle').value;
    const url = document.getElementById('impVideoUrl').value;
    if (title && url) {
        fetch('/api/update_links', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resource: { category: 'important_videos', title, url } })
        }).then(() => {
            resources.important_videos.push({ title, url });
            displayImportantVideos();
            document.getElementById('impVideoTitle').value = '';
            document.getElementById('impVideoUrl').value = '';
        });
    }
}

function addNotepad() {
    const text = document.getElementById('notepadInput').value;
    if (text) {
        notepads.push({ text, id: Date.now() });
        localStorage.setItem('notepads', JSON.stringify(notepads));
        displayNotepads();
        document.getElementById('notepadInput').value = '';
    }
}

function displayNotepads() {
    const container = document.getElementById('notepadList');
    container.innerHTML = '';
    notepads.forEach((note, index) => {
        const div = document.createElement('div');
        div.className = 'bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow mb-4';
        div.innerHTML = `
            <p>${note.text}</p>
            <button class="edit-notepad bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 mt-2" data-index="${index}">Edit</button>
            <button class="delete-notepad bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 mt-2" data-index="${index}">Delete</button>
        `;
        container.appendChild(div);
    });
    document.querySelectorAll('.edit-notepad').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = btn.dataset.index;
            document.getElementById('notepadInput').value = notepads[index].text;
            notepads.splice(index, 1);
            displayNotepads();
            saveToLocalStorage();
        });
    });
    document.querySelectorAll('.delete-notepad').forEach(btn => {
        btn.addEventListener('click', () => {
            notepads.splice(btn.dataset.index, 1);
            displayNotepads();
            saveToLocalStorage();
        });
    });
}

// Songs
function initializeSongs() {
    document.getElementById('spotifyLogin').addEventListener('click', () => {
        window.location.href = '/spotify_login';
    });
    document.getElementById('addYoutube').addEventListener('click', addYoutubePlayer);
    document.getElementById('playLocal').addEventListener('click', playLocalAudio);
    if (window.spotifyToken) initializeSpotify();
}

function initializeSpotify() {
    window.onSpotifyWebPlaybackSDKReady = () => {
        spotifyPlayer = new Spotify.Player({
            name: 'Fitness Tracker',
            getOAuthToken: cb => { cb(window.spotifyToken); }
        });
        spotifyPlayer.addListener('ready', ({ device_id }) => {
            console.log('Spotify Player Ready:', device_id);
            document.getElementById('spotifyPlayPause').addEventListener('click', () => {
                spotifyPlayer.togglePlay();
            });
            document.getElementById('spotifyNext').addEventListener('click', () => {
                spotifyPlayer.nextTrack();
            });
            spotifyPlayer.addListener('player_state_changed', state => {
                if (state && state.track_window.current_track) {
                    document.getElementById('spotifyTrack').textContent = `Playing: ${state.track_window.current_track.name}`;
                }
            });
        });
        spotifyPlayer.connect();
    };
}

function addYoutubePlayer() {
    const url = document.getElementById('youtubeUrl').value;
    if (url) {
        const videoId = url.split('v=')[1]?.split('&')[0];
        if (videoId) {
            const container = document.getElementById('youtubePlayers');
            const div = document.createElement('div');
            div.id = `youtube_${youtubePlayers.length}`;
            container.appendChild(div);
            const player = new YT.Player(div.id, {
                height: '200',
                width: '300',
                videoId,
                events: {
                    'onReady': event => {
                        youtubePlayers.push(event.target);
                        event.target.playVideo();
                    }
                }
            });
            document.getElementById('youtubeUrl').value = '';
        }
    }
}

function playLocalAudio() {
    const files = document.getElementById('localAudio').files;
    const container = document.getElementById('localPlayers');
    container.innerHTML = '';
    localAudioPlayers = [];
    Array.from(files).forEach(file => {
        const audio = document.createElement('audio');
        audio.controls = true;
        audio.src = URL.createObjectURL(file);
        container.appendChild(audio);
        localAudioPlayers.push(audio);
        audio.play();
    });
}

// Blog
function initializeBlog() {
    document.getElementById('saveJournal').addEventListener('click', saveJournal);
    document.getElementById('saveSummary').addEventListener('click', saveSummary);
    displayJournals();
    displaySummaries();
}

function saveJournal() {
    const date = document.getElementById('journalDate').value;
    const entry = document.getElementById('journalEntry').value;
    if (date && entry) {
        journals.push({ date, entry, id: Date.now() });
        localStorage.setItem('journals', JSON.stringify(journals));
        const blob = new Blob([entry], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `journal_${date}.txt`;
        a.click();
        URL.revokeObjectURL(a.href);
        displayJournals();
        document.getElementById('journalDate').value = '';
        document.getElementById('journalEntry').value = '';
    }
}

function displayJournals() {
    const container = document.getElementById('journalList');
    container.innerHTML = '';
    journals.forEach((journal, index) => {
        const div = document.createElement('div');
        div.className = 'bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow mb-4';
        div.innerHTML = `
            <h3 class="text-lg font-medium">${journal.date}</h3>
            <p>${journal.entry}</p>
            <button class="edit-journal bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 mt-2" data-index="${index}">Edit</button>
            <button class="delete-journal bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 mt-2" data-index="${index}">Delete</button>
        `;
        container.appendChild(div);
    });
    document.querySelectorAll('.edit-journal').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = btn.dataset.index;
            document.getElementById('journalDate').value = journals[index].date;
            document.getElementById('journalEntry').value = journals[index].entry;
            journals.splice(index, 1);
            displayJournals();
            saveToLocalStorage();
        });
    });
    document.querySelectorAll('.delete-journal').forEach(btn => {
        btn.addEventListener('click', () => {
            journals.splice(btn.dataset.index, 1);
            displayJournals();
            saveToLocalStorage();
        });
    });
}

function saveSummary() {
    const type = document.getElementById('summaryType').value;
    const period = document.getElementById('summaryPeriod').value;
    const text = document.getElementById('summaryText').value;
    if (period && text) {
        summaries.push({ type, period, text, id: Date.now() });
        localStorage.setItem('summaries', JSON.stringify(summaries));
        const blob = new Blob([text], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${type}_summary_${period}.txt`;
        a.click();
        URL.revokeObjectURL(a.href);
        displaySummaries();
        document.getElementById('summaryPeriod').value = '';
        document.getElementById('summaryText').value = '';
    }
}

function displaySummaries() {
    const container = document.getElementById('summaryList');
    container.innerHTML = '';
    summaries.forEach((summary, index) => {
        const div = document.createElement('div');
        div.className = 'bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow mb-4';
        div.innerHTML = `
            <h3 class="text-lg font-medium">${summary.type} Summary: ${summary.period}</h3>
            <p>${summary.text}</p>
            <button class="edit-summary bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 mt-2" data-index="${index}">Edit</button>
            <button class="delete-summary bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 mt-2" data-index="${index}">Delete</button>
        `;
        container.appendChild(div);
    });
    document.querySelectorAll('.edit-summary').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = btn.dataset.index;
            document.getElementById('summaryType').value = summaries[index].type;
            document.getElementById('summaryPeriod').value = summaries[index].period;
            document.getElementById('summaryText').value = summaries[index].text;
            summaries.splice(index, 1);
            displaySummaries();
            saveToLocalStorage();
        });
    });
    document.querySelectorAll('.delete-summary').forEach(btn => {
        btn.addEventListener('click', () => {
            summaries.splice(btn.dataset.index, 1);
            displaySummaries();
            saveToLocalStorage();
        });
    });
}

// Code Editor
function initializeCodeEditor() {
    codeEditor = CodeMirror.fromTextArea(document.getElementById('codeEditor'), {
        mode: 'python',
        lineNumbers: true,
        theme: localStorage.getItem('theme') === 'dark' ? 'monokai' : 'default'
    });
    document.getElementById('loadFile').addEventListener('click', () => {
        const filename = document.getElementById('fileSelect').value;
        fetch('/api/read_code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename })
        }).then(res => res.json()).then(data => {
            if (data.status === 'success') {
                codeEditor.setValue(data.content);
                updateEditorMode(filename);
            } else {
                alert('Error loading file: ' + data.message);
            }
        });
    });
    document.getElementById('saveFile').addEventListener('click', () => {
        const filename = document.getElementById('fileSelect').value;
        const content = codeEditor.getValue();
        fetch('/api/save_code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename, content })
        }).then(res => res.json()).then(data => {
            alert(data.status === 'success' ? 'File saved!' : 'Error: ' + data.message);
        });
    });
}

function updateEditorMode(filename) {
    if (filename.endsWith('.py')) codeEditor.setOption('mode', 'python');
    else if (filename.endsWith('.html')) codeEditor.setOption('mode', 'htmlmixed');
    else if (filename.endsWith('.js')) codeEditor.setOption('mode', 'javascript');
    else if (filename.endsWith('.css')) codeEditor.setOption('mode', 'css');
}

// Save All
function initializeSaveAll() {
    document.getElementById('saveAll').addEventListener('click', () => {
        const data = {
            exerciseTodos,
            customTodos,
            imageTexts,
            notepads,
            journals,
            summaries
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'fitness_tracker_data.txt';
        a.click();
        URL.revokeObjectURL(a.href);
    });
}

// Delete All
function initializeDeleteAll() {
    document.getElementById('deleteAll').addEventListener('click', () => {
        if (confirm('Are you sure you want to delete all in-memory data? This won’t affect local files.')) {
            localStorage.clear();
            exerciseTodos = {};
            customTodos = { tasks: [], columns: [] };
            imageTexts = [];
            notepads = [];
            journals = [];
            summaries = [];
            alert('All in-memory data cleared!');
            window.location.reload();
        }
    });
}

function saveToLocalStorage() {
    localStorage.setItem('exerciseTodos', JSON.stringify(exerciseTodos));
    localStorage.setItem('customTodos', JSON.stringify(customTodos));
    localStorage.setItem('imageTexts', JSON.stringify(imageTexts));
    localStorage.setItem('notepads', JSON.stringify(notepads));
    localStorage.setItem('journals', JSON.stringify(journals));
    localStorage.setItem('summaries', JSON.stringify(summaries));
}