const { chromium } = require('playwright');
const COOKIES = JSON.parse(process.env.WPS_COOKIES);
const TARGET_URL = 'https://personal-act.wps.cn/rubik2/portal/HD2025031721339450/YM2025031721331326';
const sleep = ms => new Promise(res => setTimeout(res, ms));

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox','--disable-dev-shm-usage']
  });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  await ctx.addCookies(COOKIES);

  try {
    // 步骤1：预加载登录态，关闭页面
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
    console.log('【步骤2】页面载入完毕，等待3秒渲染按钮(加长等待适配Vue动态渲染)');
    await sleep(3000);

    // 三个匹配：原图img按钮 + div.hot-btn + 文字【立即解锁】按钮
    const btnImg = page.locator('img.btn[src*="17491952468999a23257df8d522d6.png"]');
    const btnDiv = page.locator('div.hot-btn.pointer');
    // 新增：根据按钮文字「立即解锁」精准定位
    const btnUnlock = page.getByText('立即解锁');

    let clicked = false;

    // 优先级：先图片→再立即解锁文字→最后hot-btn
    if (await btnImg.isVisible({timeout:2000})) {
      await btnImg.waitFor({state:'visible',timeout:3000});
      await btnImg.click({ force: true, timeout:3000 });
      console.log('✅ 点击图片按钮成功');
      clicked = true;
    } else if (await btnUnlock.isVisible({timeout:2000})) {
      await btnUnlock.waitFor({state:'visible',timeout:3000});
      await btnUnlock.click({ force: true, timeout:3000 });
      console.log('✅ 点击【立即解锁】文字按钮成功');
      clicked = true;
    } else if (await btnDiv.isVisible({timeout:2000})) {
      await btnDiv.waitFor({state:'visible',timeout:3000});
      await btnDiv.click({ force: true, timeout:3000 });
      console.log('✅ 点击hot-btn按钮成功');
      clicked = true;
    } else {
      console.log('❌ 无可用领取按钮');
    }

    // 点击后刷新
    if (clicked) {
      await page.reload({ waitUntil: 'domcontentloaded' });
      console.log('【步骤3】点击后刷新页面');
    }

    await sleep(2000);
    console.log('【步骤4】等待结束，准备关闭浏览器');

  } catch (e) {
    console.error('运行异常：', e.message);
  } finally {
    await browser.close();
    console.log('浏览器已关闭，任务结束');
  }
})();
