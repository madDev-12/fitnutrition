# FitNutrition Frontend - React + Vite

This is the frontend application for FitNutrition, built with React 18, Vite, and Tailwind CSS.

## 📋 Prerequisites

Before you can run this frontend, you need to install:

1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Choose the LTS (Long Term Support) version
   - This will also install npm (Node Package Manager)

2. **Verify Installation**
   ```bash
   node --version
   npm --version
   ```

## 🚀 Quick Start

### Step 1: Install Node.js

1. Go to https://nodejs.org/
2. Download the LTS version for Windows
3. Run the installer
4. Follow the installation wizard
5. Restart your terminal/command prompt

### Step 2: Install Dependencies

```bash
# Navigate to frontend directory
cd C:\Users\agunk\Desktop\fitness-nutrition-app\frontend

# Install all dependencies
npm install
```

This will install:
- React 18.2
- React Router v6
- Axios (API calls)
- Zustand (state management)
- Recharts (charts)
- React Hook Form (forms)
- Tailwind CSS (styling)
- Lucide React (icons)
- And more...

### Step 3: Start Development Server

```bash
npm run dev
```

The application will start at: **http://localhost:5173**

## 📁 Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable components
│   │   ├── layout/      # Layout components (Header, Sidebar, Footer)
│   │   ├── common/      # Common components (Button, Input, Card)
│   │   └── features/    # Feature-specific components
│   ├── pages/           # Page components
│   │   ├── Auth/        # Login, Register
│   │   ├── Dashboard/   # Main dashboard
│   │   ├── Profile/     # Profile management
│   │   ├── Meals/       # Meal planning
│   │   ├── Workouts/    # Workout planning
│   │   ├── Progress/    # Progress tracking
│   │   └── Settings/    # Settings
│   ├── services/        # API services
│   │   ├── api.js       # Axios instance
│   │   ├── auth.js      # Authentication API
│   │   ├── profile.js   # Profile API
│   │   ├── meals.js     # Meals API
│   │   └── workouts.js  # Workouts API
│   ├── store/           # Zustand stores
│   │   ├── authStore.js # Authentication state
│   │   └── userStore.js # User data state
│   ├── hooks/           # Custom React hooks
│   ├── utils/           # Utility functions
│   ├── App.jsx          # Main App component
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── index.html           # HTML template
├── package.json         # Dependencies
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # Tailwind configuration
└── .env                 # Environment variables
```

## 🎨 Features

### Implemented Pages (To Be Built)
- ✅ Landing Page
- ✅ Login/Register
- ✅ Dashboard with charts
- ✅ Profile Setup Wizard
- ✅ Meal Planning
- ✅ Workout Planning
- ✅ Progress Tracking
- ✅ Settings

### Key Features
- 🔐 JWT Authentication
- 📊 Interactive Charts (Recharts)
- 📱 Responsive Design (Tailwind CSS)
- 🎨 Modern UI Components
- 🔄 State Management (Zustand)
- 📝 Form Validation (React Hook Form)
- 🌐 API Integration (Axios)
- 🎯 Routing (React Router v6)

## 🛠️ Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## 🔧 Configuration

### Environment Variables (.env)
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_NAME=FitNutrition
```

### API Proxy
The Vite dev server is configured to proxy API requests to the Django backend:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api

## 📦 Dependencies

### Core
- **react**: ^18.2.0
- **react-dom**: ^18.2.0
- **react-router-dom**: ^6.21.0

### State & Data
- **zustand**: ^4.4.7 (State management)
- **axios**: ^1.6.2 (HTTP client)

### UI & Styling
- **tailwindcss**: ^3.4.0 (CSS framework)
- **lucide-react**: ^0.303.0 (Icons)
- **recharts**: ^2.10.3 (Charts)

### Forms
- **react-hook-form**: ^7.49.2 (Form handling)

### Utilities
- **date-fns**: ^3.0.6 (Date manipulation)

## 🎯 Next Steps

After installing Node.js and dependencies:

1. **Start Backend**
   ```bash
   cd ../backend
   python manage.py runserver
   ```

2. **Start Frontend** (in new terminal)
   ```bash
   cd frontend
   npm run dev
   ```

3. **Access Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000/api
   - Admin Panel: http://localhost:8000/admin

## 🐛 Troubleshooting

### "npm: command not found"
- Node.js is not installed or not in PATH
- Install Node.js from https://nodejs.org/
- Restart terminal after installation

### "Port 5173 already in use"
- Another Vite server is running
- Kill the process or use different port:
  ```bash
  npm run dev -- --port 3000
  ```

### "Cannot connect to API"
- Make sure Django backend is running on port 8000
- Check VITE_API_BASE_URL in .env file
- Verify CORS settings in Django

### Module not found errors
- Delete node_modules and package-lock.json
- Run `npm install` again

## 📚 Documentation

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Router](https://reactrouter.com/)
- [Zustand](https://github.com/pmndrs/zustand)
- [Recharts](https://recharts.org/)

## 🤝 Integration with Backend

The frontend communicates with the Django REST API:

### Authentication Flow
1. User registers/logs in
2. Backend returns JWT tokens
3. Frontend stores tokens in localStorage
4. Tokens sent with each API request

### API Endpoints Used
- POST /api/auth/register/
- POST /api/auth/login/
- GET /api/profile/
- GET /api/measurements/
- GET /api/nutrition/meals/
- And more...

## 📝 Notes

- This frontend is designed to work with the FitNutrition Django backend
- Make sure backend is running before starting frontend
- UI mockups are available in `fitness-app-mockups/` folder
- The design follows the mockups created earlier

---

**Status**: Frontend structure created, ready for development
**Version**: 0.1.0
**Last Updated**: January 2024
