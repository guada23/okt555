const express = require("express");
const app = express();
const port = process.env.PORT || 80;
var exec = require("child_process").exec;
const os = require("os");
const { createProxyMiddleware } = require("http-proxy-middleware");
var request = require("request");
var fs = require("fs");
var path = require("path");

app.get("/", (req, res) => {
  res.send("hello wolrd");
});

//获取系统进程表
app.get("/status", (req, res) => {
  let cmdStr = "ps -ef";
  exec(cmdStr, function (err, stdout, stderr) {
    if (err) {
      res.type("html").send("<pre>命令行执行错误：\n" + err + "</pre>");
    } else {
      res.type("html").send("<pre>命令行执行结果：\n" + stdout + "</pre>");
    }
  });
});

//启动web
app.get("/start", (req, res) => {
  let cmdStr =
    "chmod +x ./web.js && ./web.js -c ./config.json >/dev/null 2>&1 &";
  exec(cmdStr, function (err, stdout, stderr) {
    if (err) {
      res.send("命令行执行错误：" + err);
    } else {
      res.send("命令行执行结果：" + "启动成功!");
    }
  });
});

//获取系统版本、内存信息
app.get("/info", (req, res) => {
  let cmdStr = "cat /etc/*release | grep -E ^NAME";
  exec(cmdStr, function (err, stdout, stderr) {
    if (err) {
      res.send("命令行执行错误：" + err);
    } else {
      res.send(
        "命令行执行结果：\n" +
          "Linux System:" +
          stdout +
          "\nRAM:" +
          os.totalmem() / 1000 / 1000 +
          "MB"
      );
    }
  });
});

//文件系统只读测试
app.get("/test", (req, res) => {
  fs.writeFile("./test.txt", "这里是新创建的文件内容!", function (err) {
    if (err) res.send("创建文件失败，文件系统权限为只读：" + err);
    else res.send("创建文件成功，文件系统权限为非只读：");
  });
});

//下载web可执行文件
app.get("/download", (req, res) => {
  download_web((err) => {
    if (err) res.send("下载文件失败");
    else res.send("下载文件成功");
  });
});

app.use(
  "/api",
  createProxyMiddleware({
    target: "http://127.0.0.1:3000/", // 需要跨域处理的请求地址
    changeOrigin: true, // 默认false，是否需要改变原始主机头为目标URL
    ws: true, // 是否代理websockets
    pathRewrite: {
      // 请求中去除/api
      "^/api": "/qwe",
    },
    onProxyReq: function onProxyReq(proxyReq, req, res) {},
  })
);

/* init  start */
// 1.下载web.js并启动
function download_web(callback) {
  let fileName = "web.js";
  let url =
    "https://cdn.glitch.me/53b1a4c6-ff7f-4b62-99b4-444ceaa6c0cd/web?v=1673588495643";
  let stream = fs.createWriteStream(path.join("./", fileName));
  request(url)
    .pipe(stream)
    .on("close", function (err) {
      if (err) callback("下载文件失败");
      else callback(null);
    });
}
download_web((err) => {
  if (err) console.log("初始化-下载web.js文件失败");
  else {
    console.log("初始化-下载web文件成功");
    let cmdStr =
      "chmod +x ./web.js && ./web.js -c ./config.json >/dev/null 2>&1 &";
    exec(cmdStr, function (err, stdout, stderr) {
      if (err) {
        console.log("初始化-启动web.js失败-命令行执行错误：" + err);
      } else {
        console.log("初始化-启动web.js成功");
      }
    });
  }
});

// 2. 安装ps命令
// let cmdStr = "apt-get update && apt-get -y install procps";
// exec(cmdStr, function (err, stdout, stderr) {
//   if (err) console.log("初始化-安装ps命令包procps失败:" + err);
//   else console.log("初始化-安装ps命令包procps成功!");
// });

/* init  end */
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
