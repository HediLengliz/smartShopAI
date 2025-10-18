# IntelliCart Troubleshooting Guide

This guide will help you resolve common issues when running the IntelliCart application.

## Quick Diagnostics Checklist

Before diving into specific issues, check these basics:

- [ ] Node.js is installed (v18+): `node --version`
- [ ] MongoDB is running: Check MongoDB service status
- [ ] Dependencies are installed: `node_modules` folder exists
- [ ] `.env` file exists and is configured correctly
- [ ] Port 5000 is available (or your configured port)
- [ ] No TypeScript errors: Run `npm run check`

---

## Common Issues and Solutions

### 1. Server Won't Start

#### **Symptom**
```
Error: Cannot find module '@shared/schema'
Error: listen EADDRINUSE: address already in use :::5000
```

#### **Solutions**

**A. Missing Dependencies**
```bash
# Delete node_modules and reinstall
rmdir /s /q node_modules  # Windows
rm -rf node_modules       # Linux/Mac

npm install
```

**B. Port Already in Use**
```bash
# Option 1: Kill process using port 5000
netstat -ano | findstr :5000              # Windows - Find PID
taskkill /PID <PID> /F                    # Windows - Kill process

lsof -i :5000                             # Linux/Mac - Find PID
kill -9 <PID>                             # Linux/Mac - Kill process

# Option 2: Change port in .env
PORT=3000
```

**C. TypeScript Configuration Issues**
```bash
# Rebuild TypeScript
npm run check
npm run build
```

---

### 2. MongoDB Connection Failed

#### **Symptom**
```
MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017
MongoDB connection error
```

#### **Solutions**

**A. MongoDB Not Running**

**Windows:**
```bash
# Start MongoDB service
net start MongoDB

# Check if running
sc query MongoDB
tasklist | findstr mongod
```

**Linux:**
```bash
sudo systemctl start mongod
sudo systemctl status mongod
```

**Mac:**
```bash
brew services start mongodb-community
brew services list
```

**B. Wrong Connection String**

Check your `.env` file:
```env
# For local MongoDB
MONGODB_URI=mongodb://localhost:27017/intellicart

# For MongoDB Atlas (cloud)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/intellicart
```

**C. MongoDB Not Installed**

Download and install from: https://www.mongodb.com/try/download/community

Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas

**D. Firewall Blocking Connection**

```bash
# Windows - Add firewall rule
netsh advfirewall firewall add rule name="MongoDB" dir=in action=allow protocol=TCP localport=27017

# Linux - Allow port
sudo ufw allow 27017/tcp
```

---

### 3. Can't See Seeded Data / Empty Lists

#### **Symptom**
- Lists page shows "No lists yet"
- Products page is empty
- Dashboard shows no data

#### **Solutions**

**A. Data Not Transformed Correctly**

This was a bug in the initial code. Make sure you have the latest routes.ts with the `transformDocument` helper functions.

**B. Re-seed the Database**

```bash
# Seed the database
npm run db:seed
```

**C. Check API Response**

Test if data exists:
```bash
# Using curl (if available)
curl http://localhost:5000/api/lists

# Or open in browser
http://localhost:5000/api/lists
```

**D. Browser Cache Issues**

```
1. Open Developer Tools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"
```

**E. MongoDB ObjectId vs String ID Issue**

The frontend expects `id` but MongoDB returns `_id`. This should be fixed by the transform functions. Verify the API response includes `id` field:

```javascript
// Correct response format:
{
  "id": "507f1f77bcf86cd799439011",  // ✓ Has 'id'
  "title": "My List",
  "userId": "...",
  "createdAt": "2024-01-01"
}
```

---

### 4. Frontend Not Loading

#### **Symptom**
- Blank white screen
- "Cannot GET /" error
- React components not rendering

#### **Solutions**

**A. Development Server Issues**

```bash
# Stop server (Ctrl+C)
# Clear build cache
rmdir /s /q dist      # Windows
rm -rf dist           # Linux/Mac

# Restart server
npm run dev:win       # Windows
npm run dev           # Linux/Mac
```

**B. Check Vite Configuration**

Ensure `vite.config.ts` is properly configured and Vite is building the client.

**C. Check Browser Console**

Open Developer Tools (F12) and look for:
- JavaScript errors
- Failed network requests
- CORS errors

**D. Port Mismatch**

Make sure you're accessing the correct URL:
```
http://localhost:5000    ✓ Correct
http://localhost:3000    ✗ Wrong (unless you changed PORT)
```

---

### 5. API Endpoints Return Errors

#### **Symptom**
```
404 Not Found
500 Internal Server Error
Cannot read property 'id' of undefined
```

#### **Solutions**

**A. Run API Tests**

```bash
node test-api.js
```

This will test all endpoints and show which ones are failing.

**B. Check Server Logs**

Look at the terminal where the server is running for detailed error messages.

**C. Verify MongoDB Connection**

```bash
# Check if you can connect to MongoDB
mongo                                    # MongoDB Shell
mongosh                                  # MongoDB Shell (newer version)

# List databases
show dbs

# Use IntelliCart database
use intellicart

# Count documents
db.lists.countDocuments()
db.products.countDocuments()
```

**D. User ID Mismatch**

The app uses a mock user ID: `demo-user-123`. Make sure this user exists:

```bash
npm run db:seed    # This creates the demo user
```

---

### 6. Database Seeding Fails

#### **Symptom**
```
Error seeding database
Failed to create user
Validation error
```

#### **Solutions**

**A. Drop Database and Re-seed**

```bash
# In MongoDB shell
use intellicart
db.dropDatabase()
exit

# Then re-seed
npm run db:seed
```

**B. Check MongoDB Permissions**

Ensure your MongoDB user has write permissions.

**C. Validation Errors**

If you see validation errors, the schema might have changed. Delete and recreate:

```javascript
// In MongoDB shell
db.dropDatabase()
```

---

### 7. TypeScript Errors

#### **Symptom**
```
Cannot find module '@shared/schema'
Type 'X' is not assignable to type 'Y'
Property 'id' does not exist on type
```

#### **Solutions**

**A. Run Type Check**

```bash
npm run check
```

**B. Restart TypeScript Server (VS Code)**

```
1. Press Ctrl+Shift+P
2. Type "TypeScript: Restart TS Server"
3. Press Enter
```

**C. Update TypeScript Definitions**

```bash
npm install --save-dev @types/node @types/express @types/react
```

**D. Clean Build**

```bash
rmdir /s /q dist node_modules    # Windows
rm -rf dist node_modules          # Linux/Mac
npm install
npm run build
```

---

### 8. AI Features Not Working

#### **Symptom**
- NLP parsing not working correctly
- Recommendations showing random products
- Chatbot giving generic responses

#### **Solutions**

**A. This is Expected**

The app uses **mock implementations** for AI features. They are designed to be replaced with real AI services.

**B. To Integrate Real AI**

Edit `server/services/ai-agents.ts`:

```javascript
// For OpenAI GPT
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// For NLP
import nlp from 'compromise';
const doc = nlp(text);
```

**C. Set API Keys**

Add to `.env`:
```env
OPENAI_API_KEY=sk-...
HUGGINGFACE_API_KEY=hf_...
```

---

### 9. Build Fails in Production

#### **Symptom**
```
npm run build fails
ESBuild errors
Vite build errors
```

#### **Solutions**

**A. Fix TypeScript Errors First**

```bash
npm run check
```

Fix all TypeScript errors before building.

**B. Clean Install**

```bash
rmdir /s /q node_modules dist    # Windows
rm -rf node_modules dist          # Linux/Mac
npm install
npm run build
```

**C. Node Version**

Ensure you're using Node.js 18 or higher:
```bash
node --version
```

---

### 10. Performance Issues

#### **Symptom**
- App is slow
- Pages take long to load
- Database queries are slow

#### **Solutions**

**A. Add Database Indexes**

The models already have indexes defined. Ensure they're created:

```bash
# In MongoDB shell
use intellicart
db.products.getIndexes()
db.lists.getIndexes()
```

**B. Limit Query Results**

```javascript
// Add pagination to large queries
.limit(50)
.skip(page * 50)
```

**C. Use Lean Queries**

Already implemented with `.lean()` for better performance.

**D. Enable Production Mode**

```env
NODE_ENV=production
```

---

## Advanced Troubleshooting

### Enable Debug Logging

Add to `.env`:
```env
DEBUG=true
LOG_LEVEL=debug
ENABLE_REQUEST_LOGGING=true
```

### Check System Resources

```bash
# Windows
tasklist /FI "IMAGENAME eq node.exe"
tasklist /FI "IMAGENAME eq mongod.exe"

# Linux/Mac
ps aux | grep node
ps aux | grep mongod
```

### Network Issues

```bash
# Check if port is accessible
telnet localhost 5000

# Test API endpoint
curl -v http://localhost:5000/api/lists
```

### Database Connection String Formats

```env
# Local
MONGODB_URI=mongodb://localhost:27017/intellicart

# Local with auth
MONGODB_URI=mongodb://username:password@localhost:27017/intellicart

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/intellicart?retryWrites=true&w=majority

# Replica Set
MONGODB_URI=mongodb://host1:27017,host2:27017,host3:27017/intellicart?replicaSet=rs0
```

---

## Getting Help

If you're still experiencing issues:

1. **Check the logs** - Server terminal shows detailed errors
2. **Run the test suite** - `node test-api.js`
3. **Verify MongoDB** - Ensure it's running and accessible
4. **Check browser console** - Open DevTools (F12) for frontend errors
5. **Review documentation** - Read README.md for setup instructions
6. **Check attached assets** - Review the architecture diagrams

### Useful Commands

```bash
# Start fresh
rmdir /s /q node_modules dist .env    # Windows
rm -rf node_modules dist .env          # Linux/Mac
copy .env.development .env             # Windows
cp .env.development .env               # Linux/Mac
npm install
npm run db:seed
npm run dev:win                        # Windows
npm run dev                            # Linux/Mac

# Check everything
node --version                         # Node.js installed?
npm run check                          # TypeScript OK?
curl http://localhost:5000/api/lists   # API working?
node test-api.js                       # All endpoints working?
```

---

## Prevention Tips

1. **Always use the startup script** - `start-dev.bat` checks everything
2. **Keep dependencies updated** - `npm update`
3. **Backup your database** - `mongodump`
4. **Use environment variables** - Never hardcode config
5. **Monitor logs** - Watch server output for warnings
6. **Test after changes** - Run `node test-api.js`
7. **Use version control** - Commit working versions

---

## Still Having Issues?

Create an issue with:
- Error messages (full stack trace)
- Server logs
- Browser console output
- Node version: `node --version`
- Operating system
- Steps to reproduce

---

**Last Updated**: Based on fixes applied to resolve MongoDB ObjectId and type system issues.