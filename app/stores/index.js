import { createStore } from 'redux'

export const currentPageStore = createStore((state, action) => {
  switch (action.type) {
  case 'SET_CURRENT_PAGE':
    return {
      page: action.page,
      hashHex: action.hashHex
    }
  default:
    return state
  }
})
