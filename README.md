# Konfuzio Document View

(Under active development)

White-label app that lets you preview and interact with documents uploaded to [Konfuzio](https://konfuzio.com). Chrome, Firefox, Edge and Safari supported.

![Screenshot](http://raw.githubusercontent.com/konfuzio-ai/konfuzio-capture-vue/main/screenshot.png)

## Documentation

The documentation for this app is in the docs directory. [Take a look here](http://raw.githubusercontent.com/konfuzio-ai/konfuzio-capture-vue/main/docs/README.md).
Browse the Konfuzio [documentation](https://dev.konfuzio.com/) and [support](https://help.konfuzio.com/).

## Requirements

The app requires `node` and `npm` to run. It also requires a connection to the [Konfuzio API version 3](https://app.konfuzio.com/v3/swagger/).

There are two modes for running the app: Read Only (default) and Full mode.

### Read Only Mode (default)

In this mode, you will have a sample document with annotations that you can only view. There's no additional requirement needed, you just need to install the app as described in the [Installation](#installation) section. 

### Full Mode

If you want to run the widget in full mode to be able to interact with the document by editing annotations, document pages and other functionalities, you will need to have an user account created in [Konfuzio](https://app.konfuzio.com/). After you create an account, you need to upload a document to the platform and set it as public in the document details page and copy the document id.

### Setup Local Environment


# **Setup**

Follow the sections below to get the app running.

## Getting the code

You can download the app by cloning this repository or installing it through `npm`. The app is available as a npm package [here](https://www.npmjs.com/package/@konfuzio/capture-vue). 

## Running a local 

Clone this repository.
2. Create a `.env` file in the project root with the properties from the `.env.example` file. Take a look at the required ones.
3. Run `npm install` in the project root.
4. Run `npm run serve` to serve a local development app to run on a browser (default URL: http://localhost:3000).



# **Deployment**

If you want to serve this app in a web server environment (like your company host xxxx.mycompany.com or in a cloud environment), do all steps from the previous section (except point 4) and then:

1. Run `npm run build` to build the app for production.
2. Export the `dist` folder generated from the command above to the destination source in the host server.
3. Configure the web server engine in order to have the `index.html` file as the entry point. If everything is correctly configured you should be able to open the server URL and the app will load.

