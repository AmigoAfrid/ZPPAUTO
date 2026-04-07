sap.ui.define(
    [
        "zautodesignapp/controller/qa01/transaction/qa01basecontroller",
        "sap/ui/core/mvc/Controller",
        "sap/ui/core/IconPool",
        "sap/ui/model/json/JSONModel",
        "sap/ui/core/Component",
        "sap/ui/core/UIComponent",
        "sap/m/routing/Router",
        "sap/ui/core/Fragment",
        "zautodesignapp/util/jspdf/html2canvasmin",
        "zautodesignapp/util/jspdf/jspdfmin",
        "sap/m/PDFViewer",


    ],
    function (BaseController, IconPool, JSONModel, UIComponent, Component, Router, Fragment) {
        "use strict";

        return BaseController.extend("zautodesignapp.controller.qa01.transaction.qa01_selectrange", {
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

                        { "MachineID": 1, "MachineName": "ATS01" },
                        { "MachineID": 2, "MachineName": "ATS02" },
                        { "MachineID": 3, "MachineName": "ATS03" },
                        { "MachineID": 4, "MachineName": "ATS04" },
                        { "MachineID": 5, "MachineName": "ATS05" },
                        { "MachineID": 6, "MachineName": "ATS06" },

                    ]
                })

                this.getView().setModel(JsonMModel, "MModel");

                this.QAJModelInput = new sap.ui.model.json.JSONModel({
                    Samples: {
                        qa01_cfmperform: '',
                        qa01_avgwt: '',
                        qa01_moistcontent: '',
                        qa01_pulltest: '',
                        qa01_joinlength: '',
                    }
                })
                this.getView().setModel(this.QAJModelInput, "QAJModelInput");


                this.ToCheckTempGradeValidation = ""


                
            },

            GoQA01select: function () {
                // Validate date range using the base controller method
                // if (!this.validateDateRange()) {
                //     return;
                // }

                const headerData = this.qa0Model.getProperty("/HeaderData/0");
                console.log("Selected Date Range:", headerData.daterange);
                console.log("Machine no:", headerData.selectedMachine);
                let selectdate = headerData.daterange;

                let Dates = headerData.daterange;
                let machineno = headerData.selectedMachine;

                let bHasDate = Dates && Dates.trim() !== "";
                const bHasmachine = machineno && machineno.trim() !== "";


                if (!bHasDate || !bHasmachine) {
                    sap.m.MessageBox.warning("Please enter  a Date Range and Machine No");
                    return false;
                }

                // Make the table visible
                this.qa0Model.setProperty("/TableVisible", true);


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
                    FinalFilter.push(new sap.ui.model.Filter("ATSButton", sap.ui.model.FilterOperator.EQ, machineno));
                }

                // Data fetch
                const model0 = this.getView().getModel("ZAU_ATS_PROCESSORDER_SRVB");
                let aAllItems = [];
                let iSkip = 0;
                const iTop = 100;
                const that = this;

                that.getView().setBusy(true);

                function fetchData() {
                    model0.read("/ZCE_ATS_PROCESSORDER", {
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

            onGoToScreen2: function () {
                this.showScreen("screen2");
            },

            onGoToScreen1: function () {
                this.showScreen("screen1");

                const tabModel = new sap.ui.model.json.JSONModel({
                    ItemData: []
                });
                this.getView().setModel(tabModel, "TabModel");
            },

            onRowSelect: function (oEvent) {
                // Use the base controller's row select logic
                this.handleRowSelect(oEvent);
            },



            Onqa01Check: function () {
                if (!this.ChFrag) {
                    this.ChFrag = sap.ui.xmlfragment(this.getView().getId("id_qa01machine"), "zautodesignapp.view.qa01.transaction.fragment.valuehelp", this);
                    this.getView().addDependent(this.ChFrag);
                }
                this.ChFrag.open();
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


            onButtonPress: function (oEvent) {
                var sSelectedMachineNo = oEvent.getSource().getText();

                // // Get the input field correctly within the current view
                // var oInputField = this.byId("id_machine");

                // if (oInputField) {
                //     oInputField.setValue(sSelectedMachineNo);
                // } else {
                //     console.error("Input field not found.");
                // }

                var sUpdatedMachineNo = "ACM" + sSelectedMachineNo;
                if (this.qa0Model) {
                    this.qa0Model.setProperty("/HeaderData/0/selectedMachine", sUpdatedMachineNo); // Update model property
                } else {
                    console.error("qa0Model not found.");
                }

                // Close the dialog
                this.ChFrag.close();

            },

            OnClose: function () {
                this.ChFrag.close();

            },


            OnTableItemAdd: function () {
                sap.ui.core.BusyIndicator.show();
                var oModel = this.getView().getModel("TabItemModel");
                var tabledata = oModel.getProperty("/Datassitem"); // Ensure it is an array
                var length = tabledata.length
                // Validation: Check if the status is 'open' after the first validation passes
                var isStatusOpen = tabledata.every(function (row) {
                    return row.status === 'open';
                });


                //  boxno: length + 1,

                // if (!isStatusOpen) {
                //     sap.m.MessageBox.warning("Please save the current row...");
                //     sap.ui.core.BusyIndicator.hide();
                //     return;
                // } else {
                    var datas = {
                        sap_uuid: "",
                        zdate: "",
                        batch: "",
                        shift: "",
                        boxno: "",
                        averagewt: "",
                        weight: "",
                        cumulativeqty: "",
                        gradeats: "",
                        tarqty: "",
                        agradeqty: "",
                        hfx: "",
                        remarks: "",
                        wastage: "",
                        wastageinlac :"",
                        floorwastage: "",
                        qaname: "",
                        operatorname: "",
                        materialdocument: "",
                        documentyear: "",
                        itemstatus: "",
                        materialdocumentno: ""
                    };

                    tabledata.push(datas);

                    // Ensure the model is updated
                    oModel.setProperty("/Datassitem", tabledata);
                    oModel.refresh();
                    this.ToCheckTempGradeValidation = ""
                    sap.ui.core.BusyIndicator.hide();

                // }

            },


            // OnRowDelete: function(oEvent) {
            //     var oModel = this.getView().getModel("TabItemModel");
            //     var tabledata = oModel.getProperty("/Datassitem") || [];

            //     // Try getting context from button's parent (in case it's not directly bound)
            //     var oContext = oEvent.getSource().getParent().getBindingContext("TabItemModel");

            //     if (!oContext) {
            //         sap.m.MessageToast.show("Error: Unable to find row data.");
            //         return;
            //     }

            //     var sPath = oContext.getPath();
            //     var rowIndex = parseInt(sPath.split("/")[2], 10);

            //     // Remove the row
            //     tabledata.splice(rowIndex, 1);

            //     // Update the model
            //     oModel.setProperty("/Datassitem", tabledata);
            //     oModel.refresh();
            // }


            onRowSelected: function (oEvent) {
                const table = oEvent.getSource();
                const selectedIndices = table.getSelectedIndices(); // Get all selected row indices

                this.selectedData = [];
                var that = this;
                selectedIndices.forEach(function (index) {
                    const context = table.getContextByIndex(index);
                    if (context) {
                        const data = context.getObject();
                        that.selectedData.push(data);
                    }
                });

                console.log("Selected Rows Data:", this.selectedData);

                // You can now use `selectedData` as an array of selected row objects
                // Example: selectedData[0].macno, selectedData[1].speed, etc.
            },

            onCheckBoxSelect11: function (oEvent) {
                const input = oEvent.getSource(); // the Input field
                const context = input.getBindingContext("TabItemModel");
                this.selectedData = [];
                if (context) {
                    const rowPath = context.getPath();
                    const rowData = context.getObject();

                    // splitting the row index value 
                    let a = rowPath
                    let b = a.split("/")
                    let rowobject = b[1]
                    let rowindex = parseInt(b[2])
                    console.log("rowindex:", rowindex);

                    let c = this.getView().getModel("TabItemModel");
                    let cdatas = c.getProperty("/Datassitem/" + rowindex);
                    // debugger
                    this.selectedData.push(cdatas)

                    this.rowdatamodel = new sap.ui.model.json.JSONModel({
                        itemdatas: cdatas
                    });
                    this.getView().setModel(this.rowdatamodel, "rowdatamodel");

                    console.log("Updated JSON Model:", this.rowdatamodel);

                } else {
                    console.log("No binding context found.");
                }
            },

            onCheckBoxSelect: function (oEvent) {
                const checkbox = oEvent.getSource(); // the Input field
                const context = checkbox.getBindingContext("TabItemModel");

                console.log("context", context);

                const rowPath = context.getPath();
                const rowData = context.getObject();

                if (rowData.selected === true) {
                    if (!rowData.zdate || !rowData.shift || !rowData.averagewt || rowData.averagewt === "0.000" || !rowData.qaname || !rowData.operatorname || !rowData.gradeats || !rowData.boxno) {
                        console.log("PLeease maintain data");
                        sap.m.MessageBox.error("Please enter All mandatory data before select");
                        // here i need set rowData.selected == false
                        
                        rowData.selected = false;
                        checkbox.setSelected(false);

                        // update model so table refreshes
                        context.getModel().refresh(true);
                    }
                }


            },


            // For Table Item remove
            OnRowDelete: function (oEvent) {

                var del = this.selectedData;

                var mod = this.getView().getModel("TabItemModel");
                var data = mod.getProperty("/Datassitem");
                var oODataModel = this.getView().getModel("ZSB_AU_QA01_ITEM"); // backend OData model


                for (var i = 0; i < data.length; i++) {
                    for (var j = 0; j < del.length; j++) {

                        if (data[i] === del[j]) {

                            // 🔹 Check if entry has backend key (example: id field)
                            if (data[i].sap_uuid) {
                                var sPath = "/ZC_AU_QA01_ITEM('" + data[i].sap_uuid + "')";

                                oODataModel.remove(sPath, {
                                    success: function () {
                                        sap.m.MessageToast.show("Deleted from backend successfully");
                                    },
                                    error: function (oError) {
                                        sap.m.MessageToast.show("Error while deleting from backend");
                                    }
                                });
                            }
                            data.splice(i, 1);
                            this.count = this.count - 1;

                        }
                    }

                }

                mod.setProperty("/Datassitem", data);
                mod.refresh();

            },

            /* ===============================================
             *  Handles both Date-Picker and Shift ComboBox
             * =============================================== */
            onDateOrShiftChange: function (oEvt) {
                // Basic handles
                const oControl = oEvt.getSource();
                const oCtx = oControl.getBindingContext("TabItemModel");
                if (!oCtx) return;

                const oModel = oCtx.getModel();
                const oHeader = this.getView().getModel("screen2model");
                const sPath = oCtx.getPath();
                const sType = oControl.getMetadata().getName();

                // Handle Date change
                if (sType === "sap.m.DatePicker") {
                    const oDate = oControl.getDateValue();
                    oCtx.setProperty("zdate", oDate || null);

                    // Fill from header
                    oCtx.setProperty("batch", oHeader.getProperty("/HEADERDATA/Batch") || "");
                    oCtx.setProperty("aisMachineNo", oHeader.getProperty("/HEADERDATA/AISNO") || "");

                    // // Force set default values even if property doesn't exist yet
                    // const defaults = {
                    //     weight: "0.000",              // Weight
                    //     cumulativeqty: "0.000",         // Cumulative Qty
                    //     tarqty: "0.00",             // Qty in L
                    //     hfx: "0.00",              // HFX
                    //     wastage: "0.00",          // Wastage
                    //     floorwastage: "0.00",     // Floor Wastage
                    //     materialdoc: "",          // Material Document
                    //     documentyear: "",         // Document Year
                    //     agradeqty: "0.000",       // A Grade Qty (seen in your view)
                    //     averagewt: "0.000"        // Average Weight (bound in input)
                    // };

                    // Object.entries(defaults).forEach(([key, val]) => {
                    //     oCtx.setProperty(key, val);  // ✅ forcibly set even if undefined
                    // });
                }

                // Handle Shift change
                if (sType === "sap.m.ComboBox") {
                    const sShift = oControl.getSelectedKey();
                    oCtx.setProperty("shift", sShift || "");
                }

                // // Check duplicate date+shift
                // const oRowDate = oCtx.getProperty("zdate");
                // const oRowShift = (oCtx.getProperty("shift") || "").trim();

                // if (oRowDate && oRowShift) {
                //     const aRows = oModel.getProperty("/Datassitem") || [];
                //     const iCurrentIndex = Number(sPath.split("/").pop());

                //     const bDuplicate = aRows.some((row, idx) => {
                //         if (idx === iCurrentIndex) return false;
                //         if (!row.zdate || !row.shift) return false;

                //         const sameDate = new Date(row.zdate).setHours(0, 0, 0, 0) ===
                //                          new Date(oRowDate).setHours(0, 0, 0, 0);
                //         const sameShift = row.shift.trim() === oRowShift;

                //         return sameDate && sameShift;
                //     });

                //     if (bDuplicate) {
                //         sap.m.MessageToast.show("Duplicate Date & Shift detected – row cleared.");
                //         ["zdate", "shift"].forEach(p => oCtx.setProperty(p, null));
                //     }
                // }

                oModel.refresh(true);
            },



            onLevelLiveChange: function (oEvent) {
                const oInput = oEvent.getSource();
                const sValue = oInput.getValue();
                // const oBindingContext = oInput.getBindingContext();

                if (sValue === "") {
                    oInput.setValue("0"); // Set visible value
                    // const oModel = oBindingContext.getModel();
                    //const sPath = oBindingContext.getPath();

                    // Update model as well
                    // oModel.setProperty(sPath + "/level1", "0");

                }
            },



            onCapCutPrint: async function (oEvent) {

                const input = oEvent.getSource(); // the Input field
                const context = input.getBindingContext("TabItemModel");
                let getHeaderData = this.screen2headermodel.getProperty("/HEADERDATA/");





                if (context) {
                    const rowPath = context.getPath();
                    const rowData = context.getObject();

                    const dates = new Date(rowData.zdate); // assuming zdate is a valid date string
                    const yyyy = dates.getFullYear();
                    const mm = String(dates.getMonth() + 1).padStart(2, '0'); // getMonth() is zero-based
                    const dd = String(dates.getDate()).padStart(2, '0');

                    const formattedDate = `${dd}-${mm}-${yyyy}`;
                    console.log("formattedDate:", formattedDate);
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
                                            <td colspan="3">${rowData.weight} Kgs/ ${rowData.tarqty} lakhs</td>
                                            </tr>
            
                                             <tr>
                                <td class="label-section">ATS GRADE</td>
                                <td colspan="3"> ${rowData.gradeats}</td>
                                </tr>
                                <tr>
                                <td class="label-section">AIS GRADE</td>
                                <td></td>
                                <td class="label-section" >PRT GRADE</td>
                                <td></td>
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


                let GetPrintCount = 1;


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


        });
    }
);
