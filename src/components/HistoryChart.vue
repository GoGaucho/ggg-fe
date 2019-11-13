<template>
  <div class="history-chart">
    <div class="loading" v-if="loading">loading ...</div>
    <canvas id="history-canvas" />
  </div>
</template>


<script>
import { mapState, mapMutations } from "vuex";
import Chart from "chart.js";

export default {
  name: "HistoryChart",
  props: ["id", "codes"],
  data() {
    return {
      loading: false,
      res: {}
    };
  },
  computed: {
    ...mapState(["quarter"])
  },
  mounted() {
    this.loadHistory();
  },
  methods: {
    async loadHistory() {
      this.loading = true;
      try {
        const resp = await axios({
          method: "post",
          url: `/api/sche/getHistories?q=${this.quarter}`,
          data: this.codes.flat(2)
        });
        this.loading = false;
        this.processData(resp.data);
      } catch (error) {
        this.loading = false;
        console.log(error);
        swal("ERROR", "Server Response Error", "error");
      }
    },

    processData(data) {
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

      const lecs = this.codes.map(e => e[0]);

      this.res.datasets = data.map(e => ({
        label: e.code,
        fill: false,
        lineTension: 0,
        pointHitRadius: 10,
        pointRadius: 3,
        borderColor:
          lecs.indexOf(e.code) < 0 ? "#0000003f" : "hsl(78,71%,46%,50%)",
        data: e.data.map(x => ({ t: new Date(x.date * 1000), y: x.sp }))
      }));
      var ctx = document.getElementById("history-canvas").getContext("2d");
      new Chart(ctx, {
        type: "line",
        data: this.res,
        options: {
          scales: {
            xAxes: [
              {
                type: "time",
                time: {
                  unit: "day"
                }
              }
            ]
          }
        }
      });
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