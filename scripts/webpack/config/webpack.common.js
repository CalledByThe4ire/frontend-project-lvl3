import HtmlWebpackPlugin from 'html-webpack-plugin';
import LodashModuleReplacementPlugin from 'lodash-webpack-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import autoprefixer from 'autoprefixer';

import {
  SOURCE,
  DIST,
  CHUNK_NAME_JS,
  CHUNK_NAME_CSS,
} from '../constants';

export default () => {
  const { NODE_ENV } = process.env;
  const IS_DEVELOPMENT = NODE_ENV === 'development';

  return {
    mode: 'none',
    entry: SOURCE,
    output: {
      path: DIST,
      filename: IS_DEVELOPMENT ? '[name].js' : `js/${CHUNK_NAME_JS}`,
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          use: 'babel-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
              },
            },
            {
              loader: 'postcss-loader',

              options: {
                plugins() {
                  return [autoprefixer];
                },
              },
            },
          ],
        },
        {
          test: /\.(scss)$/,
          use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: 'index.html',
        title: 'RSS Aggregator',
        template: `${SOURCE}/template.html`,
      }),
      new LodashModuleReplacementPlugin(),
      new CleanWebpackPlugin(),
      new MiniCssExtractPlugin({
        filename: `css/${CHUNK_NAME_CSS}`,
      }),
    ],
  };
};
