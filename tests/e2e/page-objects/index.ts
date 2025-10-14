import { Page, Locator, expect } from '@playwright/test';

/**
 * 🎯 PAGE OBJECT MODEL - LOGIN PAGE
 * Centraliza selectores y acciones del login
 */
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly businessSelector: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('[data-testid="email-input"]');
    this.passwordInput = page.locator('[data-testid="password-input"]');
    this.loginButton = page.locator('[data-testid="login-button"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
    this.businessSelector = page.locator('[data-testid="business-selector"]');
  }

  async goto() {
    await this.page.goto('/');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async loginAsAdmin(businessId: string = 'cafedani') {
    await this.login(`admin@${businessId}.com`, 'admin123');
    await expect(this.page).toHaveURL(new RegExp(`/${businessId}/admin`));
  }

  async loginAsStaff(businessId: string = 'cafedani') {
    await this.login(`staff@${businessId}.com`, 'staff123');
    await expect(this.page).toHaveURL(new RegExp(`/${businessId}/staff`));
  }

  async expectErrorMessage(message: string) {
    await expect(this.errorMessage).toContainText(message);
  }
}

/**
 * 🎯 PAGE OBJECT MODEL - ADMIN DASHBOARD
 */
export class AdminDashboard {
  readonly page: Page;
  readonly dashboard: Locator;
  readonly metricsCard: Locator;
  readonly navClientes: Locator;
  readonly navMenu: Locator;
  readonly navReservas: Locator;
  readonly navReportes: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dashboard = page.locator('[data-testid="admin-dashboard"]');
    this.metricsCard = page.locator('[data-testid="metrics-card"]');
    this.navClientes = page.locator('[data-testid="nav-clientes"]');
    this.navMenu = page.locator('[data-testid="nav-menu"]');
    this.navReservas = page.locator('[data-testid="nav-reservas"]');
    this.navReportes = page.locator('[data-testid="nav-reportes"]');
  }

  async waitForLoad() {
    await expect(this.dashboard).toBeVisible();
    await expect(this.metricsCard).toBeVisible();
  }

  async goToClientes() {
    await this.navClientes.click();
    await expect(this.page).toHaveURL(/clientes/);
  }

  async goToMenu() {
    await this.navMenu.click();
    await expect(this.page).toHaveURL(/menu/);
  }

  async goToReservas() {
    await this.navReservas.click();
    await expect(this.page).toHaveURL(/reservas/);
  }
}

/**
 * 🎯 PAGE OBJECT MODEL - STAFF POS
 */
export class StaffPOS {
  readonly page: Page;
  readonly posInterface: Locator;
  readonly clientSearch: Locator;
  readonly searchButton: Locator;
  readonly clientItem: Locator;
  readonly addConsumo: Locator;
  readonly montoInput: Locator;
  readonly confirmConsumo: Locator;
  readonly clientPoints: Locator;

  constructor(page: Page) {
    this.page = page;
    this.posInterface = page.locator('[data-testid="pos-interface"]');
    this.clientSearch = page.locator('[data-testid="client-search"]');
    this.searchButton = page.locator('[data-testid="search-button"]');
    this.clientItem = page.locator('[data-testid="client-item"]');
    this.addConsumo = page.locator('[data-testid="add-consumo"]');
    this.montoInput = page.locator('[data-testid="monto-input"]');
    this.confirmConsumo = page.locator('[data-testid="confirm-consumo"]');
    this.clientPoints = page.locator('[data-testid="client-points"]');
  }

  async waitForLoad() {
    await expect(this.posInterface).toBeVisible();
  }

  async searchClient(name: string) {
    await this.clientSearch.fill(name);
    await this.searchButton.click();
  }

  async selectFirstClient() {
    await this.clientItem.first().click();
  }

  async addConsumption(amount: string) {
    await this.addConsumo.click();
    await this.montoInput.fill(amount);
    await this.confirmConsumo.click();
  }

  async expectClientPoints(expectedPoints: string) {
    await expect(this.clientPoints).toContainText(expectedPoints);
  }
}

/**
 * 🎯 PAGE OBJECT MODEL - CLIENT PORTAL
 */
export class ClientPortal {
  readonly page: Page;
  readonly registerButton: Locator;
  readonly nombreInput: Locator;
  readonly cedulaInput: Locator;
  readonly telefonoInput: Locator;
  readonly submitRegistration: Locator;
  readonly clientDashboard: Locator;
  readonly mobileMenu: Locator;
  readonly mobileMenuToggle: Locator;
  readonly mobileNav: Locator;
  readonly mobileRegister: Locator;
  readonly registrationForm: Locator;

  constructor(page: Page) {
    this.page = page;
    this.registerButton = page.locator('[data-testid="register-button"]');
    this.nombreInput = page.locator('[data-testid="nombre-input"]');
    this.cedulaInput = page.locator('[data-testid="cedula-input"]');
    this.telefonoInput = page.locator('[data-testid="telefono-input"]');
    this.submitRegistration = page.locator('[data-testid="submit-registration"]');
    this.clientDashboard = page.locator('[data-testid="client-dashboard"]');
    this.mobileMenu = page.locator('[data-testid="mobile-menu"]');
    this.mobileMenuToggle = page.locator('[data-testid="mobile-menu-toggle"]');
    this.mobileNav = page.locator('[data-testid="mobile-nav"]');
    this.mobileRegister = page.locator('[data-testid="mobile-register"]');
    this.registrationForm = page.locator('[data-testid="registration-form"]');
  }

  async goto(businessId: string = 'cafedani') {
    await this.page.goto(`/${businessId}/cliente`);
  }

  async registerClient(nombre: string, cedula: string, telefono: string) {
    await this.registerButton.click();
    await this.nombreInput.fill(nombre);
    await this.cedulaInput.fill(cedula);
    await this.telefonoInput.fill(telefono);
    await this.submitRegistration.click();
  }

  async expectSuccessfulRegistration(clientName: string) {
    await expect(this.page.locator('text=Cliente registrado exitosamente')).toBeVisible();
    await expect(this.clientDashboard).toBeVisible();
    await expect(this.page.locator(`text=${clientName}`)).toBeVisible();
  }
}

/**
 * 🎯 PAGE OBJECT MODEL - RESERVATIONS
 */
export class ReservationsPage {
  readonly page: Page;
  readonly createReserva: Locator;
  readonly clientNameInput: Locator;
  readonly phoneInput: Locator;
  readonly mesaSelect: Locator;
  readonly fechaInput: Locator;
  readonly confirmReserva: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createReserva = page.locator('[data-testid="create-reserva"]');
    this.clientNameInput = page.locator('[data-testid="client-name"]');
    this.phoneInput = page.locator('[data-testid="phone"]');
    this.mesaSelect = page.locator('[data-testid="mesa-select"]');
    this.fechaInput = page.locator('[data-testid="fecha-input"]');
    this.confirmReserva = page.locator('[data-testid="confirm-reserva"]');
  }

  async createReservation(clientName: string, phone: string, mesa: string, daysFromNow: number = 1) {
    await this.createReserva.click();
    await this.clientNameInput.fill(clientName);
    await this.phoneInput.fill(phone);
    await this.mesaSelect.selectOption(mesa);
    
    // Calcular fecha
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysFromNow);
    const dateString = futureDate.toISOString().split('T')[0];
    await this.fechaInput.fill(dateString);
    
    await this.confirmReserva.click();
  }

  async expectSuccessfulReservation(clientName: string) {
    await expect(this.page.locator('text=Reserva creada exitosamente')).toBeVisible();
    await expect(this.page.locator(`text=${clientName}`)).toBeVisible();
  }
}

/**
 * 🎯 PAGE OBJECT MODEL - MENU MANAGEMENT
 */
export class MenuManagement {
  readonly page: Page;
  readonly addProduct: Locator;
  readonly productName: Locator;
  readonly productPrice: Locator;
  readonly productCategory: Locator;
  readonly saveProduct: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addProduct = page.locator('[data-testid="add-product"]');
    this.productName = page.locator('[data-testid="product-name"]');
    this.productPrice = page.locator('[data-testid="product-price"]');
    this.productCategory = page.locator('[data-testid="product-category"]');
    this.saveProduct = page.locator('[data-testid="save-product"]');
  }

  async createProduct(name: string, price: string, category: string) {
    await this.addProduct.click();
    await this.productName.fill(name);
    await this.productPrice.fill(price);
    await this.productCategory.selectOption(category);
    await this.saveProduct.click();
  }

  async expectProductCreated(name: string, price: string) {
    await expect(this.page.locator(`text=${name}`)).toBeVisible();
    await expect(this.page.locator(`text=${price}`)).toBeVisible();
  }
}
