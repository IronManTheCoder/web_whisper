const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    // Each entry point becomes a separate JavaScript file
    background: './src/background.ts',
    content: './src/content.ts',
    popup: './src/popup.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js', // [name] gets replaced with entry key (background, content, popup)
    clean: true // Cleans dist folder before each build
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js'] // Webpack can import .ts files without extension
  },
  plugins: [
    // Copy static files from public/ to dist/
    new CopyWebpackPlugin({
      patterns: [
        { from: 'public', to: '.' }
      ]
    })
  ],
  // Don't bundle Node.js modules (Chrome extensions run in browser)
  target: 'web',
  // Optimization for Chrome extensions
  optimization: {
    splitChunks: false // Don't split code into chunks
  }
};
