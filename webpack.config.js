const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'userScript.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true
  },
  mode: 'production',
  optimization: {
    minimize: true
  }
};
