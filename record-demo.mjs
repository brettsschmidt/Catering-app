import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appPath   = 'file://' + path.join(__dirname, 'index.html');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1194/chrome-linux/headless_shell',
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: {
      dir:  path.join(__dirname, 'videos'),
      size: { width: 1280, height: 800 },
    },
  });

  const page = await context.newPage();

  // Helper: click a tab button
  const goTab = async (name) => {
    await page.click(`[data-tab="${name}"]`);
    await page.waitForTimeout(500);
  };

  // ── Load the app ──
  await page.goto(appPath);
  await page.waitForTimeout(1000);

  // ── Tab 1: Event Details ──
  await page.fill('#eventName',     'Emily & James Wedding');
  await page.waitForTimeout(200);
  await page.fill('#eventDate',     '2026-06-14');
  await page.waitForTimeout(200);
  await page.fill('#venue',         'The Grand Pavilion');
  await page.waitForTimeout(200);
  await page.fill('#guestCount',    '120');
  await page.waitForTimeout(200);
  await page.fill('#eventDuration', '5');
  await page.waitForTimeout(200);
  await page.fill('#cocktailHour',  '1');
  await page.waitForTimeout(200);
  await page.selectOption('#serviceStyle',      'full');
  await page.waitForTimeout(200);
  await page.selectOption('#drinkingIntensity', 'moderate');
  await page.waitForTimeout(600);

  // Click Save — scope to the event tab
  await page.locator('#tab-event button.btn-primary').click({ force: true });
  await page.waitForTimeout(1500);

  // ── Tab 2: Drink Menu (we're already here after save) ──
  // Add a signature cocktail
  await page.locator('#tab-menu button.btn-secondary').click({ force: true });
  await page.waitForTimeout(400);
  const lastRow = page.locator('#signatureCocktails .cocktail-row').last();
  await lastRow.locator('.cocktail-name').fill('Rosé Garden Spritz');
  await lastRow.locator('.cocktail-ingredients').fill('Rosé, St-Germain, club soda, cucumber');
  await page.waitForTimeout(1000);

  // ── Tab 3: Quantities ──
  await goTab('quantities');
  await page.locator('#tab-quantities button.btn-primary').click({ force: true });
  await page.waitForTimeout(1200);
  // Scroll through results
  await page.evaluate(() => window.scrollBy(0, 350));
  await page.waitForTimeout(700);
  await page.evaluate(() => window.scrollBy(0, 350));
  await page.waitForTimeout(700);
  await page.evaluate(() => window.scrollBy(0, 350));
  await page.waitForTimeout(700);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);

  // ── Tab 4: Staff & Timeline ──
  await goTab('staff');
  await page.waitForTimeout(600);
  // Add a staff member
  await page.locator('#tab-staff button.btn-secondary').first().click({ force: true });
  await page.waitForTimeout(400);
  const lastStaff = page.locator('#staffRoster .staff-row').last();
  await lastStaff.locator('.staff-name').fill('Jordan Rivera');
  await lastStaff.locator('.staff-role').selectOption('Lead Bartender');
  await page.waitForTimeout(1000);

  // ── Tab 5: Budget ──
  await goTab('budget');
  await page.fill('#totalBudget', '4500');
  await page.waitForTimeout(400);
  await page.locator('#tab-budget button.btn-primary').click({ force: true });
  await page.waitForTimeout(1200);

  // ── Tab 6: Checklist ──
  await goTab('checklist');
  await page.waitForTimeout(600);
  const checkboxes = page.locator('.checklist-item input[type="checkbox"]');
  await checkboxes.nth(0).check({ force: true });
  await page.waitForTimeout(300);
  await checkboxes.nth(1).check({ force: true });
  await page.waitForTimeout(300);
  await checkboxes.nth(2).check({ force: true });
  await page.waitForTimeout(300);
  await checkboxes.nth(3).check({ force: true });
  await page.waitForTimeout(800);

  // Scroll through checklist
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(600);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1500);

  await context.close();
  await browser.close();

  console.log('Done. Video saved to:', path.join(__dirname, 'videos'));
})();
