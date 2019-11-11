<template>
  <div class="processing">
    <div class="grid">
      <template v-for="c of 5">
        <div
          v-for="r in getGrids(c)"
          v-bind:key="`${c}-${r}`"
          class="block"
          :style="blockStyle(r, c)"
        >&nbsp;</div>
      </template>
    </div>
    <div class="content">
      <h1>Processing</h1>
      <p>{{tip}}</p>
      <template v-if="calculating">
        <p style="margin: 0;">{{numSolution}} solutions found</p>
        <el-button
          v-if="numSolution"
          type="warning"
          @click="calculating = false"
          style="margin: 10px;"
        >That's Enough, Stop!</el-button>
      </template>
      <el-button
        v-if="ready"
        type="primary"
        @click="$router.push({name: 'schedule'})"
      >View Schedule!</el-button>
      <el-button
        type="danger"
        @click="calculating = false;$router.push({name: 'planner'})"
        style="margin: 10px;"
      >Cancel</el-button>
    </div>
  </div>
</template>

<script>
import { mapState, mapMutations } from "vuex";

const minblock = 5;
const daystart = 8;
const dayend = 23;
const daymin = ((dayend - daystart) * 60) / minblock;
const totlen = daymin * minblock;
const arrlen = Math.ceil(totlen / 16);

const maxSolution = 999;
const sleepTime = 100;
const sleepDecay = 0.95;
const sleepMin = 0.05;
var sleepFactor = 1;

function sleep(ms) {
  const time = Math.round(ms * sleepFactor);
  sleepFactor *= sleepDecay;
  if (sleepFactor < sleepMin) sleepFactor = sleepMin;
  return new Promise(resolve => setTimeout(resolve, ms));
}

function daytime2num(day, timeString) {
  if (timeString.Format) timeString = timeString.Format("HH:mm");
  let dayNum = 0;
  if (day == "T") dayNum = 1;
  if (day == "W") dayNum = 2;
  if (day == "R") dayNum = 3;
  if (day == "F") dayNum = 4;
  const h = +timeString.substr(0, 2);
  const m = +timeString.substr(3, 2);

  return dayNum * daymin + ((h - daystart) * 60 + m) / minblock;
}

function getCoursePeriods(lec, sec) {
  const periods = [];

  const adder = tls => {
    for (let tl of tls.timeLocations) {
      const days = tl.days.replace(/\s*/g, "");
      const loc = `${tl.building} - ${tl.room}`;
      for (let d of days)
        periods.push([
          daytime2num(d, tl.beginTime),
          daytime2num(d, tl.endTime),
          loc
        ]);
    }
  };

  if (!lec.timeLocations.length) return [];
  adder(lec);
  if (!sec || !sec.timeLocations.length) return periods;
  adder(sec);
  return periods;
}

export default {
  name: "Processing",
  data() {
    return {
      ready: false,
      calculating: false,
      numSolution: 0,
      raw: null,
      chosen: [],
      timegrid: new Uint16Array(arrlen),
      colors: [
        "#fff1f0",
        "#f9f0ff",
        "#e6f7ff",
        "#fffbe6",
        "#f6ffed",
        "#fff7e6",
        "#fff0f6"
      ],
      color: "",
      tip: ""
    };
  },
  computed: {
    ...mapState([
      "quarter",
      "selected",
      "events",
      "limit",
      "results",
      "courseDetails",
      "checkedEnrollCode"
    ])
  },
  mounted() {
    this.process();
    this.color = this.colors[Math.floor(Math.random() * 7)];
  },
  methods: {
    getTime(a) {
      return this.timegrid[a >> 4] & (1 << (a & 0xf));
    },

    getTimeAnd(a, b) {
      for (var i = a; i < b; i++) if (this.getTime(i)) return true;
      return false;
    },

    fillTimeBlock(a, b, v) {
      for (var i = a; i < b; i++)
        if (v) this.timegrid[i >> 4] |= 1 << (i & 0xf);
        else this.timegrid[i >> 4] &= 0xffff - (1 << (i & 0xf));
    },

    getGrids(c) {
      const arr = [];
      var cont = false;
      for (var r = 0; r < 100; r++)
        if (this.getTime((c - 1) * daymin + Math.floor((daymin / 100) * r))) {
          if (!cont) {
            arr.push(r);
            cont = true;
          }
        } else cont = false;

      return arr;
    },

    blockStyle(r, c) {
      let x = r;
      while (this.getTime((c - 1) * daymin + Math.floor((daymin / 100) * x)))
        x++;

      let res = "";
      res += "top: " + r + "%;";
      res += "left: " + 20 * (c - 1) + "%;";
      res += "background-color: " + this.color + ";";
      res += "height: " + (x - r) + "%";
      return res;
    },

    ...mapMutations(["addResults", "clearResults", "setCourseDetail"]),

    process: async function() {
      this.tip = "Gathering Course Informations ...";
      await this.getCourseInfo();
      this.tip = "Solving The Ultimate Problem of the Universe ...";
      this.initialize();
      this.calculating = true;
      await this.dfs(0);
      this.calculating = false;
      if (this.numSolution) {
        this.tip = "Your Schedule is ready!";
        this.ready = true;
      } else {
        this.tip = "There is no solution to your input, please click Cancel";
      }
    },

    mapCourseDetail(data) {
      const detail = { data: {}, map: {}, rev: {}, s2c: {}, periods: {} };

      // course detail
      data.forEach(e => {
        const id = e.courseId.replace(/\s*/g, "");
        detail.s2c[id] = {};
        detail.data[id] = e;
        e.classSections = e.classSections.map(s => {
          detail.map[s.enrollCode] = s;
          detail.rev[s.enrollCode] = id;
          return s.enrollCode;
        });
      });

      // raw
      this.raw = {
        courses: [],
        events: [],
        break: this.limit.break / minblock,
        begin: daytime2num("", this.limit.timerange[0]),
        end: daytime2num("", this.limit.timerange[1])
      };

      // courses
      for (let id of this.selected) {
        const map = { list: [], data: {} };
        for (let code of detail.data[id].classSections) {
          const sec = detail.map[code];
          if (sec.section % 100 == 0) {
            map.list.push(+sec.section);
            map.data[+sec.section] = { code: code, sections: [] };
          } else {
            const lec = sec.section - (sec.section % 100);
            map.data[lec].sections.push(code);
          }
        }
        const course = [];
        for (let sect of map.list) {
          const lec = map.data[sect];
          const lecData = detail.map[lec.code];
          if (!lec.sections.length) {
            const p = getCoursePeriods(lecData, null);
            detail.periods[lec.code] = p;
            if (this.checkedEnrollCode.indexOf(lec.code) >= 0)
              course.push({ enrollCode: lec.code, periods: p });
          } else {
            detail.s2c[id][sect] = lec.code;
            lec.sections.forEach(sec => {
              const secData = detail.map[sec];
              const p = getCoursePeriods(lecData, secData);
              detail.periods[sec] = p;
              if (this.checkedEnrollCode.indexOf(sec) >= 0)
                course.push({ enrollCode: sec, periods: p });
            });
          }
        }
        this.raw.courses.push(course);
      }

      this.setCourseDetail(detail);

      // events
      this.raw.events = this.events.map(e => ({
        title: e.name,
        duration: e.duration / minblock,
        periods: e.days.map(d => e.timerange.map(r => daytime2num(d, r)))
      }));
    },

    getCourseInfo: async function() {
      let temp = null;
      try {
        const resp = await axios({
          method: "post",
          url: `/api/sche/getClassesByID?q=${this.quarter}`,
          data: this.selected.map(s => s.replace(/\s*/g, ""))
        });
        if (resp.data.length != this.selected.length)
          throw new Error("data length mismatch");
        this.mapCourseDetail(resp.data);
      } catch (error) {
        console.log(error);
        swal("ERROR", "Server Response Error", "error").then(() => {
          this.$router.push({ name: "planner" });
        });
      }
    },

    initialize: function() {
      this.chosen = [];
      this.clearResults();
      this.numSolution = 0;
    },

    dfs: async function(I) {
      if (!this.calculating) return;
      if (this.results.length > maxSolution) return; // prevent over calculate
      if (!this.raw.courses[I]) {
        // success for one solution
        this.numSolution++;
        this.addResults(this.chosen);
        await sleep(sleepTime);
        return;
      }
      for (let choice of this.raw.courses[I]) {
        // console.log(choice.title);
        if (!this.checkAdd(choice.periods)) continue;
        if (!this.checkEvents() || !this.checkLimit()) {
          this.erase(choice.periods);
          continue;
        }
        this.chosen.push(choice.enrollCode);
        await this.dfs(I + 1);
        this.erase(choice.periods);
        this.chosen.pop();
      }
      return;
    },

    checkAdd: function(periods) {
      for (let period of periods)
        if (this.getTimeAnd(period[0], period[1])) return false;

      for (let period of periods)
        this.fillTimeBlock(period[0], period[1], true);

      return true;
    },

    checkEvents: function() {
      for (let e of this.raw.events) {
        for (let p of e.periods) {
          let space = 0;
          for (let i = p[0]; i < p[1]; i++) {
            if (!this.getTime(i)) {
              if (++space >= e.duration) break;
            } else space = 0;
          }
          if (space < e.duration) return false;
        }
      }
      return true;
    },

    checkLimit: function() {
      let space = 0;
      for (let i = 0; i < totlen; i++) {
        let daytime = i % daymin;
        // check time range
        if (
          this.getTime(i) &&
          (daytime < this.raw.begin || daytime > this.raw.end)
        )
          return false;
        if (this.getTime(i)) {
          if (space > 0 && space < this.raw.break - 1) return false;
          space = 0;
        } else {
          space++;
        }
      }
      return true;
    },

    erase: function(periods) {
      for (let period of periods)
        this.fillTimeBlock(period[0], period[1], false);
    }
  }
};
</script>

<style scoped>
div.processing {
  width: 100%;
  height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #eee;
}

div.grid {
  opacity: 0.8;
  width: 100%;
  height: calc(100vh - 60px);
  position: absolute;
  bottom: 0;
  left: 0;
}

div.block {
  position: absolute;
  width: 20%;
}

div.content {
  position: relative;
  z-index: 100;
  width: 50%;
  height: 50%;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 15px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

h1 {
  color: #036;
  margin: 0;
}
</style>