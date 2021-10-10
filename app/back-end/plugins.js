/*
 * Plugins instance
 */

const fs = require('fs-extra');
const path = require('path');
const UtilsHelper = require('./helpers/utils.js');
const pluginConfigValidator = require('./helpers/validators/plugin-config.js');

class Plugins {
    constructor(appInstance) {
        this.basePath = appInstance.appDir;
        this.pluginsPath = path.join(this.basePath, 'plugins');
        this.appInstance = appInstance;
    }

    /*
     * Load plugins from a specific path
     */
    loadPlugins () {
        let pathToPlugins = this.pluginsPath;
        let output = [];
        let filesAndDirs = fs.readdirSync(pathToPlugins);

        for (let i = 0; i < filesAndDirs.length; i++) {
            if (filesAndDirs[i][0] === '.' || !UtilsHelper.dirExists(path.join(pathToPlugins, filesAndDirs[i]))) {
                continue;
            }

            let configPath = path.join(pathToPlugins, filesAndDirs[i], 'plugin.json');

            // Load only proper plugins
            if (!fs.existsSync(configPath)) {
                continue;
            }

            // Load only properly configured languages
            if(pluginConfigValidator(configPath) !== true) {
                continue;
            }

            let pluginData = fs.readFileSync(configPath, 'utf8');
            pluginData = JSON.parse(pluginData);

            output.push({
                scope: pluginData.scope,
                directory: filesAndDirs[i],
                name: pluginData.name,
                version: pluginData.version,
                author: pluginData.author,
                minimumPubliiVersion: pluginData.minimumPubliiVersion
            });
        }

        return output;
    }

    /*
     * Load plugins for specific site
     */
    loadSiteSpecificPlugins (siteName) {
        let sitePath = path.join(this.appInstance.sitesDir, siteName, 'input', 'config'); 
        let sitePluginsConfigPath = path.join(sitePath, 'site.plugins.json');

        if (!fs.existsSync(sitePluginsConfigPath)) {
            return;
        }

        let pluginsConfig = fs.readFileSync(sitePluginsConfigPath);

        try {
            pluginsConfig = JSON.parse(pluginsConfig);
        } catch (e) {
            console.log('(!) Error during loading plugins config for site ', siteName);
            return;
        }

        let pluginNames = Object.keys(pluginsConfig);

        for (let i = 0; i < pluginNames.length; i++) {
            let pluginName = pluginNames[i];

            if (!pluginsConfig[pluginName]) {
                continue;
            }

            let pluginPath = path.join(this.appInstance.appDir, 'plugins', pluginName, 'main.js');
            let PluginInstance = require(pluginPath);
            let plugin = new PluginInstance(this.appInstance.pluginsAPI);
            
            if (typeof plugin.addEvents !== 'undefined') {
                plugin.addEvents();
            }
        }
    }

    /*
     * Load plugins for app
     */
    loadAppSpecificPlugins () {
        
    }

    /*
     * Remove specific language from the app directory
     */
    removePlugin (directory) {
        fs.removeSync(path.join(this.pluginsPath, directory));
    }
}

module.exports = Plugins;