<template>
  <div class="addmore">
    <Selector :fixed="['quarter']" />
    <div class="queue">
      <strong>Loading Queue</strong>
      <div v-if="queue.length">
        <p v-for="c in queue" :key="c">{{c}}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import { convertCourses } from "./Processing";
import Selector from "@/components/Selector.vue";

const delay = 10;

export default {
  name: "AddMore",
  components: {
    Selector
  },
  data() {
    return {
      processor: null,
      queue: [],
      courseStore: {}
    };
  },
  computed: {
    ...mapState(["courseList", "results", "courseDetails", "quarter"])
  },
  watch: {
    courseList: function() {
      if (!this.courseList) return;
      const list = this.courseList.list;
      if (!list || !list.length) return;
      if (this.processor != null) this.processor.kill = true;
      this.processor = {
        queue: (this.queue = list.map(e => e.id)),
        result: [],
        data: {},
        kill: false,
        error: null
      };
      this.process(this.processor);
    }
  },
  methods: {
    process: async function(proc) {
      console.log("process begin: ");
      while (!proc.kill && proc.queue.length) {
        const cur = proc.queue[0];
        console.log(cur);
        const resp = await this.loadCourse(proc, cur);
        if (proc.kill) break;
        proc.data[cur] = resp;
        proc.queue.splice(0, 1);
        await this.evalCourse(proc, cur);
        proc.result.push(cur);
        await new Promise(res => setTimeout(res, delay));
      }
      if (this.processor == proc) this.processor = null;
      console.log("process end");
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
      //TODO
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

div.selector {
  width: 60%;
}

div.queue {
  width: 120px;
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
</style>