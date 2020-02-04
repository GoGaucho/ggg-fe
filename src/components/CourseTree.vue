<template>
  <div class="course-tree">
    <h1>Section Inclusion and Exclusion</h1>
    <p>Cancelled / closed / full sections and lectures are excluded by default</p>
    <p>Each course should have at least one lecture / section included</p>
    <br />
    <el-row v-if="!loading" style="display:flex;">
      <el-button @click="setAll(0)">Restore Default</el-button>
      <el-button @click="setAll(1)">Select All</el-button>
    </el-row>
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
      checkList: [],
      fullList: null,
      defList: []
    };
  },
  computed: {
    ...mapState(["selected", "quarter", "inclPref"])
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
    ...mapMutations([
      "addSelected",
      "setCourse",
      "setCheckedEC",
      "setInclPref"
    ]),

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
      this.saveSelection(data.checkedKeys);
    },

    saveSelection(c) {
      const q = this.quarter;
      const filt = e => e.length == 5;
      const c0 = c.filter(filt);
      this.checkList = c0;
      this.setCheckedEC([...c0]);

      for (var c of this.res) {
        const id = c.courseId;
        const sele = c0.filter(e => this.fullList[id].includes(e));
        const isDef = sele.reduce(
          (b, e) => b && this.defList[id].includes(e),
          this.defList[id].length == sele.length
        );
        if (isDef) this.setInclPref({ q: q, id: id, status: 0, codes: [] });
        else this.setInclPref({ q: q, id: id, status: 1, codes: sele });
      }
      this.setInclPref({ q: q, save: true });
    },

    setAll(type) {
      let list = [];
      const base = type == 0 ? this.defList : this.fullList;
      for (var e in base) list = list.concat(base[e]);
      this.$refs.tree.setCheckedKeys(list);
      this.saveSelection(list);
    },

    getData: function() {
      const list = [];
      const ce = [];
      const full = {};
      const defList = {};
      for (let c of this.courses) {
        let res = [];
        const id = c.courseId.replace(/\s*/g, "");
        full[id] = [];
        defList[id] = [];
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
        const cres = {
          status: "course",
          enrollCode: id + " - " + c.title,
          courseId: id,
          children: res
        };
        this.checkAll(full[id], cres);
        this.checkDef(defList[id], cres);
        this.checkAuto(ce, cres);
        list.push(cres);
      }
      this.res = list;
      this.checkList = ce;
      this.fullList = full;
      this.defList = defList;
      this.setCheckedEC(ce);
    },

    checkAuto(ce, l) {
      this.setInclPref({ q: this.quarter });
      const pref = this.inclPref[this.quarter][l.courseId];
      if (!pref || !pref.status) this.checkDef(ce, l);
      else for (var c of pref.codes) ce.push(c);
    },

    checkAll(ce, l) {
      l.children.forEach(ss => {
        if (!ss.children || !ss.children.length) ce.push(ss.enrollCode);
        else this.checkAll(ce, ss);
      });
    },

    checkDef(ce, l) {
      l.children.forEach(ss => {
        if (!ss.children || !ss.children.length) {
          if (!ss.disables && ss.space > 0) {
            ce.push(ss.enrollCode);
          }
        } else this.checkDef(ce, ss);
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