import {JetView} from "webix-jet";
import {datarcd} from "models/records";


export default class DataView extends JetView{
	// http://localhost:5000/api/db_compare?source_id=1&target_id=3&schema=master
	config(){

		datarcd.sort("proname", "asc");
		return { 
			view:"datatable",
			id: "griddata",
			columns:[
			  { id:"specific_schema", header:"Schema", adjust: true},
			  { id:"proname", header:"Table Func", adjust: true},
			  { id:"type_udt_name", header:"Func Return", adjust: true},
			  { id:"params_in", header:"Params In", adjust: true},
			  { id:"params_out", header:"Params Out", adjust: true},
			  { id:"params_length", header:"Params InOut", adjust: true},
			  { id:"content_length", header:"Func Length", adjust: true},
			  { id:"cols_length", header:"Cols Length", adjust: true},
			  { id:"dtypes_length", header:"Cols Type Length", adjust: true},
			  { id:"cols_count", header:"Tbl Cols Count", adjust: true},
			  { id:"t_type", header:"Type", adjust: true},
			],
			// autoheight:true,
			// autowidth:true,
			data: datarcd
			// url: "http://localhost:5000/api/db_compare?source_id=1&target_id=3&schema=master"
		 };
	}
	init(view){
		this.$$("griddata").markSorting("proname", "asc");
	}
}