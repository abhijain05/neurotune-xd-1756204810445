sap.ui.define([
  "sap/ui/core/UIComponent",
  "sap/ui/Device"
], function (UIComponent, Device) {
  "use strict";

  return UIComponent.extend("converted.salesorderview.Component", {
    metadata: {
      manifest: "json"
    },

    /**
     * The component is initialized by UI5 automatically during the startup of the app
     */
    init: function () {
      // Call the base component's init function
      UIComponent.prototype.init.apply(this, arguments);

      // Set device model
      this.setModel(new sap.ui.model.json.JSONModel(sap.ui.Device), "device");

      // Initialize the router for navigation
      this.getRouter().initialize();
    }
  });
});