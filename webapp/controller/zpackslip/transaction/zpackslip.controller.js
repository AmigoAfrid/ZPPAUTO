sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'sap/m/MessagePopover',
    "sap/m/MessageBox",
    "zautodesignapp/util/PDFLib"
], (Controller, MessagePopover, MessageBox) => {
    "use strict";
    var sBusyIcon = sap.ui.require.toUrl(
        "zfzpackingslip/images/busy.gif"
    );
    // this.oBusyDialog = new sap.m.BusyDialog({
    //     customIcon: sBusyIcon,
    //     customIconWidth: "100px",
    //     customIconHeight: "100px"
    // });
    var oBusyDialog = new sap.m.BusyDialog();
    return Controller.extend("zautodesignapp.controller.zpackslip.transaction.zpackslip", {
        onInit() {
            var that = this;
            this.oView = this.getView();
            this.setHeaderModel();
            this.setDefaultSettings();

            var userInfoService = sap.ushell.Container.getService("UserInfo");
            var userName = userInfoService.getUser().getFullName();
            this.TENTUSERID = userInfoService.getUser().getId();
            this.TENTUSERNAME = userInfoService.getUser().getFullName();
            console.log("getId:", this.TENTUSERID);
            console.log("User Name: " + this.TENTUSERNAME);
            // this.getView().getModel("HeaderDataModel").setProperty("/UserName", this.TENTUSERNAME);
        },
        setDefaultSettings: function () {
            var JsonMModel = new sap.ui.model.json.JSONModel({
                "HeaderEditableFileds": true,
                "SaveBtn": "true",
                "TableCount": 0,
                "ValueStateProcessOrder": "None",
                "ValueStateTextProcessOrder": ""
            })
            this.getView().setModel(JsonMModel, "LocalViewSettings");
        },
        setHeaderModel: function () {
            var oHeaderData = {
                ProcessOrder: "",
                CreationDate: null,
                SalesOrder: "",
                salesOrderItem: "",
                Batch: "",
                CustomerName: "",
                Plant: "",
                Zsize: "",
                UserName: this.TENTUSERNAME,
                InvoiceNo: "",
                InvoiceDate: null,
                NoOfBoxes: "",
                Qty: "",
                BaseUnit: "",
                TotalBox: "",
                BoxType: "",
                Remarks: "",
                CapColorDes: "",
                CapColorCode: "",
                CapPrintMsg: "",
                CapPrintInk: "",
                BodyColorDes: "",
                BodyColorCode: "",
                BodyPrintMsg: "",
                BodyPrintInk: ""
            };
            var JsonMModel = new sap.ui.model.json.JSONModel();
            JsonMModel.setData(oHeaderData);
            this.getView().setModel(JsonMModel, "HeaderDataModel");
        },
        onCancel: function () {
            this.setHeaderModel();
            if (this.getView().getModel("ProcessOrderItems")) {
                this.getView().getModel("ProcessOrderItems").setProperty("/", []);
                this.getView().getModel("LocalViewSettings").setProperty("/TableCount", 0);
                this.getView().getModel("HeaderDataModel").setProperty("/UserName", "");

            }
        },
        OnChangeOrderNo: function (oEvent) {
            oEvent.getSource().setValueState("None");
            oEvent.getSource().setValueStateText("");
            if (oEvent.getSource().getValue() != "") {
                const oInput = oEvent.getSource();
                const sValue = oInput.getValue();
                // Regex: allow only digits
                const isNumeric = /^[0-9]+$/.test(sValue);
                if (!isNumeric && sValue !== "") {
                    oInput.setValue("");
                    oInput.setValueState("Error");
                    oInput.setValueStateText("Only numbers are allowed");
                    return;
                }
                this.getPackingOrders();


            }

        },
        onClickDisplay: function (oEvent) {
            var HeaderModel = this.getView().getModel("HeaderDataModel");
            if (!HeaderModel.getProperty("/ProcessOrder")) {
                MessageBox.error("Please Enter the Process Order No");
                this.getView().getModel("LocalViewSettings").setProperty("/ValueStateProcessOrder", "Error")
                this.getView().getModel("LocalViewSettings").setProperty("/ValueStateTextProcessOrder", "Please Enter Process Order Number")
                return; // stop here
            }


            this.getPackingOrders();
        },
        getPackingOrders: function (saveFlag) {
            oBusyDialog.open();
            var that = this;
            var oModelPlant = this.getView().getModel("ZCE_PACKSLIP_HEAD_SRVB");
            var HeaderModel = this.getView().getModel("HeaderDataModel");
            // Check if the model is valid
            if (!oModelPlant) {
                console.error("OData model is not properly initialized.");
                sap.ui.core.BusyIndicator.hide();
                return;
            }
            var oFilters1 = [];
            oFilters1.push(new sap.ui.model.Filter("ProcessOrder", sap.ui.model.FilterOperator.EQ, HeaderModel.getProperty("/ProcessOrder")))
            var that = this;
            return new Promise((resolve, reject) => {
                oModelPlant.read("/ZCE_PACKSLIP_HEAD", {
                    filters: oFilters1,
                    success: function (oData) {
                        oBusyDialog.close();
                        var aItems = oData.results;
                        if (!saveFlag) {
                            if (oData.results.length > 0) {
                                that.setHeaderItemData(oData.results);
                                that.getView().getModel("HeaderDataModel").setProperty("/UserName", that.TENTUSERNAME);

                            }
                            else {
                                var ItemModel = new sap.ui.model.json.JSONModel();
                                ItemModel.setData(oData.results);
                                that.getView().setModel(ItemModel, "ProcessOrderItems");
                                that.getView().getModel("LocalViewSettings").setProperty("/TableCount", oData.results.length);
                                that.getView().getModel("HeaderDataModel").setProperty("/UserName", that.TENTUSERNAME);
                                that.setHeaderModel();
                            }
                        }
                        else {
                            if (!oData.results.length > 0) {
                                resolve("1");
                            }
                            var maxvalue = [];
                            oData.results.forEach(item => {
                                maxvalue.push(parseInt(item.SerNo, 10));
                            });
                            var Serno = Math.max(...maxvalue) + 1;
                            resolve(Serno.toString());
                        }

                    },
                    error: function (oError) {
                        oBusyDialog.close();
                        console.error("Error reading data: ", oError);
                    }
                });
            });
        },
        setHeaderItemData: function (results, oData) {
            var HeaderModel = this.getView().getModel("HeaderDataModel");
            var itemModel = this.getView().getModel("ProcessOrderItems");
            HeaderModel.setData(results[results.length - 1]);
            var aItemData = results.filter(function (oItem) {
                return oItem.SerNo && oItem.SerNo.trim() !== "";
            });
            var ItemModel = new sap.ui.model.json.JSONModel();
            ItemModel.setData(aItemData);
            this.getView().setModel(ItemModel, "ProcessOrderItems");
            this.getView().getModel("LocalViewSettings").setProperty("/TableCount", aItemData.length);

        },
        mapHeaderData: function (src) {
            return {
                ProcessOrder: src.Processorder,
                CreationDate: src.Creationdate,
                SalesOrder: src.Salesorder,
                salesOrderItem: src.Salesorderitem,
                Batch: src.Batch,
                CustomerName: src.Customername,
                Plant: src.Plant,
                Zsize: src.Zsize,
                UserName: src.Username,
                InvoiceNo: src.Invoiceno,
                InvoiceDate: src.Invoicedate,
                NoOfBoxes: src.Noofboxes,
                Qty: src.Qty,
                BaseUnit: src.Baseunit,
                TotalBox: src.Totalbox,
                BoxType: src.Boxtype,
                Remarks: src.Remarks,
                CapColorDes: src.Capcolordes,
                CapColorCode: src.Capcolorcode,
                CapPrintMsg: src.Capprintmsg,
                CapPrintInk: src.Capprintink,
                BodyColorDes: src.Bodycolordes,
                BodyColorCode: src.Bodycolorcode,
                BodyPrintMsg: src.Bodyprintmsg,
                BodyPrintInk: src.Bodyprintink
            };
        },
        onSave: async function () {
            var that = this;
            var Serno;
            var PACKSLIPModel = this.getView().getModel("ZCE_PACKSLIP_TABL_SRVB");
            var HeaderModel = this.getView().getModel("HeaderDataModel").getProperty("/");
            if (!HeaderModel.ProcessOrder || HeaderModel.ProcessOrder.trim() === "") {
                sap.m.MessageToast.show("Please enter Process Order Number");
                return;
            }
            var Serno = await this.getPackingOrders(true);
            var oHeaderPayload = {
                Processorder: HeaderModel.ProcessOrder,
                Creationdate: new Date(),
                time: new Date().toTimeString().split(' ')[0],
                Serno: Serno,
                Salesorder: HeaderModel.SalesOrder,
                Salesorderitem: HeaderModel.salesOrderItem,
                Batch: HeaderModel.Batch,
                Customer: HeaderModel.Customer,
                Customername: HeaderModel.CustomerName,
                Plant: HeaderModel.Plant,
                Product: HeaderModel.Product,
                Zsize: HeaderModel.Zsize,
                Username: HeaderModel.UserName,
                Invoiceno: HeaderModel.InvoiceNo,
                Invoicedate: HeaderModel.InvoiceDate ? new Date(HeaderModel.InvoiceDate) : null,
                Noofboxes: HeaderModel.NoOfBoxes,
                Qty: HeaderModel.Qty,
                Baseunit: HeaderModel.BaseUnit,
                Totalbox: HeaderModel.TotalBox,
                Boxtype: HeaderModel.BoxType,
                Remarks: HeaderModel.Remarks,
                Capcolordes: HeaderModel.CapColorDes,
                Capcolorcode: HeaderModel.CapColorCode,
                Capprintmsg: HeaderModel.CapPrintMsg,
                Capprintink: HeaderModel.CapPrintInk,
                Bodycolordes: HeaderModel.BodyColorDes,
                Bodycolorcode: HeaderModel.BodyColorCode,
                Bodyprintmsg: HeaderModel.BodyPrintMsg,
                Bodyprintink: HeaderModel.BodyPrintInk
            };

            console.log(new Date());
            console.log(new Date().toISOString());

            PACKSLIPModel.create("/ZCE_PACKSLIP_TABL", oHeaderPayload, {
                success: function (oData) {
                    oBusyDialog.close();
                    var aItems = oData;
                    if (oData) {
                        that.getPackingOrders();
                    }
                },
                error: function (oError) {
                    oBusyDialog.close();
                    console.error("Error reading data: ", oError);
                }
            });

        },
        onReject: function () {

        },

        // =============== Process Order Fragment ===========================

        onOrderNoHelpRequest: function () {
            var oModel = this.getView().getModel("ZCE_ZCOUNT_HEAD_SRVB");
            var that = this;
            var aAllItems = [];

            // Show busy indicator at the very beginning
            sap.ui.core.BusyIndicator.show();

            function fetchData(skipCount) {
                oModel.read("/ZCE_ZCOUNT_PROCESS_ORD_F4HELP", {
                    urlParameters: {
                        $top: 5000,
                        $skip: skipCount
                    },
                    success: function (oData) {
                        var aItems = oData.results;
                        aAllItems = aAllItems.concat(aItems);

                        if (oData.results.length >= 5000) {
                            fetchData(skipCount + 5000);
                        } else {
                            finishFetching();
                            sap.ui.core.BusyIndicator.hide();
                        }
                    },
                    error: function (oError) {
                        console.error("Error reading data: ", oError);
                        sap.ui.core.BusyIndicator.hide();
                    }
                });

            }

            function finishFetching() {
                that.oJSONModel = new sap.ui.model.json.JSONModel({
                    Datas: aAllItems
                });
                that.getView().setModel(that.oJSONModel, "oJSONModel");

                that._oBasicSearchField = new sap.m.SearchField();
                that.loadFragment({
                    name: "zautodesignapp.view.zpackslip.transaction.fragment.ProcessOrder"
                }).then(function (oDialog) {
                    var oFilterBar = oDialog.getFilterBar();
                    var oColumnProductCode;
                    that._oVHD = oDialog;
                    that.getView().addDependent(oDialog);

                    oDialog.setRangeKeyFields([{
                        label: "Process Order",
                        key: "ProcessOrder",
                        type: "string",
                        typeInstance: new sap.ui.model.type.String({}, {
                            maxLength: 10
                        })
                    }]);

                    oFilterBar.setFilterBarExpanded(false);
                    oFilterBar.setBasicSearch(that._oBasicSearchField);

                    that._oBasicSearchField.attachSearch(function () {
                        oFilterBar.search();
                    });

                    oDialog.getTableAsync().then(function (oTable) {
                        oTable.setModel(that.oJSONModel);

                        if (oTable.bindRows) {
                            oTable.bindAggregation("rows", {
                                path: "oJSONModel>/Datas",
                                events: {
                                    dataReceived: function () {
                                        oDialog.update();
                                        sap.ui.core.BusyIndicator.hide(); // Hide when desktop table is ready
                                    }
                                }
                            });

                            oColumnProductCode = new sap.ui.table.Column({
                                label: new sap.m.Label({ text: "Process Order" }),
                                template: new sap.m.Text({ text: "{oJSONModel>ProcessOrder}" })
                            });
                            oColumnProductCode.data({ fieldName: "ProcessOrder" });
                            oTable.addColumn(oColumnProductCode);

                        } else if (oTable.bindItems) {
                            oTable.bindAggregation("items", {
                                path: "oJSONModel>/Datas",
                                template: new sap.m.ColumnListItem({
                                    cells: [
                                        new sap.m.Text({ text: "{oJSONModel>ProcessOrder}" })
                                    ]
                                }),
                                events: {
                                    dataReceived: function () {
                                        oDialog.update();
                                        sap.ui.core.BusyIndicator.hide(); // Hide when mobile table is ready
                                    }
                                }
                            });

                            oTable.addColumn(new sap.m.Column({
                                header: new sap.m.Label({ text: "Process Order" })
                            }));
                        }

                        oDialog.update(); // Fallback in case dataReceived doesn’t fire
                        oDialog.open();
                    }).catch(function () {
                        sap.ui.core.BusyIndicator.hide(); // Hide if fragment fails to load
                    });
                }).catch(function () {
                    sap.ui.core.BusyIndicator.hide(); // Hide if fragment loading throws error
                });
            }

            // Start fetching
            fetchData(0);
        },
        onValueHelpOkPress: function (oEvent) {
            var aTokens = oEvent.getParameter("tokens");
            var sSelectedValue = aTokens[0].getKey();

            var oModel = this.getView().getModel("HeaderDataModel");
            oModel.setProperty("/ProcessOrder", sSelectedValue);
            this._oVHD.close();
            this.getPackingOrders();

        },

        onValueHelpCancelPress: function () {
            this._oVHD.close();
        },

        onValueHelpAfterClose: function () {
            this._oVHD.destroy();
        },

        onFilterBarSearch: function (oEvent) {
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
                    new sap.ui.model.Filter({ path: "ProcessOrder", operator: sap.ui.model.FilterOperator.Contains, value1: sSearchQuery })

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
        },


        OnSuggest_User: function (oEvent) {
            var sTerm = oEvent.getParameter("suggestValue");
            console.log("Press")

            this._connectToODataProductSearchService(sTerm)
                .then(function (aSuggestions) {
                    // Clear previous suggestions
                    this.destroySuggestionItems();
                    // Add new suggestions to the input field
                    for (var i = 0; i < aSuggestions.length; i++) {
                        this.addSuggestionItem(new sap.ui.core.Item({
                            text: aSuggestions[i]
                        }));
                    }
                }.bind(oEvent.getSource()));
        },

        // Connect to the OData service and fetch suggestions
        _connectToODataProductSearchService: function (sTerm) {
            var oModel = this.getView().getModel("ZCE_ZCOUNT_HEAD_SRVB"); // OData Model
            var aFilters = [
                new sap.ui.model.Filter("ProcessOrder", sap.ui.model.FilterOperator.Contains, sTerm) // Search based on Name
            ];

            return new Promise(function (fnResolve, fnReject) {
                // Perform OData read request
                oModel.read("/ZCE_ZCOUNT_HEAD", {  // Replace "/ProductSet" with your OData entity set
                    filters: aFilters,
                    success: function (oData) {
                        var aResults = oData.results.map(function (mProduct) {
                            return mProduct.ProcessOrder;  // Assuming Name is the field you're interested in
                        });

                        // Resolve with the list of suggestions
                        fnResolve(aResults);
                    },
                    error: function (oError) {
                        console.error("Error fetching suggestions from OData service:", oError);
                        fnReject(oError);
                    }
                });
            });
        },


        // // // // Event handler for suggestion item selection
        ondocumentsuggestselected: function (oEvent) {
            // Show the busy indicator as soon as the item is selected
            sap.ui.core.BusyIndicator.show();

            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                var sSelectedKey = oSelectedItem.getKey();
                var sSelectedText = oSelectedItem.getText();
                console.log("Selected Item:", sSelectedKey, sSelectedText);
                this.SelectInputType = 'select'
                // Set the selected key into the input field
                var oMultiInput = this.getView().byId("idprocessorder");
                oMultiInput.setValue(sSelectedText); // Set the selected key into the MultiInput field
            }

            // Hide the busy indicator after the update
            sap.ui.core.BusyIndicator.hide();
        },

        // PRINT function : ====================================================================================================================
        onPrintPress: async function () {
            sap.ui.core.BusyIndicator.show();

            var oProcessOrder = this.getView().getModel("HeaderDataModel").getProperty("/ProcessOrder");

            var oSerialNo = this.getView().getModel("HeaderDataModel").getProperty("/serialNo");

            if(!oProcessOrder || !oSerialNo){
                sap.m.MessageBox.information("Please enter both Process Order and Serial No ");
                sap.ui.core.BusyIndicator.hide();
                return;
            }

            try {
                // Construct service URL
                const sServiceUrl = `/sap/bc/http/sap/Z_ZPACK_SLIP?processorder=${oProcessOrder}&serno=${oSerialNo}}`;
                console.log("Service URL:", sServiceUrl);

                // Fetch PDF data
                const pdfData = await this.fetchPDFData(sServiceUrl);
                const pdfContentArray = [pdfData];

                // Display the PDF
                this.displayPDFs(pdfContentArray);

                // Clear inputs                             

                sap.m.MessageToast.show("PDF displayed successfully!");
            } catch (error) {
                console.error("Error generating PDF:", error);
                sap.m.MessageToast.show("Failed to generate PDF. Please try again.");
            } finally {
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

            this._pdfViewer.setTitle("Packing Slip");
            this._pdfViewer.open();
        }





    });
});