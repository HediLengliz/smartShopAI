@echo off
echo Setting environment variables...
set MONGODB_URI=mongodb://localhost:27017/intellicart
set PORT=5000
set NODE_ENV=development
set SESSION_SECRET=dev-secret
set PYTHON_CHATBOT_URL=http://localhost:5002

echo Starting SmartShopAI...
npm run dev