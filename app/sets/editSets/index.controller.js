// Route for getting all the files
const home = (req, res) => {
  return res.sendFile(path.join(`${__dirname}./index.html`));
};
module.exports = {
  getHome: home,
  router
};
