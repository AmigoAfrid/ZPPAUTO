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
        "zautodesignapp/util/jspdf/html2canvasmin",
        "zautodesignapp/util/jspdf/jspdfmin",
        "sap/ui/core/format/DateFormat",
    ],
    function (BaseController, IconPool, MessageBox,
        MessageToast,
        Fragment,
        Filter,
        FilterOperator,
        DateTypeRange,
        UI5Date, JSONModel, DateFormat, ) {
        "use strict";

        return BaseController.extend("zautodesignapp.controller.Wastage_report.report.Wastage_report", {
            // Initialization hook
            onInit: function () { 
            var oMultiInput;
            oMultiInput = this.byId("idmaterialdocument");
            //oMultiInput.addValidator(this._onMultiInputValidate);
            // oMultiInput.setTokens(this._getDefaultTokens());
            this._oMultiInput = oMultiInput;

            // var oMultiInputs;
            // oMultiInputs = this.byId("idprocessorder");
            // //oMultiInput.addValidator(this._onMultiInputValidate);
            // // oMultiInput.setTokens(this._getDefaultTokens());
            // this._oMultiInputs = oMultiInputs;
            // // this.SelectInputType = 'fragment';

            this._iSelectedRadioIndex = 0; 

            var date = new Date();
            console.log("date",date);



            },

            onValueHelpRequest: function () {

                var Date = this.getView().byId("Dates").getValue();

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
                            name: "zautodesignapp.view.WastageReport.report.fragment.ValueHelpDialogWastage"
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

    _connectToODataProductSearchService: function (sTerm) {
      var oModel = this.getView().getModel('ZSB_AU_QA03_ITEM'); // OData Model
      var aFilters = [
          new sap.ui.model.Filter("batch", sap.ui.model.FilterOperator.Contains, sTerm) // Search based on Name
      ];

      return new Promise(function (fnResolve, fnReject) {
          // Perform OData read request
          oModel.read("/ZC_AU_QA03_ITEM", {  // Replace "/ProductSet" with your OData entity set
              filters: aFilters,
              success: function (oData) {
                  var aResults = oData.results.map(function (mProduct) {
                      return mProduct.batch;  // Assuming Name is the field you're interested in
                  });

                // Resolve with the list of suggestions
                //   fnResolve(aResults);

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

    OnDateChangeValuePTG: function (Datess) {
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

        onRadioSelect: function (oEvent) {

        var iSelectedIndex = oEvent.getSource().getSelectedIndex(); 
        this._iSelectedRadioIndex = iSelectedIndex; 
        console.log("Radio button selected index:", iSelectedIndex); // Debugging log
        },







            OnGoItemPage: async function (oEvent) {

            // const oDateRange = this.byId("Dates");
            // const oDateValue = oDateRange.getDateValue();
            // const oSecondDateValue = oDateRange.getSecondDateValue();

            // if (!oDateValue || !oSecondDateValue) {
            //     sap.m.MessageToast.show("Please select a valid date range.");
            //     return;
            // }

            var Dates = this.getView().byId("Dates").getValue();
            
            var batch0 = this.getView().byId("idmaterialdocument").getTokens();
            var selectedRadioIndex = this._iSelectedRadioIndex;

            var aMultiInputValues = batch0.map(function (oToken) {
                return oToken.getText();
            });

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

            if (batch0.length > 0) {
                const batchFilters = aMultiInputValues.map(function (sValue) {
                    return new sap.ui.model.Filter("batch", sap.ui.model.FilterOperator.EQ, sValue);
                });
                FinalFilter.push(new sap.ui.model.Filter({ filters: batchFilters, and: false }));
            }

            if (bHasDate) {
                FinalFilter.push(new sap.ui.model.Filter("zdate", sap.ui.model.FilterOperator.BT, FromDate, ToDate));
            }

            if (selectedRadioIndex !== undefined && selectedRadioIndex >= 0 && selectedRadioIndex <= 2) {
                const tcodeMap = ["ATS", "AIS", "PTG"];
                var selectedTcode = tcodeMap[selectedRadioIndex];

                const RadioFilter = new sap.ui.model.Filter("tcode", sap.ui.model.FilterOperator.EQ, selectedTcode);
                FinalFilter.push(RadioFilter);

                console.log("Selected tcode filter applied:", selectedTcode);
            } else {
                sap.m.MessageBox.warning("Please select a valid radio option.");
                return;
            }

            const model0 = this.getView().getModel("ZCE_WASTE_PRINT_SRVB");

            let aAllItems = [];
            let iSkip = 0;
            const iTop = 100;
            const that = this;

            that.getView().setBusy(true);

            function fetchData() {
                model0.read("/ZCE_WASTE_PRINT", {
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
                            const tabWastageModel = new sap.ui.model.json.JSONModel({ ItemData: aAllItems });
                            that.getView().setModel(tabWastageModel, "tabWastageModel");
                            that.getView().setBusy(false);
                            console.log("All items loaded:", aAllItems.length);

                            console.log("tabWastageModel",tabWastageModel)

                            // Now trigger the print function based on selectedTcode
                            switch (selectedTcode) {

                                case "ATS":
                                    const tabWastageModel = new sap.ui.model.json.JSONModel({ ItemData: aAllItems });
                                    that.getView().setModel(tabWastageModel, "tabWastageModel");
                                    // Pass the array data to _printWastageATS
                                    const data = tabWastageModel.getProperty("/ItemData");
                                    that._printWastageATS(data, FromDate, ToDate);
                                    break;

                                case "AIS":
                                    const tabWastageModel_ = new sap.ui.model.json.JSONModel({ ItemData: aAllItems });
                                    that.getView().setModel(tabWastageModel_, "tabWastageModel_");
                                    // Pass the array data to _printWastageATS
                                    const data_ = tabWastageModel_.getProperty("/ItemData");
                                    that._printWastageAIS(data_, FromDate, ToDate);
                                    break;

                                case "PTG":
                                    const tabWastageModel_P = new sap.ui.model.json.JSONModel({ ItemData: aAllItems });
                                    that.getView().setModel(tabWastageModel_P, "tabWastageModel_");
                                    // Pass the array data to _printWastageATS
                                    const data_p = tabWastageModel_P.getProperty("/ItemData");
                                    that._printWastagePTG(data_p, FromDate, ToDate);
                                    break;

                                default:
                                    sap.m.MessageToast.show("Invalid tcode selected for printing.");
                                    break;
                            }
                        }
                    },
                    error: function (error) {
                        console.error("Error fetching data:", error);
                        that.getView().setBusy(false);
                    }
                });
            }

            fetchData();
        },


    async _printWastageATS( dataArray) {

    console.log("Data received for printing:", dataArray);

    // Example: loop over each item in dataArray to generate PDFs or print labels
    for (const item of dataArray) {
        console.log("Item:", item);
        // use item.batch, item.zdate, etc to generate PDF content
    }

    if (!dataArray || dataArray.length <= 0) {
    sap.m.MessageToast.show("No records to print.");
    return; // Stop execution
    }
    
    const customerNames = dataArray.map(item => item.CustomerName);
    const productDescriptions = dataArray.map(item => item.ProductDescription);
    const batches = dataArray.map(item => item.batch);
    const wastages = dataArray.map(item => item.wastage);
    const Zsize = dataArray.map(item => item.Zsize);
    const acmno = dataArray.map(item => item.acmno);
    const operatorname = dataArray.map(item => item.operatorname);
    const FromDateRange = dataArray.map(item => item.from_date);
    // const ToDateRange = dataArray.map(item => item.to_date);
    const tcode = dataArray.map(item => item.tcode);
    console.log("FromDateRange",FromDateRange)

        if (tcode) {
            const dates = new Date(FromDateRange); // assuming zdate is a valid date string
            const yyyy = dates.getFullYear();
            const mm = String(dates.getMonth() + 1).padStart(2, '0'); // getMonth() is zero-based
            const dd = String(dates.getDate()).padStart(2, '0');

            const formattedFromDate = `${dd}-${mm}-${yyyy}`;

            // const datesToDate = new Date(ToDateRange); // assuming zdate is a valid date string
            // const yyyyToDate = datesToDate.getFullYear();
            // const mmToDate = String(datesToDate.getMonth() + 1).padStart(2, '0'); // getMonth() is zero-based
            // const ddToDate = String(datesToDate.getDate()).padStart(2, '0');

            // const formattedDateToDate = `${ddToDate}-${mmToDate}-${yyyyToDate}`;

            console.log("formattedFromDate",formattedFromDate)
            // console.log("formattedDateToDate",formattedDateToDate)

            // debugger
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('portrait', 'mm', [100, 100]); // Reduced height to 100mm

            // Load image as base64
            const loadImageAsBase64 = async (url) => {
                const response = await fetch(url);
                const blob = await response.blob();
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            };

            const logoBase64 = await loadImageAsBase64(
                sap.ui.require.toUrl("zautodesignapp/images/NCLlogo.png")
            );

            const generatePDFContent = (context,logoData) => `
                            <!DOCTYPE html>
                            <html lang="en">
                            <head>
                            <meta charset="UTF-8">
                            <title>Print Label</title>
                            <style>

                                    body {

                                    font-family: monospace;

                                    }

                                    .header-section {

                                    display: flex;

                                    align-items: center;

                                    justify-content: space-between;

                                    margin-bottom: 10px;

                                    width: 400px;

                                    }

                                    .logo {

                                    height: 30px;

                                    }

                                    .title {

                                    flex: 1;

                                    text-align: center;

                                    font-weight: bold;

                                    font-size: 16px;

                                    margin-left: -30px; /* pull center alignment closer */

                                    }

                                    table {

                                    border-collapse: collapse;

                                    width: 380px;

                                    border: 2px solid black;

                                    }

                                    td {

                                    border: 1px solid black;

                                    padding: 4px;

                                    vertical-align: top;

                                    font-size: 12px;

                                    }

                                        .label-section {

                                            font-weight: bold;

                                        }
                                    </style>
                                    </head>
                                    <body>
                                    <!-- Header with logo left and title center -->
                                    <div class="header-section">
                                    <img src="${logoBase64}"  class="logo"  alt="Logo" />
                                    <div class="title">WASTAGES LABEL - ATS</div>
                                    </div>
                                    <!-- Data table -->
                                    <table>
                                    <tr>
                                    <td class="label-section">CUSTOMER</td>
                                    <td colspan="3">${customerNames}</td>
                                    </tr>
                                    <tr>
                                    <td class="label-section">BATCH NO</td>
                                    <td colspan="3">${batches}</td>
                                    </tr>
                                    <tr>
                                    <td class="label-section">ITEM DESCRIPTION</td>
                                    <td colspan="3">${productDescriptions}<br</td>
                                    </tr>
                                    <tr>
                                    <td class="label-section">ATS NO</td>
                                    <td>${acmno}</td>
                                    <td class="label-section">SIZE</td>
                                    <td>${Zsize}</td>
                                    </tr>
                                    </tr>
                                    <tr>
                                    <td class="label-section">QTY in KGS</td>
                                    <td colspan="3">${wastages}</td>
                                    </tr>
                                    <tr>
                                    <td class="label-section">DATE/SHIFT</td>
                                    <td colspan="3">${formattedFromDate}</td>
                                    </tr>
                                    <tr>
                                    <td class="label-section">ATS OPERATOR</td>
                                    <td colspan="3">${operatorname}</td>
                                    </tr>
                                    </table>
                                    </body>
                                    </html>

                                                    `;

            const htmlContent = generatePDFContent(logoBase64);
            const iframe = document.createElement("iframe");
            iframe.style.position = "fixed";
            iframe.style.left = "-8000px";
            document.body.appendChild(iframe);
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            iframeDoc.open();
            iframeDoc.write(htmlContent);
            iframeDoc.close();

            await new Promise((resolve, reject) => {
                iframe.onload = () => {
                    setTimeout(() => {
                        // Apply scaling here
                        html2canvas(iframe.contentDocument.body, { scale: 4 }).then((canvas) => {
                            const imgData = canvas.toDataURL('image/jpeg', 0.7);  // JPEG with compression
                            doc.addImage(imgData, 'JPEG', 0, 0, 100, 90); // Adjusted dimensions for scaling
                            document.body.removeChild(iframe);
                            resolve();
                        }).catch(reject);
                    }, 500);
                };
            });

            const blob = doc.output("blob");
            const pdfUrl = URL.createObjectURL(blob);

            if (!this._PDFViewer) {
                this._PDFViewer = new sap.m.PDFViewer({ width: "auto" });
                jQuery.sap.addUrlWhitelist("blob");
            }

            this._PDFViewer.setSource(pdfUrl);
            this._PDFViewer.open();
        }

        const promises = [];
        for (let i = 1; i <= GetPrintCount; i++) {
            const htmlContent = generatePDFContent(logoBase64);
            promises.push(
                new Promise((resolve, reject) => {
                    const iframe = document.createElement("iframe");
                    iframe.style.position = "fixed";
                    iframe.style.left = "-8000";
                    iframe.style.width = "400px";
                    iframe.style.height = "250px";
                    document.body.appendChild(iframe);
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    iframeDoc.open();
                    iframeDoc.write(htmlContent);
                    iframeDoc.close();

                    iframe.onload = () => {
                        setTimeout(() => {
                            html2canvas(iframe.contentDocument.body).then((canvas) => {
                                const imgData = canvas.toDataURL("image/png");
                                doc.addImage(imgData, "PNG", 0, 0, 100, 90); // Match new size
                                if (i !== GetPrintCount) doc.addPage();
                                document.body.removeChild(iframe);
                                resolve();
                            }).catch((err) => {
                                document.body.removeChild(iframe);
                                reject(err);
                            });
                        }, 500);
                    };
                })
            );
        }

        Promise.all(promises).then(() => {
            const blob = doc.output("blob");
            const pdfUrl = URL.createObjectURL(blob);

            if (!this._PDFViewer) {
                this._PDFViewer = new sap.m.PDFViewer({ width: "auto" });
                jQuery.sap.addUrlWhitelist("blob");
            }

            this._PDFViewer.setSource(pdfUrl);
            this._PDFViewer.open();
        }).catch((err) => {
            console.error("Error generating PDF:", err);
            sap.m.MessageToast.show("Error generating PDF.");
        });
    },

    async _printWastageAIS( dataArray,FromDate, ToDate) {

    console.log("Data received for printing:", dataArray);

    if (!dataArray || dataArray.length <= 0) {
    sap.m.MessageToast.show("No records to print.");
    return; // Stop execution
    }

    // Example: loop over each item in dataArray to generate PDFs or print labels
    for (const item of dataArray) {
        console.log("Item:", item);
        // use item.batch, item.zdate, etc to generate PDF content
    }
    
    const customerNames = dataArray.map(item => item.CustomerName);
    const productDescriptions = dataArray.map(item => item.ProductDescription);
    const batches = dataArray.map(item => item.batch);
    const wastages = dataArray.map(item => item.wastage);
    const Zsize = dataArray.map(item => item.Zsize);
    const acmno = dataArray.map(item => item.acmno);
    const operatorname = dataArray.map(item => item.operatorname);
    const FromDateRange = dataArray.map(item => item.from_date);
    // const ToDateRange = dataArray.map(item => item.to_date);
    const tcode = dataArray.map(item => item.tcode);
    console.log("FromDateRange",FromDateRange)

        if (tcode) {
            // const rowPath = context.getPath();
            // const rowData = context.getObject();

            const dates = new Date(FromDateRange); // assuming zdate is a valid date string
            const yyyy = dates.getFullYear();
            const mm = String(dates.getMonth() + 1).padStart(2, '0'); // getMonth() is zero-based
            const dd = String(dates.getDate()).padStart(2, '0');

            const formattedFromDate = `${dd}-${mm}-${yyyy}`;

            // const datesToDate = new Date(ToDateRange); // assuming zdate is a valid date string
            // const yyyyToDate = datesToDate.getFullYear();
            // const mmToDate = String(datesToDate.getMonth() + 1).padStart(2, '0'); // getMonth() is zero-based
            // const ddToDate = String(datesToDate.getDate()).padStart(2, '0');

            // const formattedDateToDate = `${ddToDate}-${mmToDate}-${yyyyToDate}`;

            console.log("formattedFromDate",formattedFromDate)
            // console.log("formattedDateToDate",formattedDateToDate)
            // console.log("formattedDate:", formattedDate);
            // console.log("getHeaderData:", getHeaderData);
            // console.log("rowData:", rowData);



            // debugger
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('portrait', 'mm', [100, 100]); // Reduced height to 100mm

            // Load image as base64
            const loadImageAsBase64 = async (url) => {
                const response = await fetch(url);
                const blob = await response.blob();
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            };

            const logoBase64 = await loadImageAsBase64(
                sap.ui.require.toUrl("zautodesignapp/images/NCLlogo.png")
            );

            const generatePDFContent = (context) => `
                            <!DOCTYPE html>
                                            <html lang="en">
                                            <head>
                                            <meta charset="UTF-8">
                                            <title>Print Label</title>
                                            <style>
 
                                            body {
 
                                            font-family: monospace;
 
                                            }
 
                                            .header-section {
 
                                            display: flex;
 
                                            align-items: center;
 
                                            justify-content: space-between;
 
                                            margin-bottom: 10px;
 
                                            width: 400px;
 
                                            }
 
                                            .logo {
 
                                            height: 30px;
 
                                            }
 
                                            .title {
 
                                            flex: 1;
 
                                            text-align: center;
 
                                            font-weight: bold;
 
                                            font-size: 16px;
 
                                            margin-left: -30px; /* pull center alignment closer */
 
                                            }
 
                                            table {
 
                                            border-collapse: collapse;
 
                                            width: 380px;
 
                                            border: 2px solid black;
 
                                            }
 
                                            td {
 
                                            border: 1px solid black;
 
                                            padding: 4px;
 
                                            vertical-align: top;
 
                                            font-size: 12px;
 
                                            }
 
                                               .label-section {
 
                                                    font-weight: bold;
 
                                                }
                                            </style>
                                            </head>
                                            <body>
                                            <!-- Header with logo left and title center -->
                                            <div class="header-section">
                                            <img src="${logoBase64}"  class="logo"  alt="Logo" />
                                            <div class="title">WASTAGES LABEL - AIS</div>
                                            </div>
                                            <!-- Data table -->
                                            <table>
                                            <tr>
                                            <td class="label-section">CUSTOMER</td>
                                            <td colspan="3">${customerNames}</td>
                                            </tr>
                                            <tr>
                                            <td class="label-section">BATCH NO</td>
                                            <td colspan="3">${batches}</td>
                                            </tr>
                                            <tr>
                                            <td class="label-section">ITEM DESCRIPTION</td>
                                            <td colspan="3">${productDescriptions}<br</td>
                                            </tr>
                                            <tr>
                                            <td class="label-section">AIS NO</td>
                                            <td>${acmno}</td>
                                            <td class="label-section">SIZE</td>
                                            <td> ${Zsize}</td>
                                            </tr>
                                            </tr>
                                            <tr>
                                            <td class="label-section">QTY in KGS</td>
                                            <td colspan="3">${wastages}</td>
                                            </tr>
                                            <tr>
                                            <td class="label-section">DATE/SHIFT</td>
                                            <td colspan="3">${formattedFromDate}</td>
                                            </tr>
                                            <tr>
                                            <td class="label-section">AIS OPERATOR</td>
                                            <td colspan="3">${operatorname}</td>
                                            </tr>
                                            </table>
                                            </body>
                                            </html>
                                                    `;

            const htmlContent = generatePDFContent(logoBase64);
            const iframe = document.createElement("iframe");
            iframe.style.position = "fixed";
            iframe.style.left = "-8000px";
            document.body.appendChild(iframe);
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            iframeDoc.open();
            iframeDoc.write(htmlContent);
            iframeDoc.close();

            await new Promise((resolve, reject) => {
                iframe.onload = () => {
                    setTimeout(() => {
                        // Apply scaling here
                        html2canvas(iframe.contentDocument.body, { scale: 4 }).then((canvas) => {
                            const imgData = canvas.toDataURL('image/jpeg', 0.7);  // JPEG with compression
                            doc.addImage(imgData, 'JPEG', 0, 0, 100, 90); // Adjusted dimensions for scaling
                            document.body.removeChild(iframe);
                            resolve();
                        }).catch(reject);
                    }, 500);
                };
            });

            const blob = doc.output("blob");
            const pdfUrl = URL.createObjectURL(blob);

            if (!this._PDFViewer) {
                this._PDFViewer = new sap.m.PDFViewer({ width: "auto" });
                jQuery.sap.addUrlWhitelist("blob");
            }

            this._PDFViewer.setSource(pdfUrl);
            this._PDFViewer.open();
        }

        const promises = [];
        for (let i = 1; i <= GetPrintCount; i++) {
            const htmlContent = generatePDFContent(logoBase64);
            promises.push(
                new Promise((resolve, reject) => {
                    const iframe = document.createElement("iframe");
                    iframe.style.position = "fixed";
                    iframe.style.left = "-8000";
                    iframe.style.width = "400px";
                    iframe.style.height = "250px";
                    document.body.appendChild(iframe);
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    iframeDoc.open();
                    iframeDoc.write(htmlContent);
                    iframeDoc.close();

                    iframe.onload = () => {
                        setTimeout(() => {
                            html2canvas(iframe.contentDocument.body).then((canvas) => {
                                const imgData = canvas.toDataURL("image/png");
                                doc.addImage(imgData, "PNG", 0, 0, 100, 90); // Match new size
                                if (i !== GetPrintCount) doc.addPage();
                                document.body.removeChild(iframe);
                                resolve();
                            }).catch((err) => {
                                document.body.removeChild(iframe);
                                reject(err);
                            });
                        }, 500);
                    };
                })
            );
        }

        Promise.all(promises).then(() => {
            const blob = doc.output("blob");
            const pdfUrl = URL.createObjectURL(blob);

            if (!this._PDFViewer) {
                this._PDFViewer = new sap.m.PDFViewer({ width: "auto" });
                jQuery.sap.addUrlWhitelist("blob");
            }

            this._PDFViewer.setSource(pdfUrl);
            this._PDFViewer.open();
        }).catch((err) => {
            console.error("Error generating PDF:", err);
            sap.m.MessageToast.show("Error generating PDF.");
        });
    },

    async _printWastagePTG( dataArray,FromDate, ToDate) {

    console.log("Data received for printing:", dataArray);

    // Example: loop over each item in dataArray to generate PDFs or print labels
    for (const item of dataArray) {
        console.log("Item:", item);
        // use item.batch, item.zdate, etc to generate PDF content
    }

     if (!dataArray || dataArray.length <= 0) {
    sap.m.MessageToast.show("No records to print.");
    return; // Stop execution
    }
    
    const customerNames = dataArray.map(item => item.CustomerName);
    const productDescriptions = dataArray.map(item => item.ProductDescription);
    const batches = dataArray.map(item => item.batch);
    const wastages = dataArray.map(item => item.wastage);
    const Zsize = dataArray.map(item => item.Zsize);
    const acmno = dataArray.map(item => item.acmno);
    const operatorname = dataArray.map(item => item.operatorname);
    const FromDateRange = dataArray.map(item => item.from_date);
    // const ToDateRange = dataArray.map(item => item.to_date);
    const tcode = dataArray.map(item => item.tcode);
    console.log("FromDateRange",FromDateRange)

        if (tcode) {
            const dates = new Date(FromDateRange); // assuming zdate is a valid date string
            const yyyy = dates.getFullYear();
            const mm = String(dates.getMonth() + 1).padStart(2, '0'); // getMonth() is zero-based
            const dd = String(dates.getDate()).padStart(2, '0');

            const formattedFromDate = `${dd}-${mm}-${yyyy}`;

            // const datesToDate = new Date(ToDateRange); // assuming zdate is a valid date string
            // const yyyyToDate = datesToDate.getFullYear();
            // const mmToDate = String(datesToDate.getMonth() + 1).padStart(2, '0'); // getMonth() is zero-based
            // const ddToDate = String(datesToDate.getDate()).padStart(2, '0');

            // const formattedDateToDate = `${ddToDate}-${mmToDate}-${yyyyToDate}`;

            console.log("formattedFromDate",formattedFromDate)
            // console.log("formattedDateToDate",formattedDateToDate)

            // debugger
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('portrait', 'mm', [100, 100]); // Reduced height to 100mm

            // Load image as base64
            const loadImageAsBase64 = async (url) => {
                const response = await fetch(url);
                const blob = await response.blob();
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            };

            const logoBase64 = await loadImageAsBase64(
                sap.ui.require.toUrl("zautodesignapp/images/NCLlogo.png")
            );

            const generatePDFContent = (context) => `
                            <!DOCTYPE html>
                           <html lang="en">
                                            <head>
                                            <meta charset="UTF-8">
                                            <title>Print Label</title>
                                            <style>
 
                                            body {
 
                                            font-family: monospace;
 
                                            }
 
                                            .header-section {
 
                                            display: flex;
 
                                            align-items: center;
 
                                            justify-content: space-between;
 
                                            margin-bottom: 10px;
 
                                            width: 400px;
 
                                            }
 
                                            .logo {
 
                                            height: 30px;
 
                                            }
 
                                            .title {
 
                                            flex: 1;
 
                                            text-align: center;
 
                                            font-weight: bold;
 
                                            font-size: 16px;
 
                                            margin-left: -30px; /* pull center alignment closer */
 
                                            }
 
                                            table {
 
                                            border-collapse: collapse;
 
                                            width: 380px;
 
                                            border: 2px solid black;
 
                                            }
 
                                            td {
 
                                            border: 1px solid black;
 
                                            padding: 4px;
 
                                            vertical-align: top;
 
                                            font-size: 12px;
 
                                            }
 
                                               .label-section {
 
                                                    font-weight: bold;
 
                                                }
                                            </style>
                                            </head>
                                            <body>
                                            <!-- Header with logo left and title center -->
                                            <div class="header-section">
                                            <img src="${logoBase64}"  class="logo"  alt="Logo" />
                                            <div class="title">WASTAGES LABEL - PRT</div>
                                            </div>
                                            <!-- Data table -->
                                            <table>
                                            <tr>
                                            <td class="label-section">CUSTOMER</td>
                                            <td colspan="3">${productDescriptions}</td>
                                            </tr>
                                            <tr>
                                            <td class="label-section">BATCH NO</td>
                                            <td colspan="3">${batches}</td>
                                            </tr>
                                            <tr>
                                            <td class="label-section">ITEM DESCRIPTION</td>
                                            <td colspan="3">${wastages}<br</td>
                                            </tr>
                                            <tr>
                                            <td class="label-section">PRT  NO</td>
                                            <td>${acmno}</td>
                                            <td class="label-section">SIZE</td>
                                            <td>${Zsize}</td>
                                            </tr>
                                            </tr>
                                            <tr>
                                            <td class="label-section">QTY in KGS</td>
                                            <td colspan="3">${wastages}</td>
                                            </tr>
                                            <tr>
                                            <td class="label-section">DATE/SHIFT</td>
                                            <td colspan="3">${formattedFromDate}</td>
                                            </tr>
                                            <tr>
                                            <td class="label-section">PRT OPERATOR</td>
                                            <td colspan="3"${operatorname}</td>
                                            </tr>
                                            </table>
                                            </body>
                                            </html>
                                                    `;

            const htmlContent = generatePDFContent(logoBase64);
            const iframe = document.createElement("iframe");
            iframe.style.position = "fixed";
            iframe.style.left = "-8000px";
            document.body.appendChild(iframe);
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            iframeDoc.open();
            iframeDoc.write(htmlContent);
            iframeDoc.close();

            await new Promise((resolve, reject) => {
                iframe.onload = () => {
                    setTimeout(() => {
                        // Apply scaling here
                        html2canvas(iframe.contentDocument.body, { scale: 4 }).then((canvas) => {
                            const imgData = canvas.toDataURL('image/jpeg', 0.7);  // JPEG with compression
                            doc.addImage(imgData, 'JPEG', 0, 0, 100, 90); // Adjusted dimensions for scaling
                            document.body.removeChild(iframe);
                            resolve();
                        }).catch(reject);
                    }, 500);
                };
            });

            const blob = doc.output("blob");
            const pdfUrl = URL.createObjectURL(blob);

            if (!this._PDFViewer) {
                this._PDFViewer = new sap.m.PDFViewer({ width: "auto" });
                jQuery.sap.addUrlWhitelist("blob");
            }

            this._PDFViewer.setSource(pdfUrl);
            this._PDFViewer.open();
        }

        const promises = [];
        for (let i = 1; i <= GetPrintCount; i++) {
            const htmlContent = generatePDFContent(logoBase64);
            promises.push(
                new Promise((resolve, reject) => {
                    const iframe = document.createElement("iframe");
                    iframe.style.position = "fixed";
                    iframe.style.left = "-8000";
                    iframe.style.width = "400px";
                    iframe.style.height = "250px";
                    document.body.appendChild(iframe);
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    iframeDoc.open();
                    iframeDoc.write(htmlContent);
                    iframeDoc.close();

                    iframe.onload = () => {
                        setTimeout(() => {
                            html2canvas(iframe.contentDocument.body).then((canvas) => {
                                const imgData = canvas.toDataURL("image/png");
                                doc.addImage(imgData, "PNG", 0, 0, 100, 90); // Match new size
                                if (i !== GetPrintCount) doc.addPage();
                                document.body.removeChild(iframe);
                                resolve();
                            }).catch((err) => {
                                document.body.removeChild(iframe);
                                reject(err);
                            });
                        }, 500);
                    };
                })
            );
        }

        Promise.all(promises).then(() => {
            const blob = doc.output("blob");
            const pdfUrl = URL.createObjectURL(blob);

            if (!this._PDFViewer) {
                this._PDFViewer = new sap.m.PDFViewer({ width: "auto" });
                jQuery.sap.addUrlWhitelist("blob");
            }

            this._PDFViewer.setSource(pdfUrl);
            this._PDFViewer.open();
        }).catch((err) => {
            console.error("Error generating PDF:", err);
            sap.m.MessageToast.show("Error generating PDF.");
        });
    }

        });
    }
);