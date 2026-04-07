
sap.ui.define([], function () {
    "use strict";

    return {
        stripFirstTwoFromTime: function (timeValue) {
            // Ensure the time value is a string and has the correct length
            if (timeValue && typeof timeValue === "string" && timeValue.length >= 5) {
                // Remove the first two characters (hours part) from the time string
                return timeValue.substring(3); // Keeps everything after the first two digits
            }
            return timeValue; // Return the original time value if it's invalid
        },


        // isReverseEnabled: function (status, roles) {
        //     // Check role
        //     const hasRole =
        //         Array.isArray(roles) &&
        //         roles.includes("ZPP_AUTO_YFCS_UPDATE_ROLE");

        //     // Always editable
        //     if (hasRole) {
        //         return true;
        //     }
        //     // No role, editable only when status is NOT 'X'
        //     return status !== "X";
        // }
        isReverseEnabled: function (status, roles, value) {
            // Check role
            const hasRole =
                Array.isArray(roles) &&
                roles.includes("ZPP_AUTO_YFCS_UPDATE_ROLE");

            // Always editable if user has role
            if (hasRole) {
                return true;
            }
            if(value && status === "X") {
                return false;
            }

            // // Editable if no value
            // if (!value) {
            //     return true;
            // }

            // // Otherwise, editable only when status is NOT 'X'
            // return status !== "X";
        }


    };
});