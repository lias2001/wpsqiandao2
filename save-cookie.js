const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  // 持久化上下文目录，保留登录会话缓存
  const userDataDir = path.join(__dirname, 'user_data');
  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
  });
  // 创建持久化上下文，避免登录刷新清空cookie
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  const url = 'https://personal-act.wps.cn/rubik2/portal/HD2025031721339450/YM2025031721331326';

  console.log('正在打开页面，请扫码/账号密码登录WPS');
  await page.goto(url, {timeout: 90000});

  // 人工操作：登录，登录成功后页面会跳回活动页，确认在活动页面后，回车保存cookie
  await new Promise(res => {
    console.log('✅ 登录完成、停留在活动页面后，在控制台按回车保存Cookie');
    process.stdin.once('data', res);
  });

  // 强制等待页面稳定，收集全域名cookie（wps.cn、wpscdn.cn全抓取）
  await page.waitForTimeout(3000);
  const cookies = await context.cookies();
  fs.writeFileSync('./cookies.json', JSON.stringify(cookies, null, 2), 'utf8');
  console.log('🎉 cookie已保存至 cookies.json，复制全部内容备用');

  await browser.close();
})();