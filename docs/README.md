# Documentation

## Source Code

This app is built using Vue.js version 2. The `src` folder is the root of the project and is divided into:

`assets` - contains all the images and styles. Each component has it's styles under the `scss` folder. The app uses the [Buefy](https://buefy.org) library, so if you want to edit the app theme you can go to the file `scss/variables.scss` and edit all the colors and variables to match the desired design.
The app uses FontAwesome for the icons. If you need to add new ones, you can do so on the `main.js` file on the icon library setup.

`components` - Vue components that are responsible for making the app work. They are divided into sections related to their function.

`directives` - directives for manipulating the elements in the HTML.

`locales` - translations files, which consist of key-value pairs. There can be as many files as languages needed. Translations are implemented using the library [Vue I18n](https://vue-i18n.intlify.dev/), and the expected value is rendered by using the `$t` translation API and passing the key as an argument.

`store` - the store is implemented using [Vuex](https://vuex.vuejs.org/). It is responsible for saving all information coming from the API and local information regarding the use of the app, like the display scale. Most of the information is obtained, filtered, grouped and processed in the store files which are separated by their concept.

The entry point of the app is the `main.js` which loads all the Vue libraries and therefore opens the first Vue component, the `App.vue`. This component has the responsibility to tell the store to fetch the API data required to load the next components.

### **Tests**

You can test the app by running `npm run test:unit`. Tests are developed using [Vue Test Utils](https://github.com/vuejs/vue-test-utils) and are located on the `tests` folder. Mock data is used to get information into the testing environment, so there's no requirement to connect to an API. The tests are grouped by the four main components and are focused on testing the components behavior.
