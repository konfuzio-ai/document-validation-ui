# Documentation
## Source Code

This app is built using Vue.js version 2. The `src` folder is the root of the project and is divided into:

`assets` - contains all the images and styles. Each component has it's styles under the `scss` folder. The app uses the [Buefy](https://buefy.org) library, so if you want to edit the app theme you can go to the file `scss/variables.scss` and edit all the colors and variables to match the desired design.
The app uses FontAwesome for the icons. If you need to add new ones, you can do so on the `main.js` file on the icon library setup.

`components` - Vue components that are responsible for making the app work. They are divided into sections related to their function.

`directives` - directives for manipulating the elements in the HTML.

`locales` - translations files, which consist of key-value pairs. There can be as many files as languages needed. Translations are implemented using the library [Vue I18n](https://vue-i18n.intlify.dev/), and the expected value is rendered by using the `$t` translation API and passing the key as an argument.

`store` - the store is implemented using [Vuex](https://vuex.vuejs.org/). It is responsible for saving all information coming from the API and local information regarding the use of the app, like the display scale. Most of the information is obtained, filtered, grouped and processed in the store files which are separated by their concept.

The entry point of the app is the `main.js` which loads all the Vue libraries and therefore opens the first Vue component, the `App.vue`. This component has the responsibility to tell the store to fetch the API data required to load the next components. There are 4 main components which will be explained next.

### DocumentThumbnails

![DocumentThumbnails](http://raw.githubusercontent.com/konfuzio-ai/konfuzio-capture-vue/main/docs/document_thumbnails.svg)

This is a simple component that loads the document images and displays them in a vertical list to act as a thumbnail selector. It is fully clickable and it updates its state automatically.

### DocumentPage

![DocumentPage](http://raw.githubusercontent.com/konfuzio-ai/konfuzio-capture-vue/main/docs/document_page.svg)

This component is responsible for drawing the document and handling any interaction with it. The main thing is that it uses [Konva JS](https://konvajs.org/docs/vue/index.html) to render a canvas element that has the document image as background and shapes on top. Most of the shapes are annotations from the Konfuzio API.

### DocumentAnnotations

![DocumentAnnotations](http://raw.githubusercontent.com/konfuzio-ai/konfuzio-capture-vue/main/docs/document_annotations.svg)

This component is responsible for creating a list to interact with each annotation on the document. You can edit the annotation, edit empty labels and change the annotation bounding box, among other things.

### DocumentsList

![DocumentsList](http://raw.githubusercontent.com/konfuzio-ai/konfuzio-capture-vue/main/docs/documents_list.gif)

This is an optional component that is only loaded if a category ID is provided under the environment file. You also need to add add an [authentication token](https://dev.konfuzio.com/web/api_v3.html#authentication). Is responsible for loading the documents list for a given category. You can then select which document will appear on the dashboard.

### **Tests**

You can test the app by running `npm run test:unit`. Tests are developed using [Vue Test Utils](https://github.com/vuejs/vue-test-utils) and are located on the `tests` folder. Mock data is used to get information into the testing environment, so there's no requirement to connect to an API. The tests are grouped by the four main components and are focused on testing the components behavior.

## Create an User Account

For creating an account you will need to go to [Konfuzio](https://app.konfuzio.com/) and follow the steps. 

## Generate User Token

You can access the [Konfuzio API version 3 Auth Request](https://app.konfuzio.com/v3/swagger/#/auth/auth_create) and make a request with your username and password. If the account exists, then a token will be generated that you can copy.

## Upload Document & Get Document ID

Login to [Konfuzio](https://app.konfuzio.com/) and upload a document to the platform. After successfully uploading, if you want to show it on this app you need to set it as public in the document details page and copy the document id.

![Screenshot](http://raw.githubusercontent.com/konfuzio-ai/konfuzio-capture-vue/main/docs/doc_info.png)

## Creating a .env

You can create an environment variables file `.env` on the root of the project based on the `.env.example` for specifying various options, specially the API endpoint, the user token, the document/category to load and the default language of the app. 

Please be aware that any variable in the `.env` will have priority from the variables defined in the `index.html`.


