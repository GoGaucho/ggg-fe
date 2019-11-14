<template>
  <div class="course-tree">
    <h1>Section Inclusion and Exclusion</h1>
    <p>Cancelled / closed / full sections and lectures are excluded by default</p>
    <p>Each course should have at least one lecture / section included</p>
    <br />
    <div v-if="loading">Loading...</div>
    <el-tree
      :data="res"
      v-if="res.length"
      style="width: 100%;text-align: left"
      node-key="enrollCode"
      :default-checked-keys="checkList"
      @check="setSelection"
      ref="tree"
      show-checkbox
    >
      <template slot-scope="scope">
        <div class="treerow" style="width:100%">
          <div class="treecell" style="width:22%">{{scope.data.enrollCode}}</div>
          <div class="treecell" style="width:9%;left:22%">{{scope.data.days}}</div>
          <div class="treecell" style="width:19%;left:31%">{{scope.data.time}}</div>
          <div class="treecell" style="width:20%;left:50%">{{scope.data.location}}</div>
          <div class="treecell" style="width:25%;left:70%">{{scope.data.instructor}}</div>
          <div class="treecell" style="width:5%;left:95%">{{scope.data.space}}</div>
        </div>
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
      this.saveSelection(data.checkedKeys, data.halfCheckedKeys);
    },

    saveSelection(c, hc) {
      const filt = e => e.length == 5;
      const c0 = c.filter(filt);
      this.checkList = c0;
      const c1 = hc.filter(filt);
      this.setCheckedEC([...c0, ...c1]);
    },

    getData: function() {
      const list = [];
      const ce = [];
      const check = l => {
        let bool = false;
        l.forEach(ss => {
          if (!ss.children || !ss.children.length) {
            if (!ss.disables && ss.space > 0) {
              bool = true;
              ce.push(ss.enrollCode);
              this.checkList.push(ss.enrollCode);
            }
          } else {
            bool = check(ss.children);
            if (bool) ce.push(ss.enrollCode);
          }
        });
        return bool;
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
          ss.section = s.section;

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

            ss.days = ss.days.replace(/\s*/g, "");
          }

          if (ss.days == "T.B.A.") continue;

          if (s.section % 100 == 0) {
            // process lecture/section
            ss.children = [];
            ss.status = "lecture";
            res.push(ss);
          } else if (
            s.section - (s.section % 100) ==
            res[res.length - 1].section
          ) {
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
      this.setCheckedEC(ce);
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
  position: relative;
  width: 60%;
  max-width: 900px;
  min-width: 630px;
  padding: 10px 20px;
  margin: 20px;
  border-radius: 5px;
  box-shadow: 2px 2px 5px #999;
  background-color: #fff;
}

h1,
h3,
h5 {
  text-align: left;
  color: #036;
}

p {
  text-align: left;
  margin: 0;
}

div.row {
  display: flex;
}
</style>

<style>
div.el-tree-node__content {
  align-items: stretch;
}

div.treecell {
  display: inline;
  position: absolute;
}
</style>