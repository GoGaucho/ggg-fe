<template>
  <div class="processing">
    <h1>Processing</h1>
    <p>{{tip}}</p>
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
</template>

<script>
import { mapState, mapMutations } from 'vuex'

var courseDetails = [];

function daytime2num(day, timeString) {
  let dayNum = 0;
  if (day == 'M') dayNum = 1;
  if (day == 'T') dayNum = 2;
  if (day == 'W') dayNum = 3;
  if (day == 'R') dayNum = 4;
  if (day == 'F') dayNum = 5;
  return dayNum * 1440 + Number(timeString.substr(0, 2) * 60) + Number(timeString.substr(3, 2));
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
      gotSolution: false,
      raw: null,
      chosen: [],
      timegrid: [],
      tip: '',
    }
  },
  computed: {
    ...mapState(['quarter', 'selected', 'events', 'limit', 'results']),
  },
  mounted() {
    this.process();
  },
  methods: {
    ...mapMutations(['addResults', 'clearResults']),
    process: async function() {
      this.tip = "Gathering Course Informations ...";
      await this.getCourseInfo();
      this.tip = "Wrapping Time Capsules ...";
      await this.getPeriods();
      this.tip = "Solving The Ultimate Problem of the Universe ...";
      this.initialize();
      this.dfs(0);
      if (this.gotSolution) {
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
      this.gotSolution = false;
      for (let i = 0; i <= 7201; i++) {
        this.timegrid[i] = false;
      }
    },
    dfs: function(I) {
      if (this.results.length > 20) return; // prevent over calculate
      if (!this.raw.courses[I]) { // success for one solution
        this.gotSolution = true;
        this.addResults(this.chosen);
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
        this.dfs(I + 1);
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
  justify-content: center;
  align-items: center;

  background-color: #eee;
}

h1 {
  color: #036;
  margin: 0;
}
</style>