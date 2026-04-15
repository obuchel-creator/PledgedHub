// Cypress E2E tests for authentication flows
// Place this file in frontend/cypress/e2e/auth.cy.js

describe('Authentication Flows', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('should allow a user to register', () => {
    cy.visit('/register');
    cy.get('input#firstName').type('Test');
    cy.get('input#lastName').type('User');
    cy.get('input#username').type('testuser' + Date.now());
    cy.get('input#phone').type('+256771234567');
    cy.get('input#email').type('test' + Date.now() + '@example.com');
    cy.get('input#password').type('TestPass123!');
    cy.get('input#confirmPassword').type('TestPass123!');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
  });

  it('should show error for invalid login', () => {
    cy.visit('/login');
    cy.get('input#username').type('wronguser');
    cy.get('input#password').type('wrongpass');
    cy.get('button[type="submit"]').click();
    cy.contains(/invalid|failed|error/i).should('be.visible');
  });

  it('should allow a user to request a password reset', () => {
    cy.visit('/forgot-password');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('button[type="submit"]').click();
    cy.contains(/reset link sent|check your email/i).should('be.visible');
  });

  it('should allow navigation between auth pages', () => {
    cy.visit('/login');
    cy.contains(/sign up|register/i).click();
    cy.url().should('include', '/register');
    cy.contains(/sign in|login/i).click();
    cy.url().should('include', '/login');
    cy.contains(/forgot password/i).click();
    cy.url().should('include', '/forgot-password');
  });
});
