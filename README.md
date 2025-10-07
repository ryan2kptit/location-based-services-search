# Location-Based Services Search System

A comprehensive location-based services search platform built with NestJS, MySQL, and React. This system allows users to search for nearby services using geographic coordinates, track location history, manage favorites, and interact with services through reviews and ratings.

## 🌟 Features

### Core Functionality
- **Geospatial Search**: Find services within a specified radius using MySQL spatial functions
- **Real-time Location Tracking**: Track and store user location history
- **Service Management**: CRUD operations for services with rich metadata
- **Favorites System**: Save and manage favorite services
- **Reviews & Ratings**: User reviews and rating system for services
- **Service Types**: Categorized services (restaurants, hospitals, hotels, shopping, entertainment)

### Technical Highlights
- RESTful API with Swagger documentation
- JWT-based authentication
- MySQL spatial indexing for optimized geospatial queries
- SOLID principles with dependency injection
- Comprehensive test coverage (unit, integration, e2e)
- React SPA with TypeScript
- Leaflet maps integration
- Responsive UI with Tailwind CSS

## 🏗️ Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   React     │─────▶│  NestJS API  │─────▶│   MySQL     │
│  Frontend   │◀─────│   Backend    │◀─────│  Database   │
└─────────────┘      └──────────────┘      └─────────────┘
     │                      │                      │
     │                      │                      │
     ▼                      ▼                      ▼
  Vite Build         Swagger Docs           Spatial Index
  Tailwind CSS       JWT Auth               POINT Geometry
  React Router       TypeORM                ST_Distance_Sphere
  Leaflet Maps       Class Validator
```

## 📋 Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x
- **MySQL** >= 8.0 (with spatial extension support)
- **Docker** & **Docker Compose** (for containerized deployment)

## 🚀 Quick Start

### Option 1: Automated Setup (Fastest)

Run the automated setup script - this will do everything for you:

```bash
./setup.sh
```

This script will:
- ✓ Check prerequisites (Docker, npm)
- ✓ Create .env file with database credentials
- ✓ Clean up any existing containers
- ✓ Build and start all Docker services (MySQL, Redis, Backend, Frontend)
- ✓ Seed database with sample data
- ✓ Create a demo user account
- ✓ Display all access URLs and credentials

After running the script, you can immediately access:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api/v1
- Demo login: demo@test.com / Demo123456

### Option 2: Docker Deployment (Manual)

The easiest way to get started is using Docker Compose:

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd location-based-services-search
   ```

2. **Create environment file**
   ```bash
   # Create .env file in project root
   cat > .env << 'EOF'
   # Database Configuration
   DB_USERNAME=lbs_user
   DB_PASSWORD=user_password
   DB_NAME=location_services
   MYSQL_ROOT_PASSWORD=root_password
   EOF
   ```

3. **Start all services**
   ```bash
   docker compose up -d --build
   ```

   This will start:
   - MySQL 8.0 (port 3306)
   - Redis 7 (port 6379)
   - NestJS Backend (port 3000)
   - React Frontend (port 5173)

   **Note**: If MySQL shows as "unhealthy" on first run, wait 10 seconds and run:
   ```bash
   docker compose up -d
   ```

4. **Seed the database**
   ```bash
   # Wait 30-40 seconds for services to be ready, then seed
   sleep 30
   DB_HOST=localhost DB_PORT=3306 DB_USERNAME=lbs_user DB_PASSWORD=user_password DB_DATABASE=location_services npm run seed
   ```

   This will create:
   - 15 service types (Restaurant, Hospital, School, etc.)
   - 16 sample services in Hanoi and Ho Chi Minh City

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000/api/v1
   - Swagger Docs: http://localhost:3000/api/docs
   - Health Check: http://localhost:3000/api/v1/health

6. **Test the system (Optional)**

   Create a test user:
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "username": "demo",
       "firstName": "Demo",
       "lastName": "User",
       "email": "demo@test.com",
       "password": "Demo123456",
       "phoneNumber": "+84987654321"
     }'
   ```

   Then login at http://localhost:5173 with:
   - Email: `demo@test.com`
   - Password: `Demo123456`

### Option 3: Development Setup

For local development without Docker:

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd location-based-services-search
   ```

2. **Setup MySQL**
   ```bash
   # Install MySQL 8.0 locally
   # Create database and user
   mysql -u root -p << 'EOF'
   CREATE DATABASE location_services;
   CREATE USER 'lbs_user'@'localhost' IDENTIFIED BY 'user_password';
   GRANT ALL PRIVILEGES ON location_services.* TO 'lbs_user'@'localhost';
   FLUSH PRIVILEGES;
   EOF
   ```

3. **Start Backend**
   ```bash
   cd backend-nestjs
   npm install

   # Create .env file (or backend will use defaults)
   npm run start:dev
   ```

4. **Start Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **Seed database**
   ```bash
   cd backend-nestjs
   DB_HOST=localhost DB_PORT=3306 DB_USERNAME=lbs_user DB_PASSWORD=user_password DB_DATABASE=location_services npm run seed
   ```

### Option 4: Manual Setup

#### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend-nestjs
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your MySQL credentials and configuration
   ```

4. **Setup database**
   ```bash
   # Create database
   mysql -u root -p -e "CREATE DATABASE location_services;"

   # Run migrations
   npm run migration:run

   # Seed data
   npm run seed
   ```

5. **Start backend server**
   ```bash
   # Development
   npm run start:dev

   # Production
   npm run build
   npm run start:prod
   ```

#### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your backend API URL
   ```

4. **Start frontend server**
   ```bash
   # Development
   npm run dev

   # Production build
   npm run build
   npm run preview
   ```

## 🐳 Docker Configuration

### Services

The Docker Compose setup includes:

- **MySQL 8.0**: Database with spatial extension (port 3306)
- **Redis 7**: In-memory cache (port 6379)
- **Backend (NestJS)**: API server (port 3000)
- **Frontend (React)**: Web application (port 5173)

### Environment Variables

Create a `.env` file in the project root:

```env
# Database Configuration
DB_USERNAME=lbs_user
DB_PASSWORD=user_password
DB_NAME=location_services

# MySQL Root Password
MYSQL_ROOT_PASSWORD=root_password
```

**Note**: All other environment variables are configured in `docker-compose.yml` and will be automatically set.

### Database Credentials

**Application User** (used by backend):
```
Username: lbs_user
Password: user_password
Database: location_services
```

**Root User** (for admin tasks):
```
Username: root
Password: root_password
```

### Docker Commands

```bash
# Start all services
docker compose up -d

# Start with rebuild
docker compose up -d --build

# View logs
docker compose logs -f

# View specific service logs
docker compose logs backend --tail=100

# Stop all services
docker compose down

# Stop and remove volumes (⚠️ deletes all data)
docker compose down -v

# Check service status
docker compose ps

# Access backend shell
docker compose exec backend sh

# Access MySQL
docker compose exec mysql mysql -u lbs_user -puser_password location_services

# Restart specific service
docker compose restart backend
```

### Seeding Database

After starting Docker services, seed the database from your local machine:

```bash
# Make sure you're in the project root
DB_HOST=localhost DB_PORT=3306 DB_USERNAME=lbs_user DB_PASSWORD=user_password DB_DATABASE=location_services npm run seed
```

This will seed:
- 15 service types (Restaurant, Hospital, School, Shopping Mall, etc.)
- 16 services in Hanoi and Ho Chi Minh City with real geospatial coordinates

## 📁 Project Structure

```
location-based-services-search/
├── backend-nestjs/              # NestJS backend application
│   ├── src/
│   │   ├── auth/               # Authentication module
│   │   ├── users/              # User management
│   │   ├── services/           # Services module (core)
│   │   ├── locations/          # Location tracking
│   │   ├── favorites/          # Favorites management
│   │   ├── reviews/            # Reviews & ratings
│   │   ├── database/           # Database config & seeds
│   │   └── common/             # Shared utilities
│   ├── test/                   # E2E tests
│   ├── docs/                   # Documentation & diagrams
│   └── Dockerfile
│
├── frontend/                    # React frontend application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Page components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── services/           # API services
│   │   ├── types/              # TypeScript types
│   │   └── utils/              # Utility functions
│   └── Dockerfile
│
├── docs/                        # Project documentation
│   ├── architecture/           # System architecture
│   ├── features/               # Feature specifications
│   └── testing/                # Testing strategy
│
├── docker-compose.yml          # Docker Compose configuration
└── README.md                   # This file
```

## 🧪 Testing

### Backend Tests

```bash
cd backend-nestjs

# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Frontend Tests

```bash
cd frontend

# Run tests
npm run test

# Test coverage
npm run test:coverage
```

## 📚 API Documentation

### Swagger UI

After starting the backend server, access the interactive API documentation at:
```
http://localhost:3000/api
```

### Key Endpoints

#### Authentication
- `POST /api/v1/auth/register` - Register new user
  - Required fields: `username`, `firstName`, `lastName`, `email`, `password`
  - Optional fields: `phoneNumber`
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token

#### Services
- `GET /api/v1/services/search` - Search services by location
- `GET /api/v1/services/nearby` - Get nearby services
- `GET /api/v1/services/:id` - Get service details
- `POST /api/v1/services` - Create service (admin)
- `PUT /api/v1/services/:id` - Update service (admin)

#### Favorites
- `GET /api/v1/favorites` - Get user favorites
- `POST /api/v1/favorites` - Add to favorites
- `DELETE /api/v1/favorites/:id` - Remove from favorites

#### Location Tracking
- `POST /api/v1/locations/track` - Track current location
- `GET /api/v1/locations/history` - Get location history

For complete API reference, see [API_ENDPOINTS.md](backend-nestjs/API_ENDPOINTS.md)

## 🛠️ Development

### Code Style

The project uses:
- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type safety

```bash
# Format code
npm run format

# Lint code
npm run lint
```

### Database Migrations

```bash
# Create new migration
npm run migration:create -- src/database/migrations/MigrationName

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

### Seeding Database

The project includes seed data for:
- Service Types (15 categories)
- Sample Services (16 services in Hanoi and HCMC)

```bash
npm run seed
```

## 🔒 Security

- JWT-based authentication with refresh tokens
- Password hashing with bcrypt
- Input validation using class-validator
- SQL injection prevention with TypeORM
- CORS configuration
- Rate limiting (recommended for production)
- Helmet.js for security headers

## 🌐 Deployment

### Production Checklist

- [ ] Set strong `JWT_SECRET` in production
- [ ] Configure CORS for production domain
- [ ] Enable HTTPS/SSL
- [ ] Set up database backups
- [ ] Configure logging (e.g., Winston, CloudWatch)
- [ ] Set up monitoring (e.g., New Relic, DataDog)
- [ ] Configure rate limiting
- [ ] Review and update security headers
- [ ] Set `NODE_ENV=production`

### Cloud Deployment Options

- **AWS**: ECS + RDS MySQL + S3 + CloudFront
- **Google Cloud**: Cloud Run + Cloud SQL + Cloud CDN
- **Azure**: App Service + Azure Database for MySQL
- **DigitalOcean**: App Platform + Managed MySQL

## 📊 Performance Optimization

- MySQL spatial indexes for geospatial queries
- Connection pooling with TypeORM
- Response caching (consider Redis)
- Database query optimization
- Frontend code splitting with Vite
- Image optimization and lazy loading
- API pagination for large datasets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- NestJS framework
- React and Vite
- Leaflet for maps
- TypeORM for database ORM
- Tailwind CSS for styling

## 📞 Support

For questions and support:
- Create an issue in the repository
- Contact: your-email@example.com

## 🗺️ Roadmap

- [ ] Real-time notifications with WebSocket
- [ ] Advanced filtering (price range, opening hours)
- [ ] Social features (service sharing, user profiles)
- [ ] Mobile app (React Native)
- [ ] Analytics dashboard
- [ ] Multi-language support
- [ ] Offline support with PWA
- [ ] Payment integration
