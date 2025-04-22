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
                  <div v-if="isLoadingAll || loadingAnnotations[doc.id]" class="loading-spinner">
                    <div class="spinner"></div>
                  </div>
                  <template v-else-if="!isLoadingAll && !loadingAnnotations[doc.id]">
                    <div v-if="getAnnotationForLabelSet(doc, label)" class="annotation">
                      {{ getAnnotationForLabelSet(doc, label).span[0].offset_string }}
                      <span v-if="getAnnotationForLabelSet(doc, label).is_correct" class="status-icon correct">✓</span>
                      <span v-if="getAnnotationForLabelSet(doc, label).revised" class="status-icon revised">↺</span>
                      <button 
                        class="delete-btn"
                        @click="deleteAnnotation(doc.id, getAnnotationForLabelSet(doc, label).id)"
                        title="Delete annotation"
                      >
                        ×
                      </button>
                    </div>
                    <div v-else class="annotation-input">
                      <input 
                        type="text" 
                        v-model="newAnnotations[`${doc.id}-${label.id}`]"
                        placeholder="Add annotation..."
                        @keyup.enter="saveNewAnnotation(doc.id, label.id)"
                      />
                      <button 
                        class="save-btn"
                        @click="saveNewAnnotation(doc.id, label.id)"
                        :disabled="!newAnnotations[`${doc.id}-${label.id}`]"
                        title="Save annotation"
                      >
                        ✓
                      </button>
                    </div>
                  </template>
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
      newAnnotations: {},
      loadingAnnotations: {},  // Track loading state per document
      isLoadingAll: false     // Track global loading state for initial load
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
        this.$set(this.loadingAnnotations, docId, true);
        const response = await api.getDocumentAnnotations(docId);
        console.log('Annotations for document', docId, ':', response.data);
        // The v3 endpoint returns a paginated response with results array
        this.$set(this.documentAnnotations, docId, response.data.results || []);
      } catch (error) {
        console.error(`Error fetching annotations for document ${docId}:`, error);
        this.$set(this.documentAnnotations, docId, []);
      } finally {
        this.$set(this.loadingAnnotations, docId, false);
      }
    },
    async fetchAnnotationsForCurrentDocuments() {
      if (this.selectedProject && this.documents.length > 0) {
        this.isLoadingAll = true;  // Set global loading state
        try {
          for (const doc of this.documents) {
            await this.fetchDocumentAnnotations(doc.id);
          }
        } finally {
          this.isLoadingAll = false;  // Clear global loading state
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
        this.loadingAnnotations = {};  // Reset loading states
        this.isLoadingAll = true;      // Set global loading state
        
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
            await this.fetchDocumentAnnotations(doc.id);
          }
        } else {
          this.$store.commit('SET_PROJECT_LABELS', []);
        }
      } catch (error) {
        this.$store.commit('SET_ERROR', error.message || 'Error loading documents');
        console.error('Error in handleProjectChange:', error);
      } finally {
        this.$store.commit('SET_LOADING', false);
        this.isLoadingAll = false;  // Clear global loading state
      }
    },
    getAnnotationForLabelSet(doc, label) {
      const docAnnotations = this.documentAnnotations[doc.id] || [];
      console.log('Getting annotations for doc', doc.id, 'label', label.id, ':', docAnnotations);
      // Filter annotations by label ID from the nested label object
      const annotation = docAnnotations.find(annotation => {
        console.log('Checking annotation:', annotation);
        return annotation.label && annotation.label.id === label.id;
      });
      console.log('Found annotation:', annotation);
      return annotation;
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
        
        // Only reload annotations for this specific document
        await this.fetchDocumentAnnotations(docId);
      } catch (error) {
        console.error('Error creating annotation:', error);
        this.$store.commit('SET_ERROR', 'Failed to create annotation');
      }
    },
    async deleteAnnotation(docId, annotationId) {
      try {
        await api.deleteAnnotation(annotationId);
        // Only reload annotations for this specific document
        await this.fetchDocumentAnnotations(docId);
      } catch (error) {
        console.error('Error deleting annotation:', error);
        this.$store.commit('SET_ERROR', 'Failed to delete annotation');
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
  position: relative;
  min-height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 24px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.annotation {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  background-color: #f8f9fa;
  border-radius: 4px;
  font-size: 0.9em;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.delete-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: none;
  background: none;
  color: #dc3545;
  cursor: pointer;
  font-size: 1.2em;
  padding: 0;
  margin-left: 4px;
  border-radius: 50%;
  transition: all 0.2s;
}

.delete-btn:hover {
  background-color: rgba(220, 53, 69, 0.1);
}

.no-annotation {
  color: #6c757d;
  font-style: italic;
}

.status-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  font-size: 0.8em;
}

.status-icon.correct {
  background-color: #28a745;
  color: white;
}

.status-icon.revised {
  background-color: #ffc107;
  color: #212529;
}

.annotation-input {
  display: flex;
  gap: 4px;
  width: 100%;
}

.annotation-input input {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9em;
  min-width: 0;
}

.save-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
  padding: 0;
  transition: all 0.2s;
}

.save-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  opacity: 0.5;
}

.save-btn:not(:disabled):hover {
  background-color: #218838;
  transform: scale(1.1);
}
</style> 