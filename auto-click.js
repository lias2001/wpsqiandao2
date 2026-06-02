const { chromium } = require('playwright');
const COOKIES = JSON.parse(process.env.WPS_COOKIES);
const TARGET_URL = 'https://personal-act.wps.cn/rubik2/portal/HD2025031721339450/YM2025031721331326?cs_from=web_vipcenter_banner_inpublic&mk_key=JkVKmMVj6h1ZuPwEIlZmVef5hIIZ0Em91FRo&position=pc_aty_ban3_kaixue_test_b';

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox','--disable-dev-shm-usage']
  });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  // 载入登录Cookie
  await ctx.addCookies(COOKIES);

  try {
    // 第一步：打开页面加载登录态，随后关闭页面
    let page1 = await ctx.newPage();
    console.log('【步骤1】首次打开页面加载登录Cookie');
    await page1.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 60000 });
    await page1.close();
    console.log('【步骤1】关闭页面，等待2秒');
    await page.waitForTimeout(2000);

    // 第二步：再次新开页面，等待2秒再检测按钮
    let page = await ctx.newPage();
    console.log('【步骤2】第二次打开目标页面');
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 60000 });
    console.log('【步骤2】页面载入完毕，等待2秒');
    await page.waitForTimeout(2000);

    // 两个按钮定位
    const btnImg = page.locator('img.btn[src*="17491952468999a23257df8d522d6.png"]');
    const btnDiv = page.locator('div.hot-btn.pointer');
    let clicked = false;

    // 判断按钮并点击
    if (await btnImg.count() > 0) {
      await btnImg.click({ force: true });
      console.log('✅ 找到图片按钮，已点击');
      clicked = true;
    } else if (await btnDiv.count() > 0) {
      await btnDiv.click({ force: true });
      console.log('✅ 找到div按钮，已点击');
      clicked = true;
    } else {
      console.log('❌ 无可用领取按钮');
    }

    // 点击后刷新页面
    if (clicked) {
      await page.reload({ waitUntil: 'networkidle' });
      console.log('【步骤3】点击后刷新页面');
    }

    // 刷新后等待2秒
    await page.waitForTimeout(2000);
    console.log('【步骤4】等待结束，准备关闭浏览器');

  } catch (e) {
    console.error('运行异常：', e.message);
  } finally {
    await browser.close();
    console.log('浏览器已关闭，任务结束');
  }
})();
