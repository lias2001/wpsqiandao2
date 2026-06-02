const { chromium } = require('playwright');

// 从环境变量读取 Cookie
const COOKIES = JSON.parse(process.env.WPS_COOKIES);
const TARGET_URL = 'https://personal-act.wps.cn/rubik2/portal/HD2025031721339450/YM2025031721331326';

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });

  // 加载 Cookie
  await context.addCookies(COOKIES);
  const page = await context.newPage();

  try {
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 60000 });
    console.log('页面加载完成');

    // 按钮1：今日可领 img
    const btn1 = page.locator('img.btn[src*="17491952468999a23257df8d522d6.png"]');
    // 按钮2：hot-btn
    const btn2 = page.locator('div.hot-btn.pointer');

    let clicked = false;

    if (await btn1.count() > 0) {
      await btn1.click({ force: true });
      console.log('点击 今日可领 按钮');
      clicked = true;
    } else if (await btn2.count() > 0) {
      await btn2.click({ force: true });
      console.log('点击 hot-btn 按钮');
      clicked = true;
    } else {
      console.log('未找到可点击按钮');
    }

    // 点击后刷新
    if (clicked) {
      await page.reload({ waitUntil: 'networkidle' });
      console.log('刷新页面');
    }

    // 等待2秒
    await page.waitForTimeout(2000);

  } catch (err) {
    console.error('执行异常：', err.message);
  } finally {
    await browser.close();
    console.log('浏览器关闭');
  }
})();
