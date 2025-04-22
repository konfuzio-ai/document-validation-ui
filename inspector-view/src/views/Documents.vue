<template>
  <div class="documents">
    <h1>Documents</h1>
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <div class="table-controls">
        <div class="filters">
          <DocumentUpload 
            :selected-project="selectedProject"
            @document-uploaded="handleDocumentUploaded" 
            @upload-error="handleUploadError" 
          />
          <div class="project-filter">
            <label for="project-select">Project:</label>
            <select 
              id="project-select" 
              v-model="selectedProject" 
              @change="handleProjectChange"
              class="project-select"
            >
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
      <div class="documents-wrapper">
        <table class="documents-table">
          <thead>
            <tr>
              <th rowspan="3" @click="sortBy('id')">
                ID
                <span v-if="sortKey === 'id'" :class="sortOrder === 'asc' ? 'asc' : 'desc'">▼</span>
              </th>
              <th rowspan="3" @click="sortBy('name')">
                Name
                <span v-if="sortKey === 'name'" :class="sortOrder === 'asc' ? 'asc' : 'desc'">▼</span>
              </th>
              <th rowspan="3" @click="sortBy('created')">
                Created
                <span v-if="sortKey === 'created'" :class="sortOrder === 'asc' ? 'asc' : 'desc'">▼</span>
              </th>
              <th rowspan="3" @click="sortBy('status')">
                Status
                <span v-if="sortKey === 'status'" :class="sortOrder === 'asc' ? 'asc' : 'desc'">▼</span>
              </th>
              <template v-if="selectedProject && labelSets.length > 0">
                <th v-for="(category, categoryIndex) in labelSets" 
                    :key="`category-${category.id}`"
                    :colspan="getCategoryColspan(category)"
                    :style="{ 
                      backgroundColor: getLabelSetBackground(category.id, 0),
                      borderBottom: '1px solid #dee2e6'
                    }">
                  {{ category.name }}
                </th>
              </template>
              <th rowspan="3">Actions</th>
            </tr>
            <tr>
              <template v-if="selectedProject && labelSets.length > 0">
                <template v-for="(category, categoryIndex) in labelSets">
                  <th v-for="(labelSet, labelSetIndex) in category.labels" 
                      :key="`header-${category.id}-${labelSet.id}`"
                      :colspan="isLabelSetCollapsed(category.id, labelSetIndex) ? 1 : labelSet.labels.length"
                      :style="{ 
                        backgroundColor: getLabelSetBackground(category.id, labelSetIndex),
                        borderBottom: '1px solid #dee2e6'
                      }"
                      class="label-set-header">
                    <div class="label-set-title">
                      <span>{{ labelSet.name }}</span>
                      <button 
                        class="collapse-btn"
                        @click.stop="toggleLabelSet(category.id, labelSetIndex)"
                        :title="isLabelSetCollapsed(category.id, labelSetIndex) ? 'Expand' : 'Collapse'"
                      >
                        {{ isLabelSetCollapsed(category.id, labelSetIndex) ? '►' : '▼' }}
                      </button>
                    </div>
                  </th>
                </template>
              </template>
            </tr>
            <tr>
              <template v-if="selectedProject && labelSets.length > 0">
                <template v-for="(category, categoryIndex) in labelSets">
                  <template v-for="(labelSet, labelSetIndex) in category.labels">
                    <template v-if="!isLabelSetCollapsed(category.id, labelSetIndex)">
                      <th v-for="label in labelSet.labels" 
                          :key="`label-${category.id}-${labelSet.id}-${label.id}`"
                          :style="{ 
                            backgroundColor: getLabelSetBackground(category.id, labelSetIndex),
                            borderBottom: 'none'
                          }">
                        {{ label.name }}
                      </th>
                    </template>
                    <th v-else
                        :key="`collapsed-${category.id}-${labelSet.id}`"
                        :style="{ 
                          backgroundColor: getLabelSetBackground(category.id, labelSetIndex),
                          borderBottom: 'none'
                        }">
                      {{ labelSet.labels.length }} labels
                    </th>
                  </template>
                </template>
              </template>
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
              <template v-if="selectedProject && labelSets.length > 0">
                <template v-for="(category, categoryIndex) in labelSets">
                  <template v-for="(labelSet, labelSetIndex) in category.labels">
                    <template v-if="!isLabelSetCollapsed(category.id, labelSetIndex)">
                      <td v-for="label in labelSet.labels" 
                          :key="`annotation-${doc.id}-${category.id}-${labelSet.id}-${label.id}`"
                          class="annotation-cell"
                          :style="{ backgroundColor: getLabelSetBackground(category.id, labelSetIndex) }">
                        <div class="annotation-container">
                          <div v-if="isLoadingAll || loadingAnnotations[doc.id]" class="loading-spinner">
                            <div class="spinner"></div>
                          </div>
                          <template v-else-if="!isLoadingAll && !loadingAnnotations[doc.id]">
                            <div v-if="getAnnotationForLabel(doc, label)" class="annotation">
                              <span class="annotation-text" :title="getAnnotationForLabel(doc, label).span[0].offset_string">
                                {{ getAnnotationForLabel(doc, label).span[0].offset_string }}
                              </span>
                              <button 
                                class="delete-btn"
                                @click="deleteAnnotation(doc.id, getAnnotationForLabel(doc, label).id)"
                                @mouseenter="showTooltip($event, 'Delete')"
                                @mouseleave="hideTooltip"
                              >×</button>
                            </div>
                            <div v-else class="empty-annotation" @click="startEditing(doc.id, label.id)">
                              <template v-if="isEditing(`${doc.id}-${label.id}`)">
                                <div class="annotation-input">
                                  <input 
                                    type="text" 
                                    v-model="newAnnotations[`${doc.id}-${label.id}`]"
                                    placeholder="Type + Enter"
                                    @keyup.enter="saveNewAnnotation(doc.id, label.id)"
                                    @keyup.esc="cancelEditing(doc.id, label.id)"
                                    @blur="cancelEditing(doc.id, label.id)"
                                    v-focus
                                  />
                                </div>
                              </template>
                              <template v-else>
                                <button class="add-btn" @mouseenter="showTooltip($event, 'Add annotation')" @mouseleave="hideTooltip">
                                  <span class="plus-icon">+</span>
                                </button>
                              </template>
                            </div>
                          </template>
                        </div>
                      </td>
                    </template>
                    <td v-else
                        :key="`collapsed-annotation-${doc.id}-${category.id}-${labelSet.id}`"
                        class="annotation-cell collapsed"
                        :style="{ backgroundColor: getLabelSetBackground(category.id, labelSetIndex) }">
                      <div class="collapsed-summary">
                        {{ getCollapsedLabelSetSummary(doc, labelSet) }}
                      </div>
                    </td>
                  </template>
                </template>
              </template>
              <td>
                <button @click="viewDocument(doc.id)" class="view-btn">View</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
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
    <div v-if="tooltipText" class="tooltip-container" :style="tooltipStyle">
      {{ tooltipText }}
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import AuthImage from '../components/AuthImage.vue'
import DocumentUpload from '../components/DocumentUpload.vue'
import api from '../api'

export default {
  name: 'Documents',
  components: {
    AuthImage,
    DocumentUpload
  },
  data() {
    return {
      sortKey: 'id',
      sortOrder: 'desc',
      pageSizeOptions: [10, 25, 50, 100],
      activePreview: null,
      selectedProject: '',
      documentAnnotations: {},
      newAnnotations: {},
      loadingAnnotations: {},
      isLoadingAll: false,
      tooltipText: '',
      tooltipStyle: {
        top: '0px',
        left: '0px'
      },
      editingCells: new Set(),
      categoryColors: {},
      collapsedLabelSets: new Set(),
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
        
        // For ID sorting, always use descending order
        if (this.sortKey === 'id') {
          return bVal - aVal
        }
        
        if (this.sortOrder === 'asc') {
          return aVal > bVal ? 1 : -1
        }
        return aVal < bVal ? 1 : -1
      })
    }
  },
  methods: {
    ...mapActions(['fetchDocuments', 'fetchDocument', 'fetchProjects', 'fetchProjectLabels', 'fetchLabelSets']),
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
        // For ID column, always keep descending order
        if (key === 'id') {
          return;
        }
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc'
      } else {
        this.sortKey = key
        this.sortOrder = 'asc'
      }
    },
    viewDocument(id) {
      const baseUrl = process.env.VUE_APP_API_URL || 'https://app.konfuzio.com/api/v3';
      // Remove /api/v3 from the end if present
      const hostUrl = baseUrl.replace(/\/api\/v3\/?$/, '');
      const url = `${hostUrl}/d/${id}`;
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
          // Create an array of promises for parallel execution
          const annotationPromises = this.documents.map(doc => this.fetchDocumentAnnotations(doc.id));
          // Wait for all promises to resolve
          await Promise.all(annotationPromises);
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
        
        // Fetch project labels and label sets if a project is selected
        if (this.selectedProject) {
          // Run these operations in parallel
          await Promise.all([
            this.fetchProjectLabels(this.selectedProject),
            this.fetchLabelSets(this.selectedProject),
            this.fetchAnnotationsForCurrentDocuments()
          ]);
        } else {
          this.$store.commit('SET_PROJECT_LABELS', []);
          this.$store.commit('SET_LABEL_SETS', []);
        }
      } catch (error) {
        this.$store.commit('SET_ERROR', error.message || 'Error loading documents');
        console.error('Error in handleProjectChange:', error);
      } finally {
        this.$store.commit('SET_LOADING', false);
        this.isLoadingAll = false;  // Clear global loading state
      }
    },
    getAnnotationForLabel(doc, label) {
      const docAnnotations = this.documentAnnotations[doc.id] || [];
      console.log('Getting annotations for doc', doc.id, 'label', label.id, ':', docAnnotations);
      // Filter annotations by label ID
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
      const key = `${docId}-${labelId}`;
      if (!this.newAnnotations[key]) return;

      try {
        // Create a span object for the annotation
        const span = {
          offset_string: this.newAnnotations[key],
          page_index: 0,  // Default to first page
          x0: 0,
          x1: 0,
          y0: 0,
          y1: 0,
          start_offset: 0,
          end_offset: this.newAnnotations[key].length,
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
        const response = await api.createAnnotation(annotationToCreate);
        console.log('Annotation created:', response.data);

        // Clear the input
        this.$set(this.newAnnotations, key, '');
        
        // Immediately update the local annotations data structure
        if (!this.documentAnnotations[docId]) {
          this.$set(this.documentAnnotations, docId, []);
        }
        this.documentAnnotations[docId].push(response.data);
        
        // Exit editing mode
        this.editingCells.delete(key);

        // Force a re-render of the table
        this.$nextTick(() => {
          this.$forceUpdate();
        });

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
    },
    handleDocumentUploaded(document) {
      // Document was successfully uploaded, the list will be refreshed automatically
      console.log('Document uploaded successfully:', document)
    },
    handleUploadError(error) {
      console.error('Error uploading document:', error)
      // You might want to show an error message to the user here
    },
    getCategoryColspan(category) {
      return category.labels.reduce((total, labelSet, labelSetIndex) => {
        return total + (this.isLabelSetCollapsed(category.id, labelSetIndex) ? 1 : labelSet.labels.length);
      }, 0);
    },
    showTooltip(event, text) {
      this.tooltipText = text;
      const rect = event.target.getBoundingClientRect();
      this.tooltipStyle = {
        top: `${rect.top - 30}px`,
        left: `${rect.left + (rect.width / 2)}px`,
        transform: 'translateX(-50%)'
      };
    },
    hideTooltip() {
      this.tooltipText = '';
    },
    startEditing(docId, labelId) {
      const key = `${docId}-${labelId}`;
      this.editingCells.add(key);
      this.$nextTick(() => {
        // Clear any existing value
        this.newAnnotations[key] = '';
      });
    },
    cancelEditing(docId, labelId) {
      const key = `${docId}-${labelId}`;
      this.editingCells.delete(key);
      this.newAnnotations[key] = '';
    },
    isEditing(key) {
      return this.editingCells.has(key);
    },
    generateCategoryColors() {
      const baseColors = [
        { h: 200, s: 45 }, // Light blue
        { h: 150, s: 45 }, // Light green
        { h: 25, s: 45 },  // Light orange
        { h: 280, s: 35 }, // Light purple
        { h: 340, s: 35 }, // Light pink
        { h: 45, s: 45 },  // Light yellow
        { h: 170, s: 40 }, // Light teal
        { h: 0, s: 40 }    // Light red
      ];

      this.labelSets.forEach((category, index) => {
        const baseColor = baseColors[index % baseColors.length];
        this.categoryColors[category.id] = baseColor;
      });

      console.log('Generated category colors:', this.categoryColors);
    },
    getLabelSetBackground(categoryId, labelSetIndex) {
      const baseColor = this.categoryColors[categoryId];
      if (!baseColor) {
        console.log('No color found for category:', categoryId);
        return '#f8f9fa';
      }

      const baseLightness = 92; // Slightly darker base
      const lightnessStep = 4;  // Bigger step for more contrast
      const saturationBoost = labelSetIndex * 5; // Increase saturation for each label set
      const lightness = baseLightness - (labelSetIndex * lightnessStep);
      const saturation = Math.min(baseColor.s + saturationBoost, 60); // Cap saturation at 60%

      const color = `hsl(${baseColor.h}, ${saturation}%, ${lightness}%)`;
      console.log('Generated color for category', categoryId, 'labelSet', labelSetIndex, ':', color);
      return color;
    },
    isLabelSetCollapsed(categoryId, labelSetIndex) {
      return this.collapsedLabelSets.has(`${categoryId}-${labelSetIndex}`);
    },
    toggleLabelSet(categoryId, labelSetIndex) {
      const key = `${categoryId}-${labelSetIndex}`;
      if (this.collapsedLabelSets.has(key)) {
        this.collapsedLabelSets.delete(key);
      } else {
        this.collapsedLabelSets.add(key);
      }
      // Force a re-render of the table
      this.$nextTick(() => {
        this.$forceUpdate();
      });
    },
    getCollapsedLabelSetSummary(doc, labelSet) {
      const annotations = labelSet.labels
        .map(label => this.getAnnotationForLabel(doc, label))
        .filter(Boolean);
      return annotations.length ? `${annotations.length} annotations` : '-';
    },
  },
  watch: {
    labelSets: {
      handler(newSets) {
        if (newSets && newSets.length > 0) {
          this.generateCategoryColors();
        }
      },
      immediate: true
    }
  },
  created() {
    this.fetchProjects().then(() => {
      if (this.projects.length > 0) {
        this.selectedProject = this.projects[0].id;
        this.handleProjectChange();
      }
    });
  },
  directives: {
    focus: {
      mounted(el) {
        el.focus()
      }
    }
  }
}
</script>

<style scoped>
.documents {
  padding: 20px;
  max-width: 100%;
  overflow-x: auto;
}

.documents-wrapper {
  min-width: 150%;  /* Make table wider than screen */
  padding-bottom: 20px;  /* Add space for scrollbar */
}

.loading, .error {
  text-align: center;
  padding: 20px;
}

.error {
  color: red;
}

.documents-table {
  table-layout: fixed;
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
  font-size: 0.85em;
}

.documents-table th,
.documents-table td {
  padding: 6px 8px;
  text-align: left;
  border-bottom: 1px solid #ddd;
  border-right: 1px solid #eee;  /* Add vertical borders */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Fixed widths for the first columns */
.documents-table th:nth-child(1),
.documents-table td:nth-child(1) {
  width: 80px;  /* Increased from 60px */
}

.documents-table th:nth-child(2),
.documents-table td:nth-child(2) {
  width: 200px;  /* Increased from 140px */
}

.documents-table th:nth-child(3),
.documents-table td:nth-child(3) {
  width: 160px;  /* Increased from 120px */
}

.documents-table th:nth-child(4),
.documents-table td:nth-child(4) {
  width: 140px;  /* Increased from 100px */
}

.documents-table th:last-child,
.documents-table td:last-child {
  width: 100px;  /* Increased from 80px */
}

/* Ensure annotation cells have consistent width */
.annotation-cell {
  width: 180px;
  min-width: 180px;
  max-width: 180px;
  padding: 4px 8px;
  vertical-align: top;
  box-sizing: border-box;
  transition: background-color 0.2s ease;
}

.annotation-container {
  width: 100%;
  position: relative;
  min-height: 32px;
  display: flex;
  align-items: center;
}

.annotation {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background-color: white;
  border-radius: 4px;
  font-size: 0.9em;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.annotation-text {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.delete-btn {
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 4px;
  background: none;
  color: #dc3545;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
  opacity: 0.6;
  transition: all 0.2s ease;
}

.delete-btn:hover {
  opacity: 1;
  background-color: rgba(220, 53, 69, 0.1);
}

.annotation-input {
  width: 100%;
  max-width: 120px;
  display: flex;
  animation: fadeIn 0.2s ease;
}

.annotation-input input {
  width: 80px;
  min-width: 0;
  padding: 2px 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  font-size: 0.9em;
  background-color: white;
}

.annotation-input input:focus {
  outline: none;
  border-color: rgba(0, 0, 0, 0.2);
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.05);
}

.add-btn {
  width: 20px;
  height: 20px;
  border: 1px dashed rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  background: white;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 14px;
  opacity: 0.6;
}

.add-btn:hover {
  opacity: 1;
  border-color: rgba(0, 0, 0, 0.3);
  color: #333;
  background-color: white;
}

.empty-annotation {
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.add-btn {
  width: 20px;
  height: 20px;
  border: 1px dashed rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  background: white;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 14px;
  opacity: 0.6;
}

.add-btn:hover {
  opacity: 1;
  border-color: rgba(0, 0, 0, 0.3);
  color: #333;
  background-color: white;
}

.annotation-input {
  width: 100%;
  max-width: 120px;
  display: flex;
  animation: fadeIn 0.2s ease;
}

.annotation-input input {
  width: 80px;
  min-width: 0;
  padding: 2px 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  font-size: 0.9em;
  background-color: white;
}

.annotation-input input:focus {
  outline: none;
  border-color: rgba(0, 0, 0, 0.2);
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.05);
}

.delete-btn {
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 4px;
  background: none;
  color: #dc3545;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
  opacity: 0.6;
  transition: all 0.2s ease;
}

.delete-btn:hover {
  opacity: 1;
  background-color: rgba(220, 53, 69, 0.1);
}

/* Add borders to cells */
.annotation-cell {
  border-right: 1px solid rgba(0, 0, 0, 0.05);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

/* Hover effect for cells */
.annotation-cell:hover {
  filter: brightness(0.98);
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

.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 32px;
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

/* Add horizontal scrollbar styles */
.documents::-webkit-scrollbar {
  height: 12px;
}

.documents::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 6px;
}

.documents::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 6px;
}

.documents::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* Status indicators for accepted/declined state */
.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.85em;
  font-weight: 500;
}

.status-indicator.accepted {
  background-color: rgba(40, 167, 69, 0.1);
  color: #28a745;
}

.status-indicator.declined {
  background-color: rgba(220, 53, 69, 0.1);
  color: #dc3545;
}

.documents-table th {
  padding: 12px;
  text-align: left;
  font-weight: 500;
  border-bottom: 1px solid #dee2e6;
  position: relative;
  transition: background-color 0.2s ease;
}

.documents-table th[rowspan="3"] {
  background-color: #f8f9fa;
  font-weight: 600;
  vertical-align: middle;
  border-right: 1px solid #dee2e6;
}

.documents-table thead tr:first-child th {
  font-weight: 600;
}

.documents-table thead tr:nth-child(2) th {
  font-weight: 500;
}

.documents-table thead tr:last-child th {
  font-weight: 400;
}

/* Add subtle text shadow for better readability on colored backgrounds */
.documents-table th {
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.5);
}

/* Add subtle border between categories */
.documents-table th[colspan] {
  border-right: 1px solid rgba(0, 0, 0, 0.05);
}

.label-set-header {
  position: relative;
  padding-right: 30px !important;
}

.label-set-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.collapse-btn {
  background: none;
  border: none;
  color: rgba(0, 0, 0, 0.5);
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  transition: all 0.2s ease;
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
}

.collapse-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: rgba(0, 0, 0, 0.8);
}

.annotation-cell.collapsed {
  text-align: center;
}

.collapsed-summary {
  font-size: 0.85em;
  color: rgba(0, 0, 0, 0.6);
  padding: 4px;
}
</style> 