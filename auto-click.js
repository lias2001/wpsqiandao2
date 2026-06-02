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
    //=====【合并原步骤1+步骤2：四轮开页-刷新-关页循环】=====
    console.log('【合并步骤：开始四轮页面加载刷新流程】');
    for(let round=0; round<4; round++){
      console.log(`\n====第${round+1}轮页面加载====`);
      let pageTmp = await ctx.newPage();
      await pageTmp.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
      console.log(`第${round+1}轮：页面打开完成，等待2s`);
      await sleep(2000);

      await pageTmp.reload({waitUntil:'domcontentloaded'});
      console.log(`第${round+1}轮：页面刷新完成，等待2s`);
      await sleep(2000);

      await pageTmp.close();
      console.log(`第${round+1}轮：页面关闭，等待2s`);
      await sleep(2000);
    }
    console.log('【合并步骤：四轮页面循环全部结束】');

    //=====【全新步骤3：打开页面→等待→点击1950,2002→筛选cursor:pointer元素→逐个红点截图】=====
    let page = await ctx.newPage();
    console.log('\n【步骤3】正式打开目标页面');
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(2000);

    //固定坐标点击 1950,2002
    const clickX = 1950;
    const clickY = 2002;
    await page.mouse.click(clickX, clickY);
    console.log(`✅ 已点击坐标(${clickX},${clickY})，等待2秒渲染页面`);
    await sleep(2000);

    //筛选：hover鼠标变成手型 cursor:pointer 的所有元素(a/button/div等)
    const pointerEls = await page.locator('*').filter({
      has: page.locator('xpath=./self::*[contains(@style,"cursor:pointer") or contains(@style,"cursor: hand")]')
    }).all();
    console.log(`【步骤3】页面检测到手型可点击元素总数：${pointerEls.length}`);

    for(let idx=0; idx<pointerEls.length; idx++){
      const el = pointerEls[idx];
      const box = await el.boundingBox();
      if(!box) continue;
      const cx = Math.round(box.x + box.width/2);
      const cy = Math.round(box.y + box.height/2);
      console.log(`手型元素${idx+1} 中心点：X=${cx}, Y=${cy}`);

      //清理历史红点
      await page.evaluate(()=>{
        document.querySelectorAll('div[style*="border-radius:50%"]').forEach(d=>d.remove());
      });
      //鼠标移动到中心
      await page.mouse.move(cx, cy);
      //绘制红色圆点标记
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
      },{px:cx,py:cy});
      await sleep(500);
      //截图（omitBackground防超时）
      await page.screenshot({
        path:`pointer_${idx+1}_${cx}_${cy}.png`,
        omitBackground:true
      });
      console.log(`📷 已保存截图 pointer_${idx+1}_${cx}_${cy}.png`);
    }

    //全部遍历完毕关闭页面
    await page.close();
    console.log('✅【步骤3】全部手型元素识别完毕，页面关闭');

  } catch (e) {
    console.error('运行异常：', e.message);
  } finally {
    await browser.close();
    console.log('浏览器已关闭，任务结束');
  }
})();
