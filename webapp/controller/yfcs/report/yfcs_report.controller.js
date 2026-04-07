sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/core/IconPool",
        "sap/ui/export/library",
        "zautodesignapp/model/formatter",
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
    function (BaseController, IconPool, exportLibrary, formatter, MessageBox,
        MessageToast,
        Fragment,
        Filter,
        FilterOperator,
        DateTypeRange,
        UI5Date, JSONModel, DateFormat,) {
        "use strict";

        return BaseController.extend("zautodesignapp.controller.yfcs.report.yfcs_report", {
            // Initialization hook
            onInit: function () {

                var oMultiProcOrder = this.byId("IdProcessOrder");
                this._oMultiProcOrder = oMultiProcOrder;

                var oMultiBatch = this.byId("IdBatch");
                this._oMultiBatch = oMultiBatch;

                var oMultiPlant = this.byId("IdPlant");
                this._oMultiPlant = oMultiPlant;

                var date = new Date();
                console.log("date", date);

                this.oTabModel = new sap.ui.model.json.JSONModel({ ItemData: "", saveEnabled: false });
                this.getView().setModel(this.oTabModel, "TabModel");


            },
            formatter: formatter,


            onAfterRendering: function () {
                var oUserRoleModel = new sap.ui.model.json.JSONModel();
                this.getView().setModel(oUserRoleModel, "UserModel");

                var oModel = this.getView().getModel("ZCE_USERBUSINESSROLE_SRB"); // OData V2 service
                var sUserId = sap.ushell.Container.getUser().getId(); // gets current logged-in user

                var filter1 = new sap.ui.model.Filter("UserID", sap.ui.model.FilterOperator.EQ, sUserId)
                var filter2 = new sap.ui.model.Filter("BusinessRole", sap.ui.model.FilterOperator.EQ, "ZPP_AUTO_YFCS_UPDATE_ROLE")

                var that = this;
                oModel.read("/ZCE_USERBUSINESSROLE", {
                    filters: [filter1, filter2],
                    success: function (oData) {
                        if (oData.results.length > 0) {
                            //   console.log("Tenant user found:", tenantUser);
                            that.AdminPanelAuth = new sap.ui.model.json.JSONModel({
                                Samples: { Role: true }
                            });
                            that.getView().setModel(that.AdminPanelAuth, "AdminPanelAuth");
                            console.log("that.AdminPanelAuth:", that.AdminPanelAuth);
                            sap.ui.core.BusyIndicator.hide();
                            //resolve(oData.results);

                            // You can handle the case where the tenant user is found here
                        } else {
                            console.log("Tenant user not found");
                            that.AdminPanelAuth = new sap.ui.model.json.JSONModel({
                                Samples: { Role: false }
                            });
                            that.getView().setModel(that.AdminPanelAuth, "AdminPanelAuth");
                            console.log("that.AdminPanelAuth:", that.AdminPanelAuth);
                            sap.ui.core.BusyIndicator.hide();
                            // resolve(oData.results);
                        }
                    },
                    error: function (oError) {
                        console.error("Failed to fetch roles", oError);
                        oUserRoleModel.setProperty("/roles", []);
                    }
                });

            },

            formatTrimmedValue: function (value) {
                if (value && value.length >= 12) {
                    return value.substring(2); // Remove first 2 characters
                }
                return value;
            },
            // ====================================================================================
            // BATCH FRAGMENT: ====================================================================
            //=====================================================================================
            onValueHelpRequestBatch: function () {

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
                            name: "zautodesignapp.view.yfcs.report.fragment.BatchFragment"
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
            },

            onValueHelpOkPress_Batch: function (oEvent) {
                var aTokens = oEvent.getParameter("tokens");
                console.log("aTokens:", aTokens)
                this.SelectInputType = 'fragment'
                if (aTokens.length <= 15) {
                    this._oMultiBatch.setTokens(aTokens);
                    this._oVHD.close();
                } else {
                    // sap.m.MessageToast.show("Please Select max 10 Accounting documents only...!");
                    sap.m.MessageBox.error("Please Select max 15 Accounting documents only...!");
                }

            },

            onValueHelpCancelPress_Batch: function () {
                this._oVHD.close();
            },

            onValueHelpAfterClose_Batch: function () {
                this._oVHD.destroy();
            },

            onFilterBarSearch_Batch: function (oEvent) {
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

                this._filterTableBatch(new sap.ui.model.Filter({
                    filters: aFilters,
                    and: true
                }));
            },

            _filterTableBatch: function (oFilter) {
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

            OnSuggest_User_Batch: function (oEvent) {
                var sTerm = oEvent.getParameter("suggestValue");
                console.log("Press")

                this._connectToODataProductSearchServiceBatch(sTerm)
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
            _connectToODataProductSearchServiceBatch: function (sTerm) {
                var oModel = this.getView().getModel('ZCE_ZCOUNT_HEAD_SRVB'); // OData Model
                var aFilters = [
                    new sap.ui.model.Filter("batch", sap.ui.model.FilterOperator.Contains, sTerm) // Search based on Name
                ];

                return new Promise(function (fnResolve, fnReject) {
                    // Perform OData read request
                    oModel.read("/ZCDS_BATCH_F4HELP", {  // Replace "/ProductSet" with your OData entity set
                        filters: aFilters,
                        urlParameters: {
                            "$top": 5000
                        },
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
                    var oMultiInput = this.getView().byId("IdBatch");
                    oMultiInput.setValue(sSelectedText); // Set the selected key into the MultiInput field
                }

                // Hide the busy indicator after the update
                sap.ui.core.BusyIndicator.hide();
            },

            // // ====================================================================================
            // // PLANT FRAGMENT: ====================================================================
            // //=====================================================================================

            onValueHelpRequestPlant: function () {

                // var Date = this.getView().byId("Dates_").getValue();

                var Date = "";

                // console.log(Date)
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
                        oModel.read("/ZCE_PLANT_F4HELP", {
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
                            name: "zautodesignapp.view.yfcs.report.fragment.PlantFragment"
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
                                        label: new sap.m.Label({ text: "Plant No." }),
                                        template: new sap.m.Text({ wrapping: false, text: "{oJSONModel>plant}" })
                                    });
                                    oColumnProductCode.data({
                                        fieldName: "plant"
                                    });

                                    oTable.addColumn(oColumnProductCode);


                                } else if (oTable.bindItems) {
                                    // Mobile scenario (sap.m.Table)
                                    oTable.bindAggregation("items", {
                                        path: "oJSONModel>/Datas",
                                        template: new sap.m.ColumnListItem({
                                            cells: [
                                                new sap.m.Text({ text: "{oJSONModel>plant}" }),

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
                                        header: new sap.m.Label({ text: "plant No." })
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

            onValueHelpOkPress_Plant: function (oEvent) {
                var aTokens = oEvent.getParameter("tokens");
                console.log("aTokens:", aTokens)
                this.SelectInputType = 'fragment'
                if (aTokens.length <= 10) {
                    this._oMultiPlant.setTokens(aTokens);
                    this._oVHD_P.close();
                } else {
                    // sap.m.MessageToast.show("Please Select max 10 Accounting documents only...!");
                    sap.m.MessageBox.error("Please Select max 15 Accounting documents only...!");
                }

            },

            onValueHelpCancelPress_Plant: function () {
                this._oVHD_P.close();
            },

            onValueHelpAfterClose_Plant: function () {
                this._oVHD_P.destroy();
            },

            onFilterBarSearch_Plant: function (oEvent) {
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

                this._filterTablePlant(new sap.ui.model.Filter({
                    filters: aFilters,
                    and: true
                }));
            },

            _filterTablePlant: function (oFilter) {
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

            OnSuggest_User_Plant: function (oEvent) {
                var sTerm = oEvent.getParameter("suggestValue");
                console.log("Press")

                this._connectToODataProductSearchServicePlant(sTerm)
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
            _connectToODataProductSearchServicePlant: function (sTerm) {
                var oModel = this.getView().getModel('ZCE_ZCOUNT_HEAD_SRVB'); // OData Model
                var aFilters = [
                    new sap.ui.model.Filter("plant", sap.ui.model.FilterOperator.Contains, sTerm) // Search based on Name
                ];

                return new Promise(function (fnResolve, fnReject) {
                    // Perform OData read request
                    oModel.read("/ZCE_PLANT_F4HELP", {  // Replace "/ProductSet" with your OData entity set
                        filters: aFilters,
                        urlParameters: {
                            "$top": 5000
                        },
                        success: function (oData) {
                            var aResults = oData.results.map(function (mProduct) {
                                return mProduct.plant;  // Assuming Name is the field you're interested in
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
            ondocumentsuggestselected_Plant: function (oEvent) {
                // Show the busy indicator as soon as the item is selected
                sap.ui.core.BusyIndicator.show();

                var oSelectedItem = oEvent.getParameter("selectedItem");
                if (oSelectedItem) {
                    var sSelectedKey = oSelectedItem.getKey();
                    var sSelectedText = oSelectedItem.getText();
                    console.log("Selected Item:", sSelectedKey, sSelectedText);
                    this.SelectInputType = 'select'
                    // Set the selected key into the input field
                    var oMultiInput = this.getView().byId("IdPlant");
                    oMultiInput.setValue(sSelectedText); // Set the selected key into the MultiInput field
                }

                // Hide the busy indicator after the update
                sap.ui.core.BusyIndicator.hide();
            },

            // ====================================================================================
            // PROCESS ORDER FRAGMENT: =========================================================
            //=====================================================================================

            onValueHelpRequestProcOrder: function () {

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
                    oModel.read("/ZC_PRO_ORD_F4HELP", {
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
                        name: "zautodesignapp.view.yfcs.report.fragment.ProcessOrderFragment"
                    }).then(function (oDialog) {
                        var oFilterBar = oDialog.getFilterBar();

                        var oColumnProductCode, oColumnPostingDate, oColumnCompanyCode;
                        that._oVHD_ = oDialog;
                        that.getView().addDependent(oDialog);

                        // Set key fields for filtering in the Define Conditions Tab
                        oDialog.setRangeKeyFields([{
                            label: "Process Order No.",
                            key: "ProcessOrder",
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
                                    label: new sap.m.Label({ text: "Process Order No." }),
                                    template: new sap.m.Text({ wrapping: false, text: "{oJSONModel>ProcessOrder}" })
                                });
                                oColumnProductCode.data({
                                    fieldName: "ProcessOrder"
                                });

                                oTable.addColumn(oColumnProductCode);


                            } else if (oTable.bindItems) {
                                // Mobile scenario (sap.m.Table)
                                oTable.bindAggregation("items", {
                                    path: "oJSONModel>/Datas",
                                    template: new sap.m.ColumnListItem({
                                        cells: [
                                            new sap.m.Text({ text: "{oJSONModel>ProcessOrder}" }),

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
                                    header: new sap.m.Label({ text: "Process Order No." })
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

            onValueHelpOkPress_ProcOrder: function (oEvent) {
                var aTokens = oEvent.getParameter("tokens");
                console.log("aTokens:", aTokens)
                this.SelectInputType = 'fragment'
                if (aTokens.length <= 10) {
                    this._oMultiProcOrder.setTokens(aTokens);
                    this._oVHD_.close();
                } else {
                    // sap.m.MessageToast.show("Please Select max 10 Accounting documents only...!");
                    sap.m.MessageBox.error("Please Select max 15 Accounting documents only...!");
                }

            },

            onValueHelpCancelPress_ProcOrder: function () {
                this._oVHD_.close();
            },

            onValueHelpAfterClose_ProcOrder: function () {
                this._oVHD_.destroy();
            },

            onFilterBarSearch_ProcOrder: function (oEvent) {
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
                        new sap.ui.model.Filter({ path: "ProcessOrder", operator: sap.ui.model.FilterOperator.Contains, value1: sSearchQuery })


                    ],
                    and: false
                }));

                this._filterTableProcOrder(new sap.ui.model.Filter({
                    filters: aFilters,
                    and: true
                }));
            },

            _filterTableProcOrder: function (oFilter) {
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

            OnSuggest_User_ProcOrder: function (oEvent) {
                var sTerm = oEvent.getParameter("suggestValue");
                console.log("Press")

                this._connectToODataProductSearchServiceProcOrder(sTerm)
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
            _connectToODataProductSearchServiceProcOrder: function (sTerm) {
                var oModel = this.getView().getModel('ZCE_ZCOUNT_HEAD_SRVB'); // OData Model
                var aFilters = [
                    new sap.ui.model.Filter("ProcessOrder", sap.ui.model.FilterOperator.Contains, sTerm) // Search based on Name
                ];

                return new Promise(function (fnResolve, fnReject) {
                    // Perform OData read request
                    oModel.read("/ZC_PRO_ORD_F4HELP", {  // Replace "/ProductSet" with your OData entity set
                        filters: aFilters,
                        urlParameters: {
                            "$top": 5000
                        },
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

            // // // // Event handler for suggestion item selection
            ondocumentsuggestselected_ProcOrder: function (oEvent) {
                // Show the busy indicator as soon as the item is selected
                sap.ui.core.BusyIndicator.show();

                var oSelectedItem = oEvent.getParameter("selectedItem");
                if (oSelectedItem) {
                    var sSelectedKey = oSelectedItem.getKey();
                    var sSelectedText = oSelectedItem.getText();
                    console.log("Selected Item:", sSelectedKey, sSelectedText);
                    this.SelectInputType = 'select'
                    // Set the selected key into the input field
                    var oMultiInput = this.getView().byId("IdProcessOrder");
                    oMultiInput.setValue(sSelectedText); // Set the selected key into the MultiInput field
                }

                // Hide the busy indicator after the update
                sap.ui.core.BusyIndicator.hide();
            },



            // formatDate: function (oDate) {
            //     if (!oDate) return "";

            //     // Convert string to Date if needed
            //     if (typeof oDate === "string") {
            //         oDate = new Date(oDate);
            //     }

            //     var iDay = String(oDate.getDate()).padStart(2, '0');
            //     var iMonth = String(oDate.getMonth() + 1).padStart(2, '0');
            //     var iYear = oDate.getFullYear();

            //     return iDay + "-" + iMonth + "-" + iYear;
            // },

            OnGoItemPage: async function () {

                var oDateRange = this.getView().byId("DatesId");
                var batchTokens = this.getView().byId("IdBatch").getTokens();
                var plantTokens = this.getView().byId("IdPlant").getTokens();
                var procOrderTokens = this.getView().byId("IdProcessOrder").getTokens();

                var sDateRangeValue = oDateRange.getValue();
                const aBatchValues = batchTokens.map(oToken => oToken.getText().trim());
                const aPlantValues = plantTokens.map(oToken => oToken.getText().trim());
                const aProcOrderValues = procOrderTokens.map(t => t.getText().trim().padStart(12, "0"));

                // --- Date parsing ---
                let bHasDate = sDateRangeValue && sDateRangeValue.trim() !== "";
                let FromDate = "", ToDate = "";
                if (bHasDate) {
                    let [startDateStr, endDateStr] = sDateRangeValue.split(" - ");
                    let startDate = new Date(startDateStr);
                    let endDate = new Date(endDateStr);

                    FromDate = new Date(startDate.getTime() - (startDate.getTimezoneOffset() * 60000))
                        .toISOString().split("T")[0];
                    ToDate = new Date(endDate.getTime() - (endDate.getTimezoneOffset() * 60000))
                        .toISOString().split("T")[0];
                }

                let aFilter = [];

                if (aBatchValues.length > 0) {
                    const aBatchFilters = aBatchValues.map(batch =>
                        new sap.ui.model.Filter("batch", sap.ui.model.FilterOperator.EQ, batch)
                    );
                    aFilter.push(new sap.ui.model.Filter({
                        filters: aBatchFilters,
                        and: false // OR condition for multiple batches
                    }));
                }

                if (aPlantValues.length > 0) {
                    const aPlantFilters = aPlantValues.map(plant =>
                        new sap.ui.model.Filter("plant", sap.ui.model.FilterOperator.EQ, plant)
                    );
                    aFilter.push(new sap.ui.model.Filter({
                        filters: aPlantFilters,
                        and: false // OR condition for multiple plants
                    }));
                }


                // if (aProcOrderValues.length > 0) {
                //     const aProcOrderFilters = aProcOrderValues.map(procOrder =>
                //         new sap.ui.model.Filter("process_order", sap.ui.model.FilterOperator.EQ, procOrder)
                //     );
                //     aFilter.push(new sap.ui.model.Filter({
                //         filters: aProcOrderFilters,
                //         and: false // OR condition for multiple process orders
                //     }));
                // }

                if (procOrderTokens.length > 0) {
                    const prodFilters = aProcOrderValues.map(function (procOrder) {

                        return new sap.ui.model.Filter(
                            "process_order",
                            sap.ui.model.FilterOperator.EQ,
                            procOrder
                        );
                    });

                    aFilter.push(new sap.ui.model.Filter({
                        filters: prodFilters,
                        and: false
                    }));
                }



                if (bHasDate) {
                    aFilter.push(new sap.ui.model.Filter("yfcs_date", sap.ui.model.FilterOperator.BT, FromDate, ToDate));
                }

                const oModel = this.getView().getModel("ZCE_YFCS_REPT_SRVB");
                const that = this;
                that.getView().setBusy(true);

                let aAllItems = [];
                let iSkip = 0;
                const iTop = 200;

                // --- Recursive fetch (paging) ---
                function fetchData() {
                    oModel.read("/ZCE_YFCS_REPT", {
                        filters: aFilter,
                        urlParameters: {
                            "$skip": iSkip,
                            "$top": iTop
                        },
                        success: function (oData) {
                            if (oData.results.length > 0) {
                                aAllItems = aAllItems.concat(oData.results);
                                iSkip += iTop;
                                fetchData(); // continue loading
                            } else {
                                that.getView().setBusy(false);
                                console.log("Total rows fetched:", aAllItems.length);

                                let aResults = aAllItems;

                                // After fetchData() completes
                                aAllItems.sort(function (a, b) {
                                    return Number(a.boxno) - Number(b.boxno); // 
                                });

                                const oTabModel = new sap.ui.model.json.JSONModel({
                                    ItemData: aAllItems
                                });
                                that.getView().setModel(oTabModel, "TabModel");

                                //  Message if no results
                                if (aResults.length === 0) {
                                    sap.m.MessageToast.show("No records found for the given filters.");
                                }
                            }
                        },
                        error: function (error) {
                            that.getView().setBusy(false);
                            console.error("Error fetching data:", error);
                            sap.m.MessageToast.show("Error fetching data.");
                        }
                    });
                }

                // Start fetching
                fetchData();
            },

            // SAVE AND UPDATE FUNCTION : =================================================
            onSaveorUpdateSelectedRows: function () {
                sap.ui.core.BusyIndicator.show(0);
                var that = this;
                var oODataModel = this.getView().getModel("ZCE_YFCS_TAB_SRVB");
                var oTable = this.byId("idYfcsTable");

                var aSelectedIndices = oTable.getSelectedIndices();

                if (!aSelectedIndices.length) {
                    sap.ui.core.BusyIndicator.hide();
                    sap.m.MessageBox.warning("Please select at least one row");
                    return;
                }

                aSelectedIndices.forEach(function (iIndex) {

                    var oContext = oTable.getContextByIndex(iIndex);
                    var oRow = oContext.getObject();

                    if (!oRow.yfcs_date || !oRow.Observations || !oRow.fsc_operator || !oRow.location){
                        sap.ui.core.BusyIndicator.hide();
                        sap.m.MessageBox.warning("All input fields are mandetory to save");
                        return;
                    }

                    var sPath = oODataModel.createKey("/ZCE_YFCS_TAB", {
                        ProcessOrder: oRow.process_order,
                        Boxno: oRow.boxno
                    });

                    var oPayload = {
                        Createdat: that.formatDate(oRow.createdat),
                        ProcessOrder: oRow.process_order,
                        Customername: oRow.customername,
                        Salesorder: oRow.salesorder,
                        Batch: oRow.batch,
                        DrumNo: oRow.drum_no,
                        QtyLac: oRow.qty_lac,
                        Plant: oRow.plant,
                        Netwt: oRow.netwt,
                        Grosswt: oRow.grosswt,
                        Material: oRow.material,
                        FscOperator: oRow.fsc_operator,
                        Boxno: oRow.boxno,
                        Location: oRow.location,
                        Observations: oRow.Observations,
                        Packedby:oRow.packedby,
                        Capprinting: oRow.capprinting,
                        Bodyprinting: oRow.bodyprinting,
                        YfcsDate: that.formatDate(oRow.yfcs_date),
                        Status: "X"
                    };
                    console.log("oPayload", oPayload);

                    oODataModel.read(sPath, {
                        success: function () {
                            //  Record exists :  UPDATE
                            oODataModel.update(sPath, oPayload, {
                                success: function () {
                                    sap.ui.core.BusyIndicator.hide();
                                    sap.m.MessageToast.show("Data Saved successfully");
                                    // that._reloadTable();
                                    that.OnGoItemPage();
                                    oTable.clearSelection();
                                },
                                error: function () {
                                    sap.ui.core.BusyIndicator.hide();
                                    sap.m.MessageBox.error("Failed to save");
                                }
                            });
                        },
                        error: function () {
                            //  Record does not exist : CREATE
                            oODataModel.create("/ZCE_YFCS_TAB", oPayload, {
                                success: function () {
                                    sap.ui.core.BusyIndicator.hide();
                                    sap.m.MessageToast.show("Data Saved successfully");
                                    // that._reloadTable();
                                    that.OnGoItemPage();
                                    oTable.clearSelection();
                                },
                                error: function () {
                                    sap.ui.core.BusyIndicator.hide();
                                    sap.m.MessageBox.error("Failed to save");
                                }
                            });
                        }
                    });
                });
            },

            // _reloadTable: function () {
            //     var that = this;
            //     var oModel = this.getView().getModel("ZCE_YFCS_REPT_SRVB");
            //     var tabModel = this.getView().getModel("TabModel");
            //     var oTable = this.byId("idYfcsTable");

            //     oModel.read("/ZCE_YFCS_REPT", {
            //         success: function (oData) {
            //             if (tabModel) {
            //                 tabModel.setProperty("/ItemData", oData.results);
            //                 oTable.clearSelection();

            //                 // For sorting based on Box No:
            //                 var oBinding = oTable.getBinding("rows");
            //                 var oSorter = new sap.ui.model.Sorter("boxno", false);
            //                 oBinding.sort(oSorter);
            //                 }
            //         },
            //         error: function () {
            //             MessageBox.error("Failed to load updated table data.");
            //         }
            //     });
            // },

            _reloadTable: function () {
                sap.ui.core.BusyIndicator.show(0);
                var tabModel = this.getView().getModel("TabModel");
                // For Date:
                var sDateRangeValue = this.byId("datesId").getValue();
                let bHasDate = sDateRangeValue && sDateRangeValue.trim() !== "";
                let FromDate = "", ToDate = "";

                // For Process Orders:
                var procOrderTokens = this.getView().byId("IdProcessOrder").getTokens();
                const aProcOrderValues = procOrderTokens.map(t => t.getText().trim().padStart(12, "0"));


                if (bHasDate) {
                    let [startDateStr, endDateStr] = sDateRangeValue.split(" - ");
                    let startDate = new Date(startDateStr);
                    let endDate = new Date(endDateStr);

                    FromDate = new Date(startDate.getTime() - (startDate.getTimezoneOffset() * 60000))
                        .toISOString().split("T")[0];
                    ToDate = new Date(endDate.getTime() - (endDate.getTimezoneOffset() * 60000))
                        .toISOString().split("T")[0];
                }

                var that = this;
                var oModel = this.getView().getModel("ZCE_YFCS_REPT_SRVB");
                var oTable = this.byId("idYfcsTable");

                // Process order filter
                const aProcFilters = aProcOrderValues.map(function (procOrder) {
                    return new sap.ui.model.Filter(
                        "process_order",
                        sap.ui.model.FilterOperator.EQ,
                        procOrder
                    );
                });

                var aFilters = [
                    new sap.ui.model.Filter({ filters: aProcFilters, and: false })
                ];

                //  date filter
                if (bHasDate) {
                    aFilters.push(new sap.ui.model.Filter("yfcs_date", sap.ui.model.FilterOperator.BT, FromDate, ToDate));
                }

                oTable.setBusy(true);

                oModel.refresh(true);


                oModel.read("/ZCE_YFCS_REPT", {
                    filters: aFilters,
                    success: function (oData) {

                        if (tabModel) {
                            tabModel.setProperty("/ItemData", oData.results);
                            tabModel.refresh(true);
                        }

                        var oBinding = oTable.getBinding("rows");
                        oBinding.sort(new sap.ui.model.Sorter("boxno", false));

                        oTable.setBusy(false);
                        sap.ui.core.BusyIndicator.hide();

                    },
                    error: function () {
                        oTable.setBusy(false);
                        sap.m.MessageBox.error("Failed to load updated data");
                        sap.ui.core.BusyIndicator.hide();
                    }

                });
            },



            formatDate: function (Datess) {
                if (!Datess) {
                    return null;
                }

                var oDate = new Date(Datess);

                var yyyy = oDate.getFullYear();
                var mm = String(oDate.getMonth() + 1).padStart(2, "0");
                var dd = String(oDate.getDate()).padStart(2, "0");

                // DateTime format
                return yyyy + "-" + mm + "-" + dd + "T00:00:00";
            },

            // Export Table: =======================================================================

            OnExportExl: function () {
                var that = this;  // Keep reference to this controller

                sap.m.MessageBox.confirm("Do you want to download the data?", {
                    onClose: function (oAction) {
                        if (oAction === sap.m.MessageBox.Action.OK) {
                            var oTable = that.getView().byId("idYfcsTable");
                            var oBinding = oTable.getBinding("rows");
                            var aCols = that.createColumns();

                            var oSettings = {
                                workbook: {
                                    columns: aCols,
                                    hierarchyLevel: "Level"
                                },
                                dataSource: oBinding,
                                fileName: "YCFS Data"
                            };

                            var oSheet = new sap.ui.export.Spreadsheet(oSettings);
                            oSheet.build().finally(function () {
                                oSheet.destroy();
                            });
                        }
                        // Close the Message Box if cancels
                    }
                });
            },

            createColumns: function () {
                var EdmType = exportLibrary.EdmType;
                var aCols = [];

                aCols.push({
                    label: "Date",
                    property: "createdat",
                    type: EdmType.Date
                });

                aCols.push({
                    label: "Customer Name",
                    property: "customername",
                    type: EdmType.String
                });

                aCols.push({
                    label: "Batch",
                    property: "batch",
                    type: EdmType.String
                });

                aCols.push({
                    label: "Sales Order",
                    property: "salesorder",
                    type: EdmType.String
                });

                aCols.push({
                    label: "Material",
                    property: "material",
                    type: EdmType.String
                });

                aCols.push({
                    label: "Total Lakhs",
                    property: "tot_lac",
                    type: EdmType.Decimal
                });

                aCols.push({
                    label: "Plant",
                    property: "plant",
                    type: EdmType.String
                });

                aCols.push({
                    label: "Process Order",
                    property: "process_order",
                    type: EdmType.String
                });

                aCols.push({
                    label: "Box No",
                    property: "boxno",
                    type: EdmType.String
                });

                aCols.push({
                    label: "Drum",
                    property: "drum_no",
                    type: EdmType.String
                });

                aCols.push({
                    label: "Net Weight",
                    property: "netwt",
                    type: EdmType.String
                });

                aCols.push({
                    label: "Gross Weight",
                    property: "grosswt",
                    type: EdmType.String
                });

                aCols.push({
                    label: "Packing Operator",
                    property: "packingoperator",
                    type: EdmType.String
                });

                aCols.push({
                    label: "Cap Printing",
                    property: "capprinting",
                    type: EdmType.String
                });

                aCols.push({
                    label: "Body Printing",
                    property: "bodyprinting",
                    type: EdmType.String
                });

                aCols.push({
                    label: "FSC Operator",
                    property: "fsc_operator",
                    type: EdmType.String
                });

                aCols.push({
                    label: "yfcs Date",
                    property: "yfcs_date",
                    type: EdmType.Date
                });

                aCols.push({
                    label: "Observations",
                    property: "Observations",
                    type: EdmType.String
                });

                aCols.push({
                    label: "Location",
                    property: "location",
                    type: EdmType.String
                });
                return aCols;

            }




        });
    }
);


