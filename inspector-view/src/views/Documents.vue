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
            <th v-if="selectedProject && projectLabels.length > 0" 
                v-for="label in projectLabels" 
                :key="label.id">
              {{ label.name }}
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
            <td v-if="selectedProject && projectLabels.length > 0" 
                v-for="label in projectLabels" 
                :key="label.id">
              <div class="annotation-cell">
                <div class="annotation-container">
                  <template v-if="documentAnnotations[doc.id]">
                    <div v-for="annotation in getAnnotationsForLabel(doc.id, label.id)" 
                         :key="annotation.id"
                         :class="['annotation', { 'is-correct': annotation.is_correct, 'revised': annotation.revised }]">
                      <span class="annotation-text">{{ annotation.value || '-' }}</span>
                      <span v-if="annotation.revised" class="annotation-status">✓</span>
                      <span v-if="annotation.is_correct" class="annotation-status correct">✓</span>
                    </div>
                  </template>
                  <span v-else class="no-annotation">-</span>
                  <div v-if="!documentAnnotations[doc.id] || getAnnotationsForLabel(doc.id, label.id).length === 0" class="new-annotation-input">
                    <input 
                      type="text" 
                      v-model="newAnnotations[`${doc.id}-${label.id}`]"
                      placeholder="Add new annotation..."
                      @keyup.enter="saveNewAnnotation(doc.id, label.id)"
                    />
                    <button 
                      class="save-icon"
                      @click="saveNewAnnotation(doc.id, label.id)"
                      :disabled="!newAnnotations[`${doc.id}-${label.id}`]"
                    >
                      <i class="fas fa-save"></i>
                    </button>
                  </div>
                </div>
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
import api from '../api'

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
      selectedProject: '',
      documentAnnotations: {},
      newAnnotations: {}
    }
  },
  computed: {
    ...mapState(['documents', 'loading', 'error', 'pagination', 'imageUrl', 'projects', 'labelSets', 'projectLabels']),
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
    ...mapActions(['fetchDocuments', 'fetchDocument', 'fetchProjects', 'fetchProjectLabels']),
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
    async fetchDocumentAnnotations(docId) {
      try {
        const response = await api.getDocumentAnnotations(docId);
        console.log('Annotations for document', docId, ':', response.data);
        // The v3 endpoint returns a paginated response with results array
        this.$set(this.documentAnnotations, docId, response.data.results || []);
      } catch (error) {
        console.error(`Error fetching annotations for document ${docId}:`, error);
        this.$set(this.documentAnnotations, docId, []);
      }
    },
    async fetchAnnotationsForCurrentDocuments() {
      if (this.selectedProject && this.documents.length > 0) {
        for (const doc of this.documents) {
          await this.fetchDocumentAnnotations(doc.id);
        }
      }
    },
    async changePage(page) {
      this.$store.commit('SET_CURRENT_PAGE', page);
      
      const params = {
        offset: (page - 1) * this.pagination.pageSize,
        limit: this.pagination.pageSize
      }
      if (this.selectedProject) {
        params.project = this.selectedProject;
      }
      await this.fetchDocuments(params);
      await this.fetchAnnotationsForCurrentDocuments();
    },
    async handlePageSizeChange() {
      const params = {
        offset: 0,
        limit: this.pageSize
      }
      if (this.selectedProject) {
        params.project = this.selectedProject;
      }
      await this.fetchDocuments(params);
      await this.fetchAnnotationsForCurrentDocuments();
    },
    async handleProjectChange() {
      try {
        this.$store.commit('SET_LOADING', true);
        this.$store.commit('SET_ERROR', null);
        this.documentAnnotations = {};
        
        // Reset pagination state
        this.$store.commit('SET_CURRENT_PAGE', 1);
        this.$store.commit('SET_PAGINATION', {
          count: 0,
          next: null,
          previous: null,
          pageSize: this.pageSize
        });
        
        // Fetch documents for the selected project
        const params = {
          project: this.selectedProject,
          offset: 0,
          limit: this.pageSize
        };
        await this.fetchDocuments(params);
        
        // Fetch project labels if a project is selected
        if (this.selectedProject) {
          await this.fetchProjectLabels(this.selectedProject);
          // Fetch annotations for each document
          for (const doc of this.documents) {
            try {
              const response = await api.getDocumentAnnotations(doc.id);
              console.log('Annotations for document', doc.id, ':', response.data);
              this.$set(this.documentAnnotations, doc.id, response.data.results || []);
            } catch (error) {
              console.error(`Error fetching annotations for document ${doc.id}:`, error);
            }
          }
        } else {
          this.$store.commit('SET_PROJECT_LABELS', []);
        }
      } catch (error) {
        this.$store.commit('SET_ERROR', error.message || 'Error loading documents');
        console.error('Error in handleProjectChange:', error);
      } finally {
        this.$store.commit('SET_LOADING', false);
      }
    },
    getAnnotationsForLabel(docId, labelId) {
      const docAnnotations = this.documentAnnotations[docId] || [];
      console.log('Getting annotations for doc', docId, 'label', labelId, ':', docAnnotations);
      // Filter annotations by label ID from the nested label object
      return docAnnotations.filter(annotation => {
        return annotation.label && annotation.label.id === labelId;
      }).map(annotation => ({
        ...annotation,
        value: annotation.offset_string || annotation.normalized || '-',
        is_correct: annotation.is_correct || false,
        revised: annotation.revised || false
      }));
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
    async saveNewAnnotation(docId, labelId) {
      const annotationText = this.newAnnotations[`${docId}-${labelId}`];
      if (!annotationText) return;

      try {
        // Create a span object for the annotation
        const span = {
          offset_string: annotationText,
          page_index: 0,  // Default to first page
          x0: 0,
          x1: 0,
          y0: 0,
          y1: 0,
          start_offset: 0,
          end_offset: annotationText.length,
          is_custom: true
        };

        // Get the document to access its annotation sets
        const docResponse = await api.getDocumentById(docId);
        const document = docResponse.data;
        
        // Find the appropriate annotation set for this label
        let annotationSet = null;
        if (document.annotation_sets && document.annotation_sets.length > 0) {
          annotationSet = document.annotation_sets.find(set => 
            set.labels && set.labels.some(label => label.id === labelId)
          );
          
          // If no matching annotation set found, use the first one
          if (!annotationSet && document.annotation_sets[0]) {
            annotationSet = document.annotation_sets[0];
          }
        }

        const annotationToCreate = {
          document: docId,
          span: [span],  // API expects an array of spans
          label: labelId,
          is_correct: true,
          revised: false
        };

        // Only set one of annotation_set or label_set, never both
        if (annotationSet && annotationSet.id) {
          annotationToCreate.annotation_set = annotationSet.id;
        } else if (annotationSet && annotationSet.label_set) {
          annotationToCreate.label_set = annotationSet.label_set.id;
        } else {
          throw new Error('No valid annotation set or label set found for document');
        }

        console.log('Creating annotation with:', annotationToCreate);
        
        // Create the annotation
        await api.createAnnotation(annotationToCreate);

        // Clear the input
        this.$set(this.newAnnotations, `${docId}-${labelId}`, '');
        
        // Refresh annotations for this document
        await this.fetchDocumentAnnotations(docId);
      } catch (error) {
        console.error('Error creating annotation:', error);
        this.$store.commit('SET_ERROR', 'Failed to create annotation');
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
  min-height: 40px;
  padding: 4px;
  vertical-align: top;
}

.annotation-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 32px;
}

.annotation {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  margin: 0;
  background-color: #f5f5f5;
  border-radius: 4px;
  font-size: 0.875rem;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.annotation-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.no-annotation {
  color: #999;
  font-style: italic;
  line-height: 32px;
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
  color: #666;
  flex-shrink: 0;
}

.annotation-status.correct {
  color: #388e3c;
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

.new-annotation-input {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
}

.new-annotation-input input {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.875rem;
  height: 28px;
}

.save-icon {
  background: none;
  border: none;
  color: #2c3e50;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
  width: 24px;
  height: 24px;
  border-radius: 4px;
}

.save-icon:hover:not(:disabled) {
  color: #1976d2;
  background-color: rgba(25, 118, 210, 0.1);
}

.save-icon:disabled {
  color: #ccc;
  cursor: not-allowed;
  background: none;
}

.save-icon i {
  font-size: 0.875rem;
}
</style> 