sap.ui.define(
    [
        "zautodesignapp/controller/zcount/transaction/zcountbasecontroller",
        "sap/ui/core/mvc/Controller",
        "sap/ui/core/IconPool",
        "sap/ui/model/json/JSONModel"
    ],
    function (BaseController, IconPool, JSONModel) {
        "use strict";

        return BaseController.extend("zautodesignapp.controller.zcount.transaction.zcount_selectrange", {
            onInit: function () {
                BaseController.prototype.onInit.call(this);
                var oMultiInput;
                oMultiInput = this.byId("idprocessorder");
                this._oMultiInput = oMultiInput;

                this.SelectInputType = 'fragment'

            },



            onGoToScreen2: function () {
                this.showScreen("screen2");
            },

            onGoToScreen1: function () {

               // this.TabZcountItemModel.setProperty("/DatasZitem", []);
                // ✅ Refresh bindings if UI is still showing the old data
                //this.TabZcountItemModel.refresh(true);
                const oView = this.getView();
const oJSONModel = oView.getModel("TabZcountItemModel");
                if (oJSONModel) {
    oJSONModel.setData({ DatasZitem: [] });
    oJSONModel.updateBindings(true);
    console.log("Cleared local table model (TabZcountItemModel).");
}

                         const oODataModel = oView.getModel("ZSB_ZCOUNT_ITEM");
if (oODataModel) {
    oODataModel.refresh(true);
    console.log("Refreshed backend OData model (ZSB_ZCOUNT_ITEM).");
}

                this.showScreen("screen1");
            },

            //   onRowSelect: function (oEvent) {
            //       // Use the base controller's row select logic
            //       this.handleRowSelect(oEvent);
            //   },

            onValueHelpRequest: function () {
                var oModel = this.getView().getModel("ZCE_ZCOUNT_HEAD_SRVB");
                var that = this;
                var aAllItems = [];

                // Show busy indicator at the very beginning
                sap.ui.core.BusyIndicator.show();

                function fetchData(skipCount) {
                    oModel.read("/ZCE_ZCOUNT_PROCESS_ORD_F4HELP", {
                        urlParameters: {
                            $top: 5000,
                            $skip: skipCount
                        },
                        success: function (oData) {
                            var aItems = oData.results;
                            aAllItems = aAllItems.concat(aItems);

                            if (oData.results.length >= 5000) {
                                fetchData(skipCount + 5000);
                            } else {
                                finishFetching();
                                sap.ui.core.BusyIndicator.hide();
                            }
                        },
                        error: function (oError) {
                            console.error("Error reading data: ", oError);
                            sap.ui.core.BusyIndicator.hide();
                        }
                    });

                }

                function finishFetching() {
                    that.oJSONModel = new sap.ui.model.json.JSONModel({
                        Datas: aAllItems
                    });
                    that.getView().setModel(that.oJSONModel, "oJSONModel");

                    that._oBasicSearchField = new sap.m.SearchField();
                    that.loadFragment({
                        name: "zautodesignapp.view.zcount.transaction.fragment.ValueHelpDialog"
                    }).then(function (oDialog) {
                        var oFilterBar = oDialog.getFilterBar();
                        var oColumnProductCode;
                        that._oVHD = oDialog;
                        that.getView().addDependent(oDialog);

                        oDialog.setRangeKeyFields([{
                            label: "Process Order",
                            key: "ProcessOrder",
                            type: "string",
                            typeInstance: new sap.ui.model.type.String({}, {
                                maxLength: 10
                            })
                        }]);

                        oFilterBar.setFilterBarExpanded(false);
                        oFilterBar.setBasicSearch(that._oBasicSearchField);

                        that._oBasicSearchField.attachSearch(function () {
                            oFilterBar.search();
                        });

                        oDialog.getTableAsync().then(function (oTable) {
                            oTable.setModel(that.oJSONModel);

                            if (oTable.bindRows) {
                                oTable.bindAggregation("rows", {
                                    path: "oJSONModel>/Datas",
                                    events: {
                                        dataReceived: function () {
                                            oDialog.update();
                                            sap.ui.core.BusyIndicator.hide(); // Hide when desktop table is ready
                                        }
                                    }
                                });

                                oColumnProductCode = new sap.ui.table.Column({
                                    label: new sap.m.Label({ text: "Process Order" }),
                                    template: new sap.m.Text({ text: "{oJSONModel>ProcessOrder}" })
                                });
                                oColumnProductCode.data({ fieldName: "ProcessOrder" });
                                oTable.addColumn(oColumnProductCode);

                            } else if (oTable.bindItems) {
                                oTable.bindAggregation("items", {
                                    path: "oJSONModel>/Datas",
                                    template: new sap.m.ColumnListItem({
                                        cells: [
                                            new sap.m.Text({ text: "{oJSONModel>ProcessOrder}" })
                                        ]
                                    }),
                                    events: {
                                        dataReceived: function () {
                                            oDialog.update();
                                            sap.ui.core.BusyIndicator.hide(); // Hide when mobile table is ready
                                        }
                                    }
                                });

                                oTable.addColumn(new sap.m.Column({
                                    header: new sap.m.Label({ text: "Process Order" })
                                }));
                            }

                            oDialog.update(); // Fallback in case dataReceived doesn’t fire
                            oDialog.open();
                        }).catch(function () {
                            sap.ui.core.BusyIndicator.hide(); // Hide if fragment fails to load
                        });
                    }).catch(function () {
                        sap.ui.core.BusyIndicator.hide(); // Hide if fragment loading throws error
                    });
                }

                // Start fetching
                fetchData(0);
            },


            onValueHelpOkPress: function (oEvent) {
                var aTokens = oEvent.getParameter("tokens");

                if (aTokens && aTokens.length > 0) {
                    // Get the selected value from the first token
                    var sSelectedValue = aTokens[0].getKey(); // or getText() if needed

                    // Set the value to the input field
                    this.byId("idprocessorder").setValue(sSelectedValue);

                    // Optionally store it
                    this._selectedProcessOrder = sSelectedValue;

                    // Close the Value Help Dialog
                    this._oVHD.close();
                } else {
                    sap.m.MessageToast.show("Please select a Process Order.");
                }

                // Hide BusyIndicator
                sap.ui.core.BusyIndicator.hide();
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
                        new sap.ui.model.Filter({ path: "ProcessOrder", operator: sap.ui.model.FilterOperator.Contains, value1: sSearchQuery })

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
                var oModel = this.getView().getModel("ZCE_ZCOUNT_HEAD_SRVB"); // OData Model
                var aFilters = [
                    new sap.ui.model.Filter("ProcessOrder", sap.ui.model.FilterOperator.Contains, sTerm) // Search based on Name
                ];

                return new Promise(function (fnResolve, fnReject) {
                    // Perform OData read request
                    oModel.read("/ZCE_ZCOUNT_HEAD", {  // Replace "/ProductSet" with your OData entity set
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
                    var oMultiInput = this.getView().byId("idprocessorder");
                    oMultiInput.setValue(sSelectedText); // Set the selected key into the MultiInput field
                }

                // Hide the busy indicator after the update
                sap.ui.core.BusyIndicator.hide();
            },


        });
    }
);
