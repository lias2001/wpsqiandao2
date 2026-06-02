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
    viewport:{width:1400,height:1600}, // 适配页面完整尺寸，防止按钮超出可视区
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
  });
  await ctx.addCookies(COOKIES);

  try {
    // 步骤1：预加载登录态后关闭页面
    let page1 = await ctx.newPage();
    console.log('【步骤1】首次打开页面加载登录Cookie');
    await page1.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page1.close();
    console.log('【步骤1】关闭页面，等待2秒');
    await sleep(2000);

    // 步骤2：二次载入页面，加长渲染等待（WPS活动页Vue渲染慢）
    let page = await ctx.newPage();
    console.log('【步骤2】第二次打开目标页面');
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log('【步骤2】页面加载，等待5秒完整渲染浮动按钮');
    await sleep(5000);

    // 1.原2个DOM按钮 + 2.页面中间【立即解锁】图片按钮（精准src+class）
    const btnImgOrigin = page.locator('img.btn[src*="17491952468999a23257df8d522d6.png"]');
    const btnDivHot = page.locator('div.hot-btn.pointer');
    // 重点：页面中间立即解锁图片按钮（WPS活动统一按钮图，用文字+图片双重定位）
    const btnUnlockImg = page.locator('img:has-text("立即解锁")');
    // 备用兜底：页面固定坐标点击（从截图看按钮在页面横向居中、中部位置）

    let clicked = false;

    // 点击优先级：立即解锁图片 > 原图片按钮 > hot-div按钮
    if(await btnUnlockImg.isVisible({timeout:2500})){
      await btnUnlockImg.waitFor({state:'visible',timeout:3000});
      // 优先JS注入点击，绕过前端遮罩拦截
      await page.evaluate(el=>el.click(), await btnUnlockImg.elementHandle());
      console.log('✅【成功】点击页面中间「立即解锁」图片按钮');
      clicked = true;
    }else if(await btnImgOrigin.isVisible({timeout:2000})){
      await page.evaluate(el=>el.click(), await btnImgOrigin.elementHandle());
      console.log('✅【成功】点击原始img按钮');
      clicked = true;
    }else if(await btnDivHot.isVisible({timeout:2000})){
      await page.evaluate(el=>el.click(), await btnDivHot.elementHandle());
      console.log('✅【成功】点击hot-btn div按钮');
      clicked = true;
    }else{
      // 兜底：截图按钮固定屏幕坐标点击（页面横向50%，纵向48%位置）
      console.log('⚠️ DOM定位失败，启用坐标点击立即解锁');
      const view = page.viewportSize();
      await page.mouse.click(view.width*0.5, view.height*0.48);
      clicked = true;
      console.log('✅【兜底】坐标点击按钮完成');
    }

    // 点击后刷新页面
    if (clicked) {
      await page.reload({ waitUntil: 'domcontentloaded' });
      console.log('【步骤3】点击完成，刷新页面');
    }
    await sleep(2000);
    console.log('【步骤4】等待2秒，即将关闭浏览器');

  } catch (e) {
    console.error('运行异常：', e.message);
  } finally {
    await browser.close();
    console.log('浏览器已关闭，任务结束');
  }
})();
