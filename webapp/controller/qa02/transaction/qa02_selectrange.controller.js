sap.ui.define(
    [
        "zautodesignapp/controller/qa02/transaction/qa02basecontroller",
        "sap/ui/core/mvc/Controller",
        "sap/ui/core/IconPool",
        "sap/ui/model/json/JSONModel",
        "sap/ui/core/Component",
        "sap/ui/core/UIComponent",
        "sap/m/routing/Router",
        "sap/ui/core/Fragment",
        "sap/m/MessagePopover",
        "sap/m/MessagePopoverItem",
        "sap/m/MessageToast",
        "zautodesignapp/util/jspdf/html2canvasmin",
        "zautodesignapp/util/jspdf/jspdfmin",
        "sap/m/PDFViewer",


    ],
    function (BaseController, IconPool, JSONModel, UIComponent, Component, Router, Fragment, MessagePopover, MessagePopoverItem, MessageToast) {
        "use strict";

        return BaseController.extend("zautodesignapp.controller.qa02.transaction.qa02_selectrange", {
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

                        { "MachineID": 1, "MachineName": "AIS01" },
                        { "MachineID": 2, "MachineName": "AIS02" },
                        { "MachineID": 3, "MachineName": "AIS03" },
                        { "MachineID": 4, "MachineName": "AIS04" },
                        { "MachineID": 5, "MachineName": "AIS05" },
                        { "MachineID": 6, "MachineName": "AIS06" },

                    ]
                })

                this.getView().setModel(JsonMModel, "MModel");

                this.ToCheckTempGradeValidation = ""

            },

            GoQA02select: function () {
                // Validate date range using the base controller method
                // if (!this.validateDateRange()) {
                //     return;
                // }


                const headerData = this.qa02Model.getProperty("/HeaderData/0");
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
                this.qa02Model.setProperty("/TableVisible", true);


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
                    FinalFilter.push(new sap.ui.model.Filter("AISButton", sap.ui.model.FilterOperator.EQ, machineno));
                }




                // Data fetch
                const model0 = this.getView().getModel("ZAU_AIS_PROCESSORDER_SRVB");
                let aAllItems = [];
                let iSkip = 0;
                const iTop = 100;
                const that = this;

                that.getView().setBusy(true);

                function fetchData() {
                    model0.read("/ZCE_AIS_PROCESSORDER", {
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
                                that.tabModel = new sap.ui.model.json.JSONModel({

                                    ItemData: aAllItems
                                });
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


            Onqa02Check: function () {
                if (!this.ChFrag) {
                    this.ChFrag = sap.ui.xmlfragment(this.getView().getId("id_qa02machine"), "zautodesignapp.view.qa02.transaction.fragment.valuehelp", this);
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

                var sUpdatedMachineNo = "AIS" + sSelectedMachineNo;
                if (this.qa02Model) {
                    this.qa02Model.setProperty("/HeaderData/0/selectedMachine", sUpdatedMachineNo); // Update model property
                } else {
                    console.error("qa02Model not found.");
                }

                // Close the dialog
                this.ChFrag.close();

            },

            OnClose: function () {
                this.ChFrag.close();

            },





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







            //this code lets the box number oif screen 2 to have unique values when filled by user   onBoxNoChange
            onBoxNoChange: function (oEvent) {
                const oInput = oEvent.getSource();
                const oContext = oInput.getBindingContext("TabItemModel");
                const sNewBoxNo = oInput.getValue().trim();

                if (!sNewBoxNo) return; // Ignore empty input

                const oModel = this.getView().getModel("TabItemModel");
                const aRows = oModel.getProperty("/Datassitem");

                const sPath = oContext.getPath();
                const currentIndex = parseInt(sPath.split("/").pop());

                const isDuplicate = aRows.some((item, index) => {
                    return index !== currentIndex && item.boxno && item.boxno.trim() === sNewBoxNo;
                });

                if (isDuplicate) {
                    // Clear input and warn user
                    oModel.setProperty(sPath + "/boxno", "");
                    sap.m.MessageBox.warning("Box Number must be unique. The value '" + sNewBoxNo + "' already exists.");
                }
            },







            /* ── handler wired to fragment’s Cancel/Close button ─────────── */
            onQualityDialogClose: function () {
                if (this._oQualityDialog) {
                    this._oQualityDialog.close();
                }
            },


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
                    oCtx.setProperty("aismachineno", oHeader.getProperty("/HEADERDATA/AISNO") || "");
                }

                // Handle aisshift change
                if (sType === "sap.m.ComboBox") {
                    const sShift = oControl.getSelectedKey();
                    oCtx.setProperty("aisshift", sShift || "");
                }

                // // Check duplicate date+shift
                // const oRowDate = oCtx.getProperty("zdate");
                // const oRowShift = (oCtx.getProperty("aisshift") || "").trim();

                // if (oRowDate && oRowShift) {
                //     const aRows = oModel.getProperty("/Datassitem") || [];
                //     const iCurrentIndex = Number(sPath.split("/").pop());

                //     const bDuplicate = aRows.some((row, idx) => {
                //         if (idx === iCurrentIndex) return false;
                //         if (!row.zdate || !row.aisshift) return false;

                //         const sameDate = new Date(row.zdate).setHours(0, 0, 0, 0) ===
                //             new Date(oRowDate).setHours(0, 0, 0, 0);
                //         const sameShift = row.aisshift.trim() === oRowShift;

                //         return sameDate && sameShift;
                //     });

                //     if (bDuplicate) {
                //         sap.m.MessageToast.show("Duplicate Date & aisshift detected – row cleared.");
                //         ["zdate", "aisshift"].forEach(p => oCtx.setProperty(p, null));
                //     }
                // }

                oModel.refresh(true);
            },




            onSubmitqa02screen: function () {
                const that = this;

                /* show spinner */
                sap.ui.core.BusyIndicator.show(0);

                /* create a simple running ID based on timestamp                *
                 * (If you later need a real sequence from backend, replace it) */
                const LastId = "30" + Date.now();          // e.g. 302559442228610
                const oModelItem = this.getView().getModel("ZSB_AU_QA02_ITEM");

                const oView = this.getView();
                const oItemModel = oView.getModel("TabItemModel");
                const oItemSrv = oView.getModel("ZSB_AU_QA02_ITEM");      // QA02 item service
                const oDefSrv = oView.getModel("ZDEFECTS_TABLE_SRVB");
                var aAllRows = (oItemModel.getProperty("/Datassitem") || []);

                const aSelected = aAllRows.filter(r => r.selected);

                this.ToSaveFunc(LastId).then((result) => {
                    if (result === "Saved") {
                        sap.m.MessageBox.success("Data saved.");
                        that.getView().setModel(
                            new sap.ui.model.json.JSONModel({
                                MSGSTRIP: {
                                    visible: true,
                                    text: "QA02 Reference Document No " + LastId,
                                    type: "Success"
                                }
                            }),
                            "FinalStatus"
                        );
                    }
                }).finally(async () => {

                    // Filters for data fetch
                    const filters = [
                        new sap.ui.model.Filter("processorder", sap.ui.model.FilterOperator.EQ, "00" + aSelected[0].processorder),
                        new sap.ui.model.Filter("batch", sap.ui.model.FilterOperator.EQ, aSelected[0].batch)
                    ];

                    // Fetch item tab data
                    const DatasKk01 = await this.ToCheckProcOrderInInternally(oModelItem, filters);

                    // Bind to TabItemModel
                    const tabItemModel = new sap.ui.model.json.JSONModel({ Datassitem: DatasKk01 });
                    this.getView().setModel(tabItemModel, "TabItemModel");

                    sap.ui.core.BusyIndicator.hide();
                });
            },

            /* ===================================================== *
             * SAVE  SELECTED  ROWS 
             * ===================================================== */
            ToSaveFunc: function (GetId) {
                const that = this;
                const oView = this.getView();
                var oHdrData = this.screen2headermodel.getProperty("/HEADERDATA/");
                // const headerData = this.qa02Model.getProperty("/HeaderData/0");
                const oItemModel = oView.getModel("TabItemModel");
                const oItemSrv = oView.getModel("ZSB_AU_QA02_ITEM");      // QA02 item service
                const oDefSrv = oView.getModel("ZDEFECTS_TABLE_SRVB");
                var aAllRows = (oItemModel.getProperty("/Datassitem") || []);




                /* spinner on */
                sap.ui.core.BusyIndicator.show(0);

                const aSelected = aAllRows.filter(r => r.selected);

                /* ── grab real table selection ── */
                //   const oTable          = oView.byId("idqa02processcreen");
                //   const selectedIndices = oTable.getSelectedIndices();

                if (aSelected.length === 0) {               // ★ NEW
                    sap.ui.core.BusyIndicator.hide();
                    sap.m.MessageBox.information("Please select at least one row to post.");
                    return resolve("No selection");
                }



                //   const aSelected = selectedIndices.map(i =>
                //       oItemModel.getProperty(`/Datassitem/${i}`));


                /* ── required-field validation ── */
                const REQ = [
                    { key: "zdate", label: "Date" },
                    { key: "aisshift", label: "AIS Shift" },
                    { key: "boxno", label: "Box No" },
                    { key: "grageais", label: "Grade for AIS" },
                    // { key : "materialdescription", label : "Material Description" },
                    { key: "aismachineno", label: "AIS Machine NO" },
                    { key : "qaname",       label : "QA Name"       },
                     { key : "operatorname", label : "Operator Name" },
                     { key : "aismachineno", label : "AIS Machine NO" }
                    // { key : "documentyear", label : "Document Year"}
                ];

                const aMissing = aSelected
                    .map((row, idx) => {
                        const miss = REQ.filter(f => !row[f.key] && row[f.key] !== 0)
                            .map(f => f.label);
                        // ✅ Extra logic: If shift = "C" then floorwastage must be entered
                        // if (row.aisshift === "C") {
                        //     if (!row.floorwaste || row.floorwaste === 0 || row.floorwaste === "0.00") {
                        //         miss.push("Floor Wastage");
                        //     }
                        // }
                        return miss.length ? { idx, miss } : null;
                    })
                    .filter(Boolean);

                if (aMissing.length) {
                    const txt = aMissing
                        .map(r => `Row ${r.idx + 1}: ${r.miss.join(", ")}`)
                        .join("\n");
                    sap.ui.core.BusyIndicator.hide();
                    sap.m.MessageBox.error(
                        "Fill the following before posting:\n\n" + txt
                    );
                    return resolve("Validation failed");
                }

                if(!aSelected[0].boxno || aSelected[0].boxno === "0"){

                    sap.m.MessageBox.error("Please enter Box No");
                     sap.ui.core.BusyIndicator.hide();
                     return
                }

                return new Promise((resolve) => {

                    sap.m.MessageBox.confirm(
                        "Do you want to submit the selected row(s)?",
                        {
                            actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
                            emphasizedAction: sap.m.MessageBox.Action.YES,
                            onClose: async function (sAction) {
                                if (sAction !== sap.m.MessageBox.Action.YES) {
                                    sap.ui.core.BusyIndicator.hide();
                                    return resolve("Cancelled");
                                }


                                /* helper – quick UUID */
                                const genUid = (prefix) =>
                                    `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

                                /* ───────── POST  ITEM  ROWS ───────── */
                                const postItems = () =>
                                    Promise.all(aSelected.map(row => new Promise((res, rej) => {
                                        let qa02_status;
                                        if (row.grageais === "D") {
                                            qa02_status = "X"
                                        } else {
                                            qa02_status = "X"
                                        }
                                        const payload = {
                                            /* keys */
                                            //   sap_uuid : genUid(GetId),
                                            //   id       : GetId,

                                            /* main data (all from row) */
                                            zdate: row.zdate
                                                ? new Date(row.zdate.toLocaleDateString("en-CA"))
                                                : new Date(),
                                            processorder: row.processorder,
                                            batch: row.batch,
                                            shift: row.shift,
                                            // averagewt       : row.averagewt,
                                            aisshift: row.aisshift,
                                            boxno: row.boxno,

                                            qty_l: row.qtylitre || "0.00",
                                            cumqty: row.cumqty || "0.000",
                                            uom: "",
                                            gradeats: row.gradeats,
                                            grageais: row.grageais,
                                            aiswastage: row.aiswastage || "0.000",
                                            qtylitre: row.qtylitre || "0.00",
                                            agradeqty: row.agradeqty || "0.000",
                                            cumulativeentry: row.cumulativeentry || "0.000",
                                            remarks: row.remarks,
                                            hfx: row.hfx || "0.00",
                                            floorwaste: row.floorwaste || "0.00",
                                            wastageinlac : row.wastageinlac,
                                            qaname: row.qaname,
                                            operatorname: row.operatorname,
                                            aismachineno: row.aismachineno,
                                            screencode: new Date(),
                                            status: "open",
                                            itemstatus: "open",
                                            createdby: that.TENTUSERID,
                                            createdat: new Date(),
                                            updatedat: new Date(),
                                            updatedby: that.TENTUSERID,
                                            qa01_status: "",
                                            qa02_status: qa02_status,
                                            qa03_status: "",
                                            product :  oHdrData.Product,
                                            productdescription :  oHdrData.ProductDescription,
                                            customer : oHdrData.Customer,
                                            customername : oHdrData.CustomerName,
                                            zsize : oHdrData.Zsize,
                                            productionunit :  oHdrData.ProductionUnit,
                                            plant: oHdrData.ProductionPlant
                                        };

                                        oItemSrv.update("/ZC_AU_QA02ITEM('" + row.sap_uuid + "')", payload, {
                                            success: function (oData, oResponse) {
                                                console.log("Goods Issue No Updated Successfully...");
                                                resolve("Saved");
                                            },
                                            error: function (error) {
                                                console.log("Error updating item:", error);
                                                sap.m.MessageToast.show("Goods Issue Doc No - Internal table update failed");
                                                reject(error);
                                            }
                                        });

                                    })));


                                /* ───────── EXECUTE ALL ───────── */
                                try {
                                    await Promise.all([
                                        postItems(),
                                    ]);

                                    sap.m.MessageToast.show("Data saved.");
                                    oTable.clearSelection();          // reset UI
                                    oItemModel.refresh(true);
                                    resolve("Saved");
                                } catch (e) {
                                    sap.m.MessageBox.error("Save failed: " + (e.message || e));
                                    resolve("Error");
                                } finally {
                                    sap.ui.core.BusyIndicator.hide();
                                }
                            }
                        }
                    );
                });
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
                                                <td colspan="3">${rowData.weight} Kgs/ ${rowData.qtylitre} lakhs</td>
                                                </tr>
                
                                                 <tr>
                                    <td class="label-section">AIS GRADE</td>
                                    <td colspan="3">${rowData.grageais} </td>
                                    </tr>
                                    <tr>
                                    <td class="label-section">ATS GRADE</td>
                                    <td>${rowData.gradeats}</td>
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
