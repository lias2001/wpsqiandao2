const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const COOKIES = JSON.parse(process.env.WPS_COOKIES);
const TARGET_URL = 'https://personal-act.wps.cn/rubik2/portal/HD2025031721339450/YM2025031721331326';
const sleep = ms => new Promise(res => setTimeout(res, ms));

// 截图目录
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

/**
 * 在鼠标坐标(x,y)绘制红色圆点并截图，仅第一轮点击调用
 */
async function screenshotWithMousePoint(page, x, y) {
  // 修复：多参数打包成单个对象传入evaluate
  await page.evaluate(({ px, py }) => {
    // 移除旧红点
    const oldDot = document.getElementById('mouse-point-marker');
    if (oldDot) oldDot.remove();

    const dot = document.createElement('div');
    dot.id = 'mouse-point-marker';
    Object.assign(dot.style, {
      position: 'fixed',
      left: `${px - 8}px`,
      top: `${py - 8}px`,
      width: '16px',
      height: '16px',
      borderRadius: '50%',
      backgroundColor: 'rgba(255,0,0,0.7)',
      zIndex: '999999',
      pointerEvents: 'none',
      border: '2px solid #fff'
    });
    document.body.appendChild(dot);
  }, { px: x, py: y });

  // 截图保存，文件名带坐标
  const fileName = `X${x}_Y${y}.png`;
  const savePath = path.join(SCREENSHOT_DIR, fileName);
  await page.screenshot({ path: savePath, fullPage: false });
  console.log(`📸 已保存截图：${fileName}`);

  // 移除红点
  await page.evaluate(() => {
    const dot = document.getElementById('mouse-point-marker');
    if (dot) dot.remove();
  });
}

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

    // 整体流程循环执行2轮
    for(let loop = 1; loop <= 2; loop++){
      console.log(`\n==== 开始第${loop}轮完整点击流程 ====`);
      for(const item of clickList){
        const {x,y} = item;
        await page.mouse.move(x,y);

        // 仅第一轮点击前，执行带红点截图
        if (loop === 1) {
          await screenshotWithMousePoint(page, x, y);
        }

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
    // 打印完整堆栈方便排错
    console.error(e.stack);
  } finally {
    await browser.close();
    console.log('浏览器已关闭，任务结束');
  }
})();
