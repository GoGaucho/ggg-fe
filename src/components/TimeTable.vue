<template>
  <div class="time-table">
    <el-table
      :data="data"
      style="width: 100%;"
      row-key="enrollCode"
      :row-class-name="tableRowClassName"
      default-expand-all
    >
      <el-table-column prop="enrollCode" label="EnrollCode" width="100" align="center" />
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
import { mapState } from "vuex";

export default {
  name: "TimeTable",
  computed: {
    ...mapState(["course"]),
    data: function() {
      let res = [];
      for (let i in this.course.classSections) {
        let s = this.course.classSections[i];
        let ss = {};
        ss.enrollCode = s.enrollCode;
        ss.disabled = s.courseCancelled || s.classClosed;
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
          res.push(ss);
        } else {
          ss.status = "section";
          res[res.length - 1].children.push(ss);
        }
      }
      return res;
    }
  },
  methods: {
    tableRowClassName({ row, rowIndex }) {
      if (row.disabled) return "disabled-row";
      if (row.status == "lecture") return "lecture-row";
      return "";
    }
  }
};
</script>

<style scoped>
div.time-table {
  margin: 20px 0;
}

div.row {
  display: flex;
}
</style>

<style>
.el-table .disabled-row {
  background: #eee;
}

.el-table .lecture-row {
  background: #f0f9eb;
}
</style>