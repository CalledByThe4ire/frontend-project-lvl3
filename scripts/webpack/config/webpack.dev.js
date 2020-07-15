import merge from 'webpack-merge';
import { choosePort } from 'react-dev-utils/WebpackDevServerUtils';
import getCommonConfig from './webpack.common';

import { HOST, PORT } from '../constants';

export default () => choosePort(HOST, PORT).then((suggestedPort) => merge(getCommonConfig(), {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    host: HOST,
    port: suggestedPort,
  },
  optimization: {
    minimize: false,
  },
}));
