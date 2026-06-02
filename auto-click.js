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

    //【新增前置步骤：先1596,1704移动、红点截图、点击】
    const preX = 1596;
    const preY = 1704;
    await page.mouse.move(preX, preY);
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
    },{px:preX,py:preY});
    await sleep(600);
    await page.screenshot({path:'pre_1596_1704.png'});
    console.log(`📷 已保存前置点位截图 pre_1596_1704.png`);
    await page.mouse.click(preX, preY);
    console.log(`✅ 前置点位(${preX},${preY})点击完成`);
    await sleep(1200);

    // 原有后续移动点位列表
    const posList = [
      {x:1027,y:2002,name:'pos1_1027'},
      {x:1142,y:2002,name:'pos2_1142'},
      {x:1262,y:2002,name:'pos3_1262'},
      {x:1381,y:2002,name:'pos4_1381'},
      {x:1500,y:2002,name:'pos5_1500'},
      {x:1616,y:2002,name:'pos6_1616'},
      {x:1736,y:2002,name:'pos7_1736'},
      {x:1950,y:2002,name:'pos8_1950'}
    ];

    //逐个移动、画红点、截图
    for(const item of posList){
      const {x,y,name} = item;
      await page.mouse.move(x, y);
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
      await sleep(600);
      await page.screenshot({path:`${name}.png`});
      console.log(`📷 已保存 ${name}.png`);
    }

    //点击主按钮1950,2002
    const clickX = 1950;
    const clickY = 2002;
    await page.mouse.click(clickX, clickY);
    console.log(`✅ 点击目标坐标(${clickX},${clickY})，等待弹窗加载`);
    await sleep(2500);

    // 弹窗【立即领取】按钮处理
    const receiveBtn = page.locator('button.main-btn:has-text("立即领取")');
    if(await receiveBtn.isVisible({timeout:3000})){
      //获取按钮坐标，移动鼠标
      const box = await receiveBtn.boundingBox();
      const btnX = box.x + box.width/2;
      const btnY = box.y + box.height/2;
      await page.mouse.move(btnX, btnY);
      //红点标记+截图
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
      },{px:btnX,py:btnY});
      await sleep(600);
      await page.screenshot({path:'pop_receive_btn.png'});
      console.log('📷 弹窗立即领取按钮已截图 pop_receive_btn.png');
      //点击弹窗按钮
      await receiveBtn.click();
      console.log('✅ 弹窗【立即领取】点击完成');
    }else{
      console.log('ℹ️ 未弹出领取弹窗，跳过弹窗点击');
    }

    //最后刷新页面、等待2秒关闭
    await page.reload({waitUntil:'domcontentloaded'});
    console.log('🔄 页面已刷新');
    await sleep(2000);
    await page.close();
    console.log('✅ 页面关闭完成');

  } catch (e) {
    console.error('运行异常：', e.message);
  } finally {
    await browser.close();
    console.log('浏览器已关闭，任务结束');
  }
})();
