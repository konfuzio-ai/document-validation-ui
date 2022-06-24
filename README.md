# Konfuzio Document View

(Under active development)

White-label widget that lets you upload your documents to [Konfuzio](https://konfuzio.com) and preview the results. Chrome, Firefox, Edge and Safari supported.

![Screenshot](http://raw.githubusercontent.com/konfuzio-ai/konfuzio-capture-vue/main/screenshot.png)

# **Requirements**

The widget requires `node` and `npm`.

# **Installation**

Follow the steps below to get the app running.

1. Clone this repository.
2. Run `npm install` in the project root.
3. Create a `.env` file in the project root with the properties from the `.env.example` file.
4. Run `npm run serve` to serve a local development app to run on a browser (default URL: http://localhost:3000).
5. (Optional) Run `npm run build` to build the app for production if you want to put it on a web server. After building, export the `dist` folder to the desired location.

# **Documentation**

This sample app is built using Vue.js and all the required components are inside the `app` folder.

## Vue Components

The entry point of the app is the `main.js` where the `App.vue` component is loaded. This component has the responsibility to tell the store to fetch API data and save it. While fetching the data, the main UI of the app is drawn on the `DocumentsList` and `DocumentDashboard` components.

## DocumentsList

![DocumentsList](http://raw.githubusercontent.com/konfuzio-ai/konfuzio-capture-vue/main/documents_list.gif)

This main component is responsible for loading the documents list for a given category. You can then select which document will appear on the dashboard.

By default, this feature is disabled: in order to use it, you will need to add an [authentication token](https://dev.konfuzio.com/web/api_v3.html#authentication) to the `.env` file alongside the category ID that you want to load.

## DocumentDashboard

This main component is divided into three components: `DocumentThumbnails`, `DocumentPage` and `DocumentAnnotations`.

### DocumentThumbnails

![DocumentThumbnails](http://raw.githubusercontent.com/konfuzio-ai/konfuzio-capture-vue/main/document_thumbnails.svg)

This is a simple component that loads the document images and displays them in a vertical list to act as a thumbnail selector. It is fully clickable and it updates its state automatically.

### DocumentPage

![DocumentPage](http://raw.githubusercontent.com/konfuzio-ai/konfuzio-capture-vue/main/document_page.svg)

This component is responsible for drawing the document and handling any interaction with it, like scrolling (`ScrollingDocument.vue`) and rendering a loading dummy page (`DummyPage.vue`). It also draws the bounding boxes for the existing annotations.

### DocumentAnnotations

![DocumentAnnotations](http://raw.githubusercontent.com/konfuzio-ai/konfuzio-capture-vue/main/document_annotations.svg)

This component is responsible for creating a tab bar container to interact with each label set on the project. For each label set selected, a list of labels and annotations is shown alongside with corresponding information.

## Store

The store is implemented using `Vuex` and is located under `store/index.js`. It is responsible for the behaviour of the app, and it is where most of the information is obtained, filtered, grouped and processed.

## Styles

The styles for each component are located under the `assets/scss` folder with the same name as the component file. The app uses the [Buefy](https://buefy.org) library, so if you want to edit the app theme you can go to the file `assets/scss/variables.scss` and edit all the colors and variables to match the desired design. You can also add new ones following the guidelines from the [Bulma documentation](https://bulma.io/documentation/overview/variables/).

The app uses FontAwesome for the icons; if you need to add new icons, you can do so on the `main.js` file on the icon library.

# **Tests**

You can test the app by running `npm run test:unit`. Tests are developed using `Vue Test Utils` and are located on the `tests` folder. Mock data is used to get information into the testing environment, so there's no requirement to connect to an API. The tests are grouped by the four main components and are focused on testing the components behavior.
