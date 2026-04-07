sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/IconPool",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Component",
    "sap/ui/core/UIComponent",
    "sap/m/routing/Router"


  ],
  function (BaseController, IconPool, JSONModel, UIComponent, Component, Router) {
    "use strict";

    return BaseController.extend("zautodesignapp.controller.acm.downtime.acm_downtime", {
      onInit: function () {
        this.downtimeModel = new sap.ui.model.json.JSONModel({
          HeaderData: [{
            daterange: "",
            machineno: ""
          }],

          TableVisible: false
        });
        this.getView().setModel(this.downtimeModel, "downtimeModel");



        const tabACMModel = new sap.ui.model.json.JSONModel({
          ItemData: [
            {
              sap_uuid: "",
              acmno: "",
              speed: "",
              No_bar: "",
              shift: "",
              dates: "",
              cur_dips: " ",
              total_down_time: "",
              color_change: "0",
              mechanical: "0",
              process: "0",
              electrical: "0",
              a_c: "0",
              gel_room: "0",
              qc_qa: "0",
              power_off: "0",
              preventive: "0",
              plc: "0",
              modification: "0",
              power_shutdown: "0",
              elec_shutdown: "0",
              size_change: "0",
              no_order: "0"
            },


          ]
        });
        this.getView().setModel(tabACMModel, "tabACMModel");

      },

   

      GoDowntimeselect: function () {


        const headerData = this.downtimeModel.getProperty("/HeaderData/0");
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
        this.downtimeModel.setProperty("/TableVisible", true);


        let FromDate = "", ToDate = "";
        if (bHasDate) {
          const myArray = Dates.split(" - ");
          const datefrom = new Date(myArray[0]);
          const dateto = new Date(myArray[1]);
          FromDate = new Date(datefrom.getTime() - (datefrom.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
          //ToDate = new Date(dateto.getTime() - (dateto.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
        }

        //  Filter Logic
        let FinalFilter = [];

        // if (bHasOrder) {
        //     FinalFilter.push(new sap.ui.model.Filter("ManufacturingOrder", sap.ui.model.FilterOperator.EQ, processorder));
        // }

        if (bHasDate) {
          FinalFilter.push(new sap.ui.model.Filter("dates", sap.ui.model.FilterOperator.EQ, FromDate));
        }


        if (bHasmachine) {
          FinalFilter.push(new sap.ui.model.Filter("acmno", sap.ui.model.FilterOperator.EQ, machineno));
        }




        // Data fetch
        const model0 = this.getView().getModel("ZAU_ACM_DOWNTIME_SRVB");
        let aAllItems = [];
        let iSkip = 0;
        const iTop = 100;
        const that = this;

        that.getView().setBusy(true);

        function fetchData() {
          model0.read("/ZCE_DOWNTIMEENTRY", {
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


                const tabdwontimeModel = new sap.ui.model.json.JSONModel(
                  { ItemData: aAllItems }
                );
                that.getView().setModel(tabdwontimeModel, "tabdwontimeModel");



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



      OnDownTimeCheck: function () {
        if (!this.ChFrag) {
          this.ChFrag = sap.ui.xmlfragment(this.getView().getId("iddowntimevalue"), "zautodesignapp.view.acm.downtime.fragment.valuehelp", this);
          this.getView().addDependent(this.ChFrag);
        }
        this.ChFrag.open();
      },


      OnClose: function () {
        this.ChFrag.close();

      },

      onButtonPress: function (oEvent) {
        var sSelectedMachineNo = oEvent.getSource().getText();

        var sUpdatedMachineNo = sSelectedMachineNo;
        if (this.downtimeModel) {
          this.downtimeModel.setProperty("/HeaderData/0/selectedMachine", sUpdatedMachineNo); // Update model property
        } else {
          console.error("downtimeModel not found.");
        }

        // Close the dialog
        this.ChFrag.close();
      },




      onRowSelect: function (oEvent) {
        const selectedIndex = oEvent.getParameter("rowIndex");
        this._selectedIndex = selectedIndex; // stores it in controller
      },


      onCreatePress: function () {
        return new Promise((resolve, reject) => {
          const tabACMModel = this.getView().getModel("tabdwontimeModel");
          const items = tabACMModel.getProperty("/ItemData");
          const selectedIndex = this._selectedIndex;

          if (typeof selectedIndex !== "number" || selectedIndex < 0) {
            sap.m.MessageToast.show("Please select a row first.");
            return;
          }

          const rowData = items[selectedIndex];
          const totalDownTime = parseFloat(rowData.total_down_time);

          const inputFields = [
            "color_change", "mechanical", "process", "electrical", "a_c",
            "gel_room", "qc_qa", "power_off", "preventive", "plc",
            "modification", "elec_shutdown", "power_shutdown", "size_change", "no_order"
          ];

          let sum = 0;
          let missingFields = [];

          inputFields.forEach((field) => {
            const val = parseFloat(rowData[field]);
            if (isNaN(val)) {
              missingFields.push(field);
            } else {
              sum += val;
            }
          });

          if (missingFields.length > 0) {
            sap.m.MessageBox.warning(`Please enter numeric values for: ${missingFields.join(", ")}`);
            return;
          }

          if (Math.abs(sum - totalDownTime) > 0.01) {
            sap.m.MessageBox.warning(
              `Sum of inputs (${sum.toFixed(2)}) does not match Total Down Time (${totalDownTime}). Please review.`
            );
            return;
          }

          const oDataModel = this.getView().getModel("ZAU_ACM_DOWNTIME_SRVB");

          const payload = {
            sap_uuid:rowData.sap_uuid,
            Acmno: rowData.acmno,
            Speed: rowData.speed,
            NoBar: rowData.No_bar,
            Shift: rowData.shift,
            Dates: rowData.dates,
            CurDips: rowData.cur_dips,
            TotalDownTime: rowData.total_down_time,
            ColorChange: rowData.color_change,
            Mechanical: rowData.mechanical,
            Process: rowData.process,
            Electrical: rowData.electrical,
            AC: rowData.a_c,
            GelRoom: rowData.gel_room,
            QcQa: rowData.qc_qa,
            PowerOff: rowData.power_off,
            Preventive: rowData.preventive,
            Plc: rowData.plc,
            Modification: rowData.modification,
            PowerShutdown: rowData.power_shutdown,
            ElecShutdown: rowData.elec_shutdown,
            SizeChange: rowData.size_change,
            NoOrder: rowData.no_order
          };

          const filters = [
            new sap.ui.model.Filter("sap_uuid", sap.ui.model.FilterOperator.EQ, rowData.sap_uuid),
            // new sap.ui.model.Filter("Speed", sap.ui.model.FilterOperator.EQ, rowData.speed),
            // new sap.ui.model.Filter("NoBar", sap.ui.model.FilterOperator.EQ, rowData.No_bar),
            // new sap.ui.model.Filter("Shift", sap.ui.model.FilterOperator.EQ, rowData.shift),
            // new sap.ui.model.Filter("Dates", sap.ui.model.FilterOperator.EQ, rowData.dates)
          ];

          sap.m.MessageBox.warning("Do you want to submit this data?", {
            actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
            emphasizedAction: sap.m.MessageBox.Action.YES,
            onClose: function (sAction) {
              if (sAction === sap.m.MessageBox.Action.YES) {
                sap.ui.core.BusyIndicator.show();

                // Step 1: Check if record exists
                oDataModel.read("/ZC_DOWNTIME", {
                  filters: filters,
                  success: function (oData) {
                    if (oData.results && oData.results.length > 0) {
                      // Record exists → Update
                      const existingEntry = oData.results[0];
                      
                      oDataModel.update("/ZC_DOWNTIME('" + existingEntry.sap_uuid + "')", payload, {
                        success: function () {
                          sap.ui.core.BusyIndicator.hide();
                          sap.m.MessageToast.show("Data updated successfully.");

                          // // Clear inputs
                          // inputFields.forEach((field) => {
                          //   rowData[field] = "";
                          // });
                          // // rowData.total_down_time = "";
                          // // rowData.cur_dips = "";
                          // tabACMModel.setProperty("/ItemData/" + selectedIndex, rowData);

                          resolve();
                        },
                        error: function (err) {
                          sap.ui.core.BusyIndicator.hide();
                          sap.m.MessageBox.error("Update failed.");
                          reject(err);
                        }
                      });

                    } else {
                      // Record doesn't exist → Create
                      oDataModel.create("/ZC_DOWNTIME", payload, {
                        success: function () {
                          sap.ui.core.BusyIndicator.hide();
                          sap.m.MessageToast.show("Data created successfully.");

                          // // Clear inputs
                          // inputFields.forEach((field) => {
                          //   rowData[field] = "";
                          // });
                          // rowData.total_down_time = "";
                          // rowData.cur_dips = "";
                          // tabACMModel.setProperty("/ItemData/" + selectedIndex, rowData);

                          resolve();
                        },
                        error: function (err) {
                          sap.ui.core.BusyIndicator.hide();
                          sap.m.MessageBox.error("Creation failed.");
                          reject(err);
                        }
                      });
                    }
                  },
                  error: function (err) {
                    sap.ui.core.BusyIndicator.hide();
                    sap.m.MessageBox.error("Error while checking existing data.");
                    reject(err);
                  }
                });
              }
            }
          });
        });
      }


    });



  });
