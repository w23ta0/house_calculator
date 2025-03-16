function calculateMetrics() {
    // 获取用户输入的数值
    const incomeMonthly = parseFloat(document.getElementById('income').value);
    const housePrice = parseFloat(document.getElementById('price').value);
    const downPaymentPercentage = parseFloat(document.getElementById('down_payment').value) / 100;
    const loanRateAnnual = parseFloat(document.getElementById('rate').value) / 100;
    const loanYears = parseInt(document.getElementById('years').value, 10);
    const currentSavings = parseFloat(document.getElementById('savings').value);

    // 检查输入是否为有效数字
    if (isNaN(incomeMonthly) || isNaN(housePrice) || isNaN(downPaymentPercentage) || isNaN(loanRateAnnual) || isNaN(loanYears) || isNaN(currentSavings)) {
        alert("请输入有效的数值！");
        return;
    }

    // 计算年收入
    const incomeYearly = incomeMonthly * 12;

    // 计算首付金额
    const downPayment = housePrice * downPaymentPercentage;

    // 计算贷款总额
    const loanAmount = housePrice - downPayment;

    // 计算月利率
    const monthlyRate = loanRateAnnual / 12;

    // 计算贷款总月数
    const months = loanYears * 12;

    // 计算每月月供
    const monthlyPayment = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
    const totalInterest = monthlyPayment * months - loanAmount;

    // 计算购房后的剩余储蓄
    const remainingSavings = currentSavings - downPayment;

    // 计算储蓄覆盖率（剩余储蓄 / (月供 * 6)）
    const savingsCoverageRatio = remainingSavings / (monthlyPayment * 6);

    // 计算房价收入比
    const priceToIncomeRatio = housePrice / incomeYearly;

    // 计算月供收入比
    const monthlyPaymentRatio = monthlyPayment / incomeMonthly;

    // 显示计算结果
    document.getElementById('result').innerHTML = `
        房价收入比：<span class="${priceToIncomeRatio > 10 ? 'red' : 'green'}">${priceToIncomeRatio.toFixed(2)} 倍</span><br>
        月供收入比：<span class="${monthlyPaymentRatio > 0.4 ? 'red' : 'green'}">${(monthlyPaymentRatio * 100).toFixed(2)} %</span><br>
        首付款：${(downPayment / 10000).toFixed(2)} 万元<br>
        贷款总额：${(loanAmount / 10000).toFixed(2)} 万元<br>
        每月月供：${monthlyPayment.toFixed(2)} 元<br>
        总利息：${(totalInterest / 10000).toFixed(2)} 万元<br>
        购房后剩余储蓄：${(remainingSavings / 10000).toFixed(2)} 万元<br>
        储蓄覆盖率：<span class="${savingsCoverageRatio < 1 ? 'red' : 'green'}">${savingsCoverageRatio.toFixed(2)}</span>
    `;

    // 提供购房建议
    let advice = "";
    if (priceToIncomeRatio > 10) {
        advice += "<span class='red'>房价收入比过高，建议考虑其他更为适合的购房区域。</span><br>";
    } else {
        advice += "<span class='green'>房价收入比在合理范围内。</span><br>";
    }

    if (monthlyPaymentRatio > 0.4) {
        advice += "<span class='red'>月供占收入比偏高，需慎重考虑每月还款压力。</span><br>";
    } else {
        advice += "<span class='green'>月供占收入比合理。</span><br>";
    }

    if (savingsCoverageRatio < 1) {
        advice += "<span class='red'>购房后剩余储蓄不足以覆盖至少6个月的月供，应提高储蓄储备。</span><br>";
    } else {
        advice += "<span class='green'>购房后储蓄充足，财务状况良好。</span><br>";
    }

    document.getElementById('advice').innerHTML = advice;
}
