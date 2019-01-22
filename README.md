ps 说明 : 这是一个 爬取 bilibili 小视频的 爬虫，爬取数据 的同时 将数据中的 video 和 img 下载到 info文件夹
并将数据存入postgre 数据库.
在下载video 和 img 时，可能会出现 无效的连接，所以在数据库中添加了 videostatus 和 imgstatus 2个字段。
在下载video 的时候遇到的问题：
    1. 在将 请求到的流数据pipe进文件的时候，无法监听到 pipe的完成，所以下载的文件会有一些只能观看到一部分内容，后来使用了 Promise 才解决

## 1 npm i 
 安装依赖

## 2获取 代理 ip 
```
node getproxy
```

## 3 .运行爬虫 
```
node index
```

