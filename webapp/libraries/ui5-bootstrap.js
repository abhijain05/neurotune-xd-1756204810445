/**
 * Enhanced SAPUI5 Bootstrap Script
 * Handles proper loading of UI5 libraries and resources
 */
(function() {
  console.log("Loading UI5 bootstrap module");
  
  // Global variable to track bootstrap status
  window.ui5BootstrapStatus = {
    startTime: Date.now(),
    loaded: false,
    initialized: false,
    errors: [],
    messages: [],
    log: function(message) {
      console.log("[UI5 Bootstrap] " + message);
      this.messages = this.messages || [];
      this.messages.push({
        time: new Date().toISOString(),
        message: message
      });
    },
    error: function(message) {
      console.error("[UI5 Bootstrap ERROR] " + message);
      this.errors.push({
        time: new Date().toISOString(),
        message: message
      });
    }
  };
  
  // Create namespace if it doesn't exist
  if (typeof window.sap === 'undefined') {
    window.sap = {};
    window.ui5BootstrapStatus.log("Created sap namespace");
  }
  if (typeof window.sap.ui === 'undefined') {
    window.sap.ui = {};
    window.ui5BootstrapStatus.log("Created sap.ui namespace");
  }
  
  // Create required UI5 functions if they don't exist yet
  window.sap.ui.resource = window.sap.ui.resource || function(lib, path) {
    var libPath = lib.replace(/\./g, '/');
    var url = "/api/xgendynpro/preview/resources/" + libPath + "/" + path;
    window.ui5BootstrapStatus.log("Resource path resolved: " + url);
    return url;
  };
  
  window.sap.ui.require = window.sap.ui.require || function(modulePaths, callback) {
    window.ui5BootstrapStatus.log("Require called: " + (Array.isArray(modulePaths) ? modulePaths.join(", ") : modulePaths));
    if (typeof callback === 'function') {
      setTimeout(function() {
        try {
          var mockModules = Array.isArray(modulePaths) ? modulePaths.map(function() { return {}; }) : [];
          callback.apply(null, mockModules);
          window.ui5BootstrapStatus.log("Require callback executed");
        } catch (e) {
          window.ui5BootstrapStatus.error("Error in require callback: " + e.message);
        }
      }, 10);
    }
  };
  
  if (window.sap.ui.require && typeof window.sap.ui.require.toUrl !== 'function') {
    window.sap.ui.require.toUrl = function(moduleName) {
      var url = "/api/xgendynpro/preview/resources/" + moduleName.replace(/\./g, '/');
      window.ui5BootstrapStatus.log("toUrl: " + moduleName + " → " + url);
      return url;
    };
    window.ui5BootstrapStatus.log("Added toUrl polyfill");
  }
  
  // Monitor UI5 core initialization
  function monitorUI5() {
    if (typeof sap === 'undefined' || typeof sap.ui === 'undefined') {
      window.ui5BootstrapStatus.error("SAPUI5 namespaces not available");
      return false;
    }
    
    if (typeof sap.ui.getCore !== 'function') {
      window.ui5BootstrapStatus.error("sap.ui.getCore not available");
      return false;
    }
    
    try {
      var core = sap.ui.getCore();
      
      // Check if the core is initialized and register callback if not
      if (typeof core.isInitialized === 'function' && core.isInitialized()) {
        window.ui5BootstrapStatus.log("UI5 core already initialized");
        window.ui5BootstrapStatus.initialized = true;
        return true;
      } else {
        window.ui5BootstrapStatus.log("UI5 core not yet initialized, registering callback");
        core.attachInit(function() {
          window.ui5BootstrapStatus.log("UI5 core initialization callback executed");
          window.ui5BootstrapStatus.initialized = true;
        });
        return false;
      }
    } catch (e) {
      window.ui5BootstrapStatus.error("Error checking UI5 initialization: " + e.message);
      return false;
    }
  }
  
  // Poll until UI5 is initialized
  function checkUI5Initialization() {
    if (!window.ui5BootstrapStatus.initialized) {
      if (monitorUI5()) {
        window.ui5BootstrapStatus.log("UI5 initialization confirmed");
      } else {
        setTimeout(checkUI5Initialization, 500);
      }
    }
  }
  
  // Start monitoring
  checkUI5Initialization();
})();