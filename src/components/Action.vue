<template>
  <div class="action">
    <el-button round
      type="primary"
      style="width: 80%; margin: 20px 0 10px;"
      @click="action">{{buttonTip}}</el-button>
    <el-button round
      style="width: 80%; margin-bottom: 20px;"
      @click="back">back</el-button>
    <div class="copyright">
      &copy; GoGaucho 2019 <br>
      Powered by Phantomlsh <br>
      All rights reserved.
    </div>
    <div class="feedback" @click="feedback">Feedback</div>
  </div>
</template>

<script>
import { mapState, mapMutations } from 'vuex'

export default {
  name: 'Action',
  computed: {
    buttonTip: function() {
      if (this.$route.name == "home") return "Go to Planner";
      if (this.$route.name == "planner") return "Get Schedule!";
      return "Home";
    }
  },
  methods: {
    action: function() {
      if (this.buttonTip == "Go to Planner") {
        this.$router.push({name: "planner"});
        return;
      }
      if (this.buttonTip == "Get Schedule!") {
        this.$router.push({name: "processing"});
        return;
      }
      if (this.buttonTip == "Home") {
        this.$router.push({name: "home"});
        return;
      }
    },
    back: function() {
      if (this.buttonTip == "Get Schedule!") {
        this.$router.push({name: "home"});
        return;
      }
      this.$router.go(-1);
    },
    feedback: function() {
      window.open("https://forms.gle/6s1V2HeZFNjuw3sw7", "_blank");
    },
  }
}
</script>

<style scoped>
div.copyright{
  margin: 0 auto;
  color: #aaa;
  font-size: 0.8rem;
}
div.feedback{
  color: #036;
  margin: 5px auto;
  text-decoration: underline;
}
</style>