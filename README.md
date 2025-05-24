# SQL Analytics Platform

A modern, professional web application for executing and analyzing SQL queries with a beautiful UI and comprehensive feature set.

## 🚀 Live Demo

- **Frontend**: https://sql-analytics-platform.onrender.com
- **Backend API**: https://sql-analytics-platform-api.onrender.com
- **API Documentation**: https://sql-analytics-platform-api.onrender.com/api-docs/

### Demo Credentials
- **Email**: `sppathak1428@gmail.com`
- **Password**: `123123`

## 📋 Features

### 🔐 Authentication & Security
- Secure JWT-based authentication
- User registration and login
- Password strength validation
- Professional form validation

### 💻 Query Editor
- Monaco Editor with SQL syntax highlighting
- Query execution with real-time results
- Query history and favorites
- Download results as CSV
- Error handling and validation

### 🎨 Professional UI/UX
- Modern glass-effect design
- Dark/light theme support
- Responsive design for all devices
- Professional animations and transitions
- Comprehensive settings panel

### 🗄️ Database Features
- Schema exploration
- Table structure visualization
- Sample data browsing
- Connection status monitoring

### ⚙️ Settings & Customization
- Profile management
- Editor preferences
- Theme customization
- Notification settings
- Database configuration

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Shadcn/ui** component library
- **Monaco Editor** for SQL editing
- **React Router** for navigation
- **Axios** for API communication

### Backend
- **Flask** with Python 3.9
- **PostgreSQL** database
- **JWT** authentication
- **Flask-CORS** for cross-origin requests
- **Gunicorn** WSGI server
- **Flasgger** for API documentation

### Deployment
- **Render** cloud platform
- **Docker** containerization
- **Nginx** for frontend serving
- **PostgreSQL** managed database

## 🚀 Deployment

### Automatic Deployment on Render

The application is configured for automatic deployment on Render using the `render.yaml` blueprint.

#### Quick Deploy
1. Fork this repository
2. Create a [Render](https://render.com) account
3. Connect your GitHub repository to Render
4. Click "New +" → "Blueprint" in Render dashboard
5. Select your forked repository
6. Render will automatically deploy all services

#### What Gets Deployed
- **PostgreSQL Database**: Managed database with automatic backups
- **Backend API**: Flask application with health checks
- **Frontend Web App**: React application served via Nginx

### Manual Setup

#### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- PostgreSQL 12+
- Docker (optional)

#### Frontend Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

#### Backend Development
```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL="postgresql://user:password@localhost:5432/sqlanalytics"
export JWT_SECRET="your-secret-key"

# Initialize database
python db/init_db.py

# Start development server
python app.py
```

### Environment Variables

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
```

#### Backend
```env
DATABASE_URL=postgresql://user:password@localhost:5432/sqlanalytics
JWT_SECRET=your-super-secret-jwt-key
FLASK_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
```

## 🐳 Docker Deployment

### Full Stack with Docker Compose
```bash
# Start all services
docker-compose up -d

# Access application
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
# Database: localhost:5432
```

### Individual Services
```bash
# Frontend only
docker build -f Dockerfile -t sql-analytics-frontend .
docker run -p 3000:80 sql-analytics-frontend

# Backend only
cd backend
docker build -t sql-analytics-backend .
docker run -p 5000:5000 sql-analytics-backend
```

## 📁 Project Structure

```
sql-analytics-platform/
├── src/                          # Frontend React application
│   ├── components/               # Reusable UI components
│   ├── pages/                   # Page components
│   ├── contexts/                # React contexts
│   ├── services/               # API services
│   └── lib/                    # Utilities
├── backend/                     # Flask backend application
│   ├── routes/                 # API route handlers
│   ├── db/                     # Database utilities
│   ├── middleware/             # Custom middleware
│   └── utils/                  # Helper functions
├── public/                     # Static assets
├── Dockerfile                  # Frontend Docker configuration
├── render.yaml                 # Render deployment blueprint
├── nginx.conf                  # Nginx configuration
└── docker-compose.yml          # Local development setup
```

## 🔧 Configuration

### Database Schema
The application automatically creates the following tables:
- `users` - User accounts and profiles
- `queries` - Query history and favorites

### API Endpoints
- **Authentication**: `/api/auth/login`, `/api/auth/register`
- **Queries**: `/api/queries/execute`, `/api/queries/history`
- **Schema**: `/api/schema/tables`, `/api/schema/tables/{name}`
- **Health**: `/api/health`

### Security Features
- JWT token authentication
- Password hashing with bcrypt
- CORS protection
- Security headers
- Input validation

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure `VITE_API_URL` is correctly set
2. **Database Connection**: Verify `DATABASE_URL` format and credentials
3. **Build Failures**: Check that all dependencies are installed
4. **Authentication Issues**: Verify JWT secret is consistent

### Debugging

#### Check Service Health
```bash
# Frontend health
curl https://your-frontend-url/health

# Backend health
curl https://your-backend-url/api/health
```

#### View Logs
- **Render**: Check service logs in dashboard
- **Local**: Check browser console and terminal output

## 📊 Performance

### Production Optimizations
- Vite production build with code splitting
- Nginx gzip compression
- Database connection pooling
- Efficient SQL queries with indexes
- Proper error handling and logging

### Monitoring
- Health check endpoints
- Request/response logging
- Error tracking
- Performance metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) for the code editor
- [Render](https://render.com) for hosting platform
- [Tailwind CSS](https://tailwindcss.com/) for styling framework

---

Made with ❤️ by the SQL Analytics Platform team
