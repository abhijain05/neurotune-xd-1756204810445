sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/ui/core/util/Export",
	"sap/ui/core/util/ExportTypeCSV",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Sorter"
], function(Controller, JSONModel, MessageToast, MessageBox, Export, ExportTypeCSV, Filter, FilterOperator, Sorter) {
	"use strict";

	return Controller.extend("converted.salesorderview.controller.SalesOrderView", {
		onInit: function() {
			// Load mock data from JSON files
			var oOrderModel = new JSONModel();
			oOrderModel.loadData("model/mockData/orders.json");
			this.getView().setModel(oOrderModel, "orders");
		},

		onExportToCSV: function() {
			var oTable = this.byId("salesOrderItemsTable");
			var aData = oTable.getModel("orders").getData().items; // Access items array
			var sCsvContent = this._convertToCSV(aData);
			var oBlob = new Blob([sCsvContent], {
				type: "text/csv"
			});
			var sUrl = URL.createObjectURL(oBlob);
			var oLink = document.createElement("a");
			oLink.href = sUrl;
			oLink.download = "sales_order_items.csv";
			oLink.click();
			URL.revokeObjectURL(sUrl);
		},

		_convertToCSV: function(aData) {
			if (!aData || aData.length === 0) return "";
			var aHeaders = Object.keys(aData[0]);
			var sCsv = aHeaders.join(",") + "\n";
			aData.forEach(function(row) {
				var aValues = aHeaders.map(function(header) {
					return '"' + (row[header] || "").toString().replace(/"/g, '""') + '"';
				});
				sCsv += aValues.join(",") + "\n";
			});
			return sCsv;
		},


		onExportToExcel: function() {
			let oTable = this.byId("salesOrderItemsTable");
			let oExport = new Export({
				exportType: new ExportTypeCSV({
					fileExtension: "xlsx",
					mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
				}),
				models: oTable.getModel("orders"),
				rows: {
					path: "/items" // Path to the items array in the model
				},
				columns: this._getExportColumns()
			});

			oExport.saveFile("sales_order_items").then(function() {
				MessageToast.show("Export to Excel completed");
			}).catch(function(error) {
				MessageToast.show("Error during Excel export: " + error.message);
			});
		},

		_getExportColumns: function() {
			let oTable = this.byId("salesOrderItemsTable");
			let aColumns = oTable.getColumns();
			return aColumns.map(column => ({
				name: column.getHeader().getText(),
				template: {
					content: {
						path: column.getCells()[0].getBindingPath("text")
					}
				}
			}));
		},

		onSearch: function(oEvent) {
			var sQuery = oEvent.getParameter("query");
			var oTable = this.byId("salesOrderItemsTable");
			var oBinding = oTable.getBinding("items");
			var aFilters = [];

			if (sQuery && sQuery.length > 0) {
				aFilters.push(new Filter([
					new Filter("SalesOrderItemPosition", FilterOperator.Contains, sQuery),
					new Filter("ProductName", FilterOperator.Contains, sQuery),
					new Filter("ProductDescription", FilterOperator.Contains, sQuery)
				], false)); // OR condition
			}
			oBinding.filter(aFilters);
		},

		// Placeholder for other event handlers (e.g., filtering, sorting, navigation)
		// ... (Add other event handlers as needed)
	});
});
