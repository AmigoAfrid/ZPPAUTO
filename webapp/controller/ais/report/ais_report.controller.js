sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/core/IconPool",
        "sap/ui/model/json/JSONModel",
         "sap/ui/export/Spreadsheet",
    ],
    function(BaseController, IconPool, JSONModel) {
      "use strict";
  
      return BaseController.extend("zautodesignapp.controller.ais.report.ais_report", {
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


        this.aisModel = new sap.ui.model.json.JSONModel({
            HeaderData: [{
                daterange: "",
                machineno: ""
            }],
            TableVisible: false
        });

        this.getView().setModel(this.aisModel, "aisModel");

        this.tabModel = new sap.ui.model.json.JSONModel({ ItemData: ""});
        this.getView().setModel(this.tabModel, "TabModel");

        var _oMultiInputMaterial;

        _oMultiInputMaterial = this.byId("idmaterialais");
        this._oMultiInputMaterial = _oMultiInputMaterial


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
                            name: "zautodesignapp.view.ais.report.fragment.ValueHelpDialogAIS"
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




             OnAisCheck: function () {

                if (!this.ChFrag) {
                    this.ChFrag = sap.ui.xmlfragment(this.getView().getId("id_aismachines"), "zautodesignapp.view.ais.transaction.fragment.valuehelp", this);
                    this.getView().addDependent(this.ChFrag);
                }
                this.ChFrag.open();
            },

             OnClose: function () {
                this.ChFrag.close();

            },


             onButtonPress: function (oEvent) {
                var sSelectedMachineNo = oEvent.getSource().getText();

                var sUpdatedMachineNo = "AIS" + sSelectedMachineNo;
                if (this.aisModel) {
                    this.aisModel.setProperty("/HeaderData/0/selectedMachine", sUpdatedMachineNo); // Update model property
                } else {
                    console.error("atsModel not found.");
                }

                // Close the dialog
                this.ChFrag.close();

            },
      
        OnDateChangeValueAIS: function (Datess) {
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
            
       

            formatDate: function (value) {
                if (value === "Total") {
                    return "Total"; // Directly return "Total" if that's the value
                }
                // Apply date formatting if it's not "Total"
                var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
                    pattern: "yyyy-MM-dd"
                });
                return oDateFormat.format(new Date(value));
            },

            onRowSelect: function (oEvent) {
                var oTable = this.byId("ais_report_table");
                var aSelectedIndices = oTable.getSelectedIndices();
                var aSelectedItems = [];

                aSelectedIndices.forEach(function (iIndex) {
                    var oContext = oTable.getContextByIndex(iIndex);
                    if (oContext) {
                        var oRowData = oContext.getObject();

                        aSelectedItems.push({
                            sap_uuid: oRowData.sap_uuid, // or however it's named exactly in your model
                            Location1: oRowData.Location1 || "",
                            Location2: oRowData.Location2 || "",
                            Location3: oRowData.Location3 || "",
                            Location4: oRowData.Location4 || ""
                        });
                    }
                });

                this._aSelectedItems = aSelectedItems;
                console.log("Selected rows to save:", this._aSelectedItems);
            },


            // OnGoItemPage: async function (token) {
            //     var Dates = this.getView().byId("Date").getValue();
            //     var batch0 = this.getView().byId("idmaterialdocument").getTokens();
            //     var ProdDoc = this.getView().byId("idprocessorder").getTokens();

            //     var oMachineInput = this.byId("id_aismachines");
            //     var sMachineValue = oMachineInput.getValue();
            //     var sMachineId = sMachineValue.replace(/[^\d]/g, '').replace(/^0+/, '');

            //           const smaterial = this.getView().byId("idmaterialais").getTokens();
            //                     const aMultiInputValuesMaterial = smaterial.map(oToken => oToken.getText());
            //     var aMultiInputValues = batch0.map(function (oToken) {
            //         return oToken.getText();
            //     });

            //     var aMultiInputValues = batch0.map(function (oToken) {
            //         return oToken.getText();
            //     });

            //     var aMultiInputValues_ = ProdDoc.map(function (oToken) {
            //         return oToken.getText();
            //     });

            //     const bHasDate = Dates && Dates.trim() !== "";
            //     let FromDate = "", ToDate = "";

            //     if (bHasDate) {
            //         const myArray = Dates.split(" - ");
            //         const datefrom = new Date(myArray[0]);
            //         const dateto = new Date(myArray[1]);
            //         FromDate = new Date(datefrom.getTime() - (datefrom.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
            //         ToDate = new Date(dateto.getTime() - (dateto.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
            //     }

            //     let FinalFilter = [];

            //     // Add batch filters
            //     if (batch0.length > 0) {
            //         const batchFilters = aMultiInputValues.map(function (sValue) {
            //             return new sap.ui.model.Filter("batch", sap.ui.model.FilterOperator.EQ, sValue);
            //         });
            //         FinalFilter.push(new sap.ui.model.Filter({ filters: batchFilters, and: false }));
            //     }


            //     if (sMachineId.length > 0) {
            //         FinalFilter.push(new sap.ui.model.Filter("aismachineno", sap.ui.model.FilterOperator.EQ, sMachineId));
            //     }

            //     // Add production order filters
            //     if (ProdDoc.length > 0) {
            //         const prodFilters = aMultiInputValues_.map(function (sValue) {
            //             return new sap.ui.model.Filter("processorder", sap.ui.model.FilterOperator.EQ, sValue);
            //         });
            //         FinalFilter.push(new sap.ui.model.Filter({ filters: prodFilters, and: false }));
            //     }

            //             // Add material order filters
            //     if (smaterial.length > 0) {
            //         const matFilters = aMultiInputValuesMaterial.map(function (sValue) {
            //             return new sap.ui.model.Filter("product", sap.ui.model.FilterOperator.EQ, sValue);
            //         });
            //         FinalFilter.push(new sap.ui.model.Filter({ filters: matFilters, and: false }));
            //     }

            //     // Add date filter
            //     if (bHasDate) {
            //         FinalFilter.push(new sap.ui.model.Filter("zdate", sap.ui.model.FilterOperator.BT, FromDate, ToDate));
            //     }

            //     // FinalFilter.push(new sap.ui.model.Filter("materialdocumentno_gi", sap.ui.model.FilterOperator.NE, ""));

            //     // Data fetch
            //     const model0 = this.getView().getModel("ZSB_AU_QA02_ITEM");
            //     let aAllItems = [];
            //     let iSkip = 0;
            //     const iTop = 100;
            //     const that = this;

            //     that.getView().setBusy(true);

            //     function fetchData() {
            //         model0.read("/ZC_AU_QA02ITEM", {
            //             filters: FinalFilter,
            //             urlParameters: {
            //                 "$skip": iSkip,
            //                 "$top": iTop
            //             },
            //             success: function (oData) {
            //                 if (oData.results.length > 0) {
            //                     aAllItems = aAllItems.concat(oData.results);
            //                     iSkip += iTop;
            //                     fetchData(); // Recursively fetch more data if available
            //                 } else {
            //                     // ✅ Sum required fields
            //                     let totalAverageWt = 0;
            //                     let totalAtsWeight = 0;
            //                     let totalAisWastage = 0;
            //                     let totalquantatyltr = 0;
            //                     let totalcummlativeqty = 0;
            //                     let totalcummlativentry= 0;
            //                     let totalagradeqty= 0;
            //                     let totalhfx= 0;
            //                     let totalfloorwaste =0;

            //                     aAllItems.forEach(function (item) {
            //                         totalAverageWt  += parseFloat(item.averagewt)   || 0;
            //                         totalAtsWeight  += parseFloat(item.atsweight)   || 0;
            //                         totalAisWastage += parseFloat(item.aiswastage)  || 0;
            //                          totalquantatyltr += parseFloat(item.qtylitre)  || 0;
            //                          totalcummlativeqty += parseFloat(item.cumqty)  || 0;
            //                          totalcummlativentry += parseFloat(item.cumulativeentry)  || 0;
            //                           totalagradeqty += parseFloat(item.agradeqty)  || 0;
            //                            totalhfx += parseFloat(item.hfx)  || 0;
            //                             totalfloorwaste += parseFloat(item.floorwaste)  || 0;
            //                     });
                              

            //                     // ✅ Add total row to the data
            //                     aAllItems.push({
            //                         zdate: "Total",
            //                         averagewt: totalAverageWt.toFixed(2),
            //                         atsweight: totalAtsWeight.toFixed(2),
            //                         aiswastage: totalAisWastage.toFixed(2),
            //                         qtylitre : totalquantatyltr.toFixed(2),
            //                         cumqty : totalcummlativeqty.toFixed(2),
            //                         cumulativeentry : totalcummlativentry.toFixed(2),
            //                         agradeqty : totalagradeqty.toFixed(2),
            //                         hfx : totalhfx.toFixed(2),
            //                         floorwaste : totalfloorwaste.toFixed(2),
            //                         isTotalRow: true,
            //                     });

            //                     that.tabModel = new sap.ui.model.json.JSONModel({ ItemData: aAllItems });
            //                     that.getView().setModel(that.tabModel, "TabModel");
            //                     that.getView().setBusy(false);
            //                     console.log("All items loaded with total row:", aAllItems.length);
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

            OnGoItemPage: async function (token) {
    const that = this;
    const view = this.getView();
    view.setBusy(true);

    // 1️⃣ Get Filter Inputs
    const Dates = view.byId("Date").getValue();
    const batch0 = view.byId("idmaterialdocument").getTokens();
    const ProdDoc = view.byId("idprocessorder").getTokens();
    const smaterial = view.byId("idmaterialais").getTokens();

    const aBatchValues = batch0.map(oToken => oToken.getText());
    const aProdDocValues = ProdDoc.map(oToken => oToken.getText());
    const aMaterialValues = smaterial.map(oToken => oToken.getText());

    const sMachineValue = this.byId("id_aismachines").getValue();
    const sMachineId = sMachineValue.replace(/[^\d]/g, '').replace(/^0+/, '');

    // 2️⃣ Date Processing
    let FromDate = "", ToDate = "";
    const bHasDate = Dates && Dates.trim() !== "";
    if (bHasDate) {
        const [start, end] = Dates.split(" - ");
        const datefrom = new Date(start);
        const dateto = new Date(end);
        FromDate = new Date(datefrom.getTime() - (datefrom.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
        ToDate = new Date(dateto.getTime() - (dateto.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
    }

    // 3️⃣ Construct Filters
    let FinalFilter = [];

    if (aBatchValues.length > 0) {
        const batchFilters = aBatchValues.map(s => new sap.ui.model.Filter("batch", sap.ui.model.FilterOperator.EQ, s));
        FinalFilter.push(new sap.ui.model.Filter({ filters: batchFilters, and: false }));
    }

    if (aProdDocValues.length > 0) {
        const prodFilters = aProdDocValues.map(s => new sap.ui.model.Filter("processorder", sap.ui.model.FilterOperator.EQ, s));
        FinalFilter.push(new sap.ui.model.Filter({ filters: prodFilters, and: false }));
    }

    if (aMaterialValues.length > 0) {
        const matFilters = aMaterialValues.map(s => new sap.ui.model.Filter("product", sap.ui.model.FilterOperator.EQ, s));
        FinalFilter.push(new sap.ui.model.Filter({ filters: matFilters, and: false }));
    }

    if (sMachineId.length > 0) {
        FinalFilter.push(new sap.ui.model.Filter("aismachineno", sap.ui.model.FilterOperator.EQ, sMachineId));
    }

    if (bHasDate) {
        FinalFilter.push(new sap.ui.model.Filter("zdate", sap.ui.model.FilterOperator.BT, FromDate, ToDate));
    }



      // GoodsReceipt or GoodsIssue filter
                const goodsReceiptOrIssueFilter = new sap.ui.model.Filter({
                    filters: [
                        new sap.ui.model.Filter("materialdocumentno_gi", sap.ui.model.FilterOperator.NE, ""),
                        new sap.ui.model.Filter("materialdocumentno_gr", sap.ui.model.FilterOperator.NE, "")
                    ],
                    and: true
                });
                FinalFilter.push(goodsReceiptOrIssueFilter);

    // 4️⃣ Fetch from ZC_AU_QA02ITEM (Main Items)
    const modelItems = view.getModel("ZSB_AU_QA02_ITEM");
    let aAllItems = [];
    let iSkip = 0;
    const iTop = 100;

    function fetchItemData(resolve, reject) {
        modelItems.read("/ZC_AU_QA02ITEM", {
            filters: FinalFilter,
            urlParameters: {
                "$skip": iSkip,
                "$top": iTop
            },
            success: function (oData) {
                aAllItems = aAllItems.concat(oData.results);
                if (oData.results.length === iTop) {
                    iSkip += iTop;
                    fetchItemData(resolve, reject); // recursive call
                } else {
                    resolve(aAllItems);
                }
            },
            error: function (err) {
                reject(err);
            }
        });
    }

    try {
        const items = await new Promise(fetchItemData);

        // 5️⃣ Fetch from ZC_YAIS_Fields (Field Enrichment Data)
        const modelFields = view.getModel("ZSB_YAIS_FIELDS");

        const fieldResults = await new Promise((resolve, reject) => {
            modelFields.read("/ZC_YAIS_Fields", {
                success: function (data) {
                    resolve(data.results);
                },
                error: function (err) {
                    reject(err);
                }
            });
        });

        // 6️⃣ Normalize & Merge on sap_uuid / Sap_uuid
        const normalizedFieldResults = fieldResults.map(f => ({
            ...f,
            sap_uuid: f.Sap_uuid // create consistent lowercase field
        }));

        const mergedData = items.map(item => {
            const match = normalizedFieldResults.find(f =>
                f.sap_uuid && item.sap_uuid &&
                f.sap_uuid.toLowerCase() === item.sap_uuid.toLowerCase()
            );
            return {
                ...item,
                ...(match || {}) // merge matching fields
            };
        });

        // 7️⃣ Calculate Totals
        let totalAverageWt = 0, totalAtsWeight = 0, totalAisWastage = 0;
        let totalquantatyltr = 0, totalcummlativeqty = 0, totalcummlativentry = 0;
        let totalagradeqty = 0, totalhfx = 0, totalfloorwaste = 0,totalwastagelakhs=0

        mergedData.forEach(item => {
            totalAverageWt += parseFloat(item.averagewt) || 0;
            totalAtsWeight += parseFloat(item.atsweight) || 0;
            totalAisWastage += parseFloat(item.aiswastage) || 0;
            totalquantatyltr += parseFloat(item.qtylitre) || 0;
            totalcummlativeqty += parseFloat(item.cumqty) || 0;
            totalcummlativentry += parseFloat(item.cumulativeentry) || 0;
            totalagradeqty += parseFloat(item.agradeqty) || 0;
            totalhfx += parseFloat(item.hfx) || 0;
            totalfloorwaste += parseFloat(item.floorwaste) || 0;
            totalwastagelakhs += parseFloat(item.wastageinlac) || 0;
        });

        mergedData.push({
            zdate: "Total",
            averagewt: totalAverageWt.toFixed(2),
            atsweight: totalAtsWeight.toFixed(2),
            aiswastage: totalAisWastage.toFixed(2),
            qtylitre: totalquantatyltr.toFixed(2),
            cumqty: totalcummlativeqty.toFixed(2),
            cumulativeentry: totalcummlativentry.toFixed(2),
            agradeqty: totalagradeqty.toFixed(2),
            hfx: totalhfx.toFixed(2),
            floorwaste: totalfloorwaste.toFixed(2),
            wastageinlac: totalwastagelakhs.toFixed(4),
            isTotalRow: true
        });

        // 8️⃣ Bind to Table
        that.tabModel = new sap.ui.model.json.JSONModel({ ItemData: mergedData });
        view.setModel(that.tabModel, "TabModel");
        view.setBusy(false);

        console.log("✅ Merged and loaded", mergedData.length, "rows.");
    } catch (error) {
        console.error("❌ Error during data processing:", error);
        view.setBusy(false);
    }
},          

            deleteAllFields: function () {
    const that = this;
    const oModel = this.getView().getModel("ZSB_YAIS_FIELDS");

    if (!oModel) {
        sap.m.MessageToast.show("Model 'ZSB_YAIS_FIELDS' not found.");
        return;
    }

    sap.m.MessageBox.confirm("Are you sure you want to delete all entries?", {
        title: "Confirm Deletion",
        onClose: function (sAction) {
            if (sAction !== "OK") {
                return;
            }

            that.getView().setBusy(true);

            // Step 1: Read all entries
            oModel.read("/ZC_YAIS_Fields", {
                success: function (oData) {
                    const aEntries = oData.results;
                    let iDeleted = 0;
                    let iFailed = 0;

                    if (aEntries.length === 0) {
                        sap.m.MessageToast.show("No entries to delete.");
                        that.getView().setBusy(false);
                        return;
                    }

                    aEntries.forEach(function (oEntry, index) {
                        const sKey = oModel.createKey("/ZC_YAIS_Fields", {
                            Sap_uuid: oEntry.Sap_uuid // Ensure correct key property here
                        });

                        oModel.remove(sKey, {
                            success: function () {
                                iDeleted++;
                                checkCompletion();
                            },
                            error: function (oError) {
                                iFailed++;
                                console.error("Delete failed for", oEntry.Sap_uuid, oError);
                                checkCompletion();
                            }
                        });
                    });

                    function checkCompletion() {
                        if (iDeleted + iFailed === aEntries.length) {
                            that.getView().setBusy(false);
                            sap.m.MessageToast.show(iDeleted + " deleted, " + iFailed + " failed.");
                            oModel.refresh(true);
                            if (that.loadMergedData) {
                                that.loadMergedData();
                            }
                        }
                    }
                },
                error: function (err) {
                    console.error("Failed to read entries for deletion", err);
                    that.getView().setBusy(false);
                    sap.m.MessageToast.show("Failed to load entries.");
                }
            });
        }
    });
},

            // onRowSave: function () {
            //     var oTable = this.getView().byId("ais_report_table");
            //     var aSelectedIndices = oTable.getSelectedIndices();

            //     if (aSelectedIndices.length === 0) {
            //         sap.m.MessageToast.show("Please select at least one row.");
            //         return;
            //     }

            //     var oModel = this.getView().getModel("ZSB_YAIS_FIELDS");

            //     if (!oModel) {
            //         sap.m.MessageToast.show("OData model 'ZSB_YAIS_FIELDS' not found.");
            //         return;
            //     }

            //     var iSuccessCount = 0;
            //     var iFailCount = 0;
            //     var that = this;

            //     aSelectedIndices.forEach(function (iIndex) {
            //         var oSelectedRow = oTable.getContextByIndex(iIndex).getObject();

            //         // Remove sap_uuid if it exists — should not be sent during create
            //         var oPayload = {
            //             Sap_uuid: oSelectedRow.sap_uuid,
            //             Location1: oSelectedRow.Location1 || "",
            //             Location2: oSelectedRow.Location2 || "",
            //             Location3: oSelectedRow.Location3 || "",
            //             Location4: oSelectedRow.Location4 || ""
            //         };

            //         oModel.create("/ZC_YAIS_Fields", oPayload, {
            //             success: function () {
            //                 iSuccessCount++;
            //                 if (iSuccessCount + iFailCount === aSelectedIndices.length) {
            //                     sap.m.MessageToast.show(iSuccessCount + " row(s) created successfully.");
            //                     oModel.refresh(true); // Refresh table to show new data
            //                 }
            //             },
            //             error: function (oError) {
            //                 console.error("Create failed:", oError);
            //                 iFailCount++;
            //                 if (iSuccessCount + iFailCount === aSelectedIndices.length) {
            //                     sap.m.MessageToast.show(iSuccessCount + " created, " + iFailCount + " failed.");
            //                 }
            //             }
            //         });
            //     });
            // },

            // onRowSave: function () {
            //     var oTable = this.getView().byId("ais_report_table");
            //     var aSelectedIndices = oTable.getSelectedIndices();

            //     if (aSelectedIndices.length === 0) {
            //         sap.m.MessageToast.show("Please select at least one row.");
            //         return;
            //     }

            //     var oModel = this.getView().getModel("ZSB_YAIS_FIELDS");
            //     if (!oModel) {
            //         sap.m.MessageToast.show("OData model 'ZSB_YAIS_FIELDS' not found.");
            //         return;
            //     }

            //     var that = this;
            //     var iSuccessCount = 0;
            //     var iFailCount = 0;

            //     aSelectedIndices.forEach(function (iIndex) {
            //         var oSelectedRow = oTable.getContextByIndex(iIndex).getObject();

            //         var oPayload = {
            //             Sap_uuid: oSelectedRow.sap_uuid, // Send it if backend allows
            //             Location1: oSelectedRow.Location1 || "",
            //             Location2: oSelectedRow.Location2 || "",
            //             Location3: oSelectedRow.Location3 || "",
            //             Location4: oSelectedRow.Location4 || ""
            //         };

            //         oModel.create("/ZC_YAIS_Fields", oPayload, {
            //             success: function () {
            //                 iSuccessCount++;
            //                 checkCompletion();
            //             },
            //             error: function (oError) {
            //                 console.error("Create failed for UUID:", oPayload.Sap_uuid, oError);
            //                 iFailCount++;
            //                 checkCompletion();
            //             }
            //         });

            //         function checkCompletion() {
            //             if (iSuccessCount + iFailCount === aSelectedIndices.length) {
            //                 sap.m.MessageToast.show(iSuccessCount + " created, " + iFailCount + " failed.");
            //                 oModel.refresh(true);
            //             }
            //         }
            //     });
            // },

//             onRowSave: function () {
//     var oTable = this.getView().byId("ais_report_table");
//     var aSelectedIndices = oTable.getSelectedIndices();

//     if (aSelectedIndices.length === 0) {
//         sap.m.MessageToast.show("Please select at least one row.");
//         return;
//     }

//     var oModel = this.getView().getModel("ZSB_YAIS_FIELDS");
//     if (!oModel) {
//         sap.m.MessageToast.show("OData model 'ZSB_YAIS_FIELDS' not found.");
//         return;
//     }

//     var that = this;
//     var iSuccessCount = 0;
//     var iFailCount = 0;

//     aSelectedIndices.forEach(function (iIndex) {
//         var oSelectedRow = oTable.getContextByIndex(iIndex).getObject();

//         var oPayload = {
//             Sap_uuid: oSelectedRow.sap_uuid,
//             Location1: oSelectedRow.Location1 || "",
//             Location2: oSelectedRow.Location2 || "",
//             Location3: oSelectedRow.Location3 || "",
//             Location4: oSelectedRow.Location4 || ""
//         };

//         oModel.create("/ZC_YAIS_Fields", oPayload, {
//             success: function () {
//                 iSuccessCount++;
//                 checkCompletion();
//             },
//             error: function (oError) {
//                 console.error("Create failed for UUID:", oPayload.Sap_uuid, oError);
//                 iFailCount++;
//                 checkCompletion();
//             }
//         });

//         function checkCompletion() {
//             if (iSuccessCount + iFailCount === aSelectedIndices.length) {
//                 sap.m.MessageToast.show(iSuccessCount + " created, " + iFailCount + " failed.");

//                 // 🔁 Refresh model and reload merged data
//                 oModel.refresh(true);

//                 // ⏳ Delay to ensure backend is ready (optional, depending on system speed)
//                 setTimeout(function () {
//                     that.loadMergedData(); // Call merged reload function
//                 }, 500);
//             }
//         }
//     });
// },

// onRowSave: function () {
//     var oTable = this.getView().byId("ais_report_table");
//     var aSelectedIndices = oTable.getSelectedIndices();

//     if (aSelectedIndices.length === 0) {
//         sap.m.MessageToast.show("Please select at least one row.");
//         return;
//     }

//     var oModel = this.getView().getModel("ZSB_YAIS_FIELDS");
//     if (!oModel) {
//         sap.m.MessageToast.show("OData model 'ZSB_YAIS_FIELDS' not found.");
//         return;
//     }

//     var that = this;
//     var iSuccessCount = 0;
//     var iFailCount = 0;

//     aSelectedIndices.forEach(function (iIndex) {
//         var oSelectedRow = oTable.getContextByIndex(iIndex).getObject();

//         var oPayload = {
//             Sap_uuid: oSelectedRow.sap_uuid,
//             Location1: oSelectedRow.Location1 || "",
//             Location2: oSelectedRow.Location2 || "",
//             Location3: oSelectedRow.Location3 || "",
//             Location4: oSelectedRow.Location4 || ""
//         };

//         oModel.create("/ZC_YAIS_Fields", oPayload, {
//             success: function () {
//                 iSuccessCount++;
//                 checkCompletion();
//             },
//             error: function (oError) {
//                 console.error("Create failed for UUID:", oPayload.Sap_uuid, oError);
//                 iFailCount++;
//                 checkCompletion();
//             }
//         });

//         function checkCompletion() {
//             if (iSuccessCount + iFailCount === aSelectedIndices.length) {
//                 sap.m.MessageToast.show(iSuccessCount + " created, " + iFailCount + " failed.");

//                 // 🔁 Refresh model and reload merged data
//                 oModel.refresh(true);

//                 // ⏳ Delay to ensure backend is ready (optional, depending on system speed)
//                 setTimeout(function () {
//                     that.loadMergedData(); // Call merged reload function
//                 }, 500);
//             }
//         }
//     });
// },


// onRowSave: function () {
//     var oTable = this.getView().byId("ais_report_table");
//     var aSelectedIndices = oTable.getSelectedIndices();

//     if (aSelectedIndices.length === 0) {
//         sap.m.MessageToast.show("Please select at least one row.");
//         return;
//     }

//     var oModel = this.getView().getModel("ZSB_YAIS_FIELDS");
//     if (!oModel) {
//         sap.m.MessageToast.show("OData model 'ZSB_YAIS_FIELDS' not found.");
//         return;
//     }

//     var that = this;
//     var iSuccessCount = 0;
//     var iFailCount = 0;

//     aSelectedIndices.forEach(function (iIndex) {
//         var oSelectedRow = oTable.getContextByIndex(iIndex).getObject();

//         var oPayload = {
//             Sap_uuid: oSelectedRow.sap_uuid,
//             Location1: oSelectedRow.Location1 || "",
//             Location2: oSelectedRow.Location2 || "",
//             Location3: oSelectedRow.Location3 || "",
//             Location4: oSelectedRow.Location4 || ""
//         };

//         oModel.create("/ZC_YAIS_Fields", oPayload, {
//             success: function () {
//                 iSuccessCount++;
//                 checkCompletion();
//             },
//             error: function (oError) {
//                 console.error("Create failed for UUID:", oPayload.Sap_uuid, oError);
//                 iFailCount++;
//                 checkCompletion();
//             }
//         });
//     });

//     function checkCompletion() {
//         if (iSuccessCount + iFailCount === aSelectedIndices.length) {
//             sap.m.MessageToast.show(iSuccessCount + " created, " + iFailCount + " failed.");

//             // ✅ Clear selected rows (unselect)
//             oTable.clearSelection();

//             // 🔁 Optional: Refresh backend model
//             oModel.refresh(true);

//             // 🔄 Optional: Reload merged data
//             setTimeout(function () {
//                 that.loadMergedData(); // Re-fetch merged data
//             }, 500);
//         }
//     }
// },

// onRowSave: function () {
//     const oTable = this.getView().byId("ais_report_table");

//     // ✅ Force value updates from UI fields into the model
//     sap.ui.getCore().applyChanges();

//     const aSelectedIndices = oTable.getSelectedIndices();
//     if (aSelectedIndices.length === 0) {
//         sap.m.MessageToast.show("Please select at least one row.");
//         return;
//     }

//     const oModel = this.getView().getModel("ZSB_YAIS_FIELDS");
//     if (!oModel) {
//         sap.m.MessageToast.show("OData model 'ZSB_YAIS_FIELDS' not found.");
//         return;
//     }

//     const that = this;
//     let iSuccessCount = 0;
//     let iFailCount = 0;

//     aSelectedIndices.forEach(function (iIndex) {
//         const oSelectedRow = oTable.getContextByIndex(iIndex).getObject();

//         const oPayload = {
//             Sap_uuid: oSelectedRow.sap_uuid,
//             Location1: oSelectedRow.Location1 || "",
//             Location2: oSelectedRow.Location2 || "",
//             Location3: oSelectedRow.Location3 || "",
//             Location4: oSelectedRow.Location4 || ""
//         };

//         oModel.create("/ZC_YAIS_Fields", oPayload, {
//             success: function () {
//                 iSuccessCount++;
//                 checkCompletion();
//             },
//             error: function (oError) {
//                 console.error("Create failed for UUID:", oPayload.Sap_uuid, oError);
//                 iFailCount++;
//                 checkCompletion();
//             }
//         });
//     });

//     function checkCompletion() {
//         if (iSuccessCount + iFailCount === aSelectedIndices.length) {
//             sap.m.MessageToast.show(iSuccessCount + " created, " + iFailCount + " failed.");

//             oTable.clearSelection();

//             oModel.refresh(true);

//             setTimeout(function () {
//                 that.loadMergedData();
//             }, 500);
//         }
//     }
// },

onRowSave: function () {
    const oTable = this.getView().byId("ais_report_table");

    // ✅ Force value updates from UI fields into the model
    sap.ui.getCore().applyChanges();

    const aSelectedIndices = oTable.getSelectedIndices();
    if (aSelectedIndices.length === 0) {
        sap.m.MessageToast.show("Please select at least one row.");
        return;
    }

    const oModel = this.getView().getModel("ZSB_YAIS_FIELDS");
    if (!oModel) {
        sap.m.MessageToast.show("OData model 'ZSB_YAIS_FIELDS' not found.");
        return;
    }

    const that = this;
    let iSuccessCount = 0;
    let iFailCount = 0;

    aSelectedIndices.forEach(function (iIndex) {
        const oSelectedRow = oTable.getContextByIndex(iIndex).getObject();

        // ✅ Skip rows without sap_uuid
        if (!oSelectedRow.sap_uuid) {
            console.warn("Skipping row without sap_uuid:", oSelectedRow);
            iFailCount++;
            checkCompletion();
            return;
        }

        const oPayload = {
            Sap_uuid: oSelectedRow.sap_uuid,
            Location1: oSelectedRow.Location1 || "",
            Location2: oSelectedRow.Location2 || "",
            Location3: oSelectedRow.Location3 || "",
            Location4: oSelectedRow.Location4 || ""
        };

        oModel.create("/ZC_YAIS_Fields", oPayload, {
            success: function () {
                iSuccessCount++;
                checkCompletion();
            },
            error: function (oError) {
                console.error("Create failed for UUID:", oPayload.Sap_uuid, oError);
                iFailCount++;
                checkCompletion();
            }
        });
    });

    function checkCompletion() {
        if (iSuccessCount + iFailCount === aSelectedIndices.length) {
            sap.m.MessageToast.show(iSuccessCount + " created, " + iFailCount + " skipped/failed.");

            oTable.clearSelection();

            oModel.refresh(true);

            setTimeout(function () {
                that.loadMergedData();
            }, 500);
        }
    }
},



//             onRowSelect: function (oEvent) {
//     var oTable = oEvent.getSource();
//     var aSelectedIndices = oTable.getSelectedIndices();
//     var oModel = this.getView().getModel("TabModel");
//     var aSelectedData = [];

//     aSelectedIndices.forEach(function(iIndex) {
//         var oContext = oTable.getContextByIndex(iIndex);
//         if (oContext) {
//             aSelectedData.push(oContext.getObject());
//         }
//     });

//     console.log("Selected rows data:", aSelectedData);

//     // Optionally store selected data in the controller for other operations
//     this._aSelectedItems = aSelectedData;

//     // You can update your UI or enable buttons based on selection count here
// },



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
                            name: "zautodesignapp.view.ais.report.fragment.ValueHelpDialogAISProd"
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
                var oModel = this.getView().getModel('ZCE_ZCOUNT_HEAD_SRVB'); // OData Model
                var aFilters = [
                    new sap.ui.model.Filter("ProcessOrder", sap.ui.model.FilterOperator.Contains, sTerm) // Search based on Name
                ];

                return new Promise(function (fnResolve, fnReject) {
                    // Perform OData read request
                    oModel.read("/ZC_PRO_ORD_F4HELP", {  // Replace "/ProductSet" with your OData entity set
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



            
             //-----------------------------------------------------------------------------------------------------------------------

            //Material order Fragment



            onValueHelpRequestMaterial: function () {

                var material = this.getView().byId("idmaterialais").getValue();

                console.log(material)
                if (material || material.length == 0) {
                    sap.ui.core.BusyIndicator.show();

                    //   var oFilters1 = new sap.ui.model.Filter("Createdat", sap.ui.model.FilterOperator.EQ, Date);

                    // Retrieve the model from the view
                    var oModel_Material = this.getView().getModel("ZCE_ZCOUNT_HEAD_SRVB");

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
                        oModel_Material.read("/ZCE_PRODUCT_F4HELP", {
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
                            name: "zautodesignapp.view.ais.report.fragment.ValueHelpDialogMaterial"
                        }).then(function (oDialog) {
                            var oFilterBar = oDialog.getFilterBar();

                            var oColumnProductCode, oColumnPostingDate, oColumnCompanyCode;
                            that._oVHD_Material = oDialog;
                            that.getView().addDependent(oDialog);

                            // Set key fields for filtering in the Define Conditions Tab
                            oDialog.setRangeKeyFields([{
                                label: "Material",
                                key: "Product",
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
                                        template: new sap.m.Text({ wrapping: false, text: "{oJSONModelsMaterial>Product}" })
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
                                                new sap.m.Text({ text: "{oJSONModelsMaterial>Product}" }),

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
                        new sap.ui.model.Filter({ path: "Product", operator: sap.ui.model.FilterOperator.Contains, value1: sSearchQuery })

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
                var oModel = this.getView().getModel('ZSB_AU_QA02_ITEM'); // OData Model
                var aFilters = [
                    new sap.ui.model.Filter("product", sap.ui.model.FilterOperator.Contains, sTerm) // Search based on Name
                ];

                return new Promise(function (fnResolve, fnReject) {
                    // Perform OData read request
                    oModel.read("/ZC_AU_QA02ITEM", {  // Replace "/ProductSet" with your OData entity set
                        filters: aFilters,
                        success: function (oData) {
                            var aResults = oData.results.map(function (mProduct) {
                                return mProduct.product;  // Assuming Name is the field you're interested in
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
                    var oMultiInput = this.getView().byId("idmaterialais");
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
                        property: 'zdate',
                        type: sap.ui.export.EdmType.Date,
                        format: 'dd-mm-yyyy',
                        width: '18'
                    },


                       {
                        label: 'Process Order No',
                        property: 'processorder',
                        width: '12'
                    },


                    {
                        label: 'AIS Machine No',
                        property: 'aismachineno',
                        width: '12'
                    },

                    
                 

                     {
                        label: 'Customer Name',
                        property: 'customername',
                        width: '12'
                    },


                       {
                        label: 'Batch',
                        property: 'batch',
                        width: '12'
                    },




                         {
                        label: 'Size',
                        property: 'zsize',
                        width: '12'
                    },


                          {
                        label: 'Material',
                        property: 'product',
                        width: '12'
                    },

                        {
                        label: 'Material Description',
                        property: 'productdescription',
                        width: '20'
                    },


                    
                        {
                        label: 'Box No',
                        property: 'boxno',
                        width: '12'
                    },

                      {
                        label: 'Material Document No',
                        property: 'materialdocumentno_gi',
                        width: '12'
                    },


                      {
                        label: 'Shift',
                        property: 'shift',
                        width: '12'
                    },


                    
                      {
                        label: 'AIS Shift',
                        property: 'aisshift',
                        width: '12'
                    },


                       {
                        label: 'Box No',
                        property: 'boxno',
                        width: '12'
                    },


                        {
                        label: 'Average Weight',
                        property: 'averagewt',
                        width: '12'
                    },


                    
                        {
                        label: 'ATS Weight',
                        property: 'atsweight',
                        width: '12'
                    },

                         {
                        label: 'Quantity Litre',
                        property: 'qtylitre',
                        width: '12'
                    },


                          {
                        label: 'AIS Wastage in KGS',
                        property: 'aiswastage',
                        width: '12'
                    },


                        {
                        label: 'AIS Wastage in Lakhs',
                        property: 'wastageinlac',
                        width: '12'
                    },


                    
                          {
                        label: 'Grade AIS',
                        property: 'grageais',
                        width: '12'
                    },


                      
                          {
                        label: 'Grade ATS',
                        property: 'gradeats',
                        width: '12'
                    },


                          {
                        label: 'Customer Code',
                        property: 'customer',
                        width: '12'
                    },


                           {
                        label: 'Material Code',
                        property: 'product',
                        width: '12'
                    },


                          {
                        label: 'QA Name',
                        property: 'qaname',
                        width: '12'
                    },


                           {
                        label: 'Operator Name',
                        property: 'operatorname',
                        width: '12'
                    },


                    
                           {
                        label: 'Cummulative QTY',
                        property: 'cumqty',
                        width: '12'
                    },



                          {
                        label: 'Cumulative Entry',
                        property: 'cumulativeentry',
                        width: '12'
                    },


                            {
                        label: 'A grade QTY',
                        property: 'agradeqty',
                        width: '12'
                    },


                             {
                        label: 'HFX',
                        property: 'hfx',
                        width: '12'
                    },


                    
                             {
                        label: 'Floor Wastege',
                        property: 'floorwaste',
                        width: '12'
                    },


                       
                             {
                        label: 'Weight',
                        property: 'weight',
                        width: '12'
                    },

                             {
                        label: 'Remarks',
                        property: 'remarks',
                        width: '12'
                    },


                               {
                        label: 'GI Material Document No',
                        property: 'materialdocumentno_gi',
                        width: '12'
                    },


                                 {
                        label: 'GI Material Document Year',
                        property: 'materialdocumentyear_gi',
                        width: '12'
                    },


                                   {
                        label: 'GR Material Document',
                        property: 'materialdocumentno_gr',
                        width: '12'
                    },


                                    {
                        label: 'GR Material Document Year',
                        property: 'materialdocumentyear_gr',
                        width: '12'
                    },



                           {
                        label: 'Major',
                        property: 'Location1',
                        width: '12'
                    },


                           {
                        label: 'Minor',
                        property: 'Location2',
                        width: '12'
                    },


                           {
                        label: 'Critical',
                        property: 'Location3',
                        width: '12'
                    },


                           {
                        label: 'Remarks Defects',
                        property: 'Location4',
                        width: '12'
                    },


                ];
            },
            
            
            //1st method
            
            
            OnExportExl: function() {
                var aCols, oBinding, oSettings, oSheet, oTable;
            
                oTable = this.byId('ais_report_table');


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
                        MessageToast.show('AIS Report export has finished');
                    }).finally(function() {
                        oSheet.destroy();
                    });
            }

  
  
      });
    }
  );
  