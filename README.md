# Habit Tracker & Personal Planner

A comprehensive personal planner and habit tracker by mrvbfit, built with a modern tech stack. This application features day, week, and month views, integrated habit tracking with streaks, customizable themes, and offline support, all synced to a MongoDB database.

<div align="center">

## 🚀 [Live Web Demo](https://track-daily-git-main-itachi-01-cybers-projects.vercel.app/)

</div>
## 📱 Mobile App (APK)

We also offer a mobile application version of the Habit Tracker! 

[**⬇️ Download the Android APK Here**](https://drive.google.com/file/d/1L-RYsc0_xIEFHZjNoRqWqDMso3ed6Ym4/view?usp=sharing)

**How to Install:**
1. Download the `.apk` file to your Android device using the link above.
2. When the download finishes, click **"Open"** or find the file in your "Downloads" folder.
3. If prompted with *"For your security, your phone is not allowed to install unknown apps from this source,"* click **"Settings"** and toggle on **"Allow from this source"**.
4. Go back and click **"Install"**. Once completed, click **"Open"** to start tracking!

---

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

---

## 🛠️ Tech Stack & How It's Used

This project utilizes a modern full-stack architecture to ensure performance, scalability, and an excellent developer experience.

### Frontend
- **React 19 & Vite**: Provides a blazingly fast, component-based user interface. Vite ensures rapid hot-module reloading during development.
- **TypeScript**: Adds static typing to JavaScript, catching errors early and improving code maintainability.
- **Tailwind CSS v4**: A utility-first CSS framework used to quickly style components and create a responsive, modern aesthetic.
- **Framer Motion**: Used for fluid, interactive UI animations and transitions.
- **Recharts**: Powers the data analytics dashboard, rendering clean and interactive SVG charts for habit tracking.

### Backend
- **Spring Boot & Java 25**: Forms the robust, secure REST API that manages all business logic, data validation, and communication with the database.
- **Maven**: Handles backend dependency management and build processes.

### Database
- **MongoDB**: A flexible NoSQL database that stores all user habits, daily tasks, and streak history.

---

## 🚀 Getting Started (How to Clone & Run)

Follow these detailed steps to get a local copy of the project up and running on your machine for development and testing.

### 1. Prerequisites
Make sure you have the following installed on your computer:
- **Node.js** (v18 or later) & **npm**
- **Java Development Kit (JDK) 25**
- **Maven 3.6+**
- **Git**
- A **MongoDB Atlas** account (or local MongoDB server)
- A **Google Gemini API Key** (for AI features)

### 2. Clone the Repository
Open your terminal or command prompt and run the following commands to download the code:
```bash
git clone https://github.com/mrvbfit/Task-manager-with-habit.git
cd Task-manager-with-habit
```

### 3. Setup Environment Variables
Create a file named `.env` in the root folder of the project. Add your MongoDB connection string and Gemini API key:
```env
# Your connection string from MongoDB Atlas
MONGODB_URI="mongodb+srv://<user>:<password>@<cluster>/?appName=<app>"
MONGODB_DATABASE="habit-track"

# Your API key from Google for Gemini
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
```

### 4. Install Frontend Dependencies
Install all the required Node.js packages for the React frontend:
```bash
npm install
```

### 5. Run the Backend Server
Open a new terminal window, navigate to the backend folder, and start the Spring Boot server:
```bash
cd backend
mvn spring-boot:run
```
*The backend API will start running at `http://localhost:8080`.*

### 6. Run the Frontend Server
Go back to your first terminal (in the root directory) and start the Vite development server:
```bash
npm run dev
```
*Open `http://localhost:5173` in your browser to view the application.*
or `http://localhost:3000`