import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const TEST_USER = {
  phone: '256771234567',
  password: 'testpass123'
};

test.describe('PledgeHub E2E', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto('http://localhost:5173/login');
    await page.fill('input[name="phone"]', TEST_USER.phone);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard/);
  });

  test('Dashboard to Active Pledges navigation', async ({ page }: { page: Page }) => {
    await expect(page).toHaveTitle(/Dashboard/i);
    await page.click('text=View All Active Pledges');
    await expect(page).toHaveURL(/\/pledges/);
    await expect(page.locator('.pledges-table, .pledges-grid')).toBeVisible();
  });

  test('Fundraise a pledge and verify in list', async ({ page }: { page: Page }) => {
    await page.goto('http://localhost:5173/fundraise');
    await page.fill('input[name="donor_name"]', 'E2E Test User');
    await page.fill('input[name="donor_email"]', 'e2e@example.com');
    await page.fill('input[name="donor_phone"]', '256771234567');
    await page.fill('input[name="amount"]', '12345');
    await page.fill('input[name="purpose"]', 'E2E Test');
    await page.fill('input[name="collection_date"]', '2026-01-20');
    await page.click('button[type="submit"]');
    await expect(page.locator('.success-message, .alert--success')).toBeVisible({ timeout: 5000 });
    await page.goto('http://localhost:5173/pledges');
    await expect(page.locator('text=E2E Test User')).toBeVisible({ timeout: 5000 });
  });

  test('Send reminder for a pledge', async ({ page }: { page: Page }) => {
    await page.goto('http://localhost:5173/pledges');
    const firstPledge = page.locator('.pledges-table tbody tr').first();
    await firstPledge.locator('text=View Details').click();
    await expect(page).toHaveURL(/\/pledges\//);
    await page.click('text=Send Reminder');
    await expect(page.locator('.alert--success, .success-message')).toBeVisible({ timeout: 5000 });
  });
});
