# Konfuzio Document View

(Under active development)

White-label widget that lets you upload your documents to [Konfuzio](https://konfuzio.com) and preview the results. Chrome, Firefox, Edge and Safari supported.

![Screenshot](http://raw.githubusercontent.com/konfuzio-ai/konfuzio-capture-vue/main/screenshot.png)

# **Requirements**

The widget requires `node` and `npm`. It also requires a connection to the Konfuzio API version 3 (https://app.konfuzio.com/v3/swagger/) and a look at https://help.konfuzio.com/ documentation for getting aware of the app business concepts.

# **Installation**

Follow the steps below to get the app running.

1. Clone this repository.
2. Create a `.env` file in the project root with the properties from the `.env.example` file. Take a look at the required ones. 
3. Run `npm install` in the project root.
4. Run `npm run serve` to serve a local development app to run on a browser (default URL: http://localhost:3000).

# **Deployment**

If you want to serve this app in a web server environment (like your company host xxxx.mycompany.com or in a cloud environment), do all steps from the previous section (except point 4) and then:

1. Run `npm run build` to build the app for production. 
2. Export the `dist` folder generated from the command above to the destination source in the host server.
3. Configure the web server engine in order to have the `index.html` file as the entry point. If everything is correctly configured you should be able to open the server URL and the app will load.

# **Documentation**

This sample app is built using Vue.js version 2. The `src` folder is the root of the project and is divided into:

`assets` - contains all the images and styles. Each component has it's styles under the `scss` folder. The app uses the [Buefy](https://buefy.org) library, so if you want to edit the app theme you can go to the file `scss/variables.scss` and edit all the colors and variables to match the desired design. 
The app uses FontAwesome for the icons. If you need to add new ones, you can do so on the `main.js` file on the icon library setup.

`components` - Vue components that are responsible for making the app work. They are divided into sections related to their function.

`directives` - directives for manipulating the elements in the HTML.

`locales` - translations files.

`store` - the store is implemented using `Vuex`. It is responsible for saving all information coming from the API and local information regarding the use of the app, like the display scale. Most of the information is obtained, filtered, grouped and processed in the store files which are separated by their concept.

The entry point of the app is the `main.js` which loads all the Vue libraries and therefore opens the first Vue component, the `App.vue`. This component has the responsibility to tell the store to fetch the API data required to load the next components. There are 4 main components which will be explained next.

### DocumentThumbnails

![DocumentThumbnails](http://raw.githubusercontent.com/konfuzio-ai/konfuzio-capture-vue/main/document_thumbnails.svg)

This is a simple component that loads the document images and displays them in a vertical list to act as a thumbnail selector. It is fully clickable and it updates its state automatically.

### DocumentPage

![DocumentPage](http://raw.githubusercontent.com/konfuzio-ai/konfuzio-capture-vue/main/document_page.svg)

This component is responsible for drawing the document and handling any interaction with it. The main thing is that it uses `Konva JS` package (https://konvajs.org/docs/vue/index.html) to render a canvas element that has the document image as background and shapes on top. Most of the shapes are annotations from the Konfuzio API. 

### DocumentAnnotations

![DocumentAnnotations](http://raw.githubusercontent.com/konfuzio-ai/konfuzio-capture-vue/main/document_annotations.svg)

This component is responsible for creating a list to interact with each annotation on the document. You can edit the annotation, edit empty labels and change the annotation bounding box, among other things. 

### DocumentsList

![DocumentsList](http://raw.githubusercontent.com/konfuzio-ai/konfuzio-capture-vue/main/documents_list.gif)

This is an optional component that is only loaded if a category ID is provided under the environment file. You also need to add add an [authentication token](https://dev.konfuzio.com/web/api_v3.html#authentication). Is responsible for loading the documents list for a given category. You can then select which document will appear on the dashboard.

# **Tests**

You can test the app by running `npm run test:unit`. Tests are developed using `Vue Test Utils` and are located on the `tests` folder. Mock data is used to get information into the testing environment, so there's no requirement to connect to an API. The tests are grouped by the four main components and are focused on testing the components behavior.
