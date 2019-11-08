<template>
  <div class="course-list">
    <div v-for="c in courseList.list" :key="c.id" class="course-card">
      <CourseInfo v-if="expanded == c.id" :id="c.id"/>
      <div v-else class="row whole" @click="expand(c.id)">
        <div class="row left">
          <h3>>&nbsp;{{c.id}}</h3> 
          <el-tag 
            v-for="ge in courseList.ge" 
            v-if="c[ge]"
            style="opacity: 0.5;border-color: #000; color: #000; margin-left: 5px;"
            :color="colorMap[ge]">{{ge}}</el-tag>
        </div>
        <div class="row right">
          <el-button 
            style="margin-left: 10px;"
            size="small"
            @click.stop="addSelected(c.id)">ADD</el-button>  
        </div>
      </div>
    </div>
    
  </div>
</template>

<script>
import { mapState, mapMutations } from "vuex";
import Selector from "@/components/Selector.vue";
import CourseInfo from "@/components/CourseInfo.vue";

export default {
  name: "CourseList",
  components: {
    CourseInfo
  },
  data() {
    return {
      expanded: '',
      colors: [
        "#ff7875",
        "#ffbb96",
        "#ffd591",
        "#ffe58f",
        "#fffb8f",
        "#d3f261",
        "#b7eb8f",
        "#87e8de",
        "#91d5ff",
        "#adc6ff",
        "#d3adf7",
        "#ffadd2"
      ],
      colorMap: []
    }
  },
  computed: {
    ...mapState(["courseList", "quarter"]),
  },
  watch: {
    courseList: function() {
      this.colorMap = [];
      for (let i in this.courseList.ge) {
        this.colorMap[this.courseList.ge[i]] = this.colors[i];
      }
      this.$forceUpdate();
    }
  },
  methods: {
    ...mapMutations(["addSelected", "setCourse"]),
    expand: function(id) {
      if (this.expanded == id) this.expand = '';
      else this.expanded = id;
    },
  }
};
</script>

<style scoped>
div.course-list {
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
div.whole { justify-content: space-between; }
div.left { justify-content: flex-start; }
div.right { justify-content: flex-end; }

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