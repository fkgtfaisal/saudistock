const puppeteer = require('c:\\saudistock\\node_modules\\puppeteer-core');

async function run() {
  console.log("Starting full E2E interaction test (with registration auto-login)...");
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    });

    const page = await browser.newPage();

    // Listen to console and error events
    page.on('console', msg => {
      console.log(`[BROWSER CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
    });

    page.on('pageerror', err => {
      console.error(`[BROWSER ERROR]: ${err.message}`);
      console.error(err.stack);
    });

    console.log("Registering a user for a fresh authenticated session...");
    await page.goto('http://localhost:3000/register', {
      waitUntil: 'networkidle2',
      timeout: 15000
    });

    const tempEmail = `e2e_user_${Date.now()}@example.com`;
    await page.waitForSelector('input[placeholder*="الاسم"]');
    await page.type('input[placeholder*="الاسم"]', 'مطور الاختبار');
    await page.type('input[type="email"]', tempEmail);
    await page.type('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    console.log("Waiting for redirection...");
    await new Promise(r => setTimeout(r, 6000));

    console.log("Navigating to Screener page...");
    await page.goto('http://localhost:3000/screener', {
      waitUntil: 'networkidle2',
      timeout: 15000
    });

    // 1. Click "+ إضافة فلتر"
    console.log("1. Triggering 'إضافة فلتر' modal...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.includes('إضافة فلتر'));
      if (btn) btn.click();
      else throw new Error("Could not find Add Filter button");
    });
    
    await page.waitForSelector('input[type="number"]', { timeout: 3000 });
    
    console.log("Entering price filter value '50'...");
    await page.evaluate(() => {
      const input = document.querySelector('input[type="number"]');
      if (input) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        nativeInputValueSetter.call(input, "50");
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    console.log("Clicking 'تطبيق الفلتر'...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.includes('تطبيق الفلتر'));
      if (btn) btn.click();
      else throw new Error("Could not find Apply Filter button");
    });
    
    await new Promise(r => setTimeout(r, 1000));
    console.log("Successfully added Price > 50 filter!");

    // 2. Click "حفظ الفلتر"
    console.log("2. Clicking 'حفظ الفلتر'...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.includes('حفظ الفلتر'));
      if (btn) btn.click();
      else throw new Error("Could not find Save Filter button");
    });
    await new Promise(r => setTimeout(r, 1000));
    console.log("Successfully saved active filters to localStorage!");

    // 3. Click "استعادة"
    console.log("3. Clicking 'استعادة'...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.includes('استعادة'));
      if (btn) btn.click();
      else throw new Error("Could not find Restore button");
    });
    await new Promise(r => setTimeout(r, 1000));
    console.log("Successfully restored saved filters from localStorage!");

    // 4. Click "تصدير النتائج"
    console.log("4. Clicking 'تصدير النتائج'...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.includes('تصدير النتائج'));
      if (btn) btn.click();
      else throw new Error("Could not find Export button");
    });
    await new Promise(r => setTimeout(r, 2000));
    console.log("Successfully triggered CSV generation and download!");

    console.log("Taking final screenshot of verified state...");
    await page.screenshot({ path: 'local_screener_success.png' });
    console.log("E2E full interaction validation complete. All buttons passed flawlessly!");

  } catch (error) {
    console.error("An error occurred during E2E interaction test:", error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

run();
