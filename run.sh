#!/bin/bash
GREEN='\033[0;32m'
NC='\033[0m'

# Start backend server
echo -e "${GREEN}Starting backend server...${NC}"
cd backend
source ../venv/bin/activate
uvicorn main:app --reload &
cd ..

# Wait for backend to start
sleep 2

# Start frontend server
echo -e "${GREEN}Starting frontend server...${NC}"
python3 -m http.server 8080

# Kill background processes on exit
trap "trap - SIGTERM && kill -- -$$" SIGINT SIGTERM EXIT
