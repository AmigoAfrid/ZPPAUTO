sap.ui.define(
    [
        "zautodesignapp/controller/acm/transaction/acmbasecontroller",
        "sap/ui/core/mvc/Controller",
        "sap/ui/core/IconPool",
        "sap/ui/model/json/JSONModel",
        "sap/ui/core/Component",
        "sap/ui/core/UIComponent",
        "sap/m/routing/Router",
        "zautodesignapp/util/jspdf/html2canvasmin",
        "zautodesignapp/util/jspdf/jspdfmin",
        // "sap/base/util/UUID"
    ],
    function (BaseController, IconPool, JSONModel, UIComponent, Component, Router, UUID) {
        "use strict";

        return BaseController.extend("zautodesignapp.controller.acm.transaction.acm_selectrange", {

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

            onDateOrShiftChange: function (oEvent) {
                var oSource = oEvent.getSource();
                var oContext = oSource.getBindingContext("TabItemModel");

                if (!oContext) return;

                var oChangedRow = oContext.getObject();
                var oModel = oContext.getModel(); // TabItemModel
                var aRows = oModel.getProperty("/Datatabitem");

                var oShiftModel = this.getView().getModel("shiftmodel");
                let dATAAA = oShiftModel.getProperty("/shfitsample")

                var sChangedShift = oChangedRow.shift;
                var oChangedDate = new Date(oChangedRow.zdate);

                if (!sChangedShift || isNaN(oChangedDate)) return;

                // Get the local date in the YYYY-MM-DD format (without time zone conversion)
                var sCompareDate = oChangedDate.toLocaleDateString('en-CA'); // 'en-CA' format returns YYYY-MM-DD

                var iCurrentIndex = aRows.indexOf(oChangedRow);
                var bDuplicateFound = false;

                // Debugging
                console.log("Changed Row:", oChangedRow);
                console.log("Checking for duplicates: Date =", sCompareDate, ", Shift =", sChangedShift);

                aRows.forEach(function (row, index) {
                    if (index === iCurrentIndex) return;

                    if (row.zdate && row.shift) {
                        var oDate = new Date(row.zdate);
                        if (isNaN(oDate)) return;

                        // Get the local date of the row to compare
                        var sDate = oDate.toLocaleDateString('en-CA'); // 'en-CA' format returns YYYY-MM-DD

                        if (sDate === sCompareDate && row.shift === sChangedShift) {
                            bDuplicateFound = true;
                        }
                    }
                });

                if (bDuplicateFound) {
                    // Reset the values
                    oModel.setProperty(oContext.getPath() + "/zdate", null);
                    oModel.setProperty(oContext.getPath() + "/shift", "");
                    oModel.refresh(true);

                    sap.m.MessageBox.warning(
                        "This Date and Shift combination already exists. Please choose a different one."
                    );

                    dATAAA.refresh()
                }
            },

            onButtonPress: function (oEvent) {
                var sSelectedMachineNo = oEvent.getSource().getText();

                var sUpdatedMachineNo = "ACM" + sSelectedMachineNo;
                if (this.acmModel) {
                    this.acmModel.setProperty("/HeaderData/0/selectedMachine", sUpdatedMachineNo); // Update model property
                } else {
                    console.error("acmModel not found.");
                }

                // Close the dialog
                this.ChFrag.close();
            },

            OnTableItemAdd: function () {
                // sap.ui.core.BusyIndicator.show();
                var oModel = this.getView().getModel("TabItemModel");
                var tabledata = oModel.getProperty("/Datatabitem");

                // Validation: All rows must have required fields filled
                var isValid = tabledata.every(function (row) {
                    return row.zdate && row.shift && row.operatorname && Number(row.dipscurrent) > 0;
                });

                if (!isValid) {
                    sap.m.MessageBox.warning("Please fill all mandatory fields (Date, Shift, Dips Cur > 0, Operator Name) before adding a new row.");
                    sap.ui.core.BusyIndicator.hide();
                    return;
                }

                // Validation: Check if the status is 'open' after the first validation passes
                var isStatusOpen = tabledata.every(function (row) {
                    return row.status === 'open';
                });

                if (!isStatusOpen) {
                    sap.m.MessageBox.warning("Please save the current row...");
                    sap.ui.core.BusyIndicator.hide();
                    return;
                }



                // Default data structure for new row
                var datas = {
                    zdate: "",
                    shift: "",
                    balanceqty: "0.00",
                    dipsuptoprevious: "0.000",
                    dipscurrent: "0.00",
                    cumulative: "0.00",
                    cummulativeinlaksh: "0.00",
                    dipsqtylakh: "0.00",
                    capcutqty: "0.00",
                    bodycutqty: "0.00",
                    capcakeqty: "0.00",
                    bodycakeqty: "0.00",
                    hfx: "0.00",
                    wastage: "0.00",
                    floorwastage: "0.00",
                    operatorname: "",
                    materialdocumentno: "",
                    materialdocumnetyear: "",
                    itemstatus: "",
                    dip0001: ""
                };

                // Push new row and update model
                tabledata.push(datas);
                oModel.setProperty("/Datatabitem", tabledata);
                //oModel.refresh();

                setTimeout(() => {
                    oModel.refresh();
                    sap.ui.core.BusyIndicator.hide();
                }, 100);

                sap.ui.core.BusyIndicator.hide();
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

                this.rowdatamodel = new sap.ui.model.json.JSONModel({
                    itemdatas: this.selectedData
                });
                this.getView().setModel(this.rowdatamodel, "rowdatamodel");

                console.log("Updated JSON Model:", this.rowdatamodel);

            },

            // onCheckBoxSelect: function (oEvent) {
            //     const input = oEvent.getSource(); // the Input field
            //     const context = input.getBindingContext("TabItemModel");
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

            //         let c = this.getView().getModel("TabItemModel");
            //         let cdatas = c.getProperty("/Datatabitem/" + rowindex);
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




            // OnRowDelete: function (oEvent) {
            //     var del = this.selectedData; // selected rows
            //     var oModel = this.getView().getModel("TabItemModel"); // local JSON model
            //     var aData = oModel.getProperty("/Datatabitem"); // local array
            //     var oODataModel = this.getView().getModel("ZSB_AU_ACM_ITEM"); // backend OData model
            //     var Dipsmodel = this.getView().getModel("ZAU_ACM_SAVE_DIPS_SRVB"); // backend OData model
            //     var Dipsmodel2 = this.getView().getModel("ZAU_ACM_SAVE_DIPS_DATA_SB"); // backend OData model
            //     var Dipsmodel3 = this.getView().getModel("ZAU_ACM_DOWNTIME_SRVB"); // backend OData model

            //     // Loop through local data
            //     for (var i = aData.length - 1; i >= 0; i--) {
            //         for (var j = 0; j < del.length; j++) {
            //             if (aData[i] === del[j]) {

            //                 // 🔹 Check if entry has backend key (example: id field)
            //                 if (aData[i].id) {
            //                     var sPath = "/ZC_AU_ACM_ITEM('" + aData[i].id + "')";
            //                     oODataModel.remove(sPath, {
            //                         success: function () {
            //                             // Update after successful deletion from backend
            //                             sap.m.MessageToast.show("Deleted from backend successfully");
            //                         },
            //                         error: function (oError) {
            //                             sap.m.MessageToast.show("Error while deleting from backend");
            //                         }
            //                     });

            //                     var path = "/ZC_ACM_UPDATE_DIPS('" + aData[i].sapUuid + "')";
            //                     Dipsmodel.remove(path, {
            //                         success: function () {
            //                             sap.m.MessageToast.show("Dips data deleted");
            //                         },
            //                         error: function (oError) {
            //                             sap.m.MessageToast.show("Error while deleting dips");
            //                         }
            //                     });

            //                     var path2 = "/ZC_DIPS_DATA('" + aData[i].sapUuid + "')";
            //                     Dipsmodel2.remove(path2, {
            //                         success: function () {
            //                             sap.m.MessageToast.show("Dips data deleted");
            //                         },
            //                         error: function (oError) {
            //                             sap.m.MessageToast.show("Error while deleting dips");
            //                         }
            //                     });

            //                     var path3 = "/ZC_DOWNTIME('" + aData[i].sapUuid + "')";
            //                     Dipsmodel3.remove(path3, {
            //                         success: function () {
            //                             sap.m.MessageToast.show("Dips data deleted");
            //                         },
            //                         error: function (oError) {
            //                             sap.m.MessageToast.show("Error while deleting dips");
            //                         }
            //                     });
            //                 }

            //                 // 🔹 Remove from local model
            //                 aData.splice(i, 1);
            //                 this.count = this.count - 1;
            //             }
            //         }
            //     }

            //     // Update the local model after deletion
            //     oModel.setProperty("/Datatabitem", aData);
            //     oModel.refresh(true); // Refresh model to reflect the changes

            //     // Ensure no empty or outdated data is sent
            //     this._saveData(); // If needed, implement a function to save updated data
            // },

            // // Function to handle saving the current data after deletion
            // _saveData: function() {
            //     var oModel = this.getView().getModel("TabItemModel");
            //     var aData = oModel.getProperty("/Datatabitem");

            //     // Check if there's any data to save
            //     if (aData.length === 0) {
            //         sap.m.MessageToast.show("No data to save.");
            //         return;
            //     }

            //     // Save data to the backend (or whatever the intended logic is)
            //     var oODataModel = this.getView().getModel("ZSB_AU_ACM_ITEM");
            //     var sPath = "/ZC_AU_ACM_ITEM"; // Example path, replace with actual path

            //     // For each item in aData, you may need to update or create it
            //     for (var i = 0; i < aData.length; i++) {
            //         var oData = aData[i]; // The current item to save
            //         // Assuming oData has fields you want to update/create
            //         oODataModel.create(sPath, oData, {
            //             success: function () {
            //                 sap.m.MessageToast.show("Data saved successfully.");
            //             },
            //             error: function (oError) {
            //                 sap.m.MessageToast.show("Error while saving data.");
            //             }
            //         });
            //     }
            // },


            onCheckBoxSelect: function (oEvent) {
                const input = oEvent.getSource();
                const context = input.getBindingContext("TabItemModel");

                this.selectedData = [];

                if (context) {
                    const rowPath = context.getPath(); // e.g., "/Datatabitem/2"
                    const rowIndex = parseInt(rowPath.split("/")[2], 10);

                    const oModel = this.getView().getModel("TabItemModel");
                    const rowData = oModel.getProperty(`/Datatabitem/${rowIndex}`);

                    this.selectedData.push(rowData);

                    this.rowdatamodel = new sap.ui.model.json.JSONModel({
                        itemdatas: rowData
                    });

                    this.getView().setModel(this.rowdatamodel, "rowdatamodel");

                    console.log("Selected row index:", rowIndex);
                    console.log("Updated JSON Model:", this.rowdatamodel);
                } else {
                    console.log("No binding context found.");
                }
            },


            OnRowDelete: function (oEvent) {
                var del = this.selectedData; // selected rows
                var oModel = this.getView().getModel("TabItemModel"); // local JSON model
                var aData = oModel.getProperty("/Datatabitem"); // local array
                var oODataModel = this.getView().getModel("ZSB_AU_ACM_ITEM"); // backend OData model
                var Dipsmodel = this.getView().getModel("ZAU_ACM_SAVE_DIPS_SRVB"); // backend OData model
                var Dipsmodel2 = this.getView().getModel("ZAU_ACM_SAVE_DIPS_DATA_SB"); // backend OData model
                var Dipsmodel3 = this.getView().getModel("ZAU_ACM_DOWNTIME_SRVB"); // backend OData model

                // Loop through local data
                for (var i = aData.length - 1; i >= 0; i--) {
                    for (var j = 0; j < del.length; j++) {
                        if (aData[i] === del[j]) {

                            // 🔹 Check if entry has backend key (example: id field)
                            if (aData[i].id) {
                                var sPath = "/ZC_AU_ACM_ITEM('" + aData[i].id + "')";

                                oODataModel.remove(sPath, {
                                    success: function () {
                                        //  sap.m.MessageToast.show("Deleted from backend successfully");
                                    },
                                    error: function (oError) {
                                        //  sap.m.MessageToast.show("Error while deleting from backend");
                                    }
                                });





                                var path = "/ZC_ACM_UPDATE_DIPS('" + aData[i].sapUuid + "')";

                                Dipsmodel.remove(path, {
                                    success: function () {
                                        //  sap.m.MessageToast.show("Dips data deleted");
                                    },
                                    error: function (oError) {
                                        //  sap.m.MessageToast.show("Error while deleting dips");
                                    }
                                });

                                var path2 = "/ZC_DIPS_DATA('" + aData[i].sapUuid + "')";


                                Dipsmodel2.remove(path2, {
                                    success: function () {
                                        //  sap.m.MessageToast.show("Dips data deleted");
                                    },
                                    error: function (oError) {
                                        // sap.m.MessageToast.show("Error while deleting dips");
                                    }
                                });



                                var path3 = "/ZC_DOWNTIME('" + aData[i].sapUuid + "')";


                                Dipsmodel3.remove(path3, {
                                    success: function () {
                                        //sap.m.MessageToast.show("Dips data deleted");
                                    },
                                    error: function (oError) {
                                        //sap.m.MessageToast.show("Error while deleting dips");
                                    }
                                });



                            }

                            // 🔹 Remove from local model
                            aData.splice(i, 1);
                            this.count = this.count - 1;
                        }
                    }
                }

                // Update local model
                oModel.setProperty("/Datatabitem", aData);
                oModel.refresh(true);
            },


            // Table item dips currency 
            onchangedipscur: function (oEvent) {
                // Show the BusyIndicator at the start
                sap.ui.core.BusyIndicator.show();

                try {
                    const input = oEvent.getSource(); // the Input field
                    const context = input.getBindingContext("TabItemModel");
                    let getHeaderData = this.screen2headermodel.getProperty("/HEADERDATA/");
                    let OrderQtyLakh = parseFloat(getHeaderData.QtytoMfdLakhs);

                    if (context) {
                        const rowPath = context.getPath();
                        const rowData = context.getObject();
                        let getdipcurr = rowData.dipscurrent.trim() !== "" ? parseFloat(rowData.dipscurrent) : 0.00;
                        let cumulative = rowData.cumulative.trim() !== "" ? parseFloat(rowData.cumulative) : 0.00;
                        let dipsqtylakh = rowData.dipsqtylakh.trim() !== "" ? parseFloat(rowData.dipsqtylakh) : 0.00;

                        // Split the row index value
                        let a = rowPath;
                        let b = a.split("/");
                        let rowobject = b[1];
                        let rowindex = parseInt(b[2]);

                        if (rowindex > 0) {
                            let num = rowindex - 1;

                            let c = this.getView().getModel("TabItemModel");
                            let cdatas = c.getProperty("/Datatabitem/" + num);
                            let dispmaster = this.dipsmodelcal.getProperty("/DipsData");
                            // debugger
                            let getdipscummlat = parseFloat(cdatas.cumulative);
                            let aBC = parseFloat(getdipscummlat) + parseFloat(getdipcurr);
                            let cumulativelkh_total = (aBC * dispmaster.qty_dips) / 100000;
                            let dipsshift_val = parseFloat(dispmaster.max_dips)

                            let BalQtyLakhFinal = parseFloat(OrderQtyLakh) - parseFloat(cumulativelkh_total);

                            // if(BalQtyLakhFinal <= "0.00" || BalQtyLakhFinal <=0){

                            // sap.m.MessageBox.show("Balance Quantaty Reached to ZERO");
                            // sap.ui.core.BusyIndicator.hide();
                            //  return;

                            // }


                            let dipsqtylakhtotal = (getdipcurr * dispmaster.qty_dips) / 100000;

                            let getdipcurr_K = parseFloat(getdipcurr)
                            let dipsshift_val_K = parseFloat(dipsshift_val)

                            // Guard clause to avoid processing if dipcurrent is greater than DIPS Master Shift Lakh QTY
                            if (getdipcurr_K > dipsshift_val_K || BalQtyLakhFinal <= "0.00" || BalQtyLakhFinal <= 0) {
                                sap.m.MessageBox.information("Currency value exceeds the shortage in shift quantity...")
                                context.getModel().setProperty(`${rowPath}/dipscurrent`, '0.00');
                                context.getModel().setProperty(`${rowPath}/balanceqty`, '0.00');
                                context.getModel().setProperty(`${rowPath}/dipsuptoprevious`, '0.000');
                                context.getModel().setProperty(`${rowPath}/cummulativeinlaksh`, '0.00');
                                context.getModel().setProperty(`${rowPath}/dipsqtylakh`, '0.00');
                                context.getModel().setProperty(`${rowPath}/capcutqty`, '0.00');
                                context.getModel().setProperty(`${rowPath}/bodycutqty`, '0.00');
                                context.getModel().setProperty(`${rowPath}/capcakeqty`, '0.00');
                                context.getModel().setProperty(`${rowPath}/bodycakeqty`, '0.00');
                                context.getModel().setProperty(`${rowPath}/hfx`, '0.00');
                                context.getModel().setProperty(`${rowPath}/wastage`, '0.00');
                                context.getModel().setProperty(`${rowPath}/floorwastage`, '0.00');
                                return;
                            }


                            // Update the model with new values
                            context.getModel().setProperty(`${rowPath}/dipscurrent`, getdipcurr);
                            context.getModel().setProperty(`${rowPath}/dipsuptoprevious`, getdipcurr.toFixed(3));
                            context.getModel().setProperty(`${rowPath}/cumulative`, aBC.toFixed(3));
                            context.getModel().setProperty(`${rowPath}/cummulativeinlaksh`, cumulativelkh_total.toFixed(2));
                            context.getModel().setProperty(`${rowPath}/dipsqtylakh`, dipsqtylakhtotal.toFixed(2));
                            context.getModel().setProperty(`${rowPath}/balanceqty`, BalQtyLakhFinal.toFixed(3));

                        } else {
                            let c = this.getView().getModel("TabItemModel");
                            let cdatas = c.getProperty("/Datatabitem/" + rowindex);
                            let dispmaster = this.dipsmodelcal.getProperty("/DipsData");

                            let getdipscummlat = parseFloat(cdatas.cumulative);
                            let aBC = parseFloat(getdipcurr);
                            let cumulativelkh_total = (aBC * dispmaster.qty_dips) / 100000;

                            let BalQtyLakhFinal = parseFloat(OrderQtyLakh) - parseFloat(cumulativelkh_total);
                            let dipsqtylakhtotal = (getdipcurr * dispmaster.qty_dips) / 100000;

                            // // Guard clause to avoid processing if dipcurrent is greater than OrderQtyLakh
                            // if (getdipcurr > OrderQtyLakh) {
                            //     sap.m.MessageBox.information("Please enter valid value...")
                            //     context.getModel().setProperty(`${rowPath}/dipscurrent`, '0.000');
                            //     return;
                            // }

                            let dipsshift_val = parseFloat(dispmaster.max_dips)

                            let getdipcurr_K = parseFloat(getdipcurr)
                            let dipsshift_val_K = parseFloat(dipsshift_val)


                            // Guard clause to avoid processing if dipcurrent is greater than DIPS Master Shift Lakh QTY
                            if (getdipcurr_K > dipsshift_val_K) {
                                sap.m.MessageBox.information("Currency value exceeds the shortage in shift quantity...")
                                context.getModel().setProperty(`${rowPath}/dipscurrent`, '0.00');
                                context.getModel().setProperty(`${rowPath}/balanceqty`, '0.00');
                                context.getModel().setProperty(`${rowPath}/dipsuptoprevious`, '0.000');
                                context.getModel().setProperty(`${rowPath}/cummulativeinlaksh`, '0.00');
                                context.getModel().setProperty(`${rowPath}/cumulative`, '0.00');
                                context.getModel().setProperty(`${rowPath}/dipsqtylakh`, '0.00');
                                context.getModel().setProperty(`${rowPath}/capcutqty`, '0.00');
                                context.getModel().setProperty(`${rowPath}/bodycutqty`, '0.00');
                                context.getModel().setProperty(`${rowPath}/capcakeqty`, '0.00');
                                context.getModel().setProperty(`${rowPath}/bodycakeqty`, '0.00');
                                context.getModel().setProperty(`${rowPath}/hfx`, '0.00');
                                context.getModel().setProperty(`${rowPath}/wastage`, '0.00');
                                context.getModel().setProperty(`${rowPath}/floorwastage`, '0.00');
                                return;
                            }

                            // Update the model with new values
                            context.getModel().setProperty(`${rowPath}/dipscurrent`, getdipcurr);
                            context.getModel().setProperty(`${rowPath}/dipsuptoprevious`, getdipcurr.toFixed(3));
                            context.getModel().setProperty(`${rowPath}/cumulative`, aBC.toFixed(3));
                            context.getModel().setProperty(`${rowPath}/cummulativeinlaksh`, cumulativelkh_total.toFixed(2));
                            context.getModel().setProperty(`${rowPath}/dipsqtylakh`, dipsqtylakhtotal.toFixed(2));
                            context.getModel().setProperty(`${rowPath}/balanceqty`, BalQtyLakhFinal.toFixed(3));
                        }

                    } else {
                        console.log("No binding context found.");
                    }
                } catch (error) {
                    console.error("Error occurred during onchangedipscur:", error);
                } finally {
                    // Hide the BusyIndicator in finally block
                    sap.ui.core.BusyIndicator.hide();
                }
            },


            onRowSelectedtab: function (oEvent) {
                const table = oEvent.getSource();
                const selectedIndices = table.getSelectedIndices(); // Get all selected row indices

                this.selectedDatas = [];
                var that = this;
                selectedIndices.forEach(function (index) {
                    const context = table.getContextByIndex(index);
                    if (context) {
                        const data = context.getObject();
                        that.selectedDatas.push(data);
                    }
                });

                console.log("Selected Rows Data:", this.selectedDatas);


            },

            onSubmitacm01screen: function () {

                // var oUUID = new UUID();                 // Create UUID instance
                // var sUUID = oUUID.valueOf();            // Get UUID string
                // console.log("Generated UUID:", sUUID);

                sap.ui.core.BusyIndicator.show();
                console.log("this.SelectScreen1Data:", this.SelectScreen1Data)
                let Screen1SelectHeaderdata = this.SelectScreen1Data;

                var that = this; // Preserve the reference to the controller
                var oFilter11 = new sap.ui.model.Filter("screencode", sap.ui.model.FilterOperator.EQ, "AU200");
                var CountoModel = this.getView().getModel("ZSB_AU_ACM_HEADER");
                var oFilters11 = [oFilter11];
                if (CountoModel) {

                    let getHeaderData = this.screen2headermodel.getProperty("/HEADERDATA/");



                    this.getView().getModel("ZSB_AU_ACM_HEADER").read("/ZC_AU_ACM_HEADER/$count", {
                        /* Decalure Globally in the Create table Serial Number */
                        filters: [oFilters11],
                        success: $.proxy(async function (oEvent, oResponse) {
                            let Count = Number(oResponse.body) + 1; // This should be a number, no need to use Number()
                            let CountLen = Count.toString(); // Convert to string to get its length
                            let AddData = "20";
                            let Data = 8 - CountLen.length;
                            let CountArray = "";
                            for (let i = 0; i < Data; i++) {
                                CountArray += "0";
                            }
                            console.log(AddData + CountArray + Count); // Concatenate strings correctly


                            let LastId = AddData + CountArray + Count;

                            function generateUniqueId(prefix) {
                                const d = new Date();
                                return `${d.getFullYear()}${(d.getMonth() + 1)
                                    .toString().padStart(2, "0")}${d.getDate()
                                        .toString().padStart(2, "0")}${d.getHours()
                                            .toString().padStart(2, "0")}${d.getMinutes()
                                                .toString().padStart(2, "0")}${d.getSeconds()
                                                    .toString().padStart(2, "0")}${d.getMilliseconds()
                                                        .toString().padStart(3, "0")}`;
                            }
                            var sap_uuid = generateUniqueId();
                            // let LastId = getHeaderData.id;


                            // let oComponentFragDatas = await that.ToComponentFragOpen(LastId);
                            let oPostDatas = await that.ToSaveFunc(sap_uuid);
                            console.log("Success");
                            console.log("oPostDatas:", oPostDatas)

                            sap.m.MessageBox.success("Data saved internally...")

                            // that.FinalStatus = new sap.ui.model.json.JSONModel({
                            //     MSGSTRIP: {
                            //         "visible": true,
                            //         "text": "ACM Document No " + LastId,
                            //         "type": 'Success'
                            //     }
                            // });
                            // that.getView().setModel(that.FinalStatus, "FinalStatus")

                            var oModelGetItem = that.getView().getModel("ZSB_AU_ACM_ITEM"); // ZC_AU_ACM_ITEM

                            let oFilterProcessOrder = new sap.ui.model.Filter("processorder", sap.ui.model.FilterOperator.EQ, "00" + Screen1SelectHeaderdata.ProcessOrder);
                            let oFilterBatch = new sap.ui.model.Filter("batch", sap.ui.model.FilterOperator.EQ, Screen1SelectHeaderdata.Batch);
                            // let oFilterAcmno = new sap.ui.model.Filter("acmno", sap.ui.model.FilterOperator.EQ, selectedData.ACMNO);
                            let GetInternalTabDatasItems = await that.ToCheckProcOrderInInternallyItem(oFilterProcessOrder, oFilterBatch, oModelGetItem);

                            that.TabItemModel = new sap.ui.model.json.JSONModel({
                                Datatabitem: GetInternalTabDatasItems.results
                            });

                            // Set the model to the view
                            that.getView().setModel(this.TabItemModel, "TabItemModel");
                            let ojsonmodelitem = this.getView().getModel("TabItemModel");
                            let property01 = ojsonmodelitem.getProperty("/Datatabitem");
                            let getHeaderData = this.screen2headermodel.getProperty("/HEADERDATA/");
                            let OrderQtyLakh = parseFloat(getHeaderData.QtytoMfdLakhs);
                            let dispmaster = this.dipsmodelcal.getProperty("/DipsData");

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
                                    let dipsqtylakh = (dipsuptoprevious * dispmaster.qty_dips) / 100000;
                                    let balqty = parseFloat(OrderQtyLakh) - parseFloat(cuminlak)
                                    console.log("dipscum", dipscum);
                                    property01[index].abacd = dipscum;
                                    property01[index].cumulative = dipscum.toFixed(2);
                                    property01[index].dipsqtylakh = dipsqtylakh.toFixed(2);
                                    property01[index].cummulativeinlaksh = cuminlak.toFixed(2);
                                    property01[index].balanceqty = balqty.toFixed(3);



                                });

                                console.log("ojsonmodelitem", ojsonmodelitem);

                            }
                            that.TabItemModel.refresh()

                            that.rowdatamodel = new sap.ui.model.json.JSONModel({
                                itemdatas: []
                            });
                            that.getView().setModel(that.rowdatamodel, "rowdatamodel");

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
                    let getItemData = this.TabItemModel.getProperty("/Datatabitem/");
                    let oModelITEMS = this.getView().getModel("ZSB_AU_ACM_ITEM");
                    var that = this;
                    var currentYear = new Date().getFullYear();

                    let rowData = this.rowdatamodel.getProperty("/itemdatas");
                    console.log("rowData:", rowData)

                    if (!rowData || rowData.length === 0) {
                        sap.m.MessageBox.warning("Please select a row before submitting the data.", {
                            onClose: function () {
                                reject("No row selected"); // Reject after user sees the warning
                            }
                        });
                        sap.ui.core.BusyIndicator.hide();
                        return;
                    }

                    if (rowData.zdate === "" || rowData.shift === "" || rowData.operatorname === "" || isNaN(Number(rowData.dipscurrent)) || Number(rowData.dipscurrent) <= 0) {
                        sap.m.MessageBox.warning("Please fill all mandatory fields (Date, Shift, Dips Cur > 0, Operator Name).");
                        sap.ui.core.BusyIndicator.hide();
                        return;
                    }

                    if (rowData.shift === "C") {

                        if (rowData.floorwastage === "" || rowData.floorwastage === 0 || rowData.floorwastage === "0.00") {

                            sap.m.MessageBox.error("Please enter a valid C Shift floor wastage");
                            sap.ui.core.BusyIndicator.hide();
                            return;

                        }

                    }

                    sap.ui.core.BusyIndicator.hide();
                    sap.m.MessageBox.warning("Do you want to submit this data.", {
                        actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
                        emphasizedAction: sap.m.MessageBox.Action.YES,
                        onClose: async function (sAction) {
                            if (sAction === "YES") {
                                sap.ui.core.BusyIndicator.show();

                                // ************** Start For Item Level Posting *********************
                                const postItemLevel = new Promise((resolve, reject) => {

                                    let ItemPOST = {
                                        sapUuid: currentYear + GetId,
                                        id: GetId,
                                        processorder: getHeaderData.ProcessOrder,
                                        acmno: getHeaderData.ACMNO,
                                        batch: getHeaderData.Batch,
                                        zdate: rowData.zdate ? new Date(rowData.zdate.toLocaleDateString('en-CA')) : null,
                                        shift: rowData.shift,
                                        balanceqty: parseFloat(rowData.balanceqty).toFixed(3),
                                        uom: "",
                                        dipsuptoprevious: parseFloat(rowData.dipsuptoprevious).toFixed(3),
                                        dipscurrent: parseFloat(rowData.dipscurrent).toFixed(3),
                                        cumulative: parseFloat(rowData.cumulative).toFixed(2),
                                        cummulativeinlaksh: parseFloat(rowData.cummulativeinlaksh).toFixed(2),
                                        dipsqtylakh: parseFloat(rowData.dipsqtylakh).toFixed(2),
                                        hfxqtyshift: null,
                                        capcutqty: parseFloat(rowData.capcutqty).toFixed(2),
                                        bodycutqty: parseFloat(rowData.bodycutqty).toFixed(2),
                                        bodycakeqty: parseFloat(rowData.bodycakeqty).toFixed(2),
                                        capcakeqty: parseFloat(rowData.capcakeqty).toFixed(2),
                                        hfx: parseFloat(rowData.hfx).toFixed(2),
                                        wastage: parseFloat(rowData.wastage).toFixed(2),
                                        floorwastage: parseFloat(rowData.floorwastage).toFixed(2),
                                        materialdocumentno: rowData.materialdocumentno,
                                        materialdocumentyear: rowData.materialdocumnetyear,
                                        operatorname: rowData.operatorname,
                                        status: "open",
                                        itemstatus: "open",
                                        screencode: "AU200",
                                        createdby: that.TENTUSERID,
                                        createdat: new Date(),
                                        updatedat: new Date(),
                                        updatedby: that.TENTUSERID,
                                        plant: getHeaderData.plant,


                                    }

                                    console.log("ItemPOST:", ItemPOST);

                                    oModelITEMS.create("/ZC_AU_ACM_ITEM", ItemPOST, {
                                        success: function (oData, oResponse) {
                                            console.log("ZC_AU_ACM_ITEM;", oData);
                                            // sap.ui.core.BusyIndicator.hide();
                                            resolve(oData)
                                        },
                                        error: function (oError) {
                                            console.error("Error creating data ZC_AU_ACM_ITEM:", oError);
                                            sap.ui.core.BusyIndicator.hide();
                                            reject(oError)
                                        }
                                    });


                                });
                                // ************** End For Item Level Posting *********************

                                // ************** Start For Header ID Level Posting *********************
                                const postIDTableLevel = new Promise((resolve, reject) => {

                                    var oEntry = {

                                        sapUuid: currentYear + GetId,
                                        id: GetId,
                                        acmno: getHeaderData.ACMNO,
                                        processorder: getHeaderData.ProcessOrder,
                                        batch: getHeaderData.Batch,
                                        bodycolor: getHeaderData.BodyColor,
                                        capcolor: getHeaderData.CapColor,
                                        qtymfdlak: getHeaderData.QtytoMfdLakhs,
                                        qtymfddip: getHeaderData.QtytoMfdDips,
                                        material: getHeaderData.Product,
                                        description: getHeaderData.ProductDescription,
                                        zsize: getHeaderData.Zsize,
                                        acmseed: getHeaderData.Speed,
                                        startdate: getHeaderData.CreationDate,
                                        noofbar: getHeaderData.bar,
                                        starttime: getHeaderData.currentTime,
                                        status: "",
                                        headerstatus: "",
                                        screencode: "AU200",
                                        createdat: new Date(),
                                        createdby: that.TENTUSERID,
                                        updatedat: new Date(),
                                        updatedby: "",
                                        plant: getHeaderData.plant,

                                    };
                                    console.log("oEntryoEntry:", oEntry);

                                    that.getView().setModel();

                                    var oModelGet = that.getView().getModel("ZSB_AU_ACM_HEADER");

                                    oModelGet.create("/ZC_AU_ACM_HEADER", oEntry, {
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

                                // // / ************** End For Header ID Level Posting *********************
                                const posttableitemTableLevel = new Promise((resolve, reject) => {

                                    var oEntrys = {
                                        sap_uuid: currentYear + GetId,
                                        processorder: getHeaderData.ProcessOrder,
                                        acmno: getHeaderData.ACMNO.padStart(2, "0"),
                                        zdate: rowData.zdate ? new Date(rowData.zdate.toLocaleDateString('en-CA')) : null,
                                        shift: rowData.shift,
                                        batch: getHeaderData.Batch,
                                        dips_qty_lakh: rowData.dipsqtylakh ? (rowData.dipsqtylakh) : '0.00',
                                        cap_cut_qty: rowData.capcutqty ? (rowData.capcutqty) : '0.00',
                                        body_cut_qty: rowData.bodycutqty ? (rowData.bodycutqty) : '0.00',
                                        cap_cake_qty: rowData.capcakeqty ? (rowData.capcakeqty) : '0.00',
                                        body_cake_qty: rowData.bodycakeqty ? (rowData.bodycakeqty) : '0.00',
                                        hfx: rowData.hfx ? (rowData.hfx) : '0.00',
                                        wastage: rowData.wastage ? (rowData.wastage) : '0.00',
                                        floor_wastage: rowData.floorwastage ? (rowData.floorwastage) : '0.00',
                                        operator: rowData.operatorname,
                                        material: "",
                                        materialdescription: "",
                                        quantity: "0.00",
                                        base_unit: "",
                                        plant: "",
                                        storage_location: "",
                                        movement_type: "",
                                        vendor: "",
                                        bom_item: "",
                                        bom_item_number: ""


                                    };
                                    console.log("updatedips:", oEntrys);

                                    that.getView().setModel();

                                    var oModelGet = that.getView().getModel("ZAU_ACM_SAVE_DIPS_SRVB");

                                    oModelGet.create("/ZC_ACM_UPDATE_DIPS", oEntrys, {
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

                                // // / ************** End For Header ID Level acm dips update Posting *********************
                                const postacmcalTableupdatedipsLevel = new Promise((resolve, reject) => {

                                })
                                var oEntryslist = {
                                    sap_uuid: currentYear + GetId,
                                    processorder: getHeaderData.ProcessOrder,
                                    zdate: rowData.zdate ? new Date(rowData.zdate.toLocaleDateString('en-CA')) : null,
                                    shift: rowData.shift,
                                    batch: getHeaderData.Batch,
                                    balance_qty: rowData.balanceqty ? (rowData.balanceqty) : '0.000',
                                    pre_dips: rowData.dipsuptoprevious ? (rowData.dipsuptoprevious) : '0.000',
                                    cur_dips: parseFloat(rowData.dipscurrent).toFixed(3) ? parseFloat(rowData.dipscurrent).toFixed(3) : '0.000',
                                    cumm_dips: rowData.cumulative ? (rowData.cumulative) : '0.00',
                                    cum_qty_lakh: rowData.dipsqtylakh ? parseFloat(rowData.dipsqtylakh).toFixed(2) : '0.00',
                                    hfx_qty: rowData.hfx ? (rowData.hfx) : '0.00',
                                    hfx_cum: "0.000",
                                    scp_qty: "0.000",
                                    scp_qum: "0.000",
                                    cap_cut_qty: rowData.capcutqty ? (rowData.capcutqty) : '0.00',
                                    body_cut_qty: rowData.bodycutqty ? (rowData.bodycutqty) : '0.00',
                                    cap_cake_qty: rowData.capcakeqty ? (rowData.capcakeqty) : '0.00',
                                    body_cake_qty: rowData.bodycakeqty ? (rowData.bodycakeqty) : '0.00',
                                    floor_scrap_qty: rowData.floorwastage ? (rowData.floorwastage) : '0.00',
                                    zhfx: rowData.hfx ? (rowData.hfx) : '0.00',
                                    zwastage: rowData.wastage ? (rowData.wastage) : '0.00',
                                    zfloor: rowData.floorwastage ? (rowData.floorwastage) : '0.00',
                                    zoperator: rowData.operatorname,
                                    zmblnr1: "",
                                    zmblnr2: "",
                                    zmjahr1: "",
                                    zmjahr2: "",
                                    acmno: getHeaderData.ACMNO.padStart(2, "0"),


                                };
                                console.log("updatedipsdata:", oEntryslist);

                                that.getView().setModel();
                                var oModelGetdips = that.getView().getModel("ZAU_ACM_SAVE_DIPS_DATA_SB");

                                oModelGetdips.create("/ZC_DIPS_DATA", oEntryslist, {
                                    success: function (oData, oResponse) {

                                        console.log(oData);
                                        console.log("saved")
                                        oModelGetdips.refresh(true);
                                        // sap.ui.core.BusyIndicator.hide();
                                        resolve(oData);
                                    },

                                    error: function (error) {
                                        console.log("error");
                                        sap.ui.core.BusyIndicator.hide();
                                        reject(error)
                                    }
                                });

                                // });

                                await Promise.all([postIDTableLevel, postItemLevel, posttableitemTableLevel, postacmcalTableupdatedipsLevel]);
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












            //with table id get selected indices --- for each 







            //   ToSaveFunc: function (GetId) {

            //     return new Promise((resolve, reject) => {
            //         sap.ui.core.BusyIndicator.show();

            //         let getHeaderData = this.screen2headermodel.getProperty("/HEADERDATA/");
            //         let getItemData = this.TabItemModel.getProperty("/Datatabitem/");
            //         let oModelITEMS = this.getView().getModel("ZSB_AU_ACM_ITEM");
            //         var that = this;
            //         var currentYear = new Date().getFullYear();

            //         var tabledatanew = this.selectedDatas

            //           if (!tabledatanew || tabledatanew.length === 0) {
            //             sap.m.MessageBox.warning("Please select a row before submitting the data.", {
            //                 onClose: function () {
            //                     reject("No row selected"); // Reject after user sees the warning
            //                 }
            //             });
            //             sap.ui.core.BusyIndicator.hide();
            //             return;
            //         }


            //     let rowDataList = tabledatanew;


            // rowDataList.forEach(function (iIndex) {

            //     var oContext = iIndex;

            //     var oDatass = oContext;
            //     console.log("oData:",oDatass) 


            //     that.rowdatamodel = new sap.ui.model.json.JSONModel({
            //             itemdatas: oDatass
            //         });
            //         that.getView().setModel(that.rowdatamodel, "rowdatamodel");


            // });

            //         sap.ui.core.BusyIndicator.hide();



            //          let rowData = this.rowdatamodel.getProperty("/itemdatas");
            //         // console.log("rowData:", oDatas)


            //         if (rowData.zdate === "" || rowData.shift === "" || rowData.operatorname === "" || isNaN(Number(rowData.dipscurrent)) || Number(rowData.dipscurrent) <= 0) {
            //             sap.m.MessageBox.warning("Please fill all mandatory fields (Date, Shift, Dips Cur > 0, Operator Name).");
            //             sap.ui.core.BusyIndicator.hide();
            //             return;
            //         }

            //         if (rowData.shift === "C") {

            //             if (rowData.floorwastage === "" || rowData.floorwastage === 0 || rowData.floorwastage === "0.00") {

            //                 sap.m.MessageBox.error("Please enter a valid C Shift floor wastage");
            //                 sap.ui.core.BusyIndicator.hide();
            //                 return;

            //             }

            //         }

            //         sap.ui.core.BusyIndicator.hide();
            //         sap.m.MessageBox.warning("Do you want to submit this data.", {
            //             actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
            //             emphasizedAction: sap.m.MessageBox.Action.YES,
            //             onClose: async function (sAction) {
            //                 if (sAction === "YES") {
            //                     sap.ui.core.BusyIndicator.show();

            //                     //for each row validation -- if mandatory not there call return show message

            //                     // ************** Start For Item Level Posting *********************
            //                     const postItemLevel = new Promise((resolve, reject) => {


            //                       let itemPostData = [];

            //                             for (let i = 0; i < rowDataList.length; i++) {
            //                                 let rowData = rowDataList[i];
            //                                 let ItemPOST = {
            //                                     sapUuid: currentYear + GetId,
            //                                     id: GetId,
            //                                     processorder: getHeaderData.ProcessOrder,
            //                                     acmno: getHeaderData.ACMNO,
            //                                     batch: getHeaderData.Batch,
            //                                     zdate: rowData.zdate ? new Date(rowData.zdate.toLocaleDateString('en-CA')) : null,
            //                                     shift: rowData.shift,
            //                                     balanceqty: parseFloat(rowData.balanceqty).toFixed(3),
            //                                     uom: "",
            //                                     dipsuptoprevious: parseFloat(rowData.dipsuptoprevious).toFixed(3),
            //                                     dipscurrent: parseFloat(rowData.dipscurrent).toFixed(3),
            //                                     cumulative: parseFloat(rowData.cumulative).toFixed(2),
            //                                     cummulativeinlaksh: parseFloat(rowData.cummulativeinlaksh).toFixed(2),
            //                                     dipsqtylakh: parseFloat(rowData.dipsqtylakh).toFixed(2),
            //                                     hfxqtyshift: null,
            //                                     capcutqty: parseFloat(rowData.capcutqty).toFixed(2),
            //                                     bodycutqty: parseFloat(rowData.bodycutqty).toFixed(2),
            //                                     bodycakeqty: parseFloat(rowData.bodycakeqty).toFixed(2),
            //                                     capcakeqty: parseFloat(rowData.capcakeqty).toFixed(2),
            //                                     hfx: parseFloat(rowData.hfx).toFixed(2),
            //                                     wastage: parseFloat(rowData.wastage).toFixed(2),
            //                                     floorwastage: parseFloat(rowData.floorwastage).toFixed(2),
            //                                     materialdocumentno: rowData.materialdocumentno,
            //                                     materialdocumentyear: rowData.materialdocumnetyear,
            //                                     operatorname: rowData.operatorname,
            //                                     status: "open",
            //                                     itemstatus: "open",
            //                                     screencode: "AU200",
            //                                     createdby: that.TENTUSERID,
            //                                     createdat: new Date(),
            //                                     updatedat: new Date(),
            //                                     updatedby: that.TENTUSERID,
            //                                     plant: getHeaderData.plant,
            //                                 };
            //                         console.log("ItemPOST:", ItemPOST);

            //                              itemPostData.push(ItemPOST);

            //                             }


            //                     oModelITEMS.read("/ZC_AU_ACM_ITEM", {
            //                     filters: [
            //                         new sap.ui.model.Filter("acmno", sap.ui.model.FilterOperator.EQ, getHeaderData.ACMNO),
            //                         new sap.ui.model.Filter("batch", sap.ui.model.FilterOperator.EQ, getHeaderData.Batch)
            //                     ],
            //                     success: function (oData, oResponse) {
            //                         if (oData.results && oData.results.length > 0) {
            //                             // If data exists, update it

            //                             oModelITEMS.update("/ZC_AU_ACM_ITEM(" + oData.results[0].id + ")", ItemPOST, {
            //                                 success: function (oData) {
            //                                     console.log("Item Updated:", oData);
            //                                     resolve(oData);
            //                                 },
            //                                 error: function (error) {
            //                                     reject(error);
            //                                 }
            //                             });

            //                         } else {
            //                             // If data doesn't exist, create new
            //                             oModelITEMS.create("/ZC_AU_ACM_ITEM", ItemPOST, {
            //                                 success: function (oData, oResponse) {
            //                                     console.log("Item Created:", oData);
            //                                     resolve(oData);
            //                                 },
            //                                 error: function (error) {
            //                                     reject(error);
            //                                 }
            //                             });
            //                         }
            //                     },
            //                     error: function (error) {
            //                         reject(error);
            //                     }
            //                 });



            //                     });



            //                     // ************** End For Item Level Posting *********************

            //                     // ************** Start For Header ID Level Posting *********************
            //                     const postIDTableLevel = new Promise((resolve, reject) => {

            //                         var oEntry = {

            //                             sapUuid: currentYear + GetId,
            //                             id: GetId,
            //                             acmno: getHeaderData.ACMNO,
            //                             processorder: getHeaderData.ProcessOrder,
            //                             batch: getHeaderData.Batch,
            //                             bodycolor: getHeaderData.BodyColor,
            //                             capcolor: getHeaderData.CapColor,
            //                             qtymfdlak: getHeaderData.QtytoMfdLakhs,
            //                             qtymfddip: getHeaderData.QtytoMfdDips,
            //                             material: getHeaderData.Product,
            //                             description: getHeaderData.ProductDescription,
            //                             zsize: getHeaderData.Zsize,
            //                             acmseed: getHeaderData.Speed,
            //                             startdate: getHeaderData.CreationDate,
            //                             noofbar: getHeaderData.bar,
            //                             starttime: getHeaderData.currentTime,
            //                             status: "",
            //                             headerstatus: "",
            //                             screencode: "AU200",
            //                             createdat: new Date(),
            //                             createdby: that.TENTUSERID,
            //                             updatedat: new Date(),
            //                             updatedby: "",
            //                             plant: getHeaderData.plant,

            //                         };
            //                         console.log("oEntryoEntry:", oEntry);

            //                         that.getView().setModel();

            //                         var oModelGet = that.getView().getModel("ZSB_AU_ACM_HEADER");

            //                         // oModelGet.create("/ZC_AU_ACM_HEADER", oEntry, {
            //                         //     success: function (oData, oResponse) {

            //                         //         console.log(oData);
            //                         //         console.log("saved")
            //                         //         oModelGet.refresh(true);
            //                         //         // sap.ui.core.BusyIndicator.hide();
            //                         //         resolve(oData);
            //                         //     },

            //                         //     error: function (error) {
            //                         //         console.log("error");
            //                         //         sap.ui.core.BusyIndicator.hide();
            //                         //         reject(error)
            //                         //     }
            //                         // });

            //                     });

            //                     // // / ************** End For Header ID Level Posting *********************
            //                  const posttableitemTableLevel = new Promise((resolve, reject) => {

            //                     let entryData = [];


            //                  const existingEntries = that.getView().getModel("ZAU_ACM_SAVE_DIPS_SRVB").getData();

            //                     for (let i = 0; i < rowDataList.length; i++) {
            //                         let rowData = rowDataList[i];

            //                         var oEntrys = {
            //                             sap_uuid: currentYear + GetId,
            //                             processorder: getHeaderData.ProcessOrder,
            //                             acmno: getHeaderData.ACMNO.padStart(2, "0"),
            //                             zdate: rowData.zdate ? new Date(rowData.zdate.toLocaleDateString('en-CA')) : null,
            //                             shift: rowData.shift,
            //                             batch: getHeaderData.Batch,
            //                             dips_qty_lakh: rowData.dipsqtylakh ? (rowData.dipsqtylakh) : '0.00',
            //                             cap_cut_qty: rowData.capcutqty ? (rowData.capcutqty) : '0.00',
            //                             body_cut_qty: rowData.bodycutqty ? (rowData.bodycutqty) : '0.00',
            //                             cap_cake_qty: rowData.capcakeqty ? (rowData.capcakeqty) : '0.00',
            //                             body_cake_qty: rowData.bodycakeqty ? (rowData.bodycakeqty) : '0.00',
            //                             hfx: rowData.hfx ? (rowData.hfx) : '0.00',
            //                             wastage: rowData.wastage ? (rowData.wastage) : '0.00',
            //                             floor_wastage: rowData.floorwastage ? (rowData.floorwastage) : '0.00',
            //                             operator: rowData.operatorname,
            //                             material: "",
            //                             materialdescription: "",
            //                             quantity: "0.00",
            //                             base_unit: "",
            //                             plant: "",
            //                             storage_location: "",
            //                             movement_type: "",
            //                             vendor: "",
            //                             bom_item: "",
            //                             bom_item_number: ""
            //                         };

            //                         console.log("updatedips:", oEntrys);

            //                         // Check if entry already exists
            //                         let existingEntry = existingEntries.find(entry => entry.sap_uuid === oEntrys.sap_uuid);

            //                         if (existingEntry) {

            //                             oModelGet.update("/ZC_ACM_UPDATE_DIPS", oEntrys, {
            //                                 success: function (oData, oResponse) {
            //                                     console.log("Entry updated successfully");
            //                                     oModelGet.refresh(true);  
            //                                     resolve(oData);
            //                                 },
            //                                 error: function (error) {
            //                                     console.log("Update error", error);
            //                                     reject(error);
            //                                 }
            //                             });




            //                         } else {

            //                             oModelGet.create("/ZC_ACM_UPDATE_DIPS", oEntrys, {
            //                                 success: function (oData, oResponse) {
            //                                     console.log("Entry created successfully");
            //                                     oModelGet.refresh(true);  
            //                                     resolve(oData);
            //                                 },
            //                                 error: function (error) {
            //                                     console.log("Create error", error);
            //                                     reject(error);
            //                                 }
            //                             });


            //                         }

            //                         entryData.push(oEntrys);
            //                     }

            //                     that.getView().setModel();

            //                 });


            //                     // // / ************** End For Header ID Level acm dips update Posting *********************

            //                                 const postacmcalTableupdatedipsLevel = new Promise((resolve, reject) => {
            //                                     let acmUpdateData = [];

            //                                     for (let i = 0; i < rowDataList.length; i++) {
            //                                         let rowData = rowDataList[i];


            //                                         var oEntryslist = {
            //                                             sap_uuid: currentYear + GetId, // Unique ID for the entry
            //                                             processorder: getHeaderData.ProcessOrder,
            //                                             zdate: rowData.zdate ? new Date(rowData.zdate.toLocaleDateString('en-CA')) : null,
            //                                             shift: rowData.shift,
            //                                             batch: getHeaderData.Batch,
            //                                             balance_qty: rowData.balanceqty ? (rowData.balanceqty) : '0.000',
            //                                             pre_dips: rowData.dipsuptoprevious ? (rowData.dipsuptoprevious) : '0.000',
            //                                             cur_dips: parseFloat(rowData.dipscurrent).toFixed(3) ? parseFloat(rowData.dipscurrent).toFixed(3) : '0.000',
            //                                             cumm_dips: rowData.cumulative ? (rowData.cumulative) : '0.00',
            //                                             cum_qty_lakh: rowData.dipsqtylakh ? parseFloat(rowData.dipsqtylakh).toFixed(2) : '0.00',
            //                                             hfx_qty: rowData.hfx ? (rowData.hfx) : '0.00',
            //                                             hfx_cum: "0.000",
            //                                             scp_qty: "0.000",
            //                                             scp_qum: "0.000",
            //                                             cap_cut_qty: rowData.capcutqty ? (rowData.capcutqty) : '0.00',
            //                                             body_cut_qty: rowData.bodycutqty ? (rowData.bodycutqty) : '0.00',
            //                                             cap_cake_qty: rowData.capcakeqty ? (rowData.capcakeqty) : '0.00',
            //                                             body_cake_qty: rowData.bodycakeqty ? (rowData.bodycakeqty) : '0.00',
            //                                             floor_scrap_qty: rowData.floorwastage ? (rowData.floorwastage) : '0.00',
            //                                             zhfx: rowData.hfx ? (rowData.hfx) : '0.00',
            //                                             zwastage: rowData.wastage ? (rowData.wastage) : '0.00',
            //                                             zfloor: rowData.floorwastage ? (rowData.floorwastage) : '0.00',
            //                                             zoperator: rowData.operatorname,
            //                                             zmblnr1: "",
            //                                             zmblnr2: "",
            //                                             zmjahr1: "",
            //                                             zmjahr2: "",
            //                                             acmno: getHeaderData.ACMNO.padStart(2, "0"),
            //                                         };

            //                                         console.log("updatedipsdata:", oEntryslist);


            //                                         acmUpdateData.push(oEntryslist);
            //                                     }

            //                                     that.getView().setModel();  // Set model (if needed)

            //                                     var oModelGetdips = that.getView().getModel("ZAU_ACM_SAVE_DIPS_DATA_SB");


            //                                     const existingEntries = oModelGetdips.getData();


            //                                     for (let i = 0; i < acmUpdateData.length; i++) {
            //                                         let oEntrys = acmUpdateData[i];


            //                                         let existingEntry = existingEntries.find(entry => entry.sap_uuid === oEntrys.sap_uuid);

            //                                         if (existingEntry) {

            //                                             oModelGetdips.update("/ZC_DIPS_DATA", oEntrys, {
            //                                                 success: function (oData, oResponse) {
            //                                                     console.log("Entry updated successfully");
            //                                                     oModelGetdips.refresh(true);  // Refresh model to reflect changes
            //                                                     resolve(oData);
            //                                                 },
            //                                                 error: function (error) {
            //                                                     console.log("Update error", error);
            //                                                     reject(error);
            //                                                 }
            //                                             });
            //                                         } else {

            //                                             oModelGetdips.create("/ZC_DIPS_DATA", oEntrys, {
            //                                                 success: function (oData, oResponse) {
            //                                                     console.log("Entry created successfully");
            //                                                     oModelGetdips.refresh(true);  // Refresh model to reflect changes
            //                                                     resolve(oData);
            //                                                 },
            //                                                 error: function (error) {
            //                                                     console.log("Create error", error);
            //                                                     reject(error);
            //                                                 }
            //                                             });


            //                                         }
            //                                     }

            //                                 });




            //                     await Promise.all([postIDTableLevel, postItemLevel, posttableitemTableLevel, postacmcalTableupdatedipsLevel]);
            //                     // sap.ui.core.BusyIndicator.hide();

            //                     // ************************************************************

            //                     resolve("Saved");

            //                 } else {
            //                     sap.m.MessageToast.show("Cancelled");
            //                     sap.ui.core.BusyIndicator.hide();
            //                 }
            //             }
            //         });
            //     });
            // },



            // ToSaveFunc: function (GetId) {
            //     return new Promise((resolve, reject) => {
            //         sap.ui.core.BusyIndicator.show();

            //         let getHeaderData = this.screen2headermodel.getProperty("/HEADERDATA/");
            //         let getItemData = this.TabItemModel.getProperty("/Datatabitem/");
            //         var that = this;
            //         var currentYear = new Date().getFullYear();

            //         var tabledatanew = this.selectedDatas;

            //         if (!tabledatanew || tabledatanew.length === 0) {
            //             sap.m.MessageBox.warning("Please select a row before submitting the data.", {
            //                 onClose: function () {
            //                     reject("No row selected");
            //                 }
            //             });
            //             sap.ui.core.BusyIndicator.hide();
            //             return;
            //         }

            //         let rowDataList = tabledatanew;


            //         let firstRow = rowDataList[0];
            //         console.log("First row:", firstRow);


            //         if (
            //             !firstRow.zdate ||
            //             firstRow.shift === "" ||
            //             firstRow.operatorname === "" ||
            //             isNaN(Number(firstRow.dipscurrent)) ||
            //             Number(firstRow.dipscurrent) <= 0
            //         ) {
            //             sap.m.MessageBox.warning("Please fill all mandatory fields (Date, Shift, Dips Cur > 0, Operator Name).");
            //             sap.ui.core.BusyIndicator.hide();
            //             return;
            //         }
            //         if (firstRow.shift === "C") {
            //             if (
            //                 firstRow.floorwastage === "" ||
            //                 firstRow.floorwastage === 0 ||
            //                 firstRow.floorwastage === "0.00"
            //             ) {
            //                 sap.m.MessageBox.error("Please enter a valid C Shift floor wastage");
            //                 sap.ui.core.BusyIndicator.hide();
            //                 return;
            //             }
            //         }


            //         sap.ui.core.BusyIndicator.hide();
            //         sap.m.MessageBox.warning("Do you want to submit this data.", {
            //             actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
            //             emphasizedAction: sap.m.MessageBox.Action.YES,
            //             onClose: async function (sAction) {
            //                 if (sAction !== "YES") {
            //                     sap.m.MessageToast.show("Cancelled");
            //                     sap.ui.core.BusyIndicator.hide();
            //                     reject("User cancelled");
            //                     return;
            //                 }


            //                 sap.ui.core.BusyIndicator.show();


            //                 const postItemLevel = new Promise((resolveItem, rejectItem) => {
            //                     let itemPostData = [];
            //                     for (let i = 0; i < rowDataList.length; i++) {
            //                         let row = rowDataList[i];
            //                         let ItemPOST = {
            //                             sapUuid: currentYear + GetId + i,
            //                             id: GetId,
            //                             processorder: getHeaderData.ProcessOrder,
            //                             acmno: getHeaderData.ACMNO,
            //                             batch: getHeaderData.Batch,
            //                             zdate: row.zdate ? new Date(row.zdate.toLocaleDateString('en-CA')) : null,
            //                             shift: row.shift,
            //                             balanceqty: parseFloat(row.balanceqty).toFixed(3),
            //                             uom: "",
            //                             dipsuptoprevious: parseFloat(row.dipsuptoprevious).toFixed(3),
            //                             dipscurrent: parseFloat(row.dipscurrent).toFixed(3),
            //                             cumulative: parseFloat(row.cumulative).toFixed(2),
            //                             cummulativeinlaksh: parseFloat(row.cummulativeinlaksh).toFixed(2),
            //                             dipsqtylakh: parseFloat(row.dipsqtylakh).toFixed(2),
            //                             hfxqtyshift: null,
            //                             capcutqty: parseFloat(row.capcutqty).toFixed(2),
            //                             bodycutqty: parseFloat(row.bodycutqty).toFixed(2),
            //                             bodycakeqty: parseFloat(row.bodycakeqty).toFixed(2),
            //                             capcakeqty: parseFloat(row.capcakeqty).toFixed(2),
            //                             hfx: parseFloat(row.hfx).toFixed(2),
            //                             wastage: parseFloat(row.wastage).toFixed(2),
            //                             floorwastage: parseFloat(row.floorwastage).toFixed(2),
            //                             materialdocumentno: row.materialdocumentno,
            //                             materialdocumentyear: row.materialdocumnetyear,
            //                             operatorname: row.operatorname,
            //                             status: "open",
            //                             itemstatus: "open",
            //                             screencode: "AU200",
            //                             createdby: that.TENTUSERID,
            //                             createdat: new Date(),
            //                             updatedat: new Date(),
            //                             updatedby: that.TENTUSERID,
            //                             plant: getHeaderData.plant
            //                         };
            //                         itemPostData.push(ItemPOST);
            //                     }

            //                     let oModelITEMS = that.getView().getModel("ZSB_AU_ACM_ITEM");


            //                     let first = itemPostData[0];
            //                     oModelITEMS.read("/ZC_AU_ACM_ITEM", {
            //                         filters: [
            //                             new sap.ui.model.Filter("acmno", sap.ui.model.FilterOperator.EQ, getHeaderData.ACMNO),
            //                             new sap.ui.model.Filter("batch", sap.ui.model.FilterOperator.EQ, getHeaderData.Batch)
            //                         ],
            //                         success: function (oData) {
            //                             if (oData.results && oData.results.length > 0) {

            //                                 let existingId = oData.results[0].id;

            //                                 // oModelITEMS.update("/ZC_AU_ACM_ITEM(" + existingId + ")", first, {
            //                                 //     success: function (odata) {
            //                                 //         console.log("Item Updated:", odata);
            //                                 //         resolveItem(odata);
            //                                 //     },
            //                                 //     error: function (err) {
            //                                 //         console.error("Item update error:", err);
            //                                 //         rejectItem(err);
            //                                 //     }
            //                                 // });

            //                             } else {

            //                                 // oModelITEMS.create("/ZC_AU_ACM_ITEM", first, {
            //                                 //     success: function (odata) {
            //                                 //         console.log("Item Created:", odata);
            //                                 //         resolveItem(odata);
            //                                 //     },
            //                                 //     error: function (err) {
            //                                 //         console.error("Item create error:", err);
            //                                 //         rejectItem(err);
            //                                 //     }
            //                                 // });
            //                             }
            //                         },
            //                         error: function (err) {
            //                             console.error("Item read error:", err);
            //                              sap.ui.core.BusyIndicator.hide();
            //                             rejectItem(err);

            //                         }
            //                     });
            //                 });


            //                 const postIDTableLevel = new Promise((resolveHdr, rejectHdr) => {
            //                     var oEntry = {
            //                         sapUuid: currentYear + GetId,
            //                         id: GetId,
            //                         acmno: getHeaderData.ACMNO,
            //                         processorder: getHeaderData.ProcessOrder,
            //                         batch: getHeaderData.Batch,
            //                         bodycolor: getHeaderData.BodyColor,
            //                         capcolor: getHeaderData.CapColor,
            //                         qtymfdlak: getHeaderData.QtytoMfdLakhs,
            //                         qtymfddip: getHeaderData.QtytoMfdDips,
            //                         material: getHeaderData.Product,
            //                         description: getHeaderData.ProductDescription,
            //                         zsize: getHeaderData.Zsize,
            //                         acmseed: getHeaderData.Speed,
            //                         startdate: getHeaderData.CreationDate,
            //                         noofbar: getHeaderData.bar,
            //                         starttime: getHeaderData.currentTime,
            //                         status: "",
            //                         headerstatus: "",
            //                         screencode: "AU200",
            //                         createdat: new Date(),
            //                         createdby: that.TENTUSERID,
            //                         updatedat: new Date(),
            //                         updatedby: "",
            //                         plant: getHeaderData.plant
            //                     };
            //                     console.log("Header Entry:", oEntry);

            //                     let oModelGetHdr = that.getView().getModel("ZSB_AU_ACM_HEADER");


            //                     oModelGetHdr.read("/ZC_AU_ACM_HEADER", {
            //                         filters: [
            //                             new sap.ui.model.Filter("acmno", sap.ui.model.FilterOperator.EQ, getHeaderData.ACMNO),
            //                             new sap.ui.model.Filter("batch", sap.ui.model.FilterOperator.EQ, getHeaderData.Batch)
            //                         ],
            //                         success: function (odata) {
            //                             if (odata.results && odata.results.length > 0) {
            //                                 let existingHdrId = odata.results[0].id;
            //                                 // oModelGetHdr.update("/ZC_AU_ACM_HEADER(" + existingHdrId + ")", oEntry, {
            //                                 //     success: function (res) {
            //                                 //         console.log("Header Updated:", res);
            //                                 //         resolveHdr(res);
            //                                 //     },
            //                                 //     error: function (err) {
            //                                 //         console.error("Header update error:", err);
            //                                 //         rejectHdr(err);
            //                                 //     }
            //                                 // });
            //                             } else {
            //                                 // oModelGetHdr.create("/ZC_AU_ACM_HEADER", oEntry, {
            //                                 //     success: function (res) {
            //                                 //         console.log("Header Created:", res);
            //                                 //         resolveHdr(res);
            //                                 //     },
            //                                 //     error: function (err) {
            //                                 //         console.error("Header create error:", err);
            //                                 //         rejectHdr(err);
            //                                 //     }
            //                                 // });
            //                             }
            //                         },


            //                         error: function (err) {
            //                             console.error("Header read error:", err);
            //                              sap.ui.core.BusyIndicator.hide();
            //                             rejectHdr(err);

            //                         }
            //                     });
            //                 });


            //                 const posttableitemTableLevel = new Promise((resolveTab, rejectTab) => {
            //                     let oModelGet = that.getView().getModel("ZAU_ACM_SAVE_DIPS_SRVB");
            //                     let promises = [];

            //                     for (let i = 0; i < rowDataList.length; i++) {
            //                         let row = rowDataList[i];

            //                         let oEntrys = {
            //                             sap_uuid: currentYear + GetId + i,
            //                             processorder: getHeaderData.ProcessOrder,
            //                             acmno: getHeaderData.ACMNO.padStart(2, "0"),
            //                             zdate: row.zdate ? new Date(row.zdate.toLocaleDateString('en-CA')) : null,
            //                             shift: row.shift,
            //                             batch: getHeaderData.Batch,
            //                             dips_qty_lakh: row.dipsqtylakh || "0.00",
            //                             cap_cut_qty: row.capcutqty || "0.00",
            //                             body_cut_qty: row.bodycutqty || "0.00",
            //                             cap_cake_qty: row.capcakeqty || "0.00",
            //                             body_cake_qty: row.bodycakeqty || "0.00",
            //                             hfx: row.hfx || "0.00",
            //                             wastage: row.wastage || "0.00",
            //                             floor_wastage: row.floorwastage || "0.00",
            //                             operator: row.operatorname,
            //                             material: "",
            //                             materialdescription: "",
            //                             quantity: "0.00",
            //                             base_unit: "",
            //                             plant: "",
            //                             storage_location: "",
            //                             movement_type: "",
            //                             vendor: "",
            //                             bom_item: "",
            //                             bom_item_number: ""
            //                         };

            //                         let entryPromise = new Promise((resolveEntry, rejectEntry) => {
            //                             // Use OData read to check existence
            //                             oModelGet.read("/ZC_ACM_UPDATE_DIPS", {
            //                                 filters: [
            //                                     //new sap.ui.model.Filter("acmno", sap.ui.model.FilterOperator.EQ, oEntrys.acmno),
            //                                     new sap.ui.model.Filter("shift", sap.ui.model.FilterOperator.EQ, oEntrys.shift),
            //                                     new sap.ui.model.Filter("sap_uuid", sap.ui.model.FilterOperator.EQ, oEntrys.sap_uuid)
            //                                 ],
            //                                 success: function (oData) {
            //                                     if (oData.results && oData.results.length > 0) {
            //                                         // Update existing
            //                                         let key = `/ZC_ACM_UPDATE_DIPS('${oData.results[0].sap_uuid}')`;

            //                                         // oModelGet.update(key, oEntrys, {
            //                                         //     success: function (res) {
            //                                         //         console.log("TableItem updated:", res);
            //                                         //         resolveEntry(res);
            //                                         //     },
            //                                         //     error: function (err) {
            //                                         //         console.error("TableItem update error:", err);
            //                                         //         rejectEntry(err);
            //                                         //     }
            //                                         // });


            //                                     } else {
            //                                         // Create new
            //                                         // oModelGet.create("/ZC_ACM_UPDATE_DIPS", oEntrys, {
            //                                         //     success: function (res) {
            //                                         //         console.log("TableItem created:", res);
            //                                         //         resolveEntry(res);
            //                                         //     },
            //                                         //     error: function (err) {
            //                                         //         console.error("TableItem create error:", err);
            //                                         //         rejectEntry(err);
            //                                         //     }
            //                                         // });
            //                                     }
            //                                 },
            //                                 error: function (err) {
            //                                     console.error("Read error in TableItem:", err);
            //                                      sap.ui.core.BusyIndicator.hide();
            //                                     rejectEntry(err);
            //                                 }
            //                             });
            //                         });

            //                         promises.push(entryPromise);
            //                     }


            //                     Promise.all(promises)
            //                         .then(results => {
            //                             oModelGet.refresh(true);
            //                             resolveTab(results); // All successful
            //                         })
            //                         .catch(err => {
            //                              sap.ui.core.BusyIndicator.hide();
            //                             rejectTab(err);
            //                         });
            //                 });



            //                 const postacmcalTableupdatedipsLevel = new Promise((resolveCal, rejectCal) => {
            //                     let acmUpdateData = [];
            //                     let getItemData = that.TabItemModel.getProperty("/Datatabitem/") || [];

            //                     if (!Array.isArray(getItemData) || getItemData.length === 0) {
            //                         resolveCal(); // Nothing to process
            //                         return;
            //                     }

            //                     let oModelGetdips = that.getView().getModel("ZAU_ACM_SAVE_DIPS_DATA_SB");
            //                     let promises = [];

            //                     for (let i = 0; i < getItemData.length; i++) {
            //                         let row = getItemData[i];
            //                         let sapUuid = currentYear + GetId + i;
            //                         let zdate = row.zdate ? new Date(row.zdate.toLocaleDateString('en-CA')) : null;

            //                         let entry = {
            //                             sap_uuid: sapUuid,
            //                             processorder: getHeaderData.ProcessOrder,
            //                             zdate: zdate,
            //                             shift: row.shift,
            //                             batch: getHeaderData.Batch,
            //                             balance_qty: row.balanceqty || "0.000",
            //                             pre_dips: row.dipsuptoprevious || "0.000",
            //                             cur_dips: parseFloat(row.dipscurrent).toFixed(3),
            //                             cumm_dips: row.cumulative || "0.00",
            //                             cum_qty_lakh: parseFloat(row.dipsqtylakh || 0).toFixed(2),
            //                             hfx_qty: row.hfx || "0.00",
            //                             hfx_cum: "0.000",
            //                             scp_qty: "0.000",
            //                             scp_qum: "0.000",
            //                             cap_cut_qty: row.capcutqty || "0.00",
            //                             body_cut_qty: row.bodycutqty || "0.00",
            //                             cap_cake_qty: row.capcakeqty || "0.00",
            //                             body_cake_qty: row.bodycakeqty || "0.00",
            //                             floor_scrap_qty: row.floorwastage || "0.00",
            //                             zhfx: row.hfx || "0.00",
            //                             zwastage: row.wastage || "0.00",
            //                             zfloor: row.floorwastage || "0.00",
            //                             zoperator: row.operatorname,
            //                             zmblnr1: "",
            //                             zmblnr2: "",
            //                             zmjahr1: "",
            //                             zmjahr2: "",
            //                             acmno: getHeaderData.ACMNO.padStart(2, "0")
            //                         };

            //                         acmUpdateData.push(entry);

            //                         let entryPromise = new Promise((resolveEntry, rejectEntry) => {
            //                             oModelGetdips.read("/ZC_DIPS_DATA", {
            //                                 filters: [
            //                                     //new sap.ui.model.Filter("acmno", sap.ui.model.FilterOperator.EQ, entry.acmno),
            //                                     new sap.ui.model.Filter("shift", sap.ui.model.FilterOperator.EQ, entry.shift),
            //                                     new sap.ui.model.Filter("sap_uuid", sap.ui.model.FilterOperator.EQ, entry.sap_uuid)
            //                                 ],
            //                                 success: function (oData) {
            //                                     if (oData.results && oData.results.length > 0) {

            //                                         let key = `/ZC_DIPS_DATA('${oData.results[0].sap_uuid}')`;

            //                                         // oModelGetdips.update(key, entry, {
            //                                         //     success: function (res) {
            //                                         //         console.log("Updated ACM cal entry:", res);
            //                                         //         resolveEntry(res);
            //                                         //     },
            //                                         //     error: function (err) {
            //                                         //         console.error("Update error:", err);
            //                                         //         rejectEntry(err);
            //                                         //     }
            //                                         // });


            //                                     } else {

            //                                         // oModelGetdips.create("/ZC_DIPS_DATA", entry, {
            //                                         //     success: function (res) {
            //                                         //         console.log("Created ACM cal entry:", res);
            //                                         //         resolveEntry(res);
            //                                         //     },
            //                                         //     error: function (err) {
            //                                         //         console.error("Create error:", err);
            //                                         //         rejectEntry(err);
            //                                         //     }
            //                                         // });
            //                                     }
            //                                 },
            //                                 error: function (err) {
            //                                     console.error("Read error:", err);
            //                                      sap.ui.core.BusyIndicator.hide();
            //                                     rejectEntry(err);
            //                                 }
            //                             });
            //                         });

            //                         promises.push(entryPromise);
            //                     }

            //                     Promise.all(promises)
            //                         .then(results => {
            //                             oModelGetdips.refresh(true);
            //                             resolveCal(results);
            //                         })
            //                         .catch(err => {
            //                              sap.ui.core.BusyIndicator.hide();
            //                             rejectCal(err);
            //                         });
            //                 });


            //                 // Execute all in parallel (or you can chain if some depend on others)
            //                 try {
            //                     await Promise.all([
            //                         postItemLevel,
            //                         postIDTableLevel,
            //                         posttableitemTableLevel,
            //                         postacmcalTableupdatedipsLevel
            //                     ]);


            //                     if (that._selectedTable) {
            //                         that._selectedTable.clearSelection();
            //                     }

            //                     that.selectedDatas = [];

            //                     sap.ui.core.BusyIndicator.hide();
            //                     resolve("Saved");
            //                 } catch (err) {
            //                     sap.ui.core.BusyIndicator.hide();
            //                     console.error("Error in saving:", err);
            //                     reject(err);
            //                 }
            //             }
            //         });
            //     });
            // },





            onTableitemCancel: function () {
                this.tableitemfrag.close();

            },

            onCapCutPrint: async function (oEvent) {
                const input = oEvent.getSource(); // the Input field
                const context = input.getBindingContext("TabItemModel");
                let getHeaderData = this.screen2headermodel.getProperty("/HEADERDATA/");

                if (context) {
                    const rowPath = context.getPath();
                    const rowData = context.getObject();
                    console.log("rowData", rowData);
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
                        sap.ui.require.toUrl("zautodesignapp/images/NCLlogo.png")
                    );

                    const generatePDFContent = (logoData, rowData) => `
                        <html>
                            <head>
                                <style>
                                    body {
                                        font-family: "Arial, sans-serif", monospace;
                                        margin: 0;
                                        padding: 0;
                                    }
                                    .label {
                                        border: 1px solid black;
                                        width: 100%;
                                        box-sizing: border-box;
                                        padding: 5px;
                                    }
                                    .header {
                                        display: flex;
                                        align-items: center;
                                        justify-content: space-between;
                                        width: 100%;
                                        height: 40px;
                                        margin-bottom: 10px;
                                    }
                                    .logo img {
                                        height: 30px;
                                    }
                                    .title-wrap {
                                        flex-grow: 1;
                                        text-align: center;
                                    }
                                    .title {
                                        font-weight: bold;
                                        font-size: 18px;
                                        margin: 0;
                                    }
                                    table {
                                        width: 100%;
                                        border-collapse: collapse;
                                        font-size: 16px;
                                    }
                                    td {
                                        border: 1px solid black;
                                        padding: 5px;
                                        vertical-align: top;
                                    }
                                    .label-section {
                                        font-weight: bold;
                                    }
                                </style>
                            </head>
                            <body>
                                <div class="label">
                                    <div class="header">
                                        <div class="logo">
                                            <img src="${logoData}" alt="Logo" />
                                        </div>
                                        <div class="title-wrap">
                                            <div class="title">CAP CUTTING LABEL</div>
                                        </div>
                                    </div>
                                    <table>
                                        <tr><td class="label-section">BATCH NO</td><td>${getHeaderData.Batch}</td></tr>
                                        <tr><td class="label-section">ITEM DESCRIPTION</td><td>${getHeaderData.CapColor}</td></tr>
                                        <tr><td class="label-section">CUSTOMER</td><td>${getHeaderData.CustomerName}</td></tr>
                                        <tr><td class="label-section">CAP CUT</td><td>${rowData.capcutqty}</td></tr>
                                        <tr><td class="label-section">DATE /SHIFT & TIME</td><td>${rowData.zdate.toLocaleDateString('en-CA')} / ${rowData.shift}</td></tr>
                                        <tr><td class="label-section">ACM OPERATOR</td><td>${rowData.operatorname}</td></tr>
                                    </table>
                                </div>
                            </body>
                        </html>
                    `;

                    const htmlContent = generatePDFContent(logoBase64, rowData);
                    const iframe = document.createElement("iframe");
                    iframe.style.position = "fixed";
                    iframe.style.left = "-8999px";
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
            },

            onBodyCutPrint: async function (oEvent) {
                const input = oEvent.getSource(); // the Input field
                const context = input.getBindingContext("TabItemModel");
                let getHeaderData = this.screen2headermodel.getProperty("/HEADERDATA/");

                if (context) {
                    const rowPath = context.getPath();
                    const rowData = context.getObject();
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
                        sap.ui.require.toUrl("zautodesignapp/images/NCLlogo.png")
                    );

                    const generatePDFContent = (logoData, rowData) => `
                        <html>
                            <head>
                                <style>
                                    body {
                                        font-family: "Arial, sans-serif", monospace;
                                        margin: 0;
                                        padding: 0;
                                    }
                                    .label {
                                        border: 1px solid black;
                                        width: 100%;
                                        box-sizing: border-box;
                                        padding: 5px;
                                    }
                                    .header {
                                        display: flex;
                                        align-items: center;
                                        justify-content: space-between;
                                        width: 100%;
                                        height: 40px;
                                        margin-bottom: 10px;
                                    }
                                    .logo img {
                                        height: 30px;
                                    }
                                    .title-wrap {
                                        flex-grow: 1;
                                        text-align: center;
                                    }
                                    .title {
                                        font-weight: bold;
                                        font-size: 18px;
                                        margin: 0;
                                    }
                                    table {
                                        width: 100%;
                                        border-collapse: collapse;
                                        font-size: 16px;
                                    }
                                    td {
                                        border: 1px solid black;
                                        padding: 5px;
                                        vertical-align: top;
                                    }
                                    .label-section {
                                        font-weight: bold;
                                    }
                                </style>
                            </head>
                            <body>
                                <div class="label">
                                    <div class="header">
                                        <div class="logo">
                                            <img src="${logoData}" alt="Logo" />
                                        </div>
                                        <div class="title-wrap">
                                            <div class="title">BODY CUTTING LABEL</div>
                                        </div>
                                    </div>
                                    <table>
                                        <tr><td class="label-section">BATCH NO</td><td>${getHeaderData.Batch}</td></tr>
                                        <tr><td class="label-section">ITEM DESCRIPTION</td><td>${getHeaderData.CapColor}</td></tr>
                                        <tr><td class="label-section">CUSTOMER</td><td>${getHeaderData.CustomerName}</td></tr>
                                        <tr><td class="label-section">BODY CUT</td><td>${rowData.bodycutqty}</td></tr>
                                        <tr><td class="label-section">DATE /SHIFT & TIME</td><td>${rowData.zdate.toLocaleDateString('en-CA')} / ${rowData.shift}</td></tr>
                                        <tr><td class="label-section">ACM OPERATOR</td><td>${rowData.operatorname}</td></tr>
                                    </table>
                                </div>
                            </body>
                        </html>
                    `;

                    const htmlContent = generatePDFContent(logoBase64, rowData);
                    const iframe = document.createElement("iframe");
                    iframe.style.position = "fixed";
                    iframe.style.left = "-8999px";
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
            },




            onCapCakePrint: async function (oEvent) {
                const input = oEvent.getSource(); // the Input field
                const context = input.getBindingContext("TabItemModel");
                let getHeaderData = this.screen2headermodel.getProperty("/HEADERDATA/");

                if (context) {
                    const rowPath = context.getPath();
                    const rowData = context.getObject();
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
                        sap.ui.require.toUrl("zautodesignapp/images/NCLlogo.png")
                    );

                    const generatePDFContent = (logoData, rowData) => `
                        <html>
                            <head>
                                <style>
                                    body {
                                        font-family: "Arial, sans-serif", monospace;
                                        margin: 0;
                                        padding: 0;
                                    }
                                    .label {
                                        border: 1px solid black;
                                        width: 100%;
                                        box-sizing: border-box;
                                        padding: 5px;
                                    }
                                    .header {
                                        display: flex;
                                        align-items: center;
                                        justify-content: space-between;
                                        width: 100%;
                                        height: 40px;
                                        margin-bottom: 10px;
                                    }
                                    .logo img {
                                        height: 30px;
                                    }
                                    .title-wrap {
                                        flex-grow: 1;
                                        text-align: center;
                                    }
                                    .title {
                                        font-weight: bold;
                                        font-size: 18px;
                                        margin: 0;
                                    }
                                    table {
                                        width: 100%;
                                        border-collapse: collapse;
                                        font-size: 16px;
                                    }
                                    td {
                                        border: 1px solid black;
                                        padding: 5px;
                                        vertical-align: top;
                                    }
                                    .label-section {
                                        font-weight: bold;
                                    }
                                </style>
                            </head>
                            <body>
                                <div class="label">
                                    <div class="header">
                                        <div class="logo">
                                            <img src="${logoData}" alt="Logo" />
                                        </div>
                                        <div class="title-wrap">
                                            <div class="title">CAPCAKE LABEL</div>
                                        </div>
                                    </div>
                                    <table>
                                        <tr><td class="label-section">BATCH NO</td><td>${getHeaderData.Batch}</td></tr>
                                        <tr><td class="label-section">ITEM DESCRIPTION</td><td>${getHeaderData.CapColor}</td></tr>
                                        <tr><td class="label-section">CUSTOMER</td><td>${getHeaderData.CustomerName}</td></tr>
                                        <tr><td class="label-section">CAP CAKE</td><td>${rowData.capcakeqty}</td></tr>
                                        <tr><td class="label-section">DATE /SHIFT & TIME</td><td>${rowData.zdate.toLocaleDateString('en-CA')} / ${rowData.shift}</td></tr>
                                        <tr><td class="label-section">ACM OPERATOR</td><td>${rowData.operatorname}</td></tr>
                                    </table>
                                </div>
                            </body>
                        </html>
                    `;

                    const htmlContent = generatePDFContent(logoBase64, rowData);
                    const iframe = document.createElement("iframe");
                    iframe.style.position = "fixed";
                    iframe.style.left = "-8999px";
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
            },


            onBodyCakePrint: async function (oEvent) {
                const input = oEvent.getSource(); // the Input field
                const context = input.getBindingContext("TabItemModel");
                let getHeaderData = this.screen2headermodel.getProperty("/HEADERDATA/");

                if (context) {
                    const rowPath = context.getPath();
                    const rowData = context.getObject();
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
                        sap.ui.require.toUrl("zautodesignapp/images/NCLlogo.png")
                    );

                    const generatePDFContent = (logoData, rowData) => `
                        <html>
                            <head>
                                <style>
                                    body {
                                        font-family: "Arial, sans-serif", monospace;
                                        margin: 0;
                                        padding: 0;
                                    }
                                    .label {
                                        border: 1px solid black;
                                        width: 100%;
                                        box-sizing: border-box;
                                        padding: 5px;
                                    }
                                    .header {
                                        display: flex;
                                        align-items: center;
                                        justify-content: space-between;
                                        width: 100%;
                                        height: 40px;
                                        margin-bottom: 10px;
                                    }
                                    .logo img {
                                        height: 30px;
                                    }
                                    .title-wrap {
                                        flex-grow: 1;
                                        text-align: center;
                                    }
                                    .title {
                                        font-weight: bold;
                                        font-size: 18px;
                                        margin: 0;
                                    }
                                    table {
                                        width: 100%;
                                        border-collapse: collapse;
                                        font-size: 16px;
                                    }
                                    td {
                                        border: 1px solid black;
                                        padding: 5px;
                                        vertical-align: top;
                                    }
                                    .label-section {
                                        font-weight: bold;
                                    }
                                </style>
                            </head>
                            <body>
                                <div class="label">
                                    <div class="header">
                                        <div class="logo">
                                            <img src="${logoData}" alt="Logo" />
                                        </div>
                                        <div class="title-wrap">
                                            <div class="title">BODYCAKE LABEL</div>
                                        </div>
                                    </div>
                                    <table>
                                        <tr><td class="label-section">BATCH NO</td><td>${getHeaderData.Batch}</td></tr>
                                        <tr><td class="label-section">ITEM DESCRIPTION</td><td>${getHeaderData.CapColor}</td></tr>
                                        <tr><td class="label-section">CUSTOMER</td><td>${getHeaderData.CustomerName}</td></tr>
                                        <tr><td class="label-section">BODY CAKE</td><td>${rowData.bodycakeqty}</td></tr>
                                        <tr><td class="label-section">DATE /SHIFT & TIME</td><td>${rowData.zdate.toLocaleDateString('en-CA')} / ${rowData.shift}</td></tr>
                                        <tr><td class="label-section">ACM OPERATOR</td><td>${rowData.operatorname}</td></tr>
                                    </table>
                                </div>
                            </body>
                        </html>
                    `;

                    const htmlContent = generatePDFContent(logoBase64, rowData);
                    const iframe = document.createElement("iframe");
                    iframe.style.position = "fixed";
                    iframe.style.left = "-8999px";
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

                    const aFilters = [
                        new sap.ui.model.Filter("ProcessOrder", sap.ui.model.FilterOperator.EQ, "00" + rowData.processorder),
                        new sap.ui.model.Filter("dips_qty_lakh", sap.ui.model.FilterOperator.EQ, rowData.dipsqtylakh),
                        new sap.ui.model.Filter("cap_cut_qty", sap.ui.model.FilterOperator.EQ, rowData.capcutqty),
                        new sap.ui.model.Filter("body_cut_qty", sap.ui.model.FilterOperator.EQ, rowData.bodycutqty),
                        new sap.ui.model.Filter("cap_cake_qty", sap.ui.model.FilterOperator.EQ, rowData.capcakeqty),
                        new sap.ui.model.Filter("body_cake_qty", sap.ui.model.FilterOperator.EQ, rowData.bodycakeqty),
                        new sap.ui.model.Filter("hfx", sap.ui.model.FilterOperator.EQ, rowData.hfx),
                        new sap.ui.model.Filter("wastage", sap.ui.model.FilterOperator.EQ, rowData.wastage),
                        new sap.ui.model.Filter("floor_wastage", sap.ui.model.FilterOperator.EQ, rowData.floorwastage)
                    ];

                    const UPDATE_DIPS_MODEL = this.getView().getModel("ZAU_ACM_UPDATE_DIPS_SRVB");
                    let ToFetchUpdateDips = await this.ToFetchUpdateDips(UPDATE_DIPS_MODEL, rowData, aFilters);

                    this.CompDipsModel = new sap.ui.model.json.JSONModel({
                        Datatabitem: ToFetchUpdateDips.results
                    });

                    this.getView().setModel(this.CompDipsModel, "CompDipsModel");
                    //debugger

                    this.ComponentMatoEvent = oEvent
                    sap.ui.core.BusyIndicator.hide();
                    if (!this.tableitemfrag) {
                        this.tableitemfrag = sap.ui.xmlfragment(this.getView().getId("tableitemacm"), "zautodesignapp.view.acm.transaction.fragment.tableitemhelp", this);
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
                const context = input.getBindingContext("TabItemModel");
                let getHeaderData = this.screen2headermodel.getProperty("/HEADERDATA/");
                let getcompositedata = this.CompDipsModel.getProperty("/Datatabitem");
                let Screen1SelectHeaderdata = this.SelectScreen1Data;

                if (context) {
                    const rowPath = context.getPath();
                    const rowData = context.getObject();



                    // const UPDATE_DIPS_MODEL = this.getView().getModel("ZAU_ACM_UPDATE_DIPS_SRVB");
                    // let ToFetchUpdateDips = await this.ToFetchUpdateDips(UPDATE_DIPS_MODEL, rowData, aFilters);
                    let PostArr = [];
                    for (let i = 0; i < getcompositedata.length; i++) {
                        PostArr.push({
                            Material: getcompositedata[i].material,
                            Plant: getcompositedata[i].plant,
                            Storagelocation: getcompositedata[i].storage_location,
                            Batch: getcompositedata[i].batch,
                            Goodsmovementtype: getcompositedata[i].movement_type,
                            Quantityinentryunit: parseFloat(getcompositedata[i].quantity).toFixed(3),
                            Manufacturingorder: getcompositedata[i].ProcessOrder,
                            Manufacturingorderitem: "0001",
                            Manufacturedate: new Date(),
                            postingdate: new Date(),
                            Materialdocument: "",
                            matdocyear: "2025",
                            goodsmovementcode: "03",
                            inventoryspecialstocktype: getcompositedata[i].InventorySpecialStockType,
                            specialstockidfgsalesorder: getcompositedata[i].SpecialStockIdfgSalesOrder,
                            specialstockidfgsalesorderitem: getcompositedata[i].SpecialStockIdfgSalesOrderItem

                        });
                    }


                    console.log(PostArr);
                    //debugger

                    const that = this;
                    sap.ui.core.BusyIndicator.hide();
                    sap.m.MessageBox.warning("Do you want to post this data.", {
                        actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
                        emphasizedAction: sap.m.MessageBox.Action.YES,
                        onClose: async function (sAction) {
                            if (sAction === "YES") {
                                sap.ui.core.BusyIndicator.show();

                                try {

                                    const oModelGet = that.getView().getModel("ZCE_ACM_HEAD_CNF_SRB");

                                    const oEntry = {
                                        Postingdate: new Date(),
                                        Goodsmovementcode: "03",
                                        Materialdocument: "",
                                        Matdocyear: "2025",
                                        toitem: PostArr

                                    };

                                    console.log("oEntry:", oEntry);

                                    let ToAPIPOstTab = await that.ToAPIPOstTab(oModelGet, oEntry);
                                    if (ToAPIPOstTab.Errorresponse !== "") {
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

                                    }


                                    let ToUpdateIntTab = await that.ToUpdateIntTab(rowData, ToAPIPOstTab);

                                    const oModelGetItem = that.getView().getModel("ZSB_AU_ACM_ITEM");

                                    let oFilterProcessOrder = new sap.ui.model.Filter("processorder", sap.ui.model.FilterOperator.EQ, "00" + Screen1SelectHeaderdata.ProcessOrder);
                                    let oFilterBatch = new sap.ui.model.Filter("batch", sap.ui.model.FilterOperator.EQ, Screen1SelectHeaderdata.Batch);

                                    let GetInternalTabDatasItems = await that.ToCheckProcOrderInInternallyItem(oFilterProcessOrder, oFilterBatch, oModelGetItem);

                                    that.TabItemModel = new sap.ui.model.json.JSONModel({
                                        Datatabitem: GetInternalTabDatasItems.results
                                    });

                                    that.getView().setModel(that.TabItemModel, "TabItemModel");
                                    let ojsonmodelitem = that.getView().getModel("TabItemModel");
                                    let property01 = ojsonmodelitem.getProperty("/Datatabitem");
                                    let getHeaderData = that.screen2headermodel.getProperty("/HEADERDATA/");
                                    let OrderQtyLakh = parseFloat(getHeaderData.QtytoMfdLakhs);
                                    let dispmaster = that.dipsmodelcal.getProperty("/DipsData");
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
                                            let dipsqtylakh = (dipsuptoprevious * dispmaster.qty_dips) / 100000;
                                            let balqty = parseFloat(OrderQtyLakh) - parseFloat(cuminlak)
                                            console.log("dipscum", dipscum);
                                            property01[index].abacd = dipscum;
                                            property01[index].cumulative = dipscum.toFixed(2);
                                            property01[index].dipsqtylakh = dipsqtylakh.toFixed(2);
                                            property01[index].cummulativeinlaksh = cuminlak.toFixed(2);
                                            property01[index].balanceqty = balqty.toFixed(3);



                                        });

                                        console.log("ojsonmodelitem", ojsonmodelitem);

                                    }
                                    that.TabItemModel.refresh();

                                    that.rowdatamodel = new sap.ui.model.json.JSONModel({
                                        itemdatas: []
                                    });
                                    that.getView().setModel(that.rowdatamodel, "rowdatamodel");
                                    sap.m.MessageBox.success("Material Document Generated...");

                                    that.FinalStatus = new sap.ui.model.json.JSONModel({
                                        MSGSTRIP: {
                                            "visible": true,
                                            "text": "Material Document No " + ToAPIPOstTab.Materialdocument,
                                            "type": 'Success'
                                        }
                                    });
                                    that.getView().setModel(that.FinalStatus, "FinalStatus")

                                } catch (error) {
                                    console.error("Error in OnApiPost_MatDoc:", error);
                                    sap.m.MessageBox.error("An error occurred during posting.");
                                } finally {
                                    sap.ui.core.BusyIndicator.hide();
                                    that.tableitemfrag.close();
                                }
                            } else {
                                sap.m.MessageToast.show("Cancelled");
                                that.tableitemfrag.close();
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
                        UPDATE_DIPS_MODEL.read("/zce_acm_update_dips", {
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
                        const oModelGet = that.getView().getModel("ZSB_AU_ACM_ITEM");
                        oModelGet.setHeaders({
                            "X-Requested-With": "X",
                            "Content-Type": "application/json"
                        });

                        const Header = {
                            materialdocumentyear: ToAPIPOstTab.Matdocyear,
                            materialdocumentno: ToAPIPOstTab.Materialdocument,
                        };

                        const id = rowData.id;
                        const zdate = new Date(rowData.zdate.toLocaleDateString('en-CA'));
                        const processorder = rowData.processorder.padStart(12, "0");
                        const acmno = rowData.acmno.padStart(2, "0");
                        const batch = rowData.batch;
                        const shift = rowData.shift;

                        oModelGet.update("/ZC_AU_ACM_ITEM('" + id + "')", Header, {
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
                                    const oModelGet = that.getView().getModel("ZSB_MATDOC_REV_SRVB");

                                    // console.log("oEntry:", oEntry);

                                    let ToAPIPOstTab = await that.ToReverseAPIPOstTab(oModelGet, rowData);
                                    let ToUpdateIntTab = await that.ToReverseDeleteTab(rowData, ToAPIPOstTab);

                                    const oModelGetItem = that.getView().getModel("ZSB_AU_ACM_ITEM");

                                    let oFilterProcessOrder = new sap.ui.model.Filter("processorder", sap.ui.model.FilterOperator.EQ, "00" + Screen1SelectHeaderdata.ProcessOrder);
                                    let oFilterBatch = new sap.ui.model.Filter("batch", sap.ui.model.FilterOperator.EQ, Screen1SelectHeaderdata.Batch);

                                    let GetInternalTabDatasItems = await that.ToCheckProcOrderInInternallyItem(oFilterProcessOrder, oFilterBatch, oModelGetItem);

                                    that.TabItemModel = new sap.ui.model.json.JSONModel({
                                        Datatabitem: GetInternalTabDatasItems.results
                                    });

                                    that.getView().setModel(that.TabItemModel, "TabItemModel");
                                    let ojsonmodelitem = that.getView().getModel("TabItemModel");
                                    let property01 = ojsonmodelitem.getProperty("/Datatabitem");
                                    let getHeaderData = that.screen2headermodel.getProperty("/HEADERDATA/");
                                    let OrderQtyLakh = parseFloat(getHeaderData.QtytoMfdLakhs);
                                    let dispmaster = that.dipsmodelcal.getProperty("/DipsData");
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
                                            let dipsqtylakh = (dipsuptoprevious * dispmaster.qty_dips) / 100000;
                                            let balqty = parseFloat(OrderQtyLakh) - parseFloat(cuminlak)
                                            console.log("dipscum", dipscum);
                                            property01[index].abacd = dipscum;
                                            property01[index].cumulative = dipscum.toFixed(2);
                                            property01[index].dipsqtylakh = dipsqtylakh.toFixed(2);
                                            property01[index].cummulativeinlaksh = cuminlak.toFixed(2);
                                            property01[index].balanceqty = balqty.toFixed(3);



                                        });

                                        console.log("ojsonmodelitem", ojsonmodelitem);

                                        //update 
                                        property01.forEach(element => {

                                            var upayload = {
                                                dipsqtylakh: parseFloat(element.dipsqtylakh).toFixed(2),
                                                balanceqty: parseFloat(element.balanceqty).toFixed(3),
                                                cummulativeinlaksh: parseFloat(element.cummulativeinlaksh).toFixed(2),
                                                cumulative: parseFloat(element.cumulative).toFixed(2)


                                            }
                                            oModelGetItem.update("/ZC_AU_ACM_ITEM('" + element.id + "')", upayload, {
                                                success: function (odata) {
                                                    console.log("updated after delete");

                                                },
                                                error: function (error) {
                                                    console.log("error updating after delete", error);

                                                }
                                            });


                                        });


                                    }

                                    that.TabItemModel.refresh();

                                    that.rowdatamodel = new sap.ui.model.json.JSONModel({
                                        itemdatas: []
                                    });
                                    that.getView().setModel(that.rowdatamodel, "rowdatamodel");


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
                        const oModelGet = that.getView().getModel("ZSB_AU_ACM_ITEM");
                        oModelGet.setHeaders({
                            "X-Requested-With": "X",
                            "Content-Type": "application/json"
                        });

                        var Dipsmodel = this.getView().getModel("ZAU_ACM_SAVE_DIPS_SRVB"); // backend OData model
                        var Dipsmodel2 = this.getView().getModel("ZAU_ACM_SAVE_DIPS_DATA_SB"); // backend OData model
                        var Dipsmodel3 = this.getView().getModel("ZAU_ACM_DOWNTIME_SRVB"); // backend OData model

                        const id = rowData.id;

                        oModelGet.remove("/ZC_AU_ACM_ITEM('" + id + "')", {
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



                        var path = "/ZC_ACM_UPDATE_DIPS('" + rowData.sapUuid + "')";

                        Dipsmodel.remove(path, {
                            success: function () {
                                // sap.m.MessageToast.show("Dips data deleted");
                                console.log("Dips data deleted");

                            },
                            error: function (oError) {
                                // sap.m.MessageToast.show("Error while deleting dips");
                                console.log("Error while deleting dips");

                            }
                        });

                        var path2 = "/ZC_DIPS_DATA('" + rowData.sapUuid + "')";


                        Dipsmodel2.remove(path2, {
                            success: function () {
                                // sap.m.MessageToast.show("Dips data deleted");
                                console.log("Dips data deleted");

                            },
                            error: function (oError) {
                                //sap.m.MessageToast.show("Error while deleting dips");
                                console.log("Error while deleting dips");

                            }
                        });


                        var path3 = "/ZC_DOWNTIME('" + rowData.sapUuid + "')";


                        Dipsmodel3.remove(path3, {
                            success: function () {
                                //  sap.m.MessageToast.show("Dips data deleted");
                            },
                            error: function (oError) {
                                //  sap.m.MessageToast.show("Error while deleting dips");
                            }
                        });
                    } catch (error) {
                        console.error("Exception in ToUpdateIntTab:", error);
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
                        this.onCapCakePrint(oEvent);
                        break;
                    case "3":
                        this.onBodyCakePrint(oEvent);
                        break;
                    case "4":
                        this.ToComponentFragOpen(oEvent);
                        break;
                    case "5":
                        this.OnReverseApiPost_MatDoc(oEvent);
                        break;
                    default:
                        console.warn("Unknown action:", key);
                }
            },

            onDeleteItemPress: function (oEvent) {
                var that = this
                let Screen1SelectHeaderdata = this.SelectScreen1Data;
                const oInput = oEvent.getSource();
                const oContext = oInput.getBindingContext("TabItemModel");
                const id = oContext.getProperty("id");
                const sapUuid = oContext.getProperty("sapUuid");
                const oTabItemModel = this.getView().getModel("TabItemModel");
                let oModelITEMS = this.getView().getModel("ZSB_AU_ACM_ITEM");
                var oModelGet = this.getView().getModel("ZSB_AU_ACM_HEADER");
                var acmdips = this.getView().getModel("ZAU_ACM_SAVE_DIPS_SRVB");
                var oModelGetdips = that.getView().getModel("ZAU_ACM_SAVE_DIPS_DATA_SB");


                oModelITEMS.remove("/ZC_AU_ACM_ITEM('" + id + "')", {
                    success: async function (odata) {
                        let aItems = oTabItemModel.getProperty("/Datatabitem");
                        const iIndex = aItems.findIndex(item => item.id === id);
                        if (iIndex === -1) return;

                        // 🔹 Remove selected row
                        aItems.splice(iIndex, 1);

                        // 🔹 Update the model
                        oTabItemModel.setProperty("/Datatabitem", aItems);

                        // 🔹 Recalculate all cumulative fields
                        //that._recalculateDipsCumulative();
                        var oModelGetItem = that.getView().getModel("ZSB_AU_ACM_ITEM"); // ZC_AU_ACM_ITEM

                        let oFilterProcessOrder = new sap.ui.model.Filter("processorder", sap.ui.model.FilterOperator.EQ, "00" + Screen1SelectHeaderdata.ProcessOrder);
                        let oFilterBatch = new sap.ui.model.Filter("batch", sap.ui.model.FilterOperator.EQ, Screen1SelectHeaderdata.Batch);
                        let GetInternalTabDatasItems = await that.ToCheckProcOrderInInternallyItem(oFilterProcessOrder, oFilterBatch, oModelGetItem);
                        console.log(GetInternalTabDatasItems);
                        that.TabItemModel = new sap.ui.model.json.JSONModel({
                            Datatabitem: GetInternalTabDatasItems.results
                        });

                        // Set the model to the view
                        that.getView().setModel(that.TabItemModel, "TabItemModel");
                        let ojsonmodelitem = that.getView().getModel("TabItemModel");
                        let property01 = ojsonmodelitem.getProperty("/Datatabitem");
                        let getHeaderData = that.screen2headermodel.getProperty("/HEADERDATA/");
                        let OrderQtyLakh = parseFloat(getHeaderData.QtytoMfdLakhs);
                        let dispmaster = that.dipsmodelcal.getProperty("/DipsData");
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
                                let dipsqtylakh = (dipsuptoprevious * dispmaster.qty_dips) / 100000;
                                let balqty = parseFloat(OrderQtyLakh) - parseFloat(cuminlak)
                                console.log("dipscum", dipscum);
                                property01[index].abacd = dipscum;
                                property01[index].cumulative = dipscum.toFixed(2);
                                property01[index].dipsqtylakh = dipsqtylakh.toFixed(2);
                                property01[index].cummulativeinlaksh = cuminlak.toFixed(2);
                                property01[index].balanceqty = balqty.toFixed(3);



                            });

                            console.log("ojsonmodelitem", ojsonmodelitem);

                            //update 
                            property01.forEach(element => {

                                var upayload = {
                                    dipsqtylakh: parseFloat(element.dipsqtylakh).toFixed(2),
                                    balanceqty: parseFloat(element.balanceqty).toFixed(3),
                                    cummulativeinlaksh: parseFloat(element.cummulativeinlaksh).toFixed(2),
                                    cumulative: parseFloat(element.cumulative).toFixed(2)


                                }
                                oModelGetItem.update("/ZC_AU_ACM_ITEM('" + element.id + "')", upayload, {
                                    success: function (odata) {
                                        console.log("updated after delete");

                                    },
                                    error: function (error) {
                                        console.log("error updating after delete", error);

                                    }
                                })


                            });

                        }

                        sap.ui.core.BusyIndicator.hide();
                        sap.m.MessageToast.show("Row deleted and recalculated successfully");

                        oModelGet.remove("/ZC_AU_ACM_HEADER('" + id + "')", {
                            success: function (acmheader) {
                                console.log("acmheader", acmheader);

                            },
                            error: function (error) {
                                console.log("error", error);

                            }
                        });
                        acmdips.remove("/ZC_ACM_UPDATE_DIPS('" + sapUuid + "')", {
                            success: function (acmheader) {
                                console.log("acmheader", acmheader);

                            },
                            error: function (error) {
                                console.log("error", error);

                            }
                        });
                        oModelGetdips.remove("/ZC_DIPS_DATA('" + sapUuid + "')", {
                            success: function (acmheader) {
                                console.log("acmheader", acmheader);

                            },
                            error: function (error) {
                                console.log("error", error);

                            }
                        });

                    },
                    error: function (error) {
                        console.log("error", error);

                    }
                })



            },
            _recalculateDipsCumulative: function () {
                const oModel = this.getView().getModel("TabItemModel");
                const aItems = oModel.getProperty("/Datatabitem");
                const getHeaderData = this.screen2headermodel.getProperty("/HEADERDATA/");
                const dispmaster = this.dipsmodelcal.getProperty("/DipsData");
                const OrderQtyLakh = parseFloat(getHeaderData.QtytoMfdLakhs);

                let cumulative = 0;
                aItems.forEach((item, index) => {
                    const dipCurr = parseFloat(item.dipscurrent) || 0;

                    // Calculate new cumulative dips
                    cumulative += dipCurr;
                    item.cumulative = cumulative.toFixed(3);

                    // Cumulative in lakhs
                    const cumulativelkh_total = (cumulative * dispmaster.qty_dips) / 100000;
                    item.cummulativeinlaksh = cumulativelkh_total.toFixed(2);

                    // Dips qty lakh
                    item.dipsqtylakh = ((dipCurr * dispmaster.qty_dips) / 100000).toFixed(2);

                    // Balance Qty Lakh
                    const BalQtyLakhFinal = OrderQtyLakh - cumulativelkh_total;
                    item.balanceqty = BalQtyLakhFinal.toFixed(3);

                    // Dips up to previous for first row = same as dipCurr
                    item.dipsuptoprevious = dipCurr.toFixed(3);
                });

                oModel.setProperty("/Datatabitem", aItems);
                oModel.refresh(true);
            },

            ToUpdateIntTab2: function (rowData, ToAPIPOstTab) {
                return new Promise((resolve, reject) => {
                    sap.ui.core.BusyIndicator.show();
                    try {
                        const that = this;
                        const oModelGet = that.getView().getModel("ZSB_AU_ACM_ITEM");
                        oModelGet.setHeaders({
                            "X-Requested-With": "X",
                            "Content-Type": "application/json"
                        });

                        const Header = {
                            materialdocumentyear: ToAPIPOstTab.Matdocyear,
                            materialdocumentno: ToAPIPOstTab.Materialdocument,
                        };

                        const id = rowData.id;
                        const zdate = new Date(rowData.zdate.toLocaleDateString('en-CA'));
                        const processorder = rowData.processorder.padStart(12, "0");
                        const acmno = rowData.acmno.padStart(2, "0");
                        const batch = rowData.batch;
                        const shift = rowData.shift;

                        oModelGet.update("/ZC_AU_ACM_ITEM('" + id + "')", Header, {
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




        });
    }
);