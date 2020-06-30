import merge from 'webpack-merge';
import TerserPlugin from 'terser-webpack-plugin';
import OptimizeCSSAssetsPlugin from 'optimize-css-assets-webpack-plugin';
import getCommonConfig from './webpack.common';

export default () => merge(
  getCommonConfig(), {
    mode: 'production',
    devtool: 'eval',
    optimization: {
      runtimeChunk: 'single',
      splitChunks: {
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
      minimizer: [new TerserPlugin({}), new OptimizeCSSAssetsPlugin({})],
    },
  },
);
