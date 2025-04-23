<template>
  <div v-if="show" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>Annotation Sets for {{ documentName }}</h2>
        <button class="close-button" @click="closeModal">&times;</button>
      </div>
      <div class="modal-body">
        <table class="annotation-sets-table">
          <thead>
            <tr>
              <th>Set Name</th>
              <th>Labels</th>
              <th>Annotations Count</th>
              <th>Created</th>
              <th>Last Modified</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="set in annotationSets" :key="set.id">
              <td>{{ set.name || 'Unnamed Set' }}</td>
              <td>
                <div class="labels-container">
                  <span v-for="label in set.labels" 
                        :key="label.id" 
                        class="label-badge"
                        :style="{ backgroundColor: getLabelColor(label.id) }">
                    {{ label.name }}
                  </span>
                </div>
              </td>
              <td>{{ getAnnotationCount(set) }}</td>
              <td>{{ formatDate(set.created_at) }}</td>
              <td>{{ formatDate(set.updated_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AnnotationSetsModal',
  props: {
    show: {
      type: Boolean,
      required: true
    },
    documentId: {
      type: [String, Number],
      required: true
    },
    documentName: {
      type: String,
      required: true
    },
    annotationSets: {
      type: Array,
      required: true
    }
  },
  methods: {
    closeModal() {
      this.$emit('close')
    },
    formatDate(date) {
      if (!date) return '-'
      return new Date(date).toLocaleString()
    },
    getAnnotationCount(set) {
      return set.annotations ? set.annotations.length : 0
    },
    getLabelColor(labelId) {
      // Generate a consistent color based on label ID
      const hue = (labelId * 137.508) % 360 // Golden angle approximation
      return `hsl(${hue}, 70%, 85%)`
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 1200px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 16px 24px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5em;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  color: #666;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
}

.annotation-sets-table {
  width: 100%;
  border-collapse: collapse;
}

.annotation-sets-table th,
.annotation-sets-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.annotation-sets-table th {
  background-color: #f8f9fa;
  font-weight: 600;
}

.labels-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.label-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.85em;
  white-space: nowrap;
}
</style> 