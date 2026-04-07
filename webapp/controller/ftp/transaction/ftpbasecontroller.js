sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/model/json/JSONModel",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/m/MessageBox",
        "sap/ui/Device",
        'sap/m/SearchField',
        'sap/ui/model/type/String',
        'sap/m/ColumnListItem',
        'sap/m/Label',
        "sap/m/MessageToast",
        "sap/m/PDFViewer",
        "zautodesignapp/util/jspdf/html2canvasmin",
        "zautodesignapp/util/jspdf/jspdfmin",
        "zautodesignapp/util/PDFLib",
        'sap/ui/core/library',
        "sap/ui/core/Core"
    ],
    function (Controller, JSONModel, Filter, FilterOperator, MessageBox, ODataModel, Device, SearchField, TypeString, PDFLibjs, pdfjsLib, pdf, ColumnListItem, Label, MessageToast, PDFViewer) {
        "use strict";

        return Controller.extend("zautodesignapp.controller.ftp.transaction.ftpbasecontroller", {
            onInit: function () {
                // Shared models for all screens

                // Screen-1 TABLE ITEM MODEL ROW SELECT 
                this.screenModel = new sap.ui.model.json.JSONModel({
                    openscreen: "screen1"
                });
                this.getView().setModel(this.screenModel, "ScreenVisible");

                this.selectedRowModel = new sap.ui.model.json.JSONModel({

                });
                this.getView().setModel(this.selectedRowModel, "SelectedRow");


                // Screen-1 Header Select Model

                this.ftModel = new sap.ui.model.json.JSONModel({
                    HeaderData: [{
                        daterange: "",
                        processorder: "",
                        Batch: ""
                    }],
                    TableVisible: false
                });
                this.getView().setModel(this.ftModel, "ftModel");



                // Screen-2  Header Select Model


                this.screen2headermodel = new sap.ui.model.json.JSONModel({
                    HEADERDATA: { QA_Conf: 0 }
                });
                this.getView().setModel(this.screen2headermodel, "screen2model");

                // Get the URL of the image
                // var svgLogo = sap.ui.require.toUrl("zautodesignapp/images/NCL.png");

                // // Create a new JSON model with the image URL
                // var oModel11 = new sap.ui.model.json.JSONModel({
                //     svgLogo: svgLogo
                // });

                // // Set the model to the view
                // this.getView().setModel(oModel11);

                // // Log the image URL for debugging
                // console.log("Image URL:", oModel11.oData.svgLogo);

                // this._PDFViewer = new sap.m.PDFViewer({
                //     width: "auto",
                //     // source: pdfUrl
                // });
                // jQuery.sap.addUrlWhitelist("blob");



                this._pdfViewer = new sap.m.PDFViewer({
                    isTrustedSource: true,
                    width: "100%",
                    height: "600px", // Adjust height as needed
                    title: " "
                });
                this.getView().addDependent(this._pdfViewer);




                // Function to update current time dynamically
                const updateDateTime = () => {
                    try {
                        // Get current date
                        const now = new Date();
                        const dd = String(now.getDate()).padStart(2, '0');
                        const mm = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero-based
                        const yyyy = now.getFullYear();
                        const currentDate = `${dd}-${mm}-${yyyy}`;

                        // Get current time
                        const currentTime = now.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: true
                        });

                        // Set both date and time to model
                        this.screen2headermodel.setProperty("/HEADERDATA/currentDate", currentDate);
                        this.screen2headermodel.setProperty("/HEADERDATA/currentTime", currentTime);
                    } catch (error) {
                        console.error("Error updating date and time:", error);
                    }
                };

                // Start updating time and date every second after a short delay
                setTimeout(() => {
                    updateDateTime(); // Initial call
                    setInterval(updateDateTime, 1000); // Update every second
                }, 500);

            },






            // Screen-1 validate range
            validateDateRange: function () {
                const headerData = this.ftModel.getProperty("/HeaderData/0");
                const dateRange = headerData.daterange;

                if (!dateRange) {
                    MessageBox.error("Please select a date range.");
                    return false;
                }

                return true;
            },

            showScreen: function (screenName) {
                this.screenModel.setProperty("/openscreen", screenName);
            },


            // Screen-1 row select  
            // Screen 1 - once selected the checkbox, this event will trigger
            handleRowSelect: async function (oEvent) {

                const table = oEvent.getSource();
                const selectedIndex = table.getSelectedIndex();
                sap.ui.core.BusyIndicator.show(); // Show busy indicator

                if (selectedIndex >= 0) {
                    const context = table.getContextByIndex(selectedIndex);
                    const selectedData = context.getObject();
                    let Rem_Qty = parseFloat(selectedData.Rem_Qty)
                    console.log("selectedData:::::", selectedData.ManufacturingOrder);

                    let numericRemQty = parseFloat(Rem_Qty).toFixed(3);

                    this.numericRemQty2 = numericRemQty

                    let ManuFacorderModel = this.getView().getModel("ZAU_FT_PROCESSORDER_SRVB_");
                    let Value = selectedData.ManufacturingOrder;
                    let reserve = selectedData.Reservation;
                    let ProductionPlant = selectedData.ProductionPlant;
                    let StorageLocation = selectedData.StorageLocation;

                    // 1st, Here we need to validate the process order internally saved or Not. 
                    // Note: Already saved and goods_issue and goods_receipt !== "" = You should trigger from screen1 data.
                    let Filter01 = new sap.ui.model.Filter("ManufacturingOrder", sap.ui.model.FilterOperator.EQ, Value);
                    let Filter02 = new sap.ui.model.Filter("Reservation", sap.ui.model.FilterOperator.EQ, reserve);
                    let filterstatusactive = new sap.ui.model.Filter("StatusIsActive", sap.ui.model.FilterOperator.EQ, true);

                    let Filter01_IntTable = new sap.ui.model.Filter("Prodorderno", sap.ui.model.FilterOperator.EQ, "00" + Value);
                    let Filter02_IntTable = new sap.ui.model.Filter("Createdby", sap.ui.model.FilterOperator.EQ, String(this.TENTUSERID));

                    var oModelGet = this.getView().getModel("ZSB_AU_FT_HEADER");
                    var oModelGetItem = this.getView().getModel("ZSB_AU_FT_ITEM");

                    let GetProcessOrderStatus = await this.ToCheckProcOrderStatus(ManuFacorderModel, Filter01, filterstatusactive);
                    if (GetProcessOrderStatus.results.length === 0) {
                        sap.m.MessageBox.error("Please release the process order...");
                        sap.ui.core.BusyIndicator.hide();
                        return;
                    }
                    console.log("GetProcessOrderStatus:", GetProcessOrderStatus)
                    // debugger
                    let GetInternalTabDatas = await this.ToCheckProcOrderInInternally(Value, Filter01_IntTable, Filter02_IntTable, oModelGet);
                    console.log('GetInternalTabDatas:', GetInternalTabDatas);
                    if (GetInternalTabDatas.length > 0) {

                        if (GetInternalTabDatas[0].saved === "X" && GetInternalTabDatas[0].goods_issue === "" && GetInternalTabDatas[0].goods_receipt === "" && numericRemQty > 0.000) {
                            try {
                                let Filter03_IntTable = new sap.ui.model.Filter("Id", sap.ui.model.FilterOperator.EQ, GetInternalTabDatas[0].Id);
                                let GetInternalTabDatasItems = await this.ToCheckProcOrderInInternallyItem(Filter03_IntTable, oModelGetItem);

                                this.screen2headermodel = new sap.ui.model.json.JSONModel({
                                    HEADERDATA: {
                                        "Id": GetInternalTabDatas[0].Id,
                                        "Batch": GetInternalTabDatas[0].Acmbatchno,
                                        "Zsize": GetInternalTabDatas[0].Zsize,
                                        "cap_Body": GetInternalTabDatas[0].Cb,
                                        "Colours": GetInternalTabDatas[0].Colourname,
                                        "Colour": GetInternalTabDatas[0].Colourcode,
                                        "ManufacturingOrder": GetInternalTabDatas[0].Prodorderno,
                                        "FTNO": GetInternalTabDatas[0].Ftno,
                                        "QAConf": GetInternalTabDatas[0].Qaconf,
                                        "chemist": GetInternalTabDatas[0].Chemist,
                                        "QA": GetInternalTabDatas[0].Qa,
                                        "Shift": GetInternalTabDatas[0].Shift,
                                        "Enter_Qty": GetInternalTabDatas[0].ftqty,
                                        "Enter_Qty_After": GetInternalTabDatas[0].ftqty,
                                        "Ref_No": GetInternalTabDatas[0].Id,
                                        "goods_issue": GetInternalTabDatas[0].goods_issue,
                                        "goods_receipt": GetInternalTabDatas[0].goods_receipt,
                                        "Rem_Qty": numericRemQty,
                                        "ProductionPlant": GetInternalTabDatas[0].ProductionPlant,
                                        "StorageLocation": GetInternalTabDatas[0].StorageLocation,
                                        "temperature": GetInternalTabDatas[0].temperature,
                                        "reserve": reserve,
                                        "entrydate": GetInternalTabDatas[0].entrydate,


                                    }
                                });
                                this.getView().setModel(this.screen2headermodel, "screen2model");

                                this.screen2headermodel.refresh();

                                // Updating the button function after store the custom table
                                let ButtonJsonModel = this.ButtonStatus.getProperty("/Buttons/")
                                ButtonJsonModel.create = false;
                                ButtonJsonModel.update = true;
                                ButtonJsonModel.print = false;
                                ButtonJsonModel.gi = true;
                                // ButtonJsonModel.gi = GetInternalTabDatas[0].goods_issue === "" ? true : false;
                                ButtonJsonModel.gr = false;
                                // ButtonJsonModel.gr = GetInternalTabDatas[0].goods_receipt === "" ? true : false;
                                this.ButtonStatus.refresh();

                                let ItemsArray = [];

                                for (let i = 0; i < GetInternalTabDatasItems.length; i++) {
                                    let Customss = {
                                        "SapUuid": GetInternalTabDatasItems[i].SapUuid,
                                        "Sr_no": GetInternalTabDatasItems[i].Sno,
                                        "Product": GetInternalTabDatasItems[i].Matnr,
                                        "ProductName": GetInternalTabDatasItems[i].Maktx,
                                        "Batch": GetInternalTabDatasItems[i].Charg,
                                        // "Plant":GetInternalTabDatasItems[i].Qty,
                                        "ResvnItmRequiredQtyInEntryUnit": GetInternalTabDatasItems[i].Qty,
                                        "ResvnItmRequiredQtyInEntryUnit_Old": GetInternalTabDatasItems[i].Qty,
                                        "Old_Item_Qty": GetInternalTabDatasItems[i].Old_Item_Qty,
                                        "QA_Conf": GetInternalTabDatasItems[i].QaConf,
                                        "EntryUnit": GetInternalTabDatasItems[i].Unit,
                                        "StorageLocation": GetInternalTabDatasItems[i].StorageLocation
                                    }
                                    ItemsArray.push(Customss)
                                }

                                this.tabModels = new sap.ui.model.json.JSONModel({
                                    ItemDatas: ItemsArray,
                                });
                                this.getView().setModel(this.tabModels, "TabModels");
                                console.log("this.tabModels:", this.tabModels)
                                this.tabModels.refresh()

                                this.showScreen("screen2");
                            } catch (error) {
                                console.log("Error occurred:", error);
                                sap.ui.core.BusyIndicator.hide();
                                return
                            } finally {
                                sap.ui.core.BusyIndicator.hide(); // Hide busy indicator after async operations complete
                            }

                        } else if (GetInternalTabDatas[0].saved === "X" && GetInternalTabDatas[0].goods_receipt === "") {

                            try {

                                let Filter03_IntTable = new sap.ui.model.Filter("Id", sap.ui.model.FilterOperator.EQ, GetInternalTabDatas[0].Id);
                                let GetInternalTabDatasItems = await this.ToCheckProcOrderInInternallyItem(Filter03_IntTable, oModelGetItem);

                                this.screen2headermodel = new sap.ui.model.json.JSONModel({
                                    HEADERDATA: {
                                        "Id": GetInternalTabDatas[0].Id,
                                        "Batch": GetInternalTabDatas[0].Acmbatchno,
                                        "Zsize": GetInternalTabDatas[0].Zsize,
                                        "cap_Body": GetInternalTabDatas[0].Cb,
                                        "Colours": GetInternalTabDatas[0].Colourname,
                                        "Colour": GetInternalTabDatas[0].Colourcode,
                                        "ManufacturingOrder": GetInternalTabDatas[0].Prodorderno,
                                        "FTNO": GetInternalTabDatas[0].Ftno,
                                        "QAConf": GetInternalTabDatas[0].Qaconf,
                                        "chemist": GetInternalTabDatas[0].Chemist,
                                        "QA": GetInternalTabDatas[0].Qa,
                                        "Shift": GetInternalTabDatas[0].Shift,
                                        "Enter_Qty": GetInternalTabDatas[0].ftqty,
                                        "Enter_Qty_After": GetInternalTabDatas[0].ftqty,
                                        "Ref_No": GetInternalTabDatas[0].Id,
                                        "goods_issue": GetInternalTabDatas[0].goods_issue,
                                        "goods_receipt": GetInternalTabDatas[0].goods_receipt,
                                        "Rem_Qty": numericRemQty,
                                        "ProductionPlant": GetInternalTabDatas[0].ProductionPlant,
                                        "StorageLocation": GetInternalTabDatas[0].StorageLocation,
                                        "temperature": GetInternalTabDatas[0].temperature,
                                        "reserve": reserve,
                                        "entrydate": GetInternalTabDatas[0].entrydate,


                                    }
                                });
                                this.getView().setModel(this.screen2headermodel, "screen2model");
                                this.screen2headermodel.refresh();

                                // Updating the button function after store the custom table
                                let ButtonJsonModel = this.ButtonStatus.getProperty("/Buttons/")
                                ButtonJsonModel.create = false;
                                ButtonJsonModel.update = true;
                                ButtonJsonModel.print = false;
                                ButtonJsonModel.gi = false;
                                // ButtonJsonModel.gi = GetInternalTabDatas[0].goods_issue === "" ? true : false;
                                ButtonJsonModel.gr = GetInternalTabDatas[0].goods_receipt === "" ? true : false;
                                this.ButtonStatus.refresh();

                                let ItemsArray = [];

                                for (let i = 0; i < GetInternalTabDatasItems.length; i++) {
                                    let Customss = {
                                        "SapUuid": GetInternalTabDatasItems[i].SapUuid,
                                        "Sr_no": GetInternalTabDatasItems[i].Sno,
                                        "Product": GetInternalTabDatasItems[i].Matnr,
                                        "ProductName": GetInternalTabDatasItems[i].Maktx,
                                        "Batch": GetInternalTabDatasItems[i].Charg,
                                        // "Plant":GetInternalTabDatasItems[i].Qty,
                                        "ResvnItmRequiredQtyInEntryUnit": GetInternalTabDatasItems[i].Qty,
                                        "ResvnItmRequiredQtyInEntryUnit_Old": GetInternalTabDatasItems[i].Qty,
                                        "Old_Item_Qty": GetInternalTabDatasItems[i].Old_Item_Qty,
                                        "QA_Conf": GetInternalTabDatasItems[i].QaConf,
                                        "EntryUnit": GetInternalTabDatasItems[i].Unit,
                                        "StorageLocation": GetInternalTabDatasItems[i].StorageLocation
                                    }
                                    ItemsArray.push(Customss)
                                }

                                this.tabModels = new sap.ui.model.json.JSONModel({
                                    ItemDatas: ItemsArray,
                                });
                                this.getView().setModel(this.tabModels, "TabModels");
                                console.log("this.tabModels:", this.tabModels)
                                this.tabModels.refresh()

                                this.showScreen("screen2");
                            } catch (error) {
                                console.log("Error occurred:", error);
                                sap.ui.core.BusyIndicator.hide();
                                return
                            } finally {
                                sap.ui.core.BusyIndicator.hide(); // Hide busy indicator after async operations complete
                            }

                        } else {

                            if (!isNaN(numericRemQty) && numericRemQty > 0) {
                                this.selectedRowModel.setData(selectedData);
                                this.showScreen("screen2");
                            } else {
                                sap.m.MessageBox.error("Select the valid data quantity of production order");
                                sap.ui.core.BusyIndicator.hide();
                                return
                            }

                            try {
                                let Datas001 = await this.ProOrderHeaderFetch(ManuFacorderModel, Value, Filter01);
                                this.screen2headermodel = new sap.ui.model.json.JSONModel({
                                    HEADERDATA: Datas001
                                });
                                this.getView().setModel(this.screen2headermodel, "screen2model");
                                this.screen2headermodel.refresh();

                                // For assigning the Rem_QYU value to Enter_Qty 
                                // Jist adding the new propery name Enter_Qty 
                                let headerData = this.screen2headermodel.getProperty("/HEADERDATA/");
                                // parseFloat(Total).toFixed(2)
                                headerData.Enter_Qty = Rem_Qty; // Update with selected Gate Name
                                headerData.Enter_Qty_After = Rem_Qty; // Update with selected Gate Name
                                headerData.chemist = ''; // Update with selected Gate Name
                                headerData.QA = '' // Update with selected Gate Name
                                headerData.Shift = '' // Update with selected Gate Name

                                // Splitting the FT value
                                // try {
                                let FtValue = headerData.FT_Sl_No.split("-")
                                let arr1 = FtValue[0];
                                let arr2 = FtValue[1];

                                if (arr1 !== "" && arr2 !== undefined) {
                                    headerData.FTNO = arr2 ? parseInt(arr2) + 1 : 1;
                                } else {
                                    headerData.FTNO = arr1 ? parseInt(arr1) + 1 : 1;
                                }

                                this.screen2headermodel.refresh();

                                let Datas002 = await this.ProOrderItemFetch(ManuFacorderModel, Value, Filter02);

                                this.tabModels = new sap.ui.model.json.JSONModel({
                                    ItemDatas: Datas002,
                                });
                                this.getView().setModel(this.tabModels, "TabModels");
                                console.log("this.tabModels:", this.tabModels)

                                let ItemData = this.tabModels.getProperty("/ItemDatas/");
                                // let itemValue = parseFloat(oContext.ResvnItmRequiredQtyInEntryUnit);
                                // Here i adding the Old Item Qty
                                // I assign the value from ResvnItmRequiredQtyInEntryUnit to Old_Item_Qty
                                ItemData.forEach((oContext) => {
                                    oContext.Old_Item_Qty = oContext.ResvnItmRequiredQtyInEntryUnit // Update with selected Gate Name
                                });
                                this.tabModels.refresh();

                                console.log("this.tabModels_After_Adding:", this.tabModels)


                            } catch (error) {
                                console.log("Error occurred:", error);
                            } finally {
                                sap.ui.core.BusyIndicator.hide(); // Hide busy indicator after async operations complete
                            }

                        }

                    }

                    else {

                        if (!isNaN(numericRemQty) && numericRemQty > 0) {
                            this.selectedRowModel.setData(selectedData);
                            this.showScreen("screen2");
                        } else {
                            sap.m.MessageBox.error("Select the valid data quantity of production order");
                            sap.ui.core.BusyIndicator.hide();
                            return
                        }


                        try {
                            let Datas001 = await this.ProOrderHeaderFetch(ManuFacorderModel, Value, Filter01);
                            this.screen2headermodel = new sap.ui.model.json.JSONModel({
                                HEADERDATA: Datas001
                            });
                            this.getView().setModel(this.screen2headermodel, "screen2model");
                            this.screen2headermodel.refresh();

                            // For assigning the Rem_QYU value to Enter_Qty 
                            // Jist adding the new propery name Enter_Qty 
                            let headerData = this.screen2headermodel.getProperty("/HEADERDATA/");
                            // parseFloat(Total).toFixed(2)
                            //headerData.Enter_Qty = parseFloat(Rem_Qty).toFixed(2); // Update with selected Gate Name
                            headerData.Enter_Qty = Rem_Qty;
                            headerData.Enter_Qty_After = Rem_Qty;
                            headerData.chemist = ''; // Update with selected Gate Name
                            headerData.QA = '' // Update with selected Gate Name
                            headerData.Shift = '' // Update with selected Gate Name
                            headerData.reserve = reserve // Update with selected Gate Name


                            // Splitting the FT value
                            // try {
                            let FtValue = headerData.FT_Sl_No.split("-")
                            let arr1 = FtValue[0];
                            let arr2 = FtValue[1];

                            if (arr1 !== "" && arr2 !== undefined) {
                                headerData.FTNO = arr2 ? parseInt(arr2) + 1 : 1;
                            } else {
                                headerData.FTNO = arr1 ? parseInt(arr1) + 1 : 1;
                            }

                            this.screen2headermodel.refresh();

                            let Datas002 = await this.ProOrderItemFetch(ManuFacorderModel, Value, Filter02);

                            this.tabModels = new sap.ui.model.json.JSONModel({
                                ItemDatas: Datas002,
                            });
                            this.getView().setModel(this.tabModels, "TabModels");
                            console.log("this.tabModels:", this.tabModels)

                            let ItemData = this.tabModels.getProperty("/ItemDatas/");
                            // let itemValue = parseFloat(oContext.ResvnItmRequiredQtyInEntryUnit);
                            // Here i adding the Old Item Qty
                            // I assign the value from ResvnItmRequiredQtyInEntryUnit to Old_Item_Qty
                            ItemData.forEach((oContext) => {
                                oContext.Old_Item_Qty = oContext.ResvnItmRequiredQtyInEntryUnit // Update with selected Gate Name
                            });
                            this.tabModels.refresh();

                            console.log("this.tabModels_After_Adding:", this.tabModels)


                        } catch (error) {
                            console.log("Error occurred:", error);
                        } finally {
                            sap.ui.core.BusyIndicator.hide(); // Hide busy indicator after async operations complete
                        }

                    }

                } else {

                    //  sap.m.MessageBox.error("Select the valid data quantity of production order");
                    sap.ui.core.BusyIndicator.hide();
                    return
                }
            },

            // To check the process order in internal table stored or not
            ToCheckProcOrderStatus: function (ManuFacorderModel, Filter01, filterstatusactive) {
                return new Promise(function (resolve, reject) {
                    // var that = this;
                    sap.ui.core.BusyIndicator.show(); // Show busy indicator

                    try {
                        ManuFacorderModel.read("/ZCE_PO_STATUS", {
                            filters: [Filter01, filterstatusactive],
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

            // To check the process order in internal table stored or not
            // ToCheckProcOrderInInternally: function (ManufacturingOrder, Filter01, Filter02, oModelGet) {
            //     return new Promise(function (resolve, reject) {
            //         // var that = this;
            //         sap.ui.core.BusyIndicator.show(); // Show busy indicator

            //         var topValue = 5000;
            //         var skipValue = 0;

            //         try {
            //             oModelGet.read("/ZC_AU_FT_HEADER", {

            //                 urlParameters: {
            //                     "$top": topValue,
            //                     "$skip": skipValue
            //                 },
            //                 filters: [Filter01],
            //                 urlParameters: {
            //                     "$orderby": "Id desc"
            //                 },
            //                 success: function (oData) {
            //                     // sap.ui.core.BusyIndicator.hide(); // Hide busy indicator on success
            //                     resolve(oData.results);
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




            ToCheckProcOrderInInternally: function (ManufacturingOrder, Filter01, Filter02, oModelGet) {
    return new Promise(function (resolve, reject) {
        sap.ui.core.BusyIndicator.show(); // Show busy indicator

        var topValue = 5000;
        var skipValue = 0;

        try {
            oModelGet.read("/ZC_AU_FT_HEADER", {
                urlParameters: {
                    "$top": topValue,
                    "$skip": skipValue,
                    "$orderby": "Id desc"
                },
                filters: [Filter01],

                success: function (oData) {

                    try {
                        oData.results.sort((a, b) => {

                            let numA = Number(a.Id);
                            let numB = Number(b.Id);

                            // If both IDs are numeric → use numeric sort
                            if (!isNaN(numA) && !isNaN(numB)) {
                                return numB - numA; // Desc numeric
                            }

                            // // If ANY ID is non-numeric → use string sort
                            // return b.Id.localeCompare(a.Id);
                        });
                    } catch (e) {
                        console.log("Sorting failed, returning original order:", e);
                    }

                    resolve(oData.results);
                },

                error: function (error) {
                    console.log("Error:", error);
                    sap.ui.core.BusyIndicator.hide(); 
                    reject(error);
                }
            });

        } catch (error) {
            resolve([]);
        }
    });
},


            // ToCheckProcOrderInInternally: async function (ManufacturingOrder, Filter01, Filter02, oModelGet) {
            //     sap.ui.core.BusyIndicator.show(0); // Show busy indicator

            //     const allResults = [];
            //     const top = 100; // Number of records per batch
            //     let skip = 0;
            //     let hasMoreData = true;

            //     const filters = [];
            //     if (Filter01) filters.push(Filter01);
            //     if (Filter02) filters.push(Filter02);

            //     const readPage = (skipCount) => {
            //         return new Promise((resolve, reject) => {
            //             oModelGet.read("/ZC_AU_FT_HEADER", {
            //                 filters: filters,
            //                 urlParameters: {
            //                     "$top": top,
            //                     "$skip": skipCount,
            //                     "$orderby": "Id desc"
            //                 },
            //                 success: function (oData) {
            //                     resolve(oData.results || []);
            //                 },
            //                 error: function (error) {
            //                     console.error("❌ Error fetching FT header data:", error);
            //                     sap.m.MessageToast.show("Failed to load FT header data.");
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
            //                 hasMoreData = false; // Last batch
            //             } else {
            //                 skip += top; // Next batch
            //             }
            //         }

            //         return allResults;

            //     } catch (error) {
            //         console.error("❌ Exception during FT header fetch:", error);
            //         return [];

            //     } finally {
            //         sap.ui.core.BusyIndicator.hide(); // Always hide BusyIndicator
            //     }
            // },

            ToCheckProcOrderInInternally2: function (Filter03_IntTable, oModelGet) {
                return new Promise(function (resolve, reject) {
                    // var that = this;
                    sap.ui.core.BusyIndicator.show(); // Show busy indicator

                    try {

                        var topValue = 5000;
                        var skipValue = 0;
                        oModelGet.read("/ZC_AU_FT_HEADER", {

                            urlParameters: {
                                "$top": topValue,
                                "$skip": skipValue
                            },
                            filters: [Filter03_IntTable],
                            success: function (oData) {
                                // sap.ui.core.BusyIndicator.hide(); // Hide busy indicator on success
                                resolve(oData.results);
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




            ToCheckProcOrderInInternallyItem: function (Filter03_IntTable, oModelGetItem) {
                return new Promise(function (resolve, reject) {
                    // var that = this;
                    sap.ui.core.BusyIndicator.show(); // Show busy indicator

                    try {

                        var topValue = 5000;
                        var skipValue = 0;
                        oModelGetItem.read("/ZC_AU_FT_ITEM", {

                            urlParameters: {
                                "$top": topValue,
                                "$skip": skipValue
                            },
                            filters: [Filter03_IntTable],
                            success: function (oData) {
                                // sap.ui.core.BusyIndicator.hide(); // Hide busy indicator on success
                                resolve(oData.results);
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



            // ToCheckProcOrderInInternallyItem: async function (Filter03_IntTable, oModelGetItem) {
            //     sap.ui.core.BusyIndicator.show(0); // Show busy indicator

            //     const allResults = [];
            //     const top = 100; // Number of records per batch
            //     let skip = 0;
            //     let hasMoreData = true;

            //     const filters = [];
            //     if (Filter03_IntTable) filters.push(Filter03_IntTable);

            //     const readPage = (skipCount) => {
            //         return new Promise((resolve, reject) => {
            //             oModelGetItem.read("/ZC_AU_FT_ITEM", {
            //                 filters: filters,
            //                 urlParameters: {
            //                     "$top": top,
            //                     "$skip": skipCount
            //                 },
            //                 success: function (oData) {
            //                     resolve(oData.results || []);
            //                 },
            //                 error: function (error) {
            //                     console.error("❌ Error fetching FT item data:", error);
            //                     sap.m.MessageToast.show("Failed to load FT item data.");
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
            //                 hasMoreData = false; // Last batch
            //             } else {
            //                 skip += top; // Next batch
            //             }
            //         }

            //         return allResults;

            //     } catch (error) {
            //         console.error("❌ Exception during FT item fetch:", error);
            //         return [];

            //     } finally {
            //         sap.ui.core.BusyIndicator.hide(); // Always hide BusyIndicator
            //     }
            // },




            ProOrderHeaderFetch: function (ManuFacorderModel, Value, Filter01) {
                return new Promise(function (resolve, reject) {
                    sap.ui.core.BusyIndicator.show(); // Show busy indicator

                    var topValue = 5000;
                    var skipValue = 0;
                    ManuFacorderModel.read("/ZCE_FT_PROCESSORDER", {

                        urlParameters: {
                            "$top": topValue,
                            "$skip": skipValue
                        },
                        filters: [Filter01],
                        success: function (oData) {
                            // sap.ui.core.BusyIndicator.hide(); // Hide busy indicator on success
                            resolve(oData.results[0]);
                        },
                        error: function (error) {
                            console.log("Error:", error);
                            sap.ui.core.BusyIndicator.hide(); // Hide busy indicator on error
                            reject(error);
                        }
                    });
                });
            },




            // ProOrderHeaderFetch: async function (ManuFacorderModel, Value, Filter01) {
            //     sap.ui.core.BusyIndicator.show(0); // Show busy indicator

            //     const allResults = [];
            //     const top = 100; // Number of records per batch
            //     let skip = 0;
            //     let hasMoreData = true;

            //     const filters = [];
            //     if (Filter01) filters.push(Filter01);

            //     const readPage = (skipCount) => {
            //         return new Promise((resolve, reject) => {
            //             ManuFacorderModel.read("/ZCE_FT_PROCESSORDER", {
            //                 filters: filters,
            //                 urlParameters: {
            //                     "$top": top,
            //                     "$skip": skipCount
            //                 },
            //                 success: function (oData) {
            //                     resolve(oData.results || []);
            //                 },
            //                 error: function (error) {
            //                     console.error("❌ Error fetching process order header:", error);
            //                     sap.m.MessageToast.show("Failed to load process order header data.");
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
            //                 hasMoreData = false; // Last batch
            //             } else {
            //                 skip += top; // Next batch
            //             }
            //         }

            //         // Return first result (like original) or all if needed
            //         return allResults.length > 0 ? allResults[0] : null;

            //     } catch (error) {
            //         console.error("❌ Exception during process order header fetch:", error);
            //         return null;

            //     } finally {
            //         sap.ui.core.BusyIndicator.hide(); // Always hide BusyIndicator
            //     }
            // },





            ProOrderItemFetch: function (ManuFacorderModel, Value, Filter02) {
                return new Promise(function (resolve, reject) {
                    sap.ui.core.BusyIndicator.show(); // Show busy indicator
                    var topValue = 5000;
                    var skipValue = 0;
                    ManuFacorderModel.read("/ZCE_FT_RESERVATION", {
                        urlParameters: {
                            "$top": topValue,
                            "$skip": skipValue
                        },
                        filters: [Filter02],
                        success: function (oData) {
                            // sap.ui.core.BusyIndicator.hide(); // Hide busy indicator on success
                            resolve(oData.results);
                        },
                        error: function (error) {
                            console.log("Error:", error);
                            sap.ui.core.BusyIndicator.hide(); // Hide busy indicator on error
                            reject(error);
                        }
                    });
                });
            },





            // ProOrderItemFetch: async function (ManuFacorderModel, Value, Filter02) {
            //     sap.ui.core.BusyIndicator.show(0); // Show busy indicator

            //     const allResults = [];
            //     const top = 100; // Number of records per batch
            //     let skip = 0;
            //     let hasMoreData = true;

            //     const filters = [];
            //     if (Filter02) filters.push(Filter02);

            //     const readPage = (skipCount) => {
            //         return new Promise((resolve, reject) => {
            //             ManuFacorderModel.read("/ZCE_FT_RESERVATION", {
            //                 filters: filters,
            //                 urlParameters: {
            //                     "$top": top,
            //                     "$skip": skipCount
            //                 },
            //                 success: function (oData) {
            //                     resolve(oData.results || []);
            //                 },
            //                 error: function (error) {
            //                     console.error("❌ Error fetching process order items:", error);
            //                     sap.m.MessageToast.show("Failed to load process order items.");
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
            //                 hasMoreData = false; // Last batch
            //             } else {
            //                 skip += top; // Next batch
            //             }
            //         }

            //         return allResults;

            //     } catch (error) {
            //         console.error("❌ Exception during process order item fetch:", error);
            //         return [];

            //     } finally {
            //         sap.ui.core.BusyIndicator.hide(); // Always hide BusyIndicator
            //     }
            // },



            onBeforeRendering: async function () {

                // Get Session User  
                var userInfoService = sap.ushell.Container.getService("UserInfo");
                var userName = userInfoService.getUser().getFullName();
                this.TENTUSERID = userInfoService.getUser().getId();
                this.TENTUSERNAME = userInfoService.getUser().getFullName();
                console.log("getId:", this.TENTUSERID);
                console.log("User Name: " + this.TENTUSERNAME);

                sap.ui.core.BusyIndicator.hide();

            },

            onQuantityChange: async function (oEvent) {

                // need to add create and update button based. 
                // if{currentscreenbutton === true}{
                //      new code should write this.headerdatas
                //      Keep in mind, while retriving (like input empty data or zero), should get created time input value not actual quantity.  
                // }else - in below code as usual. 

                // Keep in mind, model data should update based on quantity. i need to add extra one temp frontend field or json model temp field.

                // Button flow also they damaged, need to add properly

                let getButtonStatus = this.getView().getModel("ButtonStatus");
                let getButtonStatusProp = getButtonStatus.getProperty("/Buttons")
                console.log("getButtonStatusProp :".getButtonStatusProp)

                console.log("ItemDatas:_kk", this.tabModels.getProperty("/ItemDatas/"));


                if (getButtonStatusProp.create === true) {
                    console.log("oEvent:", oEvent);

                    // Convert user input to float
                    let getData = parseFloat(oEvent.mParameters.value);
                    console.log("getData:", getData);

                    // Get header data and ensure Rem_Qty is a number
                    let headerdatas = this.screen2headermodel.getProperty("/HEADERDATA/");
                    let RemValue = parseFloat(headerdatas.Rem_Qty);
                    let RemValue01 = parseFloat(headerdatas.Enter_Qty_After);
                    console.log("headerdatas:", headerdatas);
                    console.log("RemValue:", RemValue);

                    // Validate input
                    if (getData === 0 || isNaN(getData) || getData < 0 || getData > RemValue) {
                        // Reset to original remaining quantity
                        headerdatas.Enter_Qty = RemValue01.toFixed(2);

                        let itemData = this.tabModels.getProperty("/ItemDatas/");
                        if (itemData && Array.isArray(itemData)) {
                            itemData.forEach((oContext) => {
                                oContext.ResvnItmRequiredQtyInEntryUnit = parseFloat(oContext.Old_Item_Qty).toFixed(2);
                            });
                            this.tabModels.setProperty("/ItemDatas/", itemData);
                            this.tabModels.refresh();
                        }

                        sap.m.MessageBox.error("Quantity cannot be zero or invalid. Please enter a valid quantity.");
                        return;
                    }

                    // Proceed with proportional update
                    let itemData = this.tabModels.getProperty("/ItemDatas/");
                    console.log("itemData:", itemData);

                    if (itemData && Array.isArray(itemData)) {
                        itemData.forEach((oContext) => {
                            let itemValue = parseFloat(oContext.Old_Item_Qty);
                            let newQty = (getData / RemValue) * itemValue;
                            oContext.ResvnItmRequiredQtyInEntryUnit = parseFloat(newQty).toFixed(3);
                        });

                        this.tabModels.setProperty("/ItemDatas/", itemData);
                        this.tabModels.refresh();
                    }

                }
                else {

                    console.log("oEvent:", oEvent);

                    // Convert user input to float
                    let getData = parseFloat(oEvent.mParameters.value);
                    console.log("getData:", getData);

                    // Get header data and ensure Rem_Qty is a number
                    let headerdatas = this.screen2headermodel.getProperty("/HEADERDATA/");
                    let RemValue = parseFloat(headerdatas.Rem_Qty);
                    let RemValue01 = parseFloat(headerdatas.Enter_Qty_After);
                    console.log("headerdatas:", headerdatas);
                    console.log("RemValue:", RemValue);

                    // Validate input
                    if (getData === 0 || isNaN(getData) || getData < 0 || getData > RemValue) {
                        // Reset to original remaining quantity
                        headerdatas.Enter_Qty = RemValue01.toFixed(2);

                        let itemData = this.tabModels.getProperty("/ItemDatas/");
                        if (itemData && Array.isArray(itemData)) {
                            itemData.forEach((oContext) => {
                                oContext.ResvnItmRequiredQtyInEntryUnit = parseFloat(oContext.ResvnItmRequiredQtyInEntryUnit_Old).toFixed(2);
                            });
                            this.tabModels.setProperty("/ItemDatas/", itemData);
                            this.tabModels.refresh();
                        }

                        sap.m.MessageBox.error("Quantity cannot be zero or invalid. Please enter a valid quantity.");
                        return;
                    }

                    // Proceed with proportional update
                    let itemData = this.tabModels.getProperty("/ItemDatas/");
                    console.log("itemData:", itemData);

                    if (itemData && Array.isArray(itemData)) {
                        itemData.forEach((oContext) => {
                            let itemValue = parseFloat(oContext.Old_Item_Qty);
                            let newQty = (getData / RemValue) * itemValue;
                            oContext.ResvnItmRequiredQtyInEntryUnit = parseFloat(newQty).toFixed(3);
                        });

                        this.tabModels.setProperty("/ItemDatas/", itemData);
                        this.tabModels.refresh();
                    }

                    let ButtonJsonModel = this.ButtonStatus.getProperty("/Buttons/")
                    ButtonJsonModel.create = false;
                    ButtonJsonModel.update = true;
                    ButtonJsonModel.gi = true;
                    ButtonJsonModel.print = false;
                    ButtonJsonModel.gr = false;
                    this.ButtonStatus.refresh();


                }

            },


            // Screen-2 On Submit select  start  
            onSubmitftscreen: async function () {

                sap.ui.core.BusyIndicator.show();

                // // While clicking the save button, i'm doing disable the save button. because we can control the duplicate entry. some times they will click multiple times so.
                // let ButtonJsonModel = this.ButtonStatus.getProperty("/Buttons/")
                //     ButtonJsonModel.create = false;
                //     this.ButtonStatus.refresh();

                var that = this; // Preserve the reference to the controller
                var oFilter11 = new sap.ui.model.Filter("Screencode", sap.ui.model.FilterOperator.EQ, "AU100");
                var CountoModel = this.getView().getModel("ZSB_AU_FT_HEADER");
                var oFilters11 = [oFilter11];
                if (CountoModel) {

                    let getHeaderData = this.screen2headermodel.getProperty("/HEADERDATA/");
                    let getItemData = this.tabModels.getProperty("/ItemDatas/");

                    if (getHeaderData.chemist === "" || getHeaderData.QA === "" || getHeaderData.Shift === "" || getHeaderData.temperature === "" || getHeaderData.entrydate === "") {
                        sap.m.MessageBox.error("Please enter all mandatory fields...")
                        sap.ui.core.BusyIndicator.hide();
                        return;
                    }
                    sap.ui.core.BusyIndicator.hide();
                    const is7SeriesPresent = getItemData.some(item => item.Product && String(item.Product).startsWith('7'));
                    console.log("is7SeriesPresent", is7SeriesPresent);

                    const is8SeriesPresent = getItemData.some(item => item.Product && String(item.Product).startsWith('8'));
                    console.log("is8SeriesPresent", is8SeriesPresent);

                    // if (is7SeriesPresent === false || is8SeriesPresent === false ) {
                    //     sap.m.MessageBox.error("Please add the GEL Material in order material list...")
                    //     sap.ui.core.BusyIndicator.hide();
                    //     return;
                    // }


                    if (!is7SeriesPresent && !is8SeriesPresent) {
                        sap.m.MessageBox.error("Please add the GEL Material in order material list...");
                        sap.ui.core.BusyIndicator.hide();
                        return;
                    }

                    this.getView().getModel("ZSB_AU_FT_HEADER").read("/ZC_AU_FT_HEADER/$count", { /* Decalure Globally in the Create table Serial Number */
                        filters: [oFilters11],
                        success: $.proxy(async function (oEvent, oResponse) {
                            let Count = Number(oResponse.body) + 1; // This should be a number, no need to use Number()
                            let CountLen = Count.toString(); // Convert to string to get its length
                            let AddData = "11";
                            let Data = 8 - CountLen.length;
                            let CountArray = "";
                            for (let i = 0; i < Data; i++) {
                                CountArray += "0";
                            }
                            console.log(AddData + CountArray + Count); // Concatenate strings correctly
                            //let LastId = AddData + CountArray + Count;
                            // let LastId = getHeaderData.id;

                            var po = getHeaderData.ManufacturingOrder
                            var FT = getHeaderData.FTNO

                            let paddedFT = String(FT).padStart(4, '0');

                            let LastId = `${po}${paddedFT}`;
                            console.log(LastId); // e.g. "110000072927"

                            await that.ToSaveFunc(LastId);
                            console.log("Success");

                            sap.m.MessageBox.success("Data saved internally...")

                            that.FinalStatus = new sap.ui.model.json.JSONModel({
                                MSGSTRIP: {
                                    "visible": true,
                                    "text": "FTP Reference Document No " + LastId,
                                    "type": 'Success'
                                }
                            });
                            that.getView().setModel(that.FinalStatus, "FinalStatus")

                            // Updating the button function after store the custom table
                            let ButtonJsonModel = that.ButtonStatus.getProperty("/Buttons/")
                            ButtonJsonModel.create = false;
                            ButtonJsonModel.update = true;
                            ButtonJsonModel.gi = true;
                            ButtonJsonModel.print = false;
                            ButtonJsonModel.gr = false;
                            that.ButtonStatus.refresh();

                            // Updating the FTP - Reference Doc no in Custom Table
                            getHeaderData.Ref_No = LastId;
                            // that.screen2headermodel.refresh()
                            var oModelGet = that.getView().getModel("ZSB_AU_FT_HEADER");
                            //let Filter02_IntTable = new sap.ui.model.Filter("Createdby", sap.ui.model.FilterOperator.EQ, String(this.TENTUSERID));

                            var oModelGetItem = that.getView().getModel("ZSB_AU_FT_ITEM");
                            let Filter03_IntTable = new sap.ui.model.Filter("Id", sap.ui.model.FilterOperator.EQ, getHeaderData.Ref_No);
                            let GetInternalTabDatasItems = await that.ToCheckProcOrderInInternallyItem(Filter03_IntTable, oModelGetItem);
                            // let GetInternalTabDatas = await that.ToCheckProcOrderInInternally(Filter03_IntTable, oModelGet);

                            //let Filter01_IntTable = new sap.ui.model.Filter("Prodorderno", sap.ui.model.FilterOperator.EQ, "00" + Value);

                            let GetInternalTabDatas = await this.ToCheckProcOrderInInternally2(Filter03_IntTable, oModelGet);


                            that.screen2headermodel = new sap.ui.model.json.JSONModel({
                                HEADERDATA: {

                                    "Id": GetInternalTabDatas[0].Id,
                                    "Batch": GetInternalTabDatas[0].Acmbatchno,
                                    "Zsize": GetInternalTabDatas[0].Zsize,
                                    "cap_Body": GetInternalTabDatas[0].Cb,
                                    "Colours": GetInternalTabDatas[0].Colourname,
                                    "Colour": GetInternalTabDatas[0].Colourcode,
                                    "ManufacturingOrder": GetInternalTabDatas[0].Prodorderno,
                                    "FTNO": GetInternalTabDatas[0].Ftno,
                                    "QAConf": GetInternalTabDatas[0].Qaconf,
                                    "chemist": GetInternalTabDatas[0].Chemist,
                                    "QA": GetInternalTabDatas[0].Qa,
                                    "Shift": GetInternalTabDatas[0].Shift,
                                    "Enter_Qty": GetInternalTabDatas[0].ftqty,
                                    "Enter_Qty_After": GetInternalTabDatas[0].ftqty,
                                    "Ref_No": GetInternalTabDatas[0].Id,
                                    "goods_issue": GetInternalTabDatas[0].goods_issue,
                                    "goods_receipt": GetInternalTabDatas[0].goods_receipt,
                                    "Rem_Qty": this.numericRemQty2,
                                    "ProductionPlant": GetInternalTabDatas[0].ProductionPlant,
                                    "StorageLocation": GetInternalTabDatas[0].StorageLocation,
                                    "temperature": GetInternalTabDatas[0].temperature,
                                    "entrydate": GetInternalTabDatas[0].entrydate,
                                    // "reserve": reserve


                                }
                            });
                            that.getView().setModel(that.screen2headermodel, "screen2model");

                            that.screen2headermodel.refresh();


                            let ItemsArray = [];

                            for (let i = 0; i < GetInternalTabDatasItems.length; i++) {
                                let Customss = {
                                    "SapUuid": GetInternalTabDatasItems[i].SapUuid,
                                    "Sr_no": GetInternalTabDatasItems[i].Sno,
                                    "Product": GetInternalTabDatasItems[i].Matnr,
                                    "ProductName": GetInternalTabDatasItems[i].Maktx,
                                    "Batch": GetInternalTabDatasItems[i].Charg,
                                    // "Plant":GetInternalTabDatasItems[i].Qty,
                                    "ResvnItmRequiredQtyInEntryUnit": GetInternalTabDatasItems[i].Qty,
                                    "ResvnItmRequiredQtyInEntryUnit_Old": GetInternalTabDatasItems[i].Qty,
                                    "Old_Item_Qty": GetInternalTabDatasItems[i].Old_Item_Qty,
                                    "QA_Conf": GetInternalTabDatasItems[i].QaConf,
                                    "EntryUnit": GetInternalTabDatasItems[i].Unit,
                                    "StorageLocation": GetInternalTabDatasItems[i].StorageLocation
                                }
                                ItemsArray.push(Customss)
                            }

                            that.tabModels = new sap.ui.model.json.JSONModel({
                                ItemDatas: ItemsArray,
                            });
                            that.getView().setModel(that.tabModels, "TabModels");
                            console.log("this.tabModels:", that.tabModels)
                            that.tabModels.refresh()


                            // For Refresh the page

                            // this.screen2headermodel = new sap.ui.model.json.JSONModel({
                            //     HEADERDATA:{QA_Conf: 0}
                            // });
                            // this.getView().setModel(this.screen2headermodel,"screen2model")



                            // this.tabModels = new sap.ui.model.json.JSONModel({
                            //     ItemDatas :
                            //        { }

                            //  })
                            //   this.getView().setModel(this.tabModels,"TabModels")

                            // For Refresh the page

                            sap.ui.core.BusyIndicator.hide();
                        }, this)
                    });

                } else {
                    console.error("ZSB_AU_FT_HEADER model is undefined.");
                }


            },

            ToSaveFunc: function (GetId) {

                return new Promise((resolve, reject) => {
                    sap.ui.core.BusyIndicator.show();

                    let getHeaderData = this.screen2headermodel.getProperty("/HEADERDATA/");
                    let getItemData = this.tabModels.getProperty("/ItemDatas/");

                    let oModelITEMS = this.getView().getModel("ZSB_AU_FT_ITEM");



                    // +++++++++ ACK JsonModel


                    var that = this;
                    sap.ui.core.BusyIndicator.hide();
                    sap.m.MessageBox.information("Do you want to submit this data.", {
                        actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
                        emphasizedAction: sap.m.MessageBox.Action.YES,
                        onClose: async function (sAction) {
                            if (sAction === "YES") {
                                sap.ui.core.BusyIndicator.show();

                                let batchMissing = false;
                                let reserveqtyentry = false;
                                for (let i = 0; i < getItemData.length; i++) {
                                    if (!getItemData[i].Batch || getItemData[i].Batch.trim() === "") {
                                        batchMissing = true;
                                        break;
                                    }


                                    if (getItemData[i].ResvnItmRequiredQtyInEntryUnit === "" || getItemData[i].ResvnItmRequiredQtyInEntryUnit === null || getItemData[i].ResvnItmRequiredQtyInEntryUnit === undefined) {
                                        reserveqtyentry = true;
                                        break;
                                    }
                                }

                                if (batchMissing) {
                                    sap.m.MessageBox.error("Please enter a valid item batch");
                                    sap.ui.core.BusyIndicator.hide();
                                    return; // stop execution, do not save
                                }

                                if (reserveqtyentry) {
                                    sap.m.MessageBox.error("Please enter a valid Quantity");
                                    sap.ui.core.BusyIndicator.hide();
                                    return; // stop execution, do not save
                                }

                                sap.ui.core.BusyIndicator.show();
                                const oStockModel = that.getView().getModel("ZCE_BATCH_MATNR_F4_SRVB");

                                async function getAvailableStock(material, batch) {
                                    return new Promise((resolve, reject) => {
                                        let aFilters = [
                                            new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.EQ, material),
                                            new sap.ui.model.Filter("Batch", sap.ui.model.FilterOperator.EQ, batch),
                                            new sap.ui.model.Filter("Plant", sap.ui.model.FilterOperator.EQ, getHeaderData.ProductionPlant)
                                        ];

                                        // NOTE: use correct entity set name from metadata (usually ends with 'Set') getHeaderData.ProductionPlant
                                        oStockModel.read("/ZCE_BATCH_BASE_MATNR_F4", {
                                            filters: aFilters,
                                            success: function (oData) {
                                                if (oData.results && oData.results.length > 0) {
                                                    let availableQty = parseFloat(oData.results[0].MatlWrhsStkQtyInMatlBaseUnit) || 0;
                                                    console.log("Available stock for", material, batch, "=", availableQty);
                                                    resolve(availableQty);
                                                } else {
                                                    console.warn("No stock record found for", material, batch);
                                                    resolve(0);
                                                }
                                            },
                                            error: function (err) {
                                                console.error("Error reading stock data:", err);
                                                reject(err);
                                            }
                                        });
                                    });
                                }


                                for (let i = 0; i < getItemData.length; i++) {
                                    const material = getItemData[i].Product;
                                    const batch = getItemData[i].Batch;
                                    const requestedQty = parseFloat(getItemData[i].ResvnItmRequiredQtyInEntryUnit) || 0;

                                    try {
                                        const availableQty = await getAvailableStock(material, batch);
                                        console.log(`Material: ${material}, Batch: ${batch}, Requested: ${requestedQty}, Available: ${availableQty}`);

                                        if (requestedQty > availableQty) {
                                            sap.ui.core.BusyIndicator.hide();
                                            sap.m.MessageBox.error(
                                                `Requested quantity (${requestedQty}) exceeds available stock (${availableQty}) for Material ${material}, Batch ${batch}. Please maintain corresponding batch quantity.`
                                            );
                                            return;
                                        }
                                    } catch (err) {
                                        sap.ui.core.BusyIndicator.hide();
                                        sap.m.MessageBox.error(`Error checking stock for Material ${material}, Batch ${batch}.`);
                                        return;
                                    }
                                }




                                const postItemLevel = new Promise((resolve, reject) => {


                                    for (let i = 0; i < getItemData.length; i++) {
                                        let ItemPOST = {
                                            // SapUuid: '2026' + GetId + '' + getItemData[i].Sr_no + i,
                                            SapUuid: `${GetId}${getItemData[i].Sr_no}`,
                                            Id: GetId,
                                            Sno: getItemData[i].Sr_no ? parseInt(getItemData[i].Sr_no) : 0,
                                            Matnr: getItemData[i].Product,
                                            Maktx: getItemData[i].ProductName,
                                            Charg: getItemData[i].Batch,
                                            Qty: getItemData[i].ResvnItmRequiredQtyInEntryUnit,
                                            Old_Item_Qty: getItemData[i].Old_Item_Qty,
                                            Unit: getItemData[i].EntryUnit,
                                            StorageLocation: getItemData[i].StorageLocation,
                                            ProcessOrder: getHeaderData.ManufacturingOrder,
                                            FtNo: getHeaderData.FTNO ? parseInt(getHeaderData.FTNO) : 0,
                                            // QaConf: getItemData[i].QA_Conf,
                                            Status: "open",
                                            Headerstatus: "open",
                                            Screencode: "AU100",
                                            Createdat: new Date(),
                                            Createdby: that.TENTUSERID,
                                            Updatedat: new Date(),
                                            Updatedby: that.TENTUSERID,
                                            SfteCreatedat: null,
                                            SfteCreatedby: "",
                                            SfteUpdatedat: null,
                                            SfteUpdatedby: "",
                                            SfteStatus: "",
                                            EobCreatedat: null,
                                            EobCreatedby: "",
                                            EobUpdatedat: null,
                                            EobUpdatedby: "",
                                            EobStatus: "",

                                            Qa32Createdat: null,
                                            Qa32Createdby: "",
                                            Qa32Updatedat: null,
                                            Qa32Updatedby: "",
                                            Qa32Status: ""

                                        }

                                        console.log("ItemPOST:", ItemPOST);

                                        oModelITEMS.create("/ZC_AU_FT_ITEM", ItemPOST, {
                                            success: function (oData, oResponse) {
                                                console.log("ZC_AU_FT_ITEM;", oData);
                                                // sap.ui.core.BusyIndicator.hide();
                                                resolve(oData)
                                            },
                                            error: function (oError) {
                                                console.error("Error creating data ZC_AU_FT_ITEM:", oError);
                                                sap.ui.core.BusyIndicator.hide();
                                                reject(oError)
                                            }
                                        });


                                    }


                                });
                                // ************** End For Item Level Posting *********************

                                // ************** Start For Header ID Level Posting *********************
                                const postIDTableLevel = new Promise((resolve, reject) => {

                                    var oEntry = {

                                        SapUuid: GetId,
                                        Id: GetId,
                                        Acmbatchno: getHeaderData.Batch,
                                        Zsize: getHeaderData.Zsize,
                                        Cb: getHeaderData.cap_Body,
                                        Colourname: getHeaderData.Colours,
                                        Colourcode: getHeaderData.Colour,
                                        Prodorderno: getHeaderData.ManufacturingOrder,
                                        Ftno: getHeaderData.FTNO ? parseInt(getHeaderData.FTNO) : 0,
                                        // Qaconf: getHeaderData.QAConf,
                                        temperature: getHeaderData.temperature,
                                        Chemist: getHeaderData.chemist,
                                        Qa: getHeaderData.QA,
                                        Shift: getHeaderData.Shift,
                                        ftqty: parseFloat(getHeaderData.Enter_Qty).toFixed(3),
                                        Status: "open",
                                        Headerstatus: "open",
                                        Screencode: "AU100",
                                        Createdat: new Date(),
                                        Createdby: that.TENTUSERID,
                                        Updatedat: new Date(),
                                        Updatedby: that.TENTUSERID,
                                        ProductionPlant: getHeaderData.ProductionPlant,
                                        StorageLocation: getHeaderData.StorageLocation,
                                        saved: "X",
                                        product: getHeaderData.Product,
                                        customername: getHeaderData.CustomerName,
                                        entrydate: getHeaderData.entrydate ? new Date(getHeaderData.entrydate.toLocaleDateString('en-CA')) : null,
                                        // This is for API posting. Once API is posted the status should be X, before "".
                                        // rowData.zdate ? new Date(rowData.zdate.toLocaleDateString('en-CA')) : null
                                        gi_createdat: null,
                                        gi_createdby: "",
                                        gi_updatedat: null,
                                        gi_updatedby: "",
                                        goods_issue: "", // Is "X" there FT01 can count like 1-1 
                                        gr_createdat: null,
                                        gr_createdby: "",
                                        gr_updatedat: null,
                                        gr_updatedby: "",
                                        goods_receipt: "",
                                        // qa32_createdat : null,
                                    };
                                    console.log("oEntryoEntry:", oEntry);

                                    // that._oPrintData = oEntry;

                                    that.getView().setModel();

                                    var oModelGet = that.getView().getModel("ZSB_AU_FT_HEADER");

                                    oModelGet.create("/ZC_AU_FT_HEADER", oEntry, {
                                        success: function (oData, oResponse) {

                                            console.log(oData);
                                            console.log("saved")
                                            oModelGet.refresh(true);
                                            // sap.ui.core.BusyIndicator.hide();
                                            resolve(oData);
                                        },

                                        error: function (error) {
                                            console.log("error");
                                            sap.ui.core.BusyIndicator.hide();
                                            reject(error)
                                        }
                                    });

                                });
                                // / ************** End For Header ID Level Posting *********************

                                await Promise.all([postItemLevel, postIDTableLevel]);
                                // sap.ui.core.BusyIndicator.hide();

                                // ************************************************************

                                resolve("Saved");


                            } else {
                                sap.m.MessageToast.show("Cancelled");
                                sap.ui.core.BusyIndicator.hide();
                            }
                        }
                    });
                });
            },







            
//            ToSaveFunc: function (GetId) {

//     return new Promise((resolve, reject) => {

//        // sap.ui.core.BusyIndicator.show();

//         let getHeaderData = this.screen2headermodel.getProperty("/HEADERDATA/");
//         let getItemData = this.tabModels.getProperty("/ItemDatas/");
//         let oModelITEMS = this.getView().getModel("ZSB_AU_FT_ITEM");
//         let that = this;

//         sap.m.MessageBox.information("Do you want to submit this data.", {
//             actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
//             emphasizedAction: sap.m.MessageBox.Action.YES,

//             onClose: async function (sAction) {
//                 if (sAction !== "YES") {
//                     sap.ui.core.BusyIndicator.hide();
//                     sap.m.MessageToast.show("Cancelled");
//                     return;
//                 }

//                 sap.ui.core.BusyIndicator.show();

//                 // ---------------------------------------
//                 // VALIDATION
//                 // ---------------------------------------

//                 let batchMissing = false;
//                 let reserveqtyentry = false;

//                 for (let i = 0; i < getItemData.length; i++) {

//                     if (!getItemData[i].Batch || getItemData[i].Batch.trim() === "") {
//                         batchMissing = true;
//                         break;
//                     }

//                     if (!getItemData[i].ResvnItmRequiredQtyInEntryUnit) {
//                         reserveqtyentry = true;
//                         break;
//                     }
//                 }

//                 if (batchMissing) {
//                     sap.m.MessageBox.error("Please enter a valid item batch");
//                     sap.ui.core.BusyIndicator.hide();
//                     return;
//                 }

//                 if (reserveqtyentry) {
//                     sap.m.MessageBox.error("Please enter a valid Quantity");
//                     sap.ui.core.BusyIndicator.hide();
//                     return;
//                 }

//                 // ---------------------------------------
//                 // STOCK CHECK
//                 // ---------------------------------------

//                 const oStockModel = that.getView().getModel("ZCE_BATCH_MATNR_F4_SRVB");

//                 function getAvailableStock(material, batch) {
//                     return new Promise((resolve, reject) => {
//                         let aFilters = [
//                             new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.EQ, material),
//                             new sap.ui.model.Filter("Batch", sap.ui.model.FilterOperator.EQ, batch),
//                             new sap.ui.model.Filter("Plant", sap.ui.model.FilterOperator.EQ, getHeaderData.ProductionPlant)
//                         ];

//                         oStockModel.read("/ZCE_BATCH_BASE_MATNR_F4", {
//                             filters: aFilters,

//                             success: function (oData) {
//                                 if (oData.results && oData.results.length > 0) {
//                                     let availableQty = parseFloat(oData.results[0].MatlWrhsStkQtyInMatlBaseUnit) || 0;
//                                     resolve(availableQty);
//                                 } else {
//                                     resolve(0);
//                                 }
//                             },

//                             error: reject
//                         });
//                     });
//                 }

//                 for (let i = 0; i < getItemData.length; i++) {

//                     const material = getItemData[i].Product;
//                     const batch = getItemData[i].Batch;
//                     const requestedQty = parseFloat(getItemData[i].ResvnItmRequiredQtyInEntryUnit) || 0;

//                     try {
//                         const availableQty = await getAvailableStock(material, batch);

//                         if (requestedQty > availableQty) {
//                             sap.ui.core.BusyIndicator.hide();
//                             sap.m.MessageBox.error(
//                                 `Requested quantity (${requestedQty}) exceeds available stock (${availableQty}) for Material ${material}, Batch ${batch}.`
//                             );
//                             return;
//                         }
//                     } catch (err) {
//                         sap.ui.core.BusyIndicator.hide();
//                         sap.m.MessageBox.error(`Error checking stock for Material ${material}, Batch ${batch}.`);
//                         return;
//                     }
//                 }

//                 // ---------------------------------------
//                 // TIMEOUT WRAPPER
//                 // ---------------------------------------

//                 function withTimeout(promise, ms) {
//                     return new Promise((resolve, reject) => {
//                         const timer = setTimeout(() => {
//                             reject(new Error("Save operation timed out"));
//                         }, ms);

//                         promise
//                             .then((res) => {
//                                 clearTimeout(timer);
//                                 resolve(res);
//                             })
//                             .catch((err) => {
//                                 clearTimeout(timer);
//                                 reject(err);
//                             });
//                     });
//                 }

//                 // ---------------------------------------
//                 // SAVE ITEM LEVEL (FIXED)
//                 // ---------------------------------------

//                 const postItemLevel = new Promise((resolve, reject) => {

//                     let itemPromises = [];

//                     for (let i = 0; i < getItemData.length; i++) {

//                         let ItemPOST = {
//                             SapUuid: `${GetId}${getItemData[i].Sr_no}`,
//                             Id: GetId,
//                             Sno: parseInt(getItemData[i].Sr_no) || 0,
//                             Matnr: getItemData[i].Product,
//                             Maktx: getItemData[i].ProductName,
//                             Charg: getItemData[i].Batch,
//                             Qty: getItemData[i].ResvnItmRequiredQtyInEntryUnit,
//                             Old_Item_Qty: getItemData[i].Old_Item_Qty,
//                             Unit: getItemData[i].EntryUnit,
//                             StorageLocation: getItemData[i].StorageLocation,
//                             ProcessOrder: getHeaderData.ManufacturingOrder,
//                             FtNo: getHeaderData.FTNO ? parseInt(getHeaderData.FTNO) : 0,
//                             Status: "open",
//                             Headerstatus: "open",
//                             Screencode: "AU100",
//                             Createdat: new Date(),
//                             Createdby: that.TENTUSERID,
//                             Updatedat: new Date(),
//                             Updatedby: that.TENTUSERID
//                         };

//                         // push one promise for each create
//                         itemPromises.push(
//                             new Promise((res, rej) => {
//                                 oModelITEMS.create("/ZC_AU_FT_ITEM", ItemPOST, {
//                                     success: res,
//                                     error: rej
//                                 });
//                             })
//                         );
//                     }

//                     Promise.all(itemPromises)
//                         .then(resolve)
//                         .catch(reject);

//                 });

//                 // ---------------------------------------
//                 // SAVE HEADER LEVEL (only AFTER items)
//                 // ---------------------------------------

//                 const postHeaderLevel = new Promise((resolve, reject) => {

//                     let oEntry = {
//                         SapUuid: GetId,
//                         Id: GetId,
//                         Acmbatchno: getHeaderData.Batch,
//                         Zsize: getHeaderData.Zsize,
//                         Cb: getHeaderData.cap_Body,
//                         Colourname: getHeaderData.Colours,
//                         Colourcode: getHeaderData.Colour,
//                         Prodorderno: getHeaderData.ManufacturingOrder,
//                         Ftno: getHeaderData.FTNO ? parseInt(getHeaderData.FTNO) : 0,
//                         temperature: getHeaderData.temperature,
//                         Chemist: getHeaderData.chemist,
//                         Qa: getHeaderData.QA,
//                         Shift: getHeaderData.Shift,
//                         ftqty: parseFloat(getHeaderData.Enter_Qty).toFixed(3),
//                         Status: "open",
//                         Headerstatus: "open",
//                         Screencode: "AU100",
//                         Createdat: new Date(),
//                         Createdby: that.TENTUSERID,
//                         Updatedat: new Date(),
//                         Updatedby: that.TENTUSERID,
//                         ProductionPlant: getHeaderData.ProductionPlant,
//                         StorageLocation: getHeaderData.StorageLocation,
//                         saved: "X",
//                         product: getHeaderData.Product,
//                         customername: getHeaderData.CustomerName,
//                         entrydate: getHeaderData.entrydate ? new Date(getHeaderData.entrydate.toLocaleDateString('en-CA')) : null
//                     };

//                     let oModelGet = that.getView().getModel("ZSB_AU_FT_HEADER");

//                     oModelGet.create("/ZC_AU_FT_HEADER", oEntry, {
//                         success: resolve,
//                         error: reject
//                     });
//                 });

//                 // ---------------------------------------
//                 // EXECUTE WITH TIMEOUT
//                 // ---------------------------------------

//                 try {
//                     await withTimeout(Promise.all([postItemLevel, postHeaderLevel]), 5000);
//                 } catch (err) {
//                     sap.ui.core.BusyIndicator.hide();
//                     sap.m.MessageBox.error("Save failed: " + err.message);
//                     return;
//                 }

//                 sap.ui.core.BusyIndicator.hide();
//                 resolve("Saved");
//                 //sap.m.MessageToast.show("Data Saved Successfully");

//             }
//         });
//     });
// },





            OnUpdateBtnReset: function () {
                let ButtonJsonModel = this.ButtonStatus.getProperty("/Buttons/")
                if (ButtonJsonModel.create === false) {
                    ButtonJsonModel.create = false;
                    ButtonJsonModel.update = true;
                    ButtonJsonModel.gi = true;
                    ButtonJsonModel.print = false;
                    ButtonJsonModel.gr = false;
                    this.ButtonStatus.refresh();
                }

            },

            OnUpdate: function () {
                return new Promise(async (resolve, reject) => {
                    sap.ui.core.BusyIndicator.show();

                    let getHeaderData = this.screen2headermodel.getProperty("/HEADERDATA/");
                    let getItemData = this.tabModels.getProperty("/ItemDatas/");
                    let oModelITEMS = this.getView().getModel("ZSB_AU_FT_ITEM");

                    let batchMissing = false;
                    let reserveqtyentry = false;
                    for (let i = 0; i < getItemData.length; i++) {
                        if (!getItemData[i].Batch || getItemData[i].Batch.trim() === "") {
                            batchMissing = true;
                            break;
                        }

                        if (getItemData[i].ResvnItmRequiredQtyInEntryUnit === "" || getItemData[i].ResvnItmRequiredQtyInEntryUnit === null || getItemData[i].ResvnItmRequiredQtyInEntryUnit === undefined) {
                            reserveqtyentry = true;
                            break;
                        }

                    }

                    if (batchMissing) {
                        sap.m.MessageBox.error("Please enter a valid item batch");
                        sap.ui.core.BusyIndicator.hide();
                        return; // stop execution, do not save
                    }

                    if (reserveqtyentry) {
                        sap.m.MessageBox.error("Please enter a valid Quantity");
                        sap.ui.core.BusyIndicator.hide();
                        return; // stop execution, do not save
                    }


                    const oStockModel = this.getView().getModel("ZCE_BATCH_MATNR_F4_SRVB");

                    async function getAvailableStock(material, batch) {
                        return new Promise((resolve, reject) => {
                            let aFilters = [
                                new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.EQ, material),
                                new sap.ui.model.Filter("Batch", sap.ui.model.FilterOperator.EQ, batch),
                                new sap.ui.model.Filter("Plant", sap.ui.model.FilterOperator.EQ, getHeaderData.ProductionPlant)
                            ];

                            // NOTE: use correct entity set name from metadata (usually ends with 'Set') getHeaderData.ProductionPlant
                            oStockModel.read("/ZCE_BATCH_BASE_MATNR_F4", {
                                filters: aFilters,
                                success: function (oData) {
                                    if (oData.results && oData.results.length > 0) {
                                        let availableQty = parseFloat(oData.results[0].MatlWrhsStkQtyInMatlBaseUnit) || 0;
                                        console.log("Available stock for", material, batch, "=", availableQty);
                                        resolve(availableQty);
                                    } else {
                                        console.warn("No stock record found for", material, batch);
                                        resolve(0);
                                    }
                                },
                                error: function (err) {
                                    console.error("Error reading stock data:", err);
                                    reject(err);
                                }
                            });
                        });
                    }


                    for (let i = 0; i < getItemData.length; i++) {
                        const material = getItemData[i].Product;
                        const batch = getItemData[i].Batch;
                        const requestedQty = parseFloat(getItemData[i].ResvnItmRequiredQtyInEntryUnit) || 0;

                        try {
                            const availableQty = await getAvailableStock(material, batch);
                            console.log(`Material: ${material}, Batch: ${batch}, Requested: ${requestedQty}, Available: ${availableQty}`);

                            if (requestedQty > availableQty) {
                                sap.ui.core.BusyIndicator.hide();
                                sap.m.MessageBox.error(
                                    `Requested quantity (${requestedQty}) exceeds available stock (${availableQty}) for Material ${material}, Batch ${batch}. Please maintain corresponding batch quantity.`
                                );
                                return;
                            }
                        } catch (err) {
                            sap.ui.core.BusyIndicator.hide();
                            sap.m.MessageBox.error(`Error checking stock for Material ${material}, Batch ${batch}.`);
                            return;
                        }
                    }

                    //BATCH STOCK VALIDATION

                    // debugger
                    // return

                    // 1. Store Previous Batch Values
                    // let previousBatchValues = getItemData.map(item => {
                    //     return {
                    //         SapUuid: item.SapUuid,
                    //         Batch: item.Batch // Capturing the Batch value before the update
                    //     };
                    // });

                    var that = this;
                    sap.ui.core.BusyIndicator.hide();

                    // Ask the user to confirm the update
                    sap.m.MessageBox.information("Do you want to update this data?", {
                        actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
                        emphasizedAction: sap.m.MessageBox.Action.YES,
                        onClose: async function (sAction) {
                            if (sAction === "YES") {
                                sap.ui.core.BusyIndicator.show();

                                // Start Item Level Posting
                                const postItemLevel = new Promise((resolve, reject) => {

                                    for (let i = 0; i < getItemData.length; i++) {
                                        let ItemPOST = {
                                            Charg: getItemData[i].Batch,
                                            Qty: getItemData[i].ResvnItmRequiredQtyInEntryUnit,
                                        }

                                        console.log("ItemPOST:", ItemPOST);

                                        // oModelITEMS.create("/ZC_AU_FT_ITEM", ItemPOST, {
                                        oModelITEMS.update(`/ZC_AU_FT_ITEM('${getItemData[i].SapUuid}')`, ItemPOST, {
                                            success: function (oData, oResponse) {
                                                console.log("ZC_AU_FT_ITEM;", oData);
                                                // sap.ui.core.BusyIndicator.hide();
                                                resolve(oData)
                                            },
                                            error: function (oError) {
                                                console.error("Error creating data ZC_AU_FT_ITEM:", oError);
                                                sap.ui.core.BusyIndicator.hide();
                                                reject(oError)
                                            }
                                        });

                                    }

                                });

                                // Start Header ID Level Posting
                                const postIDTableLevel = new Promise((resolve, reject) => {
                                    var oEntry = {
                                        temperature: getHeaderData.temperature,
                                        Chemist: getHeaderData.chemist,
                                        Qa: getHeaderData.QA,
                                        Shift: getHeaderData.Shift,
                                        ftqty: getHeaderData.Enter_Qty,
                                        entrydate: getHeaderData.entrydate ? new Date(getHeaderData.entrydate.toLocaleDateString('en-CA')) : null,
                                    };

                                    console.log("Header Data:", oEntry);
                                    // let id = getHeaderData.Id;
                                    var oModelGet = that.getView().getModel("ZSB_AU_FT_HEADER");

                                    oModelGet.update(`/ZC_AU_FT_HEADER('${getHeaderData.Id}')`, oEntry, {
                                        success: function (oData, oResponse) {
                                            console.log("Header Updated:", oData);
                                            oModelGet.refresh(true);
                                            resolve(oData);
                                        },
                                        error: function (error) {
                                            console.log("Error updating Header Data:", error);
                                            sap.ui.core.BusyIndicator.hide();
                                            reject(error);
                                        }
                                    });
                                });

                                // Wait for both item-level and header-level updates to finish
                                await Promise.all([postItemLevel, postIDTableLevel]);

                                sap.ui.core.BusyIndicator.hide();
                                console.log("Updates Successfully...")
                                let ButtonJsonModel = that.ButtonStatus.getProperty("/Buttons/")
                                ButtonJsonModel.create = false;
                                ButtonJsonModel.update = true;
                                ButtonJsonModel.gi = true;
                                ButtonJsonModel.print = false;
                                ButtonJsonModel.gr = false;
                                that.ButtonStatus.refresh();

                                sap.m.MessageBox.success("Data Updated Successfully...")

                                resolve("Saved");

                            } else {
                                sap.m.MessageToast.show("Cancelled");
                                sap.ui.core.BusyIndicator.hide();
                            }
                        }
                    });
                });
            },

            // Screen-2 On Submit select END  

            // ------------------------------------------------------------------------------------------------------------------------------------------
            // For Process Order Confirmation - Start
            // ------------------------------------------------------------------------------------------------------------------------------------------

            OnAPIPost_Confirmation: async function () {

                sap.ui.core.BusyIndicator.show();

                var that = this; // Preserve the reference to the controller
                var CountoModel = this.getView().getModel("ZAU_FT_PROCESSORDER_SRVB_");

                let getHeaderData = this.screen2headermodel.getProperty("/HEADERDATA/");


                // let table = this.getView().byId("fttableprocess").getModel("this.tabModels")
                // console.log("table:",table);
                let tabmodel = this.tabModel.getProperty("/ItemData/");
                console.log("tabmodel:", tabmodel)

                let getItemData = this.tabModels.getProperty("/ItemDatas/");
                console.log("getItemData:", getItemData)



                var oFilter1 = new sap.ui.model.Filter("ManufacturingOrder", sap.ui.model.FilterOperator.EQ, getHeaderData.ManufacturingOrder);
                var oFilter2 = new sap.ui.model.Filter("OperationControlProfile", sap.ui.model.FilterOperator.EQ, "YBP4");

                CountoModel.read("/ZC_FT_PROCESSORDEROPERATION", {
                    filters: [oFilter1, oFilter2],
                    success: async function (OData) {
                        console.log("YBP4:", OData)

                        if (OData.results.length > 0) { // Validation for YPB4 length. just
                            let ManufacturingOrderOperation = OData.results[0].ManufacturingOrderOperation
                            let GR_NO = await that.ToConfirmIssueAPIPost(ManufacturingOrderOperation, getItemData);



                            // Updating the FTP - Goods Issue Doc no in Custom Table
                            getHeaderData.goods_issue = GR_NO[0].materialdocument;
                            getHeaderData.confirmationcount = GR_NO[0].confirmationcount;
                            getHeaderData.confirmationgroup = GR_NO[0].confirmationgroup;
                            that.screen2headermodel.refresh()

                            var Header = {
                                gi_updatedat: new Date(),
                                gi_updatedby: that.TENTUSERID,
                                goods_issue: GR_NO[0].materialdocument,
                                confirmationcount: GR_NO[0].confirmationcount,
                                confirmationgroup: GR_NO[0].confirmationgroup
                            };

                            // Updating the button function after store the custom table
                            let ButtonJsonModel = that.ButtonStatus.getProperty("/Buttons/")
                            ButtonJsonModel.create = false;
                            ButtonJsonModel.update = false;
                            ButtonJsonModel.gi = false;
                            ButtonJsonModel.gr = true;
                            ButtonJsonModel.print = false;
                            that.ButtonStatus.refresh();

                            let ErrorMessage = "Some error occured while posting. Please check order..."
                            if (GR_NO[0].confirmationcount === "" || GR_NO[0].confirmationgroup === "") {
                                try {
                                    var kk = JSON.parse(GR_NO[0].errorresponse);
                                    ErrorMessage = kk.error.message.value;
                                } catch {
                                    ErrorMessage = kk.error.message.value;
                                } finally {
                                    ErrorMessage = kk.error.message.value;
                                }

                                // sap.m.MessageBox.error(ErrorMessage)
                                sap.m.MessageBox.error(ErrorMessage, {
                                    title: "Process Failed",
                                    contentWidth: "100px",
                                });
                                // Updating the button function after store the custom table
                                let ButtonJsonModel = that.ButtonStatus.getProperty("/Buttons/")
                                ButtonJsonModel.create = false;
                                ButtonJsonModel.update = true;
                                ButtonJsonModel.gi = true;
                                ButtonJsonModel.gr = false;
                                ButtonJsonModel.print = false;
                                that.ButtonStatus.refresh();

                            } else {
                                await that.ToUpdateIntTab(getHeaderData, Header) // Update the Goods Issue Doc No in internal table base on Ref Doc No
                                sap.m.MessageBox.success("Material Document: " + GR_NO[0].materialdocument + ", Confirmation Count: " + GR_NO[0].confirmationcount +
                                    ", Group: " + GR_NO[0].confirmationgroup
                                );
                                that.FinalStatus = new sap.ui.model.json.JSONModel({
                                    MSGSTRIP: {
                                        "visible": true,
                                        "text": "Material Document and Confirmation count,  group : " + GR_NO[0].materialdocument + " " + GR_NO[0].confirmationcount + " " + GR_NO[0].confirmationgroup,
                                        "type": 'Success'
                                    }
                                });
                                that.getView().setModel(that.FinalStatus, "FinalStatus")
                            }
                            sap.ui.core.BusyIndicator.hide();
                        } else {
                            sap.m.MessageBox.error("YBP4 data not found...")
                            // Updating the button function after store the custom table
                            let ButtonJsonModel = that.ButtonStatus.getProperty("/Buttons/")
                            ButtonJsonModel.create = false;
                            ButtonJsonModel.update = false;
                            ButtonJsonModel.gi = true;
                            ButtonJsonModel.gr = false;
                            ButtonJsonModel.print = false;
                            that.ButtonStatus.refresh();

                            sap.ui.core.BusyIndicator.hide();
                        }


                    },
                    error: function (error) {
                        console.log(error)
                        sap.ui.core.BusyIndicator.hide();
                    }

                });

            },


            Toworkcenter: function (oFilter1) {
                return new Promise((resolve, reject) => {
                    let getheaderdatas = this.getView().getModel("ZAU_FT_PROCESSORDER_SRVB_");
                    getheaderdatas.read("/ZCE_FT_PROCESSORDER", {
                        filters: [oFilter1],
                        success: function (oData, oResponse) {

                            console.log(oData);
                            console.log("saved")
                            //getheaderdatas.refresh(true);
                            // sap.ui.core.BusyIndicator.hide();
                            resolve(oData);
                        },

                        error: function (error) {
                            console.log("error");
                            sap.ui.core.BusyIndicator.hide();
                            reject(error)
                        }
                    });

                })
            },




            ToConfirmIssueAPIPost: function (ManufacturingOrderOperation, getItemData) {

                return new Promise(async (resolve, reject) => {
                    sap.ui.core.BusyIndicator.show();

                    let getHeaderData = this.screen2headermodel.getProperty("/HEADERDATA/");

                    let data = getHeaderData.Enter_Qty
                    console.log("data:", data)
                    // let getItemDatass = this.TabModels.getProperty("/ItemDatas/");

                    // console.log("getItemDatass", getItemDatass)
                    var oFilter1 = new sap.ui.model.Filter("ManufacturingOrder", sap.ui.model.FilterOperator.EQ, getHeaderData.ManufacturingOrder);
                    let workcenter = await this.Toworkcenter(oFilter1);
                    console.log("workcenter", workcenter);





                    let PostArrs = [];
                    for (let i = 0; i < getItemData.length; i++) {

                        let storagelocation1;

                        if (getItemData[i].storagelocation === undefined || getItemData[i].storagelocation === null) {
                            // Handle the case where storagelocation is undefined or null
                            storagelocation1 = getItemData[i].StorageLocation
                        } else {
                            // Handle the case where storagelocation has a valid value
                            storagelocation1 = getItemData[i].storagelocation
                        }

                        PostArrs.push({
                            processorder: getHeaderData.ManufacturingOrder,
                            sap_uid: "",
                            ordertype: workcenter.results[0].ordertype,
                            material: getItemData[i].Product,
                            plant: getHeaderData.ProductionPlant,
                            batch: getItemData[i].Batch,
                            quantityinentryunit: getItemData[i].ResvnItmRequiredQtyInEntryUnit,
                            entryunit: getItemData[i].EntryUnit,
                            goodsmovementtype: "261",
                            storagelocation: getItemData[i].StorageLocation


                        });
                    }

                    // Now remove duplicates based on the 'Material' field
                    // const uniquePostArrs = PostArrs.reduce((acc, currentValue) => {
                    //     // Check if the material already exists in the accumulator
                    //     const exists = acc.some(item => item.Product === currentValue.Product);
                    //     if (!exists) {
                    //         acc.push(currentValue);  // Add unique material to the accumulator
                    //     }
                    //     return acc;
                    // }, []);

                    // console.log("uniquePostArrs:",uniquePostArrs);

                    console.log("PostArrs:", PostArrs);



                    var that = this;
                    sap.ui.core.BusyIndicator.hide();
                    sap.m.MessageBox.information("Do you want to post this data.", {
                        actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
                        emphasizedAction: sap.m.MessageBox.Action.YES,
                        onClose: async function (sAction) {
                            if (sAction === "YES") {

                                sap.ui.core.BusyIndicator.show();


                                // ************** Start For Header *********************
                                const postIDTableLevel = new Promise((resolve, reject) => {
                                    var opconfirmedworkquantity2 = workcenter.results[0].WorkCenterStandardWorkQty2 * getHeaderData.Enter_Qty / (workcenter.results[0].OperationReferenceQuantity);
                                    var opconfirmedworkquantity3 = workcenter.results[0].WorkCenterStandardWorkQty3 * getHeaderData.Enter_Qty / (workcenter.results[0].OperationReferenceQuantity);
                                    var opconfirmedworkquantity4 = workcenter.results[0].WorkCenterStandardWorkQty4 * getHeaderData.Enter_Qty / (workcenter.results[0].OperationReferenceQuantity);


                                    var oEntry = {
                                        // "orderid": getHeaderData.ManufacturingOrder,
                                        // "orderoperation": ManufacturingOrderOperation,
                                        // "ordersuboperation": "0000",
                                        // // "ConfirmationUnit"  : "KG",
                                        // //  "ConfirmationUnitISOCode" : "PCE",
                                        // "confirmationyieldquantity": String(getHeaderData.Enter_Qty),
                                        // //  "ConfirmationScrapQuantity" : "0",
                                        // //  "OpWorkQuantityUnit1" : "HR",
                                        // //  "WorkQuantityUnit1ISOCode"  : "HR",
                                        // "opconfirmedworkquantity1": String(getHeaderData.Enter_Qty),
                                        // "uom": "",
                                        // // "materialdocument":"",
                                        // // "matdocyear": "",
                                        // // "response" : ""




                                        processorder: getHeaderData.ManufacturingOrder,
                                        sap_uid: "",
                                        materialdocument: "",
                                        matdocyear: "",
                                        orderoperation: ManufacturingOrderOperation,
                                        ordersuboperation: "0000",
                                        ordertype: workcenter.results[0].ordertype,
                                        confirmationyieldquantity: parseFloat(getHeaderData.Enter_Qty).toFixed(3),
                                        opconfirmedworkquantity1: workcenter.results[0].WorkCenterStandardWorkQty1,
                                        opworkquantityunit1: workcenter.results[0].WorkCenterStandardWorkQtyUnit1,
                                        opconfirmedworkquantity2: parseFloat(opconfirmedworkquantity2).toFixed(3),
                                        opworkquantityunit2: workcenter.results[0].WorkCenterStandardWorkQtyUnit2,
                                        opconfirmedworkquantity3: parseFloat(opconfirmedworkquantity3).toFixed(3),
                                        opworkquantityunit3: workcenter.results[0].WorkCenterStandardWorkQtyUnit3,
                                        opconfirmedworkquantity4: parseFloat(opconfirmedworkquantity4).toFixed(3),
                                        opworkquantityunit4: workcenter.results[0].WorkCenterStandardWorkQtyUnit4,
                                        //isfinalconfirmation :  "X",
                                        toitem: PostArrs


                                    };
                                    console.log("oEntryoEntry:", oEntry);

                                    that.getView().setModel();

                                    var oModelGet = that.getView().getModel("ZAU_FT_PROCESSORDER_SRVB_");

                                    oModelGet.create("/header", oEntry, {
                                        success: function (oData, oResponse) {

                                            console.log(oData);
                                            console.log(oData.response);

                                            console.log(oData)
                                            // oModelGet.refresh(true);
                                            // sap.ui.core.BusyIndicator.hide();
                                            resolve(oData);
                                        },

                                        error: function (error) {
                                            console.log("error");
                                            sap.ui.core.BusyIndicator.hide();
                                            sap.m.MessageBox.error("Process Failed...")
                                            reject(error)
                                        }
                                    });

                                });
                                // / ************** End For Header *********************

                                let OutPutData = await Promise.all([postIDTableLevel]);

                                // ************************************************************

                                resolve(OutPutData);

                            } else {
                                sap.m.MessageToast.show("Cancelled");
                                sap.ui.core.BusyIndicator.hide();
                            }
                        }
                    });
                });
            },

            ToUpdateIntTab: function (HeaderModel, oEntry) {

                return new Promise((resolve, reject) => {
                    sap.ui.core.BusyIndicator.show();
                    var that = this;
                    var oModelGet = that.getView().getModel("ZSB_AU_FT_HEADER");
                    oModelGet.setHeaders({
                        "X-Requested-With": "X",
                        "Content-Type": "application/json"
                    });
                    // oModel_04.update("/ZI_GE_INWARD_GATE(SAP_UUID='" + SAP_UUID_H + "',Id='" + GatePassno + "')", oEntry1, {
                    oModelGet.update("/ZC_AU_FT_HEADER('" + HeaderModel.Ref_No + "')", oEntry, {
                        success: function (oData, oResponse) {
                            console.log("Goods Issue No Updated Successfully...")
                            resolve(oData);
                        },

                        error: function (error) {
                            console.log("error");
                            sap.ui.core.BusyIndicator.hide();
                            sap.m.MessageToast.show("Goods Issue Doc No - Internal table update failed")
                            reject(error)
                        }
                    });

                });
            },

            // ------------------------------------------------------------------------------------------------------------------------------------------
            // For Process Order Confirmation - End
            // ------------------------------------------------------------------------------------------------------------------------------------------


            OnAPIPost_GR: async function () {

                sap.ui.core.BusyIndicator.show();

                var that = this; // Preserve the reference to the controller
                let getHeaderData = this.screen2headermodel.getProperty("/HEADERDATA/");
                let getItemData = this.tabModels.getProperty("/ItemDatas/");
                console.log("getHeaderData", getHeaderData);
                console.log("getItemData", getItemData);

                var FtNo = getHeaderData.FTNO;
                console.log("FtNo", FtNo);

                const creationDate = new Date();

                const day = String(creationDate.getDate()).padStart(2, '0');
                const month = String(creationDate.getMonth() + 1).padStart(2, '0'); // JS months are 0-indexed
                const year = creationDate.getFullYear();

                const formattedDate = `${day}-${month}-${year}`;
                const formattedTime = creationDate.toTimeString().split(' ')[0]; // "HH:MM:SS"

                var ManufacturingOrder = getHeaderData.ManufacturingOrder;
                var Batch = getHeaderData.Batch;
                var chemist = getHeaderData.chemist;
                var Shift = getHeaderData.Shift;
                var CustomerName = getHeaderData.CustomerName;
                var ProductDescription = getHeaderData.ProductDescription;
                var Sr_No = getItemData.Sr_no;
                var AcmNo = getHeaderData.Batch.substring(2, 4);

                var Quantity = getHeaderData.Enter_Qty;
                console.log("ProductDescription", ProductDescription);

                let GR_NO = await that.ToConfirmIssueAPIPost_GR()


                // Updating the FTP - Goods Issue Doc no in Custom Table
                getHeaderData.goods_receipt = GR_NO[0].materialdocument;
                that.screen2headermodel.refresh()

                var Header = {
                    gr_updatedat: new Date(),
                    gr_updatedby: that.TENTUSERID,
                    goods_receipt: GR_NO[0].materialdocument,
                };

                // Updating the button function after store the custom table
                let ButtonJsonModel = that.ButtonStatus.getProperty("/Buttons/")
                ButtonJsonModel.create = false;
                ButtonJsonModel.update = false;
                ButtonJsonModel.gi = false;
                ButtonJsonModel.gr = false;
                ButtonJsonModel.print = true;
                that.ButtonStatus.refresh();

                if (GR_NO[0].materialdocument === "") {
                    var kk = JSON.parse(GR_NO[0].errorresponse);
                    let ErrorMessage = kk.error.message.value;

                    // sap.m.MessageBox.error(ErrorMessage)
                    sap.m.MessageBox.error(ErrorMessage, {
                        title: "Process Failed",
                        contentWidth: "100px",
                    });

                    // Updating the button function after store the custom table
                    let ButtonJsonModel = that.ButtonStatus.getProperty("/Buttons/")
                    ButtonJsonModel.create = false;
                    ButtonJsonModel.update = false;
                    ButtonJsonModel.gi = false;
                    ButtonJsonModel.gr = true;
                    ButtonJsonModel.print = false;
                    that.ButtonStatus.refresh();

                } else {
                    await that.ToUpdateIntTab(getHeaderData, Header) // Update the Goods Issue Doc No in internal table base on Ref Doc No
                    sap.m.MessageBox.success("Goods Receipt posted successfully..." + GR_NO[0].materialdocument)

                    that.FinalStatus = new sap.ui.model.json.JSONModel({
                        MSGSTRIP: {
                            "visible": true,
                            "text": "Material Document No - Goods Receipt : " + GR_NO[0].materialdocument,
                            "type": 'Success'
                        }
                    });
                    that.getView().setModel(that.FinalStatus, "FinalStatus")

                    let ButtonJsonModel = that.ButtonStatus.getProperty("/Buttons/")
                    ButtonJsonModel.create = false;
                    ButtonJsonModel.update = false;
                    ButtonJsonModel.gi = false;
                    ButtonJsonModel.gr = false;
                    ButtonJsonModel.print = true;
                    that.ButtonStatus.refresh();
                }

                sap.ui.core.BusyIndicator.hide();

            },

            ToConfirmIssueAPIPost_GR: function () {
                return new Promise((resolve, reject) => {

                    let getHeaderData = this.screen2headermodel.getProperty("/HEADERDATA/");
                    let getItemData = this.tabModels.getProperty("/ItemDatas/");

                    var that = this;
                    sap.ui.core.BusyIndicator.hide();
                    sap.m.MessageBox.information("Do you want to post this data.", {
                        actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
                        emphasizedAction: sap.m.MessageBox.Action.YES,
                        onClose: async function (sAction) {
                            if (sAction === "YES") {
                                sap.ui.core.BusyIndicator.show();

                                // ************** Start For Header *********************
                                const postIDTableLevelgrn = new Promise((resolve, reject) => {

                                    var oEntrygrn = {

                                        manufacturingorder: getHeaderData.ManufacturingOrder,
                                        postingdate: new Date(),
                                        goodsmovementcode: '02',
                                        material: getHeaderData.Product,
                                        plant: getHeaderData.ProductionPlant,
                                        storagelocation: getHeaderData.StorageLocation,
                                        goodsmovementtype: '101',
                                        manufacturedate: new Date(),
                                        goodsmovementrefdoctype: 'F',
                                        quantityinentryunit: String(getHeaderData.Enter_Qty),

                                    };

                                    console.log("oEntryoEntry:", oEntrygrn);

                                    that.getView().setModel();

                                    var oModelGet = that.getView().getModel("ZAU_FT_GR_SRVB");

                                    oModelGet.create("/ZC_TB_FT_GR_HEADER", oEntrygrn, {

                                        success: async function (oData, oResponse) {

                                            console.log(oData);
                                            console.log(oData.response);

                                            console.log(oData);
                                            // oModelGet.refresh(true);
                                            // sap.ui.core.BusyIndicator.hide();
                                            resolve(oData);

                                        },

                                        error: function (error) {
                                            console.log("error");
                                            sap.ui.core.BusyIndicator.hide();
                                            sap.m.MessageBox.error("Process Failed...")
                                            reject(error)
                                        }

                                    });

                                });
                                // / ************** End For Header *********************

                                let OutPutData = await Promise.all([postIDTableLevelgrn]);

                                // ************************************************************

                                resolve(OutPutData);

                            } else {
                                sap.m.MessageToast.show("Cancelled");
                                sap.ui.core.BusyIndicator.hide();
                            }
                        }
                    });
                });
            },





            OnPrint: async function () {
                sap.ui.core.BusyIndicator.show();

                let getHeaderData = this.screen2headermodel.getProperty("/HEADERDATA/");
                let getItemData = this.tabModels.getProperty("/ItemDatas/");
                console.log("getHeaderData", getHeaderData);
                console.log("getItemData", getItemData);

                let ManufacturingOrder = getHeaderData.ManufacturingOrder;
                let FtNo = getHeaderData.FTNO;


                const creationDate = new Date();

                const day = String(creationDate.getDate()).padStart(2, '0');
                const month = String(creationDate.getMonth() + 1).padStart(2, '0'); // JS months are 0-indexed
                const year = creationDate.getFullYear();

                const formattedDate = `${day}-${month}-${year}`;
                const formattedTime = creationDate.toTimeString().split(' ')[0];

                console.log("FtNo", FtNo);

                // Ensure ManufacturingOrder is an array
                let manufacturingOrders = Array.isArray(ManufacturingOrder)
                    ? ManufacturingOrder
                    : typeof ManufacturingOrder === "string"
                        ? ManufacturingOrder.split(",").map(order => order.trim())
                        : [];



                const pdfPromises = manufacturingOrders.map(async (order) => {
                    console.log("ManufacturingOrder:", order);

                    const count = Number(order);
                    const countLen = count.toString();
                    const paddingLength = 10 - countLen.length;
                    let paddedOrder = "";

                    for (let i = 0; i < paddingLength; i++) {
                        paddedOrder += "0";
                    }

                    const processOrder = paddedOrder + count;
                    const sServiceUrl = "/sap/bc/http/sap/Z_FEED_TANK_ENTRY?processorder=" + processOrder + "&ftno=" + FtNo + "&ztime=" + formattedTime;

                    try {
                        const pdfData = await this.fetchPDFData(sServiceUrl);
                        return pdfData;
                    } catch (error) {
                        console.error("Error fetching PDF data:", error);
                        return null;
                    }
                });

                const pdfContentArray = (await Promise.all(pdfPromises)).filter(pdf => pdf !== null);

                if (pdfContentArray.length > 0) {
                    await this.displayPDFs(pdfContentArray);
                } else {
                    sap.m.MessageToast.show("No PDFs available to display.");
                }

                sap.ui.core.BusyIndicator.hide();
            },






            fetchPDFData: function (sServiceUrl) {
                return new Promise((resolve, reject) => {
                    jQuery.ajax({
                        url: sServiceUrl,
                        method: "GET",
                        success: function (data, textStatus, jqXHR) {
                            resolve(data); // Resolve with PDF data
                        },
                        error: function (jqXHR, textStatus, errorThrown) {
                            console.error("Error fetching data. Status:", textStatus, "Error:", errorThrown);
                            sap.m.MessageToast.show("HTTP Service Error...!");
                            reject(errorThrown);
                            sap.ui.core.BusyIndicator.hide();
                        }
                    });
                });
            },




            displayPDFs: async function (pdfDataArray) {
                const base64ToArrayBuffer = (base64) => {
                    const binaryString = atob(base64);
                    const binaryLen = binaryString.length;
                    const bytes = new Uint8Array(binaryLen);
                    for (let i = 0; i < binaryLen; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    return bytes.buffer;
                };

                const mergedPdf = await PDFLib.PDFDocument.create();
                for (let document of pdfDataArray) {
                    const pdfBytes = base64ToArrayBuffer(document);
                    const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
                    const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
                    copiedPages.forEach((page) => mergedPdf.addPage(page));
                }

                const pdfBytes = await mergedPdf.save();
                const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
                const _pdfurl = URL.createObjectURL(pdfBlob);

                if (!this._pdfViewer) {
                    this._pdfViewer = new sap.m.PDFViewer({
                        width: "auto",
                        source: _pdfurl
                    });
                    jQuery.sap.addUrlWhitelist("blob");
                } else {
                    this._pdfViewer.setSource(_pdfurl);
                }

                this._pdfViewer.setTitle("Feed Tank Card");
                this._pdfViewer.open();
            }



        });
    }
);
