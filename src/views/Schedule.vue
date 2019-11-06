<template>
  <div class="schedule">
    <h1>
      <el-select filterable @change="choose" v-model="I">
        <el-option v-for="o in options" :value="o.key" :label="o.label" />
      </el-select>
      Weekly View 
      <el-button
        style="margin-left: 10px;"
        @click="$router.push({name: 'planner'})"
      >Back</el-button>
    </h1>
    <div class="table">
      <div v-for="d in dayNums" :style="headerStyle(d)" class="card">{{days[d]}}</div>
      <template v-for="c in result">
        <div v-for="p in c.periods" 
          class="card"
          :style="cardStyle(c.title, p.range)"
          @click="viewInfo(c)">
          {{c.title}} <br>
          {{range2time(p.range)}} <br>
          {{c.location}}
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'Schedule',
  data() {
    return {
      I: '',
      options: [],
      result: [],
      dayNums: [1, 2, 3, 4, 5],
      days: ['', 'Mon', 'Tue', 'Wed', 'Thr', 'Fri'],
      colors: ["#fff1f0", "#f9f0ff", "#e6f7ff", "#fffbe6", "#f6ffed", "#fff7e6", "#fff0f6"],
      colorMap: [],
    }
  },
  mounted() {
    for (let i in this.results) {
      this.options.push({label: 'Result ' + (Number(i) + 1), key: i});
    }
    this.I = this.options[0].label;
    this.choose(0);
    setTimeout(this.addColor, 1000);
  },
  computed: {
    ...mapState(['results']),
  },
  methods: {
    choose: function(I) {
      this.result = this.results[I];
      this.$forceUpdate();
    },
    addColor: function() {
      let cot = 0;
      for (let c of this.result) {
        this.colorMap[c.title] = this.colors[cot];
        cot++;
      }
      this.$forceUpdate();
    },
    headerStyle: function(dayNum) {
      let res = "";
      res += "height: 15px;";
      res += "top: -15px;";
      res += "left: " + 20 * (dayNum - 1) + "%;";
      return res;
    },
    cardStyle: function(title, range) {
      let res = "";
      let day = Math.floor(range[0] / 1440);
      let begin = range[0] % 1440;
      let end = range[1] % 1440;
      res += "height: " + 0.119 * (end - begin) + "%;";
      res += "top: " + 0.119 * (begin - 420) + "%;";
      res += "left: " + 20 * (day - 1) + "%;";
      res += "background-color: " + this.colorMap[title] + ";";
      return res;
    },
    range2time: function(range) {
      let res = "";
      let timenum = range[0];
      timenum %= 1440;
      let hour = Math.floor(timenum / 60);
      let min = (timenum % 60);
      if (hour < 10) hour = '0' + String(hour);
      if (min < 10) min = '0' + String(min);
      res += hour + ":" + min;
      timenum = range[1] % 1440;
      res += " - ";
      hour = Math.floor(timenum / 60);
      min = (timenum % 60);
      if (hour < 10) hour = '0' + String(hour);
      if (min < 10) min = '0' + String(min);
      res += hour + ":" + min;
      return res;
    },
    viewInfo: function(c) {
      let info = "";
      info += "EnrollCode: " + c.enrollCode;
      swal(c.title, info, "success");
    }
  }
}
</script>

<style scoped>
div.schedule {
  width: 100%;
  height: calc(100vh - 60px);
  background-color: #eee;

  display: flex;
  flex-direction: column;
  align-items: center;
}
div.table {
  position: relative;
  margin: 15px auto 0;
  width: 90%;
  height: calc(100vh - 165px);
}
div.card {
  position: absolute;
  width: 18%;

  border-radius: 5px;
  font-size: 0.7rem;

  box-shadow: 1px 1px 2px #999;
  background-color: #fff;
  transition: all 1s ease;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

strong {
  color: #036;
}

h1, h3, h5 {
  color: #036;
}
</style>