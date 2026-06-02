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

    //横向65%、竖向66.5%坐标
    const clickX = Math.round(3840 * 0.65);
    const clickY = Math.round(4320 * 0.665);
    console.log(`标记点击坐标 X:${clickX}, Y:${clickY}`);

    await page.mouse.move(clickX, clickY);
    // 修正：参数打包为对象，解决Too many arguments报错
    await page.evaluate(({x,y})=>{
      const dot = document.createElement('div');
      dot.style.position='fixed';
      dot.style.left=x+'px';
      dot.style.top=y+'px';
      dot.style.width='22px';
      dot.style.height='22px';
      dot.style.background='red';
      dot.style.borderRadius='50%';
      dot.style.zIndex='9999999';
      document.body.appendChild(dot);
    },{x:clickX,y:clickY});

    await sleep(800);
    await page.screenshot({path:'before_click_mark.png'});
    console.log('📷 已保存带红点标记截图 before_click_mark.png');

    await page.mouse.click(clickX, clickY);
    console.log(`✅ 坐标完成点击：(${clickX},${clickY})`);

    await page.close();
    await sleep(2000);

  } catch (e) {
    console.error('运行异常：', e.message);
  } finally {
    await browser.close();
    console.log('浏览器已关闭，任务结束');
  }
})();
