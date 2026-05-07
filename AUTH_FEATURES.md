# Habit Tracker - Authentication & User Profile Features

## New Features Added

### 1. **User Authentication System**
- **Login Page**: Simple, modern login interface with email and password validation
- **Signup Page**: New user registration with:
  - Email validation
  - Username uniqueness check
  - Password confirmation
  - Optional first and last name fields
  - Auto-generated avatar using UI Avatars API

### 2. **User Profile & Avatar**
- **Avatar Display**: Each user gets an automatically generated avatar based on their name
- **User Profile Menu**: Dropdown menu in the header showing:
  - User avatar and name
  - Email address
  - Quick logout option
  - Expandable for future profile/settings links

### 3. **Branding & Logo**
- **Updated Logo**: Checkmark icon (✓) representing habit completion
- **Consistent Branding**: "Habit Tracker" displayed with tagline "Build better habits, one day at a time"
- **Responsive Design**: Logo and branding work seamlessly on mobile and desktop

### 4. **Backend Authentication API**
- **User Model**: MongoDB User document with fields:
  - email (unique)
  - username (unique)
  - password (note: should be hashed in production)
  - firstName, lastName
  - avatarUrl
  - createdAt, updatedAt timestamps

- **User Endpoints**:
  - `POST /api/auth/signup` - Register new user
  - `POST /api/auth/login` - User login
  - `GET /api/auth/user/{id}` - Get user profile
  - `PUT /api/auth/user/{id}` - Update user profile

## Setup Instructions

### Backend
1. The User model and authentication endpoints are ready to use
2. MongoDB connection is already configured
3. Users will be stored in the `users` collection in MongoDB

### Frontend
1. Authentication state is managed in the App component
2. User data is cached in localStorage for offline access
3. Login/Signup forms appear before the main app
4. After successful authentication, the dashboard displays with user profile

### Environment Variables
Ensure your `.env` file includes:
```
MONGODB_URI=your_mongodb_connection_string
MONGODB_DATABASE=your_database_name
```

## Security Notes

⚠️ **Important for Production**:
- Passwords are currently stored in plain text - this should be hashed using bcrypt or similar
- Implement JWT tokens for session management
- Add CORS restrictions for production
- Use HTTPS for all authentication requests
- Add rate limiting on auth endpoints
- Implement email verification for signup

## File Structure

### New Files Created:
- `src/components/Login.tsx` - Login component
- `src/components/Signup.tsx` - Signup component
- `src/components/UserProfile.tsx` - User profile dropdown
- `backend/src/main/java/com/habittrack/model/User.java` - User entity
- `backend/src/main/java/com/habittrack/repository/UserRepository.java` - User repository
- `backend/src/main/java/com/habittrack/controller/UserController.java` - Auth endpoints

### Updated Files:
- `src/types.ts` - Added User interface
- `src/App.tsx` - Integrated authentication flow and user profile
- `index.html` - Title already set to "Habit Track"

## Usage

### First Time User:
1. App opens to the signup page
2. User fills in email, username, name, and password
3. After signup, user is automatically logged in
4. Avatar is automatically generated and displayed

### Returning User:
1. App checks localStorage for saved user
2. If user exists, app loads directly to dashboard
3. User profile appears in the header with avatar
4. Click avatar to see profile menu and logout option

### Logging Out:
1. Click the avatar in the top-right corner
2. Select "Logout"
3. User is redirected to login page
4. localStorage is cleared of user data

## Future Enhancements

- Email verification for signup
- Password reset functionality
- OAuth integration (Google, GitHub)
- Profile customization
- User settings page
- Two-factor authentication
- Account deletion
