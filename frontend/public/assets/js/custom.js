$.sidebarMenu = function (menu) {
	var animationSpeed = 300;

	$(menu).on("click", "li a", function (e) {
		var $this = $(this);
		var checkElement = $this.next();

		if (checkElement.is(".treeview-menu") && checkElement.is(":visible")) {
			checkElement.slideUp(animationSpeed, function () {
				checkElement.removeClass("menu-open");
			});
			checkElement.parent("li").removeClass("active");
		}

		//If the menu is not visible
		else if (
			checkElement.is(".treeview-menu") &&
			!checkElement.is(":visible")
		) {
			//Get the parent menu
			var parent = $this.parents("ul").first();
			//Close all open menus within the parent
			var ul = parent.find("ul:visible").slideUp(animationSpeed);
			//Remove the menu-open class from the parent
			ul.removeClass("menu-open");
			//Get the parent li
			var parent_li = $this.parent("li");

			//Open the target menu and add the menu-open class
			checkElement.slideDown(animationSpeed, function () {
				//Add the class active to the parent li
				checkElement.addClass("menu-open");
				parent.find("li.active").removeClass("active");
				parent_li.addClass("active");
			});
		}
		//if this isn't a link, prevent the page from being redirected
		if (checkElement.is(".treeview-menu")) {
			e.preventDefault();
		}
	});
};
$.sidebarMenu($(".sidebar-menu"));

// Custom Sidebar JS
jQuery(function ($) {

	function initSidebar() {
		var pageWrapper = $(".page-wrapper");
		var sidebar     = $("#sidebar");
		var toggleBtn   = $("#toggle-sidebar");
		var pinBtn      = $("#pin-sidebar");
		var overlay     = $("#overlay");

		// If the key elements aren't in the DOM yet, do nothing
		if (!toggleBtn.length || !pageWrapper.length) return;

		// ── Strip old listeners before re-binding (prevents stacking) ──
		toggleBtn.off("click.sidebar");
		pinBtn.off("click.sidebar");
		overlay.off("click.sidebar");
		sidebar.off("mouseenter.sidebar mouseleave.sidebar");
		$(window).off("resize.sidebar");

		// ── Toggle sidebar open / close ─────────────────────────────────
		toggleBtn.on("click.sidebar", function () {
			pageWrapper.toggleClass("toggled");
		});

		// ── Pin sidebar ─────────────────────────────────────────────────
		pinBtn.on("click.sidebar", function () {
			if (pageWrapper.hasClass("pinned")) {
				pageWrapper.removeClass("pinned");
				sidebar.off("mouseenter.sidebar mouseleave.sidebar");
			} else {
				pageWrapper.addClass("pinned");
				sidebar.on("mouseenter.sidebar", function () {
					pageWrapper.addClass("sidebar-hovered");
				});
				sidebar.on("mouseleave.sidebar", function () {
					pageWrapper.removeClass("sidebar-hovered");
				});
			}
		});

		// ── Pinned sidebar hover (active on load if already pinned) ─────
		if (pageWrapper.hasClass("pinned")) {
			sidebar.on("mouseenter.sidebar", function () {
				pageWrapper.addClass("sidebar-hovered");
			});
			sidebar.on("mouseleave.sidebar", function () {
				pageWrapper.removeClass("sidebar-hovered");
			});
		}

		// ── Overlay tap — closes sidebar on mobile ──────────────────────
		overlay.on("click.sidebar", function () {
			pageWrapper.toggleClass("toggled");
		});

		// ── Responsive resize ───────────────────────────────────────────
		$(window).on("resize.sidebar", function () {
			if ($(window).width() <= 768) {
				pageWrapper.removeClass("pinned");
			} else {
				pageWrapper.removeClass("toggled");
			}
		});
	}

	// ── Run once on first load ──────────────────────────────────────────
	initSidebar();

	// ── Re-run whenever React re-renders the sidebar buttons ───────────
	// Watches for #toggle-sidebar being re-inserted into the DOM
	// after a route change or React state update
	var observer = new MutationObserver(function (mutations) {
		for (var i = 0; i < mutations.length; i++) {
			var addedNodes = mutations[i].addedNodes;
			for (var j = 0; j < addedNodes.length; j++) {
				var node = addedNodes[j];
				if (
					node.nodeType === 1 && // Element node only
					(node.id === "toggle-sidebar" ||
					(node.querySelector && node.querySelector("#toggle-sidebar")))
				) {
					initSidebar();
					return;
				}
			}
		}
	});

	observer.observe(document.body, {
		childList: true,
		subtree:   true,
	});

});

/***********
***********
***********
	Bootstrap JS
***********
***********
***********/

// Tooltip
var tooltipTriggerList = [].slice.call(
	document.querySelectorAll('[data-bs-toggle="tooltip"]')
);
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
	return new bootstrap.Tooltip(tooltipTriggerEl);
});

// Popover
var popoverTriggerList = [].slice.call(
	document.querySelectorAll('[data-bs-toggle="popover"]')
);
var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
	return new bootstrap.Popover(popoverTriggerEl);
});