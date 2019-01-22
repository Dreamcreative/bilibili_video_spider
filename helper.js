const fs = require("fs");
const path = require('path')
let helper={};
helper.timeDir = (time ,type) => {
    if( !time )return "";
    let date =  new Date(time);
    let y =  date.getFullYear();
    let m = date.getMonth() + 1;
    let d = date.getDate();
    let h = date.getHours();
    let min = date.getMinutes();
    let s = date.getSeconds();
    m = ("0"+m).slice(-2);
    d = ("0"+d).slice(-2);
    h = ("0"+h).slice(-2);
    min = ("0"+min).slice(-2);
    s = ("0"+s).slice(-2);
    if( type =="y-m-d"){
        return `${y}-${m}-${d}`;
    }else if( type=="ymd"){
        return `${y}${m}${d}`;
    }else {
        return `${y}-${m}-${d} ${h}:${min}:${s}`;
    }
}
helper.sleep=( sec )=>{
    var now = new Date();
    var exitTime = now.getTime() + sec*1000 ;
    while( true ){
        now = new Date();
        if( now.getTime() > exitTime) return ;
    }
}
helper.random=( sec=5 ,wait = 5 )=>{
    return Math.floor( Math.random()*sec + wait ) ;
}
// 同步创建 多级目录
helper.mkdirsSync=(dirname)=> {  
    if (fs.existsSync(dirname)) {  
        return true;  
    } else {  
        if (helper.mkdirsSync(path.dirname(dirname))) { 
            fs.mkdirSync(dirname);  
            return true;  
        }  
    }  
}  

module.exports = helper ;