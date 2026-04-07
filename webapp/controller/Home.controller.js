sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/Device",
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
    function (Controller, Device, MessageBox, MessageToast, Fragment, Filter, FilterOperator, JSONModel, UI5Date) {
        "use strict";

        return Controller.extend("zautodesignapp.controller.Home", {
            onInit: function () {
                this.TotalVal = 0;
                // this.TotalArr = [];
                this.currenttodaydate = new Date();
                this.currenttodaydate.setHours(0, 0, 0, 0);

                // // Get Session User  
                var userInfoService = sap.ushell.Container.getService("UserInfo");
                var userName = userInfoService.getUser().getFullName();
                this.TENTUSERID = userInfoService.getUser().getId();
                this.TENTUSERNAME = userInfoService.getUser().getFullName();
                console.log("getId:", this.TENTUSERID);
                console.log("User Name: " + this.TENTUSERNAME);
                // // Get Session User  






            },

            onAfterRendering: function () {
                console.log("this.currenttodaydate22:, ", this.currenttodaydate)
                let modelINWARD = this.getView().getModel("ZI_GE_INWARD_GATE_BINDING");
                let modelOUT = this.getView().getModel("ZI_GE_OUTWARD_GATE_BINDING");
                let modelRGPNRGP = this.getView().getModel("ZGE_RGP_NRGP_HEAD_SRVB");
                let FilterDate = new sap.ui.model.Filter("GateEntryDate", sap.ui.model.FilterOperator.GE, this.currenttodaydate)
                let FilterDate1 = new sap.ui.model.Filter("GateEnrtyDate0", sap.ui.model.FilterOperator.GE, this.currenttodaydate)
                let FilterGE3 = new sap.ui.model.Filter("ScreenCode", sap.ui.model.FilterOperator.EQ, "GE3")
                let FilterGE4 = new sap.ui.model.Filter("ScreenCode", sap.ui.model.FilterOperator.EQ, "GE4")
                let FilterGE5 = new sap.ui.model.Filter("ScreenCode", sap.ui.model.FilterOperator.EQ, "GE5")
                let FilterGE21 = new sap.ui.model.Filter("ScreenCode", sap.ui.model.FilterOperator.EQ, "GE21")

                var that = this;



                // // uncomment Delete Code

                // var model0 = this.getView().getModel("ZSB_AU_FT_ITEM");
                // var EntitySet = "/ZC_AU_FT_ITEM";

                //     var that = this;
                //     model0.read(""+EntitySet+"", {
                //         success: function (oData, oRespons) {
                //             console.log("oDataDelete", oData);
                //             var aItems = oData.results;
                //                     for (var i = 0; i < aItems.length; i++) {
                //                         var Id = aItems[i].Id;
                //                         var Sno = aItems[i].Sno;

                //                         var oModel05 = that.getView().getModel("ZSB_AU_FT_ITEM");
                //                         oModel05.setHeaders({
                //                         "X-Requested-With": "X",
                //                         "Content-Type": "application/json"
                //                         });
                //                         oModel05.remove("/ZC_AU_FT_ITEM(Id='"+ Id +"',Sno="+Sno+")", {
                //                         success: function(data) {
                //                             console.log("Deleted")
                //                         },
                //                         error: function(error) {
                //                             // console.error("Error updating header:", error);
                //                             console.log("Not Deleted")
                //                         }
                //                         });
                //                     }
                //         }
                //     });

               



            },






        });
    });
