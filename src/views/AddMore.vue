<template>
  <div class="addmore">
    <div class="queue">
      <el-button @click="$router.push({name: 'schedule'})">Back</el-button>
      <h2 class="queue">Loading Queue</h2>
      <div v-if="queue.length">
        <p v-for="c in queue" :key="c.id">{{c.id}}</p>
      </div>
      <hr class="queue" style="border: 2px solid;width:100%;" />
      <h2 class="queue">Conflict List</h2>
      <div v-if="confl.length">
        <p v-for="c in confl" :key="c.id">{{c.id}}</p>
      </div>
    </div>
    <FindCourse :fixed="['quarter']" />
  </div>
</template>

<script>
import { mapState, mapMutations } from "vuex";
import { convertCourses } from "./Processing";
import FindCourse from "@/components/FindCourse.vue";

const delay = 10;

function conflict(ps0, ps1) {
  function conf0(pl0, pl1) {
    for (var p0 of pl0)
      for (var p1 of pl1) if (p0[1] > p1[0] && p1[1] > p0[0]) return true;
    return false;
  }
  const ans = [];
  ps0.forEach(pl0 => {
    if (!pl0.periods.length) return;
    for (var pl1 of ps1)
      if (!conf0(pl0.periods, pl1)) {
        ans.push(pl0.enrollCode);
        return;
      }
  });
  return ans;
}

export default {
  name: "AddMore",
  components: {
    FindCourse
  },
  data() {
    return {
      processor: null,
      queue: [],
      confl: [],
      courseStore: {}
    };
  },
  mounted() {
    this.setSelectorMode("fit");
  },
  computed: {
    ...mapState([
      "loadingList",
      "results",
      "courseDetails",
      "quarter",
      "selected"
    ])
  },
  watch: {
    loadingList: function() {
      if (!this.loadingList) return;
      const list = this.loadingList.list;
      this.setResultList({ list: [], ge: this.loadingList.ge });
      if (!list || !list.length) return;
      if (this.processor != null) this.processor.kill = true;
      this.processor = {
        queue: (this.queue = list),
        confl: (this.confl = []),
        data: {},
        kill: false,
        error: null
      };
      this.process(this.processor);
    },
    selected: function() {
      this.$router.push({ name: "planner" });
    }
  },
  methods: {
    ...mapMutations(["setSelectorMode", "setResultList", "pushResultList"]),

    process: async function(proc) {
      while (!proc.kill && proc.queue.length) {
        const item = proc.queue[0];
        const cur = item.id;
        const resp = await this.loadCourse(proc, cur);
        if (proc.kill) break;
        proc.data[cur] = resp;
        proc.queue.splice(0, 1);
        const avail = await this.evalCourse(proc, cur);
        if (avail.length) {
          item.avail = avail;
          this.pushResultList(item);
        } else proc.confl.push(item);
        await new Promise(res => setTimeout(res, delay));
      }
      if (this.processor == proc) this.processor = null;
    },

    loadCourse: async function(proc, id) {
      if (this.courseStore[id]) return this.courseStore[id];
      let resp = null;
      try {
        resp = await axios({
          method: "get",
          url: `/api/sche/getClassByID?q=${this.quarter}&id=${id}`
        });
      } catch (error) {
        console.log(error);
        proc.error = error;
        proc.kill = true;
        swal("ERROR", "Network Error", "error");
      }
      const detl = resp.data;
      const codes = detl.classSections.map(e => e.enrollCode);
      const res = convertCourses([id], [detl], codes);
      this.courseStore[id] = {
        periods: res.courses[0],
        detail: res.detail
      };
      return this.courseStore[id];
    },

    evalCourse: function(proc, id) {
      const ps = this.courseStore[id].periods;
      const rs = this.results.map(r =>
        r.map(e => this.courseDetails.periods[e]).flat()
      );
      return conflict(ps, rs);
    }
  }
};
</script>

<style scoped>
div.addmore {
  width: calc(100% - 20px);
  min-height: calc(100vh - 80px);
  padding: 20px 10px 0;

  display: flex;
  justify-content: center;
  align-items: flex-start;

  background-color: #eee;
}

div.queue {
  width: 200px;
  height: auto;
  min-height: 280px;
  margin: 20px;
  padding: 10px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;

  border-radius: 5px;
  box-shadow: 2px 2px 5px #999;
  background-color: #fff;
}

hr.queue,
h2.queue {
  margin: 10px 0;
  color: #036;
}

strong {
  margin: 0 10px;
  color: #036;
}
</style>