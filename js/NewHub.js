var prefix = window.location.pathname.substr(0, window.location.pathname.toLowerCase().lastIndexOf("/extensions") + 1);

var config = {
	host: window.location.hostname,
	prefix: prefix,
	port: window.location.port,
	isSecure: window.location.protocol === "https:"
};

var app;
require.config({
	baseUrl: (config.isSecure ? "https://" : "http://") + config.host + (config.port ? ":" + config.port : "") + config.prefix + "resources"
});

require(["js/qlik", './js/qsocks.bundle.js'], function (qlik, qsocks) {

	var areas = [];
	var qsApps = [];
	var qsAreas = [];

	var searchOptions = {
		theme: "bootstrap",
		placeholder: "Search for area, app or stream",
		list: {
			maxNumberOfElements: 20,
			match: {
				enabled: true
			},
			onShowListEvent: function () {
				var availableApps = $(".easy-autocomplete").find("ul li");

$('.pixel-border').each(function (i, obj) {
				for (var i = 0; i < availableApps.length; i++) {
					console.log(availableApps[i].textContent)


				}
})				

				
					if ()
						console.log($(obj).text());
				});

			}
		},
		data: { "areas": [], "documents": [] },
		categories: [
			{
				listLocation: "areas",
				header: "-- Areas --"
			},
			{
				listLocation: "documents",
				header: "-- Documents --"
			}
		]
	};

	$("#search").easyAutocomplete(searchOptions);
	var qsappshtml = '';

	qsocks.Connect(config).then(global => {
		global.getDocList().then(function (docList) {

			for (var d = 0; d < docList.length; d++) {

				var docDescr = docList[d].qMeta.description;
				var doc = docList[d];
				if (docDescr) {
					var hashArray = docDescr.match(/#\S+/g);
					if (hashArray) {
						for (var i = 0; i < hashArray.length; i++) {
							areas.push(hashArray[i]);
						}

						doc.areas = hashArray;
					}
				}

				qsappshtml += '<div class="pixel-border">' + doc.qTitle + '</div>'
				qsApps.push(doc)
				searchOptions.data.documents.push(doc.qTitle);
			}

			var uniqueAreas = [];
			for (var i = 0; i < areas.length; i++) {
				var name = areas[i];
				if (uniqueAreas.indexOf(name) == -1) uniqueAreas.push(name);
			}

			uniqueAreas.push('#unknown');
			qsAreas = uniqueAreas;
			searchOptions.data.areas = uniqueAreas;
			$('#qsapps').html(qsappshtml)
			//console.log(qsApps)
			//console.log(qsAreas)

		});
	});
});

