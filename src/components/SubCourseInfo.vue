<template>
  <div class="sub-course-info">
    <el-collapse v-if="codes.length">
      <el-collapse-item title="Enroll History">
        <HistoryChart ref="hist" :quarter="quarter" :id="id" :codes="codes" :disables="disables" />
      </el-collapse-item>
    </el-collapse>
    <template v-if="ress">
      <div v-for="res in ress" v-bind:key="res.ses">
        <h3 v-if="res.ses.length">Session {{res.ses}}</h3>
        <TimeTable v-bind:res="res.res" @click-row="clickrow" @click-exp="clickexp" />
      </div>
    </template>
  </div>
</template>

<script>
import { mapState, mapMutations } from "vuex";
import TimeTable from "@/components/TimeTable.vue";
import HistoryChart from "@/components/HistoryChart.vue";

export default {
  name: "SubCourseInfo",
  components: {
    TimeTable,
    HistoryChart
  },
  props: ["quarter", "course", "id", "allowed"],
  data() {
    return {
      loading: false,
      ress: [],
      codes: [],
      disables: [],
      rate: {}
    };
  },
  mounted() {
    this.getData();
  },
  methods: {
    getData() {
      const c = this.course;
      let ress = [];
      let res = [];
      let ses = "";
      c.classSections.sort((a, b) => {
        if (a.session && b.session)
          if (a.session < b.session) return -1;
          else if (a.session > b.session) return 1;
        if (a.section < b.section) return -1;
        if (a.section > b.section) return 1;
        return 0;
      });
      for (let i in c.classSections) {
        let s = c.classSections[i];
        if (s.session) {
          if (ses == "") ses = s.session.charAt(5);
          else if (ses != s.session.charAt(5)) {
            ress.push({ ses: ses, res: res });
            res = [];
            ses = s.session.charAt(5);
          }
        }
        let ss = {};
        ss.enrollCode = s.enrollCode;
        ss.disabled = s.courseCancelled || s.classClosed;
        if (ss.disabled) this.disables.push(ss.enrollCode);
        ss.max = s.maxEnroll;
        ss.space = s.maxEnroll - s.enrolledTotal;

        for (let i in s.instructors) {
          if (i == 0) ss.instructor = "";
          else ss.instructor += "\n";
          ss.instructor += s.instructors[i].instructor;
        }

        if (!s.timeLocations[0]) {
          // process time/location
          ss.days = "T.B.A.";
          ss.time = "T.B.A.";
          ss.location = "T.B.A.";
        } else {
          for (let j in s.timeLocations) {
            let tl = s.timeLocations[j];
            if (j == 0) {
              ss.days = "";
              ss.time = "";
              ss.location = "";
            } else {
              ss.days += "\n";
              ss.time += "\n";
              ss.location += "\n";
            }
            ss.days += tl.days;
            ss.time += tl.beginTime + " - " + tl.endTime;
            ss.location += tl.building + " " + tl.room;
          }
          ss.days = ss.days.replace(/null/g, "T.B.A.");
          ss.time = ss.time.replace(/null/g, "T.B.A.");
          ss.location = ss.location.replace(/null/g, "T.B.A.");
        }

        if (s.section % 100 == 0) {
          // process lecture/section
          ss.children = [];
          ss.status = "lecture";
          ss.rate = "loading...";
          res.push(ss);
        } else {
          ss.status = "section";
          res[res.length - 1].children.push(ss);
        }
      }
      if (res.length > 0) ress.push({ ses: ses, res: res });

      if (this.allowed) {
        for (var ires of ress) {
          for (var lec of ires.res) {
            let disa = !this.allowed.includes(lec.enrollCode);
            for (var sec of lec.children) {
              sec.conflict = sec.disabled = !this.allowed.includes(
                sec.enrollCode
              );
              disa &= sec.conflict;
            }
            lec.conflict = lec.disabled = disa;
          }
        }
      }

      this.ress = ress;
      this.codes = ress
        .map(res =>
          res.res.map(e => [e.enrollCode, e.children.map(x => x.enrollCode)])
        )
        .flat();
      this.getProfRatings();
    },

    getProfRatings: async function() {
      const rater = (lec, rs) => {
        rs = rs.filter(r => r.rate || r.diff);
        if (!rs || rs.length == 0) {
          lec.rate = "not found";
          return;
        }
        if (rs.length > 1) {
          lec.rate = "multiple...";
          rs.forEach(r => {
            if (!r.rate) r.rate = "X";
            if (!r.diff) r.diff = "X";
          });
          lec.rateToolTip = {
            data: rs,
            msg: "Multiple profs with this name found"
          };
          return;
        }
        const r = rs[0];
        const rr = r.rate ? r.rate : "X";
        const rd = r.diff ? r.diff : "X";
        lec.rate = `${rr}/${rd}`;
        lec.rateToolTip = {
          msg: `Name: ${r.name}, Deptartment: ${r.dept}`,
          link: r.rmpid
        };
      };
      for (let res of this.ress) {
        for (let lec of res.res) {
          if (lec.instructor && lec.instructor != "T.B.A") {
            if (this.rate[lec.instructor] === undefined) {
              let resp = null;
              try {
                resp = await axios({
                  method: "get",
                  url: `/api/rmp?prof=${lec.instructor}`
                });
              } catch (error) {
                console.log(error);
              }
              if (resp) {
                const r = resp.data;
                this.rate[lec.instructor] = r ? r : null;
                rater(lec, r);
              }
            } else rater(lec, this.rate[lec.instructor]);
          } else lec.rate = "";
        }
      }
    },

    clickrow(row) {
      this.$refs.hist.showOnly(row.enrollCode);
    },

    clickexp(row, expanded) {
      this.$refs.hist.expand(
        row.enrollCode,
        row.children.map(e => e.enrollCode),
        expanded
      );
    }
  }
};
</script>

<style scoped>
div.sub-course-info {
  width: 100%;
}
</style>