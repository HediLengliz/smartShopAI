@echo off
echo ========================================
echo   IntelliCart - Development Startup
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js is installed
node --version
echo.

REM Check if .env file exists
if not exist ".env" (
    echo [WARNING] .env file not found!
    echo Creating .env from .env.development...
    if exist ".env.development" (
        copy ".env.development" ".env"
        echo [OK] .env file created
    ) else (
        echo [ERROR] .env.development not found!
        echo Please create a .env file manually
        pause
        exit /b 1
    )
    echo.
)

REM Check if MongoDB is running (optional)
echo [INFO] Checking MongoDB connection...
echo Note: If MongoDB is not running, the app will fail to start
echo You can install MongoDB from: https://www.mongodb.com/try/download/community
echo Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo [INFO] node_modules not found. Installing dependencies...
    echo This may take a few minutes...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed
    echo.
)

REM Ask if user wants to seed the database
echo.
echo Do you want to seed the database with sample data?
echo This will clear existing data and add sample products, lists, orders, etc.
echo.
set /p SEED_DB="Seed database? (y/n): "

if /i "%SEED_DB%"=="y" (
    echo.
    echo [INFO] Seeding database...
    call npm run db:seed
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to seed database
        echo Make sure MongoDB is running and MONGODB_URI is correct in .env
        pause
        exit /b 1
    )
    echo [OK] Database seeded successfully
    echo.
)

REM Start the development server
echo ========================================
echo   Starting IntelliCart Development Server
echo ========================================
echo.
echo [INFO] Server will run on http://localhost:5000
echo [INFO] Press Ctrl+C to stop the server
echo.
echo Starting in 3 seconds...
timeout /t 3 >nul

call npm run dev:win

pause
