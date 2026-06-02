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
    //合并四轮初始化：打开-等2s-刷新-等2s-关闭-等2s
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
    await sleep(3000); //等待3秒

    //第一个点位：1123,2010 移鼠→红点→截图→点击
    const p1x = 1123, p1y = 2010;
    await page.mouse.move(p1x,p1y);
    await page.evaluate(({px,py})=>{
      const dot = document.createElement('div');
      dot.style.position='fixed';
      dot.style.left=px+'px';
      dot.style.top=py+'px';
      dot.style.width='22px';
      dot.style.height='22px';
      dot.style.background='red';
      dot.style.borderRadius='50%';
      dot.style.zIndex='9999999';
      document.body.appendChild(dot);
    },{px:p1x,py:p1y});
    await sleep(500);
    await page.screenshot({path:'pre_click_1123_2010.png', omitBackground:true});
    console.log(`📷 已保存 pre_click_1123_2010.png`);

    //模拟真人点击
    await page.mouse.move(p1x,p1y);
    await page.mouse.down();
    await sleep(300);
    await page.mouse.up();
    console.log(`✅ 点击(${p1x},${p1y})完成，等待2秒`);
    await sleep(2000);

    //第二个点位：970,1580 清红点→移动→红点→截图
    const p2x = 970, p2y = 1580;
    await page.evaluate(()=>{
      document.querySelectorAll('div[style*="border-radius:50%"]').forEach(d=>d.remove());
    });
    await page.mouse.move(p2x,p2y);
    await page.evaluate(({px,py})=>{
      const dot = document.createElement('div');
      dot.style.position='fixed';
      dot.style.left=px+'px';
      dot.style.top=py+'px';
      dot.style.width='22px';
      dot.style.height='22px';
      dot.style.background='red';
      dot.style.borderRadius='50%';
      dot.style.zIndex='9999999';
      document.body.appendChild(dot);
    },{px:p2x,py:p2y});
    await sleep(500);
    await page.screenshot({path:'pos_970_1580.png', omitBackground:true});
    console.log(`📷 已保存 pos_970_1580.png`);

    await page.close();
    console.log('✅【步骤3】执行完毕，页面关闭');

  } catch (e) {
    console.error('运行异常：', e.message);
  } finally {
    await browser.close();
    console.log('浏览器已关闭，任务结束');
  }
})();
