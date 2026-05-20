const puppeteer = require('c:\\saudistock\\node_modules\\puppeteer-core');

async function run() {
  console.log("Starting streamlined E2E logged-in freeze diagnostic...");
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

    console.log("Navigating to register...");
    await page.goto('http://localhost:3000/register', {
      waitUntil: 'networkidle2',
      timeout: 15000
    });

    await page.waitForSelector('input[placeholder*="الاسم"]', { timeout: 5000 });

    const tempEmail = `diag_user_${Date.now()}@example.com`;
    console.log(`Registering new user: ${tempEmail}`);
    
    await page.type('input[placeholder*="الاسم"]', 'فيصل التجريبي');
    await page.type('input[type="email"]', tempEmail);
    await page.type('input[type="password"]', 'Password123!');
    
    console.log("Submitting registration...");
    await page.click('button[type="submit"]');
    
    console.log("Waiting for auto-login redirect to /watchlists...");
    await new Promise(r => setTimeout(r, 6000));
    
    console.log(`Current URL after registration: ${page.url()}`);

    console.log("Navigating directly to Screener page...");
    await page.goto('http://localhost:3000/screener', {
      waitUntil: 'networkidle2',
      timeout: 15000
    });

    console.log("Waiting 10 seconds to observe any CPU lockup, freeze, or loop...");
    const startTime = Date.now();
    await new Promise(r => setTimeout(r, 10000));
    const duration = Date.now() - startTime;
    console.log(`Waited for ${duration}ms.`);

    console.log("Taking screenshot of logged-in Screener page...");
    await page.screenshot({ path: 'logged_in_screener_state.png' });
    console.log("Screenshot saved. E2E logged-in check finished.");

  } catch (error) {
    console.error("An error occurred during diagnostic:", error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

run();
