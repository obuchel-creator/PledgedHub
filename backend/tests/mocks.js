module.exports = {
  body: () => () => (req, res, next) => next(),
  param: () => () => (req, res, next) => next(),
  query: () => () => (req, res, next) => next(),
  validationResult: (req) => ({ isEmpty: () => true, array: () => [] })
};