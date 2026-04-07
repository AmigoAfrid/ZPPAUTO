sap.ui.define(
    [

        "sap/ui/core/mvc/Controller",
        "sap/ui/model/json/JSONModel",
        "sap/m/MessageBox"
    ],
    function (Controller, JSONModel, MessageBox) {
        "use strict";

        return Controller.extend("zautodesignapp.controller.ais.transaction.aisbasecontroller", {
            onInit: function () {
                // Shared models for all screens
                this.screenModel = new sap.ui.model.json.JSONModel({
                    openscreen: "screen1"
                });
                this.getView().setModel(this.screenModel, "ScreenVisible");

                this.selectedRowModel = new sap.ui.model.json.JSONModel({

                });
                this.getView().setModel(this.selectedRowModel, "SelectedRow");

                this.aisModel = new sap.ui.model.json.JSONModel({
                    HeaderData: [{
                        daterange: "",
                        machineno: ""
                    }],
                    TableVisible: false
                });
                this.getView().setModel(this.aisModel, "aisModel");
            },

            validateDateRange: function () {
                const headerData = this.aisModel.getProperty("/HeaderData/0");
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

            handleRowSelect: async function (oEvent) {
                sap.ui.core.BusyIndicator.show(0);

                const table = oEvent.getSource();
                const selectedIndex = table.getSelectedIndex();

                if (selectedIndex < 0) {
                    sap.ui.core.BusyIndicator.hide();
                    sap.m.MessageToast.show("No row selected.");
                    return;
                }

                const context = table.getContextByIndex(selectedIndex);
                const selectedData = context.getObject();
                const selectedOrder = selectedData.ManufacturingOrder;
                const selectedAcmNo = selectedData.Batch;

                this.selectedRowModel.setData(selectedData);


                const oModelItem = this.getView().getModel("ZSB_AU_QA02_ITEM");

                try {
                    // Set HEADERDATA
                    this.screen2headermodel = new sap.ui.model.json.JSONModel({
                        HEADERDATA: selectedData
                    });
                    this.getView().setModel(this.screen2headermodel, "screen2model");

                    // const filters = [
                    //     new sap.ui.model.Filter("processorder", sap.ui.model.FilterOperator.EQ, selectedOrder),
                    //     new sap.ui.model.Filter("batch", sap.ui.model.FilterOperator.EQ, selectedAcmNo),
                    //     new sap.ui.model.Filter("qa02_status", sap.ui.model.FilterOperator.EQ, "X")
                    // ];

                    const aItems = await this.ProOrderItemFetch(oModelItem, selectedOrder, selectedAcmNo);

                    // const itemsData = await new Promise((resolve, reject) => {
                    //     oModelItem.read("/ZC_AU_QA02ITEM", {
                    //         filters: filters,
                    //         success: function (oData) {
                    //             resolve(oData.results);
                    //         },
                    //         error: function (oError) {
                    //             console.error("❌ Error reading items:", oError);
                    //             sap.m.MessageToast.show("Failed to load item data.");
                    //             reject(oError);
                    //         }
                    //     });
                    // });

                    this.showScreen("screen2");
                    const tabItemModel = new sap.ui.model.json.JSONModel({ Datassitem: aItems });
                    this.getView().setModel(tabItemModel, "TabItemModel");

                } catch (error) {
                    console.error("❌ Exception during row select:", error);
                } finally {
                    sap.ui.core.BusyIndicator.hide();
                }
            },

            ProOrderItemFetch: function (oModel, sOrder, sBatch) {

                return new Promise((resolve, reject) => {
                    const aFilters = [
                        new sap.ui.model.Filter("processorder", sap.ui.model.FilterOperator.EQ, "00" + sOrder),
                        new sap.ui.model.Filter("batch", sap.ui.model.FilterOperator.EQ, String(sBatch)),
                        //new sap.ui.model.Filter("qa02_status", sap.ui.model.FilterOperator.EQ, "X")
                    ];

                    var topValue = 5000;
                    var skipValue = 0;

                    oModel.read("/ZC_AU_QA02ITEM", {
                          urlParameters: {
                            "$top": topValue,
                            "$skip": skipValue
                        },
                        filters: aFilters,
                        success: oData => resolve(oData.results),
                        error: oErr => reject(oErr)
                    });
                });
            },




            // batch value help 

            onValueHelpRequestBatch: function (oEvent) {



                sap.ui.core.BusyIndicator.show();

                //   var oFilters1 = new sap.ui.model.Filter("Createdat", sap.ui.model.FilterOperator.EQ, Date);

                const input = oEvent.getSource(); // the Input field
                const context = input.getBindingContext("CompDipsModel");

                this.spath = oEvent.getSource().getParent().getCells()[6];
                this.storagepath = oEvent.getSource().getParent().getCells()[5];
                console.log("context", context);
                if (context) {
                    const rowData = context.getObject();

                    const aFilters = [
                        new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.EQ, rowData.material),
                        new sap.ui.model.Filter("Plant", sap.ui.model.FilterOperator.EQ, rowData.plant),
                    ];

                    var oMaterial = rowData.material;
                    var oBatch = rowData.batch;



                    // Retrieve the model from the view
                    var oModel = this.getView().getModel("ZCE_BATCH_MATNR_F4_SRVB");

                    // Check if the model is valid
                    if (!oModel) {
                        console.error("OData model is not properly initialized.");
                        sap.ui.core.BusyIndicator.hide();
                        return;
                    }

                    //   var oFilters = [oFilters1];
                    var that = this;
                    var aAllItems = []; // Array to hold all retrieved items

                    // Function to fetch data recursively
                    function fetchData(skipCount) {
                        // var that = this;
                        // var oModel = that.getView().getModel();
                        // that.getView().setModel(oModel);
                        oModel.read("/ZCE_BATCH_BASE_MATNR_F4", {
                            filters: aFilters,
                            urlParameters: {
                                $top: 5000,  // Request a chunk of 5000 records
                                $skip: skipCount  // Start from the skipCount position
                            },
                            success: function (oData) {
                                var aItems = oData.results;
                                aAllItems = aAllItems.concat(aItems); // Concatenate current chunk to the array

                                // Check if there are more records to fetch
                                if (oData.results.length >= 5000) {
                                    // If there are more records, fetch next chunk
                                    fetchData(skipCount + 5000);
                                } else {
                                    // If no more records, all data is fetched
                                    finishFetching();
                                }
                            },
                            error: function (oError) {
                                console.error("Error reading data: ", oError);
                                sap.ui.core.BusyIndicator.hide();
                            }
                        });
                    }

                    function finishFetching() {


                        // Once all data is fetched, proceed to display it
                        that.oJSONBatchModel = new sap.ui.model.json.JSONModel({
                            Datas: aAllItems
                        });
                        that.getView().setModel(that.oJSONBatchModel, "oJSONBatchModel");
                        console.log("that.oJSONBatchModel:", that.oJSONBatchModel)

                        // Load the value help dialog fragment
                        that._oBasicSearchField = new sap.m.SearchField();
                        that.loadFragment({
                            name: "zautodesignapp.view.batchfragment.BatchValueHelpDialogACM"
                        }).then(function (oDialog) {
                            var oFilterBar = oDialog.getFilterBar();

                            var oColumnProductCode, oColumnMaterial, oColumnPlant, oColumnstorage, oColumnstocktype;
                            that._oVHD = oDialog;
                            that.getView().addDependent(oDialog);

                            // Set key fields for filtering in the Define Conditions Tab
                            oDialog.setRangeKeyFields([{
                                label: "Batch No.",
                                key: "Batch",
                                type: "string",
                                typeInstance: new sap.ui.model.type.String({}, {
                                    maxLength: 10
                                })
                            }]);

                            // Set Basic Search for FilterBar
                            oFilterBar.setFilterBarExpanded(false);
                            oFilterBar.setBasicSearch(that._oBasicSearchField);

                            // Trigger filter bar search when the basic search is fired
                            that._oBasicSearchField.attachSearch(function () {
                                oFilterBar.search();
                            });

                            oDialog.getTableAsync().then(function (oTable) {
                                oTable.setModel(that.oJSONBatchModel);

                                // Bind rows/items based on table type (sap.ui.table.Table or sap.m.Table)
                                if (oTable.bindRows) {
                                    // Desktop/Table scenario (sap.ui.table.Table)
                                    oTable.bindAggregation("rows", {
                                        path: "oJSONBatchModel>/Datas",
                                        sorter: new sap.ui.model.Sorter("Batch", false),
                                        events: {
                                            dataReceived: function () {
                                                oDialog.update();
                                            }
                                        }
                                    });


                                    oColumnMaterial = new sap.ui.table.Column({
                                        label: new sap.m.Label({ text: "Material " }),
                                        template: new sap.m.Text({ wrapping: false, text: "{oJSONBatchModel>Material}" })
                                    });
                                    oColumnMaterial.data({
                                        fieldName: "Material"
                                    });

                                    oColumnPlant = new sap.ui.table.Column({
                                        label: new sap.m.Label({ text: "Plant " }),
                                        template: new sap.m.Text({ wrapping: false, text: "{oJSONBatchModel>Plant}" })
                                    });
                                    oColumnPlant.data({
                                        fieldName: "Plant"
                                    });


                                    // Define columns for sap.ui.table.Table
                                    oColumnProductCode = new sap.ui.table.Column({
                                        label: new sap.m.Label({ text: "Batch No " }),
                                        template: new sap.m.Text({ wrapping: false, text: "{oJSONBatchModel>Batch}" })
                                    });
                                    oColumnProductCode.data({
                                        fieldName: "Batch"
                                    });



                                    oColumnstorage = new sap.ui.table.Column({
                                        label: new sap.m.Label({ text: "Storage Location " }),
                                        template: new sap.m.Text({ wrapping: false, text: "{oJSONBatchModel>StorageLocation}" })
                                    });
                                    oColumnstorage.data({
                                        fieldName: "StorageLocation"
                                    });


                                    oColumnstocktype = new sap.ui.table.Column({
                                        label: new sap.m.Label({ text: "Unrestricted Use" }),
                                        template: new sap.m.Text({ wrapping: false, text: "{oJSONBatchModel>MatlWrhsStkQtyInMatlBaseUnit}" })
                                    });
                                    oColumnstocktype.data({
                                        fieldName: "MatlWrhsStkQtyInMatlBaseUnit"
                                    });






                                    oTable.addColumn(oColumnMaterial);
                                    oTable.addColumn(oColumnPlant);
                                    oTable.addColumn(oColumnProductCode);
                                    oTable.addColumn(oColumnstorage);
                                    oTable.addColumn(oColumnstocktype);



                                } else if (oTable.bindItems) {
                                    // Mobile scenario (sap.m.Table)
                                    oTable.bindAggregation("items", {
                                        path: "oJSONBatchModel>/Datas",
                                        template: new sap.m.ColumnListItem({
                                            cells: [
                                                new sap.m.Text({ text: "{oJSONBatchModel>Material}" }),
                                                new sap.m.Text({ text: "{oJSONBatchModel>Plant}" }),
                                                new sap.m.Text({ text: "{oJSONBatchModel>Batch}" }),
                                                new sap.m.Text({ text: "{oJSONBatchModel>StorageLocation}" }),
                                                new sap.m.Text({ text: "{oJSONBatchModel>MatlWrhsStkQtyInMatlBaseUnit}" })
                                            ]
                                        }),
                                        events: {
                                            dataReceived: function () {
                                                oDialog.update();
                                            }
                                        }
                                    });

                                    // Define columns for sap.m.Table (if necessary)
                                    oTable.addColumn(new sap.m.Column({
                                        header: new sap.m.Label({ text: "Batch No" })
                                    }));

                                    oTable.addColumn(new sap.m.Column({
                                        header: new sap.m.Label({ text: "Material" })
                                    }));
                                    oTable.addColumn(new sap.m.Column({
                                        header: new sap.m.Label({ text: "Plant" })
                                    }));
                                    oTable.addColumn(new sap.m.Column({
                                        header: new sap.m.Label({ text: "Storage Location" })
                                    }));

                                    oTable.addColumn(new sap.m.Column({
                                        header: new sap.m.Label({ text: "Unrestricted Use" })
                                    }));


                                }

                                oDialog.update();
                                sap.ui.core.BusyIndicator.hide();
                            });

                            oDialog.open();
                            sap.ui.core.BusyIndicator.hide();
                        });
                    }
                    fetchData(0);
                }
                // Start fetching data from the beginning


                //   sap.m.MessageBox.error("Please check Company Code / Fiscal Year");


            },


            onValueHelpOkPressBatch: function (oEvent) {



                var aTokens = oEvent.getParameter("tokens");
                console.log("aTokens:", aTokens)
                let text = aTokens[0].getKey();
                var text2 = aTokens[0].mProperties.text
                    const result = text2.split(' ')[0];
                    console.log(result); 
                this.SelectInputType = 'fragment'
                
                this.spath.setValue(text);
                this.storagepath.setText(result);
                this._oVHD.close();


            },

            onValueHelpCancelPressBatch: function () {
                this._oVHD.close();
            },

            onValueHelpCancelPressBatch: function () {
                this._oVHD.destroy();
            },

            onFilterBarSearchBatch: function (oEvent) {
                var sSearchQuery = this._oBasicSearchField.getValue(),
                    aSelectionSet = oEvent.getParameter("selectionSet");

                var aFilters = aSelectionSet && aSelectionSet.reduce(function (aResult, oControl) {
                    if (oControl.getValue()) {
                        aResult.push(new sap.ui.model.Filter({
                            path: oControl.getName(),
                            operator: FilterOperator.Contains,
                            value1: oControl.getValue()
                        }));
                    }

                    return aResult;
                }, []);

                aFilters.push(new sap.ui.model.Filter({
                    filters: [
                        new sap.ui.model.Filter({ path: "Batch", operator: sap.ui.model.FilterOperator.Contains, value1: sSearchQuery })

                    ],
                    and: false
                }));

                this._filterTable(new sap.ui.model.Filter({
                    filters: aFilters,
                    and: true
                }));
            },

            _filterTable: function (oFilter) {
                var oVHD = this._oVHD;

                oVHD.getTableAsync().then(function (oTable) {
                    if (oTable.bindRows) {
                        oTable.getBinding("rows").filter(oFilter);
                    }
                    if (oTable.bindItems) {
                        oTable.getBinding("items").filter(oFilter);
                    }

                    // This method must be called after binding update of the table.
                    oVHD.update();
                });
            }



        });
    }
);
