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
    viewport:{width:3840,height:4320},
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
  });
  await ctx.addCookies(COOKIES);

  try {
    //步骤1：首次开页加载cookie关闭等2s
    let page1 = await ctx.newPage();
    console.log('【步骤1】首次打开页面加载登录Cookie');
    await page1.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page1.close();
    console.log('【步骤1】关闭页面，等待2秒');
    await sleep(2000);

    //步骤2：第二次打开→等2s→关→等2s
    let page2 = await ctx.newPage();
    console.log('【步骤2】第二次打开页面');
    await page2.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(2000);
    await page2.close();
    console.log('【步骤2】关闭页面，再等待2秒');
    await sleep(2000);

    //步骤3：第三次打开页面
    let page = await ctx.newPage();
    console.log('【步骤3】第三次打开目标页面，准备查找按钮');
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(4000);

    //精准定位：打卡免费会员模块右侧【立即解锁】
    //1.先锁定父模块：打卡免费会员区域，再取内部文字按钮
    const unlockBtn = page.locator('div:has-text("打卡免费领会员") + div').getByText('立即解锁');
    const btnImg = page.locator('img.btn[src*="17491952468999a23257df8d522d6.png"]');
    const btnDiv = page.locator('div.hot-btn.pointer');

    let clicked = false;

    //优先红框打卡区立即解锁按钮
    if (await unlockBtn.isVisible({timeout:3000})) {
      await page.screenshot({path:'unlock_btn_success.png'});
      const el = await unlockBtn.elementHandle();
      await page.evaluate(e => e.click(), el);
      console.log('✅ 精准命中红框【立即解锁】按钮，已截图+点击');
      clicked = true;
    }else if (await btnImg.isVisible({timeout:2500})) {
      await page.screenshot({path:'img_btn_exist.png'});
      const el = await btnImg.elementHandle();
      await page.evaluate(e => e.click(), el);
      console.log('✅ 点击原始图片按钮');
      clicked = true;
    }else if (await btnDiv.isVisible({timeout:2500})) {
      await page.screenshot({path:'div_btn_exist.png'});
      const el = await btnDiv.elementHandle();
      await page.evaluate(e => e.click(), el);
      console.log('✅ 点击hot-btn按钮');
      clicked = true;
    }else {
      await page.screenshot({path:'no_target_btn.png'});
      console.log('❌ 红框按钮及备选按钮全部未找到，保存全页截图');
    }

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
