import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export interface SecurityConfig {
  contentSecurityPolicy?: {
    directives: Record<string, string[]>;
    reportOnly?: boolean;
  };
  strictTransportSecurity?: {
    maxAge: number;
    includeSubDomains?: boolean;
    preload?: boolean;
  };
  frameOptions?: 'DENY' | 'SAMEORIGIN' | string;
  contentTypeOptions?: boolean;
  referrerPolicy?: string;
  permissionsPolicy?: Record<string, string[]>;
  crossOriginEmbedderPolicy?: 'require-corp' | 'credentialless';
  crossOriginOpenerPolicy?: 'same-origin' | 'same-origin-allow-popups' | 'unsafe-none';
  crossOriginResourcePolicy?: 'same-site' | 'same-origin' | 'cross-origin';
}

const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  contentSecurityPolicy: {
    directives: {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-inline'", // Required for Next.js
        "'unsafe-eval'", // Required for development
        'https://vercel.live',
        'https://js.sentry-cdn.com',
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'", // Required for styled-components and Tailwind
        'https://fonts.googleapis.com',
      ],
      'img-src': [
        "'self'",
        'data:',
        'blob:',
        'https:',
        'https://res.cloudinary.com',
        'https://images.unsplash.com',
      ],
      'font-src': [
        "'self'",
        'https://fonts.gstatic.com',
      ],
      'connect-src': [
        "'self'",
        'https://api.sentry.io',
        'https://vercel.live',
        process.env.NODE_ENV === 'development' ? 'ws://localhost:*' : '',
      ].filter(Boolean),
      'frame-ancestors': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'upgrade-insecure-requests': [],
    },
    reportOnly: process.env.NODE_ENV === 'development',
  },
  strictTransportSecurity: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  frameOptions: 'DENY',
  contentTypeOptions: true,
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: ["'self'"],
    payment: ["'self'"],
    usb: [],
    bluetooth: [],
    magnetometer: [],
    gyroscope: [],
    accelerometer: [],
  },
  crossOriginEmbedderPolicy: 'require-corp',
  crossOriginOpenerPolicy: 'same-origin',
  crossOriginResourcePolicy: 'same-origin',
};

export class SecurityHeadersManager {
  private config: SecurityConfig;

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = this.mergeConfig(DEFAULT_SECURITY_CONFIG, config);
  }

  private mergeConfig(defaultConfig: SecurityConfig, userConfig: Partial<SecurityConfig>): SecurityConfig {
    return {
      ...defaultConfig,
      ...userConfig,
      contentSecurityPolicy: {
        ...defaultConfig.contentSecurityPolicy,
        ...userConfig.contentSecurityPolicy,
        directives: {
          ...defaultConfig.contentSecurityPolicy?.directives,
          ...userConfig.contentSecurityPolicy?.directives,
        },
      },
      permissionsPolicy: {
        ...defaultConfig.permissionsPolicy,
        ...userConfig.permissionsPolicy,
      },
    };
  }

  applyHeaders(response: NextResponse, request?: NextRequest): NextResponse {
    // Content Security Policy
    if (this.config.contentSecurityPolicy) {
      const cspHeader = this.buildCSPHeader(this.config.contentSecurityPolicy);
      const headerName = this.config.contentSecurityPolicy.reportOnly 
        ? 'Content-Security-Policy-Report-Only'
        : 'Content-Security-Policy';
      response.headers.set(headerName, cspHeader);
    }

    // Strict Transport Security (HTTPS only)
    if (this.config.strictTransportSecurity && request?.nextUrl.protocol === 'https:') {
      const hstsValue = this.buildHSTSHeader(this.config.strictTransportSecurity);
      response.headers.set('Strict-Transport-Security', hstsValue);
    }

    // X-Frame-Options
    if (this.config.frameOptions) {
      response.headers.set('X-Frame-Options', this.config.frameOptions);
    }

    // X-Content-Type-Options
    if (this.config.contentTypeOptions) {
      response.headers.set('X-Content-Type-Options', 'nosniff');
    }

    // Referrer Policy
    if (this.config.referrerPolicy) {
      response.headers.set('Referrer-Policy', this.config.referrerPolicy);
    }

    // Permissions Policy
    if (this.config.permissionsPolicy) {
      const permissionsValue = this.buildPermissionsPolicyHeader(this.config.permissionsPolicy);
      response.headers.set('Permissions-Policy', permissionsValue);
    }

    // Cross-Origin Embedder Policy
    if (this.config.crossOriginEmbedderPolicy) {
      response.headers.set('Cross-Origin-Embedder-Policy', this.config.crossOriginEmbedderPolicy);
    }

    // Cross-Origin Opener Policy
    if (this.config.crossOriginOpenerPolicy) {
      response.headers.set('Cross-Origin-Opener-Policy', this.config.crossOriginOpenerPolicy);
    }

    // Cross-Origin Resource Policy
    if (this.config.crossOriginResourcePolicy) {
      response.headers.set('Cross-Origin-Resource-Policy', this.config.crossOriginResourcePolicy);
    }

    // Additional security headers
    response.headers.set('X-DNS-Prefetch-Control', 'off');
    response.headers.set('X-Download-Options', 'noopen');
    response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');

    return response;
  }

  private buildCSPHeader(csp: NonNullable<SecurityConfig['contentSecurityPolicy']>): string {
    return Object.entries(csp.directives)
      .map(([directive, sources]) => {
        if (sources.length === 0) {
          return directive;
        }
        return `${directive} ${sources.join(' ')}`;
      })
      .join('; ');
  }

  private buildHSTSHeader(hsts: NonNullable<SecurityConfig['strictTransportSecurity']>): string {
    let value = `max-age=${hsts.maxAge}`;
    
    if (hsts.includeSubDomains) {
      value += '; includeSubDomains';
    }
    
    if (hsts.preload) {
      value += '; preload';
    }
    
    return value;
  }

  private buildPermissionsPolicyHeader(permissions: Record<string, string[]>): string {
    return Object.entries(permissions)
      .map(([feature, allowlist]) => {
        if (allowlist.length === 0) {
          return `${feature}=()`;
        }
        return `${feature}=(${allowlist.join(' ')})`;
      })
      .join(', ');
  }

  // Method to validate CSP violations
  validateCSPViolation(violation: any): boolean {
    // Basic validation of CSP violation reports
    const requiredFields = ['document-uri', 'violated-directive', 'blocked-uri'];
    return requiredFields.every(field => field in violation);
  }

  // Method to generate nonce for inline scripts
  generateNonce(): string {
    return crypto.randomBytes(16).toString('base64');
  }

  // Method to add nonce to CSP
  addNonceToCSP(nonce: string): void {
    if (this.config.contentSecurityPolicy?.directives['script-src']) {
      this.config.contentSecurityPolicy.directives['script-src'].push(`'nonce-${nonce}'`);
    }
    if (this.config.contentSecurityPolicy?.directives['style-src']) {
      this.config.contentSecurityPolicy.directives['style-src'].push(`'nonce-${nonce}'`);
    }
  }

  // Method to get security score
  getSecurityScore(): {
    score: number;
    maxScore: number;
    recommendations: string[];
  } {
    let score = 0;
    const maxScore = 10;
    const recommendations: string[] = [];

    // CSP check
    if (this.config.contentSecurityPolicy) {
      score += 3;
      if (this.config.contentSecurityPolicy.reportOnly) {
        recommendations.push('Enable CSP enforcement (disable report-only mode)');
      }
    } else {
      recommendations.push('Implement Content Security Policy');
    }

    // HSTS check
    if (this.config.strictTransportSecurity) {
      score += 2;
    } else {
      recommendations.push('Enable Strict Transport Security');
    }

    // Frame options check
    if (this.config.frameOptions) {
      score += 1;
    } else {
      recommendations.push('Set X-Frame-Options header');
    }

    // Content type options check
    if (this.config.contentTypeOptions) {
      score += 1;
    } else {
      recommendations.push('Enable X-Content-Type-Options');
    }

    // Referrer policy check
    if (this.config.referrerPolicy) {
      score += 1;
    } else {
      recommendations.push('Set Referrer-Policy header');
    }

    // Permissions policy check
    if (this.config.permissionsPolicy) {
      score += 1;
    } else {
      recommendations.push('Implement Permissions Policy');
    }

    // Cross-origin policies check
    if (this.config.crossOriginEmbedderPolicy && 
        this.config.crossOriginOpenerPolicy && 
        this.config.crossOriginResourcePolicy) {
      score += 1;
    } else {
      recommendations.push('Configure Cross-Origin policies');
    }

    return { score, maxScore, recommendations };
  }
}

// Default instance
export const securityHeaders = new SecurityHeadersManager();

// CSP violation reporting endpoint handler
export async function handleCSPViolation(request: NextRequest) {
  try {
    const violation = await request.json();
    
    if (!securityHeaders.validateCSPViolation(violation)) {
      return NextResponse.json({ error: 'Invalid violation report' }, { status: 400 });
    }

    // Log violation
    console.warn('CSP Violation:', {
      documentUri: violation['document-uri'],
      violatedDirective: violation['violated-directive'],
      blockedUri: violation['blocked-uri'],
      sourceFile: violation['source-file'],
      lineNumber: violation['line-number'],
      columnNumber: violation['column-number'],
    });

    // Send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Send to Sentry or other monitoring service
      // await sendCSPViolationToMonitoring(violation);
    }

    return NextResponse.json({ status: 'received' });
  } catch (error) {
    console.error('Error handling CSP violation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}