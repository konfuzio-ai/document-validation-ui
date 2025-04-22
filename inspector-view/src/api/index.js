import axios from 'axios'

let HTTP, FILE_REQUEST, authToken, appLocale, isKeycloakAuth
const DEFAULT_URL = 'https://app.konfuzio.com'
const FILE_URL = process.env.VUE_APP_IMAGE_URL
const API_URL = process.env.VUE_APP_API_URL

axios.defaults.xsrfCookieName = 'csrftoken'
axios.defaults.xsrfHeaderName = 'X-CSRFToken'

HTTP = axios.create({
  baseURL: API_URL || `${DEFAULT_URL}/api/v3/`
})

FILE_REQUEST = axios.create({
  baseURL: FILE_URL || DEFAULT_URL,
  responseType: 'blob'
})

const setAuthToken = (token) => {
  authToken = token
  // Update axios instance defaults
  HTTP.defaults.headers.common['Authorization'] = token ? `Token ${token}` : null
  FILE_REQUEST.defaults.headers.common['Authorization'] = token ? `Token ${token}` : null
}

// Initialize auth token from environment variable
if (process.env.VUE_APP_USER_TOKEN) {
  setAuthToken(process.env.VUE_APP_USER_TOKEN)
}

const setApiUrl = (url) => {
  HTTP.defaults.baseURL = url
}

const setFileUrl = (url) => {
  FILE_REQUEST.defaults.baseURL = url
}

const setLocale = (locale) => {
  appLocale = locale
}

// Add request interceptor for authentication
HTTP.interceptors.request.use(async (config) => {
  if (authToken) {
    config.headers['Authorization'] = `Token ${authToken}`
  }
  
  if (appLocale) {
    config.headers['Accept-Language'] = appLocale
  }
  
  return config
})

// API methods
const getDocuments = (params) => {
  return HTTP.get('documents/', { params })
}

const getProjects = () => {
  return HTTP.get('projects/')
}

const getDocumentById = (id) => {
  return HTTP.get(`documents/${id}/`)
}

const getDocumentPages = (id) => {
  return HTTP.get(`documents/${id}/pages/`)
}

const getDocumentAnnotations = (id) => {
  return HTTP.get(`documents/${id}/annotations/`)
}

const getDocumentAnnotationSets = (id) => {
  return HTTP.get(`documents/${id}/annotation_sets/`)
}

const getAnnotationSets = () => {
  return HTTP.get('annotation_sets/')
}

const getAnnotationSetById = (id) => {
  return HTTP.get(`annotation_sets/${id}/`)
}

const getAnnotations = () => {
  return HTTP.get('annotations/')
}

const getAnnotationById = (id) => {
  return HTTP.get(`annotations/${id}/`)
}

const makeFileRequest = (fileUrl) => {
  return FILE_REQUEST.get(fileUrl)
}

export default {
  HTTP,
  FILE_REQUEST,
  setAuthToken,
  setApiUrl,
  setFileUrl,
  setLocale,
  getDocuments,
  getProjects,
  getDocumentById,
  getDocumentPages,
  getDocumentAnnotations,
  getDocumentAnnotationSets,
  getAnnotationSets,
  getAnnotationSetById,
  getAnnotations,
  getAnnotationById,
  makeFileRequest
} 