export default {
	id:"about_tab",
  css: "z_tab_about",
  template: `
  <div class='z_about_content'>
		<h3>About:</h3>
		<p><strong>ZPG</strong> an experimental side project written with <a href='https://nodejs.org' target='_blank'>NodeJS</a> and <a href='https://webix.com' target='_blank'>Webix</a> (<a href='https://www.npmjs.com/package/webix' target='_blank'>GPL license</a>), inspired by Jenkins and PgAdmin to improve unavailable features to make it simple and easy.<br>
		For more other functionality of Postgres please use PgAdmin</p>
		<p>Features idea:
			<ul>
				<li>Easy to navigate</li>
				<li>Task SQL continues integration</li>
				<li>Comparing between SQL function direct correction</li>
				<li>Simple query editor</li>
				<li>Easy copy data between database</li>
				<li>and more..</li>
			</ul>
		</p>

		<h4>Requirement:</h4>
		<p>
			<ul>
				<li>Postgres version 9.6 or above</li>
			</ul>
		</p>

		<h4>Limitation:</h4>
		<p>
			<ul>
				<li>Query not have cancel/stop, alternatively set timeout on setting menu (to be improve should do)</li>
			</ul>
		</p>
		<section>
			<h4>Todo:</h4>
			<ul>
			<li>all: load user setting from json profile</li>
			<li>share: reconstruct to separate table and notify socket.io</li>
				<li>query: change reload on user setting</li>
				<li>check compatible version</li>
				<li>dashboard: show process activity</li>
				<li>query: add note</li>
				</ul>
		</section>

		<section>
		<h4>Change log:</h4>
			<p>
			<h4>0.0.20-dev (30-07-2024)</h4>
				<ul>
					<li>database: add encrypted import export db connection</li>
					<li>fix compare</li>
				</ul>
			</p>
			<p>
			<h4>0.0.19-dev (03-12-2023)</h4>
				<ul>
					<li>task: add user group</li>
					<li>query: store latest left</li>
				</ul>
			</p>
			<p>
				<h4>0.0.18-dev (16-05-2023)</h4>
				<ul>
					<li>upd db tree and history preview</li>
				</ul>
			</p>
			<p>
				<h4>0.0.17-dev (21-03-2023)</h4>
				<ul>
					<li>upd generator</li>
					<li>visualize search type</li>
				</ul>
			</p>
			<p>
				<h4>0.0.16-dev (07-02-2023)</h4>
				<ul>
					<li>feat toast query result</li>
					<li>feat auto resize column</li>
				</ul>
			</p>
			<p>
				<h4>0.0.15-dev (23-12-2022)</h4>
				<ul>
					<li>upd direct save on query result</li>
					<li>feature able share query to other users</li>
					<li>improve json/long text formatter result</li>
					<li>fix timezone</li>
					<li>upd animate copy clipboard</li>
					<li>upd more detail query history</li>
					<li>add view, trigger defenition</li>
				</ul>
			</p>
			<p>
				<h4>0.0.14-dev (24-10-2022)</h4>
				<ul>
					<li>add func triggers defenition</li>
					<li>add views defenition</li>
					<li>upd bookmark manager</li>
					<li>show void func list</li>
					<li>fix detach quick search</li>
				</ul>
			</p>
			<p>
				<h4>0.0.13-dev (26-09-2022)</h4>
				<ul>
					<li>improve query result change to array mode, show type</li>
					<li>smart cell show detail base on type/text length</li>
					<li>add connection db from server section</li>
				</ul>
			</p>
			<p>
				<h4>0.0.12-dev (08-09-2022)</h4>
				<ul>
					<li>update console editor </li>
					<li>fix copy clipboard</li>
					<li>fix get table content prev version</li>
				</ul>
			</p>
			<p>
				<h4>0.0.11-dev (10-08-2022)</h4>
				<ul>
					<li>fix compare duplicate, remove out params </li>
					<li>fix overlap search</li>
					<li>fix show all data duplicate id (webix datatable)</li>
					<li>upd: query human error result</li>
					<li>duplicate conn</li>
					<li>setting ui</li>
					<li>save last state user (history, dbconn =sideright menu) </li>
					<li>init app query (reset: profile last 1 month deleted)</li>
				</ul>
			</p>
			<p>
				<h4>0.0.10-dev (28-06-2022)</h4>
				<ul>
					<li>improve deep compare, using db left right joining </li>
					<li>compare table row content</li>
					<li>add popup quick search</li>
				</ul>
			</p>
			<p>
				<h4>0.0.9-dev (22-04-2022)</h4>
				<ul>
					<li>improve show table defenition</li>
					<li>add cascade generate out</li>
				</ul>
			</p>
			<p>
				<h4>0.0.8-dev (11-03-2022)</h4>
				<ul>
					<li>fix copy paste action</li>
					<li>snippet raise notice</li>
					<li>clear history</li>
					<li>manage bookmark</li>
				</ul>
			</p>
			<p>
				<h4>0.0.7-dev (23-01-2022)</h4>
				<ul>
					<li>editor loading async</li>
					<li>query search auto focus selected</li>
				</ul>
			</p>
			<p>
				<h4>0.0.6-dev (17-11-2021)</h4>
				<ul>
					<li>last state datatype</li>
					<li>show data type query run</li>
					<li>more setting query</li>
				</ul>
			</p>
			<p>
				<h4>0.0.5-dev (15-11-2021)</h4>
				<ul>
					<li>enable ssl mode option</li>
				</ul>
			</p>
			<p>
				<h4>0.0.4-dev (12-11-2021)</h4>
				<ul>
					<li>set temporary ignore sslmode</li>
					<li>enh: set editor font size by profile</li>
				</ul>
			</p>
			<p>
				<h4>0.0.3-dev (10-11-2021)</h4>
				<ul>
					<li>new: out params generator</li>
					<li>new: layout insert query</li>
					<li>upd: meta app config</li>
					<li>upd: setting module by user</li>
				</ul>
			</p>
			<p>
				<h4>0.0.2-dev (21-10-2021)</h4>
				<ul>
					<li>fix: handle catch error table permission</li>
					<li>fix: handle table not using primary key</li>
					<li>fix: test db connection</li>
					<li>upd: user list refresh and pager</li>
					<li>upd: user list to standard icon</li>
				</ul>
			</p>
			<p>
				<h4>0.0.1-dev (12-10-2021)</h4>
				<ul>
					<li>db: load table content</li>
					<li>query: switch multi db conn</li>
					<li>query: direct inline update</li>
					<li>update db config module by server</li>
					<li>copy data module</li>
					<li>user module</li>
					<li>setting module</li>
				</ul>
			</p>
			<p>
				<h4>0.0.0-dev (05-05-2021)</h4>
				<ul>
					<li>add: db, query, conn config</li>
					<li>fix: query response</li>
				</ul>
			</p>
		</section>
	`,
//   css: "webix_shadow_medium app_start",
};
