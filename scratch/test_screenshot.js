const puppeteer = require('c:\\saudistock\\node_modules\\puppeteer-core');

async function run() {
  console.log("Navigating to local Screener page...");
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    });

    const page = await browser.newPage();

    page.on('console', msg => {
      console.log(`[CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
    });

    page.on('pageerror', err => {
      console.error(`[ERROR]: ${err.message}`);
    });

    await page.goto('http://localhost:3000/screener', {
      waitUntil: 'networkidle2',
      timeout: 15000
    });

    console.log("Saving initial page screenshot...");
    await page.screenshot({ path: 'local_screener_load_state.png' });
    console.log("Screenshot saved as local_screener_load_state.png");

  } catch (error) {
    console.error("Error:", error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

run();
