var prefix = window.location.pathname.substr(0, window.location.pathname.toLowerCase().lastIndexOf("/extensions") + 1);

var config = {
	host: window.location.hostname,
	prefix: prefix,
	port: window.location.port,
	isSecure: window.location.protocol === "https:",
	protocol: window.location.protocol,
};

var qsGlobal = {};
var qsIsDesktopMode = false;

var port = config.port;

if (port.length > 0) {
	port = ':' + port
}
var host = config.protocol + '//' + config.host + port + '/';

console.log(host)

var app;
require.config({
	baseUrl: (config.isSecure ? "https://" : "http://") + config.host + (config.port ? ":" + config.port : "") + config.prefix + "resources"
});

require(["js/qlik", './js/qsocks.bundle.js', './js/jquery.noty.packaged.min.js'], function (qlik, qsocks, noty) {

	var areas = [];
	var qsApps = [];
	var qsAreas = [];

	qsocks.Connect(config).then(global => {
		qsGlobal = global;

		qsGlobal.isDesktopMode().then(function (isDesktopMode) {
			qsIsDesktopMode = isDesktopMode;
			Main();
		})
	})

	function showNotification(text, type) {
		var n = noty({
			text: text,
			layout: 'top',
			theme: 'relax',
			timeout: 1000,
			type: type
		});
	}

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
						if (searchName.indexOf('Stream:') > -1) {
							searchName = availableApps[i].textContent.substr(0, availableApps[i].textContent.indexOf(' Stream:'))
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
				var url = host + "sense/app/" + encodeURIComponent(item.appId);

				var streamName = 'Home';

				if (item.stream) {
					streamName = item.stream.name;
				}

				//if (item.areas.length > 0) {
				//	return '<div><a href="' + url + '" target="_blank">' + value + '</a>' + ' Stream: <strong>' + streamName + '</strong> ' + fileName + '</div>';
				//} else {
				return '<div class="searchheader"><a href="' + url + '" target="_blank">' + value + '</a></div><div class="searchcontent"><div> Stream: <strong>' + streamName + '</strong></div><div>File name: ' + fileName + '</div></div>';
				//}
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

	function SortByTitle(a, b) {
		var aName = a.qTitle.toLowerCase();
		var bName = b.qTitle.toLowerCase();
		return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
	}

	var rbtTitle = '';
	var rbtToggle = '';

	$('#radioBtn a').on('click', function () {
		var sel = $(this).data('title');
		var tog = $(this).data('toggle');

		rbtToggle = tog;
		rbtTitle = sel;

		$('#' + tog).prop('value', sel);

		$('a[data-toggle="' + tog + '"]').not('[data-title="' + sel + '"]').removeClass('active').addClass('notActive');
		$('a[data-toggle="' + tog + '"][data-title="' + sel + '"]').removeClass('notActive').addClass('active');
	});

	$('#myModal').on('shown.bs.modal', function () {
		$("#newappname").focus();
	});

	$('#confirmDelete').on('shown.bs.modal', function () {
		$("#canceldelete").focus();
	});

	$('#deleteapp').keypress(function (e) {
		if (e.which == 13) {
			$('#deleteapp').click();
		}
	});

	$('#newappcreate').on('click', function (e) {
		if ($.trim($('#newappname').val()).length > 0) {
			var newApp = {};
			qsGlobal.createApp($('#newappname').val())
				.then(function (app) {
					newApp = app;
					$('#myModal').modal('hide');
					showNotification('"' + $('#newappname').val() + '" created!', 'success')
					$('#newappname').val('');

					return Main();
				})
				.then(function () {

					href = host + 'dataloadeditor/app/' + encodeURIComponent(newApp.qAppId);
					if ($('#openoncreate').prop('checked') == true) {
						switch (rbtTitle) {
							case "editor":
								href = host + 'dataloadeditor/app/' + encodeURIComponent(newApp.qAppId);
								break;
							case "overview":
								href = host + "sense/app/" + encodeURIComponent(newApp.qAppId)
								break;
							case "manager":
								href = host + 'sense/app/' + encodeURIComponent(newApp.qAppId) + '/datamanager/datamanager';
								break;
						}

						$('#navigate').attr('href', href);
						$('#navigate')[0].click();
						$('#navigate').attr('href', '#');
					}
				})
				.catch(function (err) {
					modalError(err.message);
					$('#newappname').val('');
				})
		} else {
			modalError("App name can't be empty");
		}
	})

	function modalError(error) {
		if ($('#modalError').is(':animated')) {
			$('#modalError').stop().animate({ opacity: '100' });
		}

		$('#modalError').text(error);
		$('#modalError').css('display', 'block');
		$("#modalError").fadeOut(5000, function () {
			//
			$('#modalError').text('');
		});
	}

	$(document).on('click', ".deleteapp", function () {
		var appId = $(this).attr('data-appid');
		var appName = $(this).attr('data-appname');
		$('#deletedappname').text(appName);
		$('#deletedappid').text(appId);

		$('#confirmDelete').modal('show');
	});

	// $(document).on('click', ".renameapp", function () {
	// 	var appId = $(this).attr('data-appid');
	// 	var appName = $(this).attr('data-appname');

	// 	//$('#confirmDelete').modal('show');

	// 	qsGlobal.сetAppProperties(appName)
	// 		.then(function (app) {
	// 		})
	// });

	$(document).on('click', ".duplicateapp", function () {
		if (qsIsDesktopMode == false) {
			var appId = $(this).attr('data-appid');
			var appName = $(this).attr('data-appname');

			appName = appName + ' ' + Date.now();

			// qsGlobal.createApp(appName)
			// 	.then(function (app) {

			// 		showNotification('"' + appName + '" created!', 'success')
			// 		return Main();
			// 	})
			// 	.then(function () {
			// 		var href = '';
		}
	});

	$('#deleteapp').on('click', function (e) {
		$('#confirmDelete').modal('hide');
		qsGlobal.deleteApp($('#deletedappid').text())
			.then(function (result) {
				showNotification('"' + $('#deletedappname').text() + '" deleted!', 'success');
				$('#deletedappname').text('');
				Main();
			})
			.catch(function (err) {
				showNotification(err.message, 'error');
				$('#deletedappname').text('');
			});
	});



	function Main() {
		$('#qsapps').empty()
		qsappshtml = '';
		qsApps = [];
		qsGlobal.productVersion()
			.then(function (qsVersion) {
				qsVersion = qsVersion.substr(0, qsVersion.indexOf('+'));

				$('#qsVersion').text(qsVersion);
			})
			.catch(function (err) {
				showNotification(err.message, 'error');
			});

		return qsGlobal.getDocList().then(function (docList) {
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
				var url = host + "sense/app/" + encodeURIComponent(doc.qDocId);
				var docfile = doc.qDocId.split('\\');
				docfile = docfile[docfile.length - 1];

				var streamName = 'Home';

				if (doc.qMeta.stream) {
					streamName = item.stream.name;
				}

				var disabled = 'opacity: 1';
				var disabledText = '';
				if (qsIsDesktopMode == true) {
					disabled = 'opacity: 0.2'
					disabledText = ' (Not available in desktop mode.)'
				}

				var images = `
					<span style="color: darkgrey">#`+ streamName + `</span>
					<img src="./media/images/line.png">
					<a href="`+ host + `sense/app/` + encodeURIComponent(doc.qDocId) + `" target="_blank"><img src="./media/images/overview.png" title="App Overview"></a>
					<a href="`+ host + `sense/app/` + encodeURIComponent(doc.qDocId) + `/datamanager/datamanager" target="_blank"><img src="./media/images/datamanager.png" title="Data Manager"></a>
					<a href="`+ host + `dataloadeditor/app/` + encodeURIComponent(doc.qDocId) + `" target="_blank"><img src="./media/images/dataeditor.png" title="Data Editor"></a>
					<a href="`+ host + `datamodelviewer/app/` + encodeURIComponent(doc.qDocId) + `" target="_blank"><img src="./media/images/datamodel.png" title="Data Model Viewer"></a>
					<img src="./media/images/line.png">
					<a href="#" class="duplicateapp" data-appid="`+ doc.qDocId + `" data-appname="` + doc.qTitle + `" style="` + disabled + `"><img src="./media/images/copy.png" title="Duplicate app ` + disabledText + `"></a>
					<a href="#" class="deleteapp" data-appid="`+ doc.qDocId + `" data-appname="` + doc.qTitle + `"><img src="./media/images/delete.png" title="Delete app" ></a>
				`;

				qsappshtml += '<div class="pixel-border"><div style="float:left;">' + '<a href="' + url + '" target="_blank">' + doc.qTitle + '</a></div><div style="float:right;">' + images + '</div></div>'
				qsApps.push(doc)
				searchOptions.data.documents.push({
					appName: doc.qTitle,
					areas: areaTemp,
					appId: doc.qDocId,
					stream: doc.qMeta.stream
				});
			}

			var uniqueAreas = [];
			for (var i = 0; i < areas.length; i++) {
				var name = areas[i];
				if (uniqueAreas.indexOf(name) == -1) uniqueAreas.push(name);
			}

			uniqueAreas.push('#unknown');
			qsAreas = uniqueAreas;
			$('#qsapps').html(qsappshtml)
		});
	}
});

