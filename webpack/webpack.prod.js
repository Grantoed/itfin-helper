const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
    mode: 'production',
    performance: {
        // Raise asset limits to avoid noise from expected vendor bundle size
        maxEntrypointSize: 512 * 1024,
        maxAssetSize: 512 * 1024,
    },
});