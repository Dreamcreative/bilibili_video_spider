const Sequelize = require("sequelize");
const sequelize = new Sequelize("postgres","postgres","123456" ,{
    host:"localhost",
    dialect:"postgres",
    operatorsAliases:false , 
    pool:{
        max:5,
        min:0 ,
        acquire:30000,
        idle:10000,
    }
}) ;
sequelize.authenticate().then(()=>{
    console.log( "Connection has been established successfully");
}).catch(err=>{
    console.error( "Unable to connect to the database:" , err )
})
// 添加 douban 数据库 sequelize 如果存在，则添加数据，
// 不存在 则新增 表
const bilibili = sequelize.define("bilibili" , {
    item:{
        type:Sequelize.JSON,
    },
    user:{
        type:Sequelize.JSON,
    },
    // url:{
    //     type:Sequelize.STRING(1024),
    // },
    // description:{
    //     type:Sequelize.STRING(1024),
    // },
    // pic:{
    //     type:Sequelize.STRING(1024),
    // },
    bilibili_id:{
        type:Sequelize.INTEGER,
    },
    bilibili_uid:{
        type:Sequelize.STRING,
    },
    videostauts:{
        type:Sequelize.ENUM( ),
        values: ['0', '1'],
        comment:"0 success ,1 error",
    },
    imgstauts:{
        type:Sequelize.ENUM( ),
        values: ['0', '1'],
        comment:"0 success ,1 error  ",
    },

    // height:{
    //     type:Sequelize.INTEGER,
    // },
    // width:{
    //     type:Sequelize.INTEGER,
    // },
    // video_time:{
    //     type:Sequelize.INTEGER,
    // },
    // video_size:{
    //     type:Sequelize.STRING,
    // },
    // tags:{
    //     type:Sequelize.JSON,

    // },
})
exports.createSingle =async function create(  data ){
    await bilibili.sync({force:false }).then( ()=>{
        console.log("添加成功~")
        return bilibili.create( data ) ;
    })
}
exports.findOne =async  function ( where ){
    return await bilibili.sync({force:false }).then( ()=>{
        return bilibili.findOne({
            where: where
        }).then( data =>{
            return data ;
        })
    })
        
}