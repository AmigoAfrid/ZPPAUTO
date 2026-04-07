sap.ui.define([
    "zautodesignapp/controller/ftp/transaction/ftpbasecontroller",
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/IconPool",
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    "sap/ui/model/json/JSONModel",
    "zautodesignapp/util/jspdf/html2canvasmin",
    "zautodesignapp/util/jspdf/jspdfmin",],
    function (BaseController, IconPool, Filter, FilterOperator, JSONModel) {
        "use strict"; return BaseController.extend("zautodesignapp.controller.ftp.transaction.ftp_selectrange",
            {
                onInit: function () {
                    BaseController.prototype.onInit.call(this);

                    // Initialize TabModel specific to this screen
                    // Screen-1 TABLE ITEM MODEL 
                    const tabModel = new sap.ui.model.json.JSONModel({
                        ItemData: []
                    });
                    this.getView().setModel(tabModel, "TabModel");

                    // Screen-2 TABLE ITEM MODEL
                    this.tabModels = new sap.ui.model.json.JSONModel({
                        ItemDatas:
                            {}
                    })
                    this.getView().setModel(this.tabModels, "TabModels")

                    //    For POSTING Status and Material docmument no (Message strip based)
                    this.FinalStatus = new sap.ui.model.json.JSONModel({
                        MSGSTRIP: {
                            "visible": false,
                            "text": "",
                            "type": 'Success'
                        }
                    });
                    this.getView().setModel(this.FinalStatus, "FinalStatus")


                    this.SelectInputType = 'fragment'

                    //    Json model for Button - Start
                    this.ButtonStatus = new sap.ui.model.json.JSONModel({
                        Buttons: {
                            "create": true,
                            "update": false,
                            "gi": false,
                            "gr": false,
                            "print": false,
                            "cancel": true,
                        }
                    });
                    this.getView().setModel(this.ButtonStatus, "ButtonStatus")

                    //    Json model for Button - End
                },

                // OnGoItemPage: function () {

                //     const headerData = this.ftModel.getProperty("/HeaderData/0");
                //     const Dates = headerData.daterange;
                //     const processorder = headerData.processorder;


                //     const bHasDate = Dates && Dates.trim() !== "";
                //     const bHasOrder = processorder && processorder.trim() !== "";

                //     if (!bHasDate && !bHasOrder) {
                //         sap.m.MessageBox.information("Please enter either a Date Range or a Process Order.");
                //         return false;
                //     }

                //     // Make the table visible
                //     this.ftModel.setProperty("/TableVisible", true);

                //     let FromDate = "", ToDate = "";
                //     if (bHasDate) {
                //         const myArray = Dates.split(" - ");
                //         const datefrom = new Date(myArray[0]);
                //         const dateto = new Date(myArray[1]);
                //         FromDate = new Date(datefrom.getTime() - (datefrom.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
                //         ToDate = new Date(dateto.getTime() - (dateto.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
                //     }

                //     //  Filter Logic
                //     let FinalFilter = [];

                //     if (bHasOrder) {
                //         FinalFilter.push(new sap.ui.model.Filter("ManufacturingOrder", sap.ui.model.FilterOperator.EQ, processorder));
                //     }

                //     if (bHasDate) {
                //         FinalFilter.push(new sap.ui.model.Filter("CreationDate", sap.ui.model.FilterOperator.BT, FromDate, ToDate));
                //     }




                //     // Data fetch
                //     const model0 = this.getView().getModel("ZAU_FT_PROCESSORDER_SRVB_");
                //     let aAllItems = [];
                //     let iSkip = 0;
                //     const iTop = 100;
                //     const that = this;

                //     that.getView().setBusy(true);

                //     function fetchData() {
                //         model0.read("/ZCE_FT_PROCESSORDER", {
                //             filters: FinalFilter,
                //             urlParameters: {
                //                 "$skip": iSkip,
                //                 "$top": iTop
                //             },
                //             success: function (oData) {
                //                 if (oData.results.length > 0) {
                //                     aAllItems = aAllItems.concat(oData.results);
                //                     iSkip += iTop;
                //                     fetchData();
                //                 } else {
                //                     // that.tabModel = new sap.ui.model.json.JSONModel({ ItemData: aAllItems });
                //                      const aFilteredItems = aAllItems.filter(item => {
                //                     return parseFloat(item.Rem_Qty) !== 0;
                //                      });
                //                     that.tabModel = new sap.ui.model.json.JSONModel({ ItemData: aFilteredItems });
                //                     that.getView().setModel(that.tabModel, "TabModel");
                //                     that.getView().setBusy(false);
                //                     console.log("All items loaded:", aAllItems.length);
                //                 }
                //             },
                //             error: function (error) {
                //                 console.log("Error:", error);
                //                 that.getView().setBusy(false);
                //             }
                //         });
                //     }

                //     fetchData();
                // },



                OnGoItemPage: function () {

                    // const oBatch = this.getView().byId("batchId").getValue();
                    // const processorder = this.getView().byId("processOrderId").getValue();
                    // const Dates = this.getView().byId("dateId").getValue();


                    const headerData = this.ftModel.getProperty("/HeaderData/0");
                    const Dates = headerData.daterange;
                    const processorder = headerData.processorder;
                    const oBatch = headerData.Batch;
                    

                    const bHasDate = Dates && Dates.trim() ;
                    const bHasOrder = processorder && processorder.trim() ;
                   

                    

                    let FromDate = "", ToDate = "";
                    if (bHasDate) {
                        const myArray = Dates.split(" - ");
                        const datefrom = new Date(myArray[0]);
                        const dateto = new Date(myArray[1]);
                        FromDate = new Date(datefrom.getTime() - (datefrom.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
                        ToDate = new Date(dateto.getTime() - (dateto.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
                    }

                    if(!oBatch && !bHasOrder && !bHasDate){
                        sap.m.MessageBox.information("Please select atleast any one input in header");
                        return;
                    }

                    // Make the table visible
                    this.ftModel.setProperty("/TableVisible", true);

                    //  Filter Logic
                    let aFilter = [];

                    if (oBatch) {
                        aFilter.push(new sap.ui.model.Filter("Batch", sap.ui.model.FilterOperator.EQ, oBatch));
                    }

                    if (bHasOrder) {
                        aFilter.push(new sap.ui.model.Filter("ManufacturingOrder", sap.ui.model.FilterOperator.EQ, bHasOrder));
                    }

                    if (bHasDate) {
                        aFilter.push(new sap.ui.model.Filter("CreationDate", sap.ui.model.FilterOperator.BT, FromDate, ToDate));
                    }
                    

                    // Combine all filters
                    const FinalFilter = new sap.ui.model.Filter({
                        filters: aFilter,
                        and: true
                    });


                    // Data fetch
                    const model0 = this.getView().getModel("ZAU_FT_PROCESSORDER_SRVB_");
                    let aAllItems = [];
                    let iSkip = 0;
                    const iTop = 100;
                    const that = this;

                    that.getView().setBusy(true);

                    function fetchData() {
                        model0.read("/ZCE_FT_PROCESSORDER", {
                            filters: [FinalFilter],
                            urlParameters: {
                                "$skip": iSkip,
                                "$top": iTop
                            },
                            success: function (oData) {
                                if (oData.results.length > 0) {
                                    aAllItems = aAllItems.concat(oData.results);
                                    iSkip += iTop;
                                    fetchData();
                                } else {
                                    //that.tabModel = new sap.ui.model.json.JSONModel({ ItemData: aAllItems });
                                    const aFilteredItems = aAllItems.filter(item => {
                                        return parseFloat(item.Rem_Qty) !== 0;
                                    });
                                    that.tabModel = new sap.ui.model.json.JSONModel({ ItemData: aFilteredItems });
                                    that.getView().setModel(that.tabModel, "TabModel");
                                    that.getView().setBusy(false);
                                    console.log("All items loaded:", aAllItems.length);
                                }
                            },
                            error: function (error) {
                                console.log("Error:", error);
                                that.getView().setBusy(false);
                            }
                        });
                    }

                    fetchData();
                },




                OnDateFormatChange: function (GetData) {
                    return new Promise(function (resolve, reject) {
                        if (GetData !== null) {
                            let Dtasss = GetData;
                            Dtasss = new Date(Dtasss);
                            var dd = '' + Dtasss.getDate();
                            var mm = '' + (Dtasss.getMonth() + 1); //January is 0!
                            if (mm.length < 2) {
                                mm = '0' + mm;
                            }
                            if (dd.length < 2) {
                                dd = '0' + dd;
                            }
                            var yyyy = Dtasss.getFullYear();
                            let Dtasss1 = yyyy + '-' + mm + '-' + dd;
                            let Dtasss2 = dd + '-' + mm + '-' + yyyy;
                            resolve(Dtasss2)
                        }
                    });

                },



                onGoToScreen2: function () {
                    this.showScreen("screen2");
                    let ButtonJsonModel = this.ButtonStatus.getProperty("/Buttons/")
                    ButtonJsonModel.create = true;
                    //
                    ButtonJsonModel.update = false;
                    ButtonJsonModel.gi = false;
                    ButtonJsonModel.gr = false;
                    ButtonJsonModel.print = false;
                    this.ButtonStatus.refresh();

                    this.FinalStatus = new sap.ui.model.json.JSONModel({
                        MSGSTRIP: {
                            "visible": false,
                            "text": " ",
                            "type": 'Success'
                        }
                    });
                    this.getView().setModel(this.FinalStatus, "FinalStatus")
                    this.FinalStatus.refresh()


                },

                onGoToScreen1: function () {
                    this.showScreen("screen1");
                    const tabModel = new sap.ui.model.json.JSONModel({
                        ItemData: []
                    });
                    this.getView().setModel(tabModel, "TabModel");

                    let ButtonJsonModel = this.ButtonStatus.getProperty("/Buttons/")
                    ButtonJsonModel.create = true;
                    ButtonJsonModel.update = false;
                    ButtonJsonModel.gi = false;
                    ButtonJsonModel.gr = false;
                    ButtonJsonModel.print = false;
                    this.ButtonStatus.refresh();

                    this.FinalStatus = new sap.ui.model.json.JSONModel({
                        MSGSTRIP: {
                            "visible": false,
                            "text": " ",
                            "type": 'Success'
                        }
                    });
                    this.getView().setModel(this.FinalStatus, "FinalStatus")
                    this.FinalStatus.refresh()



                },



                // Screen-1 TABLE ITEM MODEL ROW SELECT  
                onRowSelect: function (oEvent) {
                    // Use the base controller's row select logic
                    this.handleRowSelect(oEvent);
                },


                // starting screen batch value help code


                //: Batch Fragment in header : =========================================================================================================

                onBatchHelpRequestPress: function () {

                    sap.ui.core.BusyIndicator.show();

                    var oModel = this.getView().getModel("ZAU_FT_PROCESSORDER_SRVB_");

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
                        oModel.read("/ZCE_FT_BATCH_VH", {
                            //   filters: oFilters,
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
                        that.oJSONModel = new sap.ui.model.json.JSONModel({
                            Datas: aAllItems
                        });
                        that.getView().setModel(that.oJSONModel, "oJSONModel");
                        console.log("that.oJSONModel:", that.oJSONModel)

                        // Load the value help dialog fragment
                        that._oBasicSearchField = new sap.m.SearchField();
                        that.loadFragment({
                            name: "zautodesignapp.view.ftp.transaction.fragment.batchHelpDialog"
                        }).then(function (oDialog) {
                            var oFilterBar = oDialog.getFilterBar();

                            var oColumnProductCode, oColumnPostingDate, oColumnCompanyCode;
                            that._oVHD_B = oDialog;
                            that.getView().addDependent(oDialog);

                            // Set key fields for filtering in the Define Conditions Tab
                            oDialog.setRangeKeyFields([{
                                label: "Batch.",
                                key: "Batch",
                                type: "string",
                                typeInstance: new sap.ui.model.type.String({}, {
                                    maxLength: 15
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
                                oTable.setModel(that.oJSONModel);

                                // Bind rows/items based on table type (sap.ui.table.Table or sap.m.Table)
                                if (oTable.bindRows) {
                                    // Desktop/Table scenario (sap.ui.table.Table)
                                    oTable.bindAggregation("rows", {
                                        path: "oJSONModel>/Datas",
                                        events: {
                                            dataReceived: function () {
                                                oDialog.update();
                                            }
                                        }
                                    });

                                    // Define columns for sap.ui.table.Table
                                    oColumnProductCode = new sap.ui.table.Column({
                                        label: new sap.m.Label({ text: "Batch." }),
                                        template: new sap.m.Text({ wrapping: false, text: "{oJSONModel>Batch}" })
                                    });
                                    oColumnProductCode.data({
                                        fieldName: "Batch"
                                    });



                                    oTable.addColumn(oColumnProductCode);


                                } else if (oTable.bindItems) {
                                    // Mobile scenario (sap.m.Table)
                                    oTable.bindAggregation("items", {
                                        path: "oJSONModel>/Datas",
                                        template: new sap.m.ColumnListItem({
                                            cells: [
                                                new sap.m.Text({ text: "{oJSONModel>Batch}" }),


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
                                        header: new sap.m.Label({ text: "Batch." })
                                    }));

                                }

                                oDialog.update();
                                sap.ui.core.BusyIndicator.hide();
                            });

                            oDialog.open();
                            sap.ui.core.BusyIndicator.hide();
                        });
                    }

                    // Start fetching data from the beginning
                    fetchData(0);

                },

                onBatchValueHelpOkPress: function (oEvent) {

                    var oInput = this.byId("batchId");
                    var aTokens = oEvent.getParameter("tokens");

                    console.log("aTokens:", aTokens);

                    var sSelectedText = aTokens[0].getText(); // get the text of the first token
                    oInput.setValue(sSelectedText);

                    this._oVHD_B.close();
                },

                onBatchValueHelpCancelPress: function () {
                    this._oVHD_B.close();
                },

                onBatchValueHelpAfterClose: function () {
                    this._oVHD_B.destroy();
                },

                onBatchFilterBarSearch: function (oEvent) {
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

                    this._filterTable_Batch(new sap.ui.model.Filter({
                        filters: aFilters,
                        and: true
                    }));
                },

                _filterTable_Batch: function (oFilter) {
                    var oVHD = this._oVHD_B;

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
                },

                OnSuggest_User_Batch: function (oEvent) {
                    var sTerm = oEvent.getParameter("suggestValue");
                    console.log("Press")

                    this._connectToOData_Batch(sTerm)
                        .then(function (aSuggestions) {
                            // Clear previous suggestions
                            this.destroySuggestionItems();
                            // Add new suggestions to the input field
                            for (var i = 0; i < aSuggestions.length; i++) {
                                this.addSuggestionItem(new sap.ui.core.Item({
                                    text: aSuggestions[i]
                                }));
                            }
                        }.bind(oEvent.getSource()));
                },

                _connectToOData_Batch: function (sTerm) {
                    var oModel = this.getView().getModel('ZAU_FT_PROCESSORDER_SRVB_'); // OData Model
                    var aFilters = [
                        new sap.ui.model.Filter("Batch", sap.ui.model.FilterOperator.Contains, sTerm) // Search based on Name
                    ];

                    return new Promise(function (fnResolve, fnReject) {
                        // Perform OData read request
                        oModel.read("/ZCE_FT_BATCH_VH", {  // Replace "/ProductSet" with your OData entity set
                            filters: aFilters,
                            success: function (oData) {
                                var aResults = oData.results.map(function (mProduct) {
                                    return mProduct.Batch;  // Assuming Name is the field you're interested in
                                });

                                // Remove duplicates using a Set
                                var aUniqueResults = Array.from(new Set(aResults));

                                fnResolve(aUniqueResults);
                            },
                            error: function (oError) {
                                console.error("Error fetching suggestions from OData service:", oError);
                                fnReject(oError);
                            }
                        });
                    });
                },

                ondocumentsuggestselected_Batch: function (oEvent) {
                    // Show the busy indicator as soon as the item is selected
                    sap.ui.core.BusyIndicator.show();

                    var oSelectedItem = oEvent.getParameter("selectedItem");
                    if (oSelectedItem) {
                        var sSelectedKey = oSelectedItem.getKey();
                        var sSelectedText = oSelectedItem.getText();
                        console.log("Selected Item:", sSelectedKey, sSelectedText);
                        this.SelectInputType = 'select'
                        // Set the selected key into the input field
                        var oMultiInput = this.getView().byId("batchId");
                        oMultiInput.setValue(sSelectedText); // Set the selected key into the MultiInput field
                    }

                    // Hide the busy indicator after the update
                    sap.ui.core.BusyIndicator.hide();
                },


                //: Process Order Fragment in header : =========================================================================================================
                onProcessOrderHelpRequestPress: function () {

                    sap.ui.core.BusyIndicator.show();

                    var oModel = this.getView().getModel("ZAU_FT_PROCESSORDER_SRVB_");

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
                        oModel.read("/ZCE_FT_PROCESSORDER", {
                            //   filters: oFilters,
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
                        that.oJSONModel = new sap.ui.model.json.JSONModel({
                            Datas: aAllItems
                        });
                        that.getView().setModel(that.oJSONModel, "oJSONModel");
                        console.log("that.oJSONModel:", that.oJSONModel)

                        // Load the value help dialog fragment
                        that._oBasicSearchField = new sap.m.SearchField();
                        that.loadFragment({
                            name: "zautodesignapp.view.ftp.transaction.fragment.processOrderHelpDialog"
                        }).then(function (oDialog) {
                            var oFilterBar = oDialog.getFilterBar();

                            var oColumnProductCode, oColumnPostingDate, oColumnCompanyCode;
                            that._oVHD_P = oDialog;
                            that.getView().addDependent(oDialog);

                            // Set key fields for filtering in the Define Conditions Tab
                            oDialog.setRangeKeyFields([{
                                label: "ManufacturingOrder.",
                                key: "ManufacturingOrder",
                                type: "string",
                                typeInstance: new sap.ui.model.type.String({}, {
                                    maxLength: 15
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
                                oTable.setModel(that.oJSONModel);

                                // Bind rows/items based on table type (sap.ui.table.Table or sap.m.Table)
                                if (oTable.bindRows) {
                                    // Desktop/Table scenario (sap.ui.table.Table)
                                    oTable.bindAggregation("rows", {
                                        path: "oJSONModel>/Datas",
                                        events: {
                                            dataReceived: function () {
                                                oDialog.update();
                                            }
                                        }
                                    });

                                    // Define columns for sap.ui.table.Table
                                    oColumnProductCode = new sap.ui.table.Column({
                                        label: new sap.m.Label({ text: "ManufacturingOrder." }),
                                        template: new sap.m.Text({ wrapping: false, text: "{oJSONModel>ManufacturingOrder}" })
                                    });
                                    oColumnProductCode.data({
                                        fieldName: "ManufacturingOrder"
                                    });



                                    oTable.addColumn(oColumnProductCode);


                                } else if (oTable.bindItems) {
                                    // Mobile scenario (sap.m.Table)
                                    oTable.bindAggregation("items", {
                                        path: "oJSONModel>/Datas",
                                        template: new sap.m.ColumnListItem({
                                            cells: [
                                                new sap.m.Text({ text: "{oJSONModel>ManufacturingOrder}" }),


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
                                        header: new sap.m.Label({ text: "ManufacturingOrder." })
                                    }));

                                }

                                oDialog.update();
                                sap.ui.core.BusyIndicator.hide();
                            });

                            oDialog.open();
                            sap.ui.core.BusyIndicator.hide();
                        });
                    }

                    // Start fetching data from the beginning
                    fetchData(0);

                },

                onProcessOrderValueHelpOkPress: function (oEvent) {

                    var oInput = this.byId("processOrderId");
                    var aTokens = oEvent.getParameter("tokens");

                    console.log("aTokens:", aTokens);

                    var sSelectedText = aTokens[0].getText(); // get the text of the first token
                    oInput.setValue(sSelectedText);

                    this._oVHD_P.close();
                },

                onProcessOrderValueHelpCancelPress: function () {
                    this._oVHD_P.close();
                },

                onProcessOrderValueHelpAfterClose: function () {
                    this._oVHD_P.destroy();
                },

                onProcessOrderFilterBarSearch: function (oEvent) {
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
                            new sap.ui.model.Filter({ path: "ManufacturingOrder", operator: sap.ui.model.FilterOperator.Contains, value1: sSearchQuery })

                        ],
                        and: false
                    }));

                    this._filterTable_ProcessOrder(new sap.ui.model.Filter({
                        filters: aFilters,
                        and: true
                    }));
                },

                _filterTable_ProcessOrder: function (oFilter) {
                    var oVHD = this._oVHD_P;

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
                },

                OnSuggest_User_ProcessOrder: function (oEvent) {
                    var sTerm = oEvent.getParameter("suggestValue");
                    console.log("Press")

                    this._connectToOData_ProcessOrder(sTerm)
                        .then(function (aSuggestions) {
                            // Clear previous suggestions
                            this.destroySuggestionItems();
                            // Add new suggestions to the input field
                            for (var i = 0; i < aSuggestions.length; i++) {
                                this.addSuggestionItem(new sap.ui.core.Item({
                                    text: aSuggestions[i]
                                }));
                            }
                        }.bind(oEvent.getSource()));
                },

                _connectToOData_ProcessOrder: function (sTerm) {
                    var oModel = this.getView().getModel('ZAU_FT_PROCESSORDER_SRVB_'); // OData Model
                    var aFilters = [
                        new sap.ui.model.Filter("ManufacturingOrder", sap.ui.model.FilterOperator.Contains, sTerm) // Search based on Name
                    ];

                    return new Promise(function (fnResolve, fnReject) {
                        // Perform OData read request
                        oModel.read("/ZCE_FT_PROCESSORDER", {  // Replace "/ProductSet" with your OData entity set
                            filters: aFilters,
                            success: function (oData) {
                                var aResults = oData.results.map(function (mProduct) {
                                    return mProduct.ManufacturingOrder;  // Assuming Name is the field you're interested in
                                });

                                // Remove duplicates using a Set
                                var aUniqueResults = Array.from(new Set(aResults));

                                fnResolve(aUniqueResults);
                            },
                            error: function (oError) {
                                console.error("Error fetching suggestions from OData service:", oError);
                                fnReject(oError);
                            }
                        });
                    });
                },

                ondocumentsuggestselected_ProcessOrder: function (oEvent) {
                    // Show the busy indicator as soon as the item is selected
                    sap.ui.core.BusyIndicator.show();

                    var oSelectedItem = oEvent.getParameter("selectedItem");
                    if (oSelectedItem) {
                        var sSelectedKey = oSelectedItem.getKey();
                        var sSelectedText = oSelectedItem.getText();
                        console.log("Selected Item:", sSelectedKey, sSelectedText);
                        this.SelectInputType = 'select'
                        // Set the selected key into the input field
                        var oMultiInput = this.getView().byId("processOrderId");
                        oMultiInput.setValue(sSelectedText); // Set the selected key into the MultiInput field
                    }

                    // Hide the busy indicator after the update
                    sap.ui.core.BusyIndicator.hide();
                },





                // 

                // batch value help item

                onValueHelpRequestBatch: function (oEvent) {



                    sap.ui.core.BusyIndicator.show();
                    this.StorageLocRowCollNo = oEvent.getSource().getParent();


                    //   var oFilters1 = new sap.ui.model.Filter("Createdat", sap.ui.model.FilterOperator.EQ, Date);
                    //let Material01 = this.StorageLocRowCollNo.getCells()[1].getText();
                    //let Plant01 = this.StorageLocRowCollNo.getCells()[4].getText();


                    let getHeaderDatas = this.screen2headermodel.getProperty("/HEADERDATA/");
                    console.log("getHeaderDatas:", getHeaderDatas)
                    let getItemData = this.tabModels.getProperty("/ItemDatas/");

                    //let Plant01 = getHeaderDatas.ProductionPlant   oEvent.getSource().getParent().getCells()[1].mProperties.text
                    //let Material01 = getItemData[0].Product 
                    let Material01 = oEvent.getSource().getParent().getCells()[1].mProperties.text
                    let Plant01 = getHeaderDatas.ProductionPlant


                    this.spath = oEvent.getSource().getParent().getCells()[3];
                    this.storagepath = oEvent.getSource().getParent().getCells()[6];
                    // console.log("context", context);

                    // const rowData = context.getObject();

                    const aFilters = [
                        new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.EQ, Material01),
                        new sap.ui.model.Filter("Plant", sap.ui.model.FilterOperator.EQ, Plant01),
                    ];





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

                    // Start fetching data from the beginning


                    //   sap.m.MessageBox.error("Please check Company Code / Fiscal Year");


                },


                onValueHelpOkPressBatch: function (oEvent) {

                    var aTokens = oEvent.getParameter("tokens");
                    console.log("aTokens:", aTokens)
                    let text = aTokens[0].getKey();
                    var text2 = aTokens[0].mProperties.text
                    const result = text2.split(' ')[0];
                    console.log(result); // "1230" this.storagepath 
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
                },


                onManualBatchChange: function (oEvent) {
                    const oInput = oEvent.getSource();
                    const sEnteredBatch = oInput.getValue().trim();

                    if (!sEnteredBatch) return;

                    sap.ui.core.BusyIndicator.show();

                    const oRow = oInput.getParent();
                    const sMaterial = oRow.getCells()[1].getText();
                    const getHeaderDatas = this.screen2headermodel.getProperty("/HEADERDATA/");
                    const sPlant = getHeaderDatas.ProductionPlant;

                    const oModel = this.getView().getModel("ZCE_BATCH_MATNR_F4_SRVB");
                    if (!oModel) {
                        sap.m.MessageBox.error("Batch validation model not initialized.");
                        sap.ui.core.BusyIndicator.hide();
                        return;
                    }


                    console.log("Validating batch:", { sMaterial, sPlant, sEnteredBatch });


                    const aFilters = [
                        new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.EQ, sMaterial),
                        new sap.ui.model.Filter("Plant", sap.ui.model.FilterOperator.EQ, sPlant),
                        new sap.ui.model.Filter("Batch", sap.ui.model.FilterOperator.EQ, sEnteredBatch)
                    ];

                    const that = this;

                    oModel.read("/ZCE_BATCH_BASE_MATNR_F4", {
                        filters: aFilters,
                        success: function (oData) {
                            sap.ui.core.BusyIndicator.hide();
                            console.log("Batch validation response:", oData);

                            if (!oData.results || oData.results.length === 0) {
                                sap.m.MessageBox.error("Invalid batch. Please select a valid batch for this material.");
                                oInput.setValue("");
                            } else {

                                const isExact = oData.results.some(item => item.Batch === sEnteredBatch);
                                if (!isExact) {
                                    sap.m.MessageBox.error("Invalid batch. Please select a valid batch for this material.");
                                    oInput.setValue("");
                                } else {
                                    console.log("Batch validated:", oData.results[0]);
                                    var stoagelocation = oData.results[0].StorageLocation;
                                    oRow.getCells()[6].setText(stoagelocation);

                                }
                            }
                        },
                        error: function (oError) {
                            sap.ui.core.BusyIndicator.hide();
                            console.error("Error during batch validation:", oError);
                            sap.m.MessageBox.error("Error while validating batch.");
                        }
                    });
                }

            });
    }
);