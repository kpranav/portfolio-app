#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a process is running on a port
check_port() {
    lsof -ti:$1 > /dev/null 2>&1
    return $?
}

# Function to stop a service running on a port
stop_service() {
    local port=$1
    local service_name=$2
    if check_port $port; then
        echo -e "${YELLOW}Stopping $service_name on port $port...${NC}"
        lsof -ti:$port | xargs kill -9
        echo -e "${GREEN}✓ $service_name stopped${NC}"
    else
        echo -e "${YELLOW}→ $service_name is not running on port $port${NC}"
    fi
}

# Function to start a service
start_service() {
    local service_type=$1
    local port=$2
    
    case $service_type in
        "python")
            cd python-api
            source venv/bin/activate
            echo -e "${YELLOW}Starting Python API on port $port...${NC}"
            python app.py &
            cd ..
            ;;
        "node")
            cd backend
            echo -e "${YELLOW}Starting Node.js API on port $port...${NC}"
            npm start &
            cd ..
            ;;
        "react")
            cd frontend
            echo -e "${YELLOW}Starting React app on port $port...${NC}"
            npm start &
            cd ..
            ;;
    esac
}

# Function to check if a service started successfully
wait_for_service() {
    local port=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1

    echo -e "${YELLOW}Waiting for $service_name to start...${NC}"
    while ! check_port $port && [ $attempt -le $max_attempts ]; do
        sleep 1
        attempt=$((attempt + 1))
    done

    if check_port $port; then
        echo -e "${GREEN}✓ $service_name started successfully${NC}"
    else
        echo -e "${RED}✗ Failed to start $service_name${NC}"
        exit 1
    fi
}

# Main script
case "$1" in
    "start")
        echo -e "${GREEN}Starting all services...${NC}"
        
        # Stop any existing services
        stop_service 5002 "Python API"
        stop_service 5003 "Node.js API"
        stop_service 3000 "React App"
        
        # Start Python API
        start_service "python" 5002
        wait_for_service 5002 "Python API"
        
        # Start Node.js API
        start_service "node" 5003
        wait_for_service 5003 "Node.js API"
        
        # Start React App
        start_service "react" 3000
        wait_for_service 3000 "React App"
        
        echo -e "${GREEN}All services started successfully!${NC}"
        ;;
        
    "stop")
        echo -e "${YELLOW}Stopping all services...${NC}"
        stop_service 5002 "Python API"
        stop_service 5003 "Node.js API"
        stop_service 3000 "React App"
        echo -e "${GREEN}All services stopped!${NC}"
        ;;
        
    "restart")
        $0 stop
        sleep 2
        $0 start
        ;;
        
    *)
        echo "Usage: $0 {start|stop|restart}"
        exit 1
        ;;
esac

# Keep the script running to maintain the background processes
if [ "$1" = "start" ]; then
    echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
    wait
fi