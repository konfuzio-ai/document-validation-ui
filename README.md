# Konfuzio Document View

(Under active development)

White-label app that lets you preview and interact with documents uploaded to [Konfuzio](https://konfuzio.com). Chrome, Firefox, Edge and Safari supported.

![Screenshot](http://raw.githubusercontent.com/konfuzio-ai/konfuzio-capture-vue/main/screenshot.png)

## Documentation

The documentation for this app is in the docs directory. [Take a look here](docs/README.md).
Browse the Konfuzio [documentation](https://dev.konfuzio.com/) and [support](https://help.konfuzio.com/).

## Installation

The app requires `node` and `npm` to run. It also requires a connection to the [Konfuzio API version 3](https://app.konfuzio.com/v3/swagger/).

### 1 Clone the repository

You can download the app by cloning this repository or downloading the source code.
```bash
git clone git@github.com:konfuzio-ai/konfuzio-capture-vue.git
```

### 2 Configure the App

There are two modes for running the app: Read Only (default) and Full mode:

#### Read Only Mode (default)

In this mode, you will have a sample document with annotations that you can only preview. The default API endpoint will be https://app.konfuzio.com and no user account is needed.

#### Full Mode

If you want to run the widget in full mode to be able to interact with the document by editing annotations, document pages and other functionalities, you will need to have an [user account created](http://raw.githubusercontent.com/konfuzio-ai/konfuzio-capture-vue/main/docs/README.md#create-an-user-account). Then, you should [generate a user token](http://raw.githubusercontent.com/konfuzio-ai/konfuzio-capture-vue/main/docs/README.md#generate-user-token).
[You will also need a document uploaded and a document id](http://raw.githubusercontent.com/konfuzio-ai/konfuzio-capture-vue/main/docs/README.md#upload-document-&-get-document-id).

With the user token and the document id, you can create a `.env` file with those 2 variables. [More information on how to create this file](http://raw.githubusercontent.com/konfuzio-ai/konfuzio-capture-vue/main/docs/README.md#creating-a-.env). And if you want, you can now specify which document category to load in the `index.html` file or in the `.env`. 

### 3 Install all packages

Install all the dependencies by running:

```bash
npm install
```

### 4 Run the App

#### Local Development

If you want to serve the app locally to run on a browser (default URL: http://localhost:3000) you should run:

```bash
npm run serve
```

#### Deploy

If you want to deploy this app in a web server environment then you should run:
```bash
npm run build
```

When succeeded, you should export the `dist` folder generated from that command to the destination source in the host server and configure the web server engine in order to have the `index.html` file as the entry point. If everything is correctly configured you should be able to open the server URL and the app will load.

## Integration

If you want to integrate it in an existing application then we recommend to use the available package on the [npm repository](https://www.npmjs.com/package/@konfuzio/capture-vue).
You can also deploy the app as stated in the previous section and copy the `dist` folder to the existing application.

An example of that integration using a `Webpack` based configuration:

### webpack.config.js

Create a webpack configuration for the app:

```javascript
const VueLoaderPlugin = require("vue-loader/lib/plugin");

module.exports = {
  entry: {
    capture_vue: "./node_modules/@konfuzio/capture-vue/src/main.js",
  },
  output: {
    path: "/server/bundle",
    publicPath: "/bundle/",
    filename: "[name].js",
    sourceMapFilename: "[name].js.map",
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: "vue-loader",
        options: {
          sourceMap: true,
        },
      }
    ],
  },
  plugins: [
    new VueLoaderPlugin()
  ],
};
```

### HTML

In the html we should load the script we created with the webpack and customize the variables we want:

```html
  <div id="app">
    <App document="DOCUMENT_ID" category="CATEGORY_ID" locale="LOCALE"></App>
  </div>

  <script src="/server/bundle/capture_vue.js"></script>
```



