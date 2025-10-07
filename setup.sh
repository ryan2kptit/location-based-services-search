#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored message
print_message() {
    echo -e "${2}${1}${NC}"
}

print_success() {
    print_message "✓ $1" "$GREEN"
}

print_error() {
    print_message "✗ $1" "$RED"
}

print_info() {
    print_message "ℹ $1" "$BLUE"
}

print_warning() {
    print_message "⚠ $1" "$YELLOW"
}

# Print header
print_header() {
    echo ""
    print_message "==========================================" "$BLUE"
    print_message "$1" "$BLUE"
    print_message "==========================================" "$BLUE"
    echo ""
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Main setup script
main() {
    print_header "Location-Based Services Search - Setup Script"

    # Step 1: Check prerequisites
    print_info "Checking prerequisites..."

    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    print_success "Docker is installed"

    if ! docker compose version >/dev/null 2>&1; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    print_success "Docker Compose is installed"

    if ! command_exists npm; then
        print_error "npm is not installed. Please install Node.js and npm first."
        exit 1
    fi
    print_success "npm is installed"

    # Step 2: Create .env file
    print_header "Creating environment file"

    if [ -f .env ]; then
        print_warning ".env file already exists. Skipping..."
    else
        cat > .env << 'EOF'
# Database Configuration
DB_USERNAME=lbs_user
DB_PASSWORD=user_password
DB_NAME=location_services
MYSQL_ROOT_PASSWORD=root_password
EOF
        print_success "Created .env file"
    fi

    # Step 3: Stop existing containers
    print_header "Cleaning up existing containers"

    docker compose down -v > /dev/null 2>&1
    print_success "Cleaned up existing containers and volumes"

    # Step 4: Start Docker services
    print_header "Starting Docker services"

    print_info "Building and starting all services..."
    if docker compose up -d --build; then
        print_success "All services started"
    else
        print_error "Failed to start services"
        exit 1
    fi

    # Check if MySQL is healthy, if not wait and retry
    print_info "Waiting for services to be ready..."
    sleep 10

    if ! docker compose ps | grep -q "lbs-mysql.*healthy"; then
        print_warning "MySQL not ready yet, restarting services..."
        docker compose up -d
    fi

    # Step 5: Wait for services
    print_info "Waiting 30 seconds for all services to initialize..."
    sleep 30

    # Step 6: Seed database
    print_header "Seeding database"

    print_info "Seeding service types and sample data..."
    if cd backend-nestjs && DB_HOST=localhost DB_PORT=3306 DB_USERNAME=lbs_user DB_PASSWORD=user_password DB_DATABASE=location_services npm run seed && cd ..; then
        print_success "Database seeded successfully"
    else
        print_error "Failed to seed database"
        exit 1
    fi

    # Step 7: Create demo user
    print_header "Creating demo user"

    print_info "Creating demo user account..."
    RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/auth/register \
        -H "Content-Type: application/json" \
        -d '{
            "username": "demo",
            "firstName": "Demo",
            "lastName": "User",
            "email": "demo@test.com",
            "password": "Demo123456",
            "phoneNumber": "+84987654321"
        }')

    if echo "$RESPONSE" | grep -q '"success":true'; then
        print_success "Demo user created successfully"
    else
        print_warning "Demo user might already exist or creation failed"
    fi

    # Step 8: Verify services
    print_header "Verifying services"

    if docker compose ps | grep -q "healthy"; then
        print_success "All services are healthy"
    else
        print_warning "Some services might not be fully ready yet"
    fi

    # Final summary
    print_header "Setup Complete!"

    echo ""
    print_success "All services are running!"
    echo ""
    print_info "Access the application:"
    echo "  • Frontend:      http://localhost:5173"
    echo "  • Backend API:   http://localhost:3000/api/v1"
    echo "  • Swagger Docs:  http://localhost:3000/api/docs"
    echo "  • Health Check:  http://localhost:3000/api/v1/health"
    echo ""
    print_info "Demo credentials:"
    echo "  • Email:    demo@test.com"
    echo "  • Password: Demo123456"
    echo ""
    print_info "Database credentials:"
    echo "  • Host:     localhost"
    echo "  • Port:     3306"
    echo "  • User:     lbs_user"
    echo "  • Password: user_password"
    echo "  • Database: location_services"
    echo ""
    print_info "Useful commands:"
    echo "  • View logs:         docker compose logs -f"
    echo "  • Stop services:     docker compose down"
    echo "  • Restart services:  docker compose restart"
    echo "  • View status:       docker compose ps"
    echo ""
    print_success "Happy coding! 🚀"
    echo ""
}

# Run main function
main "$@"
