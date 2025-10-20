import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'node:util'
import { vi } from 'vitest'

// Polyfill para APIs Web de Next.js
globalThis.TextEncoder = TextEncoder
globalThis.TextDecoder = TextDecoder

// Mock de fetch global si no existe
if (!globalThis.fetch) {
  globalThis.fetch = vi.fn()
}

// Mock de Request, Response, Headers para Next.js Web APIs
if (typeof Request === 'undefined') {
  globalThis.Request = class MockRequest {
    constructor(input, init) {
      this.url = typeof input === 'string' ? input : input.url
      this.method = init?.method || 'GET'
      this.headers = new Headers(init?.headers || {})
      this.body = init?.body
    }
    
    clone() {
      return new MockRequest(this.url, {
        method: this.method,
        headers: this.headers,
        body: this.body
      })
    }
  }
}

if (typeof Response === 'undefined') {
  globalThis.Response = class MockResponse {
    constructor(body, init) {
      this.body = body
      this.status = init?.status || 200
      this.statusText = init?.statusText || 'OK'
      this.headers = new Headers(init?.headers || {})
    }
    
    json() {
      return Promise.resolve(JSON.parse(this.body))
    }
    
    text() {
      return Promise.resolve(this.body)
    }
    
    clone() {
      return new MockResponse(this.body, {
        status: this.status,
        statusText: this.statusText,
        headers: this.headers
      })
    }
  }
}

if (typeof Headers === 'undefined') {
  globalThis.Headers = class MockHeaders {
    constructor(init) {
      this.map = new Map()
      if (init) {
        for (const [key, value] of Object.entries(init)) {
          this.map.set(key.toLowerCase(), value)
        }
      }
    }
    
    get(name) {
      return this.map.get(name.toLowerCase())
    }
    
    set(name, value) {
      this.map.set(name.toLowerCase(), value)
    }
    
    has(name) {
      return this.map.has(name.toLowerCase())
    }
    
    delete(name) {
      this.map.delete(name.toLowerCase())
    }
    
    forEach(callback) {
      for (const [key, value] of this.map) {
        callback(value, key, this)
      }
    }
    
    entries() {
      return this.map.entries()
    }
    
    keys() {
      return this.map.keys()
    }
    
    values() {
      return this.map.values()
    }
  }
}

// Mock Next.js router
vi.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: vi.fn(),
      pop: vi.fn(),
      reload: vi.fn(),
      back: vi.fn(),
      prefetch: vi.fn().mockResolvedValue(undefined),
      beforePopState: vi.fn(),
      events: {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
      },
    }
  },
}))

// Mock Next.js navigation (App Router)
vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: vi.fn(),
      replace: vi.fn(),
      refresh: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
