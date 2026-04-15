// cypress/e2e/register.cy.js
// End-to-end test for registration form

describe('Registration Form E2E', () => {
  beforeEach(() => {
    cy.visit('/register');
  });

  it('shows validation errors for empty submit', () => {
    cy.get('form').submit();
    cy.contains('First name is required.').should('be.visible');
  });

  it('shows error for invalid phone', () => {
    cy.get('input[name="firstName"]').type('John', { force: true });
    cy.get('input[name="lastName"]').type('Doe', { force: true });
    cy.get('input[name="username"]').type('johndoe', { force: true });
    cy.get('input[name="phone"]').type('12345', { force: true });
    cy.get('input[name="password"]').type('password123', { force: true });
    cy.get('input[name="confirmPassword"]').type('password123', { force: true });
    cy.get('button[aria-label="Register"]').click();
    cy.contains('Phone number must be in format').should('be.visible');
  });

  it('shows error for invalid email', () => {
    cy.get('input[name="firstName"]').type('John', { force: true });
    cy.get('input[name="lastName"]').type('Doe', { force: true });
    cy.get('input[name="username"]').type('johndoe', { force: true });
    cy.get('input[name="phone"]').type('+256771234567', { force: true });
    cy.get('input[name="email"]').type('notanemail', { force: true });
    cy.get('input[name="password"]').type('password123', { force: true });
    cy.get('input[name="confirmPassword"]').type('password123', { force: true });
    cy.get('button[aria-label="Register"]').click();
    cy.contains('Invalid email address').should('be.visible');
  });

  it('shows error for password mismatch', () => {
    cy.get('input[name="firstName"]').type('John', { force: true });
    cy.get('input[name="lastName"]').type('Doe', { force: true });
    cy.get('input[name="username"]').type('johndoe', { force: true });
    cy.get('input[name="phone"]').type('+256771234567', { force: true });
    cy.get('input[name="password"]').type('password123', { force: true });
    cy.get('input[name="confirmPassword"]').type('different', { force: true });
    cy.get('button[aria-label="Register"]').click();
    cy.contains('Passwords do not match').should('be.visible');
  });

  it('registers successfully with valid data', () => {
    cy.get('input[name="firstName"]').type('Jane', { force: true });
    cy.get('input[name="lastName"]').type('Smith', { force: true });
    cy.get('input[name="username"]').type('janesmith', { force: true });
    cy.get('input[name="phone"]').type('+256771234568', { force: true });
    cy.get('input[name="email"]').type('jane@example.com', { force: true });
    cy.get('input[name="password"]').type('password123', { force: true });
    cy.get('input[name="confirmPassword"]').type('password123', { force: true });
    cy.get('button[aria-label="Register"]').click();
    cy.url().should('include', '/dashboard');
  });
});
