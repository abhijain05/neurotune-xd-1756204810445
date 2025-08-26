/**
 * SAPUI5 Module Loader
 * Handles dependencies and module loading when standard UI5 methods fail
 */
(function() {
  console.log("Loading module loader");
  
  window.ModuleLoader = {
    modules: {},
    loading: {},
    
    // Load a module with dependencies
    load: function(name, dependencies, factory) {
      var self = this;
      
      // Log loading start
      console.log("ModuleLoader: Loading " + name);
      
      // If module is already loaded, return it
      if (this.modules[name]) {
        console.log("ModuleLoader: " + name + " already loaded");
        return Promise.resolve(this.modules[name]);
      }
      
      // If module is currently being loaded, return that promise
      if (this.loading[name]) {
        console.log("ModuleLoader: " + name + " already loading");
        return this.loading[name];
      }
      
      // Load dependencies first
      var dependencyPromises = [];
      
      if (Array.isArray(dependencies)) {
        dependencyPromises = dependencies.map(function(dep) {
          return self.load(dep, [], function() { return {}; });
        });
      }
      
      // Create and store the loading promise
      this.loading[name] = Promise.all(dependencyPromises)
        .then(function(resolvedDeps) {
          // Execute factory function with dependencies
          try {
            var module = factory.apply(null, resolvedDeps);
            self.modules[name] = module;
            console.log("ModuleLoader: " + name + " loaded successfully");
            return module;
          } catch (e) {
            console.error("ModuleLoader: Error in factory for " + name + ": " + e.message);
            // Create an empty module as fallback
            self.modules[name] = {};
            return self.modules[name];
          }
        })
        .catch(function(error) {
          console.error("ModuleLoader: Failed to load dependencies for " + name + ": " + error.message);
          // Create an empty module as fallback
          self.modules[name] = {};
          return self.modules[name];
        });
      
      return this.loading[name];
    }
  };
  
  // Polyfill sap.ui.define if it doesn't exist
  if (typeof window.sap === 'undefined') {
    window.sap = {};
  }
  
  if (typeof window.sap.ui === 'undefined') {
    window.sap.ui = {};
  }
  
  if (typeof window.sap.ui.define !== 'function') {
    window.sap.ui.define = function(moduleName, dependencies, factory) {
      // Handle optional moduleName
      if (typeof moduleName === 'string' && Array.isArray(dependencies) && typeof factory === 'function') {
        // Normal case with all arguments
        return window.ModuleLoader.load(moduleName, dependencies, factory);
      } else if (Array.isArray(moduleName) && typeof dependencies === 'function') {
        // No module name provided
        factory = dependencies;
        dependencies = moduleName;
        return window.ModuleLoader.load('anonymous_' + Date.now(), dependencies, factory);
      } else if (typeof moduleName === 'function') {
        // No dependencies or name
        factory = moduleName;
        return window.ModuleLoader.load('anonymous_' + Date.now(), [], factory);
      }
    };
    
    console.log("ModuleLoader: Added sap.ui.define polyfill");
  }
})();