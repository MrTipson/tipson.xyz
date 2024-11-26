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
			const content = shortcut.querySelector("template").content.cloneNode(true);
			if (shortcut.dataset.type === "list") {
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
			} else if (shortcut.dataset.type === "simple") {
				const maybeIframe = content.children[0];
				if (maybeIframe.tagName === "IFRAME") {
					if (maybeIframe.src === "/?recursion") {
						maybeIframe.src = `/?rnd=${Number(new Date())}`;
					}
				}
			}
			addWindow(shortcut.dataset.title, content, function () {
				shortcut.removeAttribute("disabled");
			});
		});
	}
})();