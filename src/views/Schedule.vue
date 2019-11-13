<template>
  <div class="schedule">
    <div class="header">
      <div class="row">
        <h1>Weekly View</h1>
        <el-button @click="$router.push({name: 'planner'})">Back</el-button>
      </div>
      <div class="row">
        <p v-if="dispersed" style="margin-right: 10px;">group results for: {{dispersed}}</p>
        <el-button-group style="margin-right: 10px;">
          <el-button @click="choose(+I-1)" size="small" icon="el-icon-arrow-left"></el-button>
          <el-button @click="choose(+I+1)" size="small" icon="el-icon-arrow-right"></el-button>
        </el-button-group>
        <el-select filterable @change="choose" v-model="I">
          <el-option v-for="o in options" :value="o.key" :label="o.label" v-bind:key="o.key" />
        </el-select>
      </div>
    </div>
    <div class="table">
      <div v-for="d in dayNums" :style="headerStyle(d)" class="card" v-bind:key="d">{{days[d]}}</div>
      <template v-for="c in getPeriods(result)">
        <el-tooltip v-bind:key="c.key" effect="light" :open-delay="300">
          <div class="tooltip" slot="content">
            <p v-for="tool in getToolTip(c)" v-bind:key="c.key+'-'+tool">{{tool}}</p>
          </div>
          <div class="card" :style="cardStyle(c.id, c.p)" @click="disperse(c.id)">
            {{c.id + c.code}}
            <br />
            {{range2time(c.p)}}
            <br />
            {{c.p[2]}}
          </div>
        </el-tooltip>
      </template>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";

const minblock = 5;
const daystart = 8;
const dayend = 23;
const daymin = ((dayend - daystart) * 60) / minblock;
const totlen = daymin * minblock;

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
    ...mapState(["quarter", "results", "selected", "courseDetails"])
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
      const map = {};
      const ans = [];
      this.results.forEach(r => {
        let k = null;
        const key = r
          .filter(cx => (this.code2id(cx) != c ? true : !(k = cx)))
          .sort();
        if (!map[key]) ans.push((map[key] = [...r]));
        if (map[key].indexOf(k) < 0) map[key].push(k);
      });
      this.processedResults = ans;
      this.setList();
    },

    getPeriods(r) {
      const s = { set: {}, list: [] };
      const count = {};
      r.forEach(e => {
        const kl = [];
        const id = this.courseDetails.rev[e];
        this.courseDetails.periods[e].forEach(p => {
          const key = `${p[0]}-${p[1]}`;
          if (!s.set[key]) {
            kl.push(key);
            if (!count[id]) count[id] = 0;
            count[id]++;
            const dat = { id: id, p: p, cs: [e], key: `${id}-${count[id]}` };
            s.set[key] = dat;
            s.list.push(dat);
          } else {
            s.set[key].cs.push(e);
            s.set[key].p = [s.set[key].p[0], s.set[key].p[1]];
          }
        });
      });
      s.list.forEach(e => {
        e.code = e.cs.length > 1 ? ` (${e.cs.length} code)` : " - " + e.cs[0];
      });

      return s.list;
    },

    getToolTip(c) {
      let ans = [c.id + c.code, this.range2time(c.p), c.p[2]];
      try {
        if (c.cs.length > 1) return ans;
        const sec = this.courseDetails.map[c.cs[0]];
        const ins = sec.instructors.map(e => e.instructor);
        if (ins.length <= 1)
          ans.push("Instructor: " + (ins[0] ? ins[0] : "T.B.A"));
        else {
          ans.push("Instructors: ");
          ans = ans.concat(ins);
        }
      } catch (e) {
        console.log(e);
        return ans;
      }
      return ans;
    },

    addColor: function() {
      let cot = 0;
      for (let c of this.result) {
        this.colorMap[this.code2id(c)] =
          this.dispersed && this.code2id(c) == this.dispersed
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
      res += "height: " + (100 / (1440 - 480)) * (end - begin) + "%;";
      res += "top: " + (10 + (100 / (1440 - 480)) * (begin - 480)) + "%;";
      res += "left: " + 20 * (day - 1) + "%;";
      res += "background-color: " + this.colorMap[title] + ";";
      return res;
    },

    range2time: function(range) {
      const mapper = t => {
        const timenum = t % 1440;
        let hour = Math.floor(timenum / 60);
        let min = timenum % 60;
        if (hour < 10) hour = `0${hour}`;
        if (min < 10) min = `0${min}`;
        return `${hour}:${min}`;
      };
      return `${mapper(range[0])} - ${mapper(range[1])}`;
    },

    code2id(code) {
      return this.courseDetails.rev[code];
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