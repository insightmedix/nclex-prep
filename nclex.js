// Wait for the DOM to be fully loaded before attaching event listeners
document.addEventListener('DOMContentLoaded', function() {
  // Get all day containers
  const dayContainers = document.querySelectorAll('.day');

  // Add click event listeners to day containers
  dayContainers.forEach(function(dayContainer) {
    dayContainer.addEventListener('click', function() {
      const tasks = this.querySelector('.tasks');
      if (tasks.style.display === 'block') {
        tasks.style.display = 'none';
        this.classList.remove('expanded');
      } else {
        tasks.style.display = 'block';
        this.classList.add('expanded');
      }
    });
  });

  // Get all checkboxes
  const checkboxes = document.querySelectorAll('.checkbox');

  // Prevent checkbox clicks from triggering the day container toggle
  checkboxes.forEach(function(checkbox) {
    checkbox.addEventListener('click', function(e) {
      e.stopPropagation();
    });
  });

  // Load saved checkbox states and add change listeners
  checkboxes.forEach(function(checkbox, index) {
    const saved = localStorage.getItem('task_' + index);
    if (saved === 'true') {
      checkbox.checked = true;
      checkbox.closest('.task').classList.add('completed');
    }

    checkbox.addEventListener('change', function() {
      if (this.checked) {
        this.closest('.task').classList.add('completed');
      } else {
        this.closest('.task').classList.remove('completed');
      }
      localStorage.setItem('task_' + index, this.checked);
      updateProgress();
    });
  });

  // Tab navigation
  const navTabs = document.querySelectorAll('.nav-tab');
  navTabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      navTabs.forEach(function(t) {
        t.classList.remove('active');
      });
      this.classList.add('active');

      document.querySelectorAll('.tab-content').forEach(function(content) {
        content.classList.remove('active');
      });
      const tabId = this.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });

  // Settings checkboxes
  const notificationsCheckbox = document.getElementById('notifications-enabled');
  const reminderCheckbox = document.getElementById('reminder-enabled');
  const darkModeCheckbox = document.getElementById('dark-mode');
  const autoExpandCheckbox = document.getElementById('auto-expand');

  // Load settings from localStorage
  notificationsCheckbox.checked = localStorage.getItem('notifications-enabled') === 'true';
  reminderCheckbox.checked = localStorage.getItem('reminder-enabled') === 'true';
  darkModeCheckbox.checked = localStorage.getItem('dark-mode') === 'true';
  autoExpandCheckbox.checked = localStorage.getItem('auto-expand') === 'true';

  notificationsCheckbox.addEventListener('change', function() {
    localStorage.setItem('notifications-enabled', this.checked);
    if (this.checked && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  });

  reminderCheckbox.addEventListener('change', function() {
    localStorage.setItem('reminder-enabled', this.checked);
  });

  darkModeCheckbox.addEventListener('change', function() {
    localStorage.setItem('dark-mode', this.checked);
    document.body.classList.toggle('dark-mode', this.checked);
  });

  autoExpandCheckbox.addEventListener('change', function() {
    localStorage.setItem('auto-expand', this.checked);
    if (this.checked) {
      document.querySelector('.today .tasks').style.display = 'block';
      document.querySelector('.today').classList.add('expanded');
    }
  });

  // Auto-expand today's schedule if enabled
  if (autoExpandCheckbox.checked) {
    document.querySelector('.today .tasks').style.display = 'block';
    document.querySelector('.today').classList.add('expanded');
  }

  // Apply dark mode if enabled
  if (darkModeCheckbox.checked) {
    document.body.classList.add('dark-mode');
  }

  // Initial progress update
  updateProgress();

  // Request notification permission if enabled
  if (notificationsCheckbox.checked && Notification.permission !== 'granted') {
    Notification.requestPermission();
  }
});

// Calculate and update progress
function updateProgress() {
  // Today's progress
  const todayTasks = document.querySelector('.today').querySelectorAll('.checkbox');
  const todayCompleted = Array.from(todayTasks).filter(cb => cb.checked).length;
  const todayTotal = todayTasks.length;
  const todayPercent = todayTotal > 0 ? (todayCompleted / todayTotal) * 100 : 0;

  document.getElementById('today-progress').style.width = todayPercent + '%';
  document.getElementById('tasks-completed').textContent = `${todayCompleted}/${todayTotal} Tasks`;

  // Calculate hours completed for today
  let todayHours = 0;
  document.querySelector('.today').querySelectorAll('.task').forEach(task => {
    const checkbox = task.querySelector('.checkbox');
    if (checkbox.checked) {
      const timeText = task.querySelector('.time').textContent;
      const timeMatch = timeText.match(/(\d+):(\d+)([AP]M)\s*-\s*(\d+):(\d+)([AP]M)/i);
      if (timeMatch) {
        let start = parseInt(timeMatch[1]);
        const startMin = parseInt(timeMatch[2]);
        const startPeriod = timeMatch[3];
        let end = parseInt(timeMatch[4]);
        const endMin = parseInt(timeMatch[5]);
        const endPeriod = timeMatch[6];

        if (startPeriod === 'PM' && start !== 12) start += 12;
        if (startPeriod === 'AM' && start === 12) start = 0;
        if (endPeriod === 'PM' && end !== 12) end += 12;
        if (endPeriod === 'AM' && end === 12) end = 0;

        todayHours += (end + endMin / 60) - (start + startMin / 60);
      }
    }
  });

  document.getElementById('time-today').textContent = `${todayHours.toFixed(1)} hours`;

  // Weekly progress
  const allTasks = document.querySelectorAll('.checkbox');
  const allCompleted = Array.from(allTasks).filter(cb => cb.checked).length;
  const allTotal = allTasks.length;
  const weeklyPercent = allTotal > 0 ? (allCompleted / allTotal) * 100 : 0;

  document.getElementById('weekly-progress').style.width = weeklyPercent + '%';
  document.getElementById('weekly-tasks-completed').textContent = `${allCompleted}/${allTotal} Tasks`;

  // Required vs optional tasks
  const requiredTasks = document.querySelectorAll('.task:not(.optional) .checkbox');
  const requiredCompleted = Array.from(requiredTasks).filter(cb => cb.checked).length;
  document.getElementById('required-completed').textContent = `${requiredCompleted}/${requiredTasks.length}`;

  const optionalTasks = document.querySelectorAll('.task.optional .checkbox');
  const optionalCompleted = Array.from(optionalTasks).filter(cb => cb.checked).length;
  document.getElementById('optional-completed').textContent = `${optionalCompleted}/${optionalTasks.length}`;

  // Total study hours
  let totalHours = 0;
  document.querySelectorAll('.task').forEach(task => {
    const checkbox = task.querySelector('.checkbox');
    if (checkbox.checked) {
      const timeText = task.querySelector('.time').textContent;
      const timeMatch = timeText.match(/(\d+):(\d+)([AP]M)\s*-\s*(\d+):(\d+)([AP]M)/i);
      if (timeMatch) {
        let start = parseInt(timeMatch[1]);
        const startMin = parseInt(timeMatch[2]);
        const startPeriod = timeMatch[3];
        let end = parseInt(timeMatch[4]);
        const endMin = parseInt(timeMatch[5]);
        const endPeriod = timeMatch[6];

        if (startPeriod === 'PM' && start !== 12) start += 12;
        if (startPeriod === 'AM' && start === 12) start = 0;
        if (endPeriod === 'PM' && end !== 12) end += 12;
        if (endPeriod === 'AM' && end === 12) end = 0;

        totalHours += (end + endMin / 60) - (start + startMin / 60);
      }
    }
  });

  document.getElementById('total-hours').textContent = `${totalHours.toFixed(1)}`;
  document.getElementById('weekly-time').textContent = `${totalHours.toFixed(1)} hours`;
}
