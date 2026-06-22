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
    viewport:{width:1400,height:2877},
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
  });
  await ctx.addCookies(COOKIES);

  try {
    //四轮初始化：开页→等2s→刷新→等2s→关页→等2s
    console.log('【合并步骤：四轮页面初始化循环】');
    for(let round=0; round<4; round++){
      console.log(`\n====第${round+1}轮页面====`);
      let pageTmp = await ctx.newPage();
      await pageTmp.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await sleep(2000);
      await pageTmp.reload({waitUntil:'domcontentloaded'});
      await sleep(2000);
      await pageTmp.close();
      await sleep(2000);
    }
    console.log('【四轮初始化全部结束】');

    //步骤3
    let page = await ctx.newPage();
    console.log('\n【步骤3】打开业务页面');
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(3000);

    const clickList = [
      {x:180,y:2100},
      {x:300,y:2100},
      {x:420,y:2100},
      {x:540,y:2100},
      {x:660,y:2100},
      {x:780,y:2100},
      {x:900,y:2100},
      {x:1123,y:2100},
      {x:770,y:1580}
    ];

    // 整体流程循环执行2轮
    for(let loop = 1; loop <= 2; loop++){
      console.log(`\n==== 开始第${loop}轮完整点击流程 ====`);
      for(const item of clickList){
        const {x,y} = item;
        await page.mouse.move(x,y);
        // 长按模拟点击
        await page.mouse.down();
        await sleep(300);
        await page.mouse.up();
        console.log(`✅ (${x},${y})点击完成，等待2秒`);
        await sleep(2000);
      }
      console.log(`==== 第${loop}轮完整点击流程结束 ====`);
    }

    await page.close();
    console.log('✅【步骤3】全部执行完毕，页面关闭');

  } catch (e) {
    console.error('运行异常：', e.message);
  } finally {
    await browser.close();
    console.log('浏览器已关闭，任务结束');
  }
})();
