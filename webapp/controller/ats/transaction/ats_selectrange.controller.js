sap.ui.define(
    [
        "zautodesignapp/controller/ats/transaction/atsbasecontroller",
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

        return BaseController.extend("zautodesignapp.controller.ats.transaction.ats_selectrange", {
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




            Goatsselect: function () {

                // Validate date range using the base controller method
                // if (!this.validateDateRange()) {
                //     return;
                // }




                const headerData = this.atsModel.getProperty("/HeaderData/0");
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
                this.atsModel.setProperty("/TableVisible", true);


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
                                const tabModel = new sap.ui.model.json.JSONModel(
                                    {
                                        ItemData: aAllItems
                                    }
                                );
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



            OnatsCheck: function () {
                if (!this.ChFrag) {
                    this.ChFrag = sap.ui.xmlfragment(this.getView().getId("id_atsmachine"), "zautodesignapp.view.ats.transaction.fragment.valuehelp", this);
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

                var sUpdatedMachineNo = "ATS" + sSelectedMachineNo;
                if (this.atsModel) {
                    this.atsModel.setProperty("/HeaderData/0/selectedMachine", sUpdatedMachineNo); // Update model property
                } else {
                    console.error("atsModel not found.");
                }

                // Close the dialog
                this.ChFrag.close();

            },


            /**
         * Fired when the user changes the “Weight” <Input>.
         * Calculates row totals AND a running cumulative weight for the table.
         */
            onWeightchange: function (oEvent) {
                const oInput = oEvent.getSource();
                const oContext = oInput.getBindingContext("TabModelsitems");
                const header  = this.screen2headermodel.getProperty("/HEADERDATA")
                const dippqty = header.dipedqty
                if (!oContext) { console.warn("No binding context."); return; }



                /* --- Paths & model --------------------------------------------------- */
                const sRowPath = oContext.getPath();            // e.g. "/Datassitem/2"
                const oModel = oContext.getModel();           // JSONModel bound to table
                const aParts = sRowPath.split("/");           // ["", "Datassitem", "2"]
                const sRootPath = "/" + aParts[1];               // "/Datassitem"

                /* --- 1. Store the edited weight (3-dec) ------------------------------ */
                const fWeight = parseFloat(oInput.getValue().trim()) || 0;
                oModel.setProperty(`${sRowPath}/weight`, fWeight.toFixed(3));

                /* --- 2. Re-calculate everything row-by-row --------------------------- */
                const aRows = oModel.getProperty(sRootPath) || [];
                let runningWeight = 0;
                let runningQtyL = 0;

                aRows.forEach((row, idx) => {
                    /* Per-row qty in L  */
                    const w = row.weight ? parseFloat(row.weight) : 0;
                    const avg = row.averagewt ? parseFloat(row.averagewt) : 0;
                    const qtyL = avg > 0 ? (w / avg) * 10 : 0;

                    /* A-grade qty rule */
                    const gradeATS = (row.gradeats || "").toUpperCase();
                    const aGradeQty = gradeATS === "R" ? 0 : qtyL;

                    /* Write per-row values */
                    oModel.setProperty(`${sRootPath}/${idx}/tarqty`, qtyL.toFixed(2));   // ✅ 2 decimals
                    oModel.setProperty(`${sRootPath}/${idx}/agradeqty`, aGradeQty.toFixed(2)); // ✅ 2 decimals

                    /* Running totals */
                    runningWeight += w;
                    runningQtyL += qtyL;

                    oModel.setProperty(`${sRootPath}/${idx}/cumulativeqty`, runningWeight.toFixed(3)); // keep 3 decimals for weight
                    oModel.setProperty(`${sRootPath}/${idx}/cumulativeqtys`, runningQtyL.toFixed(2));   // ✅ 2 decimals
                    // cumulativeqtyinL

                    
                });


                const dippVal = parseFloat(dippqty) || 0; 
                  // force numeric
// if (runningQtyL > dippVal) {
//     sap.m.MessageBox.error(
//         "Cumulative Qty (" + runningQtyL.toFixed(2) + 
//         ") exceeds Dipp Qty (" + dippVal.toFixed(2) + ")."
//     );


//      const rowIndex = parseInt(aParts[2], 10);
//     if (!isNaN(rowIndex)) {
//         oModel.setProperty(`${sRootPath}/${rowIndex}/weight`, "0.000");
//         oModel.setProperty(`${sRootPath}/${rowIndex}/tarqty`, "0.00");
//         oModel.setProperty(`${sRootPath}/${rowIndex}/agradeqty`, "0.00");
//         oModel.setProperty(`${sRootPath}/${rowIndex}/cumulativeqty`, "0.000");
//         oModel.setProperty(`${sRootPath}/${rowIndex}/cumulativeqtys`, "0.00");
//     }
//         // Remove the current line item
//         // const rowIndex = parseInt(aParts[2], 10); // index from path
//         // if (!isNaN(rowIndex)) {
//         //     aRows.splice(rowIndex, 1); // remove offending row
//         //     oModel.setProperty(sRootPath, aRows); // update model
//         // }
//     }
       



},



  OnWastageChange: function (oEvent) {
                const oInput = oEvent.getSource();
                const oContext = oInput.getBindingContext("TabModelsitems");
                if (!oContext) { console.warn("No binding context."); return; }
      
    const rowData = oContext.getObject();
     const sRowPath = oContext.getPath();  
   

    
const waste = rowData.wastage && rowData.wastage.trim() !== "" ? parseFloat(rowData.wastage) : 0.00;
const avgwt = rowData.averagewt && rowData.averagewt.trim() !== "" ? parseFloat(rowData.averagewt) : 0.00;

    // Calculate the qtys value: (qtywt / avrgwt) * 10
    let wasteinlac = (waste / avgwt) * 10;

    // Set the property on the model with the calculated value, formatted to 3 decimal places
    oContext.getModel().setProperty(`${sRowPath}/wastageinlac`,wasteinlac.toFixed(4));



  },





            onReversePress: function (oEvent) {
                // Get the binding context of the row where the Reverse button was pressed
                var oContext = oEvent.getSource().getBindingContext("TabModelsitems");

                if (oContext) {
                    // Get the row's data object
                    var oRowData = oContext.getObject();

                    // Log it to the console
                    console.log("Reverse button pressed. Row data:", oRowData);
                } else {
                    console.log("No binding context found for Reverse button.");
                }
            },



            onUpdateItemData: function () {
                var that = this;
                var oView = this.getView();
                var oItemModel = oView.getModel("TabModelsitems");
                var aAllRows = (oItemModel.getProperty("/ItemDatas") || []);
                // var oHdrData     = this.screen2headermodel.getProperty("/HEADERDATA/");

                // const QA01Inputdatas    = oView.getModel("QAJModelInput").getProperty("/Samples") || [];
                // console.log("QA01Inputdatas:", QA01Inputdatas)


                var oHeaderModel = oView.getModel("screen2model");
                var aHeadRows = (oHeaderModel.getProperty("/HEADERDATA") || []);


                /* ---------- UX: no spinner → show one ---------- */
                sap.ui.core.BusyIndicator.show(0);                       // ★ NEW

                return new Promise((resolve) => {

                    /* ---------- user confirmation BEFORE any work ---------- */
                    sap.m.MessageBox.confirm("Do you want to update the selected row(s)?", {
                        actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
                        emphasizedAction: sap.m.MessageBox.Action.YES,
                        onClose: async function (sAction) {
                            if (sAction !== sap.m.MessageBox.Action.YES) {
                                sap.ui.core.BusyIndicator.hide();
                                sap.m.MessageToast.show("Cancelled");
                                return resolve("Cancelled");
                            }

                            /* ---------- determine selected rows ---------- */
                            const aSelected = aAllRows.filter(r => r.selected);

                            if (aSelected.length === 0) {               // ★ NEW
                                sap.ui.core.BusyIndicator.hide();
                                sap.m.MessageBox.information("Please select at least one row to post.");
                                return resolve("No selection");
                            }

                            /* ---------- per-row required-field validation ---------- */
                            const REQUIRED = [
                                //{ key: "zatsdate", label: "Date" },
                                { key: "weight", label: "Weight" },
                                // { key: "hfx", label: "HFX" },
                                // { key: "wastage", label: "Wastage" },
                                // { key: "floorwastage", label: "Floor Wastage" },
                                { key: "qaname", label: "QA Name" },
                                { key: "operatorname", label: "Operator Name" },
                            ];

                            const aMissing = aSelected.map((row, idx) => {
                                const miss = REQUIRED
                                    .filter(f => !row[f.key] && row[f.key] !== 0)
                                    .map(f => f.label);

                                // ✅ Extra logic: If shift = "C" then floorwastage must be entered
                                if (row.shift === "C") {
                                    if (!row.floorwastage || row.floorwastage === 0 || row.floorwastage === "0.00") {
                                        miss.push("Floor Wastage");
                                    }
                                }
                                return miss.length ? { idx, miss } : null;
                            }).filter(Boolean);

                            if (aMissing.length) {                      // ★ NEW
                                const txt = aMissing.map(r =>
                                    "Row " + (r.idx + 1) + ": " + r.miss.join(", ")
                                ).join("\n");
                                sap.ui.core.BusyIndicator.hide();
                                sap.m.MessageBox.error(
                                    "Fill the following before posting:\n\n" + txt
                                );
                                return resolve("Validation failed");
                            }

                            let updatemodel = that.getView().getModel("ZSB_AU_QA01_ITEM");
                            let updatemodel2 = that.getView().getModel("ZSB_AU_QA02_ITEM");

                            updatemodel.setHeaders({
                                "X-Requested-With": "X",
                                "Content-Type": "application/json"
                            });

                            /* ---------- Header payloads ---------- */
                            const UpdateItemLevel = () =>
                                Promise.all(aSelected.map(row => new Promise((res, rej) => {

                                    // if(row.gradeats === 'D'){
                                    //     var wastage = row.wastage
                                    // }else {
                                    //     var wastage = row.averagewt
                                    // }
                                    const payload = {
                                        zatsdate: row.zdate ? new Date(row.zdate.toLocaleDateString('en-CA')) : new Date(),
                                        // zatsdate: row.zdate,
                                        weight: row.weight,
                                        hfx: row.hfx,
                                        wastage: row.wastage,
                                        floorwastage: row.floorwastage,
                                        qaname: row.qaname,
                                        operatorname: row.operatorname,
                                        remarks: row.remarks,
                                        cumulativeqty: row.cumulativeqty || "0.00",
                                        agradeqty: row.agradeqty || "0.00",
                                        tarqty: row.tarqty || "0.00",
                                        cumulativeqtys: row.cumulativeqtys || "0.00",
                                    wastageinlac : row.wastageinlac

                                    };
                                    updatemodel.update("/ZC_AU_QA01_ITEM('" + row.sap_uuid + "')", payload, {
                                        success: res,
                                        error: rej
                                    });
                                })));

                            const UpdateItem2Level = () =>
                                Promise.all(aSelected.map(row => new Promise((res, rej) => {

                                    const payload2 = {
                                        averagewt: row.averagewt,
                                        atsweight: row.weight,

                                    };
                                    updatemodel2.update("/ZC_AU_QA02ITEM('" + row.sap_uuid + "')", payload2, {
                                        success: res,
                                        error: rej
                                    });
                                })));

                            try {
                                await Promise.all([
                                    UpdateItemLevel(),
                                    UpdateItem2Level(),
                                ]);

                                sap.m.MessageToast.show("Data saved.");
                                aSelected.forEach(r => r.selected = false);   // reset
                                oItemModel.refresh(true);

                                const oItemsModel = oView.getModel("ZSB_AU_QA01_ITEM");
                                const aItems = await that.ProOrderItemFetch(oItemsModel, aHeadRows.ManufacturingOrder, aHeadRows.Batch);

                                that.tabModels = new sap.ui.model.json.JSONModel({
                                    ItemDatas: aItems
                                });
                                that.getView().setModel(that.tabModels, "TabModelsitems");
                                that.tabModels.refresh(true);



                                resolve("Saved");
                            } catch (e) {
                                sap.m.MessageBox.error("Save failed: " + e.message);
                                resolve("Error");
                            } finally {
                                sap.ui.core.BusyIndicator.hide();
                            }
                        }
                    });
                });
            },


            formatDate: function (value) {

                // Apply date formatting if it's not "Total"
                var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
                    pattern: "dd-MM-yyy"
                });
                return oDateFormat.format(new Date(value));
            },

            OnClose: function () {
                this.ChFrag.close();
            },

            //---------------- Start Goods Issue post --------------------------------------

            ToComponentFragOpen: async function (oEvent) {
                // OnApiPost_MatDoc

                const input = oEvent.getSource(); // the Input field
                const context = input.getBindingContext("TabModelsitems");
                let getHeaderData = this.screen2headermodel.getProperty("/HEADERDATA/");
                let Screen1SelectHeaderdata = this.SelectScreen1Data;

                if (context) {
                    const rowPath = context.getPath();
                    const rowData = context.getObject();

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
                        new sap.ui.model.Filter("wastage", sap.ui.model.FilterOperator.EQ, rowData.wastage),
                        new sap.ui.model.Filter("floor_wastage", sap.ui.model.FilterOperator.EQ, rowData.floorwastage)

                    ];

                    const UPDATE_DIPS_MODEL = this.getView().getModel("ZCE_ATS_BATCH_RUN_SRVB");
                    let ToFetchUpdateDips = await this.ToFetchUpdateDips(UPDATE_DIPS_MODEL, rowData, aFilters);

                    this.CompDipsModel = new sap.ui.model.json.JSONModel({
                        Datatabitem: ToFetchUpdateDips.results
                    });

                    this.getView().setModel(this.CompDipsModel, "CompDipsModel");
                    //debugger

                    this.ComponentMatoEvent = oEvent
                    sap.ui.core.BusyIndicator.hide();
                    if (!this.tableitemfrag) {
                        this.tableitemfrag = sap.ui.xmlfragment(this.getView().getId("tableitemacm"), "zautodesignapp.view.ats.transaction.fragment.tableitemhelp", this);
                        this.getView().addDependent(this.tableitemfrag);
                    }
                    this.tableitemfrag.open();

                }

            },

            onQualitySubmit: async function (oEventComp) {
                console.log("this.ComponentMatoEvent:", this.ComponentMatoEvent)
                this.OnApiPost_MatDoc(this.ComponentMatoEvent)
            },

            onTableitemCancel: async function (oEventComp) {
                this.tableitemfrag.close();
            },


            OnApiPost_MatDoc: async function (oEvent) {
                sap.ui.core.BusyIndicator.show();
                const input = oEvent.getSource(); // the Input field
                const context = input.getBindingContext("TabModelsitems");
                let getHeaderData = this.screen2headermodel.getProperty("/HEADERDATA/");
                let Screen1SelectHeaderdata = this.SelectScreen1Data;
                var oItemSrv_qa02 = this.getView().getModel("ZSB_AU_QA02_ITEM");
                if (context) {
                    const rowPath = context.getPath();
                    const rowData = context.getObject();
                    //debugger
                    // let oFilterProOrd1 = new sap.ui.model.Filter("ProcessOrder", sap.ui.model.FilterOperator.EQ, "00"+rowData.processorder);

                    const aFilters = [
                        new sap.ui.model.Filter("ProcessOrder", sap.ui.model.FilterOperator.EQ, "00" + rowData.processorder),
                        new sap.ui.model.Filter("hfx", sap.ui.model.FilterOperator.EQ, rowData.hfx),
                        new sap.ui.model.Filter("wastage", sap.ui.model.FilterOperator.EQ, rowData.wastage),
                        new sap.ui.model.Filter("floor_wastage", sap.ui.model.FilterOperator.EQ, rowData.floorwastage)

                    ];


                    const UPDATE_DIPS_MODEL = this.getView().getModel("ZCE_ATS_BATCH_RUN_SRVB");
                    let ToFetchUpdateDips = await this.ToFetchUpdateDips(UPDATE_DIPS_MODEL, rowData, aFilters);
                    // debugger

                    let PostArr = [];
                    for (let i = 0; i < ToFetchUpdateDips.results.length; i++) {
                        PostArr.push({
                            Material: ToFetchUpdateDips.results[i].material,
                            Plant: ToFetchUpdateDips.results[i].plant,
                            Storagelocation: ToFetchUpdateDips.results[i].storage_location,
                            Batch: ToFetchUpdateDips.results[i].batch,
                            Goodsmovementtype: ToFetchUpdateDips.results[i].movement_type,
                            Quantityinentryunit: parseFloat(ToFetchUpdateDips.results[i].quantity).toFixed(3),
                            Manufacturingorder: ToFetchUpdateDips.results[i].ProcessOrder,
                            Manufacturingorderitem: "0001",
                            Manufacturedate: new Date(),
                            postingdate: new Date(),
                            Materialdocument: "",
                            matdocyear: "2025",
                            goodsmovementcode: "03",
                        });
                    }

                    // Now remove duplicates based on the 'Material' field
                    const uniquePostArr = PostArr.reduce((acc, currentValue) => {
                        // Check if the material already exists in the accumulator
                        const exists = acc.some(item => item.Material === currentValue.Material);
                        if (!exists) {
                            acc.push(currentValue);  // Add unique material to the accumulator
                        }
                        return acc;
                    }, []);

                    console.log(uniquePostArr);


                    const that = this;
                    sap.ui.core.BusyIndicator.hide();
                    sap.m.MessageBox.warning("Do you want to post this data.", {
                        actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
                        emphasizedAction: sap.m.MessageBox.Action.YES,
                        onClose: async function (sAction) {
                            if (sAction === "YES") {
                                sap.ui.core.BusyIndicator.show();

                                try {

                                    const oModelGet = that.getView().getModel("ZC_ATS_HEAD_GD_CRT_SRVB");

                                    const oEntry = {
                                        Postingdate: new Date(),
                                        Goodsmovementcode: "03",
                                        Materialdocument: "",
                                        Matdocyear: "2025",
                                        toitem: uniquePostArr
                                        
                                    };

                                    console.log("oEntry:", oEntry);

                                    let ToAPIPOstTab = await that.ToAPIPOstTab(oModelGet, oEntry);
                                    if (ToAPIPOstTab.Errorresponse !== "" && ToAPIPOstTab.Materialdocument === "") {
                                        try {
                                            // Parse the error response (assuming JSON format)
                                            var oResponse = JSON.parse(ToAPIPOstTab.Errorresponse);
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

                                    } else if (ToAPIPOstTab.Materialdocument === "") {
                                        try {
                                            if (ToAPIPOstTab.Errorresponse === "") {
                                                sap.m.MessageBox.error("Data posting error...");
                                            } else {
                                                // Parse the error response (assuming JSON format)
                                                var oResponse = JSON.parse(ToAPIPOstTab.Errorresponse);
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
                                            }
                                        } catch (e) {
                                            // In case of parsing errors
                                            console.error("Error in parsing OData error response: ", e);
                                            return
                                        }
                                    }

                                    let ToUpdateIntTab = await that.ToUpdateIntTab(rowData, ToAPIPOstTab);
                                    // let ToPOSTQa02ItemTab = await that.ToPOSTQa02ItemTab(oItemSrv_qa02, getHeaderData, rowData);


                                    const oItemsModel = that.getView().getModel("ZSB_AU_QA01_ITEM");
                                    let sOrder = rowData.processorder
                                    let sBatch = rowData.batch
                                    const aItems = await that.ProOrderItemFetch(oItemsModel, sOrder, sBatch);

                                    that.tabModels = new sap.ui.model.json.JSONModel({
                                        ItemDatas: aItems
                                    });
                                    that.getView().setModel(that.tabModels, "TabModelsitems");
                                    that.tabModels.refresh(that);
                                    sap.m.MessageBox.success("Material Document Generated...");
                                    that.FinalStatus = new sap.ui.model.json.JSONModel({
                                        MSGSTRIP: {
                                            "visible": true,
                                            "text": "Material Document No " + ToAPIPOstTab.Materialdocument,
                                            "type": 'Success'
                                        }
                                    });
                                    that.getView().setModel(that.FinalStatus, "FinalStatus")
                                    that.tableitemfrag.close();
                                } catch (error) {
                                    console.error("Error in OnApiPost_MatDoc:", error);
                                    sap.m.MessageBox.error("An error occurred during posting.");
                                } finally {
                                    sap.ui.core.BusyIndicator.hide();
                                    that.tableitemfrag.close();
                                }
                            } else {
                                sap.m.MessageToast.show("Cancelled");
                            }
                        }
                    });
                }
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

          

            ToAPIPOstTab: function (oModelGet, oEntry) {
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

            ToUpdateIntTab: function (rowData, ToAPIPOstTab) {
                return new Promise((resolve, reject) => {
                    sap.ui.core.BusyIndicator.show();
                    try {
                        const that = this;
                        const oModelGet = that.getView().getModel("ZSB_AU_QA01_ITEM");
                        oModelGet.setHeaders({
                            "X-Requested-With": "X",
                            "Content-Type": "application/json"
                        });

                        const Header = {
                            materialdocumentyear: ToAPIPOstTab.Matdocyear,
                            materialdocumentno: ToAPIPOstTab.Materialdocument,
                        };

                        const id = rowData.sap_uuid;
                        const zatsdate = rowData.zatsdate ? new Date(rowData.zatsdate.toLocaleDateString('en-CA')) : null;
                        const processorder = rowData.processorder.padStart(12, "0");
                        const acmno = rowData.acmno.padStart(2, "0");
                        const batch = rowData.batch;
                        const shift = rowData.shift;

                        oModelGet.update("/ZC_AU_QA01_ITEM('" + id + "')", Header, {
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

            //---------------- End Goods Issue POST ------------------------------------------

            //---------------- Start Goods Reverse post --------------------------------------

            OnReverseApiPost_MatDoc: async function (oEvent) {
                sap.ui.core.BusyIndicator.show();
                const input = oEvent.getSource(); // the Input field
                const context = input.getBindingContext("TabModelsitems");
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
                                    const oModelGet = that.getView().getModel("ZATS_MATDOC_REV_SRVB");

                                    // console.log("oEntry:", oEntry);

                                    let ToAPIPOstTab = await that.ToReverseAPIPOstTab(oModelGet, rowData);
                                    let ToUpdateIntTab = await that.ToReverseDeleteTab(rowData, ToAPIPOstTab);
                                    let DeleteQA02Item = await that.DeleteQA02Item(rowData, ToAPIPOstTab);

                                    const oItemsModel = that.getView().getModel("ZSB_AU_QA01_ITEM");
                                    let sOrder = rowData.processorder
                                    let sBatch = rowData.batch
                                    const aItems = await that.ProOrderItemFetch(oItemsModel, sOrder, sBatch);

                                    that.tabModels = new sap.ui.model.json.JSONModel({
                                        ItemDatas: aItems
                                    });
                                    that.getView().setModel(that.tabModels, "TabModelsitems");
                                    that.tabModels.refresh(that);


                                } catch (error) {
                                    console.error("Error in OnApiPost_MatDoc:", error);
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

            ToReverseAPIPOstTab: function (oModelGet, rowData) {
                return new Promise((resolve, reject) => {
                    sap.ui.core.BusyIndicator.show();
                    try {
                        oModelGet.setHeaders({
                            "X-Requested-With": "X",
                            "Content-Type": "application/json"
                        });

                        const oEntry = {
                            materialdocument: rowData.materialdocumentno,
                            matdocyear: rowData.materialdocumentyear,
                        };

                        oModelGet.create("/ZCDS_MATDOC_REV", oEntry, {
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

            ToReverseDeleteTab: function (rowData, ToAPIPOstTab) {
                return new Promise((resolve, reject) => {
                    sap.ui.core.BusyIndicator.show();
                    try {
                        const that = this;
                        const oModelGet = that.getView().getModel("ZSB_AU_QA01_ITEM");
                        const qa01headerodata = that.getView().getModel("ZSB_AU_QA01_HEADER");

                        oModelGet.setHeaders({
                            "X-Requested-With": "X",
                            "Content-Type": "application/json"
                        });



                        const id = rowData.sap_uuid;
                        const headerid =  rowData.id;

                        oModelGet.remove("/ZC_AU_QA01_ITEM('" + id + "')", {
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



                        qa01headerodata.remove("/ZC_AU_QA01_HEADER('" + headerid + "')", {
                            success: function (oData, oResponse) {
                                console.log("Goods Header data Updated Successfully...");
                                resolve(oData);
                            },
                            error: function (error) {
                                console.log("Error updating item:", error);
                                sap.m.MessageToast.show("Internal Header data  update failed");
                                reject(error);
                            }
                        });







                        const oModelGet2 = that.getView().getModel("ZSB_AU_QA02_ITEM");
                        var Filter = new sap.ui.model.Filter("sap_uuid", sap.ui.model.FilterOperator.EQ, rowData.sap_uuid)

                        oModelGet2.read("/ZC_AU_QA02ITEM", {
                            filters: [Filter],
                            success: function (odata) {
                                var data = odata.results
                                if (data.length > 1) {
                                    var materialdoc = data[0].materialdocumentno_gi

                                    if (materialdoc !== '') {
                                        oModelGet2.remove("/ZC_AU_QA02ITEM('" + rowData.sap_uuid + "')", {
                                            success: function (oData, oResponse) {
                                                console.log("QA02 Data deleted...");
                                                resolve(oData);
                                            },
                                            error: function (error) {
                                                console.log("Error updating item:", error);
                                                sap.m.MessageToast.show("Goods Issue Doc No - Internal table update failed");
                                                reject(error);
                                            }
                                        });
                                    }
                                }
                            },
                            error: function (error) {
                                console.log("error", error);

                            }
                        })






                    } catch (error) {
                        console.error("Exception in ToUpdateIntTab:", error);
                        reject(error);
                    }
                });
            },

            DeleteQA02Item: function (rowData, ToAPIPOstTab) {
                return new Promise((resolve, reject) => {
                    sap.ui.core.BusyIndicator.show();
                    try {
                        const that = this;
                        const oModelGet2 = that.getView().getModel("ZSB_AU_QA02_ITEM");

                        oModelGet2.setHeaders({
                            "X-Requested-With": "X",
                            "Content-Type": "application/json"
                        });

                        const oFilter = new sap.ui.model.Filter("sap_uuid", sap.ui.model.FilterOperator.EQ, rowData.sap_uuid);

                        oModelGet2.read("/ZC_AU_QA02ITEM", {
                            filters: [oFilter],
                            success: function (odata) {
                                const data = odata.results;

                                if (data.length > 0) {
                                    const materialdoc = data[0].materialdocumentno_gi;

                                    if (materialdoc === "") {
                                        const sKey = oModelGet2.createKey("/ZC_AU_QA02ITEM", {
                                            sap_uuid: rowData.sap_uuid
                                        });

                                        oModelGet2.remove(sKey, {
                                            success: function (oData, oResponse) {
                                                console.log("QA02 Data deleted...");
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




            
            // ---------------- End Goods Issue POST ------------------------------------------

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
                        this.OnReverseApiPost_MatDoc(oEvent);
                        break;
                    case "4":
                        this.onWastageATS(oEvent);
                    default:
                        console.warn("Unknown action:", key);
                }
            },

            onCapCutPrint: async function (oEvent) {

                const input = oEvent.getSource(); // the Input field
                const context = input.getBindingContext("TabModelsitems");
                let getHeaderData = this.screen2headermodel.getProperty("/HEADERDATA/");





                if (context) {
                    const rowPath = context.getPath();
                    const rowData = context.getObject();

                    const dates = new Date(rowData.zatsdate); // assuming zdate is a valid date string
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
                                <td class="label-section">AIS GRADE</td>
                                <td colspan="3"></td>
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

        
            onWastageATS: async function (oEvent) {

                const input = oEvent.getSource(); // the Input field
                const context = input.getBindingContext("TabModelsitems");
                let getHeaderData = this.screen2headermodel.getProperty("/HEADERDATA/");
                // Print Total wastage
                var oTable = this.byId("idatsprocesscreen"); // your table ID here
                var oBinding = oTable.getBinding("rows"); // Note: use 'rows' aggregation for sap.ui.table.Table

                var aContexts = oBinding.getContexts();
                var fTotal = 0;

                aContexts.forEach(function (oContext) {
                    var oData = oContext.getObject();
                    fTotal += parseFloat(oData.wastage) || 0; // Adjust property name to your model
                });



                if (context) {
                    const rowPath = context.getPath();
                    const rowData = context.getObject();

                    const dates = new Date(rowData.zatsdate); // assuming zdate is a valid date string
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

                    const generatePDFContent = (logoData, rowData,) => `
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
<div class="title">WASTAGES LABEL - ATS</div>
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
<td class="label-section">ATS NO</td>
<td>${getHeaderData.ATSButton}</td>
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
<td class="label-section">ATS OPERATOR</td>
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
            }

        });
    }
);
