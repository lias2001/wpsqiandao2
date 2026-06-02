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
    //四轮初始化流程不变
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
    //新增：先移动→红点→截图，再点击
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
    await page.screenshot({
      path:'before_click_1950_2002.png',
      omitBackground:true
    });
    console.log(`📷 点击前已保存截图 before_click_1950_2002.png`);

    //再执行点击
    await page.mouse.click(clickX, clickY);
    console.log(`✅ 点击(${clickX},${clickY})，等待2秒`);
    await sleep(2000);

    //筛选真实手型元素
    const pointerCoordList = await page.evaluate(()=>{
      const allDom = Array.from(document.querySelectorAll('*'));
      const res = [];
      allDom.forEach(el=>{
        const ownStyle = el.style.cursor;
        const computedCursor = getComputedStyle(el).cursor;
        if((ownStyle === 'pointer' || ownStyle === 'hand') && (computedCursor === 'pointer' || computedCursor === 'hand')){
          const rect = el.getBoundingClientRect();
          if(rect.width>5 && rect.height>5 && rect.x>0 && rect.y>0 && rect.x<window.innerWidth && rect.y<window.innerHeight){
            res.push({
              x: Math.round(rect.x + rect.width/2),
              y: Math.round(rect.y + rect.height/2)
            });
          }
        }
      });
      return res;
    });

    console.log(`✅ 筛选到手型可点击区域总数：${pointerCoordList.length}`);

    for(let idx=0; idx<pointerCoordList.length; idx++){
      const {x,y} = pointerCoordList[idx];
      //只截图：前3个(0,1,2) + 104~109(数组下标对应105~110序号)
      const needShot = (idx < 3) || (idx >= 104 && idx <= 109);
      console.log(`手型区域${idx+1} X:${x}, Y:${y} ${needShot ? '【需要截图】' : '【跳过截图】'}`);

      if(!needShot) continue;

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
      await page.screenshot({
        path:`pointer_${idx+1}_${x}_${y}.png`,
        omitBackground:true
      });
      console.log(`📷 已保存 pointer_${idx+1}_${x}_${y}.png`);
    }

    await page.close();
    console.log('✅ 步骤3完成，页面关闭');

  } catch (e) {
    console.error('运行异常：', e.message);
  } finally {
    await browser.close();
    console.log('浏览器已关闭，任务结束');
  }
})();
