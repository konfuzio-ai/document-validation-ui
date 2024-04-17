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

export function getURLValueFromHash(value) {
  const hash = window.location.hash;
  if (!hash.includes(`#${value}`)) return;

  const id = hash.split(`#${value}`)[1].replace("/", "");

  if (id === "") return;

  return id;
}

export function setURLAnnotationHash(annotationId) {
  if (annotationId) {
    window.location.hash = `ann${annotationId}`;
  }
}

export function navigateToNewDocumentURL(oldId, newId) {
  const url = window.location.href;
  const newUrl = url.replace(oldId, newId);
  window.location.replace(newUrl);
}

export function navigateToDocumentsList(path, projectId, userId) {
  if (!path) return;

  const lastCharOfString = path.charAt(path.length - 1);
  let slash = "/";

  if (lastCharOfString === slash) {
    slash = "";
  }

  const parameters = `?project=${projectId}&is_reviewed__exact=0&assignee__id__exact=${userId}`;

  const newPath = `${path}${slash}${parameters}`;

  window.location.href = newPath;

  return true;
}

export function isElementArray(element) {
  return Array.isArray(element);
}
