sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/model/json/JSONModel",
        "sap/m/MessageBox"
    ],
    function (Controller, JSONModel, MessageBox) {
        "use strict";

        return Controller.extend("zautodesignapp.controller.ats.transaction.atsbasecontroller", {
            onInit: function () {
                // Shared models for all screens
                this.screenModel = new sap.ui.model.json.JSONModel({
                    openscreen: "screen1"
                });
                this.getView().setModel(this.screenModel, "ScreenVisible");

                this.selectedRowModel = new sap.ui.model.json.JSONModel({

                });
                this.getView().setModel(this.selectedRowModel, "SelectedRow");

                this.atsModel = new sap.ui.model.json.JSONModel({
                    HeaderData: [{
                        daterange: "",
                        selectedMachine: ""
                    }],
                    TableVisible: false
                });
                this.getView().setModel(this.atsModel, "atsModel");


                this.screen2headermodel = new sap.ui.model.json.JSONModel({
                    HEADERDATA: {}
                });
                this.getView().setModel(this.screen2headermodel, "screen2model")
            },

            validateDateRange: function () {
                const headerData = this.atsModel.getProperty("/HeaderData/0");
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

            /* =========================================================
 * 1.  Row click → load Screen-2  (now filters by Batch too)
 * ======================================================= */
            handleRowSelect: async function (oEvent) {
                sap.ui.core.BusyIndicator.show(0);          // spinner ON

                const oTable = oEvent.getSource();
                const iIndex = oTable.getSelectedIndex();

                if (iIndex < 0) {
                    sap.ui.core.BusyIndicator.hide();
                    return;                                  // nothing selected
                }

                /* -------- Header data from the selected row -------- */
                const oCtx = oTable.getContextByIndex(iIndex);
                const oHeaderData = oCtx.getObject();          // has Batch & ManufacturingOrder
                const sOrder = oHeaderData.ManufacturingOrder;
                const sBatch = oHeaderData.Batch;         // ← we’ll filter by this

                /* -------- Put header on Screen-2 ------------------- */
                this.screen2headermodel = new sap.ui.model.json.JSONModel({
                    HEADERDATA: oHeaderData
                });
                this.getView().setModel(this.screen2headermodel, "screen2model");
                this.screen2headermodel.refresh(true);

                /* -------- Fetch only the items that match the batch */
                try {
                    const oItemsModel = this.getView().getModel("ZSB_AU_QA01_ITEM");
                    const aItems = await this.ProOrderItemFetch(oItemsModel, sOrder, sBatch);

                    if (!aItems.length) {
                        sap.m.MessageToast.show("No item rows found for the selected batch.");
                        this.showScreen("screen1");
                        return;
                    }

                    this.tabModels = new sap.ui.model.json.JSONModel({
                        ItemDatas: aItems
                    });
                    this.getView().setModel(this.tabModels, "TabModelsitems");
                    this.tabModels.refresh(true);

                    this.showScreen("screen2");               // finally go to Screen-2
                } catch (err) {
                    sap.m.MessageBox.error("Could not load item data – " + err.message);
                } finally {
                    sap.ui.core.BusyIndicator.hide();         // spinner OFF
                }
            },


            /* =========================================================
             * 2.  Read item rows for one order + one batch
             * ======================================================= */
            ProOrderItemFetch: function (oModel, sOrder, sBatch) {
                return new Promise((resolve, reject) => {
                    const aFilters = [
                        new sap.ui.model.Filter("processorder", sap.ui.model.FilterOperator.EQ, "00" + sOrder),
                        new sap.ui.model.Filter("batch", sap.ui.model.FilterOperator.EQ, String(sBatch)),
                        new sap.ui.model.Filter("qa01_status", sap.ui.model.FilterOperator.EQ, "X")
                    ];

                    var topValue = 5000;
                    var skipValue = 0;

                    oModel.read("/ZC_AU_QA01_ITEM", {

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




            onRowSelectedtableitems: function (oEvent) {
                let oTable = oEvent.getSource(); // Get the table reference
                let selectedIndices = oTable.getSelectedIndices(); // Get selected row indices

                let rowData = selectedIndices.map(index => {
                    return oTable.getContextByIndex(index).getObject();
                });

                console.log("Selected Rows:", rowData);
                this.selectedtabdata = rowData;
            },

            onUpdateItemData: function () {
                if (this.selectedtabdata.length > 0) {

                    var that = this;

                    sap.m.MessageBox.warning("Do you want to submit this data?", {
                        actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
                        emphasizedAction: sap.m.MessageBox.Action.YES,
                        onClose: async function (sAction) {
                            if (sAction === "YES") {
                                sap.ui.core.BusyIndicator.show(0); // Show busy indicator

                                try {
                                    console.log("Updating Data:", that.selectedtabdata);

                                    for (let n = 0; n < that.selectedtabdata.length; n++) {
                                        let getitem = {
                                            weight: String(that.selectedtabdata[n].weight)
                                        };

                                        await that.ToUpdatetableItem(that.selectedtabdata[n], getitem);
                                    }

                                    sap.m.MessageBox.success("Table item data updated successfully.");
                                } catch (error) {
                                    console.error("Error updating table item data:", error);
                                    sap.m.MessageBox.error("Failed to update table item data. Please try again.");
                                } finally {
                                    sap.ui.core.BusyIndicator.hide(); // Always hide busy indicator
                                }
                            } else {
                                sap.m.MessageToast.show("Cancelled");
                                sap.ui.core.BusyIndicator.hide(); // Hide in case cancel action
                            }
                        }
                    });

                } else {
                    sap.m.MessageBox.information("No data selected for update.");
                    return;
                }
            },

            ToUpdatetableItem: function (itemdata, oEntry) {
                var that = this;

                return new Promise((resolve, reject) => {
                    let updatemodel = that.getView().getModel("ZSB_AU_QA01_ITEM");

                    updatemodel.setHeaders({
                        "X-Requested-With": "X",
                        "Content-Type": "application/json"
                    });

                    updatemodel.update("/ZC_AU_QA01_ITEM('" + itemdata.sap_uuid + "')", oEntry, {
                        success: function (odata) {
                            console.log("Table item updated:", odata);
                            resolve(odata);
                        },
                        error: function (oerror) {
                            console.error("Update failed for item:", itemdata.sap_uuid, oerror);
                            reject(oerror);
                        }
                    });
                });
            },




// batch value help 

      onValueHelpRequestBatch: function (oEvent) {

        
           
               sap.ui.core.BusyIndicator.show();

                //   var oFilters1 = new sap.ui.model.Filter("Createdat", sap.ui.model.FilterOperator.EQ, Date);

               const input = oEvent.getSource(); // the Input field
                const context = input.getBindingContext("CompDipsModel");

                this.spath =oEvent.getSource().getParent().getCells()[6];
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

                        var oColumnProductCode, oColumnMaterial,  oColumnPlant, oColumnstorage,oColumnstocktype;
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
                                            new sap.m.Text( { text: "{oJSONBatchModel>Material}" } ),
                                            new sap.m.Text( { text: "{oJSONBatchModel>Plant}" } ),
                                            new sap.m.Text( { text: "{oJSONBatchModel>Batch}" } ),  
                                           new sap.m.Text( { text: "{oJSONBatchModel>StorageLocation}" } ),
                                            new sap.m.Text( { text: "{oJSONBatchModel>MatlWrhsStkQtyInMatlBaseUnit}" } )
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
                this.SelectInputType = 'fragment'
                var text2 = aTokens[0].mProperties.text
                    const result = text2.split(' ')[0];
                    console.log(result); 
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
