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

    //步骤3：第三次打开页面
    let page = await ctx.newPage();
    console.log('【步骤3】第三次打开目标页面');
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(4500);

    //横向65%、竖向66.5%
    const clickX = Math.round(3840 * 0.65);
    const clickY = Math.round(4320 * 0.665);
    console.log(`鼠标移动至坐标 X:${clickX}, Y:${clickY}`);

    //1.鼠标先移动到目标点位
    await page.mouse.move(clickX, clickY);
    await sleep(800);
    //2.移动完立刻截图（能拍到鼠标光标）
    await page.screenshot({path:'before_click_mouse.png'});
    console.log('📷 已保存点击前带鼠标截图 before_click_mouse.png');
    //3.优先坐标点击
    await page.mouse.click(clickX, clickY);
    console.log(`✅ 坐标完成点击：(${clickX},${clickY})`);

    //点击完毕关闭页面
    await page.close();
    await sleep(2000);

    //校验页面
    let checkPage = await ctx.newPage();
    console.log('【校验步骤】重新打开页面，验证点击结果');
    await checkPage.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(3500);

    const checkHotBtn = checkPage.locator('div.hot-btn.pointer');
    const checkImgBtn = checkPage.locator('img.btn[src*="17491952468999a23257df8d522d6.png"]');

    //校验失败才截图，成功不截图
    if(await checkHotBtn.isVisible({timeout:2000}) || await checkImgBtn.isVisible({timeout:2000})){
      console.log('⚠️ 校验失败：按钮仍然存在，坐标点击未生效');
      await checkPage.screenshot({path:'click_failed_snap.png'});
      console.log('📷 已保存失败截图 click_failed_snap.png');
    }else{
      console.log('✅ 校验成功：目标按钮已消失，点击生效');
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
