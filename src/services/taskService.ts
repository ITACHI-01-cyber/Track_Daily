// API service for communicating with the backend
import axios, { AxiosInstance, AxiosError } from 'axios';

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
  private api: AxiosInstance;
  private baseURL: string = 'http://localhost:8080/api/tasks';

  constructor() {
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get all tasks
   */
  async getAllTasks(): Promise<Task[]> {
    try {
      const response = await this.api.get<Task[]>('/');
      return response.data;
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
      const response = await this.api.get<Task>(`/${id}`);
      return response.data;
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
      const response = await this.api.post<Task>('/', task);
      return response.data;
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
      const response = await this.api.put<Task>(`/${id}`, task);
      return response.data;
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
      await this.api.delete(`/${id}`);
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
      await this.api.delete('/');
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
      const response = await this.api.get<Task[]>('/filter/completed', {
        params: { completed },
      });
      return response.data;
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
      const response = await this.api.get<Task[]>('/filter/priority', {
        params: { priority },
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Handle errors
   */
  private handleError(error: unknown): void {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('API Error:', {
        status: axiosError.response?.status,
        message: axiosError.response?.statusText,
        data: axiosError.response?.data,
      });
    } else {
      console.error('Error:', error);
    }
  }
}

export default new TaskService();
