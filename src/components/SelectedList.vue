<template>
  <div class="selected-list">
    <h1>Selected Courses</h1>
    <hr />
    <div v-if="!selected.length" class="remove">Empty</div>
    <div v-for="c in selected" class="course" v-bind:key="c">
      <strong>{{c}}</strong>
      <div class="remove" @click="removeSelected(c)">remove</div>
    </div>
    <Action />
  </div>
</template>

<script>
import { mapState, mapMutations } from "vuex";
import Action from "@/components/Action.vue";

export default {
  name: "SelectedList",
  components: {
    Action
  },
  computed: {
    ...mapState(["selected"])
  },
  methods: {
    ...mapMutations(["removeSelected"])
  }
};
</script>

<style scoped>
div.selected-list {
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

div.course {
  width: 90%;
  margin: 10px auto;
  font-size: 1.3rem;

  display: flex;
  justify-content: space-between;
  align-items: center;
}

div.remove {
  color: #369;
  font-size: 1rem;
}

h1,
h3,
h5 {
  color: #036;
}

hr {
  width: 80%;
  margin-top: 0;
  border: 1px solid;
  border-color: #036;
  border-radius: 1px;
}
</style>