const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development', // Or 'production'
  entry: './src/index.js', // Your main JS entry point
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'), // Output directory
    publicPath: '/', // Important for dev server routing
  },
  devServer: {
    static: './public', // Serve static files from public directory
    historyApiFallback: true, // For single-page applications
    open: true, // Open browser automatically
    hot: true, // Enable hot module replacement
  },
  module: {
    rules: [
      {
        test: /\.css$/i, // Target CSS files
        use: ['style-loader', 'css-loader'], // Use these loaders
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i, // Handle image assets
        type: 'asset/resource',
      },
      {
        test: /\.js$/, // Optional: Add Babel loader if needed for older JS compatibility
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html' // Use this HTML file as a template
    }),
  ],
  resolve: {
    extensions: ['.js'], // Automatically resolve .js extensions
  },
};
