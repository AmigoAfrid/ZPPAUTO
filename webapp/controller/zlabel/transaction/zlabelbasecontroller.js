sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/m/PDFViewer",
    "zautodesignapp/util/jspdf/html2canvasmin",
    "zautodesignapp/util/jspdf/jspdfmin",
], function (Controller, JSONModel, MessageToast, MessageBox, Filter, FilterOperator, ODataModel, Device, SearchField, TypeString, PDFLibjs, pdfjsLib, pdf, ColumnListItem, Label, PDFViewer) {
    "use strict";

    return Controller.extend("zautodesignapp.controller.zlabel.transaction.zlabelbasecontroller", {
        onInit: function () {
            this.screenModel = new JSONModel({
                openscreen: "screen1"
            });
            this.getView().setModel(this.screenModel, "ScreenVisible");
            var userInfoService = sap.ushell.Container.getService("UserInfo");
            this.TENTUSERID = userInfoService.getUser().getId();
            this.TENTUSERNAME = userInfoService.getUser().getFullName();
            // Model for storing process order and radio selection
            this.zlabelmodel = new JSONModel({
                HeaderData: [{
                    processno: "",
                    checked_by: this.TENTUSERNAME
                }]
            });


            this.getView().setModel(this.zlabelmodel, "zlabelmodel");

            this.TabZlabelItemModel = new sap.ui.model.json.JSONModel({
                DatasZitem: [],
            });

            // Set the model to the view
            this.getView().setModel(this.TabZlabelItemModel, "TabZlabelItemModel");





            // Get the URL of the image
            var svgLogo = sap.ui.require.toUrl("zautodesignapp/images/NCL.png");

            // Create a new JSON model with the image URL
            var oModel11 = new sap.ui.model.json.JSONModel({
                svgLogo: svgLogo
            });

            // Set the model to the view
            this.getView().setModel(oModel11);

            // Log the image URL for debugging
            console.log("Image URL:", oModel11.oData.svgLogo);

            this._PDFViewer = new sap.m.PDFViewer({
                width: "auto",
                // source: pdfUrl
            });
            jQuery.sap.addUrlWhitelist("blob");

        },


        onBeforeRendering: async function () {

            var userInfoService = sap.ushell.Container.getService("UserInfo");
            var userName = userInfoService.getUser().getFullName();
            this.TENTUSERID = userInfoService.getUser().getId();
            this.TENTUSERNAME = userInfoService.getUser().getFullName();
            console.log("getId:", this.TENTUSERID);
            console.log("User Name: " + this.TENTUSERNAME);

            sap.ui.core.BusyIndicator.hide();

        },




        // onGoItemPages: function () {
        //     var oView = this.getView();
        //     var oODataModel = oView.getModel("ZCE_ZCOUNT_HEAD_SRVB");
        //     var oScreenModel = this.screenModel;
        //     var oZCountModel = oView.getModel("zcountmodel");
        //     var oitemdatamodel = this.getView().getModel("TabZcountItemModel")
        //     console.log("oitemdatamodel", oitemdatamodel)



        //     this.getView().byId("idupdate").setEnabled(false)

        //     this.getView().byId("save").setEnabled(true)

        //     if (!oODataModel) {
        //         MessageToast.show("OData model not found!");
        //         return;
        //     }

        //     // Show busy indicator
        //     sap.ui.core.BusyIndicator.show(0);

        //     // Get process order input and split into array (comma-separated or space-separated)
        //     var sProcessOrders = oView.byId(""idprocessorder1).getValue();

        //     var Filter = new sap.ui.model.Filter("ProcessOrder", sap.ui.model.FilterOperator.EQ, sProcessOrders)

        //     var that = this
        //     oODataModel.read("/ZCE_ZCOUNT_HEAD", {
        //         filters: [Filter],
        //         success: function (oData) {
        //             // Hide busy indicator once data is received
        //             sap.ui.core.BusyIndicator.hide();

        //             var aResults = oData.results || [];

        //             if (aResults.length > 0) {

        //                 aResults[0].checked_by = that.TENTUSERNAME;

        //                 oZCountModel.setProperty("/HeaderData/0", aResults[0]);

        //                 console.log("oZCountModel", oZCountModel);

        //                 oScreenModel.setProperty("/openscreen", "screen2");
        //             } else {
        //                 MessageToast.show("No matching process orders found.");
        //             }
        //         },
        //         error: function () {
        //             // Hide busy indicator if there's an error
        //             sap.ui.core.BusyIndicator.hide();
        //             MessageToast.show("Failed to read data from backend.");
        //         }
        //     });
        // },




        onGoItemPages: function () {
            var oView = this.getView();
            var oODataModel = oView.getModel("ZSB_CUSTOM_LABEL_HEAD");
            var oScreenModel = this.screenModel;
            var oZlabelModel = oView.getModel("zlabelmodel");
            var oItemDataModel = oView.getModel("TabZlabelItemModel");


            this.getView().byId("idupdate1").setEnabled(false);
            this.getView().byId("save1").setEnabled(true);
            this.getView().byId("tableadd").setEnabled(true);

            if (!oODataModel) {
                sap.m.MessageToast.show("OData model not found!");
                return;
            }

            // Show busy indicator
            sap.ui.core.BusyIndicator.show(0);

            // Get process order input
            var sProcessOrders = oView.byId("idprocessorder1").getValue();
            var oFilter = new sap.ui.model.Filter("ProcessOrder", sap.ui.model.FilterOperator.EQ, sProcessOrders);

            var that = this;

            // --- Read header data ---
            oODataModel.read("/ZCE_ZLABEL_HEADER", {
                filters: [oFilter],
                success: function (oData) {
                    var aResults = oData.results || [];
                    if (aResults.length > 0) {
                        aResults[0].checked_by = that.TENTUSERNAME;

                        // Set header data
                        oZlabelModel.setProperty("/HeaderData/0", aResults[0]);
                        oZlabelModel.updateBindings(true);

                        // Refresh the item table (no backend read)
                        //oItemDataModel.updateBindings(true);
                        const oView = that.getView();

                        const oJSONModel = oView.getModel("TabZlabelItemModel");
                        if (oJSONModel) {
                            oJSONModel.setData({ DatasZitem: [] });
                            oJSONModel.updateBindings(true);
                            console.log("Cleared local table model (TabZlabelItemModel).");
                        }

                        const oODataModel = oView.getModel("ZSB_LABEL_ITEM");
                        if (oODataModel) {
                            oODataModel.refresh(true);
                            console.log("Refreshed backend OData model (ZSB_LABEL_ITEM).");
                        }


                        // Navigate to screen2
                        oScreenModel.setProperty("/openscreen", "screen2");
                    } else {
                        sap.m.MessageToast.show("No matching process orders found.");
                    }
                    sap.ui.core.BusyIndicator.hide();
                },
                error: function () {
                    sap.ui.core.BusyIndicator.hide();
                    sap.m.MessageToast.show("Failed to read header data from backend.");
                }
            });
        },



        showScreen: function (screenName) {
            this.screenModel.setProperty("/openscreen", screenName);
        },



        // OnTableItemAdd: function () {
        //     var oView = this.getView();
        //     var oModel = oView.getModel("TabZcountItemModel");
        //     var tabledata = oModel.getProperty("/DatasZitem") || [];

        //     var headerdata = this.zcountmodel.getProperty("/HeaderData/");
        //     var processorder = headerdata[0]?.ProcessOrder;
        //     var target_qty = headerdata[0]?.target_qty;

        //     if (!processorder) {
        //         sap.m.MessageToast.show("Process Order is not available.");
        //         return;
        //     }

        //     if (target_qty === 0 || target_qty === "0.000" || target_qty === "0.00") {
        //         sap.m.MessageToast.show("Target Qty is not available.");
        //         return;
        //     }

        //     // ✅ If table already has items, calculate boxno and srno from tabledata
        //     if (tabledata.length > 0) {
        //         var lastBoxNo = tabledata.reduce(function (max, item) {
        //             var val = parseInt(item.boxno);
        //             return isNaN(val) ? max : Math.max(max, val);
        //         }, 0);

        //         var lastSrno = tabledata.reduce(function (max, item) {
        //             var val = parseInt(item.srno);
        //             return isNaN(val) ? max : Math.max(max, val);
        //         }, 0);

        //         var newBoxNo = String(lastBoxNo + 1);
        //         var newSrno = String(lastSrno + 1);

        //         var newItem = {
        //             srno: newSrno,
        //             process_order: processorder,
        //             zdate: "",
        //             target_qty: "0.00",
        //             tare_wt: "0.00",
        //             boxno: newBoxNo,
        //             drum_no: "",
        //             avrgwt: "0.00",
        //             qty: "0.00",
        //             qty_lac: "0.00",
        //             tot_lac: "0.00",
        //             netwt: "0.00",
        //             grosswt: "0.00",
        //             capbox: "0.00",
        //             isEditMode: true,
        //             isTareOnlyEditable: false
        //         };

        //         tabledata.push(newItem);
        //         oModel.setProperty("/DatasZitem", tabledata);
        //         oModel.refresh();

        //         console.log("✅ New item added from tabledata:", newItem);
        //     } else {
        //         // ✅ If table is empty, fallback to backend
        //         var oDataModel = oView.getModel("ZSB_ZCOUNT_ITEM");
        //         sap.ui.core.BusyIndicator.show(0);

        //         var processorders = "00" + processorder
        //         oDataModel.read("/ZCE_ZCOUNT_ITEM", {
        //             filters: [
        //                 new sap.ui.model.Filter("process_order", sap.ui.model.FilterOperator.EQ, processorders)
        //             ],
        //             success: function (oData) {
        //                 sap.ui.core.BusyIndicator.hide();

        //                 var backendItems = oData.results || [];

        //                 var lastBoxNo = backendItems.reduce(function (max, item) {
        //                     var val = parseInt(item.boxno);
        //                     return isNaN(val) ? max : Math.max(max, val);
        //                 }, 0);

        //                 var lastSrno = backendItems.reduce(function (max, item) {
        //                     var val = parseInt(item.srno);
        //                     return isNaN(val) ? max : Math.max(max, val);
        //                 }, 0);

        //                 var newBoxNo = String(lastBoxNo + 1);
        //                 var newSrno = String(lastSrno + 1);

        //                 var newItem = {
        //                     srno: newSrno,
        //                     process_order: processorder,
        //                     zdate: "",
        //                     target_qty: "0.00",
        //                     tare_wt: "0.00",
        //                     boxno: newBoxNo,
        //                     drum_no: "",
        //                     avrgwt: "0.00",
        //                     qty: "0.00",
        //                     qty_lac: "0.00",
        //                     tot_lac: "0.00",
        //                     netwt: "0.00",
        //                     grosswt: "0.00",
        //                     capbox: "0.00"
        //                 };

        //                 tabledata.push(newItem);
        //                 oModel.setProperty("/DatasZitem", tabledata);
        //                 oModel.refresh();

        //                 console.log("✅ New item added from backend:", newItem);
        //             },
        //             error: function (oError) {
        //                 sap.ui.core.BusyIndicator.hide();
        //                 sap.m.MessageToast.show("Failed to retrieve backend data.");
        //                 console.error("OData read error:", oError);
        //             }
        //         });
        //     }
        // },






        OnTableItemAdd: function () {
            var oView = this.getView();
            var oModel = oView.getModel("TabZlabelItemModel");
            var tabledata = oModel.getProperty("/DatasZitem") || [];

            var headerdata = this.zlabelmodel.getProperty("/HeaderData/");
            var rawProcessOrder = headerdata[0]?.ProcessOrder; // e.g. "1000120"
            var target_qty = headerdata[0]?.target_qty;

            if (!rawProcessOrder) {
                sap.m.MessageToast.show("Process Order is not available.");
                return;
            }

             if (target_qty === 0 || target_qty === "0.000" || target_qty === "0.00") {
                sap.m.MessageToast.show("Target Qty is not available.");
                return;
            }

            var processOrderFinal = rawProcessOrder.padStart(12, "0").slice(-12);

            if (tabledata.length > 0) {
                // ✅ Calculate from existing tabledata
                var lastBoxNo = tabledata.reduce((max, item) => {
                    var val = parseInt(item.boxno);
                    return isNaN(val) ? max : Math.max(max, val);
                }, 0);

                var lastSrno = tabledata.reduce((max, item) => {
                    var val = parseInt(item.srno);
                    return isNaN(val) ? max : Math.max(max, val);
                }, 0);

                var newItem = {
                    srno: String(lastSrno + 1),
                    process_order: rawProcessOrder, // keep header value for UI
                    zdate: "",
                    target_qty: "0.00",
                    tare_wt: "0.00",
                    boxno: String(lastBoxNo + 1),
                    drum_no: "",
                    avrgwt: "0.00",
                    qty: "0.00",
                    qty_lac: "0.00",
                    tot_lac: "0.00",
                    netwt: "0.00",
                    grosswt: "0.00",
                    capbox: "0.00",
                    isEditMode: true,
                    isTareOnlyEditable: false
                };

                tabledata.push(newItem);
                oModel.setProperty("/DatasZitem", tabledata);
                oModel.refresh();

                console.log("✅ New item added from tabledata:", newItem);
            } else {

                var oDataModel = oView.getModel("ZSB_LABEL_ITEM");
                sap.ui.core.BusyIndicator.show(0);

                var filters = [
                    new sap.ui.model.Filter({
                        filters: [
                            new sap.ui.model.Filter("process_order", sap.ui.model.FilterOperator.EQ, processOrderFinal)
                            // new sap.ui.model.Filter("process_order", sap.ui.model.FilterOperator.EQ, processOrderFinal)
                        ]
                    })
                ];
                var topValue = 5000; // Number of records per request
                // var skipValue = tabledata.length; // Start where the previous set ended
                var skipValue = 0;
                // Fetch data with pagination
                oDataModel.read("/ZLABEL_ITEM_DD", {
                     urlParameters: {
                        "$top": topValue,
                        "$skip": skipValue
                    },
                    filters: filters,
                    success: function (oData) {
                        sap.ui.core.BusyIndicator.hide();

                        var backendItems = oData.results || [];

                        backendItems.forEach(item => {
                            item.process_order = item.process_order.replace(/^0+/, "");
                        });

                        var lastBoxNo = backendItems.reduce((max, item) => {
                            var val = parseInt(item.boxno);
                            return isNaN(val) ? max : Math.max(max, val);
                        }, 0);

                        var lastSrno = backendItems.reduce((max, item) => {
                            var val = parseInt(item.srno);
                            return isNaN(val) ? max : Math.max(max, val);
                        }, 0);

                        // Create a new item from backend data
                        var newItem = {
                            srno: String(lastSrno + 1),
                            process_order: rawProcessOrder, // UI shows header value
                            zdate: "",
                            target_qty: "0.00",
                            tare_wt: "0.00",
                            boxno: String(lastBoxNo + 1),
                            drum_no: "",
                            avrgwt: "0.00",
                            qty: "0.00",
                            qty_lac: "0.00",
                            tot_lac: "0.00",
                            netwt: "0.00",
                            grosswt: "0.00",
                            capbox: "0.00"
                        };

                        tabledata.push(newItem);
                        oModel.setProperty("/DatasZitem", tabledata);
                        oModel.refresh();

                        console.log("✅ New item added from backend:", newItem);
                    },
                    error: function (oError) {
                        sap.ui.core.BusyIndicator.hide();
                        sap.m.MessageToast.show("Failed to retrieve backend data.");
                        console.error("OData read error:", oError);
                    }
                });
            }
        },


        onchangeavgwt: function (oEvent) {
            const headerdata = this.zlabelmodel.getProperty("/HeaderData/");
            const input = oEvent.getSource();
            var context = input.getBindingContext("TabZlabelItemModel");

            if (!context) {
                sap.m.MessageBox.error("No binding context found.");
                return;
            }

            var rowPath = context.getPath();
            const rowData = context.getObject();

            const Zsize = parseInt(headerdata[0].Zsize, 10);
            const MfgOrderPlannedTotalQty = headerdata[0].MfgOrderPlannedTotalQty
            const tarwt = rowData.tare_wt && rowData.tare_wt.trim() !== "" ? parseFloat(rowData.tare_wt) : 0.00;
            const avrgwt = rowData.avrgwt && rowData.avrgwt.trim() !== "" ? parseFloat(rowData.avrgwt) : 0.00;

            const targetQtyMap = {
                0: 0.75,
                11: 0.90,
                10: 1.00,
                1: 1.25,
                2: 1.75,
                3: 2.50,
                4: 3.00
            };

            const validAvgwtRanges = {
                0: [110.70, 127.30],
                11: [96.70, 111.30],
                10: [89.30, 102.30],
                1: [70.70, 81.30],
                2: [58.60, 67.40],
                3: [46.50, 55.00],
                4: [37.20, 42.80]
            };

            let targetQty = targetQtyMap[Zsize] || 0;
            let isValid = false;

            if (validAvgwtRanges[Zsize]) {
                const [min, max] = validAvgwtRanges[Zsize];
                isValid = avrgwt >= min && avrgwt <= max;
            }

            if (isValid && targetQty > 0) {
                let qty = (targetQty * avrgwt) / 10;
                let qty_lac = (qty / avrgwt) * 10;
                let grosswt = qty + tarwt;

                // if(qty <= 0 ){
                //     sap.m.MessageToast.show("Quantity Required to complete this box " + qty)
                // }


                var counted_qty = headerdata[0].counted_qty;
                //const target_qty = rowData.target_qty;
                var updatedcounted_qty = parseFloat(counted_qty) + parseFloat(targetQty)

                console.log("counted_qty:", counted_qty)

                let originalTargetQty = parseFloat(headerdata[0].target_qty) || 0;
                let updatedHeaderTargetQty = originalTargetQty - targetQty;
                if (updatedHeaderTargetQty < 0) {
                    sap.m.MessageBox.error("COUNTED QNTY IS MORE THAN PROCESS ORDER QNTY");
                    var odata = context.getProperty("/DatasZitem");


                    var index = parseInt(rowPath.split("/").pop(), 10);

                    odata.splice(index, 1);


                    return
                }

                this.zlabelmodel.setProperty("/HeaderData/0/counted_qty", updatedcounted_qty.toFixed(2));

                // Set updated target_qty in header
                this.zlabelmodel.setProperty("/HeaderData/0/target_qty", updatedHeaderTargetQty.toFixed(3));


                if (targetQty === qty_lac) {

                    sap.m.MessageToast.show("Target Is Reached ")
                } else if (targetQty < qty_lac) {

                    sap.m.MessageToast.show("More Than Target")

                } else if (targetQty > qty_lac) {

                    sap.m.MessageToast.show("Less Than Target")
                }
                // Update current row
                context.getModel().setProperty(`${rowPath}/target_qty`, targetQty.toFixed(3));
                context.getModel().setProperty(`${rowPath}/qty`, qty.toFixed(3));
                context.getModel().setProperty(`${rowPath}/qty_lac`, qty_lac.toFixed(3));
                context.getModel().setProperty(`${rowPath}/tot_lac`, qty_lac.toFixed(3));
                context.getModel().setProperty(`${rowPath}/netwt`, qty.toFixed(3));
                context.getModel().setProperty(`${rowPath}/grosswt`, grosswt.toFixed(3));
                context.getModel().setProperty(`${rowPath}/capbox`, avrgwt.toFixed(3));



            } else {
                sap.m.MessageBox.error("Put Correct Average Weight.");
                const fields = ["avrgwt", "target_qty", "qty", "qty_lac", "tot_lac", "netwt", "grosswt", "capbox"];
                fields.forEach(field => {
                    context.getModel().setProperty(`${rowPath}/${field}`, "0.000");
                });
            }
        },










        // onchangeavgwt: function (oEvent) {
        //     // Get header and row context
        //     const headerData = this.zcountmodel.getProperty("/HeaderData/");
        //     const input = oEvent.getSource();
        //     const context = input.getBindingContext("TabZcountItemModel");

        //     if (!context) {
        //         sap.m.MessageBox.error("No binding context found.");
        //         return;
        //     }

        //     const rowPath = context.getPath();
        //     const rowData = context.getObject();

        //     // Header fields
        //     const Zsize = parseInt(headerData[0].Zsize, 10);
        //     const plannedTotal =
        //         parseFloat(headerData[0].TOTAL_PLANNED_ORD_QTY ?? headerData[0].MfgOrderPlannedTotalQty) || 0;

        //     // Row inputs
        //     const tarwt = rowData.tare_wt && rowData.tare_wt.trim() !== "" ? parseFloat(rowData.tare_wt) : 0.00;
        //     const avrgwt = rowData.avrgwt && rowData.avrgwt.trim() !== "" ? parseFloat(rowData.avrgwt) : 0.00;

        //     // Maps
        //     const targetQtyMap = {
        //         0: 0.75,
        //         11: 0.90,
        //         10: 1.00,
        //         1: 1.25,
        //         2: 1.75,
        //         3: 2.50,
        //         4: 3.00
        //     };
        //     const validAvgwtRanges = {
        //         0: [110.70, 127.30],
        //         11: [96.70, 111.30],
        //         10: [89.30, 102.30],
        //         1: [70.70, 81.30],
        //         2: [58.60, 67.40],
        //         3: [46.50, 55.00],
        //         4: [37.20, 42.80]
        //     };

        //     // Per-row target quantity from Zsize
        //     const targetQty = targetQtyMap[Zsize] || 0;

        //     // Validate average weight range
        //     const range = validAvgwtRanges[Zsize];
        //     const inRange = !!range && avrgwt >= range[0] && avrgwt <= range[1];

        //     if (!inRange || targetQty <= 0) {
        //         sap.m.MessageBox.error("Put Correct Average Weight.");
        //         const fields = ["avrgwt", "target_qty", "qty", "qty_lac", "tot_lac", "netwt", "grosswt", "capbox"];
        //         fields.forEach(field => {
        //             context.getModel().setProperty(`${rowPath}/${field}`, "0.000");
        //         });
        //         return;
        //     }

        //     // Per-row calculations
        //     const qty = (targetQty * avrgwt) / 10;      // net weight
        //     const qty_lac = (qty / avrgwt) * 10;        // derived per your original formula
        //     const grosswt = qty + tarwt;

        //     // Compute counted quantity from items (authoritative), not from header
        //     const items = context.getModel().getProperty("/DatasZitem") || [];
        //     const countedFromItems = items.reduce((sum, it) => {
        //         const v = parseFloat(it.target_qty);
        //         return sum + (isNaN(v) ? 0 : v);
        //     }, 0);

        //     // Remaining planned vs next increment
        //     const remaining = plannedTotal - countedFromItems;

        //     // Prevent overshoot (with floating-point tolerance)
        //     if (targetQty - remaining > 1e-9) {
        //         sap.m.MessageBox.error("COUNTED QNTY IS MORE THAN PROCESS ORDER QNTY");
        //         // Optional: remove current row if it was appended
        //         if (Array.isArray(items)) {
        //             const index = parseInt(rowPath.split("/").pop(), 10);
        //             if (!isNaN(index)) {
        //                 items.splice(index, 1);
        //                 context.getModel().setProperty("/DatasZitem", items);
        //             }
        //         }
        //         return;
        //     }

        //     // Update current row fields
        //     context.getModel().setProperty(`${rowPath}/target_qty`, targetQty.toFixed(3));
        //     context.getModel().setProperty(`${rowPath}/qty`, qty.toFixed(3));
        //     context.getModel().setProperty(`${rowPath}/qty_lac`, qty_lac.toFixed(3));
        //     context.getModel().setProperty(`${rowPath}/tot_lac`, qty_lac.toFixed(3));
        //     context.getModel().setProperty(`${rowPath}/netwt`, qty.toFixed(3));
        //     context.getModel().setProperty(`${rowPath}/grosswt`, grosswt.toFixed(3));
        //     context.getModel().setProperty(`${rowPath}/capbox`, avrgwt.toFixed(3));

        //     // Recompute totals including this row’s target
        //     const newCounted = countedFromItems + targetQty;
        //     const newRemaining = plannedTotal - newCounted;

        //     // Update header from computed values (do not trust stale header counters)
        //     this.zcountmodel.setProperty("/HeaderData/0/counted_qty", newCounted.toFixed(3));
        //     this.zcountmodel.setProperty("/HeaderData/0/target_qty", newRemaining.toFixed(3));

        //     // Feedback vs per-row target
        //     if (Math.abs(targetQty - qty_lac) < 1e-9) {
        //         sap.m.MessageToast.show("Target Is Reached");
        //     } else if (targetQty < qty_lac) {
        //         sap.m.MessageToast.show("More Than Target");
        //     } else {
        //         sap.m.MessageToast.show("Less Than Target");
        //     }
        // },





        // onchangeavgwt: function (oEvent) {
        //     const headerData = this.zcountmodel.getProperty("/HeaderData/");
        //     const input = oEvent.getSource();
        //     const context = input.getBindingContext("TabZcountItemModel");

        //     if (!context) {
        //         sap.m.MessageBox.error("No binding context found.");
        //         return;
        //     }

        //     const rowPath = context.getPath();
        //     const rowData = context.getObject();

        //     // Header fields
        //     const Zsize = parseInt(headerData[0].Zsize, 10);
        //     const plannedTotal = parseFloat(headerData[0].TOTAL_PLANNED_ORD_QTY || headerData[0].MfgOrderPlannedTotalQty) || 0;

        //     // Row inputs
        //     const tarwt = rowData.tare_wt ? parseFloat(rowData.tare_wt) : 0.00;
        //     const avrgwt = rowData.avrgwt ? parseFloat(rowData.avrgwt) : 0.00;

        //     // Maps
        //     const targetQtyMap = { 0: 0.75, 11: 0.90, 10: 1.00, 1: 1.25, 2: 1.75, 3: 2.50, 4: 3.00 };
        //     const validAvgwtRanges = {
        //         0: [110.70, 127.30], 11: [96.70, 111.30], 10: [89.30, 102.30],
        //         1: [70.70, 81.30], 2: [58.60, 67.40], 3: [46.50, 55.00], 4: [37.20, 42.80]
        //     };

        //     const targetQty = targetQtyMap[Zsize] || 0;
        //     const range = validAvgwtRanges[Zsize];
        //     const inRange = !!range && avrgwt >= range[0] && avrgwt <= range[1];

        //     if (!inRange || targetQty <= 0) {
        //         sap.m.MessageBox.error("Put Correct Average Weight.");
        //         ["avrgwt","target_qty","qty","qty_lac","tot_lac","netwt","grosswt","capbox"].forEach(f => {
        //             context.getModel().setProperty(`${rowPath}/${f}`, "0.000");
        //         });
        //         return;
        //     }

        //     // Per-row calculations
        //     const qty = (targetQty * avrgwt) / 10;
        //     const qty_lac = (qty / avrgwt) * 10;
        //     const grosswt = qty + tarwt;

        //     // Compute counted quantity from items excluding current row
        //     const items = context.getModel().getProperty("/DatasZitem") || [];
        //     const currentIndex = parseInt(rowPath.split("/").pop(), 10);

        //     const countedExcludingCurrent = items.reduce((sum, it, idx) => {
        //         if (idx === currentIndex) return sum; // skip current row
        //         const v = parseFloat(it.target_qty);
        //         return sum + (isNaN(v) ? 0 : v);
        //     }, 0);

        //     const remainingBeforeCurrent = plannedTotal - countedExcludingCurrent;

        //     // Prevent overshoot
        //     if (targetQty > remainingBeforeCurrent) {
        //         sap.m.MessageBox.error("COUNTED QNTY IS MORE THAN PROCESS ORDER QNTY");
        //         return;
        //     }

        //     // Update current row
        //     context.getModel().setProperty(`${rowPath}/target_qty`, targetQty.toFixed(3));
        //     context.getModel().setProperty(`${rowPath}/qty`, qty.toFixed(3));
        //     context.getModel().setProperty(`${rowPath}/qty_lac`, qty_lac.toFixed(3));
        //     context.getModel().setProperty(`${rowPath}/tot_lac`, qty_lac.toFixed(3));
        //     context.getModel().setProperty(`${rowPath}/netwt`, qty.toFixed(3));
        //     context.getModel().setProperty(`${rowPath}/grosswt`, grosswt.toFixed(3));
        //     context.getModel().setProperty(`${rowPath}/capbox`, avrgwt.toFixed(3));

        //     // Recompute totals including this row
        //     const newCounted = countedExcludingCurrent + targetQty;
        //     const newRemaining = plannedTotal - newCounted;

        //     // Sync header
        //     this.zcountmodel.setProperty("/HeaderData/0/counted_qty", newCounted.toFixed(3));
        //     this.zcountmodel.setProperty("/HeaderData/0/target_qty", newRemaining.toFixed(3));

        //     // Feedback + progress
        //     sap.m.MessageToast.show(`Progress: ${newCounted} of ${plannedTotal} completed`);

        //     if (targetQty === qty_lac) {
        //         sap.m.MessageToast.show("Target Is Reached");
        //     } else if (targetQty < qty_lac) {
        //         sap.m.MessageToast.show("More Than Target");
        //     } else {
        //         sap.m.MessageToast.show("Less Than Target");
        //     }
        // },






        onchangeqtywt: function (oEvent) {
            const headerdata = this.zlabelmodel.getProperty("/HeaderData/");
            const input = oEvent.getSource();
            var context = input.getBindingContext("TabZlabelItemModel");

            var rowPath = context.getPath();
            const rowData = context.getObject();

            // Parsing the average weight and quantity weight
            const avrgwt = rowData.avrgwt && rowData.avrgwt.trim() !== "" ? parseFloat(rowData.avrgwt) : 0.00;
            const qtywt = rowData.qty && rowData.qty.trim() !== "" ? parseFloat(rowData.qty) : 0.00;
            const qty_lac = rowData.qty_lac && rowData.qty_lac.trim() !== "" ? parseFloat(rowData.qty_lac) : 0.00;
            const tarwt = rowData.tare_wt && rowData.tare_wt.trim() !== "" ? parseFloat(rowData.tare_wt) : 0.00;

            // Calculate the qtys value: (qtywt / avrgwt) * 10
            let qtys = (qtywt / avrgwt) * 10;
            let grosswts = qtywt + tarwt;

            // Set the property on the model with the calculated value, formatted to 3 decimal places
            context.getModel().setProperty(`${rowPath}/qty_lac`, qtys.toFixed(3));
            context.getModel().setProperty(`${rowPath}/netwt`, qtywt.toFixed(3));
            context.getModel().setProperty(`${rowPath}/grosswt`, grosswts.toFixed(3));
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

        // For Table Item remove
        // OnRowDelete: function (oEvent) {

        //     var del = this.selectedData;
        //     debugger
        //     var mod = this.getView().getModel("TabZcountItemModel");
        //     var data = mod.getProperty("/DatasZitem");

        //     for (var i = 0; i < data.length; i++) {
        //         for (var j = 0; j < del.length; j++) {

        //             if (data[i] === del[j]) {
        //                 data.splice(i, 1);
        //                 this.count = this.count - 1;
        //                 mod.setProperty("/DatasZitem", data);
        //                 mod.refresh();
        //             }
        //         }

        //     }

        // },

        OnRowDelete: function (oEvent) {
            const del = this.selectedData;
            const mod = this.getView().getModel("TabZlabelItemModel");
            const headerModel = this.zlabelmodel;
            const headerData = headerModel.getProperty("/HeaderData/");
            let data = mod.getProperty("/DatasZitem");

            let totalDeletedTargetQty = 0;

            // Loop through selected items and remove them from data
            for (let j = 0; j < del.length; j++) {
                const deletedItem = del[j];

                for (let i = 0; i < data.length; i++) {
                    if (data[i] === deletedItem) {
                        const itemTargetQty = parseFloat(data[i].target_qty) || 0;
                        totalDeletedTargetQty += itemTargetQty;

                        data.splice(i, 1);
                        this.count = this.count - 1;
                        break; // Exit inner loop once item is found and removed
                    }
                }
            }

            // Update table model
            mod.setProperty("/DatasZitem", data);
            mod.refresh();

            // Update header counted_qty and target_qty
            const currentCountedQty = parseFloat(headerData[0].counted_qty) || 0;
            const currentTargetQty = parseFloat(headerData[0].target_qty) || 0;

            const updatedCountedQty = currentCountedQty - totalDeletedTargetQty;
            const updatedTargetQty = currentTargetQty + totalDeletedTargetQty;

            headerModel.setProperty("/HeaderData/0/counted_qty", updatedCountedQty.toFixed(3));
            headerModel.setProperty("/HeaderData/0/target_qty", updatedTargetQty.toFixed(3));
        },



        //     onPrint: async function () {
        //         const Box1 = this.getView().byId("Box1").getValue();
        //         const Box2 = this.getView().byId("Box2").getValue();

        //         if (!Box1 || !Box2) {
        //             sap.m.MessageBox.warning("Please enter both Box1 and Box2.");
        //             return;
        //         }

        //         if (Box1=== Box2) {
        //             // Box1 = 0;
        //             // this.getView().byId("Box1").setValue("0");  // Update UI input field
        //             //             // ✅ Get the ODataModel (replace "zcount" if your model has a different name)

        //         const oModel = this.getView().getModel("ZCE_ZCOUNT_FORM_SRVB"); // or getModel("zcount") if named

        //         if (!oModel || typeof oModel.read !== "function") {
        //             console.error("OData model is undefined or invalid.");
        //             sap.m.MessageBox.error("OData model is not available.");
        //             return;
        //         }

        //         const filters = [
        //             new sap.ui.model.Filter("boxno", sap.ui.model.FilterOperator.EQ,Box2)
        //         ];



        //         oModel.read("/ZCE_ZCOUNT_FORM", {
        //             filters: filters,
        //             success: async function (oData) {
        //                 const results = oData.results;

        //                 if (!results || results.length === 0) {
        //                     sap.m.MessageBox.information("No data found for the given box range.");
        //                     return;
        //                 }

        //                 // this.getView().getModel("TabZcountItemModel").setData({ DatasZitem: results });

        //                 // Now generate PDF from filtered data
        //                 await this._generatePDF(results);
        //             }.bind(this), // ✅ Ensure `this` points to the controller
        //             error: function (err) {
        //                 console.error("Error fetching data:", err);
        //                 sap.m.MessageBox.error("Failed to fetch box data from server.");
        //             }
        //         });

        //          try {
        //     // Fetch main data
        //     const formData = await new Promise((resolve, reject) => {
        //         oModel.read("/ZCE_ZCOUNT_FORM", {
        //             filters: filters,
        //             success: resolve,
        //             error: reject
        //         });
        //     });

        //     // Fetch item data to calculate qty_lac total
        //     const itemModel = this.getView().getModel("ZCE_ZCOUNT_HEAD_SAVE_SRVB");

        //     const itemData = await new Promise((resolve, reject) => {
        //         itemModel.read("/item", {
        //             filters: filters,
        //             success: resolve,
        //             error: reject
        //         });
        //     });

        //     const items = itemData.results;
        //     const totalQtyLac = items.reduce((sum, item) => sum + parseFloat(item.qty_lac || 0), 0);

        //     const results = formData.results;

        //     if (!results || results.length === 0) {
        //         sap.m.MessageBox.information("No data found for the given box range.");
        //         return;
        //     }

        //     // ✅ Now pass totalQtyLac to _generatePDF
        //     await this._generatePDF(results, totalQtyLac);

        // } catch (err) {
        //     console.error("Error fetching data:", err);
        //     sap.m.MessageBox.error("Failed to fetch data from server.");
        // }

        //         }

        //         // ✅ Get the ODataModel (replace "zcount" if your model has a different name)
        //         const oModel = this.getView().getModel("ZCE_ZCOUNT_FORM_SRVB"); // or getModel("zcount") if named

        //         if (!oModel || typeof oModel.read !== "function") {
        //             console.error("OData model is undefined or invalid.");
        //             sap.m.MessageBox.error("OData model is not available.");
        //             return;
        //         }

        //         const filters = [
        //             new sap.ui.model.Filter("boxno", sap.ui.model.FilterOperator.BT, Box1, Box2)
        //         ];

        //         oModel.read("/ZCE_ZCOUNT_FORM", {
        //             filters: filters,
        //             success: async function (oData) {
        //                 const results = oData.results;

        //                 if (!results || results.length === 0) {
        //                     sap.m.MessageBox.information("No data found for the given box range.");
        //                     return;
        //                 }

        //                 // this.getView().getModel("TabZcountItemModel").setData({ DatasZitem: results });

        //                 // Now generate PDF from filtered data
        //                 await this._generatePDF(results);
        //             }.bind(this), // ✅ Ensure `this` points to the controller
        //             error: function (err) {
        //                 console.error("Error fetching data:", err);
        //                 sap.m.MessageBox.error("Failed to fetch box data from server.");
        //             }
        //         });
        //     },

        onPrint: async function () {
            const Box1 = this.getView().byId("Box1_").getValue();
            const Box2 = this.getView().byId("Box2_").getValue();
            const sProcessOrders = this.getView().byId("idprocessorder1").getValue();

            if (!Box1 || !Box2) {
                sap.m.MessageBox.warning("Please enter both Box1 and Box2.");
                return;
            }

            const oModel = this.getView().getModel("ZCE_ZLABEL_FORM_SRVB");
            const itemModel = this.getView().getModel("ZSB_CUSTOM_LABEL_HEAD");

            if (!oModel || typeof oModel.read !== "function" || !itemModel || typeof itemModel.read !== "function") {
                console.error("OData models are undefined or invalid.");
                sap.m.MessageBox.error("OData model is not available.");
                return;
            }

            const aFilters = [];


            // var processOrderLegacy = "00" + sProcessOrders;
            // var processOrderFinal = sProcessOrders.padStart(12, "0").slice(-12);

            //  Create each filter separately
            const oFilterBox = new sap.ui.model.Filter("boxno", sap.ui.model.FilterOperator.BT, Box1, Box2);
            var oFilterProcessOrder = new sap.ui.model.Filter("ProcessOrder", sap.ui.model.FilterOperator.EQ, sProcessOrders);


            // Push filters into array
            aFilters.push(oFilterBox);
            aFilters.push(oFilterProcessOrder);


            try {
                // Fetch header data
                const formData = await new Promise((resolve, reject) => {
                    oModel.read("/ZCE_ZLABEL_FORM", {
                        filters: aFilters,
                        success: resolve,
                        error: reject
                    });
                });

                // Fetch item data for qty_lac sum
                const itemData = await new Promise((resolve, reject) => {
                    oModel.read("/ZCE_ZLABEL_FORM", {
                        filters: aFilters,
                        success: resolve,
                        error: reject
                    });
                });

                const items = itemData.results || [];
                const totalQtyLac = items.reduce((sum, item) => sum + parseFloat(item.qty_lac || 0), 0);

                const results = formData.results || [];

                if (results.length === 0) {
                    sap.m.MessageBox.information("No data found for the given box range.");
                    return;
                }

                // Pass the total qty_lac to PDF generator
                await this._generatePDF(results, totalQtyLac);
                this.getView().byId("Box1_").setValue("");
                this.getView().byId("Box2_").setValue("");


            } catch (err) {
                console.error("Error fetching data:", err);
                sap.m.MessageBox.error("Failed to fetch data from server.");
            }
        },


        //   _generatePDF: async function (dataArray) {
        //     let getHeaderData = this.zcountmodel.getProperty("/HeaderData/");
        //     let zsize = getHeaderData[0].Zsize;
        //     let bodyprinting = getHeaderData[0].bodyprinting
        //     let capprinting = getHeaderData[0].capprinting
        //     let SalesOrder = getHeaderData[0].SalesOrder
        //     console.log("Ino",getHeaderData)

        //     const { jsPDF } = window.jspdf;
        //     const that = this;

        //     const loadImageAsBase64 = async (url) => {
        //         const response = await fetch(url);
        //         const blob = await response.blob();
        //         return new Promise((resolve, reject) => {
        //             const reader = new FileReader();
        //             reader.onloadend = () => resolve(reader.result);
        //             reader.onerror = reject;
        //             reader.readAsDataURL(blob);
        //         });
        //     };

        //     const logoBase64_ = await loadImageAsBase64(sap.ui.require.toUrl("zautodesignapp/images/NCLH.png"));
        //     const logoBase64__ = await loadImageAsBase64(sap.ui.require.toUrl("zautodesignapp/images/VGcap.png"));
        //     const logoBase64___ = await loadImageAsBase64(sap.ui.require.toUrl("zautodesignapp/images/TABLETH.png"));
        //     const logoBase64____ = await loadImageAsBase64(sap.ui.require.toUrl("zautodesignapp/images/BOXH.png"));
        //     const logoBase64_____ = await loadImageAsBase64(sap.ui.require.toUrl("zautodesignapp/images/QASeal.png"));

        //     const doc = new jsPDF('p', 'mm', [210, 297]); // A4 portrait
        //     const promises = [];

        //     for (let i = 0; i < dataArray.length; i++) {
        //         const entry = dataArray[i];

        //         entry.Batch = String(entry.Batch).replace(/^00/, '');
        //         console.log("entry", entry);


        //         const htmlContent = this._generatePDFContent(entry, logoBase64_,logoBase64__,logoBase64___,logoBase64____,logoBase64_____,zsize,bodyprinting,capprinting,SalesOrder);

        //         promises.push(new Promise((resolve, reject) => {
        //             const iframe = document.createElement('iframe');
        //             iframe.style.position = 'fixed';
        //             iframe.style.top = '-100000px';
        //             document.body.appendChild(iframe);

        //             const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        //             iframeDoc.open();
        //             iframeDoc.write(htmlContent);
        //             iframeDoc.close();

        //             iframe.onload = () => {
        //                 html2canvas(iframeDoc.body, { scale: 4 }).then(canvas => {
        //                     const imgData = canvas.toDataURL('image/jpeg', 0.7);
        //                     if (i > 0) {
        //                         doc.addPage();
        //                     }
        //                     doc.addImage(imgData, 'JPEG', 0, 0, 210, 297);
        //                     document.body.removeChild(iframe);
        //                     resolve();
        //                 }).catch(err => {
        //                     document.body.removeChild(iframe);
        //                     reject(err);
        //                 });
        //             };
        //         }));
        //     }

        //     await Promise.all(promises);

        //     const blob = doc.output('blob');
        //     const pdfUrl = URL.createObjectURL(blob);
        //     window.open(pdfUrl, "Zcount");

        //     // that._PDFViewer.setSource(pdfUrl);
        //     // that._PDFViewer.open();

        // },

        _generatePDF: async function (dataArray, totalQtyLac) {
            let getHeaderData = this.zlabelmodel.getProperty("/HeaderData/");

            let zsize = getHeaderData[0].Zsize;
            let bodyprinting = getHeaderData[0].bodyprinting;
            let capprinting = getHeaderData[0].capprinting;
            let SalesOrder = getHeaderData[0].SalesOrder;

            const { jsPDF } = window.jspdf;
            const that = this;

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

            const logoBase64_ = await loadImageAsBase64(sap.ui.require.toUrl("zautodesignapp/images/NCLH.png"));
            const logoBase64__ = await loadImageAsBase64(sap.ui.require.toUrl("zautodesignapp/images/VGcap.png"));
            const logoBase64___ = await loadImageAsBase64(sap.ui.require.toUrl("zautodesignapp/images/TABLETH.png"));
            const logoBase64____ = await loadImageAsBase64(sap.ui.require.toUrl("zautodesignapp/images/BOXH.png"));
            const logoBase64_____ = await loadImageAsBase64(sap.ui.require.toUrl("zautodesignapp/images/QASeal.png"));

            const doc = new jsPDF('p', 'mm', [210, 297]);
            const promises = [];

            for (let i = 0; i < dataArray.length; i++) {
                const entry = dataArray[i];

                // Assign totalQtyLac to the Qty field
                entry.Batch = String(entry.Batch).replace(/^00/, '');
                // entry.Qty = totalQtyLac.toFixed(3); // This will appear in the PDF under Quantity

               // let QTYS = Math.floor(Number(entry.Qty));
               let QTYS = Number(entry.Qty).toFixed(3)
                 let finalValue = Number(QTYS) * 100000;


                const htmlContent = this._generatePDFContent(
                    entry,
                    finalValue,
                    logoBase64_,
                    logoBase64__,
                    logoBase64___,
                    logoBase64____,
                    logoBase64_____,
                    zsize,
                    bodyprinting,
                    capprinting,
                    SalesOrder
                );

                promises.push(new Promise((resolve, reject) => {
                    const iframe = document.createElement('iframe');
                    iframe.style.position = 'fixed';
                    iframe.style.top = '-100000px';
                    document.body.appendChild(iframe);

                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    iframeDoc.open();
                    iframeDoc.write(htmlContent);
                    iframeDoc.close();

                    iframe.onload = () => {
                        html2canvas(iframeDoc.body, { scale: 4 }).then(canvas => {
                            const imgData = canvas.toDataURL('image/jpeg', 0.7);
                            if (i > 0) {
                                doc.addPage();
                            }
                            doc.addImage(imgData, 'JPEG', 0, 0, 210, 297);
                            document.body.removeChild(iframe);
                            resolve();
                        }).catch(err => {
                            document.body.removeChild(iframe);
                            reject(err);
                        });
                    };
                }));
            }

            await Promise.all(promises);

            const blob = doc.output('blob');
            const pdfUrl = URL.createObjectURL(blob);
            window.open(pdfUrl, "ZLabel");
        },

        //         _generatePDFContent: function (entry, logoBase64_,logoBase64__,logoBase64___,logoBase64____,logoBase64_____,zsize,bodyprinting,capprinting,SalesOrder) {
        //             return `
        //      <!DOCTYPE html> <html lang="en"> <head> <meta charset="UTF-8"> <meta name="viewport" content= "width=device-width, initial-scale=1.0"> <style> body { font-family: Arial, sans-serif; margin: 0; padding: 0; }.table-container {  padding-left: 10px;width: 520px; display: flex; margin: -10px; height: 350;} .table { border-collapse: collapse; width: 580px; height: 258px; margin-top: 20px; }th, td { border: 1px solid black; padding: 5px; text-align: left; border-right:1px solid white; font-size:10px; } .box {
        //   width: 410px;        /* Increased from 300px */
        //   height: 20px;        /* Increased from 12px */
        //   border: 1px solid black; /* Thicker border for visibility */
        //   padding-top: 0px;    
        //   padding: 12px;       /* Added more padding for spacing */
        //   margin: 52px auto;   /* Centers the box horizontally */
        //   text-align: center;  /* Centers text inside */
        //   font-size: 20px;     /* Slightly larger text */

        // }

        // /* Remove TOP border of all cells in the first row of every table */
        // .table tr:first-child td {
        //   border-top: none !important;
        // }

        // /* Remove left border of the first column of the first table */
        // .table-container table:first-of-type td:first-child {
        //   border-left: none !important;
        // }

        // /* Remove right border of the last column of the second table */
        // .table-container table:last-of-type td:last-child {
        //   border-right: none !important;
        // }

        // .box1 { border-top: 100px solid white; padding: 0; margin: 0; } .to-address { margin-left: 15px; font-size: 14px; text-align: left; line-height: 1.3;   margin-top: -85px;} .to-address .line { margin: 2px 0; } body { font-family: Arial, sans-serif; margin: 0; padding: 0; } .label { width: 500px; height: 700px; border: 6px solid white; margin: 20px auto; position: relative; padding: 10px; } .header { text-align: center; border-bottom: 2px solid white; padding-bottom: 0px; } .header h1 { margin: 0; font-size: 18px; color: white; } .header p { margin: 2px 0; font-size: 11px; } .title { text-align: center; font-weight: bold; font-size: 20px; margin: 10px 0; } .note { font-size: 10px; margin-top: 10px; color: black; text-align: justify; border-bottom: 2px solid white; } .image { font-size: 10px; margin-top: 10px; color: black; } .image-section { text-align: center; margin: 15px 0; } .image-section img { max-width: 200px; height: auto; } .address { font-size: 10px; margin-top: 10px; color: black; text-align: center; } .footer { position: absolute; bottom: 10px; left: 10px; right: 10px; justify-content: space-between; font-size: 10px; text-align: center; padding-bottom: 5px; } .flex-container { display: flex; align-items: center; gap: 45px; }   .container3 {
        //     display: flex;
        //     align-items: flex-start;
        //     gap: 20px;
        //     margin-right:50px;
        //   }
        //   .image-box img {
        //     max-width: 100px;
        //     height: auto;
        //   }
        //   .image1 {
        //     position: absolute;
        //     top: 60px;
        //     left: 200px;
        //     width: 50px;
        //     height: 50px;
        //     margin-left:260px;
        //     margin-top:-22px;
        //     }
        // .centered {
        //   position: absolute;
        //   top: 498px;
        //   left: 420px;
        //   font-size:30px;
        //   transform: translate(-50%, -50%);
        // }
        // .centered1 {
        //   position: absolute;
        //   top: 498px;
        //   left: 90px;
        //   transform: translate(-50%, -50%);
        // }
        // .centered2 {
        //   position: absolute;
        //   top: 498px;
        //   left: 200px;
        //   transform: translate(-50%, -50%);
        // }
        //   .text-box .line {
        //     margin-bottom: 5px;
        //   }.flex-container1 { display: flex; align-items: center; gap: 0px; padding-top:50px;  margin-top: 300px;  } </style> </head> <body> <br><br><br><br><br><br><br><div class="label"> <!-- Header --> <div class="table-container">
        // <table class="table"> <tr> <td><strong>D.L.No</strong></td> <td style="border-left: none;">: ${entry.dlno||""}</td> </tr>
        // <tr> <td><strong>BATCH NO.</strong></td> <td style="border-left: none;">: ${entry.Batch||""}</td> </tr>
        // <tr> <td><strong>DATE OF MFG.</strong></td> <td style="border-left: none;">: ${entry.DOM||""}</td> </tr> <tr> <td ><strong>DATE OF EXP.</strong></td>
        // <td style="border-left: none;">: ${entry.DOE||""}</td> </tr> <tr> <td><strong>CAP COLOUR.</strong></td>
        // <td style="border-left: none;">:${entry.cap_colour||""}</td> </tr> <tr> <td><strong>BODY COLOUR.</strong></td>
        // <td style="border-left: none;">: ${entry.body_colour||""}</td> </tr> <tr> <td><strong>CUST MAT CODE</strong></td>
        // <td style="border-left: none;">: N.A</td> </tr> </table> <table class="table"> <tr> <td style="padding:3px"><strong>QUANTITY.</strong></td>
        // <td style="border-right: 1px solid black;border-bottom: none;padding:5.5px;border-left: none;">: ${entry.Qty||""}&nbsp; nos</td> </tr> <tr> <td><strong>NET WT.</strong></td>
        // <td style="border-right: 1px solid black;border-left: none;padding:6px">: ${entry.netwt||""}&nbsp; Kgs</td> </tr> <tr> <td><strong>GROSS WT.</strong></td>
        // <td style="border-right: 1px solid black;border-left: none;padding:6px">: ${entry.grosswt||""}&nbsp; Kgs</td> </tr> <tr>
        // <td style="padding:2.5px"><strong>CAP PRINT MSG</strong></td> <td style="border-right: 1px solid black;border-left: none;padding:5.8px">: ${entry.capprinting||""}</td></tr>
        // <tr> <td style="padding:6px"><strong>BODY PRINT MSG</strong></td> <td style="border-right: 1px solid black;border-left: none;">: ${entry.bodyprinting||""}</td></tr>
        // <tr> <td style="padding:5.8px;"><strong>PO NUMBER</strong></td> <td style="border-right: 1px solid black;border-left: none;"> : ${entry.purchase_order||""} </td> </tr>
        // <tr> <td style="padding:5.8px;"><strong>INVOICE NO.</strong></td> <td style="border-right: 1px solid black;border-left: none;">: ${SalesOrder||""}</td> </tr> </table></div>
        // <div class="box"><strong>BOX NO : ${entry.boxno}/${entry.Batch||""}</strong> <div class="flex-container1"> <div class="centered1">${(entry.cap_colour || "") .replace(/['":]/g, "").split("(")[0].trim()}

        // </div><div class="centered2">${(entry.body_colour || "") .replace(/['":]/g, "").split("(")[0].trim()}</div> <div class="centered">${entry.zsize}</div>  </div></div> <br> <div class="header"> </div>
        // <div class="box1"><div class="to-address">
        // <div class="line"><br><br><br><br><br><br><br><br> <b>TO,</b></div> <div class="container3"><strong>${(entry.CustomerFullName || "").slice(0, entry.CustomerFullName.length)}</strong></div>
        // <div class="container3"> PO Box No.${entry.po_box||""} ${entry.CityName||""}, ${entry.Region||""}, ${entry.PostalCode||""} ${entry.Countryname}
        // </div></div> </div> </div> </body> </html>


        //     `;
        //         },

        _generatePDFContent: function (
            entry,
            finalValue,
            logoBase64_,
            logoBase64__,
            logoBase64___,
            logoBase64____,
            logoBase64_____,
            zsize,
            bodyprinting,
            capprinting,
            SalesOrder
        ) {
      

         return `
           <!DOCTYPE html>
<html lang="en">
   <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
         body {
         font-family: Courier, 'Courier New', monospace;
         margin: 10px;
         padding: 0;
         color: #000000; /* force black */
         }
         
         
/* Wrapper for two tables */
.table-wrapper {
    width: 530px;
    display: flex;
}
 
/* Both tables share same layout */
.table {
    border-collapse: collapse;
    width: 50%;
}
 
/* Base cell style */
.table td {
    padding: 6px 2px;
    font-size: 14px;
    font-weight: bold;
    color: #000000; /* force black */ 
    border-bottom: 3px solid #000000;
 
    /* Remove all vertical lines inside tables */
    border-left: none !important;
    border-right: none !important;
 
    /* Thick horizontal lines */
    border-bottom: 3px solid black;
}
 
/* Remove top border */
.table tr:first-child td {
    border-top: none !important;
}
 
/* Keep last horizontal border */
.table tr:last-child td {
    border-bottom: 3px solid black !important;
}
 
/* Remove outermost left/right borders of the two tables */
.table-left td:first-child {
    border-left: none !important;
}
.table-right td:last-child {
    border-right: none !important;
}
 
/* ----------- Center vertical line between the two tables ----------- */
.table-wrapper {
    position: relative;
}
 
/* Using pseudo element to create center vertical line */
.table-wrapper::before {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;   /* center of wrapper */
    border-left: 2px solid black;  /* vertical line between tables */
}
         .table-container { padding-left: 4px; width: 550px; display: flex; margin: -30px; height: 350px; }
         .table { border-collapse: collapse; width: 690px; height: 258px; margin-top: 0px; }
        th, td {
        height: 30px;
   border: 1.5px solid black;
   padding: 0px;        /* optional: add a little more spacing */
   text-align: left;
   border-right:1px solid white;
   font-size:13px;      /* increased from 10px */
   font-weight: bold;
   color: #000000; /* force black */
    border: 1.5px solid #000000;
}
         .box {
         width: 450px;
         height: 20px;
         border: 3px solid black;
         padding: 12px;
         margin: 10px auto 2px auto;
         text-align: center;
         font-size: 20px;
         font-weight: bold;
         color: #000000; 
         border: 3px solid #000000;
         }
         .table tr:first-child td { border-top: none !important; }
         .table-container table:first-of-type td:first-child { border-left: none !important; }
         .table-container table:last-of-type td:last-child { border-right: none !important; }
         .box1 { border-top: 98px solid white; padding: 0; margin: 0; }
         .to-address { margin-left: 15px; font-size: 14px; text-align: left; line-height: 1.3; margin-top: 5px; }
         .to-address .line { margin: 2px 0; font-weight: bold; }
         .label {
         width: 500px;
         height: 700px;
         border: 6px solid white;
         margin: 20px auto;
         position: relative;
         padding: 10px;
         }
         .header { text-align: center; border-bottom: 2px solid white; padding-bottom: 0px; }
         .header h1 { margin: 0; font-size: 18px; color: white;  color: #000000;}
         .header p { margin: 2px 0; font-size: 11px; }
         .title { text-align: center; font-weight: bold; font-size: 20px; margin: 10px 0; }
         .note, .image, .address { font-size: 10px; margin-top: 10px; color: black; text-align: justify; border-bottom: 2px solid white; }
         .image-section { text-align: center; margin: 15px 0; }
         .image-section img { max-width: 200px; height: auto; }
         .footer { position: absolute; bottom: 10px; left: 10px; right: 10px; justify-content: space-between; font-size: 10px; text-align: center; padding-bottom: 5px; }
         .flex-container { display: flex; align-items: center; gap: 45px; }
         .container3 { display: flex; align-items: flex-start; gap: 20px; margin-right: 50px; font-weight: bold; }
         .image-box img { max-width: 100px; height: auto; }
         .image1 { position: absolute; top: 60px; left: 200px; width: 50px; height: 50px; margin-left: 260px; margin-top: -22px; }
         .centered { position: absolute; top: 528px; left: 420px; font-size: 50px; transform: translate(-50%, -50%); font-weight: bold; }
         .centered1 { position: absolute; top: 528px; left: 90px; transform: translate(-50%, -50%); font-weight: bold; }
         .centered2 { position: absolute; top: 528px; left: 210px; transform: translate(-50%, -50%); font-weight: bold; }
         .text-box .line { margin-bottom: 5px; }
         .flex-container1 { display: flex; align-items: center; gap: 0px; padding-top: 50px; margin-top: 300px; }
         @media print { body, td, th, div, span, p { color: #000000 !important; font-weight: bold !important; opacity: 1 !important; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      </style>
   </head>
   <body>
      <br><br><br><br><br><br><br>
      <div class="label">
 
<div class="table-wrapper">
 
    <!-- LEFT TABLE -->
    <table class="table table-left">
        <tr>
            <td>D.L.No</td>
            <td>: ${entry.dlno || ""}</td>
        </tr>
        <tr>
            <td>BATCH NO.</td>
            <td>:${entry.Batch || ""}</td>
        </tr>
        <tr>
            <td>DATE OF MFG.</td>
            <td>:${entry.DOM || ""}</td>
        </tr>
        <tr>
            <td>DATE OF EXP.</td>
            <td>:${entry.DOE || ""}</td>
        </tr>
        <tr>
            <td>CAP COLOUR.</td>
            <td>:${entry.cap_colour || ""}</td>
        </tr>
        <tr>
            <td>BODY COLOUR.</td>
            <td>:${entry.body_colour || ""}</td>
        </tr>
        <tr>
            <td>CUST MAT CODE</td>
            <td>: N.A</td>
        </tr>
    </table>
 
    <!-- RIGHT TABLE -->
    <table class="table table-right">
        <tr>
            <td>QUANTITY.</td>
            <td>:${finalValue || ""} nos</td>
        </tr>
        <tr>
            <td>NET WT.</td>
            <td>:${entry.netwt || ""} Kgs</td>
        </tr>
        <tr>
            <td>GROSS WT.</td>
            <td>: ${entry.grosswt || ""} Kgs</td>
        </tr>
        <tr>
            <td>CAP PRINT MSG</td>
            <td>: ${entry.capprinting || ""}</td>
        </tr>
        <tr>
            <td>BODY PRINT MSG</td>
            <td>: ${entry.bodyprinting || ""}</td>
        </tr>
        <tr>
            <td>PO NUMBER</td>
            <td>: ${entry.purchase_order || ""}</td>
        </tr>
        <tr>
            <td>INVOICE NO.</td>
            <td>: </td>
        </tr>
    </table>
 
</div>
 
         <div class="box">
            BOX NO : ${entry.boxno}/${entry.Batch || ""}
            <div class="flex-container1">
               <div class="centered1">${(entry.cap_colour || "").replace(/['":]/g, "").split("(")[0].trim()}</div>
               <div class="centered2">${(entry.body_colour || "").replace(/['":]/g, "").split("(")[0].trim()}</div>
               <div class="centered">${entry.zsize}</div>
            </div>
         </div>
         <div class="box1">
            <div class="to-address">
               <div class="line"><br><br><br><br><br><br><br><br>TO,</div>
               <div class="container3">${(entry.CustomerFullName || "")}</div>
               <div class="container3">
                  PO Box No.${entry.po_box || ""} ${entry.CityName || ""}, ${entry.Region || ""}, ${entry.PostalCode || ""} ${entry.Countryname || ""}
               </div>
            </div>
         </div>
      </div>
   </body>
</html>
`;
        },




        onSaveLabel: async function () {
            var that = this;

            sap.m.MessageBox.warning("Do you want to submit this data?", {
                actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
                emphasizedAction: sap.m.MessageBox.Action.YES,
                onClose: async function (sAction) {
                    if (sAction !== sap.m.MessageBox.Action.YES) {
                        sap.m.MessageToast.show("Submission cancelled.");
                        return;
                    }

                    sap.ui.core.BusyIndicator.show(0);

                    try {
                        // --- 1. Fetch data from models ---
                        const getHeaderData = that.zlabelmodel.getProperty("/HeaderData/");
                        // const getItemData = that.TabZcountItemModel.getProperty("/DatasZitem");

                        const oItemModel = that.getView().getModel("TabZlabelItemModel");
                        const getItemData = oItemModel ? oItemModel.getProperty("/DatasZitem") : [];
                        const headerdata = that.getView().getModel("ZSB_LABEL_HEADER");
                        const itemdata = that.getView().getModel("ZSB_LABEL_ITEM");

                        if (!getHeaderData || getHeaderData.length === 0) {
                            sap.m.MessageBox.error("No header data found.");
                            return;
                        }

                        if (!getItemData || getItemData.length === 0) {
                            sap.m.MessageBox.error("No item data to save.");
                            return;
                        }

                        // --- 2. Validate mandatory item fields ---
                        const missingIndex = getItemData.findIndex(item =>
                            !item.zdate || !item.tare_wt || !item.drum_no ||
                            !item.avrgwt || !item.qty || !item.packedby || !item.verified_by
                        );

                        if (missingIndex !== -1) {
                            sap.m.MessageBox.warning(
                                `Mandatory fields missing at row ${missingIndex + 1}: 
                        zdate, tare_wt, drum_no, avrgwt, qty, packedby, verified_by.`
                            );
                            return;
                        }

                        console.log("Header Data:", getHeaderData);

                        const header = getHeaderData[0];
                        const sap_uuid = header.sap_uuid;

                        const rawProcessOrder = header.ProcessOrder ? header.ProcessOrder.toString() : "";
                        
                        const processOrderFinal = rawProcessOrder.padStart(12, "0").slice(-12);  // max length 12
                        
                        const batchFinal = header.Batch

                        const generatedUUID = rawProcessOrder + batchFinal

                        // --- 3. Prepare header payload ---
                        let oHeaderEntry = {};

                        if (!sap_uuid) {
                            // --- Create new header ---
                            oHeaderEntry = {

                                sap_uuid : generatedUUID,
                                id: generatedUUID,
                                batch:batchFinal,
                                process_order: processOrderFinal,
                                salesorder: header.SalesOrder,
                                plant: header.plant,
                                customername: header.CustomerName,
                                itemgrossweight: header.ItemGrossWeight || "0.000",
                                uom: "",
                                salesorderitem: header.salesorderitem,
                                material: header.Product,
                                salesorderitemtext: header.salesorderitemtext,
                                capprinting: header.capprinting,
                                bodyprinting: header.bodyprinting,
                                acmno: header.ACMNO,
                                boxno: "",
                                total_planned_ord_qty: header.MfgOrderPlannedTotalQty,
                                counted_qty: header.counted_qty,
                                target_qty: header.target_qty,
                                zsize: header.Zsize,
                                remarks: header.remarks,
                                capbox: "0.00",
                                zcount: 0,
                                customer: header.Customer,
                                productdescription: header.ProductDescription,
                                status: "open",
                                headerstatus: "open",
                                createdat: new Date(),
                                createdby: that.TENTUSERID,
                                updatedat: new Date(),
                                updatedby: that.TENTUSERID,
                                screencode: "AU910",
                                checked_by: header.checked_by,
                                verified_by: header.verified_by || header.verfied_by
                            };

                            console.log("Creating new header:", oHeaderEntry);

                            await new Promise((resolve, reject) => {
                                headerdata.create("/ZLABEL_HEADER_DD", oHeaderEntry, {
                                    success: function (oDATA) {
                                        console.log("Header created:", oDATA);
                                        resolve(oDATA);
                                    },
                                    error: function (error) {
                                        console.error("Header creation failed:", error);
                                        reject(error);
                                    }
                                });
                            });
                        }
                        // else {
                        //     // --- Update existing header ---
                        //     oHeaderEntry = {
                        //         total_planned_ord_qty: header.MfgOrderPlannedTotalQty,
                        //         counted_qty: header.counted_qty,
                        //         target_qty: header.target_qty,
                        //         updatedat: new Date(),
                        //         updatedby: that.TENTUSERID
                        //     };

                        //     console.log("Updating header:", oHeaderEntry);

                        //     await new Promise((resolve, reject) => {
                        //         headerdata.update(`/ZCE_ZDTCOUNT_HEAD('${sap_uuid}')`, oHeaderEntry, {
                        //             success: function (oDATA) {
                        //                 console.log("Header updated:", oDATA);
                        //                 resolve(oDATA);
                        //             },
                        //             error: function (error) {
                        //                 console.error("Header update failed:", error);
                        //                 reject(error);
                        //             }
                        //         });
                        //     });
                        // }

                        // --- 4. Save item data sequentially ---
                        for (const item of getItemData) {
                            const boxno = item.boxno || "00000";
                            const process_order = item.process_order;
                            const rawItemProcessOrder = item.process_order ? item.process_order.toString() : "";
                             const itemProcessOrderFinal = rawItemProcessOrder.padStart(12, "0").slice(-12);
                            const item_uuid = `${boxno.toString().padStart(5, "0")}${itemProcessOrderFinal}`;

                            const Itempayload = {
                                id: item_uuid,
                                sap_uuid: item_uuid,
                                srno: item.srno,
                                process_order: itemProcessOrderFinal,
                                salesorder: header.SalesOrder,
                                zdate: item.zdate ? new Date(item.zdate.toLocaleDateString("en-CA")) : null,
                                batch: header.Batch,
                                //batch: batchFinal,
                                target_qty: item.target_qty,
                                tare_wt: item.tare_wt,
                                boxno: item.boxno,
                                drum_no: item.drum_no,
                                avrgwt: item.avrgwt,
                                qty: item.qty,
                                qty_lac: item.qty_lac,
                                tot_lac: item.tot_lac,
                                netwt: item.netwt,
                                grosswt: item.grosswt,
                                capbox: item.capbox,
                                afx: "",
                                hfx: "",
                                waste: "",
                                cbyname: header.verified_by || header.verfied_by,
                                remarks: header.remarks,
                                status: "open",
                                itemstatus: "open",
                                createdat: new Date(),
                                createdby: that.TENTUSERID,
                                updatedat: new Date(),
                                updatedby: that.TENTUSERID,
                                screencode: "AU1000",
                                packedby: item.packedby,
                                verified_by: item.verified_by
                            };

                            console.log("Creating item:", Itempayload);

                            await new Promise((resolve, reject) => {
                                itemdata.create("/ZLABEL_ITEM_DD", Itempayload, {
                                    success: function (oDATA) {
                                        console.log("Item created:", oDATA);
                                        resolve(oDATA);
                                    },
                                    error: function (error) {
                                        console.error("Item creation failed:", error);
                                        reject(error);
                                    }
                                });
                            });
                        }

                        // --- 5. Clear item model after successful save ---
                        const itemModelForClear = that.getView().getModel("TabZlabelItemModel");
                        itemModelForClear.setData({ DatasZitem: [] });
                        itemModelForClear.updateBindings(true);

                        // Optional: refresh header model if needed
                        that.zlabelmodel.refresh(true);
                        sap.m.MessageToast.show("Data saved successfully.");

                    } catch (err) {
                        console.error("Save process failed:", err);
                        sap.m.MessageBox.error("Error saving count data. Check console for details.");
                    } finally {
                        sap.ui.core.BusyIndicator.hide();
                    }
                }
            });
        },


        // onTarewt: function () {
        //     const oView = this.getView();
        //     const oModel = oView.getModel("ZCE_ZCOUNT_HEAD_SAVE_SRVB");
        //     const getHeaderData = this.zcountmodel.getProperty("/HeaderData/");

        //     this.getView().byId("idupdate").setEnabled(true)

        //     this.getView().byId("save").setEnabled(false)
        //     this.getView().byId("tableadd").setEnabled(false)

        //     if (!oModel) {
        //         console.error("Model 'ZCE_ZCOUNT_HEAD_SAVE_SRVB' is not defined.");
        //         sap.m.MessageToast.show("Data model not found.");
        //         return;
        //     }

        //     sap.ui.core.BusyIndicator.show(); // Show busy indicator

        //     const sProcessOrder = "00" + getHeaderData[0].ProcessOrder;
        //     const oFilter = new sap.ui.model.Filter("process_order", sap.ui.model.FilterOperator.EQ, sProcessOrder);

        //     oModel.read("/item", {
        //         filters: [oFilter],
        //         success: (oData) => {
        //             const aItems = oData.results;

        //             if (!Array.isArray(aItems) || aItems.length === 0) {
        //                 console.warn("No items returned from backend.");
        //                 sap.m.MessageToast.show("No items found for the given ProcessOrder.");
        //                 sap.ui.core.BusyIndicator.hide(); // Hide busy indicator
        //                 return;
        //             }

        //             // Sort items by created date (latest first)
        //             const aSorted = aItems.sort((a, b) => {
        //                 const dateA = new Date(a.createdat || 0);
        //                 const dateB = new Date(b.createdat || 0);
        //                 return dateB - dateA;
        //             });

        //             // Get last 10 items
        //             const aLast10 = aSorted.slice(0, 10);

        //             // Mark the items as editable and track user changes
        //             const aUpdatedItems = aItems.map(item => ({
        //                 ...item,
        //                 isEditMode: false,
        //                 isTareEditable: aLast10.some(editable => editable.id === item.id),
        //                 isTareEdited: false // Flag to track manual edits
        //             }));

        //             // Set the model with the updated items
        //             const oTableModel = new sap.ui.model.json.JSONModel({ DatasZitem: aUpdatedItems });
        //             oView.setModel(oTableModel, "TabZcountItemModel");

        //             sap.ui.core.BusyIndicator.hide(); // Hide busy indicator
        //         },
        //         error: (oError) => {
        //             console.error("Failed to read ZCE_ZCOUNT_ITEM:", oError);
        //             sap.m.MessageToast.show("Error reading data from backend.");
        //             sap.ui.core.BusyIndicator.hide(); // Hide busy indicator
        //         }
        //     });
        // },



        // onTarewtupate: function () {
        //     const oView = this.getView();
        //     const oModel = oView.getModel("ZSB_ZCOUNT_ITEM");
        //     const oTableModel = oView.getModel("TabZcountItemModel");
        //     const aItems = oTableModel.getProperty("/DatasZitem");


        //     if (!oModel) {
        //         console.error("Model 'ZCE_ZCOUNT_HEAD_SAVE_SRVB' is not defined.");
        //         sap.m.MessageToast.show("Data model not found.");
        //         return;
        //     }

        //     sap.ui.core.BusyIndicator.show(); // Show busy indicator



        //     // Update the last 10 items first (automatically marked for editing based on creation date)
        //     aItems.forEach(item => {
        //         // const sKey = item.id;
        //         // const sPath = `/('${sKey}')`;

        //         const oPayload = {
        //             tare_wt: item.tare_wt, // Send updated tare_wt for last 10 items
        //             qty: item.qty,

        //         };
        //         var that = this;
        //         oModel.update("/ZCE_ZCOUNT_ITEM('" + item.id + "')", oPayload, {
        //             success: function () {
        //                 // console.log(`Updated item ID ${sKey}`);
        //                 sap.m.MessageToast.show(" Tare weights updated Successfully.");
        //                 const oClearModel = new sap.ui.model.json.JSONModel({ DatasZitem: [] });
        //                 oView.setModel(oClearModel, "TabZcountItemModel");
        //                 oClearModel.refresh(true);
        //                 sap.ui.core.BusyIndicator.hide(); // Hide busy indicator

        //                 that.getView().byId("idupdate").setEnabled(false)

        //                 that.getView().byId("save").setEnabled(true)
        //                 that.getView().byId("tableadd").setEnabled(true)


        //             },
        //             error: function () {
        //                 console.error(`Failed to update item ID ${sKey}`);
        //                 sap.ui.core.BusyIndicator.hide(); // Hide busy indicator

        //             }
        //         });
        //     });


        // },







        onTarewt: function () {
            const oView = this.getView();
            const oModel = oView.getModel("ZSB_LABEL_ITEM");
            const getHeaderData = this.zlabelmodel.getProperty("/HeaderData/");

            this.getView().byId("idupdate1").setEnabled(true);
            this.getView().byId("save1").setEnabled(false);
            this.getView().byId("tableadd").setEnabled(false);

            if (!oModel) {
                console.error("Model 'ZSB_LABEL_ITEM' is not defined.");
                sap.m.MessageToast.show("Data model not found.");
                return;
            }

            sap.ui.core.BusyIndicator.show();

            const rawProcessOrder = getHeaderData[0].ProcessOrder; // e.g. "1000120"
            // const processOrderLegacy = "00" + rawProcessOrder;     // old style
            const processOrderFinal = rawProcessOrder.padStart(12, "0").slice(-12); // new style

            // OR filter for both formats
            const oFilter = new sap.ui.model.Filter({
                filters: [
                    // new sap.ui.model.Filter("process_order", sap.ui.model.FilterOperator.EQ, processOrderLegacy),
                    new sap.ui.model.Filter("process_order", sap.ui.model.FilterOperator.EQ, processOrderFinal)
                ]
            });

            oModel.read("/ZLABEL_ITEM_DD", {
                filters: [oFilter],
                   urlParameters: {
                    "$orderby": "createdat desc",  // Order by createdat (most recent first)
                    //"$skip": 15,                   // Skip the first 15 records (to get the last 10)
                   // "$top": 10

                   "$top": "5000",
                   "$skip": "0"
                },
                success: (oData) => {
                    const aItems = oData.results || [];

                    if (!Array.isArray(aItems) || aItems.length === 0) {
                        console.warn("No items returned from backend.");
                        sap.m.MessageToast.show("No items found for the given ProcessOrder.");
                        sap.ui.core.BusyIndicator.hide();
                        return;
                    }

                    // Normalize backend process_order for comparison
                    aItems.forEach(item => {
                        item.process_order = item.process_order.replace(/^0+/, "");
                    });

                    // Sort by created date
                    const aSorted = aItems.sort((a, b) => {
                        const dateA = new Date(a.createdat || 0);
                        const dateB = new Date(b.createdat || 0);
                        return dateB - dateA;
                    });

                    const aLast10 = aSorted.slice(0, 10);

                    const aUpdatedItems = aItems.map(item => ({
                        ...item,
                        isEditMode: false,
                        isTareEditable: aLast10.some(editable => editable.id === item.id),
                        isTareEdited: false
                    }));

                    const oTableModel = new sap.ui.model.json.JSONModel({ DatasZitem: aUpdatedItems });
                    oView.setModel(oTableModel, "TabZlabelItemModel");

                    sap.ui.core.BusyIndicator.hide();
                },
                error: (oError) => {
                    console.error("Failed to read ZSB_LABEL_ITEM:", oError);
                    sap.m.MessageToast.show("Error reading data from backend.");
                    sap.ui.core.BusyIndicator.hide();
                }
            });



//latest 10 records 
// oModel.read("/ZLABEL_ITEM_DD/$count", {
//     filters: [oFilter],
//     success: (iCount) => {
//         const skipValue = Math.max(0, iCount - 10); // skip until last 10

//         // Step 2: Read last 10
//         oModel.read("/ZLABEL_ITEM_DD", {
//             filters: [oFilter],
//             urlParameters: {
//                 "$orderby": "createdat asc", // oldest first
//                 "$skip": skipValue.toString(),
//                 "$top": "10"
//             },
//             success: (oData) => {
//                 const aItems = oData.results || [];

//                 const aUpdatedItems = aItems.map(item => ({
//                     ...item,
//                     process_order: item.process_order.replace(/^0+/, ""),
//                     isEditMode: false,
//                     isTareEditable: true,
//                     isTareEdited: false
//                 }));

//                const oTableModel = new sap.ui.model.json.JSONModel({ DatasZitem: aUpdatedItems });
//                     oView.setModel(oTableModel, "TabZlabelItemModel");

//                 sap.ui.core.BusyIndicator.hide();
//             },
//             error: (oError) => {
//                 console.error("Failed to read last 10 items:", oError);
//                 sap.m.MessageToast.show("Error reading last 10 records.");
//                 sap.ui.core.BusyIndicator.hide();
//             }
//         });
//     },
//     error: (oError) => {
//         console.error("Failed to get count:", oError);
//         sap.m.MessageToast.show("Error getting record count.");
//         sap.ui.core.BusyIndicator.hide();
//     }
// });







        },

        onTarewtupate: async function () {
            const oView = this.getView();
            const oModel = oView.getModel("ZSB_LABEL_ITEM"); // OData model for items
            const oTableModel = oView.getModel("TabZlabelItemModel");
            const aItems = oTableModel.getProperty("/DatasZitem");

            if (!oModel) {
                console.error("Model 'ZSB_LABEL_ITEM' is not defined.");
                sap.m.MessageToast.show("Data model not found.");
                return;
            }

            if (!aItems || aItems.length === 0) {
                sap.m.MessageToast.show("No items available to update.");
                return;
            }

            sap.ui.core.BusyIndicator.show(0);
            const that = this;

            try {
                // --- Sequential update of all items ---
                for (const item of aItems) {
                    const oPayload = {
                        tare_wt: item.tare_wt,
                        qty: item.qty,
                        qty_lac: item.qty_lac,
                        packedby: item.packedby,
                        verified_by: item.verified_by,
                    };

                    await new Promise((resolve, reject) => {
                        oModel.update(`/ZLABEL_ITEM_DD('${item.id}')`, oPayload, {
                            success: function () {
                                console.log(`Updated item ${item.id}`);
                                resolve();
                            },
                            error: function (oError) {
                                console.error(`Failed to update item ${item.id}`, oError);
                                reject(oError);
                            }
                        });
                    });
                }

                // --- After all updates complete ---
                sap.m.MessageToast.show("Tare weights updated successfully.");

                // ✅ Clear the table only after all updates are done
                oTableModel.setProperty("/DatasZitem", []);
                oTableModel.refresh(true);

                // ✅ Enable Save and Add buttons (disable Update)
                that.byId("idupdate1").setEnabled(false);
                that.byId("save1").setEnabled(true);
                that.byId("tableadd").setEnabled(true);

            } catch (err) {
                console.error("Error updating tare weights:", err);
                sap.m.MessageBox.error("Failed to update one or more tare weights.");
            } finally {
                sap.ui.core.BusyIndicator.hide();
            }
        }




    });
});


