const util = require("util");
const multer = require("multer");
const {GridFsStorage} = require("multer-gridfs-storage");


const storage = new GridFsStorage({
    url: "mongodb://team:f505zQAq94T3TcZI@csc131-project-shard-00-00.mvprq.mongodb.net:27017,csc131-project-shard-00-01.mvprq.mongodb.net:27017,csc131-project-shard-00-02.mvprq.mongodb.net:27017/userDB?ssl=true&replicaSet=atlas-jpao4r-shard-0&authSource=admin&retryWrites=true&w=majority",
    options: { useNewUrlParser: true, useUnifiedTopology: true },
    file: (req, file) => {
      const match = ["image/png", "image/jpeg"];
  
      if (match.indexOf(file.mimetype) === -1) {
        const filename = `${Date.now()}-${req.body.name}`;
        return filename;
      }
  
      return {
        bucketName: "images",
        filename: `${Date.now()}-${req.body.name}`
      };
    }
  });

var uploadFile = multer({ storage: storage }).single("file");
var uploadFilesMiddleware = util.promisify(uploadFile);
module.exports = uploadFilesMiddleware;