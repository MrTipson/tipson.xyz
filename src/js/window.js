const desktop_json = await fetch("/portal/json/desktop.json").then(body => body.json());
(function () {
	let desktop = document.getElementById("desktop");
	let tabs = document.getElementById("tabs");
	// Add window
	function addWindow(title, content, callback) {
		let window_template = document.getElementById("window-template").content.cloneNode(true);

		let window = window_template.getElementById("window");
		window.addEventListener("mousedown", () => { focusWindow(window) });

		let docked_template = document.getElementById("tab-template").content.cloneNode(true);

		let docked = docked_template.getElementById("docked");
		docked.innerText = title.split("/").pop();
		docked.addEventListener("click", function () { docked.classList.contains("klima") ? undockWindow(window, docked) : dockWindow(window, docked) });
		tabs.appendChild(docked_template);

		window_template.getElementById("title").innerText = title;
		window_template.getElementById("minimise").addEventListener("click", function () { dockWindow(window, docked) });
		window_template.getElementById("close").addEventListener("click", function () {
			closeWindow(window, docked);
			if (callback) callback();
		});
		window_template.getElementById("content").appendChild(content);

		focusWindow(window);
		desktop.appendChild(window_template);
	}
	// Focus window
	function focusWindow(element) {
		let windows = document.getElementsByClassName("window");
		for (let i = 0; i < windows.length; i++) {
			windows[i].classList.remove("window-focused");
		}
		element.classList.add("window-focused");
	}
	function closeWindow(element, docked) {
		element.classList.add("window-closing");
		setTimeout(function () {
			desktop.removeChild(element);
			tabs.removeChild(docked);
		}, 500);
	}
	function dockWindow(element, docked) {
		element.classList.add("window-docking");
		setTimeout(function () {
			element.style.animationPlayState = "paused";
		}, 300);
		docked.classList.add("klima");
	}
	function undockWindow(element, docked) {
		element.style.animationPlayState = "running";
		setTimeout(function () {
			element.classList.remove("window-docking");
			element.removeAttribute("animationPlayState");
		}, 300);
		docked.classList.remove("klima");
		focusWindow(element);
	}
	// Resize, drag logic
	let mouseCoords = [];
	let target;
	let resize = null;
	let min_width = 300;
	let min_height = 200;
	let dragFlag = 0;
	document.addEventListener("mousedown", function (event) {
		event = event || window.event;
		event.preventDefault();
		desktop.classList.add("flag-dragging");
		if (event.target.classList.contains("draggable")) {
			dragFlag = 1;
			setTimeout(() => { if (dragFlag == 1) dragFlag = 2; }, 100);
			mouseCoords.x = event.clientX;
			mouseCoords.y = event.clientY;
			target = event.target;
		} else if (event.target.classList.contains("window-resize")) {
			resize = event.target.dataset.side;
			mouseCoords.x = event.clientX;
			mouseCoords.y = event.clientY;
			target = event.target.offsetParent;
		}
	});
	document.addEventListener("mousemove", function (event) {
		event = event || window.event;
		event.preventDefault();
		if (dragFlag == 1) return;
		if (event.buttons == 0) {
			target = null;
			desktop.classList.remove("flag-dragging");
			return;
		}
		if (target != null) {
			if (resize) {
				let xdiff = event.clientX - mouseCoords.x;
				let ydiff = event.clientY - mouseCoords.y;

				let width = target.offsetWidth;
				let height = target.offsetHeight;
				let top = target.offsetTop;
				let left = target.offsetLeft;
				if (resize.includes("left") && width - xdiff >= min_width &&
					(xdiff >= 0 || event.clientX <= left)) {
					target.style.width = (width - xdiff) + "px";
					target.style.left = left + xdiff + "px";
					target.dataset.width = target.style.width + "px";
				}
				if (resize.includes("right") && width + xdiff >= min_width &&
					(xdiff <= 0 || event.clientX >= left + width)) {
					target.style.width = width + xdiff + "px";
					target.dataset.width = target.style.width + "px";
				}
				if (resize.includes("bottom") && height + ydiff >= min_height &&
					(ydiff <= 0 || event.clientY >= top + height)) {
					target.style.height = height + ydiff + "px";
				}
				if (resize.includes("top") && height - ydiff >= min_height &&
					(ydiff >= 0 || event.clientY <= top)) {
					target.style.height = height - ydiff + "px";
					target.style.top = top + ydiff + "px";
				}
			} else {
				target.style.left = target.offsetLeft + event.clientX - mouseCoords.x + "px";
				if (event.clientY >= 0) {
					target.style.top = target.offsetTop + event.clientY - mouseCoords.y + "px";
				}
			}
			mouseCoords.x = event.clientX;
			mouseCoords.y = event.clientY;
		}
	});
	document.addEventListener("mouseup", function (event) {
		target = null;
		resize = false;
		desktop.classList.remove("flag-dragging");
	});
	// Timer
	let timer = document.getElementById("timer");
	setInterval(() => timer.innerHTML = (new Date()).toLocaleTimeString("de-DE"), 1000);
	// Import desktop
	let test = desktop_json.shortcuts;
	for (let i = 0; i < test.length; i++) {
		addShortcut(test[i]);
	}
	function addShortcut(object) {
		let shortcut = document.createElement("div");
		shortcut.classList.add("draggable", "shortcut");
		shortcut.style.top = object.ypos + "px";
		shortcut.style.left = object.xpos + "px";

		let icon = document.createElement("img");
		if (object.icon) icon.setAttribute("src", object.icon);
		shortcut.appendChild(icon);

		let name = document.createElement("div");
		name.innerText = object.name;
		shortcut.appendChild(name);

		if (object.window.content_web && object.window.type == "explorer") {
			get(object.window.content_web, function (response) {
				object.window.content = JSON.parse(response);
			});
		}
		shortcut.addEventListener("click", function () {
			if (shortcut.hasAttribute("disabled")) return;
			if (dragFlag == 1) {
				dragFlag = 0;
			} else if (dragFlag == 2) {
				dragFlag = 0;
				return;
			}
			if (!object.cached) {
				object.cached = formatWindow(object.window);
			}
			shortcut.setAttribute("disabled", "");
			addWindow(object.window.title, object.cached, function () {
				shortcut.removeAttribute("disabled");
			});
		});
		desktop.appendChild(shortcut);
	}
	function formatWindow(someJson) {
		switch (someJson.type) {
			case "list": {
				let body = document.createElement("div");
				body.classList.add("type-list");
				let active;
				let list = document.createElement("ul");
				let content = document.createElement("div");
				const container = document.getElementById(someJson["template-container-id"]);
				for (const project of container.children) {
					let item = document.createElement("li");
					item.innerText = project.dataset.title;

					let itemcontent = document.createElement("div");
					itemcontent.appendChild(project.content);
					itemcontent.classList.add("opacity-hidden", "md");
					item.addEventListener("click", function () {
						if (active == itemcontent) return;
						if (active) {
							//active.style.opacity = 0;
							active.classList.toggle("opacity-visible");
							setTimeout(function () {
								active.style.removeProperty("display");
								itemcontent.style.display = "block";
								setTimeout(function () { itemcontent.classList.toggle("opacity-visible") }, 50);
								//itemcontent.style.opacity = 1;
								active = itemcontent;
							}, 500);
						} else {
							itemcontent.style.display = "block";
							setTimeout(function () { itemcontent.classList.toggle("opacity-visible") }, 50);
							//itemcontent.style.opacity = 1;
							active = itemcontent;
						}

					});
					list.appendChild(item);
					content.appendChild(itemcontent);
				}
				body.append(list, content);
				return body;
			}
			case "explorer": {
				let mapping = someJson.mapping;
				let input = someJson.content;
				if (mapping.index != null) {
					input = input[mapping.index];
				}

				let elements = [];

				let url = [];
				let base = someJson.file_url_prefix;

				let body = document.createElement("div");
				body.classList.add("type-explorer");

				let path = document.createElement("div");
				path.classList.add("explorer-path", "text-overflow");
				url.push(input[mapping.name]);
				path.innerText = url.join("/") + "/";

				let content = explorerHelper(input, mapping, function (element, name) {
					body.removeChild(content);
					body.appendChild(element);
					content = element;
					url.push(name);
					elements.push(element);
					path.innerText = url.join("/") + "/";
				}, function (file, callback) {
					//simpleWindow(base, url.join("/") + "/" + file)
					callback(base, url.join("/") + "/" + file);
				});
				elements.push(content);

				let addressBar = document.createElement("div");
				addressBar.classList.add("address-bar");
				let back = document.createElement("div");
				back.classList.add("explorer-back");
				back.addEventListener("click", function () {
					if (elements.length > 1) {
						elements.pop();
						url.pop();
						path.innerText = url.join("/") + "/";
						body.removeChild(content);
						body.appendChild(elements[elements.length - 1]);
						content = elements[elements.length - 1];
					}
				});
				let path_wrapper = document.createElement("div");
				path_wrapper.appendChild(path);
				path_wrapper.classList.add("text-overflow-wrapper");
				addressBar.append(back, path_wrapper);
				body.append(addressBar, content);
				return body;
			}
			case "simple": {
				if (someJson.content_web) {
					var body = document.createElement("iframe");
					body.setAttribute("src", someJson.content_web);
				} else {
					var body = document.createElement("div");
					body.innerHTML = someJson.content;
				}
				return body;
			}
		}
	}
	function explorerHelper(someJson, mapping, callback, getFileUrl) {
		if (someJson.cached) {
			return someJson.cached;
		}
		let content = document.createElement("div");
		content.classList.add("directory");
		someJson[mapping.children] = someJson[mapping.children].sort(function (x, y) {
			if (x[mapping.children]) { // x is dir
				if (y[mapping.children]) { // y is dir
					return x[mapping.name].localeCompare(y[mapping.name], undefined, { numeric: true, sensitivity: 'base' }); // compare name
				} else { // y is not a dir
					return -1; // order is ok
				}
			} else { // x is not a dir
				if (y[mapping.children]) { // y is a dir
					return 1; // order should be reverse
				} else { // y is not a dir
					return x[mapping.name].localeCompare(y[mapping.name], undefined, { numeric: true, sensitivity: 'base' }); // compare name
				}
			}
		});
		for (let i = 0; i < someJson[mapping.children].length; i++) {
			let x = someJson[mapping.children][i];
			let item = document.createElement("a");
			let image = document.createElement("div");
			image.classList.add("icon");

			let name = document.createElement("div");
			name.classList.add("filename");
			name.innerText = x[mapping.name];
			item.append(image, name);

			if (x[mapping.children]) {
				item.classList.add("folder");
				item.addEventListener("click", function (event) {
					event.preventDefault();
					event.stopPropagation();
					callback(explorerHelper(x, mapping, callback, getFileUrl), x[mapping.name]);
				});
			} else if (x[mapping.content]) {
				item.classList.add("file");
				item.addEventListener("click", function (event) {
					event.preventDefault();
					event.stopPropagation();
					let body = document.createElement("div");
					body.innerHTML = x[mapping.content];
					addWindow(x[mapping.name], body);
				});
			} else {
				item.classList.add("file");
				getFileUrl(x[mapping.name], function (base, rel) {
					item.setAttribute("href", base + rel);
				});
				item.setAttribute("ext", x[mapping.name].split(".").pop());
				item.addEventListener("click", function (event) {
					event.preventDefault();
					event.stopPropagation();
					getFileUrl(x[mapping.name], function (base, rel) {
						simpleWindow(base, rel);
					});
				});
			}
			content.appendChild(item);
		}
		//someJson.cached = content;
		return content;
	}
	function simpleWindow(base, url) {
		const ext = url.split('.').pop().toLowerCase();
		let content = null;
		switch (ext) {
			case "png":
			case "jpg":
			case "gif":
				content = document.createElement("img");
				content.setAttribute("src", base + url);
				break;
			case "mp4":
			case "webm":
				const source = document.createElement("source");
				source.src = base + url;
				source.type = "video/" + ext;
				content = document.createElement("video");
				content.autoplay = true;
				content.controls = true;
				content.volume = 0.5;
				content.loop = true;
				content.appendChild(source);
				break;
			case "ogg":
			case "mp3":
			case "wav":
				const source2 = document.createElement("source");
				source2.src = base + url;
				source2.type = "audio/" + ext;
				content = document.createElement("audio");
				content.autoplay = true;
				content.controls = true;
				content.volume = 0.5;
				content.appendChild(source2);
				break;
			default:
				content = document.createElement("object");
				content.setAttribute("data", base + url);
		}
		addWindow(url, content);
	}
	function get(url, callback) {
		var xmlHttp = new XMLHttpRequest();
		xmlHttp.onreadystatechange = function () {
			if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
				callback(xmlHttp.responseText);
		}
		xmlHttp.open("GET", url, true);
		xmlHttp.send();
	}
})();