// src/pages/TodosPage.tsx

import React, { useState, useEffect } from 'react';

// Define the shape of a Task object, now including reminder_days
interface Task {
  id: number;
  task: string;
  is_completed: boolean;
  reminder_days: number | null;
  created_at: string;
}

const TodosPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // --- Data Fetching & Sorting ---
  const fetchTasks = () => {
    fetch('http://127.0.0.1:5000/api/tasks')
      .then(res => res.json())
      .then(data => {
        // Sort the tasks: incomplete first, then by reminder days
        const sortedTasks = [...data].sort((a, b) => {
            if (a.is_completed && !b.is_completed) return 1;
            if (!a.is_completed && b.is_completed) return -1;
            if (!a.is_completed && !b.is_completed) {
                if (a.reminder_days === null) return 1;
                if (b.reminder_days === null) return -1;
                return a.reminder_days - b.reminder_days;
            }
            return 0;
        });
        setTasks(sortedTasks);
        setIsLoading(false);
      })
      .catch(error => console.error("Error fetching tasks:", error));
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // --- API Handlers ---
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    fetch('http://127.0.0.1:5000/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: newTask }),
    }).then(() => {
      setNewTask('');
      fetchTasks(); // Refetch to get the correctly sorted list
    });
  };

  const handleToggleComplete = (id: number, currentStatus: boolean) => {
    fetch(`http://127.0.0.1:5000/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_completed: !currentStatus }),
    }).then(() => fetchTasks()); // Refetch to re-sort the list
  };
  
  const handleUpdateReminder = (id: number, days: string) => {
    const numDays = days === '' ? null : Number(days);
    fetch(`http://127.0.0.1:5000/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reminder_days: numDays }),
    }).then(() => fetchTasks()); // Refetch to re-sort the list
  };

  const handleDeleteTask = (id: number) => {
    fetch(`http://127.0.0.1:5000/api/tasks/${id}`, { method: 'DELETE' })
      .then(res => { if (res.ok) { fetchTasks(); } });
  };

  // --- UI Helper for Due Status ---
  const getDueStatus = (task: Task) => {
    if (task.reminder_days === null || task.is_completed) return null;
    const days = task.reminder_days;
    if (days < 0) return { text: 'Overdue', color: 'text-red-400', borderColor: 'border-red-500' };
    if (days === 0) return { text: 'Due Today', color: 'text-red-400', borderColor: 'border-red-500' };
    if (days === 1) return { text: 'Due in 1 day', color: 'text-orange-400', borderColor: 'border-orange-500' };
    return { text: `Due in ${days} days`, color: 'text-gray-400', borderColor: 'border-gray-700' };
  };

  // --- Render ---
  return (
    <div className="p-8 text-white max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Action Items</h1>
      <form onSubmit={handleAddTask} className="flex items-center gap-4 mb-8">
        <input type="text" value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Add a new action item..." className="bg-gray-700 border border-gray-600 rounded-md p-2 w-full text-white flex-grow" required />
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md">Add Task</button>
      </form>
      <div className="space-y-4">
        {tasks.map(task => {
          const dueStatus = getDueStatus(task);
          return (
            <div key={task.id} className={`bg-gray-800 p-4 rounded-lg flex items-center border-2 transition-colors ${dueStatus ? dueStatus.borderColor : 'border-gray-700'} ${task.is_completed ? 'opacity-50' : ''}`}>
              <input type="checkbox" checked={task.is_completed} onChange={() => handleToggleComplete(task.id, task.is_completed)} className="w-6 h-6 bg-gray-700 border-gray-600 rounded text-blue-500 focus:ring-blue-600" />
              <div className="ml-4 flex-grow">
                <span className={`text-lg ${task.is_completed ? 'line-through text-gray-500' : 'text-gray-300'}`}>{task.task}</span>
                <div className="flex items-center gap-2 mt-2">
                    <span className="text-gray-400 text-sm">Reminder:</span>
                    <input type="number" value={task.reminder_days !== null ? task.reminder_days : ''} onChange={(e) => handleUpdateReminder(task.id, e.target.value)} placeholder="Days" className="w-20 bg-gray-900 text-white px-2 py-1 rounded border border-gray-600 text-sm" />
                    <span className="text-gray-400 text-sm">days</span>
                    {dueStatus && <span className={`ml-auto font-medium text-sm ${dueStatus.color}`}>{dueStatus.text}</span>}
                </div>
              </div>
              <button onClick={() => handleDeleteTask(task.id)} className="bg-gray-700 hover:bg-red-600 text-white font-bold py-1 px-3 rounded-md text-sm ml-4">Delete</button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TodosPage;