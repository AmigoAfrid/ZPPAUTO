sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/core/IconPool",
        "sap/ui/model/json/JSONModel",
        "sap/ui/export/Spreadsheet",
    ],
    function(BaseController, IconPool, JSONModel) {
      "use strict";
  
      return BaseController.extend("zautodesignapp.controller.ats.report.ats_report", {
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

          
                            this.tabModel = new sap.ui.model.json.JSONModel({ ItemData: ""});
                    this.getView().setModel(this.tabModel, "TabModel");


                    
    var _oMultiInputMaterial;

 _oMultiInputMaterial = this.byId("idmaterialats");
this._oMultiInputMaterial = _oMultiInputMaterial


  this.atsModel = new sap.ui.model.json.JSONModel({
                    HeaderData: [{
                        daterange: "",
                        selectedMachine: ""
                    }],
                    TableVisible: false
                });
                this.getView().setModel(this.atsModel, "atsModel");

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
                            name: "zautodesignapp.view.ats.report.fragment.ValueHelpDialogATS"
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
                            
                            // Remove duplicate suggestions:
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


        OnGoItemPage: async function (token) {
  
          var Dates = this.getView().byId("Date").getValue();
          var batch0 = this.getView().byId("idmaterialdocument").getTokens();
          var ProdDoc = this.getView().byId("idprocessorder").getTokens();

          const sMachineValue = this.byId("id_atsmachinerep").getValue();
    const sMachineId = sMachineValue.replace(/[^\d]/g, '').replace(/^0+/, '');

             const smaterial = this.getView().byId("idmaterialats").getTokens();

           const aMultiInputValuesMaterial = smaterial.map(oToken => oToken.getText());
  
          var aMultiInputValues = batch0.map(function (oToken) {
              return oToken.getText();
          });
  
          var aMultiInputValues_ = ProdDoc.map(function (oToken) {
              return oToken.getText();
          });
  
          console.log("aMultiInputValues:", aMultiInputValues);
          console.log("aMultiInputValues_:", aMultiInputValues_);
  
  
  
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


           // Add material order filters
          if (smaterial.length > 0) {
              const matFilters = aMultiInputValuesMaterial.map(function (sValue) {
                  return new sap.ui.model.Filter("material", sap.ui.model.FilterOperator.EQ, sValue);
              });
              FinalFilter.push(new sap.ui.model.Filter({ filters: matFilters, and: false }));
          }
  
          // Add date filter
          if (bHasDate) {
              FinalFilter.push(new sap.ui.model.Filter("zdate", sap.ui.model.FilterOperator.BT, FromDate, ToDate));
          }

            if (sMachineId.length > 0) {
        FinalFilter.push(new sap.ui.model.Filter("acmno", sap.ui.model.FilterOperator.EQ, sMachineId));
    }
  
        // FinalFilter.push(new sap.ui.model.Filter("materialdocumentno", sap.ui.model.FilterOperator.NE, ""));

          // Data fetch header
          const model0 = this.getView().getModel("ZSB_ATS_REPORT");
  
          let aAllItems = [];
          let iSkip = 0;
          const iTop = 100;
          const that = this;
  
          that.getView().setBusy(true);
  
          function fetchData() {
              model0.read("/ZATS_REPORT", {
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

                          let totaltarqty = 0;
                          let totalwatage = 0;
                          let totalwatagelakh=0;
                          let totalfloorwastage=0

                    aAllItems.forEach(function (item) {
                        totaltarqty     += parseFloat(item.tarqty)    || 0;
                        totalwatage     += parseFloat(item.wastage)    || 0;
                        totalwatagelakh     += parseFloat(item.wastageinlac)    || 0;
                        totalfloorwastage     += parseFloat(item.floorwastage)    || 0;
                     
                    });

                    // ✅ Add total row with only those fields
                    aAllItems.push({
                            zdate: "Total",
                            tarqty: totaltarqty.toFixed(2),
                            wastage: totalwatage.toFixed(2),
                            wastageinlac: totalwatagelakh.toFixed(4),
                            floorwastage: totalfloorwastage.toFixed(2),
                            isTotalRow: true

                    });
                          that.tabModel = new sap.ui.model.json.JSONModel({ ItemData: aAllItems });
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


//               formatTotalCell: function (value,tarqty,wastage,wastageinlac) {
//     return tarqty ? "Total: " + value : value;
// },


formatTotalCell(value, tarqty, wastage, wastageinlac,floorwastage) {
  if (tarqty) {
    let totalText = `Total: ${value}`;
    if (wastage) totalText += ` (Wastage: ${wastage})`;
    if (wastageinlac) totalText += ` (Wastage in Lac: ${wastageinlac})`;
    if (floorwastage) totalText += ` (Wastage in Lac: ${floorwastage})`;
    return totalText;
  }
  return value;
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
                            name: "zautodesignapp.view.ats.report.fragment.ValueHelpDialogATSProd"
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



               //-----------------------------------------------------------------------------------------------------------------------

            //Material order Fragment



            onValueHelpRequestMaterial: function () {

                var material = this.getView().byId("idmaterialats").getValue();

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
                            name: "zautodesignapp.view.ats.report.fragment.ValueHelpDialogMaterial"
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
                var oModel = this.getView().getModel('ZSB_ATS_REPORT'); // OData Model
                var aFilters = [
                    new sap.ui.model.Filter("material", sap.ui.model.FilterOperator.Contains, sTerm) // Search based on Name
                ];

                return new Promise(function (fnResolve, fnReject) {
                    // Perform OData read request
                    oModel.read("/ZATS_REPORT", {  // Replace "/ProductSet" with your OData entity set
                        filters: aFilters,
                        success: function (oData) {
                            var aResults = oData.results.map(function (mProduct) {
                                return mProduct.material;  // Assuming Name is the field you're interested in
                            });

                            // Resolve with the list of suggestions
                            // fnResolve(aResults);
                            
                            // Remove duplicate suggestions
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
                    var oMultiInput = this.getView().byId("idmaterialats");
                    oMultiInput.setValue(sSelectedKey); // Set the selected key into the MultiInput field
                }

                // Hide the busy indicator after the update
                sap.ui.core.BusyIndicator.hide();
            },




              OnatsCheck: function () {

                if (!this.ChFrag) {
                    this.ChFrag = sap.ui.xmlfragment(this.getView().getId("id_atsmachinerep"), "zautodesignapp.view.ats.transaction.fragment.valuehelp", this);
                    this.getView().addDependent(this.ChFrag);
                }
                this.ChFrag.open();
            },

             OnClose: function () {
                this.ChFrag.close();

            },


             onButtonPress: function (oEvent) {
                var sSelectedMachineNo = oEvent.getSource().getText();

                var sUpdatedMachineNo = "ATS" + sSelectedMachineNo;
                if (this.atsModel) {
                    this.atsModel.setProperty("/HeaderData/0/selectedMachine", sUpdatedMachineNo); // Update model property
                } else {
                    console.error("atsModel not found.");
                }

                // Close the dialog
                this.ChFrag.close();

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
                        label: 'Shift',
                        property: 'shift',
                        width: '12'
                    },


                    {
                        label: 'Acm No',
                        property: 'acmno',
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
                        label: 'Box No',
                        property: 'boxno',
                        width: '12'
                    },


                        {
                        label: 'Customer Code',
                        property: 'customer',
                        width: '12'
                    },


                         {
                        label: 'Size',
                        property: 'zsize',
                        width: '12'
                    },


                       {
                        label: 'Material Document No',
                        property: 'material',
                        width: '12'
                    },

                        {
                        label: 'Material Description',
                        property: 'productdescription',
                        width: '12'
                    },


                       {
                        label: 'Process Order',
                        property: 'processorder',
                        width: '12'
                    },
  

                    {
                        label: 'Agrade Qty',
                        property: 'agradeqty',
                        width: '12'
                    },

                       {
                        label: 'Qty in lac',
                        property: 'tarqty',
                        width: '12'
                    },


                      {
                        label: 'Wastage in KGS',
                        property: 'wastage',
                        width: '12'
                    },

                     {
                        label: 'Wastage in Lakhs',
                        property: 'wastageinlac ',
                        width: '12'
                    },

                       {
                        label: 'Grade ATS',
                        property: 'gradeats',
                        width: '12'
                    },


                        {
                        label: 'Operator Name',
                        property: 'operatorname',
                        width: '12'
                    },


                          {
                        label: 'Cumulative Qty',
                        property: 'cumulativeqty',
                        width: '12'
                    },


                         {
                        label: 'Cumulative Qtys',
                        property: 'cumulativeqtys',
                        width: '12'
                    },



                         {
                        label: 'Average Weight',
                        property: 'averagewt',
                        width: '12'
                    },


                           {
                        label: 'Remarks',
                        property: 'remarks',
                        width: '12'
                    },


                           {
                        label: 'Floor Wastage',
                        property: 'floorwastage',
                        width: '12'
                    },


                           {
                        label: 'Material Document',
                        property: 'materialdocumentno',
                        width: '12'
                    },


                            {
                        label: 'Document Year',
                        property: 'materialdocumentyear',
                        width: '12'
                    },


                           {
                        label: 'Qa Name',
                        property: 'qaname',
                        width: '12'
                    },


                             {
                        label: 'HFX',
                        property: 'hfx',
                        width: '12'
                    },




                ];
            },
            
            
            //1st method
            
            
            OnExportExl: function() {
                var aCols, oBinding, oSettings, oSheet, oTable;
            
                oTable = this.byId('ats_report_table');


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
                        MessageToast.show('ATS Report export has finished');
                    }).finally(function() {
                        oSheet.destroy();
                    });
            }


      });
    }
  );
  