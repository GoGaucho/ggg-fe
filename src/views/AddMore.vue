<template>
  <div class="addmore">
    <FindCourse :fixed="['quarter']" />

    <div class="queue">
      <strong>Loading Queue</strong>
      <div v-if="queue.length">
        <p v-for="c in queue" :key="c.id">{{c.id}}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapMutations } from "vuex";
import { convertCourses } from "./Processing";
import FindCourse from "@/components/FindCourse.vue";

const delay = 10;

export default {
  name: "AddMore",
  components: {
    FindCourse
  },
  data() {
    return {
      processor: null,
      queue: [],
      courseStore: {}
    };
  },
  mounted() {
    this.setSelectorMode("fit");
  },
  computed: {
    ...mapState(["loadingList", "results", "courseDetails", "quarter"])
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
        data: {},
        kill: false,
        error: null
      };
      this.process(this.processor);
    }
  },
  methods: {
    ...mapMutations(["setSelectorMode", "setResultList", "pushResultList"]),

    process: async function(proc) {
      console.log("process begin: ");
      while (!proc.kill && proc.queue.length) {
        const item = proc.queue[0];
        const cur = item.id;
        console.log(cur);
        const resp = await this.loadCourse(proc, cur);
        if (proc.kill) break;
        proc.data[cur] = resp;
        proc.queue.splice(0, 1);
        await this.evalCourse(proc, cur);
        this.pushResultList(item);
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
    },

    choose: function(c) {
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

div.courses {
  position: relative;
  width: 60%;
  max-width: 900px;
  min-width: 630px;
  min-height: calc(100vh - 150px);

  margin: 20px;
  padding: 10px 20px;

  border-radius: 5px;
  text-align: left;

  box-shadow: 2px 2px 5px #999;
  background-color: #fff;
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

div.clist {
  width: calc(100% - 20px);
  margin: 20px 0;
  padding: 10px 20px;
  text-align: left;
  background-color: #fff;
}

div.course-card {
  width: calc(100% - 40px);
  margin: 10px 0;
  padding: 10px 20px;
  border-radius: 5px;
  box-shadow: 1px 1px 2px #bbb;
}

div.row {
  display: flex;
  align-items: center;
}
div.whole {
  justify-content: space-between;
}
div.left {
  justify-content: flex-start;
}
div.right {
  justify-content: flex-end;
}

h1,
h3,
h5 {
  color: #036;
  margin: 0px;
}

strong {
  margin: 0 10px;
  color: #036;
}

hr {
  width: 80;
  border: 1px solid;
  border-color: #036;
  border-radius: 1px;
}
</style>