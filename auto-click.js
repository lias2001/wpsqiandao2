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

    // ====================== 第1轮流程 ======================
    console.log('\n==== 开始第1轮完整点击流程 ====');
    let page = await ctx.newPage();
    console.log('【步骤3】打开业务页面');
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(3000);

    // 第1轮初始页面截图（不计入序号）
    await page.screenshot({path:'loop1_start_page.png', omitBackground:true});
    console.log('📷 第1轮初始页面截图已保存 loop1_start_page.png');

    let screenshotCount = 1;

    // ========== 只识别【往期记录】，取消申请试用 ==========
    console.log('\n==== 识别【往期记录】 ====');
    let recordPos = null;
    try {
      const recordLocator = page.getByText('往期记录');
      await recordLocator.waitFor({state:'visible', timeout:5000});
      const box = await recordLocator.boundingBox();
      if(box){
        recordPos = {x: box.x + box.width/2, y: box.y + box.height/2};
      }
    }catch(e){
      console.log(`⚠ 【往期记录】定位超时或不存在`);
    }
    if(!recordPos){
      console.log('❌ 无法获取往期记录坐标，终止脚本');
      await browser.close();
      return;
    }
    const recX = recordPos.x;
    const recY = recordPos.y;
    console.log(`✅ 识别到【往期记录】，坐标：X=${recX.toFixed(2)}, Y=${recY.toFixed(2)}`);

    // 往期记录本身红点截图（保留）
    await page.mouse.move(recX, recY);
    await page.evaluate(()=>{
      document.querySelectorAll('div.red-dot-marker').forEach(d=>d.remove());
    });
    await page.evaluate(({px,py})=>{
      const dot = document.createElement('div');
      dot.className = 'red-dot-marker';
      dot.style.position='fixed';
      dot.style.left=px+'px';
      dot.style.top=py+'px';
      dot.style.width='22px';
      dot.style.height='22px';
      dot.style.background='red';
      dot.style.borderRadius='50%';
      dot.style.zIndex='9999999';
      document.body.appendChild(dot);
    },{px:recX,py:recY});
    await sleep(2000);
    let filename = `第${screenshotCount}次截图_往期记录_${recX}_${recY}.png`;
    await page.screenshot({path:filename, omitBackground:true});
    console.log(`📷 ${filename}`);
    screenshotCount++;

    // ========== 【前置固定点位流程，按你要求的10步】 ==========
    console.log('\n==== 执行前置10步点位操作 ====');
    const steps = [
      {x: recX - 200, y: recY + 150, name:"step1_往期记录X-200_Y+150"},
      {x: 750, y: 1500, name:"step2_750_1500"},
      {x: 590, y: 1500, name:"step3_590_1500"},
      {x: recX + 160, y: recY + 150, name:"step4_往期记录X+160_Y+150"},
      {x: 750, y: 1500, name:"step5_750_1500"},
      {x: 590, y: 1500, name:"step6_590_1500"},
      {x: recX + 240, y: recY + 80, name:"step7_往期记录X+240_Y+80"},
      {x: recX + 160, y: recY + 150, name:"step8_往期记录X+160_Y+150"},
      {x: 750, y: 1500, name:"step9_750_1500"},
      {x: 590, y: 1500, name:"step10_590_1500"},
    ];

    for(const step of steps){
      const {x,y,name} = step;
      console.log(`\n👉 执行${name}，坐标(${x.toFixed(2)},${y.toFixed(2)})`);
      await page.mouse.move(x,y);
      // 清除旧红点
      await page.evaluate(()=>{
        document.querySelectorAll('div.red-dot-marker').forEach(d=>d.remove());
      });
      // 添加红点
      await page.evaluate(({px,py})=>{
        const dot = document.createElement('div');
        dot.className = 'red-dot-marker';
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
      await sleep(2000); //等待2秒，带红点截图
      filename = `第${screenshotCount}次截图_${name}_${x}_${y}.png`;
      await page.screenshot({path:filename, omitBackground:true});
      console.log(`📷 ${filename}`);
      screenshotCount++;
      // 点击
      await page.mouse.down();
      await sleep(300);
      await page.mouse.up();
      console.log(`✅ ${name} 点击完成`);
    }
    console.log('==== 前置10步点位全部执行完毕 ====\n');

    // ========== 识别连续打卡 div.left ==========
    const targetTextY = await page.evaluate(()=>{
      let targetY = null;
      const targetDivs = Array.from(document.querySelectorAll('div.left'));
      for(const el of targetDivs){
        const text = el.textContent?.trim();
        if(text && text.includes('连续打卡')){
          const rect = el.getBoundingClientRect();
          targetY = rect.y;
          break;
        }
      }
      return targetY;
    });
    console.log(`ℹ 识别文字【连续打卡】垂直坐标Y: ${targetTextY}`);

    let useClickList = [];
    if(targetTextY !== null){
      const baseY = targetTextY + 182;
      useClickList = [
        {x:180,y:baseY},
        {x:300,y:baseY},
        {x:420,y:baseY},
        {x:540,y:baseY},
        {x:660,y:baseY},
        {x:780,y:baseY},
        {x:900,y:baseY},
        {x:1123,y:baseY},
        {x:770,y:1580}
      ];
      console.log(`✅ 已生成动态点位，基准Y=${baseY}`);
    }else{
      console.log(`⚠ 页面未找到文字【连续打卡】，跳过所有动态点位点击`);
    }

    // 循环执行动态点位：移动→清红点→新增当前红点→截图→点击→等待2s
    for(const item of useClickList){
      const {x,y} = item;
      await page.mouse.move(x,y);
      await page.evaluate(()=>{
        document.querySelectorAll('div.red-dot-marker').forEach(d=>d.remove());
      });
      await page.evaluate(({px,py})=>{
        const dot = document.createElement('div');
        dot.className = 'red-dot-marker';
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
      filename = `第${screenshotCount}次截图_坐标_${x}_${y}.png`;
      await page.screenshot({path:filename, omitBackground:true});
      console.log(`📷 ${filename}`);
      screenshotCount++;

      await page.mouse.down();
      await sleep(300);
      await page.mouse.up();
      console.log(`✅ (${x},${y})点击完成，等待2秒`);
      await sleep(2000);
    }
    console.log('==== 第1轮完整点击流程结束 ====');
    await page.close();
    console.log('✅ 第1轮页面已关闭，等待2秒后开启第2轮');
    await sleep(2000);

    // ====================== 第2轮流程（无截图、无红点） ======================
    console.log('\n==== 开始第2轮完整点击流程 ====');
    let page2 = await ctx.newPage();
    console.log('【步骤3】重新打开业务页面');
    await page2.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(3000);

    const targetTextY2 = await page2.evaluate(()=>{
      let targetY = null;
      const targetDivs = Array.from(document.querySelectorAll('div.left'));
      for(const el of targetDivs){
        const text = el.textContent?.trim();
        if(text && text.includes('连续打卡')){
          const rect = el.getBoundingClientRect();
          targetY = rect.y;
          break;
        }
      }
      return targetY;
    });
    console.log(`ℹ 第2轮识别文字【连续打卡】垂直坐标Y: ${targetTextY2}`);

    let useClickList2 = [];
    if(targetTextY2 !== null){
      const baseY2 = targetTextY2 + 182;
      useClickList2 = [
        {x:180,y:baseY2},
        {x:300,y:baseY2},
        {x:420,y:baseY2},
        {x:540,y:baseY2},
        {x:660,y:baseY2},
        {x:780,y:baseY2},
        {x:900,y:baseY2},
        {x:1123,y:baseY2},
        {x:770,y:1580}
      ];
      console.log(`✅ 第2轮已生成动态点位，基准Y=${baseY2}`);
    }else{
      console.log(`⚠ 第2轮页面未找到文字【连续打卡】，跳过所有点击`);
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
