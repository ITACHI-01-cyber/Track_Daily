// API service for communicating with the backend
export interface Task {
  id?: string;
  title: string;
  description: string;
  completed: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

class TaskService {
  private baseURL: string = 'http://localhost:8080/api/tasks';

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseURL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  /**
   * Get all tasks
   */
  async getAllTasks(): Promise<Task[]> {
    try {
      return await this.request<Task[]>('/');
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Get a specific task by ID
   */
  async getTaskById(id: string): Promise<Task> {
    try {
      return await this.request<Task>(`/${id}`);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Create a new task
   */
  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    try {
      return await this.request<Task>('/', {
        method: 'POST',
        body: JSON.stringify(task),
      });
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Update a task
   */
  async updateTask(id: string, task: Partial<Task>): Promise<Task> {
    try {
      return await this.request<Task>(`/${id}`, {
        method: 'PUT',
        body: JSON.stringify(task),
      });
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Delete a specific task
   */
  async deleteTask(id: string): Promise<void> {
    try {
      await this.request<void>(`/${id}`, { method: 'DELETE' });
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Delete all tasks
   */
  async deleteAllTasks(): Promise<void> {
    try {
      await this.request<void>('/', { method: 'DELETE' });
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Get tasks filtered by completion status
   */
  async getTasksByCompleted(completed: boolean): Promise<Task[]> {
    try {
      return await this.request<Task[]>(`/filter/completed?completed=${completed}`);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Get tasks filtered by priority
   */
  async getTasksByPriority(priority: 'LOW' | 'MEDIUM' | 'HIGH'): Promise<Task[]> {
    try {
      return await this.request<Task[]>(`/filter/priority?priority=${encodeURIComponent(priority)}`);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Handle errors
   */
  private handleError(error: unknown): void {
    console.error('Error:', error);
  }
}

export default new TaskService();
