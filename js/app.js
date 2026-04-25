const DATE_INPUT = document.getElementById('dateInput');
const RESULT_VALUE = document.getElementById('resultValue');

const START_DATE = document.getElementById('startDate');
const END_DATE = document.getElementById('endDate');
const CHART_BTN = document.getElementById('chartBtn');
const CHANGELOG_BTN = document.getElementById('changelogBtn');

const COMPARE_DATE1 = document.getElementById('compareDate1');
const COMPARE_DATE2 = document.getElementById('compareDate2');
const COMPARE_VALUE1 = document.getElementById('compareValue1');
const COMPARE_VALUE2 = document.getElementById('compareValue2');
const COMPARE_RATIO = document.getElementById('compareRatio');

let dailyData = {};
let chart = null;

async function init() {
    const resp = await fetch('js/daily_totals.json');
    dailyData = await resp.json();
    console.log(`已加载 ${Object.keys(dailyData).length} 天数据`);

    const latestDate = getLatestDate();

    // 大盘查询页
    DATE_INPUT.value = latestDate;
    DATE_INPUT.max = latestDate;

    const oneMonthAgo = getOneMonthAgo(latestDate);
    START_DATE.value = oneMonthAgo;
    START_DATE.max = latestDate;
    END_DATE.value = latestDate;
    END_DATE.max = latestDate;

    // 大盘对比页
    COMPARE_DATE1.value = getOneMonthAgo(latestDate);
    COMPARE_DATE1.max = latestDate;
    COMPARE_DATE2.value = latestDate;
    COMPARE_DATE2.max = latestDate;

    query();
    drawChart();
    updateCompare();
}

function getLatestDate() {
    return Object.keys(dailyData)
        .filter(d => dailyData[d] > 0)
        .sort()
        .at(-1);
}

function getOneMonthAgo(dateStr) {
    const date = new Date(dateStr);
    date.setMonth(date.getMonth() - 1);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function query() {
    const date = DATE_INPUT.value;
    const total = dailyData[date];

    if (!total) {
        RESULT_VALUE.textContent = '无数据';
        return;
    }

    RESULT_VALUE.textContent = formatNumber(total);
}

function updateCompare() {
    const date1 = COMPARE_DATE1.value;
    const date2 = COMPARE_DATE2.value;
    const val1 = dailyData[date1];
    const val2 = dailyData[date2];

    COMPARE_VALUE1.textContent = val1 ? formatNumber(val1) : '无数据';
    COMPARE_VALUE2.textContent = val2 ? formatNumber(val2) : '无数据';

    if (val1 && val2 && val1 > 0) {
        const ratio = val2 / val1;
        if (ratio > 1) {
            COMPARE_RATIO.className = 'increase';
            COMPARE_RATIO.innerHTML = `<div class="arrow-graph increase"></div><span class="ratio-text">${ratio.toFixed(2)}倍</span>`;
        } else if (ratio < 1) {
            COMPARE_RATIO.className = 'decrease';
            COMPARE_RATIO.innerHTML = `<div class="arrow-graph decrease"></div><span class="ratio-text">${ratio.toFixed(2)}倍</span>`;
        } else {
            COMPARE_RATIO.className = '';
            COMPARE_RATIO.textContent = '相等';
        }
    } else {
        COMPARE_RATIO.innerHTML = '--';
    }
}

function drawChart() {
    const start = START_DATE.value;
    const end = END_DATE.value;

    const labels = [];
    const values = [];

    for (const date in dailyData) {
        if (date >= start && date <= end) {
            labels.push(date);
            values.push(dailyData[date]);
        }
    }

    if (labels.length === 0) {
        return;
    }

    const chartDom = document.getElementById('chart');

    if (!chart) {
        chart = echarts.init(chartDom);
    }

    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'line',
                lineStyle: {
                    color: '#9B1B30',
                    width: 1,
                    type: 'solid'
                }
            },
            formatter: function(params) {
                const date = params[0].axisValue;
                const value = params[0].value;
                return `${date}<br/>播放量: ${(value / 100000000).toFixed(2)} 亿`;
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: labels,
            boundaryGap: false,
            axisLine: {
                lineStyle: {
                    color: '#E0E0E0'
                }
            },
            axisLabel: {
                color: '#666',
                maxTicksLimit: 10
            }
        },
        yAxis: {
            type: 'value',
            scale: true,
            min: function(value) {
                return Math.floor(value.min * 0.95);
            },
            max: function(value) {
                return Math.ceil(value.max * 1.05);
            },
            axisLabel: {
                color: '#666',
                formatter: function(value) {
                    return (value / 100000000).toFixed(1) + '亿';
                }
            },
            splitLine: {
                lineStyle: {
                    color: '#E0E0E0'
                }
            }
        },
        series: [{
            data: values,
            type: 'line',
            smooth: true,
            symbol: 'none',
            lineStyle: {
                color: '#9B1B30',
                width: 2
            },
            areaStyle: {
                color: 'rgba(155, 27, 48, 0.1)'
            }
        }]
    };

    chart.setOption(option);
}

function showChangelogPage() {
    document.getElementById('chartsPage').classList.add('hidden');
    document.getElementById('changelogPage').classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    CHANGELOG_BTN.classList.add('active');
}

function showChartsPage() {
    document.getElementById('chartsPage').classList.remove('hidden');
    document.getElementById('changelogPage').classList.add('hidden');
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.querySelector('[data-page="charts"]').classList.add('active');
    if (chart) chart.resize();
}

function renderChangelog() {
    const changelogData = [
        { version: 'v1.2.1', date: '2026-04-23', text: 
            '增加大盘对比功能：\n选择两个日期，比较大盘变化（倍数），展示变化。\n \
            样式优化：\n1.卡片增加毛玻璃效果\n2.增加动态背景\n3.优化布局\n4.优化卡片底色' },
        { version: 'v1.1', date: '2026-04-23', text: '功能更新：增加走势图。支持按日期范围查看Spotify global大盘走势，支持悬浮查看数据详情\n样式优化：增加更新日志、优化布局。' },
        { version: 'v1.0', date: '2026-04-22', text: '初始功能上线：支持查询指定日期的Spotify Global Top 200播放量总和。' },
    ];

    const list = document.getElementById('changelogList');
    list.innerHTML = changelogData.map(item => `
        <div class="changelog-item">
            <div class="changelog-date">${item.date} <span class="changelog-version">${item.version}</span></div>
            <div class="changelog-text">${item.text.replace(/\n/g, '<br>')}</div>
        </div>
    `).join('');
}

DATE_INPUT.addEventListener('change', query);

CHART_BTN.addEventListener('click', drawChart);

COMPARE_DATE1.addEventListener('change', updateCompare);
COMPARE_DATE2.addEventListener('change', updateCompare);

CHANGELOG_BTN.addEventListener('click', (e) => {
    e.preventDefault();
    showChangelogPage();
});

document.querySelector('[data-page="charts"]').addEventListener('click', (e) => {
    e.preventDefault();
    showChartsPage();
});

window.addEventListener('resize', () => {
    if (chart) chart.resize();
});

init();
renderChangelog();
