import { BrowserWindow } from "electrobun/bun";
import { webviewRPC } from "./rpc";

const mainWindow = new BrowserWindow({
  title: "Quiz app",
  url: "views://menuview/index.html",
  frame: {
    width: 800,
    height: 800,
    x: 200,
    y: 200,
  },
  rpc: webviewRPC
});

console.log("Quiz app started!");
