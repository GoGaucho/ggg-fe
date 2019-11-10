import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const init = (key, def) => {
  const raw = localStorage.getItem(key);
  if (!raw) return def;
  if (key == "quarter") return raw;
  const par = JSON.parse(raw);
  const date = o => o.timerange = o.timerange.map(e => new Date(e));
  if (key == "limit") date(par);
  if (key == "events") par.forEach(x => date(x));
  return par;
};

export default new Vuex.Store({
  state: {
    quarter: init("quarter", ""),
    selected: init("selected", []),
    events: init("events", []),
    limit: init("limit", {
      timerange: [new Date(0, 0, 0, 8, 0), new Date(0, 0, 0, 22, 0)],
      break: 10,
    }),

    courseList: { list: [], ge: [] },
    checkedEnrollCode: [],
    course: null,
    results: [],
    courseDetails: { data: {}, map: {}, rev: {} }
  },
  mutations: {
    setQuarter(state, quarter) {
      if (state.quarter != quarter) {
        state.selected = [];
        localStorage.selected = JSON.stringify(state.selected);
      }
      state.quarter = quarter;

      localStorage.quarter = quarter;
    },

    addSelected(state, course) {
      for (let i in state.selected) {
        if (state.selected[i] === course) return;
      }
      state.selected.push(course);

      localStorage.selected = JSON.stringify(state.selected);
    },

    removeSelected(state, course) {
      for (let i in state.selected) {
        if (state.selected[i] === course) {
          state.selected.splice(i, 1);
        }
      }

      localStorage.selected = JSON.stringify(state.selected);
    },

    setCourseList(state, list) {
      state.courseList = { list: list.list, ge: list.ge };
    },

    setCourse(state, course) {
      state.course = course;
    },

    addEvents(state, event) {
      for (let i in state.events) {
        if (state.events[i].name === event.name) return;
      }
      state.events.push(event);

      localStorage.events = JSON.stringify(state.events);
    },

    removeEvents(state, event) {
      for (let i in state.events) {
        if (state.events[i].name === event.name) {
          state.events.splice(i, 1);
        }
      }

      localStorage.events = JSON.stringify(state.events);
    },

    setLimit(state, limit) {
      state.limit = limit;

      localStorage.limit = JSON.stringify(state.limit);
    },

    addResults(state, result) {
      state.results.push([...result]);
    },

    clearResults(state) {
      state.results = [];
    },

    setCourseDetail(state, data) {
      const detail = { data: {}, map: {}, rev: {}, s2c: {} };
      data.forEach(e => {
        const id = e.courseId.replace(/\s*/g, "");
        detail.s2c[id] = {};
        detail.data[id] = e;
        e.classSections = e.classSections.map(s => {
          detail.map[s.enrollCode] = s;
          detail.rev[s.enrollCode] = id;
          detail.s2c[id][+s.section] = s.enrollCode;
          return s.enrollCode;
        });
      });
      state.courseDetails = detail;
    },

    setCheckedEC(state, list) {
      state.checkedEnrollCode = list;
    }
  },
  actions: {

  }
})
