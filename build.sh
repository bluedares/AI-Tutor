#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Building AI Tutor...${NC}"

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Python 3 is not installed. Please install Python 3 first.${NC}"
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo -e "${GREEN}Creating virtual environment...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment
echo -e "${GREEN}Activating virtual environment...${NC}"
source venv/bin/activate

# Install dependencies
echo -e "${GREEN}Installing dependencies...${NC}"
pip install -r requirements.txt

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    echo -e "${RED}Warning: backend/.env file not found${NC}"
    echo -e "${GREEN}Creating example .env file...${NC}"
    echo "OPENAI_API_KEY=your_openai_api_key_here" > backend/.env
    echo -e "${RED}Please update backend/.env with your OpenAI API key${NC}"
fi

# Create run script
echo -e "${GREEN}Creating run script...${NC}"
cat > run.sh << 'EOL'
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
EOL

# Make scripts executable
chmod +x run.sh
chmod +x build.sh

echo -e "${GREEN}Build complete!${NC}"
echo -e "${GREEN}To start the application, run: ./run.sh${NC}"
