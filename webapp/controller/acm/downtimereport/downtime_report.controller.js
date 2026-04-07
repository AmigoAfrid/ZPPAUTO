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

    function(BaseController, IconPool, MessageBox,
        MessageToast,
        Fragment,
        Filter,
        FilterOperator,
        DateTypeRange,
        UI5Date, JSONModel, DateFormat) {
      "use strict";
  
      return BaseController.extend("zautodesignapp.controller.acm.downtimereport.downtime_report", {
        onInit: function() {

          
    

            this.acmModel = new sap.ui.model.json.JSONModel({
                HeaderData: [{
                    daterange: "",
                    machineno: ""
                }],
                TableVisible: false
            });
            this.getView().setModel(this.acmModel, "acmModel");

            var oModel = new sap.ui.model.json.JSONModel({
                selectedMachine: "" // Default value
            });
            this.getView().setModel(oModel);

            var JsonMModel = new sap.ui.model.json.JSONModel({

                    Samples: [

                        {
                            "MachineID": 1,
                            "MachineName": "ACM01"
                        },
                        {
                            "MachineID": 2,
                            "MachineName": "ACM02"
                        },
                        {
                            "MachineID": 3,
                            "MachineName": "ACM03"
                        },
                        {
                            "MachineID": 4,
                            "MachineName": "ACM04"
                        },
                        {
                            "MachineID": 5,
                            "MachineName": "ACM05"
                        },
                        {
                            "MachineID": 6,
                            "MachineName": "ACM06"
                        },

                    ]
                })

                this.getView().setModel(JsonMModel, "MModel");

                  this.tabModel = new sap.ui.model.json.JSONModel({ ItemData: ""});
                    this.getView().setModel(this.tabModel, "TabModel");
          
          var date = new Date();
          console.log("date",date);

        },

        
       

        
        onButtonPress: function(oEvent) {
                var sSelectedMachineNo = oEvent.getSource().getText();

                var sUpdatedMachineNo = "ACM" + sSelectedMachineNo;
                if (this.acmModel) {
                    this.acmModel.setProperty("/HeaderData/0/selectedMachine", sUpdatedMachineNo); // Update model property
                } else {
                    console.error("acmModel not found.");
                }

                // Close the dialog
                this.ChFrag.close();
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
                            name: "zautodesignapp.view.acm.report.fragment.ValueHelpDialogACM"
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
                var oModel = this.getView().getModel('ZSB_AU_ACM_ITEM'); // OData Model
                var aFilters = [
                    new sap.ui.model.Filter("batch", sap.ui.model.FilterOperator.Contains, sTerm) // Search based on Name
                ];

                return new Promise(function (fnResolve, fnReject) {
                    // Perform OData read request
                    oModel.read("/ZC_AU_ACM_ITEM", {  // Replace "/ProductSet" with your OData entity set
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



        OnDateChangeValueACM: function (Datess) {
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
        




        

OnGoItemPageACM: async function (token) {
    var Dates = this.getView().byId("Datesdowntime").getValue();
    var oMachineInput = this.byId("idacmvalues");
    var sMachineValue = oMachineInput.getValue();
    var sMachineId = sMachineValue.replace(/[^\d]/g, '').replace(/^0+/, '');



    const bHasDate = Dates && Dates.trim() !== "";

    let FromDate = "", ToDate = "";
    if (bHasDate) {
        const myArray = Dates.split(" - ");
        const datefrom = new Date(myArray[0]);
        const dateto = new Date(myArray[1]);
        FromDate = new Date(datefrom.getTime() - (datefrom.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
        ToDate = new Date(dateto.getTime() - (dateto.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
    }

    let FinalFilter = [];

   

    if (sMachineId.length > 0) {
        FinalFilter.push(new sap.ui.model.Filter("Acmno", sap.ui.model.FilterOperator.EQ, sMachineId));
    }

    if (bHasDate) {
        FinalFilter.push(new sap.ui.model.Filter("Dates", sap.ui.model.FilterOperator.BT, FromDate, ToDate));
    }


    const model0 = this.getView().getModel("ZAU_ACM_DOWNTIME_SRVB");
    let aAllItems = [];
    let iSkip = 0;
    const iTop = 100;
    const that = this;

    that.getView().setBusy(true);

    function fetchData() {
        model0.read("/ZC_DOWNTIME", {
            filters: FinalFilter,
            urlParameters: {
                "$skip": iSkip,
                "$top": iTop
            },
            success: function (oData) {
                if (oData.results.length > 0) {
                    aAllItems = aAllItems.concat(oData.results);
                    iSkip += iTop;
                    fetchData(); // Keep fetching
                } else {
                
                  

                that.tabModel = new sap.ui.model.json.JSONModel({ ItemData: aAllItems });
                    that.getView().setModel(that.tabModel, "TabModel");

                    that.getView().setBusy(false);
                    console.log("Loaded with total row:", aAllItems.length);
                }
            },
            error: function (error) {
                console.error("Error while fetching data:", error);
                that.getView().setBusy(false);
            }
        });
    }

    fetchData();
},

        OnAcmCheck: function () {
            if (!this.ChFrag) {
                this.ChFrag = sap.ui.xmlfragment(this.getView().getId("idacmvalue"), "zautodesignapp.view.acm.transaction.fragment.valuehelp", this);
                this.getView().addDependent(this.ChFrag);
            }
            this.ChFrag.open();
        },
        formatDate: function (value) {
  
    // Apply date formatting if it's not "Total"
    var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
        pattern: "yyyy-MM-dd"
    });
    return oDateFormat.format(new Date(value));
},
        OnClose: function () {
            this.ChFrag.close();
        },


        
   createColumnConfig: function () {

                return [
                 

                    {
                        label: 'Date',
                        property: 'Dates',
                        type: sap.ui.export.EdmType.Date,
                        format: 'dd-mm-yyyy',
                        width: '18'
                    },


                    {
                        label: 'Acm No',
                        property: 'Acmno',
                        width: '12'
                    },

                    
                    {
                        label: 'Shift',
                        property: 'Shift',
                        width: '12'
                    },

                     {
                        label: 'Speed',
                        property: 'Speed',
                        width: '12'
                    },


                       {
                        label: 'NoBar',
                        property: 'NoBar',
                        width: '12'
                    },


                        {
                        label: 'CurDips',
                        property: 'CurDips',
                        width: '12'
                    },


                        {
                        label: 'TotalDownTime',
                        property: 'TotalDownTime',
                        width: '12'
                    },


                         {
                        label: 'ColorChange',
                        property: 'ColorChange',
                        width: '12'
                    },

                        {
                        label: 'Mechanical',
                        property: 'Mechanical',
                        width: '12'
                    },


                       {
                        label: 'Process',
                        property: 'Process',
                        width: '12'
                    },


                    
                       {
                        label: 'GelRoom',
                        property: 'GelRoom',
                        width: '12'
                    },


                       {
                        label: 'QcQa',
                        property: 'QcQa',
                        width: '12'
                    },

                    {
                        label: 'PowerOff',
                        property: 'PowerOff',
                        width: '12'
                    },

                       {
                        label: 'Preventive',
                        property: 'Preventive',
                        width: '12'
                    },


                      {
                        label: 'Plc',
                        property: 'Plc',
                        width: '12'
                    },


                       {
                        label: 'Modification',
                        property: 'Modification',
                        width: '12'
                    },


                     {
                        label: 'PowerShutdown',
                        property: 'PowerShutdown',
                        width: '12'
                    },


                      {
                        label: 'ElecShutdown',
                        property: 'ElecShutdown',
                        width: '12'
                    },


                      {
                        label: 'SizeChange',
                        property: 'SizeChange',
                        width: '12'
                    },


                        {
                        label: 'NoOrder',
                        property: 'NoOrder',
                        width: '12'
                    },


                    


                ];
            },
            
            
            //OnExportExl
            
            
            OnExportExl: function() {
                var aCols, oBinding, oSettings, oSheet, oTable;
            
                oTable = this.byId('acm_downtime_report');


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
                        MessageToast.show('ACM Downtime Report export has finished');
                    }).finally(function() {
                        oSheet.destroy();
                    });
            }




      });
    }
  );
  