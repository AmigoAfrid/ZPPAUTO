sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/model/json/JSONModel",
        "sap/m/MessageBox"
    ],
    function (Controller, JSONModel, MessageBox) {
        "use strict";

        // ***********************************************************************************************************************************************************************  
        // ~~~~~~~~~~~~ This controller for Screen 1 ~~~~~~~~~~~~~~~~~~
        // ***********************************************************************************************************************************************************************

        return Controller.extend("zautodesignapp.controller.ftp.transaction.acmbasecontroller", {
            onInit: function () {

                // Note : onInit Common for Screen1 and Screen2

                this.screenModel = new sap.ui.model.json.JSONModel({
                    openscreen: "screen1"
                });
                this.getView().setModel(this.screenModel, "ScreenVisible");

                this.selectedRowModel = new sap.ui.model.json.JSONModel({

                });
                this.getView().setModel(this.selectedRowModel, "SelectedRow");

                this.acmModel = new sap.ui.model.json.JSONModel({
                    HeaderData: [{
                        daterange: "",
                        machineno: ""
                    }],
                    TableVisible: false
                });
                this.getView().setModel(this.acmModel, "acmModel");

                var oModel = new sap.ui.model.json.JSONModel({
                    selectedMachine: "" // Default value
                });
                this.getView().setModel(oModel);


                // Create the table item model for screen 2
                this.TabItemModel = new sap.ui.model.json.JSONModel({
                    Datatabitem: [] // Static, only one plant
                });

                // Set the model to the view
                this.getView().setModel(this.TabItemModel, "TabItemModel");

                // BaseController.prototype.onInit.call(this);

                // Initialize TabModel specific to this screen
                const tabModel = new sap.ui.model.json.JSONModel({
                    Samples: [{
                        "item1": 1,
                        "item2": "Product 01"
                    }]
                });
                this.getView().setModel(tabModel, "TabModel");




                var JsonMModel = new sap.ui.model.json.JSONModel({

                    Samples: [

                        {
                            "MachineID": 1,
                            "MachineName": "ACM01"
                        },
                        {
                            "MachineID": 2,
                            "MachineName": "ACM02"
                        },
                        {
                            "MachineID": 3,
                            "MachineName": "ACM03"
                        },
                        {
                            "MachineID": 4,
                            "MachineName": "ACM04"
                        },
                        {
                            "MachineID": 5,
                            "MachineName": "ACM05"
                        },
                        {
                            "MachineID": 6,
                            "MachineName": "ACM06"
                        },

                    ]
                })

                this.getView().setModel(JsonMModel, "MModel");

                this.shiftmodel = new sap.ui.model.json.JSONModel({
                    shfitsample: [{
                        "shiftid": "A",
                        "shiftname": "A"
                    },
                    {
                        "shiftid": "B",
                        "shiftname": "B"
                    },
                    {
                        "shiftid": "C",
                        "shiftname": "C"
                    }
                    ]
                })
                this.getView().setModel(this.shiftmodel, "shiftmodel")

                this.rowdatamodel = new sap.ui.model.json.JSONModel({
                    itemdatas: []
                });
                this.getView().setModel(this.rowdatamodel, "rowdatamodel");

                this.SelectScreen1Data = ''



            },
            onAfterRendering: function () {
                var oUserRoleModel = new sap.ui.model.json.JSONModel();
                this.getView().setModel(oUserRoleModel, "UserModel");

                var oModel = this.getView().getModel("ZCE_USERBUSINESSROLE_SRB"); // OData V2 service
                var sUserId = sap.ushell.Container.getUser().getId(); // gets current logged-in user

                var filter1 = new sap.ui.model.Filter("UserID", sap.ui.model.FilterOperator.EQ, sUserId)
                var filter2 = new sap.ui.model.Filter("BusinessRole", sap.ui.model.FilterOperator.EQ, "ZPP_AUTO_REVERSE_ROLE")

                var that = this;
                oModel.read("/ZCE_USERBUSINESSROLE", {
                    filters: [filter1, filter2],
                    success: function (oData) {
                        if (oData.results.length > 0) {
                            //   console.log("Tenant user found:", tenantUser);
                            that.AdminPanelAuth = new sap.ui.model.json.JSONModel({
                                Samples: { Role: true }
                            });
                            that.getView().setModel(that.AdminPanelAuth, "AdminPanelAuth");
                            console.log("that.AdminPanelAuth:", that.AdminPanelAuth);
                            sap.ui.core.BusyIndicator.hide();
                            //resolve(oData.results);

                            // You can handle the case where the tenant user is found here
                        } else {
                            console.log("Tenant user not found");
                            that.AdminPanelAuth = new sap.ui.model.json.JSONModel({
                                Samples: { Role: false }
                            });
                            that.getView().setModel(that.AdminPanelAuth, "AdminPanelAuth");
                            console.log("that.AdminPanelAuth:", that.AdminPanelAuth);
                            sap.ui.core.BusyIndicator.hide();
                            // resolve(oData.results);
                        }
                    },
                    error: function (oError) {
                        console.error("Failed to fetch roles", oError);
                        oUserRoleModel.setProperty("/roles", []);
                    }
                });

            },
            isReverseEnabled: function (materialdocumentno, roles) {
                return !!materialdocumentno && roles && roles.includes("ZPP_AUTO_REVERSE_ROLE");
            },

            // isReverseEnabled: function (materialdocumentno, roles) {
            //     if (!materialdocumentno) {
            //         return false; // disabled if no material document
            //     }
            //     return roles && roles.includes("ZPP_AUTO_REVERSE_ROLE"); // enable only if user has ZROLE
            // },

            validateDateRange: function () {
                const headerData = this.acmModel.getProperty("/HeaderData/0");
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
                try {
                    sap.ui.core.BusyIndicator.show(); // Optional: show busy indicator

                    const table = oEvent.getSource();
                    const selectedIndex = table.getSelectedIndex();

                    if (selectedIndex >= 0) {
                        const context = table.getContextByIndex(selectedIndex);
                        const selectedData = context.getObject();

                        this.SelectScreen1Data = selectedData;

                        let hhh = parseInt(selectedData.ACMNO)

                        console.log("Selected Data:", selectedData?.ProcessOrder);

                        // DIPS master data binding machine
                        const dipsmodel = this.getView().getModel("ZDIPS_MASTER_SRVB");
                        const dipsfilter = new sap.ui.model.Filter("macno", sap.ui.model.FilterOperator.EQ, String(hhh));
                        let filterstatusactive = new sap.ui.model.Filter("StatusIsActive", sap.ui.model.FilterOperator.EQ, true);
                        const dipsmaster = await this.ToFetchdipsmaster(dipsmodel, dipsfilter);

                        if(dipsmaster.results.length === 0){
                            sap.m.MessageBox.error("please check Dips Master...")
                            return
                        }

                        // let Filter01_IntTable = new sap.ui.model.Filter("Prodorderno", sap.ui.model.FilterOperator.EQ, "00"+Value);
                        // let Filter02_IntTable = new sap.ui.model.Filter("Createdby", sap.ui.model.FilterOperator.EQ, String(this.TENTUSERID));

                        var oModelGetHeader = this.getView().getModel("ZSB_AU_ACM_HEADER"); //ZC_AU_ACM_HEADER
                        var oModelGetItem = this.getView().getModel("ZSB_AU_ACM_ITEM"); // ZC_AU_ACM_ITEM

                        let ManuFacorderModel = this.getView().getModel("ZAU_FT_PROCESSORDER_SRVB_");
                        let Value = selectedData.ProcessOrder;
                        let Filter01 = new sap.ui.model.Filter("ManufacturingOrder", sap.ui.model.FilterOperator.EQ, Value);
                        let GetProcessOrderStatus = await this.ToCheckProcOrderStatus(ManuFacorderModel, Filter01, filterstatusactive);
                        if (GetProcessOrderStatus.results.length === 0) {
                            sap.m.MessageBox.error("Please release the process order...");
                            sap.ui.core.BusyIndicator.hide();
                            return;
                        }

                        let oFilterProcessOrder = new sap.ui.model.Filter("processorder", sap.ui.model.FilterOperator.EQ, "00" + selectedData.ProcessOrder);
                        let oFilterBatch = new sap.ui.model.Filter("batch", sap.ui.model.FilterOperator.EQ, selectedData.Batch);
                        let oFilterAcmno = new sap.ui.model.Filter("acmno", sap.ui.model.FilterOperator.EQ, selectedData.ACMNO);
                        // debugger
                        // To check ACM Data posted or not
                        let GetInternalTabDatas = await this.ToCheckProcOrderInInternally(oFilterProcessOrder, oFilterBatch, oModelGetHeader);
                        // debugger  if length is above 0 
                        let GetInternalTabDatasItems = await this.ToCheckProcOrderInInternallyItem(oFilterProcessOrder, oFilterBatch, oModelGetItem);



                        console.log("GetInternalTabDatas", GetInternalTabDatas)
                        console.log("GetInternalTabDatasItems", GetInternalTabDatasItems)

                        this.TabItemModel = new sap.ui.model.json.JSONModel({
                            Datatabitem: GetInternalTabDatasItems.results
                        });

                        // Set the model to the view
                        this.getView().setModel(this.TabItemModel, "TabItemModel");
                        let ojsonmodelitem = this.getView().getModel("TabItemModel");
                        let property01 = ojsonmodelitem.getProperty("/Datatabitem");
                        // let getHeaderData = this.screen2headermodel.getProperty("/HEADERDATA/");
                        let OrderQtyLakh = parseFloat(selectedData.QtytoMfdLakhs);
                        // let dispmaster = this.dipsmodelcal.getProperty("/DipsData");

                        if (GetInternalTabDatasItems.results.length > 0) {
                            // each line item we are doing cal... 
                            let dipscum = 0
                            let cuminlak = 0

                            GetInternalTabDatasItems.results.forEach((Item, index) => {
                                console.log("index", index);


                                var dipsuptoprevious = Item.dipsuptoprevious
                                var cummulativeinlaksh = Item.cummulativeinlaksh
                                var dipsqtylakh0 = Item.dipsqtylakh

                                dipscum = parseFloat(dipscum) + parseFloat(dipsuptoprevious)
                                cuminlak = parseFloat(cuminlak) + parseFloat(dipsqtylakh0)
                                let dipsqtylakh = (dipsuptoprevious * dipsmaster.results[0].qty_dips) / 100000;
                                let balqty = parseFloat(OrderQtyLakh) - parseFloat(cuminlak)
                                console.log("dipscum", dipscum);
                                property01[index].abacd = dipscum;
                                property01[index].cumulative = dipscum;
                                property01[index].dipsqtylakh = dipsqtylakh;
                                property01[index].cummulativeinlaksh = cuminlak.toFixed(2);
                                property01[index].balanceqty = balqty.toFixed(3);



                            });

                            console.log("ojsonmodelitem", ojsonmodelitem);

                        }



                        // Move to screen after valid selection
                        this.showScreen("screen2");

                        // Initialize model with selected data
                        this.screen2headermodel = new sap.ui.model.json.JSONModel({
                            HEADERDATA: selectedData
                        });
                        this.getView().setModel(this.screen2headermodel, "screen2model");

                        // this.TabItemModel = new sap.ui.model.json.JSONModel({
                        //     Datatabitem: GetInternalTabDatasItems.results
                        // });

                        // // Set the model to the view
                        // this.getView().setModel(this.TabItemModel, "TabItemModel");


                        // Function to update current time dynamically
                        const updateTime = () => {
                            try {
                                const currentTime = new Date().toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                    hour12: true
                                });
                                this.screen2headermodel.setProperty("/HEADERDATA/currentTime", currentTime);
                            } catch (timeError) {
                                console.error("Error updating time:", timeError);
                            }
                        };

                        // Start updating time every second after a short delay
                        setTimeout(() => {
                            setInterval(updateTime, 1000);
                        }, 500);

                        // Bind dips master data
                        this.dipsmodelcal = new sap.ui.model.json.JSONModel({
                            DipsData: dipsmaster.results[0]
                        });
                        this.getView().setModel(this.dipsmodelcal, "dipsmodelcal");

                        console.log("DIPS Model:", this.dipsmodelcal);
                        console.log("Model set successfully!");
                    } else {
                        // sap.m.MessageBox.warning("No row selected. Please click on a row before proceeding.");
                        this.SelectScreen1Data = ''
                        return;
                    }
                } catch (error) {
                    console.error("Error in handleRowSelect:", error);
                    sap.m.MessageBox.error("An unexpected error occurred. Please try again.");
                } finally {
                    sap.ui.core.BusyIndicator.hide(); // Hide the busy indicator  
                }
            },

            // To check the process order in internal table stored or not
            ToCheckProcOrderInInternally: function (Filter01, Filter02, oModelGet) {
                return new Promise(function (resolve, reject) {
                    // var that = this;
                    sap.ui.core.BusyIndicator.show(); // Show busy indicator

                    try {
                         var topValue = 5000;
                        var skipValue = 0;
                        oModelGet.read("/ZC_AU_ACM_HEADER", {
                         urlParameters: {
                            "$top": topValue,
                            "$skip": skipValue
                        },

                            filters: [Filter01, Filter02],

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


            // ToCheckProcOrderInInternally: async function (Filter01, Filter02, oModelGet) {
            //     sap.ui.core.BusyIndicator.show(0);

            //     const allResults = [];
            //     const top = 100; // number of records per request (adjust if backend allows larger)
            //     let skip = 0;
            //     let hasMoreData = true;

            //     // Combine both filters
            //     const filters = [];
            //     if (Filter01) filters.push(Filter01);
            //     if (Filter02) filters.push(Filter02);

            //     // Helper: read one page
            //     const readPage = (skipCount) => {
            //         return new Promise((resolve, reject) => {
            //             oModelGet.read("/ZC_AU_ACM_HEADER", {
            //                 filters: filters,
            //                 urlParameters: {
            //                     "$top": top,
            //                     "$skip": skipCount
            //                 },
            //                 success: function (oData) {
            //                     resolve(oData.results || []);
            //                 },
            //                 error: function (oError) {
            //                     console.error("❌ Error reading ACM Header:", oError);
            //                     sap.m.MessageToast.show("Failed to load ACM Header data.");
            //                     resolve([]); // continue gracefully
            //                 }
            //             });
            //         });
            //     };

            //     try {
            //         // Loop through all pages
            //         while (hasMoreData) {
            //             const pageData = await readPage(skip);
            //             allResults.push(...pageData);

            //             if (pageData.length < top) {
            //                 hasMoreData = false; // reached last page
            //             } else {
            //                 skip += top; // next batch
            //             }
            //         }

            //         return allResults;

            //     } catch (error) {
            //         console.error("❌ Exception during ACM Header fetch:", error);
            //         return [];

            //     } finally {
            //         sap.ui.core.BusyIndicator.hide();
            //     }
            // },


            ToCheckProcOrderInInternallyItem: function (Filter01, Filter02, oModelGetItem) {
                return new Promise(function (resolve, reject) {
                    // var that = this;
                    sap.ui.core.BusyIndicator.show(); // Show busy indicator

                    try {
                        var topValue = 5000;
                        var skipValue = 0;
                        oModelGetItem.read("/ZC_AU_ACM_ITEM", {
                            urlParameters: {
                                "$top": topValue,
                                "$skip": skipValue
                            },
                            filters: [Filter01, Filter02],
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



            // ToCheckProcOrderInInternallyItem: async function (Filter01, Filter02, oModelGetItem) {
            //     sap.ui.core.BusyIndicator.show(0); // Show busy indicator

            //     const allResults = [];
            //     const top = 100; // Number of records to fetch per request
            //     let skip = 0;
            //     let hasMoreData = true;

            //     // Combine filters
            //     const filters = [];
            //     if (Filter01) filters.push(Filter01);
            //     if (Filter02) filters.push(Filter02);

            //     // Helper function to read a single page
            //     const readPage = (skipCount) => {
            //         return new Promise((resolve, reject) => {
            //             oModelGetItem.read("/ZC_AU_ACM_ITEM", {
            //                 filters: filters,
            //                 urlParameters: {
            //                     "$top": top,
            //                     "$skip": skipCount
            //                 },
            //                 success: function (oData) {
            //                     resolve(oData.results || []);
            //                 },
            //                 error: function (oError) {
            //                     console.error("❌ Error reading ACM Item data:", oError);
            //                     sap.m.MessageToast.show("Failed to load ACM Item data.");
            //                     resolve([]); // Continue gracefully even on error
            //                 }
            //             });
            //         });
            //     };

            //     try {
            //         // Loop through pages until all data is fetched
            //         while (hasMoreData) {
            //             const pageData = await readPage(skip);
            //             allResults.push(...pageData);

            //             if (pageData.length < top) {
            //                 hasMoreData = false; // Last page reached
            //             } else {
            //                 skip += top; // Go to next batch
            //             }
            //         }

            //         return allResults;

            //     } catch (error) {
            //         console.error("❌ Exception during ACM Item fetch:", error);
            //         return [];

            //     } finally {
            //         sap.ui.core.BusyIndicator.hide(); // Always hide busy indicator
            //     }
            // },







            ToFetchdipsmaster: function (dipsmodel, dipsfilter) {
                return new Promise(function (resolve, reject) {

                    var topValue = 5000;
                    var skipValue = 0;

                    dipsmodel.read("/ZC_TB_ZDIPS", {

                          urlParameters: {
                            "$top": topValue,
                            "$skip": skipValue
                        },
                        filters: [dipsfilter],
                        success: function (oData) {
                            resolve(oData);
                        },
                        error: function (oError) {
                            console.error("Error fetching DIPS master:", oError);
                            reject(oError);
                        }
                    });
                });
            },



            // ToFetchdipsmaster: async function (dipsmodel, dipsfilter) {
            //     sap.ui.core.BusyIndicator.show(0); // Show busy indicator

            //     const allResults = [];
            //     const top = 100; // Number of records per request (adjust if backend allows more)
            //     let skip = 0;
            //     let hasMoreData = true;

            //     const filters = [];
            //     if (dipsfilter) filters.push(dipsfilter);

            //     // Helper: read one page
            //     const readPage = (skipCount) => {
            //         return new Promise((resolve, reject) => {
            //             dipsmodel.read("/ZC_TB_ZDIPS", {
            //                 filters: filters,
            //                 urlParameters: {
            //                     "$top": top,
            //                     "$skip": skipCount
            //                 },
            //                 success: function (oData) {
            //                     resolve(oData.results || []);
            //                 },
            //                 error: function (oError) {
            //                     console.error("❌ Error fetching DIPS master data:", oError);
            //                     sap.m.MessageToast.show("Failed to load DIPS master data.");
            //                     resolve([]); // Continue gracefully even on error
            //                 }
            //             });
            //         });
            //     };

            //     try {
            //         // Fetch all pages
            //         while (hasMoreData) {
            //             const pageData = await readPage(skip);
            //             allResults.push(...pageData);

            //             if (pageData.length < top) {
            //                 hasMoreData = false; // Last page reached
            //             } else {
            //                 skip += top; // Next page
            //             }
            //         }

            //         return allResults;

            //     } catch (error) {
            //         console.error("❌ Exception during DIPS master fetch:", error);
            //         return [];

            //     } finally {
            //         sap.ui.core.BusyIndicator.hide(); // Always hide BusyIndicator
            //     }
            // },




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


            GoAcmselect: function () {

                const headerData = this.acmModel.getProperty("/HeaderData/0");
                console.log("Selected Date Range:", headerData.daterange);
                console.log("Machine no:", headerData.machineno);


                let Dates = headerData.daterange;
                let machineno = headerData.selectedMachine;

                let bHasDate = Dates && Dates.trim() !== "";
                const bHasmachine = machineno && machineno.trim() !== "";


                if (!bHasDate || !bHasmachine) {
                    sap.m.MessageBox.warning("Please enter  a Date Range and Machine No");
                    return false;
                }

                // Make the table visible
                this.acmModel.setProperty("/TableVisible", true);


                let FromDate = "",
                    ToDate = "";
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
                    FinalFilter.push(new sap.ui.model.Filter("ACMButton", sap.ui.model.FilterOperator.EQ, machineno));
                }


                // Data fetch
                const model0 = this.getView().getModel("ZAU_ACM_PROCESSORDER_SRVB");
                let aAllItems = [];
                let iSkip = 0;
                const iTop = 100;
                const that = this;

                that.getView().setBusy(true);

                function fetchData() {
                    model0.read("/ZCE_ACM_PROCESSORDER", {
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
                                const tabACMModel = new sap.ui.model.json.JSONModel({
                                    ItemData: aAllItems
                                });
                                that.getView().setModel(tabACMModel, "tabACMModel");
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

                this.tabACMModel = new sap.ui.model.json.JSONModel({
                    ItemData: []
                });
                this.getView().setModel(this.tabACMModel, "tabACMModel");


                this.TabItemModel = new sap.ui.model.json.JSONModel({
                    Datatabitem: [], // Static, only one plant
                });

                // Set the model to the view
                this.getView().setModel(this.TabItemModel, "TabItemModel");

            },

            onRowSelect: function (oEvent) {
                // Use the base controller's row select logic
                this.handleRowSelect(oEvent);
            },

            OnAcmCheck: function () {
                if (!this.ChFrag) {
                    this.ChFrag = sap.ui.xmlfragment(this.getView().getId("idacmvalue"), "zautodesignapp.view.acm.transaction.fragment.valuehelp", this);
                    this.getView().addDependent(this.ChFrag);
                }
                this.ChFrag.open();
            },

            OnClose: function () {
                this.ChFrag.close();
            },

            // batch value help 

            onValueHelpRequestBatch: function (oEvent) {



                sap.ui.core.BusyIndicator.show();

                //   var oFilters1 = new sap.ui.model.Filter("Createdat", sap.ui.model.FilterOperator.EQ, Date);

                const input = oEvent.getSource(); // the Input field
                const context = input.getBindingContext("CompDipsModel");

                this.spath = oEvent.getSource().getParent().getCells()[6];
                this.storagepath = oEvent.getSource().getParent().getCells()[5];
                console.log("context", context);
                if (context) {
                    const rowData = context.getObject();

                    const aFilters = [
                        new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.EQ, rowData.material),
                        new sap.ui.model.Filter("Plant", sap.ui.model.FilterOperator.EQ, rowData.plant),
                    ];

                    var oMaterial = rowData.material;
                    var oBatch = rowData.batch;



                    // Retrieve the model from the view
                    var oModel = this.getView().getModel("ZCE_BATCH_MATNR_F4_SRVB");

                    // Check if the model is valid
                    if (!oModel) {
                        console.error("OData model is not properly initialized.");
                        sap.ui.core.BusyIndicator.hide();
                        return;
                    }

                    //   var oFilters = [oFilters1];
                    var that = this;
                    var aAllItems = []; // Array to hold all retrieved items

                    // Function to fetch data recursively
                    function fetchData(skipCount) {
                        // var that = this;
                        // var oModel = that.getView().getModel();
                        // that.getView().setModel(oModel);
                        oModel.read("/ZCE_BATCH_BASE_MATNR_F4", {
                            filters: aFilters,
                            urlParameters: {
                                $top: 5000,  // Request a chunk of 5000 records
                                $skip: skipCount  // Start from the skipCount position
                            },
                            success: function (oData) {
                                var aItems = oData.results;
                                aAllItems = aAllItems.concat(aItems); // Concatenate current chunk to the array

                                // Check if there are more records to fetch
                                if (oData.results.length >= 5000) {
                                    // If there are more records, fetch next chunk
                                    fetchData(skipCount + 5000);
                                } else {
                                    // If no more records, all data is fetched
                                    finishFetching();
                                }
                            },
                            error: function (oError) {
                                console.error("Error reading data: ", oError);
                                sap.ui.core.BusyIndicator.hide();
                            }
                        });
                    }

                    function finishFetching() {


                        // Once all data is fetched, proceed to display it
                        that.oJSONBatchModel = new sap.ui.model.json.JSONModel({
                            Datas: aAllItems
                        });
                        that.getView().setModel(that.oJSONBatchModel, "oJSONBatchModel");
                        console.log("that.oJSONBatchModel:", that.oJSONBatchModel)

                        // Load the value help dialog fragment
                        that._oBasicSearchField = new sap.m.SearchField();
                        that.loadFragment({
                            name: "zautodesignapp.view.batchfragment.BatchValueHelpDialogACM"
                        }).then(function (oDialog) {
                            var oFilterBar = oDialog.getFilterBar();

                            var oColumnProductCode, oColumnMaterial, oColumnPlant, oColumnstorage, oColumnstocktype;
                            that._oVHD = oDialog;
                            that.getView().addDependent(oDialog);

                            // Set key fields for filtering in the Define Conditions Tab
                            oDialog.setRangeKeyFields([{
                                label: "Batch No.",
                                key: "Batch",
                                type: "string",
                                typeInstance: new sap.ui.model.type.String({}, {
                                    maxLength: 10
                                })
                            }]);

                            // Set Basic Search for FilterBar
                            oFilterBar.setFilterBarExpanded(false);
                            oFilterBar.setBasicSearch(that._oBasicSearchField);

                            // Trigger filter bar search when the basic search is fired
                            that._oBasicSearchField.attachSearch(function () {
                                oFilterBar.search();
                            });

                            oDialog.getTableAsync().then(function (oTable) {
                                oTable.setModel(that.oJSONBatchModel);

                                // Bind rows/items based on table type (sap.ui.table.Table or sap.m.Table)
                                if (oTable.bindRows) {
                                    // Desktop/Table scenario (sap.ui.table.Table)
                                    oTable.bindAggregation("rows", {
                                        path: "oJSONBatchModel>/Datas",
                                        events: {
                                            dataReceived: function () {
                                                oDialog.update();
                                            }
                                        }
                                    });


                                    oColumnMaterial = new sap.ui.table.Column({
                                        label: new sap.m.Label({ text: "Material " }),
                                        template: new sap.m.Text({ wrapping: false, text: "{oJSONBatchModel>Material}" })
                                    });
                                    oColumnMaterial.data({
                                        fieldName: "Material"
                                    });

                                    oColumnPlant = new sap.ui.table.Column({
                                        label: new sap.m.Label({ text: "Plant " }),
                                        template: new sap.m.Text({ wrapping: false, text: "{oJSONBatchModel>Plant}" })
                                    });
                                    oColumnPlant.data({
                                        fieldName: "Plant"
                                    });


                                    // Define columns for sap.ui.table.Table
                                    oColumnProductCode = new sap.ui.table.Column({
                                        label: new sap.m.Label({ text: "Batch No " }),
                                        template: new sap.m.Text({ wrapping: false, text: "{oJSONBatchModel>Batch}" })
                                    });
                                    oColumnProductCode.data({
                                        fieldName: "Batch"
                                    });



                                    oColumnstorage = new sap.ui.table.Column({
                                        label: new sap.m.Label({ text: "Storage Location " }),
                                        template: new sap.m.Text({ wrapping: false, text: "{oJSONBatchModel>StorageLocation}" })
                                    });
                                    oColumnstorage.data({
                                        fieldName: "StorageLocation"
                                    });


                                    oColumnstocktype = new sap.ui.table.Column({
                                        label: new sap.m.Label({ text: "Unrestricted Use" }),
                                        template: new sap.m.Text({ wrapping: false, text: "{oJSONBatchModel>MatlWrhsStkQtyInMatlBaseUnit}" })
                                    });
                                    oColumnstocktype.data({
                                        fieldName: "MatlWrhsStkQtyInMatlBaseUnit"
                                    });






                                    oTable.addColumn(oColumnMaterial);
                                    oTable.addColumn(oColumnPlant);
                                    oTable.addColumn(oColumnProductCode);
                                    oTable.addColumn(oColumnstorage);
                                    oTable.addColumn(oColumnstocktype);



                                } else if (oTable.bindItems) {
                                    // Mobile scenario (sap.m.Table)
                                    oTable.bindAggregation("items", {
                                        path: "oJSONBatchModel>/Datas",
                                        template: new sap.m.ColumnListItem({
                                            cells: [
                                                new sap.m.Text({ text: "{oJSONBatchModel>Material}" }),
                                                new sap.m.Text({ text: "{oJSONBatchModel>Plant}" }),
                                                new sap.m.Text({ text: "{oJSONBatchModel>Batch}" }),
                                                new sap.m.Text({ text: "{oJSONBatchModel>StorageLocation}" }),
                                                new sap.m.Text({ text: "{oJSONBatchModel>MatlWrhsStkQtyInMatlBaseUnit}" })
                                            ]
                                        }),
                                        events: {
                                            dataReceived: function () {
                                                oDialog.update();
                                            }
                                        }
                                    });

                                    // Define columns for sap.m.Table (if necessary)
                                    oTable.addColumn(new sap.m.Column({
                                        header: new sap.m.Label({ text: "Batch No" })
                                    }));

                                    oTable.addColumn(new sap.m.Column({
                                        header: new sap.m.Label({ text: "Material" })
                                    }));
                                    oTable.addColumn(new sap.m.Column({
                                        header: new sap.m.Label({ text: "Plant" })
                                    }));
                                    oTable.addColumn(new sap.m.Column({
                                        header: new sap.m.Label({ text: "Storage Location" })
                                    }));

                                    oTable.addColumn(new sap.m.Column({
                                        header: new sap.m.Label({ text: "Unrestricted Use" })
                                    }));


                                }

                                oDialog.update();
                                sap.ui.core.BusyIndicator.hide();
                            });

                            oDialog.open();
                            sap.ui.core.BusyIndicator.hide();
                        });
                    }
                    fetchData(0);
                }
                // Start fetching data from the beginning


                //   sap.m.MessageBox.error("Please check Company Code / Fiscal Year");


            },


            onValueHelpOkPressBatch: function (oEvent) {



                var aTokens = oEvent.getParameter("tokens");
                console.log("aTokens:", aTokens)
                let text = aTokens[0].getKey();
                var text2 = aTokens[0].mProperties.text
                    const result = text2.split(' ')[0];
                    console.log(result); 
                this.SelectInputType = 'fragment'
                this.spath.setValue(text);
                this.storagepath.setText(result);
                this._oVHD.close();


            },

            onValueHelpCancelPressBatch: function () {
                this._oVHD.close();
            },

            onValueHelpCancelPressBatch: function () {
                this._oVHD.destroy();
            },

            onFilterBarSearchBatch: function (oEvent) {
                var sSearchQuery = this._oBasicSearchField.getValue(),
                    aSelectionSet = oEvent.getParameter("selectionSet");

                var aFilters = aSelectionSet && aSelectionSet.reduce(function (aResult, oControl) {
                    if (oControl.getValue()) {
                        aResult.push(new sap.ui.model.Filter({
                            path: oControl.getName(),
                            operator: FilterOperator.Contains,
                            value1: oControl.getValue()
                        }));
                    }

                    return aResult;
                }, []);

                aFilters.push(new sap.ui.model.Filter({
                    filters: [
                        new sap.ui.model.Filter({ path: "Batch", operator: sap.ui.model.FilterOperator.Contains, value1: sSearchQuery })

                    ],
                    and: false
                }));

                this._filterTable(new sap.ui.model.Filter({
                    filters: aFilters,
                    and: true
                }));
            },

            _filterTable: function (oFilter) {
                var oVHD = this._oVHD;

                oVHD.getTableAsync().then(function (oTable) {
                    if (oTable.bindRows) {
                        oTable.getBinding("rows").filter(oFilter);
                    }
                    if (oTable.bindItems) {
                        oTable.getBinding("items").filter(oFilter);
                    }

                    // This method must be called after binding update of the table.
                    oVHD.update();
                });
            }



        });
    }
);