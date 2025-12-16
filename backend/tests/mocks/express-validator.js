function makeChain() {
  const chain = function() { return chain; };
  const methods = [
    'exists','withMessage','bail','isString','trim','notEmpty',
    'optional','isNumeric','toFloat','isInt','toInt','isLength','isEmail'
  ];
  methods.forEach(name => { chain[name] = (..._args) => chain; });
  return chain;
}

module.exports = {
  body: (/* field */) => makeChain(),
  param: (/* field */) => makeChain(),
  query: (/* field */) => makeChain(),
  validationResult: () => ({ isEmpty: () => true, array: () => [] })
};