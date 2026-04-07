sap.ui.define(
    [

        "sap/ui/core/mvc/Controller",
        "sap/ui/model/json/JSONModel",
        "sap/m/MessageBox",
        "zautodesignapp/util/PDFLib",
        "sap/m/PDFViewer",
    ],
    function (Controller, JSONModel, MessageBox) {
        "use strict";

        return Controller.extend("zautodesignapp.controller.qa03.transaction.qa03basecontroller", {
            onInit: function () {
                // Shared models for all screens
                this.screenModel = new sap.ui.model.json.JSONModel({
                    openscreen: "screen1"
                });
                this.getView().setModel(this.screenModel, "ScreenVisible");

                this.selectedRowModel = new sap.ui.model.json.JSONModel({

                });
                this.getView().setModel(this.selectedRowModel, "SelectedRow");

                this.qa03Model = new sap.ui.model.json.JSONModel({
                    HeaderData: [{
                        daterange: "",
                        machineno: ""
                    }],
                    TableVisible: false
                });
                this.getView().setModel(this.qa03Model, "qa03Model");


                // Create the table item model for screen 2
                this.TabItemModel = new sap.ui.model.json.JSONModel({
                    Datassitem: [{
                        batch: "",
                        shift: "",
                        boxno: "",
                        pgtshift: "",
                        zdate: "",
                        pgtdate: "",
                        averagewt: "",
                        weight: "",
                        cumulativeqty: "",
                        ptgweight: "0.00",
                        gradeats: "",
                        gradeais: "",
                        gradeForptg: "",
                        ptgwastage: "0.00",
                        qtyltre: "0.00",
                        agradewt: "",
                        cumltagrade: "",
                        materialdoc: "",
                        Remarks: "",
                        hfx: "",
                        floorwastage: "",
                        qaname: "",
                        operatorname: "",
                        ptgmachineno: ""
                    }],  // Static, only one plant
                });

                // Set the model to the view
                this.getView().setModel(this.TabItemModel, "TabItemModel");


                this.rowdatamodel = new sap.ui.model.json.JSONModel({
                    itemdatas: []
                });
                this.getView().setModel(this.rowdatamodel, "rowdatamodel");

                this._pdfViewer = new sap.m.PDFViewer({
                    isTrustedSource: true,
                    width: "100%",
                    height: "600px", // Adjust height as needed
                    title: "QA03 Print"
                });
                this.getView().addDependent(this._pdfViewer);
            },

            validateDateRange: function () {
                const headerData = this.qa03Model.getProperty("/HeaderData/0");
                const dateRange = headerData.daterange;
                const machine = headerData.machineno;
                if (!dateRange || !machine) {
                    MessageBox.error("Please select a date range and machine no.");
                    return false;
                }

                return true;
            },

            showScreen: function (screenName) {
                this.screenModel.setProperty("/openscreen", screenName);
            },



        });
    }
);
