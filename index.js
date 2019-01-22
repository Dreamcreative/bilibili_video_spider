const { createSingle ,findOne } = require("./sequelize");
const { URL } = require('url')
const http = require('http');
const proxy = require('./proxys.js');
const fs = require('fs');
const helper = require("./helper");
var zoneTags = [];
var offset = 0;
var timeout = 60*1000;
var proxyLen = proxy.length-1;

//切换标签 detail在这里调用
var zoneUrl = "http://api.vc.bilibili.com/clip/v1/video/zonelist?page=total&platform=pc";


getTags(zoneUrl)


// 先获取 视频标签
async function getTags( zoneUrl ){
    http.get(zoneUrl, function(res) {
        var html = '';
        res.on('data', function(data) {
            html += data;
        });
        res.on('end', async function() {
            var zoneData = JSON.parse(html).data;
            var zonekeys = Object.keys( zoneData );
            for(var j= 0;j < zonekeys.length;j++){
                if(zoneData[zonekeys[j]].tags !== undefined) {
                    zoneTags.push(...zoneData[zonekeys[j]].tags) 
                };
            };
            for(var index = 0;index< zoneTags.length;index++){
                await detail(offset,index); //执行detail
            };
            offset =0 ;
            await getTags(zoneUrl) ;
        });
    }).on('error', function() {
        console.log('获取数据出错！');
    });
    
}


// 更换代理Ip请求接口data
async function filterViedeoList(url ,proxy ){
    return  new Promise( function(resolve,reject){  
            let proxySplit = proxy.split(":");
            var optionBaseUrl = {
                host: proxySplit[1].replace('//',''), // 代理 IP
                port:  proxySplit[2].replace('/',''), // 代理端口
                method: 'GET',
                path: url, // 要访问的url
            };
            var req = http.request(optionBaseUrl,  function(res) {
                var html = '';
                res.on('data', function(chunk) {
                    // console.log("爬虫开始前是否有数值传入")
                    html += chunk;
                });
                res.on('end', function() {
                    console.log('当次请求结束！' );
                    if( html.indexOf("<") >-1 && html.indexOf(">")>-1){
                        changeProxy();
                        reject("html")
                    }
                     resolve(html)
                });
            });
            req.setTimeout(timeout, ()=>{
                changeProxy()
                reject("timeout" )
            })
            req.on('error', (e) => {
                console.error(`请求遇到问题: ${e.message}`);
                changeProxy();
                reject("error" )
            });
            req.end();
        
    });
};
// 改變 代理IP
function changeProxy(){
    console.log( "proxyLen++++" ,proxy[proxyLen] )
    if(proxyLen <0){
        proxy = require('./proxys.js');
        proxyLen = proxy.length-1 ;
    }else{
        proxyLen--;
    };
}
//主函数
async function detail(offset,index){
    try{
        
        console.log( "offset +++++++" ,offset)
        console.log( "index +++++++" ,index)
        var baseUrl = "http://api.vc.bilibili.com/clip/v1/video/search?page_size=30&need_playurl=0&next_offset=" + offset +'&has_more=1&order=new&tag='+encodeURI(zoneTags[index])+'&platform=pc';
        changeProxy();
        let resList = await filterViedeoList(baseUrl ,proxy[proxyLen]);
        resList = JSON.parse(resList ) ;
        let list = resList.data.items;
        for(let i in list ){
            try {
                let data = list[i];
                let item = data.item ;
                data.bilibili_uid = data.user.uid;
                data.bilibili_id = item.id ;
                // 判断数据库内是否存在这条数据
                var exist = await findOne({ bilibili_id: data.bilibili_id , bilibili_uid: data.bilibili_uid})
                if( !exist){
                    //不存在 则 下载视频和图片， 并将数据插入数据库
                    var { video , img } = { ...await download(item.id,item.first_pic, item.backup_playurl[0]) };
                    // 返回的 video 和 img 的下载状态
                    data.videostauts = video == "下载成功"?"0" :"1" ;
                    data.imgstauts   = img   == "下载成功"?"0": "1" ;
                    await createSingle(data)
                }
            }catch(error){
                console.log( "循环内容错误          "+error );
            };
        }
        var nextOffset = resList.data.next_offset;
        if (resList.data.has_more == 1) {
            console.log("OFFSET "+nextOffset)
            // 一页数据爬取完成之后 暂停一段时间
            await helper.sleep( helper.random(30 , 10 ) ) ;
            await detail(nextOffset,index);
        };
    }catch(err){
        console.log( "error+++" , err )
        await detail( offset,index )
    }
};



//下载视频和图片函数
async function download (uid,pic,url) {
    try{
        let header = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.67 Safari/537.36",
            "Referer":"http://vc.bilibili.com/p/eden/all",
        };
        var dirPath = "./info/" + helper.timeDir( new Date() ,"ymd")+ '/'+uid+"/";
        helper.mkdirsSync(dirPath)
        console.log('开始下载第' + uid + 'de视频');
        console.log('开始下载第 url  ++' , url );
        var writeStream =await fs.createWriteStream(dirPath + uid + '.mp4');
        var writeStreamPng =await fs.createWriteStream(dirPath + uid + '.png');
        // request.post({url ,headers:header }).pipe(writeStream)
        var resultVideo = await downloadSource( url , header ,writeStream ) ;
        console.log("result 视频" , resultVideo)
        var resultImg = await downloadSource( pic , {} ,writeStreamPng ) ;
        console.log("result 图片" , resultImg)

        await helper.sleep( helper.random(10 , 3 ) ) ;
        
        return { 
            video : resultVideo ,
            img   : resultImg ,
        };
        // rp({url,headers:header})
        // .on('error', function(err){
        //     if(err){
        //         console.log("错误的视频地址",err);
        //     };
        // })
        // .pipe(writeStream);

        // rp(pic)
        // .on('error', function(err){
        //     if(err){
        //         console.log("图片输出错误"+ err);
        //     }
        // }).pipe(writeStreamPng);

    }catch(error){
        console.log( "下载出错",error );
        if( error.indexOf("err")>-1){
            await download (uid,pic,url);
        }
    };
};
// 同步下载 资源 报纸 上一个 stream pipe完成之后才进行下一个 stream  
async function downloadSource( url , header ,stream ){
    return new Promise( (resolve , reject )=>{
        var parse =new URL(url);
        var req = http.request({
            hostname:parse['hostname'],
            port:parse['port'],
            path:url,
            method: 'GET',
            headers :header
        },async function(req,res){ 
            console.log("req.statusCode  ++++++" ,req.statusCode )
            if( req.statusCode ===200 ){
                await req.pipe(stream);
                await stream.on('close', ()=>{
                })
                req.on('end', function(){
                    resolve("下载成功")
                })
            }else{
                resolve("err" , req.statusMessage )
            }
        })
        req.on("error",( err)=>{
            reject("err"+err);
        })
        req.end();
    })
}