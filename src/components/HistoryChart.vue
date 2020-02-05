<template>
  <div class="history-chart">
    <div class="loading" v-if="loading">loading ...</div>
    <canvas :id="'history-canvas-'+quarter" />
    <el-slider
      v-if="maxTime&&timerange&&passtimes"
      v-model="timerange"
      range
      :marks="passtimes"
      :format-tooltip="getDate"
      :max="maxTime[2]"
    ></el-slider>
  </div>
</template>


<script>
import { mapState, mapMutations } from "vuex";
import Chart from "chart.js";

var months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];
var passMap = {};

async function getPassInfo(q) {
  if (passMap[q]) return passMap[q];
  try {
    const data = (
      await axios({
        method: "get",
        url: `/api/getQuarterInfo?q=${q}`
      })
    ).data[0];
    const obj = [];
    for (var i = 1; i <= 3; i++) obj.push(new Date(data[`pass${i}Begin`]));
    passMap[q] = obj;
  } catch (error) {
    console.log(error);
    return null;
  }
  return passMap[q];
}

export default {
  name: "HistoryChart",
  props: ["id", "codes", "disables", "quarter"],
  data() {
    return {
      loading: false,
      res: {},
      data: null,
      expandedList: null,
      focus: null,
      chart: null,
      timerange: null,
      maxTime: null,
      passtimes: null
    };
  },
  mounted() {
    this.expandedList = this.codes.map(e => e[0]);
    this.loadHistory();
  },
  methods: {
    async loadHistory() {
      this.loading = true;
      let resp = null;
      try {
        resp = await axios({
          method: "post",
          url: `/api/sche/getHistories?q=${this.quarter}`,
          data: this.codes.flat(2)
        });
        this.loading = false;
      } catch (error) {
        this.loading = false;
        console.log(error);
        swal("ERROR", "Server Response Error", "error");
      }
      const qinfo = await getPassInfo(this.quarter);
      if (resp && qinfo) {
        this.processData(resp.data, qinfo);
      }
    },

    processData(data, qinfo) {
      let sum = 0;
      data.forEach(x => (sum += x.data.length));
      if (sum == 0) return;
      let gmin = data[0].data[0].date;
      let gmax = data[0].data[0].date;
      for (let e of data) {
        e.zero = -1;
        e.min = e.data[0].date;
        e.max = e.data[0].date;
        for (let x in e.data) {
          e.min = Math.min(e.min, e.data[x].date);
          e.max = Math.max(e.max, e.data[x].date);
          if (e.data[x].sp == 0 && e.zero == -1) e.zero = +x;
          if (e.data[x].sp > 1 && e.zero >= 0) e.zero = -1; // Threshold = 1
        }
        gmin = Math.min(gmin, e.min);
        gmax = Math.max(gmax, e.max);
      }
      for (let e of data) {
        if (e.zero > 0) e.data.splice(e.zero + 1);
        if (e.max < gmax && e.data[e.data.length - 1].sp > 0)
          e.data.push({ date: gmax, sp: e.data[e.data.length - 1].sp });
        if (e.min > gmin) e.data.push({ date: gmin, sp: e.data[0].sp });
        e.data.forEach(x => (x.sp = Math.max(0, x.sp)));
        e.data.sort((a, b) => a.date - b.date);
      }
      this.data = data;
      const tmin = Math.floor(gmin / 86400);
      const tmax = Math.floor(gmax / 86400);
      const p2 = Math.floor(+qinfo[1] / 86400000);
      const p3 = Math.floor(+qinfo[2] / 86400000);
      this.maxTime = [tmin, tmax, tmax - tmin];
      this.timerange = [0, this.maxTime[2]];
      const pts = {};
      pts[p2 - tmin] = "pass 2";
      pts[p3 - tmin] = "pass 3";
      this.passtimes = pts;
      this.generateData();
      this.putOnChart();
    },

    getDate(val) {
      const d = new Date(((this.maxTime[0] + val) * 24 + 8) * 3600000);
      return months[d.getMonth()] + d.Format(" d");
    },

    generateData() {
      if (!this.data) return;
      const lecs = this.codes.map(e => e[0]);

      const getColor = e =>
        e.code == this.focus
          ? "#ff00ff"
          : lecs.indexOf(e.code) < 0
          ? "#0000003f"
          : "hsl(78,71%,46%,25%)";

      this.res.datasets = this.data.map(e => ({
        label: e.code,
        fill: false,
        lineTension: 0,
        hidden: this.expandedList.indexOf(e.code) < 0,
        pointHitRadius: 6,

        pointRadius: 2,
        borderWidth: 2,
        borderColor: getColor(e),
        backgroundColor: getColor(e),

        pointHoverRadius: 2,
        hoverBorderWidth: 2,
        hoverBorderColor: "#000000",
        hoverBackgroundColor: "#ffffff",

        data: e.data.map(x => ({ t: new Date(x.date * 1000), y: x.sp }))
      }));
    },

    updateData(resetHidden) {
      if (!this.res.datasets) return;
      const lecs = this.codes.map(e => e[0]);

      const getColor = e =>
        e.label == this.focus
          ? "#ff00ff"
          : lecs.indexOf(e.label) < 0
          ? "#0000003f"
          : "hsl(78,71%,46%,25%)";

      for (let e of this.res.datasets) {
        e.borderColor = getColor(e);
        e.backgroundColor = getColor(e);
        if (resetHidden) {
          e.hidden = this.expandedList.indexOf(e.label) < 0;
        }
      }
    },

    putOnChart() {
      var ctx = document
        .getElementById("history-canvas-" + this.quarter)
        .getContext("2d");
      this.chart = new Chart(ctx, {
        type: "line",
        data: this.res,
        options: {
          hover: { mode: "dataset" },
          scales: { xAxes: [{ type: "time", time: { unit: "day" } }] }
        }
      });
    },

    showOnly(code) {
      if (!this.res.datasets) return;
      if (this.focus == code) this.focus = "";
      else this.focus = code;
      this.updateData(false);
      this.chart.update();
    },

    expand(lec, secs, expanded) {
      if (!this.res.datasets) return;
      secs.forEach(e => {
        const l = this.expandedList;
        if (expanded) l.push(e);
        else {
          const ind = l.indexOf(e);
          if (ind >= 0) l.splice(ind, 1);
        }
      });
      this.updateData(true);
      this.chart.update();
    }
  },
  watch: {
    timerange: function() {
      const x = this.chart.options.scales.xAxes[0];
      const beg = this.maxTime[0];
      const f = i => new Date(((this.timerange[i] + beg) * 24 + 8) * 3600000);
      x.ticks.min = f(0);
      x.ticks.max = f(1);
      this.chart.update();
    }
  }
};
</script>

<style scoped>
div.loading {
  color: #036;
  font-size: 1.2rem;
}

div.course-info {
  width: 100%;
}

span.add {
  font-size: 1rem;
  color: #369;
  text-decoration: underline;
}

h2 {
  margin: 10px 0;
}

p {
  width: calc(100% - 20px);
  margin: 0 10px 20px 10px;
}

div.note {
  font-size: 1.1rem;
  margin: 3px;
}
</style>