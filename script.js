// Начальные параметры
let currentYear = 2026;
let currentMonth = 0; // 0 — январь
let selectedDate = null; // Хранит выбранную дату
let selectedDateKey = null; // Ключ для хранения в localStorage
let notes = {}; // Объект для хранения заметок
let sortByPriority = false; // Флаг сортировки по приоритету

// Управление темой
let isDarkTheme = false;

// Загружаем тему из localStorage
function loadTheme() {
    const savedTheme = localStorage.getItem('calendarTheme');
    if (savedTheme === 'dark') {
        enableDarkTheme();
    } else {
        enableLightTheme();
    }
}

// Сохраняем тему в localStorage
function saveTheme() {
    localStorage.setItem('calendarTheme', isDarkTheme ? 'dark' : 'light');
}

// Включить темную тему
function enableDarkTheme() {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.getElementById('theme-text').textContent = 'Светлая тема';
    document.querySelector('.theme-icon').textContent = '☀️';
    isDarkTheme = true;
}

// Включить светлую тему
function enableLightTheme() {
    document.documentElement.setAttribute('data-theme', 'light');
    document.getElementById('theme-text').textContent = 'Темная тема';
    document.querySelector('.theme-icon').textContent = '🌙';
    isDarkTheme = false;
}

// Переключение темы
function toggleTheme() {
    if (isDarkTheme) {
        enableLightTheme();
    } else {
        enableDarkTheme();
    }
    saveTheme();
}

// Загружаем заметки из localStorage
function loadNotes() {
    const savedNotes = localStorage.getItem('calendarNotes2026');
    if (savedNotes) {
        notes = JSON.parse(savedNotes);
    }
}

// Сохраняем заметки в localStorage
function saveNotes() {
    localStorage.setItem('calendarNotes2026', JSON.stringify(notes));
}

// Форматирует дату в ключ (дд.мм.гггг)
function formatDateKey(day, month, year) {
    return `${day.toString().padStart(2, '0')}.${(month + 1).toString().padStart(2, '0')}.${year}`;
}

// Получить числовое значение приоритета
function getPriorityValue(priority) {
    switch(priority) {
        case 'high': return 3;
        case 'medium': return 2;
        case 'low': return 1;
        default: return 2; // По умолчанию средний приоритет
    }
}

// Получить название приоритета для отображения
function getPriorityName(priority) {
    switch(priority) {
        case 'high': return 'Высокий';
        case 'medium': return 'Средний';
        case 'low': return 'Низкий';
        default: return 'Средний'; // По умолчанию средний приоритет
    }
}

// Сортировка заметок
function sortNotes(dateNotes) {
    if (!dateNotes) return [];
    
    const sortedNotes = [...dateNotes];
    
    if (sortByPriority) {
        // Сортировка по приоритету (высокий -> средний -> низкий)
        sortedNotes.sort((a, b) => {
            const priorityA = getPriorityValue(a.priority || 'medium');
            const priorityB = getPriorityValue(b.priority || 'medium');
            return priorityB - priorityA; // Высокий приоритет сначала
        });
    } else {
        // Сортировка по времени добавления (новые сначала)
        sortedNotes.sort((a, b) => {
            return new Date(b.timestamp) - new Date(a.timestamp);
        });
    }
    
    return sortedNotes;
}

// Обновляет отображение заметок для выбранной даты
function updateNotesDisplay() {
    const notesList = document.getElementById('notes-list');
    const noteInput = document.getElementById('note-input');
    const saveBtn = document.getElementById('save-note');
    const subjectSelect = document.getElementById('subject-select');
    const prioritySelect = document.getElementById('priority-select');
    const clearBtn = document.getElementById('clear-notes');
    const noteCounter = document.getElementById('note-counter');
    const limitWarning = document.getElementById('limit-warning');
    
    if (selectedDateKey) {
        // Получаем заметки для выбранной даты
        let dateNotes = notes[selectedDateKey] || [];
        const notesCount = dateNotes.length;
        
        // Сортируем заметки
        dateNotes = sortNotes(dateNotes);
        
        // Обновляем счетчик
        noteCounter.textContent = `${notesCount}/5 заметок`;
        
        // Проверяем лимит
        if (notesCount >= 5) {
            limitWarning.style.display = 'block';
            saveBtn.disabled = true;
            subjectSelect.disabled = true;
            prioritySelect.disabled = true;
            noteInput.disabled = true;
        } else {
            limitWarning.style.display = 'none';
            saveBtn.disabled = false;
            subjectSelect.disabled = false;
            prioritySelect.disabled = false;
            noteInput.disabled = false;
        }
        
        // Очищаем форму
        noteInput.value = '';
        subjectSelect.value = '';
        prioritySelect.value = '';
        
        // Включаем/отключаем кнопку очистки
        clearBtn.disabled = notesCount === 0;
        
        // Отображаем заметки
        if (notesCount > 0) {
            notesList.innerHTML = '';
            dateNotes.forEach((note, index) => {
                const noteItem = document.createElement('div');
                noteItem.className = 'note-item';
                
                // Получаем названия для отображения
                const subjectName = getSubjectName(note.subject);
                const priorityName = getPriorityName(note.priority);
                const priorityClass = note.priority ? `priority-${note.priority}` : 'priority-medium';
                
                noteItem.innerHTML = `
                    <div class="note-header">
                        <div class="note-meta">
                            <div class="note-date">Заметка ${index + 1}</div>
                            <div class="note-tags">
                                ${note.priority ? `<span class="note-priority ${priorityClass}">${priorityName}</span>` : ''}
                                ${note.subject ? `<span class="note-subject">${subjectName}</span>` : ''}
                            </div>
                        </div>
                        <button class="delete-btn" data-date="${selectedDateKey}" data-index="${getOriginalIndex(selectedDateKey, note)}">
                            <i class="fas fa-trash"></i> Удалить
                        </button>
                    </div>
                    <div class="note-text">${note.text}</div>
                `;
                
                notesList.appendChild(noteItem);
            });
            
            // Добавляем обработчики для кнопок удаления
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const dateKey = this.getAttribute('data-date');
                    const noteIndex = parseInt(this.getAttribute('data-index'));
                    
                    if (confirm('Удалить эту заметку?')) {
                        // Удаляем заметку по индексу
                        notes[dateKey].splice(noteIndex, 1);
                        
                        // Если массив пуст, удаляем ключ
                        if (notes[dateKey].length === 0) {
                            delete notes[dateKey];
                        }
                        
                        saveNotes();
                        updateNotesDisplay();
                        renderCalendar();
                        updateStatistics();
                        updateStatsIcons();
                    }
                });
            });
        } else {
            notesList.innerHTML = '<div class="no-notes">Нет заметок для этой даты</div>';
        }
    } else {
        // Отключаем все элементы, если дата не выбрана
        noteInput.disabled = true;
        saveBtn.disabled = true;
        subjectSelect.disabled = true;
        prioritySelect.disabled = true;
        clearBtn.disabled = true;
        noteInput.value = '';
        subjectSelect.value = '';
        prioritySelect.value = '';
        noteCounter.textContent = '0/5 заметок';
        limitWarning.style.display = 'none';
        notesList.innerHTML = '<div class="no-notes">Выберите дату, чтобы добавить или просмотреть заметки</div>';
    }
}

// Получить оригинальный индекс заметки в массиве
function getOriginalIndex(dateKey, note) {
    const dateNotes = notes[dateKey] || [];
    for (let i = 0; i < dateNotes.length; i++) {
        if (dateNotes[i].timestamp === note.timestamp) {
            return i;
        }
    }
    return -1;
}

// Получить полное название предмета по значению
function getSubjectName(subjectValue) {
    const subjects = {
        'русский': 'Русский язык',
        'литература': 'Литература',
        'история': 'История',
        'математика': 'Математика',
        'информатика': 'Информатика',
        'биология': 'Биология',
        'физика': 'Физика',
        'химия': 'Химия',
        'география': 'География',
        'обществознание': 'Обществознание'
    };
    return subjects[subjectValue] || subjectValue;
}

function renderCalendar() {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);

    // Обновляем заголовок
    const monthNames = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    document.getElementById('month-year').textContent =
        `${monthNames[currentMonth]} ${currentYear}`;

    const calendarGrid = document.getElementById('calendar-grid');
    calendarGrid.innerHTML = ''; // Очищаем сетку

    // Добавляем дни недели
    const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    weekdays.forEach(day => {
        const weekdayEl = document.createElement('div');
        weekdayEl.className = 'weekday';
        weekdayEl.textContent = day;
        calendarGrid.appendChild(weekdayEl);
    });

    // Определяем день недели первого числа месяца
    const startDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    // Заполняем пустые ячейки до первого числа
    for (let i = 0; i < startDayOfWeek; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'day empty';
        calendarGrid.appendChild(emptyCell);
    }

    // Заполняем числа месяца
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'day';
        dayCell.textContent = day;
        
        const dateKey = formatDateKey(day, currentMonth, currentYear);
        
        // Проверяем, есть ли заметки для этой даты
        const dateNotes = notes[dateKey];
        if (dateNotes && dateNotes.length > 0) {
            dayCell.classList.add('has-note');
            
            // Добавляем счетчик заметок
            const noteCount = document.createElement('div');
            noteCount.className = 'note-count';
            noteCount.textContent = dateNotes.length;
            dayCell.appendChild(noteCount);
        }

        // Выделяем сегодняшнюю дату (если она в 2026 году)
        const today = new Date();
        if (day === today.getDate() &&
            currentMonth === today.getMonth() &&
            currentYear === today.getFullYear()) {
            dayCell.classList.add('today');
        }

        // Обработчик клика для выбора даты
        dayCell.addEventListener('click', () => {
            // Снимаем выделение с предыдущей даты
            if (selectedDate) {
                selectedDate.classList.remove('selected');
            }
            // Выделяем новую дату
            dayCell.classList.add('selected');
            selectedDate = dayCell;
            selectedDateKey = dateKey;

            // Форматируем и показываем выбранную дату
            document.getElementById('selected-date').textContent =
                `Выбранная дата: ${dateKey}`;
            
            // Обновляем отображение заметок
            updateNotesDisplay();
        });

        // Выделяем текущую выбранную дату при перерисовке
        if (dateKey === selectedDateKey) {
            dayCell.classList.add('selected');
            selectedDate = dayCell;
        }

        calendarGrid.appendChild(dayCell);
    }
}

// Обработчик сохранения заметки
document.getElementById('save-note').addEventListener('click', () => {
    if (selectedDateKey) {
        const noteText = document.getElementById('note-input').value.trim();
        const subjectValue = document.getElementById('subject-select').value;
        const priorityValue = document.getElementById('priority-select').value;
        
        if (noteText) {
            // Проверяем, выбран ли приоритет
            if (!priorityValue) {
                alert('Пожалуйста, выберите приоритет для заметки');
                return;
            }
            
            // Инициализируем массив для этой даты, если его нет
            if (!notes[selectedDateKey]) {
                notes[selectedDateKey] = [];
            }
            
            // Проверяем лимит
            if (notes[selectedDateKey].length >= 5) {
                alert('Нельзя добавить больше 5 заметок на одну дату');
                return;
            }
            
            // Добавляем новую заметку
            notes[selectedDateKey].push({
                text: noteText,
                subject: subjectValue,
                priority: priorityValue,
                timestamp: new Date().toISOString()
            });
            
            saveNotes();
            updateNotesDisplay();
            renderCalendar();
            updateStatistics();
            updateStatsIcons();
        }
    }
});

// Обработчик очистки всех заметок
document.getElementById('clear-notes').addEventListener('click', function() {
    if (selectedDateKey && notes[selectedDateKey]) {
        if (confirm('Удалить все заметки для этой даты?')) {
            delete notes[selectedDateKey];
            saveNotes();
            updateNotesDisplay();
            renderCalendar();
            updateStatistics();
            updateStatsIcons();
        }
    }
});

// Обработчики кнопок навигации
document.getElementById('prev').addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar();
});

document.getElementById('next').addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar();
});

// Обработчик переключения темы
document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

// Обработчики сортировки
document.getElementById('sort-time').addEventListener('click', function() {
    sortByPriority = false;
    document.getElementById('sort-time').classList.add('active');
    document.getElementById('sort-priority').classList.remove('active');
    updateNotesDisplay();
});

document.getElementById('sort-priority').addEventListener('click', function() {
    sortByPriority = true;
    document.getElementById('sort-priority').classList.add('active');
    document.getElementById('sort-time').classList.remove('active');
    updateNotesDisplay();
});

// ==================== ФУНКЦИИ СТАТИСТИКИ ====================

// Функция расчета статистики
function calculateStatistics() {
    let totalNotes = 0;
    let highPriorityCount = 0;
    let daysWithNotes = 0;
    const subjectsCount = {};
    const monthlyActivity = {};
    const priorityCount = { low: 0, medium: 0, high: 0 };
    
    // Проходим по всем заметкам
    Object.keys(notes).forEach(dateKey => {
        const dateNotes = notes[dateKey];
        if (dateNotes && dateNotes.length > 0) {
            daysWithNotes++;
            totalNotes += dateNotes.length;
            
            // Считаем по месяцам (для активности)
            const [day, month, year] = dateKey.split('.');
            const monthKey = `${month}.${year}`;
            monthlyActivity[monthKey] = (monthlyActivity[monthKey] || 0) + dateNotes.length;
            
            // Считаем по заметкам
            dateNotes.forEach(note => {
                // Приоритеты
                if (note.priority) {
                    priorityCount[note.priority] = (priorityCount[note.priority] || 0) + 1;
                    if (note.priority === 'high') highPriorityCount++;
                }
                
                // Предметы
                if (note.subject) {
                    subjectsCount[note.subject] = (subjectsCount[note.subject] || 0) + 1;
                }
            });
        }
    });
    
    // Обновляем основные показатели
    document.getElementById('total-notes').textContent = totalNotes;
    document.getElementById('high-priority').textContent = highPriorityCount;
    document.getElementById('days-with-notes').textContent = daysWithNotes;
    document.getElementById('subjects-count').textContent = Object.keys(subjectsCount).length;
    
    // Сохраняем данные для графиков
    window.statsData = {
        totalNotes,
        highPriorityCount,
        daysWithNotes,
        subjectsCount,
        monthlyActivity,
        priorityCount
    };
}

// Функция обновления графиков
function updateCharts() {
    if (!window.statsData || window.statsData.totalNotes === 0) {
        // Если нет данных
        document.getElementById('subjects-chart').innerHTML = '<div class="no-stats">Нет данных для отображения</div>';
        document.getElementById('priority-chart').innerHTML = '<div class="no-stats">Нет данных для отображения</div>';
        document.getElementById('activity-chart').innerHTML = '<div class="no-stats">Нет данных для отображения</div>';
        return;
    }
    
    const data = window.statsData;
    
    // График по предметам
    updateSubjectsChart(data.subjectsCount);
    
    // График по приоритетам
    updatePriorityChart(data.priorityCount);
    
    // График активности по месяцам
    updateActivityChart(data.monthlyActivity);
}

// Обновление графика предметов
function updateSubjectsChart(subjectsCount) {
    const subjectsChart = document.getElementById('subjects-chart');
    const totalNotes = window.statsData.totalNotes;
    
    if (Object.keys(subjectsCount).length === 0) {
        subjectsChart.innerHTML = '<div class="no-stats">Нет заметок с предметами</div>';
        return;
    }
    
    // Цвета для предметов
    const subjectColors = {
        'русский': '#FF6B6B',
        'литература': '#4ECDC4',
        'история': '#FFD166',
        'математика': '#06D6A0',
        'информатика': '#118AB2',
        'биология': '#073B4C',
        'физика': '#EF476F',
        'химия': '#7209B7',
        'география': '#3A86FF',
        'обществознание': '#FB5607'
    };
    
    // Сортируем по количеству (по убыванию)
    const sortedSubjects = Object.entries(subjectsCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8); // Берем топ-8
    
    let chartHTML = '';
    
    sortedSubjects.forEach(([subject, count]) => {
        const percentage = totalNotes > 0 ? Math.round((count / totalNotes) * 100) : 0;
        const subjectName = getSubjectName(subject);
        const color = subjectColors[subject] || '#666666';
        
        chartHTML += `
            <div class="chart-item">
                <div class="chart-label">
                    <div class="chart-color" style="background-color: ${color}"></div>
                    <span>${subjectName}</span>
                </div>
                <div class="chart-bar">
                    <div class="chart-fill" style="width: ${percentage}%; background-color: ${color}"></div>
                </div>
                <div class="chart-value">${count}</div>
            </div>
        `;
    });
    
    subjectsChart.innerHTML = chartHTML;
}

// Обновление графика приоритетов
function updatePriorityChart(priorityCount) {
    const priorityChart = document.getElementById('priority-chart');
    const totalNotes = window.statsData.totalNotes;
    
    if (totalNotes === 0) {
        priorityChart.innerHTML = '<div class="no-stats">Нет заметок</div>';
        return;
    }
    
    // Цвета для приоритетов
    const priorityColors = {
        'high': 'var(--priority-high)',
        'medium': 'var(--priority-medium)',
        'low': 'var(--priority-low)'
    };
    
    const priorityNames = {
        'high': 'Высокий',
        'medium': 'Средний',
        'low': 'Низкий'
    };
    
    let chartHTML = '';
    
    // Порядок: высокий, средний, низкий
    const order = ['high', 'medium', 'low'];
    
    order.forEach(priority => {
        const count = priorityCount[priority] || 0;
        if (count > 0) {
            const percentage = totalNotes > 0 ? Math.round((count / totalNotes) * 100) : 0;
            const color = priorityColors[priority];
            const name = priorityNames[priority];
            
            chartHTML += `
                <div class="chart-item">
                    <div class="chart-label">
                        <div class="chart-color" style="background-color: ${color}"></div>
                        <span>${name}</span>
                    </div>
                    <div class="chart-bar">
                        <div class="chart-fill" style="width: ${percentage}%; background-color: ${color}"></div>
                    </div>
                    <div class="chart-value">${count}</div>
                </div>
            `;
        }
    });
    
    if (chartHTML === '') {
        chartHTML = '<div class="no-stats">Нет заметок с приоритетами</div>';
    }
    
    priorityChart.innerHTML = chartHTML;
}

// Обновление графика активности по месяцам
function updateActivityChart(monthlyActivity) {
    const activityChart = document.getElementById('activity-chart');
    
    if (Object.keys(monthlyActivity).length === 0) {
        activityChart.innerHTML = '<div class="no-stats">Нет данных по месяцам</div>';
        return;
    }
    
    // Названия месяцев
    const monthNames = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    
    // Сортируем месяцы
    const sortedMonths = Object.entries(monthlyActivity)
        .sort(([monthA], [monthB]) => {
            const [m1, y1] = monthA.split('.').map(Number);
            const [m2, y2] = monthB.split('.').map(Number);
            return y1 !== y2 ? y1 - y2 : m1 - m2;
        });
    
    // Находим максимальное значение для масштабирования
    const maxValue = Math.max(...Object.values(monthlyActivity));
    
    let chartHTML = '';
    
    sortedMonths.forEach(([monthKey, count]) => {
        const [monthNum, year] = monthKey.split('.').map(Number);
        const monthName = monthNames[monthNum - 1] || `Месяц ${monthNum}`;
        const percentage = maxValue > 0 ? Math.round((count / maxValue) * 100) : 0;
        
        chartHTML += `
            <div class="activity-bar">
                <div class="activity-month">${monthName} ${year}</div>
                <div class="activity-track">
                    <div class="activity-fill" style="width: ${percentage}%">
                        <span class="activity-count">${count}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    activityChart.innerHTML = chartHTML;
}

// Функция обновления статистики
function updateStatistics() {
    calculateStatistics();
    updateCharts();
}

// Функция обновления иконок статистики
function updateStatsIcons() {
    const statsValues = document.querySelectorAll('.stats-value');
    
    // Анимация обновления значений
    statsValues.forEach(element => {
        element.style.transform = 'scale(1.1)';
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 300);
    });
}

// Обработчик кнопки обновления статистики
document.getElementById('refresh-stats').addEventListener('click', function() {
    updateStatistics();
    updateStatsIcons();
    
    // Анимация кнопки
    const icon = this.querySelector('i');
    icon.style.transform = 'rotate(360deg)';
    icon.style.transition = 'transform 0.5s ease';
    
    setTimeout(() => {
        icon.style.transform = 'rotate(0deg)';
    }, 500);
});

// Загружаем заметки, тему и запускаем отрисовку при загрузке страницы
window.onload = function() {
    loadTheme();
    loadNotes();
    renderCalendar();
    updateStatistics();
    
    // Устанавливаем текущую дату как выбранную по умолчанию
    const today = new Date();
    if (today.getFullYear() === 2026) {
        selectedDateKey = formatDateKey(today.getDate(), today.getMonth(), today.getFullYear());
        updateNotesDisplay();
    }
    
    // Показываем статистику при загрузке
    setTimeout(() => {
        updateStatsIcons();
    }, 1000);
};
