// Генератор ответов
const excuses = ["Мы заняты", "Нет настроения", "Мне хуево", "Да чет не охото", "Сегодня навряд-ли"];
const invitations = ["Приходи", "Ждем тебя", "Будем рады видеть", "Не забудь вкусняшки!"];
const button = document.getElementById('generateButton');
const nextTimeDisplay = document.getElementById('nextTime');
let timerInterval; // Переменная для хранения интервала таймера

function generateResponse() {
    const lastClickTime = localStorage.getItem('lastResponseTime');
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000; // milliseconds in a day

    if (lastClickTime) {
        const lastClickDate = new Date(parseInt(lastClickTime));
        const timeDiff = now - lastClickDate;

        if (timeDiff < oneDay) {
            // Рассчитываем время, когда можно будет нажать снова
            const nextAvailableTime = lastClickDate.getTime() + oneDay;
            startTimer(nextAvailableTime);
            button.disabled = true;
            return;
        }
    }

    // Если прошло больше суток или не было нажатий
    const allWords = [...excuses, ...invitations];
    const randomWord = allWords[Math.floor(Math.random() * allWords.length)];
    document.getElementById('output').textContent = randomWord;
    localStorage.setItem('lastResponseTime', now.getTime());
    nextTimeDisplay.textContent = '';
    button.disabled = false;
    clearInterval(timerInterval); // Очищаем предыдущий интервал
}

function startTimer(targetTime) {
    clearInterval(timerInterval); // Очищаем предыдущий интервал, чтобы избежать наложений
    timerInterval = setInterval(() => {
        const now = new Date().getTime();
        const timeLeft = targetTime - now;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            nextTimeDisplay.textContent = '';
            button.disabled = false;
        } else {
            const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
            nextTimeDisplay.textContent = `Можно будет нажать через: ${formatTime(hours)}:${formatTime(minutes)}:${formatTime(seconds)}`;
        }
    }, 1000);
}

function formatTime(time) {
    return time < 10 ? `0${time}` : time;
}

// Проверяем при загрузке страницы
window.onload = () => {
    fetchWeather();
    fetchCurrencyRates();
    loadScrumTasks();
    renderCalendar();
    displayCurrentDayNote();

    const lastClickTime = localStorage.getItem('lastResponseTime');
    if (lastClickTime) {
        const lastClickDate = new Date(parseInt(lastClickTime));
        const now = new Date();
        const oneDay = 24 * 60 * 60 * 1000;
        if (now - lastClickDate < oneDay) {
            button.disabled = true;
            const nextAvailableTime = lastClickDate.getTime() + oneDay;
            startTimer(nextAvailableTime);
        }
    }
};

// Таск-трекер
const columns = {
    toDoList: document.getElementById('toDoList'),
    inProgressList: document.getElementById('inProgressList'),
    doneList: document.getElementById('doneList')
};

let draggedTask = null;
let isTouchActive = false; // Флаг для отслеживания touch взаимодействия

// Обработчики событий для Drag and Drop (Desktop)
function handleDragStart(e) {
    draggedTask = this;
    e.dataTransfer.setData('text/plain', this.textContent.trim());
    this.classList.add('dragging');
}

function handleDragEnd() {
    if (draggedTask) {
        draggedTask.classList.remove('dragging');
        draggedTask = null;
        saveScrumTasks();
    }
}

function handleDragOver(e) {
    e.preventDefault(); // Разрешаем Drop
}

function handleDrop(e) {
    e.preventDefault();
    if (draggedTask) {
        const taskText = e.dataTransfer.getData('text/plain');
        if (draggedTask.textContent.trim() === taskText) {
            const sourceColumnId = draggedTask.parentNode.id;
            const targetColumnId = this.id;

            // Проверяем, не перетаскивается ли элемент в ту же колонку
            if (sourceColumnId !== targetColumnId) {
                this.appendChild(draggedTask);
                draggedTask.classList.remove('dragging');
                draggedTask = null;
                saveScrumTasks();

                // Применяем стили, специфичные для целевой колонки
                applyColumnSpecificStyles(draggedTask, targetColumnId);
                if (targetColumnId === 'doneList') {
                    triggerConfetti();
                }
            } else {
                // Если перетаскивается в ту же колонку, сбрасываем draggedTask
                draggedTask.classList.remove('dragging');
                draggedTask = null;
            }
        }
    }
}

function applyColumnSpecificStyles(taskItem, columnId) {
    // Сбрасываем стили, которые могли быть применены ранее
    taskItem.style.background = '';
    taskItem.style.color = '';
    taskItem.style.border = '';
    const checkIcon = taskItem.querySelector('span');
    if (checkIcon) {
        checkIcon.remove();
    }

    if (columnId === 'doneList') {
        taskItem.style.background = '#d4edda';
        taskItem.style.color = '#155724';
        taskItem.style.border = '1px solid #c3e6cb';
        const checkIcon = document.createElement('span');
        checkIcon.textContent = '✔';
        checkIcon.style.marginRight = '10px';
        taskItem.prepend(checkIcon);
    }
}

// Обработчики событий для Touch (Mobile)
function handleTouchStart(e) {
    isTouchActive = true;
    draggedTask = this;
    this.classList.add('dragging');
}

function handleTouchMove(e) {
    if (!draggedTask || !isTouchActive) return;
    e.preventDefault(); // Предотвращаем прокрутку при touchmove
    // Можно добавить логику визуального следования за пальцем
}

function handleTouchEnd(e) {
    if (!draggedTask || !isTouchActive) return;
    e.preventDefault();
    const touch = e.changedTouches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);

    if (target && Object.values(columns).includes(target)) { // Проверяем, является ли целью одна из колонок
        const sourceColumnId = draggedTask.parentNode.id;
        const targetColumnId = target.id;
        if (sourceColumnId !== targetColumnId) {
            target.appendChild(draggedTask);
            draggedTask.classList.remove('dragging');
            draggedTask = null;
            saveScrumTasks();
            applyColumnSpecificStyles(draggedTask, targetColumnId);
            if (targetColumnId === 'doneList') {
                triggerConfetti();
            }
        } else {
            draggedTask.classList.remove('dragging');
            draggedTask = null;
        }
    } else if (draggedTask) {
        draggedTask.classList.remove('dragging');
        draggedTask = null;
    }
    isTouchActive = false;
}

// Загружаем задачи из localStorage
function loadScrumTasks() {
    for (const key in columns) {
        const tasks = JSON.parse(localStorage.getItem(key)) || [];
        const taskList = document.getElementById(key);
        taskList.innerHTML = ''; // Очищаем список перед загрузкой
        tasks.forEach(taskText => {
            const taskElement = createTaskElement(taskText, taskList);
            taskList.appendChild(taskElement);
        });
        // Добавляем обработчики на task-list при загрузке
        taskList.addEventListener('dragover', handleDragOver);
        taskList.addEventListener('drop', handleDrop);
    }
}

// Сохраняем задачи в localStorage
function saveScrumTasks() {
    for (const key in columns) {
        const taskList = document.getElementById(key);
        const tasks = Array.from(taskList.children).map(task => task.textContent.trim().replace('Удалить', '').trim());
        localStorage.setItem(key, JSON.stringify(tasks));
    }
}

// Создаём элемент задачи
function createTaskElement(taskText, column) {
    const taskItem = document.createElement('li');
    taskItem.textContent = taskText;
    taskItem.draggable = true;

    // Обработчики событий для Desktop
    taskItem.ondragstart = handleDragStart;
    taskItem.ondragend = handleDragEnd;

    // Обработчики событий для Mobile
    taskItem.addEventListener('touchstart', handleTouchStart);
    taskItem.addEventListener('touchmove', handleTouchMove);
    taskItem.addEventListener('touchend', handleTouchEnd);
    taskItem.addEventListener('touchcancel', handleTouchEnd); // Обработка отмены касания

    // Применяем стили в зависимости от колонки при создании
    applyColumnSpecificStyles(taskItem, column.id);

    // Кнопка удаления
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Удалить';
    deleteButton.style.marginLeft = '10px';
    deleteButton.style.background = '#dc3545';
    deleteButton.style.color = '#fff';
    deleteButton.style.border = 'none';
    deleteButton.style.borderRadius = '4px';
    deleteButton.style.padding = '5px 10px';
    deleteButton.style.cursor = 'pointer';

    deleteButton.onclick = () => {
        taskItem.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
        taskItem.style.opacity = '0';
        taskItem.style.transform = 'scale(0.8)';

        // Удаляем задачу через 500 мс (после анимации)
        setTimeout(() => {
            taskItem.remove();
            saveScrumTasks(); // Обновляем localStorage
        }, 500);
    };

    taskItem.appendChild(deleteButton);

    return taskItem; // Возвращаем созданный элемент
}

// Добавление новой задачи
const taskInput = document.getElementById('taskInput');
function addTask() {
    const taskText = taskInput.value.trim();
    if (taskText === '') return;

    // Определяем целевую колонку для новой задачи (To Do)
    const targetColumn = document.getElementById('toDoList');
    const newTask = createTaskElement(taskText, targetColumn);
    targetColumn.appendChild(newTask);
    saveScrumTasks();

    taskInput.value = '';
}

// Навешиваем обработчики на списки задач после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    for (const key in columns) {
        const taskListElement = document.getElementById(key);
        // Remove existing listeners to avoid duplicates
        taskListElement.removeEventListener('dragover', handleDragOver);
        taskListElement.removeEventListener('drop', handleDrop);

        taskListElement.addEventListener('dragover', handleDragOver);
        taskListElement.addEventListener('drop', handleDrop);
    }
});

// Конфетти для колонки done
function triggerConfetti() {
    const confettiCanvas = document.getElementById('confettiCanvas');
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;

    const confettiSettings = { target: 'confettiCanvas', max: 150, size: 2 };
    const confetti = new ConfettiGenerator(confettiSettings);
    confetti.render();

    // Убираем конфетти через 2 секунды
    setTimeout(() => confetti.clear(), 2000);
}

// Погода
const API_KEY = '98dd9cd645272094caa3e43d4c3ff31b'; // Вставь сюда свой API-ключ
const city = 'Екатеринбург'; // Задай свой город

async function fetchWeather() {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric&lang=ru`);
        const data = await response.json();

        // Заполняем данные о погоде
        document.getElementById('city').textContent = `Город: ${data.name}`;
        document.getElementById('temperature').textContent = `Температура: ${data.main.temp}°C`;
        document.getElementById('description').textContent = `Описание: ${data.weather[0].description}`;
        const icon = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
        const weatherIcon = document.getElementById('weatherIcon');
        weatherIcon.src = icon;
        weatherIcon.style.display = 'block';
    } catch (error) {
        document.getElementById('city').textContent = 'Ошибка загрузки данных о погоде';
        console.error(error);
    }
}

async function fetchCurrencyRates() {
    const ratesOutput = document.getElementById('rates-output');
    ratesOutput.textContent = 'Загрузка курсов...'; // Общее сообщение о загрузке
    let ratesHTML = ''; // Переменная для хранения HTML строк с курсами

    // 1. Получаем курс доллара к рублю
    try {
        const responseUSD = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const dataUSD = await responseUSD.json();
        const rubRateUSD = dataUSD.rates.RUB.toFixed(2);
        ratesHTML += `<p>1 USD = ${rubRateUSD} RUB</p>`;
    } catch (error) {
        console.error('Ошибка при загрузке курса USD к RUB:', error);
        ratesHTML += '<p>Не удалось загрузить курс USD/RUB</p>';
    }

    // 2. Получаем курс евро к рублю
    try {
        const responseEUR = await fetch('https://api.exchangerate-api.com/v4/latest/EUR');
        const dataEUR = await responseEUR.json();
        const rubRateEUR = dataEUR.rates.RUB.toFixed(2);
        ratesHTML += `<p>1 EUR = ${rubRateEUR} RUB</p>`;
    } catch (error) {
        console.error('Ошибка при загрузке курса EUR к RUB:', error);
        ratesHTML += '<p>Не удалось загрузить курс EUR/RUB</p>';
    }

    ratesOutput.innerHTML = ratesHTML;
}

const calendarDatesDiv = document.getElementById('calendarDates');
const currentMonthYearH3 = document.getElementById('currentMonthYear');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const noteSidebar = document.getElementById('noteSidebar');
const closeSidebarBtn = document.getElementById('closeSidebar');
const sidebarDateSpan = document.getElementById('sidebarDate');
const noteTitleInput = document.getElementById('noteTitle');
const noteBodyTextarea = document.getElementById('noteBody');
const tagsContainer = document.getElementById('tagsContainer');
const customTagInput = document.getElementById('customTag');
const addTagButton = document.getElementById('addTagButton');
const saveNoteBtn = document.getElementById('saveNote');
const tagColorInput = document.getElementById('tagColor'); // Добавлено получение элемента выбора цвета

let currentDate = new Date();
let selectedDate = null;
let notes = JSON.parse(localStorage.getItem('calendarNotes')) || {};
let tagColors = JSON.parse(localStorage.getItem('tagColors')) || {}; // Загрузка цветов тегов
const predefinedTags = ['work', 'business', 'learning', 'life'];

function renderCalendar() {
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const paddingDays = (firstDayOfMonth.getDay() + 6) % 7;

    currentMonthYearH3.textContent = `${currentDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}`;
    calendarDatesDiv.innerHTML = '';

    for (let i = 0; i < paddingDays; i++) {
        const paddingDay = document.createElement('div');
        calendarDatesDiv.appendChild(paddingDay);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateCell = document.createElement('div');
        dateCell.textContent = day;
        const cellDate = formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
        dateCell.dataset.date = cellDate;

        // Отображение тегов на календаре
        if (notes[cellDate] && notes[cellDate].tags && notes[cellDate].tags.length > 0) {
            const labelContainer = document.createElement('div');
            labelContainer.classList.add('label-container');
            notes[cellDate].tags.forEach(tagText => {
                const tagIndicator = document.createElement('span');
                tagIndicator.classList.add('label');
                tagIndicator.textContent = tagText;
                tagIndicator.style.backgroundColor = tagColors[tagText] || '#888'; // Используем сохраненный цвет
                labelContainer.appendChild(tagIndicator);
            });
            dateCell.appendChild(labelContainer);
        }

        dateCell.addEventListener('click', () => openNoteSidebar(cellDate));
        calendarDatesDiv.appendChild(dateCell);
    }
}

function formatDate(date) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

let isNoteFormVisible = false; // Добавляем флаг видимости формы

function openNoteSidebar(date) {
    selectedDate = date;
    sidebarDateSpan.textContent = new Date(date).toLocaleDateString('ru-RU');

    if (!isNoteFormVisible) {
        // Если форма скрыта, показываем ее и загружаем заметку
        noteSidebar.classList.add('open');
        loadNote(date);
        isNoteFormVisible = true;
    } else {
        // Если форма видна, просто закрываем боковую панель
        closeNoteSidebar();
    }
}

function closeNoteSidebar() {
    noteSidebar.classList.remove('open');
    isNoteFormVisible = false; // Сбрасываем флаг
    selectedDate = null;
}

function loadNote(date) {
    const note = notes[date] || { title: '', body: '', tags: [] };
    noteTitleInput.value = note.title;
    noteBodyTextarea.value = note.body;

    // Отображение тегов
    tagsContainer.innerHTML = '';
    const allTagsForNote = [...new Set([...predefinedTags, ...note.tags])]; // Ensure all tags are present
    allTagsForNote.forEach(tagText => {
        const tagElement = document.createElement('span');
        tagElement.classList.add('tag');
        if (note.tags.includes(tagText)) {
            tagElement.classList.add('selected');
        }
        tagElement.textContent = tagText;
        tagElement.style.backgroundColor = tagColors[tagText] || '#eee'; // Устанавливаем цвет фона
        tagElement.addEventListener('click', () => toggleTag(tagText));
        tagsContainer.appendChild(tagElement);
    });
}

function toggleTag(tagText) {
    const tagElement = Array.from(tagsContainer.querySelectorAll('.tag')).find(tag => tag.textContent === tagText);
    if (tagElement) {
        tagElement.classList.toggle('selected');
    }
}

function saveNote() {
    if (!selectedDate) return;

    const title = noteTitleInput.value;
    const body = noteBodyTextarea.value;
    const selectedTags = Array.from(tagsContainer.querySelectorAll('.tag.selected')).map(tag => tag.textContent);
    const tagColor = tagColorInput.value;

    selectedTags.forEach(tag => {
        tagColors[tag] = tagColor;
    });
    localStorage.setItem('tagColors', JSON.stringify(tagColors));

    notes[selectedDate] = { title: title, body: body, tags: selectedTags };
    localStorage.setItem('calendarNotes', JSON.stringify(notes));
    renderCalendar(); // Обновляем отображение календаря
    displayCurrentDayNote(); // Обновляем заметку текущего дня
    closeNoteSidebar(); // Закрываем боковую панель после сохранения
}

function addCustomTag() {
    const tagText = customTagInput.value.trim();
    if (tagText && !predefinedTags.includes(tagText)) {
        predefinedTags.push(tagText);
        loadNote(selectedDate); // Перезагружаем заметку для отображения нового тега
        customTagInput.value = '';
    }
}

function displayCurrentDayNote() {
    const currentDayNoteDiv = document.getElementById('currentDayNote');
    const currentDayNoteContentDiv = document.getElementById('currentDayNoteContent');
    const today = formatDate(new Date());

    if (notes[today] && (notes[today].tags.length > 0 || notes[today].body)) {
        currentDayNoteContentDiv.innerHTML = ''; // Очищаем содержимое

        if (notes[today].body) {
            const noteBody = document.createElement('p');
            noteBody.textContent = notes[today].body;
            currentDayNoteContentDiv.appendChild(noteBody);
        }

        if (notes[today].tags && notes[today].tags.length > 0) {
            notes[today].tags.forEach(tagText => {
                const tagElement = document.createElement('span');
                tagElement.classList.add('label');
                tagElement.textContent = tagText;
                tagElement.style.backgroundColor = tagColors[tagText] || '#888';
                currentDayNoteContentDiv.appendChild(tagElement);
            });
        }
        currentDayNoteDiv.style.display = 'block';
    } else {
        currentDayNoteContentDiv.innerHTML = '<p>Нет заметок на сегодня.</p>';
        currentDayNoteDiv.style.display = 'block'; // Или 'none', если хотите скрыть блок
    }
}

prevMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});

nextMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

closeSidebarBtn.addEventListener('click', closeNoteSidebar);
saveNoteBtn.addEventListener('click', saveNote);
addTagButton.addEventListener('click', addCustomTag);

// Инициализация календаря и заметки текущего дня при загрузке

tagColorInput.addEventListener('change', () => {
    const color = tagColorInput.value;
    const selectedTagElement = tagsContainer.querySelector('.tag.selected');
    if (selectedTagElement) {
        selectedTagElement.style.backgroundColor = color;
    }
});

renderCalendar();
displayCurrentDayNote();