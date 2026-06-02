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
    //四轮初始化循环不变
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
    await sleep(2000);

    const clickX = 1950;
    const clickY = 2002;
    //1.移动+红点+点击前截图
    await page.mouse.move(clickX, clickY);
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
    },{px:clickX,py:clickY});
    await sleep(500);
    await page.screenshot({path:'before_click_1950_2002.png', omitBackground:true});
    console.log(`📷 保存点击前截图 before_click_1950_2002.png`);

    //【修复点击：长按式鼠标动作，延长按下时间，确保弹窗触发】
    await page.mouse.move(clickX, clickY);
    await page.mouse.down();
    await sleep(300); //左键按住300ms，模拟真人长按点击，解决点击不生效不弹弹窗
    await page.mouse.up();
    console.log(`✅ 点位(${clickX},${clickY})点击完成，等待弹窗渲染2秒`);
    await sleep(2000);

    //弹窗出现后，依次5个坐标红点截图
    const posArr = [
      {x:1811,y:1568,name:'pos1_1811_1568'},
      {x:1761,y:1568,name:'pos2_1761_1568'},
      {x:1861,y:1568,name:'pos3_1861_1568'},
      {x:1811,y:1518,name:'pos4_1811_1518'},
      {x:1811,y:1618,name:'pos5_1811_1618'}
    ];

    for(let item of posArr){
      const {x,y,name} = item;
      //清除历史红点
      await page.evaluate(()=>{
        document.querySelectorAll('div[style*="border-radius:50%"]').forEach(d=>d.remove());
      });
      await page.mouse.move(x,y);
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
      },{px:x,py:y});
      await sleep(500);
      await page.screenshot({path:`${name}.png`, omitBackground:true});
      console.log(`📷 已保存 ${name}.png`);
    }

    await page.close();
    console.log('✅【步骤3】执行完毕，页面关闭');

  } catch (e) {
    console.error('运行异常：', e.message);
  } finally {
    await browser.close();
    console.log('浏览器已关闭，任务结束');
  }
})();
