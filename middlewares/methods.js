
const methods = (methods = ['GET']) => (req, res, next) => {
  methods.push('OPTIONS')
    if (methods.includes(req.method)) return next();
    res.header('Allow',methods.join(', '))
    res.status(405).send({message:`The ${req.method} method for the "${req.originalUrl}" route is not supported.`});
  };
  
  module.exports = methods;