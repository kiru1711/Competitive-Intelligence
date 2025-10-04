import { useState, useEffect } from 'react';
import { Plus, Clock, Trash2 } from 'lucide-react';
import { supabase, Todo } from '../lib/supabase';

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching todos:', error);
    } else if (data) {
      const sortedTodos = sortTodosByPriority(data);
      setTodos(sortedTodos);
    }
  };

  const sortTodosByPriority = (todosArray: Todo[]) => {
    return [...todosArray].sort((a, b) => {
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;

      if (!a.completed && !b.completed) {
        if (a.reminder_days === null && b.reminder_days === null) return 0;
        if (a.reminder_days === null) return 1;
        if (b.reminder_days === null) return -1;
        return a.reminder_days - b.reminder_days;
      }

      return 0;
    });
  };

  const addTodo = async () => {
    if (!newTask.trim()) return;

    const { error } = await supabase
      .from('todos')
      .insert([{ task: newTask.trim(), completed: false }]);

    if (error) {
      console.error('Error adding todo:', error);
    } else {
      setNewTask('');
      fetchTodos();
    }
  };

  const toggleTodo = async (id: string, completed: boolean) => {
    const { error } = await supabase
      .from('todos')
      .update({ completed: !completed })
      .eq('id', id);

    if (error) {
      console.error('Error updating todo:', error);
    } else {
      fetchTodos();
    }
  };

  const updateReminderDays = async (id: string, days: number | null) => {
    const { error } = await supabase
      .from('todos')
      .update({ reminder_days: days })
      .eq('id', id);

    if (error) {
      console.error('Error updating reminder:', error);
    } else {
      fetchTodos();
    }
  };

  const deleteTodo = async (id: string) => {
    const { error } = await supabase.from('todos').delete().eq('id', id);

    if (error) {
      console.error('Error deleting todo:', error);
    } else {
      fetchTodos();
    }
  };

  const getDueStatus = (todo: Todo) => {
    if (!todo.reminder_days || todo.completed) return null;

    if (todo.reminder_days < 0) {
      return { text: 'OVERDUE', color: 'text-red-600', borderColor: 'border-red-500' };
    } else if (todo.reminder_days === 0) {
      return { text: 'DUE TODAY', color: 'text-red-500', borderColor: 'border-red-500' };
    } else if (todo.reminder_days === 1) {
      return { text: 'Due in 1 day', color: 'text-orange-500', borderColor: 'border-orange-500' };
    } else if (todo.reminder_days === 2) {
      return { text: 'Due in 2 days', color: 'text-yellow-500', borderColor: 'border-yellow-500' };
    }
    return { text: `Due in ${todo.reminder_days} days`, color: 'text-gray-400', borderColor: 'border-gray-700' };
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Action Items</h1>

      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTodo()}
            placeholder="Add a new task..."
            className="flex-1 bg-gray-900 text-white px-4 py-3 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
          />
          <button
            onClick={addTodo}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded transition-colors"
          >
            <Plus size={20} />
            <span>Add</span>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {todos.map((todo) => {
          const dueStatus = getDueStatus(todo);
          return (
            <div
              key={todo.id}
              className={`bg-gray-800 rounded-lg p-5 border-2 transition-all ${
                dueStatus ? dueStatus.borderColor : 'border-gray-700'
              } ${
                dueStatus && dueStatus.borderColor !== 'border-gray-700'
                  ? 'shadow-lg'
                  : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id, todo.completed)}
                  className="mt-1 w-5 h-5 rounded border-gray-600 bg-gray-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                />

                <div className="flex-1">
                  <p
                    className={`text-white text-lg ${
                      todo.completed ? 'line-through text-gray-500' : ''
                    }`}
                  >
                    {todo.task}
                  </p>

                  <div className="flex items-center gap-3 mt-3">
                    <Clock size={16} className="text-gray-400" />
                    <span className="text-gray-400 text-sm">Reminder:</span>
                    <input
                      type="number"
                      value={todo.reminder_days !== null ? todo.reminder_days : ''}
                      onChange={(e) =>
                        updateReminderDays(
                          todo.id,
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                      placeholder="Days"
                      className="w-20 bg-gray-900 text-white px-3 py-1 rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
                    />
                    <span className="text-gray-400 text-sm">days</span>

                    {dueStatus && dueStatus.text && (
                      <span className={`ml-auto ${dueStatus.color} text-sm font-medium flex items-center gap-1`}>
                        {(dueStatus.borderColor === 'border-red-500' || dueStatus.borderColor === 'border-red-600') && (
                          <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        )}
                        {dueStatus.text}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-gray-700 rounded"
                  title="Delete task"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {todos.length === 0 && (
        <div className="bg-gray-800 rounded-lg p-12 border border-gray-700 text-center">
          <p className="text-gray-400">No tasks yet. Add your first action item above.</p>
        </div>
      )}
    </div>
  );
}
