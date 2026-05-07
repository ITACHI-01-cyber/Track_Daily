
# Habit Tracker & Personal Planner

A comprehensive personal planner and habit tracker by mrvbfit, built with a modern tech stack. This application features day, week, and month views, integrated habit tracking with streaks, customizable themes, and offline support, all synced to a MongoDB database.

<div align="center">

## 🚀 [Live Demo](https://habittrackerfordaily.vercel.app/)

</div>

## ✨ Features

- **Dynamic Calendar Views**: Seamlessly switch between Day, Week, and Month views to manage your schedule.
- **Habit Matrix**: A powerful grid view to visualize your habit consistency across the week.
- **Advanced Habit Tracking**: Track both positive (to-do) and negative (to-avoid) habits.
- **Streak System**: Stay motivated by building and maintaining streaks for your positive habits.
- **Task Management**: Add, edit, and complete daily tasks with priorities and due dates.
- **Data Analytics**: Visualize your progress with a habit performance score chart and unlock achievements.
- **Customization**: Personalize your experience with multiple color themes and custom background images.
- **Offline-First**: Your data is saved locally for offline access and syncs automatically to MongoDB when you're back online.
- **Data Portability**: Easily import and export your entire dataset as a JSON file.
- **AI-Powered Ideas**: Generate creative UX/UI feature ideas directly within the app using the Gemini API.
- **Responsive Design**: A beautiful and functional interface on both desktop and mobile devices.

## 📸 Screenshots

*(These are placeholders. Please replace them with actual screenshots from the live application.)*

| Day View | Analytics | Settings |
| :---: | :---: | :---: |
| ![Day View](https://via.placeholder.com/400x250.png?text=Day+View) | ![Analytics](https://via.placeholder.com/400x250.png?text=Analytics) | ![Settings](https://via.placeholder.com/400x250.png?text=Settings) |
| **Month View** | **Habit Manager** | **Mobile View** |
| ![Month View](https://via.placeholder.com/400x250.png?text=Month+View) | ![Habit Manager](https://via.placeholder.com/400x250.png?text=Habit+Manager) | ![Mobile View](https://via.placeholder.com/400x250.png?text=Mobile+View) |

## 🛠️ Tech Stack

- **Frontend**: React, Vite, TypeScript, Tailwind CSS
- **Backend**: Spring Boot, Java 17, Maven
- **Database**: MongoDB
- **Key Libraries**:
  - `lucide-react` for icons
  - `date-fns` for date manipulation
  - `recharts` for charts
  - `motion` for animations
  - `@google/genai` for AI features
  - `spring-boot-starter-data-mongodb`
  - `lombok`

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Java 17 or higher
- Maven 3.6+
- Node.js (v18 or later recommended)
- A MongoDB Atlas account.
- A Gemini API Key from Google.

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/mrvbfit/Task-manager-with-habit.git
    cd Task-manager-with-habit
    ```

3.  **Set up environment variables:**
    Create a file named `.env` in the root of your project and add the following variables. This file will be used by the Spring Boot backend.

    ```env
    # Your connection string from MongoDB Atlas
    MONGODB_URI="mongodb+srv://<user>:<password>@<cluster>/?appName=<app>"
    MONGODB_DATABASE="habit-track"

    # Your API key from Google for Gemini
    GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
    ```

4.  **Install frontend dependencies:**
    ```bash
    npm install
    ```

5.  **Run the Backend Server:**
    Open a new terminal and navigate to the `backend` directory.
    ```bash
    cd backend
    mvn spring-boot:run
    ```
    The backend will start at `http://localhost:8080`.

6.  **Run the Frontend Development Server:**
    In the root directory of the project, run:
    ```bash
    npm run dev
    ```
    Open http://localhost:5173 (or the port shown in the terminal) to view it in your browser.

## 📜 License

This project is licensed under the MIT License - see the LICENSE.md file for details.
