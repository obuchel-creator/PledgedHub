// jest.mock('mysql2/promise', () => ({
//   createPool: () => ({
//     getConnection: async () => ({ release: () => {} }),
//     execute: async () => [[], []],
//     end: async () => {}
//   })
// }));

// Mock morgan to a no-op middleware
jest.mock('morgan', () => () => (req, res, next) => next());

// Mock express-validator helpers used by controllers/routes
jest.mock('express-validator', () => {
  function makeChain() {
    const chain = function() { return chain; };
    const methods = [
      'exists','withMessage','bail','isString','trim','notEmpty',
      'optional','isNumeric','toFloat','isInt','toInt','isLength','isEmail'
    ];
    methods.forEach(name => { chain[name] = (..._args) => chain; });
    return chain;
  }

  return {
    body: (/* field */) => makeChain(),
    param: (/* field */) => makeChain(),
    query: (/* field */) => makeChain(),
    validationResult: () => ({ isEmpty: () => true, array: () => [] })
  };
});