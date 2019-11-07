import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/planner',
      name: 'planner',
      component: function () {
        return import('./views/Planner.vue')
      }
    },
    {
      path: '/processing',
      name: 'processing',
      component: function () {
        return import('./views/Processing.vue')
      }
    },
    {
      path: '/schedule',
      name: 'schedule',
      component: function () {
        return import('./views/Schedule.vue')
      }
    }
  ]
})
