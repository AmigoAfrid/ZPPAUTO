sap.ui.define(
    [
        "zautodesignapp/controller/ais/transaction/aisbasecontroller",
        "sap/ui/core/mvc/Controller",
        "sap/ui/core/IconPool",
        "sap/ui/model/json/JSONModel",
        "sap/ui/core/Component",
        "sap/ui/core/UIComponent",
        "zautodesignapp/util/jspdf/html2canvasmin",
        "zautodesignapp/util/jspdf/jspdfmin",
        "sap/m/routing/Router"

    ],
    function (BaseController, IconPool, JSONModel, UIComponent, Component, Router) {
        "use strict";

        return BaseController.extend("zautodesignapp.controller.ais.transaction.ais_selectrange", {
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
            },

            Goaisselect: function () {
                // Extract header data
                const headerData = this.aisModel.getProperty("/HeaderData/0");
                console.log("Selected Date Range:", headerData.daterange);
                console.log("Machine no:", headerData.selectedMachine);

                let Dates = headerData.daterange;
                let machineno = headerData.selectedMachine;

                let bHasDate = Dates && Dates.trim() !== "";
                const bHasMachine = machineno && machineno.trim() !== "";

                if (!bHasDate || !bHasMachine) {
                    sap.m.MessageBox.warning("Please enter a Date Range and Machine No");
                    return false;
                }

                // Make the table visible
                this.aisModel.setProperty("/TableVisible", true);

                let FromDate = "", ToDate = "";
                if (bHasDate) {
                    const myArray = Dates.split(" - ");
                    const datefrom = new Date(myArray[0]);
                    const dateto = new Date(myArray[1]);
                    FromDate = new Date(datefrom.getTime() - (datefrom.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
                    ToDate = new Date(dateto.getTime() - (dateto.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
                }

                // Filter logic
                let FinalFilter = [];
                if (bHasDate) {
                    FinalFilter.push(new sap.ui.model.Filter("CreationDate", sap.ui.model.FilterOperator.BT, FromDate, ToDate));
                }

                if (bHasMachine) {
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
                                const tabModel = new sap.ui.model.json.JSONModel({
                                    ItemData: aAllItems
                                });
                                that.getView().setModel(tabModel, "TabModel");
                                that.getView().setBusy(false);
                                console.log("All AIS items loaded:", aAllItems.length);
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

            OnAisCheck: function () {

                if (!this.ChFrag) {
                    this.ChFrag = sap.ui.xmlfragment(this.getView().getId("id_aismachine"), "zautodesignapp.view.ais.transaction.fragment.valuehelp", this);
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

                var sUpdatedMachineNo = "AIS" + sSelectedMachineNo;
                if (this.aisModel) {
                    this.aisModel.setProperty("/HeaderData/0/selectedMachine", sUpdatedMachineNo); // Update model property
                } else {
                    console.error("atsModel not found.");
                }

                // Close the dialog
                this.ChFrag.close();

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
                    const saisshift = oControl.getSelectedKey();
                    oCtx.setProperty("aisshift", saisshift || "");
                }

                // // Check duplicate date+aisshift
                // const oRowDate = oCtx.getProperty("zdate");
                // const oRowaisshift = (oCtx.getProperty("aisshift") || "").trim();

                // if (oRowDate && oRowaisshift) {
                //     const aRows = oModel.getProperty("/Datassitem") || [];
                //     const iCurrentIndex = Number(sPath.split("/").pop());

                //     const bDuplicate = aRows.some((row, idx) => {
                //         if (idx === iCurrentIndex) return false;
                //         if (!row.zdate || !row.aisshift) return false;

                //         const sameDate = new Date(row.zdate).setHours(0, 0, 0, 0) ===
                //             new Date(oRowDate).setHours(0, 0, 0, 0);
                //         const sameaisshift = row.aisshift.trim() === oRowaisshift;

                //         return sameDate && sameaisshift;
                //     });

                //     if (bDuplicate) {
                //         sap.m.MessageToast.show("Duplicate Date & aisshift detected – row cleared.");
                //         ["zdate", "aisshift"].forEach(p => oCtx.setProperty(p, null));
                //     }
                // }

                oModel.refresh(true);
            },

            onBoxNoChange: function (oEvent) {
                const oInput = oEvent.getSource();
                const oContext = oInput.getBindingContext("TabItemModel");

                if (!oContext) {
                    console.warn("No binding context found.");
                    return;
                }

                const sNewBoxNo = oInput.getValue().trim();
                if (!sNewBoxNo) return; // Ignore empty input

                const oModel = this.getView().getModel("TabItemModel");
                const aRows = oModel.getProperty("/Datassitem") || [];

                const sPath = oContext.getPath(); // e.g. "/Datassitem/2"
                const currentIndex = parseInt(sPath.split("/").pop(), 10);

                // Check if any other row has the same box number
                const isDuplicate = aRows.some((item, index) => {
                    return index !== currentIndex && item.boxno && item.boxno.trim() === sNewBoxNo;
                });

                if (isDuplicate) {
                    // Clear only the current box number
                    oModel.setProperty(sPath + "/boxno", "");
                    sap.m.MessageBox.warning("Box Number must be unique. The value '" + sNewBoxNo + "' already exists.");
                }
            },

            onUpdateItemDataAIS: async function () {
                sap.ui.core.BusyIndicator.show(0);

                const oTable = this.byId("idqa01processcreen"); // AIS table
                const oBufModel = this.getView().getModel("TabItemModel");

                // Get all rows data
                const aRows = oBufModel.getProperty("/Datassitem") || [];

                // Filter out rows that are selected
                const aSelectedRows = aRows.filter((row) => row.selected);

                if (!aSelectedRows.length) {
                    sap.ui.core.BusyIndicator.hide();
                    sap.m.MessageToast.show("Please select at least one row to update.");
                    return;
                }

                // Per-row required-field validation
                const REQUIRED = [
                    { key: "qaname", label: "QA Name" },
                    { key: "operatorname", label: "Operator Name" },
                    { key: "aismachineno", label: "AIS Machine NO" },
                ];

                const aMissing = aSelectedRows.map((row, idx) => {
                    const miss = REQUIRED
                        .filter(f => !row[f.key] && row[f.key] !== 0)
                        .map(f => f.label);

                    // Extra logic: If shift = "C" then floorwastage must be entered
                    if (row.aisshift === "C") {
                        if (!row.floorwaste || row.floorwaste === 0 || row.floorwaste === "0.00") {
                            miss.push("Enter the shift C Floor Wastage");
                        }
                    }
                    return miss.length ? { idx, miss } : null;
                }).filter(Boolean);

                if (aMissing.length) {
                    const txt = aMissing.map(r =>
                        "Row " + (r.idx + 1) + ": " + r.miss.join(", ")
                    ).join("\n");

                    sap.ui.core.BusyIndicator.hide();
                    sap.m.MessageBox.error("Fill the following before posting:\n\n" + txt);
                    return;
                }

                if (aSelectedRows[0].grageais === "D") {
                    if (!aSelectedRows[0].weight || aSelectedRows[0].weight === "0" || aSelectedRows[0].weight === "0.00" || aSelectedRows[0].weight === "0.000") {
                        sap.m.MessageBox.error("Please Enter the weight");
                        sap.ui.core.BusyIndicator.hide();
                        return;
                    }
                }

                const oSrvModel = this.getView().getModel("ZSB_AU_QA02_ITEM");
                const that = this;

                // Show confirmation dialog
                sap.ui.core.BusyIndicator.hide(); // Hide before dialog to avoid freezing
                sap.m.MessageBox.warning("Do you want to post this data?", {
                    actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
                    emphasizedAction: sap.m.MessageBox.Action.YES,
                    onClose: async function (sAction) {
                        if (sAction === sap.m.MessageBox.Action.YES) {
                            sap.ui.core.BusyIndicator.show(0); // Show again before update begins

                            try {
                                await that.ToUpdateFunction(aSelectedRows);

                                // ✅ After successful update: unselect checkboxes
                                const aAllRows = oBufModel.getProperty("/Datassitem") || [];
                                aAllRows.forEach(row => {
                                    row.selected = false;
                                });
                                oBufModel.setProperty("/Datassitem", aAllRows);

                                sap.m.MessageBox.show("Data Updated Successfully...");
                            } catch (err) {
                                console.error("Error during update:", err);
                                sap.m.MessageBox.error("One or more updates failed.");
                            } finally {
                                sap.ui.core.BusyIndicator.hide();
                            }
                        } else {
                            sap.m.MessageBox.information("Data Update Cancelled.");
                        }
                    }
                });
            },

            /* Function to handle the data update */
            ToUpdateFunction: async function (rowData) {
                const that = this;
                const oModelGet = that.getView().getModel("ZSB_AU_QA02_ITEM");

                // Set headers once (outside the loop)
                oModelGet.setHeaders({
                    "X-Requested-With": "X",
                    "Content-Type": "application/json"
                });

                const updatePromises = [];

                for (let i = 0; i < rowData.length; i++) {
                    const row = rowData[i];

                    const aiswatage = (row.grageais === 'D') ? row.aiswastage : row.atsweight;

                    const Header = {
                        zaisdate: row.zdate ? new Date(new Date(row.zdate).toLocaleDateString('en-CA')) : new Date(),
                        averagewt: row.averagewt,
                        atsweight: row.atsweight,
                        weight: row.weight,
                        cumqty: row.cumqty,
                        aiswastage: aiswatage,
                        qtylitre: row.qtylitre,
                        agradeqty: row.agradeqty,
                        cumulativeentry: row.cumulativeentry,
                        remarks: row.remarks,
                        hfx: row.hfx,
                        floorwaste: row.floorwaste,
                        qaname: row.qaname,
                        operatorname: row.operatorname,
                        aismachineno: row.aismachineno,
                        wastageinlac : row.wastageinlac,
                    };

                    const id = row.sap_uuid;

                    const updatePromise = new Promise((resolve, reject) => {
                        oModelGet.update("/ZC_AU_QA02ITEM('" + id + "')", Header, {
                            success: function () {
                                console.log("Updated successfully for SAP UUID:", id);
                                resolve();
                            },
                            error: function (error) {
                                console.error("Error updating item:", error);
                                sap.m.MessageToast.show("Goods Issue Doc No - Internal table update failed");
                                reject(error);
                            }
                        });
                    });

                    updatePromises.push(updatePromise);
                }

                return Promise.all(updatePromises);
            },


            onAisWeightChange: function (oEvent) {
                const oInput = oEvent.getSource();
                const oCtx = oInput.getBindingContext("TabItemModel");
                if (!oCtx) {
                    console.warn("No binding context.");
                    return;
                }

                /* --- 1. Persist the edited AIS weight ------------------------ */
                const sRowPath = oCtx.getPath();       // "/Datassitem/2"
                const oModel = oCtx.getModel();
                const sVal = (oInput.getValue() || "").trim();
                const fVal = sVal === "" ? "" : (parseFloat(sVal) || 0);

                oModel.setProperty(
                    `${sRowPath}/weight`,
                    fVal === "" ? "" : fVal.toFixed(3)
                );

                /* --- 2. Loop through every row ------------------------------- */
                const aRows = oModel.getProperty("/Datassitem") || [];
                let runningTot = 0;
                let encounteredBlank = false;

                console.log("🔎 Recalculating values for each row...");

                aRows.forEach(function (row, index) {
                    const aisW = parseFloat(row.weight);
                    const hasAIS = !isNaN(aisW);

                    /* Cum Qty — only up to last filled row */
                    if (!encounteredBlank && hasAIS) {
                        runningTot += aisW;
                        row.cumqty = runningTot.toFixed(3);
                    } else {
                        encounteredBlank = true;
                        row.cumqty = "";
                    }

                    /* AIS Wastage = atsweight − AIS Weight */
                    const atsweight = parseFloat(row.atsweight);
                    const aisweight = parseFloat(row.weight);
                    if (aisW > atsweight) {
                        // Set AIS Weight to 0.00 and show an error message
                        row.weight = "0.000";
                        sap.m.MessageBox.error("AIS Weight Should not greater than ATS Weight");
                    }





                    if (!isNaN(atsweight) && !isNaN(aisW)) {
                        const wastage = atsweight - aisW;
                        row.aiswastage = wastage.toFixed(3);
                    } else {
                        row.aiswastage = "";
                    }


                    
                      const wastageNum = parseFloat(row.aiswastage);
                        const avgWtForLakh = parseFloat(row.averagewt);
                        if (!isNaN(wastageNum) && !isNaN(avgWtForLakh) && avgWtForLakh !== 0) {
                            const wastageInLac = (wastageNum / avgWtForLakh) * 10;
                            row.wastageinlac = wastageInLac.toFixed(4);
                        } else {
                            row.wastageinlac = "";
                        }

                    /* Qty in L = (weight / averagewt) × 10 — 2 dec */
                    const avgWt = parseFloat(row.averagewt);
                    if (!isNaN(aisW) && !isNaN(avgWt) && avgWt !== 0) {
                        const qtyL = (aisW / avgWt) * 10;
                        row.qtylitre = qtyL.toFixed(2);
                    } else {
                        row.qtylitre = "";
                    }

                    /* A-Grade Qty = (weight / averagewt) × 10 — 3 dec */
                    let aGrade = NaN;
                    if (!isNaN(aisW) && !isNaN(avgWt) && avgWt !== 0) {
                        aGrade = (aisW / avgWt) * 10;
                        row.agradeqty = aGrade.toFixed(2);
                    } else {
                        row.agradeqty = "";
                    }

                    /* HFX = A-Grade Qty (same 3-dec format) */
                    // row.hfx = row.agradeqty !== "" ? row.agradeqty : "";

                    /* Cumulative Entry = atsweight + A-Grade Qty — 3 dec */
                    const aGradeNum = parseFloat(row.agradeqty);
                    if (!isNaN(atsweight) && !isNaN(aGradeNum)) {
                        const cumEntry = atsweight + aGradeNum;
                        row.cumulativeentry = cumEntry.toFixed(3);
                    } else {
                        row.cumulativeentry = "";
                    }

                    /* ---- Console log result for this row ------------------- */
                    console.log(`Row ${index + 1}:`, {
                        "AIS Weight": isNaN(aisW) ? "-" : aisW.toFixed(3),
                        "atsweight": isNaN(atsweight) ? "-" : atsweight.toFixed(3),
                        "Cumulative QTY": row.cumqty || "-",
                        "AIS Wastage": row.aiswastage || "-",
                        "Qty in L": row.qtylitre || "-",
                        "A Grade Qty": row.agradeqty || "-",
                        "HFX": row.hfx || "-",
                        "Cumulative Entry": row.cumulativeentry || "-",

                    });
                });

                /* --- 3. Push all updates at once ----------------------------- */
                oModel.setProperty("/Datassitem", aRows);
                oModel.refresh(true);
            },

            //---------------- Start Goods Issue post --------------------------------------
            ToComponentFragOpen: async function (oEvent) {
                // OnApiPost_MatDoc

                const input = oEvent.getSource(); // the Input field
                const context = input.getBindingContext("TabItemModel");
                let getHeaderData = this.screen2headermodel.getProperty("/HEADERDATA/");
                let Screen1SelectHeaderdata = this.SelectScreen1Data;

                if (context) {
                    const rowPath = context.getPath();
                    const rowData = context.getObject();

                    // if (rowData.zaisdate === null || rowData.zaisdate === "") {
                    //     sap.m.MessageToast.show("Please select Date");
                    //     return
                    // }

                    if (rowData.grageais === 'D') {
                        var aiswastage = rowData.aiswastage
                    } else {
                        var aiswastage = rowData.atsweight
                    }

                    const aFilters = [
                        // new sap.ui.model.Filter("ProcessOrder", sap.ui.model.FilterOperator.EQ, "00"+rowData.processorder),
                        // new sap.ui.model.Filter("dips_qty_lakh", sap.ui.model.FilterOperator.EQ, rowData.dipsqtylakh),
                        // new sap.ui.model.Filter("cap_cut_qty", sap.ui.model.FilterOperator.EQ, rowData.capcutqty),
                        // new sap.ui.model.Filter("body_cut_qty", sap.ui.model.FilterOperator.EQ, rowData.bodycutqty),
                        // new sap.ui.model.Filter("cap_cake_qty", sap.ui.model.FilterOperator.EQ, rowData.capcakeqty),
                        // new sap.ui.model.Filter("body_cake_qty", sap.ui.model.FilterOperator.EQ, rowData.bodycakeqty),
                        // new sap.ui.model.Filter("hfx", sap.ui.model.FilterOperator.EQ, rowData.hfx),
                        // new sap.ui.model.Filter("wastage", sap.ui.model.FilterOperator.EQ, rowData.wastage),
                        // new sap.ui.model.Filter("floor_wastage", sap.ui.model.FilterOperator.EQ, rowData.floorwastage)

                        new sap.ui.model.Filter("ProcessOrder", sap.ui.model.FilterOperator.EQ, "00" + rowData.processorder),
                        new sap.ui.model.Filter("hfx", sap.ui.model.FilterOperator.EQ, rowData.hfx),
                        new sap.ui.model.Filter("floor_wastage", sap.ui.model.FilterOperator.EQ, rowData.floorwaste),
                        new sap.ui.model.Filter("wastage", sap.ui.model.FilterOperator.EQ, aiswastage)
                    ];

                    const UPDATE_DIPS_MODEL = this.getView().getModel("ZCE_AIS_BATCH_RUN_SRVB");
                    let ToFetchUpdateDips = await this.ToFetchUpdateDips(UPDATE_DIPS_MODEL, rowData, aFilters);

                    this.CompDipsModel = new sap.ui.model.json.JSONModel({
                        Datatabitem: ToFetchUpdateDips.results
                    });

                    this.getView().setModel(this.CompDipsModel, "CompDipsModel");
                    //debugger

                    this.ComponentMatoEvent = oEvent
                    sap.ui.core.BusyIndicator.hide();
                    if (!this.tableitemfrag) {
                        this.tableitemfrag = sap.ui.xmlfragment(this.getView().getId("tableiteais"), "zautodesignapp.view.ais.transaction.fragment.tableitemhelp", this);
                        this.getView().addDependent(this.tableitemfrag);
                    }
                    this.tableitemfrag.open();

                }

            },

            onQualitySubmit: async function (oEventComp) {
                console.log("this.ComponentMatoEvent:", this.ComponentMatoEvent)
                this.OnApiPost_MatDoc_GI(this.ComponentMatoEvent)
            },

            onTableitemCancel: async function (oEventComp) {
                this.tableitemfrag.close();
            },
            OnClose: function () {
                this.ChFrag.close();
            },


            //  old api logic start 

            OnApiPost_MatDoc_GI: async function (oEvent) {

                sap.ui.core.BusyIndicator.show();
                this.OEvent = oEvent;
                var that = this; // Preserve the reference to the controller
                var CountoModel = this.getView().getModel("ZAU_FT_PROCESSORDER_SRVB_");
                let getHeaderData = this.screen2headermodel.getProperty("/HEADERDATA/");
                //let getItemData = this.tabModels.getProperty("/ItemDatas/");

                var oFilter1 = new sap.ui.model.Filter("ManufacturingOrder", sap.ui.model.FilterOperator.EQ, getHeaderData.ManufacturingOrder);
                var oFilter2 = new sap.ui.model.Filter("OperationControlProfile", sap.ui.model.FilterOperator.EQ, "YBP4");

                CountoModel.read("/ZC_FT_PROCESSORDEROPERATION", {
                    filters: [oFilter1, oFilter2],
                    success: async function (OData) {
                        console.log("YBP4:", OData)

                        if (OData.results.length > 0) { // Validation for YPB4 length. just
                            let ManufacturingOrderOperation = OData.results[0].ManufacturingOrderOperation
                            let GR_NO = await that.ToConfirmIssueAPIPost(ManufacturingOrderOperation)


                            // Updating the FTP - Goods Issue Doc no in Custom Table
                            //getHeaderData.goods_issue = GR_NO[0].materialdocument;
                            // getHeaderData.confirmationcount = GR_NO[0].confirmationcount;
                            // getHeaderData.confirmationgroup = GR_NO[0].confirmationgroup;
                            that.screen2headermodel.refresh()

                            // var Header = {
                            //     //gi_updatedat: new Date(),
                            //     // gi_updatedby: that.TENTUSERID,
                            //     // goods_issue: GR_NO[0].materialdocument,
                            //     confirmationcount: GR_NO[0].confirmationcount,
                            //     confirmationgroup: GR_NO[0].confirmationgroup
                            // };


                            // let ErrorMessage = "Some error occured while posting. Please check order..."
                            // if (GR_NO[0].confirmationcount === "" || GR_NO[0].confirmationgroup === "") {
                            //     try {
                            //         var kk = JSON.parse(GR_NO[0].errorresponse);
                            //         ErrorMessage = kk.error.message.value;
                            //     } catch {
                            //         ErrorMessage = kk.error.message.value;
                            //     } finally {
                            //         ErrorMessage = kk.error.message.value;
                            //     }

                            //     // sap.m.MessageBox.error(ErrorMessage)
                            //     sap.m.MessageBox.error(ErrorMessage, {
                            //         title: "Process Failed",
                            //         contentWidth: "100px",
                            //     });
                            //     // Updating the button function after store the custom table


                            // } else {
                            //     await that.ToUpdateIntTab(getHeaderData, Header) // Update the Goods Issue Doc No in internal table base on Ref Doc No
                            //     sap.m.MessageBox.success("Process order confirmed and materials issued successfully...")
                            //     that.FinalStatus = new sap.ui.model.json.JSONModel({
                            //         MSGSTRIP: {
                            //             "visible": true,
                            //             "text": "Confirmation count and group : " + GR_NO[0].confirmationcount + " " + GR_NO[0].confirmationgroup,
                            //             "type": 'Success'
                            //         }
                            //     });
                            //     that.getView().setModel(that.FinalStatus, "FinalStatus")
                            // }
                            sap.ui.core.BusyIndicator.hide();
                        } else {
                            sap.m.MessageBox.error("YBP4 data not found...")
                            // Updating the button function after store the custom table


                            sap.ui.core.BusyIndicator.hide();
                        }

                    },
                    error: function (error) {
                        console.log(error)
                        sap.ui.core.BusyIndicator.hide();
                    }

                });

            },



            ToConfirmIssueAPIPost: async function (ManufacturingOrderOperation) {
                sap.ui.core.BusyIndicator.show();
                const input = this.OEvent.getSource(); // the Input field
                const context = input.getBindingContext("TabItemModel");
                const oHeader = this.getView().getModel("screen2model");
                let getHeaderData = oHeader.getProperty("/HEADERDATA/")
                //let ManufacturingOrderOperation = ManufacturingOrderOperation;
                // debugger
                if (context) {
                    const rowPath = context.getPath();
                    const rowData = context.getObject();
                    let getHeaderData = this.screen2headermodel.getProperty("/HEADERDATA/");
                    //let getItemDatas = this.TabModel.getProperty("/ItemData/");
                    let getcomponentdata = this.CompDipsModel.getProperty("/Datatabitem");
                    //console.log("getItemDatas",getItemDatas)
                    //var oModelGets = this.getView().getModel("ZPROC_HEAD_CONF_AIS_SRB");
                    let PostArrs = [];
                    for (let i = 0; i < getcomponentdata.length; i++) {
                        PostArrs.push({
                            processorder: getcomponentdata[i].ProcessOrder,
                            sap_uid: "",
                            ordertype: getcomponentdata[i].ordertype,
                            material: getcomponentdata[i].material,
                            plant: getcomponentdata[i].plant,
                            batch: getcomponentdata[i].batch,
                            quantityinentryunit: getcomponentdata[i].quantity,
                            entryunit: getcomponentdata[i].base_unit,
                            goodsmovementtype: getcomponentdata[i].movement_type,
                            storagelocation: getcomponentdata[i].storage_location,

                        });
                    }

                    console.log("PostArrs:", PostArrs);


                    // Now remove duplicates based on the 'Material' field

                    const that = this;
                    sap.ui.core.BusyIndicator.hide();
                    sap.m.MessageBox.warning("Do you want to post this data.", {
                        actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
                        emphasizedAction: sap.m.MessageBox.Action.YES,
                        onClose: async function (sAction) {
                            if (sAction === "YES") {
                                sap.ui.core.BusyIndicator.show();

                                try {

                                    const oModelGet = that.getView().getModel("ZPROC_HEAD_CONF_AIS_SRB");
                                    const oItemSrv_qa02 = that.getView().getModel("ZSB_AU_QA03_ITEM");

                                    function formatDecimal(value) {
                                        return parseFloat(value).toFixed(3);
                                    }


                                    var opconfirmedworkquantity2 = formatDecimal(
                                        (getHeaderData.WorkCenterStandardWorkQty2 * getHeaderData.OpPlannedYieldQuantity) / getHeaderData.OperationReferenceQuantity
                                    );

                                    var opconfirmedworkquantity3 = formatDecimal(
                                        (getHeaderData.WorkCenterStandardWorkQty3 * getHeaderData.OpPlannedYieldQuantity) / getHeaderData.OperationReferenceQuantity
                                    );

                                    var opconfirmedworkquantity4 = formatDecimal(
                                        (getHeaderData.WorkCenterStandardWorkQty4 * getHeaderData.OpPlannedYieldQuantity) / getHeaderData.OperationReferenceQuantity
                                    );

                                    var confirmationyieldquantity = formatDecimal(getHeaderData.OpPlannedYieldQuantity);
                                    var opconfirmedworkquantity1 = formatDecimal(getHeaderData.WorkCenterStandardWorkQty1);

                                    var oEntry = {


                                        processorder: getHeaderData.ManufacturingOrder,
                                        sap_uid: "",
                                        materialdocument: "",
                                        matdocyear: "",
                                        orderoperation: ManufacturingOrderOperation,
                                        ordersuboperation: "0000",
                                        ordertype: getHeaderData.ordertype,
                                        confirmationyieldquantity: confirmationyieldquantity,
                                        opconfirmedworkquantity1: opconfirmedworkquantity1,
                                        opworkquantityunit1: getHeaderData.WorkCenterStandardWorkQtyUnit1,
                                        opconfirmedworkquantity2: opconfirmedworkquantity2,
                                        opworkquantityunit2: getHeaderData.WorkCenterStandardWorkQtyUnit2,
                                        opconfirmedworkquantity3: opconfirmedworkquantity3,
                                        opworkquantityunit3: getHeaderData.WorkCenterStandardWorkQtyUnit3,
                                        opconfirmedworkquantity4: opconfirmedworkquantity4,
                                        opworkquantityunit4: getHeaderData.WorkCenterStandardWorkQtyUnit4,
                                        //isfinalconfirmation :  "X",
                                        tcode: 'AIS',
                                        toitem: PostArrs


                                    };
                                    console.log("oEntryoEntry:", oEntry);

                                    let ToAPIPOstTab = await that.ToAPIPOstTab_GI(oModelGet, oEntry);
                                    if (ToAPIPOstTab.errorresponse !== "") {
                                        try {
                                            // Parse the error response (assuming JSON format)
                                            var oResponse = JSON.parse(ToAPIPOstTab.errorresponse);
                                            if (oResponse.error && oResponse.error.message) {
                                                var errorMessage = oResponse.error.message.value;
                                                console.log("Error: " + errorMessage);

                                                // You can now use this error message in a pop-up or display it to the user
                                                // For example, using a MessageToast:
                                                sap.m.MessageToast.show(errorMessage);
                                                sap.m.MessageBox.error(errorMessage);
                                                return
                                            } else {
                                                console.log("Unknown error: ", ToAPIPOstTab);
                                                sap.m.MessageToast.show("An unknown error occurred.");
                                                return
                                            }
                                        } catch (e) {
                                            // In case of parsing errors
                                            console.error("Error in parsing OData error response: ", e);
                                            return
                                        }

                                    } else {

                                        // var Header = {
                                        //     //gi_updatedat: new Date(),
                                        //     // gi_updatedby: that.TENTUSERID,
                                        //     // goods_issue: GR_NO[0].materialdocument,
                                        //     confirmationcount: GR_NO[0].confirmationcount,
                                        //     confirmationgroup: GR_NO[0].confirmationgroup
                                        // };


                                        let ToUpdateIntTab = await that.ToUpdateIntTab_GI(rowData, ToAPIPOstTab);

                                        let ToPOSTQa02ItemTab = await that.ToPOSTQa02ItemTab(oItemSrv_qa02, getHeaderData, rowData);


                                        const oItemsModel = that.getView().getModel("ZSB_AU_QA02_ITEM");
                                        let sOrder = rowData.processorder
                                        let sBatch = rowData.batch
                                        // debugger
                                        const aItems = await that.ProOrderItemFetch(oItemsModel, sOrder, sBatch);

                                        that.tabItemModel = new sap.ui.model.json.JSONModel({
                                            Datassitem: aItems
                                        });
                                        that.getView().setModel(that.tabItemModel, "TabItemModel");
                                        that.tabItemModel.refresh(that);
                                        sap.m.MessageBox.success(
                                            "Material Document: " + ToAPIPOstTab.materialdocument +
                                            ", Confirmation Count: " + ToAPIPOstTab.confirmationcount +
                                            ", Confirmation Group: " + ToAPIPOstTab.confirmationgroup
                                        );
                                        that.FinalStatus = new sap.ui.model.json.JSONModel({
                                            MSGSTRIP: {
                                                "visible": true,
                                                "text": "Material Document No " + ToAPIPOstTab.confirmationgroup + ToAPIPOstTab.confirmationcount,
                                                "type": 'Success'
                                            }
                                        });
                                        that.getView().setModel(that.FinalStatus, "FinalStatus")
                                        that.tableitemfrag.close();
                                    }



                                } catch (error) {
                                    console.error("Error in OnApiPost_MatDoc_GI:", error);
                                    sap.m.MessageBox.error("An error occurred during posting.");
                                } finally {
                                    sap.ui.core.BusyIndicator.hide();
                                }
                            } else {
                                sap.m.MessageToast.show("Cancelled");
                            }
                        }
                    });
                }
            },

            // ToFetchUpdateDips_GI: function (UPDATE_DIPS_MODEL, rowData, oFilterProOrd1) {
            //     return new Promise(function (resolve, reject) {
            //         // var that = this;
            //         sap.ui.core.BusyIndicator.show(); // Show busy indicator

            //         try {
            //             UPDATE_DIPS_MODEL.read("/zce_ats_batch_run", {
            //                 filters: [oFilterProOrd1],
            //                 success: function (oData) {
            //                     // sap.ui.core.BusyIndicator.hide(); // Hide busy indicator on success
            //                     resolve(oData);
            //                 },
            //                 error: function (error) {
            //                     console.log("Error:", error);
            //                     sap.ui.core.BusyIndicator.hide(); // Hide busy indicator on error
            //                     reject(error);
            //                 }
            //             });

            //         } catch (error) {
            //             resolve([])
            //         }
            //     });
            // },

            ToAPIPOstTab_GI: function (oModelGet, oEntry) {
                return new Promise((resolve, reject) => {
                    sap.ui.core.BusyIndicator.show();
                    try {
                        oModelGet.setHeaders({
                            "X-Requested-With": "X",
                            "Content-Type": "application/json"
                        });

                        oModelGet.create("/header", oEntry, {
                            success: function (oData, oResponse) {
                                console.log("Response from create:", oData);
                                resolve(oData);
                            },
                            error: function (error) {
                                console.log("Error in create:", error);
                                sap.m.MessageBox.error("Process Failed...");
                                reject(error);
                            }
                        });
                    } catch (error) {
                        console.error("Exception in ToAPIPOstTab:", error);
                        reject(error);
                    }
                });
            },

            ToUpdateIntTab_GI: function (rowData, ToAPIPOstTab) {
                return new Promise((resolve, reject) => {
                    sap.ui.core.BusyIndicator.show();
                    try {
                        const that = this;
                        const oModelGet = that.getView().getModel("ZSB_AU_QA02_ITEM");
                        oModelGet.setHeaders({
                            "X-Requested-With": "X",
                            "Content-Type": "application/json"
                        });

                        const Header = {
                            materialdocumentno_gi: ToAPIPOstTab.materialdocument,
                            materialdocumentyear_gi: ToAPIPOstTab.matdocyear,
                            confirmationgroup: ToAPIPOstTab.confirmationgroup,
                            confirmationcount: ToAPIPOstTab.confirmationcount,
                        };

                        const id = rowData.sap_uuid;

                        oModelGet.update("/ZC_AU_QA02ITEM('" + id + "')", Header, {
                            success: function (oData, oResponse) {
                                console.log("Goods Issue No Updated Successfully...");
                                resolve(oData);
                            },
                            error: function (error) {
                                console.log("Error updating item:", error);
                                sap.m.MessageToast.show("Goods Issue Doc No - Internal table update failed");
                                reject(error);
                            }
                        });
                    } catch (error) {
                        console.error("Exception in ToUpdateIntTab:", error);
                        reject(error);
                    }
                });
            },

            // old api logic end


            //---------------- End Goods Issue POST ------------------------------------------

            //---------------- Start Goods Issue post --------------------------------------

            // OnApiPost_MatDoc_GR: async function (oEvent) {
            //     sap.ui.core.BusyIndicator.show();
            //     const input = oEvent.getSource(); // the Input field
            //     const context = input.getBindingContext("TabItemModel");
            //     const oHeader = this.getView().getModel("screen2model");
            //     let getHeaderData = oHeader.getProperty("/HEADERDATA/")
            //     // debugger
            //     if (context) {
            //         const rowPath = context.getPath();
            //         const rowData = context.getObject();

            //         if (rowData.averagewt > 0) {
            //             var weight001 = (rowData.weight / rowData.averagewt) * 10
            //         } else {
            //             var weight001 = rowData.agradeqty
            //         }


            //         // debugger
            //         // let oFilterProOrd1 = new sap.ui.model.Filter("ProcessOrder", sap.ui.model.FilterOperator.EQ, "00"+rowData.processorder);

            //         // const UPDATE_DIPS_MODEL = this.getView().getModel("ZAU_ACM_UPDATE_DIPS_SRVB");
            //         // let ToFetchUpdateDips = await this.ToFetchUpdateDips(UPDATE_DIPS_MODEL, rowData, oFilterProOrd1);
            //         // debugger

            //         const that = this;
            //         sap.ui.core.BusyIndicator.hide();
            //         sap.m.MessageBox.warning("Do you want to post this data.", {
            //             actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
            //             emphasizedAction: sap.m.MessageBox.Action.YES,
            //             onClose: async function (sAction) {
            //                 if (sAction === "YES") {
            //                     sap.ui.core.BusyIndicator.show();

            //                     try {

            //                         const oModelGet = that.getView().getModel("ZAIS_FT_GR_SRVB");
            //                         const oItemSrv_qa02 = that.getView().getModel("ZSB_AU_QA03_ITEM");

            //                         const oEntry = {
            //                             // Postingdate: new Date(),
            //                             // Goodsmovementcode: "03",
            //                             // Materialdocument: "",
            //                             // Matdocyear: "2025",

            //                             manufacturingorder: getHeaderData.ManufacturingOrder,
            //                             postingdate: new Date(),
            //                             goodsmovementcode: '02',
            //                             material: getHeaderData.Product,
            //                             plant: getHeaderData.ProductionPlant,
            //                             storagelocation: getHeaderData.StorageLocation,
            //                             goodsmovementtype: '101',
            //                             manufacturedate: new Date(),
            //                             goodsmovementrefdoctype: 'F',
            //                             quantityinentryunit: String(weight001.toFixed(2)),
            //                             // quantityinentryunit: parseFloat(weight001.toFixed(2)),


            //                         };

            //                         console.log("oEntry:", oEntry);

            //                         let ToAPIPOstTab = await that.ToAPIPOstTab_GR(oModelGet, oEntry);
            //                         let ToUpdateIntTab = await that.ToUpdateIntTab_GR(rowData, ToAPIPOstTab);
            //                         // let ToPOSTQa02ItemTab = await that.ToPOSTQa02ItemTab(oItemSrv_qa02, getHeaderData, rowData);


            //                         const oItemsModel = that.getView().getModel("ZSB_AU_QA02_ITEM");
            //                         let sOrder = rowData.processorder
            //                         let sBatch = rowData.batch
            //                         //debugger
            //                         const aItems = await that.ProOrderItemFetch(oItemsModel, sOrder, sBatch);

            //                         that.tabItemModel = new sap.ui.model.json.JSONModel({
            //                             Datassitem: aItems
            //                         });
            //                         that.getView().setModel(that.tabItemModel, "TabItemModel");
            //                         that.tabItemModel.refresh(that);
            //                         sap.m.MessageBox.success("Material Document Generated..." + ToAPIPOstTab.materialdocument);
            //                     } catch (error) {
            //                         console.error("Error in OnApiPost_MatDoc_GI:", error);

            //                                                 let errMsg = "An error occurred";

            //                 try {
            //                     // For SAPUI5 OData V2 the backend error is inside responseText
            //                     if (error?.responseText) {
            //                         const parsed = JSON.parse(error.responseText);
            //                         errMsg = parsed?.error?.message?.value || errMsg;
            //                     }
            //                 } catch (e) {
            //                     console.warn("Error parsing backend message:", e);
            //                 }

            //                 sap.m.MessageBox.error(errMsg);
            //                         //sap.m.MessageBox.error("An error occurred during posting.");
            //                     } finally {
            //                         sap.ui.core.BusyIndicator.hide();
            //                     }
            //                 } else {
            //                     sap.m.MessageToast.show("Cancelled");
            //                 }
            //             }
            //         });
            //     }
            // },



            OnApiPost_MatDoc_GR: async function (oEvent) {

    sap.ui.core.BusyIndicator.show();
    const input = oEvent.getSource();
    const context = input.getBindingContext("TabItemModel");
    const oHeader = this.getView().getModel("screen2model");
    let getHeaderData = oHeader.getProperty("/HEADERDATA/");

    if (!context) return;

    const rowData = context.getObject();

    let weight001 = rowData.averagewt > 0
        ? (rowData.weight / rowData.averagewt) * 10
        : rowData.agradeqty;

    sap.ui.core.BusyIndicator.hide();

    sap.m.MessageBox.warning("Do you want to post this data.", {
        actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
        emphasizedAction: sap.m.MessageBox.Action.YES,

        onClose: async (sAction) => {

            if (sAction !== "YES") {
                sap.m.MessageToast.show("Cancelled");
                return;
            }

            sap.ui.core.BusyIndicator.show();

            try {
                // Models
                const oModelGet = this.getView().getModel("ZAIS_FT_GR_SRVB");
                const oItemSrv_qa02 = this.getView().getModel("ZSB_AU_QA03_ITEM");

                // Prepare payload
                const oEntry = {
                    manufacturingorder: getHeaderData.ManufacturingOrder,
                    postingdate: new Date(),
                    goodsmovementcode: "02",
                    material: getHeaderData.Product,
                    plant: getHeaderData.ProductionPlant,
                    storagelocation: getHeaderData.StorageLocation,
                    goodsmovementtype: "101",
                    manufacturedate: new Date(),
                    goodsmovementrefdoctype: "F",
                    quantityinentryunit: String(weight001.toFixed(2))
                };

                console.log("Posting Payload:", oEntry);

                // API POST
                let ToAPIPOstTab = await this.ToAPIPOstTab_GR(oModelGet, oEntry);

                // Validate material document
                if (!ToAPIPOstTab || !ToAPIPOstTab.materialdocument) {
                    throw {
                        responseText: JSON.stringify({
                            error: {
                                message: {
                                    value: "Material document was not Generated."
                                }
                            }
                        })
                    };
                }

                // Update internal table
                await this.ToUpdateIntTab_GR(rowData, ToAPIPOstTab);

                // Refresh table
                const oItemsModel = this.getView().getModel("ZSB_AU_QA02_ITEM");
                const aItems = await this.ProOrderItemFetch(
                    oItemsModel, 
                    rowData.processorder, 
                    rowData.batch
                );

                this.tabItemModel = new sap.ui.model.json.JSONModel({
                    Datassitem: aItems
                });

                this.getView().setModel(this.tabItemModel, "TabItemModel");
                this.tabItemModel.refresh(true);

                // SUCCESS MESSAGE
                sap.m.MessageBox.success(
                    "Material Document Generated: " + ToAPIPOstTab.materialdocument
                );

            } catch (error) {
                console.error("Post Error:", error);

                let errMsg = "An unexpected error occurred.";

                // Extract SAP backend error
                try {
                    if (error?.responseText) {
                        const parsed = JSON.parse(error.responseText);
                        errMsg = parsed?.error?.message?.value || errMsg;
                    }
                } catch (e) {
                    console.warn("Could not parse backend error", e);
                }

                sap.m.MessageBox.error(errMsg);

            } finally {
                sap.ui.core.BusyIndicator.hide();
            }
        }
    });
},


            ToFetchUpdateDips: function (UPDATE_DIPS_MODEL, rowData, oFilterProOrd1) {
                return new Promise(function (resolve, reject) {
                    // var that = this;
                    sap.ui.core.BusyIndicator.show(); // Show busy indicator

                    try {
                        UPDATE_DIPS_MODEL.read("/zce_ats_batch_run", {
                            filters: [oFilterProOrd1],
                            success: function (oData) {
                                // sap.ui.core.BusyIndicator.hide(); // Hide busy indicator on success
                                resolve(oData);
                            },
                            error: function (error) {
                                console.log("Error:", error);
                                sap.ui.core.BusyIndicator.hide(); // Hide busy indicator on error
                                reject(error);
                            }
                        });

                    } catch (error) {
                        resolve([])
                    }
                });
            },

            ToAPIPOstTab_GR: function (oModelGet, oEntry) {
                return new Promise((resolve, reject) => {
                    sap.ui.core.BusyIndicator.show();
                    try {
                        oModelGet.setHeaders({
                            "X-Requested-With": "X",
                            "Content-Type": "application/json"
                        });

                        oModelGet.create("/ZC_TB_FT_GR_HEADER", oEntry, {
                            success: function (oData, oResponse) {
                                console.log("Response from create:", oData);
                                resolve(oData);
                            },
                            error: function (error) {
                                console.log("Error in create:", error);
                                sap.m.MessageBox.error("Process Failed...");
                                reject(error);
                            }
                        });
                    } catch (error) {
                        console.error("Exception in ToAPIPOstTab:", error);
                        reject(error);
                    }
                });
            },

            ToUpdateIntTab_GR: function (rowData, ToAPIPOstTab) {
                return new Promise((resolve, reject) => {
                    sap.ui.core.BusyIndicator.show();
                    try {
                        const that = this;
                        const oModelGet = that.getView().getModel("ZSB_AU_QA02_ITEM");
                        oModelGet.setHeaders({
                            "X-Requested-With": "X",
                            "Content-Type": "application/json"
                        });

                        const Header1 = {
                            materialdocumentyear_gr: ToAPIPOstTab.matdocyear,
                            materialdocumentno_gr: ToAPIPOstTab.materialdocument,
                        };

                        const id = rowData.sap_uuid;

                        oModelGet.update("/ZC_AU_QA02ITEM('" + id + "')", Header1, {
                            success: function (oData, oResponse) {
                                console.log("Goods Issue No Updated Successfully..." + ToAPIPOstTab.materialdocument);
                                resolve(oData);
                            },
                            error: function (error) {
                                console.log("Error updating item:", error);
                                sap.m.MessageToast.show("Goods Issue Doc No - Internal table update failed");
                                reject(error);
                            }
                        });
                    } catch (error) {
                        console.error("Exception in ToUpdateIntTab:", error);
                        reject(error);
                    }
                });
            },

            ToPOSTQa02ItemTab: function (ModelName, HeaderData, ItemData) {
                return new Promise((resolve, reject) => {
                    sap.ui.core.BusyIndicator.show(); // Show busy indicator

                    try {
                        // // Helper function for unique ID
                        // function generateUniqueId(prefix) {
                        //     const d = new Date();
                        //     return `${prefix}-${d.getFullYear()}${(d.getMonth() + 1).toString().padStart(2, "0")}${d.getDate().toString().padStart(2, "0")}${d.getHours().toString().padStart(2, "0")}${d.getMinutes().toString().padStart(2, "0")}${d.getSeconds().toString().padStart(2, "0")}${d.getMilliseconds().toString().padStart(3, "0")}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
                        // }

                        // 🛠️ Ensure GetId is defined or passed
                        // const GetId = HeaderData?.ManufacturingOrder || "GENID";

                        const payload = {

                            sap_uuid: ItemData.sap_uuid,
                            id: HeaderData.ManufacturingOrder,
                            batch: HeaderData.Batch,
                            shift: ItemData.shift,
                            aisshift: ItemData.aisshift,
                            ptgshift: "",
                            processorder: HeaderData.ManufacturingOrder,
                            ptgdate: null,
                            boxno: ItemData.boxno,
                            materialdoc: "",
                            avgweight: ItemData.averagewt,
                            uom: "",
                            aisweight: ItemData.weight,
                            aiscumulativeqty: ItemData.cumqty,
                            weight: "0.000",
                            cumulativeqty: "0.000",
                            cumulativeagrade: ItemData.averagewt,
                            agradeweight: "0.000",
                            ptgweight: "0.000",
                            gradeais: ItemData.grageais,
                            gradeats: ItemData.gradeats,
                            grageptg: "",
                            ptgwaste: "0.000",
                            qtylitre: "0.00",
                            cummulativeentry: "0.000",
                            remarks: "",
                            hfx: "0.000",
                            floorwastage: "0.00",
                            qaname: "",
                            status: "",
                            operatorname: "",
                            ptgmachneno: "",
                            itemstatus: "",
                            screencode: "AU500",
                            createdby: "",
                            createdat: new Date(),
                            updatedat: new Date(),
                            updatedby: "",
                            materialdocumentno: "",
                            materialdocumentyear: "",
                            qa01_status: "",
                            qa02_status: "",
                            qa03_status: "",
                        };

                        ModelName.create("/ZC_AU_QA03_ITEM", payload, {
                            success: (oData, oResponse) => {
                                console.log("Response from create:", oData);
                                sap.ui.core.BusyIndicator.hide(); // Hide on success
                                resolve(oData);
                            },
                            error: (error) => {
                                console.log("Error in create:", error);
                                sap.ui.core.BusyIndicator.hide(); // Hide on error
                                sap.m.MessageBox.error("Process Failed...");
                                reject(error);
                            }
                        });

                    } catch (error) {
                        console.error("Unexpected error:", error);
                        sap.ui.core.BusyIndicator.hide(); // Always hide in case of error
                        reject(error);
                    }
                });
            },

            //---------------- End Goods Issue POST ------------------------------------------


            //---------------- Start Goods Receipt Reverse post --------------------------------------

            OnReverseApiPost_MatDoc_GR: async function (oEvent) {
                sap.ui.core.BusyIndicator.show();
                const input = oEvent.getSource(); // the Input field
                const context = input.getBindingContext("TabItemModel");
                let getHeaderData = this.screen2headermodel.getProperty("/HEADERDATA/");
                let Screen1SelectHeaderdata = this.SelectScreen1Data;

                if (context) {
                    const rowPath = context.getPath();
                    const rowData = context.getObject();
                    const that = this;
                    sap.ui.core.BusyIndicator.hide();
                    sap.m.MessageBox.warning("Do you want to post this data.", {
                        actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
                        emphasizedAction: sap.m.MessageBox.Action.YES,
                        onClose: async function (sAction) {
                            if (sAction === "YES") {
                                sap.ui.core.BusyIndicator.show();

                                try {
                                    const oModelGetrev = that.getView().getModel("ZAIS_MATDOC_REV_SRVB");

                                    // console.log("oEntry:", oEntry);

                                    let ToAPIPOstTabgr = await that.ToReverseAPIPOstTabrev(oModelGetrev, rowData);
                                    let ToUpdateIntTab = await that.ToReverseMatDocNoTabrev(rowData, ToAPIPOstTabgr);

                                    const oItemsModel = that.getView().getModel("ZSB_AU_QA02_ITEM");
                                    let sOrder = rowData.processorder
                                    let sBatch = rowData.batch
                                    // debugger
                                    const aItems = await that.ProOrderItemFetch(oItemsModel, sOrder, sBatch);

                                    that.tabItemModel = new sap.ui.model.json.JSONModel({
                                        Datassitem: aItems
                                    });
                                    that.getView().setModel(that.tabItemModel, "TabItemModel");
                                    that.tabItemModel.refresh(that);


                                } catch (error) {
                                    console.error("Error in OnApiPost_MatDoc_GI:", error);
                                    sap.m.MessageBox.error("An error occurred during posting.");
                                } finally {
                                    sap.ui.core.BusyIndicator.hide();
                                }
                            } else {
                                sap.m.MessageToast.show("Cancelled");
                            }
                        }
                    });
                }
            },

            ToReverseAPIPOstTabrev: function (oModelGetrev, rowData) {
                return new Promise((resolve, reject) => {
                    sap.ui.core.BusyIndicator.show();
                    try {
                        oModelGetrev.setHeaders({
                            "X-Requested-With": "X",
                            "Content-Type": "application/json"
                        });

                        const oEntry = {
                            materialdocument: rowData.materialdocumentno_gr,
                            matdocyear: rowData.materialdocumentyear_gr,
                        };

                        oModelGetrev.create("/ZCDS_MATDOC_REV", oEntry, {
                            success: function (oData, oResponse) {
                                console.log("Response from create:", oData);
                                resolve(oData);
                            },
                            error: function (error) {
                                console.log("Error in create:", error);
                                sap.m.MessageBox.error("Process Failed...");
                                reject(error);
                            }
                        });
                    } catch (error) {
                        console.error("Exception in ToAPIPOstTab:", error);
                        reject(error);
                    }
                });
            },

            ToReverseMatDocNoTabrev: function (rowData, ToAPIPOstTab) {
                return new Promise((resolve, reject) => {
                    sap.ui.core.BusyIndicator.show();
                    try {
                        const that = this;
                        const oModelGet = that.getView().getModel("ZSB_AU_QA02_ITEM");
                        oModelGet.setHeaders({
                            "X-Requested-With": "X",
                            "Content-Type": "application/json"
                        });

                        const id = rowData.sap_uuid;

                        const oEntry = {
                            materialdocumentno_gr: '',
                            materialdocumentyear_gr: '',
                        };

                        oModelGet.update("/ZC_AU_QA02ITEM('" + id + "')", oEntry, {
                            success: function (oData, oResponse) {
                                console.log("Goods Issue No Updated Successfully...");
                                resolve(oData);
                            },
                            error: function (error) {
                                console.log("Error updating item:", error);
                                sap.m.MessageToast.show("Goods Issue Doc No - Internal table update failed");
                                reject(error);
                            }
                        });
                    } catch (error) {
                        console.error("Exception in ToUpdateIntTab:", error);
                        reject(error);
                    }
                });
            },

            // ---------------- End Goods Receipt Reverse POST ------------------------------------------

            //---------------- Start Goods Issue Reverse post --------------------------------------

            OnReverseApiPost_MatDoc_GI: async function (oEvent) {
                sap.ui.core.BusyIndicator.show();
                const input = oEvent.getSource(); // the Input field
                const context = input.getBindingContext("TabItemModel");
                let getHeaderData = this.screen2headermodel.getProperty("/HEADERDATA/");
                let Screen1SelectHeaderdata = this.SelectScreen1Data;

                if (context) {
                    const rowPath = context.getPath();
                    const rowData = context.getObject();
                    const that = this;
                    sap.ui.core.BusyIndicator.hide();
                    sap.m.MessageBox.warning("Do you want to post this data.", {
                        actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
                        emphasizedAction: sap.m.MessageBox.Action.YES,
                        onClose: async function (sAction) {
                            if (sAction === "YES") {
                                sap.ui.core.BusyIndicator.show();

                                try {
                                    const oModelGetrevgi = that.getView().getModel("ZCE_CONF_REV_SRVB");

                                    // console.log("oEntry:", oEntry);

                                    let ToAPIPOstTab = await that.ToReverseAPIPOstTabrevgi(oModelGetrevgi, rowData);
                                    let ToUpdateIntTab = await that.ToReverseDeleteTabgi(rowData, ToAPIPOstTab);
                                    let DeleteQA03Item = await that.DeleteQA03Item(rowData, ToAPIPOstTab);

                                    const oItemsModel = that.getView().getModel("ZSB_AU_QA02_ITEM");
                                    let sOrder = rowData.processorder
                                    let sBatch = rowData.batch
                                    //debugger
                                    const aItems = await that.ProOrderItemFetch(oItemsModel, sOrder, sBatch);

                                    that.tabItemModel = new sap.ui.model.json.JSONModel({
                                        Datassitem: aItems
                                    });
                                    that.getView().setModel(that.tabItemModel, "TabItemModel");
                                    that.tabItemModel.refresh(that);


                                } catch (error) {
                                    console.error("Error in OnApiPost_MatDoc_GI:", error);
                                    sap.m.MessageBox.error("An error occurred during posting.");
                                } finally {
                                    sap.ui.core.BusyIndicator.hide();
                                }
                            } else {
                                sap.m.MessageToast.show("Cancelled");
                            }
                        }
                    });
                }
            },

            ToReverseAPIPOstTabrevgi: function (oModelGetrevgi, rowData) {
                return new Promise((resolve, reject) => {
                    sap.ui.core.BusyIndicator.show();
                    try {
                        oModelGetrevgi.setHeaders({
                            "X-Requested-With": "X",
                            "Content-Type": "application/json"
                        });

                        const oEntry = {
                            // materialdocument: rowData.materialdocumentno_gi,
                            // matdocyear: rowData.materialdocumentyear_gi,
                            confirmationgroup: rowData.confirmationgroup,
                            confirmationcount: rowData.confirmationcount,
                            materialdocument: rowData.materialdocumentno_gi,
                            matdocyear: rowData.materialdocumentyear_gi
                        };

                        oModelGetrevgi.create("/ZCE_CONF_REV", oEntry, {
                            success: function (oData, oResponse) {
                                console.log("Response from create:", oData);
                                resolve(oData);
                            },
                            error: function (error) {
                                console.log("Error in create:", error);
                                sap.m.MessageBox.error("Process Failed...");
                                reject(error);
                            }
                        });
                    } catch (error) {
                        console.error("Exception in ToAPIPOstTab:", error);
                        reject(error);
                    }
                });
            },

            ToReverseDeleteTabgi: function (rowData, ToAPIPOstTab) {
                return new Promise((resolve, reject) => {
                    sap.ui.core.BusyIndicator.show();
                    try {
                        const that = this;
                        const oModelGet = that.getView().getModel("ZSB_AU_QA02_ITEM");
                        oModelGet.setHeaders({
                            "X-Requested-With": "X",
                            "Content-Type": "application/json"
                        });

                        const oEntry = {
                            materialdocumentno_gi: '',
                            materialdocumentyear_gi: '',

                            confirmationgroup: '',
                            confirmationcount: '',

                        };

                        const id = rowData.sap_uuid;

                        oModelGet.update("/ZC_AU_QA02ITEM('" + id + "')", oEntry, {
                            success: function (oData, oResponse) {
                                console.log("Goods Issue No Updated Successfully...");
                                resolve(oData);
                            },
                            error: function (error) {
                                console.log("Error updating item:", error);
                                sap.m.MessageToast.show("Goods Issue Doc No - Internal table update failed");
                                reject(error);
                            }
                        });
                    } catch (error) {
                        console.error("Exception in ToUpdateIntTab:", error);
                        reject(error);
                    }
                });
            },

            DeleteQA03Item: function (rowData, ToAPIPOstTab) {
                return new Promise((resolve, reject) => {
                    sap.ui.core.BusyIndicator.show();
                    try {
                        const that = this;
                        const oModelGet3 = that.getView().getModel("ZSB_AU_QA03_ITEM");

                        oModelGet3.setHeaders({
                            "X-Requested-With": "X",
                            "Content-Type": "application/json"
                        });

                        const oFilter = new sap.ui.model.Filter("sap_uuid", sap.ui.model.FilterOperator.EQ, rowData.sap_uuid);

                        oModelGet3.read("/ZC_AU_QA03_ITEM", {
                            filters: [oFilter],
                            success: function (odata) {
                                const data = odata.results;

                                if (data.length > 0) {
                                    const materialdoc = data[0].materialdocumentno;

                                    if (materialdoc === "") {
                                        const sKey = oModelGet3.createKey("/ZC_AU_QA03_ITEM", {
                                            sap_uuid: rowData.sap_uuid
                                        });

                                        oModelGet3.remove(sKey, {
                                            success: function (oData, oResponse) {
                                                console.log("QA03 Data deleted...");
                                                sap.ui.core.BusyIndicator.hide();
                                                resolve(oData);
                                            },
                                            error: function (error) {
                                                console.log("Error deleting item:", error);
                                                sap.ui.core.BusyIndicator.hide();
                                                sap.m.MessageToast.show("Goods Issue Doc No - Internal table update failed");
                                                reject(error);
                                            }
                                        });
                                    } else {
                                        sap.ui.core.BusyIndicator.hide();
                                        sap.m.MessageToast.show("Material Document No is empty. Cannot delete.");
                                        resolve(); // or reject() if it's an error
                                    }
                                } else {
                                    sap.ui.core.BusyIndicator.hide();
                                    sap.m.MessageToast.show("No or only one record found. Deletion not allowed.");
                                    resolve(); // or reject() depending on use case
                                }
                            },
                            error: function (error) {
                                console.log("Error during read operation", error);
                                sap.ui.core.BusyIndicator.hide();
                                reject(error);
                            }
                        });

                    } catch (error) {
                        console.error("Exception in DeleteQA02Item:", error);
                        sap.ui.core.BusyIndicator.hide();
                        reject(error);
                    }
                });
            },

            // ---------------- End Goods Issue Reverse POST ------------------------------------------

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
                        break;
                    case "2":
                        this.ToComponentFragOpen(oEvent);
                        break;
                    case "3":
                        this.OnApiPost_MatDoc_GR(oEvent);
                        break;
                    case "4":
                        this.OnReverseApiPost_MatDoc_GI(oEvent);
                        break;
                    case "5":
                        this.OnReverseApiPost_MatDoc_GR(oEvent);
                        break;
                    case "6":
                        this.onWastageAIS(oEvent);
                        break;
                    default:
                        console.warn("Unknown action:", key);
                }
            },




            onCapCutPrint: async function (oEvent) {

                const input = oEvent.getSource(); // the Input field
                const context = input.getBindingContext("TabItemModel");
                let getHeaderData = this.screen2headermodel.getProperty("/HEADERDATA/");

                if (context) {
                    const rowPath = context.getPath();
                    const rowData = context.getObject();

                    const dates = new Date(rowData.zaisdate); // assuming zdate is a valid date string
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


            onWastageAIS: async function (oEvent) {

                const input = oEvent.getSource(); // the Input field
                const context = input.getBindingContext("TabItemModel");
                let getHeaderData = this.screen2headermodel.getProperty("/HEADERDATA/");


                // Print Total wastage            
                var oTable = this.byId("idqa01processcreen"); // your table ID here
                var oBinding = oTable.getBinding("rows"); // Note: use 'rows' aggregation for sap.ui.table.Table

                var aContexts = oBinding.getContexts();
                var fTotal = 0;

                aContexts.forEach(function (oContext) {
                    var oData = oContext.getObject();
                    fTotal += parseFloat(oData.aiswastage) || 0; // Adjust property name to your model
                });



                if (context) {
                    const rowPath = context.getPath();
                    const rowData = context.getObject();

                    const dates = new Date(rowData.zaisdate); // assuming zdate is a valid date string
                    const yyyy = dates.getFullYear();
                    const mm = String(dates.getMonth() + 1).padStart(2, '0'); // getMonth() is zero-based
                    const dd = String(dates.getDate()).padStart(2, '0');

                    const formattedDate = `${dd}-${mm}-${yyyy}`;
                    console.log("formattedDate:", formattedDate);
                    console.log("getHeaderData:", getHeaderData);
                    console.log("rowData:", rowData);
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
                        sap.ui.require.toUrl("zautodesignapp/images/NCL.png")
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
                                            <div class="title">WASTAGES LABEL - AIS</div>
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
                                            <td class="label-section">ITEM DESCRIPTION</td>
                                            <td colspan="3">${getHeaderData.ProductDescription}<br</td>
                                            </tr>
                                            <tr>
                                            <td class="label-section">AIS NO</td>
                                            <td>${getHeaderData.AISButton}</td>
                                            <td class="label-section">SIZE</td>
                                            <td>${getHeaderData.Zsize}</td>
                                            </tr>
                                            </tr>
                                            <tr>
                                            <td class="label-section">QTY in KGS</td>
                                            <td colspan="3">${fTotal}</td>
                                            </tr>
                                            <tr>
                                            <td class="label-section">DATE/SHIFT</td>
                                            <td colspan="3">${formattedDate}/${rowData.shift}</td>
                                            </tr>
                                            <tr>
                                            <td class="label-section">AIS OPERATOR</td>
                                            <td colspan="3">${rowData.operatorname}</td>
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
