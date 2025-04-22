<template>
  <div class="documents">
    <h1>Documents</h1>
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <div class="table-controls">
        <div class="filters">
          <div class="project-filter">
            <label for="project-select">Project:</label>
            <select 
              id="project-select" 
              v-model="selectedProject" 
              @change="handleProjectChange"
              class="project-select"
            >
              <option value="">All Projects</option>
              <option 
                v-for="project in projects" 
                :key="project.id" 
                :value="project.id"
              >
                {{ project.name }}
              </option>
            </select>
          </div>
          <div class="page-size">
            <label for="page-size">Items per page:</label>
            <select id="page-size" v-model="pageSize" @change="handlePageSizeChange">
              <option v-for="size in pageSizeOptions" :key="size" :value="size">
                {{ size }}
              </option>
            </select>
          </div>
        </div>
      </div>
      <table class="documents-table">
        <thead>
          <tr>
            <th @click="sortBy('id')">
              ID
              <span v-if="sortKey === 'id'" :class="sortOrder === 'asc' ? 'asc' : 'desc'">▼</span>
            </th>
            <th @click="sortBy('name')">
              Name
              <span v-if="sortKey === 'name'" :class="sortOrder === 'asc' ? 'asc' : 'desc'">▼</span>
            </th>
            <th @click="sortBy('created')">
              Created
              <span v-if="sortKey === 'created'" :class="sortOrder === 'asc' ? 'asc' : 'desc'">▼</span>
            </th>
            <th @click="sortBy('status')">
              Status
              <span v-if="sortKey === 'status'" :class="sortOrder === 'asc' ? 'asc' : 'desc'">▼</span>
            </th>
            <th v-for="labelSet in labelSets" :key="labelSet.id">
              {{ labelSet.name }}
              <div class="label-set-info">
                <span v-if="labelSet.has_multiple_sections" class="multiple-sections">Multiple</span>
              </div>
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="doc in sortedDocuments" :key="doc.id">
            <td>{{ doc.id }}</td>
            <td>
              <div class="name-cell">
                <span class="document-name" @click="showPreview(doc)">{{ doc.data_file_name || '-' }}</span>
                <div v-if="doc.thumbnail_url" class="preview-tooltip">
                  <div class="preview-content">
                    <AuthImage
                      :src="getFullImageUrl(doc)"
                      alt="Document preview"
                      class="preview-image"
                    />
                  </div>
                </div>
              </div>
            </td>
            <td>{{ formatDate(doc.created_at || doc.created) }}</td>
            <td>
              <span :class="['status-badge', getStatusClass(doc.status_data)]">
                {{ getStatusText(doc.status_data) }}
              </span>
            </td>
            <td v-for="labelSet in labelSets" :key="labelSet.id">
              <div class="annotation-cell">
                <template v-if="doc.annotation_sets">
                  <div v-for="annotationSet in doc.annotation_sets.filter(set => set.label_set.id === labelSet.id)" 
                       :key="annotationSet.id"
                       class="annotation-set">
                    <div v-for="label in annotationSet.labels" 
                         :key="label.id"
                         class="label-annotations">
                      <div class="label-name">{{ label.name }}</div>
                      <div v-for="annotation in label.annotations" 
                           :key="annotation.id"
                           :class="['annotation', { 'is-correct': annotation.is_correct, 'revised': annotation.revised }]">
                        {{ annotation.value || '-' }}
                        <span v-if="annotation.revised" class="annotation-status">✓</span>
                      </div>
                    </div>
                  </div>
                </template>
                <span v-else>-</span>
              </div>
            </td>
            <td>
              <button @click="viewDocument(doc.id)" class="view-btn">View</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="pagination">
        <button 
          :disabled="!pagination.previous" 
          @click="changePage(pagination.currentPage - 1)"
        >
          Previous
        </button>
        <span class="page-info">
          Page {{ pagination.currentPage }} of {{ totalPages }}
        </span>
        <button 
          :disabled="!pagination.next" 
          @click="changePage(pagination.currentPage + 1)"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import AuthImage from '../components/AuthImage.vue'

export default {
  name: 'Documents',
  components: {
    AuthImage
  },
  data() {
    return {
      sortKey: 'created',
      sortOrder: 'desc',
      pageSizeOptions: [10, 25, 50, 100],
      activePreview: null,
      labelSets: [],
      selectedProject: ''
    }
  },
  computed: {
    ...mapState(['documents', 'loading', 'error', 'pagination', 'imageUrl', 'projects']),
    pageSize: {
      get() {
        return this.pagination.pageSize
      },
      set(value) {
        this.$store.commit('SET_PAGE_SIZE', value)
      }
    },
    totalPages() {
      return Math.ceil(this.pagination.count / this.pagination.pageSize)
    },
    sortedDocuments() {
      const sorted = [...this.documents]
      return sorted.sort((a, b) => {
        let aVal = a[this.sortKey]
        let bVal = b[this.sortKey]
        
        if (this.sortKey === 'created') {
          aVal = new Date(aVal)
          bVal = new Date(bVal)
        }
        
        if (this.sortOrder === 'asc') {
          return aVal > bVal ? 1 : -1
        }
        return aVal < bVal ? 1 : -1
      })
    }
  },
  methods: {
    ...mapActions(['fetchDocuments', 'fetchDocument', 'fetchProjects', 'fetchProjectLabelSets']),
    formatDate(date) {
      if (!date) return '-';
      try {
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return '-';
        return dateObj.toLocaleString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (e) {
        return '-';
      }
    },
    sortBy(key) {
      if (this.sortKey === key) {
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc'
      } else {
        this.sortKey = key
        this.sortOrder = 'asc'
      }
    },
    viewDocument(id) {
      const baseUrl = process.env.VUE_APP_IMAGE_URL || 'https://testing.konfuzio.com';
      const url = `${baseUrl}/d/${id}`;
      window.open(url, '_blank');
    },
    changePage(page) {
      // Update the current page in the Vuex store
      this.$store.commit('SET_CURRENT_PAGE', page)
      
      const params = {
        offset: (page - 1) * this.pagination.pageSize,
        limit: this.pagination.pageSize
      }
      if (this.selectedProject) {
        params.project = this.selectedProject
      }
      this.fetchDocuments(params)
    },
    handlePageSizeChange() {
      const params = {
        offset: 0,
        limit: this.pageSize
      }
      if (this.selectedProject) {
        params.project = this.selectedProject
      }
      this.$store.dispatch('fetchDocuments', params)
    },
    getFullImageUrl(doc) {
      return doc.thumbnail_url.replace('show-thumbnail', 'show-image');
    },
    showPreview(doc) {
      this.activePreview = doc.id
    },
    closePreview() {
      this.activePreview = null
    },
    getStatusText(statusData) {
      const statusMap = {
        0: 'Queuing for OCR',
        10: 'OCR in progress',
        1: 'Queuing for extraction',
        20: 'Extraction in progress',
        3: 'Queuing for categorization',
        30: 'Categorization in progress',
        4: 'Queuing for splitting',
        40: 'Splitting in progress',
        41: 'Waiting for splitting confirmation',
        2: 'Done',
        111: 'Processing failed'
      };
      return statusMap[statusData] || 'Unknown';
    },
    getStatusClass(statusData) {
      const classMap = {
        0: 'queuing',
        10: 'processing',
        1: 'queuing',
        20: 'processing',
        3: 'queuing',
        30: 'processing',
        4: 'queuing',
        40: 'processing',
        41: 'waiting',
        2: 'completed',
        111: 'error'
      };
      return classMap[statusData] || '';
    },
    async handleProjectChange() {
      try {
        this.loading = true
        this.error = null
        
        // Fetch documents for the selected project
        await this.fetchDocuments({
          project: this.selectedProject,
          page: 1
        })
        
        // Fetch label sets if a project is selected
        if (this.selectedProject) {
          await this.fetchProjectLabelSets(this.selectedProject)
        }
      } catch (error) {
        this.error = error.message || 'Error loading documents'
        console.error('Error in handleProjectChange:', error)
      } finally {
        this.loading = false
      }
    }
  },
  created() {
    this.fetchProjects()
    this.fetchDocuments()
  }
}
</script>

<style scoped>
.documents {
  padding: 20px;
}

.loading, .error {
  text-align: center;
  padding: 20px;
}

.error {
  color: red;
}

.documents-table {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
}

.documents-table th,
.documents-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.documents-table th {
  background-color: #f5f5f5;
  cursor: pointer;
  user-select: none;
}

.documents-table th:hover {
  background-color: #e5e5e5;
}

.documents-table tr:hover {
  background-color: #f9f9f9;
}

.asc, .desc {
  margin-left: 5px;
}

.asc {
  transform: rotate(180deg);
}

.table-controls {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.filters {
  display: flex;
  align-items: center;
  gap: 10px;
}

.project-filter {
  display: flex;
  align-items: center;
  gap: 5px;
}

.project-select {
  padding: 5px;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.page-size {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-size select {
  padding: 5px;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
}

.pagination button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
}

.pagination button:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.pagination button:hover:not(:disabled) {
  background-color: #f5f5f5;
}

.page-info {
  font-size: 14px;
  color: #666;
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-badge.queuing {
  background-color: #e3f2fd;
  color: #1976d2;
}

.status-badge.processing {
  background-color: #fff3e0;
  color: #f57c00;
}

.status-badge.waiting {
  background-color: #f3e5f5;
  color: #7b1fa2;
}

.status-badge.completed {
  background-color: #e8f5e9;
  color: #388e3c;
}

.status-badge.error {
  background-color: #fbe9e7;
  color: #d32f2f;
}

.view-btn {
  background-color: #2c3e50;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.view-btn:hover {
  background-color: #1a252f;
}

.name-cell {
  position: relative;
  cursor: pointer;
}

.document-name {
  display: inline-block;
}

.preview-tooltip {
  display: none;
  position: fixed;
  z-index: 1000;
  top: 40px;
  right: 40px;
  width: calc(50% - 40px);
  height: calc(100% - 80px);
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 12px;
  backdrop-filter: blur(5px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.preview-content {
  position: relative;
  background: white;
  padding: 24px;
  margin: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  height: calc(100% - 48px);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  transition: all 0.2s ease;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.2s ease;
}

.name-cell:hover .preview-tooltip {
  display: block;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.close-preview {
  position: absolute;
  top: -15px;
  right: -15px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: white;
  border: 1px solid #ddd;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.close-preview:hover {
  background: #f5f5f5;
}

.document-name {
  cursor: pointer;
  text-decoration: underline;
}

.document-name:hover {
  color: #1976d2;
}

.annotation-cell {
  max-width: 200px;
  overflow: hidden;
}

.annotation-set {
  margin-bottom: 8px;
}

.label-annotations {
  margin-bottom: 4px;
}

.label-set-info {
  font-size: 0.75rem;
  color: #666;
  margin-top: 2px;
}

.multiple-sections {
  background-color: #e3f2fd;
  color: #1976d2;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
}

.label-name {
  font-weight: 500;
  color: #666;
  margin-bottom: 4px;
  font-size: 0.875rem;
}

.annotation {
  display: inline-block;
  padding: 2px 6px;
  margin: 2px;
  background-color: #f5f5f5;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #333;
  position: relative;
}

.annotation.is-correct {
  background-color: #e8f5e9;
  color: #388e3c;
}

.annotation.revised {
  background-color: #fff3e0;
  color: #f57c00;
}

.annotation-status {
  margin-left: 4px;
  font-size: 0.75rem;
}
</style> 