export function sleep(duration) {
  new Promise((resolve) => setTimeout(resolve, duration));
}

export function getURLQueryParam(param) {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);

  if (urlParams.has(param)) {
    return urlParams.get(param);
  }
  return undefined;
}

export function getURLPath(value) {
  const path = window.location.pathname;

  if (!path.includes(`/${value}/`)) return;

  const id = path.split(value)[1].split("/")[1];

  if (id === "") return;

  return id;
}

export function navigateToNewDocumentURL(oldId, newId) {
  const url = window.location.href;
  const newUrl = url.replace(oldId, newId);
  window.location.replace(newUrl);
}

export function navigateToDocumentsList(projectId, path) {
  const isKonfuzioApp = window.location.href.includes("konfuzio");
  let newPath;

  if (isKonfuzioApp) {
    newPath = `/admin/server/document/?project=${projectId}`;
  } else if (path) {
    newPath = path;
  } else {
    return;
  }

  window.location.pathname = newPath;
}

export function isElementArray(element) {
  return Array.isArray(element);
}
