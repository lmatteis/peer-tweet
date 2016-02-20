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

export const tweetsStore = createStore((state, action) => {
  switch (action.type) {
  case 'RESET':
    return 'RESET'
  case 'ADD_TWEET':
    return action.tweet
  default:
    return state
  }
})
