const { chromium } = require('playwright');
const COOKIES = JSON.parse(process.env.WPS_COOKIES);
const TARGET_URL = 'https://personal-act.wps.cn/rubik2/portal/HD2025031721339450/YM2025031721331326';
const sleep = ms => new Promise(res => setTimeout(res, ms));

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox','--disable-dev-shm-usage']
  });
  // 固定1920*1080分辨率
  const ctx = await browser.newContext({
    viewport:{width:1920,height:1080},
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
  });
  await ctx.addCookies(COOKIES);

  try {
    // 步骤1：首次开页加载登录态后关闭
    let page1 = await ctx.newPage();
    console.log('【步骤1】首次打开页面加载登录Cookie');
    await page1.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page1.close();
    console.log('【步骤1】关闭页面，等待2秒');
    await sleep(2000);

    // 步骤2：二次打开页面
    let page = await ctx.newPage();
    console.log('【步骤2】第二次打开目标页面');
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(3000);

    // 滚动到页面50%高度，露出中间按钮
    console.log('【滚动】页面滚动至50%高度，露出解锁按钮');
    await page.evaluate(() => {
      const totalH = document.documentElement.scrollHeight;
      document.documentElement.scrollTop = totalH * 0.5;
    });
    await sleep(3000);

    // 两个目标选择器
    const btnImg = page.locator('img.btn[src*="17491952468999a23257df8d522d6.png"]');
    const btnDiv = page.locator('div.hot-btn.pointer');

    let clicked = false;

    // 找到按钮先截图再JS点击，取消坐标兜底
    if (await btnImg.isVisible({timeout:2500})) {
      // 找到图片按钮 → 全页截图
      await page.screenshot({path:'img_btn_exist.png'});
      const el = await btnImg.elementHandle();
      await page.evaluate(e => e.click(), el);
      console.log('✅ 已截图并成功点击图片解锁按钮');
      clicked = true;
    } else if (await btnDiv.isVisible({timeout:2500})) {
      // 找到div按钮 → 全页截图
      await page.screenshot({path:'div_btn_exist.png'});
      const el = await btnDiv.elementHandle();
      await page.evaluate(e => e.click(), el);
      console.log('✅ 已截图并成功点击hot-btn按钮');
      clicked = true;
    } else {
      console.log('❌ 两个按钮均未找到，不执行任何点击');
    }

    // 点击成功后刷新页面
    if (clicked) {
      await page.reload({ waitUntil: 'domcontentloaded' });
      console.log('【步骤3】点击完成，页面刷新');
    }
    await sleep(2000);
    console.log('【步骤4】等待完毕，准备关闭');

  } catch (e) {
    console.error('运行异常：', e.message);
  } finally {
    await browser.close();
    console.log('浏览器已关闭，任务结束');
  }
})();
