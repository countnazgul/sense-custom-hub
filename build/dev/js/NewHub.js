var prefix = window.location.pathname.substr(0, window.location.pathname.toLowerCase().lastIndexOf("/extensions") + 1);

var config = {
    host: window.location.hostname,
    prefix: prefix,
    port: window.location.port,
    isSecure: window.location.protocol === "https:",
    protocol: window.location.protocol,
};

var port = config.port;

if (port.length > 0) {
    port = ':' + port;
}
var host = config.protocol + '//' + config.host + port + '/';

require.config({
    baseUrl: (config.isSecure ? "https://" : "http://") + config.host + (config.port ? ":" + config.port : "") + config.prefix + "resources"
});

require(['./js/qsocks.bundle.js', './js/vue.min.js',  './css/leonardo-ui/leonardo-ui.js'], function (qsocks, Vue) {


    var Toggle = Vue.extend({
        template: '#vue-toggle',
        props: ['values', 'linkSelected', 'default'],
        ready: function () {
            this.linkSelected = this.default;
        },
        methods: {
            changeSelectVal: function (val) {
                this.linkSelected = val;
                vueApps.linkSelected = val;
            }
        }
    });
    Vue.component('vue-toggle', Toggle);

    var vueApps = new Vue({
        el: '#qsapps',
        components: Toggle,
        data: {
            docs: [],
            showCreate: false,
            showDelete: false,
            showAbout: false,
            delapp: {},
            newappname: '',
            newappwindos: '',
            qsVersion: '',
            qsGlobal: null,
            qsIsDesktopMode: false,
            navigate: '#',
            links: {
                'editor': 'Data Editor',
                'overview': 'App Overview',
                'manager': 'Data Manager'
            },
            linkSelected: 'Data Editor',
            openoncreate: true,
            loaded: false,
            searchTerm: '',
            display: 'block'
        },
        methods: {
            clear: function () {
                this.searchTerm = '';
                //this.display = 'block';
                $('.pixel-border').each(function (i, obj) {
                   $(obj).css('display', 'block');
                });

                $('#search').focus();
            },
            createapp: function () {
                var self = this;
                var newappname = this.newappname;
                if (newappname.trim().length > 0) {
                    var newApp = {};
                    self.qsGlobal.createApp(newappname)
                        .then(function (app) {
                            newApp = app;
                            self.showCreate = false;
                            showNotification('"' + newappname + '" created!', 'success')
                            self.newappname = '';

                            return self.getApps();
                        })
                        .then(function () {
                            href = host + 'dataloadeditor/app/' + encodeURIComponent(newApp.qAppId);
                            if (self.openoncreate == true) {
                                switch (self.linkSelected) {
                                    case "Data Editor":
                                        href = host + 'dataloadeditor/app/' + encodeURIComponent(newApp.qAppId);
                                        break;
                                    case "App Overview":
                                        href = host + "sense/app/" + encodeURIComponent(newApp.qAppId)
                                        break;
                                    case "Data Manager":
                                        href = host + 'sense/app/' + encodeURIComponent(newApp.qAppId) + '/datamanager/datamanager';
                                        break;
                                }

                                self.navigate = href;
                                Vue.nextTick(function () {
                                    document.getElementById('navigate').click();
                                    self.navigate = '#';
                                })
                            }
                        })
                        .catch(function (err) {
                            modalError(err.message);
                            self.newappname = '';
                        })
                } else {
                    modalError("App name can't be empty");
                }
            },
            delmodal: function (appId, appName) {
                this.delapp.name = appName;
                this.delapp.id = appId;
                this.showDelete = true;
            },
            deleteapp: function () {
                var self = this;
                self.qsGlobal.deleteApp(this.delapp.id)
                    .then(function (result) {
                        showNotification('"' + self.delapp.name + '" deleted!', 'success');
                        self.delapp = {};
                        self.showDelete = false;
                        self.getApps();
                    })
                    .catch(function (err) {
                        showNotification(err.message, 'error');
                        self.delapp = {};
                        self.showDelete = false;
                    });
            },
            duplicateapp: function (appId, appName) {
                // TODO
            },
            renameapp: function (appId, appName) {
                // TODO
            },
            publishapp: function (appId, appName) {
                // TODO
            },
            getApps: function () {
                var self = this;
                
                // self.$refs.search.focus();
                qsappshtml = '';
                qsApps = [];
                self.qsGlobal.productVersion()
                    .then(function (qsVersion) {
                        vueApps.qsVersion = qsVersion;
                    })
                    .catch(function (err) {
                        showNotification(err.message, 'error');
                    });
                return self.qsGlobal.getStreamList().then(function (streamList) {
                    streamList.push('Home');

                    for (var i = 0; i < streamList.length; i++) {
                        searchOptions.data.streams.push({
                            appName: streamList[i],
                            type: 'stream',
                            areas: '',
                            appId: '',
                            stream: ''
                        });
                    }

                    return self.qsGlobal.getDocList().then(function (docList) {
                        docList.sort(SortByTitle)
                        searchOptions.data.documents = [];

                        for (var d = 0; d < docList.length; d++) {
                            var doc = docList[d];
                            var docIdEncoded = encodeURIComponent(doc.qDocId);
                            doc.CustomHub = {};
                            doc.CustomHub.urls = {};

                            var url = host + "sense/app/" + encodeURIComponent(doc.qDocId);

                            doc.CustomHub.urls.overview = host + 'sense/app/' + docIdEncoded;
                            doc.CustomHub.urls.datamanager = host + 'sense/app/' + docIdEncoded + '/datamanager/datamanager';
                            doc.CustomHub.urls.dataeditor = host + 'dataloadeditor/app/' + docIdEncoded;
                            doc.CustomHub.urls.dataviewer = host + 'datamodelviewer/app/' + docIdEncoded;

                            doc.CustomHub.opacity = (self.qsIsDesktopMode == true) ? 0.2 : 1;
                            doc.CustomHub.stream = (doc.qMeta.stream) ? doc.qMeta.stream.name : 'Home';

                            var docDescr = doc.qMeta.description;

                            var docfile = doc.qDocId.split('\\');
                            docfile = docfile[docfile.length - 1];

                            var streamName = 'Home';

                            if (doc.qMeta.stream) {
                                streamName = doc.qMeta.stream.name;
                            }

                            qsApps.push(doc);
                            searchOptions.data.documents.push({
                                appName: doc.qTitle,
                                type: 'app',
                                areas: '',
                                appId: doc.qDocId,
                                stream: streamName
                            });
                        }

                        self.docs = docList;

                        if (self.loaded == true) {
                            showNotification('Apps list is populated', 'success');
                        } else {
                            self.loaded = true;
                        }                        

                    });
                })

            },
            openApp: function (appId) {
                var href = host + "sense/app/" + encodeURIComponent(appId)
                this.navigate = href;
                Vue.nextTick(function () {
                    document.getElementById('navigate').click();
                    self.navigate = '#';
                })
            },
            toggleCreate() { this.showCreate = !this.showCreate; },
            toggleDelete() { this.showDelete = !this.showDelete; },
            toggleAbout() { this.showAbout = !this.showAbout; }
        },
        mounted: function () {
            var self = this;
            qsocks.Connect(config).then(global => {
                self.qsGlobal = global;

                self.qsGlobal.isDesktopMode().then(function (isDesktopMode) {
                    self.qsIsDesktopMode = isDesktopMode;

                    self.getApps();
                });
            });


        },
        computed: {
            modalStyleCreate() {
                return this.showCreate ? { 'padding-left': '0px;', display: 'block' } : {};
            },
            modalStyleDelete() {
                return this.showDelete ? { 'padding-left': '0px;', display: 'block' } : {};
            },
            modalStyleAbout() {
                return this.showAbout ? { 'padding-left': '0px;', display: 'block' } : {};
            }
        }
    });

    function showNotification(text, type) {
        notie.alert(type, text, 1);
    }

    var searchOptions = {
        theme: "bootstrap",
        placeholder: "Search for app or stream",
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
                        t = t.text().trim();
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

                $('#qsappsTest').css('padding-top', $(".easy-autocomplete").find("ul").height() + 10)
            },
            onHideListEvent: function () {
                if ($('#search').val().length == 0) {
                    $('.pixel-border').each(function (i, obj) {
                        $(obj).css('display', 'block');
                    });
                }

                $('#qsappsTest').css('padding-top', 0)
            },
            onLoadEvent: function () {
                if ($('#search').val().length == 0) {
                    $('.pixel-border').each(function (i, obj) {
                        $(obj).css('display', 'block');
                    });
                }

                $('#qsappsTest').css('padding-top', 0)
            },
            onChooseEvent: function () {
                var index = $("#search").getSelectedItemIndex();
                var appObj = $("#search").getItemData(index);

                if (appObj.type == 'stream') {
                    $('.pixel-border').each(function (i, obj) {
                        if (appObj.appName == obj.children[1].children[1].innerText) {
                            $(obj).css('display', 'block');
                        }
                    });
                }
                //vueApps.openApp(appObj.appId);
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
        data: { "streams": [], "documents": [] },
        categories: [
            {
                listLocation: "streams",
                maxNumberOfElements: 20,
                header: "-- Streams --"
            },
            {
                listLocation: "documents",
                maxNumberOfElements: 20,
                header: "-- Documents --"
            }
        ]
    };

    $("#search").easyAutocomplete(searchOptions);

// $("#search").keydown(function(event){
//     if(event.key == "Escape") {
//         vueApps.clear();
//     }
// })

    function SortByTitle(a, b) {
        var aName = a.qTitle.toLowerCase();
        var bName = b.qTitle.toLowerCase();
        return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
    }

    function modalError(error) {
        if ($('#modalError').is(':animated')) {
            $('#modalError').stop().animate({ opacity: '100' });
        }

        $('#modalError').text(error);
        $('#modalError').css('display', 'block');
        $("#modalError").fadeOut(5000, function () {
            $('#modalError').text('');
        });
    }

});

