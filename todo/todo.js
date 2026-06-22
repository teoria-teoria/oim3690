// Tasks - a small vanilla-JS to-do app for OIM3690.
// State lives in `tasks` and is mirrored to localStorage on every change.

const STORAGE_KEY = 'oim3690.tasks';

// In-memory state.
let tasks = [];
let filter = 'all'; // all | active | completed

// Counter to break ties when two tasks are created in the same millisecond.
let idCounter = 0;

// DOM references.
const form = document.getElementById('add-form');
const input = document.getElementById('task-input');
const prioritySelect = document.getElementById('priority-select');
const list = document.getElementById('list');
const countEl = document.getElementById('count');
const filtersEl = document.getElementById('filters');
const clearBtn = document.getElementById('clear-completed');

function makeId() {
  // Stable, unique-enough id without relying on crypto being present.
  return Date.now().toString(36) + '-' + (idCounter++).toString(36);
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      tasks = parsed.filter(t => t && typeof t.id === 'string' && typeof t.text === 'string');
    }
  } catch (err) {
    // Corrupt storage shouldn't take down the app; start clean.
    console.warn('Could not load saved tasks:', err);
    tasks = [];
  }
}

function visibleTasks() {
  if (filter === 'active') return tasks.filter(t => !t.done);
  if (filter === 'completed') return tasks.filter(t => t.done);
  return tasks;
}

function render() {
  list.innerHTML = '';

  const visible = visibleTasks();

  if (visible.length === 0) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = tasks.length === 0 ? 'Nothing here yet.' : 'No tasks in this view.';
    list.appendChild(li);
  } else {
    for (const task of visible) {
      list.appendChild(renderTask(task));
    }
  }

  // Counter: count tasks still to do, with correct singular/plural.
  const remaining = tasks.filter(t => !t.done).length;
  countEl.textContent = remaining + (remaining === 1 ? ' task remaining' : ' tasks remaining');

  // Disable "clear completed" when there's nothing to clear.
  clearBtn.disabled = !tasks.some(t => t.done);
}

function renderTask(task) {
  const li = document.createElement('li');
  li.dataset.id = task.id;
  if (task.done) li.classList.add('done');

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = task.done;
  checkbox.dataset.action = 'toggle';
  checkbox.setAttribute('aria-label', 'Mark complete');

  const dot = document.createElement('span');
  dot.className = 'dot ' + task.priority;
  dot.title = task.priority + ' priority';

  const text = document.createElement('span');
  text.className = 'text';
  text.textContent = task.text;

  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'del';
  del.dataset.action = 'delete';
  del.setAttribute('aria-label', 'Delete task');
  del.textContent = '×'; // ×

  li.append(checkbox, dot, text, del);
  return li;
}

function addTask(text, priority) {
  tasks.unshift({
    id: makeId(),
    text: text,
    priority: priority,
    done: false,
  });
  save();
  render();
}

function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.done = !task.done;
  save();
  render();
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  save();
  render();
}

function clearCompleted() {
  tasks = tasks.filter(t => !t.done);
  save();
  render();
}

function setFilter(next) {
  filter = next;
  for (const btn of filtersEl.querySelectorAll('.filter')) {
    btn.classList.toggle('active', btn.dataset.filter === next);
  }
  render();
}

// Add via submit (covers both the Add button and the Enter key).
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  addTask(text, prioritySelect.value);
  input.value = '';
  input.focus();
});

// Event delegation: one listener on the <ul> handles every row's
// checkbox toggle and delete button, keyed off the row's data-id.
list.addEventListener('click', (e) => {
  const action = e.target.dataset.action;
  if (!action) return;
  const li = e.target.closest('li');
  if (!li) return;
  const id = li.dataset.id;

  if (action === 'toggle') {
    toggleTask(id);
  } else if (action === 'delete') {
    deleteTask(id);
  }
});

// Filter buttons, also delegated.
filtersEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.filter');
  if (!btn) return;
  setFilter(btn.dataset.filter);
});

clearBtn.addEventListener('click', clearCompleted);

function init() {
  load();
  render();
}

// The script tag sits at the end of <body>, so the DOM may already be parsed.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
