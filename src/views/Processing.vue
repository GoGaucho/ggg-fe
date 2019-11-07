<template>
  <div class="processing">
    <div class="grid">
      <template v-for="c of 5">
        <div v-for="r of 100" v-if="timegrid[c*1440-960+Math.floor(7.8*r)]" class="block" :style="blockStyle(r, c)">&nbsp;</div>
      </template>
    </div>
    <div class="content">
      <h1>Processing</h1>
      <p>{{tip}}</p>
      <template v-if="calculating">
        <p style="margin: 0;">{{numSolution}} solutions found</p>
        <el-button v-if="numSolution"
          type="warning"
          @click="calculating = false"
          style="margin: 10px;"
        >That's Enough, Stop!</el-button>
      </template>
      <el-button v-if="ready"
        type="primary"
        @click="$router.push({name: 'schedule'})"
      >View Schedule!</el-button>
      <el-button 
        type="danger"
        @click="$router.push({name: 'planner'})"
        style="margin: 10px;"
      >Cancel</el-button>  
    </div>
  </div>
</template>

<script>
import { mapState, mapMutations } from 'vuex'

var courseDetails = [];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function daytime2num(day, timeString) {
  let dayNum = 1;
  if (day == 'M') dayNum = 1;
  if (day == 'T') dayNum = 2;
  if (day == 'W') dayNum = 3;
  if (day == 'R') dayNum = 4;
  if (day == 'F') dayNum = 5;
  return (dayNum - 1) * 1440 + Number(timeString.substr(0, 2) * 60) + Number(timeString.substr(3, 2));
}

function getCoursePeriods(lec, sec) {
  let periods = [];
  let days = [];
  if (!lec.timeLocations.length) return [];
  for (let tl of lec.timeLocations) {
    days = tl.days.replace(/\s*/g, "");
    for (let d of days) {
      let period = {
        location: tl.building + tl.room,
        range: [daytime2num(d, tl.beginTime), daytime2num(d, tl.endTime)],
      }
      periods.push(period);
    }
  }
  if (!sec || !sec.timeLocations.length) return periods;
  for (let tl of sec.timeLocations) {
    days = tl.days.replace(/\s*/g, "");
    for (let d of days) {
      let period = {
        location: tl.building + tl.room,
        range: [daytime2num(d, tl.beginTime), daytime2num(d, tl.endTime)],
      }
      periods.push(period);
    }
  }
  return periods;
}

export default {
  name: 'Processing',
  data() {
    return {
      ready: false,
      calculating: false,
      numSolution: 0,
      raw: null,
      chosen: [],
      timegrid: [],
      colors: ["#fff1f0", "#f9f0ff", "#e6f7ff", "#fffbe6", "#f6ffed", "#fff7e6", "#fff0f6"],
      color: '',
      tip: '',
    }
  },
  computed: {
    ...mapState(['quarter', 'selected', 'events', 'limit', 'results']),
  },
  mounted() {
    this.process();
    this.color = this.colors[Math.floor(Math.random()*7)];
  },
  methods: {
    blockStyle(r, c) {
      let res = "";
      res += "top: " + (r-1) + "%;";
      res += "left: " + 20*(c-1) + "%;";
      res += "background-color: " + this.color + ";";
      return res;
    },
    ...mapMutations(['addResults', 'clearResults']),
    process: async function() {
      this.tip = "Gathering Course Informations ...";
      await this.getCourseInfo();
      this.tip = "Wrapping Time Capsules ...";
      await this.getPeriods();
      this.tip = "Solving The Ultimate Problem of the Universe ...";
      this.initialize();
      this.calculating = true;
      await this.dfs(0);
      this.calculating = false;
      if (this.numSolution) {
        this.tip = "Your Schedule is ready!";
        this.ready = true;
      } else {
        this.tip = "There is no solution to your input, please click Cancel"
      }
    },
    getCourseInfo: async function() {
      courseDetails = [];
      for (let s of this.selected) {
        await axios // get course info
          .get("/api/sche/getClassByID", {params: {
            q: this.quarter,
            id: s.replace(/\s*/g, ""),
          }})
          .then((resp) => {
            courseDetails.push(resp.data);
          })
          .catch((error) => {
            swal("ERROR", "Server Response Error", "error")
              .then(() => {
                this.$router.push({name: 'planner'});
              });
          });
      }
    },
    getPeriods: async function() {
      this.raw = {
        courses: [],
        events: [],
        break: this.limit.break,
        begin: daytime2num('', this.limit.timerange[0].Format('HH:mm')),
        end: daytime2num('', this.limit.timerange[1].Format('HH:mm')),
      };
      for (let c of courseDetails) {
        let course = [];
        let title = c.courseId.replace(/\s*/g, "");
        let sectionMap = [];
        for (let s of c.classSections) {
          // here add skip conditions
          if (s.section % 100 == 0) {
            sectionMap[Number(s.section)] = {lecture: s, sections: []};
          } else if (sectionMap[s.section - s.section % 100]) {
            sectionMap[s.section - s.section % 100].sections.push(s);
          }
        }
        for (let s of c.classSections) {
          if (s.section % 100 != 0) continue;
          let l = sectionMap[Number(s.section)];
          // skip condition for lecture
          if (l.classClosed || l.courseCancelled) continue;
          if (l.enrolledTotal >= l.maxEnroll) continue;
          if (!l.sections.length) {
            course.push({
              title: title,
              space: l.lecture.maxEnroll - l.lecture.enrolledTotal,
              enrollCode: String(l.lecture.enrollCode),
              periods: getCoursePeriods(l.lecture, null)
            });
          }
          for (let ss of l.sections) {
            // skip condition for sections
            if (ss.classClosed || ss.courseCancelled) continue;
            if (ss.enrolledTotal >= ss.maxEnroll) continue;
            course.push({
              title: title, 
              space: Math.min(l.lecture.maxEnroll-l.lecture.enrolledTotal, ss.maxEnroll-ss.enrolledTotal),
              enrollCode: String(l.lecture.enrollCode) + ", " + String(ss.enrollCode),
              periods: getCoursePeriods(l.lecture, ss)
            });
          }
        }
        course.sort((a, b) => { return b.space - a.space; });
        this.raw.courses.push(course);
      }
      
      for (let e of this.events) {
        let eventPeriod = {
          title: e.name,
          duration: e.duration,
          periods: [],
        }
        let begin = e.timerange[0].Format("HH:mm");
        let end = e.timerange[1].Format("HH:mm");
        for (let d of e.days) {
          eventPeriod.periods.push({
            range: [daytime2num(d, begin), daytime2num(d, end)]
          })
        }
        this.raw.events.push(eventPeriod);
      }
    },
    initialize: function() {
      this.chosen = [];
      this.clearResults();
      this.numSolution = 0;
      for (let i = 0; i <= 7201; i++) {
        this.timegrid[i] = false;
      }
    },
    dfs: async function(I) {
      if (!this.calculating) return;
      if (Math.random() > 0.8) {
        await sleep(50);
        await this.$forceUpdate();
      }
      if (this.results.length > 999) return; // prevent over calculate
      if (!this.raw.courses[I]) { // success for one solution
        this.numSolution++;
        this.addResults(this.chosen);
        await sleep(200);
        return;
      }
      for (let choice of this.raw.courses[I]) {
        // console.log(choice.title);
        if (!this.checkAdd(choice.periods)) continue;
        if (!this.checkEvents() || !this.checkLimit()) {
          this.erase(choice.periods);
          continue;
        }
        this.chosen.push(choice);
        await this.dfs(I + 1);
        this.erase(choice.periods);
        this.chosen.splice(I, 1);
      }
      return;
    },
    checkAdd: function(periods) {
      for (let period of periods) {
        let begin = period.range[0];
        let end = period.range[1];
        for (let i = begin; i <= end; i++) {
          if (this.timegrid[i]) return false;
        }
      }
      for (let period of periods) {
        let begin = period.range[0];
        let end = period.range[1];
        for (let i = begin; i <= end; i++) {
          this.timegrid[i] = true;
        }
      }
      return true;
    },
    checkEvents: function() {
      for (let e of this.raw.events) {
        for (let p of e.periods) {
          let space = 0;
          for (let i = p.range[0]; i <= p.range[1]; i++) {
            if (!this.timegrid[i]) {
              space++;
              if (space >= e.duration) break;
            } else space = 0;
          }
          if (space >= e.duration) continue;
          else return false;
        }
      }
      return true;
    },
    checkLimit: function() {
      let space = 0
      for (let i = 0; i <= 7200; i++) {
        let daytime = i % 1440;
        // check time range
        if (this.timegrid[i] && (daytime < this.raw.begin || daytime > this.raw.end)) 
          return false;
        if (this.timegrid[i]) {
          if (space > 0 && space < this.raw.break - 1) return false;
          space = 0;
        } else {
          space ++;
        }
      }
      return true;
    },
    erase: function(periods) {
      for (let period of periods) {
        let begin = period.range[0];
        let end = period.range[1];
        for (let i = begin; i <= end; i++) {
          this.timegrid[i] = false;
        }
      }
    }
  }
}
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
  height: 1%;
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