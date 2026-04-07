sap.ui.define(
  [
      "sap/ui/core/mvc/Controller",
      "sap/ui/core/IconPool",
      "sap/ui/model/json/JSONModel"
  ],
  function(BaseController, IconPool, JSONModel) {
    "use strict";

    return BaseController.extend("zautodesignapp.controller.App", {
      onInit: function() {

        this.NavBarVal = "0";
        this.oSplitApp = this.getView().byId("splitApp");

        var b = [];
        var c = {};
        //Fiori Theme font family and URI
        var t = {
          fontFamily: "SAP-icons-TNT",
          fontURI: sap.ui.require.toUrl("sap/tnt/themes/base/fonts/")
        };
          //Registering to the icon pool
          IconPool.registerFont(t);
          b.push(IconPool.fontLoaded("SAP-icons-TNT"));
          c["SAP-icons-TNT"] = t;
          //SAP Business Suite Theme font family and URI
          var B = {
            fontFamily: "BusinessSuiteInAppSymbols",
            fontURI: sap.ui.require.toUrl("sap/ushell/themes/base/fonts/")
          };
          //Registering to the icon pool
          IconPool.registerFont(B);
          b.push(IconPool.fontLoaded("BusinessSuiteInAppSymbols"));
          c["BusinessSuiteInAppSymbols"] = B;


          // In Below Model for Module List 
            this.JSonModelTransApp = new sap.ui.model.json.JSONModel({
                Datas:[]
            });
            this.getView().setModel(this.JSonModelTransApp, "JSonModelTransApp");

            // // Get Session User  
                var userInfoService = sap.ushell.Container.getService("UserInfo");
                var userName = userInfoService.getUser().getFullName();
                this.TENTUSERID = userInfoService.getUser().getId();
                this.TENTUSERNAME = userInfoService.getUser().getFullName();
                console.log("getId:" , this.TENTUSERID);
                console.log("User Name: " + this.TENTUSERNAME);
            // // Get Session User  

            // var sDetailViewName = "zautodesignapp.view.Home"; 
            // this.getView().byId("sideNavigation").setVisible(true);
        
            //         // Destroy the current detail page
            //         var oDetailPage = this.oSplitApp.getDetailPages()[0];
            //         if (oDetailPage) {
            //           oDetailPage.destroy();
            //         }
          
            //         // Create and set the new detail page
            //         var oNewDetailPage = sap.ui.xmlview({
            //           viewName: sDetailViewName
            //         });
          
            //         this.oSplitApp.addDetailPage(oNewDetailPage);
            //         this.oSplitApp.toDetail(oNewDetailPage); 

      
            this.svgLogo = sap.ui.require.toUrl("zautodesignapp/images/NCL.png");

            this.getView().setModel(new JSONModel({
              svgLogo: this.svgLogo
            }));
            
            console.log("KK1", this.svgLogo);

            

            
      },


            // onAfterRendering: function () {
               

            // },

   

      
      onAfterRendering: function(){
        var oSplitApp = this.getView().byId("splitApp");
        oSplitApp.getAggregation("_navMaster").addStyleClass("masterStyleAfter");


        //  var oUserRoleModel = new sap.ui.model.json.JSONModel();
        //         this.getView().setModel(oUserRoleModel, "UserModel");

        //         var oModel = this.getView().getModel("ZCE_USERBUSINESSROLE_SRB"); // OData V2 service
        //         var sUserId = sap.ushell.Container.getUser().getId(); // gets current logged-in user

        //         var filter1 = new sap.ui.model.Filter("UserID", sap.ui.model.FilterOperator.EQ, sUserId)
        //         var filter2 = new sap.ui.model.Filter("BusinessRole", sap.ui.model.FilterOperator.EQ, "ZF_FT_SCREEN_ROLE")
        //         var filter3 = new sap.ui.model.Filter("BusinessRole", sap.ui.model.FilterOperator.EQ, "ZF_ACM_SCREEN_ROLE")
        //        var filter4 = new sap.ui.model.Filter("BusinessRole", sap.ui.model.FilterOperator.EQ, "ZF_QA01_SCREEN_ROLE")
        //  var filter5 = new sap.ui.model.Filter("BusinessRole", sap.ui.model.FilterOperator.EQ, "ZF_ATS_SCREEN_ROLE")
        //  var filter6 = new sap.ui.model.Filter("BusinessRole", sap.ui.model.FilterOperator.EQ, "ZF_QA02_SCREEN_ROLE")
        //  var filter7 = new sap.ui.model.Filter("BusinessRole", sap.ui.model.FilterOperator.EQ, "ZF_AIS_SCREEN_ROLE")
        //  var filter8= new sap.ui.model.Filter("BusinessRole", sap.ui.model.FilterOperator.EQ, "ZF_QA03_SCREEN_ROLE")
        //  var filter9= new sap.ui.model.Filter("BusinessRole", sap.ui.model.FilterOperator.EQ, "ZF_PTG_SCREEN_ROLE")
        //  var filter10= new sap.ui.model.Filter("BusinessRole", sap.ui.model.FilterOperator.EQ, "ZF_ZCOUNT_SCREEN_ROLE")
        //  var filter11= new sap.ui.model.Filter("BusinessRole", sap.ui.model.FilterOperator.EQ, "ZF_MASTER_DIPS_ROLE")
        //   var filter12= new sap.ui.model.Filter("BusinessRole", sap.ui.model.FilterOperator.EQ, "ZF_WASTAGE_SCREEN_ROLE")
        //    var filter13= new sap.ui.model.Filter("BusinessRole", sap.ui.model.FilterOperator.EQ, "ZF_YBCR_REPORT_ROLE")



        //         var that = this;
        //         oModel.read("/ZCE_USERBUSINESSROLE", {
        //             filters: [filter1, filter2, filter3,  filter4,filter5,filter6,filter7,filter8,filter9,filter10,filter11,filter12,filter13],
        //             success: function (oData) {
        //                if (oData.results.length > 0) {
        //                     //   console.log("Tenant user found:", tenantUser);
        //                       that.AdminPanelAuth = new sap.ui.model.json.JSONModel({
        //                         Samples: {Role : true}
        //                       });
        //                       that.getView().setModel(that.AdminPanelAuth, "AdminPanelAuth");
        //                       console.log("that.AdminPanelAuth:", that.AdminPanelAuth);
        //                       sap.ui.core.BusyIndicator.hide();
        //                       //resolve(oData.results);
    
        //                       // You can handle the case where the tenant user is found here
        //                   } else {
        //                       console.log("Tenant user not found");
        //                       that.AdminPanelAuth = new sap.ui.model.json.JSONModel({
        //                         Samples: {Role : false}
        //                       });
        //                       that.getView().setModel(that.AdminPanelAuth, "AdminPanelAuth");
        //                       console.log("that.AdminPanelAuth:", that.AdminPanelAuth);
        //                       sap.ui.core.BusyIndicator.hide();
        //                        // resolve(oData.results);
        //                     }
        //             },
        //             error: function (oError) {
        //                 console.error("Failed to fetch roles", oError);
        //                 oUserRoleModel.setProperty("/roles", []);
        //             }
        //         });

         
      
      
      
      },

      OnClick:function(){
        var oSideNavigation = this.byId("sideNavigation");
        var bExpanded = oSideNavigation.getExpanded();
      
        // console.log("oSideNavigation", oSideNavigation)
        // console.log("bExpanded", bExpanded)

        if(bExpanded === true){
          var oSplitApp = this.getView().byId("splitApp");
          oSplitApp.getAggregation("_navMaster").removeStyleClass("masterStyleAfter");
          oSplitApp.getAggregation("_navMaster").addStyleClass("masterStyle");
          this.getView().byId("SideBarHeaderLogo").setVisible(false);
          this.getView().byId("SideBarHeaderCName").setVisible(false);
        }

        else if(bExpanded === false){
          var oSplitApp = this.getView().byId("splitApp");
          oSplitApp.getAggregation("_navMaster").addStyleClass("masterStyleAfter");
          oSplitApp.getAggregation("_navMaster").removeStyleClass("masterStyle");
          this.getView().byId("SideBarHeaderLogo").setVisible(true);
          this.getView().byId("SideBarHeaderCName").setVisible(true);
        }

        oSideNavigation.setExpanded(!bExpanded);
      },

      OnNavBtn: function (oEvent) {
        var oSelectedItem = oEvent.getParameter("item");
        var sKey = oSelectedItem.getKey();
        var sText = oSelectedItem.getText();
    
        // // Now, you can use sKey and sText as needed
        // console.log("Selected Key:", sKey);
        // console.log("Selected Text:", sText);
    
        // var sItemTitle = oEvent.getSource().getTitle();
        var sDetailViewName = "zautodesignapp.view." + sKey;

        // Destroy the current detail page
        var oDetailPage = this.oSplitApp.getDetailPages()[0];
        if (oDetailPage) {
          oDetailPage.destroy();
        }

        // Create and set the new detail page
        var oNewDetailPage = sap.ui.xmlview({
          viewName: sDetailViewName
        });

        this.oSplitApp.addDetailPage(oNewDetailPage);
        this.oSplitApp.toDetail(oNewDetailPage);
    }, 
    
    OnExpandItems:function(oEvent){

      if(oEvent.getParameter("item").getExpanded() === false){
        oEvent.getParameter("item").setExpanded(true);
      }
      else{
        oEvent.getParameter("item").setExpanded(false);
      }
      
    },

    });
  }
);
