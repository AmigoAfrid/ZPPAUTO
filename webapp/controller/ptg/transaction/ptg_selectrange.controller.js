sap.ui.define(
    [
        "zautodesignapp/controller/ptg/transaction/ptgbasecontroller",
        "sap/ui/core/mvc/Controller",
        "sap/ui/core/IconPool",
        "sap/ui/model/json/JSONModel",
        "sap/ui/core/Component",
        "sap/ui/core/UIComponent",
        "sap/m/routing/Router",
        "zautodesignapp/util/jspdf/html2canvasmin",
        "zautodesignapp/util/jspdf/jspdfmin",

    ],
    function (BaseController, IconPool, JSONModel, UIComponent, Component, Router) {
        "use strict";

        return BaseController.extend("zautodesignapp.controller.ptg.transaction.ptg_selectrange", {


            onInit: function () {
                BaseController.prototype.onInit.call(this);

                // Initialize TabModel specific to this screen
                const tabModel = new sap.ui.model.json.JSONModel({
                    Samples: [
                        { "item1": 1, "item2": "Product 01" }
                    ]
                });
                this.getView().setModel(tabModel, "TabModel");



                var JsonMModel = new sap.ui.model.json.JSONModel({

                    Samples: [

                        { "MachineID": 1, "MachineName": "PTG01" },
                        { "MachineID": 2, "MachineName": "PTG02" },
                        { "MachineID": 3, "MachineName": "PTG03" },
                        { "MachineID": 4, "MachineName": "PTG04" },
                        { "MachineID": 5, "MachineName": "PTG05" },
                        { "MachineID": 6, "MachineName": "PTG06" },

                    ]
                })

                this.getView().setModel(JsonMModel, "MModel");


                this.shiftmodels = new sap.ui.model.json.JSONModel({
                    shfitsamples: [
                        { "shiftid": 1, "shiftname": "A" },
                        { "shiftid": 2, "shiftname": "B" },
                        { "shiftid": 3, "shiftname": "C" }



                    ]
                })
                this.getView().setModel(this.shiftmodels, "shiftmodels")

            },

            Goptgselect: function () {
                // Validate date range using the base controller method
                //   if (!this.validateDateRange()) {
                //       return;
                //   }



                const headerData = this.ptgModel.getProperty("/HeaderData/0");
                console.log("Selected Date Range:", headerData.daterange);
                console.log("Machine no:", headerData.machineno);



                let Dates = headerData.daterange;
                let machineno = headerData.selectedMachine;

                let bHasDate = Dates && Dates.trim() !== "";
                const bHasmachine = machineno && machineno.trim() !== "";


                if (!bHasDate || !bHasmachine) {
                    sap.m.MessageBox.warning("Please enter  a Date Range and Machine No");
                    return false;
                }



                // Make the table visible
                this.ptgModel.setProperty("/TableVisible", true);


                let FromDate = "", ToDate = "";
                if (bHasDate) {
                    const myArray = Dates.split(" - ");
                    const datefrom = new Date(myArray[0]);
                    const dateto = new Date(myArray[1]);
                    FromDate = new Date(datefrom.getTime() - (datefrom.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
                    ToDate = new Date(dateto.getTime() - (dateto.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
                }

                //  Filter Logic
                let FinalFilter = [];

                // if (bHasOrder) {
                //     FinalFilter.push(new sap.ui.model.Filter("ManufacturingOrder", sap.ui.model.FilterOperator.EQ, processorder));
                // }

                if (bHasDate) {
                    FinalFilter.push(new sap.ui.model.Filter("CreationDate", sap.ui.model.FilterOperator.BT, FromDate, ToDate));
                }


                if (bHasmachine) {
                    FinalFilter.push(new sap.ui.model.Filter("PTGButton", sap.ui.model.FilterOperator.EQ, machineno));
                }




                // Data fetch
                const model0 = this.getView().getModel("ZAU_PTG_PROCESSORDER_SRVB");
                let aAllItems = [];
                let iSkip = 0;
                const iTop = 100;
                const that = this;

                that.getView().setBusy(true);

                function fetchData() {
                    model0.read("/ZCE_PTG_PROCESSORDER", {
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


            onButtonPress: function (oEvent) {
                var sSelectedMachineNo = oEvent.getSource().getText();


                var sUpdatedMachineNo = "PTG" + sSelectedMachineNo;
                if (this.ptgModel) {
                    this.ptgModel.setProperty("/HeaderData/0/selectedMachine", sUpdatedMachineNo); // Update model property
                } else {
                    console.error("qa03Model not found.");
                }

                // Close the dialog
                this.ChFrag.close();

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




            OnPTGCheck: function () {
                if (!this.ChFrag) {
                    this.ChFrag = sap.ui.xmlfragment(this.getView().getId("id_PTGmachine"), "zautodesignapp.view.ptg.transaction.fragment.valuehelp", this);
                    this.getView().addDependent(this.ChFrag);
                }
                this.ChFrag.open();
            },


            OnClose: function () {
                this.ChFrag.close();

            },



onAvgWeightChange: function (oEvent) {
    const input = oEvent.getSource();
    const context = input.getBindingContext("TabModelsitems");

    if (context) {
        const rowPath = context.getPath();
        const rowData = context.getObject();
        const model = this.getView().getModel("TabModelsitems"); // ✅ Moved up

        // Convert to numbers safely
        let ptgweight = rowData.ptgweight && rowData.ptgweight.trim() !== "" ? parseFloat(rowData.ptgweight) : 0.000;
        let aisweight = rowData.aisweight && rowData.aisweight.trim() !== "" ? parseFloat(rowData.aisweight) : 0.000;
        //let avgweight = ptgweight; // Based on your original logic
let avgweight = rowData.avgweight && rowData.avgweight.trim() !== "" ? parseFloat(rowData.avgweight) : 0.000;;


        const pathParts = rowPath.split("/");
        const rowindex = parseInt(pathParts[2]);

        // ✅ Show MessageBox and reset AIS weight if AIS ≤ PTG
       if (ptgweight > aisweight) {
            sap.m.MessageBox.error("PTG Weight Should not greater than AIS Weight");

            model.setProperty(`${rowPath}/ptgweight`, "0.000");  // Set PTG weight to 0.000
            input.setValue("0.000");  // Update the input field with 0.000
            ptgweight = 0.000;  // Set ptgweight to 0 for further calculations
        }

        // PTG Waste Calculation
        const ptgwastagesRaw = aisweight - ptgweight;
        let ptgwastages = Math.max(0, ptgwastagesRaw); // Prevent negative waste

        let ptgwastageinlac = (ptgwastages/avgweight)*10

        // agrade calculation
        let agrade = 0;
        if (avgweight !== 0) {
            agrade = (ptgweight / avgweight) * 10;
        } else {
            console.warn("Average weight is zero — agrade set to 0.");
        }

        if (rowindex > 0) {
            const prevIndex = rowindex - 1;
            const previousRowData = model.getProperty("/ItemDatas/" + prevIndex);
            const Cumvalagrade = parseFloat(previousRowData.cumulativeagrade) || 0;
            const cumulativeGrade = Cumvalagrade + agrade;

            model.setProperty(`${rowPath}/ptgweight`, ptgweight.toFixed(3));
            model.setProperty(`${rowPath}/ptgwaste`, ptgwastages.toFixed(3));
            model.setProperty(`${rowPath}/ptgwastageinlac`, ptgwastageinlac.toFixed(4));
            model.setProperty(`${rowPath}/agradeweight`, agrade.toFixed(3));
            model.setProperty(`${rowPath}/qtylitre`, agrade.toFixed(2));
            model.setProperty(`${rowPath}/cumulativeagrade`, cumulativeGrade.toFixed(3));
        } else {
            // First row logic
            model.setProperty(`${rowPath}/ptgweight`, ptgweight.toFixed(3));
            model.setProperty(`${rowPath}/ptgwaste`, ptgwastages.toFixed(3));
            model.setProperty(`${rowPath}/ptgwastageinlac`, ptgwastageinlac.toFixed(4));
            model.setProperty(`${rowPath}/agradeweight`, agrade.toFixed(3));
            model.setProperty(`${rowPath}/qtylitre`, agrade.toFixed(2));
            model.setProperty(`${rowPath}/cumulativeagrade`, agrade.toFixed(3));
        }

    } else {
        console.log("No binding context found.");
    }
},



            onGoToScreen2: function () {
                this.showScreen("screen2");
            },

            onGoToScreen1: function () {
                this.showScreen("screen1");
            },

            onRowSelect: function (oEvent) {
                // Use the base controller's row select logic
                this.handleRowSelect(oEvent);
            },



            onMenuAction: function (oEvent) {
                const selectedItem = oEvent.getParameter("item");
                const key = selectedItem.getKey(); // Use the 'key' to identify the action
                const text = selectedItem.getText(); // Optional: get visible label

                switch (key) {
                    case "0":
                        this.onCapCutPrint(oEvent);
                        break;
                    case "1":
                        this.onBodyCutPrint(oEvent);
                    case "2":
                        this.onWastagePTG(oEvent);
                        break;
                    case "3":
                        this.ToComponentFragOpen(oEvent);
                        break;
                    case "4":
                        this.ToComponentsFragOpen(oEvent);
                        break;
                    case "5":
                        this.OnApiPost_MatDoc_GR(oEvent);
                        break;
                    case "6":
                        this.OnReverseApiPost_MatDoc_GI(oEvent);
                        break;
                    case "7":
                        this.OnReverseApiPost_MatDoc_GI_531(oEvent);
                        break;
                    case "8":
                        this.OnReverseApiPost_MatDoc_GR(oEvent);
                        break;
                    default:
                        console.warn("Unknown action:", key);
                }
            },





            onBodyCutPrint: async function (oEvent) {

                const input = oEvent.getSource(); // the Input field
                const context = input.getBindingContext("TabModelsitems");
                let getHeaderData = this.screen2headermodel.getProperty("/HEADERDATA/");



                if (context) {
                    const rowPath = context.getPath();
                    const rowData = context.getObject();
                    // debugger
                    const dates = new Date(rowData.ptgdate); // assuming zdate is a valid date string
                    const yyyy = dates.getFullYear();
                    const mm = String(dates.getMonth() + 1).padStart(2, '0'); // getMonth() is zero-based
                    const dd = String(dates.getDate()).padStart(2, '0');

                    const formattedDate = `${dd}-${mm}-${yyyy}`;
                    console.log("formattedDate:", formattedDate);



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
                        sap.ui.require.toUrl("zautodesignapp/images/NCLH.png")
                    );

                    const generatePDFContent = (logoData, rowData) => `
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
                               <img src="${logoData}"  class="logo"  alt="Logo" />
                                <div class="title">SEMI-FINISHED PRODUCT LABEL</div>
                            </div>

                            <!-- Data table -->
                            <table>
                                <tr>
                                <td class="label-section">CUSTOMER</td>
                                <td colspan="3">${getHeaderData.CustomerName}</td>
                            
                                </tr>

                                <tr>
                                <td class="label-section">BATCH NO</td>
                                <td colspan="3">${getHeaderData.Batch}</td>
                                </tr>

                                <tr>
                                <td class="label-section">DESCRIPTION</td>
                                <td colspan="3">${getHeaderData.ProductDescription}<br</td>
                                </tr>

                            <tr>
                            <td class="label-section">Drum NO</td>
                            <td>${rowData.boxno}</td>
                            <td class="label-section">SIZE</td>
                            <td>${getHeaderData.Zsize}</td>
                        </tr>

                                </tr>

                                <tr>
                            <td class="label-section">QTY</td>
                                <td colspan="3">${rowData.ptgweight} Kgs/ ${rowData.qtylitre} lakhs</td>
                                </tr>

                                 <tr>
                    <td class="label-section">Print GRADE</td>
                    <td colspan="3">${rowData.grageptg}</td>
                    </tr>
                    <tr>
                    <td class="label-section">ATS GRADE</td>
                    <td>${rowData.gradeats}</td>
                    <td class="label-section" >AIS GRADE</td>
                    <td>${rowData.gradeais}</td>
                    </tr>
                        <tr>
                    <td class="label-section" >SIGN & DATE</td>
                    <td>${rowData.operatorname}</td>
                    <td colspan="2"> ${formattedDate}</td>
                                </tr>
                            
                                </table>

                            </body>
                            </html>




            `;

                    const htmlContent = generatePDFContent(logoBase64, rowData);
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

         
      onValueHelpRequestBatch: function (oEvent) {

   
               sap.ui.core.BusyIndicator.show();

                //   var oFilters1 = new sap.ui.model.Filter("Createdat", sap.ui.model.FilterOperator.EQ, Date);

               const input = oEvent.getSource(); // the Input field
                const context = input.getBindingContext("CompDipsModel");

                this.spath =oEvent.getSource().getParent().getCells()[6];
                this.storagepath = oEvent.getSource().getParent().getCells()[5];

                console.log("context", context);
                if (context) {
                    const rowData = context.getObject();
 
                    const aFilters = [
                        new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.EQ, rowData.material),
                        new sap.ui.model.Filter("Plant", sap.ui.model.FilterOperator.EQ, rowData.plant),
                    ];
 
                    var oMaterial = rowData.material;
                    var oBatch = rowData.batch;
               
               
               
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

                        var oColumnProductCode, oColumnMaterial,  oColumnPlant, oColumnstorage,oColumnstocktype;
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
                                            new sap.m.Text( { text: "{oJSONBatchModel>Material}" } ),
                                            new sap.m.Text( { text: "{oJSONBatchModel>Plant}" } ),
                                            new sap.m.Text( { text: "{oJSONBatchModel>Batch}" } ),  
                                           new sap.m.Text( { text: "{oJSONBatchModel>StorageLocation}" } ),
                                            new sap.m.Text( { text: "{oJSONBatchModel>MatlWrhsStkQtyInMatlBaseUnit}" } )
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
            }
                // Start fetching data from the beginning
              
     
                //   sap.m.MessageBox.error("Please check Company Code / Fiscal Year");
    
            
        },


        onValueHelpOkPressBatch: function (oEvent) {
          


var aTokens = oEvent.getParameter("tokens");
                console.log("aTokens:", aTokens)
                let text = aTokens[0].getKey();
                var text2 = aTokens[0].mProperties.text
                    const result = text2.split(' ')[0];
                    console.log(result); 
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
        }

        });
    });
