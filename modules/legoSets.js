require('dotenv').config();
const Sequelize = require('sequelize');

let sequelize = new Sequelize(process.env.DB_DATABASE, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'postgres',
  port: 5432,
  dialectOptions: {
    ssl: { rejectUnauthorized: false },
  }
});

// Define a "Theme" model
const Theme = sequelize.define('Theme', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: Sequelize.STRING,
    },{
        createdAt: false,
        updatedAt: false,
});

// Define a "Set" model
const Set = sequelize.define('Set', {
    set_num: {
        type: Sequelize.STRING,
        primaryKey: true,
    },
    name: Sequelize.STRING,
    year: Sequelize.INTEGER,
    num_parts: Sequelize.INTEGER,
    theme_id: Sequelize.INTEGER,
    img_url: Sequelize.STRING,
},{
    createdAt: false,
    updatedAt: false,
});

// association 
Set.belongsTo(Theme, {foreignKey: 'theme_id'})

function initialize() {
    return new Promise(async (resolve, reject) => {
        try{
            await sequelize.sync();
            resolve();
        }catch(err){
            reject(err);
        }
    });
}

function getAllSets() {
    return new Promise(async (resolve, reject) => {
        try{
            let sets = await Set.findAll({include: [Theme]});
            if (sets.length > 0) {
                resolve(sets);
            } else {
                reject("Set is not initialized");
            }
        }catch(err){
            reject(err.message)
        }
    });
}

function getAllThemes() {
    return new Promise(async (resolve,reject)=>{
        try{
            let themes = await Theme.findAll();
            resolve(themes);
        }catch(err){
            reject(err.message)
        }
    });
}

function getSetByNum(setNum) {
    return new Promise(async (resolve, reject) => {
        try{
            let foundSet = await Set.findOne({
                include: [Theme],
                where: { set_num: setNum }
            });
            if (foundSet) {
                resolve(foundSet);
            } else {
                reject("No matched set");
            }
        }catch(err){
            reject(err.message)
        }
    });
}

function getSetsByTheme(theme) {
    return new Promise(async (resolve,reject)=>{
        try{
            let themes = await Set.findAll({include: [Theme], where: { 
                '$Theme.name$': {
                  [Sequelize.Op.iLike]: `%${theme}%`
                }
              }});              
            resolve(themes);
        }catch(err){
            reject(err.message)
        }
    });
}

function addSet(setData) {
    return new Promise(async (resolve, reject) => {
        try {
            await Set.create(setData);
            resolve();
        } catch (error) {
            reject(error.errors[0].message);
        }
    });
}

function editSet(set_num, setData){
    return new Promise(async (resolve,reject)=>{
      try {
        await Set.update(setData,{where: {set_num: set_num}})
        resolve();
      }catch(err){
        reject(err.errors[0].message);
      }
    });
}
  
function deleteSet(set_num){
return new Promise(async (resolve,reject)=>{
    try{
    await Set.destroy({
        where: { set_num: set_num }
    });
    resolve();
    }catch(err){
    reject(err.errors[0].message);
    }
    
});
}

module.exports = { initialize, getAllSets, getSetByNum, getSetsByTheme, getAllThemes, addSet, editSet, deleteSet};
