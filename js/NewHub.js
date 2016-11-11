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
			sort: {
				enabled: true
			},
			onShowListEvent: function () {
				var availableApps = $(".easy-autocomplete").find("ul li");

				$('.pixel-border').each(function (i, obj) {
					var visible = false;

					for (var i = 0; i < availableApps.length; i++) {

						var searchName = availableApps[i].textContent;
						if (searchName.indexOf('->') > -1) {
							searchName = availableApps[i].textContent.substr(0, availableApps[i].textContent.indexOf(' ->'))
						}

						var t = $(obj).find('a');
						t = t.text();
						if (t == searchName) {
							//console.log(searchName)
							visible = true;
						}
					}

					if (visible == false) {
						$(obj).css('display', 'none');
					} else {
						$(obj).css('display', 'block');
					}
				});

				$('#qsapps').css('padding-top', $(".easy-autocomplete").find("ul").height() + 10)
			},
			onHideListEvent: function () {
				if ($('#search').val().length == 0) {
					$('.pixel-border').each(function (i, obj) {
						$(obj).css('display', 'block');
					});
				}

				$('#qsapps').css('padding-top', 0)
			},
			onLoadEvent: function () {
				if ($('#search').val().length == 0) {
					$('.pixel-border').each(function (i, obj) {
						$(obj).css('display', 'block');
					});
				}

				$('#qsapps').css('padding-top', 0)
			}
		},
		getValue: function (element) {
			return element.appName;
		},
		template: {
			type: "custom",
			method: function (value, item) {
				var fileName = item.appId.split('\\');
				fileName = fileName[fileName.length - 1]; //.replace('.qvf', '');
				var url = "http://localhost:4848/sense/app/" + encodeURIComponent(item.appId);
				if (item.areas.length > 0) {
					return '<div><a href="' + url + '" target="_blank">' + value + '</a>' + ' -> ' + item.areas + ' -> ' + fileName + '</div>';
				} else {
					return '<a href="' + url + '" target="_blank">' + value + '</a>' + ' -> ' + fileName;
				}
			}
		},
		data: { "areas": [], "documents": [] },
		categories: [
			// {
			// 	listLocation: "areas",
			// 	header: "-- Areas --"
			// },
			{
				listLocation: "documents",
				header: "-- Documents --"
			}
		]
	};

	$("#search").easyAutocomplete(searchOptions);
	var qsappshtml = '';

	$(document.body).keypress(function () {
		if ($('#myModal').is(':visible') == false) {
			$('#search').focus();
		}
	});

	// 	$('#search').focusout(function () {
	// console.log($(".easy-autocomplete").find("ul"))
	// 		if ($('#search').val().length == 0) {
	// 			$('.pixel-border').each(function (i, obj) {
	// 				$(obj).css('display', 'block');
	// 			});
	// 		}
	// 		$('#qsapps').css('padding-top', 10)
	// 	})

	function SortByTitle(a, b) {
		var aName = a.qTitle.toLowerCase();
		var bName = b.qTitle.toLowerCase();
		return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
	}

	$('#newappcreate').on('click', function () {
		qsocks.Connect(config).then(global => {
			global.createApp($('#newappname').val()).then(function(app) {
				console.log(app)
			})

		});
		console.log($('#newappname').val())
		console.log($('#newappdescription').val())
	})

	qsocks.Connect(config).then(global => {
		global.getDocList().then(function (docList) {
			console.log(docList)

			docList.sort(SortByTitle)
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
				var areaTemp = '';
				if (doc.areas) {
					areaTemp = doc.areas;
				}
				var url = "http://localhost:4848/sense/app/" + encodeURIComponent(doc.qDocId);
				var docfile = doc.qDocId.split('\\');
				docfile = docfile[docfile.length - 1]
				var images = `
					<a href="http://localhost:4848/sense/app/`+ encodeURIComponent(doc.qDocId) + `/datamanager/datamanager"><img src="./media/images/datamanager.png" title="Data Manager"></a>
					<a href="http://localhost:4848/dataloadeditor/app/`+ encodeURIComponent(doc.qDocId) + `"><img src="./media/images/dataeditor.png" title="Data Editor"></a>
					<a href="http://localhost:4848/datamodelviewer/app/`+ encodeURIComponent(doc.qDocId) + `"><img src="./media/images/datamodel.png" title="Data Model Viewer"></a>
					<img src="./media/images/line.png">
					<a href="http://localhost:4848/datamodelviewer/app/`+ encodeURIComponent(doc.qDocId) + `"><img src="./media/images/copy.png" title="Duplicate app"></a>
					<a href="http://localhost:4848/datamodelviewer/app/`+ encodeURIComponent(doc.qDocId) + `"><img src="./media/images/delete.png" title="Delete app"></a>
				`;
				qsappshtml += '<div class="pixel-border"><div style="float:left;">' + '<a href="' + url + '" target="_blank">' + doc.qTitle + '</a></div><div style="float:right;">' + images + '</div></div>'
				qsApps.push(doc)
				searchOptions.data.documents.push({ appName: doc.qTitle, areas: areaTemp, appId: doc.qDocId });
			}

			var uniqueAreas = [];
			for (var i = 0; i < areas.length; i++) {
				var name = areas[i];
				if (uniqueAreas.indexOf(name) == -1) uniqueAreas.push(name);
			}

			uniqueAreas.push('#unknown');
			qsAreas = uniqueAreas;
			//searchOptions.data.areas = uniqueAreas;
			$('#qsapps').html(qsappshtml)
			//console.log(qsApps)
			//console.log(qsAreas)

		});
	});
});

