# Quick Start Guide

## Prerequisites
- Java 17+
- Maven 3.6+
- Docker & Docker Compose (for MongoDB)
- Node.js 16+ (for frontend)

## Backend Setup

### Option 1: Using Docker Compose (Recommended)

1. Navigate to the backend directory:
```bash
cd /home/mrvbfit/Projects/habit-track-backend
```

2. Start MongoDB using Docker Compose:
```bash
docker-compose up -d
```

3. Build the Spring Boot application:
```bash
mvn clean package -DskipTests
```

4. Run the application:
```bash
mvn spring-boot:run
```

The API will be available at: **http://localhost:8080/api/tasks**

MongoDB Express UI: **http://localhost:8081**

### Option 2: Using Local MongoDB

1. Ensure MongoDB is running locally:
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

2. Build and run the Spring Boot app:
```bash
mvn clean package -DskipTests
mvn spring-boot:run
```

## Frontend Setup

### 1. Install Dependencies
```bash
cd /home/mrvbfit/Projects/habit-track
npm install axios
```

### 2. Copy the API Service
Copy the `FRONTEND_SERVICE.ts` file to your React project:
```bash
cp FRONTEND_SERVICE.ts ../habit-track/src/services/taskService.ts
```

### 3. Update Your React Component

Example usage in your React component:

```tsx
import taskService, { Task } from '../services/taskService';
import { useState, useEffect } from 'react';

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all tasks
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await taskService.getAllTasks();
      setTasks(data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (newTask: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const created = await taskService.createTask(newTask);
      setTasks([...tasks, created]);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    try {
      const updated = await taskService.updateTask(id, updates);
      setTasks(tasks.map(t => t.id === id ? updated : t));
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await taskService.deleteTask(id);
      setTasks(tasks.filter(t => t.id !== id));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Tasks</h2>
      <ul>
        {tasks.map(task => (
          <li key={task.id}>
            <strong>{task.title}</strong> - {task.priority}
            <button onClick={() => handleDeleteTask(task.id!)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Testing the API

### Using REST Client Extension (VS Code)

1. Install REST Client extension in VS Code
2. Open `requests.http` file
3. Click "Send Request" on any endpoint to test

### Using cURL

```bash
# Get all tasks
curl -X GET http://localhost:8080/api/tasks

# Create a task
curl -X POST http://localhost:8080/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Task",
    "description": "Task description",
    "completed": false,
    "priority": "HIGH",
    "dueDate": "2024-12-31T23:59:59"
  }'

# Update a task
curl -X PUT http://localhost:8080/api/tasks/{id} \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'

# Delete a task
curl -X DELETE http://localhost:8080/api/tasks/{id}
```

### Using Postman

1. Create a new collection
2. Add requests with:
   - URL: `http://localhost:8080/api/tasks`
   - Headers: `Content-Type: application/json`
   - Body (for POST/PUT): JSON task object

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `docker-compose ps`
- Check MongoDB logs: `docker-compose logs mongodb`
- Verify URI in `application.properties`

### CORS Error
- The backend is configured to allow requests from ports 5173, 3000, and 8080
- If frontend runs on different port, add it to `CorsConfig.java`

### Java Version Error
- Check Java version: `java -version`
- Need Java 17+. Update if necessary

### Port Already in Use
- Change `server.port` in `application.properties`
- Or kill process on port 8080: `lsof -ti:8080 | xargs kill -9`

## Production Deployment

### Environment Variables
Create `.env` file for production:
```
SPRING_DATA_MONGODB_URI=mongodb://user:pass@remote-host:27017/habit-track
SERVER_PORT=8080
```

### Build
```bash
mvn clean package
java -jar target/habit-track-backend-1.0.0.jar
```

### Docker
```bash
docker build -t habit-track-backend .
docker run -p 8080:8080 -e SPRING_DATA_MONGODB_URI=... habit-track-backend
```

## Useful Commands

```bash
# Stop MongoDB
docker-compose down

# View MongoDB logs
docker-compose logs -f mongodb

# Access MongoDB
docker exec -it habit-track-mongodb mongosh -u admin -p password

# Build without tests
mvn clean package -DskipTests

# View running processes
docker-compose ps

# Remove volumes and data
docker-compose down -v
```

## Next Steps

1. ✅ Backend is ready
2. Integrate frontend service in your React app
3. Update CORS settings if needed
4. Deploy to your hosting service

## Support

For issues or questions, check:
- Backend README.md
- Spring Boot documentation: https://spring.io/projects/spring-boot
- MongoDB documentation: https://docs.mongodb.com/
