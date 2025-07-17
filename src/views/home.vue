<template>
  <div class="stats-page">
    <el-row gutter="20" class="stats-cards">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="card-content">
            <div class="stat-value">{{ statsData.totalUsers }}</div>
            <div class="stat-label">总用户</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="card-content">
            <div class="stat-value">{{ statsData.totalOrders }}</div>
            <div class="stat-label">总订单</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="card-content">
            <div class="stat-value">{{ statsData.totalSales }}</div>
            <div class="stat-label">总销售额</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="card-content">
            <div class="stat-value">{{ statsData.totalProducts }}</div>
            <div class="stat-label">总产品</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 中间的图表 -->
    <el-row gutter="20" class="charts-section">
      <el-col :span="12">
        <el-card shadow="hover">
          <div ref="salesChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <div ref="usersChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import * as echarts from 'echarts';

// 统计数据
const statsData = {
  totalUsers: 1024,
  totalOrders: 256,
  totalSales: 128000,
  totalProducts: 512
};

// 表格数据
const tableData = [
  {
    date: '2024-08-01',
    name: '张三',
    address: '北京市朝阳区'
  },
  {
    date: '2024-08-02',
    name: '李四',
    address: '上海市黄浦区'
  },
  {
    date: '2024-08-03',
    name: '王五',
    address: '广州市天河区'
  }
];

// 使用 ref 来引用 DOM 元素
const salesChartRef = ref<HTMLElement | null>(null);
const usersChartRef = ref<HTMLElement | null>(null);

// 创建图表
const createChart = (el: HTMLElement, options: any) => {
  const chart = echarts.init(el);
  chart.setOption(options);
};

// 挂载图表
onMounted(() => {
  const salesChartOptions = {
    title: {
      text: '销售额趋势'
    },
    tooltip: {},
    xAxis: {
      data: ['1月', '2月', '3月', '4月', '5月', '6月']
    },
    yAxis: {},
    series: [
      {
        name: '销售额',
        type: 'bar',
        data: [5000, 20000, 36000, 10000, 10000, 20000]
      }
    ]
  };

  const usersChartOptions = {
    title: {
      text: '用户增长趋势'
    },
    tooltip: {},
    xAxis: {
      data: ['1月', '2月', '3月', '4月', '5月', '6月']
    },
    yAxis: {},
    series: [
      {
        name: '新增用户',
        type: 'line',
        data: [500, 2000, 3600, 1000, 1000, 2000]
      }
    ]
  };

  // 确保 DOM 元素已经挂载后再进行 ECharts 的初始化
  if (salesChartRef.value && usersChartRef.value) {
    createChart(salesChartRef.value, salesChartOptions);
    createChart(usersChartRef.value, usersChartOptions);
  }
});
</script>

<style scoped>
.stats-page {
  padding: 5px;
}

.stats-cards {
  margin-bottom: 20px;
}

.card-content {
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
}

.stat-label {
  font-size: 14px;
  color: #999;
}

.charts-section {
  margin-bottom: 20px;
}

.chart-container {
  width: 100%;
  height: 400px; /* 确保图表容器有明确的高度 */
}

.data-table {
  margin-top: 20px;
}
</style>
