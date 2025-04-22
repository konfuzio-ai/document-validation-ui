import Vue from 'vue'
import Vuex from 'vuex'
import api from '../api'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    documents: [],
    currentDocument: null,
    loading: false,
    error: null,
    userToken: process.env.VUE_APP_USER_TOKEN || '',
    apiUrl: process.env.VUE_APP_API_URL || 'https://testing.konfuzio.com/api/v3/',
    imageUrl: process.env.VUE_APP_IMAGE_URL || 'https://testing.konfuzio.com',
    pagination: {
      count: 0,
      next: null,
      previous: null,
      currentPage: 1,
      pageSize: 10
    }
  },
  getters: {
    getDocumentById: (state) => (id) => {
      return state.documents.find(doc => doc.id === id)
    }
  },
  mutations: {
    SET_DOCUMENTS(state, documents) {
      state.documents = documents
    },
    SET_CURRENT_DOCUMENT(state, document) {
      state.currentDocument = document
    },
    SET_LOADING(state, loading) {
      state.loading = loading
    },
    SET_ERROR(state, error) {
      state.error = error
    },
    SET_USER_TOKEN(state, token) {
      state.userToken = token
      api.setAuthToken(token)
    },
    SET_API_URL(state, url) {
      state.apiUrl = url
      api.setApiUrl(url)
    },
    SET_IMAGE_URL(state, url) {
      state.imageUrl = url
      api.setFileUrl(url)
    },
    SET_PAGINATION(state, pagination) {
      state.pagination = {
        ...state.pagination,
        count: pagination.count,
        next: pagination.next,
        previous: pagination.previous
      }
    },
    SET_CURRENT_PAGE(state, page) {
      state.pagination.currentPage = page
    },
    SET_PAGE_SIZE(state, size) {
      state.pagination.pageSize = size
    }
  },
  actions: {
    async fetchDocuments({ commit, state }) {
      commit('SET_LOADING', true)
      try {
        const { currentPage, pageSize } = state.pagination
        const offset = (currentPage - 1) * pageSize
        const response = await api.getDocuments(offset, pageSize)
        commit('SET_DOCUMENTS', response.data.results)
        commit('SET_PAGINATION', {
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous
        })
      } catch (error) {
        commit('SET_ERROR', error.message)
        console.error('Error fetching documents:', error)
      } finally {
        commit('SET_LOADING', false)
      }
    },
    async fetchDocument({ commit }, id) {
      commit('SET_LOADING', true)
      try {
        const response = await api.getDocumentById(id)
        commit('SET_CURRENT_DOCUMENT', response.data)
      } catch (error) {
        commit('SET_ERROR', error.message)
        console.error('Error fetching document:', error)
      } finally {
        commit('SET_LOADING', false)
      }
    },
    changePage({ commit, dispatch }, page) {
      commit('SET_CURRENT_PAGE', page)
      dispatch('fetchDocuments')
    },
    changePageSize({ commit, dispatch }, size) {
      commit('SET_PAGE_SIZE', size)
      commit('SET_CURRENT_PAGE', 1) // Reset to first page
      dispatch('fetchDocuments')
    }
  }
}) 