const vueConfig = {};

vueConfig.chainWebpack = (config) => {
    config.plugin('html').init((Plugin, args) => {
        const newArgs = {
        ...args[0],
        };
        newArgs.minify.removeAttributeQuotes = false;
        return new Plugin(newArgs);
    });
};

vueConfig.baseUrl = './'

module.exports = vueConfig;
