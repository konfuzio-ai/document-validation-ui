# Konfuzio Document View

(Under active development)

White-label app that lets you preview and interact with documents uploaded to [Konfuzio](https://konfuzio.com). Chrome, Firefox, Edge and Safari supported.

![Screenshot](http://raw.githubusercontent.com/konfuzio-ai/konfuzio-capture-vue/main/screenshot.png)

## Documentation

The documentation for this app is in the docs directory. [Take a look here](docs/README.md).
Also, you can browse the Konfuzio [documentation](https://dev.konfuzio.com/) and [support](https://help.konfuzio.com/).

## Installation

The app requires `node` and `npm` to run. It also requires a connection to the [Konfuzio Server API version 3](https://app.konfuzio.com/v3/swagger/). See [full Documentation](https://dev.konfuzio.com/web/api-v3.html).

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

If you want to run the widget in full mode to be able to interact with the document by editing annotations, document pages and other functionalities, you will need to have a [user account created](https://app.konfuzio.com/accounts/signup/). Then, you should generate a user Token, by accessing the [Konfuzio API version 3 Auth Request](https://app.konfuzio.com/v3/swagger/) and making a request with your username and password. If the account exists, then a Token will be generated that you can copy.

You will also need a [Document uploaded](https://app.konfuzio.com/v3/swagger/#/documents/documents_create) and a Document id, and will need to be logged in to [Konfuzio](https://app.konfuzio.com/) before being able to upload the Document. After successfully uploading it, if you want to show it on the Document Validation UI, you can copy the Document id from the URL, as shown in the image below:

<img width="1424" alt="Screenshot 2022-11-18 at 13 09 25" src="https://user-images.githubusercontent.com/64650497/202742355-c3c13356-349f-41d3-9b67-404a7018325f.png">

You can create a `.env` file with the user Token and the Document id. And if you want, you can now specify which Document Category to load in the `index.html` file or in the `.env`.

You can create an environment variables file `.env` on the root of the repository based on the `.env.example` for specifying various options, especially the API endpoint, the user Token, the Document and Category to load, and the default language of the app.

Please be aware that any variable in the `.env` will have priority from the variables defined in the index.html.

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
