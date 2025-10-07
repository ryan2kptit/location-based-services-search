# LocalFind - Location-Based Services Search Frontend

A modern React + TypeScript frontend application for discovering and managing local services based on geolocation.

## Features

- **Location-Based Search**: Find services near your current location using GPS
- **Interactive Maps**: Visualize services on interactive maps powered by Leaflet
- **Service Categories**: Browse services by type (restaurants, healthcare, shops, etc.)
- **Favorites Management**: Save and manage your favorite services
- **Location History**: Track and view your location history
- **User Authentication**: Secure JWT-based authentication
- **Responsive Design**: Mobile-first design with TailwindCSS
- **Real-time Updates**: React Query for efficient data fetching and caching

## Tech Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **React Router v6** - Client-side routing
- **Axios** - HTTP client with interceptors
- **TanStack Query (React Query)** - Data fetching and caching
- **Zustand** - Lightweight state management
- **React Hook Form** - Performant form handling
- **Zod** - Schema validation
- **Leaflet / React-Leaflet** - Interactive maps
- **Lucide React** - Beautiful icon library
- **Sonner** - Toast notifications

## Prerequisites

- Node.js 18+ and npm
- Backend API running at `http://localhost:3000/api/v1`

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and update the values if needed:
   ```env
   VITE_API_URL=http://localhost:3000/api/v1
   VITE_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173`

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable React components
│   │   ├── layout/         # Layout components (Header, Footer, Layout)
│   │   ├── auth/           # Authentication components
│   │   ├── services/       # Service-related components
│   │   ├── locations/      # Location tracking components
│   │   ├── favorites/      # Favorites management components
│   │   └── ui/             # Generic UI components (Button, Input, Card, etc.)
│   ├── pages/              # Page components (routes)
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API service layer
│   ├── store/              # Zustand state management
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   ├── App.tsx             # Main application component
│   ├── main.tsx            # Application entry point
│   └── index.css           # Global styles
├── .env                    # Environment variables
└── README.md
```

## API Integration

The frontend integrates with the following backend endpoints:

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - User logout

### Services
- `GET /services` - Get all services
- `GET /services/search` - Search services
- `GET /services/nearby` - Get nearby services
- `GET /services/:id` - Get service details

### Locations
- `POST /locations/track` - Track user location
- `GET /locations/history` - Get location history

### Favorites
- `POST /favorites` - Add favorite
- `DELETE /favorites/:id` - Remove favorite
- `GET /favorites` - Get user favorites

## Build for Production

```bash
npm run build
```

The production build will be created in the `dist/` directory.

## License

MIT License
