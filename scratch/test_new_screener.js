const puppeteer = require('c:\\saudistock\\node_modules\\puppeteer-core');

async function run() {
  console.log("Starting diagnostic test on new Screener URL...");
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
      console.log(`[CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
    });

    page.on('pageerror', err => {
      console.error(`[PAGE ERROR]: ${err.message}`);
      console.error(err.stack);
    });

    console.log("Navigating directly to new Screener URL...");
    // Open the new URL
    const response = await page.goto('https://saudistock-h3133om7g-arbabalfadhaas-projects.vercel.app/screener', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log(`Navigation status: ${response.status()}`);
    console.log("Waiting 10 seconds to detect any freezing or infinite loop...");
    await new Promise(r => setTimeout(r, 10000));

    console.log("Taking screenshot of the final state...");
    await page.screenshot({ path: 'new_screener_diagnostic.png' });
    console.log("Diagnostic test completed successfully.");

  } catch (error) {
    console.error("An error occurred during diagnostic:", error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

run();
