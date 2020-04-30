const db = require("../config");

const getAdmin = () => {
  return db('admin').first();
};

module.exports = {
    getAdmin
}