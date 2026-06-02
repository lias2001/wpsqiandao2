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
    //步骤1：首次开页加载cookie → 关闭等2s
    let page1 = await ctx.newPage();
    console.log('【步骤1】首次打开页面加载登录Cookie');
    await page1.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page1.close();
    console.log('【步骤1】关闭页面，等待2秒');
    await sleep(2000);

    //步骤2：第二次打开→等2s→关页→再等2s
    let page2 = await ctx.newPage();
    console.log('【步骤2】第二次打开页面');
    await page2.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(2000);
    await page2.close();
    console.log('【步骤2】关闭页面，再等待2秒');
    await sleep(2000);

    //步骤3：第三次打开页面，优先坐标点击红框按钮
    let page = await ctx.newPage();
    console.log('【步骤3】第三次打开目标页面，优先使用固定坐标点击立即解锁');
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(4500);

    //红框中心点：3840*4320分辨率 X=2573 Y=2635
    const clickX = 2573;
    const clickY = 2635;
    const targetBtn = page.locator('div.hot-btn.pointer');
    const btnImg = page.locator('img.btn[src*="17491952468999a23257df8d522d6.png"]');
    let clicked = false;

    //优先固定坐标点击，DOM选择器仅作备选
    await page.mouse.click(clickX, clickY);
    console.log(`✅ 优先坐标点击：(${clickX},${clickY}) 红框立即解锁按钮`);
    clicked = true;

    // 点击完成关闭当前页面
    await page.close();
    await sleep(2000);

    // 新建页面二次校验：判断按钮是否还在，在=点击失败
    let checkPage = await ctx.newPage();
    console.log('【校验步骤】重新打开页面，验证点击结果');
    await checkPage.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(3500);

    const checkHotBtn = checkPage.locator('div.hot-btn.pointer');
    const checkImgBtn = checkPage.locator('img.btn[src*="17491952468999a23257df8d522d6.png"]');

    // 按钮仍存在 → 点击失败，提示+截图
    if(await checkHotBtn.isVisible({timeout:2000}) || await checkImgBtn.isVisible({timeout:2000})){
      console.log('⚠️ 校验失败：按钮仍然存在，上一轮坐标点击未生效');
      await checkPage.screenshot({path:'click_failed_snap.png'});
      console.log('📷 已保存失败截图 click_failed_snap.png');
    }else{
      console.log('✅ 校验成功：目标按钮已消失，坐标点击生效');
    }

    await checkPage.close();
    await sleep(2000);

  } catch (e) {
    console.error('运行异常：', e.message);
  } finally {
    await browser.close();
    console.log('浏览器已关闭，任务结束');
  }
})();
