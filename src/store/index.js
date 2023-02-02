import { store } from 'quasar/wrappers'
import {
  createStore,
  useStore as vuexUseStore,
} from 'vuex'

import clock from './clock'
import tasks from './tasks'


/*
 * If not building with SSR mode, you can
 * directly export the Store instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Store instance.
 */
export default store(function (/* { ssrContext } */) {
  const Store = createStore({
    modules: {
      clock,
      tasks
    },

    // enable strict mode (adds overhead!)
    // for dev mode and --debug builds only
    strict: !!process.env.DEBUGGING
  })

  // if (process.env.DEV && module.hot) {
  //   module.hot.accept(['./clock'], () => {
  //     const newclock = require('./clock').default
  //     Store.hotUpdate({ modules: { clock: newclock } })
  //   })
  // }

  // if (process.env.DEV && module.hot) {
  //   module.hot.accept(['./tasks'], () => {
  //     const newtasks = require('./tasks').default
  //     Store.hotUpdate({ modules: { tasks: newtasks } })
  //   })
  // }

  return Store;
})

export function useStore() {
  return vuexUseStore(storeKey)
}
