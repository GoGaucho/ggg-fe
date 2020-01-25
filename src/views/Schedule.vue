<template>
  <div class="schedule">
    <div class="header">
      <div class="row">
        <h1>Weekly View</h1>
        <el-button @click="$router.push({name: 'planner'})">Back</el-button>&nbsp;
        <el-button @click="$router.push({name: 'addmore'})">Add One More Course</el-button>&nbsp;
        <div v-if="quarter.charAt(4)=='3'">
          <el-checkbox-group v-model="seleSession" @change="setSession()">
            <el-checkbox-button label="1-3"></el-checkbox-button>
            <el-checkbox-button label="4-6"></el-checkbox-button>
            <el-checkbox-button label="7-9"></el-checkbox-button>
            <el-checkbox-button label="10-12"></el-checkbox-button>
          </el-checkbox-group>
        </div>
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
      <template v-bind="days">
        <div v-for="d in dayNums" :style="headerStyle(d)" class="card" v-bind:key="d">{{days[d]}}</div>
      </template>
      <template v-for="c in getPeriods(result)">
        <el-tooltip v-bind:key="c.key" effect="light" :open-delay="300">
          <div class="tooltip" slot="content">
            <p v-for="tool in getToolTip(c)" v-bind:key="c.key+'-'+tool">{{tool}}</p>
          </div>
          <div class="card" :style="cardStyle(c.id, c.p)" @click="disperse(c.id)">
            <template v-if="seleSession.length<2">
              <div class="cardrow">
                <div class="incard cardl">{{c.id + c.code}}</div>
                <div class="incard cardr">{{range2time(c.p)}}</div>
              </div>
              <div class="cardrow">
                <div class="incard cardl">{{c.p[2]}}</div>
                <div class="incard cardr">{{c.ins}}</div>
              </div>
            </template>
            <template v-if="seleSession.length>=2">
              <div>{{c.id + c.code}}</div>
            </template>
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
      oldI: "0",
      options: [],
      processedResults: null,
      dispersed: null,
      result: [],
      dayNums: [0, 1, 2, 3, 4],
      days: ["Mon", "Tue", "Wed", "Thr", "Fri"],
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
      colorMap: [],
      seleSession: ["1-3", "4-6", "7-9", "10-12"]
    };
  },
  mounted() {
    this.setList();
  },
  computed: {
    ...mapState(["quarter", "results", "selected", "courseDetails"])
  },
  methods: {
    setList(I = 0) {
      if (this.processedResults == null) this.processedResults = this.results;
      this.options = [];
      for (let i in this.processedResults) {
        this.options.push({
          label: `Result ${+i + 1} / ${this.processedResults.length}`,
          key: i
        });
      }
      this.choose(I);
      this.addColor();
    },

    choose: function(I) {
      if (!this.processedResults[I]) return;
      this.I = String(I);
      this.result = this.processedResults[I];
      this.$forceUpdate();
    },

    setSession: function(i) {
      this.seleSession.sort((a, b) =>
        a.length < b.length
          ? -1
          : a.length > b.length
          ? 1
          : a.charAt(0) - b.charAt(0)
      );
      if (this.seleSession.length > 1) this.days = [...this.seleSession];
      else this.days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
      this.dayNums = [];
      for (var i = 0; i < this.days.length; i++) this.dayNums.push(i);
    },

    disperse: function(c) {
      if (this.dispersed == null) this.oldI = this.I;
      if (this.dispersed == c) {
        this.dispersed = null;
        this.processedResults = this.results;
        this.setList(this.oldI);
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

      const contains = r => {
        for (let e of this.result) if (r.indexOf(e) < 0) return false;
        return true;
      };

      let temp = null;
      for (let r in ans)
        if (contains(ans[r])) {
          temp = r;
          break;
        }

      this.processedResults = ans;
      this.setList(+temp);
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
            const dat = {
              id: id,
              p: p,
              cs: [e],
              key: `${id}-${count[id]}`
            };
            s.set[key] = dat;
            s.list.push(dat);
          } else {
            s.set[key].cs.push(e);
            s.set[key].p = [s.set[key].p[0], s.set[key].p[1]];
          }
        });
      });
      s.list.forEach(e => {
        e.code = e.cs.length > 1 ? ` (${e.cs.length})` : "";
        if (e.cs.length == 1) {
          const insts = this.courseDetails.map[e.cs[0]].instructors;
          e.ins =
            insts.length == 0
              ? "Prof: T.B.A"
              : insts.length == 1
              ? insts[0].instructor
              : "(Multiple Profs)";
        }
      });

      return s.list;
    },

    getToolTip(c) {
      let ans = [];

      if (this.seleSession.length > 1) {
        const lect = c.id;
        ans.push(`Course: ${c.id + c.code}`);
        ans.push(`Time: ${this.range2time(c.p)}`);
        ans.push(`Location: ${c.p[2]}`);
      }

      const getSpace = (e, sec = this.courseDetails.map[e]) =>
        sec.maxEnroll - sec.enrolledTotal;

      if (c.cs.length == 1) {
        ans.push(`EnrollCode: ${c.cs[0]}`);
        ans.push(`Space: ${getSpace(c.cs[0])}`);
      } else {
        ans.push("EnrollCode and Space:");
        c.cs.forEach(e => ans.push(`${e} : ${getSpace(e)}`));
      }
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
      res += "left: " + ((100 / this.days.length) * dayNum - 1) + "%;";
      res += "width: " + (100 / this.days.length - 2) + "%;";
      return res;
    },

    cardStyle: function(title, range) {
      let res = "";
      let sess = this.seleSession;
      let tots = Math.max(1, sess.length);
      let session = Math.floor(range[0] / 1440 / 5);
      let sesStr = session * 3 + 1 + "-" + (session * 3 + 3);
      let sesInd = sess.indexOf(sesStr);
      let day = (Math.floor(range[0] / 1440) % 5) + 1;
      let begin = range[0] % 1440;
      let end = range[1] % 1440;
      let disp = this.quarter.charAt(4) != "3" || sesInd >= 0;
      res += "height: " + (100 / (1440 - 480)) * (end - begin) + "%;";
      res += "top: " + (10 + (100 / (1440 - 480)) * (begin - 480)) + "%;";
      res += "display: " + (disp ? "flex;" : "none;");
      res += "background-color: " + this.colorMap[title] + ";";
      if (tots == 1) {
        res += "border-radius: 5px;";
        res += "width: 18%;";
        res += "left: " + 20 * (day - 1) + "%;";
        res += "transition: all 0.3s ease;";
      } else {
        const wid = 20 / tots;
        res += "border-radius: 0px;";
        res += "width: " + 19 / tots + "%;";
        res += "left: " + (wid * (day - 1) + wid * 5 * sesInd) + "%;";
      }
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

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
div.cardrow {
  display: flex;
  width: 100%;
}
div.incard {
  width: 50%;
}

div.cardl {
  left: 0%;
}

div.cardr {
  left: 50%;
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