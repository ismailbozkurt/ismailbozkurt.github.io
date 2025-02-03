In this series, I will make a list of things that I think it will be complicated and try to explain them in a way that is easy to understand.

Lets think about a project with simple authentication feature with TypeScript, NodeJS and Vue.js. And lets see how things get complicated.

To do this, lets create with creating structure of the project.

### 1. Project Structure Setup

- Frontend (Vue.js + TypeScript)

  ```
  packages/frontend/
  ├── src/
  │   ├── components/     # Reusable Vue components
  │   ├── views/          # Page components
  │   ├── router/         # Vue Router configuration
  │   ├── store/          # State management
  │   ├── services/       # API services
  │   └── types/          # TypeScript type definitions
  ```

- Backend (Node.js + TypeScript)

  ```
  packages/backend/
  ├── src/
  │   ├── config/        # Configuration files
  │   ├── controllers/   # Request handlers
  │   ├── entities/      # TypeORM entities
  │   ├── middleware/    # Express middleware
  │   ├── routes/        # API routes
  │   ├── services/      # Business logic
  │   └── types/         # TypeScript type definitions
  ```

  It's simple approach to create project structure. Let's understand what are we going to do with this project.

  First, start with explaining how to create project structure.

  backend package is responsible for database operations, database structure, authentication etc.

  frontend package is responsible for user interface, authentication etc.

  Now, lets start with backend package.

First we need to create entity for user. There can be 2 types of users for now. Admin and User.

First create types for users and authentication.

backend/src/types/auth-type.ts

```ts
//Defines user roles as either 'user' or 'admin' using an enum, which is useful for role-based access control.
export enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

//Defines the structure for login requests, requiring an email and password.
export interface LoginRequest {
  email: string;
  password: string;
}

//Defines the structure for register requests, which extends the LoginRequest interface and includes a confirmPassword field.
export interface RegisterRequest extends LoginRequest {
  confirmPassword: string;
}

//Defines the structure for authentication responses, including a token and user details.
export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
}

//Defines the structure for JWT payload, which includes userId, email, and role.
export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}
```

Now, lets create database connection.

backend/src/config/database.ts

```ts
//Defines the DataSource configuration for TypeORM, including database connection details and entity mapping.
import { DataSource } from "typeorm";
import { User } from "../entities/User";

//Creates a new DataSource instance with the specified configuration.
export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "auth_system",
  synchronize: process.env.NODE_ENV !== "production",
  logging: process.env.NODE_ENV !== "production",
  entities: [User],
  migrations: [],
  subscribers: [],
});

//Initializes the database connection asynchronously.
export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log("Database connection established");
  } catch (error) {
    console.error("Error connecting to database:", error);
    throw error;
  }
};
```

To make a little filexible, create a .env file and add the following variables:

backend/.env

```
# Server Configuration
PORT=3000
HOST=192.168.1.109
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=auth_system

# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=1h
```

Now, lets create entity for user.

backend/src/entities/User.ts

```ts
//Defines the User entity using TypeORM decorators, specifying the table name and columns.
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { UserRole } from "../types/auth-type";

//Specifies the table name for the User entity.
@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ default: false })
  emailVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

Before implementing middleware features, lets create a error handler.

backend/src/middleware/errorHandler-middleware.ts

```ts
import { Request, Response, NextFunction } from "express";

//Defines a custom error class that extends the built-in Error class.
export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

//Defines a middleware function that handles errors in the application.
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
  }

  //Logs unhandled errors to the console.
  console.error("Unhandled error:", err);
  return res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
};
```

Now, lets create a middleware for authentication.

backend/src/middleware/auth-middleware.ts

```ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./errorHandler-middleware";
import { JwtPayload, UserRole } from "../types/auth-type";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

//Defines a middleware function that authenticates the user by verifying the JWT token.
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      throw new AppError(401, "Authentication required");
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    ) as JwtPayload;

    req.user = decoded;
    next();
  } catch (error) {
    next(new AppError(401, "Invalid or expired token"));
  }
};

//Defines a middleware function that authorizes the user based on their role.
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, "Authentication required"));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, "Insufficient permissions"));
    }

    next();
  };
};
```

Also we need to create a middleware for validation.

backend/src/middleware/validation-middleware.ts

```ts
import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { AppError } from "./errorHandler-middleware";

//Defines a middleware function that validates the request using express-validator.
export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((error) => error.msg);
    throw new AppError(400, messages.join(", "));
  }
  next();
};
```

Now, lets create controllers for authentication and user.

backend/src/controllers/auth-controller.ts

```ts
import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import { AppError } from "../middleware/errorHandler-middleware";
import { LoginRequest, RegisterRequest, UserRole } from "../types/auth-type";

const userRepository = AppDataSource.getRepository(User);

//Defines the register function that handles user registration.
export const register = async (
  req: Request<{}, {}, RegisterRequest>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new AppError(400, "Email already registered");
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = userRepository.create({
      email,
      password: hashedPassword,
      role: UserRole.USER,
    });

    await userRepository.save(user);

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "1h" }
    );

    res.status(201).json({
      status: "success",
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

//Defines the login function that handles user login.
export const login = async (
  req: Request<{}, {}, LoginRequest>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    const user = await userRepository.findOne({ where: { email } });
    if (!user) {
      throw new AppError(401, "Invalid credentials");
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new AppError(401, "Invalid credentials");
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "1h" }
    );

    res.json({
      status: "success",
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
```

Now, lets create user controller.

backend/src/controllers/user-controller.ts

```ts
import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import { AppError } from "../middleware/errorHandler-middleware";

const userRepository = AppDataSource.getRepository(User);

//Defines the getProfile function that retrieves the user's profile information.
export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await userRepository.findOne({
      where: { id: req.user!.userId },
    });

    if (!user) {
      throw new AppError(404, "User not found");
    }

    res.json({
      status: "success",
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

//Defines the getAllUsers function that retrieves all users.
export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await userRepository.find({
      select: ["id", "email", "role", "emailVerified", "createdAt"],
    });

    res.json({
      status: "success",
      data: {
        users,
      },
    });
  } catch (error) {
    next(error);
  }
};
```

Now, lets create routes for user.

backend/src/routes/user-route.ts

```ts
import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth-middleware";
import { getProfile, getAllUsers } from "../controllers/user-controller";
import { UserRole } from "../types/auth-type";

export const userRouter = Router();

// Protected route - requires authentication
userRouter.get("/profile", authenticate, getProfile);

// Protected route - requires admin role
userRouter.get("/", authenticate, authorize(UserRole.ADMIN), getAllUsers);
```

Now, lets create auth routes.

backend/src/routes/auth-route.ts

```ts
import { Router } from "express";
import { body } from "express-validator";
import { register, login } from "../controllers/auth-controller";
import { validateRequest } from "../middleware/validation-middleware";

export const authRouter = Router();

authRouter.post(
  "/register",
  [
    body("email").isEmail().withMessage("Invalid email address"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long")
      .matches(/\d/)
      .withMessage("Password must contain at least one number")
      .matches(/[A-Z]/)
      .withMessage("Password must contain at least one uppercase letter"),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
  ],
  validateRequest,
  register
);

authRouter.post(
  "/login",
  [
    body("email").isEmail().withMessage("Invalid email address"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validateRequest,
  login
);
```

Now, lets create a index.ts file for complete backend.

backend/src/index.ts

```ts
import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { authRouter } from "./routes/auth-route";
import { userRouter } from "./routes/user-route";
import { errorHandler } from "./middleware/errorHandler-middleware";
import { initializeDatabase } from "./config/database";

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Routes
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);

// Error handling
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await initializeDatabase();
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
```

You would like to configure database password before starting server.
To install dependencies, create tsconfig.json file and add the following code:

tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

and package.json file and add the following code:

package.json

```json
{
  "name": "@auth-system/backend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "lint": "eslint . --ext .ts"
  },
  "dependencies": {
    "@auth-system/backend": "file:",
    "@auth-system/frontend": "file:../frontend",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.1",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.5",
    "express-validator": "^7.0.1",
    "jsonwebtoken": "^9.0.2",
    "pg": "^8.11.3",
    "typeorm": "^0.3.20"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jest": "^29.5.11",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/node": "^20.11.10",
    "@typescript-eslint/eslint-plugin": "^6.19.1",
    "@typescript-eslint/parser": "^6.19.1",
    "eslint": "^8.56.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.2",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.3.3"
  }
}
```

To start server, run the following command:

```
npm run dev:backend
```

![Backend server running](./public/images/backend-running.png)
