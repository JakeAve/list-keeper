const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");
const fs = require("node:fs");

let win;

const mainWindow = () => {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
    },
  });
  win.loadFile("index.html");
};

app.whenReady().then(() => {
  mainWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow();
    }
  });
});

ipcMain.on("read-all-notes", () => {
  const files = fs.readdirSync(path.join(__dirname, "content"));
  const data = files
    .filter((name) => name.includes(".md"))
    .map((filename) => filename.replace(/.md$/, ""));
  let selectedFile;
  try {
    selectedFile = fs.readFileSync(
      path.join(__dirname, "current-note.txt"),
      "utf8"
    );
  } catch {
    selectedFile = data[0];
  }

  win.webContents.send("send-all-notes", {
    selectedFile,
    files: data,
  });
});

ipcMain.on("get-note", (_events, data) => {
  const contents = fs.readFileSync(
    path.join(__dirname, "content", `${data}.md`),
    "utf8"
  );
  fs.writeFileSync(path.join(__dirname, "current-note.txt"), data);
  const checklist = contents.split("\n").map((item, idx) => ({
    isChecked: !!/^- \[x\]/.test(item),
    idx,
    content: item.replace(/^- \[.?\]/, "").trim(),
  }));
  win.webContents.send("send-note", checklist);
});

ipcMain.on("update-list", (_events, data) => {
  const string = data.items
    .map((item) => {
      let str = "- [";
      if (item.isChecked) {
        str += "x";
      } else {
        str += " ";
      }
      str += `] ${item.content}`;
      return str;
    })
    .join("\n");

  const filename = data.filename;

  fs.writeFileSync(path.join(__dirname, "content", `${filename}.md`), string);
});

ipcMain.on("create-new-list", (_events, data) => {
  console.log('created new list', data)
  const { filename } = data;
  fs.writeFileSync(path.join(__dirname, "content", `${filename}.md`), '');
  win.webContents.send("new-list-created", { filename });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
