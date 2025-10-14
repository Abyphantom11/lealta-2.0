#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  srcDir: './src',
  docsDir: './docs',
  apiDir: './src/app/api',
  componentsDir: './src/components',
  hooksDir: './src/hooks',
  libDir: './src/lib',
  outputFile: './docs/API_DOCUMENTATION.md',
  readmeFile: './README.md',
};

class DocumentationGenerator {
  constructor() {
    this.apiEndpoints = [];
    this.components = [];
    this.hooks = [];
    this.utilities = [];
    this.schemas = [];
  }

  async generate() {
    console.log('🚀 Generating comprehensive documentation...');
    
    // Ensure docs directory exists
    if (!fs.existsSync(CONFIG.docsDir)) {
      fs.mkdirSync(CONFIG.docsDir, { recursive: true });
    }

    // Scan and analyze codebase
    await this.scanApiEndpoints();
    await this.scanComponents();
    await this.scanHooks();
    await this.scanUtilities();
    await this.scanSchemas();

    // Generate documentation files
    await this.generateApiDocs();
    await this.generateComponentDocs();
    await this.generateArchitectureDocs();
    await this.generateDeploymentDocs();
    await this.updateReadme();

    console.log('✅ Documentation generation complete!');
    console.log(`📁 Documentation available in: ${CONFIG.docsDir}`);
  }

  async scanApiEndpoints() {
    console.log('📡 Scanning API endpoints...');
    
    const scanDir = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else if (item === 'route.ts' || item === 'route.js') {
          this.analyzeApiRoute(fullPath);
        }
      });
    };

    scanDir(CONFIG.apiDir);
    console.log(`Found ${this.apiEndpoints.length} API endpoints`);
  }

  analyzeApiRoute(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(CONFIG.apiDir, filePath);
      const routePath = '/' + relativePath.replace('/route.ts', '').replace('/route.js', '');
      
      const endpoint = {
        path: routePath,
        file: filePath,
        methods: [],
        description: '',
        parameters: [],
        responses: [],
        authentication: false,
        rateLimit: false,
      };

      // Extract HTTP methods
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      methods.forEach(method => {
        if (content.includes(`export async function ${method}`)) {
          endpoint.methods.push(method);
        }
      });

      // Extract description from comments
      const descriptionMatch = content.match(/\/\*\*\s*\n\s*\*\s*(.+?)\s*\n/);
      if (descriptionMatch) {
        endpoint.description = descriptionMatch[1];
      }

      // Check for authentication
      if (content.includes('getToken') || content.includes('validateUserSession')) {
        endpoint.authentication = true;
      }

      // Check for rate limiting
      if (content.includes('rateLimit') || content.includes('Ratelimit')) {
        endpoint.rateLimit = true;
      }

      // Extract Zod schemas for parameters
      const schemaMatches = content.match(/const\s+(\w+Schema)\s*=\s*z\.object\({([^}]+)}\)/g);
      if (schemaMatches) {
        schemaMatches.forEach(match => {
          const schemaName = match.match(/const\s+(\w+Schema)/)[1];
          endpoint.parameters.push({
            schema: schemaName,
            definition: match,
          });
        });
      }

      this.apiEndpoints.push(endpoint);
    } catch (error) {
      console.warn(`Warning: Could not analyze ${filePath}:`, error.message);
    }
  }

  async scanComponents() {
    console.log('🧩 Scanning React components...');
    
    const scanDir = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else if (item.endsWith('.tsx') || item.endsWith('.jsx')) {
          this.analyzeComponent(fullPath);
        }
      });
    };

    scanDir(CONFIG.componentsDir);
    console.log(`Found ${this.components.length} components`);
  }

  analyzeComponent(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const fileName = path.basename(filePath, path.extname(filePath));
      
      const component = {
        name: fileName,
        file: filePath,
        description: '',
        props: [],
        exports: [],
        dependencies: [],
      };

      // Extract description from comments
      const descriptionMatch = content.match(/\/\*\*\s*\n\s*\*\s*(.+?)\s*\n/);
      if (descriptionMatch) {
        component.description = descriptionMatch[1];
      }

      // Extract interface definitions for props
      const interfaceMatches = content.match(/interface\s+(\w+Props)\s*{([^}]+)}/g);
      if (interfaceMatches) {
        interfaceMatches.forEach(match => {
          const interfaceName = match.match(/interface\s+(\w+Props)/)[1];
          component.props.push({
            interface: interfaceName,
            definition: match,
          });
        });
      }

      // Extract exports
      const exportMatches = content.match(/export\s+(?:function|const|class)\s+(\w+)/g);
      if (exportMatches) {
        exportMatches.forEach(match => {
          const exportName = match.match(/export\s+(?:function|const|class)\s+(\w+)/)[1];
          component.exports.push(exportName);
        });
      }

      // Extract imports to understand dependencies
      const importMatches = content.match(/import\s+.+\s+from\s+['"](.+)['"]/g);
      if (importMatches) {
        importMatches.forEach(match => {
          const dependency = match.match(/from\s+['"](.+)['"]/)[1];
          if (!dependency.startsWith('.') && !dependency.startsWith('/')) {
            component.dependencies.push(dependency);
          }
        });
      }

      this.components.push(component);
    } catch (error) {
      console.warn(`Warning: Could not analyze component ${filePath}:`, error.message);
    }
  }

  async scanHooks() {
    console.log('🪝 Scanning custom hooks...');
    
    const scanDir = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else if (item.startsWith('use') && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
          this.analyzeHook(fullPath);
        }
      });
    };

    scanDir(CONFIG.hooksDir);
    console.log(`Found ${this.hooks.length} custom hooks`);
  }

  analyzeHook(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const fileName = path.basename(filePath, path.extname(filePath));
      
      const hook = {
        name: fileName,
        file: filePath,
        description: '',
        parameters: [],
        returns: '',
        dependencies: [],
      };

      // Extract description from comments
      const descriptionMatch = content.match(/\/\*\*\s*\n\s*\*\s*(.+?)\s*\n/);
      if (descriptionMatch) {
        hook.description = descriptionMatch[1];
      }

      // Extract function signature
      const functionMatch = content.match(/export\s+function\s+\w+\s*\(([^)]*)\)/);
      if (functionMatch) {
        hook.parameters = functionMatch[1].split(',').map(param => param.trim()).filter(Boolean);
      }

      // Extract return type from TypeScript
      const returnMatch = content.match(/:\s*([^{]+)\s*{/);
      if (returnMatch) {
        hook.returns = returnMatch[1].trim();
      }

      this.hooks.push(hook);
    } catch (error) {
      console.warn(`Warning: Could not analyze hook ${filePath}:`, error.message);
    }
  }

  async scanUtilities() {
    console.log('🔧 Scanning utility functions...');
    
    const scanDir = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else if (item.endsWith('.ts') && !item.endsWith('.test.ts') && !item.endsWith('.spec.ts')) {
          this.analyzeUtility(fullPath);
        }
      });
    };

    scanDir(CONFIG.libDir);
    console.log(`Found ${this.utilities.length} utility modules`);
  }

  analyzeUtility(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const fileName = path.basename(filePath, path.extname(filePath));
      
      const utility = {
        name: fileName,
        file: filePath,
        description: '',
        exports: [],
        classes: [],
        functions: [],
      };

      // Extract description from comments
      const descriptionMatch = content.match(/\/\*\*\s*\n\s*\*\s*(.+?)\s*\n/);
      if (descriptionMatch) {
        utility.description = descriptionMatch[1];
      }

      // Extract exported functions
      const functionMatches = content.match(/export\s+(?:async\s+)?function\s+(\w+)/g);
      if (functionMatches) {
        functionMatches.forEach(match => {
          const functionName = match.match(/function\s+(\w+)/)[1];
          utility.functions.push(functionName);
        });
      }

      // Extract exported classes
      const classMatches = content.match(/export\s+class\s+(\w+)/g);
      if (classMatches) {
        classMatches.forEach(match => {
          const className = match.match(/class\s+(\w+)/)[1];
          utility.classes.push(className);
        });
      }

      this.utilities.push(utility);
    } catch (error) {
      console.warn(`Warning: Could not analyze utility ${filePath}:`, error.message);
    }
  }

  async scanSchemas() {
    console.log('📋 Scanning Zod schemas...');
    
    const scanDir = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
          this.analyzeSchemas(fullPath);
        }
      });
    };

    scanDir(CONFIG.srcDir);
    console.log(`Found ${this.schemas.length} Zod schemas`);
  }

  analyzeSchemas(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Extract Zod schema definitions
      const schemaMatches = content.match(/(?:export\s+)?const\s+(\w+Schema)\s*=\s*z\./g);
      if (schemaMatches) {
        schemaMatches.forEach(match => {
          const schemaName = match.match(/const\s+(\w+Schema)/)[1];
          this.schemas.push({
            name: schemaName,
            file: filePath,
          });
        });
      }
    } catch (error) {
      // Silently ignore files that can't be analyzed
    }
  }

  async generateApiDocs() {
    console.log('📝 Generating API documentation...');
    
    let content = `# API Documentation

Generated on: ${new Date().toISOString()}

## Overview

This document provides comprehensive documentation for all API endpoints in the Lealta 2.0 system.

## Authentication

Most API endpoints require authentication. The system uses NextAuth.js with JWT tokens.

### Authentication Headers
\`\`\`
Authorization: Bearer <jwt-token>
Cookie: next-auth.session-token=<session-token>
\`\`\`

## Endpoints

`;

    // Group endpoints by path prefix
    const groupedEndpoints = {};
    this.apiEndpoints.forEach(endpoint => {
      const prefix = endpoint.path.split('/')[1] || 'root';
      if (!groupedEndpoints[prefix]) {
        groupedEndpoints[prefix] = [];
      }
      groupedEndpoints[prefix].push(endpoint);
    });

    Object.entries(groupedEndpoints).forEach(([prefix, endpoints]) => {
      content += `### ${prefix.toUpperCase()} Endpoints\n\n`;
      
      endpoints.forEach(endpoint => {
        content += `#### ${endpoint.methods.join(', ')} ${endpoint.path}\n\n`;
        
        if (endpoint.description) {
          content += `${endpoint.description}\n\n`;
        }
        
        content += `**Methods:** ${endpoint.methods.join(', ')}\n\n`;
        
        if (endpoint.authentication) {
          content += `**Authentication:** Required 🔒\n\n`;
        }
        
        if (endpoint.rateLimit) {
          content += `**Rate Limit:** Applied ⚡\n\n`;
        }
        
        if (endpoint.parameters.length > 0) {
          content += `**Parameters:**\n`;
          endpoint.parameters.forEach(param => {
            content += `- ${param.schema}\n`;
          });
          content += '\n';
        }
        
        content += `**File:** \`${endpoint.file}\`\n\n`;
        content += '---\n\n';
      });
    });

    fs.writeFileSync(path.join(CONFIG.docsDir, 'API.md'), content);
  }

  async generateComponentDocs() {
    console.log('🧩 Generating component documentation...');
    
    let content = `# Component Documentation

Generated on: ${new Date().toISOString()}

## Overview

This document provides documentation for all React components in the Lealta 2.0 system.

## Components

`;

    this.components.forEach(component => {
      content += `### ${component.name}\n\n`;
      
      if (component.description) {
        content += `${component.description}\n\n`;
      }
      
      if (component.props.length > 0) {
        content += `**Props:**\n`;
        component.props.forEach(prop => {
          content += `\`\`\`typescript\n${prop.definition}\n\`\`\`\n\n`;
        });
      }
      
      if (component.exports.length > 0) {
        content += `**Exports:** ${component.exports.join(', ')}\n\n`;
      }
      
      if (component.dependencies.length > 0) {
        content += `**Dependencies:** ${component.dependencies.join(', ')}\n\n`;
      }
      
      content += `**File:** \`${component.file}\`\n\n`;
      content += '---\n\n';
    });

    fs.writeFileSync(path.join(CONFIG.docsDir, 'COMPONENTS.md'), content);
  }

  async generateArchitectureDocs() {
    console.log('🏗️ Generating architecture documentation...');
    
    const content = `# Architecture Documentation

Generated on: ${new Date().toISOString()}

## System Overview

Lealta 2.0 is a modern loyalty system built with Next.js 14, featuring:

- **Frontend:** Next.js 14 with App Router
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js
- **Styling:** Tailwind CSS
- **Monitoring:** Sentry + Custom Metrics
- **Deployment:** Vercel

## Architecture Layers

### 1. Presentation Layer
- React components with TypeScript
- Tailwind CSS for styling
- Framer Motion for animations
- Responsive design with mobile-first approach

### 2. Business Logic Layer
- Custom React hooks for state management
- Service layer for API interactions
- Validation with Zod schemas
- Error boundaries for fault tolerance

### 3. API Layer
- RESTful API endpoints
- Authentication middleware
- Rate limiting and security headers
- Request deduplication and caching

### 4. Data Layer
- PostgreSQL database
- Prisma ORM for type-safe queries
- Connection pooling and optimization
- Backup and disaster recovery

## Performance Optimizations

### Edge Request Optimization
- Intelligent polling with visibility control
- Request deduplication layer
- Multi-level caching strategy
- Static asset optimization

### Bundle Optimization
- Code splitting by routes and components
- Tree shaking for unused code
- Dynamic imports for heavy libraries
- Webpack bundle analysis

### Monitoring and Observability
- Real-time metrics collection
- Performance budget enforcement
- Error tracking and alerting
- Core Web Vitals monitoring

## Security Features

### Headers and Policies
- Content Security Policy (CSP)
- Strict Transport Security (HSTS)
- Cross-Origin policies
- Permission policies

### Authentication and Authorization
- JWT-based authentication
- Role-based access control
- Session management
- CSRF protection

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- Rate limiting

## Deployment Strategy

### CI/CD Pipeline
- Automated testing on PR
- Security scanning
- Performance audits
- Automated deployment to staging/production

### Infrastructure
- Vercel for hosting and edge functions
- PostgreSQL on managed service
- Redis for caching (optional)
- CDN for static assets

## Scalability Considerations

### Horizontal Scaling
- Stateless application design
- Database read replicas
- CDN for global distribution
- Load balancing

### Performance Monitoring
- Real-time metrics dashboard
- Automated alerting
- Performance budgets
- Capacity planning

## Development Workflow

### Code Quality
- TypeScript for type safety
- ESLint and Prettier for code formatting
- Husky for pre-commit hooks
- Automated testing

### Documentation
- Inline code documentation
- API documentation generation
- Architecture decision records
- Deployment guides
`;

    fs.writeFileSync(path.join(CONFIG.docsDir, 'ARCHITECTURE.md'), content);
  }

  async generateDeploymentDocs() {
    console.log('🚀 Generating deployment documentation...');
    
    const content = `# Deployment Guide

Generated on: ${new Date().toISOString()}

## Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- Git
- Vercel CLI (for deployment)

## Environment Variables

### Required Variables
\`\`\`bash
DATABASE_URL="postgresql://user:password@host:port/database"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://your-domain.com"
\`\`\`

### Optional Variables
\`\`\`bash
NEXT_PUBLIC_SENTRY_DSN="your-sentry-dsn"
UPSTASH_REDIS_REST_URL="your-redis-url"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"
SLACK_WEBHOOK_URL="your-slack-webhook"
\`\`\`

## Local Development

### 1. Clone Repository
\`\`\`bash
git clone https://github.com/your-org/lealta-2.0.git
cd lealta-2.0
\`\`\`

### 2. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Setup Database
\`\`\`bash
npx prisma migrate dev
npx prisma db seed
\`\`\`

### 4. Start Development Server
\`\`\`bash
npm run dev
\`\`\`

## Production Deployment

### Vercel Deployment (Recommended)

1. **Connect Repository**
   - Import project in Vercel dashboard
   - Connect to GitHub repository

2. **Configure Environment Variables**
   - Add all required environment variables
   - Set up production database

3. **Deploy**
   \`\`\`bash
   vercel --prod
   \`\`\`

### Manual Deployment

1. **Build Application**
   \`\`\`bash
   npm run build
   \`\`\`

2. **Start Production Server**
   \`\`\`bash
   npm start
   \`\`\`

## Database Migration

### Production Migration
\`\`\`bash
npx prisma migrate deploy
\`\`\`

### Backup Before Migration
\`\`\`bash
pg_dump $DATABASE_URL > backup.sql
\`\`\`

## Monitoring Setup

### Sentry Configuration
1. Create Sentry project
2. Add DSN to environment variables
3. Configure error tracking

### Performance Monitoring
1. Set up Lighthouse CI
2. Configure performance budgets
3. Set up alerting

## Health Checks

### Application Health
\`\`\`bash
curl https://your-domain.com/api/health
\`\`\`

### Database Health
\`\`\`bash
curl https://your-domain.com/api/health -X POST -d '{"detailed": true}'
\`\`\`

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check DATABASE_URL format
   - Verify database is accessible
   - Check connection limits

2. **Build Failures**
   - Clear .next directory
   - Check TypeScript errors
   - Verify all dependencies

3. **Performance Issues**
   - Check bundle size
   - Monitor Core Web Vitals
   - Review database queries

### Debug Commands
\`\`\`bash
# Check build output
npm run build

# Analyze bundle
npm run analyze

# Run tests
npm test

# Check types
npm run typecheck
\`\`\`

## Rollback Procedure

### Vercel Rollback
1. Go to Vercel dashboard
2. Select previous deployment
3. Click "Promote to Production"

### Manual Rollback
1. Revert to previous Git commit
2. Redeploy application
3. Run database migrations if needed

## Security Checklist

- [ ] All environment variables secured
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] Database access restricted
- [ ] API rate limiting enabled
- [ ] Error messages sanitized
- [ ] Dependencies updated
- [ ] Security audit passed
`;

    fs.writeFileSync(path.join(CONFIG.docsDir, 'DEPLOYMENT.md'), content);
  }

  async updateReadme() {
    console.log('📖 Updating README...');
    
    // Add documentation links to README
    const readmeContent = fs.readFileSync(CONFIG.readmeFile, 'utf8');
    
    const docsSection = `

## 📚 Documentation

- [API Documentation](./docs/API.md) - Complete API reference
- [Component Documentation](./docs/COMPONENTS.md) - React components guide
- [Architecture Documentation](./docs/ARCHITECTURE.md) - System architecture overview
- [Deployment Guide](./docs/DEPLOYMENT.md) - Production deployment instructions

### Auto-Generated Documentation

Documentation is automatically generated from code comments and type definitions. To regenerate:

\`\`\`bash
npm run generate-docs
\`\`\`

`;

    // Insert documentation section before the last section
    const updatedReadme = readmeContent.replace(
      /(\n---\n\n\*\*Lealta MVP v1\.0\*\*)/,
      docsSection + '$1'
    );

    fs.writeFileSync(CONFIG.readmeFile, updatedReadme);
  }
}

// Run documentation generation
if (require.main === module) {
  const generator = new DocumentationGenerator();
  generator.generate().catch(console.error);
}

module.exports = DocumentationGenerator;