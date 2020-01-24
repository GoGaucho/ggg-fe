<template>
  <div class="selector">
    <div class="loading" v-if="loading">Loading ...</div>
    <div class="row">
      <template>
        <strong>Quarter:</strong>
        <el-select filterable @change="change('quarter')" v-model="query.quarter">
          <el-option
            v-for="o in options.quarter"
            :value="o.key"
            :label="o.name"
            v-bind:key="o.key"
          />
        </el-select>
      </template>
      <template>
        <strong>Find Course by</strong>
        <el-select style="width: 150px;" filterable @change="change('by')" v-model="by">
          <el-option value="Search" label="Search" />
          <el-option value="Department" label="Department" />
          <el-option value="GE" label="GE" />
        </el-select>
      </template>
    </div>

    <div v-if="by == 'Search' && options.quarter.length" class="row">
      <strong>General Search:</strong>
      <el-input
        style="width: 50%; margin-right: 10px;"
        v-model="query.search"
        @keyup.enter.native="getList('course')"
      ></el-input>
      <el-button type="primary" @click="getList('course')">Search</el-button>&nbsp;
      <el-checkbox
        v-if="by=='Search'"
        v-model="query.titleOnly"
        label="Match Title Only"
        @change="change('filter')"
      />
    </div>

    <div v-if="by == 'Department'" class="row">
      <template v-if="options.department.length">
        <strong>Department:</strong>
        <el-select
          style="width: 150px;"
          filterable
          @change="change('department')"
          v-model="query.department"
        >
          <el-option
            v-for="o in options.department"
            :value="o.key"
            :label="o.name"
            v-bind:key="o.key"
          />
        </el-select>
      </template>
    </div>

    <div v-if="by == 'GE'" class="row">
      <template v-if="options.college.length">
        <strong>College:</strong>
        <el-select
          style="width: 150px;"
          filterable
          @change="change('college')"
          v-model="query.college"
        >
          <el-option
            v-for="o in options.college"
            :value="o.key"
            :label="o.name"
            v-bind:key="o.key"
          />
        </el-select>
      </template>
      <template v-if="options.GE.length">
        <strong>GE:</strong>
        <el-select
          style="width: 50%;"
          multiple
          filterable
          @change="change('GE')"
          v-model="query.GE"
        >
          <el-option v-for="o in options.GE" :value="o.key" :label="o.name" v-bind:key="o.key" />
        </el-select>
      </template>
    </div>
    <div class="row">
      <el-checkbox-group v-model="checkList" @change="change('filter')">
        <el-checkbox-button label="Lower" />
        <el-checkbox-button label="Upper" />
        <el-checkbox-button label="Grad" />
        <el-checkbox-button label="Postgrad" />
      </el-checkbox-group>
    </div>
    <div v-if="by='GE'" class="row">
      <strong>Must includes:</strong>
      <el-checkbox-group v-model="query.forcedGE" @change="change('filter')">
        <el-checkbox-button v-for="ge in query.GE" :key="'force-'+ge" :label="ge" />
      </el-checkbox-group>
    </div>
    <div v-if="by='GE'" class="row" style="width:100%;">
      <strong>Min GE:</strong>
      <el-input-number
        v-model="query.minGE"
        :min="0"
        :max="query.GE.length"
        @change="change('filter')"
      />
    </div>
  </div>
</template>

<script>
import { mapState, mapMutations } from "vuex";

var GEColl = [];
var GECode = [];
var season = ["", "Winter", "Spring", "Summer", "Fall"];

export default {
  name: "Selector",
  data() {
    return {
      loading: false,
      by: "",
      query: {
        quarter: "",
        search: "",
        department: "",
        college: "",
        GE: [],
        titleOnly: false,
        forcedGE: [],
        minGE: 1
      },
      options: {
        quarter: [],
        department: [],
        college: [],
        GE: []
      },
      tmplist: [],
      tmpge: [],
      checkList: ["Lower", "Upper"]
    };
  },
  mounted() {
    this.by = "Search";
    this.change("by");
    this.getList("quarter");
  },
  computed: {
    ...mapState(["quarter"])
  },
  methods: {
    ...mapMutations(["setCourse", "setQuarter", "setCourseList"]),

    change: function(key) {
      this.setCourse(null); // clear current course
      if (key == "by") {
        this.query.department = "";
        this.query.college = "";
        this.options.department = [];
        this.options.college = [];
        this.options.GE = [];

        if (this.query.quarter) {
          if (this.by == "GE") this.getList("college");
          if (this.by == "Department") this.getList("department");
        }

        this.setList([], []);
      }

      if (key == "quarter") {
        this.setQuarter(this.query.quarter);

        this.query.department = "";
        this.query.college = "";
        this.options.department = [];
        this.options.college = [];
        this.options.GE = [];
        if (this.by == "GE") this.getList("college");
        if (this.by == "Department") this.getList("department");

        this.setList([], []);
      }

      if (key == "department") {
        this.getList("course");
      }

      if (key == "college") {
        this.query.GE = "";
        this.options.GE = [];
        this.getList("GE");

        this.setList([], []);
      }

      if (key == "GE") {
        this.query.forcedGE = this.query.forcedGE.filter(
          e => this.query.GE.indexOf(e) >= 0
        );
        this.query.minGE = Math.min(this.query.minGE, this.query.GE.length);
        if (this.query.GE.length) this.getList("course");
      }

      if (key == "filter") {
        this.setList(this.tmplist, this.tmpge);
      }
    },

    setList(list, ge) {
      this.tmplist = list;
      this.tmpge = ge;
      this.setCourseList({ list: this.divFilt(list), ge: ge });
    },

    divFilt: function(list) {
      var f0 = str => {
        for (var i = 0; i < str.length; i++) {
          const ch = str.charAt(i);
          if (ch >= "0" && ch <= "9") return i;
        }
        return -1;
      };

      var f1 = (str, i0) => {
        for (var i = i0; i < str.length; i++) {
          const ch = str.charAt(i);
          if (ch < "0" || ch > "9") return i;
        }
        return str.length;
      };

      var f2 = str => {
        const i0 = f0(str);
        if (i0 < 0) return 0;
        const i1 = f1(str, i0);
        const sub = +str.substring(i0, i1);
        return Math.floor(sub / 100);
      };

      var f3 = e => {
        if (
          this.by == "Search" &&
          this.query.titleOnly &&
          !e.id.match(this.query.search)
        )
          return false;

        if (this.by == "GE") {
          if (e.sum < this.query.minGE) return false;
          for (var fge of this.query.forcedGE) if (!e[fge]) return false;
        }

        const val = f2(e.id);
        if (val == 0 && this.checkList.indexOf("Lower") >= 0) return true;
        if (val == 1 && this.checkList.indexOf("Upper") >= 0) return true;
        if (val == 2 && this.checkList.indexOf("Grad") >= 0) return true;
        if (val == 5 && this.checkList.indexOf("Postgrad") >= 0) return true;
        return false;
      };

      return list.filter(e => f3(e));
    },

    getList: function(key) {
      this.loading = true;
      if (key == "quarter") {
        axios
          .get("/api/sche/getQuarter")
          .then(resp => {
            this.options.quarter = [];
            resp.data.qlist.forEach(q => {
              let year = Math.floor(q / 10);
              let s = season[q % 10];
              this.options.quarter.push({ name: year + s, key: q });
              if (this.quarter === q) resp.data.default = q;
            });
            this.query.quarter = resp.data.default;
            setTimeout(this.change("quarter"), 10);
            this.loading = false;
          })
          .catch(error => {
            this.loading = false;
            swal("ERROR", "Network Error", "error");
          });
      }
      if (key == "department") {
        axios // get department list
          .get("/api/sche/getDeptList?q=" + this.query.quarter)
          .then(resp => {
            this.options.department = [];
            for (let d of resp.data) {
              this.options.department.push({ name: d, key: d });
            }
            this.options.department.sort();
            this.loading = false;
          })
          .catch(error => {
            this.loading = false;
            swal("ERROR", "Network Error", "error");
          });
      }
      if (key == "college") {
        axios // get GE list
          .get("/api/sche/getGEList?q=" + this.query.quarter)
          .then(resp => {
            this.options.college = [];
            GEColl = resp.data;
            for (let c of resp.data) {
              this.options.college.push({ name: c.col, key: c.col });
            }
            this.loading = false;
          })
          .catch(error => {
            this.loading = false;
            swal("ERROR", "Network Error", "error");
          });
      }
      if (key == "GE") {
        this.options.GE = [];
        for (let i in GEColl) {
          if (GEColl[i].col == this.query.college) {
            GECode = GEColl[i].codes;
            break;
          }
        }
        for (let i in GECode) {
          this.options.GE.push({ name: GECode[i].code, key: GECode[i].code });
        }
        this.options.GE.sort();
        this.loading = false;
      }
      if (key == "course" && this.by == "Search") {
        axios // get course list
          .get("/api/sche/searchClass", {
            params: {
              q: this.query.quarter,
              key: this.query.search
            }
          })
          .then(resp => {
            let list = [];
            for (let c of resp.data) list.push({ id: c });
            this.setList(list, []);
            if (!resp.data.length) {
              swal(
                "No Course Found!",
                "There is nothing found related to " + this.query.search,
                "error"
              );
            }
            this.loading = false;
          })
          .catch(error => {
            this.loading = false;
            swal("ERROR", "Network Error", "error");
          });
      }
      if (key == "course" && this.by == "Department") {
        let deptCode = this.query.department.replace(" ", "_");
        axios // get course list
          .get("/api/sche/getClassByDept", {
            params: {
              q: this.query.quarter,
              dept: deptCode
            }
          })
          .then(resp => {
            const list = [];
            for (let c of resp.data) list.push({ id: c.id });
            list.sort();
            this.setList(list, []);
            this.loading = false;
          })
          .catch(error => {
            this.loading = false;
            swal("ERROR", "Network Error", "error");
          });
      }
      if (key == "course" && this.by == "GE") {
        let list = {};
        let clist = [];
        GECode.forEach(code => {
          if (this.query.GE.indexOf(code.code) >= 0)
            code.list.forEach(c => {
              if (!list[c]) {
                list[c] = { id: c, sum: 0 };
                clist.push(c);
              }
              if (list[c][code.code] != "X") {
                list[c][code.code] = "X";
                list[c].sum++;
              }
            });
        });
        let xlist = clist.map(e => list[e]);
        xlist.sort((a, b) => b.sum - a.sum);

        this.setList(xlist, this.query.GE);

        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
div.selector {
  position: relative;
  padding: 1px 10px 10px;

  border-radius: 5px;
  text-align: left;

  box-shadow: 1px 1px 3px #999;
  background-color: #fff;
}

div.row {
  display: flex;
  width: 100%;
  margin: 20px 0;
  justify-content: flex-start;
  align-items: center;
}

div.loading {
  position: absolute;
  right: 10px;
  bottom: 10px;
  color: #036;
  font-size: 1.2rem;
}

h3,
strong {
  margin: 0 10px;
  color: #036;
}
</style>