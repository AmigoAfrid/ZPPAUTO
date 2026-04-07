sap.ui.define(
    [                                                                                  
        "sap/ui/core/mvc/Controller",
        "sap/ui/core/IconPool",
        "sap/m/MessageBox",
        "sap/m/MessageToast",
        "sap/ui/core/Fragment",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/ui/unified/DateTypeRange",
        "sap/ui/core/date/UI5Date",
        "sap/ui/model/json/JSONModel",
        "sap/ui/core/format/DateFormat",
         "sap/ui/export/Spreadsheet",
    ],
    function (BaseController, IconPool, MessageBox,
        MessageToast,
        Fragment,
        Filter,
        FilterOperator,
        DateTypeRange,
        UI5Date, JSONModel, DateFormat, ) {
        "use strict";

        return BaseController.extend("zautodesignapp.controller.ftp.report.ftp_report", {
            // Initialization hook
            onInit: function () {

                var oMultiInput;
                oMultiInput = this.byId("idmaterialdocument");
                //oMultiInput.addValidator(this._onMultiInputValidate);
                // oMultiInput.setTokens(this._getDefaultTokens());
                this._oMultiInput = oMultiInput;


                var oMultiInputs;
                oMultiInputs = this.byId("ProdDoc");
                //oMultiInput.addValidator(this._onMultiInputValidate);
                // oMultiInput.setTokens(this._getDefaultTokens());
                this._oMultiInputs = oMultiInputs;
                // this.SelectInputType = 'fragment';

                var oMultiInputs_;
                oMultiInputs_ = this.byId("idPlantInput");
                //oMultiInput.addValidator(this._onMultiInputValidate);
                // oMultiInput.setTokens(this._getDefaultTokens());
                this._oMultiInputs_ = oMultiInputs_;
                // this.SelectInputType = 'fragment';

                var date = new Date();
                console.log("date",date);


                            this.tabModel = new sap.ui.model.json.JSONModel({ ItemData: ""});
                    this.getView().setModel(this.tabModel, "TabModel");


                                    var _oMultiInputMaterial;

                            _oMultiInputMaterial = this.byId("idmaterial");
                            this._oMultiInputMaterial = _oMultiInputMaterial

            },

            removeLeadingZeros: function (sValue) {
                if (!sValue) return sValue;

                sValue = String(sValue);

                // Remove zeros from the left until first non-zero digit appears
                return sValue.replace(/^0+/, "");
            },


            onValueHelpRequest: function () {

                var Date = this.getView().byId("Date").getValue();

                console.log(Date)
                if (Date || Date.length == 0) {
                    sap.ui.core.BusyIndicator.show();

                    //   var oFilters1 = new sap.ui.model.Filter("Createdat", sap.ui.model.FilterOperator.EQ, Date);
                    // Retrieve the model from the view
                    var oModel = this.getView().getModel("ZCE_ZCOUNT_HEAD_SRVB");

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
                        oModel.read("/ZCDS_BATCH_F4HELP", {
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
                            name: "zautodesignapp.view.ftp.report.fragment.ValueHelpDialog"
                        }).then(function (oDialog) {
                            var oFilterBar = oDialog.getFilterBar();

                            var oColumnProductCode, oColumnPostingDate, oColumnCompanyCode;
                            that._oVHD = oDialog;
                            that.getView().addDependent(oDialog);

                            // Set key fields for filtering in the Define Conditions Tab
                            oDialog.setRangeKeyFields([{
                                label: "Batch No.",
                                key: "batch",
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
                                        label: new sap.m.Label({ text: "Batch No." }),
                                        template: new sap.m.Text({ wrapping: false, text: "{oJSONModel>batch}" })
                                    });
                                    oColumnProductCode.data({
                                        fieldName: "batch"
                                    });



                                    oTable.addColumn(oColumnProductCode);


                                } else if (oTable.bindItems) {
                                    // Mobile scenario (sap.m.Table)
                                    oTable.bindAggregation("items", {
                                        path: "oJSONModel>/Datas",
                                        template: new sap.m.ColumnListItem({
                                            cells: [
                                                new sap.m.Text({ text: "{oJSONModel>batch}" }),


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
                                        header: new sap.m.Label({ text: "Batch No." })
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
                } else {
                    //   sap.m.MessageBox.error("Please check Company Code / Fiscal Year");
                    sap.ui.core.BusyIndicator.hide();
                }
            },

            onValueHelpOkPress: function (oEvent) {
                var aTokens = oEvent.getParameter("tokens");
                console.log("aTokens:", aTokens)
                this.SelectInputType = 'fragment'
                if (aTokens.length <= 10) {
                    this._oMultiInput.setTokens(aTokens);
                    this._oVHD.close();
                } else {
                    // sap.m.MessageToast.show("Please Select max 10 Accounting documents only...!");
                    sap.m.MessageBox.error("Please Select max 15 Accounting documents only...!");
                }

            },

            onValueHelpCancelPress: function () {
                this._oVHD.close();
            },

            onValueHelpAfterClose: function () {
                this._oVHD.destroy();
            },

            onFilterBarSearch: function (oEvent) {
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
                        new sap.ui.model.Filter({ path: "batch", operator: sap.ui.model.FilterOperator.Contains, value1: sSearchQuery })

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

            OnSuggest_User: function (oEvent) {
                var sTerm = oEvent.getParameter("suggestValue");
                console.log("Press")

                this._connectToODataProductSearchService(sTerm)
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

            // Connect to the OData service and fetch suggestions
            _connectToODataProductSearchService: function (sTerm) {
                var oModel = this.getView().getModel('ZCE_ZCOUNT_HEAD_SRVB'); // OData Model
                var aFilters = [
                    new sap.ui.model.Filter("batch", sap.ui.model.FilterOperator.Contains, sTerm) // Search based on Name
                ];

                return new Promise(function (fnResolve, fnReject) {
                    // Perform OData read request
                    oModel.read("/ZCDS_BATCH_F4HELP", {  // Replace "/ProductSet" with your OData entity set
                        filters: aFilters,
                        success: function (oData) {
                            var aResults = oData.results.map(function (mProduct) {
                                return mProduct.batch;  // Assuming Name is the field you're interested in
                            });

                            // Resolve with the list of suggestions
                            // fnResolve(aResults);
                            
                            // Remove duplicates
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


            // // // // Event handler for suggestion item selection
            ondocumentsuggestselected: function (oEvent) {
                // Show the busy indicator as soon as the item is selected
                sap.ui.core.BusyIndicator.show();

                var oSelectedItem = oEvent.getParameter("selectedItem");
                if (oSelectedItem) {
                    var sSelectedKey = oSelectedItem.getKey();
                    var sSelectedText = oSelectedItem.getText();
                    console.log("Selected Item:", sSelectedKey, sSelectedText);
                    this.SelectInputType = 'select'
                    // Set the selected key into the input field
                    var oMultiInput = this.getView().byId("idmaterialdocument");
                    oMultiInput.setValue(sSelectedText); // Set the selected key into the MultiInput field
                }

                // Hide the busy indicator after the update
                sap.ui.core.BusyIndicator.hide();
            },

            OnDateChangeValue: function (Datess) {
                var that = this;
                if (Datess !== null) {

                    return new Promise(function (resolve, reject) {

                        let Dtasss = new Date(Datess);
                        var dd = '' + Dtasss.getDate();
                        var mm = '' + (Dtasss.getMonth() + 1); //January is 0!
                        if (mm.length < 2) {
                            mm = '0' + mm;
                        }
                        if (dd.length < 2) {
                            dd = '0' + dd;
                        }
                        var yyyy = Dtasss.getFullYear();
                        let Dtasss1 = dd + '-' + mm + '-' + yyyy;
                        resolve(Dtasss1);

                    });
                }
            },


// OnGoItemPage: async function (token) {
//     const oView = this.getView();
//     const model0 = oView.getModel("ZNC_FT_HD_ITEM_REPORT_SRVB");

//     // Get UI input values
//     const Dates = oView.byId("Date").getValue();
//     const batch0 = oView.byId("idmaterialdocument").getTokens();
//     const ProdDoc = oView.byId("ProdDoc").getTokens();
//     const sPlant = oView.byId("idPlantInput").getTokens();
//     const smaterial = oView.byId("idmaterial").getTokens();

//     // Extract token values
//     const aMultiInputValues = batch0.map(oToken => oToken.getText());
//     const aMultiInputValues_ = ProdDoc.map(oToken => oToken.getText());
//     const aMultiInputValuesPlant = sPlant.map(oToken => oToken.getText());
//     const aMultiInputValuesMaterial = smaterial.map(oToken => oToken.getText());

//     // Date parsing
//     const bHasDate = Dates && Dates.trim() !== "";
//     let FromDate = "", ToDate = "";
//     if (bHasDate) {
//         const [from, to] = Dates.split(" - ");
//         const datefrom = new Date(from);
//         const dateto = new Date(to);
//         FromDate = new Date(datefrom.getTime() - (datefrom.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
//         ToDate = new Date(dateto.getTime() - (dateto.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
//     }

//     // Filter: Either GoodsReceipt or GoodsIssue is not empty
//     const goodsReceiptOrIssueFilter = new sap.ui.model.Filter({
//         filters: [
//             new sap.ui.model.Filter("GoodsReceipt", sap.ui.model.FilterOperator.NE, ""),
//             new sap.ui.model.Filter("GoodsIssue", sap.ui.model.FilterOperator.NE, "")
//         ],
//         and: false
//     });

//     // Data fetch with pagination
//     let aAllItems = [];
//     let iSkip = 0;
//     const iTop = 100;
//     const that = this;

//     oView.setBusy(true);

//     function fetchData() {
//         model0.read("/ZNC_FT_HEADER_ITEM", {
//             filters: [goodsReceiptOrIssueFilter],
//             urlParameters: {
//                 "$skip": iSkip,
//                 "$top": iTop
//             },
//             success: function (oData) {
//                 if (oData.results.length > 0) {
//                     aAllItems = aAllItems.concat(oData.results);
//                     iSkip += iTop;
//                     fetchData(); // Continue fetching next page
//                 } else {
//                     // 🔽 Apply client-side filters
//                     const filteredItems = aAllItems.filter(item => {
//                         let match = true;

//                         // ✅ Date filter (with fix)
//                         if (bHasDate && item.Createdat) {
//                             const dateObj = new Date(item.Createdat);
//                             if (!isNaN(dateObj)) {
//                                 const itemDate = dateObj.toISOString().split("T")[0];
//                                 match = match && itemDate >= FromDate && itemDate <= ToDate;
//                             } else {
//                                 match = false; // Invalid date, exclude
//                             }
//                         }

//                         // ✅ Batch filter
//                         if (aMultiInputValues.length > 0) {
//                             const batchNo = item.Acmbatchno ? item.Acmbatchno.replace(/^0+/, "") : "";
//                             match = match && aMultiInputValues.includes(batchNo);
//                         }

//                         // ✅ Prod Order filter
//                         if (aMultiInputValues_.length > 0) {
//                             match = match && aMultiInputValues_.includes(item.Prodorderno);
//                         }

//                         // ✅ Plant filter
//                         if (aMultiInputValuesPlant.length > 0) {
//                             match = match && aMultiInputValuesPlant.includes(item.Plant);
//                         }


//                          if(aMultiInputValuesMaterial.length > 0){
//                              match = match && aMultiInputValuesMaterial.includes(item.Product);
//                         }

//                         return match;
//                     });

//                     // Set filtered data to model
//                     that.tabModel = new sap.ui.model.json.JSONModel({ ItemData: filteredItems });
//                     oView.setModel(that.tabModel, "TabModel");
//                     oView.setBusy(false);

//                     console.log("Filtered items:", filteredItems.length);
//                 }
//             },
//             error: function (error) {
//                 console.error("Error fetching data:", error);
//                 oView.setBusy(false);
//             }
//         });
//     }

//     fetchData();
// },


            //-----------------------------------------------------------------------------------------------------------------------

            //Production order Fragment






            OnGoItemPage: async function (token) {
                const oView = this.getView();
                const model0 = oView.getModel("ZNC_FT_HD_ITEM_REPORT_SRVB");
 
                // Get UI input values
                const Dates = oView.byId("Date").getValue();
                const batch0 = oView.byId("idmaterialdocument").getTokens();
                const ProdDoc = oView.byId("ProdDoc").getTokens();
                const sPlant = oView.byId("idPlantInput").getTokens();
                const smaterial = oView.byId("idmaterial").getTokens();
 
                // Extract token values
                const aMultiInputValues = batch0.map(oToken => oToken.getText());
                const aMultiInputValues_ = ProdDoc.map(oToken => oToken.getText());
                const aMultiInputValuesPlant = sPlant.map(oToken => oToken.getText());
                const aMultiInputValuesMaterial = smaterial.map(oToken => oToken.getText());
 
                // Date parsing
                const bHasDate = Dates && Dates.trim() !== "";
                let FromDate = "", ToDate = "";
                if (bHasDate) {
                    const [from, to] = Dates.split(" - ");
                    const datefrom = new Date(from);
                    const dateto = new Date(to);
                    FromDate = new Date(datefrom.getTime() - (datefrom.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
                    ToDate = new Date(dateto.getTime() - (dateto.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
                }
 
                // filters
                const aFilters = [];
 
                // GoodsReceipt or GoodsIssue filter
                const goodsReceiptOrIssueFilter = new sap.ui.model.Filter({
                    filters: [
                        new sap.ui.model.Filter("GoodsReceipt", sap.ui.model.FilterOperator.NE, ""),
                        new sap.ui.model.Filter("GoodsIssue", sap.ui.model.FilterOperator.NE, "")
                    ],
                    and: false
                });
                aFilters.push(goodsReceiptOrIssueFilter);
 
                // Date filter
                if (bHasDate) {
                    const dateFilter = new sap.ui.model.Filter({
                        filters: [
                            new sap.ui.model.Filter("entrydate", sap.ui.model.FilterOperator.GE, FromDate),
                            new sap.ui.model.Filter("entrydate", sap.ui.model.FilterOperator.LE, ToDate)
                        ],
                        and: true
                    });
                    aFilters.push(dateFilter);
                }
 
                // Batch filter
                if (aMultiInputValues.length > 0) {
                    const batchFilters = aMultiInputValues.map(val => new sap.ui.model.Filter("Acmbatchno", sap.ui.model.FilterOperator.EQ, val));
                    aFilters.push(new sap.ui.model.Filter({ filters: batchFilters, and: false }));
                }
 
                // Prod Order filter
                if (aMultiInputValues_.length > 0) {
                    const prodFilters = aMultiInputValues_.map(val => new sap.ui.model.Filter("Prodorderno", sap.ui.model.FilterOperator.EQ, val));
                    aFilters.push(new sap.ui.model.Filter({ filters: prodFilters, and: false }));
                }
 
                // Plant filter
                if (aMultiInputValuesPlant.length > 0) {
                    const plantFilters = aMultiInputValuesPlant.map(val => new sap.ui.model.Filter("Plant", sap.ui.model.FilterOperator.EQ, val));
                    aFilters.push(new sap.ui.model.Filter({ filters: plantFilters, and: false }));
                }
 
                //  Material filter
                if (aMultiInputValuesMaterial.length > 0) {
                    const matFilters = aMultiInputValuesMaterial.map(val => new sap.ui.model.Filter("Matnr", sap.ui.model.FilterOperator.EQ, val));
                    aFilters.push(new sap.ui.model.Filter({ filters: matFilters, and: false }));
                }

                // Combine all filters
                    const FinalFilter = new sap.ui.model.Filter({
                        filters: aFilters,
                        and: true
                    });
 
                // Fetch data with pagination
                let aAllItems = [];
                let iSkip = 0;
                const iTop = 100;
                const that = this;
 
                oView.setBusy(true);
 
                function fetchData() {
                    model0.read("/ZNC_FT_HEADER_ITEM", {
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
                                that.tabModel = new sap.ui.model.json.JSONModel({ ItemData: aAllItems });
                                oView.setModel(that.tabModel, "TabModel");
                                oView.setBusy(false);
                                console.log("Filtered items count:", aAllItems.length);
                            }
                        },
                        error: function (error) {
                            console.error(" Error fetching data:", error);
                            oView.setBusy(false);
                        }
                    });
                }
 
                fetchData();
            },
            onValueHelpRequest_: function () {

                var Date = this.getView().byId("Date").getValue();

                console.log(Date)
                if (Date || Date.length == 0) {
                    sap.ui.core.BusyIndicator.show();

                    //   var oFilters1 = new sap.ui.model.Filter("Createdat", sap.ui.model.FilterOperator.EQ, Date);

                    // Retrieve the model from the view
                    var oModel_ = this.getView().getModel("ZCE_ZCOUNT_HEAD_SRVB");

                    // Check if the model is valid
                    if (!oModel_) {
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
                        oModel_.read("/ZCE_ZCOUNT_PROCESS_ORD_F4HELP", {
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
                        that.oJSONModel_ = new sap.ui.model.json.JSONModel({
                            Datas: aAllItems
                        });
                        that.getView().setModel(that.oJSONModel_, "oJSONModels");
                        console.log("that.oJSONModel_:", that.oJSONModel_)

                        // Load the value help dialog fragment
                        that._oBasicSearchFieldP = new sap.m.SearchField();
                        that.loadFragment({
                            name: "zautodesignapp.view.ftp.report.fragment.ValueHelpDialogProd"
                        }).then(function (oDialog) {
                            var oFilterBar = oDialog.getFilterBar();

                            var oColumnProductCode, oColumnPostingDate, oColumnCompanyCode;
                            that._oVHD_ = oDialog;
                            that.getView().addDependent(oDialog);

                            // Set key fields for filtering in the Define Conditions Tab
                            oDialog.setRangeKeyFields([{
                                label: "Production Ord No.",
                                key: "ProcessOrder",
                                type: "string",
                                typeInstance: new sap.ui.model.type.String({}, {
                                    maxLength: 10
                                })
                            }]);

                            // Set Basic Search for FilterBar
                            oFilterBar.setFilterBarExpanded(false);
                            oFilterBar.setBasicSearch(that._oBasicSearchFieldP);

                            // Trigger filter bar search when the basic search is fired
                            that._oBasicSearchFieldP.attachSearch(function () {
                                oFilterBar.search();
                            });

                            oDialog.getTableAsync().then(function (oTable) {
                                oTable.setModel(that.oJSONModel_);

                                // Bind rows/items based on table type (sap.ui.table.Table or sap.m.Table)
                                if (oTable.bindRows) {
                                    // Desktop/Table scenario (sap.ui.table.Table)
                                    oTable.bindAggregation("rows", {
                                        path: "oJSONModels>/Datas",
                                        events: {
                                            dataReceived: function () {
                                                oDialog.update();
                                            }
                                        }
                                    });

                                    // Define columns for sap.ui.table.Table
                                    oColumnProductCode = new sap.ui.table.Column({
                                        label: new sap.m.Label({ text: "Production Ord" }),
                                        template: new sap.m.Text({ wrapping: false, text: "{oJSONModels>ProcessOrder}" })
                                    });
                                    oColumnProductCode.data({
                                        fieldName: "ProcessOrder"
                                    });

                                    // oColumnPostingDate = new sap.ui.table.Column({
                                    //     label: new sap.m.Label({ text: "Date" }),
                                    //     template: new sap.m.Text({ wrapping: false, text: "{oJSONModels>Createdat}" })
                                    // });
                                    // oColumnPostingDate.data({
                                    //     fieldName: "Createdat"
                                    // });

                                    
                                    oTable.addColumn(oColumnProductCode);

                                } else if (oTable.bindItems) {
                                    // Mobile scenario (sap.m.Table)
                                    oTable.bindAggregation("items", {
                                        path: "oJSONModels>/Datas",
                                        template: new sap.m.ColumnListItem({
                                            cells: [
                                                new sap.m.Text({ text: "{oJSONModels>ProcessOrder}" }),

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
                                        header: new sap.m.Label({ text: "Production Ord" })
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
                } else {
                    //   sap.m.MessageBox.error("Please check Company Code / Fiscal Year");
                    sap.ui.core.BusyIndicator.hide();
                }
            },

            onValueHelpOkPress_: function (oEvent) {
                var aTokens = oEvent.getParameter("tokens");
                console.log("aTokens:", aTokens)
                this.SelectInputType = 'fragment'
                if (aTokens.length <= 15) {
                    this._oMultiInputs.setTokens(aTokens);
                    this._oVHD_.close();
                } else {
                    // sap.m.MessageToast.show("Please Select max 15 Accounting documents only...!");
                    sap.m.MessageBox.error("Please Select max 15 Accounting documents only...!");
                }
            },

            onValueHelpCancelPress_: function () {
                this._oVHD_.close();
            },

            onValueHelpAfterClose_: function () {
                this._oVHD_.destroy();
            },

            onFilterBarSearch_: function (oEvent) {
                var sSearchQuery = this._oBasicSearchFieldP.getValue(),
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
                        new sap.ui.model.Filter({ path: "ProcessOrder", operator: sap.ui.model.FilterOperator.Contains, value1: sSearchQuery })

                    ],
                    and: false
                }));

                this._filterTable_pro(new sap.ui.model.Filter({
                    filters: aFilters,
                    and: true
                }));
            },

            _filterTable_pro: function (oFilter) {
                var oVHD = this._oVHD_;

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

            OnSuggest_User_: function (oEvent) {
                var sTerm = oEvent.getParameter("suggestValue");
                console.log("Press")

                this._connectToODataProductSearchServiceprd_(sTerm)
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

            _connectToODataProductSearchServiceprd_: function (sTerm) {
                var oModel = this.getView().getModel('ZNC_FT_HD_ITEM_REPORT_SRVB'); // OData Model
                var aFilters = [
                    new sap.ui.model.Filter("Prodorderno", sap.ui.model.FilterOperator.Contains, sTerm) // Search based on Name
                ];

                return new Promise(function (fnResolve, fnReject) {
                    // Perform OData read request
                    oModel.read("/ZNC_FT_HEADER_ITEM", {  // Replace "/ProductSet" with your OData entity set
                        filters: aFilters,
                        success: function (oData) {
                            var aResults = oData.results.map(function (mProduct) {
                                return mProduct.Prodorderno;  // Assuming Name is the field you're interested in
                            });

                            // Resolve with the list of suggestions
                            // Remove duplicates
                            var aUniqueResults = Array.from(new Set(aResults));
 
                            fnResolve(aUniqueResults);
 
                            // fnResolve(aResults);
                        },
                        error: function (oError) {
                            console.error("Error fetching suggestions from OData service:", oError);
                            fnReject(oError);
                        }
                    });
                });
            },

            ondocumentsuggestselected_: function (oEvent) {
                // Show the busy indicator as soon as the item is selected
                sap.ui.core.BusyIndicator.show();

                var oSelectedItem = oEvent.getParameter("selectedItem");
                if (oSelectedItem) {
                    var sSelectedKey = oSelectedItem.getKey();
                    var sSelectedText = oSelectedItem.getText();
                    console.log("Selected Item:", sSelectedKey, sSelectedText);
                    this.SelectInputType = 'select'
                    // Set the selected key into the input field
                    var oMultiInput = this.getView().byId("ProdDoc");
                    oMultiInput.setValue(sSelectedKey); // Set the selected key into the MultiInput field
                }

                // Hide the busy indicator after the update
                sap.ui.core.BusyIndicator.hide();
            },

            //-----------------------------------------------------------------------------------------------------------------------

            //Plant No. Fragment

            onValueHelpRequestPlant: function () {

                var Date = this.getView().byId("Date").getValue();

                console.log(Date)
                if (Date || Date.length == 0) {
                    sap.ui.core.BusyIndicator.show();

                    //   var oFilters1 = new sap.ui.model.Filter("Createdat", sap.ui.model.FilterOperator.EQ, Date);

                    // Retrieve the model from the view
                    var oModelPlant = this.getView().getModel("ZCE_ZCOUNT_HEAD_SRVB");

                    // Check if the model is valid
                    if (!oModelPlant) {
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
                        oModelPlant.read("/ZCE_PLANT_F4HELP", {
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
                        that.oJSONModelPlant = new sap.ui.model.json.JSONModel({
                            Datas: aAllItems
                        });
                        that.getView().setModel(that.oJSONModelPlant, "oJSONModelP");
                        console.log("that.oJSONModelPlant:", that.oJSONModelPlant)

                        // Load the value help dialog fragment
                        that._oBasicSearchField = new sap.m.SearchField();
                        that.loadFragment({
                            name: "zautodesignapp.view.ftp.report.fragment.ValueHelpDialogPlant"
                        }).then(function (oDialog) {
                            var oFilterBar = oDialog.getFilterBar();

                            var oColumnProductCode, oColumnPostingDate, oColumnCompanyCode;
                            that._oVHD_P = oDialog;
                            that.getView().addDependent(oDialog);

                            // Set key fields for filtering in the Define Conditions Tab
                            oDialog.setRangeKeyFields([{
                                label: "Plant No.",
                                key: "plant",
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
                                oTable.setModel(that.oJSONModelPlant);

                                // Bind rows/items based on table type (sap.ui.table.Table or sap.m.Table)
                                if (oTable.bindRows) {
                                    // Desktop/Table scenario (sap.ui.table.Table)
                                    oTable.bindAggregation("rows", {
                                        path: "oJSONModelP>/Datas",
                                        events: {
                                            dataReceived: function () {
                                                oDialog.update();
                                            }
                                        }
                                    });

                                    // Define columns for sap.ui.table.Table
                                    oColumnProductCode = new sap.ui.table.Column({
                                        label: new sap.m.Label({ text: "Plant No." }),
                                        template: new sap.m.Text({ wrapping: false, text: "{oJSONModelP>plant}" })
                                    });
                                    oColumnProductCode.data({
                                        fieldName: "plant"
                                    });

                                    // oColumnPostingDate = new sap.ui.table.Column({
                                    //     label: new sap.m.Label({ text: "Date" }),
                                    //     template: new sap.m.Text({ wrapping: false, text: "{oJSONModels>Createdat}" })
                                    // });
                                    // oColumnPostingDate.data({
                                    //     fieldName: "Createdat"
                                    // });

                                    oTable.addColumn(oColumnProductCode);

                                } else if (oTable.bindItems) {
                                    // Mobile scenario (sap.m.Table)
                                    oTable.bindAggregation("items", {
                                        path: "oJSONModelP>/Datas",
                                        template: new sap.m.ColumnListItem({
                                            cells: [
                                                new sap.m.Text({ text: "{oJSONModelP>plant}" }),
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
                                        header: new sap.m.Label({ text: "Plant No." })
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
                } else {
                    //   sap.m.MessageBox.error("Please check Company Code / Fiscal Year");
                    sap.ui.core.BusyIndicator.hide();
                }
            },

            onValueHelpOkPressPlant: function (oEvent) {
                var aTokens = oEvent.getParameter("tokens");
                console.log("aTokens:", aTokens)
                this.SelectInputType = 'fragment'
                if (aTokens.length <= 15) {
                    this._oMultiInputs_.setTokens(aTokens);
                    this._oVHD_P.close();
                } else {
                    // sap.m.MessageToast.show("Please Select max 15 Accounting documents only...!");
                    sap.m.MessageBox.error("Please Select max 15 Accounting documents only...!");
                }
            },

            onValueHelpCancelPressPlant: function () {
                this._oVHD_P.close();
            },

            onValueHelpAfterClosePlant: function () {
                this._oVHD_P.destroy();
            },

            onFilterBarSearchPlant: function (oEvent) {
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
                        new sap.ui.model.Filter({ path: "plant", operator: sap.ui.model.FilterOperator.Contains, value1: sSearchQuery })

                    ],
                    and: false
                }));

                this._filterTable_P(new sap.ui.model.Filter({
                    filters: aFilters,
                    and: true
                }));
            },

            _filterTable_P: function (oFilter) {
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

            OnSuggest_UserPlant: function (oEvent) {
                var sTerm = oEvent.getParameter("suggestValue");
                console.log("Press")

                this._connectToODataProductSearchService_(sTerm)
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

            _connectToODataProductSearchService_: function (sTerm) {
                var oModel = this.getView().getModel('ZCE_ZCOUNT_HEAD_SRVB'); // OData Model
                var aFilters = [
                    new sap.ui.model.Filter("plant", sap.ui.model.FilterOperator.Contains, sTerm) // Search based on Name
                ];

                return new Promise(function (fnResolve, fnReject) {
                    // Perform OData read request
                    oModel.read("/ZCE_PLANT_F4HELP", {  // Replace "/ProductSet" with your OData entity set
                        filters: aFilters,
                        success: function (oData) {
                            var aResults = oData.results.map(function (mProduct) {
                                return mProduct.plant;  // Assuming Name is the field you're interested in
                            });

                             var aUniqueResults = Array.from(new Set(aResults));
 
                            fnResolve(aUniqueResults);

                            // Resolve with the list of suggestions
                            //fnResolve(aResults);
                        },
                        error: function (oError) {
                            console.error("Error fetching suggestions from OData service:", oError);
                            fnReject(oError);
                        }
                    });
                });
            },

            ondocumentsuggestselectedPlant: function (oEvent) {
                // Show the busy indicator as soon as the item is selected
                sap.ui.core.BusyIndicator.show();

                var oSelectedItem = oEvent.getParameter("selectedItem");
                if (oSelectedItem) {
                    var sSelectedKey = oSelectedItem.getKey();
                    var sSelectedText = oSelectedItem.getText();
                    console.log("Selected Item:", sSelectedKey, sSelectedText);
                    this.SelectInputType = 'select'
                    // Set the selected key into the input field
                    var oMultiInputs_ = this.getView().byId("idPlantInput");
                    oMultiInputs_.setValue(sSelectedKey); // Set the selected key into the MultiInput field
                }

                // Hide the busy indicator after the update
                sap.ui.core.BusyIndicator.hide();
            },





            
   //-----------------------------------------------------------------------------------------------------------------------

            //Material order Fragment



            onValueHelpRequestMaterial: function () {

                var material = this.getView().byId("idmaterial").getValue();

                console.log(material)
                if (material || material.length == 0) {
                    sap.ui.core.BusyIndicator.show();

                    //   var oFilters1 = new sap.ui.model.Filter("Createdat", sap.ui.model.FilterOperator.EQ, Date);

                    // Retrieve the model from the view
                    var oModel_Material = this.getView().getModel("ZAU_FT_PROCESSORDER_SRVB_");

                    // Check if the model is valid
                    if (!oModel_Material) {
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
                        oModel_Material.read("/ZCDS_COMPONENT_F4HELP", {
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
                        that.oJSONModel_material = new sap.ui.model.json.JSONModel({
                            Datas: aAllItems
                        });
                        that.getView().setModel(that.oJSONModel_material, "oJSONModelsMaterial");
                        console.log("that.oJSONModel_material:", that.oJSONModel_material)

                        // Load the value help dialog fragment
                        that._oBasicSearchFieldMaterial = new sap.m.SearchField();
                        that.loadFragment({
                            name: "zautodesignapp.view.ftp.report.fragment.ValueHelpDialogMaterial"
                        }).then(function (oDialog) {
                            var oFilterBar = oDialog.getFilterBar();

                            var oColumnProductCode, oColumnPostingDate, oColumnCompanyCode;
                            that._oVHD_Material = oDialog;
                            that.getView().addDependent(oDialog);

                            // Set key fields for filtering in the Define Conditions Tab
                            oDialog.setRangeKeyFields([{
                                label: "Material",
                                key: "Material",
                                type: "string",
                                typeInstance: new sap.ui.model.type.String({}, {
                                    maxLength: 10
                                })
                            }]);

                            // Set Basic Search for FilterBar
                            oFilterBar.setFilterBarExpanded(false);
                            oFilterBar.setBasicSearch(that._oBasicSearchFieldMaterial);

                            // Trigger filter bar search when the basic search is fired
                            that._oBasicSearchFieldMaterial.attachSearch(function () {
                                oFilterBar.search();
                            });

                            oDialog.getTableAsync().then(function (oTable) {
                                oTable.setModel(that.oJSONModel_material);

                                // Bind rows/items based on table type (sap.ui.table.Table or sap.m.Table)
                                if (oTable.bindRows) {
                                    // Desktop/Table scenario (sap.ui.table.Table)
                                    oTable.bindAggregation("rows", {
                                        path: "oJSONModelsMaterial>/Datas",
                                        events: {
                                            dataReceived: function () {
                                                oDialog.update();
                                            }
                                        }
                                    });

                                    // Define columns for sap.ui.table.Table
                                    oColumnProductCode = new sap.ui.table.Column({
                                        label: new sap.m.Label({ text: "Material" }),
                                        template: new sap.m.Text({ wrapping: false, text: "{oJSONModelsMaterial>Material}" })
                                    });
                                    oColumnProductCode.data({
                                        fieldName: "Product"
                                    });

                                 
                                    
                                    oTable.addColumn(oColumnProductCode);

                                } else if (oTable.bindItems) {
                                    // Mobile scenario (sap.m.Table)
                                    oTable.bindAggregation("items", {
                                        path: "oJSONModelsMaterial>/Datas",
                                        template: new sap.m.ColumnListItem({
                                            cells: [
                                                new sap.m.Text({ text: "{oJSONModelsMaterial>Material}" }),

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
                                        header: new sap.m.Label({ text: "Material" })
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
                } else {
                    //   sap.m.MessageBox.error("Please check Company Code / Fiscal Year");
                    sap.ui.core.BusyIndicator.hide();
                }
            },

            onValueHelpOkPressMaterial: function (oEvent) {
                var aTokens = oEvent.getParameter("tokens");
                console.log("aTokens:", aTokens)
                this.SelectInputType = 'fragment'
                if (aTokens.length <= 15) {
                    this._oMultiInputMaterial.setTokens(aTokens);
                    this._oVHD_Material.close();
                } else {
                    // sap.m.MessageToast.show("Please Select max 15 Accounting documents only...!");
                    sap.m.MessageBox.error("Please Select max 15 Accounting documents only...!");
                }
            },

            onValueHelpCancelPressMaterial: function () {
                this._oVHD_Material.close();
            },

            onValueHelpMaterial: function () {
                this._oVHD_Material.destroy();
            },

            onFilterBarSearchMaterial: function (oEvent) {
                var sSearchQuery = this._oBasicSearchFieldMaterial.getValue(),
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
                        new sap.ui.model.Filter({ path: "Material", operator: sap.ui.model.FilterOperator.Contains, value1: sSearchQuery })

                    ],
                    and: false
                }));

                this._filterTable_(new sap.ui.model.Filter({
                    filters: aFilters,
                    and: true
                }));
            },

            _filterTable_: function (oFilter) {
                var oVHDMterial = this._oVHD_Material;

                oVHDMterial.getTableAsync().then(function (oTable) {
                    if (oTable.bindRows) {
                        oTable.getBinding("rows").filter(oFilter);
                    }
                    if (oTable.bindItems) {
                        oTable.getBinding("items").filter(oFilter);
                    }

                    // This method must be called after binding update of the table.
                    oVHDMterial.update();
                });
            },

            OnSuggest_Usermaterial: function (oEvent) {
                var sTerm = oEvent.getParameter("suggestValue");
                console.log("Press")

                this._connectToODatamaterial_(sTerm)
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

            _connectToODatamaterial_: function (sTerm) {
                var oModel = this.getView().getModel('ZAU_FT_PROCESSORDER_SRVB_'); // OData Model
                var aFilters = [
                    new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.Contains, sTerm) // Search based on Name
                ];

                return new Promise(function (fnResolve, fnReject) {
                    // Perform OData read request
                    oModel.read("/ZCDS_COMPONENT_F4HELP", {  // Replace "/ProductSet" with your OData entity set
                        filters: aFilters,
                        success: function (oData) {
                            var aResults = oData.results.map(function (mProduct) {
                                return mProduct.Material;  // Assuming Name is the field you're interested in
                            });

                            // Resolve with the list of suggestions

                             var aUniqueResults = Array.from(new Set(aResults));
 
                            fnResolve(aUniqueResults);


                            //fnResolve(aResults);
                        },
                        error: function (oError) {
                            console.error("Error fetching suggestions from OData service:", oError);
                            fnReject(oError);
                        }
                    });
                });
            },

            ondocumentsuggestselectedMaterial: function (oEvent) {
                // Show the busy indicator as soon as the item is selected
                sap.ui.core.BusyIndicator.show();

                var oSelectedItem = oEvent.getParameter("selectedItem");
                if (oSelectedItem) {
                    var sSelectedKey = oSelectedItem.getKey();  
                    var sSelectedText = oSelectedItem.getText();
                    console.log("Selected Item:", sSelectedKey, sSelectedText);
                    this.SelectInputType = 'select'
                    // Set the selected key into the input field
                    var oMultiInput = this.getView().byId("idmaterial");
                    oMultiInput.setValue(sSelectedKey); // Set the selected key into the MultiInput field
                }

                // Hide the busy indicator after the update
                sap.ui.core.BusyIndicator.hide();
            },



            //-----------------------------------------------------------------------------------------------------------------------



             createColumnConfig: function () {

                return [
                 

                    {
                        label: 'Date',
                        property: 'Createdat',
                        type: sap.ui.export.EdmType.Date,
                        format: 'dd-mm-yyyy',
                        width: '18'
                    },


                    {
                        label: 'Feed Tank No',
                        property: 'Ftno',
                        width: '12'
                    },

                    
                    {
                        label: 'Shift',
                        property: 'Shift',
                        width: '12'
                    },

                     {
                        label: 'Batch',
                        property: 'Acmbatchno',
                        width: '12'
                    },


                       {
                        label: 'Plant',
                        property: 'Plant',
                        width: '12'
                    },


                        {
                        label: 'Prodorderno',
                        property: 'Prodorderno',
                        width: '12'
                    },


                        {
                        label: 'Ord Qty',
                        property: 'Ftqty',
                        width: '12'
                    },


                    
                          {
                        label: 'Material',
                        property: 'Product',
                        width: '12'
                    },


                         {
                        label: 'Item Code',
                        property: 'Matnr',
                        width: '12'
                    },

                        {
                        label: 'Item Description',
                        property: 'Maktx',
                        width: '12'
                    },


                       {
                        label: 'Qty In Kgs',
                        property: 'Qty',
                        width: '12'
                    },


                


                       {
                        label: 'Unit',
                        property: 'Unit',
                        width: '12'
                    },

                    {
                        label: 'Chemist',
                        property: 'Chemist',
                        width: '12'
                    },

                       {
                        label: 'QA',
                        property: 'Qa',
                        width: '12'
                    },


                      {
                        label: 'Goods Issue',
                        property: 'GoodsIssue',
                        width: '12'
                    },


                       {
                        label: 'Goods Receipt',
                        property: 'GoodsReceipt',
                        width: '12'
                    },


                ];
            },
            
            
            //1st method
            
            
            OnExportExl: function() {
                var aCols, oBinding, oSettings, oSheet, oTable;
            
                oTable = this.byId('ft_report_table');


    var oModel = this.tabModel.getProperty("/ItemData");
    if (!oModel) {
        sap.m.MessageBox.error("Table  Data is not found")
        return;
    }


                
            
                aCols = this.createColumnConfig();
            
                oSettings = {
                    workbook: { columns: aCols },
                    dataSource: oModel
                };
                
            
                oSheet = new sap.ui.export.Spreadsheet(oSettings);
                oSheet.build()
                    .then(function() {
                        MessageToast.show('FT Report export has finished');
                    }).finally(function() {
                        oSheet.destroy();
                    });
            }


        });
    }
);
