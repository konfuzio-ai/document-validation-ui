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

export function setURLQueryParam(query, value, deleteParam = "") {
  const url = new URL(window.location.href);
  if (value != "") {
    if (deleteParam != "") {
      url.searchParams.delete(deleteParam);
    }
    url.searchParams.set(query, value);
  } else {
    url.searchParams.delete(query);
  }
  window.history.pushState(null, "", url.toString());
}

export function setURLAnnotationHash(annotationId) {
  if (annotationId) {
    window.location.hash = `ann${annotationId}`;
  } else {
    history.pushState(
      "",
      document.title,
      window.location.pathname + window.location.search
    );
  }
}

export function navigateToNewDocumentURL(oldId, newId) {
  const url = window.location.href;
  const newUrl = url.replace(oldId, newId);
  window.location.replace(newUrl);
}

export function navigateToDocumentsList(path, projectId) {
  if (!path) return;

  const lastCharOfString = path.charAt(path.length - 1);
  let slash = "/";

  if (lastCharOfString === slash) {
    slash = "";
  }

  const parameters = `?project=${projectId}`;

  const newPath = `${path}${slash}${parameters}`;

  window.location.href = newPath;

  return true;
}

export function isElementArray(element) {
  return Array.isArray(element);
}

export function debounce(cb, duration) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      cb(...args);
    }, duration);
  };
}
