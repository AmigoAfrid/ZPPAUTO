sap.ui.define(
    [
        "zautodesignapp/controller/qa03/transaction/qa03basecontroller",
        "sap/ui/core/mvc/Controller",
        "sap/ui/core/IconPool",
        "sap/ui/model/json/JSONModel",
        "sap/ui/core/Component",
        "sap/ui/core/UIComponent",
        "sap/m/routing/Router",
        "sap/m/MessageBox",
        "zautodesignapp/util/jspdf/html2canvasmin",
        "zautodesignapp/util/jspdf/jspdfmin",
        "sap/m/PDFViewer",

    ],
    function (BaseController, IconPool, JSONModel, UIComponent, Component, Router) {
        "use strict";

        return BaseController.extend("zautodesignapp.controller.qa03.transaction.qa03_selectrange", {
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

                this.ToCheckTempGradeValidation = ""
            },

            GoQA03select: function () {
                // Validate date range using the base controller method
                // if (!this.validateDateRange()) {
                //     return;
                // }

                // // Make the table visible
                // this.qa03Model.setProperty("/TableVisible", true);

                const headerData = this.qa03Model.getProperty("/HeaderData/0");
                console.log("Selected Date Range:", headerData.daterange);
                console.log("Machine no:", headerData.selectedMachine);



                let Dates = headerData.daterange;
                let machineno = headerData.selectedMachine;

                let bHasDate = Dates && Dates.trim() !== "";
                const bHasmachine = machineno && machineno.trim() !== "";


                if (!bHasDate || !bHasmachine) {
                    sap.m.MessageBox.warning("Please enter  a Date Range and Machine No");
                    return false;
                }

                // Make the table visible
                this.qa03Model.setProperty("/TableVisible", true);


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
                if (this.qa03Model) {
                    this.qa03Model.setProperty("/HeaderData/0/selectedMachine", sUpdatedMachineNo); // Update model property
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



            Onqa03Check: function () {
                if (!this.ChFrag) {
                    this.ChFrag = sap.ui.xmlfragment(this.getView().getId("id_qa03machine"), "zautodesignapp.view.qa03.transaction.fragment.valuehelp", this);
                    this.getView().addDependent(this.ChFrag);
                }
                this.ChFrag.open();
            },


            OnClose: function () {
                this.ChFrag.close();

            },


            handleRowSelect: async function (oEvent) {
                const table = oEvent.getSource();
                const selectedIndex = table.getSelectedIndex();

                if (selectedIndex >= 0) {
                    const context = table.getContextByIndex(selectedIndex);
                    const selectedData = context.getObject();
                    console.log("selectedData:::::", selectedData.ProcessOrder);


                    this.selectedRowModel.setData(selectedData);
                    this.showScreen("screen2");
                    let ItemModel = this.getView().getModel("ZSB_AU_QA03_ITEM");

                    try {


                        this.screen2headermodel = new sap.ui.model.json.JSONModel({
                            HEADERDATA: selectedData
                        });
                        this.getView().setModel(this.screen2headermodel, "screen2model");
                        console.log("this.screen2headermodel:", this.screen2headermodel)
                        this.screen2headermodel.refresh();


                        let values = selectedData.ManufacturingOrder;
                        let batches = selectedData.Batch;
                        // let Filtermant = new sap.ui.model.Filter("processorder", sap.ui.model.FilterOperator.EQ, "00" + values);
                        let Filterbatch = new sap.ui.model.Filter("batch", sap.ui.model.FilterOperator.EQ, batches);
                        let datasqa02item = await this.Qa02tableItemFetch(ItemModel, Filterbatch);


                        this.tabModels = new sap.ui.model.json.JSONModel({
                            ItemDatas: datasqa02item,
                        });
                        this.getView().setModel(this.tabModels, "TabModelsitems");
                        console.log("this.tabModels:", this.tabModels)

                        this.tabModels.refresh();

                        console.log("this.tabModels:", this.tabModels)


                    } catch (error) {
                        console.log("Error occurred:", error);
                    } finally {
                        sap.ui.core.BusyIndicator.hide(); // Hide busy indicator after async operations complete
                    }

                    // sap.ui.core.BusyIndicator.hide();

                } else {

                    //  sap.m.MessageBox.error("Select the valid data quantity of production order");
                    sap.ui.core.BusyIndicator.hide();
                    return
                }
            },


            Qa02tableItemFetch: function (ItemModel, Filterbatch) {
                return new Promise(function (resolve, reject) {
                    sap.ui.core.BusyIndicator.show();

                        var topValue = 5000;
                    var skipValue = 0;
                    ItemModel.read("/ZC_AU_QA03_ITEM", {

                            urlParameters: {
                            "$top": topValue,
                            "$skip": skipValue
                        },
                        filters: [Filterbatch],
                        success: function (odata) {
                            sap.ui.core.BusyIndicator.hide();
                            resolve(odata.results);
                        },
                        error: function (error) {
                            console.log("Error", error);
                            sap.ui.core.BusyIndicator.hide();
                            reject(error);
                        }

                    })

                })


            },

           
//            Qa02tableItemFetch: async function (ItemModel, Filterbatch) {
//     sap.ui.core.BusyIndicator.show(0);

//     const allResults = [];
//     const top = 100; // Number of records to fetch per page
//     let skip = 0;
//     let hasMoreData = true;

//     const readPage = (skipCount) => {
//         return new Promise((resolve, reject) => {
//             ItemModel.read("/ZC_AU_QA03_ITEM", {
//                 filters: [Filterbatch],
//                 urlParameters: {
//                     "$top": top,
//                     "$skip": skipCount
//                 },
//                 success: function (oData) {
//                     resolve(oData.results || []);
//                 },
//                 error: function (oError) {
//                     console.error("❌ Error reading items:", oError);
//                     sap.m.MessageToast.show("Failed to load QA03 item data.");
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
//                 hasMoreData = false; // No more pages left
//             } else {
//                 skip += top; // Go to next page
//             }
//         }

//         return allResults;

//     } catch (error) {
//         console.error("❌ Exception during QA03 item fetch:", error);
//         return [];

//     } finally {
//         sap.ui.core.BusyIndicator.hide();
//     }
// },

           
           
            ZSB_AU_QA03_ITEM: function (ItemModel, Filtermant, Filterbatch) {
                return new Promise(function (resolve, reject) {
                    sap.ui.core.BusyIndicator.show();

                      var topValue = 100;
                    var skipValue = 0;
                    ItemModel.read("/ZC_AU_QA03_ITEM", {
                        urlParameters: {
                            "$top": topValue,
                            "$skip": skipValue
                        },
                        filters: [Filtermant, Filterbatch],
                        success: function (odata) {
                            sap.ui.core.BusyIndicator.hide();
                            resolve(odata.results);
                        },
                        error: function (error) {
                            console.log("Error", error);
                            sap.ui.core.BusyIndicator.hide();
                            reject(error);
                        }

                    })

                })


            },





//             ZSB_AU_QA03_ITEM: async function (ItemModel, Filtermant, Filterbatch) {
//     sap.ui.core.BusyIndicator.show(0);

//     const allResults = [];
//     const top = 100; // Number of records to fetch per request
//     let skip = 0;
//     let hasMoreData = true;

//     // Combine both filters
//     const filters = [];
//     if (Filtermant) filters.push(Filtermant);
//     if (Filterbatch) filters.push(Filterbatch);

//     const readPage = (skipCount) => {
//         return new Promise((resolve, reject) => {
//             ItemModel.read("/ZC_AU_QA03_ITEM", {
//                 filters: filters,
//                 urlParameters: {
//                     "$top": top,
//                     "$skip": skipCount
//                 },
//                 success: function (oData) {
//                     resolve(oData.results || []);
//                 },
//                 error: function (oError) {
//                     console.error("❌ Error reading QA03 items:", oError);
//                     sap.m.MessageToast.show("Failed to load QA03 item data.");
//                     resolve([]); // Continue safely
//                 }
//             });
//         });
//     };

//     try {
//         while (hasMoreData) {
//             const pageData = await readPage(skip);
//             allResults.push(...pageData);

//             if (pageData.length < top) {
//                 hasMoreData = false; // No more pages left
//             } else {
//                 skip += top; // Move to next batch
//             }
//         }

//         return allResults;

//     } catch (error) {
//         console.error("❌ Exception during QA03 item fetch:", error);
//         return [];

//     } finally {
//         sap.ui.core.BusyIndicator.hide();
//     }
// },

            onDateOrShiftChange: function (oEvent) {
                const input = oEvent.getSource();
                const context = input.getBindingContext("TabModelsitems");

                if (!context) {
                    console.warn("No binding context");
                    return;
                }

                const model = context.getModel();
                const allItems = model.getProperty("/ItemDatas") || [];
                const currentItem = context.getObject();


                const formatDate = d => d instanceof Date
                    ? d.toISOString().split("T")[0]
                    : d;

                const currentDate = formatDate(currentItem.zdate);
                console.log("currentDate:", currentDate)
                const currentShift = currentItem.ptgshift;
                console.log("currentShift:", currentShift)
                const currentIndex = allItems.indexOf(currentItem);


                if (!currentDate || !currentShift) {
                    //input.setValueState("Error");
                    input.setValueStateText("Both Date and Shift must be selected");
                    return;
                }


                // const isDuplicate = allItems.some((item, idx) => {
                //     return idx !== currentIndex &&
                //         formatDate(item.zdate) === currentDate &&
                //         item.ptgshift === currentShift;
                // });

                // if (isDuplicate) {
                //     input.setValueState("Error");
                //     input.setValueStateText("Duplicate Date + Shift not allowed");
                //     sap.m.MessageToast.show("Duplicate combination detected.");
                // } else {
                //     input.setValueState("None");
                // }
            },





            OnTableItemAdd: function () {
                sap.ui.core.BusyIndicator.show();
                var oModel = this.getView().getModel("TabModelsitems");
                var tabledata = oModel.getProperty("/ItemDatas"); // Ensure it is an array

                if (tabledata.length >= 20) {
                    sap.m.MessageToast.show("Max limit of 20 reached...!");
                    sap.ui.core.BusyIndicator.hide();
                    return;
                }

                var datas = {
                    batch: "",
                    batch: "",
                    shift: "",
                    boxno: "",
                    ptgshift: "",
                    zdate: "",
                    avgweight: "0.00",
                    weight: "0.00",
                    cumulativeqty: "0.00",
                    ptgweight: "0.00",
                    gradeats: "",
                    gradeais: "",
                    addgrd: "",
                    gradeForptg: "",
                    ptgwaste: "0.00",
                    qtylitre: "0.00",
                    agradeweight: "0.00",
                    cumulativeagrade: "0.00",
                    materialdoc: "",
                    remarks: "",
                    hfx: "",
                    floorwastage: "",
                    qaname: "",
                    operatorname: "",
                    ptgmachneno: "",
                    wastageinlac : ""
                };

                tabledata.push(datas);

                // Ensure the model is updated
                oModel.setProperty("/ItemDatas", tabledata);
                oModel.refresh();

                sap.ui.core.BusyIndicator.hide();
            },


            // For Table Item remove
            OnRowDelete: function (oEvent) {

                var del = this.selectedData;
                // debugger
                var mod = this.getView().getModel("TabModelsitems");
                var data = mod.getProperty("/ItemDatas");

                for (var i = 0; i < data.length; i++) {
                    for (var j = 0; j < del.length; j++) {

                        if (data[i] === del[j]) {
                            data.splice(i, 1);
                            this.count = this.count - 1;
                            mod.setProperty("/ItemDatas", data);
                            mod.refresh();
                        }
                    }

                }

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




       

            // onCheckBoxSelect: function(oEvent) {
            //     const input = oEvent.getSource(); // the Input field
            //     const context = input.getBindingContext("TabModelsitems");
            //     this.selectedData = [];
            //     if (context) {
            //         const rowPath = context.getPath();
            //         const rowData = context.getObject();

            //         // splitting the row index value 
            //         let a = rowPath
            //         let b = a.split("/")
            //         let rowobject = b[1]
            //         let rowindex = parseInt(b[2])
            //         console.log("rowindex:", rowindex);

            //         let c = this.getView().getModel("TabModelsitems");
            //         let cdatas = c.getProperty("/ItemDatas/" + rowindex);
            //         // debugger
            //         this.selectedData.push(cdatas)

            //         this.rowdatamodel = new sap.ui.model.json.JSONModel({
            //             itemdatas: cdatas
            //         });
            //         this.getView().setModel(this.rowdatamodel, "rowdatamodel");

            //         console.log("Updated JSON Model:", this.rowdatamodel);

            //     } else {
            //         console.log("No binding context found.");
            //     }
            // },


            onCheckBoxSelect11: function (oEvent) {
                const input = oEvent.getSource();
                const context = input.getBindingContext("TabModelsitems");
                this.selectedData = [];

                if (context) {
                    const rowPath = context.getPath(); // Expected: "/ItemDatas/3"
                    const pathParts = rowPath.split("/");
                    const rowIndex = parseInt(pathParts[2]);

                    this._selectedGradingRowIndex = rowIndex; // ✅ Store for use in onQualitySubmit
                    console.log("Selected rowindex:", rowIndex);

                    const model = this.getView().getModel("TabModelsitems");
                    const rowItemData = model.getProperty(`/ItemDatas/${rowIndex}`);
                    this.selectedData.push(rowItemData);

                    this.rowdatamodel = new sap.ui.model.json.JSONModel({
                        itemdatas: rowItemData
                    });
                    this.getView().setModel(this.rowdatamodel, "rowdatamodel");

                    console.log("Updated JSON Model:", this.rowdatamodel);
                } else {
                    console.log("No binding context found.");
                }
            },



            onCheckBoxSelect: function (oEvent) {
                const checkbox = oEvent.getSource(); // the Input field
                const context = checkbox.getBindingContext("TabModelsitems");

                console.log("context", context);

                const rowPath = context.getPath();
                const rowData = context.getObject();

                if (rowData.selected === true) {
                    // rowData.zdate ? new Date(rowData.zdate.toLocaleDateString("en-CA")) : new Date()
                    if (!rowData.zdate || !rowData.ptgshift?.trim() || !rowData.qaname?.trim() || !rowData.operatorname?.trim() || !rowData.grageptg?.trim()) {
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


            onSubmitqa03screen_: function () {

                var that = this;
                var ofilterodata = new sap.ui.model.Filter("screencode", sap.ui.model.FilterOperator.EQ, "AU600");
                var countomodel = this.getView().getModel("ZSB_AU_QA03_HEADER")
                let ItemModel = this.getView().getModel("ZSB_AU_QA03_ITEM");

                let getHeaderData = this.screen2headermodel.getProperty("/HEADERDATA/");
                var ofilter = [ofilterodata];

                if (countomodel) {

                    this.getView().getModel("ZSB_AU_QA03_HEADER").read("/ZC_AU_QA03_HEADER/$count", { /* Decalure Globally in the Create table Serial Number */
                        filters: [ofilter],
                        success: $.proxy(async function (oEvent, oResponse) {
                            let Count = Number(oResponse.body) + 1; // This should be a number, no need to use Number()
                            let CountLen = Count.toString(); // Convert to string to get its length
                            let AddData = "71";
                            let Data = 8 - CountLen.length;
                            let CountArray = "";
                            for (let i = 0; i < Data; i++) {
                                CountArray += "0";
                            }
                            console.log(AddData + CountArray + Count); // Concatenate strings correctly
                            let LastId = AddData + CountArray + Count;
                            // let LastId = getHeaderData.id;

                            await that.ToSaveFunc(LastId);
                            console.log("Success");

                            sap.m.MessageBox.success("Data saved internally...")

                            that.FinalStatus = new sap.ui.model.json.JSONModel({
                                MSGSTRIP: {
                                    "visible": true,
                                    "text": "QA03 Reference Document No " + LastId,
                                    "type": 'Success'
                                }
                            });
                            that.getView().setModel(that.FinalStatus, "FinalStatus")


                            let Filtermant = new sap.ui.model.Filter("processorder", sap.ui.model.FilterOperator.EQ, getHeaderData.ManufacturingOrder);
                            let Filterbatch = new sap.ui.model.Filter("batch", sap.ui.model.FilterOperator.EQ, getHeaderData.Batch);
                            let datasqa02item = await that.Qa02tableItemFetch(ItemModel, Filtermant, Filterbatch);


                            this.tabModels = new sap.ui.model.json.JSONModel({
                                ItemDatas: datasqa02item,
                            });
                            this.getView().setModel(this.tabModels, "TabModelsitems");
                            console.log("this.tabModels:", this.tabModels)

                            this.tabModels.refresh();

                            console.log("this.tabModels:", this.tabModels)

                            sap.ui.core.BusyIndicator.hide();
                        }, this)
                    });

                } else {
                    console.error("ZSB_AU_QA01_HEADER model is undefined.");
                }

            },


            // onSubmitqa03screen: async function () {

            //     var that = this;
            //     var ofilterodata = new sap.ui.model.Filter("screencode", sap.ui.model.FilterOperator.EQ, "AU600");
            //     var countomodel = this.getView().getModel("ZSB_AU_QA03_HEADER")
            //     let ItemModel = this.getView().getModel("ZSB_AU_QA03_ITEM");

            //     let getHeaderData = this.screen2headermodel.getProperty("/HEADERDATA/");


            //     const oItemModel = this.getView().getModel("TabModelsitems");
            //     const aAllRows = oItemModel.getProperty("/ItemDatas") || [];
            //     const aSelected = aAllRows.filter(r => r.selected);


            //     console.log("aSelected", aSelected);

            //     aSelected.forEach(async rowData => {

            //         if (!rowData.status) {

            //             var ofilter = [ofilterodata];

            //             if (!countomodel) {
            //                 console.error("ZSB_AU_QA01_HEADER model is undefined.");
            //                 sap.m.MessageBox.error("Header model is missing.");
            //                 return;
            //             }
            //             await new Promise((resolve, reject) => {
            //                 this.getView().getModel("ZSB_AU_QA03_HEADER").read("/ZC_AU_QA03_HEADER/$count", { /* Decalure Globally in the Create table Serial Number */
            //                     filters: [ofilter],
            //                     success: async function (oEvent, oResponse) {

            //                         try {
            //                             let Count = Number(oResponse.body) + 1; // This should be a number, no need to use Number()
            //                             let CountLen = Count.toString(); // Convert to string to get its length
            //                             let AddData = "71";
            //                             let Data = 8 - CountLen.length;
            //                             let CountArray = "";
            //                             for (let i = 0; i < Data; i++) {
            //                                 CountArray += "0";
            //                             }
            //                             console.log(AddData + CountArray + Count); // Concatenate strings correctly
            //                             let LastId = AddData + CountArray + Count;


            //                             // let LastId = getHeaderData.id;


            //                             const postIDTableLevel = new Promise((resolve, reject) => {

            //                                 var oEntry = {

            //                                     sap_uuid: rowData.sap_uuid,
            //                                     id: LastId,
            //                                     batch: getHeaderData.Batch,
            //                                     processorder: getHeaderData.ManufacturingOrder,
            //                                     salesorder: getHeaderData.SalesOrder,
            //                                     orderqty: getHeaderData.MfgOrderPlannedTotalQty,
            //                                     acmno: getHeaderData.PTGNO,
            //                                     capcolour: getHeaderData.CapColor,
            //                                     bodycolour: getHeaderData.BodyColor,
            //                                     zsize: getHeaderData.Zsize,
            //                                     material: getHeaderData.Product,
            //                                     customer: getHeaderData.Customer,
            //                                     captext: getHeaderData.captext,
            //                                     bodytext: getHeaderData.bodytext,
            //                                     capink: getHeaderData.capink,
            //                                     bodyink: getHeaderData.bodyink,
            //                                     printinrollerno: getHeaderData.printing,
            //                                     status: "Created",
            //                                     headerstatus: "",
            //                                     screencode: "AU600",
            //                                     product: getHeaderData.Product,
            //                                     productdescription: getHeaderData.ProductDescription,
            //                                     customername: getHeaderData.CustomerName,
            //                                     productionunit: getHeaderData.ProductionUnit,
            //                                     createdat: new Date(),
            //                                     updatedat: new Date(),
            //                                     updatedby: that.TENTUSERID,
            //                                     createdby: that.TENTUSERID,



            //                                 };
            //                                 console.log("oEntryoEntry:", oEntry);

            //                                 that.getView().setModel();

            //                                 var oModelGet = that.getView().getModel("ZSB_AU_QA03_HEADER");

            //                                 oModelGet.create("/ZC_AU_QA03_HEADER", oEntry, {
            //                                     success: function (oData, oResponse) {

            //                                         console.log(oData);
            //                                         console.log("saved")
            //                                         oModelGet.refresh(true);
            //                                         // sap.ui.core.BusyIndicator.hide();
            //                                         resolve(oData);
            //                                     },

            //                                     error: function (error) {
            //                                         console.log("error");
            //                                         sap.ui.core.BusyIndicator.hide();
            //                                         reject(error)
            //                                     }
            //                                 });




            //                             });

            //                             const postItemLevel = new Promise((resolve, reject) => {

            //                                 let ItemPOST = {

            //                                     zdate: rowData.zdate ? new Date(rowData.zdate.toLocaleDateString('en-CA')) : null,
            //                                     processorder: getHeaderData.ManufacturingOrder,
            //                                     ptgshift: rowData.ptgshift,
            //                                     grageptg: rowData.grageptg,
            //                                     remarks: rowData.remarks,
            //                                     hfx: rowData.hfx,
            //                                     floorwastage: rowData.floorwastage ? rowData.floorwastage : "0.00",
            //                                     qaname: rowData.qaname,
            //                                     operatorname: rowData.operatorname,
            //                                     ptgmachneno: rowData.ptgmachneno,
            //                                     materialdoc: "",
            //                                     itemstatus: "open",
            //                                     status: "open",
            //                                     screencode: "AU600",
            //                                     qa03_status: "X",
            //                                     createdby: that.TENTUSERID,
            //                                     createdat: new Date(),
            //                                     updatedat: new Date(),
            //                                     updatedby: that.TENTUSERID

            //                                 }

            //                                 console.log("ItemPOST:", ItemPOST);

            //                                 ItemModel.update("/ZC_AU_QA03_ITEM('" + rowData.sap_uuid + "')", ItemPOST, {
            //                                     success: function (oData, oResponse) {
            //                                         console.log("ZC_AU_QA03_ITEM;", oData);
            //                                         // sap.ui.core.BusyIndicator.hide();
            //                                         resolve(oData)
            //                                     },
            //                                     error: function (oError) {
            //                                         console.error("Error creating data ZC_AU_QA01_ITEM:", oError);
            //                                         sap.ui.core.BusyIndicator.hide();
            //                                         reject(oError)
            //                                     }
            //                                 });

            //                             });

            //                             await Promise.all([postItemLevel, postIDTableLevel]);
            //                             resolve();

            //                         } catch (err) {
            //                             reject(err);
            //                         }


            //                     },
            //                     error: reject
            //                 });

            //             });






            //         } else {
            //             const postItemLevel = new Promise((resolve, reject) => {

            //                 let ItemPOST = {

            //                     zdate: rowData.zdate ? new Date(rowData.zdate.toLocaleDateString('en-CA')) : null,
            //                     // boxno : rowData.boxno,  
            //                     // batch:rowData.batch,
            //                     // shift:rowData.shift,
            //                     processorder: getHeaderData.ManufacturingOrder,
            //                     ptgshift: rowData.ptgshift,
            //                     grageptg: rowData.grageptg,
            //                     remarks: rowData.remarks,
            //                     hfx: rowData.hfx,
            //                     floorwastage: rowData.floorwastage ? rowData.floorwastage : "0.00",
            //                     qaname: rowData.qaname,
            //                     operatorname: rowData.operatorname,
            //                     ptgmachneno: rowData.ptgmachneno,
            //                     materialdoc: "",
            //                     itemstatus: "open",
            //                     status: "open",
            //                     screencode: "AU600",
            //                     qa03_status: "X",
            //                     createdby: that.TENTUSERID,
            //                     createdat: new Date(),
            //                     updatedat: new Date(),
            //                     updatedby: that.TENTUSERID

            //                 }

            //                 console.log("ItemPOST:", ItemPOST);

            //                 ItemModel.update("/ZC_AU_QA03_ITEM('" + rowData.sap_uuid + "')", ItemPOST, {

            //                     success: function (oData, oResponse) {
            //                         console.log("ZC_AU_QA03_ITEM;", oData);
            //                         // sap.ui.core.BusyIndicator.hide();
            //                         resolve(oData)
            //                     },
            //                     error: function (oError) {
            //                         console.error("Error creating data ZC_AU_QA01_ITEM:", oError);
            //                         sap.ui.core.BusyIndicator.hide();
            //                         reject(oError)
            //                     }
            //                 });

            //             });

            //             await Promise.all([postItemLevel]);



            //         }

            //     });

            //     // let Filtermant = new sap.ui.model.Filter("processorder", sap.ui.model.FilterOperator.EQ, getHeaderData.ManufacturingOrder);
            //     let Filterbatch = new sap.ui.model.Filter("batch", sap.ui.model.FilterOperator.EQ, getHeaderData.Batch);
            //     let datasqa02item = await that.Qa02tableItemFetch(ItemModel, Filterbatch);
            //     this.getView().setModel(new sap.ui.model.json.JSONModel({ ItemDatas: datasqa02item }), "TabModelsitems");


            //     // this.tabModels = new sap.ui.model.json.JSONModel({
            //     //     ItemDatas: datasqa02item,
            //     // });
            //     // this.getView().setModel(this.tabModels, "TabModelsitems");
            //     // console.log("this.tabModels:", this.tabModels)

            //     // this.tabModels.refresh();

            //     // console.log("this.tabModels:", this.tabModels)

            //     sap.ui.core.BusyIndicator.hide();




            // },

            ToSaveFunc: function (GetId) {

                return new Promise((resolve, reject) => {
                    sap.ui.core.BusyIndicator.show();

                    let getHeaderData = this.screen2headermodel.getProperty("/HEADERDATA/");
                    let getItemData = this.tabModels.getProperty("/ItemDatas");
                    var oView = this.getView();
                    var oDefSrv = oView.getModel("ZDIFFECTS_TAB_QA03_SRVB");

                    let rowData = this.rowdatamodel.getProperty("/itemdatas");
                    let oModelITEMS = this.getView().getModel("ZSB_AU_QA03_ITEM");

                    // let isChecked = this.tabModels.getProperty("/ItemDatas");
                    // if (!isChecked) {
                    //     sap.m.MessageBox.warning("Please select the checkbox before submitting the data.");
                    //     sap.ui.core.BusyIndicator.hide();
                    //     return;
                    // }


                    // if (
                    //     rowData.zdate ? new Date(rowData.zdate.toLocaleDateString("en-CA")) : new Date(),
                    //     // !rowData.zdate || isNaN(new Date(rowData.zdate))||
                    //     !rowData.ptgshift?.trim() ||
                    //     // !rowData.remarks?.trim() ||
                    //     // !rowData.hfx?.trim() ||
                    //     // !rowData.floorwastage?.toString().trim() ||
                    //     !rowData.qaname?.trim() ||
                    //     !rowData.operatorname?.trim() ||
                    //     !rowData.grageptg?.trim()
                    //     // !rowData.ptgmachneno?.trim()
                    // ) {
                    //     sap.ui.core.BusyIndicator.hide();
                    //     sap.m.MessageBox.error("Please fill all the mandatory fields: Date, Shift, Grade for PTG,  QA Name, Operator Name");
                    //     return;
                    // }

                    // if(rowData.ptgshift === "C"){
                    //     if(rowData.floorwastage === "" || rowData.floorwastage === "0.00" || rowData.floorwastage === "0"){
                    //         sap.m.MessageBox.error("Please Enter Floor Wastage");
                    //         sap.ui.core.BusyIndicator.hide();
                    //         return;

                    //     }
                    // }

                    sap.ui.core.BusyIndicator.hide();

                    // +++++++++ ACK JsonModel


                    var that = this;
                    sap.ui.core.BusyIndicator.hide();
                    sap.m.MessageBox.warning("Do you want to submit this data.", {
                        actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
                        emphasizedAction: sap.m.MessageBox.Action.YES,
                        onClose: async function (sAction) {
                            if (sAction === "YES") {


                                /* ---------- helper: UID  (hoisted before use) ---------- */


                                // ************** Start For Item Level Posting *********************
                                const postItemLevel = new Promise((resolve, reject) => {

                                    let qa03_status;
                                    if (rowData.grageptg === "D") {
                                        qa03_status = "X"
                                    } else {
                                        qa03_status = "X"
                                    }


                                    // for(let i=0; i < getItemData.length; i++){

                                    //    let newdate = rowData.zdate.split("-")
                                    let ItemPOST = {

                                        zdate: rowData.zdate ? new Date(rowData.zdate.toLocaleDateString('en-CA')) : null,
                                        // boxno : rowData.boxno,  
                                        // batch:rowData.batch,
                                        // shift:rowData.shift,
                                        processorder: getHeaderData.ManufacturingOrder,
                                        ptgshift: rowData.ptgshift,
                                        grageptg: rowData.grageptg,
                                        // ppgtshift:rowData.pgtshift,
                                        // avgweight:rowData.averagewt ? rowData.averagewt:"0.00",
                                        // uom:"",
                                        // aisweight:rowData.weight ?rowData.weight : "0.00",
                                        // weight:"0.00",
                                        // cumulativeqty:rowData.cumulativeqty ? rowData.cumulativeqty:"0.00" ,
                                        // ptgweight:rowData.ptgweight  ? rowData.ptgweight :"0.00" ,
                                        // gradeais:rowData.gradeais,
                                        // gradeats:rowData.gradeats,
                                        // grageptg: rowData.gradeForptg,
                                        // agradeweight:rowData.agradewt? rowData.agradewt : "0.00",
                                        // cumulativeagrade:rowData.cumltagrade? rowData.cumltagrade : "0.00",
                                        // ptgwaste:rowData.ptgwastage? rowData.ptgwastage : "0.00",
                                        // qtylitre:rowData.qtyltre ? rowData.qtyltre :"0.00",
                                        // cummulativeentry:rowData.cumltagrade ? rowData.cumltagrade : "0.00",
                                        remarks: rowData.remarks,
                                        hfx: rowData.hfx,
                                        floorwastage: rowData.floorwastage ? rowData.floorwastage : "0.00",
                                        qaname: rowData.qaname,
                                        operatorname: rowData.operatorname,
                                        ptgmachneno: rowData.ptgmachneno,
                                        materialdoc: "",
                                        itemstatus: "open",
                                        status: "open",
                                        screencode: "AU600",
                                        qa03_status: qa03_status,
                                        createdby: that.TENTUSERID,
                                        createdat: new Date(),
                                        updatedat: new Date(),
                                        updatedby: that.TENTUSERID

                                    }

                                    console.log("ItemPOST:", ItemPOST);

                                    oModelITEMS.update("/ZC_AU_QA03_ITEM('" + rowData.sap_uuid + "')", ItemPOST, {

                                        // oModelITEMS.update("/ZC_AU_QA03_ITEM", ItemPOST, {
                                        // oModelITEMS.update("/ZC_AU_QA03_ITEM", ItemPOST, {
                                        success: function (oData, oResponse) {
                                            console.log("ZC_AU_QA03_ITEM;", oData);
                                            // sap.ui.core.BusyIndicator.hide();
                                            resolve(oData)
                                        },
                                        error: function (oError) {
                                            console.error("Error creating data ZC_AU_QA01_ITEM:", oError);
                                            sap.ui.core.BusyIndicator.hide();
                                            reject(oError)
                                        }
                                    });

                                });
                                // ************** End For Item Level Posting *********************

                                // ************** Start For Header ID Level Posting *********************
                                const postIDTableLevel = new Promise((resolve, reject) => {

                                    var oEntry = {

                                        sap_uuid: '2051' + GetId,
                                        id: GetId,
                                        batch: getHeaderData.Batch,
                                        processorder: getHeaderData.ManufacturingOrder,
                                        salesorder: getHeaderData.SalesOrder,
                                        orderqty: getHeaderData.MfgOrderPlannedTotalQty,
                                        acmno: getHeaderData.PTGNO,
                                        capcolour: getHeaderData.CapColor,
                                        bodycolour: getHeaderData.BodyColor,
                                        zsize: getHeaderData.Zsize,
                                        material: getHeaderData.Product,
                                        customer: getHeaderData.Customer,
                                        captext: getHeaderData.captext,
                                        bodytext: getHeaderData.bodytext,
                                        capink: getHeaderData.capink,
                                        bodyink: getHeaderData.bodyink,
                                        printinrollerno: getHeaderData.printing,
                                        status: "Created",
                                        headerstatus: "",
                                        screencode: "AU600",
                                        product: getHeaderData.Product,
                                        productdescription: getHeaderData.ProductDescription,
                                        customername: getHeaderData.CustomerName,
                                        productionunit: getHeaderData.ProductionUnit,
                                        plant: getHeaderData.ProductionPlant,
                                        createdat: new Date(),
                                        updatedat: new Date(),
                                        updatedby: that.TENTUSERID,
                                        createdby: that.TENTUSERID,



                                    };
                                    console.log("oEntryoEntry:", oEntry);

                                    that.getView().setModel();

                                    var oModelGet = that.getView().getModel("ZSB_AU_QA03_HEADER");

                                    oModelGet.create("/ZC_AU_QA03_HEADER", oEntry, {
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

                                const generateUniqueId = function (defectType) {
                                    const now = new Date();
                                    const timestamp = now.getFullYear().toString() +
                                        String(now.getMonth() + 1).padStart(2, '0') +
                                        String(now.getDate()).padStart(2, '0') +
                                        String(now.getHours()).padStart(2, '0') +
                                        String(now.getMinutes()).padStart(2, '0') +
                                        String(now.getMilliseconds()).padStart(3, '0') +
                                        String(now.getSeconds()).padStart(2, '0');
                                    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
                                    return `${defectType}_${timestamp}_${randomStr}`;
                                };



                                // /* ---------- DEFECT payloads (logic unchanged) ---------- */
                                // const genDefects = (arr, type, scr, frinp) =>
                                //     Promise.all(arr.map(d => new Promise((res, rej) => {

                                //         let qa02_status, l1_status_K, l2_status_K, l3_status_K, l4_status_K;

                                //         if (rowData.grageptg === "D") {
                                //             // qa02_status = "X"
                                //             l1_status_K = "X"
                                //             l2_status_K = "X"
                                //             l3_status_K = "X"
                                //             l4_status_K = "X"
                                //         } else {
                                //             // qa02_status = ""
                                //             l1_status_K = "X"
                                //             l2_status_K = ""
                                //             l3_status_K = "X"
                                //             l4_status_K = "X"

                                //         }

                                //         const payload = {
                                //             id: generateUniqueId(type),
                                //             aufnr: getHeaderData.ManufacturingOrder,
                                //             batch: getHeaderData.Batch,
                                //             shift: rowData.ptgshift,
                                //             defectsname: d.defects,
                                //             zdate: rowData.zdate ? new Date(rowData.zdate.toLocaleDateString('en-CA')) : new Date(),
                                //             prtmachineno: "",
                                //             norm: d.norm,
                                //             capsulesize: "",
                                //             Plant: "1100",
                                //             sno: d.sno !== undefined ? parseInt(d.sno) : 0,
                                //             defects: d.defects,
                                //             grading: "",
                                //             capcolour: "",
                                //             bodycolour: "",
                                //             operator: "",
                                //             capinkcolor: "",
                                //             bodyinkcolor: "",
                                //             capprinttext: "",
                                //             bodyprinttext: "",
                                //             afterprinting: d.afterprinting || "0.000",
                                //             after1stsorting: d.after1sorting || "0.000",
                                //             after2ndsorting: d.after2sorting || "0.000",
                                //             after3rdsorting: d.after3sorting || "0.000",
                                //             pisinbmacno: "",
                                //             printingrollerno: "",
                                //             z1stoperatesign: "",
                                //             zdate1stoperate: new Date(),
                                //             z2ndoperatesign: "",
                                //             zdate2ndoperate: new Date(),
                                //             fqcinspector: "",
                                //             fqcsign: "",
                                //             fqcdate: new Date(),
                                //             status: "open",
                                //             createdat: new Date(),
                                //             createdby: that.TENTUSERID,
                                //             updatedat: new Date(),
                                //             updatedby: that.TENTUSERID,
                                //             screencode: scr,
                                //             screename: "QA03",

                                //             l1_status: l1_status_K,
                                //             l2_status: l2_status_K,
                                //             l3_status: l3_status_K,
                                //             l4_status: l4_status_K,

                                //             l1_grade: String(frinp.l1_grade),
                                //             l2_grade: String(frinp.l2_grade),
                                //             l3_grade: String(frinp.l3_grade),
                                //             l4_grade: String(frinp.l4_grade),

                                //         };


                                //         console.log("payload:", payload);

                                //         oDefSrv.create("/ZC_ZDEFECTS_TAB_QA03", payload, {
                                //             success: res,
                                //             error: rej
                                //         });
                                //     })));

                                // const CriticalData = oView.getModel("JModel1").getProperty("/critical") || [];
                                // const MajorData = oView.getModel("JModel2").getProperty("/major") || [];
                                // const MinorData = oView.getModel("JModel3").getProperty("/minor") || [];
                                // const QA01Inputdatas = oView.getModel("QAJModelInput").getProperty("/Samples") || [];


                                // 

                                // / ************** End For Header ID Level Posting *********************

                                await Promise.all([postItemLevel, postIDTableLevel,
                                    // genDefects(CriticalData, "CRIT", "01", QA01Inputdatas),
                                    // genDefects(MajorData, "MAJ", "02", QA01Inputdatas),
                                    // genDefects(MinorData, "MIN", "03", QA01Inputdatas)
                                ]);
                                sap.ui.core.BusyIndicator.hide();

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


//   SK CODE

            // onSubmitqa03screen: async function () {
            //     const that = this;
            //     sap.ui.core.BusyIndicator.show();

            //     try {
            //         const getHeaderData = this.screen2headermodel.getProperty("/HEADERDATA/");
            //         const oItemModel = this.getView().getModel("TabModelsitems");
            //         const aAllRows = oItemModel.getProperty("/ItemDatas") || [];
            //         const aSelected = aAllRows.filter(r => r.selected);

            //         console.log("aSelected", aSelected);

            //         const countoModel = this.getView().getModel("ZSB_AU_QA03_HEADER");
            //         const ItemModel = this.getView().getModel("ZSB_AU_QA03_ITEM");

            //         if (!countoModel || !ItemModel) {
            //             sap.m.MessageBox.error("Required models are missing.");
            //             sap.ui.core.BusyIndicator.hide();
            //             return;
            //         }

            //         // Helper function: Build Item Payload
            //         const buildItemPayload = (rowData) => ({
            //             zdate: rowData.zdate ? new Date(rowData.zdate.toLocaleDateString('en-CA')) : new Date(),
            //             processorder: getHeaderData.ManufacturingOrder,
            //             ptgshift: rowData.ptgshift,
            //             grageptg: rowData.grageptg,
            //             remarks: rowData.remarks,
            //             hfx: rowData.hfx,
            //             floorwastage: rowData.floorwastage || "0.00",
            //             qaname: rowData.qaname,
            //             operatorname: rowData.operatorname,
            //             ptgmachneno: rowData.ptgmachneno,
            //             materialdoc: "",
            //             itemstatus: "open",
            //             status: "open",
            //             screencode: "AU600",
            //             qa03_status: "X",
            //             createdby: that.TENTUSERID,
            //             createdat: new Date(),
            //             updatedat: new Date(),
            //             updatedby: that.TENTUSERID
            //         });

            //         for (const rowData of aSelected) {
            //             if (!rowData.status) {
            //                 // Generate Header ID
            //                 const LastId = await new Promise((resolve, reject) => {
            //                     countoModel.read("/ZC_AU_QA03_HEADER/$count", {
            //                         filters: [new sap.ui.model.Filter("screencode", sap.ui.model.FilterOperator.EQ, "AU600")],
            //                         success: (oEvent, oResponse) => {
            //                             try {
            //                                 let Count = Number(oResponse.body) + 1;
            //                                 let padded = Count.toString().padStart(8, "0");
            //                                 resolve("71" + padded);
            //                             } catch (err) { reject(err); }
            //                         },
            //                         error: reject
            //                     });
            //                 });

            //                 // Create Header
            //                 const postIDTableLevel = new Promise((resolve, reject) => {
            //                     const oEntry = {
            //                         sap_uuid: rowData.sap_uuid,
            //                         id: LastId,
            //                         batch: getHeaderData.Batch,
            //                         processorder: getHeaderData.ManufacturingOrder,
            //                         salesorder: getHeaderData.SalesOrder,
            //                         orderqty: getHeaderData.MfgOrderPlannedTotalQty,
            //                         acmno: getHeaderData.PTGNO,
            //                         capcolour: getHeaderData.CapColor,
            //                         bodycolour: getHeaderData.BodyColor,
            //                         zsize: getHeaderData.Zsize,
            //                         material: getHeaderData.Product,
            //                         customer: getHeaderData.Customer,
            //                         captext: getHeaderData.captext,
            //                         bodytext: getHeaderData.bodytext,
            //                         capink: getHeaderData.capink,
            //                         bodyink: getHeaderData.bodyink,
            //                         printinrollerno: getHeaderData.printing,
            //                         status: "Created",
            //                         screencode: "AU600",
            //                         product: getHeaderData.Product,
            //                         productdescription: getHeaderData.ProductDescription,
            //                         customername: getHeaderData.CustomerName,
            //                         productionunit: getHeaderData.ProductionUnit,
            //                         createdat: new Date(),
            //                         updatedat: new Date(),
            //                         updatedby: that.TENTUSERID,
            //                         createdby: that.TENTUSERID,
            //                     };

            //                     countoModel.create("/ZC_AU_QA03_HEADER", oEntry, {
            //                         success: (oData) => { console.log("Header Saved", oData); resolve(oData); },
            //                         error: (err) => reject(err)
            //                     });
            //                 });

            //                 // Update Item
            //                 const postItemLevel = new Promise((resolve, reject) => {
            //                     ItemModel.update("/ZC_AU_QA03_ITEM('" + rowData.sap_uuid + "')", buildItemPayload(rowData), {
            //                         success: (oData) => { console.log("Item Updated", oData); resolve(oData); },
            //                         error: reject
            //                     });
            //                 });

            //                 await Promise.all([postIDTableLevel, postItemLevel]);
            //             } else {
            //                 // Only update Item
            //                 await new Promise((resolve, reject) => {
            //                     ItemModel.update("/ZC_AU_QA03_ITEM('" + rowData.sap_uuid + "')", buildItemPayload(rowData), {
            //                         success: resolve,
            //                         error: reject
            //                     });
            //                 });
            //             }
            //         }

            //         // Refresh Table Data
            //         const Filterbatch = new sap.ui.model.Filter("batch", sap.ui.model.FilterOperator.EQ, getHeaderData.Batch);
            //         let datasqa02item = await that.Qa02tableItemFetch(ItemModel, Filterbatch);
            //         this.getView().setModel(new sap.ui.model.json.JSONModel({ ItemDatas: datasqa02item }), "TabModelsitems");

            //     } catch (err) {
            //         console.error("Error in onSubmitqa03screen:", err);
            //         sap.m.MessageBox.error("Error occurred while saving data.");
            //     } finally {
            //         sap.ui.core.BusyIndicator.hide();
            //     }
            // },



            // 



onSubmitqa03screen: async function () {
    const that = this;
    sap.ui.core.BusyIndicator.show();

    try {
        const getHeaderData = this.screen2headermodel.getProperty("/HEADERDATA/");
        const oItemModel = this.getView().getModel("TabModelsitems");
        const aAllRows = oItemModel.getProperty("/ItemDatas") || [];
        const aSelected = aAllRows.filter(r => r.selected);


        if (aSelected.length === 0) {
            sap.m.MessageBox.warning("Please select at least one item before submitting.");
            sap.ui.core.BusyIndicator.hide();
            return;
        }

        const countoModel = this.getView().getModel("ZSB_AU_QA03_HEADER");
        const ItemModel = this.getView().getModel("ZSB_AU_QA03_ITEM");

        if (!countoModel || !ItemModel) {
            sap.m.MessageBox.error("Required models are missing.");
            sap.ui.core.BusyIndicator.hide();
            return;
        }


        let headerId = null;
        const headerExists = await new Promise((resolve) => {
            countoModel.read("/ZC_AU_QA03_HEADER", {
                filters: [
                    new sap.ui.model.Filter("batch", sap.ui.model.FilterOperator.EQ, getHeaderData.Batch),
                    new sap.ui.model.Filter("screencode", sap.ui.model.FilterOperator.EQ, "AU600")
                ],
                success: (oData) => {
                    if (oData.results && oData.results.length > 0) {
                        headerId = oData.results[0].id;
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                },
                error: () => {
                    console.error("Header check failed");
                    resolve(false);
                }
            });
        });

     
        const headerPayload = {
            batch: getHeaderData.Batch,
            processorder: getHeaderData.ManufacturingOrder,
            salesorder: getHeaderData.SalesOrder,
            orderqty: getHeaderData.MfgOrderPlannedTotalQty,
            acmno: getHeaderData.PTGNO,
            capcolour: getHeaderData.CapColor,
            bodycolour: getHeaderData.BodyColor,
            zsize: getHeaderData.Zsize,
            material: getHeaderData.Product,
            customer: getHeaderData.Customer,
            captext: getHeaderData.captext,
            bodytext: getHeaderData.bodytext,
            capink: getHeaderData.capink,
            bodyink: getHeaderData.bodyink,
            printinrollerno: getHeaderData.printing,
            status: "Created",
            screencode: "AU600",
            product: getHeaderData.Product,
            productdescription: getHeaderData.ProductDescription,
            customername: getHeaderData.CustomerName,
            productionunit: getHeaderData.ProductionUnit,
            updatedat: new Date(),
            updatedby: that.TENTUSERID
        };

        if (headerExists) {
            await new Promise((resolve, reject) => {
                countoModel.update("/ZC_AU_QA03_HEADER('" + headerId + "')", headerPayload, {
                    success: () => {
                        console.log("Header updated:", headerId);
                        sap.m.MessageBox.show("Data updated successfully.");
                        resolve();
                    },
                    error: (err) => {
                        console.error("Header update failed", err);
                        reject(err);
                    }
                });
            });
        } else {
            const newId = await new Promise((resolve, reject) => {
                countoModel.read("/ZC_AU_QA03_HEADER/$count", {
                    filters: [new sap.ui.model.Filter("screencode", sap.ui.model.FilterOperator.EQ, "AU600")],
                    success: (oEvent, oResponse) => {
                        try {
                            let Count = Number(oResponse.body) + 1;
                            let padded = Count.toString().padStart(8, "0");
                            resolve("71" + padded);
                        } catch (err) {
                            reject(err);
                        }
                    },
                    error: reject
                });
            });

            headerId = newId;
            const createPayload = {
                ...headerPayload,
                id: headerId,
                createdat: new Date(),
                createdby: that.TENTUSERID
            };

            await new Promise((resolve, reject) => {
                countoModel.create("/ZC_AU_QA03_HEADER", createPayload, {
                    success: () => {
                        console.log("Header created:", headerId);
                        sap.m.MessageBox.show("Data created successfully.");
                        resolve();
                    },
                    error: (err) => {
                        console.error("Header creation failed", err);
                        reject(err);
                    }
                });
            });
        }

     
        const buildItemPayload = (rowData) => ({
            zdate: rowData.zdate ? new Date(rowData.zdate.toLocaleDateString('en-CA')) : new Date(),
            processorder: getHeaderData.ManufacturingOrder,
            ptgshift: rowData.ptgshift,
            grageptg: rowData.grageptg,
            remarks: rowData.remarks,
            hfx: rowData.hfx,
            floorwastage: rowData.floorwastage || "0.00",
            qaname: rowData.qaname,
            operatorname: rowData.operatorname,
            ptgmachneno: rowData.ptgmachneno,
            materialdoc: "",
            itemstatus: "open",
            status: "open",
            screencode: "AU600",
            qa03_status: "X",
            createdby: that.TENTUSERID,
            createdat: new Date(),
            updatedat: new Date(),
            updatedby: that.TENTUSERID
        });

        for (const rowData of aSelected) {
            await new Promise((resolve, reject) => {
                ItemModel.update("/ZC_AU_QA03_ITEM('" + rowData.sap_uuid + "')", buildItemPayload(rowData), {
                    success: () => {
                        console.log("Item updated for", rowData.sap_uuid);
                        resolve();
                    },
                    error: (err) => {
                        console.error("Item update failed for", rowData.sap_uuid, err);
                        reject(err);
                    }
                });
            });
        }

  
        const Filterbatch = new sap.ui.model.Filter("batch", sap.ui.model.FilterOperator.EQ, getHeaderData.Batch);
        let datasqa02item = await that.Qa02tableItemFetch(ItemModel, Filterbatch);
        this.getView().setModel(new sap.ui.model.json.JSONModel({ ItemDatas: datasqa02item }), "TabModelsitems");

    } catch (err) {
        console.error("Error in onSubmitqa03screen:", err);
        sap.m.MessageBox.error("Error occurred while saving data.");
    } finally {
        sap.ui.core.BusyIndicator.hide();
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
                            <td>${getHeaderData.Zsize}</td>
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


        });
    }
);
