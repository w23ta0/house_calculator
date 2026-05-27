/**
 * 购房经济指标计算器 — 前端脚本
 *
 * 功能：
 *   1. 获取用户输入并计算各项购房经济指标
 *   2. 调用后端 /api/chat 获取 AI 购房建议（API Key 安全存储在服务端）
 *   3. 以打字机效果展示 AI 建议
 */

function calculateMetrics() {
  // ========== 1. 获取用户输入 ==========
  const price = parseFloat(document.getElementById("price").value);
  const income = parseFloat(document.getElementById("income").value);
  const downPaymentRatio = parseFloat(document.getElementById("down_payment").value) / 100;
  const rate = parseFloat(document.getElementById("rate").value) / 100;
  const years = parseInt(document.getElementById("years").value, 10);
  const savings = parseFloat(document.getElementById("savings").value);

  // ========== 2. 输入校验 ==========
  if (isNaN(price) || isNaN(income) || isNaN(downPaymentRatio) || isNaN(rate) || isNaN(years) || isNaN(savings)) {
    alert("请输入有效的数值！");
    return;
  }

  showLoading();

  // ========== 3. 核心计算 ==========
  const annualIncome = income * 12;                            // 年收入 = 月收入 × 12
  const downPayment = price * downPaymentRatio;                // 首付金额
  const loanAmount = price - downPayment;                      // 贷款总额
  const monthlyRate = rate / 12;                               // 月利率
  const totalMonths = years * 12;                              // 还款总月数

  // 等额本息月供公式: M = P × r × (1+r)^n / ((1+r)^n - 1)
  const monthlyPayment = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)
    / (Math.pow(1 + monthlyRate, totalMonths) - 1);

  const totalInterest = monthlyPayment * totalMonths - loanAmount;  // 总利息
  const remainingSavings = savings - downPayment;                    // 购房后剩余储蓄

  // 储蓄覆盖率 = 剩余储蓄 / (月供 × 6)
  // 含义：> 1 表示剩余储蓄至少够覆盖 6 个月月供（应急资金充足）
  const savingsCoverageRatio = remainingSavings / (monthlyPayment * 6);

  const priceToIncomeRatio = price / annualIncome;             // 房价收入比
  const paymentToIncomeRatio = monthlyPayment / income;        // 月供收入比

  // ========== 4. 渲染计算结果 ==========
  const resultHTML =
    `房价收入比：<span class="${priceToIncomeRatio > 10 ? "red" : "green"}">${priceToIncomeRatio.toFixed(2)}倍</span><br>` +
    `月供收入比：<span class="${paymentToIncomeRatio > 0.4 ? "red" : "green"}">${(paymentToIncomeRatio * 100).toFixed(2)}%</span><br>` +
    `首付款：${(downPayment / 10000).toFixed(2)}万元<br>` +
    `贷款总额：${(loanAmount / 10000).toFixed(2)}万元<br>` +
    `每月月供：${monthlyPayment.toFixed(2)}元<br>` +
    `总利息：${(totalInterest / 10000).toFixed(2)}万元<br>` +
    `购房后剩余储蓄：${(remainingSavings / 10000).toFixed(2)}万元<br>` +
    `储蓄覆盖率：<span class="${savingsCoverageRatio < 1 ? "red" : "green"}">${savingsCoverageRatio.toFixed(2)}</span>`;

  document.getElementById("result").innerHTML = resultHTML;

  // ========== 5. 调用后端 API 获取 AI 购房建议 ==========
  const systemPrompt = `你是一位资深房产投资顾问和财务分析师。请基于用户提供的房产数据，按照以下固定格式进行分析，字数控制在200字以内：

直接给出'✅ 建议购买' 或 '⚠️ 建议谨慎' 或 '❌ 不建议购买'之一

【核心理由】
1. 房价收入比分析（国际标准3-5倍）
2. 月供压力分析（建议不超过30-40%）
3. 财务风险评估

【风险提示】
列举主要风险点（1-2条）

请务必使用这个固定格式，不要偏离结构。用通俗易懂的语言，直接数字对比，避免复杂术语。`;

  fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: resultHTML },
      ],
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.choices && data.choices.length > 0) {
        let content = data.choices[0].message.content;
        // 移除 AI 的思维链标签 <think>...</think>
        content = content.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
        renderMarkdownWithTypewriter(content);
      } else {
        document.getElementById("advice").innerHTML =
          data.error || "无法获取建议，请稍后再试。";
      }
    })
    .catch((err) => {
      console.error(err);
      document.getElementById("advice").innerHTML = "请求失败，请检查网络连接。";
    });
}

/**
 * 将 Markdown 文本转为 HTML，并以打字机效果逐字符显示
 * @param {string} content - Markdown 格式的文本内容
 */
function renderMarkdownWithTypewriter(content) {
  const adviceEl = document.getElementById("advice");
  adviceEl.innerHTML = "";
  adviceEl.textContent = "";

  // 使用 showdown.js 将 Markdown 转为 HTML
  const converter = new showdown.Converter();
  let html = converter.makeHTML(content);

  // 将 <h1>~<h6> 标签替换为 <strong>...<br> 格式（简化标题显示）
  html = html.replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/g, "<strong>$1</strong><br>");

  let charIndex = 0;

  // 创建临时 div 解析 HTML（让浏览器规范化 HTML 结构）
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  const fullHTML = tempDiv.innerHTML;

  // 打字机效果：每 10ms 显示一个字符
  function typeNextChar() {
    if (charIndex < fullHTML.length) {
      adviceEl.innerHTML = fullHTML.substring(0, charIndex + 1);
      charIndex++;
      setTimeout(typeNextChar, 10);
    }
  }
  typeNextChar();
}

/**
 * 显示加载动画（在 AI 建议区域显示 spinner）
 */
function showLoading() {
  const adviceEl = document.getElementById("advice");
  let loadingEl = document.getElementById("loading");

  if (!loadingEl) {
    loadingEl = document.createElement("div");
    loadingEl.id = "loading";
    loadingEl.style.display = "block";
    loadingEl.innerHTML = '<i class="fa fa-spinner fa-spin"></i> 分析中...';
    adviceEl.appendChild(loadingEl);
  } else {
    loadingEl.style.display = "block";
  }

  adviceEl.innerHTML = "";
  adviceEl.appendChild(loadingEl);
}

/**
 * 隐藏加载动画并显示最终消息
 * @param {string} message - 要显示的 HTML 内容
 */
function hideLoading(message) {
  const adviceEl = document.getElementById("advice");
  const loadingEl = document.getElementById("loading");

  if (loadingEl) {
    loadingEl.style.display = "none";
  }

  adviceEl.innerHTML = message;
}
