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

        return Controller.extend("zautodesignapp.controller.masterdata.componentmaterial.componentmaterial", {
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
                    let ZDIPS_Model = that.getView().getModel("ZSB_AU_MASTERDATA");
            
                    ZDIPS_Model.read("/ZC_AU_ZCOMPMASTER", {
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
                                        sno: that.count,
                                        matcode: "",
                                        matdesc: "",
                                        actualmatdesc: "",
                                        status: "",
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
                let duplicateCount = tabledata.filter(item => parseInt(item.matcode, 10) === cleanEntered).length;
            
                if (duplicateCount > 1) {
                    sap.m.MessageBox.warning("Duplicate M/C No found. Please enter a unique value.");
                    oEvent.getSource().setValue(""); // Optional: clear the input
                }
            },
            

            OnGateAdd:function(){
                sap.ui.core.BusyIndicator.show();
                var tabledata = this.getView().getModel("TabModel").getProperty("/Datass");

                this.count = this.count + 1;
                console.log("tabledata", tabledata);

                if(tabledata.length > 0){

                    var datas = {
                        sno: this.count,
                        matcode: "",
                        matdesc: "",
                        actualmatdesc: "",
                        status: "",
                        };
                }else{
                    var datas = {
                        sno: this.count,
                        matcode: "",
                        matdesc: "",
                        actualmatdesc: "",
                        status: "",
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
                // Example: selectedData[0].matcode, selectedData[1].speed, etc.
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
                    //     data1[j].matcode = j + 1;
                    // }
                    // mod1.refresh();
        
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
                            
                            const ismacnoPresent = tabledata.every(item => item.matcode !== "");
                            const isbarPresent = tabledata.every(item => item.matdesc !== "");
                            const istot_pinsPresent = tabledata.every(item => item.actualmatdesc !== "");
                        
                            if (isbarPresent && istot_pinsPresent && ismacnoPresent) {
                                // sap.m.MessageBox.success("Ok");
                        
                                sap.ui.core.BusyIndicator.show(0); // 👉 Show loading indicator here
                        
                                let ZDIPS_Model = that.getView().getModel("ZSB_AU_MASTERDATA");
                                
                                ZDIPS_Model.read("/ZC_AU_ZCOMPMASTER", {
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
                                                    matcode: String(tabledata[i].matcode),
                                                    sno: parseInt(tabledata[i].sno),
                                                    matdesc: tabledata[i].matdesc,
                                                    actualmatdesc: tabledata[i].actualmatdesc,
                                                    status: tabledata[i].status,
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
            
                        }else{
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
                        let Model0001 = that.getView().getModel("ZSB_AU_MASTERDATA");
                        Model0001.remove("/ZC_AU_ZCOMPMASTER('" + item.matcode + "')", {
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
                    var Model0001 = that.getView().getModel("ZSB_AU_MASTERDATA");
            
                    Model0001.create("/ZC_AU_ZCOMPMASTER", DipsPOST, {
                        success: function (oData, oResponse) {
                            console.log("Data inserted successfully:", oData);
                            resolve("ok");
                        },
                        error: function (oError) {
                            console.error("Error creating data in ZSB_AU_MASTERDATA:", oError);
                            sap.m.MessageBox.error("Insertion Failed...");
                            sap.ui.core.BusyIndicator.hide(); // 👉 Hide on error too
                            reject("error");
                        }
                    });
                });
            },
                                    
        });
    });
