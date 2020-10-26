const Fuse = require('fuse.js')
  
  
  module.exports = (pattern, list, keys = ["name","description"]) => {
      const options = {
        keys: keys
      };
      const fuse = new Fuse(list,options);
      return fuse.search(pattern).map(obj => obj.item)
    }