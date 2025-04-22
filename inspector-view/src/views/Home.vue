<template>
  <div class="home">
    <h1>Welcome to the Inspector View</h1>
    <p class="intro">This is a standalone application that connects to the Konfuzio API.</p>
    
    <div class="card">
      <h2>Getting Started</h2>
      <p>To use this application, you need a valid API token from Konfuzio. Enter your token when prompted to access all features.</p>
      <div class="api-status">
        <div class="status-item">
          <span class="label">API URL:</span>
          <span class="value">{{ apiUrl }}</span>
        </div>
        <div class="status-item">
          <span class="label">Authentication:</span>
          <span class="value" :class="{ 'status-active': userToken }">
            {{ userToken ? 'Authenticated' : 'Not authenticated' }}
          </span>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>Document Management</h2>
      <div class="feature-list">
        <div class="feature">
          <h3>Document List</h3>
          <ul>
            <li>View all documents in a sortable table</li>
            <li>Sort by ID, Name, Created date, and Status</li>
            <li>Quick document preview on hover</li>
            <li>Configurable items per page</li>
            <li>Pagination controls for large document sets</li>
          </ul>
        </div>
        <div class="feature">
          <h3>Document Status</h3>
          <ul>
            <li>Visual status indicators for each document</li>
            <li>Status types include:
              <ul>
                <li>Queuing for OCR</li>
                <li>OCR in progress</li>
                <li>Extraction in progress</li>
                <li>Categorization in progress</li>
                <li>Splitting in progress</li>
                <li>Done</li>
                <li>Processing failed</li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>Project & Annotation Features</h2>
      <div class="feature-list">
        <div class="feature">
          <h3>Project Management</h3>
          <ul>
            <li>Filter documents by project</li>
            <li>Project-specific label sets</li>
            <li>Dynamic column generation based on project labels</li>
          </ul>
        </div>
        <div class="feature">
          <h3>Annotation Management</h3>
          <ul>
            <li>Create new annotations directly in the table</li>
            <li>Delete existing annotations</li>
            <li>Visual indicators for:
              <ul>
                <li>Correct annotations (✓)</li>
                <li>Revised annotations (↺)</li>
              </ul>
            </li>
            <li>Real-time annotation updates</li>
            <li>Support for custom annotations</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>Additional Features</h2>
      <div class="feature-list">
        <div class="feature">
          <h3>Document Viewing</h3>
          <ul>
            <li>Quick preview thumbnails</li>
            <li>Full document viewer in new tab</li>
            <li>Support for various document formats</li>
          </ul>
        </div>
        <div class="feature">
          <h3>User Interface</h3>
          <ul>
            <li>Responsive design</li>
            <li>Loading indicators for async operations</li>
            <li>Error handling and display</li>
            <li>Persistent token storage</li>
            <li>Clean and intuitive navigation</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'Home',
  computed: {
    ...mapState({
      apiUrl: state => state.apiUrl,
      userToken: state => state.userToken
    })
  }
}
</script>

<style lang="scss" scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  
  h1 {
    margin-bottom: 1rem;
    color: #2c3e50;
  }
  
  .intro {
    font-size: 1.1rem;
    color: #666;
    margin-bottom: 2rem;
  }
}

.card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 2rem;
  
  h2 {
    margin-top: 0;
    margin-bottom: 1.5rem;
    color: #41af85;
    border-bottom: 2px solid #f0f0f0;
    padding-bottom: 0.5rem;
  }
}

.api-status {
  .status-item {
    display: flex;
    margin-bottom: 0.5rem;
    
    .label {
      font-weight: bold;
      width: 120px;
    }
    
    .value {
      word-break: break-all;
      
      &.status-active {
        color: #41af85;
      }
    }
  }
}

.feature-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.feature {
  h3 {
    color: #2c3e50;
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1.2rem;
  }

  ul {
    list-style-type: none;
    padding-left: 0;
    margin: 0;

    li {
      margin-bottom: 0.5rem;
      position: relative;
      padding-left: 1.5rem;

      &:before {
        content: "•";
        color: #41af85;
        position: absolute;
        left: 0;
        font-weight: bold;
      }

      ul {
        margin-top: 0.5rem;
        padding-left: 1rem;

        li:before {
          content: "◦";
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .feature-list {
    grid-template-columns: 1fr;
  }
  
  .card {
    padding: 1rem;
  }
}
</style> 