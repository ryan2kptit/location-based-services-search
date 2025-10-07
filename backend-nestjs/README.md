# NestJS Backend - Location-Based Services Search System

Production-ready NestJS backend with MySQL 8.0 for geospatial service search.

## Features

- NestJS 10.x with TypeScript 5.x (strict mode)
- MySQL 8.0+ with spatial extension support for spatial queries
- TypeORM for database access and migrations
- JWT RS256 authentication with Passport
- Redis caching layer
- Winston logging with daily rotation
- Swagger/OpenAPI documentation
- Comprehensive test suite (80%+ coverage)
- Docker containerization

## Tech Stack

- **Framework:** NestJS 10.x
- **Database:** MySQL 8.0+ with spatial extension support
- **ORM:** TypeORM 0.3.x
- **Cache:** Redis 7.x
- **Authentication:** JWT with RS256, bcrypt
- **Validation:** class-validator, class-transformer
- **API Docs:** @nestjs/swagger
- **Testing:** Jest, Supertest
- **Logging:** Winston

## Project Structure

```
backend-nestjs/
├── src/
│   ├── auth/              # Authentication module
│   ├── users/             # User management module
│   ├── locations/         # Location tracking module
│   ├── services/          # Service search module
│   ├── favorites/         # Favorites management module
│   ├── common/            # Shared utilities, guards, interceptors
│   ├── config/            # Configuration files
│   ├── database/          # Database migrations and seeds
│   ├── health/            # Health check endpoints
│   ├── app.module.ts      # Root module
│   └── main.ts            # Application entry point
├── test/                  # E2E tests
├── scripts/               # Utility scripts
├── keys/                  # JWT RS256 keys
├── logs/                  # Application logs
└── migrations/            # TypeORM migrations
```

## Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Generate RSA keys for JWT
npm run keys:generate

# Run migrations
npm run migration:run

# Seed database (optional)
npm run seed
```

## Running the Application

```bash
# Development
npm run start:dev

# Production build
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

## Docker

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Database Migrations

```bash
# Generate migration
npm run migration:generate -- src/database/migrations/MigrationName

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

## API Documentation

Once running, access Swagger documentation at:
- Development: http://localhost:3000/api/docs
- Production: Disabled for security

## API Endpoints

### Authentication (6 endpoints)
- POST `/api/v1/auth/register` - Register new user
- POST `/api/v1/auth/login` - Login user
- POST `/api/v1/auth/refresh` - Refresh access token
- POST `/api/v1/auth/logout` - Logout user
- POST `/api/v1/auth/forgot-password` - Request password reset
- POST `/api/v1/auth/reset-password` - Reset password

### Users (3 endpoints)
- GET `/api/v1/users/me` - Get current user profile
- PATCH `/api/v1/users/me` - Update user profile
- DELETE `/api/v1/users/me` - Delete user account

### Locations (3 endpoints)
- PUT `/api/v1/users/me/location` - Update user location
- GET `/api/v1/users/me/location` - Get current location
- GET `/api/v1/users/me/location/history` - Get location history

### Services (4 endpoints)
- GET `/api/v1/services/search` - Proximity search
- GET `/api/v1/services/search/bounds` - Bounding box search
- GET `/api/v1/services/:id` - Get service details
- GET `/api/v1/services/types` - Get all service types

### Favorites (3 endpoints)
- GET `/api/v1/favorites` - List user favorites
- POST `/api/v1/favorites` - Add favorite
- DELETE `/api/v1/favorites/:serviceId` - Remove favorite

### Health
- GET `/health` - Health check endpoint

## Environment Variables

See `.env.example` for all available configuration options.

## Performance Targets

- Proximity search: < 500ms (95th percentile)
- Authentication: < 200ms
- Location updates: < 100ms
- Throughput: 10,000 req/s per instance

## Security Features

- JWT RS256 authentication
- bcrypt password hashing (12 rounds)
- Rate limiting (100 req/min)
- Helmet security headers
- CORS protection
- Input validation
- SQL injection prevention

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch
3. Write tests for your changes
4. Ensure all tests pass
5. Submit a pull request

## Support

For issues and questions, please open an issue on GitHub.
