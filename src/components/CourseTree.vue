<template>
  <div class="course-tree">
    <div v-if="loading">Loading...</div>
    <el-table
      :data="res"
      v-if="res.length"
      style="width: 100%;"
      row-key="enrollCode"
      :row-class-name="tableRowClassName"
    >
      <el-table-column prop="enrollCode" label="EnrollCode" width="120" align="center" />
      <el-table-column prop="instructor" label="Instructor" align="center" />
      <el-table-column prop="days" label="Days" width="70" align="center" />
      <el-table-column prop="time" label="Time" width="110" align="center" />
      <el-table-column prop="location" label="Location" align="center" />
      <el-table-column prop="space" label="Space" width="65" align="center" />
      <el-table-column prop="max" label="Max" width="50" align="center" />
    </el-table>
  </div>
</template>

<script>
import { mapState, mapMutations } from "vuex";

// real status: priortized, normal, deleted
// detail status: 10: selected, 11: lo-selected, 0: normal, 21:deprecated, 22:lo-deleted, 23:hi-deleted, 20:deleted

// select status: none = 0, selected = 1, removed = 2
// side status: none = 0, deprecated = 1
// lower status: none = 0, recommended = 1, as-removed = 2
// upper status: none = 0, sup-removed = 1
// action: select / deselect = 0, remove / de-remove = 1
// 0: none + select = selected
// 1: selected + deselect = none
// 2: removed + select = selected
// 3: none + remove = removed
// 4: selected + remove = removed
// 5: remove + de-remove = none

export default {
  name: "CourseTree",
  components: {},
  data() {
    return {
      loading: false,
      courses: [],
      res: []
    };
  },
  computed: {
    ...mapState(["selected", "quarter"])
  },
  mounted() {
    this.getCourseInfo();
  },
  methods: {
    ...mapMutations(["addSelected", "setCourse"]),

    getCourseInfo: async function() {
      this.loading = true;
      await axios({
        method: "post",
        url: `/api/sche/getClassesByID?q=${this.quarter}`,
        data: this.selected.map(s => s.replace(/\s*/g, ""))
      })
        .then(resp => {
          this.courses = resp.data;
          this.getData();
          this.loading = false;
        })
        .catch(error => {
          this.loading = false;
          swal("ERROR", "Server Response Error", "error").then(() => {
            this.$router.push({ name: "planner" });
          });
        });
    },

    getData: function() {
      const list = [];
      for (let c of this.courses) {
        let res = [];
        for (let i in c.classSections) {
          let s = c.classSections[i];
          let ss = {
            select: {
              status: 0,
              deprecated: 0,
              selebtn: 0,
              delbtn: 0,
              suppressed: 0,
              lower: 0
            }
          };
          ss.enrollCode = s.enrollCode;
          ss.disabled = s.courseCancelled || s.classClosed;
          ss.max = s.maxEnroll;
          ss.space = s.maxEnroll - s.enrolledTotal;
          if (ss.space <= 0 || ss.disabled) ss.select.status = 2;

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
            res.push(ss);
          } else {
            ss.status = "section";
            res[res.length - 1].children.push(ss);
          }
        }
        list.push({
          status: "course",
          enrollCode: c.courseId,
          title: c.title,
          children: res
        });
      }
      this.res = list;
    },

    setLectureStatus(c, lec, act) {
      toggleStatus(lec.select, act);
      suppressStatus(lec);
      refreshLectures(c);
    },

    setSectionStatus(c, lec, sec, act) {
      toggleStatus(sec.select, act);
      refreshSections(c, lec);
    },

    suppressStatus(lec) {
      lec.children.forEach(e => {
        e.select.suppressed = lec.select.status == 2 ? 1 : 0;
        e.select.selebtn =
          lec.select.status == 2 ? 2 : e.select.status == 1 ? 1 : 0;
        e.select.delbtn =
          lec.select.status == 2 ? 2 : e.select.status == 2 ? 1 : 0;
      });
    },

    refreshSections(c, lec) {
      const csele = lec.children.reduce(
        (c, s) => (s.select.status == 1 ? c + 1 : c),
        0
      );

      const crem = lec.children.reduce(
        (c, s) => (s.select.status == 2 ? c + 1 : c),
        0
      );

      lec.children.forEach(s => {
        s.select.deprecated = s.select.status == 0 && csele > 0 ? 1 : 0;
        s.select.selebtn = s.select.status == 1 ? 1 : 0;
        s.select.delbtn = s.select.status == 2 ? 1 : 0;
      });

      lec.status.lower = csele > 0 ? 1 : crem == lec.children.length ? 2 : 0;

      refreshLectures(c);
    },

    refreshLectures(c) {
      const csele = c.children.reduce(
        (c, s) => (s.select.status == 1 || s.select.lower == 1 ? c + 1 : c),
        0
      );

      c.children.forEach(l => {
        l.select.deprecated =
          s.select.lower == 2 ||
          (l.select.status == 0 && s.select.lower != 2 && csele > 0)
            ? 1
            : 0;
        l.select.selebtn = l.select.status == 1 ? 1 : 0;
        l.select.delbtn = l.select.status == 2 ? 1 : 0;
      });
    },

    getStatus(s) {
      if (s.suppressed == 1) return 23;
      if (s.status == 2) return 20;
      if (s.lower == 2) return 22;
      if (s.status == 1) return 10;
      if (s.lower == 1) return 11;
      if (s.deprecated == 1) return 21;
      return 0;
    },

    toggleStatus(s, act) {
      switch (s.status + act * 3) {
        case 0:
        case 2:
          s.status = 1;
          break;
        case 1:
        case 5:
          s.status = 0;
          break;
        case 3:
        case 4:
          s.status = 2;
          break;
        default:
          console.log("unexpected switch result");
      }
    },

    tableRowClassName({ row, rowIndex }) {
      if (row.status == "course") return "course-row";
      if (row.status == "lecture") return "lecture-row";
      return "section-row";
    }
  }
};
</script>

<style scoped>
div.course-tree {
  margin: 20px 0;
}

div.row {
  display: flex;
}
</style>
