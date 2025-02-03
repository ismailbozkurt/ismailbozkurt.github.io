# Authentication Implementation Steps

Hi there, I think i made so many fail implementations in this part. In this part i'll continue to potato implementations. In the below i explained a little what i did and what i'll do.

## Backend Setup

For now I've made some changes in User.ts file. I've no service for email send and verifications. Might be I'll add them later.

### User Entity (`packages/backend/src/entities/User.ts`)

```typescript
  @Column({ default: true })
  emailVerified!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
```

Authentication Types mostly same as previous.

### Authentication Types (`packages/backend/src/types/auth-type.ts`)

```typescript
export enum UserRole {
  ADMIN = "admin",
  USER = "user",
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  confirmPassword: string;
  role?: UserRole;
}

export interface AuthResponse {
  status: string;
  data: {
    token: string;
    user: User;
  };
}
```

In the validation middleware, I've added some changes. I've added a new logic for error handling. If there is an error, it will be handled by the error handler middleware.

### Validation Middleware (`packages/backend/src/middleware/validation-middleware.ts`)

```typescript
import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { AppError } from "./errorHandler-middleware";

export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const messages = errors.array().map((error) => error.msg);
      throw new AppError(400, messages.join(", "));
    }
    next();
  } catch (error) {
    next(error);
  }
};
```

Authentication Controller added property for controlling user role.

### Authentication Controller (`packages/backend/src/controllers/auth-controller.ts`)

```typescript
export const register = async (
  req: Request<{}, {}, RegisterRequest>,
  res: Response,
  next: NextFunction
) => {
  try {
    // Create user with explicit role handling
    const userRole = role
      ? UserRole[role.toUpperCase() as keyof typeof UserRole]
      : UserRole.USER;
    const user = userRepository.create({
      email,
      password,
      role: userRole,
    });

    res.status(201).json({
      status: "success",
      data: { token, user },
    });
  } catch (error) {
    next(error);
  }
};
```

Same as previous. Nothing new here.

### Authentication Routes (`packages/backend/src/routes/auth-route.ts`)

```typescript
router.post(
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
    body("role")
      .optional()
      .isIn(Object.values(UserRole))
      .withMessage('Invalid role. Must be either "admin" or "user"'),
  ],
  validateRequest,
  register
);
```

## Frontend Setup

I've created a new service for authentication. This service is used for authentication for now.

### Authentication Service (`packages/frontend/src/services/auth.service.ts`)

```typescript
import axios from "axios";

const API_URL = "http://192.168.1.109:3000/api/auth";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  status: string;
  data: {
    token: string;
    user: User;
  };
}

class AuthService {
  private static instance: AuthService;
  private token: string | null = null;
  private user: User | null = null;

  private constructor() {
    // Initialize token and user from localStorage if exists
    this.token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        this.user = JSON.parse(userStr);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
    if (this.token) {
      this.setAuthHeader(this.token);
    }
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private setAuthHeader(token: string) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await axios.post<AuthResponse>(
        `${API_URL}/login`,
        credentials
      );
      const { token, user } = response.data.data;

      // Store token and user data
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      this.token = token;
      this.user = user;
      this.setAuthHeader(token);

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      this.token = null;
      this.user = null;
      delete axios.defaults.headers.common["Authorization"];
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getUser(): User | null {
    return this.user;
  }

  getUserRole(): string {
    return this.user?.role || "user";
  }

  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || "An error occurred";
      return new Error(message);
    }
    return error;
  }
}

export default AuthService.getInstance();
```

Here I've added dashboard route and role based authentication.

### Router Configuration (`packages/frontend/src/router/index.ts`)

```typescript
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/dashboard",
      name: "dashboard",
      component: DashboardView,
      meta: {
        requiresAuth: true,
        allowedRoles: ["admin", "user"],
      },
    },
  ],
});

router.beforeEach((to, from, next) => {
  const isAuthenticated = authService.isAuthenticated();
  const userRole = authService.getUserRole();

  if (to.meta.requiresAuth) {
    if (!isAuthenticated) {
      return next({ name: "login" });
    }

    const allowedRoles = to.meta.allowedRoles as string[] | undefined;
    if (allowedRoles && !allowedRoles.includes(userRole.toLowerCase())) {
      return next({ name: "login" });
    }
  }

  next();
});
```

Dashboard View is the main view of the application. It is the view that will be shown to the user after login. Dashboard View is protected and only accessible to authenticated users and different content will be shown based on user role.

### Dashboard View (`packages/frontend/src/views/DashboardView.vue`)

```vue
<template>
  <div class="dashboard">
    <header class="header">
      <div class="header-left">
        <h1>Dashboard</h1>
        <span class="role-badge" :class="{ 'role-admin': isAdmin }">
          {{ userRole }}
        </span>
      </div>
    </header>
    <main class="content">
      <div v-if="isAdmin" class="admin-section">
        <div class="admin-stats">
          <div class="stat-card">
            <h3>Total Users</h3>
            <p class="stat-value">{{ stats.totalUsers }}</p>
            <p class="stat-trend" :class="{ 'trend-up': true }">
              <span class="trend-icon">↑</span>
              <span>2 new today</span>
            </p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const stats = ref<DashboardStats>({
  totalUsers: 0,
  activeSessions: 0,
  systemStatus: "Loading...",
});

onMounted(async () => {
  const user = authService.getUser();
  if (user) {
    userEmail.value = user.email;
    userRole.value = user.role;

    try {
      const response = await axios.get("https://ipapi.co/json/");
      userLocation.value = `${response.data.city}, ${response.data.country_name}`;
    } catch (error) {
      userLocation.value = "Location unavailable";
    }

    if (isAdmin.value) {
      fetchStats();
    }
  }
});
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background-color: #f8fafc;
}

.stat-card {
  background-color: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.role-badge {
  background-color: #22c55e;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.role-badge.role-admin {
  background-color: #3b82f6;
}
</style>
```

### User Creation and Authentication Testing

I've created two users for testing. One is admin and the other is user. I've used curl for creating users.

```bash
    curl -X POST http://192.168.1.109:3000/api/auth/register -H "Content-Type: application/json" -d '{"email":"admin-user@example.com","password":"AdminUser123!","confirmPassword":"AdminUser123!","role":"admin"}'
    curl -X POST http://192.168.1.109:3000/api/auth/register -H "Content-Type: application/json" -d '{"email":"kebap-user@example.com","password":"KebapUser123!","confirmPassword":"KebapUser123!","role":"user"}'
```

I've also created a login request for testing.

```bash
    curl -X POST http://192.168.1.109:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin-user@example.com","password":"AdminUser123!"}'

    curl -X POST http://192.168.1.109:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"kebap-user@example.com","password":"KebapUser123!"}'
```

### Project Structure

```
.
├── package.json
├── package-lock.json
├── packages
│   ├── backend
│   │   ├── package.json
│   │   ├── src
│   │   │   ├── config
│   │   │   │   └── database.ts
│   │   │   ├── controllers
│   │   │   │   ├── auth-controller.ts
│   │   │   │   └── user-controller.ts
│   │   │   ├── entities
│   │   │   │   └── User.ts
│   │   │   ├── index.ts
│   │   │   ├── middleware
│   │   │   │   ├── auth-middleware.ts
│   │   │   │   ├── errorHandler-middleware.ts
│   │   │   │   └── validation-middleware.ts
│   │   │   ├── routes
│   │   │   │   ├── auth-route.ts
│   │   │   │   └── user-route.ts
│   │   │   └── types
│   │   │       └── auth-type.ts
│   │   └── tsconfig.json
│   └── frontend
│       ├── env.d.ts
│       ├── eslint.config.ts
│       ├── index.html
│       ├── package.json
│       ├── public
│       │   └── favicon.ico
│       ├── README.md
│       ├── src
│       │   ├── App.vue
│       │   ├── assets
│       │   ├── main.ts
│       │   ├── router
│       │   │   ├── index.ts
│       │   │   └── router.ts
│       │   ├── services
│       │   │   └── auth.service.ts
│       │   └── views
│       │       ├── DashboardView.vue
│       │       ├── LoginView.vue
│       │       └── RegisterView.vue
│       ├── tsconfig.app.json
│       ├── tsconfig.json
│       ├── tsconfig.node.json
│       └── vite.config.ts
└── README.md
```

### Some views from UI.

#### Login Page

![Login Page](https://raw.githubusercontent.com/ismailbozkurt/ismailbozkurt.github.io/refs/heads/main/public/images/HTGC3-login.png)

#### Admin Dashboard Page

![Admin Dashboard Page](https://raw.githubusercontent.com/ismailbozkurt/ismailbozkurt.github.io/refs/heads/main/public/images/admin-dashboard-page.png)

#### User Dashboard Page

![User Dashboard Page](https://raw.githubusercontent.com/ismailbozkurt/ismailbozkurt.github.io/refs/heads/main/public/images/user-dashboard-page.png)

## Final Thoughts for this part

I think the app has security issues like IDOR, CSRF, JWT attacks etc etc. Also I didn't follow code standardization and code quality. The next part i will implement registration to UI and than start to create test scripts to the logics work as expected or not.

After than things gonna be more interesting and complicated.
