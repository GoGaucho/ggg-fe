<template>
  <div class="schedule">
    <div class="header">
      <div class="row">
        <h1>Weekly View</h1>
        <el-button @click="$router.push({name: 'planner'})">Back</el-button>
      </div>
      <div class="row">
        <p v-if="dispersed" style="margin-right: 10px;">group results for: {{dispersed.title}}</p>
        <el-button-group style="margin-right: 10px;">
          <el-button @click="choose(Number(I)-1)" size="small" icon="el-icon-arrow-left"></el-button>
          <el-button @click="choose(Number(I)+1)" size="small" icon="el-icon-arrow-right"></el-button>
        </el-button-group>
        <el-select filterable @change="choose" v-model="I">
          <el-option v-for="o in options" :value="o.key" :label="o.label" v-bind:key="o.key" />
        </el-select>
      </div>
    </div>
    <div class="table">
      <div v-for="d in dayNums" :style="headerStyle(d)" class="card" v-bind:key="d">{{days[d]}}</div>
      <template v-for="c in getPeriods(result)">
        <el-tooltip v-bind:key="c.key" effect="light">
          <div class="tooltip" slot="content">
            {{c.c.title}}
            <br />
            EnrollCode: {{c.c.enrollCode}}
            <br />
            {{range2time(c.p.range)}}
            <br />
            {{c.p.location}}
            <br />
          </div>
          <div class="card" :style="cardStyle(c.c.title, c.p.range)" @click="disperse(c.c)">
            {{c.c.title}}
            <br />
            {{range2time(c.p.range)}}
            <br />
            {{c.c.location}}
          </div>
        </el-tooltip>
      </template>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "Schedule",
  data() {
    return {
      I: "0",
      options: [],
      processedResults: null,
      dispersed: null,
      result: [],
      dayNums: [1, 2, 3, 4, 5],
      days: ["", "Mon", "Tue", "Wed", "Thr", "Fri"],
      colors: [
        "#fff1f0",
        "#f9f0ff",
        "#e6f7ff",
        "#fffbe6",
        "#f6ffed",
        "#fff7e6",
        "#fff0f6"
      ],
      dispersedColor: "#ffffff",
      colorMap: []
    };
  },
  mounted() {
    this.setList();
  },
  computed: {
    ...mapState(["results"])
  },
  methods: {
    setList() {
      if (this.processedResults == null) this.processedResults = this.results;
      this.options = [];
      for (let i in this.processedResults) {
        this.options.push({
          label: `Result ${+i + 1} / ${this.processedResults.length}`,
          key: i
        });
      }
      this.choose(0);
      this.addColor();
    },

    choose: function(I) {
      if (!this.processedResults[I]) return;
      this.I = String(I);
      this.result = this.processedResults[I];
      this.$forceUpdate();
    },

    disperse: function(c) {
      if (this.dispersed == c) {
        this.dispersed = null;
        this.processedResults = this.results;
        this.setList();
        return;
      }
      this.dispersed = c;
      const map = new Map();
      const ans = [];
      this.results.forEach(r => {
        let k = null;
        const key = r
          .filter(cx => (cx.title != c.title ? true : !(k = cx)))
          .map(cx => cx.enrollCode)
          .sort();
        if (!map[key]) ans.push((map[key] = [...r]));
        map[key].push(k);
      });
      this.processedResults = ans;
      this.setList();
    },

    getPeriods(r) {
      const s = { set: new Set(), list: [] };
      const count = {};
      r.forEach(e => {
        e.periods.forEach(p => {
          if (!s.set.has(p.range.toString())) {
            s.set.add(p.range.toString());
            if (!count[e.title]) count[e.title] = 0;
            count[e.title]++;
            s.list.push({ c: e, p: p, key: `${e.title}-${count[e.title]}` });
          }
        });
      });
      return s.list;
    },

    addColor: function() {
      let cot = 0;
      for (let c of this.result) {
        this.colorMap[c.title] =
          this.dispersed && c.title == this.dispersed.title
            ? this.dispersedColor
            : this.colors[cot];
        cot++;
      }
      this.$forceUpdate();
    },

    headerStyle: function(dayNum) {
      let res = "";
      res += "height: 15px;";
      res += "top: -15px;";
      res += "left: " + 20 * (dayNum - 1) + "%;";
      return res;
    },

    cardStyle: function(title, range) {
      let res = "";
      let day = Math.floor(range[0] / 1440) + 1;
      let begin = range[0] % 1440;
      let end = range[1] % 1440;
      res += "height: " + 0.119 * (end - begin) + "%;";
      res += "top: " + 0.119 * (begin - 420) + "%;";
      res += "left: " + 20 * (day - 1) + "%;";
      res += "background-color: " + this.colorMap[title] + ";";
      return res;
    },

    range2time: function(range) {
      let res = "";
      let timenum = range[0];
      timenum %= 1440;
      let hour = Math.floor(timenum / 60);
      let min = timenum % 60;
      if (hour < 10) hour = "0" + String(hour);
      if (min < 10) min = "0" + String(min);
      res += hour + ":" + min;
      timenum = range[1] % 1440;
      res += " - ";
      hour = Math.floor(timenum / 60);
      min = timenum % 60;
      if (hour < 10) hour = "0" + String(hour);
      if (min < 10) min = "0" + String(min);
      res += hour + ":" + min;
      return res;
    }
  }
};
</script>

<style scoped>
div.schedule {
  width: 100%;
  height: calc(100vh - 60px);
  background-color: #eee;

  display: flex;
  flex-direction: column;
  align-items: center;
}
div.header {
  width: 90%;
  padding: 0 5%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 80px;
}
div.row {
  display: flex;
  height: 100%;
  align-items: center;
}
div.table {
  position: relative;
  margin: 15px auto 0;
  width: 90%;
  height: calc(100vh - 160px);
}

div.card {
  position: absolute;
  width: 18%;

  border-radius: 5px;
  font-size: 0.7rem;

  box-shadow: 1px 1px 2px #999;
  background-color: #fff;
  transition: all 0.3s ease;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

strong {
  color: #036;
}

h1,
h3,
h5 {
  color: #036;
  margin: 0 10px;
}
</style>