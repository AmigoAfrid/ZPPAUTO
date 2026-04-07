sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    'sap/ui/core/Fragment',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    "sap/ui/unified/DateTypeRange",
    "sap/ui/core/date/UI5Date",
    'sap/ui/model/json/JSONModel',
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, MessageBox, MessageToast, Fragment, Filter, FilterOperator, JSONModel, UI5Date) {
        "use strict";

        return Controller.extend("zautodesignapp.controller.masterdata.dips.dipscalculation", {
            onInit: function () {

                // this.count = 1;

                // this.DIpsDelete = [];
            },

            onBeforeRendering: async function () {
                try {
                    // Show Busy Indicator before processing
                    sap.ui.core.BusyIndicator.show(0);

                    // Get Session User  
                    var userInfoService = sap.ushell.Container.getService("UserInfo");
                    var user = userInfoService.getUser();

                    this.TENTUSERID = user.getId();
                    this.TENTUSERNAME = user.getFullName();

                    console.log("getId:", this.TENTUSERID);
                    console.log("User Name:", this.TENTUSERNAME);

                    // Fetch DIPS data
                    let DipsTabDatas = await this.ToFetchDipsTabDatas();
                    this.DIpsDelete = DipsTabDatas;

                } catch (error) {
                    console.error("Error in onBeforeRendering:", error);
                } finally {
                    // Hide Busy Indicator in all cases (success or error)
                    sap.ui.core.BusyIndicator.hide();
                }
            },

            ToFetchDipsTabDatas: function () {
                return new Promise((resolve, reject) => {
                    var that = this;
                    let ZDIPS_Model = that.getView().getModel("ZDIPS_MASTER_SRVB");

                    ZDIPS_Model.read("/ZC_TB_ZDIPS", {
                        success: function (OData11) {
                            if (OData11.results.length > 0) {
                                that.count = OData11.results.length;

                                that.TabModel = new sap.ui.model.json.JSONModel({
                                    Datass: OData11.results,
                                });
                                that.getView().setModel(that.TabModel, "TabModel");
                                resolve(OData11.results);
                            } else {
                                that.count = 1;
                                that.TabModel = new sap.ui.model.json.JSONModel({
                                    Datass: [{
                                        macno: that.count,
                                        speed: "0.00",
                                        bar: "0.00",
                                        tot_pins: "0.00",
                                        qty_dips: "0.00",
                                        max_dips: "0.00",
                                        qty_shift: "0.00",
                                        qty_day: "0.00",
                                    }]
                                });
                                that.getView().setModel(that.TabModel, "TabModel");
                                resolve(that.TabModel.getData().Datass);
                            }
                        },
                        error: function (oError) {
                            console.error("Process Failed", oError);
                            reject(oError);
                        }
                    });
                });
            },

            OnValidateMacNo: function (oEvent) {
                let enteredValue = oEvent.getParameter("value");
                let tabledata = this.getView().getModel("TabModel").getProperty("/Datass");

                // Remove spaces and parse to number for comparison
                let cleanEntered = parseInt(enteredValue.trim(), 10);

                // Count how many times the entered macno appears in the table
                let duplicateCount = tabledata.filter(item => parseInt(item.macno, 10) === cleanEntered).length;

                if (duplicateCount > 1) {
                    sap.m.MessageBox.warning("Duplicate M/C No found. Please enter a unique value.");
                    oEvent.getSource().setValue(""); // Optional: clear the input
                }
            },


            OnGateAdd: function () {
                sap.ui.core.BusyIndicator.show();
                var tabledata = this.getView().getModel("TabModel").getProperty("/Datass");

                this.count = this.count + 1;
                console.log("tabledata", tabledata);

                if (tabledata.length > 0) {

                    var datas = {
                        macno: this.count,
                        speed: "0.00",
                        bar: "0.00",
                        tot_pins: "0.00",
                        qty_dips: "0.00",
                        max_dips: "0.00",
                        qty_shift: "0.00",
                        qty_day: '0.00',
                    };
                } else {
                    var datas = {
                        macno: this.count,
                        speed: "0.00",
                        bar: "0.00",
                        tot_pins: "0.00",
                        qty_dips: "0.00",
                        max_dips: "0.00",
                        qty_shift: "0.00",
                        qty_day: '0.00',
                    };
                }

                tabledata.push(datas);
                this.TabModel.refresh();
                sap.ui.core.BusyIndicator.hide();
            },

            onRowSelect: function (oEvent) {
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

            // For Table Item remove 
            OnTableRowRemove: function (oEvent) {

                var del = this.selectedData;
                var mod = this.getView().getModel("TabModel");
                var data = mod.getProperty("/Datass");
                var tabledata = this.getView().getModel("TabModel").getProperty("/Datass");
                let TodatlllAmt = 0;
                for (var i = 0; i < data.length; i++) {
                    for (var j = 0; j < del.length; j++) {

                        if (data[i] === del[j]) {
                            data.splice(i, 1);
                            this.count = this.count - 1;
                            mod.setProperty("/Datass", data);
                            mod.refresh();
                        }

                    }

                    // var mod1 = this.getView().getModel("TabModel");
                    // var data1 = mod1.getProperty("/Datass");
                    // // console.log("dataSamples:", data1)

                    // for (var j = 0; j < data1.length; j++) {
                    //     data1[j].macno = j + 1;
                    // }
                    // mod1.refresh();

                }

            },

            zdips_qty_dips: function (oEvent) {
                const input = oEvent.getSource(); // the Input field
                const context = input.getBindingContext("TabModel"); // context for that row

                if (context) {
                    const rowPath = context.getPath(); // e.g., "/Datass/2"
                    const rowData = context.getObject(); // The row's data

                    let getBarVal = rowData.bar.trim() !== "" ? parseFloat(rowData.bar) : 0.00;
                    let getTotalPinsVal = rowData.tot_pins.trim() !== "" ? parseFloat(rowData.tot_pins) : 0.00;
                    let getspeedsVal = rowData.speed.trim() !== "" ? parseFloat(rowData.speed) : 0.00;

                    // *************** Calculation Formula ******************
                    // zdips-qty_dips = zdips-bar * zdips-tot_pins.
                    // zdips-qty_day = zdips-speed * zdips-tot_pins * 1440.
                    // zdips-qty_shift = zdips-speed * zdips-tot_pins * 480.
                    // zdips-max_dips = zdips-qty_shift / zdips-qty_dips.

                    let qty_dips = getBarVal * getTotalPinsVal;
                    let qty_day = getspeedsVal * getTotalPinsVal * 1440;
                    let qty_shift = getspeedsVal * getTotalPinsVal * 480;
                    let max_dips;
                    if (qty_dips > 0) {
                        max_dips = qty_shift / qty_dips;
                    } else {
                        max_dips = 0.00;
                    }

                    // Update the qty_dips field in the model
                    context.getModel().setProperty(`${rowPath}/bar`, getBarVal.toFixed(2));
                    context.getModel().setProperty(`${rowPath}/tot_pins`, getTotalPinsVal.toFixed(2));
                    context.getModel().setProperty(`${rowPath}/speed`, getspeedsVal.toFixed(2));

                    // context.getModel().setProperty(`${rowPath}/qty_dips`, Math.round(qty_dips));
                    // context.getModel().setProperty(`${rowPath}/max_dips`, Math.round(max_dips));
                    // context.getModel().setProperty(`${rowPath}/qty_shift`, Math.round(qty_shift));
                    // context.getModel().setProperty(`${rowPath}/qty_day`, Math.round(qty_day));
                    context.getModel().setProperty(`${rowPath}/qty_dips`,qty_dips.toFixed(2));
                    context.getModel().setProperty(`${rowPath}/max_dips`, max_dips.toFixed(2));
                    context.getModel().setProperty(`${rowPath}/qty_shift`, qty_shift.toFixed(2));
                    context.getModel().setProperty(`${rowPath}/qty_day`, qty_day.toFixed(2));


                } else {
                    console.warn("No binding context found.");
                }
            },

            OnSubmit: async function (oEvent) {
                var that = this;
                sap.m.MessageBox.information("Do you want to submit this data.", {
                    actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
                    emphasizedAction: sap.m.MessageBox.Action.YES,
                    onClose: async function (sAction) {
                        if (sAction === "YES") {
                            let tabledata = that.getView().getModel("TabModel").getProperty("/Datass");
                            console.log("tabledata:", tabledata)

                            const ismacnoPresent = tabledata.every(item => item.macno !== "");
                            const isbarPresent = tabledata.every(item => item.bar !== "0.00");
                            const istot_pinsPresent = tabledata.every(item => item.tot_pins !== "0.00");
                            const isspeedPresent = tabledata.every(item => item.speed !== "0.00");

                            if (isbarPresent && istot_pinsPresent && isspeedPresent && ismacnoPresent) {
                                // sap.m.MessageBox.success("Ok");

                                sap.ui.core.BusyIndicator.show(0); // 👉 Show loading indicator here

                                let ZDIPS_Model = that.getView().getModel("ZDIPS_MASTER_SRVB");


                                ZDIPS_Model.read("/ZC_TB_ZDIPS", {
                                    success: async function (iCount) {
                                        console.log("iCounti", iCount)
                                        let Count = Number(iCount.results.length);

                                        try {
                                            if (Count > 0) {
                                                console.log("that.DIpsDelete:", that.DIpsDelete)
                                                await that.ToDeleteDipsCalDatas(iCount.results);
                                            }

                                            for (let i = 0; i < tabledata.length; i++) {
                                                let DipsPOST = {
                                                    macno: String(tabledata[i].macno),
                                                    speed: tabledata[i].speed,
                                                    bar: tabledata[i].bar,
                                                    tot_pins: tabledata[i].tot_pins,
                                                    qty_dips: tabledata[i].qty_dips,
                                                    max_dips: tabledata[i].max_dips,
                                                    qty_shift: tabledata[i].qty_shift,
                                                    qty_day: tabledata[i].qty_day,
                                                    createdat: new Date(),
                                                    createdby: that.TENTUSERID,
                                                    updatedat: new Date(),
                                                    updatedby: that.TENTUSERID,
                                                };

                                                await that.ToInsertDipsCalDatas(DipsPOST); // insert
                                            }

                                            sap.m.MessageBox.success("Data saved successfully...");

                                        } catch (error) {
                                            console.error("Error during operation:", error);
                                        } finally {
                                            sap.ui.core.BusyIndicator.hide(); // 👉 Hide in finally block
                                        }

                                    },
                                    error: function (Error) {
                                        console.log(Error);
                                        sap.m.MessageBox.error("Failed to fetch count");
                                        sap.ui.core.BusyIndicator.hide(); // 👉 Hide on error too
                                    }
                                });

                            } else {
                                sap.m.MessageBox.information("Please enter valid data...");
                            }

                        } else {
                            sap.m.MessageToast.show("Cancelled");
                            sap.ui.core.BusyIndicator.hide();
                        }
                    }
                });

            },

            ToDeleteDipsCalDatas: function (tabledata) {
                var that = this;

                let deletionPromises = tabledata.map(item => {
                    return new Promise((resolve, reject) => {
                        let Model0001 = that.getView().getModel("ZDIPS_MASTER_SRVB");
                        Model0001.remove("/ZC_TB_ZDIPS('" + item.macno + "')", {
                            success: function () {
                                resolve("ok");
                            },
                            error: function (oError) {
                                console.error("Error deleting data:", oError);
                                sap.ui.core.BusyIndicator.hide(); // 👉 Hide on error too
                                reject("error");
                            }
                        });
                    });
                });

                return Promise.all(deletionPromises);
            },

            ToInsertDipsCalDatas: function (DipsPOST) {
                return new Promise((resolve, reject) => {
                    var that = this;
                    var Model0001 = that.getView().getModel("ZDIPS_MASTER_SRVB");

                    Model0001.create("/ZC_TB_ZDIPS", DipsPOST, {
                        success: function (oData, oResponse) {
                            console.log("Data inserted successfully:", oData);
                            resolve("ok");
                        },
                        error: function (oError) {
                            console.error("Error creating data in ZDIPS_MASTER_SRVB:", oError);
                            sap.m.MessageBox.error("Insertion Failed...");
                            sap.ui.core.BusyIndicator.hide(); // 👉 Hide on error too
                            reject("error");
                        }
                    });
                });
            },

        });
    });
