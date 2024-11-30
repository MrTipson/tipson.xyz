import { bundledLanguages } from 'shiki/langs';
import { codeToHtml } from 'shiki';
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
	const shortcuts = document.getElementsByClassName("shortcut");
	for (const shortcut of shortcuts) {
		shortcut.addEventListener("click", function () {
			if (shortcut.hasAttribute("disabled")) return;
			if (dragFlag == 1) {
				dragFlag = 0;
			} else if (dragFlag == 2) {
				dragFlag = 0;
				return;
			}
			shortcut.setAttribute("disabled", "");
			addWindow(shortcut.dataset.title, formatWindow(shortcut), function () {
				shortcut.removeAttribute("disabled");
			});
		});
	}
	function formatWindow(shortcut) {
		switch (shortcut.dataset.type) {
			case "list":
				const content = shortcut.querySelector("template").content.cloneNode(true);
				const contents = content.querySelector("#type-list-contents")?.children;
				const list = content.querySelector("ul");
				if (!contents || !list) return;
				const listItems = list.children;
				let active = 0;
				list.addEventListener("click", event => {
					const i = event.target.dataset?.i;

					if (!i || active === i) return;
					listItems[active].classList.remove("active");
					listItems[i].classList.add("active");
					contents[active].classList.toggle("opacity-visible");
					const tmp = active;
					setTimeout(function () {
						contents[tmp].style.removeProperty("display");
						contents[i].style.display = "block";
						setTimeout(function () { contents[i].classList.toggle("opacity-visible") }, 50);
						//itemcontent.style.opacity = 1;
						active = i;
					}, 500);
					active = i;
				});
				return content;
			case "explorer": {
				if (shortcut.cached) {
					return shortcut.cached;
				}
				const body = shortcut.querySelector("template").content.cloneNode(true).children[0];
				const script = body.querySelector("script");
				let input = JSON.parse(script.textContent);
				if ("field" in script.dataset) {
					input = input[script.dataset.field];
				}
				input = remapExplorerJSON(input, {
					name: script.dataset.mappingName,
					items: script.dataset.mappingItems,
				});
				let elements = [];

				let url = [];
				const base = script.dataset.fileUrlPrefix;

				const path = body.querySelector("#path");
				path.innerText = url.join("/") + "/";

				function replaceExplorerContent(element) {
					body.removeChild(content);
					body.appendChild(element);
					content = element;
					elements.push(element);
					path.innerText = url.join("/") + "/";
				}
				let content = explorerHelper(url, input, replaceExplorerContent, function (name) {
					return [base, [...url, name].join('/')];
				});
				body.append(content);
				elements.push(content);

				const back = body.querySelector(".explorer-back");
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
				shortcut.cached = body;
				return body;
			}
			case "simple": {
				const content = shortcut.querySelector("template").content.cloneNode(true);
				const maybeIframe = content.children[0];
				if (maybeIframe.tagName === "IFRAME" && maybeIframe.src === "/?recursion") {
					maybeIframe.src = `/?rnd=${Number(new Date())}`;
				}
				return content;
			}
		}
	}
	function explorerHelper(url, items, callback, getFileUrl) {
		if (items.cached) {
			return items.cached;
		}
		let content = document.createElement("div");
		content.classList.add("directory");
		items = items.sort(function (x, y) {
			if (x.type === y.type) {
				return x.name.localeCompare(y.name, undefined, { numeric: true, sensitivity: 'base' });
			} else {
				// if x is the directory -> -1 (order ok), otherwise -> 1 (swap order)
				return x.type === 'directory' ? -1 : 1;
			}
		});
		for (const x of items) {
			let item = document.createElement("a");
			let image = document.createElement("div");
			image.classList.add("icon");

			let name = document.createElement("div");
			name.classList.add("filename");
			name.innerText = x.name;
			item.append(image, name);

			if (x.type === 'directory') {
				item.classList.add("folder");
				item.addEventListener("click", function (event) {
					event.preventDefault();
					event.stopPropagation();
					url.push(x.name);
					if (!x.items.cached) {
						x.items.cached = explorerHelper(url, x.items, callback, getFileUrl);
					}
					callback(x.items.cached, x.name);
				});
			} else {
				item.classList.add("file");
				const [base, filePath] = getFileUrl(x.name);
				item.setAttribute("href", base + filePath);
				item.setAttribute("download", x.name);
				item.setAttribute("ext", x.name.split(".").pop());
				item.addEventListener("click", function (event) {
					event.preventDefault();
					event.stopPropagation();
					simpleWindow(base, filePath);
				});
			}
			content.appendChild(item);
		}
		return content;
	}
	function simpleWindow(base, filePath) {
		const url = base + filePath;
		const ext = url.split('.').pop().toLowerCase();
		let content = null;
		switch (ext) {
			case "png":
			case "jpg":
			case "gif":
				content = document.createElement("img");
				content.setAttribute("src", url);
				break;
			case "mp4":
			case "webm":
				const source = document.createElement("source");
				source.src = url;
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
				source2.src = url;
				source2.type = "audio/" + ext;
				content = document.createElement("audio");
				content.autoplay = true;
				content.controls = true;
				content.volume = 0.5;
				content.appendChild(source2);
				break;
			case "pdf":
				content = document.createElement("object");
				content.setAttribute("data", url);
				break;
			default:
				fetch(url).then(x => x.text()).then(async text => {
					content = document.createElement("div");
					content.classList.add("h-full", "w-full", "overflow-auto", "scrollbar", "text-c3")
					const lang = Object.keys(bundledLanguages).includes(ext) ? ext : 'plaintext';
					content.innerHTML = await codeToHtml(text, { lang: lang, theme: 'github-dark' });
					content.children[0].style = "";
					addWindow(filePath, content);
				});
				return;
		}
		addWindow(filePath, content);
	}
	function remapExplorerJSON(json, mapping) {
		const mapper = (x) => {
			return {
				type: x[mapping.items] ? 'directory' : 'file',
				...mapping.name in x && { name: x[mapping.name] },
				...mapping.items in x && { items: x[mapping.items].map(mapper) },
			};
		}
		return json.map(mapper);
	}
})();