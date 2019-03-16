import Vue from 'vue'
import App from './App.vue'
import VueTextareaAutosize from 'vue-textarea-autosize'

Vue.prototype.$serv = 'https://ceosonweb.alwaysdata.net/back/';
//Vue.prototype.$serv = 'http://localhost/card_suggest_back/';


Vue.config.productionTip = false
Vue.use(VueTextareaAutosize)

new Vue({
  render: h => h(App),
}).$mount('#app')
