<template>
  <div class="processing">
    <div class="grid">
      <div
        v-for="r in getGrids()"
        v-bind:key="r.toString()"
        class="block"
        :style="blockStyle(r)"
      >&nbsp;</div>
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
import { timeout } from "q";

const maxSolution = 9999;
const pauseItv = 50;
const delay = 10;

let skipper = 10;
let lastTime = 0;

let timegrid = null;
let timeset = [0, 7200];

function getTime(a) {
  return timegrid[a >> 4] & (1 << (a & 0xf));
}

function getTimeAnd(ps) {
  for (let p of ps)
    for (var i = p[0]; i < p[1]; i++) if (getTime(i)) return true;
  return false;
}

function fillTimeBlock(ps, v) {
  for (let p of ps)
    for (var i = p[0]; i < p[1]; i++)
      if (v) timegrid[i >> 4] |= 1 << (i & 0xf);
      else timegrid[i >> 4] &= 0xffff - (1 << (i & 0xf));
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
  const ans = (dayNum * 24 + h) * 60 + m;
  if (timeset.indexOf(ans) < 0) timeset.push(ans);
  return ans;
}

function getCoursePeriods(lec, sec) {
  const periods = [];
  const adder = tls => {
    for (let tl of tls.timeLocations) {
      if (tl.days == null) continue;
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
    getGrids() {
      if (!timegrid) return [];
      const arr = [];
      var temp = [];
      var cont = false;
      for (var r = 0; r < timeset.length - 1; r++)
        if (getTime(r)) {
          if (!cont) {
            temp = r;
            cont = true;
          }
        } else {
          arr.push([temp, r]);
          cont = false;
        }
      return arr;
    },

    blockStyle(r) {
      const day = Math.floor(timeset[r[0]] / 1440);
      const t0 = timeset[r[0]] % 1440;
      const tw = timeset[r[1]] - timeset[r[0]];
      let res = "";
      res += "top: " + ((t0 - 480) * 100) / (1440 - 480) + "%;";
      res += "left: " + 20 * (day - 1) + "%;";
      res += "background-color: " + this.color + ";";
      res += "height: " + (tw * 100) / (1440 - 480) + "%";
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
        break: this.limit.break,
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
            const ps = getCoursePeriods(lecData, null);
            detail.periods[lec.code] = ps;
            if (this.checkedEnrollCode.indexOf(lec.code) >= 0) {
              const px = ps.map(e => [e[0], e[1]]);
              course.push({ enrollCode: lec.code, periods: px });
            }
          } else {
            detail.s2c[id][sect] = lec.code;
            lec.sections.forEach(sec => {
              const secData = detail.map[sec];
              const ps = getCoursePeriods(lecData, secData);
              detail.periods[sec] = ps;
              if (this.checkedEnrollCode.indexOf(sec) >= 0) {
                const px = ps.map(e => [e[0], e[1]]);
                course.push({ enrollCode: sec, periods: px });
              }
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
      timeset.sort((a, b) => a - b);
      timegrid = new Uint16Array((timeset.length >> 4) + 1);
      for (let c of this.raw.courses)
        for (let s of c)
          for (let p of s.periods)
            for (let i in p) p[i] = timeset.indexOf(p[i]);
    },

    dfs: async function(I) {
      if (!this.calculating) return;
      if (this.results.length > maxSolution) return; // prevent over calculate
      if (!this.raw.courses[I]) {
        // success for one solution
        this.numSolution++;
        this.addResults(this.chosen);
        return;
      }

      {
        const time = +new Date();
        if (time - lastTime >= pauseItv) {
          await new Promise(res => setTimeout(res, delay));
          this.$forceUpdate();
          lastTime = +new Date();
        }
      }

      for (let choice of this.raw.courses[I]) {
        if (getTimeAnd(choice.periods)) continue;
        if (!this.checkLimit(choice.periods)) continue;
        fillTimeBlock(choice.periods, true);
        if (!this.checkEvents(choice.periods)) {
          fillTimeBlock(choice.periods, false);
          continue;
        }
        this.chosen.push(choice.enrollCode);
        await this.dfs(I + 1);
        fillTimeBlock(choice.periods, false);
        this.chosen.pop();
      }
      return;
    },

    checkEvents: function(cps) {
      for (let cp of cps)
        for (let e of this.raw.events) {
          for (let p of e.periods) {
            let space = 0;
            if (cp[0] >= p[1] || cp[1] <= p[0]) continue;
            for (let i = p[0]; i < p[1]; i++) {
              if (!getTime(i)) {
                space += timeset[i + 1] - timeset[i];
                if (space >= e.duration) break;
              } else space = 0;
            }
            if (space < e.duration) return false;
          }
        }
      return true;
    },

    checkLimit: function(cps) {
      for (let p of cps) {
        const p0 = timeset[p[0]] % 1440;
        const p1 = timeset[p[1]] % 1440;
        if (p0 < this.raw.begin || p1 > this.raw.end) return false;
        let space = 0;
        let i = 0;
        while (space < this.raw.break) {
          i++;
          if (getTime(p[0] - i)) return false;
          space += timeset[p[0] - i + 1] - timeset[p[0] - i];
        }
        space = 0;
        i = 0;
        while (space < this.raw.break) {
          if (getTime(p[1] + i)) return false;
          space += timeset[p[1] + i + 1] - timeset[p[1] + i];
          i++;
        }
      }
      return true;
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