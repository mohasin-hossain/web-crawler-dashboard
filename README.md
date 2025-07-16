# Web Crawler Dashboard

A professional full-stack web application that crawls websites and analyzes their structure, providing comprehensive insights through an interactive dashboard. Built with modern technologies and best practices for production-ready web crawling and analysis.

![Dashboard Demo](assets/demo.gif)

![Dashboard Preview](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Go Version](https://img.shields.io/badge/Go-1.24.4+-blue)
![React Version](https://img.shields.io/badge/React-19.1.0+-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3+-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose** (recommended)
- **Node.js 18+** (for local development)
- **Go 1.24+** (for local development)
- **MySQL 8.0** (for local development)

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd web-crawler-dashboard
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your configuration
# Generate secure passwords and JWT secret
```

**Required Environment Variables:**

```bash
# Database Configuration
DB_ROOT_PASSWORD=your_secure_root_password
DB_USER=webuser
DB_PASSWORD=your_secure_user_password
DB_NAME=webcrawler

# JWT Configuration
JWT_SECRET=your_32_character_jwt_secret

# Optional Configuration
PORT=8080
GIN_MODE=debug
VITE_API_URL=http://localhost:8080
```

### 3. Start with Docker (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **Database**: localhost:3306

## ✨ Features

### 🔍 **Advanced Web Crawling**

- **Comprehensive HTML Analysis**: Extract HTML version, page titles, and meta information
- **Heading Structure Analysis**: Count and analyze H1-H6 heading tags
- **Link Classification**: Distinguish between internal and external links
- **Broken Link Detection**: Identify inaccessible links with HTTP status codes
- **Login Form Detection**: Intelligent detection of login forms with confidence scoring
- **Real-time Processing**: Start, stop, and monitor crawling operations

### 📊 **Interactive Dashboard**

- **URL Management**: Add, edit, and organize URLs for analysis
- **Bulk Operations**: Select multiple URLs for batch processing
- **Real-time Status Tracking**: Monitor crawling progress with live updates
- **Advanced Filtering**: Filter by status, date, and custom criteria
- **Sortable Tables**: Sort by any column with pagination
- **Global Search**: Fuzzy search across all URL data

### 🎯 **Detailed Analysis Views**

- **Comprehensive Metrics**: View detailed analysis results for each URL
- **Interactive Charts**: Visualize link distributions and statistics
- **Broken Link Reports**: Detailed breakdown of inaccessible links
- **Heading Structure**: Visual representation of page heading hierarchy
- **Form Analysis**: Login form detection with confidence scores

### 🔐 **Security & Authentication**

- **JWT Authentication**: Secure token-based authentication
- **User Management**: Register and manage user accounts
- **Protected Routes**: Secure API endpoints with middleware
- **Password Security**: Bcrypt password hashing

### 📱 **Responsive Design**

- **Mobile-First**: Optimized for all device sizes
- **Modern UI**: Clean, professional interface with shadcn/ui components
- **Dark Mode Support**: Automatic theme switching
- **Accessibility**: WCAG compliant with proper ARIA labels

## 🛠 Tech Stack

### **Frontend**

- **React 19.1.0** with TypeScript 5.8.3
- **Vite** - Fast build tool and development server
- **shadcn/ui** - Modern, accessible UI components
- **Tailwind CSS 4.1.11** - Utility-first CSS framework
- **@tanstack/react-query** - Server state management
- **Zustand** - Lightweight client state management
- **React Router** - Client-side routing
- **Recharts** - Interactive charts and visualizations
- **React Hook Form + Zod** - Form handling and validation
- **Framer Motion** - Smooth animations and transitions
- **Lucide React** - Beautiful, customizable icons

### **Backend**

- **Go 1.24.4** - High-performance server language
- **Gin** - Fast HTTP web framework
- **GORM** - Go ORM library for database operations
- **MySQL 8.0** - Reliable relational database
- **JWT** - JSON Web Token authentication
- **goquery** - HTML parsing and manipulation
- **Air** - Live reload for development

### **DevOps & Infrastructure**

- **Docker & Docker Compose** - Containerized deployment
- **MySQL 8.0** - Production-ready database
- **CORS** - Cross-origin resource sharing
- **Health Checks** - Application monitoring

## 🏗 Architecture

```
web-crawler-dashboard/
├── frontend/                    # React TypeScript application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/             # Page components
│   │   ├── stores/            # Zustand state management
│   │   ├── services/          # API services
│   │   ├── hooks/             # Custom React hooks
│   │   └── types/             # TypeScript definitions
│   └── public/                # Static assets
├── backend/                    # Go API server
│   ├── cmd/server/            # Application entry point
│   ├── internal/
│   │   ├── api/              # HTTP handlers and middleware
│   │   ├── auth/             # Authentication logic
│   │   ├── crawler/          # Web crawling engine
│   │   ├── database/         # Database connection and migrations
│   │   ├── models/           # Data models
│   │   └── services/         # Business logic services
│   └── scripts/              # Database initialization
└── docker-compose.yml         # Multi-container orchestration
```

## 🛠 Development Setup

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

### Backend Development

```bash
cd backend

# Install Go dependencies
go mod download

# Run with hot reload (requires Air)
air

# Run tests
go test ./...

# Build binary
go build -o server cmd/server/main.go
```

### Database Setup

```bash
# Initialize database schema
mysql -u root -p < backend/scripts/init.sql

# Or use Docker
docker-compose exec db mysql -u root -p webcrawler < backend/scripts/init.sql
```

## 📚 API Documentation

### Authentication Endpoints

#### Register User

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "secure_password"
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "secure_password"
}
```

### URL Management Endpoints

#### Create URL

```http
POST /api/urls
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "url": "https://example.com"
}
```

#### Get URLs (with pagination and filtering)

```http
GET /api/urls?page=1&limit=10&status=completed&search=example
Authorization: Bearer <jwt_token>
```

#### Start Analysis

```http
POST /api/urls/{id}/analyze
Authorization: Bearer <jwt_token>
```

#### Get Analysis Result

```http
GET /api/urls/{id}/result
Authorization: Bearer <jwt_token>
```

### Health Check

```http
GET /api/health
```

## 🎯 Usage Examples

### 1. Adding URLs for Analysis

1. Navigate to the URL Management page
2. Click "Add URL" button
3. Enter the website URL (e.g., `https://example.com`)
4. Click "Analyze" to start crawling

### 2. Bulk Operations

1. Select multiple URLs using checkboxes
2. Choose bulk action:
   - **Re-run Analysis**: Re-analyze selected URLs
   - **Delete**: Remove selected URLs
   - **Stop**: Stop running analyses

### 3. Viewing Analysis Results

1. Click on any URL row to view detailed analysis
2. Explore different sections:
   - **Overview**: Summary statistics
   - **Links**: Internal vs external link distribution
   - **Broken Links**: List of inaccessible links
   - **Headings**: Page structure analysis

### 4. Filtering and Searching

- Use the search bar for global text search
- Apply column filters for specific criteria
- Sort by any column by clicking headers
- Use pagination for large datasets

## 🧪 Testing

### Frontend Tests (Automated)

Automated frontend tests are implemented using [Vitest](https://vitest.dev/) and [@testing-library/react](https://testing-library.com/docs/react-testing-library/intro/). These tests cover a few happy-path scenarios:

- Rendering the main App and verifying the login or dashboard heading is present
- Rendering the URL table and verifying URLs and the table are displayed
- Rendering the Add URL form and verifying a user can type a URL

To run all frontend tests:

```bash
cd frontend
npx vitest run
```

### Backend Tests

```bash
cd backend

# Run all tests
go test ./...

# Run tests with coverage
go test -cover ./...

# Run specific test file
go test ./internal/crawler/
```

### Integration Tests

```bash
# Start test environment
docker-compose -f docker-compose.test.yml up -d

# Run integration tests
npm run test:integration
```

## 🔧 Configuration

### Environment Variables

| Variable           | Description         | Default               | Required |
| ------------------ | ------------------- | --------------------- | -------- |
| `DB_ROOT_PASSWORD` | MySQL root password | -                     | ✅       |
| `DB_PASSWORD`      | MySQL user password | -                     | ✅       |
| `JWT_SECRET`       | JWT signing secret  | -                     | ✅       |
| `PORT`             | Backend server port | 8080                  | ❌       |
| `GIN_MODE`         | Gin framework mode  | debug                 | ❌       |
| `VITE_API_URL`     | Frontend API URL    | http://localhost:8080 | ❌       |

### Database Configuration

```sql
-- Main tables
users              # User accounts and authentication
urls               # URL management and status tracking
analysis_results   # Crawling analysis results
broken_links       # Detailed broken link information
```

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

**Built with ❤️ using modern web technologies**
