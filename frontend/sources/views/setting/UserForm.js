import { JetView } from "webix-jet";
import { defaultHeader } from "../../helpers/api";
import { state, url } from "../../models/User";
import { pageSize } from '../../helpers/ui';

const prefix = state.prefix;

let isEdit;

function WindowForm() {
	let isEditMode = state.isEdit;

	let labelW = 100,
		winId = prefix + "_win",
		winLabel = "User";
	return {
		view: "window",
		modal: true,
		id: winId,
		position: "center",
		move:true,
		width: 600,
		head: {
			height: 35,
			cols: [
				{ view:"icon", icon:"mdi mdi-plus", click: function () {
					$$(prefix+"_form").show();
					$$(prefix+"_cancel_btn").show();
					$$(prefix+"_username").focus();

				} },
				{ template: winLabel, css: "z-window-header webix_view webix_header webix_win_title", borderless: true},
				{ width: 30},
			]
		},
		body: {
			rows: [
				{
					hidden: true,
					padding: 10,
					view: "form",
					id: prefix + "_form",
					width: 600,
					type: "clean",
					elements: [
						{
							cols: [
								{
									view: "text",
									label: "Username",
									name: "username",
									labelWidth: 70,
									id: prefix + "_username"
								},
								{
									view: "text",
									label: "Password",
									name: "password",
									type: "password",
									labelWidth: 70,
									id: prefix + "_password",
									attributes: {
										autocomplete: "new-password",
									  },
								},
							]
						},
						{
							cols: [
								{
									view: "text",
									label: "Fullname",
									name: "fullname",
									labelWidth: 70,
									id: prefix + "_fullname"
								},
								{
									view: "text",
									label: "Email",
									name: "email",
									type: "email",
									labelWidth: 70,
									id: prefix + "_email"
								},
							]
						},
						{
							cols: [
								{
									view: "combo",
									label: "Role",
									name: "user_level",
									labelWidth: 70,
									id: prefix + "_role",
									options:[
										{ id:1, value:"Elephant" },
										{ id:2, value:"Spider" },
										{ id:3, value:"Turtle" }
									  ],
									value: 3,
								},
								{
								},
							]
						},
						{
							cols: [
								{width: 70},
								 {view: "button", value: "Save", autowidth: true, id: prefix + "_save_btn",
								 click: function() {
										if ($$(prefix + "_form").validate()) {
											save();
										}
									}
								},
								 {view: "button", value: "Delete", autowidth: true, hidden: true, id: prefix + "_delete_btn",
								 click: function() {
									remove();
									}
								},
								 {view: "button", value: "Cancel", autowidth: true,hidden: true, id: prefix + "_cancel_btn",
								 click: function() {
									 defaultBtn();
									cancelForm();
								}
								}
							]
						}
					],
					rules: {
						username: webix.rules.isNotEmpty,
						fullname: webix.rules.isNotEmpty,
						user_level: webix.rules.isNotEmpty,
					},
					on: {
						onAfterValidation: function(result, value) {
							if (!result) {
								var text = [];
								for (var key in value) {
									if (key == "username")
										text.push("Username can't be empty");
									if (key == "fullname")
										text.push("Fullname can't be empty");
									if (key == "user_level")
										text.push("Role can't be empty");
								}
								webix.message({ type: "error", text: text.join("<br>") });
							}
						}
					},
					elementsConfig: {
						labelPosition: "left",
						labelWidth: labelW,
						bottomPadding: 1
					}
				},
				{
					view:"datatable",
					minHeight:300,
					id: prefix+"_table",
					select: "row",
					columns:[
						{ id: "username", header:"Username", sort:"string", width: 150 },
						{ id: "fullname", header:"Fullname", sort:"string", width: 200 },
						{ id: "email", header:"Email",  sort:"string", width: 200 },
						{ id: "user_level", header:"Role", width: 100 },
						{ id: "last_login", header:"Last login", width: 150 },
					],
					url: url +"/users",
					pager: prefix+"_pagerA",
					on: {
						onItemClick: function (sel) {
							$$(prefix + "_form").show();
							$$(prefix + "_cancel_btn").show();
							$$(prefix + "_save_btn").show();
							$$(prefix + "_delete_btn").show();
							$$(prefix + "_password").setValue();
							isEdit = true;
							// const item = this.getItem(sel);
							// state.dataSelected = item;
							// state.isEdit = true;
						  },
					}
				},
				{
					view: "toolbar",
					elements: [
						{
							view: "pager",
							id: prefix+"_pagerA",
							css: "z-pager-aligned-left",
							size: pageSize,
							template: function(data, common) {
								var start = data.page * data.size,
									end = start + data.size;
								if (end > data.count) end = data.count;
								return (
									"<span class='z-pager-no'>" +
									(start + 1) +
									"-" +
									end +
									" of " +
									data.count +
									"</span> " +
									common.prev() +
									common.next() +
									`<button type="button" class="webix_pager_item z_refresh_user_pager" aria-label="Refresh page"><span class="webix_icon mdi mdi-sync"></span></button>`
								);
							},
							onClick:{
								"z_refresh_user_pager":function(e, el){
									reload();
									return false;
								}
							},
						},
						{},
						{
							view: "button",
							value: "Close",
							autowidth: true,
							click: function() {
								cancel();
							}
						}
					]
				}
			]
		},
		on: {
			onShow: function() {
				// $$(prefix + "_lable_size_inc").focus();
			}
		}
	};
}

function save() {
	var data = $$(prefix + "_form").getValues(),
		msgName = `${data.username} - ${data.fullname}`;
	if (!isEdit) {
		webix
			.ajax()
			// .headers(defaultHeader())
			.post(url + "/register", data, function(res) {
				webix.message({ text: "<strong>" + msgName + "</strong> saved.", type:"success" });
				reload();
			})
			.fail(function(err) {
				showError(err);
			});
	} else {
		webix
			.ajax()
			// .headers(defaultHeader())
			.put(url + "/users/" + data.id, data, function(res) {
				webix.message({ text: "<strong>" + msgName + "</strong> updated.", type:"success" });
				reload();
			})
			.fail(function(err) {
				showError(err);
			});
	}
}

const remove = () => {
	const dt = $$(prefix + "_table");
	const item = dt.getItem(dt.getSelectedId()),
	  msgName = item.username;

	if(item.username=='admin'){
		return webix.message({text: `Ops, <strong>admin</strong> user can not delete.`, type:"error"});
	}

	webix.confirm({
	  ok: "Yes",
	  cancel: "No",
	  text: "Are you sure to delete: <strong>" + msgName + "</strong> ?",
	  callback: function (result) {
		if (result) {
		  webix.ajax().del(url + "/users/" + item.id, null, function (res) {
			webix.message({text: `<strong>${msgName} </strong> deleted.`, type:"success"});
			reload();
		  });
		}
	  },
	});
  };

function reload() {
	$$(prefix + "_table").clearAll();
	$$(prefix + "_table").load(`${url}/users`);
	defaultBtn();
}

function cancel() {
	$$(prefix + "_form").clear();
	$$(prefix + "_win").destructor();
	// defaultBtn();
}

function defaultBtn() {
	$$(prefix + "_form").hide();
	$$(prefix + "_delete_btn").hide();
	$$(prefix + "_cancel_btn").hide();
	$$(prefix + "_table").clearSelection();
}

function cancelForm() {
	$$(prefix + "_username").setValue();
	$$(prefix + "_username").focus();
	$$(prefix + "_password").setValue();
	$$(prefix + "_fullname").setValue();
	$$(prefix + "_email").setValue();
	$$(prefix + "_role").setValue(3);
}

export class UserForm extends JetView {
	config() {
		return WindowForm();
	}
	show(target) {
		this.getRoot().show(target);
	}
	init(view) {}
	ready(view) {
		$$(prefix + "_form").bind($$(prefix + "_table"));
	  }
}
