// Cypress E2E tests for routing and redirects
// Place this file in frontend/cypress/e2e/routing.cy.js

describe('Routing and Redirects', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('should redirect unauthenticated user to login when accessing /dashboard', () => {
    cy.visit('/dashboard');
    cy.url().should('include', '/login');
  });

  it('should allow navigation to dashboard after login', () => {
    cy.visit('/login');
    cy.get('input#username').type('testuser');
    cy.get('input#password').type('TestPass123!');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
  });

  it('should not allow access to /register or /login when authenticated', () => {
    // Simulate login
    window.localStorage.setItem('authToken', 'fake-jwt-token');
    cy.visit('/login');
    cy.url().should('not.include', '/login');
    cy.visit('/register');
    cy.url().should('not.include', '/register');
  });

  it('should redirect to login after logout', () => {
    // Simulate login
    window.localStorage.setItem('authToken', 'fake-jwt-token');
    cy.visit('/dashboard');
    // Simulate logout (clear token)
    cy.clearLocalStorage();
    cy.visit('/dashboard');
    cy.url().should('include', '/login');
  });
});
