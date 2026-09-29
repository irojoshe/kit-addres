import { useCallback as e, useEffect as t, useRef as n, useState as r } from "react";
import * as i from "maplibre-gl";
//#region \0rolldown/runtime.js
var a = (e, t) => () => (t || (e((t = { exports: {} }).exports, t), e = null), t.exports), o = /* @__PURE__ */ ((e) => typeof require < "u" ? require : typeof Proxy < "u" ? new Proxy(e, { get: (e, t) => (typeof require < "u" ? require : e)[t] }) : e)(function(e) {
	if (typeof require < "u") return require.apply(this, arguments);
	throw Error("Calling `require` for \"" + e + "\" in an environment that doesn't expose the `require` function. See https://rolldown.rs/in-depth/bundling-cjs#require-external-modules for more details.");
}), s = (e) => "lat" in e ? {
	latitude: e.lat,
	longitude: e.lng,
	accuracy: e.accuracy
} : e, c = (e) => ({
	lat: e.latitude,
	lng: e.longitude,
	accuracy: e.accuracy
}), l = (e) => Number.isFinite(e.latitude) && Number.isFinite(e.longitude) && e.latitude >= -90 && e.latitude <= 90 && e.longitude >= -180 && e.longitude <= 180, u = (e) => ({
	...e,
	metadata: {
		...e.metadata,
		...e.coordinates ? {
			latitude: e.coordinates.latitude,
			longitude: e.coordinates.longitude,
			accuracy: e.coordinates.accuracy
		} : {}
	}
}), d = "1.3.0";
function f(e, t = 2, n = 350) {
	return async (r, i) => {
		for (let a = 0;; a += 1) try {
			return await e(r, i);
		} catch (e) {
			if (i?.signal?.aborted || a >= t) throw e;
			await new Promise((e) => setTimeout(e, n * 2 ** a));
		}
	};
}
//#endregion
//#region src/lib/providers.ts
var p = async (e) => {
	if (!e.ok) throw Error(`Provider error: ${e.status}`);
	return e.json();
}, m = (e) => new URLSearchParams(Object.entries(e).filter(([, e]) => e !== void 0).map(([e, t]) => [e, String(t)]));
function h(e = {}) {
	let t = e.endpoint ?? "https://photon.komoot.io", n = f(e.fetcher ?? fetch, e.retries ?? 2, e.retryDelayMs ?? 350);
	return {
		async forward(r, i = {}) {
			let a = m({
				q: r,
				limit: i.limit ?? 5,
				lang: i.language ?? "es",
				lat: i.location?.latitude,
				lon: i.location?.longitude
			});
			return ((await p(await n(`${t}/api/?${a}`, {
				signal: i.signal,
				headers: e.headers
			}))).features ?? []).filter((e) => !i.region || e.properties?.countrycode?.toLowerCase() === i.region.toLowerCase()).map((e) => ({
				placeId: String(e.properties?.osm_id ?? crypto.randomUUID()),
				description: [
					e.properties?.name,
					e.properties?.street,
					e.properties?.city,
					e.properties?.country
				].filter(Boolean).join(", "),
				mainText: e.properties?.name || e.properties?.street || "",
				secondaryText: [e.properties?.city, e.properties?.country].filter(Boolean).join(", "),
				coordinates: {
					latitude: e.geometry.coordinates[1],
					longitude: e.geometry.coordinates[0]
				}
			}));
		},
		async reverse(t, r = {}) {
			let i = m({
				format: "jsonv2",
				lat: t.latitude,
				lon: t.longitude,
				"accept-language": r.language ?? "es"
			}), a = (await p(await n(`https://nominatim.openstreetmap.org/reverse?${i}`, {
				signal: r.signal,
				headers: {
					Accept: "application/json",
					...e.headers
				}
			}))).address ?? {};
			return {
				address_1: [a.road, a.house_number].filter(Boolean).join(" "),
				city: a.city ?? a.town ?? a.village ?? "",
				province: a.state ?? "",
				postal_code: a.postcode ?? "",
				country_code: a.country_code ?? ""
			};
		}
	};
}
function g(e = {}) {
	let t = e.endpoint ?? "https://router.project-osrm.org", n = f(e.fetcher ?? fetch, e.retries ?? 2, e.retryDelayMs ?? 350);
	return {
		async route(r, i) {
			let a = (await p(await n(`${t}/route/v1/driving/${r.longitude},${r.latitude};${i.longitude},${i.latitude}?overview=full&geometries=geojson`, { headers: e.headers }))).routes?.[0];
			if (!a) throw Error("No se encontró una ruta");
			return {
				geometry: a.geometry,
				distance: a.distance,
				duration: a.duration
			};
		},
		async matrix(r) {
			if (r.length < 2 || r.length > 100) throw Error("La matriz requiere entre 2 y 100 puntos");
			let i = r.map((e) => `${e.longitude},${e.latitude}`).join(";"), a = await p(await n(`${t}/table/v1/driving/${i}?annotations=distance,duration`, { headers: e.headers }));
			return {
				distances: a.distances,
				durations: a.durations,
				sources: r,
				destinations: r
			};
		}
	};
}
//#endregion
//#region src/hooks/useAutocomplete.ts
function _({ provider: i, debounceMs: a = 300, limit: o = 5, minLength: s = 3, language: c = "es", countryRestriction: l, region: u, locationBias: d, retryCount: f = 2 }) {
	let [p, m] = r([]), [h, g] = r(!1), [_, v] = r(null), y = n(null), b = n(null), x = n(/* @__PURE__ */ new Map()), S = e((e) => {
		if (y.current && clearTimeout(y.current), b.current?.abort(), e.trim().length < s) {
			m([]), g(!1);
			return;
		}
		let t = `${c}:${u ?? ""}:${e.trim()}:${d?.latitude ?? ""}:${d?.longitude ?? ""}`, n = x.current.get(t);
		if (n) {
			m(n);
			return;
		}
		y.current = setTimeout(async () => {
			let n = new AbortController();
			b.current = n, g(!0), v(null);
			try {
				let r = await i.forward(e, {
					limit: o,
					language: c,
					countryRestriction: l,
					region: u,
					location: d,
					signal: n.signal
				});
				x.current.set(t, r), m(r);
			} catch (e) {
				e.name !== "AbortError" && (v(e instanceof Error ? e.message : "No se pudo buscar"), m([]));
			} finally {
				g(!1);
			}
		}, a);
	}, [
		l,
		a,
		c,
		o,
		d,
		s,
		i,
		u
	]);
	return t(() => () => {
		y.current && clearTimeout(y.current), b.current?.abort();
	}, []), {
		suggestions: p,
		loading: h,
		error: _,
		search: S,
		clear: () => m([]),
		cacheSize: x.current.size,
		retryCount: f
	};
}
//#endregion
//#region node_modules/.pnpm/react@19.2.4/node_modules/react/cjs/react-jsx-runtime.production.js
var v = /* @__PURE__ */ a(((e) => {
	var t = Symbol.for("react.transitional.element"), n = Symbol.for("react.fragment");
	function r(e, n, r) {
		var i = null;
		if (r !== void 0 && (i = "" + r), n.key !== void 0 && (i = "" + n.key), "key" in n) for (var a in r = {}, n) a !== "key" && (r[a] = n[a]);
		else r = n;
		return n = r.ref, {
			$$typeof: t,
			type: e,
			key: i,
			ref: n === void 0 ? null : n,
			props: r
		};
	}
	e.Fragment = n, e.jsx = r, e.jsxs = r;
})), y = /* @__PURE__ */ a(((e) => {
	process.env.NODE_ENV !== "production" && (function() {
		function t(e) {
			if (e == null) return null;
			if (typeof e == "function") return e.$$typeof === ae ? null : e.displayName || e.name || null;
			if (typeof e == "string") return e;
			switch (e) {
				case v: return "Fragment";
				case b: return "Profiler";
				case y: return "StrictMode";
				case te: return "Suspense";
				case ne: return "SuspenseList";
				case ie: return "Activity";
			}
			if (typeof e == "object") switch (typeof e.tag == "number" && console.error("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), e.$$typeof) {
				case _: return "Portal";
				case S: return e.displayName || "Context";
				case x: return (e._context.displayName || "Context") + ".Consumer";
				case ee:
					var n = e.render;
					return e = e.displayName, e ||= (e = n.displayName || n.name || "", e === "" ? "ForwardRef" : "ForwardRef(" + e + ")"), e;
				case re: return n = e.displayName || null, n === null ? t(e.type) || "Memo" : n;
				case C:
					n = e._payload, e = e._init;
					try {
						return t(e(n));
					} catch {}
			}
			return null;
		}
		function n(e) {
			return "" + e;
		}
		function r(e) {
			try {
				n(e);
				var t = !1;
			} catch {
				t = !0;
			}
			if (t) {
				t = console;
				var r = t.error, i = typeof Symbol == "function" && Symbol.toStringTag && e[Symbol.toStringTag] || e.constructor.name || "Object";
				return r.call(t, "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.", i), n(e);
			}
		}
		function i(e) {
			if (e === v) return "<>";
			if (typeof e == "object" && e && e.$$typeof === C) return "<...>";
			try {
				var n = t(e);
				return n ? "<" + n + ">" : "<...>";
			} catch {
				return "<...>";
			}
		}
		function a() {
			var e = oe.A;
			return e === null ? null : e.getOwner();
		}
		function s() {
			return Error("react-stack-top-frame");
		}
		function c(e) {
			if (se.call(e, "key")) {
				var t = Object.getOwnPropertyDescriptor(e, "key").get;
				if (t && t.isReactWarning) return !1;
			}
			return e.key !== void 0;
		}
		function l(e, t) {
			function n() {
				le || (le = !0, console.error("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)", t));
			}
			n.isReactWarning = !0, Object.defineProperty(e, "key", {
				get: n,
				configurable: !0
			});
		}
		function u() {
			var e = t(this.type);
			return T[e] || (T[e] = !0, console.error("Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release.")), e = this.props.ref, e === void 0 ? null : e;
		}
		function d(e, t, n, r, i, a) {
			var o = n.ref;
			return e = {
				$$typeof: g,
				type: e,
				key: t,
				props: n,
				_owner: r
			}, (o === void 0 ? null : o) === null ? Object.defineProperty(e, "ref", {
				enumerable: !1,
				value: null
			}) : Object.defineProperty(e, "ref", {
				enumerable: !1,
				get: u
			}), e._store = {}, Object.defineProperty(e._store, "validated", {
				configurable: !1,
				enumerable: !1,
				writable: !0,
				value: 0
			}), Object.defineProperty(e, "_debugInfo", {
				configurable: !1,
				enumerable: !1,
				writable: !0,
				value: null
			}), Object.defineProperty(e, "_debugStack", {
				configurable: !1,
				enumerable: !1,
				writable: !0,
				value: i
			}), Object.defineProperty(e, "_debugTask", {
				configurable: !1,
				enumerable: !1,
				writable: !0,
				value: a
			}), Object.freeze && (Object.freeze(e.props), Object.freeze(e)), e;
		}
		function f(e, n, i, o, s, u) {
			var f = n.children;
			if (f !== void 0) {
				if (o) {
					if (ce(f)) {
						for (o = 0; o < f.length; o++) p(f[o]);
						Object.freeze && Object.freeze(f);
					} else console.error("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");
				} else p(f);
			}
			if (se.call(n, "key")) {
				f = t(e);
				var m = Object.keys(n).filter(function(e) {
					return e !== "key";
				});
				o = 0 < m.length ? "{key: someKey, " + m.join(": ..., ") + ": ...}" : "{key: someKey}", E[f + o] || (m = 0 < m.length ? "{" + m.join(": ..., ") + ": ...}" : "{}", console.error("A props object containing a \"key\" prop is being spread into JSX:\n  let props = %s;\n  <%s {...props} />\nReact keys must be passed directly to JSX without using spread:\n  let props = %s;\n  <%s key={someKey} {...props} />", o, f, m, f), E[f + o] = !0);
			}
			if (f = null, i !== void 0 && (r(i), f = "" + i), c(n) && (r(n.key), f = "" + n.key), "key" in n) for (var h in i = {}, n) h !== "key" && (i[h] = n[h]);
			else i = n;
			return f && l(i, typeof e == "function" ? e.displayName || e.name || "Unknown" : e), d(e, f, i, a(), s, u);
		}
		function p(e) {
			m(e) ? e._store && (e._store.validated = 1) : typeof e == "object" && e && e.$$typeof === C && (e._payload.status === "fulfilled" ? m(e._payload.value) && e._payload.value._store && (e._payload.value._store.validated = 1) : e._store && (e._store.validated = 1));
		}
		function m(e) {
			return typeof e == "object" && !!e && e.$$typeof === g;
		}
		var h = o("react"), g = Symbol.for("react.transitional.element"), _ = Symbol.for("react.portal"), v = Symbol.for("react.fragment"), y = Symbol.for("react.strict_mode"), b = Symbol.for("react.profiler"), x = Symbol.for("react.consumer"), S = Symbol.for("react.context"), ee = Symbol.for("react.forward_ref"), te = Symbol.for("react.suspense"), ne = Symbol.for("react.suspense_list"), re = Symbol.for("react.memo"), C = Symbol.for("react.lazy"), ie = Symbol.for("react.activity"), ae = Symbol.for("react.client.reference"), oe = h.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, se = Object.prototype.hasOwnProperty, ce = Array.isArray, w = console.createTask ? console.createTask : function() {
			return null;
		};
		h = { react_stack_bottom_frame: function(e) {
			return e();
		} };
		var le, T = {}, ue = h.react_stack_bottom_frame.bind(h, s)(), de = w(i(s)), E = {};
		e.Fragment = v, e.jsx = function(e, t, n) {
			var r = 1e4 > oe.recentlyCreatedOwnerStacks++;
			return f(e, t, n, !1, r ? Error("react-stack-top-frame") : ue, r ? w(i(e)) : de);
		}, e.jsxs = function(e, t, n) {
			var r = 1e4 > oe.recentlyCreatedOwnerStacks++;
			return f(e, t, n, !0, r ? Error("react-stack-top-frame") : ue, r ? w(i(e)) : de);
		};
	})();
})), b = (/* @__PURE__ */ a(((e, t) => {
	t.exports = process.env.NODE_ENV === "production" ? v() : y();
})))();
function x({ provider: e = h(), onSelect: t, onPlaceSelect: n, language: i = "es", countryRestriction: a }) {
	let [o, s] = r(""), { suggestions: c, loading: l, error: u, search: d } = _({
		provider: e,
		language: i,
		countryRestriction: a
	}), f = (e) => {
		s(e.description), t?.(e), n?.({
			...e,
			id: e.placeId,
			label: e.description,
			coords: {
				lat: e.coordinates.latitude,
				lng: e.coordinates.longitude
			}
		});
	};
	return /* @__PURE__ */ (0, b.jsxs)("div", {
		style: { position: "relative" },
		children: [
			/* @__PURE__ */ (0, b.jsx)("label", {
				htmlFor: "address-search",
				children: "Buscar dirección"
			}),
			/* @__PURE__ */ (0, b.jsx)("input", {
				id: "address-search",
				role: "combobox",
				"aria-expanded": c.length > 0,
				value: o,
				onChange: (e) => {
					s(e.target.value), d(e.target.value);
				},
				placeholder: "Escribe calle, ciudad o código postal",
				autoComplete: "off"
			}),
			l && /* @__PURE__ */ (0, b.jsx)("small", {
				role: "status",
				children: "Buscando…"
			}),
			u && /* @__PURE__ */ (0, b.jsx)("small", {
				role: "alert",
				children: u
			}),
			c.length > 0 && /* @__PURE__ */ (0, b.jsx)("ul", {
				role: "listbox",
				style: {
					position: "absolute",
					zIndex: 10,
					width: "100%",
					margin: 0,
					padding: 6,
					listStyle: "none"
				},
				children: c.map((e) => /* @__PURE__ */ (0, b.jsx)("li", { children: /* @__PURE__ */ (0, b.jsxs)("button", {
					type: "button",
					onClick: () => f(e),
					children: [e.mainText, /* @__PURE__ */ (0, b.jsx)("small", { children: e.secondaryText })]
				}) }, e.placeId))
			})
		]
	});
}
//#endregion
//#region src/hooks/useGeolocation.ts
function S(t = {}) {
	let [n, i] = r(null), [a, o] = r(!1), [s, c] = r(null);
	return {
		coords: n,
		loading: a,
		error: s,
		getLocation: e(() => {
			if (typeof navigator > "u" || !navigator.geolocation) return c({
				code: "NOT_SUPPORTED",
				message: "Geolocalización no soportada"
			});
			if (location.protocol !== "https:" && location.hostname !== "localhost") return c({
				code: "HTTPS_REQUIRED",
				message: "La geolocalización requiere HTTPS"
			});
			o(!0), c(null), navigator.geolocation.getCurrentPosition((e) => {
				i({
					latitude: e.coords.latitude,
					longitude: e.coords.longitude,
					accuracy: e.coords.accuracy
				}), o(!1);
			}, (e) => {
				c({
					1: {
						code: "PERMISSION_DENIED",
						message: "Permiso de ubicación denegado"
					},
					2: {
						code: "POSITION_UNAVAILABLE",
						message: "Ubicación no disponible"
					},
					3: {
						code: "TIMEOUT",
						message: "Tiempo de espera agotado"
					}
				}[e.code] ?? {
					code: "UNKNOWN",
					message: e.message
				}), o(!1);
			}, {
				timeout: 1e4,
				enableHighAccuracy: !1,
				maximumAge: 6e4,
				...t
			});
		}, [
			t.enableHighAccuracy,
			t.maximumAge,
			t.timeout
		]),
		reset: () => {
			i(null), c(null);
		}
	};
}
//#endregion
//#region src/components/LocationButton.tsx
function ee({ onLocation: e, onError: n, options: r, children: i = "Usar mi ubicación" }) {
	let { getLocation: a, coords: o, loading: s, error: c } = S(r);
	return t(() => {
		o && e(o);
	}, [o, e]), t(() => {
		c && n?.(c);
	}, [c, n]), /* @__PURE__ */ (0, b.jsx)("button", {
		type: "button",
		onClick: a,
		disabled: s,
		"aria-busy": s,
		children: s ? "Buscando ubicación…" : i
	});
}
//#endregion
//#region src/components/MapView.tsx
function te({ coordinates: e, coords: r, height: a = 280, zoom: o = 15, mapStyle: s = "https://tiles.openfreemap.org/styles/liberty", onMarkerDrag: c, attribution: l = !0 }) {
	let u = e ?? (r ? {
		latitude: r.lat,
		longitude: r.lng,
		accuracy: r.accuracy
	} : null), d = n(null), f = n(null), p = n(null);
	return t(() => {
		if (d.current && !f.current) return f.current = new i.Map({
			container: d.current,
			style: s,
			center: [u?.longitude ?? -3.7038, u?.latitude ?? 40.4168],
			zoom: o,
			attributionControl: l ? {} : !1
		}), () => {
			f.current?.remove(), f.current = null;
		};
	}, [
		l,
		s,
		u,
		o
	]), t(() => {
		f.current && u && (f.current.flyTo({
			center: [u.longitude, u.latitude],
			zoom: o
		}), p.current?.remove(), p.current = new i.Marker({ draggable: !!c }).setLngLat([u.longitude, u.latitude]).addTo(f.current), c && p.current.on("dragend", () => {
			let e = p.current.getLngLat();
			c({
				latitude: e.lat,
				longitude: e.lng
			});
		}));
	}, [
		c,
		u,
		o
	]), /* @__PURE__ */ (0, b.jsx)("div", {
		ref: d,
		style: {
			width: "100%",
			height: a,
			minHeight: 220,
			borderRadius: 16,
			overflow: "hidden"
		},
		"aria-label": "Mapa de ubicación"
	});
}
//#endregion
//#region node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/util.js
function ne(e) {
	let t = Object.values(e).filter((e) => typeof e == "number");
	return Object.entries(e).filter(([e, n]) => t.indexOf(+e) === -1).map(([e, t]) => t);
}
function re(e, t = "|") {
	return e.map((e) => xe(e)).join(t);
}
function C(e, t) {
	return typeof t == "bigint" ? t.toString() : t;
}
var ie = class {
	constructor(e) {
		this._getter = e, this._value = void 0;
	}
	get value() {
		let e = this._getter;
		return e !== void 0 && (this._value = e(), this._getter = void 0), this._value;
	}
};
function ae(e) {
	return new ie(e);
}
function oe(e) {
	return e == null;
}
function se(e) {
	let t = +!!e.startsWith("^"), n = e.endsWith("$") ? e.length - 1 : e.length;
	return e.slice(t, n);
}
function ce(e, t) {
	let n = e / t, r = Math.round(n), i = 4 * 2 ** -52 * Math.max(Math.abs(n), 1);
	return Math.abs(n - r) < i ? 0 : n - r;
}
function w(e, t, n) {
	Object.defineProperty(e, t, {
		value: n,
		writable: !0,
		enumerable: !0,
		configurable: !0
	});
}
function le(e) {
	let t = Object.getOwnPropertyDescriptor(e, "shape");
	return t?.get ? t.get.raw : t?.value;
}
function T(e) {
	return le(e._zod.def) ?? e._zod.def.shape;
}
function ue(e, t, n) {
	Object.defineProperty(e, t, {
		get() {
			let e = n();
			return w(this, t, e), e;
		},
		enumerable: !0,
		configurable: !0
	});
}
function de(e, t, n) {
	t in e ? w(e, t, n) : e[t] = n;
}
function E(e, t, n, r) {
	let i = T(t);
	for (let a of n) {
		let n = Object.getOwnPropertyDescriptor(i, a);
		n.enumerable && (n.get ? ue(e, a, () => {
			let e = t._zod.def.shape[a];
			return r ? r(e, a) : e;
		}) : de(e, a, r ? r(n.value, a) : n.value));
	}
}
function fe(e, t) {
	for (let n of Reflect.ownKeys(t)) {
		let r = Object.getOwnPropertyDescriptor(t, n);
		r.enumerable && (r.get ? ue(e, n, () => t[n]) : de(e, n, r.value));
	}
}
function D(...e) {
	let t = {};
	for (let n of e) {
		let e = Object.getOwnPropertyDescriptors(n);
		Object.assign(t, e);
	}
	return Object.defineProperties({}, t);
}
function pe(e) {
	return JSON.stringify(e);
}
function me(e) {
	return e.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
var he = "captureStackTrace" in Error ? Error.captureStackTrace : (...e) => {};
function ge(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
var _e = /* @__PURE__*/ ae(() => {
	if (R.jitless || typeof navigator < "u" && navigator?.userAgent?.includes("Cloudflare")) return !1;
	try {
		return Function(""), !0;
	} catch {
		return !1;
	}
});
function O(e) {
	if (ge(e) === !1) return !1;
	let t = e.constructor;
	if (t === void 0 || typeof t != "function") return !0;
	let n = t.prototype;
	return ge(n) !== !1 && Object.prototype.hasOwnProperty.call(n, "isPrototypeOf") !== !1;
}
function ve(e) {
	return O(e) ? { ...e } : Array.isArray(e) ? [...e] : e instanceof Map ? new Map(e) : e instanceof Set ? new Set(e) : e;
}
var ye = /* @__PURE__*/ new Set([
	"string",
	"number",
	"symbol"
]);
function be(e) {
	return e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function k(e, t, n) {
	let r = new e._zod.constr(t ?? e._zod.def);
	return (!t || n?.parent) && (r._zod.parent = e), r;
}
function A(e) {
	let t = e;
	if (!t) return {};
	if (typeof t == "string") return { error: () => t };
	if (t?.message !== void 0) {
		if (t?.error !== void 0) throw Error("Cannot specify both `message` and `error` params");
		t.error = t.message;
	}
	return delete t.message, typeof t.error == "string" ? {
		...t,
		error: () => t.error
	} : t;
}
function xe(e) {
	return typeof e == "bigint" ? e.toString() + "n" : typeof e == "string" ? `"${e}"` : `${e}`;
}
function Se(e) {
	return Object.keys(e).filter((t) => e[t]._zod.optin !== void 0 && e[t]._zod.optout === "optional");
}
var Ce = {
	safeint: [-(2 ** 53 - 1), 2 ** 53 - 1],
	int32: [-2147483648, 2147483647],
	uint32: [0, 4294967295],
	float32: [-34028234663852886e22, 34028234663852886e22],
	float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
}, we = {
	int64: [/* @__PURE__*/ BigInt("-9223372036854775808"), /* @__PURE__*/ BigInt("9223372036854775807")],
	uint64: [/* @__PURE__*/ BigInt(0), /* @__PURE__*/ BigInt("18446744073709551615")]
};
function Te(e, t) {
	let n = e._zod.def, r = n.checks;
	if (r && r.length > 0) throw Error(".pick() cannot be used on object schemas containing refinements");
	let i = {};
	return E(i, e, Ee(e, t)), k(e, D(n, {
		shape: i,
		checks: []
	}));
}
function Ee(e, t) {
	let n = T(e), r = [];
	for (let e of Reflect.ownKeys(t)) {
		if (!Object.getOwnPropertyDescriptor(n, e)?.enumerable) throw Error(`Unrecognized key: "${String(e)}"`);
		t[e] && r.push(e);
	}
	return r;
}
function De(e, t) {
	let n = e._zod.def, r = n.checks;
	if (r && r.length > 0) throw Error(".omit() cannot be used on object schemas containing refinements");
	let i = new Set(Ee(e, t)), a = {};
	return E(a, e, Reflect.ownKeys(T(e)).filter((e) => !i.has(e))), k(e, D(n, {
		shape: a,
		checks: []
	}));
}
function Oe(e, t) {
	if (!O(t)) throw Error("Invalid input to extend: expected a plain object");
	let n = e._zod.def.checks;
	if (n && n.length > 0) {
		let n = T(e);
		for (let e of Reflect.ownKeys(t)) if (Object.getOwnPropertyDescriptor(n, e) !== void 0) throw Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.");
	}
	return k(e, D(e._zod.def, { shape: ke(e, t) }));
}
function ke(e, t) {
	let n = {};
	return E(n, e, Reflect.ownKeys(T(e))), fe(n, t), n;
}
function Ae(e, t) {
	if (!O(t)) throw Error("Invalid input to safeExtend: expected a plain object");
	return k(e, D(e._zod.def, { shape: ke(e, t) }));
}
function je(e, t) {
	if (!t?._zod?.def) throw Error("Invalid input to merge: expected an object schema. To merge a plain shape, use `.extend()`.");
	if (e._zod.def.checks?.length) throw Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");
	let n = {};
	return E(n, e, Reflect.ownKeys(T(e))), E(n, t, Reflect.ownKeys(T(t))), k(e, D(e._zod.def, {
		shape: n,
		get catchall() {
			return t._zod.def.catchall;
		},
		checks: t._zod.def.checks ?? []
	}));
}
function Me(e, t, n, r = "partial") {
	let i = t._zod.def.checks;
	if (i && i.length > 0) throw Error(`.${r}() cannot be used on object schemas containing refinements`);
	let a = n ? new Set(Ee(t, n)) : void 0, o = {};
	return E(o, t, Reflect.ownKeys(T(t)), e && ((t, n) => a && !a.has(n) ? t : new e({
		type: "optional",
		innerType: t
	}))), k(t, D(t._zod.def, {
		shape: o,
		checks: []
	}));
}
function Ne(e, t, n) {
	let r = n ? new Set(Ee(t, n)) : void 0, i = {};
	return E(i, t, Reflect.ownKeys(T(t)), (t, n) => r && !r.has(n) ? t : new e({
		type: "nonoptional",
		innerType: t
	})), k(t, D(t._zod.def, { shape: i }));
}
function j(e, t = 0) {
	if (e.aborted === !0) return !0;
	for (let n = t; n < e.issues.length; n++) if (e.issues[n]?.continue !== !0) return !0;
	return !1;
}
function Pe(e, t = 0) {
	if (e.aborted === !0) return !0;
	for (let n = t; n < e.issues.length; n++) if (e.issues[n]?.continue === !1) return !0;
	return !1;
}
function Fe(e, t) {
	return t.map((t) => {
		var n;
		return (n = t).path ?? (n.path = []), t.path.unshift(e), t;
	});
}
function Ie(e) {
	return typeof e == "string" ? e : e?.message;
}
function Le(e, t, n) {
	var r;
	for (let i = t; i < e.length; i++) (r = e[i]).schema ?? (r.schema = n);
}
function M(e, t, n) {
	var r;
	let i = e.inst?._zod?.traits;
	i?.has("$ZodType") && (i.has("$ZodCheck") ? (r = e).schema ?? (r.schema = e.inst) : e.schema = e.inst);
	let a = e.schema === e.inst ? void 0 : e.schema?._zod.def?.error, o = e.message ? e.message : Ie(e.inst?._zod.def?.error?.(e)) ?? Ie(a?.(e)) ?? Ie(t?.error?.(e)) ?? Ie(n.customError?.(e)) ?? Ie(n.localeError?.(e)) ?? "Invalid input", s = {};
	for (let t of Object.keys(e)) t !== "inst" && t !== "schema" && t !== "continue" && t !== "input" && t !== "__proto__" && (s[t] = e[t]);
	return s.path ??= [], s.message = o, t?.reportInput && (s.input = e.input), s;
}
var Re = /[\uD800-\uDBFF]/;
function ze(e) {
	let t = e.length;
	if (!Re.test(e)) return t;
	let n = t;
	for (let r = 0; r < t - 1; r++) (e.charCodeAt(r) & 64512) == 55296 && (e.charCodeAt(r + 1) & 64512) == 56320 && (n--, r++);
	return n;
}
function Be(e) {
	return Array.isArray(e) ? "array" : typeof e == "string" ? "string" : "unknown";
}
function Ve(e) {
	let t = typeof e;
	switch (t) {
		case "number": return Number.isNaN(e) ? "nan" : "number";
		case "object": {
			if (e === null) return "null";
			if (Array.isArray(e)) return "array";
			let t = e;
			if (t && Object.getPrototypeOf(t) !== Object.prototype && "constructor" in t && t.constructor) return t.constructor.name;
		}
	}
	return t;
}
function He(...e) {
	let [t, n, r] = e;
	return typeof t == "string" ? {
		message: t,
		code: "custom",
		input: n,
		inst: r
	} : { ...t };
}
function Ue(e, t) {
	for (let n in t) {
		let r = Object.getOwnPropertyDescriptor(t, n);
		r.get ? Object.defineProperty(e, n, {
			...r,
			enumerable: !1
		}) : Ke(e, n, r.value);
	}
}
function N(e, t, n, r = !0) {
	return Object.defineProperty(e, t, {
		configurable: !0,
		writable: !0,
		enumerable: r,
		value: n
	}), n;
}
function We(e, t, n) {
	return N(e, t, n, !1);
}
function Ge(e, t) {
	for (let n in e) {
		let r = e[n];
		Object.defineProperty(t, n, {
			configurable: !0,
			enumerable: !0,
			get() {
				return N(this, n, r(this));
			},
			set(e) {
				N(this, n, e);
			}
		});
	}
	return t;
}
function Ke(e, t, n) {
	Object.defineProperty(e, t, {
		configurable: !0,
		get() {
			return this == null ? n : N(this, t, n.bind(this));
		},
		set(e) {
			N(this, t, e);
		}
	});
}
function qe(e, t) {
	let n = Object.getPrototypeOf(e);
	return t in n ? void 0 : n;
}
var Je, P = !1, Ye = {
	configurable: !0,
	get() {
		P = !0;
	}
};
function F(e, t, n) {
	let r = Object.getPrototypeOf(e._zod);
	if (t in r && Je !== e._zod) {
		Je = void 0;
		return;
	}
	Je = e._zod, Object.defineProperty(r, t, {
		configurable: !0,
		get() {
			Object.defineProperty(this, t, Ye);
			let e = P;
			P = !1;
			try {
				let r = n(this);
				return P ? delete this[t] : Object.defineProperty(this, t, {
					configurable: !0,
					writable: !0,
					value: r
				}), P ||= e, r;
			} catch (n) {
				throw delete this[t], P ||= e, n;
			}
		},
		set(e) {
			Object.defineProperty(this, t, {
				configurable: !0,
				writable: !0,
				value: e
			});
		}
	});
}
function Xe(e, t, n, r) {
	let i = qe(e, t);
	i && Object.defineProperty(i, t, {
		configurable: !0,
		get() {
			let e = {
				configurable: !0,
				writable: !0,
				enumerable: r,
				value: void 0
			};
			return Object.defineProperty(this, t, e), e.value = n(this), Object.defineProperty(this, t, e), e.value;
		},
		set(e) {
			Object.defineProperty(this, t, {
				configurable: !0,
				writable: !0,
				enumerable: r,
				value: e
			});
		}
	});
}
var Ze = "~constantCatch";
function Qe(e) {
	let t = () => e;
	return t[Ze] = !0, t;
}
//#endregion
//#region node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/core.js
var $e, et = {
	value: void 0,
	enumerable: !1
}, tt = "captureStackTrace" in Error ? Error : null;
function nt(e) {
	let t = tt;
	if (t) {
		let n = t.stackTraceLimit;
		if (typeof n == "number") {
			try {
				t.stackTraceLimit = 0;
			} catch {
				return tt = null, new e();
			}
			try {
				return new e();
			} finally {
				t.stackTraceLimit = n;
			}
		}
	}
	return new e();
}
function I(e, t, n, r) {
	let i = {};
	function a(e) {
		this.def = e, this.constr = d, this.traits = /* @__PURE__ */ new Set();
	}
	a.prototype = i;
	let o = n, s = o && /* @__PURE__ */ new WeakSet();
	function c(n, r) {
		if (!n._zod) {
			et.value = new a(r);
			try {
				Object.defineProperty(n, "_zod", et);
			} finally {
				et.value = void 0;
			}
		} else if (n._zod.traits.has(e)) return;
		if (n._zod.traits.add(e), t(n, r), s) {
			let e = Object.getPrototypeOf(n), t = n._zod.constr.prototype, r = e;
			for (; r && r !== t;) r = Object.getPrototypeOf(r);
			let i = r ?? e;
			s.has(i) || (s.add(i), Ue(i, o));
		}
		let i = d.prototype;
		for (let e in i) Object.prototype.hasOwnProperty.call(i, e) && (e in n || (n[e] = i[e].bind(n)));
	}
	let l = r?.Parent ?? Object;
	class u extends l {}
	Object.defineProperty(u, "name", { value: e });
	function d(e) {
		let t = r?.Parent ? nt(u) : this;
		c(t, e);
		let n = t._zod.deferred;
		if (n) {
			for (let e of n) e();
			t._zod.deferred = void 0;
		}
		let i = globalThis.__zod_globalConfig?.postProcessor;
		return i && i(t), t;
	}
	return Object.defineProperty(d, "init", { value: c }), Object.defineProperty(d, Symbol.hasInstance, { value: (t) => r?.Parent && t instanceof r.Parent ? !0 : t?._zod?.traits?.has(e) }), Object.defineProperty(d, "name", { value: e }), d;
}
var L = class extends Error {
	constructor() {
		super("Encountered Promise during synchronous parse. Use .parseAsync() instead.");
	}
}, rt = class extends Error {
	constructor(e) {
		super(`Encountered unidirectional transform during encode: ${e}`), this.name = "ZodEncodeError";
	}
};
($e = globalThis).__zod_globalConfig ?? ($e.__zod_globalConfig = {});
var R = globalThis.__zod_globalConfig;
function z(e) {
	return e && Object.assign(R, e), R;
}
//#endregion
//#region node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/errors.js
function it() {
	let e = this._zod;
	return e.message ??= JSON.stringify(e.def, C, 2), e.message;
}
function at(e) {
	this._zod.message = e;
}
var ot = {
	get: it,
	set: at,
	enumerable: !0,
	configurable: !0
}, st = {
	value: void 0,
	enumerable: !1
}, ct = /* @__PURE__ */ new WeakSet([Object.prototype, Error.prototype]), lt = (e, t) => {
	e.name = "$ZodError", st.value = t, Object.defineProperty(e, "issues", st), st.value = void 0, Object.defineProperty(e, "message", ot);
	let n = Object.getPrototypeOf(e);
	ct.has(n) || (ct.add(n), Object.defineProperty(n, "toString", {
		configurable: !0,
		enumerable: !1,
		get() {
			let e = () => this.message;
			return Object.defineProperty(this, "toString", {
				value: e,
				configurable: !0,
				writable: !0
			}), e;
		},
		set(e) {
			Object.defineProperty(this, "toString", {
				value: e,
				configurable: !0,
				writable: !0
			});
		}
	}));
}, ut = I("$ZodError", lt);
I("$ZodError", lt, void 0, { Parent: Error });
function dt(e, t, n) {
	return Object.prototype.hasOwnProperty.call(e, t) || (t === "__proto__" ? Object.defineProperty(e, t, {
		value: n(),
		writable: !0,
		enumerable: !0,
		configurable: !0
	}) : e[t] = n()), e[t];
}
function ft(e, t = (e) => e.message) {
	let n = {}, r = [];
	for (let i of e.issues) i.path.length > 0 ? dt(n, i.path[0], () => []).push(t(i)) : r.push(t(i));
	return {
		formErrors: r,
		fieldErrors: n
	};
}
function pt(e, t = (e) => e.message) {
	let n = { _errors: [] }, r = (e, i = []) => {
		for (let a of e.issues) if (a.code === "invalid_union" && a.errors.length) a.errors.map((e) => r({ issues: e }, [...i, ...a.path]));
		else if (a.code === "invalid_key") r({ issues: a.issues }, [...i, ...a.path]);
		else if (a.code === "invalid_element") r({ issues: a.issues }, [...i, ...a.path]);
		else {
			let e = [...i, ...a.path];
			if (e.length === 0) n._errors.push(t(a));
			else {
				let r = n, i = 0;
				for (; i < e.length;) {
					let n = e[i], o = i === e.length - 1;
					if (n === "_errors") {
						o && r._errors.push(t(a)), i++;
						continue;
					}
					Object.prototype.hasOwnProperty.call(r, n) || Object.defineProperty(r, n, {
						value: { _errors: [] },
						enumerable: !0,
						writable: !0,
						configurable: !0
					});
					let s = r[n];
					o && s._errors.push(t(a)), r = s, i++;
				}
			}
		}
	};
	return r(e), n;
}
//#endregion
//#region node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/parse.js
function mt(e, t) {
	return {
		callee: t?.callee ?? e,
		Err: t?.Err
	};
}
var ht = (e) => {
	let t = (n, r, i, a) => {
		let o = i ? {
			...i,
			async: !1
		} : { async: !1 }, s = n._zod.run({
			value: r,
			issues: []
		}, o);
		if (s instanceof Promise) throw new L();
		if (s.issues.length) {
			let n = new ((a?.Err) ?? e)(s.issues.map((e) => M(e, o, z())));
			throw he(n, a?.callee ?? t), n;
		}
		return s.value;
	};
	return t;
}, gt = (e) => {
	let t = async (n, r, i, a) => {
		let o = i ? {
			...i,
			async: !0
		} : { async: !0 }, s = n._zod.run({
			value: r,
			issues: []
		}, o);
		if (s instanceof Promise && (s = await s), s.issues.length) {
			let n = new ((a?.Err) ?? e)(s.issues.map((e) => M(e, o, z())));
			throw he(n, a?.callee ?? t), n;
		}
		return s.value;
	};
	return t;
}, _t = (e) => (t, n, r) => {
	let i = r ? {
		...r,
		async: !1
	} : { async: !1 }, a = t._zod.run({
		value: n,
		issues: []
	}, i);
	if (a instanceof Promise) throw new L();
	return a.issues.length ? vt(e, a.issues, i) : {
		success: !0,
		data: a.value
	};
};
function vt(e, t, n) {
	let r;
	return {
		success: !1,
		get error() {
			return r || (r = new e(t.map((e) => M(e, n, z()))), t = void 0, n = void 0), r;
		},
		set error(e) {
			r = e, t = void 0, n = void 0;
		}
	};
}
var yt = (e) => async (t, n, r) => {
	let i = r ? {
		...r,
		async: !0
	} : { async: !0 }, a = t._zod.run({
		value: n,
		issues: []
	}, i);
	return a instanceof Promise && (a = await a), a.issues.length ? vt(e, a.issues, i) : {
		success: !0,
		data: a.value
	};
}, bt = /* @__PURE__ */ Symbol.for("zod.compile.invalid"), xt = /* @__PURE__ */ Symbol.for("zod.compile.fallback"), St = ((e, t, n) => {
	let r = e._zod.bag.validator;
	if (r !== void 0) {
		if (r(t) !== bt) return !0;
		if (r.definite === !0 && n === void 0) return !1;
	}
	return Ct(e, t, n);
});
function Ct(e, t, n) {
	let r = n ? {
		...n,
		async: !1,
		abortEarly: !0
	} : {
		async: !1,
		abortEarly: !0
	}, i = e._zod.bag.fallbackRun, a;
	if (i ? (r[xt] = !0, a = i({
		value: t,
		issues: []
	}, r)) : a = e._zod.run({
		value: t,
		issues: []
	}, r), a instanceof Promise) throw new L();
	return a.issues.length === 0;
}
var wt = async (e, t, n) => {
	let r = n ? {
		...n,
		async: !0,
		abortEarly: !0
	} : {
		async: !0,
		abortEarly: !0
	}, i = e._zod.run({
		value: t,
		issues: []
	}, r);
	return i instanceof Promise && (i = await i), i.issues.length === 0;
}, Tt = (e) => {
	let t = ht(e), n = (e, r, i, a) => {
		let o = i ? {
			...i,
			direction: "backward"
		} : { direction: "backward" };
		return t(e, r, o, mt(n, a));
	};
	return n;
}, Et = (e) => {
	let t = ht(e), n = (e, r, i, a) => t(e, r, i, mt(n, a));
	return n;
}, Dt = (e) => {
	let t = gt(e), n = async (e, r, i, a) => {
		let o = i ? {
			...i,
			direction: "backward"
		} : { direction: "backward" };
		return await t(e, r, o, mt(n, a));
	};
	return n;
}, Ot = (e) => {
	let t = gt(e), n = async (e, r, i, a) => await t(e, r, i, mt(n, a));
	return n;
}, kt = (e) => (t, n, r) => {
	let i = r ? {
		...r,
		direction: "backward"
	} : { direction: "backward" };
	return _t(e)(t, n, i);
}, At = (e) => (t, n, r) => _t(e)(t, n, r), jt = (e) => async (t, n, r) => {
	let i = r ? {
		...r,
		direction: "backward"
	} : { direction: "backward" };
	return yt(e)(t, n, i);
}, Mt = (e) => async (t, n, r) => yt(e)(t, n, r), Nt = /^[cC][0-9a-z]{6,}$/, Pt = /^[0-9a-z]+$/, Ft = /^[0-7][0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{25}$/, It = /^[0-9a-vA-V]{20}$/, Lt = /^[A-Za-z0-9]{27}$/, Rt = /^[a-zA-Z0-9_-]{21}$/;
function zt(e) {
	return RegExp(`^[a-zA-Z0-9_-]{${e}}$`);
}
var Bt = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/, Vt = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/, Ht = (e) => e ? RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${e}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`) : /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/, Ut = /^(?:[A-Za-z0-9_'+\-]+\.)*[A-Za-z0-9_'+\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/, Wt = "^(?=[\\s\\S]*[\\p{Extended_Pictographic}\\p{Regional_Indicator}\\u20E3])[\\p{Extended_Pictographic}\\p{Emoji_Component}]+$";
function Gt() {
	return new RegExp(Wt, "u");
}
var Kt = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/, qt = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/, Jt = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/, Yt = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/, Xt = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/, Zt = /^(?:[A-Za-z0-9_-]{4})*(?:[A-Za-z0-9_-]{2,3})?$/, Qt = /^https?$/, $t = /^\+[1-9]\d{6,14}$/, en = "(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))";
function tn(e) {
	return RegExp(`^${e}$`);
}
var nn = /*@__PURE__*/ tn(en);
function rn(e) {
	let t = "(?:[01]\\d|2[0-3]):[0-5]\\d";
	return typeof e.precision == "number" ? e.precision === -1 ? `${t}` : e.precision === 0 ? `${t}:[0-5]\\d` : `${t}:[0-5]\\d\\.\\d{${e.precision}}` : e.seconds ? `${t}:[0-5]\\d(?:\\.\\d+)?` : `${t}(?::[0-5]\\d(?:\\.\\d+)?)?`;
}
function an(e) {
	return RegExp(`^${rn(e)}$`);
}
function on(e) {
	let t = ["Z"];
	e.offset && t.push("([+-](?:[01]\\d|2[0-3]):[0-5]\\d)");
	let n = `${rn({
		precision: e.precision,
		seconds: !0
	})}(?:${t.join("|")})`, r = e.local ? `${n}|${rn({ precision: e.precision })}` : n;
	return RegExp(`^${en}T(?:${r})$`);
}
var sn = /^[\s\S]{0,}$/, cn = /^-?\d+$/, ln = /^-?\d+(?:\.\d+)?$/, un = /^(?:true|false)$/i, dn = /^[^A-Z]*$/, fn = /^[^a-z]*$/, B = /*@__PURE__*/ I("$ZodCheck", (e, t) => {
	var n;
	e._zod ??= {}, e._zod.def = t, (n = e._zod).onattach ?? (n.onattach = []);
}), pn = (e) => {
	let t = e.value;
	return !oe(t) && t.length !== void 0;
}, mn = {
	number: "number",
	bigint: "bigint",
	object: "date"
}, hn = /*@__PURE__*/ I("$ZodCheckLessThan", (e, t) => {
	B.init(e, t);
	let n = mn[typeof t.value];
	e._zod.check = (r) => {
		(t.inclusive ? r.value <= t.value : r.value < t.value) || r.issues.push({
			origin: mn[typeof r.value] ?? n,
			code: "too_big",
			maximum: typeof t.value == "object" ? t.value.getTime() : t.value,
			input: r.value,
			inclusive: t.inclusive,
			inst: e,
			continue: !t.abort
		});
	};
}), gn = /*@__PURE__*/ I("$ZodCheckGreaterThan", (e, t) => {
	B.init(e, t);
	let n = mn[typeof t.value];
	e._zod.check = (r) => {
		(t.inclusive ? r.value >= t.value : r.value > t.value) || r.issues.push({
			origin: mn[typeof r.value] ?? n,
			code: "too_small",
			minimum: typeof t.value == "object" ? t.value.getTime() : t.value,
			input: r.value,
			inclusive: t.inclusive,
			inst: e,
			continue: !t.abort
		});
	};
}), _n = /*@__PURE__*/ I("$ZodCheckMultipleOf", (e, t) => {
	B.init(e, t), e._zod.check = (n) => {
		if (typeof n.value != typeof t.value) throw Error("Cannot mix number and bigint in multiple_of check.");
		(typeof n.value == "bigint" ? t.value !== BigInt(0) && n.value % t.value === BigInt(0) : ce(n.value, t.value) === 0) || n.issues.push({
			origin: typeof n.value,
			code: "not_multiple_of",
			divisor: t.value,
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
}), vn = /*@__PURE__*/ I("$ZodCheckNumberFormat", (e, t) => {
	B.init(e, t), t.format = t.format || "float64";
	let n = t.format?.includes("int"), r = n ? "int" : "number", [i, a] = Ce[t.format];
	e._zod.check = (o) => {
		let s = o.value;
		if (n) {
			if (!Number.isInteger(s)) {
				o.issues.push({
					expected: r,
					format: t.format,
					code: "invalid_type",
					continue: !1,
					input: s,
					inst: e
				});
				return;
			}
			if (!Number.isSafeInteger(s)) {
				s > 0 ? o.issues.push({
					input: s,
					code: "too_big",
					maximum: 2 ** 53 - 1,
					note: "Integers must be within the safe integer range.",
					inst: e,
					origin: r,
					inclusive: !0,
					continue: !t.abort
				}) : o.issues.push({
					input: s,
					code: "too_small",
					minimum: -(2 ** 53 - 1),
					note: "Integers must be within the safe integer range.",
					inst: e,
					origin: r,
					inclusive: !0,
					continue: !t.abort
				});
				return;
			}
		}
		s < i && o.issues.push({
			origin: "number",
			input: s,
			code: "too_small",
			minimum: i,
			inclusive: !0,
			inst: e,
			continue: !t.abort
		}), s > a && o.issues.push({
			origin: "number",
			input: s,
			code: "too_big",
			maximum: a,
			inclusive: !0,
			inst: e,
			continue: !t.abort
		});
	};
}), yn = /*@__PURE__*/ I("$ZodCheckMaxLength", (e, t) => {
	var n;
	B.init(e, t), (n = e._zod.def).when ?? (n.when = pn), e._zod.check = (n) => {
		let r = n.value, i = r.length;
		if ((typeof r == "string" && i > t.maximum ? ze(r) : i) <= t.maximum) return;
		let a = Be(r);
		n.issues.push({
			origin: a,
			code: "too_big",
			maximum: t.maximum,
			inclusive: !0,
			input: r,
			inst: e,
			continue: !t.abort
		});
	};
}), bn = /*@__PURE__*/ I("$ZodCheckMinLength", (e, t) => {
	var n;
	B.init(e, t), (n = e._zod.def).when ?? (n.when = pn), e._zod.check = (n) => {
		let r = n.value, i = r.length;
		if ((typeof r == "string" && i >= t.minimum && i < t.minimum * 2 ? ze(r) : i) >= t.minimum) return;
		let a = Be(r);
		n.issues.push({
			origin: a,
			code: "too_small",
			minimum: t.minimum,
			inclusive: !0,
			input: r,
			inst: e,
			continue: !t.abort
		});
	};
}), xn = /*@__PURE__*/ I("$ZodCheckLengthEquals", (e, t) => {
	var n;
	B.init(e, t), (n = e._zod.def).when ?? (n.when = pn), e._zod.check = (n) => {
		let r = n.value, i = r.length, a = typeof r == "string" && i >= t.length && i <= t.length * 2 ? ze(r) : i;
		if (a === t.length) return;
		let o = Be(r), s = a > t.length;
		n.issues.push({
			origin: o,
			...s ? {
				code: "too_big",
				maximum: t.length
			} : {
				code: "too_small",
				minimum: t.length
			},
			inclusive: !0,
			exact: !0,
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
}), Sn = /*@__PURE__*/ I("$ZodCheckStringFormat", (e, t) => {
	var n, r;
	B.init(e, t), t.pattern ? (n = e._zod).check ?? (n.check = (n) => {
		t.pattern.lastIndex = 0, !t.pattern.test(n.value) && n.issues.push({
			origin: "string",
			code: "invalid_format",
			format: t.format,
			input: n.value,
			...t.pattern ? { pattern: t.pattern.toString() } : {},
			inst: e,
			continue: !t.abort
		});
	}) : (r = e._zod).check ?? (r.check = () => {});
}), Cn = /*@__PURE__*/ I("$ZodCheckRegex", (e, t) => {
	Sn.init(e, t), e._zod.check = (n) => {
		t.pattern.lastIndex = 0, !t.pattern.test(n.value) && n.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "regex",
			input: n.value,
			pattern: t.pattern.toString(),
			inst: e,
			continue: !t.abort
		});
	};
}), wn = /*@__PURE__*/ I("$ZodCheckLowerCase", (e, t) => {
	t.pattern ??= dn, Sn.init(e, t);
}), Tn = /*@__PURE__*/ I("$ZodCheckUpperCase", (e, t) => {
	t.pattern ??= fn, Sn.init(e, t);
}), En = /*@__PURE__*/ I("$ZodCheckIncludes", (e, t) => {
	B.init(e, t);
	let n = be(t.includes);
	t.pattern = new RegExp(typeof t.position == "number" ? `^.{${t.position},}${n}` : n), e._zod.check = (n) => {
		n.value.includes(t.includes, t.position) || n.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "includes",
			includes: t.includes,
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
}), Dn = /*@__PURE__*/ I("$ZodCheckStartsWith", (e, t) => {
	B.init(e, t);
	let n = RegExp(`^${be(t.prefix)}.*`);
	t.pattern ??= n, e._zod.check = (n) => {
		n.value.startsWith(t.prefix) || n.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "starts_with",
			prefix: t.prefix,
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
}), On = /*@__PURE__*/ I("$ZodCheckEndsWith", (e, t) => {
	B.init(e, t);
	let n = RegExp(`.*${be(t.suffix)}$`);
	t.pattern ??= n, e._zod.check = (n) => {
		n.value.endsWith(t.suffix) || n.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "ends_with",
			suffix: t.suffix,
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
}), kn = /*@__PURE__*/ I("$ZodCheckOverwrite", (e, t) => {
	B.init(e, t), e._zod.check = (e) => {
		e.value = t.tx(e.value);
	};
}), An = class {
	constructor(e = [], t = {}) {
		this.content = [], this.indent = 0, this.args = e, this.closed = t;
	}
	indented(e) {
		this.indent += 1;
		try {
			e(this);
		} finally {
			--this.indent;
		}
	}
	write(e) {
		if (typeof e == "function") {
			e(this, { execution: "sync" }), e(this, { execution: "async" });
			return;
		}
		let t = e.split("\n").filter((e) => e), n = Math.min(...t.map((e) => e.length - e.trimStart().length)), r = t.map((e) => e.slice(n)).map((e) => " ".repeat(this.indent * 2) + e);
		for (let e of r) this.content.push(e);
	}
	compile() {
		let e = Function, t = this?.content ?? [""];
		return new e(...Object.keys(this.closed), `return function (${this.args.join(", ")}) {\n${t.join("\n")}\n};`)(...Object.values(this.closed));
	}
}, jn = {
	major: 4,
	minor: 6,
	patch: 5
}, V = /*@__PURE__*/ I("$ZodType", (e, t) => {
	var n;
	e ??= {}, e._zod.def = t, e._zod.bag = e._zod.bag || {}, e._zod.version = jn;
	let r = e._zod.def.checks, i = e._zod.traits.has("$ZodCheck") ? [e, ...r ?? []] : r?.length ? [...r] : [];
	for (let t of i) for (let n of t._zod.onattach) n(e);
	if (i.length === 0) (n = e._zod).deferred ?? (n.deferred = []), e._zod.deferred?.push(() => {
		e._zod.run = e._zod.parse;
	});
	else {
		let t = (t, n, r) => {
			if (t.memo) return t;
			let i = j(t), a;
			for (let o of n) {
				if (o._zod.def.when) {
					if (Pe(t) || !o._zod.def.when(t)) continue;
				} else if (i) continue;
				let n = t.issues.length, s = o._zod.check(t);
				if (s instanceof Promise && r?.async === !1) throw new L();
				if (a || s instanceof Promise) a = (a ?? Promise.resolve()).then(async () => {
					await s, t.issues.length !== n && (Le(t.issues, n, e), i ||= j(t, n));
				});
				else {
					if (t.issues.length === n) continue;
					Le(t.issues, n, e), i ||= j(t, n);
				}
			}
			return a ? a.then(() => t) : t;
		}, n = (n, r, a) => {
			if (j(n)) return n.aborted = !0, n;
			let o = t(r, i, a);
			if (o instanceof Promise) {
				if (a.async === !1) throw new L();
				return o.then((t) => e._zod.parse(t, a));
			}
			return e._zod.parse(o, a);
		};
		e._zod.run = (r, a) => {
			if (a.skipChecks) return e._zod.parse(r, a);
			if (a.direction === "backward") {
				let t = e._zod.parse({
					value: r.value,
					issues: []
				}, {
					...a,
					skipChecks: !0
				});
				return t instanceof Promise ? t.then((e) => n(e, r, a)) : n(t, r, a);
			}
			let o = e._zod.parse(r, a);
			if (o instanceof Promise) {
				if (a.async === !1) throw new L();
				return o.then((e) => t(e, i, a));
			}
			return t(o, i, a);
		};
	}
}, {
	get "~standard"() {
		return We(this, "~standard", Pn(this));
	},
	set "~standard"(e) {
		N(this, "~standard", e);
	}
}), Mn = (e, t) => e.issues.length ? { issues: e.issues.map((e) => M(e, t, z())) } : { value: e.value };
async function Nn(e, t) {
	let n = { async: !0 };
	return Mn(await e._zod.run({
		value: t,
		issues: []
	}, n), n);
}
function Pn(e) {
	return {
		validate: (t) => {
			let n = { async: !1 };
			try {
				let r = e._zod.run({
					value: t,
					issues: []
				}, n);
				if (!(r instanceof Promise)) return Mn(r, n);
			} catch {}
			return Nn(e, t);
		},
		vendor: "zod",
		version: 1
	};
}
var Fn = /*@__PURE__*/ I("$ZodString", (e, t) => {
	V.init(e, t), e._zod.pattern = t.pattern ?? sn, e._zod.parse = (n, r) => {
		if (t.coerce) try {
			n.value = String(n.value);
		} catch {}
		return typeof n.value == "string" || n.issues.push({
			expected: "string",
			code: "invalid_type",
			input: n.value,
			inst: e
		}), n;
	};
}), H = /*@__PURE__*/ I("$ZodStringFormat", (e, t) => {
	Sn.init(e, t), Fn.init(e, t);
}), In = /*@__PURE__*/ I("$ZodGUID", (e, t) => {
	t.pattern ??= Vt, H.init(e, t);
}), Ln = /*@__PURE__*/ I("$ZodUUID", (e, t) => {
	if (t.version) {
		let e = {
			v1: 1,
			v2: 2,
			v3: 3,
			v4: 4,
			v5: 5,
			v6: 6,
			v7: 7,
			v8: 8
		}[t.version];
		if (e === void 0) throw Error(`Invalid UUID version: "${t.version}"`);
		t.pattern ??= Ht(e);
	} else t.pattern ??= Ht();
	H.init(e, t);
}), Rn = /*@__PURE__*/ I("$ZodEmail", (e, t) => {
	t.pattern ??= Ut, H.init(e, t);
});
function zn(e) {
	try {
		return typeof URL < "u" && typeof URL.canParse == "function" ? URL.canParse(e) : (new URL(e), !0);
	} catch {
		return !1;
	}
}
function Bn(e, t) {
	return !("normalize" in t) && !("hostname" in t) && !("protocol" in t) ? zn(e) || 2 : Vn(e, t);
}
function Vn(e, t) {
	if (!t.normalize && t.protocol?.source === Qt.source && !/^https?:\/\//i.test(e)) return 1;
	try {
		if (typeof URL < "u") {
			let t = URL;
			if (typeof t.parse == "function") return t.parse(e) ?? 2;
		}
		return new URL(e);
	} catch {
		return 2;
	}
}
var Hn = /[\t\n\r]/g;
function Un(e) {
	return e.replace(Hn, "");
}
function Wn(e, t) {
	return t.lastIndex = 0, t.test(e.hostname);
}
function Gn(e, t) {
	return t.lastIndex = 0, t.test(e.protocol.endsWith(":") ? e.protocol.slice(0, -1) : e.protocol);
}
var Kn = /*@__PURE__*/ I("$ZodURL", (e, t) => {
	H.init(e, t), e._zod.check = (n) => {
		try {
			let r = n.value.trim(), i = Bn(r, t);
			if (i === 1) {
				n.issues.push({
					code: "invalid_format",
					format: "url",
					note: "Invalid URL format",
					input: n.value,
					inst: e,
					continue: !t.abort
				});
				return;
			}
			if (i === 2) {
				n.issues.push({
					code: "invalid_format",
					format: "url",
					input: n.value,
					inst: e,
					continue: !t.abort
				});
				return;
			}
			if (i === !0) {
				n.value = Un(r);
				return;
			}
			t.hostname && !Wn(i, t.hostname) && n.issues.push({
				code: "invalid_format",
				format: "url",
				note: "Invalid hostname",
				pattern: t.hostname.source,
				input: n.value,
				inst: e,
				continue: !t.abort
			}), t.protocol && !Gn(i, t.protocol) && n.issues.push({
				code: "invalid_format",
				format: "url",
				note: "Invalid protocol",
				pattern: t.protocol.source,
				input: n.value,
				inst: e,
				continue: !t.abort
			}), n.value = t.normalize ? i.href : Un(r);
			return;
		} catch {
			n.issues.push({
				code: "invalid_format",
				format: "url",
				input: n.value,
				inst: e,
				continue: !t.abort
			});
		}
	};
}), qn = /*@__PURE__*/ I("$ZodEmoji", (e, t) => {
	t.pattern ??= Gt(), H.init(e, t);
}), Jn = /*@__PURE__*/ I("$ZodNanoID", (e, t) => {
	if (t.length !== void 0 && (!Number.isInteger(t.length) || t.length < 1)) throw Error(`Invalid nanoid length: ${t.length}`);
	t.pattern ??= t.length === void 0 ? Rt : zt(t.length), H.init(e, t);
}), Yn = /*@__PURE__*/ I("$ZodCUID", (e, t) => {
	t.pattern ??= Nt, H.init(e, t);
}), Xn = /*@__PURE__*/ I("$ZodCUID2", (e, t) => {
	t.pattern ??= Pt, H.init(e, t);
}), Zn = /*@__PURE__*/ I("$ZodULID", (e, t) => {
	t.pattern ??= Ft, H.init(e, t);
}), Qn = /*@__PURE__*/ I("$ZodXID", (e, t) => {
	t.pattern ??= It, H.init(e, t);
}), $n = /*@__PURE__*/ I("$ZodKSUID", (e, t) => {
	t.pattern ??= Lt, H.init(e, t);
}), er = /*@__PURE__*/ I("$ZodISODateTime", (e, t) => {
	t.pattern ??= on(t), H.init(e, t);
}), tr = /*@__PURE__*/ I("$ZodISODate", (e, t) => {
	t.pattern ??= nn, H.init(e, t);
}), nr = /*@__PURE__*/ I("$ZodISOTime", (e, t) => {
	t.pattern ??= an(t), H.init(e, t);
}), rr = /*@__PURE__*/ I("$ZodISODuration", (e, t) => {
	t.pattern ??= Bt, H.init(e, t);
}), ir = /*@__PURE__*/ I("$ZodIPv4", (e, t) => {
	t.pattern ??= Kt, H.init(e, t);
}), ar = /^[0-9a-fA-F:.]+$/;
function or(e) {
	return ar.test(e) ? zn(`http://[${e}]`) : !1;
}
var sr = /*@__PURE__*/ I("$ZodIPv6", (e, t) => {
	t.pattern ??= qt, H.init(e, t), e._zod.check = (n) => {
		or(n.value) || n.issues.push({
			code: "invalid_format",
			format: "ipv6",
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
}), cr = /*@__PURE__*/ I("$ZodCIDRv4", (e, t) => {
	t.pattern ??= Jt, H.init(e, t);
});
function lr(e) {
	let t = e.split("/");
	if (t.length !== 2) return !1;
	let [n, r] = t;
	if (!r) return !1;
	let i = Number(r);
	return `${i}` !== r || i < 0 || i > 128 ? !1 : or(n);
}
var ur = /*@__PURE__*/ I("$ZodCIDRv6", (e, t) => {
	t.pattern ??= Yt, H.init(e, t), e._zod.check = (n) => {
		lr(n.value) || n.issues.push({
			code: "invalid_format",
			format: "cidrv6",
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
});
function dr(e) {
	if (e === "") return !0;
	if (/\s/.test(e) || e.length % 4 != 0) return !1;
	try {
		return atob(e), !0;
	} catch {
		return !1;
	}
}
var fr = /^[0-9a-zA-Z+/]*={0,2}$/, pr = /*@__PURE__*/ I("$ZodBase64", (e, t) => {
	t.pattern ??= fr, H.init(e, t), e._zod.check = (n) => {
		dr(n.value) || n.issues.push({
			code: "invalid_format",
			format: "base64",
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
}), mr = /^[A-Za-z0-9_-]*$/;
function hr(e) {
	if (!mr.test(e)) return !1;
	let t = e.replace(/[-_]/g, (e) => e === "-" ? "+" : "/");
	return dr(t.padEnd(Math.ceil(t.length / 4) * 4, "="));
}
var gr = /*@__PURE__*/ I("$ZodBase64URL", (e, t) => {
	t.pattern ??= mr, H.init(e, t), e._zod.check = (n) => {
		hr(n.value) || n.issues.push({
			code: "invalid_format",
			format: "base64url",
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
}), _r = /*@__PURE__*/ I("$ZodE164", (e, t) => {
	t.pattern ??= $t, H.init(e, t);
});
function vr(e, t = null) {
	try {
		let n = e.split(".");
		if (n.length !== 3) return !1;
		let [r] = n;
		if (!r) return !1;
		let i = JSON.parse(atob(r));
		return !("typ" in i && i?.typ !== "JWT" || !i.alg || t && (!("alg" in i) || i.alg !== t));
	} catch {
		return !1;
	}
}
var yr = /*@__PURE__*/ I("$ZodJWT", (e, t) => {
	H.init(e, t), e._zod.check = (n) => {
		vr(n.value, t.alg) || n.issues.push({
			code: "invalid_format",
			format: "jwt",
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
}), br = /*@__PURE__*/ I("$ZodNumber", (e, t) => {
	V.init(e, t), e._zod.pattern = ln, e._zod.parse = (n, r) => {
		if (t.coerce) try {
			n.value = Number(n.value);
		} catch {}
		let i = n.value;
		if (typeof i == "number" && !Number.isNaN(i) && Number.isFinite(i)) return n;
		let a = typeof i == "number" ? Number.isNaN(i) ? "NaN" : Number.isFinite(i) ? void 0 : String(i) : void 0;
		return n.issues.push({
			expected: "number",
			code: "invalid_type",
			input: i,
			inst: e,
			...a ? { received: a } : {}
		}), n;
	};
}), xr = /*@__PURE__*/ I("$ZodNumberFormat", (e, t) => {
	vn.init(e, t), br.init(e, t);
}), Sr = /*@__PURE__*/ I("$ZodBoolean", (e, t) => {
	V.init(e, t), e._zod.pattern = un, e._zod.parse = (n, r) => {
		if (t.coerce) try {
			n.value = !!n.value;
		} catch {}
		let i = n.value;
		return typeof i == "boolean" || n.issues.push({
			expected: "boolean",
			code: "invalid_type",
			input: i,
			inst: e
		}), n;
	};
}), Cr = /*@__PURE__*/ I("$ZodUnknown", (e, t) => {
	V.init(e, t), e._zod.parse = (e) => e;
}), wr = /*@__PURE__*/ I("$ZodNever", (e, t) => {
	V.init(e, t), e._zod.parse = (t, n) => (t.issues.push({
		expected: "never",
		code: "invalid_type",
		input: t.value,
		inst: e
	}), t);
});
function Tr(e, t, n) {
	e.issues.length && t.issues.push(...Fe(n, e.issues)), t.value[n] = e.value;
}
var Er = /*@__PURE__*/ I("$ZodArray", (e, t) => {
	V.init(e, t);
	let n = R.memoizer;
	n?.attach(e), e._zod.parse = (r, i) => {
		let a = r.value;
		if (!Array.isArray(a)) return r.issues.push({
			expected: "array",
			code: "invalid_type",
			input: a,
			inst: e
		}), r;
		r.value = n ? n.alloc(e, r, Array(a.length), i) : Array(a.length);
		let o = [], s = i?.abortEarly;
		for (let e = 0; e < a.length; e++) {
			let n = a[e], c = t.element._zod.run({
				value: n,
				issues: []
			}, i);
			if (c instanceof Promise) o.push(c.then((t) => Tr(t, r, e)));
			else if (Tr(c, r, e), s && c.issues.length !== 0 && j(c)) break;
		}
		return o.length ? Promise.all(o).then(() => r) : r;
	};
});
function Dr(e, t, n, r, i, a) {
	let o = n in r, s = a === "optional";
	if (o || !s || i !== "optional") {
		if (e.issues.length) {
			if (i !== void 0 && s && !o) return;
			t.issues.push(...Fe(n, e.issues));
		}
		if (!o && i === void 0) {
			e.issues.length || t.issues.push({
				code: "invalid_type",
				expected: "nonoptional",
				input: void 0,
				path: [n]
			});
			return;
		}
		e.value === void 0 ? (o || i === "defaulted" && !s) && (t.value[n] = void 0) : t.value[n] = e.value;
	}
}
var Or = [];
function kr(e) {
	let t = Object.keys(e.shape), n = Object.getOwnPropertySymbols(e.shape), r = n.length ? n : Or, i = r.length ? [...t, ...r] : t;
	for (let t of i) if (!e.shape?.[t]?._zod?.traits?.has("$ZodType")) throw Error(`Invalid element at key "${String(t)}": expected a Zod schema`);
	let a = Se(e.shape);
	return {
		...e,
		allKeys: i,
		symbolKeys: r,
		keySet: new Set(t),
		numKeys: t.length,
		optionalKeys: new Set(a)
	};
}
function Ar(e, t, n, r, i, a, o) {
	let s = [], c = i.keySet, l = i.catchall._zod, u = l.def.type, d = l.optin, f = l.optout, p = 0;
	for (let i in t) {
		if (o && n.issues.length !== p) {
			if (j(n, p)) break;
			p = n.issues.length;
		}
		if (c.has(i)) continue;
		if (i === "__proto__") {
			u === "never" && s.push(i);
			continue;
		}
		if (u === "never") {
			s.push(i);
			continue;
		}
		let a = l.run({
			value: t[i],
			issues: []
		}, r);
		a instanceof Promise ? e.push(a.then((e) => Dr(e, n, i, t, d, f))) : Dr(a, n, i, t, d, f);
	}
	return s.length && n.issues.push({
		code: "unrecognized_keys",
		keys: s,
		input: t,
		inst: a,
		continue: !0
	}), e.length ? Promise.all(e).then(() => n) : n;
}
var jr = /*@__PURE__*/ I("$ZodObject", (e, t) => {
	V.init(e, t);
	let n = Object.getOwnPropertyDescriptor(t, "shape"), r = n?.get ? n.get.raw : t.shape ?? {};
	if (r) {
		let e = () => {
			let n = { ...r };
			return Object.defineProperty(t, "shape", { value: n }), e.raw = n, n;
		};
		e.raw = r, Object.defineProperty(t, "shape", { get: e });
	}
	let i = ae(() => kr(t));
	F(e, "propValues", (e) => {
		let t = e.def.shape, n = {};
		for (let e in t) {
			let r = t[e]._zod;
			if (r.values) {
				Object.prototype.hasOwnProperty.call(n, e) || w(n, e, /* @__PURE__ */ new Set());
				for (let t of r.values) n[e].add(t);
				r.optin !== void 0 && n[e].add(void 0);
			}
		}
		return n;
	});
	let a = ge, o = t.catchall, s, c = R.memoizer;
	c?.attach(e), e._zod.parse = (t, n) => {
		s ??= i.value;
		let r = t.value;
		if (!a(r)) return t.issues.push({
			expected: "object",
			code: "invalid_type",
			input: r,
			inst: e
		}), t;
		t.value = c ? c.alloc(e, t, {}, n) : {};
		let l = [], u = s.shape, d = n?.abortEarly, f = t.issues.length;
		for (let e of s.allKeys) {
			if (d && t.issues.length !== f) {
				if (j(t, f)) break;
				f = t.issues.length;
			}
			if (e === "__proto__") continue;
			let i = u[e], a = i._zod.optin, o = i._zod.optout, s = i._zod.run({
				value: r[e],
				issues: []
			}, n);
			s instanceof Promise ? l.push(s.then((n) => Dr(n, t, e, r, a, o))) : Dr(s, t, e, r, a, o);
		}
		return o ? Ar(l, r, t, n, i.value, e, d === !0) : l.length ? Promise.all(l).then(() => t) : t;
	};
}), Mr = /*@__PURE__*/ I("$ZodObjectJIT", (e, t) => {
	jr.init(e, t);
	let n = e._zod.parse, r = ae(() => kr(t)), i = R.memoizer, a = (t) => {
		let n = r.value, a = n.symbolKeys, o = new An(["payload", "ctx"], {
			shape: t,
			inst: e,
			memo: i,
			syms: a
		}), s = (e) => `shape[${e}]._zod.run({ value: input[${e}], issues: [] }, ctx)`, c = (e, t) => `
          let ${e}_ab = false;
          for (let i = 0; i < ${e}.issues.length; i++) {
            const iss = ${e}.issues[i];
            iss.path = iss.path ? [${t}, ...iss.path] : [${t}];
            payload.issues.push(iss);
            if (iss.continue !== true) ${e}_ab = true;
          }
          if (${e}_ab && ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }`;
		o.write("const input = payload.value;");
		let l = Object.create(null), u = 0;
		for (let e of n.allKeys) l[e] = `key_${u++}`;
		o.write(i ? "const newResult = memo.alloc(inst, payload, {}, ctx);" : "const newResult = {};");
		for (let e of n.allKeys) {
			if (e === "__proto__") continue;
			let n = l[e], r = typeof e == "symbol" ? `syms[${a.indexOf(e)}]` : pe(e), i = `${r} in input`, u = t[e], d = u?._zod?.optin, f = d !== void 0, p = u?._zod?.optout === "optional";
			if (o.write(`const ${n} = ${s(r)};`), f && p) {
				let e = d === "optional" ? `${n}_present` : `${n}.value !== undefined || ${n}_present`;
				o.write(`
        const ${n}_present = ${i};
        if (!${n}.issues.length || ${n}_present) {
          if (${n}.issues.length) {${c(n, r)}
          }

          if (${e}) {
            newResult[${r}] = ${n}.value;
          }
        }

      `);
			} else f ? (o.write(`
        if (${n}.issues.length) {${c(n, r)}
        }
      `), d === "defaulted" ? o.write(`newResult[${r}] = ${n}.value;`) : o.write(`
        if (${n}.value !== undefined || ${i}) {
          newResult[${r}] = ${n}.value;
        }
      `)) : o.write(`
        const ${n}_present = ${i};
        if (${n}.issues.length) {${c(n, r)}
        }
        if (!${n}_present && !${n}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${r}]
          });
          if (ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }
        }

        if (${n}_present) {
          newResult[${r}] = ${n}.value;
        }

      `);
		}
		return o.write("payload.value = newResult;"), o.write("return payload;"), o.compile();
	}, o, s = ge, c = !R.jitless, l = c && _e.value, u = t.catchall, d;
	e._zod.parse = (i, f) => {
		d ??= r.value;
		let p = i.value;
		return s(p) ? c && l && f?.async === !1 && f.jitless !== !0 ? (o ||= a(t.shape), i = o(i, f), u ? Ar([], p, i, f, d, e, f?.abortEarly === !0) : i) : n(i, f) : (i.issues.push({
			expected: "object",
			code: "invalid_type",
			input: p,
			inst: e
		}), i);
	};
});
function Nr(e, t, n, r) {
	for (let n of e) if (n.issues.length === 0) return t.value = n.value, t;
	let i = e.filter((e) => !j(e));
	return i.length === 1 ? (t.value = i[0].value, i[0]) : (t.issues.push({
		code: "invalid_union",
		input: t.value,
		inst: n,
		errors: e.map((e) => e.issues.map((e) => M(e, r, z())))
	}), t);
}
var Pr = /*@__PURE__*/ I("$ZodUnion", (e, t) => {
	V.init(e, t), F(e, "optin", (e) => e.def.options.some((e) => e._zod.optin === "defaulted") ? "defaulted" : e.def.options.some((e) => e._zod.optin !== void 0) ? "optional" : void 0), F(e, "optout", (e) => e.def.options.some((e) => e._zod.optout === "optional") ? "optional" : void 0), F(e, "values", (e) => {
		if (e.def.options.every((e) => e._zod.values)) return new Set(e.def.options.flatMap((e) => Array.from(e._zod.values)));
	}), F(e, "pattern", (e) => {
		if (e.def.options.every((e) => e._zod.pattern)) {
			let t = e.def.options.map((e) => e._zod.pattern);
			return RegExp(`^(${t.map((e) => se(e.source)).join("|")})$`);
		}
	});
	let n = t.options.length === 1 ? t.options[0]._zod.run : null;
	e._zod.parse = (r, i) => {
		if (n) return n(r, i);
		let a = !1, o = [];
		for (let e of t.options) {
			let t = e._zod.run({
				value: r.value,
				issues: []
			}, i);
			if (t instanceof Promise) o.push(t), a = !0;
			else {
				if (t.issues.length === 0) return t;
				o.push(t);
			}
		}
		return a ? Promise.all(o).then((t) => Nr(t, r, e, i)) : Nr(o, r, e, i);
	};
}), Fr = /*@__PURE__*/ I("$ZodIntersection", (e, t) => {
	V.init(e, t), e._zod.parse = (e, n) => {
		let r = e.value, i = t.left._zod.run({
			value: r,
			issues: []
		}, n), a = t.right._zod.run({
			value: r,
			issues: []
		}, n);
		return i instanceof Promise || a instanceof Promise ? Promise.all([i, a]).then(([t, n]) => Lr(e, t, n)) : Lr(e, i, a);
	};
});
function Ir(e, t) {
	if (e === t || e instanceof Date && t instanceof Date && +e == +t) return {
		valid: !0,
		data: e
	};
	if (O(e) && O(t)) {
		let n = Object.keys(t), r = Object.keys(e).filter((e) => n.indexOf(e) !== -1), i = {
			...e,
			...t
		};
		Object.prototype.hasOwnProperty.call(i, "__proto__") && delete i.__proto__;
		for (let n of r) {
			if (n === "__proto__") continue;
			let r = Ir(e[n], t[n]);
			if (!r.valid) return {
				valid: !1,
				mergeErrorPath: [n, ...r.mergeErrorPath]
			};
			i[n] = r.data;
		}
		return {
			valid: !0,
			data: i
		};
	}
	if (Array.isArray(e) && Array.isArray(t)) {
		if (e.length !== t.length) return {
			valid: !1,
			mergeErrorPath: []
		};
		let n = [];
		for (let r = 0; r < e.length; r++) {
			let i = e[r], a = t[r], o = Ir(i, a);
			if (!o.valid) return {
				valid: !1,
				mergeErrorPath: [r, ...o.mergeErrorPath]
			};
			n.push(o.data);
		}
		return {
			valid: !0,
			data: n
		};
	}
	return {
		valid: !1,
		mergeErrorPath: []
	};
}
function Lr(e, t, n) {
	let r = /* @__PURE__ */ new Map(), i, a = /* @__PURE__ */ new Map(), o = (e, t) => {
		let n;
		if (e.code === "unrecognized_keys" && !e.path?.length) i ??= e, n = e.keys;
		else if (e.code === "invalid_key" && e.origin === "record" && e.path?.length === 1) {
			let t = String(e.path[0]);
			a.has(t) || a.set(t, e), n = [t];
		} else return !1;
		for (let e of n) r.has(e) || r.set(e, {}), r.get(e)[t] = !0;
		return !0;
	};
	for (let n of t.issues) o(n, "l") || e.issues.push(n);
	for (let t of n.issues) o(t, "r") || e.issues.push(t);
	let s = [...r].filter(([, e]) => e.l && e.r).map(([e]) => e);
	if (s.length) {
		let t = i ? s.filter((e) => i.keys.includes(e)) : [];
		t.length && e.issues.push({
			...i,
			keys: t
		});
		for (let n of s) !t.includes(n) && a.has(n) && e.issues.push(a.get(n));
	}
	let c = Ir(t.value, n.value);
	if (!c.valid) {
		if (j(e)) return e;
		throw Error(`Unmergable intersection. Error path: ${JSON.stringify(c.mergeErrorPath)}`);
	}
	return e.value = c.data, e;
}
var Rr = /*@__PURE__*/ I("$ZodRecord", (e, t) => {
	V.init(e, t);
	let n = R.memoizer;
	n?.attach(e), e._zod.parse = (r, i) => {
		let a = r.value;
		if (!O(a)) return r.issues.push({
			expected: "record",
			code: "invalid_type",
			input: a,
			inst: e
		}), r;
		let o = [], s = t.keyType._zod.values;
		if (s && !t.partial) {
			r.value = n ? n.alloc(e, r, {}, i) : {};
			let c = /* @__PURE__ */ new Set();
			for (let n of s) if (typeof n == "string" || typeof n == "number" || typeof n == "symbol") {
				if (c.add(typeof n == "number" ? n.toString() : n), n === "__proto__") continue;
				let s = t.keyType._zod.run({
					value: n,
					issues: []
				}, i);
				if (s instanceof Promise) throw Error("Async schemas not supported in object keys currently");
				if (s.issues.length) {
					r.issues.push({
						code: "invalid_key",
						origin: "record",
						issues: s.issues.map((e) => M(e, i, z())),
						input: n,
						path: [n],
						inst: e
					});
					continue;
				}
				let l = s.value;
				if (l === "__proto__") continue;
				let u = t.valueType._zod.run({
					value: a[n],
					issues: []
				}, i);
				u instanceof Promise ? o.push(u.then((e) => {
					e.issues.length && r.issues.push(...Fe(n, e.issues)), r.value[l] = e.value;
				})) : (u.issues.length && r.issues.push(...Fe(n, u.issues)), r.value[l] = u.value);
			}
			let l;
			for (let e in a) if (!c.has(e)) {
				if (t.mode === "loose") {
					if (e === "__proto__") continue;
					r.value[e] = a[e];
				} else l ??= [], l.push(e);
			}
			l && l.length > 0 && r.issues.push({
				code: "unrecognized_keys",
				input: a,
				inst: e,
				keys: l,
				continue: !0
			});
		} else {
			r.value = n ? n.alloc(e, r, {}, i) : {};
			let c;
			for (let n of Reflect.ownKeys(a)) {
				if (n === "__proto__" || !Object.prototype.propertyIsEnumerable.call(a, n)) continue;
				let l = t.keyType._zod.run({
					value: n,
					issues: []
				}, i);
				if (l instanceof Promise) throw Error("Async schemas not supported in object keys currently");
				if (typeof n == "string" && ln.test(n) && l.issues.length) {
					let e = t.keyType._zod.run({
						value: Number(n),
						issues: []
					}, i);
					if (e instanceof Promise) throw Error("Async schemas not supported in object keys currently");
					e.issues.length === 0 && (l = e);
				}
				if (l.issues.length) {
					t.mode === "loose" ? r.value[n] = a[n] : s ? (c ??= [], c.push(n)) : r.issues.push({
						code: "invalid_key",
						origin: "record",
						issues: l.issues.map((e) => M(e, i, z())),
						input: n,
						path: [n],
						inst: e
					});
					continue;
				}
				let u = l.value;
				if (u === "__proto__") continue;
				let d = t.valueType._zod.run({
					value: a[n],
					issues: []
				}, i);
				d instanceof Promise ? o.push(d.then((e) => {
					e.issues.length && r.issues.push(...Fe(n, e.issues)), r.value[u] = e.value;
				})) : (d.issues.length && r.issues.push(...Fe(n, d.issues)), r.value[u] = d.value);
			}
			c && c.length > 0 && r.issues.push({
				code: "unrecognized_keys",
				input: a,
				inst: e,
				keys: c,
				continue: !0
			});
		}
		return o.length ? Promise.all(o).then(() => r) : r;
	};
}), zr = /*@__PURE__*/ I("$ZodEnum", (e, t) => {
	V.init(e, t);
	let n = ne(t.entries), r = new Set(n);
	e._zod.values = r, F(e, "pattern", (e) => {
		let t = ne(e.def.entries).filter((e) => ye.has(typeof e));
		return RegExp(t.length ? `^(${t.map((e) => be(e.toString())).join("|")})$` : "^[^\\s\\S]$");
	}), e._zod.parse = (t, i) => {
		let a = t.value;
		return r.has(a) || t.issues.push({
			code: "invalid_value",
			values: n,
			input: a,
			inst: e
		}), t;
	};
}), Br = /*@__PURE__*/ I("$ZodTransform", (e, t) => {
	V.init(e, t), e._zod.optin = "optional", R.memoizer?.guard(e), e._zod.parse = (n, r) => {
		if (r.direction === "backward") throw new rt(e.constructor.name);
		let i = t.transform(n.value, n);
		if (r.async) return (i instanceof Promise ? i : Promise.resolve(i)).then((e) => (n.value = e, n));
		if (i instanceof Promise) throw new L();
		return n.value = i, n;
	};
});
function Vr(e, t) {
	return e.value = t.issues.length ? void 0 : t.value, e;
}
var Hr = /*@__PURE__*/ I("$ZodOptional", (e, t) => {
	V.init(e, t), F(e, "optin", (e) => e.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional"), e._zod.optout = "optional", F(e, "values", (e) => {
		let t = e.def.innerType._zod.values;
		return t ? /* @__PURE__ */ new Set([...t, void 0]) : void 0;
	}), F(e, "pattern", (e) => {
		let t = e.def.innerType._zod.pattern;
		return t ? RegExp(`^(${se(t.source)})?$`) : void 0;
	}), e._zod.parse = (e, n) => {
		if (e.value === void 0) {
			if (t.innerType._zod.optin !== "defaulted") return e;
			let r = t.innerType._zod.run({
				value: e.value,
				issues: []
			}, n);
			return r instanceof Promise ? r.then((t) => Vr(e, t)) : Vr(e, r);
		}
		return t.innerType._zod.run(e, n);
	};
}), Ur = /*@__PURE__*/ I("$ZodExactOptional", (e, t) => {
	Hr.init(e, t), F(e, "values", (e) => e.def.innerType._zod.values), F(e, "pattern", (e) => e.def.innerType._zod.pattern), e._zod.parse = (e, n) => t.innerType._zod.run(e, n);
}), Wr = /*@__PURE__*/ I("$ZodNullable", (e, t) => {
	V.init(e, t), F(e, "optin", (e) => e.def.innerType._zod.optin), F(e, "optout", (e) => e.def.innerType._zod.optout), F(e, "pattern", (e) => {
		let t = e.def.innerType._zod.pattern;
		return t ? RegExp(`^(${se(t.source)}|null)$`) : void 0;
	}), F(e, "values", (e) => e.def.innerType._zod.values ? /* @__PURE__ */ new Set([...e.def.innerType._zod.values, null]) : void 0), e._zod.parse = (e, n) => e.value === null ? e : t.innerType._zod.run(e, n);
}), Gr = /*@__PURE__*/ I("$ZodDefault", (e, t) => {
	V.init(e, t), e._zod.optin = "defaulted", F(e, "values", (e) => e.def.innerType._zod.values), e._zod.parse = (e, n) => {
		if (n.direction === "backward") return t.innerType._zod.run(e, n);
		if (e.value === void 0) return e.value = t.defaultValue, e;
		let r = t.innerType._zod.run(e, n);
		return r instanceof Promise ? r.then((e) => Kr(e, t)) : Kr(r, t);
	};
});
function Kr(e, t) {
	return e.value === void 0 && (e.value = t.defaultValue), e;
}
var qr = /*@__PURE__*/ I("$ZodPrefault", (e, t) => {
	V.init(e, t), e._zod.optin = "defaulted", F(e, "values", (e) => e.def.innerType._zod.values), e._zod.parse = (e, n) => (n.direction === "backward" || e.value === void 0 && (e.value = t.defaultValue), t.innerType._zod.run(e, n));
}), Jr = /*@__PURE__*/ I("$ZodNonOptional", (e, t) => {
	V.init(e, t), F(e, "values", (e) => {
		let t = e.def.innerType._zod.values;
		return t ? new Set([...t].filter((e) => e !== void 0)) : void 0;
	}), e._zod.parse = (n, r) => {
		let i = t.innerType._zod.run(n, r);
		return i instanceof Promise ? i.then((t) => Yr(t, e)) : Yr(i, e);
	};
});
function Yr(e, t) {
	return !e.issues.length && e.value === void 0 && e.issues.push({
		code: "invalid_type",
		expected: "nonoptional",
		input: e.value,
		inst: t
	}), e;
}
function Xr(e, t, n, r) {
	return t.issues.length ? (e.value = n.catchValue({
		...t,
		value: e.value,
		error: { issues: t.issues.map((e) => M(e, r, z())) },
		input: e.value
	}), e) : (e.value = t.value, t.memo && (e.memo = !0), e);
}
var Zr = /*@__PURE__*/ I("$ZodCatch", (e, t) => {
	V.init(e, t), F(e, "optin", (e) => e.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional"), F(e, "optout", (e) => e.def.innerType._zod.optout), F(e, "values", (e) => e.def.innerType._zod.values), e._zod.parse = (e, n) => {
		if (n.direction === "backward") return t.innerType._zod.run(e, n);
		let r = t.innerType._zod.run({
			value: e.value,
			issues: []
		}, n);
		return r instanceof Promise ? r.then((r) => Xr(e, r, t, n)) : Xr(e, r, t, n);
	};
}), Qr = /*@__PURE__*/ I("$ZodPipe", (e, t) => {
	V.init(e, t), F(e, "values", (e) => e.def.in._zod.values), F(e, "optin", (e) => e.def.in._zod.optin), F(e, "optout", (e) => e.def.out._zod.optout), F(e, "propValues", (e) => e.def.in._zod.propValues), e._zod.parse = (e, n) => {
		if (n.direction === "backward") {
			let r = t.out._zod.run(e, n);
			return r instanceof Promise ? r.then((e) => $r(e, t.in, n)) : $r(r, t.in, n);
		}
		let r = t.in._zod.run(e, n);
		return r instanceof Promise ? r.then((e) => $r(e, t.out, n)) : $r(r, t.out, n);
	};
});
function $r(e, t, n) {
	return e.issues.some((e) => e.code !== "unrecognized_keys") ? (e.aborted = !0, e) : t._zod.run({
		value: e.value,
		issues: e.issues
	}, n);
}
var ei = /*@__PURE__*/ I("$ZodReadonly", (e, t) => {
	V.init(e, t), F(e, "propValues", (e) => e.def.innerType._zod.propValues), F(e, "values", (e) => e.def.innerType._zod.values), F(e, "optin", (e) => e.def.innerType?._zod?.optin), F(e, "optout", (e) => e.def.innerType?._zod?.optout), e._zod.parse = (e, n) => {
		if (n.direction === "backward") return t.innerType._zod.run(e, n);
		let r = t.innerType._zod.run(e, n);
		return r instanceof Promise ? r.then(ti) : ti(r);
	};
});
function ti(e) {
	return e.memo || (e.value = Object.freeze(e.value)), e;
}
var ni = /*@__PURE__*/ I("$ZodCustom", (e, t) => {
	B.init(e, t), V.init(e, t), e._zod.parse = (e, t) => e, e._zod.check = (n) => {
		let r = n.value, i = t.fn(r);
		if (i instanceof Promise) return i.then((t) => ri(t, n, r, e));
		ri(i, n, r, e);
	};
});
function ri(e, t, n, r) {
	if (!e) {
		let e = {
			code: "custom",
			input: n,
			inst: r,
			path: [...r._zod.def.path ?? []],
			continue: !r._zod.def.abort
		};
		r._zod.def.params && (e.params = r._zod.def.params), t.issues.push(He(e));
	}
}
//#endregion
//#region node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/memoizer.js
var ii = class extends Error {
	constructor() {
		super("Cannot parse a reference cycle that closes through a transform"), this.name = "ZodCyclicError";
	}
}, ai = "~memo", oi = [];
function si(e) {
	return typeof e == "object" && !!e;
}
function ci(e) {
	return e.map((e) => e.path ? {
		...e,
		path: e.path.slice()
	} : { ...e });
}
var li = /*@__PURE__*/ new WeakMap(), ui = 0, di = 1, fi = 2;
function pi(e, t, n) {
	let r = li.get(e);
	if (r !== void 0) return r ? fi : ui;
	if (t.has(e)) return fi;
	t.add(e);
	let i = ui, a = (e) => {
		if (i !== fi && e?._zod) {
			let r = pi(e, t, n);
			r > i && (i = r);
		}
	}, o = (e, r) => {
		let i = ui;
		for (let a of Reflect.ownKeys(e)) {
			let o = Object.getOwnPropertyDescriptor(e, a);
			if (r && !o.enumerable) continue;
			let s = o.get ? di : o.value?._zod ? pi(o.value, t, n) : ui;
			s > i && (i = s);
		}
		return i;
	}, s = (e) => {
		e > i && (i = e);
	}, c = e._zod.def;
	switch (c.type) {
		case "object": {
			let e = le(c);
			s(e ? o(e, !0) : di), a(c.catchall);
			break;
		}
		case "array":
			a(c.element);
			break;
		case "tuple":
			for (let e of c.items) a(e);
			a(c.rest);
			break;
		case "record":
		case "map":
			a(c.keyType), a(c.valueType);
			break;
		case "set":
			a(c.valueType);
			break;
		case "union":
			for (let e of c.options) a(e);
			break;
		case "intersection":
			a(c.left), a(c.right);
			break;
		case "optional":
		case "nullable":
		case "default":
		case "prefault":
		case "catch":
		case "readonly":
		case "nonoptional":
		case "promise":
		case "success":
			a(c.innerType);
			break;
		case "pipe":
			a(c.in), a(c.out);
			break;
		case "function":
			a(c.input), a(c.output);
			break;
		case "lazy": {
			let r = c._cachedInner ?? (n ? e._zod.innerType : void 0);
			s(r ? pi(r, t, !1) : di);
			break;
		}
		case "template_literal":
		case "string":
		case "number":
		case "int":
		case "boolean":
		case "bigint":
		case "symbol":
		case "undefined":
		case "null":
		case "void":
		case "never":
		case "any":
		case "unknown":
		case "date":
		case "nan":
		case "enum":
		case "literal":
		case "file":
		case "transform":
		case "custom": break;
		default: for (let e in c) {
			let t = Object.getOwnPropertyDescriptor(c, e);
			if (!t || t.get) continue;
			let n = t.value;
			if (n && typeof n == "object") {
				if (n._zod) a(n);
				else if (Array.isArray(n)) for (let e of n) a(e);
			}
		}
	}
	return t.delete(e), mi(e, i);
}
function mi(e, t) {
	return t !== di && li.set(e, t === fi), t;
}
function hi(e, t) {
	let n = e.buckets.get(t);
	return n || (n = /* @__PURE__ */ new WeakMap(), e.buckets.set(t, n)), n;
}
var gi, _i = [], vi = {
	alloc(e, t, n) {
		let r = gi;
		if (!r) return n;
		gi = void 0;
		let i = {
			value: n,
			issues: null
		};
		return r.set(t.value, i), _i.push(i), n;
	},
	guard(e) {
		var t;
		(t = e._zod).deferred ?? (t.deferred = []), e._zod.deferred.push(() => {
			let t = e._zod.parse, n = (e, n) => {
				if (n.direction !== "backward" && bi(n, e.value)) throw new ii();
				return t(e, n);
			};
			e._zod.parse = n, e._zod.run === t && (e._zod.run = n);
		});
	},
	attach(e) {
		var t;
		let n, r = !1, i, a;
		(t = e._zod).deferred ?? (t.deferred = []), e._zod.deferred.push(() => {
			let t = e._zod.parse, o = (s, c) => {
				if (n === void 0) {
					let i = pi(e, /* @__PURE__ */ new Set(), !1);
					if (i === ui) return e._zod.parse = t, e._zod.run === o && (e._zod.run = t), t(s, c);
					i === fi || r ? n = !0 : r = !0;
				}
				let l = s.value;
				if (!si(l)) return t(s, c);
				let u = c[ai];
				u || (u = {
					buckets: /* @__PURE__ */ new WeakMap(),
					backEdges: void 0
				}, c[ai] = u);
				let d;
				i === c ? d = a : (d = hi(u, e), i = c, a = d);
				let f = d.get(l);
				if (f) return s.value = f.value, f.issues ? f.issues.length && s.issues.push(...ci(f.issues)) : (s.memo = !0, u.backEdges ?? (u.backEdges = /* @__PURE__ */ new WeakSet()), u.backEdges.add(f.value)), s;
				gi = d;
				let p = _i.length, m = t(s, c);
				gi = void 0;
				let h = _i.length > p ? _i.pop() : void 0;
				return m instanceof Promise ? m.then((e) => (h && (h.issues = e.issues.length ? ci(e.issues) : oi), e)) : (h && (h.issues = m.issues.length ? ci(m.issues) : oi), m);
			};
			e._zod.parse = o, e._zod.run === t && (e._zod.run = o);
		});
	}
};
function yi() {
	return vi;
}
function bi(e, t) {
	let n = e[ai]?.backEdges;
	return n !== void 0 && si(t) && n.has(t);
}
//#endregion
//#region node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/locales/en.js
var xi = () => {
	let e = {
		string: {
			unit: "characters",
			verb: "to have"
		},
		file: {
			unit: "bytes",
			verb: "to have"
		},
		array: {
			unit: "items",
			verb: "to have"
		},
		set: {
			unit: "items",
			verb: "to have"
		},
		map: {
			unit: "entries",
			verb: "to have"
		}
	};
	function t(t) {
		return e[t] ?? null;
	}
	let n = {
		regex: "input",
		email: "email address",
		url: "URL",
		emoji: "emoji",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "ISO datetime",
		date: "ISO date",
		time: "ISO time",
		duration: "ISO duration",
		ipv4: "IPv4 address",
		ipv6: "IPv6 address",
		mac: "MAC address",
		cidrv4: "IPv4 range",
		cidrv6: "IPv6 range",
		base64: "base64-encoded string",
		base64url: "base64url-encoded string",
		json_string: "JSON string",
		e164: "E.164 number",
		currency_code: "currency code",
		credit_card: "credit card number",
		iban: "IBAN",
		jwt: "JWT",
		template_literal: "input"
	}, r = { nan: "NaN" };
	function i(e, t) {
		return e === "number" && typeof t == "number" && !Number.isFinite(t) ? String(t) : r[e] ?? e;
	}
	return (e) => {
		switch (e.code) {
			case "invalid_type": return `Invalid input: expected ${i(e.expected)}, received ${i(Ve(e.input), e.input)}`;
			case "invalid_value": return e.values.length === 1 ? `Invalid input: expected ${xe(e.values[0])}` : `Invalid option: expected one of ${re(e.values, "|")}`;
			case "too_big": {
				let n = e.exact ? "exactly " : e.inclusive ? "<=" : "<", r = t(e.origin);
				return r ? `Too big: expected ${e.origin ?? "value"} to have ${n}${e.maximum.toString()} ${r.unit ?? "elements"}` : `Too big: expected ${e.origin ?? "value"} to be ${n}${e.maximum.toString()}`;
			}
			case "too_small": {
				let n = e.exact ? "exactly " : e.inclusive ? ">=" : ">", r = t(e.origin);
				return r ? `Too small: expected ${e.origin} to have ${n}${e.minimum.toString()} ${r.unit}` : `Too small: expected ${e.origin} to be ${n}${e.minimum.toString()}`;
			}
			case "invalid_format": {
				let t = e;
				return t.format === "starts_with" ? `Invalid string: must start with "${t.prefix}"` : t.format === "ends_with" ? `Invalid string: must end with "${t.suffix}"` : t.format === "includes" ? `Invalid string: must include "${t.includes}"` : t.format === "regex" ? `Invalid string: must match pattern ${t.pattern}` : `Invalid ${n[t.format] ?? e.format}`;
			}
			case "not_multiple_of": return `Invalid number: must be a multiple of ${e.divisor}`;
			case "unrecognized_keys": return `Unrecognized key${e.keys.length > 1 ? "s" : ""}: ${re(e.keys, ", ")}`;
			case "invalid_key": return `Invalid key in ${e.origin}`;
			case "invalid_union": return e.options && Array.isArray(e.options) && e.options.length > 0 ? `Invalid discriminator value. Expected ${e.options.map((e) => `'${e}'`).join(" | ")}` : e.inclusive === !1 ? "Invalid input: more than one option matched" : "Invalid input";
			case "invalid_element": return `Invalid value in ${e.origin}`;
			default: return "Invalid input";
		}
	};
};
function Si() {
	return { localeError: xi() };
}
//#endregion
//#region node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/registries.js
var Ci, wi = class {
	constructor() {
		this._map = /* @__PURE__ */ new WeakMap(), this._idmap = /* @__PURE__ */ new Map();
	}
	add(e, ...t) {
		let n = t[0];
		return this._map.set(e, n), n && typeof n == "object" && "id" in n && this._idmap.set(n.id, e), this;
	}
	clear() {
		return this._map = /* @__PURE__ */ new WeakMap(), this._idmap = /* @__PURE__ */ new Map(), this;
	}
	remove(e) {
		let t = this._map.get(e);
		return t && typeof t == "object" && "id" in t && this._idmap.delete(t.id), this._map.delete(e), this;
	}
	get(e) {
		let t = e._zod.parent;
		if (t) {
			let n = { ...this.get(t) ?? {} };
			delete n.id;
			let r = {
				...n,
				...this._map.get(e)
			};
			return Object.keys(r).length ? r : void 0;
		}
		return this._map.get(e);
	}
	has(e) {
		return this._map.has(e);
	}
};
function Ti() {
	return new wi();
}
(Ci = globalThis).__zod_globalRegistry ?? (Ci.__zod_globalRegistry = Ti());
var Ei = globalThis.__zod_globalRegistry;
//#endregion
//#region node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/api.js
function Di(e) {
	return e.checks &&= [...e.checks], e;
}
// @__NO_SIDE_EFFECTS__
function Oi(e, t) {
	return new e(Di({
		type: "string",
		...A(t)
	}));
}
// @__NO_SIDE_EFFECTS__
function ki(e, t) {
	return new e({
		type: "string",
		format: "email",
		check: "string_format",
		abort: !1,
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Ai(e, t) {
	return new e({
		type: "string",
		format: "guid",
		check: "string_format",
		abort: !1,
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function ji(e, t) {
	return new e({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: !1,
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Mi(e, t) {
	return new e({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: !1,
		version: "v4",
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Ni(e, t) {
	return new e({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: !1,
		version: "v6",
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Pi(e, t) {
	return new e({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: !1,
		version: "v7",
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Fi(e, t) {
	return new e({
		type: "string",
		format: "url",
		check: "string_format",
		abort: !1,
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Ii(e, t) {
	return new e({
		type: "string",
		format: "emoji",
		check: "string_format",
		abort: !1,
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Li(e, t) {
	return new e({
		type: "string",
		format: "nanoid",
		check: "string_format",
		abort: !1,
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Ri(e, t) {
	return new e({
		type: "string",
		format: "cuid",
		check: "string_format",
		abort: !1,
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function zi(e, t) {
	return new e({
		type: "string",
		format: "cuid2",
		check: "string_format",
		abort: !1,
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Bi(e, t) {
	return new e({
		type: "string",
		format: "ulid",
		check: "string_format",
		abort: !1,
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Vi(e, t) {
	return new e({
		type: "string",
		format: "xid",
		check: "string_format",
		abort: !1,
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Hi(e, t) {
	return new e({
		type: "string",
		format: "ksuid",
		check: "string_format",
		abort: !1,
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Ui(e, t) {
	return new e({
		type: "string",
		format: "ipv4",
		check: "string_format",
		abort: !1,
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Wi(e, t) {
	return new e({
		type: "string",
		format: "ipv6",
		check: "string_format",
		abort: !1,
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Gi(e, t) {
	return new e({
		type: "string",
		format: "cidrv4",
		check: "string_format",
		abort: !1,
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Ki(e, t) {
	return new e({
		type: "string",
		format: "cidrv6",
		check: "string_format",
		abort: !1,
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function qi(e, t) {
	return new e({
		type: "string",
		format: "base64",
		check: "string_format",
		abort: !1,
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Ji(e, t) {
	return new e({
		type: "string",
		format: "base64url",
		check: "string_format",
		abort: !1,
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Yi(e, t) {
	return new e({
		type: "string",
		format: "e164",
		check: "string_format",
		abort: !1,
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Xi(e, t) {
	return new e({
		type: "string",
		format: "jwt",
		check: "string_format",
		abort: !1,
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Zi(e, t) {
	return new e({
		type: "string",
		format: "datetime",
		check: "string_format",
		offset: !1,
		local: !1,
		precision: null,
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Qi(e, t) {
	return new e({
		type: "string",
		format: "date",
		check: "string_format",
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function $i(e, t) {
	return new e({
		type: "string",
		format: "time",
		check: "string_format",
		precision: null,
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function ea(e, t) {
	return new e({
		type: "string",
		format: "duration",
		check: "string_format",
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function ta(e, t) {
	return new e(Di({
		type: "number",
		checks: [],
		...A(t)
	}));
}
// @__NO_SIDE_EFFECTS__
function na(e, t) {
	return new e({
		type: "number",
		check: "number_format",
		abort: !1,
		format: "safeint",
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function ra(e, t) {
	return new e({
		type: "boolean",
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function ia(e) {
	return new e({ type: "unknown" });
}
// @__NO_SIDE_EFFECTS__
function aa(e, t) {
	return new e({
		type: "never",
		...A(t)
	});
}
// @__NO_SIDE_EFFECTS__
function oa(e, t) {
	return new hn({
		check: "less_than",
		...A(t),
		value: e,
		inclusive: !1
	});
}
// @__NO_SIDE_EFFECTS__
function sa(e, t) {
	return new hn({
		check: "less_than",
		...A(t),
		value: e,
		inclusive: !0
	});
}
// @__NO_SIDE_EFFECTS__
function ca(e, t) {
	return new gn({
		check: "greater_than",
		...A(t),
		value: e,
		inclusive: !1
	});
}
// @__NO_SIDE_EFFECTS__
function la(e, t) {
	return new gn({
		check: "greater_than",
		...A(t),
		value: e,
		inclusive: !0
	});
}
// @__NO_SIDE_EFFECTS__
function ua(e, t) {
	return new _n({
		check: "multiple_of",
		...A(t),
		value: e
	});
}
// @__NO_SIDE_EFFECTS__
function da(e, t) {
	return new yn({
		check: "max_length",
		...A(t),
		maximum: e
	});
}
// @__NO_SIDE_EFFECTS__
function fa(e, t) {
	return new bn({
		check: "min_length",
		...A(t),
		minimum: e
	});
}
// @__NO_SIDE_EFFECTS__
function pa(e, t) {
	return new xn({
		check: "length_equals",
		...A(t),
		length: e
	});
}
// @__NO_SIDE_EFFECTS__
function ma(e, t) {
	return new Cn({
		check: "string_format",
		format: "regex",
		...A(t),
		pattern: e
	});
}
// @__NO_SIDE_EFFECTS__
function ha(e) {
	return new wn({
		check: "string_format",
		format: "lowercase",
		...A(e)
	});
}
// @__NO_SIDE_EFFECTS__
function ga(e) {
	return new Tn({
		check: "string_format",
		format: "uppercase",
		...A(e)
	});
}
// @__NO_SIDE_EFFECTS__
function _a(e, t) {
	return new En({
		check: "string_format",
		format: "includes",
		...A(t),
		includes: e
	});
}
// @__NO_SIDE_EFFECTS__
function va(e, t) {
	return new Dn({
		check: "string_format",
		format: "starts_with",
		...A(t),
		prefix: e
	});
}
// @__NO_SIDE_EFFECTS__
function ya(e, t) {
	return new On({
		check: "string_format",
		format: "ends_with",
		...A(t),
		suffix: e
	});
}
// @__NO_SIDE_EFFECTS__
function U(e) {
	return new kn({
		check: "overwrite",
		tx: e
	});
}
// @__NO_SIDE_EFFECTS__
function ba(e) {
	return /* @__PURE__ */ U((t) => t.normalize(e));
}
// @__NO_SIDE_EFFECTS__
function xa() {
	return /* @__PURE__ */ U((e) => e.trim());
}
// @__NO_SIDE_EFFECTS__
function Sa() {
	return /* @__PURE__ */ U((e) => e.toLowerCase());
}
// @__NO_SIDE_EFFECTS__
function Ca() {
	return /* @__PURE__ */ U((e) => e.toUpperCase());
}
// @__NO_SIDE_EFFECTS__
function wa() {
	return /* @__PURE__ */ U((e) => me(e));
}
// @__NO_SIDE_EFFECTS__
function Ta(e, t, n) {
	return new e({
		type: "array",
		element: t,
		...A(n)
	});
}
// @__NO_SIDE_EFFECTS__
function Ea(e, t, n) {
	return new e({
		type: "custom",
		check: "custom",
		fn: t,
		...A(n)
	});
}
// @__NO_SIDE_EFFECTS__
function Da(e, t) {
	let n = /* @__PURE__ */ Oa((t) => (t.addIssue = (e) => {
		if (typeof e == "string") t.issues.push(He(e, t.value, n._zod.def));
		else {
			let r = e;
			r.fatal && (r.continue = !1), r.code ??= "custom", "input" in r || (r.input = t.value), r.inst ??= n, r.continue ??= !n._zod.def.abort, t.issues.push(He(r));
		}
	}, e(t.value, t)), t);
	return n;
}
// @__NO_SIDE_EFFECTS__
function Oa(e, t) {
	let n = new B({
		check: "custom",
		...A(t)
	});
	return n._zod.check = e, n;
}
//#endregion
//#region node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/to-json-schema.js
function ka(e, ...t) {
	for (let n of t) for (let t of Reflect.ownKeys(n)) Object.prototype.propertyIsEnumerable.call(n, t) && w(e, t, n[t]);
	return e;
}
function Aa(e) {
	let t = e?.target ?? "draft-2020-12";
	return t === "draft-4" && (t = "draft-04"), t === "draft-7" && (t = "draft-07"), {
		processors: e.processors ?? {},
		metadataRegistry: e?.metadata ?? Ei,
		target: t,
		unrepresentable: e?.unrepresentable ?? "throw",
		override: e?.override ?? (() => {}),
		io: e?.io ?? "output",
		counter: 0,
		seen: /* @__PURE__ */ new Map(),
		sharedDefsExtractedFor: void 0,
		sharedEmitDoneFor: void 0,
		cycles: e?.cycles ?? "ref",
		reused: e?.reused ?? "inline",
		intersections: [],
		deferred: [],
		external: e?.external ?? void 0
	};
}
function W(e, t, n, r, i) {
	let a = typeof t.unrepresentable == "function" ? t.unrepresentable({
		zodSchema: e,
		path: r.path,
		message: i
	}) : t.unrepresentable;
	if (a === "any") return !1;
	if (a === void 0 || a === "throw") throw Error(i);
	return Object.assign(n, a), !0;
}
function G(e, t, n = {
	path: [],
	schemaPath: []
}) {
	var r;
	let i = e._zod.def, a = t.seen.get(e);
	if (a) return a.count++, n.schemaPath.includes(e) && (a.cycle = n.path), a.schema;
	let o = {
		schema: {},
		count: 1,
		cycle: void 0,
		path: n.path
	};
	t.seen.set(e, o), t.sharedDefsExtractedFor = void 0, t.sharedEmitDoneFor = void 0;
	let s = e._zod.toJSONSchema?.();
	if (s) o.schema = s;
	else {
		let r = {
			...n,
			schemaPath: [...n.schemaPath, e],
			path: n.path
		};
		if (e._zod.processJSONSchema) e._zod.processJSONSchema(t, o.schema, r);
		else {
			let n = o.schema, a = t.processors[i.type];
			if (!a) throw Error(`[toJSONSchema]: Non-representable type encountered: ${i.type}`);
			a(e, t, n, r);
		}
		let a = e._zod.parent;
		a && (o.ref ||= a, G(a, t, r), t.seen.get(a).isParent = !0);
	}
	let c = t.metadataRegistry.get(e);
	return c && ka(o.schema, c), t.io === "input" && K(e) && (delete o.schema.examples, delete o.schema.default), t.io === "input" && "_prefault" in o.schema && ((r = o.schema).default ?? (r.default = o.schema._prefault)), delete o.schema._prefault, t.seen.get(e).schema;
}
function ja(e) {
	return e.replace(/~/g, "~0").replace(/\//g, "~1");
}
function Ma(e, t) {
	let n = e.seen.get(t);
	if (!n) throw Error("Unprocessed schema. This is a bug in Zod.");
	if (e.external && e.sharedDefsExtractedFor === e.external) return;
	let r = /* @__PURE__ */ new Map();
	for (let t of e.seen.entries()) {
		let n = e.metadataRegistry.get(t[0])?.id;
		if (n) {
			let e = r.get(n);
			if (e && e !== t[0]) throw Error(`Duplicate schema id "${n}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);
			r.set(n, t[0]);
		}
	}
	let i = (t) => {
		let r = e.target === "draft-2020-12" ? "$defs" : "definitions";
		if (e.external) {
			let n = e.external.registry.get(t[0])?.id, i = e.external.uri ?? ((e) => e);
			if (n) return { ref: i(n) };
			let a = t[1].defId ?? t[1].schema.id ?? `schema${e.counter++}`;
			return t[1].defId = a, {
				defId: a,
				ref: `${i("__shared")}#/${r}/${ja(a)}`
			};
		}
		let i = `#/${r}/`;
		if (t[1] === n && !t[1].schema.id) return { ref: "#" };
		let a = t[1].schema.id ?? `__schema${e.counter++}`;
		return {
			defId: a,
			ref: i + ja(a)
		};
	}, a = (e) => {
		if (e[1].schema.$ref) return;
		let t = e[1], { ref: n, defId: r } = i(e);
		t.def = { ...t.schema }, r && (t.defId = r);
		let a = t.schema;
		for (let e in a) delete a[e];
		a.$ref = n;
	};
	if (e.cycles === "throw") for (let t of e.seen.entries()) {
		let e = t[1];
		if (e.cycle) throw Error(`Cycle detected: #/${e.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`);
	}
	for (let n of e.seen.entries()) {
		let r = n[1];
		if (t === n[0]) {
			a(n);
			continue;
		}
		if (e.external) {
			let r = e.external.registry.get(n[0])?.id;
			if (t !== n[0] && r) {
				a(n);
				continue;
			}
		}
		if (e.metadataRegistry.get(n[0])?.id) {
			a(n);
			continue;
		}
		if (r.cycle) {
			a(n);
			continue;
		}
		r.count > 1 && e.reused === "ref" && a(n);
	}
	e.external && (e.sharedDefsExtractedFor = e.external);
}
function Na(e) {
	let t = e.anyOf;
	if (!Array.isArray(t) || t.length === 0 || e.type !== void 0) return;
	let n = [];
	for (let e of t) {
		if (!e || typeof e != "object") return;
		Na(e);
		let t = Object.keys(e);
		if (t.length !== 1 || t[0] !== "type") return;
		let r = e.type;
		for (let e of Array.isArray(r) ? r : [r]) {
			if (typeof e != "string") return;
			n.includes(e) || n.push(e);
		}
	}
	delete e.anyOf, e.type = n.length === 1 ? n[0] : n;
}
var Pa = /* @__PURE__ */ new Set([
	"type",
	"properties",
	"required",
	"additionalProperties"
]), Fa = ["oneOf", "anyOf"];
function Ia(e) {
	let t = e.additionalProperties;
	return t === void 0 || t === !1 || typeof t != "object" || !t ? null : Object.keys(t).length ? t : null;
}
function La(e) {
	let t = [];
	for (let n of e) {
		if (typeof n != "object" || n.type !== "object") return null;
		for (let e in n) if (!Pa.has(e)) return null;
		t.push(n);
	}
	let n = {}, r = /* @__PURE__ */ new Set();
	for (let e of t) {
		for (let r in e.properties) {
			if (Object.prototype.hasOwnProperty.call(n, r)) continue;
			let e = [];
			for (let n of t) {
				let t = n.properties?.[r] ?? Ia(n);
				t != null && (e.some((e) => JSON.stringify(e) === JSON.stringify(t)) || e.push(t));
			}
			w(n, r, e.length === 1 ? e[0] : La(e) ?? { allOf: e });
		}
		for (let t of e.required ?? []) r.add(t);
	}
	let i = {
		type: "object",
		properties: n
	};
	if (r.size && (i.required = [...r]), t.every((e) => e.additionalProperties === !1)) i.additionalProperties = !1;
	else {
		let e = [];
		for (let n of t) {
			let t = Ia(n);
			t && !e.some((e) => JSON.stringify(e) === JSON.stringify(t)) && e.push(t);
		}
		e.length === 1 ? i.additionalProperties = e[0] : e.length > 1 && (i.additionalProperties = { allOf: e });
	}
	return i;
}
function Ra(e) {
	let t = e.allOf;
	if (!Array.isArray(t) || t.length < 2) return;
	for (let t of Pa) if (t in e) return;
	let n = t.filter((e) => Fa.some((t) => Array.isArray(e[t]))), r = null;
	if (!n.length) r = La(t);
	else {
		let e = n[0], i = Fa.find((t) => Array.isArray(e[t]));
		if (Object.keys(e).length !== 1) return;
		let a = t.filter((t) => t !== e), o = e[i].map((e) => La([...a, e]));
		if (o.some((e) => !e)) return;
		r = { [i]: o };
	}
	r && (delete e.allOf, ka(e, r));
}
function za(e, t) {
	let n = e.seen.get(t);
	if (!n) throw Error("Unprocessed schema. This is a bug in Zod.");
	let r = (t) => {
		let n = e.seen.get(t);
		if (n.ref === null) return;
		let i = n.def ?? n.schema, a = { ...i }, o = n.ref;
		if (n.ref = null, o) {
			r(o);
			let n = e.seen.get(o), s = n.schema;
			if (s.$ref && (e.target === "draft-07" || e.target === "draft-04" || e.target === "openapi-3.0") ? (i.allOf = i.allOf ?? [], i.allOf.push(s)) : ka(i, s), ka(i, a), t._zod.parent === o) for (let e in i) e !== "$ref" && e !== "allOf" && (e in a || delete i[e]);
			if (s.$ref && n.def) for (let e in i) e !== "$ref" && e !== "allOf" && e in n.def && JSON.stringify(i[e]) === JSON.stringify(n.def[e]) && delete i[e];
		}
		let s = t._zod.parent;
		if (s && s !== o) {
			r(s);
			let t = e.seen.get(s);
			if (t?.schema.$ref && (i.$ref = t.schema.$ref, t.def)) for (let e in i) e !== "$ref" && e !== "allOf" && e in t.def && JSON.stringify(i[e]) === JSON.stringify(t.def[e]) && delete i[e];
		}
		e.override({
			zodSchema: t,
			jsonSchema: i,
			path: n.path ?? []
		});
	};
	if (!e.external || e.sharedEmitDoneFor !== e.external) {
		for (let t of [...e.seen.entries()].reverse()) r(t[0]);
		if (e.target !== "openapi-3.0") for (let t of e.seen.entries()) Na(t[1].def ?? t[1].schema);
		for (let t of e.deferred) t();
		if (e.intersections.length) {
			let t = /* @__PURE__ */ new Map();
			for (let n of e.seen.values()) for (let e of [n.schema, n.def]) {
				let n = e?.allOf;
				if (!Array.isArray(n)) continue;
				let r = t.get(n);
				r ? r.push(e) : t.set(n, [e]);
			}
			for (let n of e.intersections) for (let e of t.get(n) ?? []) Ra(e);
		}
	}
	let i = {};
	if (e.target === "draft-2020-12" ? i.$schema = "https://json-schema.org/draft/2020-12/schema" : e.target === "draft-07" ? i.$schema = "http://json-schema.org/draft-07/schema#" : e.target === "draft-04" ? i.$schema = "http://json-schema.org/draft-04/schema#" : e.target, e.external?.uri) {
		let n = e.external.registry.get(t)?.id;
		if (!n) throw Error("Schema is missing an `id` property");
		i.$id = e.external.uri(n);
	}
	ka(i, n.defId ? n.schema : n.def ?? n.schema);
	let a = e.metadataRegistry.get(t)?.id;
	a !== void 0 && i.id === a && delete i.id;
	let o = e.external?.defs ?? {};
	if (!e.external || e.sharedEmitDoneFor !== e.external) for (let t of e.seen.entries()) {
		let e = t[1];
		e.def && e.defId && (e.def.id === e.defId && delete e.def.id, w(o, e.defId, e.def));
	}
	e.external && (e.sharedEmitDoneFor = e.external), e.external || Object.keys(o).length > 0 && (e.target === "draft-2020-12" ? i.$defs = o : i.definitions = o);
	try {
		let n = JSON.parse(JSON.stringify(i));
		return Object.defineProperty(n, "~standard", {
			value: {
				...t["~standard"],
				jsonSchema: {
					input: Va(t, "input", e.processors),
					output: Va(t, "output", e.processors)
				}
			},
			enumerable: !1,
			writable: !1
		}), n;
	} catch {
		throw Error("Error converting schema to JSON.");
	}
}
function K(e, t) {
	let n = t ?? { seen: /* @__PURE__ */ new Set() };
	if (n.seen.has(e)) return !1;
	n.seen.add(e);
	let r = e._zod.def;
	if (r.type === "transform") return !0;
	if (r.type === "array") return K(r.element, n);
	if (r.type === "set") return K(r.valueType, n);
	if (r.type === "lazy") return K(r.getter(), n);
	if (r.type === "promise" || r.type === "optional" || r.type === "nonoptional" || r.type === "nullable" || r.type === "readonly" || r.type === "default" || r.type === "prefault" || r.type === "catch") return K(r.innerType, n);
	if (r.type === "intersection") return K(r.left, n) || K(r.right, n);
	if (r.type === "record" || r.type === "map") return K(r.keyType, n) || K(r.valueType, n);
	if (r.type === "pipe") return e._zod.traits.has("$ZodCodec") ? !0 : K(r.in, n) || K(r.out, n);
	if (r.type === "object") {
		for (let e in r.shape) if (K(r.shape[e], n)) return !0;
		return !1;
	}
	if (r.type === "union") {
		for (let e of r.options) if (K(e, n)) return !0;
		return !1;
	}
	if (r.type === "tuple") {
		for (let e of r.items) if (K(e, n)) return !0;
		return !!(r.rest && K(r.rest, n));
	}
	return !1;
}
var Ba = (e, t = {}) => (n) => {
	let r = Aa({
		...n,
		processors: t
	});
	return G(e, r), Ma(r, e), za(r, e);
}, Va = (e, t, n = {}) => (r) => {
	let { libraryOptions: i, target: a } = r ?? {}, o = Aa({
		...i ?? {},
		target: a,
		io: t,
		processors: n
	});
	return G(e, o), Ma(o, e), za(o, e);
}, q = (e, t, n) => {
	(e[t] === void 0 || n > e[t]) && (e[t] = n);
}, J = (e, t, n) => {
	(e[t] === void 0 || n < e[t]) && (e[t] = n);
}, Ha = (e, t) => {
	q(e, "minimum", t), J(e, "maximum", t);
}, Ua = (e, t) => {
	e.multipleOf ??= [], e.multipleOf.includes(t) || e.multipleOf.push(t);
}, Wa = (e, t) => {
	e.patterns ??= /* @__PURE__ */ new Set(), e.patterns.add(t);
}, Ga = (e, t) => {
	e.mime = e.mime ? e.mime.filter((e) => t.includes(e)) : [...t];
}, Ka = (e, t) => {
	e.format = t, t.includes("int") && (e.isInt = !0);
}, qa = (e, t) => q(e, "minimum", t.minimum), Ja = (e, t) => J(e, "maximum", t.maximum), Ya = (e) => (t, n) => {
	Ka(t, n.format);
	let [r, i] = e[n.format];
	q(t, "minimum", r), J(t, "maximum", i);
}, Xa = {
	greater_than: (e, t) => q(e, t.inclusive ? "minimum" : "exclusiveMinimum", t.value),
	less_than: (e, t) => J(e, t.inclusive ? "maximum" : "exclusiveMaximum", t.value),
	multiple_of: (e, t) => Ua(e, t.value),
	number_format: Ya(Ce),
	bigint_format: Ya(we),
	min_length: qa,
	max_length: Ja,
	length_equals: (e, t) => Ha(e, t.length),
	min_size: qa,
	max_size: Ja,
	size_equals: (e, t) => Ha(e, t.size),
	string_format: (e, t) => {
		Ka(e, t.format), t.pattern && Wa(e, t.pattern), (t.format === "base64" || t.format === "base64url") && (e.contentEncoding = t.format), (t.local || t.precision === -1) && (e.laxFormat = !0);
	},
	mime_type: (e, t) => Ga(e, t.mime)
};
function Y(e) {
	let t = {}, n = e._zod.def, r = e._zod.traits.has("$ZodCheck") ? [e, ...n.checks ?? []] : n.checks ?? [];
	for (let e of r) Xa[e._zod.def.check]?.(t, e._zod.def);
	let i = e._zod.bag;
	i.minimum !== void 0 && q(t, "minimum", i.minimum), i.exclusiveMinimum !== void 0 && q(t, "exclusiveMinimum", i.exclusiveMinimum), i.maximum !== void 0 && J(t, "maximum", i.maximum), i.exclusiveMaximum !== void 0 && J(t, "exclusiveMaximum", i.exclusiveMaximum), i.multipleOf !== void 0 && Ua(t, i.multipleOf), i.format !== void 0 && (t.format ??= i.format, i.format.includes("int") && (t.isInt = !0)), i.mime && Ga(t, i.mime);
	for (let e of i.patterns ?? []) Wa(t, e);
	return t;
}
var Za = {
	guid: "uuid",
	url: "uri",
	datetime: "date-time",
	json_string: "json-string",
	regex: ""
}, Qa = /* @__PURE__ */ new Map([[fr, Xt], [mr, Zt]]), $a = (e) => Qa.get(e) ?? e, eo = (e, t, n, r) => {
	let i = n;
	i.type = "string";
	let { minimum: a, maximum: o, format: s, patterns: c, contentEncoding: l, laxFormat: u } = Y(e);
	if (typeof a == "number" && (i.minLength = a), typeof o == "number" && (i.maxLength = o), s && (i.format = Za[s] ?? s, i.format === "" && delete i.format, (s === "time" || u) && delete i.format), l && (i.contentEncoding = l), c && c.size > 0) {
		let e = [...c].map($a);
		e.length === 1 ? i.pattern = e[0].source : e.length > 1 && (i.allOf = [...e.map((e) => ({
			...t.target === "draft-07" || t.target === "draft-04" || t.target === "openapi-3.0" ? { type: "string" } : {},
			pattern: e.source
		}))]);
	}
}, to = (e, t, n, r) => {
	let i = n, { minimum: a, maximum: o, multipleOf: s, exclusiveMaximum: c, exclusiveMinimum: l, isInt: u } = Y(e);
	i.type = u ? "integer" : "number";
	let d = typeof l == "number" && l >= (a ?? -Infinity), f = typeof c == "number" && c <= (o ?? Infinity), p = t.target === "draft-04" || t.target === "openapi-3.0";
	if (d ? p ? (i.minimum = l, i.exclusiveMinimum = !0) : i.exclusiveMinimum = l : typeof a == "number" && (i.minimum = a), f ? p ? (i.maximum = c, i.exclusiveMaximum = !0) : i.exclusiveMaximum = c : typeof o == "number" && (i.maximum = o), s) {
		let n = /* @__PURE__ */ new Set();
		for (let a of s) Number.isFinite(a) && a !== 0 ? n.add(Math.abs(a)) : W(e, t, i, r, `A multipleOf divisor of ${a} cannot be represented in JSON Schema`);
		let [a, ...o] = n;
		a !== void 0 && (i.multipleOf = a), o.length && (i.allOf = [...i.allOf ?? [], ...o.map((e) => ({ multipleOf: e }))]);
	}
}, no = (e, t, n, r) => {
	n.type = "boolean";
}, ro = (e, t, n, r) => {
	n.not = {};
}, io = (e, t, n, r) => {
	let i = e._zod.def, a = ne(i.entries);
	if (a.length === 0) {
		n.not = {};
		return;
	}
	a.every((e) => typeof e == "number") && (n.type = "number"), a.every((e) => typeof e == "string") && (n.type = "string"), n.enum = a;
}, ao = (e, t, n, r) => {
	W(e, t, n, r, "Custom types cannot be represented in JSON Schema");
}, oo = (e, t, n, r) => {
	W(e, t, n, r, "Transforms cannot be represented in JSON Schema");
}, so = (e, t, n, r) => {
	let i = n, a = e._zod.def, { minimum: o, maximum: s } = Y(e);
	typeof o == "number" && (i.minItems = o), typeof s == "number" && (i.maxItems = s), i.type = "array", i.items = G(a.element, t, {
		...r,
		path: [...r.path, "items"]
	});
};
function co(e) {
	let t = e._zod.def;
	return t.type === "pipe" && t.in._zod.traits.has("$ZodTransform") ? co(t.out) : t.type === "catch" ? co(t.innerType) : e._zod.optin;
}
var lo = (e, t, n, r) => {
	let i = n, a = e._zod.def, o = a.shape;
	if (Object.getOwnPropertySymbols(o).length && W(e, t, i, r, "Symbol keys cannot be represented in JSON Schema")) return;
	i.type = "object", i.properties = {};
	for (let e in o) w(i.properties, e, G(o[e], t, {
		...r,
		path: [
			...r.path,
			"properties",
			e
		]
	}));
	let s = [];
	for (let e of Object.keys(o)) {
		let n = a.shape[e];
		(t.io === "input" ? co(n) === void 0 : n._zod.optout === void 0) && s.push(e);
	}
	s.length > 0 && (i.required = s), a.catchall?._zod.def.type === "never" ? i.additionalProperties = !1 : a.catchall ? a.catchall && (i.additionalProperties = G(a.catchall, t, {
		...r,
		path: [...r.path, "additionalProperties"]
	})) : t.io === "output" && (i.additionalProperties = !1);
}, uo = (e, t, n, r) => {
	let i = e._zod.def, a = i.inclusive === !1, o = i.options.map((e, n) => G(e, t, {
		...r,
		path: [
			...r.path,
			a ? "oneOf" : "anyOf",
			n
		]
	}));
	a ? n.oneOf = o : n.anyOf = o;
}, fo = (e, t, n, r) => {
	let i = e._zod.def, a = G(i.left, t, {
		...r,
		path: [
			...r.path,
			"allOf",
			0
		]
	}), o = G(i.right, t, {
		...r,
		path: [
			...r.path,
			"allOf",
			1
		]
	}), s = (e) => "allOf" in e && Object.keys(e).length === 1, c = [...s(a) ? a.allOf : [a], ...s(o) ? o.allOf : [o]];
	n.allOf = c, t.intersections.push(c);
};
function po(e, t, n) {
	if (t.$ref) {
		if (n.has(t)) return t;
		n.add(t);
		let r = e.get(t)?.def;
		if (!r) return t;
		let i = po(e, r, n);
		return i === r ? t : i;
	}
	for (let r of ["anyOf", "oneOf"]) {
		let i = t[r];
		if (!Array.isArray(i)) continue;
		let a = i.map((t) => po(e, t, n));
		a.some((e, t) => e !== i[t]) && (t = {
			...t,
			[r]: a
		});
	}
	let r = Array.isArray(t.type) ? t.type : [t.type], i = !r.includes("string") && r.some((e) => e === "number" || e === "integer"), a = t.enum ?? (t.const === void 0 ? void 0 : [t.const]);
	if (!i && !a?.some((e) => typeof e == "number")) return t;
	let { minimum: o, maximum: s, exclusiveMinimum: c, exclusiveMaximum: l, multipleOf: u, format: d, id: f, ...p } = t;
	return p.enum ? p.enum = p.enum.map((e) => typeof e == "number" ? String(e) : e) : typeof p.const == "number" && (p.const = String(p.const)), i ? (p.type = "string", a || (p.pattern = (r.includes("number") ? ln : cn).source), p) : p;
}
var mo = /* @__PURE__ */ new WeakMap();
function ho(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e.seen.values()) n.def && !t.has(n.schema) && t.set(n.schema, n);
	let n = /* @__PURE__ */ new Map();
	for (let r of mo.get(e) ?? []) {
		let i = e.seen.get(r), a = (i?.def ?? i?.schema)?.propertyNames;
		if (!a || a === !0 || n.has(a)) continue;
		let o = po(t, a, /* @__PURE__ */ new Set());
		o !== a && n.set(a, o);
	}
	if (n.size) for (let t of e.seen.values()) for (let e of [t.schema, t.def]) {
		let t = e && n.get(e.propertyNames);
		t && (e.propertyNames = t);
	}
}
var go = (e, t, n, r) => {
	let i = n, a = e._zod.def;
	i.type = "object";
	let o = a.keyType, s = Y(o).patterns;
	if (a.mode === "loose" && s && s.size > 0) {
		let e = G(a.valueType, t, {
			...r,
			path: [
				...r.path,
				"patternProperties",
				"*"
			]
		});
		i.patternProperties = {};
		for (let t of s) w(i.patternProperties, $a(t).source, e);
	} else {
		if (t.target === "draft-07" || t.target === "draft-2020-12") {
			i.propertyNames = G(a.keyType, t, {
				...r,
				path: [...r.path, "propertyNames"]
			});
			let n = mo.get(t);
			n || (n = [], mo.set(t, n), t.deferred.push(() => ho(t))), n.push(e);
		}
		i.additionalProperties = G(a.valueType, t, {
			...r,
			path: [...r.path, "additionalProperties"]
		});
	}
	let c = o._zod.values, l = t.io === "input" && co(a.valueType) !== void 0;
	if (c && !a.partial && !l) {
		let e = [...c].filter((e) => typeof e == "string" || typeof e == "number");
		e.length > 0 && (i.required = e.map(String));
	}
}, _o = (e, t, n, r) => {
	let i = e._zod.def, a = G(i.innerType, t, r), o = t.seen.get(e);
	t.target === "openapi-3.0" ? (o.ref = i.innerType, n.nullable = !0) : n.anyOf = [a, { type: "null" }];
}, vo = (e, t, n, r) => {
	let i = e._zod.def;
	G(i.innerType, t, r);
	let a = t.seen.get(e);
	a.ref = i.innerType;
}, yo = Symbol();
function bo(e, t, n, r, i) {
	let a = !1, o = JSON.stringify(e, (e, t) => typeof t == "bigint" ? (a = !0, null) : t);
	return a ? (W(t, n, r, i, "BigInt defaults cannot be represented in JSON Schema"), yo) : JSON.parse(o);
}
var xo = (e, t, n, r) => {
	let i = e._zod.def;
	G(i.innerType, t, r);
	let a = t.seen.get(e);
	a.ref = i.innerType;
	let o = bo(i.defaultValue, e, t, n, r);
	o !== yo && (n.default = o);
}, So = (e, t, n, r) => {
	let i = e._zod.def;
	G(i.innerType, t, r);
	let a = t.seen.get(e);
	if (a.ref = i.innerType, t.io !== "input") return;
	let o = bo(i.defaultValue, e, t, n, r);
	o !== yo && (n._prefault = o);
}, Co = (e, t, n, r) => {
	let i = e._zod.def;
	G(i.innerType, t, r);
	let a = t.seen.get(e);
	a.ref = i.innerType;
	let o;
	try {
		o = i.catchValue(void 0);
	} catch {
		W(e, t, n, r, "Dynamic catch values are not supported in JSON Schema");
		return;
	}
	n.default = o;
}, wo = (e, t, n, r) => {
	let i = e._zod.def, a = i.in._zod.traits.has("$ZodTransform"), o = t.io === "input" ? a ? i.out : i.in : i.out;
	G(o, t, r);
	let s = t.seen.get(e);
	s.ref = o;
}, To = (e, t, n, r) => {
	let i = e._zod.def;
	G(i.innerType, t, r);
	let a = t.seen.get(e);
	a.ref = i.innerType, n.readOnly = !0;
}, Eo = (e, t, n, r) => {
	let i = e._zod.def;
	G(i.innerType, t, r);
	let a = t.seen.get(e);
	a.ref = i.innerType;
}, Do = /* @__PURE__ */ new WeakSet([Object.prototype, Error.prototype]);
function Oo(e, t, n) {
	Object.defineProperty(e, t, {
		configurable: !0,
		enumerable: !1,
		get() {
			let e = n(this);
			return Object.defineProperty(this, t, {
				value: e,
				configurable: !0,
				writable: !0
			}), e;
		},
		set(e) {
			Object.defineProperty(this, t, {
				value: e,
				configurable: !0,
				writable: !0
			});
		}
	});
}
var X = /*@__PURE__*/ I("ZodError", (e, t) => {
	ut.init(e, t), e.name = "ZodError";
	let n = Object.getPrototypeOf(e);
	Do.has(n) || (Do.add(n), Oo(n, "format", (e) => (t) => pt(e, t)), Oo(n, "flatten", (e) => (t) => ft(e, t)), Oo(n, "addIssue", (e) => (t) => {
		e.issues.push(t), e.message = JSON.stringify(e.issues, C, 2);
	}), Oo(n, "addIssues", (e) => (t) => {
		e.issues.push(...t), e.message = JSON.stringify(e.issues, C, 2);
	}), Object.defineProperty(n, "isEmpty", {
		configurable: !0,
		enumerable: !1,
		get() {
			return this.issues.length === 0;
		}
	}));
}, void 0, { Parent: Error }), ko = /* @__PURE__ */ ht(X), Ao = /* @__PURE__ */ gt(X), jo = /* @__PURE__ */ _t(X), Mo = /* @__PURE__ */ yt(X), No = /* @__PURE__ */ Tt(X), Po = /* @__PURE__ */ Et(X), Fo = /* @__PURE__ */ Dt(X), Io = /* @__PURE__ */ Ot(X), Lo = /* @__PURE__ */ kt(X), Ro = /* @__PURE__ */ At(X), zo = /* @__PURE__ */ jt(X), Bo = /* @__PURE__ */ Mt(X);
//#endregion
//#region node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/classic/schemas.js
function Vo() {
	R.localeError || z(Si());
}
function Ho() {
	R.memoizer || z({ memoizer: yi() });
}
var Z = /*@__PURE__*/ I("ZodType", (e, t) => (Vo(), V.init(e, t), e.def = t, e.type = t.type, e), {
	check(...e) {
		let t = this.def;
		return this.clone(D(t, { checks: [...t.checks ?? [], ...e.map((e) => typeof e == "function" ? { _zod: {
			check: e,
			def: { check: "custom" },
			onattach: []
		} } : e)] }), { parent: !0 });
	},
	with(...e) {
		return this.check(...e);
	},
	clone(e, t) {
		return k(this, e, t);
	},
	brand() {
		return this;
	},
	register(e, t) {
		return e.add(this, t), this;
	},
	refine(e, t) {
		return this.check(rc(e, t));
	},
	superRefine(e, t) {
		return this.check(ic(e, t));
	},
	overwrite(e) {
		return this.check(/* @__PURE__ */ U(e));
	},
	optional() {
		return zs(this);
	},
	exactOptional() {
		return Vs(this);
	},
	nullable() {
		return Us(this);
	},
	nullish() {
		return zs(Us(this));
	},
	nonoptional(e) {
		return Ys(this, e);
	},
	array() {
		return Ts(this);
	},
	or(e) {
		return ks([this, e]);
	},
	and(e) {
		return js(this, e);
	},
	transform(e) {
		return $s(this, Ls(e));
	},
	default(e) {
		return Gs(this, e);
	},
	prefault(e) {
		return qs(this, e);
	},
	catch(e) {
		return Zs(this, e);
	},
	pipe(e) {
		return $s(this, e);
	},
	readonly() {
		return tc(this);
	},
	describe(e) {
		let t = this.clone();
		return Ei.add(t, { description: e }), t;
	},
	meta(...e) {
		if (e.length === 0) return Ei.get(this);
		let t = this.clone();
		return Ei.add(t, e[0]), t;
	},
	isOptional() {
		return this.safeParse(void 0).success;
	},
	isNullable() {
		return this.safeParse(null).success;
	},
	apply(e, ...t) {
		return t.length === 0 ? e(this) : e(this, ...t);
	},
	get "~standard"() {
		return We(this, "~standard", {
			...Pn(this),
			jsonSchema: {
				input: Va(this, "input"),
				output: Va(this, "output")
			}
		});
	},
	set "~standard"(e) {
		N(this, "~standard", e);
	},
	parse: function e(t, n) {
		return ko(this, t, n, { callee: e });
	},
	parseAsync: async function e(t, n) {
		return await Ao(this, t, n, { callee: e });
	},
	safeParse(e, t) {
		return jo(this, e, t);
	},
	async safeParseAsync(e, t) {
		return Mo(this, e, t);
	},
	get spa() {
		return this?.safeParseAsync;
	},
	set spa(e) {
		N(this, "spa", e);
	},
	validate(e, t) {
		return St(this, e, t);
	},
	validateAsync(e, t) {
		return wt(this, e, t);
	},
	encode: function e(t, n) {
		return No(this, t, n, { callee: e });
	},
	decode: function e(t, n) {
		return Po(this, t, n, { callee: e });
	},
	encodeAsync: async function e(t, n) {
		return await Fo(this, t, n, { callee: e });
	},
	decodeAsync: async function e(t, n) {
		return await Io(this, t, n, { callee: e });
	},
	safeEncode(e, t) {
		return Lo(this, e, t);
	},
	safeDecode(e, t) {
		return Ro(this, e, t);
	},
	async safeEncodeAsync(e, t) {
		return zo(this, e, t);
	},
	async safeDecodeAsync(e, t) {
		return Bo(this, e, t);
	},
	toJSONSchema(e) {
		return Ba(this, {})(e);
	},
	get description() {
		return Ei.get(this)?.description;
	},
	get _def() {
		return this._zod.def;
	}
}), Uo = /*@__PURE__*/ I("_ZodString", (e, t) => {
	Fn.init(e, t), Z.init(e, t), e._zod.processJSONSchema = (t, n, r) => eo(e, t, n, r);
}, /*@__PURE__*/ Ge({
	format: (e) => Y(e).format ?? null,
	minLength: (e) => Y(e).minimum ?? null,
	maxLength: (e) => Y(e).maximum ?? null
}, {
	regex(...e) {
		return this.check(/* @__PURE__ */ ma(...e));
	},
	includes(...e) {
		return this.check(/* @__PURE__ */ _a(...e));
	},
	startsWith(...e) {
		return this.check(/* @__PURE__ */ va(...e));
	},
	endsWith(...e) {
		return this.check(/* @__PURE__ */ ya(...e));
	},
	min(...e) {
		return this.check(/* @__PURE__ */ fa(...e));
	},
	max(...e) {
		return this.check(/* @__PURE__ */ da(...e));
	},
	length(...e) {
		return this.check(/* @__PURE__ */ pa(...e));
	},
	nonempty(...e) {
		return this.check(/* @__PURE__ */ fa(1, ...e));
	},
	lowercase(e) {
		return this.check(/* @__PURE__ */ ha(e));
	},
	uppercase(e) {
		return this.check(/* @__PURE__ */ ga(e));
	},
	trim() {
		return this.check(/* @__PURE__ */ xa());
	},
	normalize(...e) {
		return this.check(/* @__PURE__ */ ba(...e));
	},
	toLowerCase() {
		return this.check(/* @__PURE__ */ Sa());
	},
	toUpperCase() {
		return this.check(/* @__PURE__ */ Ca());
	},
	slugify() {
		return this.check(/* @__PURE__ */ wa());
	}
})), Wo = /*@__PURE__*/ I("ZodString", (e, t) => {
	Fn.init(e, t), Uo.init(e, t);
}, {
	email(e) {
		return this.check(/* @__PURE__ */ ki(Yo, e));
	},
	url(e) {
		return this.check(/* @__PURE__ */ Fi(Qo, e));
	},
	jwt(e) {
		return this.check(/* @__PURE__ */ Xi(ps, e));
	},
	emoji(e) {
		return this.check(/* @__PURE__ */ Ii($o, e));
	},
	guid(e) {
		return this.check(/* @__PURE__ */ Ai(Xo, e));
	},
	uuid(e) {
		return this.check(/* @__PURE__ */ ji(Zo, e));
	},
	uuidv4(e) {
		return this.check(/* @__PURE__ */ Mi(Zo, e));
	},
	uuidv6(e) {
		return this.check(/* @__PURE__ */ Ni(Zo, e));
	},
	uuidv7(e) {
		return this.check(/* @__PURE__ */ Pi(Zo, e));
	},
	nanoid(e) {
		return this.check(/* @__PURE__ */ Li(es, e));
	},
	cuid(e) {
		return this.check(/* @__PURE__ */ Ri(ts, e));
	},
	cuid2(e) {
		return this.check(/* @__PURE__ */ zi(ns, e));
	},
	ulid(e) {
		return this.check(/* @__PURE__ */ Bi(rs, e));
	},
	base64(e) {
		return this.check(/* @__PURE__ */ qi(us, e));
	},
	base64url(e) {
		return this.check(/* @__PURE__ */ Ji(ds, e));
	},
	xid(e) {
		return this.check(/* @__PURE__ */ Vi(is, e));
	},
	ksuid(e) {
		return this.check(/* @__PURE__ */ Hi(as, e));
	},
	ipv4(e) {
		return this.check(/* @__PURE__ */ Ui(os, e));
	},
	ipv6(e) {
		return this.check(/* @__PURE__ */ Wi(ss, e));
	},
	cidrv4(e) {
		return this.check(/* @__PURE__ */ Gi(cs, e));
	},
	cidrv6(e) {
		return this.check(/* @__PURE__ */ Ki(ls, e));
	},
	e164(e) {
		return this.check(/* @__PURE__ */ Yi(fs, e));
	},
	datetime(e) {
		return this.check(/* @__PURE__ */ Zi(Go, e));
	},
	date(e) {
		return this.check(/* @__PURE__ */ Qi(Ko, e));
	},
	time(e) {
		return this.check(/* @__PURE__ */ $i(qo, e));
	},
	duration(e) {
		return this.check(/* @__PURE__ */ ea(Jo, e));
	}
});
function Q(e) {
	return /* @__PURE__ */ Oi(Wo, e);
}
var $ = /*@__PURE__*/ I("ZodStringFormat", (e, t) => {
	H.init(e, t), Uo.init(e, t);
}), Go = /*@__PURE__*/ I("ZodISODateTime", (e, t) => {
	er.init(e, t), $.init(e, t);
}), Ko = /*@__PURE__*/ I("ZodISODate", (e, t) => {
	tr.init(e, t), $.init(e, t);
}), qo = /*@__PURE__*/ I("ZodISOTime", (e, t) => {
	nr.init(e, t), $.init(e, t);
}), Jo = /*@__PURE__*/ I("ZodISODuration", (e, t) => {
	rr.init(e, t), $.init(e, t);
}), Yo = /*@__PURE__*/ I("ZodEmail", (e, t) => {
	Rn.init(e, t), $.init(e, t);
}), Xo = /*@__PURE__*/ I("ZodGUID", (e, t) => {
	In.init(e, t), $.init(e, t);
}), Zo = /*@__PURE__*/ I("ZodUUID", (e, t) => {
	Ln.init(e, t), $.init(e, t);
}), Qo = /*@__PURE__*/ I("ZodURL", (e, t) => {
	Kn.init(e, t), $.init(e, t);
}), $o = /*@__PURE__*/ I("ZodEmoji", (e, t) => {
	qn.init(e, t), $.init(e, t);
}), es = /*@__PURE__*/ I("ZodNanoID", (e, t) => {
	Jn.init(e, t), $.init(e, t);
}), ts = /*@__PURE__*/ I("ZodCUID", (e, t) => {
	Yn.init(e, t), $.init(e, t);
}), ns = /*@__PURE__*/ I("ZodCUID2", (e, t) => {
	Xn.init(e, t), $.init(e, t);
}), rs = /*@__PURE__*/ I("ZodULID", (e, t) => {
	Zn.init(e, t), $.init(e, t);
}), is = /*@__PURE__*/ I("ZodXID", (e, t) => {
	Qn.init(e, t), $.init(e, t);
}), as = /*@__PURE__*/ I("ZodKSUID", (e, t) => {
	$n.init(e, t), $.init(e, t);
}), os = /*@__PURE__*/ I("ZodIPv4", (e, t) => {
	ir.init(e, t), $.init(e, t);
}), ss = /*@__PURE__*/ I("ZodIPv6", (e, t) => {
	sr.init(e, t), $.init(e, t);
}), cs = /*@__PURE__*/ I("ZodCIDRv4", (e, t) => {
	cr.init(e, t), $.init(e, t);
}), ls = /*@__PURE__*/ I("ZodCIDRv6", (e, t) => {
	ur.init(e, t), $.init(e, t);
}), us = /*@__PURE__*/ I("ZodBase64", (e, t) => {
	pr.init(e, t), $.init(e, t);
}), ds = /*@__PURE__*/ I("ZodBase64URL", (e, t) => {
	gr.init(e, t), $.init(e, t);
}), fs = /*@__PURE__*/ I("ZodE164", (e, t) => {
	_r.init(e, t), $.init(e, t);
}), ps = /*@__PURE__*/ I("ZodJWT", (e, t) => {
	yr.init(e, t), $.init(e, t);
}), ms = /*@__PURE__*/ I("ZodNumber", (e, t) => {
	br.init(e, t), Z.init(e, t), e._zod.processJSONSchema = (t, n, r) => to(e, t, n, r), e.isFinite = !0;
}, /*@__PURE__*/ Ge({
	minValue: (e) => {
		let { minimum: t, exclusiveMinimum: n } = Y(e);
		return Math.max(t ?? -Infinity, n ?? -Infinity);
	},
	maxValue: (e) => {
		let { maximum: t, exclusiveMaximum: n } = Y(e);
		return Math.min(t ?? Infinity, n ?? Infinity);
	},
	isInt: (e) => {
		let { isInt: t, multipleOf: n } = Y(e);
		return !!t || !!n?.some(Number.isSafeInteger);
	},
	format: (e) => Y(e).format ?? null
}, {
	gt(e, t) {
		return this.check(/* @__PURE__ */ ca(e, t));
	},
	gte(e, t) {
		return this.check(/* @__PURE__ */ la(e, t));
	},
	min(e, t) {
		return this.check(/* @__PURE__ */ la(e, t));
	},
	lt(e, t) {
		return this.check(/* @__PURE__ */ oa(e, t));
	},
	lte(e, t) {
		return this.check(/* @__PURE__ */ sa(e, t));
	},
	max(e, t) {
		return this.check(/* @__PURE__ */ sa(e, t));
	},
	int(e) {
		return this.check(_s(e));
	},
	safe(e) {
		return this.check(_s(e));
	},
	positive(e) {
		return this.check(/* @__PURE__ */ ca(0, e));
	},
	nonnegative(e) {
		return this.check(/* @__PURE__ */ la(0, e));
	},
	negative(e) {
		return this.check(/* @__PURE__ */ oa(0, e));
	},
	nonpositive(e) {
		return this.check(/* @__PURE__ */ sa(0, e));
	},
	multipleOf(e, t) {
		return this.check(/* @__PURE__ */ ua(e, t));
	},
	step(e, t) {
		return this.check(/* @__PURE__ */ ua(e, t));
	},
	finite() {
		return this;
	}
}));
function hs(e) {
	return /* @__PURE__ */ ta(ms, e);
}
var gs = /*@__PURE__*/ I("ZodNumberFormat", (e, t) => {
	xr.init(e, t), ms.init(e, t);
});
function _s(e) {
	return /* @__PURE__ */ na(gs, e);
}
var vs = /*@__PURE__*/ I("ZodBoolean", (e, t) => {
	Sr.init(e, t), Z.init(e, t), e._zod.processJSONSchema = (t, n, r) => no(e, t, n, r);
});
function ys(e) {
	return /* @__PURE__ */ ra(vs, e);
}
var bs = /*@__PURE__*/ I("ZodUnknown", (e, t) => {
	Cr.init(e, t), Z.init(e, t), e._zod.processJSONSchema = (e, t, n) => void 0;
});
function xs() {
	return /* @__PURE__ */ ia(bs);
}
var Ss = /*@__PURE__*/ I("ZodNever", (e, t) => {
	wr.init(e, t), Z.init(e, t), e._zod.processJSONSchema = (t, n, r) => ro(e, t, n, r);
});
function Cs(e) {
	return /* @__PURE__ */ aa(Ss, e);
}
var ws = /*@__PURE__*/ I("ZodArray", (e, t) => {
	Ho(), Er.init(e, t), Z.init(e, t), e._zod.processJSONSchema = (t, n, r) => so(e, t, n, r), e.element = t.element;
}, {
	min(e, t) {
		return this.check(/* @__PURE__ */ fa(e, t));
	},
	nonempty(e) {
		return this.check(/* @__PURE__ */ fa(1, e));
	},
	max(e, t) {
		return this.check(/* @__PURE__ */ da(e, t));
	},
	length(e, t) {
		return this.check(/* @__PURE__ */ pa(e, t));
	},
	unwrap() {
		return this.element;
	}
});
function Ts(e, t) {
	return /* @__PURE__ */ Ta(ws, e, t);
}
var Es = /*@__PURE__*/ I("ZodObject", (e, t) => {
	Ho(), Mr.init(e, t), Z.init(e, t), e._zod.processJSONSchema = (t, n, r) => lo(e, t, n, r), Xe(e, "shape", (e) => e._zod.def.shape, !1);
}, {
	keyof() {
		return Fs(Object.keys(this._zod.def.shape));
	},
	catchall(e) {
		return this.clone(D(this._zod.def, { catchall: e }));
	},
	passthrough() {
		return this.clone(D(this._zod.def, { catchall: xs() }));
	},
	loose() {
		return this.clone(D(this._zod.def, { catchall: xs() }));
	},
	strict() {
		return this.clone(D(this._zod.def, { catchall: Cs() }));
	},
	strip() {
		return this.clone(D(this._zod.def, { catchall: void 0 }));
	},
	extend(e) {
		return Oe(this, e);
	},
	safeExtend(e) {
		return Ae(this, e);
	},
	merge(e) {
		return je(this, e);
	},
	pick(e) {
		return Te(this, e);
	},
	omit(e) {
		return De(this, e);
	},
	partial(...e) {
		return Me(Rs, this, e[0]);
	},
	exactPartial(...e) {
		return Me(Bs, this, e[0], "exactPartial");
	},
	required(...e) {
		return Ne(Js, this, e[0]);
	}
});
function Ds(e, t) {
	return new Es({
		type: "object",
		shape: e ?? {},
		...A(t)
	});
}
var Os = /*@__PURE__*/ I("ZodUnion", (e, t) => {
	Pr.init(e, t), Z.init(e, t), e._zod.processJSONSchema = (t, n, r) => uo(e, t, n, r), e.options = t.options;
});
function ks(e, t) {
	return new Os({
		type: "union",
		options: e,
		...A(t)
	});
}
var As = /*@__PURE__*/ I("ZodIntersection", (e, t) => {
	Fr.init(e, t), Z.init(e, t), e._zod.processJSONSchema = (t, n, r) => fo(e, t, n, r);
});
function js(e, t) {
	return new As({
		type: "intersection",
		left: e,
		right: t
	});
}
var Ms = /*@__PURE__*/ I("ZodRecord", (e, t) => {
	Ho(), Rr.init(e, t), Z.init(e, t), e._zod.processJSONSchema = (t, n, r) => go(e, t, n, r), e.keyType = t.keyType, e.valueType = t.valueType;
});
function Ns(e, t, n) {
	return !t || !t._zod ? new Ms({
		type: "record",
		keyType: Q(),
		valueType: e,
		...A(t)
	}) : new Ms({
		type: "record",
		keyType: e,
		valueType: t,
		...A(n)
	});
}
var Ps = /*@__PURE__*/ I("ZodEnum", (e, t) => {
	zr.init(e, t), Z.init(e, t), e._zod.processJSONSchema = (t, n, r) => io(e, t, n, r), e.enum = t.entries, e.options = [...e._zod.values];
	let n = new Set(Object.keys(t.entries));
	e.extract = (e, r) => {
		let i = {};
		for (let r of e) if (n.has(r)) i[r] = t.entries[r];
		else throw Error(`Key ${r} not found in enum`);
		return new Ps({
			...t,
			checks: [],
			...A(r),
			entries: i
		});
	}, e.exclude = (e, r) => {
		let i = { ...t.entries };
		for (let t of e) if (n.has(t)) delete i[t];
		else throw Error(`Key ${t} not found in enum`);
		return new Ps({
			...t,
			checks: [],
			...A(r),
			entries: i
		});
	};
});
function Fs(e, t) {
	return new Ps({
		type: "enum",
		entries: Array.isArray(e) ? Object.fromEntries(e.map((e) => [e, e])) : e,
		...A(t)
	});
}
var Is = /*@__PURE__*/ I("ZodTransform", (e, t) => {
	Ho(), Br.init(e, t), Z.init(e, t), e._zod.processJSONSchema = (t, n, r) => oo(e, t, n, r), e._zod.parse = (n, r) => {
		if (r.direction === "backward") throw new rt(e.constructor.name);
		n.addIssue = (r) => {
			if (typeof r == "string") n.issues.push(He(r, n.value, t));
			else {
				let t = r;
				t.fatal && (t.continue = !1), t.code ??= "custom", "input" in t || (t.input = n.value), t.inst ??= e, n.issues.push(He(t));
			}
		};
		let i = t.transform(n.value, n);
		return i instanceof Promise ? i.then((e) => (n.value = e, n)) : (n.value = i, n);
	};
});
function Ls(e) {
	return new Is({
		type: "transform",
		transform: e
	});
}
var Rs = /*@__PURE__*/ I("ZodOptional", (e, t) => {
	Hr.init(e, t), Z.init(e, t), e._zod.processJSONSchema = (t, n, r) => Eo(e, t, n, r), e.unwrap = () => e._zod.def.innerType;
});
function zs(e) {
	return new Rs({
		type: "optional",
		innerType: e
	});
}
var Bs = /*@__PURE__*/ I("ZodExactOptional", (e, t) => {
	Ur.init(e, t), Z.init(e, t), e._zod.processJSONSchema = (t, n, r) => Eo(e, t, n, r), e.unwrap = () => e._zod.def.innerType;
});
function Vs(e) {
	return new Bs({
		type: "optional",
		innerType: e
	});
}
var Hs = /*@__PURE__*/ I("ZodNullable", (e, t) => {
	Wr.init(e, t), Z.init(e, t), e._zod.processJSONSchema = (t, n, r) => _o(e, t, n, r), e.unwrap = () => e._zod.def.innerType;
});
function Us(e) {
	return new Hs({
		type: "nullable",
		innerType: e
	});
}
var Ws = /*@__PURE__*/ I("ZodDefault", (e, t) => {
	Gr.init(e, t), Z.init(e, t), e._zod.processJSONSchema = (t, n, r) => xo(e, t, n, r), e.unwrap = () => e._zod.def.innerType, e.removeDefault = e.unwrap;
});
function Gs(e, t) {
	return new Ws({
		type: "default",
		innerType: e,
		get defaultValue() {
			return typeof t == "function" ? t() : ve(t);
		}
	});
}
var Ks = /*@__PURE__*/ I("ZodPrefault", (e, t) => {
	qr.init(e, t), Z.init(e, t), e._zod.processJSONSchema = (t, n, r) => So(e, t, n, r), e.unwrap = () => e._zod.def.innerType;
});
function qs(e, t) {
	return new Ks({
		type: "prefault",
		innerType: e,
		get defaultValue() {
			return typeof t == "function" ? t() : ve(t);
		}
	});
}
var Js = /*@__PURE__*/ I("ZodNonOptional", (e, t) => {
	Jr.init(e, t), Z.init(e, t), e._zod.processJSONSchema = (t, n, r) => vo(e, t, n, r), e.unwrap = () => e._zod.def.innerType;
});
function Ys(e, t) {
	return new Js({
		type: "nonoptional",
		innerType: e,
		...A(t)
	});
}
var Xs = /*@__PURE__*/ I("ZodCatch", (e, t) => {
	Zr.init(e, t), Z.init(e, t), e._zod.processJSONSchema = (t, n, r) => Co(e, t, n, r), e.unwrap = () => e._zod.def.innerType, e.removeCatch = e.unwrap;
});
function Zs(e, t) {
	return new Xs({
		type: "catch",
		innerType: e,
		catchValue: typeof t == "function" ? t : Qe(t)
	});
}
var Qs = /*@__PURE__*/ I("ZodPipe", (e, t) => {
	Qr.init(e, t), Z.init(e, t), e._zod.processJSONSchema = (t, n, r) => wo(e, t, n, r), e.in = t.in, e.out = t.out;
});
function $s(e, t) {
	return new Qs({
		type: "pipe",
		in: e,
		out: t
	});
}
var ec = /*@__PURE__*/ I("ZodReadonly", (e, t) => {
	ei.init(e, t), Z.init(e, t), e._zod.processJSONSchema = (t, n, r) => To(e, t, n, r), e.unwrap = () => e._zod.def.innerType;
});
function tc(e) {
	return new ec({
		type: "readonly",
		innerType: e
	});
}
var nc = /*@__PURE__*/ I("ZodCustom", (e, t) => {
	ni.init(e, t), Z.init(e, t), e._zod.processJSONSchema = (t, n, r) => ao(e, t, n, r);
});
function rc(e, t = {}) {
	return /* @__PURE__ */ Ea(nc, e, t);
}
function ic(e, t) {
	return /* @__PURE__ */ Da(e, t);
}
//#endregion
//#region src/lib/validators.ts
var ac = Ds({
	latitude: hs().min(-90).max(90),
	longitude: hs().min(-180).max(180),
	accuracy: hs().positive().optional()
}), oc = Ds({
	first_name: Q().optional(),
	last_name: Q().optional(),
	phone: Q().optional(),
	address_1: Q().trim().min(1, "La dirección es obligatoria"),
	address_2: Q().optional(),
	city: Q().trim().min(1, "La ciudad es obligatoria"),
	province: Q().optional(),
	postal_code: Q().optional(),
	country_code: Q().trim().length(2).toLowerCase(),
	coordinates: ac.optional(),
	source: Fs([
		"autocomplete",
		"manual",
		"geolocation"
	]).optional(),
	verified: ys().optional(),
	metadata: Ns(Q(), xs()).optional()
});
function sc(e) {
	let t = oc.safeParse(e);
	return t.success ? {
		success: !0,
		data: t.data
	} : {
		success: !1,
		error: t.error.issues[0]?.message ?? "Dirección inválida"
	};
}
//#endregion
//#region src/components/AddressForm.tsx
function cc({ onSubmit: e, addressProvider: n = h(), initialAddress: i = {}, initialCoordinates: a, initialCoords: o, language: s = "es", countryRestriction: c, showMap: l = !0, showLocationButton: u = !0, className: d }) {
	let [f, p] = r({
		address_1: "",
		city: "",
		country_code: "",
		...i
	}), [m, g] = r(a ?? (o ? {
		latitude: o.lat,
		longitude: o.lng,
		accuracy: o.accuracy
	} : null)), [_, v] = r(""), [y, S] = r(!1), ne = async (e, t) => {
		g(e);
		try {
			let r = await n.reverse(e, { language: s });
			p((n) => ({
				...n,
				...r,
				coordinates: e,
				source: t,
				verified: t === "autocomplete"
			}));
		} catch {
			v("No se pudo convertir la ubicación; completa la dirección manualmente.");
		}
	};
	return t(() => {
		i && p((e) => ({
			...e,
			...i
		}));
	}, [i]), /* @__PURE__ */ (0, b.jsxs)("form", {
		className: d,
		onSubmit: async (t) => {
			t.preventDefault(), v(""), S(!1);
			let n = sc({
				...f,
				coordinates: m
			});
			if (!n.success) return v(n.error);
			await e(n.data), S(!0);
		},
		children: [
			/* @__PURE__ */ (0, b.jsx)(x, {
				provider: n,
				onSelect: (e) => {
					p((t) => ({
						...t,
						...lc(e),
						coordinates: e.coordinates,
						source: "autocomplete",
						verified: !0
					})), g(e.coordinates);
				},
				language: s,
				countryRestriction: c
			}),
			/* @__PURE__ */ (0, b.jsxs)("label", { children: ["Dirección", /* @__PURE__ */ (0, b.jsx)("input", {
				value: f.address_1,
				onChange: (e) => p({
					...f,
					address_1: e.target.value,
					source: "manual",
					verified: !1
				}),
				placeholder: "Calle y número",
				required: !0
			})] }),
			/* @__PURE__ */ (0, b.jsxs)("div", {
				className: "address-grid",
				children: [
					/* @__PURE__ */ (0, b.jsxs)("label", { children: ["Ciudad", /* @__PURE__ */ (0, b.jsx)("input", {
						value: f.city,
						onChange: (e) => p({
							...f,
							city: e.target.value
						}),
						required: !0
					})] }),
					/* @__PURE__ */ (0, b.jsxs)("label", { children: ["Provincia", /* @__PURE__ */ (0, b.jsx)("input", {
						value: f.province ?? "",
						onChange: (e) => p({
							...f,
							province: e.target.value
						})
					})] }),
					/* @__PURE__ */ (0, b.jsxs)("label", { children: ["Código postal", /* @__PURE__ */ (0, b.jsx)("input", {
						value: f.postal_code ?? "",
						onChange: (e) => p({
							...f,
							postal_code: e.target.value
						})
					})] }),
					/* @__PURE__ */ (0, b.jsxs)("label", { children: ["País", /* @__PURE__ */ (0, b.jsx)("input", {
						maxLength: 2,
						value: f.country_code,
						onChange: (e) => p({
							...f,
							country_code: e.target.value.toLowerCase()
						}),
						required: !0
					})] })
				]
			}),
			u && /* @__PURE__ */ (0, b.jsx)(ee, {
				onLocation: (e) => ne(e, "geolocation"),
				onError: (e) => v(e.message)
			}),
			l && /* @__PURE__ */ (0, b.jsx)(te, {
				coordinates: m,
				onMarkerDrag: (e) => ne(e, "manual")
			}),
			_ && /* @__PURE__ */ (0, b.jsx)("p", {
				role: "alert",
				children: _
			}),
			y && /* @__PURE__ */ (0, b.jsx)("p", {
				role: "status",
				children: "Dirección validada y lista para enviar."
			}),
			/* @__PURE__ */ (0, b.jsx)("button", {
				type: "submit",
				children: "Guardar dirección"
			})
		]
	});
}
function lc(e) {
	return {
		address_1: e.mainText,
		city: e.secondaryText.split(",")[0]?.trim() ?? "",
		country_code: ""
	};
}
//#endregion
//#region src/components/ManualLocationPicker.tsx
function uc({ coordinates: e, onChange: t, height: n = 260 }) {
	return /* @__PURE__ */ (0, b.jsx)(te, {
		coordinates: e,
		height: n,
		onMarkerDrag: t
	});
}
//#endregion
//#region src/hooks/useRouting.ts
function dc(t) {
	let [n, i] = r(null), [a, o] = r(!1), [s, c] = r(null);
	return {
		route: n,
		loading: a,
		error: s,
		calculate: e(async (e, n) => {
			o(!0), c(null);
			try {
				let r = await t.route(e, n);
				return i(r), r;
			} catch (e) {
				let t = e instanceof Error ? e.message : "No se pudo calcular la ruta";
				throw c(t), e;
			} finally {
				o(!1);
			}
		}, [t]),
		recalculate: async () => {
			throw Error("Pasa origen y destino a calculate");
		}
	};
}
function fc(t) {
	let [n, i] = r(null), [a, o] = r(!1), [s, c] = r(null);
	return {
		matrix: n,
		loading: a,
		error: s,
		calculate: e(async (e) => {
			o(!0), c(null);
			try {
				let n = await t.matrix(e);
				return i(n), n;
			} catch (e) {
				let t = e instanceof Error ? e.message : "No se pudo calcular la matriz";
				throw c(t), e;
			} finally {
				o(!1);
			}
		}, [t])
	};
}
//#endregion
export { d as ADDRESS_KIT_VERSION, oc as AddressDataSchema, cc as AddressForm, x as AddressPicker, ac as CoordinatesSchema, ee as LocationButton, uc as ManualLocationPicker, te as MapView, g as createOSRMProvider, h as createPhotonProvider, f as createRetryFetcher, l as isValidCoordinates, s as toCoordinates, c as toCoords, u as toLegacyAddress, _ as useAutocomplete, fc as useDistanceMatrix, S as useGeolocation, dc as useRouting, sc as validateAddress };
