# SmartShop

A monorepo combining a Java Spring Boot backend (Maven) and a small TypeScript/Express test controller.

## Prerequisites
- JDK 17\+
- Maven 3.9\+
- Node.js 18\+ and npm

## Getting started
1. Open the project in IntelliJ IDEA and let it index dependencies.
2. Backend \- Spring Boot:
   - Run in dev: `mvn clean spring-boot:run`
   - Build JAR: `mvn clean package`
   - Run JAR: `java -jar target/<artifact-name>.jar`
3. Node/TypeScript (optional test endpoint):
   - Ensure your Express app wires the exported controller from `src/main/java/smartshop/smartshop/controller/test.ts`.
   - Install deps: `npm install`
   - Start your Express server script (e.g., `npm run dev` or `npm start`).

## Project structure
- `pom.xml` \- Maven configuration.
- `src/main/java/...` \- Spring Boot application code.
- `src/main/resources/...` \- Spring Boot resources.
- `src/main/java/smartshop/smartshop/controller/test.ts` \- temporary TypeScript/Express test controller.

## API
- GET `/api/test` \- returns `{"message":"Test controller is working!"}` when the Express route is wired to the exported `testController`.

Example Express route wiring inside your Node app:
```ts
import express from 'express';
import { testController } from './src/main/java/smartshop/smartshop/controller/test';

const app = express();
app.get('/api/test', testController);
app.listen(3000, () => console.log('Listening on http://localhost:3000'));
