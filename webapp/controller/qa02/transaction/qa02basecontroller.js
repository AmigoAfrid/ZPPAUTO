sap.ui.define(
    [
      
        "sap/ui/core/mvc/Controller",
        "sap/ui/model/json/JSONModel",
        "sap/m/MessageBox",
        "zautodesignapp/util/PDFLib",
        "sap/m/PDFViewer",

    ],
    function (Controller, JSONModel, MessageBox) {
        "use strict";

        return Controller.extend("zautodesignapp.controller.qa02.transaction.qa02basecontroller", {
            onInit: function () {
                // Shared models for all screens
                this.screenModel =new sap.ui.model.json.JSONModel({
                    openscreen: "screen1"
                });
                this.getView().setModel(this.screenModel, "ScreenVisible");

                this.selectedRowModel = new sap.ui.model.json.JSONModel({
                    
                });
                this.getView().setModel(this.selectedRowModel, "SelectedRow");

                this.qa02Model = new sap.ui.model.json.JSONModel({
                    HeaderData: [{
                        daterange: "",
                        machineno:""
                    }],
                    TableVisible: false
                });
                this.getView().setModel(this.qa02Model, "qa02Model");

                this.TabItemModel = new sap.ui.model.json.JSONModel({
                    Datassitem: [{ 
                        date: "",
                        batch: "",
                        shift: "",
                        aishift:"",
                        boxno: "",
                        avgwt: "",
                        weight: "",
                        aisweight: "",
                        cumqty: "",
                        gradeforats: "",
                        grageais: "",
                        aiswastage: "",
                        qtyltr: "",
                        agradeqty: "",
                        cummulativeetnry: "",
                        remarks: "",
                        hfx: "",
                        floorwaste: "",
                        qaname: "",
                        operatorname: "",
                        aismachineno: "",
                        wastageinlac:""
                    }],  // Static, only one plant
                });

                // Set the model to the view
                this.getView().setModel(this.TabItemModel, "TabItemModel");

                this._pdfViewer = new sap.m.PDFViewer({
                    isTrustedSource: true,
                    width: "100%",
                    height: "600px", // Adjust height as needed
                    title: "QA02 Print"
                });
                this.getView().addDependent(this._pdfViewer);

                this.QAJModelInput = new sap.ui.model.json.JSONModel({
                    Samples : {
                        qa01_cfmperform:'',
                        qa01_avgwt:'',
                        qa01_moistcontent:'',
                        qa01_pulltest:'',
                        qa01_joinlength:'',
                        l1_grade:'',
                        l2_grade:'',
                        l3_grade:'',
                        l4_grade:'',
                    }
                  })
                  this.getView().setModel(this.QAJModelInput, "QAJModelInput");

                this.BtnBasedModel = new sap.ui.model.json.JSONModel({
                    Samples : {
                        save_btn:true,
                        update_btn:false,
                        api_post_btn:false,
                        api_reverse_btn:false,
                    }
                  })
                  this.getView().setModel(this.BtnBasedModel, "BtnBasedModel");

            },

            validateDateRange: function () {
                const headerData = this.qa02Model.getProperty("/HeaderData/0");
                const dateRange = headerData.daterange;
                const machine = headerData.machineno;
                if (!dateRange || !machine) {
                    MessageBox.error("Please select a date range and machine no.");
                    return false;
                }

                return true;
            },

            showScreen: function (screenName) {
                this.screenModel.setProperty("/openscreen", screenName);
            },


            formatODataDate: function (sODataDate) {
                if (!sODataDate) return "";
            
                let timestamp;
            
                if (typeof sODataDate === "string" && sODataDate.startsWith("/Date(")) {
                    // It's the OData string format: "/Date(123456789)/"
                    timestamp = parseInt(sODataDate.replace("/Date(", "").replace(")/", ""));
                } else if (typeof sODataDate === "number") {
                    // Already a timestamp
                    timestamp = sODataDate;
                } else if (sODataDate instanceof Date) {
                    // Already a JS Date
                    timestamp = sODataDate.getTime();
                } else {
                    console.warn("Unknown date format:", sODataDate);
                    return "";
                }
            
                const date = new Date(timestamp);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
            
                return `${day}-${month}-${year}`;
            },
            
            handleRowSelect: async function (oEvent) {
                sap.ui.core.BusyIndicator.show(0);
            
                const table = oEvent.getSource();
                const selectedIndex = table.getSelectedIndex();
            
                if (selectedIndex < 0) {
                    sap.ui.core.BusyIndicator.hide();
                    sap.m.MessageToast.show("No row selected.");
                    return;
                }
            
                const context = table.getContextByIndex(selectedIndex);
                const selectedData = context.getObject();
                const selectedOrder = selectedData.ManufacturingOrder;
                const selectedBatch = selectedData.Batch;
            
                // Set model for selected row
                this.selectedRowModel.setData(selectedData);
                this.showScreen("screen2");
            
                const oModelItem = this.getView().getModel("ZSB_AU_QA02_ITEM");
            
                try {
                    // Set HEADERDATA model
                    this.screen2headermodel = new sap.ui.model.json.JSONModel({
                        HEADERDATA: selectedData
                    });
                    this.getView().setModel(this.screen2headermodel, "screen2model");
            
                    // Filters for data fetch
                    const filters = [
                        new sap.ui.model.Filter("processorder", sap.ui.model.FilterOperator.EQ, selectedOrder),
                        new sap.ui.model.Filter("batch", sap.ui.model.FilterOperator.EQ, selectedBatch)
                    ];
            
                    // Fetch item tab data
                    const DatasKk01 = await this.ToCheckProcOrderInInternally(oModelItem, filters);
            
                    // Bind to TabItemModel
                    const tabItemModel = new sap.ui.model.json.JSONModel({ Datassitem: DatasKk01 });
                       this.getView().setModel(tabItemModel, "TabItemModel");
                    tabItemModel.refresh()
            
                } catch (error) {
                    console.error("❌ Exception during row select:", error);
                    sap.m.MessageToast.show("An error occurred while processing the selected row.");
                } finally {
                    sap.ui.core.BusyIndicator.hide();
                }
            },
            
            ToCheckProcOrderInInternally: async function (oModelItem, filters) {
                return new Promise(function (resolve, reject) {

                    var topValue = 5000;
                    var skipValue = 0;
                    oModelItem.read("/ZC_AU_QA02ITEM", {

                            urlParameters: {
                            "$top": topValue,
                            "$skip": skipValue
                        },
                        filters: filters,
                        success: function (oData) {
                            resolve(oData.results || []);
                        },
                        error: function (oError) {
                            console.error("❌ Error reading items:", oError);
                            sap.m.MessageToast.show("Failed to load item data.");
                            resolve([]); // Resolve with empty array on error
                        }
                    });
                });
            },

            
            
            
//           ToCheckProcOrderInInternally: async function (oModelItem, filters) {
//     const allResults = [];
//     const top = 100; // number of records per request (adjust as needed)
//     let skip = 0;
//     let hasMoreData = true;

//     // Helper function to read a page
//     const readPage = (skipCount) => {
//         return new Promise((resolve, reject) => {
//             oModelItem.read("/ZC_AU_QA02ITEM", {
//                 filters: filters,
//                 urlParameters: {
//                     "$top": top,
//                     "$skip": skipCount
//                 },
//                 success: function (oData) {
//                     resolve(oData.results || []);
//                 },
//                 error: function (oError) {
//                     console.error("❌ Error reading items:", oError);
//                     sap.m.MessageToast.show("Failed to load item data.");
//                     resolve([]); // continue safely
//                 }
//             });
//         });
//     };

//     // Loop through all pages
//     while (hasMoreData) {
//         const pageData = await readPage(skip);
//         allResults.push(...pageData);

//         if (pageData.length < top) {
//             hasMoreData = false; // reached the end
//         } else {
//             skip += top; // next page
//         }
//     }

//     return allResults;
// },
  
            
            
            
            // ProOrderItemFetch: function (ManuFacorderModel, filter) {
            //     return new Promise(function (resolve, reject) {
            //         sap.ui.core.BusyIndicator.show();

            //         var topValue = 5000;
            //         var skipValue = 0;
           
            //         ManuFacorderModel.read("/ZC_AU_QA02_ITEM", {
            //                   urlParameters: {
            //                 "$top": topValue,
            //                 "$skip": skipValue
            //             },
            //             filters: [filter],
            //             success: function (odata) {
            //                 sap.ui.core.BusyIndicator.hide();
            //                 resolve(odata.results);
            //             },
            //             error: function (error) {
            //                 sap.ui.core.BusyIndicator.hide();
            //                 reject(error);
            //             }
            //         });
            //     });
            // },


//             ProOrderItemFetch: async function (ManuFacorderModel, filter) {
//     sap.ui.core.BusyIndicator.show(0); // Show busy indicator

//     const allResults = [];
//     const top = 100; // Number of records per request
//     let skip = 0;
//     let hasMoreData = true;

//     const filters = [];
//     if (filter) filters.push(filter);

//     const readPage = (skipCount) => {
//         return new Promise((resolve, reject) => {
//             ManuFacorderModel.read("/ZC_AU_QA02_ITEM", {
//                 filters: filters,
//                 urlParameters: {
//                     "$top": top,
//                     "$skip": skipCount
//                 },
//                 success: function (odata) {
//                     resolve(odata.results || []);
//                 },
//                 error: function (error) {
//                     console.error("❌ Error fetching QA02 items:", error);
//                     sap.m.MessageToast.show("Failed to load QA02 item data.");
//                     resolve([]); // Continue gracefully
//                 }
//             });
//         });
//     };

//     try {
//         while (hasMoreData) {
//             const pageData = await readPage(skip);
//             allResults.push(...pageData);

//             if (pageData.length < top) {
//                 hasMoreData = false; // Last page reached
//             } else {
//                 skip += top; // Next batch
//             }
//         }

//         return allResults;

//     } catch (error) {
//         console.error("❌ Exception during QA02 item fetch:", error);
//         return [];

//     } finally {
//         sap.ui.core.BusyIndicator.hide();
//     }
// },

           

            /* ============================================================= */
/* =============   QA-01 / QA-02  TABLE HANDLING   ============== */
/* ============================================================= */

/* ---------- 1. Field-normalisation helper -------------------- */
_normaliseRow : function (row, isPosted) {
    /* 1️⃣  Copy whichever field is present into the
           common names expected by the table                 */
    row.zdate  = row.zdate   || row.zdate   || row.qa02date || null;
    row.boxno = row.boxno  || row.boxno   || null;
    row.batch  = (row.batch  || "").trim().toUpperCase();

    /* 2️⃣  Date formatting (only once) */
    row.zdate  = this.formatODataDate(row.zdate);

    /* 3️⃣  Lock already-posted lines */
    row.readonly = !!isPosted;

    return row;
},


/* ---------- 2. Fetch helpers with extra logging -------------- */

/** Fetch QA-02 (already-uploaded) rows                           */
fetchQA02Items : function (sOrder) {
    const oModel = this.getView().getModel("ZSB_AU_QA02_ITEM");
    const sSet   = "/ZC_AU_QA02ITEM";
    const oFlt   = new sap.ui.model.Filter("processorder", "EQ", sOrder);

    return new Promise((ok, err) => {
        oModel.read(sSet, {
            filters : [oFlt],
            success : d => {
                console.log("📥 QA-02 rows retrieved:", d.results.length, d.results);
                ok(d.results || []);
            },
            error   : e => err(e)
        });
    });
},


/** Fetch QA-01 (candidate) rows                                  */
fetchQA01Items : function (sOrder) {
    const oModel = this.getView().getModel("ZSB_AU_QA02_ITEM");
    const sSet   = "/ZC_AU_QA01_ITEM";
    const oFlt   = new sap.ui.model.Filter("processorder", "EQ", sOrder);

    return new Promise((ok, err) => {
        oModel.read(sSet, {
            filters : [oFlt],
            success : d => {
                console.log("📥 QA-01 rows retrieved:", d.results.length, d.results);
                ok(d.results || []);
            },
            error   : e => err(e)
        });
    });
},


/* ---------- 3. Merge / de-duplicate -------------------------- */
buildRowList : function (aPosted, aQa01) {

    /* Normalise everything first */
    aPosted = aPosted.map(r => this._normaliseRow(r, true));
    aQa01   = aQa01  .map(r => this._normaliseRow(r, false));

    /* Fast duplicate check with a composite key */
    const key        = r => `${r.zdate}|${r.batch}|${r.boxno}`;
    const postedKeys = new Set(aPosted.map(key));

    const aNew = aQa01.filter(r => !postedKeys.has(key(r)));   // keep only brand-new rows

    /* Return QA-02 rows first (readonly) followed by editable QA-01 rows */
    return [ ...aPosted, ...aNew ];
},


           
            

            Tofetchdipsmater: function (odipsmodel, dispfilter) {
                return new Promise(function (resolve, reject) {
                    odipsmodel.read("/ZC_TB_ZDIPS", {
                        filters: [dispfilter],
                        success: function (odatadips) {
                            resolve(odatadips.results);
                        },
                        error: function (error) {
                            reject(error);
                        }
                    });
                });
            },
          
            
        });
    }
);
