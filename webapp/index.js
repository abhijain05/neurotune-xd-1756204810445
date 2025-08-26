// Enhanced approach with debugging and library loading support
(function() {
  // Create debug namespace for console logs with timestamps
  window.debugUI5 = {
    logs: [],
    log: function(message, isError) {
      var time = new Date().toISOString();
      var entry = {
        time: time,
        message: message,
        isError: !!isError
      };
      
      this.logs.push(entry);
      console.log((isError ? "ERROR: " : "INFO: ") + message);
      
      return entry;
    },
    ensureLibraries: function() {
      this.log("Ensuring libraries are loaded");
      
      // Libraries to check
      var libraries = ["sap.m", "sap.ui.core", "sap.ui.layout"];
      var missingLibraries = [];
      
      libraries.forEach(function(lib) {
        try {
          var parts = lib.split(".");
          var obj = window;
          
          for (var i = 0; i < parts.length; i++) {
            obj = obj[parts[i]];
            if (typeof obj === "undefined") {
              missingLibraries.push(lib);
              window.debugUI5.log("Library " + lib + " is not available", true);
              break;
            }
          }
        } catch (e) {
          missingLibraries.push(lib);
          window.debugUI5.log("Error checking library " + lib + ": " + e.message, true);
        }
      });
      
      if (missingLibraries.length > 0) {
        this.log("Missing libraries: " + missingLibraries.join(", "), true);
        
        // Try to load libraries
        this.loadLibraries(missingLibraries);
        return false;
      } else {
        this.log("All required libraries are available");
        return true;
      }
    },
    loadLibraries: function(libraries) {
      this.log("Attempting to load libraries: " + libraries.join(", "));
      
      // Check if core is available
      if (typeof sap === "undefined" || typeof sap.ui === "undefined" || 
          typeof sap.ui.getCore !== "function") {
        this.log("Core is not available, cannot load libraries", true);
        return Promise.reject(new Error("Core not available"));
      }
      
      var core = sap.ui.getCore();
      var self = this;
      
      // Try using different loading methods
      if (typeof core.loadLibrary === "function") {
        this.log("Using sap.ui.getCore().loadLibrary");
        
        var promises = libraries.map(function(lib) {
          return new Promise(function(resolve, reject) {
            try {
              core.loadLibrary(lib);
              self.log("Library " + lib + " loaded successfully");
              resolve(lib);
            } catch (e) {
              self.log("Error loading library " + lib + ": " + e.message, true);
              reject(e);
            }
          });
        });
        
        return Promise.all(promises);
      } else {
        this.log("loadLibrary method not available", true);
        
        // Try to load via toUrl and fetch
        var resourceRoot = "/api/xgendynpro/preview/resources/";
        
        var promises = libraries.map(function(lib) {
          var libPath = resourceRoot + lib.replace(/\./g, "/") + "/library.js";
          
          self.log("Loading library via fetch: " + libPath);
          
          return fetch(libPath)
            .then(function(response) {
              if (!response.ok) {
                throw new Error("HTTP error " + response.status);
              }
              return response.text();
            })
            .then(function(code) {
              self.log("Executing library code for: " + lib);
              
              // Wrap in try/catch to avoid stopping other libraries
              try {
                var script = document.createElement("script");
                script.textContent = code;
                document.head.appendChild(script);
                
                self.log("Library executed: " + lib);
                return lib;
              } catch (e) {
                self.log("Error executing library code: " + e.message, true);
                throw e;
              }
            })
            .catch(function(error) {
              self.log("Failed to load library " + lib + ": " + error.message, true);
              throw error;
            });
        });
        
        return Promise.all(promises);
      }
    }
  };
  
  // Add toUrl polyfill if needed
  function addToUrlPolyfill() {
    if (typeof sap === "undefined" || typeof sap.ui === "undefined") {
      window.debugUI5.log("Cannot add toUrl polyfill - sap.ui not available", true);
      return false;
    }
    
    // Add toUrl to sap.ui.require if missing
    if (typeof sap.ui.require === "function" && typeof sap.ui.require.toUrl !== "function") {
      window.debugUI5.log("Adding sap.ui.require.toUrl polyfill");
      
      sap.ui.require.toUrl = function(path) {
        // Remove .js extension if present
        var modulePath = path.replace(/\.js$/, "");
        
        // Handle special cases
        if (modulePath.startsWith("sap/") || 
            modulePath.startsWith("jquery/") || 
            modulePath.startsWith("ui5loader")) {
          return "/api/xgendynpro/preview/resources/" + modulePath;
        }
        
        // Application resources
        return modulePath;
      };
      
      window.debugUI5.log("toUrl polyfill added");
      return true;
    }
    
    return false;
  }
  
  // Mark that index.js is loaded
  window.indexJsLoaded = true;
  
  // Initialize the actual UI5 app with proper define
  window.debugUI5.log("Preparing to define UI5 application");
  
  // Add toUrl polyfill before trying to define
  addToUrlPolyfill();
  
  // Define the actual application
  sap.ui.define([
    "sap/ui/core/ComponentContainer"
  ], function (ComponentContainer) {
    "use strict";
    
    // Log initialization status
    window.debugUI5.log("SAPUI5 modules loaded in index.js");
    
    // When UI5 core is initialized, create the UI
    sap.ui.getCore().attachInit(function() {
      window.debugUI5.log("UI5 Core initialized - creating component");
      
      try {
        // Ensure all required libraries are loaded
        if (!window.debugUI5.ensureLibraries()) {
          window.debugUI5.log("Libraries not fully loaded, trying again in 1 second");
          setTimeout(function() {
            window.debugUI5.log("Retrying component creation");
            createComponentContainer();
          }, 1000);
          return;
        }
        
        createComponentContainer();
      } catch (error) {
        window.debugUI5.log("Error in component initialization: " + error.message, true);
        
        // Show error message
        var container = document.getElementById("app-container");
        if (container) {
          container.innerHTML = "<div style='padding: 20px; color: red'><h3>Error Initializing Component</h3>" +
                           "<p>" + error.message + "</p>" +
                           "<p>Check browser console for more details.</p></div>";
        }
      }
    });
    
    function createComponentContainer() {
      window.debugUI5.log("Creating ComponentContainer for converted.salesorderview");
      
      // Hide the loader if present
      var loaderElement = document.querySelector("#app-container > div");
      if (loaderElement) {
        loaderElement.style.display = "none";
      }
      
      try {
        // Create and place the Component into the DOM using ComponentContainer
        var oComponentContainer = new ComponentContainer({
          name: "converted.salesorderview",
          settings: {
            id: "app"
          },
          async: true,
          manifest: true,
          handleValidation: true
        });
        
        // Place the component and force synchronous rendering
        oComponentContainer.placeAt("app-container");
        sap.ui.getCore().applyChanges();
        
        window.debugUI5.log("ComponentContainer placed in DOM and changes applied");
        
        // Add monitoring to detect rendering issues
        setTimeout(function() {
          var appContainer = document.getElementById("app-container");
          if (appContainer && appContainer.children.length === 0) {
            window.debugUI5.log("Container has no children after rendering, attempting fallback rendering", true);
            
            // Create fallback UI5 components
            var oPage = new sap.m.Page({
              title: "Converted WebDynpro Application",
              content: [
                new sap.m.VBox({
                  alignItems: "Center",
                  justifyContent: "Center",
                  items: [
                    new sap.m.Text({ text: "Application loaded but view rendering failed." }),
                    new sap.m.Button({
                      text: "Reload Application",
                      press: function() { location.reload(); }
                    })
                  ]
                })
              ]
            });
            
            // Create App control and place it directly
            var oApp = new sap.m.App({
              pages: [oPage]
            });
            
            // Clear container first and place fallback directly
            appContainer.innerHTML = "";
            oApp.placeAt("app-container");
          }
        }, 1000);
      } catch (error) {
        window.debugUI5.log("Error creating ComponentContainer: " + error.message, true);
        throw error;
      }
    }
    
    // Also create Component after a timeout in case something goes wrong with normal flow
    setTimeout(function() {
      // Check if UI has been created
      var controls = document.querySelectorAll("#app-container [data-sap-ui]");
      if (!controls || controls.length === 0) {
        window.debugUI5.log("No UI5 controls found after timeout, trying direct creation");
        createComponentContainer();
      }
    }, 3000);
  });
})();