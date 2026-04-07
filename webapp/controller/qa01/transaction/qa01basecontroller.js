sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/model/json/JSONModel",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/m/MessageBox",
        "zautodesignapp/util/PDFLib",
        "sap/m/PDFViewer",

    ],
    function (Controller, JSONModel, Filter, FilterOperator, MessageBox) {
        "use strict";

        return Controller.extend("zautodesignapp.controller.qa01.transaction.qa01basecontroller", {
            onInit: function () {
                // Shared models for all screens
                this.screenModel = new sap.ui.model.json.JSONModel({
                    openscreen: "screen1"
                });
                this.getView().setModel(this.screenModel, "ScreenVisible");

                this.selectedRowModel = new sap.ui.model.json.JSONModel({

                });
                this.getView().setModel(this.selectedRowModel, "SelectedRow");

                this.qa0Model = new sap.ui.model.json.JSONModel({
                    HeaderData: [{
                        daterange: "",
                        selectedMachine: ""
                    }],
                    TableVisible: false
                });
                this.getView().setModel(this.qa0Model, "qa0Model");

                this.screen2headermodel = new sap.ui.model.json.JSONModel({
                    HEADERDATA: {}
                });
                this.getView().setModel(this.screen2headermodel, "screen2model")


                // Create the table item model for screen 2
                this.TabItemModel = new sap.ui.model.json.JSONModel({
                    Datassitem: [{
                        sap_uuid: "",
                        zdate: "",
                        batch: "",
                        shift: "",
                        boxno: "",
                        averagewt: "",
                        weight: "",
                        cumulativeqty: "",
                        gradeats: "",
                        tarqty: "",
                        agradeqty: "",
                        hfx: "",
                        remarks: "",
                        wastage: "",
                        wastageinlac: "",
                        floorwastage: "",
                        qaname: "",
                        operatorname: "",
                        materialdocument: "",
                        documentyear: ""
                    }],  // Static, only one plant
                });

                // Set the model to the view
                this.getView().setModel(this.TabItemModel, "TabItemModel");

                this._pdfViewer = new sap.m.PDFViewer({
                    isTrustedSource: true,
                    width: "100%",
                    height: "600px", // Adjust height as needed
                    title: "QA01 Print"
                });
                this.getView().addDependent(this._pdfViewer);

                this.QAJModelInput = new sap.ui.model.json.JSONModel({
                    Samples: {
                        qa01_cfmperform: '',
                        qa01_avgwt: '',
                        qa01_moistcontent: '',
                        qa01_pulltest: '',
                        qa01_joinlength: '',
                    }
                })
                this.getView().setModel(this.QAJModelInput, "QAJModelInput");


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

            validateDateRange: function () {
                const headerData = this.qa0Model.getProperty("/HeaderData/0");
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

            formatODataDate: function (odataDate) {
                if (!odataDate) return "";

                // Handles /Date(1718755200000)/ format
                if (typeof odataDate === "string" && odataDate.startsWith("/Date(")) {
                    const timestamp = parseInt(odataDate.replace("/Date(", "").replace(")/", ""), 10);
                    const date = new Date(timestamp);
                    return date.toLocaleDateString("en-GB"); // e.g., "19/06/2025"
                }

                // If it's already a Date object
                if (odataDate instanceof Date) {
                    return odataDate.toLocaleDateString("en-GB");
                }

                // Fallback
                return odataDate;
            },

            Tofetchdipsmater: function (odipsmodel, dispfilter) {

                return new Promise(function (resolve, reject) {
                    var that = this;

                    odipsmodel.read("/ZC_TB_ZDIPS", {
                        filters: [dispfilter],
                        success: function (odatadips) {
                            resolve(odatadips);

                        },

                        error: function (error) {
                            reject(error)

                        }

                    })

                })
            },

            onGetBatch: function (oEvent) {
                let datevalue = oEvent.mParameters.value;

                let headermodel = this.getView().getModel("screen2model");
                let getheaderproperty = headermodel.getProperty("/HEADERDATA");
                let batch = getheaderproperty.Batch;
                let material = getheaderproperty.Product
                oEvent.getSource().getParent().getCells()[1].setText(batch);
                oEvent.getSource().getParent().getCells()[17].setText(material);

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
                const selectedAcmNo = selectedData.ATSNO;

                // Set model for selected row
                this.selectedRowModel.setData(selectedData);
                this.showScreen("screen2");

                const oModelItem = this.getView().getModel("ZSB_AU_QA01_ITEM");

                try {
                    // Set HEADERDATA model
                    this.screen2headermodel = new sap.ui.model.json.JSONModel({
                        HEADERDATA: selectedData
                    });
                    this.getView().setModel(this.screen2headermodel, "screen2model");

                    // Filters for data fetch
                    const filters = [
                        new sap.ui.model.Filter("processorder", sap.ui.model.FilterOperator.EQ, selectedOrder),
                        new sap.ui.model.Filter("acmno", sap.ui.model.FilterOperator.EQ, selectedAcmNo)
                    ];

                    // Fetch item tab data
                    const DatasKk01 = await this.ToCheckProcOrderInInternally(oModelItem, filters);

                    // DatasKk01.sort((a, b) => {
                    //     // If boxno is numeric
                    //     return a.boxno - b.boxno;

                    //     // If boxno is a string, use localeCompare instead:
                    //     // return a.boxno.localeCompare(b.boxno);
                    // });

                    // Bind to TabItemModel
                    const tabItemModel = new sap.ui.model.json.JSONModel({ Datassitem: DatasKk01 });
                    this.getView().setModel(tabItemModel, "TabItemModel");

                    // const oTable = this.byId("idqa01table");
                    // const oBinding = oTable.getBinding("rows");
                    // //const oSorter = new sap.ui.model.Sorter("boxno", false); // false = ascending
                    //  var oSorter = new sap.ui.model.Sorter("boxno", false, function (value) {
                    //     return parseInt(value, 10); // Ensures numeric sorting 
                    //     });
                    // oBinding.sort(oSorter);


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

                    oModelItem.read("/ZC_AU_QA01_ITEM", {
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





            // ToCheckProcOrderInInternally: async function (oModelItem, filters) {
            //     const allResults = [];
            //     const top = 100;
            //     let skip = 0;
            //     let hasMoreData = true;

            //     const readPage = (skipCount) => {
            //         return new Promise((resolve, reject) => {
            //             oModelItem.read("/ZC_AU_QA01_ITEM", {
            //                 filters: filters,
            //                 urlParameters: {
            //                     "$top": top,
            //                     "$skip": skipCount
            //                 },
            //                 success: function (oData) {
            //                     const results = oData.results || [];
            //                     resolve(results);
            //                 },
            //                 error: function (oError) {
            //                     console.error("Error reading items:", oError);
            //                     sap.m.MessageToast.show("Failed to load item data.");
            //                     resolve([]); // continue safely
            //                 }
            //             });
            //         });
            //     };

            //     while (hasMoreData) {
            //         const pageData = await readPage(skip);
            //         allResults.push(...pageData);

            //         if (pageData.length < top) {
            //             hasMoreData = false; // No more pages
            //         } else {
            //             skip += top; // Move to next batch
            //         }
            //     }

            //     return allResults;
            // },






            // onBoxNoChange: function (oEvent) {
            //     const oInput = oEvent.getSource();
            //     const oContext = oInput.getBindingContext("TabItemModel");
            //     const sNewBoxNo = oInput.getValue().trim();

            //     if (!sNewBoxNo) return; // Ignore empty input

            //     const oModel = this.getView().getModel("TabItemModel");
            //     const aRows = oModel.getProperty("/Datassitem");

            //     const sPath = oContext.getPath();
            //     const currentIndex = parseInt(sPath.split("/").pop());

            //     const isDuplicate = aRows.some((item, index) => {
            //         return index !== currentIndex && item.boxno && item.boxno.trim() === sNewBoxNo;
            //     });

            //     if (isDuplicate) {
            //         // Clear input and warn user
            //         oModel.setProperty(sPath + "/boxno", "");
            //         sap.m.MessageBox.warning("Box Number must be unique. The value '" + sNewBoxNo + "' already exists.");
            //     }
            // },



            onBoxNoChange: function (oEvent) {
                const oInput = oEvent.getSource();
                const oContext = oInput.getBindingContext("TabItemModel");
                const sNewBoxNo = oInput.getValue().trim();

                if (!sNewBoxNo) return; // Ignore empty input

                // ✅ Check max length (should not exceed 4 characters)
                if (sNewBoxNo.length > 4) {
                    sap.m.MessageBox.warning("Box Number must not exceed 4 characters.");
                    oInput.setValue(""); // Clear input
                    return;
                }

                const oModel = this.getView().getModel("TabItemModel");
                const aRows = oModel.getProperty("/Datassitem");

                const sPath = oContext.getPath();
                const currentIndex = parseInt(sPath.split("/").pop());

                // ✅ Check for duplicate box numbers
                const isDuplicate = aRows.some((item, index) => {
                    return index !== currentIndex && item.boxno && item.boxno.trim() === sNewBoxNo;
                });

                if (isDuplicate) {
                    // Clear input and warn user
                    oModel.setProperty(sPath + "/boxno", "");
                    sap.m.MessageBox.warning(
                        "Box Number must be unique. The value '" + sNewBoxNo + "' already exists."
                    );
                }
            },


            // onBoxNoChange: function (oEvent) {
            //     const oInput = oEvent.getSource();
            //     const oContext = oInput.getBindingContext("TabItemModel");
            //     const oModel = this.getView().getModel("TabItemModel");
            //     const aRows = oModel.getProperty("/Datassitem") || [];


            //     let sNewBoxNo = oInput.getValue();
            //     sNewBoxNo = sNewBoxNo ? sNewBoxNo.trim().replace(/\D/g, "") : "";


            //     const sPath = oContext.getPath(); // e.g. "/Datassitem/2"
            //     const currentIndex = parseInt(sPath.split("/").pop());


            //     const isDuplicate = aRows.some((item, index) => {
            //         return index !== currentIndex && item.boxno && item.boxno.trim() === sNewBoxNo;
            //     });


            //     if (sNewBoxNo.length !== 4 || isDuplicate) {
            //         oModel.setProperty(sPath + "/boxno", "");
            //         oInput.setValue("");

            //         if (sNewBoxNo.length !== 4 && isDuplicate) {
            //             sap.m.MessageBox.warning(
            //                 `Box Number'${sNewBoxNo}' already exists.`
            //             );
            //         } else if (sNewBoxNo.length !== 4) {
            //             sap.m.MessageBox.warning("Box Number must be exactly 4 digits.");
            //         } else {
            //             sap.m.MessageBox.warning(
            //                 `Box Number '${sNewBoxNo}' already exists. Please enter a unique 4-digit Box Number.`
            //             );
            //         }
            //         return;
            //     }

            //     // All good — set value
            //     oModel.setProperty(sPath + "/boxno", sNewBoxNo);
            //     oInput.setValue(sNewBoxNo);
            // },




            saveandupdate: async function (aSelected) {
                var that = this;
                var oHeaderSrv = that.getView().getModel("ZSB_AU_QA01_HEADER");
                var oItemSrv_qa02 = that.getView().getModel("ZSB_AU_QA02_ITEM");
                var oItemSrv = that.getView().getModel("ZSB_AU_QA01_ITEM");
                var oHdrData = that.screen2headermodel.getProperty("/HEADERDATA/");
                var oHeaderModel = that.getView().getModel("screen2model");
                var aHeadRows = (oHeaderModel.getProperty("/HEADERDATA") || []);




                for (const row of aSelected) {
                    if (!row.sap_uuid) {
                        // --- CREATE flow
                        const oHdrModel = this.getView().getModel("ZSB_AU_QA01_HEADER");
                        if (!oHdrModel) {
                            console.error("ZSB_AU_QA01_HEADER model is undefined.");
                            sap.m.MessageBox.error("Header model is missing.");
                            return;
                        }

                        var oFilter = new sap.ui.model.Filter("screencode", sap.ui.model.FilterOperator.EQ, "AU300");

                        await new Promise((resolve, reject) => {
                            oHdrModel.read("/ZC_AU_QA01_HEADER/$count", {
                                filters: [oFilter],
                                success: async function (odata, oResponse) {
                                    try {
                                        let Count = Number(oResponse.body) + 1;
                                        let LastId = "30" + "0".repeat(8 - Count.toString().length) + Count;

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

                                        let po = aHeadRows.ManufacturingOrder
                                        let machine = aHeadRows.ATSNO
                                        let boxno = row.boxno
                                        var sap_uuid = `${boxno.toString().padStart(5, "0")}${machine}${po}`;

                                        // var sap_uuid = `${boxno}${machine}${po}`;
                                        console.log(sap_uuid); // "1100000806_24_1"
                                        // var sap_uuid = generateUniqueId();
                                        // var sap_uuid = generateUniqueId();




                                        // --- QA01 Item creation
                                        const postItemPromise = new Promise((resolve, reject) => {
                                            const payload = {
                                                sap_uuid: sap_uuid,
                                                id: sap_uuid,
                                                processorder: oHdrData.ManufacturingOrder,
                                                zdate: row.zdate ? new Date(row.zdate.toLocaleDateString('en-CA')) : new Date(),
                                                batch: oHdrData.Batch,
                                                shift: row.shift,
                                                boxno: String(row.boxno),
                                                averagewt: row.averagewt,
                                                weight: row.weight || "0.00",
                                                cumulativeqty: row.cumulativeqty || "0.00",
                                                gradeats: row.gradeats,
                                                tarqty: row.tarqty || "0.00",
                                                gradeais: row.gradeForAIS,
                                                hfx: row.hfx || "0.00",
                                                wastage: row.wastage || "0.00",
                                                //wastageinlac: row.wastageinlac || "0.0000",
                                                floorwastage: row.floorwastage || "0.00",
                                                agradeqty: row.agradeqty || "0.00",
                                                remarks: row.remarks,
                                                qaname: row.qaname,
                                                operatorname: row.operatorname,
                                                acmno: oHdrData.ATSNO,
                                                materialdescription: row.materialdoc,
                                                documentyear: row.documentyear,
                                                screencode: "AU300",
                                                status: "open",
                                                itemstatus: "open",
                                                createdby: that.TENTUSERID,
                                                createdat: new Date(),
                                                updatedat: new Date(),
                                                updatedby: that.TENTUSERID,
                                                qa01_status: "X",
                                                qa02_status: "",
                                                qa03_status: ""
                                            };
                                            oItemSrv.create("/ZC_AU_QA01_ITEM", payload, { success: resolve, error: reject });
                                        });

                                        // --- QA02 Item creation
                                        const postLogPromise = new Promise((resolve, reject) => {
                                            const payload2 = {
                                                sap_uuid: sap_uuid,
                                                id: sap_uuid,
                                                processorder: oHdrData.ManufacturingOrder,
                                                batch: oHdrData.Batch,
                                                shift: row.shift,
                                                boxno: String(row.boxno),
                                                gradeats: row.gradeats,
                                                averagewt: row.averagewt,
                                                weight: "0.000",
                                                screencode: "AU400",
                                                createdby: that.TENTUSERID,
                                                createdat: new Date(),
                                                updatedat: new Date(),
                                                updatedby: that.TENTUSERID
                                            };
                                            oItemSrv_qa02.create("/ZC_AU_QA02ITEM", payload2, { success: resolve, error: reject });
                                        });

                                        // --- QA01 Header creation
                                        const postqa01header = new Promise((resolve, reject) => {
                                            const payloadqa01header = {
                                                sap_uuid: sap_uuid,
                                                id: sap_uuid,
                                                processorder: aHeadRows.ManufacturingOrder,
                                                batch: aHeadRows.Batch,
                                                salesordrer: aHeadRows.SalesOrder,
                                                orderqty: aHeadRows.MfgOrderPlannedTotalQty,
                                                dippedqty: parseFloat(aHeadRows.dipedqty).toFixed(3),
                                                acmno: aHeadRows.ATSNO,
                                                capcolour: aHeadRows.CapColor,
                                                bodycolour: aHeadRows.BodyColor,
                                                zsize: aHeadRows.Zsize,
                                                material: aHeadRows.Product,
                                                customer: aHeadRows.Customer,
                                                status: 'open',
                                                headerstatus: 'open',
                                                screencode: "AU300",
                                                productdescription: aHeadRows.ProductDescription,
                                                customername: aHeadRows.CustomerName,
                                                productionunit: aHeadRows.ProductionUnit,
                                                createdby: that.TENTUSERID,
                                                createdat: new Date(),
                                                updatedat: new Date(),
                                                updatedby: that.TENTUSERID,
                                                plant: aHeadRows.ProductionPlant
                                            };
                                            oHeaderSrv.create("/ZC_AU_QA01_HEADER", payloadqa01header, { success: resolve, error: reject });
                                        });

                                        await Promise.all([postItemPromise, postLogPromise, postqa01header]);
                                        resolve();

                                    } catch (err) {
                                        reject(err);
                                    }
                                },
                                error: reject
                            });
                        });

                    } else {
                        // --- UPDATE flow
                        var oItemSrv_qa02 = this.getView().getModel("ZSB_AU_QA02_ITEM");
                        var oItemSrv = this.getView().getModel("ZSB_AU_QA01_ITEM");

                        const UpdateQA01data = new Promise((resolve, reject) => {
                            const payload = {
                                sap_uuid: row.sap_uuid,
                                zdate: row.zdate ? new Date(row.zdate.toLocaleDateString('en-CA')) : new Date(),
                                shift: row.shift,
                                averagewt: row.averagewt,
                                gradeats: row.gradeats,
                                remarks: row.remarks,
                                qaname: row.qaname,
                                operatorname: row.operatorname,
                                updatedat: new Date(),
                                updatedby: that.TENTUSERID,
                                qa01_status: "X"
                            };
                            oItemSrv.update("/ZC_AU_QA01_ITEM('" + row.sap_uuid + "')", payload, { success: resolve, error: reject });
                        });

                        const UpdateQA02data = new Promise((resolve, reject) => {
                            const payload1 = {
                                sap_uuid: row.sap_uuid,
                                shift: row.shift,
                                averagewt: row.averagewt,
                                gradeats: row.gradeats,
                                updatedat: new Date(),
                                updatedby: that.TENTUSERID
                            };
                            oItemSrv_qa02.update("/ZC_AU_QA02ITEM('" + row.sap_uuid + "')", payload1, { success: resolve, error: reject });
                        });

                        await Promise.all([UpdateQA01data, UpdateQA02data]);
                    }
                }

                // --- After create/update: refresh table data
                const oModelItem = that.getView().getModel("ZSB_AU_QA01_ITEM");
                oModelItem.refresh(true);   // ensure latest entries are fetched

                const filters = [
                    new sap.ui.model.Filter("processorder", sap.ui.model.FilterOperator.EQ, aHeadRows.ManufacturingOrder),
                    new sap.ui.model.Filter("acmno", sap.ui.model.FilterOperator.EQ, aHeadRows.ATSNO)
                ];

                const DatasKk01 = await that.ToCheckProcOrderInInternally(oModelItem, filters);
                this.getView().setModel(new sap.ui.model.json.JSONModel({ Datassitem: DatasKk01 }), "TabItemModel");

            },


            onSubmitqa01screen: async function () {
                const that = this;
                sap.ui.core.BusyIndicator.show();

                try {
                    const oItemModel = this.getView().getModel("TabItemModel");
                    const aAllRows = oItemModel.getProperty("/Datassitem") || [];
                    const aSelected = aAllRows.filter(r => r.selected);

                    if (aSelected.length === 0) {
                        sap.m.MessageBox.information("Please select at least one row to post.");
                        return;
                    }

                    await this.saveandupdate(aSelected);
                    sap.m.MessageToast.show("Data Saved Successfully..")

                } catch (err) {
                    console.error("Error in onSubmitqa01screen:", err);
                    sap.m.MessageBox.error("An error occurred during posting.");
                } finally {
                    sap.ui.core.BusyIndicator.hide();
                }
            },



            onQa01Print: async function (oEvent) {
                sap.ui.core.BusyIndicator.show();

                const input = oEvent.getSource(); // the Input field
                const context = input.getBindingContext("TabItemModel");

                if (context) {
                    const rowPath = context.getPath();
                    const rowData = context.getObject();

                    const dates = new Date(rowData.zdate); // assuming zdate is a valid date string
                    const yyyy = dates.getFullYear();
                    const mm = String(dates.getMonth() + 1).padStart(2, '0'); // getMonth() is zero-based
                    const dd = String(dates.getDate()).padStart(2, '0');

                    const formattedDate = `${yyyy}${mm}${dd}`;
                    console.log("formattedDate:", formattedDate);


                    const processorder = rowData.processorder; // assuming this is a string like "001000000040"
                    console.log("rowData.processorder:", processorder);

                    // const sServiceUrl = "/sap/bc/http/sap/Z_QA01_DEFECTS?processorder=00"+rowData.processorder;
                    const sServiceUrl = "/sap/bc/http/sap/Z_QA01_DEFECTS?processorder=00" + rowData.processorder + "&batch=" + rowData.batch + "&shift=" + rowData.shift + "&zdate=" + formattedDate;
                    console.log("sServiceUrl", sServiceUrl);

                    try {
                        const pdfData = await this.fetchPDFData(sServiceUrl);

                        if (pdfData) {
                            await this.displayPDFs([pdfData]); // wrap in array for consistency
                        } else {
                            sap.m.MessageToast.show("No PDF available to display.");
                        }
                    } catch (error) {
                        console.error("Error fetching PDF data:", error);
                        sap.m.MessageToast.show("Error fetching PDF.");
                    }

                    sap.ui.core.BusyIndicator.hide();
                } else {
                    console.log("No binding context found.");
                    sap.ui.core.BusyIndicator.hide();
                }
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
                            sap.ui.core.BusyIndicator.hide();
                            reject(errorThrown);
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

                this._pdfViewer.setTitle("QA01 Defects PDF");
                this._pdfViewer.open();
            },

            Ondeleteitempress: function (oEvent) {
                const input = oEvent.getSource(); // the Input field
                const context = input.getBindingContext("TabItemModel");
                var sapuid = context.getObject().sap_uuid;
                console.log("sapuid", sapuid);
                var qa01model = this.getView().getModel("ZSB_AU_QA01_ITEM")
                var qa01headodata = this.getView().getModel("ZSB_AU_QA01_HEADER");
                var qa02model = this.getView().getModel("ZSB_AU_QA02_ITEM")
                const oTabItemModel = this.getView().getModel("TabItemModel");
                qa01model.remove("/ZC_AU_QA01_ITEM('" + sapuid + "')", {
                    success: function (odata) {
                        console.log(odata);

                        let aItems = oTabItemModel.getProperty("/Datassitem"); // adjust path if needed
                        // Find index of item by sap_uuid
                        const iIndex = aItems.findIndex(item => item.sap_uuid === sapuid);

                        if (iIndex !== -1) {
                            aItems.splice(iIndex, 1); // remove the item
                            oTabItemModel.setProperty("/Datassitem", aItems);
                            oTabItemModel.refresh(true);
                            sap.m.MessageToast.show("Row deleted..")
                        }
                        qa02model.remove("/ZC_AU_QA02ITEM('" + sapuid + "')", {
                            success: function (odata2) {
                                console.log("odata2", odata2);

                            },
                            error: function (error) {
                                console.log("error", error);

                            }
                        });

                        qa01headodata.remove("/ZC_AU_QA01_HEADER('" + sapuid + "')", {
                            success: function (odata2) {
                                console.log("odata2", odata2);

                            },
                            error: function (error) {
                                console.log("error", error);

                            }
                        });



                    },
                    error: function (error) {
                        console.log("error", error);
                    }
                });

            }




        });
    }
);
