# 🏗️ Arquitectura del Sistema Lealta 2.0

## 📊 **Diagrama General del Sistema**

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[Portal Cliente] --> B[Admin Dashboard]
        B --> C[Staff POS]
        C --> D[SuperAdmin Analytics]
    end
    
    subgraph "API Layer"
        E[NextAuth API] --> F[Business APIs]
        F --> G[Portal APIs]
        G --> H[Staff APIs]
        H --> I[Admin APIs]
    end
    
    subgraph "Business Logic"
        J[Error Handler] --> K[Business Utils]
        K --> L[Loyalty Engine]
        L --> M[OCR Service]
    end
    
    subgraph "Data Layer"
        N[(PostgreSQL)] --> O[Prisma ORM]
        P[(Redis Cache)] --> Q[Vercel Blob]
    end
    
    subgraph "External Services"
        R[Sentry Monitoring] --> S[Gemini AI]
        S --> T[Cloudinary Images]
    end
    
    A --> E
    B --> F
    C --> H
    D --> I
    E --> J
    F --> K
    G --> L
    H --> M
    J --> O
    K --> N
    L --> P
    M --> Q
    O --> R
```

## 🏢 **Arquitectura Multi-Tenant**

```mermaid
graph LR
    subgraph "Business Isolation"
        A[Business 1] --> B[Users 1]
        A --> C[Clients 1]
        A --> D[Data 1]
        
        E[Business 2] --> F[Users 2]
        E --> G[Clients 2]
        E --> H[Data 2]
        
        I[Business N] --> J[Users N]
        I --> K[Clients N]
        I --> L[Data N]
    end
    
    subgraph "Shared Infrastructure"
        M[NextAuth] --> N[Prisma]
        N --> O[(PostgreSQL)]
        P[Error Handler] --> Q[Sentry]
        R[File Storage] --> S[Vercel Blob]
    end
    
    B --> M
    F --> M
    J --> M
    
    C --> N
    G --> N
    K --> N
    
    D --> O
    H --> O
    L --> O
```

## 🔄 **Flujo de Datos Principal**

```mermaid
sequenceDiagram
    participant C as Cliente
    participant P as Portal
    participant API as API Layer
    participant BL as Business Logic
    participant DB as Database
    participant AI as Gemini AI
    
    C->>P: Registro/Login
    P->>API: POST /api/cliente/registro
    API->>BL: Validate Business Context
    BL->>DB: Create Cliente + Tarjeta
    DB-->>BL: Cliente Created
    BL-->>API: Success Response
    API-->>P: Cliente Data
    P-->>C: Welcome + Points
    
    Note over C,AI: Consumo Flow
    C->>P: Upload Ticket
    P->>API: POST /api/staff/consumo
    API->>AI: OCR Analysis
    AI-->>API: Products + Total
    API->>BL: Calculate Points
    BL->>DB: Save Consumo
    DB-->>BL: Consumo Saved
    BL->>BL: Evaluate Level Up
    BL->>DB: Update Tarjeta if needed
    DB-->>API: Updated Data
    API-->>P: Points + Level
    P-->>C: Success Notification
```

## 🗂️ **Estructura de Carpetas**

```mermaid
graph TD
    A[src/] --> B[app/]
    A --> C[components/]
    A --> D[lib/]
    A --> E[utils/]
    A --> F[types/]
    A --> G[middleware/]
    A --> H[hooks/]
    
    B --> B1[api/]
    B --> B2[[businessId]/]
    B --> B3[admin/]
    B --> B4[cliente/]
    B --> B5[staff/]
    
    B1 --> B1A[auth/]
    B1 --> B1B[portal/]
    B1 --> B1C[staff/]
    B1 --> B1D[admin/]
    B1 --> B1E[cliente/]
    
    C --> C1[ui/]
    C --> C2[admin-v2/]
    C --> C3[cliente/]
    C --> C4[layouts/]
    
    D --> D1[auth.config.ts]
    D --> D2[error-handler.ts]
    D --> D3[prisma.ts]
    D --> D4[validations.ts]
    
    E --> E1[business.ts]
    E --> E2[evaluate-level.ts]
    E --> E3[logger.ts]
    
    F --> F1[next-auth.d.ts]
    F --> F2[prisma.ts]
    F --> F3[api-routes.ts]
    
    G --> G1[api-error-middleware.ts]
    G --> G2[requireAuth.ts]
    G --> G3[security.ts]
```

## 🎯 **Modelo de Datos (Entidades Principales)**

```mermaid
erDiagram
    Business ||--o{ User : has
    Business ||--o{ Cliente : has
    Business ||--o{ Location : has
    Business ||--o{ Consumo : has
    Business ||--o{ PortalBanner : has
    Business ||--o{ PortalPromocion : has
    Business ||--o{ BrandingConfig : has
    
    User ||--o{ Consumo : creates
    Cliente ||--o{ Consumo : makes
    Cliente ||--|| TarjetaLealtad : has
    Cliente ||--o{ HistorialCanje : makes
    Cliente ||--o{ Visita : makes
    
    Location ||--o{ Consumo : receives
    
    Business {
        string id PK
        string name
        string slug
        string subdomain
        string subscriptionPlan
        boolean isActive
        json settings
    }
    
    User {
        string id PK
        string businessId FK
        string email
        string passwordHash
        string role
        boolean isActive
    }
    
    Cliente {
        string id PK
        string businessId FK
        string cedula
        string nombre
        int puntos
        int puntosAcumulados
        int totalVisitas
        float totalGastado
    }
    
    TarjetaLealtad {
        string id PK
        string clienteId FK
        string businessId FK
        string nivel
        int puntosProgreso
        boolean asignacionManual
        boolean activa
    }
    
    Consumo {
        string id PK
        string businessId FK
        string clienteId FK
        string locationId FK
        json productos
        float total
        int puntos
        boolean pagado
    }
```

## 🔐 **Flujo de Autenticación**

```mermaid
graph TD
    A[User Login] --> B{User Type?}
    
    B -->|Staff/Admin| C[NextAuth Login]
    B -->|Cliente| D[Cedula Login]
    
    C --> E[Validate Credentials]
    E --> F[Check Business Access]
    F --> G[Create JWT Session]
    G --> H[Redirect to Dashboard]
    
    D --> I[Validate Cedula]
    I --> J[Check Business Context]
    J --> K[Set Client Cookie]
    K --> L[Redirect to Portal]
    
    subgraph "Session Management"
        M[JWT Token] --> N[Business ID]
        N --> O[User Role]
        O --> P[Permissions]
    end
    
    subgraph "Client Session"
        Q[Client Cookie] --> R[Cedula]
        R --> S[Business Context]
        S --> T[Portal Access]
    end
    
    G --> M
    K --> Q
```

## 🚀 **Arquitectura de Deployment**

```mermaid
graph TB
    subgraph "Development"
        A[Local Dev] --> B[SQLite/PostgreSQL]
        A --> C[Local Storage]
    end
    
    subgraph "Production - Vercel"
        D[Next.js App] --> E[Serverless Functions]
        E --> F[Edge Runtime]
    end
    
    subgraph "Database Layer"
        G[(Neon PostgreSQL)] --> H[Connection Pooling]
        H --> I[Prisma Client]
    end
    
    subgraph "Storage & Cache"
        J[Vercel Blob] --> K[Image Storage]
        L[(Upstash Redis)] --> M[Session Cache]
    end
    
    subgraph "Monitoring & AI"
        N[Sentry] --> O[Error Tracking]
        P[Gemini AI] --> Q[OCR Processing]
    end
    
    D --> G
    E --> L
    F --> J
    D --> N
    E --> P
    
    subgraph "CDN & Performance"
        R[Vercel Edge] --> S[Global Distribution]
        S --> T[Static Assets]
        T --> U[Image Optimization]
    end
    
    D --> R
```

## 🎨 **Componentes UI Hierarchy**

```mermaid
graph TD
    A[App Layout] --> B[Header]
    A --> C[Main Content]
    A --> D[Footer]
    
    C --> E{Route Type}
    
    E -->|Portal| F[Portal Layout]
    E -->|Admin| G[Admin Layout]
    E -->|Staff| H[Staff Layout]
    
    F --> F1[Cliente Components]
    F1 --> F1A[TarjetaLealtad]
    F1 --> F1B[MenuCategorias]
    F1 --> F1C[Promociones]
    F1 --> F1D[Recompensas]
    
    G --> G1[Admin Components]
    G1 --> G1A[Dashboard]
    G1 --> G1B[Analytics]
    G1 --> G1C[Portal Config]
    G1 --> G1D[User Management]
    
    H --> H1[Staff Components]
    H1 --> H1A[OCR Scanner]
    H1 --> H1B[Client Search]
    H1 --> H1C[Consumo Form]
    H1 --> H1D[Points Calculator]
    
    subgraph "Shared UI Components"
        I[Button] --> J[Form]
        J --> K[Modal]
        K --> L[Card]
        L --> M[Chart]
    end
    
    F1 --> I
    G1 --> I
    H1 --> I
```

## 🔄 **PWA Architecture**

```mermaid
graph LR
    subgraph "PWA Layer"
        A[Service Worker] --> B[Cache Strategy]
        B --> C[Offline Support]
        C --> D[Background Sync]
    end
    
    subgraph "Installation Flow"
        E[PWA Controller] --> F[Install Prompt]
        F --> G[Manifest.json]
        G --> H[Icons & Theme]
    end
    
    subgraph "Platform Support"
        I[Web Browser] --> J[Mobile PWA]
        J --> K[Desktop PWA]
        K --> L[Electron App]
    end
    
    A --> E
    E --> I
    
    subgraph "Caching Strategy"
        M[Network First] --> N[Cache Fallback]
        N --> O[Static Assets]
        O --> P[API Responses]
    end
    
    B --> M
```

---

## 📝 **Cómo usar estos diagramas:**

1. **Copia cualquier diagrama** que te interese
2. **Pégalo en cualquier editor Mermaid** como:
   - [Mermaid Live Editor](https://mermaid.live/)
   - GitHub (en archivos .md)
   - Notion, Obsidian, etc.
3. **Personaliza** según tus necesidades

## 🎯 **Diagramas más útiles para presentaciones:**

- **Diagrama General** - Para overview técnico
- **Multi-Tenant** - Para explicar escalabilidad
- **Flujo de Datos** - Para entender el proceso
- **Modelo de Datos** - Para arquitectura de BD

¿Te gustaría que profundice en algún diagrama específico o cree alguno adicional?