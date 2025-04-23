# Document Validation UI Codebase Summary

## Core Components

### Documents.vue
Main component for document management and annotation.

#### Key Features
- Document listing and management
- Project selection and filtering
- Annotation management
- Document preview
- Status tracking

#### Data Structure
```javascript
{
  sortKey: 'id',
  sortOrder: 'desc',
  pageSizeOptions: [10, 25, 50, 100],
  selectedProject: '',
  documentAnnotations: {}, // Map of docId -> annotations
  newAnnotations: {},     // Map of docId-labelId -> annotation text
  loadingAnnotations: {}, // Map of docId -> loading state
  categoryColors: {},     // Map of categoryId -> color
  collapsedLabelSets: new Set()
}
```

#### Key Methods
- `handleProjectChange()`: Fetches documents and annotations when project changes
- `fetchDocumentAnnotations()`: Gets annotations for a specific document
- `getAnnotationForLabel()`: Finds annotation for a specific label
- `saveNewAnnotation()`: Creates new annotation
- `deleteAnnotation()`: Removes an annotation
- `generateCategoryColors()`: Assigns colors to categories

### API Integration
- Uses Vuex for state management
- API endpoints:
  - `/documents/` - Document management
  - `/projects/` - Project management
  - `/annotations/` - Annotation management
  - `/categories/` - Category management

### State Management
Vuex store modules:
- Documents
- Projects
- Annotations
- Categories

## Data Flow

1. Project Selection
   ```
   User selects project
   → handleProjectChange()
   → fetchDocuments()
   → fetchProjectLabels()
   → fetchLabelSets()
   → fetchAnnotationsForCurrentDocuments()
   ```

2. Annotation Management
   ```
   Add Annotation:
   User clicks add → startEditing()
   → User enters text → saveNewAnnotation()
   → API call → Update local state

   Delete Annotation:
   User clicks delete → deleteAnnotation()
   → API call → Refresh annotations
   ```

## UI Components

### DocumentUpload.vue
- Handles document file uploads
- Supports drag and drop
- Shows upload progress

### AuthImage.vue
- Secure image loading component
- Handles authentication for image access

## Styling
- Uses SCSS for styling
- Responsive design
- Color-coded categories
- Collapsible sections
- Loading states and animations

## Key Features to Maintain

1. Document Management
   - List view with sorting
   - Project filtering
   - Pagination
   - Status tracking

2. Annotation System
   - Category-based organization
   - Label set management
   - Add/Edit/Delete annotations
   - Color coding

3. User Experience
   - Loading states
   - Error handling
   - Responsive design
   - Preview functionality

## Common Issues and Solutions

1. Category Display
   - Categories are fetched with projects
   - Stored in Vuex store
   - Color-coded for visual distinction

2. Annotation Management
   - Annotations are fetched per document
   - Cached in component state
   - Updated on changes

3. Performance
   - Pagination for large datasets
   - Lazy loading of annotations
   - Efficient state updates

## Development Guidelines

1. State Management
   - Use Vuex for global state
   - Component state for UI
   - Proper error handling

2. API Integration
   - Consistent error handling
   - Loading states
   - Data validation

3. UI/UX
   - Responsive design
   - Clear loading states
   - Intuitive interactions

4. Code Organization
   - Component-based structure
   - Clear method naming
   - Proper documentation

## Recent Improvements

1. API Integration
   - Added missing `getCategories` method to API client
   - Improved error handling in API methods
   - Standardized API response handling

2. UI/UX Enhancements
   - Improved error display with retry button
   - Enhanced loading spinner for better visibility
   - Better loading state management

3. Code Organization
   - Removed duplicate methods
   - Improved method sequencing for better performance
   - Added detailed logging for debugging

## Potential Breaking Points

1. API Dependencies
   - Changes to API response structure can break data handling
   - Missing or renamed API endpoints will cause failures
   - Authentication token expiration can break all API calls
   - Rate limiting can cause unexpected behavior

2. Data Structure Assumptions
   - The code assumes certain properties exist on objects (e.g., `doc.id`, `label.id`)
   - Changes to the document or annotation structure can break rendering
   - Missing or null values in nested objects can cause errors
   - Incorrect data types (e.g., string vs number for IDs) can cause comparison issues

3. Vue Reactivity Issues
   - Direct array mutations can break reactivity
   - Using `this.$set` incorrectly can cause components not to update
   - Watchers with deep watching on large objects can cause performance issues
   - Circular dependencies in computed properties can cause infinite loops

4. Component Lifecycle
   - Race conditions between async operations can cause state inconsistencies
   - Components unmounting during API calls can cause memory leaks
   - Watchers not being properly cleaned up can cause memory leaks
   - Multiple rapid project changes can cause overlapping API calls

5. Browser Compatibility
   - CSS features like CSS Grid or Flexbox might not work in older browsers
   - JavaScript features like async/await might need polyfills
   - File API usage might differ across browsers
   - Event handling differences between browsers

6. Performance Bottlenecks
   - Large datasets without proper pagination can cause UI freezes
   - Too many simultaneous API calls can overwhelm the server
   - Complex DOM manipulations can cause rendering delays
   - Memory leaks from not cleaning up event listeners or watchers

7. Authentication and Authorization
   - Token expiration can break all authenticated requests
   - Missing permissions can cause UI elements to fail silently
   - CORS issues can prevent API calls from succeeding
   - Session timeouts can cause unexpected behavior

8. Third-Party Dependencies
   - Updates to Vue or Vuex can introduce breaking changes
   - Changes to browser APIs can affect functionality
   - Network issues can prevent loading of external resources
   - CDN failures can prevent loading of dependencies

## AI Validation Test Cases

These verbal test cases can be used by AI to validate changes to the codebase:

### Project Selection and Document Loading
1. "When a user selects a project from the dropdown, the documents list should update to show only documents from that project."
2. "After selecting a project, the label sets and categories should be loaded and displayed in the table header."
3. "If no projects are available, the dropdown should be disabled and show a message."
4. "When changing projects, any existing annotations should be cleared before loading new ones."

### Document Display and Sorting
1. "Documents should be displayed in a table with columns for ID, Name, Created date, and Status."
2. "Clicking on a column header should sort the documents by that column."
3. "Clicking the same column header again should reverse the sort order."
4. "The ID column should always sort in descending order by default."
5. "Document names should be clickable to show a preview of the document."

### Annotation Management
1. "Each document should have cells for annotations based on the label sets in the selected project."
2. "Empty annotation cells should show a plus button to add new annotations."
3. "Clicking the plus button should allow entering text for a new annotation."
4. "After saving a new annotation, it should appear in the cell and be stored in the backend."
5. "Existing annotations should have a delete button to remove them."
6. "Deleting an annotation should remove it from both the UI and the backend."

### Category and Label Set Display
1. "Categories should be displayed as column groups in the table header."
2. "Each category should have a distinct color for visual identification."
3. "Label sets within categories should be collapsible."
4. "Collapsing a label set should show a summary of annotations instead of individual cells."
5. "The colspan of category headers should adjust based on whether label sets are collapsed."

### Pagination and Performance
1. "The documents table should support pagination with configurable page size."
2. "Changing the page size should reload the documents with the new limit."
3. "Navigating between pages should maintain the current sort order and filters."
4. "Loading states should be displayed while fetching documents or annotations."
5. "The UI should remain responsive even when loading large numbers of documents."

### Error Handling
1. "If an API call fails, an error message should be displayed to the user."
2. "Network errors should not crash the application but show appropriate error states."
3. "Invalid data from the API should be handled gracefully with fallback values."
4. "Authentication errors should redirect to the login page or show a login prompt."

### Responsive Design
1. "The table should be horizontally scrollable on smaller screens."
2. "Column widths should adjust based on content and available space."
3. "The document preview should be responsive and work on different screen sizes."
4. "UI elements should remain usable on mobile devices."

### Data Integrity
1. "Changes to annotations should be immediately reflected in the UI."
2. "If a document is updated by another user, the changes should be visible after refreshing."
3. "Deleting a document should remove it from the list without requiring a page reload."
4. "Adding a new document should add it to the list in the correct sort order."

### Edge Cases
1. "The application should handle documents with no annotations gracefully."
2. "Empty or null values in document properties should display as '-' instead of blank."
3. "Very long document names or annotation texts should be truncated with ellipsis."
4. "The application should handle rapid user interactions without breaking."
5. "Concurrent edits to the same annotation should be handled properly." 