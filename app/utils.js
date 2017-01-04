// app/utils.js

var logLevel = 1;


function createResponseRecord() {
	return {
			classifier           		: "",
			usage                		:  1,
			score                		: 0,
			client_id					: 0,
			inventurnummer       		: "",
			response             		: "Hi. I am your Watson Maintenance Advisor. Ask me something",
			dialog_id            		: "",
			conversation_id      		: "",
			dialog_node                	: "",
			dialog_turn_counter        	: 1,
			dialog_request_counter 		: 1,
			cluster_id                	: "",
			collection_name            	: "",
			ranker_id                   : "",
			internalError				: ""
	};
}

function logging(message) {
	var separator = "========================";
	if (logLevel > 0) {
		console.log("\n" + separator + "\n" + message + "\n" + separator + "\n");
	}
}

function isEmpty(str) {
    return (str == null) || (str == undefined) || (!str) || (str.length == 0) ;
    //return (str === null) || (str === undefined) || (!str) || (str.length === 0) || (Object.keys(str).length === 0);
}


function isNotEmpty(str) {
	return !isEmpty(str);
}

function contains(r,s){
    var baseStr = r.toString();
    var ind = baseStr.indexOf(s);

    console.log("---------------- CONTAINS: "+r+"    "+s+"       "+ind);
    return ind > -1;
}


module.exports = {
    createResponseRecord	: createResponseRecord,
	logging 				: logging,
    contains 				: contains,
	isEmpty					: isEmpty,
	isNotEmpty				: isNotEmpty
}