/**
 * SAPUI5 Library Loader
 * Handles dynamic loading and error recovery for UI5 libraries
 */
(function() {
  console.log("Loading library loader module");
  
  window.LibraryLoader = {
    // Status tracking 
    loadedLibraries: {},
    
    // Log a library loading event
    log: function(message) {
      console.log("[Library Loader] " + message);
    },
    
    // Log a library loading error
    error: function(message) {
      console.error("[Library Loader ERROR] " + message);
    },
    
    // Load multiple libraries
    loadLibraries: function(libraries) {
      var self = this;
      var promises = [];
      
      libraries.forEach(function(lib) {
        promises.push(self.loadLibrary(lib));
      });
      
      return Promise.all(promises);
    },
    
    // Load a single library with fallbacks
    loadLibrary: function(libraryName) {
      var self = this;
      
      // Don't reload already loaded libraries
      if (this.loadedLibraries[libraryName]) {
        this.log("Library " + libraryName + " already loaded");
        return Promise.resolve(libraryName);
      }
      
      this.log("Loading library: " + libraryName);
      
      return new Promise(function(resolve, reject) {
        // Try standard UI5 loading mechanism first
        if (typeof sap !== 'undefined' && 
            typeof sap.ui !== 'undefined' && 
            typeof sap.ui.getCore === 'function') {
          try {
            var core = sap.ui.getCore();
            
            if (typeof core.loadLibrary === 'function') {
              self.log("Using UI5 core.loadLibrary for " + libraryName);
              
              try {
                core.loadLibrary(libraryName);
                self.loadedLibraries[libraryName] = true;
                self.log("Library " + libraryName + " loaded via UI5 core");
                resolve(libraryName);
                return;
              } catch (e) {
                self.error("Failed to load library via UI5 core: " + e.message);
                // Continue to fallbacks
              }
            }
          } catch (e) {
            self.error("Error accessing UI5 core: " + e.message);
            // Continue to fallbacks
          }
        }
        
        // Fallback 1: Try loading via manual script tag
        self.log("Trying manual script tag for library: " + libraryName);
        
        var libraryPath = "/api/xgendynpro/preview/resources/" + 
                         libraryName.replace(/\./g, "/") + 
                         "/library.js";
        
        var script = document.createElement('script');
        script.src = libraryPath;
        script.async = true;
        
        script.onload = function() {
          self.loadedLibraries[libraryName] = true;
          self.log("Library " + libraryName + " loaded via script tag");
          resolve(libraryName);
        };
        
        script.onerror = function() {
          self.error("Failed to load library via script tag: " + libraryName);
          
          // Fallback 2: Try simple namespace creation
          self.log("Creating namespace placeholder for: " + libraryName);
          
          // Create the namespace path
          var parts = libraryName.split('.');
          var obj = window;
          
          for (var i = 0; i < parts.length; i++) {
            if (!obj[parts[i]]) {
              obj[parts[i]] = {};
            }
            obj = obj[parts[i]];
          }
          
          self.loadedLibraries[libraryName] = true;
          self.log("Created namespace placeholder for " + libraryName);
          resolve(libraryName);
        };
        
        document.head.appendChild(script);
      });
    }
  };
})();