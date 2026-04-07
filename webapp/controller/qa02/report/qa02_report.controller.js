sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/core/IconPool",
        "sap/ui/model/json/JSONModel"
    ],
    function(BaseController, IconPool, JSONModel) {
      "use strict";
  
      return BaseController.extend("zautodesignapp.controller.qa02.report.qa02_report", {
        onInit: function () {

          var oMultiInput;
          oMultiInput = this.byId("idmaterialdocument");
          //oMultiInput.addValidator(this._onMultiInputValidate);
          // oMultiInput.setTokens(this._getDefaultTokens());
          this._oMultiInput = oMultiInput;

          var oMultiInputs;
          oMultiInputs = this.byId("idprocessorder");
          //oMultiInput.addValidator(this._onMultiInputValidate);
          // oMultiInput.setTokens(this._getDefaultTokens());
          this._oMultiInputs = oMultiInputs;
          // this.SelectInputType = 'fragment';

          var date = new Date();
          console.log("date",date);

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
                        oModel.read("/ZCE_ZCOUNT_BATCH_F4HELP", {
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
                            name: "zautodesignapp.view.qa02.report.fragment.ValueHelpDialogQA02"
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
                    oModel.read("/ZCE_ZCOUNT_BATCH_F4HELP", {  // Replace "/ProductSet" with your OData entity set
                        filters: aFilters,
                        success: function (oData) {
                            var aResults = oData.results.map(function (mProduct) {
                                return mProduct.batch;  // Assuming Name is the field you're interested in
                            });

                            // Resolve with the list of suggestions
                            fnResolve(aResults);
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
      
        OnDateChangeValueQA02: function (Datess) {
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
            
        OnGoItemPage: async function (token) {
    
            var Dates = this.getView().byId("Date").getValue();
            var batch0 = this.getView().byId("idmaterialdocument").getTokens();
            var ProdDoc = this.getView().byId("idprocessorder").getTokens();
    
            var aMultiInputValues = batch0.map(function (oToken) {
                return oToken.getText();
            });
    
            var aMultiInputValues_ = ProdDoc.map(function (oToken) {
                return oToken.getText();
            });
    
            console.log("aMultiInputValues:", aMultiInputValues);
            console.log("aMultiInputValues_:", aMultiInputValues_);
    
            // if(this.SelectInputType === 'fragment' ){
            //     var batch0 = batch0[0].mProperties.key
            // }
            // else if(this.SelectInputType === 'select' ){
            //     var batch0 = batch0[0].mProperties.text
            // }
    
            // let batchData = [];
    
            // if (batch0) {
            //     batch0.map(function (oContext) {
            //         batchData.push(oContext.getKey());
            //         return;
            //     });
            // }
    
            // if (Array.isArray(batch0)) {
            //     batch0.forEach(function (oContext) {console.log("oContext:",oContext);
            //         batchData.push(oContext.getKey());
            //     });
            // }
            // console.log("batch:", batchData);
    
            // let prodData = [];
            // if (ProdDoc && ProdDoc.length) {
            //     ProdDoc.map(function (oContext) {
            //         prodData.push(oContext.getText());
            //         return;
            //     });
            // }
            // console.log("ProdDoc:", prodData);
    
    
            const bHasDate = Dates && Dates.trim() !== "";
            console.log("bHasDate:", bHasDate)
    
            let FromDate = "", ToDate = "";
            if (bHasDate) {
                const myArray = Dates.split(" - ");
                const datefrom = new Date(myArray[0]);
                const dateto = new Date(myArray[1]);
                FromDate = new Date(datefrom.getTime() - (datefrom.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
                ToDate = new Date(dateto.getTime() - (dateto.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
            }
    
            let FinalFilter = [];
    
            // Add batch filters
            if (batch0.length > 0) {
                const batchFilters = aMultiInputValues.map(function (sValue) {
                    return new sap.ui.model.Filter("batch", sap.ui.model.FilterOperator.EQ, sValue);
                });
                FinalFilter.push(new sap.ui.model.Filter({ filters: batchFilters, and: false }));
            }
    
            // Add production order filters
            if (ProdDoc.length > 0) {
                const prodFilters = aMultiInputValues_.map(function (sValue) {
                    return new sap.ui.model.Filter("processorder", sap.ui.model.FilterOperator.EQ, sValue);
                });
                FinalFilter.push(new sap.ui.model.Filter({ filters: prodFilters, and: false }));
            }
    
            // Add date filter
            if (bHasDate) {
                FinalFilter.push(new sap.ui.model.Filter("zdate", sap.ui.model.FilterOperator.BT, FromDate, ToDate));
            }
    
            FinalFilter.push(new sap.ui.model.Filter("materialdocumentno_gi", sap.ui.model.FilterOperator.NE, ""));

            // Data fetch header
            const model0 = this.getView().getModel("ZSB_AU_QA02_ITEM");
    
            let aAllItems = [];
            let iSkip = 0;
            const iTop = 100;
            const that = this;
    
            that.getView().setBusy(true);
    
            function fetchData() {
                model0.read("/ZC_AU_QA02ITEM", {
                    filters: FinalFilter,
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
                            const tabModel = new sap.ui.model.json.JSONModel({ ItemData: aAllItems });
                            that.getView().setModel(tabModel, "TabModel");
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
                            name: "zautodesignapp.view.qa02.report.fragment.ValueHelpDialogQA02Prod"
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

                this._filterTable_(new sap.ui.model.Filter({
                    filters: aFilters,
                    and: true
                }));
            },

            _filterTable_: function (oFilter) {
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
                var oModel = this.getView().getModel('ZCE_ZCOUNT_HEAD_SRVB'); // OData Model
                var aFilters = [
                    new sap.ui.model.Filter("ProcessOrder", sap.ui.model.FilterOperator.Contains, sTerm) // Search based on Name
                ];

                return new Promise(function (fnResolve, fnReject) {
                    // Perform OData read request
                    oModel.read("/ZCE_ZCOUNT_PROCESS_ORD_F4HELP", {  // Replace "/ProductSet" with your OData entity set
                        filters: aFilters,
                        success: function (oData) {
                            var aResults = oData.results.map(function (mProduct) {
                                return mProduct.ProcessOrder;  // Assuming Name is the field you're interested in
                            });

                            // Resolve with the list of suggestions
                            fnResolve(aResults);
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
                    var oMultiInput = this.getView().byId("idprocessorder");
                    oMultiInput.setValue(sSelectedKey); // Set the selected key into the MultiInput field
                }

                // Hide the busy indicator after the update
                sap.ui.core.BusyIndicator.hide();
            },

  
      });
    }
  );
  