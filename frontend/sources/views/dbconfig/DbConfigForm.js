import { JetView } from "webix-jet";
import { defaultHeader } from "../../helpers/api";
import { state, url } from "../../models/DbConfig";
import { reloadDbConfig } from './DbConfigPage';

const prefix = state.prefix;

function WindowForm() {
	let isEditMode = state.isEdit;

	let labelW = 100,
		winId = prefix + "_win",
		winLabel = "DB Config";
	return {
		view: "window",
		modal: true,
		id: winId,
		position: "center",
		move: true,
		head: {
			height: 38,
			template: !isEditMode ? "Add " + winLabel : "Edit " + winLabel
		},
		body: {
			rows: [
				{
					padding: 10,
					view: "form",
					id: prefix + "_form",
					width: 400,
					type: "clean",
					elements: [
						{
							view: "text",
							label: "Name",
							name: "conn_name",
							id: prefix + "_conn_name"
						},
						{
							view: "text",
							label: "Host",
							name: "host",
							id: prefix + "_host",
						},
						{
							view: "text",
							label: "Port",
							name: "port",
							id: prefix + "_port",
							type: "number"
						},
						{
							view: "text",
							label: "Database",
							name: "database",
							id: prefix + "_database"
						},
						{
							view: "text",
							label: "User",
							name: "user",
							id: prefix + "_user"
						},
						{
							view: "text",
							label: "Password",
							name: "password",
							id: prefix + "_password",
							type: "password",
						}
					],
					rules: {
						conn_name: webix.rules.isNotEmpty,
						host: webix.rules.isNotEmpty
					},
					on: {
						onAfterValidation: function(result, value) {
							if (!result) {
								var text = [];
								for (var key in value) {
									if (key == "conn_name")
										text.push("Name can't be empty");
									if (key == "host")
										text.push("Host can't be empty");
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
					view: "toolbar",
					elements: [
						{
							view: "button",
							value: "Test",
							autowidth: true,
							click: function() {
							}
						},
						{},
						{
							view: "button",
							label: !isEditMode ? "Save" : "Update",
							autowidth: true,
							id: prefix + "_save_btn",
							click: function() {
								if ($$(prefix + "_form").validate()) {
									save();
								}
							}
						},
						{
							view: "button",
							value: "Cancel",
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
			}
		}
	};
}

function save() {
	var data = $$(prefix + "_form").getValues(),
		msgName = `${data.conn_name}`;
	if (!state.isEdit) {
		webix
			.ajax()
			// .headers(defaultHeader())
			.post(url, data, function(res) {
				webix.message({ text: "<strong>" + msgName + "</strong> saved." });
				reloadDbConfig();
			})
			.fail(function(err) {
				showError(err);
			});
	} else {
		webix
			.ajax()
			// .headers(defaultHeader())
			.put(`${url}/${data.id}`, data, function(res) {
				webix.message({ text: "<strong>" + msgName + "</strong> updated." });
				reloadDbConfig();
			})
			.fail(function(err) {
				showError(err);
			});
	}
	cancel();
}

function cancel() {
	$$(prefix + "_form").clear();
	$$(prefix + "_win").destructor();
	defaultBtn();
}

function defaultBtn() {
	$$(prefix + "_edit_btn").hide();
	$$(prefix + "_delete_btn").hide();
	$$(prefix + "_table").clearSelection();
}

export class DbConfigForm extends JetView {
	config() {
		return WindowForm();
	}
	show(target) {
		this.getRoot().show(target);
	}
	init(view) {}
	ready(view) {
		this.$$(prefix + "_form").setValues(state.dataSelected);
		if (!state.isEdit) {
			$$(prefix + "_form").clear();
		} else {
			if (state.dataSelected.id == 1) {
				$$(prefix + "_form").disable();
				$$(prefix + "_save_btn").disable();
			}
		}
	}
}
