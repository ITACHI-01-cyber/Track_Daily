import { Task } from '../services/taskService';

interface TaskListProps {
  tasks: Task[];
  onToggle: (id: string, completed: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  loading?: boolean;
}

const priorityColors: Record<string, string> = {
  LOW: '#90EE90',
  MEDIUM: '#FFD700',
  HIGH: '#FF6B6B',
};

export function TaskList({ tasks, onToggle, onDelete, loading = false }: TaskListProps) {
  if (tasks.length === 0) {
    return <div className="empty-state">No tasks yet. Create one to get started!</div>;
  }

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
          <div className="task-header">
            <input
              type="checkbox"
              checked={task.completed}
              onChange={(e) => onToggle(task.id!, e.target.checked)}
              disabled={loading}
              className="task-checkbox"
            />
            <h3 className="task-title">{task.title}</h3>
            <span
              className="priority-badge"
              style={{ backgroundColor: priorityColors[task.priority] }}
            >
              {task.priority}
            </span>
          </div>

          {task.description && <p className="task-description">{task.description}</p>}

          <div className="task-meta">
            {task.dueDate && (
              <span className="due-date">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
            )}
            <span className="created-date">Created: {new Date(task.createdAt!).toLocaleDateString()}</span>
          </div>

          <button
            onClick={() => onDelete(task.id!)}
            disabled={loading}
            className="delete-btn"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
