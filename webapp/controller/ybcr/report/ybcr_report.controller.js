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
        UI5Date, JSONModel, DateFormat, Spreadsheet) {
        "use strict";

        return BaseController.extend("zautodesignapp.controller.ybcr.report.ybcr_report", {
            // Initialization hook
            onInit: function () {

                var oMultiInput;
                oMultiInput = this.byId("idmaterialdocument");
                //oMultiInput.addValidator(this._onMultiInputValidate);
                // oMultiInput.setTokens(this._getDefaultTokens());
                this._oMultiInput = oMultiInput;

                var date = new Date();
                console.log("date", date);

                var oModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZCE_ZBCR_REPT_SRVB/");
                this.getView().setModel(oModel, "ZCE_ZBCR_REPT_SRVB");

                this.oTabModel = new sap.ui.model.json.JSONModel({ ItemData: "" });
                this.getView().setModel(this.oTabModel, "TabModel");
                this.tabModels = new sap.ui.model.json.JSONModel({ ItemDatas: "" });
                this.getView().setModel(this.tabModels, "TabModels");

            },


            formatTrimmedValue: function (value) {
                if (value && value.length >= 12) {
                    return value.substring(2); // Remove first 2 characters
                }
                return value;
            },

            onValueHelpRequest: function () {

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
                            name: "zautodesignapp.view.ybcr.report.fragment.ValueHelpDialogACM"
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
                        new sap.ui.model.Filter({ path: "batch", operator: sap.ui.model.FilterOperator.EQ, value1: sSearchQuery })

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

            formatDate: function (oDate) {
                if (!oDate) return "";

                // Convert string to Date if needed
                if (typeof oDate === "string") {
                    oDate = new Date(oDate);
                }

                var iDay = String(oDate.getDate()).padStart(2, '0');
                var iMonth = String(oDate.getMonth() + 1).padStart(2, '0');
                var iYear = oDate.getFullYear();

                return iDay + "-" + iMonth + "-" + iYear;
            },

            // OnGoItemPage: async function () {
            //     const oView = this.getView();
            //     const oDateRange = oView.byId("Datess");
            //     const aBatchTokens = oView.byId("idmaterialdocument").getTokens();
            //     const oTable = oView.byId("idItemTable");
            //     const oModel = oView.getModel("ZCE_ZBCR_REPT_SRVB");

            //     oView.setBusy(true);

            //     try {
            //         // -------------------------------
            //         // Prepare date range
            //         // -------------------------------
            //         const sDateRangeValue = oDateRange.getValue();
            //         const bHasDate = sDateRangeValue && sDateRangeValue.trim() !== "";
            //         let FromDate = "", ToDate = "";

            //         if (bHasDate) {
            //             const [startDateStr, endDateStr] = sDateRangeValue.split(" - ");
            //             FromDate = startDateStr + "T00:00:00"; // start of day
            //             ToDate = endDateStr + "T23:59:59";     // end of day
            //         }

            //         // -------------------------------
            //         // Prepare batch values
            //         // -------------------------------
            //         const aBatchValues = aBatchTokens.map(oToken => oToken.getText().trim());

            //         // -------------------------------
            //         // Step 1: Fetch all rows with non-null start_date
            //         // -------------------------------
            //         const nonNullDatesFilter = new sap.ui.model.Filter({
            //             filters: [
            //                 new sap.ui.model.Filter("start_date", sap.ui.model.FilterOperator.NE, null),
            //                 new sap.ui.model.Filter("end_date", sap.ui.model.FilterOperator.NE, null)
            //             ],
            //             and: true
            //         });

            //         let oData = await new Promise((resolve, reject) => {
            //             oModel.read("/ZCE_ZBCR_REPT", {
            //                 filters: [nonNullDatesFilter],
            //                 success: resolve,
            //                 error: reject
            //             });
            //         });

            //         let aResults = oData.results || [];
            //         console.log("Rows with non-null dates:", aResults.length);

            //         // -------------------------------
            //         // Step 2: Apply user-specified date range filter
            //         // -------------------------------
            //         if (bHasDate) {
            //             aResults = aResults.filter(item => {
            //                 const itemDate = new Date(item.start_date);
            //                 const from = new Date(FromDate);
            //                 const to = new Date(ToDate);
            //                 return itemDate >= from && itemDate <= to;
            //             });
            //             console.log("Rows after applying user date range:", aResults.length);
            //         }

            //         // -------------------------------
            //         // Step 3: Apply batch filter if date is not provided
            //         // -------------------------------
            //         if (!bHasDate && aBatchValues.length > 0) {
            //             aResults = aResults.filter(item => {
            //                 return aBatchValues.some(batch => {
            //                     let sBatch = batch.toString().trim();
            //                     if (item.batch === sBatch) return true;
            //                     // Check padded versions
            //                     if (/^\d+$/.test(sBatch) && sBatch.length < 10) {
            //                         const sPadded = sBatch.padStart(10, "0");
            //                         if (item.batch === sPadded) return true;
            //                         for (let i = sBatch.length + 1; i < 10; i++) {
            //                             const partialPad = sBatch.padStart(i, "0");
            //                             if (item.batch === partialPad) return true;
            //                         }
            //                     }
            //                     return false;
            //                 });
            //             });
            //             console.log("Rows after batch filter:", aResults.length);
            //         }

            //         // -------------------------------
            //         // Bind to table model
            //         // -------------------------------
            //         const oTabModel = new sap.ui.model.json.JSONModel({ ItemData: aResults });
            //         oView.setModel(oTabModel, "TabModel");

            //         // Enable editing if any row missing remark or status
            //         const bEditable = aResults.some(item => !item.status || !item.remark);
            //         if (oTable) oTable.setEditable(bEditable);

            //         if (aResults.length === 0) {
            //             sap.m.MessageToast.show("No data found.");
            //         }

            //     } catch (oError) {
            //         console.error("OData fetch error:", oError);
            //         sap.m.MessageToast.show("Error fetching data.");
            //     } finally {
            //         oView.setBusy(false);
            //     }
            // },


            // OnGoItemPage: async function () {

            //     var oDateRange = this.getView().byId("Datess");
            //     var batch0 = this.getView().byId("idmaterialdocument").getTokens();
            //     var sDateRangeValue = oDateRange.getValue();

            //     const aBatchValues = batch0.map(oToken => oToken.getText().trim());

            //     // Parse date range
            //     let bHasDate = sDateRangeValue && sDateRangeValue.trim() !== "";
            //     let FromDate = "", ToDate = "";
            //     if (bHasDate) {
            //         let [startDateStr, endDateStr] = sDateRangeValue.split(" - ");
            //         let startDate = new Date(startDateStr);
            //         let endDate = new Date(endDateStr);

            //         FromDate = new Date(startDate.getTime() - (startDate.getTimezoneOffset() * 60000))
            //             .toISOString().split("T")[0];
            //         ToDate = new Date(endDate.getTime() - (endDate.getTimezoneOffset() * 60000))
            //             .toISOString().split("T")[0];
            //     }

            //     // Optional: Warn if no filters
            //     if (!bHasDate && aBatchValues.length === 0) {
            //         sap.m.MessageToast.show("Please enter a date range or batch value to filter.");
            //         return;
            //     }

            //     const oModel = this.getView().getModel("ZCE_ZBCR_REPT_SRVB");
            //     const that = this;
            //     that.getView().setBusy(true);

            //     let aAllItems = [];
            //     let iSkip = 0;
            //     const iTop = 200; // fetch 200 records per call

            //     function fetchData() {
            //         oModel.read("/ZCE_ZBCR_REPT", {
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
            //                     that.getView().setBusy(false);

            //                     let aResults = aAllItems;
            //                     console.log("Fetched total records:", aResults.length);

            //                     // ✅ Step 1: Filter by date range (if given)
            //                     if (bHasDate) {
            //                         const From = new Date(FromDate);
            //                         const To = new Date(ToDate);

            //                         aResults = aResults.filter(item => {
            //                             if (!item.start_date) return false;
            //                             const itemDate = new Date(item.start_date);
            //                             return itemDate >= From && itemDate <= To;
            //                         });

            //                         console.log("Rows after date filter:", aResults.length);

            //                         // ✅ Step 2: If batch values are provided, filter those within this date range
            //                         if (aBatchValues.length > 0) {
            //                             aResults = aResults.filter(item => {
            //                                 return aBatchValues.some(batch => {
            //                                     let sBatch = batch.toString().trim();

            //                                     // Exact match
            //                                     if (item.batch === sBatch) return true;

            //                                     // Padded batch match
            //                                     if (/^\d+$/.test(sBatch) && sBatch.length < 10) {
            //                                         const sPadded = sBatch.padStart(10, "0");
            //                                         if (item.batch === sPadded) return true;

            //                                         for (let i = sBatch.length + 1; i < 10; i++) {
            //                                             const partialPad = sBatch.padStart(i, "0");
            //                                             if (item.batch === partialPad) return true;
            //                                         }
            //                                     }

            //                                     return false;
            //                                 });
            //                             });
            //                             console.log("Rows after date + batch filter:", aResults.length);
            //                         }
            //                     }

            //                     // ✅ Step 3: If NO date range but batch values exist — filter globally by batch
            //                     else if (aBatchValues.length > 0) {
            //                         aResults = aResults.filter(item => {
            //                             return aBatchValues.some(batch => {
            //                                 let sBatch = batch.toString().trim();

            //                                 if (item.batch === sBatch) return true;

            //                                 if (/^\d+$/.test(sBatch) && sBatch.length < 10) {
            //                                     const sPadded = sBatch.padStart(10, "0");
            //                                     if (item.batch === sPadded) return true;

            //                                     for (let i = sBatch.length + 1; i < 10; i++) {
            //                                         const partialPad = sBatch.padStart(i, "0");
            //                                         if (item.batch === partialPad) return true;
            //                                     }
            //                                 }
            //                                 return false;
            //                             });
            //                         });
            //                         console.log("Rows after batch-only filter:", aResults.length);
            //                     }

            //                     // ✅ Step 4: Bind filtered data to model
            //                     const oTabModel = new sap.ui.model.json.JSONModel({ ItemData: aResults });
            //                     that.getView().setModel(oTabModel, "TabModel");

            //                     console.log("Final filtered items:", aResults.length);

            //                     // ✅ Step 5: Make table editable if needed
            //                     const bEditable = aResults.some(item => !item.status || !item.remark);
            //                     const oTable = that.getView().byId("idItemTable");
            //                     if (oTable) oTable.setEditable(bEditable);

            //                     if (aResults.length === 0) {
            //                         sap.m.MessageToast.show("No valid records found for the given filters.");
            //                     }
            //                 }
            //             },
            //             error: function (error) {
            //                 that.getView().setBusy(false);
            //                 console.error("Error fetching data:", error);
            //                 sap.m.MessageToast.show("Error fetching data.");
            //             }
            //         });
            //     }

            //     // Start reading recursively
            //     fetchData();
            // },

            // OnGoItemPage: async function () {

            //     var oDateRange = this.getView().byId("Datess");
            //     var batchTokens = this.getView().byId("idmaterialdocument").getTokens();
            //     var sDateRangeValue = oDateRange.getValue();

            //     const aBatchValues = batchTokens.map(oToken => oToken.getText().trim());

            //     // --- Date parsing ---
            //     let bHasDate = sDateRangeValue && sDateRangeValue.trim() !== "";
            //     let FromDate = "", ToDate = "";
            //     if (bHasDate) {
            //         let [startDateStr, endDateStr] = sDateRangeValue.split(" - ");
            //         let startDate = new Date(startDateStr);
            //         let endDate = new Date(endDateStr);

            //         FromDate = new Date(startDate.getTime() - (startDate.getTimezoneOffset() * 60000))
            //             .toISOString().split("T")[0];
            //         ToDate = new Date(endDate.getTime() - (endDate.getTimezoneOffset() * 60000))
            //             .toISOString().split("T")[0];
            //     }

            //     let aFilter = [];   

            //     if (aBatchValues) {
            //         aFilter.push(new sap.ui.model.Filter("batch", sap.ui.model.FilterOperator.EQ, aBatchValues));
            //     }

            //     if (bHasDate) {
            //         aFilter.push(new sap.ui.model.Filter("start_date", sap.ui.model.FilterOperator.BT, FromDate, ToDate));
            //     }
                    


            //     const oModel = this.getView().getModel("ZCE_ZBCR_REPT_SRVB");
            //     const that = this;
            //     that.getView().setBusy(true);

            //     let aAllItems = [];
            //     let iSkip = 0;
            //     const iTop = 200;

            //     // Combine all filters
            //         const FinalFilter = new sap.ui.model.Filter({
            //             filters: aFilter,
            //             and: true
            //         });

            //     // --- Recursive fetch (paging) ---
            //     function fetchData() {
            //         oModel.read("/ZCE_ZBCR_REPT", {
            //             filters:[aFilter],
            //             urlParameters: {
            //                 "$skip": iSkip,
            //                 "$top": iTop
            //             },
            //             success: function (oData) {
            //                 if (oData.results.length > 0) {
            //                     aAllItems = aAllItems.concat(oData.results);
            //                     iSkip += iTop;
            //                     fetchData(); // continue loading
            //                 } else {
            //                     that.getView().setBusy(false);
            //                     console.log("Total rows fetched:", aAllItems.length);

            //                     let aResults = aAllItems;

            //                     // ✅ CASE 1: Both date and batch filters
            //                     if (bHasDate && aBatchValues.length > 0) {
            //                         const From = new Date(FromDate);
            //                         const To = new Date(ToDate);

            //                         // First filter by date range
            //                         aResults = aResults.filter(item => {
            //                             if (!item.start_date) return false;
            //                             const itemDate = new Date(item.start_date);
            //                             return itemDate >= From && itemDate <= To;
            //                         });

            //                         console.log("After date filter:", aResults.length);

            //                         // Then keep only matching batches
            //                         aResults = aResults.filter(item => {
            //                             return aBatchValues.some(batch => {
            //                                 let sBatch = batch.toString().trim();
            //                                 if (item.batch === sBatch) return true;
            //                                 // Padding match
            //                                 if (/^\d+$/.test(sBatch) && sBatch.length < 10) {
            //                                     const sPadded = sBatch.padStart(10, "0");
            //                                     if (item.batch === sPadded) return true;
            //                                     for (let i = sBatch.length + 1; i < 10; i++) {
            //                                         if (item.batch === sBatch.padStart(i, "0")) return true;
            //                                     }
            //                                 }
            //                                 return false;
            //                             });
            //                         });

            //                         console.log("After date + batch filter:", aResults.length);
            //                     }

            //                     // ✅ CASE 2: Only date filter
            //                     else if (bHasDate) {
            //                         const From = new Date(FromDate);
            //                         const To = new Date(ToDate);
            //                         aResults = aResults.filter(item => {
            //                             if (!item.start_date) return false;
            //                             const itemDate = new Date(item.start_date);
            //                             return itemDate >= From && itemDate <= To;
            //                         });
            //                         console.log("After date-only filter:", aResults.length);
            //                     }

            //                     // ✅ CASE 3: Only batch filter
            //                     else if (aBatchValues.length > 0) {
            //                         aResults = aResults.filter(item => {
            //                             return aBatchValues.some(batch => {
            //                                 let sBatch = batch.toString().trim();
            //                                 if (item.batch === sBatch) return true;
            //                                 // Padding match
            //                                 if (/^\d+$/.test(sBatch) && sBatch.length < 10) {
            //                                     const sPadded = sBatch.padStart(10, "0");
            //                                     if (item.batch === sPadded) return true;
            //                                     for (let i = sBatch.length + 1; i < 10; i++) {
            //                                         if (item.batch === sBatch.padStart(i, "0")) return true;
            //                                     }
            //                                 }
            //                                 return false;
            //                             });
            //                         });
            //                         console.log("After batch-only filter:", aResults.length);
            //                     }

            //                     // ✅ CASE 4: No filters → fetch all rows
            //                     else {
            //                         console.log("No filter applied — showing all records:", aResults.length);
            //                     }

            //                     // ✅ Bind filtered data
            //                     const oTabModel = new sap.ui.model.json.JSONModel({ ItemData: aResults });
            //                     that.getView().setModel(oTabModel, "TabModel");

            //                     // ✅ Optional: toggle editable mode
            //                     const bEditable = aResults.some(item => !item.status || !item.remark);
            //                     const oTable = that.getView().byId("idItemTable");
            //                     if (oTable) oTable.setEditable(bEditable);

            //                     // ✅ Message if no results
            //                     if (aResults.length === 0) {
            //                         sap.m.MessageToast.show("No records found for the given filters.");
            //                     }
            //                 }
            //             },
            //             error: function (error) {
            //                 that.getView().setBusy(false);
            //                 console.error("Error fetching data:", error);
            //                 sap.m.MessageToast.show("Error fetching data.");
            //             }
            //         });
            //     }

            //     // Start fetching
            //     fetchData();
            // },



            //    check code 
            //   OnGoItemPage: async function () {

            //     var oDateRange = this.getView().byId("Datess");
            //     var batchTokens = this.getView().byId("idmaterialdocument").getTokens();
            //     var sDateRangeValue = oDateRange.getValue();

            //     const aBatchValues = batchTokens.map(oToken => oToken.getText().trim());

            //     // --- Date parsing ---
            //     let bHasDate = sDateRangeValue && sDateRangeValue.trim() !== "";
            //     let FromDate = "", ToDate = "";
            //     if (bHasDate) {
            //         let [startDateStr, endDateStr] = sDateRangeValue.split(" - ");
            //         let startDate = new Date(startDateStr);
            //         let endDate = new Date(endDateStr);

            //         FromDate = new Date(startDate.getTime() - (startDate.getTimezoneOffset() * 60000))
            //             .toISOString().split("T")[0];
            //         ToDate = new Date(endDate.getTime() - (endDate.getTimezoneOffset() * 60000))
            //             .toISOString().split("T")[0];
            //     }

            //     let aFilter = [];

            //     // if (aBatchValues) {
            //     //     aFilter.push(new sap.ui.model.Filter("batch", sap.ui.model.FilterOperator.EQ, aBatchValues));
            //     // }
            //     if (aBatchValues.length > 0) {
            //         const aBatchFilters = aBatchValues.map(batch =>
            //             new sap.ui.model.Filter("batch", sap.ui.model.FilterOperator.EQ, batch)
            //         );
            //         aFilter.push(new sap.ui.model.Filter({
            //             filters: aBatchFilters,
            //             and: false // OR condition for multiple batches
            //         }));
            //     }


            //     if (bHasDate) {
            //         aFilter.push(new sap.ui.model.Filter("start_date", sap.ui.model.FilterOperator.BT, FromDate, ToDate));
            //     }

            //     const oModel = this.getView().getModel("ZCE_ZBCR_REPT_SRVB");
            //     const that = this;
            //     that.getView().setBusy(true);

            //     let aAllItems = [];
            //     let iSkip = 0;
            //     const iTop = 200;

            //     // Combine all filters
            //     const FinalFilter = new sap.ui.model.Filter({
            //         filters: aFilter,
            //         and: true
            //     });

            //     // --- Recursive fetch (paging) ---
            //     function fetchData() {
            //         oModel.read("/ZCE_ZBCR_REPT", {
            //             filters: [FinalFilter],
            //             urlParameters: {
            //                 "$skip": iSkip,
            //                 "$top": iTop
            //             },
            //             success: function (oData) {
            //                 if (oData.results.length > 0) {
            //                     aAllItems = aAllItems.concat(oData.results);
            //                     iSkip += iTop;
            //                     fetchData(); // continue loading
            //                 } else {
            //                     that.getView().setBusy(false);
            //                     console.log("Total rows fetched:", aAllItems.length);
                                                
            //                     let aResults = aAllItems; 
                                
            //                     // Bind filtered data
            //                     const oTabModel = new sap.ui.model.json.JSONModel({ ItemData: aResults });
            //                     that.getView().setModel(oTabModel, "TabModel");

            //                     //  Message if no results
            //                     if (aResults.length === 0) {
            //                         sap.m.MessageToast.show("No records found for the given filters.");
            //                     }
            //                 }
            //             },
            //             error: function (error) {
            //                 that.getView().setBusy(false);
            //                 console.error("Error fetching data:", error);
            //                 sap.m.MessageToast.show("Error fetching data.");
            //             }
            //         });
            //     }

            //     // Start fetching
            //     fetchData();
            // },



            OnGoItemPage: async function () {

    var oDateRange = this.getView().byId("Datess");
    var batchTokens = this.getView().byId("idmaterialdocument").getTokens();
    var sDateRangeValue = oDateRange.getValue();

    const aBatchValues = batchTokens.map(oToken => oToken.getText().trim());

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

    // ---- Build filters ----
    let aFilter = [];

    // Batch filter (OR condition)
    if (aBatchValues.length > 0) {
        const aBatchFilters = aBatchValues.map(batch =>
            new sap.ui.model.Filter("batch", sap.ui.model.FilterOperator.EQ, batch)
        );

        aFilter.push(
            new sap.ui.model.Filter({
                filters: aBatchFilters,
                and: false // OR condition
            })
        );
    }

    // Date range filter
    if (bHasDate) {
        aFilter.push(
            new sap.ui.model.Filter("start_date", sap.ui.model.FilterOperator.BT, FromDate, ToDate)
        );
    }

    // Combine filters (AND = batch + date)
    const FinalFilter = new sap.ui.model.Filter({
        filters: aFilter,
        and: true
    });

    // ---- Read Model ----
    const oModel = this.getView().getModel("ZCE_ZBCR_REPT_SRVB");
    const that = this;

    that.getView().setBusy(true);

    let aAllItems = [];
    let iSkip = 0;
    const iTop = 200;

    // ---- Recursive Paging Function ----
    function fetchData() {

        let mParameters = {
            urlParameters: {
                "$skip": iSkip,
                "$top": iTop
            },
            success: function (oData) {
                if (oData.results.length > 0) {
                    aAllItems = aAllItems.concat(oData.results);
                    iSkip += iTop;
                    fetchData(); // Continue next page
                } else {
                    that.getView().setBusy(false);

                    console.log("Total rows fetched:", aAllItems.length);

                    // Bind final result
                    const oTabModel = new sap.ui.model.json.JSONModel({ ItemData: aAllItems });
                    that.getView().setModel(oTabModel, "TabModel");

                    if (aAllItems.length === 0) {
                        sap.m.MessageToast.show("No records found for the given filters.");
                    }
                }
            },
            error: function (error) {
                that.getView().setBusy(false);
                console.error("Error fetching data:", error);
                sap.m.MessageToast.show("Error fetching data.");
            }
        };

        // 👉 Apply filters ONLY IF present
        if (aFilter.length > 0) {
            mParameters.filters = [FinalFilter];
        }

        oModel.read("/ZCE_ZBCR_REPT", mParameters);
    }

    // ---- Start Fetching ----
    fetchData();
},

            onRowSelectionChange: function (oEvent) {
                var oTable = this.byId("idItemTable");
                var aSelectedIndices = oTable.getSelectedIndices();
                console.log("Selected row indices:", aSelectedIndices);

                // Fetch the selected items from the model based on the selected indices
                var oModel = this.getView().getModel("TabModel");
                var aSelectedItems = aSelectedIndices.map(function (iIndex) {
                    return oModel.getProperty("/ItemData/" + iIndex);
                });

                console.log("Selected rows data:", aSelectedItems);

                // You can now perform any operation with the selected rows, like updating data or triggering other events
            },

            // Function to handle row selection change when selection mode is set to multi-toggle
            onRowToggleChange: function (oEvent) {
                var oTable = this.byId("idItemTable");
                var aSelectedRows = oTable.getSelectedIndices();
                console.log("Selected rows after toggle:", aSelectedRows);

                // Do something with the selected rows
                var oModel = this.getView().getModel("TabModel");
                var aSelectedItems = aSelectedRows.map(function (index) {
                    return oModel.getProperty("/ItemData/" + index);
                });

                console.log("Selected rows data after toggle:", aSelectedItems);
            },
            // Save new added fileds grey out

            onSaveOrCreateRows: function () {
                var oTable = this.getView().byId("idItemTable");
                var aSelectedIndices = oTable.getSelectedIndices();

                if (aSelectedIndices.length === 0) {
                    MessageToast.show("Please select at least one row.");
                    return;
                }

                var oDataModel = this.getView().getModel("ZCE_ZBCR_REPT_SRVB"); // ✅ Correct model
                var that = this;
                var iProcessedCount = 0;

                aSelectedIndices.forEach(function (iIndex) {
                    var oSelectedRow = oTable.getContextByIndex(iIndex).getObject();
                    var sBatch = oSelectedRow.batch;

                    if (!sBatch || !oSelectedRow.status || !oSelectedRow.remark) {
                        MessageToast.show("Please enter all required details before saving.");
                        return;
                    }

                    var payload = {
                        batch: sBatch,
                        status: oSelectedRow.status,
                        remark: oSelectedRow.remark
                    };

                    // 🔍 Check if record exists before deciding create/update
                    var sPath = "/ZCE_DCR_STATUS(batch='" + sBatch + "')";
                    oDataModel.read(sPath, {
                        success: function () {
                            // ✅ Record exists → update
                            that._updateRow(oDataModel, sBatch, payload, function () {
                                iProcessedCount++;
                                that._checkAndClearSelection(oTable, aSelectedIndices, iProcessedCount);
                            });
                        },
                        error: function () {
                            // ❌ Record doesn't exist → create
                            that._createRow(oDataModel, payload, function () {
                                iProcessedCount++;
                                that._checkAndClearSelection(oTable, aSelectedIndices, iProcessedCount);
                            });
                        }
                    });
                });
            },

            /**
             * Helper for updating an existing row
             */
            _updateRow: function (oDataModel, sBatch, payload, fnCallback) {
                oDataModel.update("/ZCE_DCR_STATUS(batch='" + sBatch + "')", payload, {
                    success: function () {
                        console.log("Row updated successfully for batch:", sBatch);
                        MessageToast.show("Row updated successfully for batch: " + sBatch);
                        if (fnCallback) fnCallback();
                    },
                    error: function (oError) {
                        console.error("Failed to update row for batch:", sBatch, oError);
                        MessageToast.show("Error updating row for batch: " + sBatch);
                        if (fnCallback) fnCallback();
                    }
                });
            },

            /**
             * Helper for creating a new row
             */
            _createRow: function (oDataModel, payload, fnCallback) {
                oDataModel.create("/ZCE_DCR_STATUS", payload, {
                    success: function (oData) {
                        console.log("Row created successfully:", oData);
                        MessageToast.show("Row created successfully for batch: " + payload.batch);
                        if (fnCallback) fnCallback();
                    },
                    error: function (oError) {
                        console.error("Failed to create row:", oError);
                        MessageToast.show("Error creating row for batch: " + payload.batch);
                        if (fnCallback) fnCallback();
                    }
                });
            },

            /**
             * Helper to clear selection and refresh table after all rows processed
             */
            _checkAndClearSelection: function (oTable, aSelectedIndices, iProcessedCount) {
                // When all selected rows have been processed
                if (iProcessedCount === aSelectedIndices.length) {
                    oTable.clearSelection(); // ✅ Unselect all rows
                    this._refreshTableData();
                    console.log("All selected rows processed and selection cleared.");
                }
            },

            _refreshTableData: function () {
                var oTable = this.getView().byId("idItemTable");
                var oBinding = oTable.getBinding("rows");

                if (oBinding) {
                    oBinding.refresh();
                    console.log("Table data refreshed");
                }
            },

            OnExportExl: function () {
                var that = this;  // Keep reference to this controller
 
                sap.m.MessageBox.confirm("Do you want to download the data?", {
                    onClose: function (oAction) {
                        if (oAction === sap.m.MessageBox.Action.OK) {
                            var oTable = that.getView().byId("idItemTable");
                            var oBinding = oTable.getBinding("rows");
                            var aCols = that.createColumnConfig();
 
                            var oSettings = {
                                workbook: {
                                    columns: aCols,
                                    hierarchyLevel: "Level"
                                },
                                dataSource: oBinding,
                                fileName: "YBCR Report"
                            };
 
                            var oSheet = new Spreadsheet(oSettings);
                            oSheet.build().finally(function () {
                                oSheet.destroy();
                            });
                        }
                        // Close the Message Box if cancels
                    }
                });
            },


            createColumnConfig: function () {

                return [


                    {
                        label: 'Date',
                        property: 'start_date',
                        type: sap.ui.export.EdmType.Date,
                        format: 'dd-mm-yyyy',
                        width: '18'
                    },


                    {
                        label: 'Batch',
                        property: 'batch',
                        width: '12'
                    },



                    {
                        label: 'Customer Name',
                        property: 'CustomerName',
                        width: '12'
                    },


                    {
                        label: 'Status',
                        property: 'status',
                        width: '12'
                    },


                    {
                        label: 'Remark',
                        property: 'remark',
                        width: '12'
                    },



                    {
                        label: 'Product Description',
                        property: 'ProductDescription',
                        width: '12'
                    },



                    {
                        label: 'Material',
                        property: 'material',
                        width: '12'
                    },


                    {
                        label: 'Ft Qty',
                        property: 'mateft_qtyrial',
                        width: '12'
                    },


                       {
                        label: 'FT Status',
                        property: 'ft_status',
                        width: '12'
                    },


                    {
                        label: 'ACM QTY',
                        property: 'acm_qty',
                        width: '12'
                    },


                      {
                        label: 'ACM Status',
                        property: 'acm_status',
                        width: '12'
                    },


                    {
                        label: 'ACM Waste',
                        property: 'acm_wast',
                        width: '12'
                    },

                    {
                        label: 'ATS QTY',
                        property: 'ats_qty',
                        width: '12'
                    },


                    {
                        label: 'ATS Wastage KGS',
                        property: 'ats_wast',
                        width: '12'
                    },


                       {
                        label: 'ATS Loss %',
                        property: 'atsloss_per',
                        width: '12'
                    },

                    {
                        label: 'ATS HFX',
                        property: 'ats_hfx',
                        width: '12'
                    },



                    {
                        label: 'ATS Box',
                        property: 'ats_box',
                        width: '12'
                    },



                    {
                        label: 'AIS QTY',
                        property: 'ais_qty',
                        width: '12'
                    },


                    {
                        label: 'AIS Wastage KGS',
                        property: 'ais_wast',
                        width: '12'
                    },


                      {
                        label: 'AIS Loss %',
                        property: 'aisloss_per',
                        width: '12'
                    },


                        {
                        label: 'Total Loss in Lakhs',
                        property: 'total_loss_lakhs',
                        width: '12'
                    },


                    
                        {
                        label: 'Total Loss %',
                        property: 'total_loss_per',
                        width: '12'
                    },


                         {
                        label: 'Convertiblity',
                        property: 'convertiblity',
                        width: '12'
                    },




                    {
                        label: 'AIS Box',
                        property: 'ais_box',
                        width: '12'
                    },


                    {
                        label: 'PTG QTY',
                        property: 'ptg_qty',
                        width: '12'
                    },


                    
                    {
                        label: 'PTG Status',
                        property: 'ptg_status',
                        width: '12'
                    },


                    {
                        label: 'PTG Wastage KGS',
                        property: 'ptg_wast',
                        width: '12'
                    },

                     {
                        label: 'Printing Loss %',
                        property: 'ptgloss_per',
                        width: '12'
                    },


    

                    {
                        label: 'Packed Qty',
                        property: 'packed_qty',
                        width: '12'
                    },


                      {
                        label: 'Packed Date',
                        property: 'packed_date',
                        type: sap.ui.export.EdmType.Date,
                        format: 'dd-mm-yyyy',
                        width: '12'
                    },


                     {
                        label: 'Packing Status',
                        property: 'packing_status',
                        width: '12'
                    },


                    {
                        label: 'Dispatched Qty',
                        property: 'dispatched_qty',
                        width: '12'
                    },


                    {
                        label: 'Reference No',
                        property: 'reference_no',
                        width: '12'
                    },


                ];
            },




        });
    }
);


