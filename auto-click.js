const { chromium } = require('playwright');
const COOKIES = JSON.parse(process.env.WPS_COOKIES);
const TARGET_URL = 'https://personal-act.wps.cn/rubik2/portal/HD2025031721339450/YM2025031721331326';
const sleep = ms => new Promise(res => setTimeout(res, ms));

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox','--disable-dev-shm-usage']
  });
  // 固定分辨率3840*4320
  const ctx = await browser.newContext({
    viewport:{width:3840,height:4320},
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
  });
  await ctx.addCookies(COOKIES);

  try {
    //步骤1：首次打开页面加载cookie后关闭，等待2s
    let page1 = await ctx.newPage();
    console.log('【步骤1】首次打开页面加载登录Cookie');
    await page1.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page1.close();
    console.log('【步骤1】关闭页面，等待2秒');
    await sleep(2000);

    //步骤2：第二次打开→等待2s→关闭→再等2s
    let page2 = await ctx.newPage();
    console.log('【步骤2】第二次打开页面');
    await page2.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(2000);
    await page2.close();
    console.log('【步骤2】关闭页面，再等待2秒');
    await sleep(2000);

    //步骤3：第三次打开页面
    let page = await ctx.newPage();
    console.log('【步骤3】第三次打开目标页面，准备查找hot-btn立即解锁按钮');
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(4500);

    // 【首选】你截图里的按钮 div.hot-btn.pointer（90×30立即解锁）
    const targetBtn = page.locator('div.hot-btn.pointer');
    // 备选原图片按钮
    const btnImg = page.locator('img.btn[src*="17491952468999a23257df8d522d6.png"]');

    let clicked = false;

    // 优先点击hot-btn.pointer（红框立即解锁）
    if (await targetBtn.isVisible({timeout:3500})) {
      await page.screenshot({path:'hot_btn_unlock.png'});
      // JS原生注入点击，绕过页面拦截
      const domEl = await targetBtn.elementHandle();
      await page.evaluate(el => el.click(), domEl);
      console.log('✅ 成功：命中div.hot-btn.pointer【立即解锁】按钮，已截图并点击');
      clicked = true;
    }else if (await btnImg.isVisible({timeout:2500})) {
      await page.screenshot({path:'img_btn_exist.png'});
      const domEl = await btnImg.elementHandle();
      await page.evaluate(el => el.click(), domEl);
      console.log('✅ 点击备用图片按钮');
      clicked = true;
    }else {
      await page.screenshot({path:'no_btn_snap.png'});
      console.log('❌ 未找到hot-btn按钮，已保存全页面截图');
    }

    // 点击后刷新页面
    if (clicked) {
      await page.reload({ waitUntil: 'domcontentloaded' });
      console.log('【步骤4】点击完成，页面刷新');
    }
    await sleep(2000);
    console.log('【步骤5】等待完毕，准备关闭浏览器');

  } catch (e) {
    console.error('运行异常：', e.message);
  } finally {
    await browser.close();
    console.log('浏览器已关闭，任务结束');
  }
})();
