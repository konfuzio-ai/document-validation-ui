import store from "../store/index";

const documentPollDuration = 1000;

function sleep(duration) {
  new Promise(resolve => setTimeout(resolve, duration));
}

export default function pollDocumentEndpoint() {
  return store
    .dispatch("document/fetchDocumentStatus")
    .then(ready => {
      if (ready) {
        // Stop document recalculating annotations
        store.dispatch("document/endRecalculatingAnnotations");
        store.dispatch("document/fetchDocument");
      } else {
        sleep(documentPollDuration);
        pollDocumentEndpoint();
      }
    })
    .catch(error => {
      store.dispatch("document/setDocumentError", true);
      console.log(error);
    });
}
