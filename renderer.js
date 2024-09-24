const { ipcRenderer } = require("electron");
const path = require("path");

window.addEventListener("DOMContentLoaded", () => {
  const el = {
    createDocumentBtn: document.getElementById("createDocumentBtn"),
    documentName: document.getElementById("documentName"),
    openDocumentBtn: document.getElementById("openDocumentBtn"),
    saveDocumentBtn: document.getElementById("saveDocumentBtn"),
    fileTextArea: document.getElementById("fileTextArea"),
  };

  const handleDocumentChange = (filePath, content) => {
    el.documentName.innerText = path.parse(filePath).base;

    el.fileTextArea.removeAttribute("disabled");
    el.fileTextArea.value = "";
    el.fileTextArea.focus();
  };

  el.saveDocumentBtn.addEventListener("click", () => {
    ipcRenderer.send("save-document-triggered", el.fileTextArea.value);
  });

  el.createDocumentBtn.addEventListener("click", () => {
    ipcRenderer.send("create-document-triggered");
  });

  el.openDocumentBtn.addEventListener("click", () => {
    ipcRenderer.send("open-document-triggered");
  });

  ipcRenderer.on("document-created", (_, filePath) => {
    handleDocumentChange(filePath);
  });

  ipcRenderer.on("document-opened", (_, { filePath, content }) => {
    handleDocumentChange(filePath, content);
    el.fileTextArea.value = content;
  });

  ipcRenderer.on("document-saved", () => {
    ipcRenderer.send("save-document-triggered", el.fileTextArea.value);
  });
});
