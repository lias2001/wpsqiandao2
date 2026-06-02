const { chromium } = require('playwright');
const COOKIES = JSON.parse(process.env.WPS_COOKIES);
const TARGET_URL = 'https://personal-act.wps.cn/rubik2/portal/HD2025031721339450/YM2025031721331326';
const sleep = ms => new Promise(res => setTimeout(res, ms));

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox','--disable-dev-shm-usage']
  });
  // 分辨率改为3840×2160，取消页面滚动代码
  const ctx = await browser.newContext({
    viewport:{width:3840,height:2160},
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
  });
  await ctx.addCookies(COOKIES);

  try {
    // 步骤1：首次打开加载登录Cookie，关闭等待2秒
    let page1 = await ctx.newPage();
    console.log('【步骤1】首次打开页面加载登录Cookie');
    await page1.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page1.close();
    console.log('【步骤1】关闭页面，等待2秒');
    await sleep(2000);

    // 步骤2：第二次打开→等待2s→关闭→再等2s
    let page2 = await ctx.newPage();
    console.log('【步骤2】第二次打开页面');
    await page2.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(2000);
    await page2.close();
    console.log('【步骤2】关闭页面，再等待2秒');
    await sleep(2000);

    // 步骤3：第三次打开页面，直接查找按钮（超大屏无需滚动）
    let page = await ctx.newPage();
    console.log('【步骤3】第三次打开目标页面，准备查找按钮');
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(3000);

    const btnImg = page.locator('img.btn[src*="17491952468999a23257df8d522d6.png"]');
    const btnDiv = page.locator('div.hot-btn.pointer');
    let clicked = false;

    if (await btnImg.isVisible({timeout:2500})) {
      await page.screenshot({path:'img_btn_exist.png'});
      const el = await btnImg.elementHandle();
      await page.evaluate(e => e.click(), el);
      console.log('✅ 已截图并成功点击图片解锁按钮');
      clicked = true;
    } else if (await btnDiv.isVisible({timeout:2500})) {
      await page.screenshot({path:'div_btn_exist.png'});
      const el = await btnDiv.elementHandle();
      await page.evaluate(e => e.click(), el);
      console.log('✅ 已截图并成功点击hot-btn按钮');
      clicked = true;
    } else {
      console.log('❌ 两个按钮均未找到，不执行任何点击');
    }

    // 点击后刷新页面
    if (clicked) {
      await page.reload({ waitUntil: 'domcontentloaded' });
      console.log('【步骤4】点击完成，页面刷新');
    }
    await sleep(2000);
    console.log('【步骤5】等待完毕，准备关闭');

  } catch (e) {
    console.error('运行异常：', e.message);
  } finally {
    await browser.close();
    console.log('浏览器已关闭，任务结束');
  }
})();
