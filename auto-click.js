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

    // 两套点位数组
    const listY1800_2000 = [
      {x:180,y:2000},
      {x:300,y:2000},
      {x:420,y:2000},
      {x:540,y:2000},
      {x:660,y:2000},
      {x:780,y:2000},
      {x:900,y:2000},
      {x:1123,y:2000},
      {x:770,y:1580},
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
    const listY1100_1300 = [
      {x:180,y:1345},
      {x:300,y:1345},
      {x:420,y:1345},
      {x:540,y:1345},
      {x:660,y:1345},
      {x:780,y:1345},
      {x:900,y:1345},
      {x:1123,y:1345},
      {x:770,y:1580}
    ];

    // ====================== 第1轮流程 ======================
    console.log('\n==== 开始第1轮完整点击流程 ====');
    let page = await ctx.newPage();
    console.log('【步骤3】打开业务页面');
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(3000);

    // 第1轮初始页面截图
    await page.screenshot({path:'loop1_start_page.png', omitBackground:true});
    console.log('📷 第1轮初始页面截图已保存 loop1_start_page.png');

    // 1. 查找文字“连续打开”，获取文字所在Y坐标
    const targetTextY = await page.evaluate(()=>{
      const allNodes = Array.from(document.querySelectorAll('*'));
      let targetY = null;
      for(const el of allNodes){
        const text = el.textContent?.trim();
        if(text && text.includes('连续打开')){
          const rect = el.getBoundingClientRect();
          targetY = rect.y;
          break;
        }
      }
      return targetY;
    });
    console.log(`ℹ 识别文字【连续打开】垂直坐标Y: ${targetY}`);

    // 2. 根据Y值选择对应点位列表
    let useClickList = [];
    if(targetY !== null){
      if(targetY >= 1800 && targetY <= 2000){
        useClickList = listY1800_2000;
        console.log(`✅ Y坐标${targetY} 在1800-2000区间，使用第一套点位`);
      }else if(targetY >= 1100 && targetY <= 1300){
        useClickList = listY1100_1300;
        console.log(`✅ Y坐标${targetY} 在1100-1300区间，使用第二套点位`);
      }else{
        console.log(`⚠ Y坐标${targetY} 不在指定区间，无点位执行`);
      }
    }else{
      console.log(`⚠ 页面未找到文字【连续打开】，跳过所有点击`);
    }

    // 3. 循环执行选中点位：移动→红点→截图→点击→等待2s
    for(const item of useClickList){
      const {x,y} = item;
      await page.mouse.move(x,y);
      // 清除旧红点
      await page.evaluate(()=>{
        document.querySelectorAll('div[style*="border-radius:50%"]').forEach(d=>d.remove());
      });
      // 绘制红点标记
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
      // 点击前截图
      await page.screenshot({path:`loop1_click_${x}_${y}.png`, omitBackground:true});
      console.log(`📷 第1轮点位截图 loop1_click_${x}_${y}.png`);

      // 长按模拟点击
      await page.mouse.down();
      await sleep(300);
      await page.mouse.up();
      console.log(`✅ (${x},${y})点击完成，等待2秒`);
      await sleep(2000);
    }
    console.log('==== 第1轮完整点击流程结束 ====');
    // 第1轮结束关闭页面
    await page.close();
    console.log('✅ 第1轮页面已关闭，等待2秒后开启第2轮');
    await sleep(2000);

    // ====================== 第2轮流程（无截图、无红点） ======================
    console.log('\n==== 开始第2轮完整点击流程 ====');
    let page2 = await ctx.newPage();
    console.log('【步骤3】重新打开业务页面');
    await page2.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(3000);

    // 第2轮同样识别文字选择点位，但不截图、不画红点
    const targetTextY2 = await page2.evaluate(()=>{
      const allNodes = Array.from(document.querySelectorAll('*'));
      let targetY = null;
      for(const el of allNodes){
        const text = el.textContent?.trim();
        if(text && text.includes('连续打开')){
          const rect = el.getBoundingClientRect();
          targetY = rect.y;
          break;
        }
      }
      return targetY;
    });
    console.log(`ℹ 第2轮识别文字【连续打开】垂直坐标Y: ${targetTextY2}`);

    let useClickList2 = [];
    if(targetTextY2 !== null){
      if(targetTextY2 >= 1800 && targetTextY2 <= 2000){
        useClickList2 = listY1800_2000;
        console.log(`✅ Y坐标${targetTextY2} 在1800-2000区间，使用第一套点位`);
      }else if(targetTextY2 >= 1100 && targetTextY2 <= 1300){
        useClickList2 = listY1100_1300;
        console.log(`✅ Y坐标${targetTextY2} 在1100-1300区间，使用第二套点位`);
      }else{
        console.log(`⚠ Y坐标${targetTextY2} 不在指定区间，无点位执行`);
      }
    }else{
      console.log(`⚠ 第2轮页面未找到文字【连续打开】，跳过所有点击`);
    }

    for(const item of useClickList2){
      const {x,y} = item;
      await page2.mouse.move(x,y);
      await page2.mouse.down();
      await sleep(300);
      await page2.mouse.up();
      console.log(`✅ (${x},${y})点击完成，等待2秒`);
      await sleep(2000);
    }
    console.log('==== 第2轮完整点击流程结束 ====');
    await page2.close();
    console.log('✅【步骤3】两轮全部执行完毕，页面关闭');

  } catch (e) {
    console.error('运行异常：', e.message);
  } finally {
    await browser.close();
    console.log('浏览器已关闭，任务结束');
  }
})();
