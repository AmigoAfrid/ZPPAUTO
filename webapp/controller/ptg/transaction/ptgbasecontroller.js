sap.ui.define(
    [

        "sap/ui/core/mvc/Controller",
        "sap/ui/model/json/JSONModel",
        "sap/m/MessageBox"
    ],
    function (Controller, JSONModel, MessageBox) {
        "use strict";

        return Controller.extend("zautodesignapp.controller.ptg.transaction.ptgbasecontroller", {
            onInit: function () {
                // Shared models for all screens
                this.screenModel = new sap.ui.model.json.JSONModel({
                    openscreen: "screen1"
                });
                this.getView().setModel(this.screenModel, "ScreenVisible");

                this.selectedRowModel = new sap.ui.model.json.JSONModel({

                });
                this.getView().setModel(this.selectedRowModel, "SelectedRow");

                this.ptgModel = new sap.ui.model.json.JSONModel({
                    HeaderData: [{
                        daterange: "",
                        machineno: ""
                    }],
                    TableVisible: false
                });
                this.getView().setModel(this.ptgModel, "ptgModel");
            },

            validateDateRange: function () {
                const headerData = this.ptgModel.getProperty("/HeaderData/0");
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

            handleRowSelect: async function (oEvent) {
                const table = oEvent.getSource();
                const selectedIndex = table.getSelectedIndex();

                // if (selectedIndex >= 0) {
                //     const context = table.getContextByIndex(selectedIndex);
                //     const selectedData = context.getObject();

                //     this.selectedRowModel.setData(selectedData);
                //     this.showScreen("screen2");
                // }

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
                        //let Filtermant = new sap.ui.model.Filter("processorder", sap.ui.model.FilterOperator.EQ, "00" + values);
                        let Filterbatch = new sap.ui.model.Filter("batch", sap.ui.model.FilterOperator.EQ, batches);
                        //let FilterQa03Status = new sap.ui.model.Filter("qa03_status", sap.ui.model.FilterOperator.EQ, "X");

                        let Filter01 = new sap.ui.model.Filter("ManufacturingOrder", sap.ui.model.FilterOperator.EQ, values);
                         let filterstatusactive =  new sap.ui.model.Filter("StatusIsActive", sap.ui.model.FilterOperator.EQ, true);
                        let datasqa01item = await this.Qa01tableItemFetch(ItemModel, Filterbatch);
                 let ManuFacorderModel = this.getView().getModel("ZAU_FT_PROCESSORDER_SRVB_");

                         let GetProcessOrderStatus = await this.ToCheckProcOrderStatus(ManuFacorderModel, Filter01,filterstatusactive);
                        if (GetProcessOrderStatus.results.length === 0) {
                            sap.m.MessageBox.error("Please release the process order...");
                            sap.ui.core.BusyIndicator.hide();
                            return;
                        }

                        this.tabModels = new sap.ui.model.json.JSONModel({
                            ItemDatas: datasqa01item,
                        });
                        this.getView().setModel(this.tabModels, "TabModelsitems");
                        console.log("this.tabModels:", this.tabModels)

                        this.tabModels.refresh();

                        console.log("this.tabModels:", this.tabModels)




                        //  Dips master data binding based on machine 
                        // var odipsmodel = this.getView().getModel("ZDIPS_MASTER_SRVB");
                        // let dispfilter = new sap.ui.model.Filter("macno", sap.ui.model.FilterOperator.EQ, parseInt(selectedData.ATSNO))
                        // //let dipsmaster = await this.Tofetchdipsmater(odipsmodel, dispfilter);
                        // console.log("dipsmaster:", dipsmaster);

                        // this.dipsmodelcal = new sap.ui.model.json.JSONModel({
                        //     dipsdata: dipsmaster
                        // })
                        // this.getView().setModel("this.dipsmodelcal:", this.dipsmodelcal)


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


               ToCheckProcOrderStatus: function (ManuFacorderModel, Filter01,filterstatusactive) {
                return new Promise(function (resolve, reject) {
                    // var that = this;
                    sap.ui.core.BusyIndicator.show(); // Show busy indicator

                    try {
                        ManuFacorderModel.read("/ZCE_PO_STATUS", {
                            filters: [Filter01,filterstatusactive],
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
                    check: "",
                    batch: "",
                    shift: "",
                    boxno: "",
                    ptgshift: "",
                    ptgdate: "",
                    avgweight: "",
                    aisweight: "",
                    cumulativeqty: "",
                    ptgweight: "0.00",
                    gradeats: "",
                    gradeais: "",
                    grageptg: "",
                    ptgwaste: "0.00",
                    qtylitre: "0.00",
                    agradeweight: "",
                    cumulativeagrade: "",
                    remarks: "",
                    hfx: "",
                    floorwastage: "",
                    qaname: "",
                    operatorname: "",
                    ptgmachneno: ""
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

            Qa01tableItemFetch: function (ItemModel, Filterbatch) {
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

onCheckBoxSelect: function (oEvent) {
    const input = oEvent.getSource();
    const context = input.getBindingContext("TabModelsitems");

    if (!this.selectedData) {
        this.selectedData = [];
    }

    if (context) {
        const rowPath = context.getPath();
        const rowIndex = parseInt(rowPath.split("/")[2], 10);
        const model = this.getView().getModel("TabModelsitems");
        const selectedItem = model.getProperty("/ItemDatas/" + rowIndex);

        const existingIndex = this.selectedData.findIndex(item => item === selectedItem);
        if (existingIndex !== -1) {
            this.selectedData.splice(existingIndex, 1);
            model.setProperty("/ItemDatas/" + rowIndex + "/selected", false);
        } else {
            this.selectedData.push(selectedItem);
            model.setProperty("/ItemDatas/" + rowIndex + "/selected", true);
        }

        this.rowdatamodel = new sap.ui.model.json.JSONModel({
            itemdatas: this.selectedData
        });
        this.getView().setModel(this.rowdatamodel, "rowdatamodel");

        model.refresh(true);
        console.log("Selected items for update:", this.selectedData);
    } else {
        console.log("No binding context found.");
    }
},

onUpdateItemData: function () {
    const data = this.rowdatamodel?.getProperty("/itemdatas");
    const itemsToUpdate = Array.isArray(data) ? data : [data];
    const that = this;
    const model = this.getView().getModel("TabModelsitems");

    sap.m.MessageBox.warning("Do you want to submit this data?", {
        actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
        emphasizedAction: sap.m.MessageBox.Action.YES,
        onClose: async function (sAction) {
            if (sAction === "YES") {
                sap.ui.core.BusyIndicator.show(0);

                try {
                    console.log("Updating Data:", itemsToUpdate);

                    for (let n = 0; n < itemsToUpdate.length; n++) {
                        const rowData = itemsToUpdate[n];

                        if (!that.isValidData(rowData)) {
                            sap.m.MessageToast.show("Validation failed. Please check the data.");
                            sap.ui.core.BusyIndicator.hide();
                            return;
                        }

                        const PTGWastage = rowData.grageptg === "D"
                            ? rowData.ptgwaste
                            : rowData.aisweight;

                        const getitem = {
                            ptgweight: String(rowData.ptgweight),
                            ptgdate: rowData.zdate ? new Date(rowData.zdate.toLocaleDateString('en-CA')) : null,
                            agradeweight: String(rowData.agradeweight),
                            cumulativeqty: String(rowData.cumulativeqty),
                            cumulativeagrade: String(rowData.cumulativeagrade),
                            remarks: String(rowData.remarks),
                            hfx: String(rowData.hfx),
                            floorwastage: String(rowData.floorwastage),
                            qtylitre: String(rowData.qtylitre),
                            qaname: String(rowData.qaname),
                            operatorname: String(rowData.operatorname),
                            ptgmachneno: String(rowData.ptgmachneno),
                            ptgwaste: PTGWastage,
                            ptgwastageinlac : String(rowData.ptgwastageinlac)
                        };

                        await that.ToUpdatetableItem(rowData, getitem);
                    }

                    // ✅ Clear checkbox selection
                    const itemList = model.getProperty("/ItemDatas");
                    itemsToUpdate.forEach((item) => {
                        const itemIndex = itemList.findIndex(i => i === item);
                        if (itemIndex !== -1) {
                            model.setProperty(`/ItemDatas/${itemIndex}/selected`, false);
                        }
                    });

                    // ✅ Clear selectedData and rowdatamodel
                    that.selectedData = [];
                    that.rowdatamodel.setData({ itemdatas: [] });

                    model.refresh(true);
                    sap.m.MessageBox.success("Table item data updated successfully.");
                } catch (error) {
                    console.error("Error updating table item data:", error);
                    sap.m.MessageBox.error("Failed to update table item data. Please try again.");
                } finally {
                    sap.ui.core.BusyIndicator.hide();
                }
            } else {
                sap.m.MessageToast.show("Cancelled");
                sap.ui.core.BusyIndicator.hide();
            }
        }
    });
},

isValidData: function (rowData) {
    if (rowData.grageptg === "D") {
        if (!rowData.ptgweight || rowData.ptgweight === "0.000" || rowData.ptgweight === "0.00" || isNaN(rowData.ptgweight)) {
            sap.m.MessageBox.error("Please enter PTG Weight.");
            return false;
        }
    }

    if (!rowData.ptgmachneno || rowData.ptgmachneno === "0") {
        sap.m.MessageBox.error("Please enter a PTG Machine number");
        sap.ui.core.BusyIndicator.hide();
        return false;
    }

    if (rowData.ptgshift === "C") {
        if (!rowData.floorwastage || rowData.floorwastage === "0.00" || isNaN(rowData.floorwastage)) {
            sap.m.MessageBox.error("Please enter Floor wastage.");
            sap.ui.core.BusyIndicator.hide();
            return false;
        }
    }

    return true;
},



            ToUpdatetableItem: function (itemdata, oEntry) {
                var that = this;

                return new Promise((resolve, reject) => {
                    let updatemodel = that.getView().getModel("ZSB_AU_QA03_ITEM");

                    updatemodel.setHeaders({
                        "X-Requested-With": "X",
                        "Content-Type": "application/json"
                    });

                    updatemodel.update("/ZC_AU_QA03_ITEM('" + itemdata.sap_uuid + "')", oEntry, {
                        success: function (odata) {
                            console.log("Table item updated:", odata);
                            resolve(odata);
                        },
                        error: function (oerror) {
                            console.error("Update failed for item:", itemdata.sap_uuid, oerror);
                            reject(oerror);
                        }
                    });
                });
            },

            //// 261 goods issue


            ToComponentFragOpen: async function (oEvent) {
                // OnApiPost_MatDoc

                const input = oEvent.getSource(); // the Input field
                const context = input.getBindingContext("TabModelsitems");
                let getHeaderData = this.screen2headermodel.getProperty("/HEADERDATA/");
                let Screen1SelectHeaderdata = this.SelectScreen1Data;

                if (context) {
                    const rowPath = context.getPath();
                    const rowData = context.getObject();

                    // if(rowData.grageais === 'D'){
                    //     var aiswastage = rowData.aiswastage
                    // }else {
                    //     var aiswastage = rowData.atsweight
                    // }

                    // if (rowData.averagewt > 0) {
                    //     var weight001 = (rowData.weight / rowData.averagewt) * 10
                    // } else {
                    //     var weight001 = rowData.agradeqty
                    // }

                    //var weight = (rowData.aisweight / rowData.avgweight) * 10

                    const aFilters = [
                        new sap.ui.model.Filter("ProcessOrder", sap.ui.model.FilterOperator.EQ, "00" + rowData.processorder),
                        new sap.ui.model.Filter("batch", sap.ui.model.FilterOperator.EQ, rowData.batch),
                        new sap.ui.model.Filter("avg_wt", sap.ui.model.FilterOperator.EQ, rowData.avgweight),
                        new sap.ui.model.Filter("wt_enter", sap.ui.model.FilterOperator.EQ, rowData.aisweight)
                        // new sap.ui.model.Filter("wt_enter", sap.ui.model.FilterOperator.EQ, String(weight.toFixed(2)))
                    ];

                    const UPDATE_DIPS_MODEL = this.getView().getModel("ZPTG01_BATCH_RUN_281_SRVB");
                    let ToFetchUpdateDips = await this.ToFetchUpdateDips_KK(UPDATE_DIPS_MODEL, rowData, aFilters);

                    this.CompDipsModel = new sap.ui.model.json.JSONModel({
                        Datatabitem: ToFetchUpdateDips.results
                    });

                    this.getView().setModel(this.CompDipsModel, "CompDipsModel");
                    debugger

                    this.ComponentMatoEvent = oEvent
                    sap.ui.core.BusyIndicator.hide();
                    if (!this.tableitemfrag) {
                        this.tableitemfrag = sap.ui.xmlfragment(this.getView().getId("tableitptg"), "zautodesignapp.view.ptg.transaction.fragment.tableitemhelp", this);
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
    
    
    
            // Toworkcenter: function (oFilter1) {
            //     return new Promise((resolve, reject) => {
            //         let getheaderdatas = this.getView().getModel("ZAU_PTG_PROCESSORDER_SRVB");
            //         getheaderdatas.read("/ZCE_PTG_PROCESSORDER", {
            //             filters: [oFilter1],
            //             success: function (oData, oResponse) {

            //                 console.log(oData);
            //                 console.log("saved")
            //                 //getheaderdatas.refresh(true);
            //                 // sap.ui.core.BusyIndicator.hide();
            //                 resolve(oData);
            //             },

            //             error: function (error) {
            //                 console.log("error");
            //                 sap.ui.core.BusyIndicator.hide();
            //                 reject(error)
            //             }
            //         });

            //     })
            // },



            ToConfirmIssueAPIPost: async function (ManufacturingOrderOperation) {
                // OnApiPost_MatDoc
                // sap.ui.core.BusyIndicator.show();
                const input = this.OEvent.getSource() // the Input field
                const context = input.getBindingContext("TabModelsitems");
                let getHeaderData = this.screen2headermodel.getProperty("/HEADERDATA/");
                let Screen1SelectHeaderdata = this.SelectScreen1Data;
                var oItemSrv_qa02 = this.getView().getModel("ZSB_AU_QA03_ITEM");
                if (context) {
                    const rowPath = context.getPath();
                    const rowData = context.getObject();
                    debugger
                    // let oFilterProOrd1 = new sap.ui.model.Filter("ProcessOrder", sap.ui.model.FilterOperator.EQ, "00"+rowData.processorder);




                    // const UPDATE_DIPS_MODEL = this.getView().getModel("ZPTG01_BATCH_RUN_281_SRVB");
                    // let ToFetchUpdateDips = await this.ToFetchUpdateDips_KK(UPDATE_DIPS_MODEL, rowData, aFilters);
                    debugger

                    let getcomponentdata = this.CompDipsModel.getProperty("/Datatabitem");
                    //console.log("getItemDatas",getItemDatas)
                    //var oModelGets = this.getView().getModel("ZPROC_HEAD_CONF_AIS_SRB");
                    //  var oFilter1 = new sap.ui.model.Filter("ManufacturingOrder", sap.ui.model.FilterOperator.EQ, getHeaderData.ManufacturingOrder);
                    // let workcenter = await this.Toworkcenter(oFilter1);
                    // console.log("workcenter", workcenter);

                    let PostArrs = [];
                    for (let i = 0; i < getcomponentdata.length; i++) {
                        PostArrs.push({
                            processorder: getcomponentdata[i].ProcessOrder,
                            sap_uid: "",
                            ordertype: getHeaderData.ordertype,
                            material: getcomponentdata[i].material,
                            plant: getcomponentdata[i].plant,
                            batch: getcomponentdata[i].batch,
                            quantityinentryunit: getcomponentdata[i].quantity,
                            entryunit: getcomponentdata[i].base_unit,
                            goodsmovementtype: getcomponentdata[i].movement_type,
                            storagelocation: getcomponentdata[i].storage_location,
                            inventoryspecialstocktype: getcomponentdata[i].InventorySpecialStockType,
                            salesorder: getcomponentdata[i].SpecialStockIdfgSalesOrder,
                            salesorderitem : getcomponentdata[i].SpecialStockIdfgSalesOrderItem

                        });
                    }

                    // // Now remove duplicates based on the 'Material' field
                    // const uniquePostArr = PostArr.reduce((acc, currentValue) => {
                    //     // Check if the material already exists in the accumulator
                    //     const exists = acc.some(item => item.Material === currentValue.Material);
                    //     if (!exists) {
                    //         acc.push(currentValue);  // Add unique material to the accumulator
                    //     }
                    //     return acc;
                    // }, []);

                     console.log("PostArrs",PostArrs);
                    const that = this;
                    sap.ui.core.BusyIndicator.hide();
                    sap.m.MessageBox.warning("Do you want to post this data.", {
                        actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
                        emphasizedAction: sap.m.MessageBox.Action.YES,
                        onClose: async function (sAction) {
                            if (sAction === "YES") {
                                sap.ui.core.BusyIndicator.show();

                                try {

                                    const oModelGet = that.getView().getModel("ZPROC_HEAD_CONF_PTG_SRVB");
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
                                        tcode: 'PTG',
                                        toitem: PostArrs


                                    };
                                    console.log("oEntryoEntry:", oEntry);

                                    console.log("oEntry:", oEntry);

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

                                    }



                                    let ToUpdateIntTab = await that.ToUpdateIntTab_GI(rowData, ToAPIPOstTab);


                                    const oItemsModel = that.getView().getModel("ZSB_AU_QA03_ITEM");
                                    let sOrder = rowData.processorder
                                    let sBatch = rowData.batch
                                    debugger

                                    const aItems = await that.ProOrderItemFetch(oItemsModel, sOrder, sBatch);

                                    that.TabModelsitems = new sap.ui.model.json.JSONModel({
                                        ItemDatas: aItems
                                    });
                                    that.getView().setModel(that.TabModelsitems, "TabModelsitems");
                                    that.TabModelsitems.refresh(that);
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

            ProOrderItemFetch: function (oItemsModel, sOrder, sBatch) {
                return new Promise((resolve, reject) => {
                    const aFilters = [
                        new sap.ui.model.Filter("processorder", sap.ui.model.FilterOperator.EQ, "00" + sOrder),
                        new sap.ui.model.Filter("batch", sap.ui.model.FilterOperator.EQ, String(sBatch)),
                        new sap.ui.model.Filter("qa03_status", sap.ui.model.FilterOperator.EQ, "X")
                    ];

                    oItemsModel.read("/ZC_AU_QA03_ITEM", {
                        filters: aFilters,
                        success: oData => resolve(oData.results),
                        error: oErr => reject(oErr)
                    });
                });
            },

            ToFetchUpdateDips_KK: function (UPDATE_DIPS_MODEL, rowData, oFilterProOrd1) {
                return new Promise(function (resolve, reject) {
                    // var that = this;
                    sap.ui.core.BusyIndicator.show(); // Show busy indicator

                    try {
                        UPDATE_DIPS_MODEL.read("/ZCE_PTG01_BATCH_RUN", {
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
                        const oModelGet = that.getView().getModel("ZSB_AU_QA03_ITEM");
                        oModelGet.setHeaders({
                            "X-Requested-With": "X",
                            "Content-Type": "application/json"
                        });

                        const Header = {
                            confirmationgroup: ToAPIPOstTab.confirmationgroup,
                            confirmationcount: ToAPIPOstTab.confirmationcount,
                            materialdocumentno: ToAPIPOstTab.materialdocument,
                            materialdocumentyear: ToAPIPOstTab.matdocyear
                        };

                        const id = rowData.sap_uuid;

                        oModelGet.update("/ZC_AU_QA03_ITEM('" + id + "')", Header, {
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




            // *************************** goods Issue ******************************531



            ToComponentsFragOpen: async function (oEvent) {
                // OnApiPost_MatDoc

                const input = oEvent.getSource(); // the Input field
                const context = input.getBindingContext("TabModelsitems");
                let getHeaderData = this.screen2headermodel.getProperty("/HEADERDATA/");
                let Screen1SelectHeaderdata = this.SelectScreen1Data;

                if (context) {
                    const rowPath = context.getPath();
                    const rowData = context.getObject();

                    // if(rowData.grageais === 'D'){
                    //     var aiswastage = rowData.aiswastage
                    // }else {
                    //     var aiswastage = rowData.atsweight
                    // }

                    const aFilters = [
                        new sap.ui.model.Filter("ProcessOrder", sap.ui.model.FilterOperator.EQ, "00" + rowData.processorder),
                        new sap.ui.model.Filter("batch", sap.ui.model.FilterOperator.EQ, rowData.batch),
                        new sap.ui.model.Filter("hfx", sap.ui.model.FilterOperator.EQ, rowData.hfx),
                        new sap.ui.model.Filter("wastage", sap.ui.model.FilterOperator.EQ, rowData.ptgwaste),
                        new sap.ui.model.Filter("floor_wastage", sap.ui.model.FilterOperator.EQ, rowData.floorwastage)
                    ];

                    const UPDATE_DIPS_MODEL = this.getView().getModel("ZPTG01_BATCH_RUN_531_SRVB");
                    let ToFetchUpdateDipss = await this.ToFetchUpdateDips_KKS(UPDATE_DIPS_MODEL, rowData, aFilters);

                    this.CompDipsModels = new sap.ui.model.json.JSONModel({
                        Datatabitems: ToFetchUpdateDipss.results
                    });

                    this.getView().setModel(this.CompDipsModels, "CompDipsModels");
                    debugger

                    this.ComponentMatoEvents = oEvent
                    sap.ui.core.BusyIndicator.hide();
                    if (!this.tableitemfrags) {
                        this.tableitemfrags = sap.ui.xmlfragment(this.getView().getId("tableitptgs"), "zautodesignapp.view.ptg.transaction.fragment.tableitemhelps", this);
                        this.getView().addDependent(this.tableitemfrags);
                    }
                    this.tableitemfrags.open();

                }

            },

            onQualitySubmits: async function (oEventComp) {
                console.log("this.ComponentMatoEvents:", this.ComponentMatoEvents)
                this.OnApiPost_MatDoc_GI_531(this.ComponentMatoEvents)
            },

            onTableitemCancels: async function (oEventComp) {
                this.tableitemfrags.close();
            },

   OnApiPost_MatDoc_GI_531: async function (oEvent) {

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
                            let GR_NO = await that.ToConfirmIssueAPIPost531(ManufacturingOrderOperation)


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



            ToConfirmIssueAPIPost531: async function (ManufacturingOrderOperation) {
                // sap.ui.core.BusyIndicator.show();
                 const input = this.OEvent.getSource() /// the Input field
                const context = input.getBindingContext("TabModelsitems");
                let getHeaderData = this.screen2headermodel.getProperty("/HEADERDATA/");
                let Screen1SelectHeaderdata = this.SelectScreen1Data;
                var oItemSrv_qa02 = this.getView().getModel("ZSB_AU_QA03_ITEM");
                if (context) {
                    const rowPath = context.getPath();
                    const rowData = context.getObject();
                    debugger
                    // let oFilterProOrd1 = new sap.ui.model.Filter("ProcessOrder", sap.ui.model.FilterOperator.EQ, "00"+rowData.processorder);

                    //const UPDATE_DIPS_MODELS = this.getView().getModel("ZPTG01_BATCH_RUN_531_SRVB");
                    //let ToFetchUpdateDipss = await this.ToFetchUpdateDips_KKS(UPDATE_DIPS_MODELS, rowData, aFilters);
                    //debugger

                    
                    let getcomponentdata = this.CompDipsModels.getProperty("/Datatabitems");

                    let PostArrS = [];
                    for (let i = 0; i < getcomponentdata.length; i++) {
                        PostArrS.push({
                            processorder: getcomponentdata[i].ProcessOrder,
                            sap_uid: "",
                            ordertype: getHeaderData.ordertype,
                            material: getcomponentdata[i].material,
                            plant: getcomponentdata[i].plant,
                            batch: getcomponentdata[i].batch,
                            quantityinentryunit: getcomponentdata[i].quantity,
                            entryunit: getcomponentdata[i].base_unit,
                            goodsmovementtype: getcomponentdata[i].movement_type,
                            storagelocation: getcomponentdata[i].storage_location,
                            inventoryspecialstocktype: getcomponentdata[i].InventorySpecialStockType,
                            salesorder: getcomponentdata[i].SpecialStockIdfgSalesOrder,
                            salesorderitem : getcomponentdata[i].SpecialStockIdfgSalesOrderItem
                        });
                    }

                    // Now remove duplicates based on the 'Material' field
                    // const uniquePostArrS = PostArrS.reduce((acc, currentValueS) => {
                    //     // Check if the material already exists in the accumulator
                    //     const exists = acc.some(item => item.Material === currentValueS.Material);
                    //     if (!exists) {
                    //         acc.push(currentValueS);  // Add unique material to the accumulator
                    //     }
                    //     return acc;
                    // }, []);

                    console.log("PostArrS:",PostArrS);
                    const that = this;
                    sap.ui.core.BusyIndicator.hide();
                    sap.m.MessageBox.warning("Do you want to post this data.", {
                        actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
                        emphasizedAction: sap.m.MessageBox.Action.YES,
                        onClose: async function (sAction) {
                            if (sAction === "YES") {
                                sap.ui.core.BusyIndicator.show();

                                try {

                                    const oModelGetS = that.getView().getModel("ZPROC_HEAD_CONF_PTG_SRVB");
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

                                    const oEntryS = {
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
                                        tcode: 'PTG',
                                        toitem: PostArrS

                                    };

                                    console.log("oEntry:", oEntryS);

                                    let ToAPIPOstTabS = await that.ToAPIPOstTab_GIS(oModelGetS, oEntryS);
                                     if (ToAPIPOstTabS.errorresponse !== "") {
                                        try {
                                            // Parse the error response (assuming JSON format)
                                            var oResponse = JSON.parse(ToAPIPOstTabS.errorresponse);
                                            if (oResponse.error && oResponse.error.message) {
                                                var errorMessage = oResponse.error.message.value;
                                                console.log("Error: " + errorMessage);

                                                // You can now use this error message in a pop-up or display it to the user
                                                // For example, using a MessageToast:
                                                sap.m.MessageToast.show(errorMessage);
                                                sap.m.MessageBox.error(errorMessage);
                                                return
                                            } else {
                                                console.log("Unknown error: ", ToAPIPOstTabS);
                                                sap.m.MessageToast.show("An unknown error occurred.");
                                                return
                                            }
                                        } catch (e) {
                                            // In case of parsing errors
                                            console.error("Error in parsing OData error response: ", e);
                                            return
                                        }

                                    }
                                    let ToUpdateIntTab = await that.ToUpdateIntTab_GISS(rowData, ToAPIPOstTabS);


                                    const oItemsModel = that.getView().getModel("ZSB_AU_QA03_ITEM");
                                    let sOrder = rowData.processorder
                                    let sBatch = rowData.batch
                                    debugger
                                    const aItems = await that.ProOrderItemFetch(oItemsModel, sOrder, sBatch);

                                    that.TabModelsitems = new sap.ui.model.json.JSONModel({
                                        ItemDatas: aItems
                                    });
                                    that.getView().setModel(that.TabModelsitems, "TabModelsitems");
                                    that.TabModelsitems.refresh(that);
                                   sap.m.MessageBox.success(
                                        "Material Document: " + ToAPIPOstTabS.materialdocument +
                                        ", Confirmation Count: " + ToAPIPOstTabS.confirmationcount +
                                        ", Confirmation Group: " + ToAPIPOstTabS.confirmationgroup
                                    );
                                    that.FinalStatus = new sap.ui.model.json.JSONModel({
                                        MSGSTRIP: {
                                            "visible": true,
                                            "text": "Material Document No " + ToAPIPOstTabS.materialdocument + ", Confirmation Count: " + ToAPIPOstTabS.confirmationcount +
                                        ", Confirmation Group: " + ToAPIPOstTabS.confirmationgroup,
                                            "type": 'Success'
                                        }
                                    });
                                    that.getView().setModel(that.FinalStatus, "FinalStatus")
                                    that.tableitemfrags.close();

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

            ToFetchUpdateDips_KKS: function (UPDATE_DIPS_MODELS, rowData, oFilterProOrd1) {
                return new Promise(function (resolve, reject) {
                    // var that = this;
                    sap.ui.core.BusyIndicator.show(); // Show busy indicator

                    try {
                        UPDATE_DIPS_MODELS.read("/ZCE_PTG01_BATCH_RUN_531", {
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


            ToAPIPOstTab_GIS: function (oModelGetS, oEntryS) {
                return new Promise((resolve, reject) => {
                    sap.ui.core.BusyIndicator.show();
                    try {
                        oModelGetS.setHeaders({
                            "X-Requested-With": "X",
                            "Content-Type": "application/json"
                        });

                        oModelGetS.create("/header", oEntryS, {
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

            ToUpdateIntTab_GISS: function (rowData, ToAPIPOstTabS) {
                return new Promise((resolve, reject) => {
                    sap.ui.core.BusyIndicator.show();
                    try {
                        const that = this;
                        const oModelGet = that.getView().getModel("ZSB_AU_QA03_ITEM");
                        oModelGet.setHeaders({
                            "X-Requested-With": "X",
                            "Content-Type": "application/json"
                        });

                        const Header = {
                              confirmationgroup: ToAPIPOstTabS.confirmationgroup,
                            confirmationcount: ToAPIPOstTabS.confirmationcount,
                            materialdocumentyear_gi531: ToAPIPOstTabS.matdocyear,
                            materialdocumentno_gi531: ToAPIPOstTabS.materialdocument,
                        };

                        const id = rowData.sap_uuid;

                        oModelGet.update("/ZC_AU_QA03_ITEM('" + id + "')", Header, {
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






            //---------------- Start Goods Receipt post --------------------------------------

            OnApiPost_MatDoc_GR: async function (oEvent) {
                sap.ui.core.BusyIndicator.show();
                const input = oEvent.getSource(); // the Input field
                const context = input.getBindingContext("TabModelsitems");
                const oHeader = this.getView().getModel("screen2model");
                let getHeaderData = oHeader.getProperty("/HEADERDATA/")
                debugger
                if (context) {
                    const rowPath = context.getPath();
                    const rowData = context.getObject();
                    debugger
                    // let oFilterProOrd1 = new sap.ui.model.Filter("ProcessOrder", sap.ui.model.FilterOperator.EQ, "00"+rowData.processorder);

                    // const UPDATE_DIPS_MODEL = this.getView().getModel("ZAU_ACM_UPDATE_DIPS_SRVB");
                    // let ToFetchUpdateDips = await this.ToFetchUpdateDips(UPDATE_DIPS_MODEL, rowData, oFilterProOrd1);
                    // debugger

                    const that = this;
                    sap.ui.core.BusyIndicator.hide();
                    sap.m.MessageBox.warning("Do you want to post this data.", {
                        actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
                        emphasizedAction: sap.m.MessageBox.Action.YES,
                        onClose: async function (sAction) {
                            if (sAction === "YES") {
                                sap.ui.core.BusyIndicator.show();

                                try {

                                    const oModelGetGR = that.getView().getModel("ZPTG_GR_SRVB");
                                    const oItemSrv_qa02 = that.getView().getModel("ZSB_AU_QA03_ITEM");

                                    const oEntry = {
                                        // Postingdate: new Date(),
                                        // Goodsmovementcode: "03",
                                        // Materialdocument: "",
                                        // Matdocyear: "2025",

                                        manufacturingorder: getHeaderData.ManufacturingOrder,
                                        postingdate: new Date(),
                                        goodsmovementcode: '02',
                                        material: getHeaderData.Product,
                                        plant: getHeaderData.ProductionPlant,
                                        storagelocation: getHeaderData.StorageLocation,
                                        goodsmovementtype: '101',
                                        manufacturedate: new Date(),
                                        goodsmovementrefdoctype: 'F',
                                        quantityinentryunit: String(rowData.agradeweight),


                                    };

                                    console.log("oEntry:", oEntry);

                                    let ToAPIPOstTab = await that.ToAPIPOstTab_GR(oModelGetGR, oEntry);
                                    let ToUpdateIntTab = await that.ToUpdateIntTab_GR(rowData, ToAPIPOstTab);
                                    //let ToPOSTQa02ItemTab = await that.ToPOSTQa02ItemTab(oItemSrv_qa02, getHeaderData, rowData);


                                    const oItemsModel = that.getView().getModel("ZSB_AU_QA03_ITEM");
                                    let sOrder = rowData.processorder
                                    let sBatch = rowData.batch
                                    debugger
                                    const aItems = await that.ProOrderItemFetch(oItemsModel, sOrder, sBatch);
                                    that.TabModelsitems = new sap.ui.model.json.JSONModel({
                                        ItemDatas: aItems
                                    });
                                    that.getView().setModel(that.TabModelsitems, "TabModelsitems");
                                    that.TabModelsitems.refresh(that);

                                    if (ToAPIPOstTab.materialdocument === '') {
                                        var responseText = ToAPIPOstTab.errorresponse
                                        var errorResponse = JSON.parse(responseText); // responseText is your raw JSON string
                                        var errorMessage = errorResponse.error.message.value;

                                        sap.m.MessageBox.error(errorMessage, {
                                            title: "Processing Error"
                                        });
                                    } else {
                                        sap.m.MessageBox.success("Material Document Generated" + " " + ToAPIPOstTab.materialdocument);
                                    }

                                    //sap.m.MessageBox.success("Material Document Generated...");
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



            ToAPIPOstTab_GR: function (oModelGetGR, oEntry) {
                return new Promise((resolve, reject) => {
                    sap.ui.core.BusyIndicator.show();
                    try {
                        oModelGetGR.setHeaders({
                            "X-Requested-With": "X",
                            "Content-Type": "application/json"
                        });

                        oModelGetGR.create("/ZC_TB_FT_GR_HEADER", oEntry, {
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
                        const oModelGets = that.getView().getModel("ZSB_AU_QA03_ITEM");
                        oModelGets.setHeaders({
                            "X-Requested-With": "X",
                            "Content-Type": "application/json"
                        });

                        const Header1 = {
                            materialdocumentyear_gr: ToAPIPOstTab.matdocyear,
                            materialdocumentno_gr: ToAPIPOstTab.materialdocument,
                        };

                        const id = rowData.sap_uuid;

                        oModelGets.update("/ZC_AU_QA03_ITEM('" + id + "')", Header1, {
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


            //---------------- Start Goods Receipt Reverse post --------------------------------------

            OnReverseApiPost_MatDoc_GR: async function (oEvent) {
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
                                    const oModelGet = that.getView().getModel("ZPTG01_MATDOC_REV_SRVB");

                                    // console.log("oEntry:", oEntry);

                                    let ToAPIPOstTab = await that.ToReverseAPIPOstTabs(oModelGet, rowData);
                                    let ToUpdateIntTab = await that.ToReverseMatDocNoTabs(rowData, ToAPIPOstTab);

                                    const oItemsModel = that.getView().getModel("ZSB_AU_QA03_ITEM");
                                    let sOrder = rowData.processorder
                                    let sBatch = rowData.batch
                                    debugger
                                    const aItems = await that.ProOrderItemFetch(oItemsModel, sOrder, sBatch);

                                    that.TabModelsitems = new sap.ui.model.json.JSONModel({
                                        ItemDatas: aItems
                                    });
                                    that.getView().setModel(that.TabModelsitems, "TabModelsitems");
                                    that.TabModelsitems.refresh(that);


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

            ToReverseAPIPOstTabs: function (oModelGet, rowData) {
                return new Promise((resolve, reject) => {
                    sap.ui.core.BusyIndicator.show();
                    try {
                        oModelGet.setHeaders({
                            "X-Requested-With": "X",
                            "Content-Type": "application/json"
                        });

                        const oEntry = {
                            materialdocument: rowData.materialdocumentno_gr,
                            matdocyear: rowData.materialdocumentyear_gr,
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

            ToReverseMatDocNoTabs: function (rowData, ToAPIPOstTab) {
                return new Promise((resolve, reject) => {
                    sap.ui.core.BusyIndicator.show();
                    try {
                        const that = this;
                        const oModelGet = that.getView().getModel("ZSB_AU_QA03_ITEM");
                        oModelGet.setHeaders({
                            "X-Requested-With": "X",
                            "Content-Type": "application/json"
                        });

                        const id = rowData.sap_uuid;

                        const oEntry = {
                            materialdocumentno_gr: '',
                            materialdocumentyear_gr: '',
                        };

                        oModelGet.update("/ZC_AU_QA03_ITEM('" + id + "')", oEntry, {
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


            //---------------- Start Goods Issue Reverse 531 post --------------------------------------

            OnReverseApiPost_MatDoc_GI_531: async function (oEvent) {
                sap.ui.core.BusyIndicator.show();
                const input = oEvent.getSource(); // the Input field
                const context = input.getBindingContext("TabModelsitems");
                let getHeaderData = this.screen2headermodel.getProperty("/HEADERDATA/");

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
                                   //const oModelGet = that.getView().getModel("ZPTG01_MATDOC_REV_SRVB");
                                        const oModelGet531 = that.getView().getModel("ZCE_CONF_REV_SRVB");
                                    // console.log("oEntry:", oEntry);

                                    let ToAPIPOstTab = await that.ToReverseAPIPOstTab531(oModelGet531, rowData);
                                    let ToUpdateIntTab = await that.ToReverseMatDocNoTab531(rowData, ToAPIPOstTab);

                                    const oItemsModel = that.getView().getModel("ZSB_AU_QA03_ITEM");
                                    let sOrder = rowData.processorder
                                    let sBatch = rowData.batch

                                    const aItems = await that.ProOrderItemFetch(oItemsModel, sOrder, sBatch);

                                    that.TabModelsitems = new sap.ui.model.json.JSONModel({
                                        ItemDatas: aItems
                                    });
                                    that.getView().setModel(that.TabModelsitems, "TabModelsitems");
                                    that.TabModelsitems.refresh(that);


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

            ToReverseAPIPOstTab531: function (oModelGet531, rowData) {
                return new Promise((resolve, reject) => {
                    sap.ui.core.BusyIndicator.show();
                    try {
                        oModelGet531.setHeaders({
                            "X-Requested-With": "X",
                            "Content-Type": "application/json"
                        });

                        const oEntry = {
                            // materialdocument: rowData.materialdocumentno_gi531,
                            // matdocyear: rowData.materialdocumentyear_gi531,
                            confirmationgroup: rowData.confirmationgroup,
                            confirmationcount : rowData.confirmationcount,
                            materialdocument : rowData.materialdocumentno_gi531,
                            matdocyear : rowData.materialdocumentyear_gi531
                        };

                        oModelGet531.create("/ZCE_CONF_REV", oEntry, {
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

            ToReverseMatDocNoTab531: function (rowData, ToAPIPOstTab) {
                return new Promise((resolve, reject) => {
                    sap.ui.core.BusyIndicator.show();
                    try {
                        const that = this;
                        const oModelGetitems = that.getView().getModel("ZSB_AU_QA03_ITEM");
                        oModelGetitems.setHeaders({
                            "X-Requested-With": "X",
                            "Content-Type": "application/json"
                        });

                        const id = rowData.sap_uuid;

                        const oEntry = {
                            materialdocumentno_gi531: '',
                            materialdocumentyear_gi531: '',
                        };

                        oModelGetitems.update("/ZC_AU_QA03_ITEM('" + id + "')", oEntry, {
                            success: function (oData, oResponse) {
                                console.log("Goods Reverse  Successfully...");
                                resolve(oData);
                            },
                            error: function (error) {
                                console.log("Error updating item:", error);
                                sap.m.MessageToast.show("Goods Reverse  - Internal table update failed");
                                reject(error);
                            }
                        });
                    } catch (error) {
                        console.error("Exception in ToUpdateIntTab:", error);
                        reject(error);
                    }
                });
            },




            //---------------- Start Goods Issue Reverse  post --------------------------------------

            OnReverseApiPost_MatDoc_GI: async function (oEvent) {
                sap.ui.core.BusyIndicator.show();
                const input = oEvent.getSource(); // the Input field
                const context = input.getBindingContext("TabModelsitems");
                let getHeaderData = this.screen2headermodel.getProperty("/HEADERDATA/");

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
                                    //const oModelGet = that.getView().getModel("ZPTG01_MATDOC_REV_SRVB");
                                    const oModelGet261 = that.getView().getModel("ZCE_CONF_REV_SRVB");

                                    // console.log("oEntry:", oEntry);

                                    let ToAPIPOstTab = await that.ToReverseAPIPOstTabgi261(oModelGet261, rowData);
                                    let ToUpdateIntTab = await that.ToReverseMatDocNoTabitem(rowData, ToAPIPOstTab);

                                    const oItemsModel = that.getView().getModel("ZSB_AU_QA03_ITEM");
                                    let sOrder = rowData.processorder
                                    let sBatch = rowData.batch
                                    debugger
                                    const aItems = await that.ProOrderItemFetch(oItemsModel, sOrder, sBatch);

                                    that.TabModelsitems = new sap.ui.model.json.JSONModel({
                                        ItemDatas: aItems
                                    });
                                    that.getView().setModel(that.TabModelsitems, "TabModelsitems");
                                    that.TabModelsitems.refresh(that);


                                } catch (error) {
                                    console.error("Error in Goods Reverse  :", error);
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

            ToReverseAPIPOstTabgi261: function (oModelGet261, rowData) {
                return new Promise((resolve, reject) => {
                    sap.ui.core.BusyIndicator.show();
                    try {
                        oModelGet261.setHeaders({
                            "X-Requested-With": "X",
                            "Content-Type": "application/json"
                        });

                        const oEntry = {
                            // materialdocument: rowData.materialdocumentno,
                            // matdocyear: rowData.materialdocumentyear,

                            confirmationgroup: rowData.confirmationgroup,
                            confirmationcount: rowData.confirmationcount,
                            materialdocument : rowData.materialdocumentno,
                            matdocyear : rowData.materialdocumentyear
                        };

                        oModelGet261.create("/ZCE_CONF_REV", oEntry, {
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

            ToReverseMatDocNoTabitem: function (rowData, ToAPIPOstTab) {
                return new Promise((resolve, reject) => {
                    sap.ui.core.BusyIndicator.show();
                    try {
                        const that = this;
                        const oModelGetqa03 = that.getView().getModel("ZSB_AU_QA03_ITEM");
                        oModelGetqa03.setHeaders({
                            "X-Requested-With": "X",
                            "Content-Type": "application/json"
                        });

                        const id = rowData.sap_uuid;

                        const oEntry = {
                            materialdocumentno: '',
                            materialdocumentyear: '',
                        };

                        oModelGetqa03.update("/ZC_AU_QA03_ITEM('" + id + "')", oEntry, {
                            success: function (oData, oResponse) {
                                console.log("Goods Reverse  Successfully...");
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



        });
    }
);
