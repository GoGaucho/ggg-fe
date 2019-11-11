<template>
  <div class="course-tree">
    <div v-if="loading">Loading...</div>
    <el-tree
      :data="res"
      v-if="res.length"
      style="width: 100%;"
      node-key="enrollCode"
      :default-checked-keys="checkList"
      @check="setSelection"
      accordion
      show-checkbox
    >
      <template slot-scope="scope">
        {{scope.data.enrollCode}}
        {{scope.data.count}}
        {{scope.data.space}}
        {{scope.data.days}}
        {{scope.data.time}}
        {{scope.data.location}}
        {{scope.data.instructor}}
      </template>
    </el-tree>
  </div>
</template>

<script>
import { mapState, mapMutations } from "vuex";

export default {
  name: "CourseTree",
  components: {},
  data() {
    return {
      loading: false,
      courses: [],
      res: [],
      checkList: []
    };
  },
  computed: {
    ...mapState(["selected", "quarter"])
  },
  watch: {
    selected: function() {
      console.log("changed");
      let removed = null;
      this.res = this.res.filter(c => {
        const ans = this.selected.indexOf(c.courseId) >= 0;
        if (!ans) removed = c;
        return ans;
      });

      const remlist = removed.children.reduce((list, l) => {
        list.push(l.enrollCode);
        if (l.children) l.children.forEach(s => list.push(s.enrollCode));
        return list;
      }, []);

      const remf = e => remlist.indexOf(e) < 0;

      this.checkList = this.checkList.filter(remf);
      this.setCheckedEC(this.checkList.filter(remf));
    }
  },
  mounted() {
    this.getCourseInfo();
  },
  methods: {
    ...mapMutations(["addSelected", "setCourse", "setCheckedEC"]),

    getCourseInfo: async function() {
      this.loading = true;
      try {
        const resp = await axios({
          method: "post",
          url: `/api/sche/getClassesByID?q=${this.quarter}`,
          data: this.selected.map(s => s.replace(/\s*/g, ""))
        });
        if (resp.data.length != this.selected.length)
          throw new Error("data length mismatch");
        this.courses = resp.data;
        this.loading = false;
        this.getData();
      } catch (error) {
        this.loading = false;
        console.log(error);
        swal("ERROR", "Server Response Error", "error");
      }
    },

    setSelection(a, data) {
      const filt = e => e.length == 5;
      const c0 = data.checkedKeys.filter(filt);
      this.checkList = c0;
      const c1 = data.halfCheckedKeys.filter(filt);
      this.setCheckedEC([...c0, ...c1]);
    },

    getData: function() {
      const list = [];
      const check = l => {
        l.forEach(ss => {
          if (!ss.children || !ss.children.length) {
            if (!ss.disables && ss.space > 0)
              this.checkList.push(ss.enrollCode);
          } else check(ss.children);
        });
      };

      for (let c of this.courses) {
        let res = [];
        for (let i in c.classSections) {
          let s = c.classSections[i];
          let ss = {};
          ss.enrollCode = s.enrollCode;
          ss.disables = s.courseCancelled || s.classClosed;
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
        check(res);
        list.push({
          status: "course",
          enrollCode: c.courseId.replace(/\s*/g, "") + " - " + c.title,
          courseId: c.courseId.replace(/\s*/g, ""),
          children: res
        });
      }
      this.res = list;
    },

    getStatus(s) {
      if (s.suppressed == 1) return 23;
      if (s.status == 2) return 20;
      if (s.lower == 2) return 22;
      if (s.status == 1) return 10;
      if (s.lower == 1) return 11;
      if (s.deprecated == 1) return 21;
      return 0;
    }
  }
};
</script>

<style scoped>
div.course-tree {
  padding: 10px 20px;
  margin: 20px 0;
  border-radius: 5px;
  box-shadow: 2px 2px 5px #999;
  background-color: #fff;
}

div.row {
  display: flex;
}
</style>