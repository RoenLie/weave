var ct = Object.defineProperty;
var at = (e, t, n) => t in e ? ct(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n;
var Y = (e, t, n) => (at(e, typeof t != "symbol" ? t + "" : t, n), n);
const lt = {
  arabic: "ar",
  armenian: "am",
  bulgarian: "bg",
  danish: "dk",
  dutch: "nl",
  english: "en",
  finnish: "fi",
  french: "fr",
  german: "de",
  greek: "gr",
  hungarian: "hu",
  indian: "in",
  indonesian: "id",
  irish: "ie",
  italian: "it",
  lithuanian: "lt",
  nepali: "np",
  norwegian: "no",
  portuguese: "pt",
  romanian: "ro",
  russian: "ru",
  serbian: "rs",
  slovenian: "ru",
  spanish: "es",
  swedish: "se",
  tamil: "ta",
  turkish: "tr",
  ukrainian: "uk",
  sanskrit: "sk"
}, ut = {
  dutch: /[^A-Za-zàèéìòóù0-9_'-]+/gim,
  english: /[^A-Za-zàèéìòóù0-9_'-]+/gim,
  french: /[^a-z0-9äâàéèëêïîöôùüûœç-]+/gim,
  italian: /[^A-Za-zàèéìòóù0-9_'-]+/gim,
  norwegian: /[^a-z0-9_æøåÆØÅäÄöÖüÜ]+/gim,
  portuguese: /[^a-z0-9à-úÀ-Ú]/gim,
  russian: /[^a-z0-9а-яА-ЯёЁ]+/gim,
  spanish: /[^a-z0-9A-Zá-úÁ-ÚñÑüÜ]+/gim,
  swedish: /[^a-z0-9_åÅäÄöÖüÜ-]+/gim,
  german: /[^a-z0-9A-ZäöüÄÖÜß]+/gim,
  finnish: /[^a-z0-9äöÄÖ]+/gim,
  danish: /[^a-z0-9æøåÆØÅ]+/gim,
  hungarian: /[^a-z0-9áéíóöőúüűÁÉÍÓÖŐÚÜŰ]+/gim,
  romanian: /[^a-z0-9ăâîșțĂÂÎȘȚ]+/gim,
  serbian: /[^a-z0-9čćžšđČĆŽŠĐ]+/gim,
  turkish: /[^a-z0-9çÇğĞıİöÖşŞüÜ]+/gim,
  lithuanian: /[^a-z0-9ąčęėįšųūžĄČĘĖĮŠŲŪŽ]+/gim,
  arabic: /[^a-z0-9أ-ي]+/gim,
  nepali: /[^a-z0-9अ-ह]+/gim,
  irish: /[^a-z0-9áéíóúÁÉÍÓÚ]+/gim,
  indian: /[^a-z0-9अ-ह]+/gim,
  armenian: /[^a-z0-9ա-ֆ]+/gim,
  greek: /[^a-z0-9α-ωά-ώ]+/gim,
  indonesian: /[^a-z0-9]+/gim,
  ukrainian: /[^a-z0-9а-яА-ЯіїєІЇЄ]+/gim,
  slovenian: /[^a-z0-9čžšČŽŠ]+/gim,
  bulgarian: /[^a-z0-9а-яА-Я]+/gim,
  tamil: /[^a-z0-9அ-ஹ]+/gim,
  sanskrit: /[^a-z0-9A-Zāīūṛḷṃṁḥśṣṭḍṇṅñḻḹṝ]+/gim
}, xe = Object.keys(lt), ft = Date.now().toString().slice(5);
let dt = 0;
const ye = BigInt(1e3), Ie = BigInt(1e6), me = BigInt(1e9), Q = 65535;
function P(e, t) {
  if (t.length < Q)
    Array.prototype.push.apply(e, t);
  else
    for (let n = 0; n < t.length; n += Q)
      Array.prototype.push.apply(e, t.slice(n, n + Q));
}
function ht(e, ...t) {
  return e.replace(/%(?:(?<position>\d+)\$)?(?<width>-?\d*\.?\d*)(?<type>[dfs])/g, function(...n) {
    const s = n[n.length - 1], { width: o, type: r, position: i } = s, c = i ? t[Number.parseInt(i) - 1] : t.shift(), a = o === "" ? 0 : Number.parseInt(o);
    switch (r) {
      case "d":
        return c.toString().padStart(a, "0");
      case "f": {
        let l = c;
        const [f, u] = o.split(".").map((d) => Number.parseFloat(d));
        return typeof u == "number" && u >= 0 && (l = l.toFixed(u)), typeof f == "number" && f >= 0 ? l.toString().padStart(a, "0") : l.toString();
      }
      case "s":
        return a < 0 ? c.toString().padEnd(-a, " ") : c.toString().padStart(a, " ");
      default:
        return c;
    }
  });
}
function pt() {
  return typeof WorkerGlobalScope < "u" && self instanceof WorkerGlobalScope;
}
function gt() {
  return typeof process < "u" && process.release && process.release.name === "node";
}
function be() {
  return BigInt(Math.floor(performance.now() * 1e6));
}
async function oe(e) {
  return typeof e == "number" && (e = BigInt(e)), e < ye ? `${e}ns` : e < Ie ? `${e / ye}μs` : e < me ? `${e / Ie}ms` : `${e / me}s`;
}
async function U() {
  return pt() ? be() : gt() || typeof process < "u" && process.hrtime !== void 0 ? process.hrtime.bigint() : typeof performance < "u" ? be() : BigInt(0);
}
async function Ce() {
  return `${ft}-${dt++}`;
}
function H(e, t) {
  return Object.hasOwn === void 0 ? Object.prototype.hasOwnProperty.call(e, t) ? e[t] : void 0 : Object.hasOwn(e, t) ? e[t] : void 0;
}
function yt(e, t) {
  return t[1] === e[1] ? e[0] - t[0] : t[1] - e[1];
}
function re(e) {
  if (e.length === 0)
    return [];
  if (e.length === 1)
    return e[0];
  for (let n = 1; n < e.length; n++)
    if (e[n].length < e[0].length) {
      const s = e[0];
      e[0] = e[n], e[n] = s;
    }
  const t = /* @__PURE__ */ new Map();
  for (const n of e[0])
    t.set(n, 1);
  for (let n = 1; n < e.length; n++) {
    let s = 0;
    for (const o of e[n]) {
      const r = t.get(o);
      r === n && (t.set(o, r + 1), s++);
    }
    if (s === 0)
      return [];
  }
  return e[0].filter((n) => {
    const s = t.get(n);
    return s !== void 0 && t.set(n, 0), s === e.length;
  });
}
async function Ue(e, t) {
  const n = {}, s = t.length;
  for (let o = 0; o < s; o++) {
    const r = t[o], i = r.split(".");
    let c = e;
    const a = i.length;
    for (let l = 0; l < a; l++)
      if (c = c[i[l]], typeof c == "object") {
        if (c !== null && "lat" in c && "lon" in c && typeof c.lat == "number" && typeof c.lon == "number") {
          c = n[r] = c;
          break;
        } else if (!Array.isArray(c) && c !== null && l === a - 1) {
          c = void 0;
          break;
        }
      } else if ((c === null || typeof c != "object") && l < a - 1) {
        c = void 0;
        break;
      }
    typeof c < "u" && (n[r] = c);
  }
  return n;
}
async function ie(e, t) {
  return (await Ue(e, [
    t
  ]))[t];
}
const It = {
  cm: 0.01,
  m: 1,
  km: 1e3,
  ft: 0.3048,
  yd: 0.9144,
  mi: 1609.344
};
function mt(e, t) {
  const n = It[t];
  if (n === void 0)
    throw new Error(v("INVALID_DISTANCE_SUFFIX", e).message);
  return e * n;
}
function ze(e, t) {
  e.hits = e.hits.map((n) => ({
    ...n,
    document: {
      ...n.document,
      // Remove embeddings from the result
      ...t.reduce((s, o) => {
        const r = o.split("."), i = r.pop();
        let c = s;
        for (const a of r)
          c[a] = c[a] ?? {}, c = c[a];
        return c[i] = null, s;
      }, n.document)
    }
  }));
}
const bt = xe.join(`
 - `), St = {
  NO_LANGUAGE_WITH_CUSTOM_TOKENIZER: "Do not pass the language option to create when using a custom tokenizer.",
  LANGUAGE_NOT_SUPPORTED: `Language "%s" is not supported.
Supported languages are:
 - ${bt}`,
  INVALID_STEMMER_FUNCTION_TYPE: "config.stemmer property must be a function.",
  MISSING_STEMMER: 'As of version 1.0.0 @orama/orama does not ship non English stemmers by default. To solve this, please explicitly import and specify the "%s" stemmer from the package @orama/stemmers. See https://docs.oramasearch.com/open-source/text-analysis/stemming for more information.',
  CUSTOM_STOP_WORDS_MUST_BE_FUNCTION_OR_ARRAY: "Custom stop words array must only contain strings.",
  UNSUPPORTED_COMPONENT: 'Unsupported component "%s".',
  COMPONENT_MUST_BE_FUNCTION: 'The component "%s" must be a function.',
  COMPONENT_MUST_BE_FUNCTION_OR_ARRAY_FUNCTIONS: 'The component "%s" must be a function or an array of functions.',
  INVALID_SCHEMA_TYPE: 'Unsupported schema type "%s" at "%s". Expected "string", "boolean" or "number" or array of them.',
  DOCUMENT_ID_MUST_BE_STRING: 'Document id must be of type "string". Got "%s" instead.',
  DOCUMENT_ALREADY_EXISTS: 'A document with id "%s" already exists.',
  DOCUMENT_DOES_NOT_EXIST: 'A document with id "%s" does not exists.',
  MISSING_DOCUMENT_PROPERTY: 'Missing searchable property "%s".',
  INVALID_DOCUMENT_PROPERTY: 'Invalid document property "%s": expected "%s", got "%s"',
  UNKNOWN_INDEX: 'Invalid property name "%s". Expected a wildcard string ("*") or array containing one of the following properties: %s',
  INVALID_BOOST_VALUE: "Boost value must be a number greater than, or less than 0.",
  INVALID_FILTER_OPERATION: "You can only use one operation per filter, you requested %d.",
  SCHEMA_VALIDATION_FAILURE: 'Cannot insert document due schema validation failure on "%s" property.',
  INVALID_SORT_SCHEMA_TYPE: 'Unsupported sort schema type "%s" at "%s". Expected "string" or "number".',
  CANNOT_SORT_BY_ARRAY: 'Cannot configure sort for "%s" because it is an array (%s).',
  UNABLE_TO_SORT_ON_UNKNOWN_FIELD: 'Unable to sort on unknown field "%s". Allowed fields: %s',
  SORT_DISABLED: "Sort is disabled. Please read the documentation at https://docs.oramasearch for more information.",
  UNKNOWN_GROUP_BY_PROPERTY: 'Unknown groupBy property "%s".',
  INVALID_GROUP_BY_PROPERTY: 'Invalid groupBy property "%s". Allowed types: "%s", but given "%s".',
  UNKNOWN_FILTER_PROPERTY: 'Unknown filter property "%s".',
  INVALID_VECTOR_SIZE: 'Vector size must be a number greater than 0. Got "%s" instead.',
  INVALID_VECTOR_VALUE: 'Vector value must be a number greater than 0. Got "%s" instead.',
  INVALID_INPUT_VECTOR: `Property "%s" was declared as a %s-dimensional vector, but got a %s-dimensional vector instead.
Input vectors must be of the size declared in the schema, as calculating similarity between vectors of different sizes can lead to unexpected results.`,
  WRONG_SEARCH_PROPERTY_TYPE: 'Property "%s" is not searchable. Only "string" properties are searchable.',
  FACET_NOT_SUPPORTED: `Facet doens't support the type "%s".`,
  INVALID_DISTANCE_SUFFIX: 'Invalid distance suffix "%s". Valid suffixes are: cm, m, km, mi, yd, ft.',
  INVALID_SEARCH_MODE: 'Invalid search mode "%s". Valid modes are: "fulltext", "vector", "hybrid".',
  MISSING_VECTOR_AND_SECURE_PROXY: "No vector was provided and no secure proxy was configured. Please provide a vector or configure an Orama Secure Proxy to perform hybrid search.",
  MISSING_TERM: '"term" is a required parameter when performing hybrid search. Please provide a search term.',
  INVALID_VECTOR_INPUT: 'Invalid "vector" property. Expected an object with "value" and "property" properties, but got "%s" instead.',
  PLUGIN_CRASHED: "A plugin crashed during initialization. Please check the error message for more information:"
};
function v(e, ...t) {
  const n = new Error(ht(St[e] ?? `Unsupported Orama Error code: ${e}`, ...t));
  return n.code = e, "captureStackTrace" in Error.prototype && Error.captureStackTrace(n), n;
}
async function Dt(e) {
  return {
    raw: Number(e),
    formatted: await oe(e)
  };
}
async function Tt(e) {
  if (e.id) {
    if (typeof e.id != "string")
      throw v("DOCUMENT_ID_MUST_BE_STRING", typeof e.id);
    return e.id;
  }
  return await Ce();
}
async function je(e, t) {
  for (const [n, s] of Object.entries(t)) {
    const o = e[n];
    if (!(typeof o > "u") && !(s === "geopoint" && typeof o == "object" && typeof o.lon == "number" && typeof o.lat == "number") && !(s === "enum" && (typeof o == "string" || typeof o == "number"))) {
      if (s === "enum[]" && Array.isArray(o)) {
        const r = o.length;
        for (let i = 0; i < r; i++)
          if (typeof o[i] != "string" && typeof o[i] != "number")
            return n + "." + i;
        continue;
      }
      if ($(s)) {
        const r = Be(s);
        if (!Array.isArray(o) || o.length !== r)
          throw v("INVALID_INPUT_VECTOR", n, r, o.length);
        continue;
      }
      if (ce(s)) {
        if (!Array.isArray(o))
          return n;
        const r = ae(s), i = o.length;
        for (let c = 0; c < i; c++)
          if (typeof o[c] !== r)
            return n + "." + c;
        continue;
      }
      if (typeof s == "object") {
        if (!o || typeof o != "object")
          return n;
        const r = await je(o, s);
        if (r)
          return n + "." + r;
        continue;
      }
      if (typeof o !== s)
        return n;
    }
  }
}
const vt = {
  string: !1,
  number: !1,
  boolean: !1,
  enum: !1,
  geopoint: !1,
  "string[]": !0,
  "number[]": !0,
  "boolean[]": !0,
  "enum[]": !0
}, wt = {
  "string[]": "string",
  "number[]": "number",
  "boolean[]": "boolean",
  "enum[]": "enum"
};
function $(e) {
  return typeof e == "string" && /^vector\[\d+\]$/.test(e);
}
function ce(e) {
  return typeof e == "string" && vt[e];
}
function ae(e) {
  return wt[e];
}
function Be(e) {
  const t = Number(e.slice(7, -1));
  switch (!0) {
    case isNaN(t):
      throw v("INVALID_VECTOR_VALUE", e);
    case t <= 0:
      throw v("INVALID_VECTOR_SIZE", e);
    default:
      return t;
  }
}
function Ot() {
  return {
    idToInternalId: /* @__PURE__ */ new Map(),
    internalIdToId: [],
    save: At,
    load: _t
  };
}
function At(e) {
  return {
    internalIdToId: e.internalIdToId
  };
}
function _t(e, t) {
  const { internalIdToId: n } = t;
  e.internalDocumentIDStore.idToInternalId.clear(), e.internalDocumentIDStore.internalIdToId = [];
  for (let s = 0; s < n.length; s++)
    e.internalDocumentIDStore.idToInternalId.set(n[s], s + 1), e.internalDocumentIDStore.internalIdToId.push(n[s]);
}
function N(e, t) {
  if (typeof t == "string") {
    const n = e.idToInternalId.get(t);
    if (n)
      return n;
    const s = e.idToInternalId.size + 1;
    return e.idToInternalId.set(t, s), e.internalIdToId.push(t), s;
  }
  return t > e.internalIdToId.length ? N(e, t.toString()) : t;
}
function Z(e, t) {
  if (e.internalIdToId.length < t)
    throw new Error(`Invalid internalId ${t}`);
  return e.internalIdToId[t - 1];
}
async function Et(e, t) {
  return {
    sharedInternalDocumentStore: t,
    docs: {},
    count: 0
  };
}
async function Pt(e, t) {
  const n = N(e.sharedInternalDocumentStore, t);
  return e.docs[n];
}
async function Nt(e, t) {
  const n = Array.from({
    length: t.length
  });
  for (let s = 0; s < t.length; s++) {
    const o = N(e.sharedInternalDocumentStore, t[s]);
    n[s] = e.docs[o];
  }
  return n;
}
async function kt(e) {
  return e.docs;
}
async function Rt(e, t, n) {
  const s = N(e.sharedInternalDocumentStore, t);
  return typeof e.docs[s] < "u" ? !1 : (e.docs[s] = n, e.count++, !0);
}
async function Lt(e, t) {
  const n = N(e.sharedInternalDocumentStore, t);
  return typeof e.docs[n] > "u" ? !1 : (delete e.docs[n], e.count--, !0);
}
async function Mt(e) {
  return e.count;
}
async function xt(e, t) {
  const n = t;
  return {
    docs: n.docs,
    count: n.count,
    sharedInternalDocumentStore: e
  };
}
async function Ct(e) {
  return {
    docs: e.docs,
    count: e.count
  };
}
async function Ut() {
  return {
    create: Et,
    get: Pt,
    getMultiple: Nt,
    getAll: kt,
    store: Rt,
    remove: Lt,
    count: Mt,
    load: xt,
    save: Ct
  };
}
const zt = [
  "beforeInsert",
  "afterInsert",
  "beforeRemove",
  "afterRemove",
  "beforeUpdate",
  "afterUpdate",
  "beforeSearch",
  "afterSearch",
  "beforeInsertMultiple",
  "afterInsertMultiple",
  "beforeRemoveMultiple",
  "afterRemoveMultiple",
  "beforeUpdateMultiple",
  "afterUpdateMultiple",
  "beforeLoad",
  "afterLoad"
];
async function jt(e, t) {
  var n;
  const s = [], o = (n = e.plugins) === null || n === void 0 ? void 0 : n.length;
  if (!o)
    return s;
  for (let r = 0; r < o; r++)
    try {
      const i = await e.plugins[r];
      typeof i[t] == "function" && s.push(i[t]);
    } catch (i) {
      throw console.error("Caught error in getAllPluginsByHook:", i), v("PLUGIN_CRASHED");
    }
  return s;
}
const Bt = [
  "tokenizer",
  "index",
  "documentsStore",
  "sorter"
], Se = [
  "validateSchema",
  "getDocumentIndexId",
  "getDocumentProperties",
  "formatElapsedTime"
];
async function le(e, t, n, s, o) {
  const r = e.length;
  for (let i = 0; i < r; i++)
    await e[i](t, n, s, o);
}
async function ue(e, t, n, s) {
  const o = e.length;
  for (let r = 0; r < o; r++)
    await e[r](t, n, s);
}
function ee(e) {
  const t = e.r;
  return e.r = t.l, t.l = e, e.h = Math.max(R(e.l), R(e.r)) + 1, t.h = Math.max(R(t.l), R(t.r)) + 1, t;
}
function te(e) {
  const t = e.l;
  return e.l = t.r, t.r = e, e.h = Math.max(R(e.l), R(e.r)) + 1, t.h = Math.max(R(t.l), R(t.r)) + 1, t;
}
function Wt(e, t, n) {
  const s = [];
  function o(r) {
    r !== null && (t < r.k && o(r.l), r.k >= t && r.k <= n && P(s, r.v), n > r.k && o(r.r));
  }
  return o(e.root), s;
}
function De(e, t, n = !1) {
  const s = [];
  function o(r) {
    r !== null && (n && r.k >= t && P(s, r.v), !n && r.k > t && P(s, r.v), o(r.l), o(r.r));
  }
  return o(e.root), s;
}
function Te(e, t, n = !1) {
  const s = [];
  function o(r) {
    r !== null && (n && r.k <= t && P(s, r.v), !n && r.k < t && P(s, r.v), o(r.l), o(r.r));
  }
  return o(e.root), s;
}
function We(e, t) {
  for (; e !== null; )
    if (t < e.k)
      e = e.l;
    else if (t > e.k)
      e = e.r;
    else
      return e;
  return null;
}
function Ft(e, t) {
  return {
    root: {
      k: e,
      v: t,
      l: null,
      r: null,
      h: 0
    }
  };
}
function Vt(e, t, n) {
  function s(o, r, i) {
    if (o === null)
      return {
        k: r,
        v: i,
        l: null,
        r: null,
        h: 0
      };
    if (r < o.k)
      o.l = s(o.l, r, i);
    else if (r > o.k)
      o.r = s(o.r, r, i);
    else {
      for (const a of i)
        o.v.push(a);
      return o;
    }
    o.h = 1 + Math.max(R(o.l), R(o.r));
    const c = R(o.l) - R(o.r);
    return c > 1 && r < o.l.k ? te(o) : c < -1 && r > o.r.k ? ee(o) : c > 1 && r > o.l.k ? (o.l = ee(o.l), te(o)) : c < -1 && r < o.r.k ? (o.r = te(o.r), ee(o)) : o;
  }
  e.root = s(e.root, t, n);
}
function R(e) {
  return e !== null ? e.h : -1;
}
function $t(e, t) {
  const n = We(e.root, t);
  return n === null ? null : n.v;
}
function qt(e, t) {
  if (e === null || e.root === null)
    return;
  let n = e.root, s = null;
  for (; n != null && n.k !== t; )
    s = n, t < n.k ? n = n.l : n = n.r;
  if (n === null)
    return;
  (() => {
    if (n.l === null && n.r === null)
      s === null ? e.root = null : s.l === n ? s.l = null : s.r = null;
    else if (n.l != null && n.r != null) {
      let r = n.r, i = n;
      for (; r.l != null; )
        i = r, r = r.l;
      n.k = r.k, i === n ? i.r = r.r : i.l = r.r;
    } else {
      const r = n.l != null ? n.l : n.r;
      s === null ? e.root = r : s.l === n ? s.l = r : s.r = r;
    }
  })();
}
function Yt(e, t, n) {
  const s = We(e.root, n);
  if (s) {
    if (s.v.length === 1) {
      qt(e, n);
      return;
    }
    s.v.splice(s.v.indexOf(t), 1);
  }
}
function Gt() {
  return {
    numberToDocumentId: /* @__PURE__ */ new Map()
  };
}
function Kt(e, t, n) {
  return e.numberToDocumentId.has(t) ? (e.numberToDocumentId.get(t).push(n), e) : (e.numberToDocumentId.set(t, [
    n
  ]), e);
}
function Ht(e, t, n) {
  var s, o;
  e == null || e.numberToDocumentId.set(n, ((s = e == null ? void 0 : e.numberToDocumentId.get(n)) === null || s === void 0 ? void 0 : s.filter((r) => r !== t)) ?? []), ((o = e == null ? void 0 : e.numberToDocumentId.get(n)) === null || o === void 0 ? void 0 : o.length) === 0 && (e == null || e.numberToDocumentId.delete(n));
}
function Xt(e, t) {
  const n = Object.keys(t);
  if (n.length !== 1)
    throw new Error("Invalid operation");
  const s = n[0];
  switch (s) {
    case "eq": {
      const o = t[s];
      return e.numberToDocumentId.get(o) ?? [];
    }
    case "in": {
      const o = t[s], r = [];
      for (const i of o) {
        const c = e.numberToDocumentId.get(i);
        c != null && P(r, c);
      }
      return r;
    }
    case "nin": {
      const o = t[s], r = [], i = e.numberToDocumentId.keys();
      for (const c of i) {
        if (o.includes(c))
          continue;
        const a = e.numberToDocumentId.get(c);
        a != null && P(r, a);
      }
      return r;
    }
  }
  throw new Error("Invalid operation");
}
function Zt(e, t) {
  const n = Object.keys(t);
  if (n.length !== 1)
    throw new Error("Invalid operation");
  const s = n[0];
  switch (s) {
    case "containsAll": {
      const r = t[s].map((i) => e.numberToDocumentId.get(i) ?? []);
      return re(r);
    }
  }
  throw new Error("Invalid operation");
}
function Jt(e, t, n) {
  if (e === t)
    return 0;
  const s = e;
  e.length > t.length && (e = t, t = s);
  let o = e.length, r = t.length, i = 0;
  for (; i < o && e.charCodeAt(i) === t.charCodeAt(i); )
    i++;
  if (i === o)
    return 0;
  for (; o > 0 && e.charCodeAt(~-o) === t.charCodeAt(~-r); )
    o--, r--;
  if (!o)
    return r > n ? -1 : r;
  if (o -= i, r -= i, o <= n && r <= n)
    return o > r ? o : r;
  const c = r - o;
  if (n > r)
    n = r;
  else if (c > n)
    return -1;
  let a = 0;
  const l = [], f = [];
  for (; a < n; )
    f[a] = t.charCodeAt(i + a), l[a] = ++a;
  for (; a < r; )
    f[a] = t.charCodeAt(i + a), l[a++] = n + 1;
  const u = n - c, d = n < r;
  let h = 0, p = n, g = 0, y = 0, I = 0, m = 0, S = 0;
  for (a = 0; a < o; a++) {
    for (y = a, g = a + 1, m = e.charCodeAt(i + a), h += a > u ? 1 : 0, p += p < r ? 1 : 0, S = h; S < p; S++)
      I = g, g = y, y = l[S], m !== f[S] && (y < g && (g = y), I < g && (g = I), g++), l[S] = g;
    if (d && l[a + c] > n)
      return -1;
  }
  return g <= n ? g : -1;
}
function Fe(e, t, n) {
  const s = Jt(e, t, n);
  return {
    distance: s,
    isBounded: s >= 0
  };
}
class Qt {
  constructor(t, n, s) {
    // Node children
    Y(this, "c", {});
    // Node documents
    Y(this, "d", []);
    // Node word
    Y(this, "w", "");
    this.k = t, this.s = n, this.e = s;
  }
  toJSON() {
    return {
      w: this.w,
      s: this.s,
      c: this.c,
      d: this.d,
      e: this.e
    };
  }
}
function B(e, t) {
  e.w = t.w + e.s;
}
function G(e, t) {
  e.d.push(t);
}
function en(e, t) {
  const n = e.d.indexOf(t);
  return n === -1 ? !1 : (e.d.splice(n, 1), !0);
}
function fe(e, t, n, s, o) {
  if (e.e) {
    const { w: r, d: i } = e;
    if (s && r !== n)
      return {};
    if (H(t, r) == null && (o ? Math.abs(n.length - r.length) <= o && Fe(n, r, o).isBounded && (t[r] = []) : t[r] = []), H(t, r) != null && i.length > 0) {
      const c = new Set(t[r]), a = i.length;
      for (let l = 0; l < a; l++)
        c.add(i[l]);
      t[r] = Array.from(c);
    }
  }
  for (const r of Object.keys(e.c))
    fe(e.c[r], t, n, s, o);
  return t;
}
function Ve(e, t) {
  let n = "";
  const s = Math.min(e.length, t.length);
  for (let o = 0; o < s; o++) {
    if (e[o] !== t[o])
      return n;
    n += e[o];
  }
  return n;
}
function W(e = !1, t = "", n = "") {
  return new Qt(n, t, e);
}
function tn(e, t, n) {
  const s = t.length;
  for (let o = 0; o < s; o++) {
    const r = t[o], i = t.substring(o), c = e.c[r];
    if (c) {
      const a = c.s, l = a.length, f = Ve(a, i), u = f.length;
      if (a === i) {
        G(c, n), c.e = !0;
        return;
      }
      const d = a[u];
      if (u < l && u === i.length) {
        const h = W(!0, i, r);
        h.c[d] = c;
        const p = h.c[d];
        p.s = a.substring(u), p.k = d, e.c[r] = h, B(h, e), B(p, h), G(h, n);
        return;
      }
      if (u < l && u < i.length) {
        const h = W(!1, f, r);
        h.c[d] = c, e.c[r] = h;
        const p = h.c[d];
        p.s = a.substring(u), p.k = d;
        const g = i[u], y = W(!0, t.substring(o + u), g);
        G(y, n), h.c[g] = y, B(h, e), B(y, h), B(p, h);
        return;
      }
      o += l - 1, e = c;
    } else {
      const a = W(!0, i, r);
      G(a, n), e.c[r] = a, B(a, e);
      return;
    }
  }
}
function F(e, t, n, s, o, r) {
  if (!(s < 0)) {
    if (e.w.startsWith(t)) {
      fe(e, r, t, !1, 0);
      return;
    }
    if (e.e) {
      const { w: i, d: c } = e;
      if (i && (Fe(t, i, o).isBounded && (r[i] = []), H(r, i) != null && c.length > 0)) {
        const a = new Set(r[i]), l = c.length;
        for (let f = 0; f < l; f++)
          a.add(c[f]);
        r[i] = Array.from(a);
      }
    }
    if (!(n >= t.length)) {
      t[n] in e.c && F(e.c[t[n]], t, n + 1, s, o, r), F(e, t, n + 1, s - 1, o, r);
      for (const i in e.c)
        F(e.c[i], t, n, s - 1, o, r);
      for (const i in e.c)
        i !== t[n] && F(e.c[i], t, n + 1, s - 1, o, r);
    }
  }
}
function $e(e, { term: t, exact: n, tolerance: s }) {
  if (s && !n) {
    const o = {};
    return s = s || 0, F(e, t, 0, s || 0, s, o), o;
  } else {
    const o = t.length;
    for (let i = 0; i < o; i++) {
      const c = t[i];
      if (c in e.c) {
        const a = e.c[c], l = a.s, f = t.substring(i), d = Ve(l, f).length;
        if (d !== l.length && d !== f.length) {
          if (s)
            break;
          return {};
        }
        i += a.s.length - 1, e = a;
      } else
        return {};
    }
    const r = {};
    return fe(e, r, t, n, s), r;
  }
}
function nn(e, t, n, s = !0) {
  if (!t)
    return !0;
  const o = t.length;
  for (let r = 0; r < o; r++) {
    const i = t[r];
    if (i in e.c) {
      const c = e.c[i];
      r += c.s.length - 1, e = c, s && e.w !== t || en(e, n);
    } else
      return !1;
  }
  return !0;
}
const qe = 2, sn = 6371e3;
function on() {
  return {
    root: null
  };
}
function rn(e, t, n) {
  const s = {
    point: t,
    docIDs: n
  };
  if (e.root == null) {
    e.root = s;
    return;
  }
  let o = e.root, r = 0;
  for (; o !== null; ) {
    if (o.point.lon === t.lon && o.point.lat === t.lat) {
      const c = o.docIDs ?? [];
      o.docIDs = Array.from(/* @__PURE__ */ new Set([
        ...c,
        ...n || []
      ]));
      return;
    }
    if (r % qe === 0)
      if (t.lon < o.point.lon) {
        if (o.left == null) {
          o.left = s;
          return;
        }
        o = o.left;
      } else {
        if (o.right == null) {
          o.right = s;
          return;
        }
        o = o.right;
      }
    else if (t.lat < o.point.lat) {
      if (o.left == null) {
        o.left = s;
        return;
      }
      o = o.left;
    } else {
      if (o.right == null) {
        o.right = s;
        return;
      }
      o = o.right;
    }
    r++;
  }
}
function cn(e, t, n) {
  let s = e.root, o = 0, r = null, i = null;
  for (; s !== null; ) {
    if ((s == null ? void 0 : s.point.lon) === t.lon && s.point.lat === t.lat) {
      var c;
      const f = (c = s.docIDs) === null || c === void 0 ? void 0 : c.indexOf(n);
      if (f !== void 0 && f > -1) {
        var a;
        (a = s.docIDs) === null || a === void 0 || a.splice(f, 1), (s.docIDs == null || s.docIDs.length === 0) && (r != null ? i === "left" ? r.left = s.left !== null ? s.left : s.right : i === "right" && (r.right = s.right !== null ? s.right : s.left) : e.root = s.left !== null ? s.left : s.right);
        return;
      }
    }
    const l = o % qe;
    r = s, l === 0 ? t.lon < s.point.lon ? (s = s == null ? void 0 : s.left, i = "left") : (s = s == null ? void 0 : s.right, i = "right") : t.lat < s.point.lat ? (s = s == null ? void 0 : s.left, i = "left") : (s = s == null ? void 0 : s.right, i = "right"), o++;
  }
}
function an(e, t, n, s = !0, o = "asc", r = !1) {
  const i = r ? Ge : Ye, c = [
    {
      node: e,
      depth: 0
    }
  ], a = [];
  for (; c.length > 0; ) {
    const { node: l, depth: f } = c.pop();
    if (l === null)
      continue;
    const u = i(t, l.point);
    (s ? u <= n : u > n) && a.push({
      point: l.point,
      docIDs: l.docIDs ?? []
    }), l.left != null && c.push({
      node: l.left,
      depth: f + 1
    }), l.right != null && c.push({
      node: l.right,
      depth: f + 1
    });
  }
  return o && a.sort((l, f) => {
    const u = i(t, l.point), d = i(t, f.point);
    return o.toLowerCase() === "asc" ? u - d : d - u;
  }), a;
}
function ln(e, t, n = !0, s = null, o = !1) {
  const r = [
    {
      node: e,
      depth: 0
    }
  ], i = [];
  for (; r.length > 0; ) {
    const a = r.pop();
    if (a == null || a.node == null)
      continue;
    const { node: l, depth: f } = a, u = f + 1;
    l.left != null && r.push({
      node: l.left,
      depth: u
    }), l.right != null && r.push({
      node: l.right,
      depth: u
    });
    const d = fn(t, l.point);
    d && n ? i.push({
      point: l.point,
      docIDs: l.docIDs ?? []
    }) : !d && !n && i.push({
      point: l.point,
      docIDs: l.docIDs ?? []
    });
  }
  const c = un(t);
  if (s) {
    const a = o ? Ge : Ye;
    i.sort((l, f) => {
      const u = a(c, l.point), d = a(c, f.point);
      return s.toLowerCase() === "asc" ? u - d : d - u;
    });
  }
  return i;
}
function un(e) {
  let t = 0, n = 0, s = 0;
  const o = e.length;
  for (let i = 0, c = o - 1; i < o; c = i++) {
    const a = e[i].lon, l = e[i].lat, f = e[c].lon, u = e[c].lat, d = a * u - f * l;
    t += d, n += (a + f) * d, s += (l + u) * d;
  }
  t /= 2;
  const r = 6 * t;
  return n /= r, s /= r, {
    lon: n,
    lat: s
  };
}
function fn(e, t) {
  let n = !1;
  const s = t.lon, o = t.lat, r = e.length;
  for (let i = 0, c = r - 1; i < r; c = i++) {
    const a = e[i].lon, l = e[i].lat, f = e[c].lon, u = e[c].lat;
    l > o != u > o && s < (f - a) * (o - l) / (u - l) + a && (n = !n);
  }
  return n;
}
function Ye(e, t) {
  const n = Math.PI / 180, s = e.lat * n, o = t.lat * n, r = (t.lat - e.lat) * n, i = (t.lon - e.lon) * n, c = Math.sin(r / 2) * Math.sin(r / 2) + Math.cos(s) * Math.cos(o) * Math.sin(i / 2) * Math.sin(i / 2), a = 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c));
  return sn * a;
}
function Ge(e, t) {
  const s = 0.0033528106647474805, o = (1 - s) * 6378137, r = Math.PI / 180, i = e.lat * r, c = t.lat * r, a = (t.lon - e.lon) * r, l = Math.atan((1 - s) * Math.tan(i)), f = Math.atan((1 - s) * Math.tan(c)), u = Math.sin(l), d = Math.cos(l), h = Math.sin(f), p = Math.cos(f);
  let g = a, y, I = 1e3, m, S, T, w, D;
  do {
    const E = Math.sin(g), L = Math.cos(g);
    T = Math.sqrt(p * E * (p * E) + (d * h - u * p * L) * (d * h - u * p * L)), w = u * h + d * p * L, D = Math.atan2(T, w), m = d * p * E / T, S = 1 - m * m;
    const M = w - 2 * u * h / S, z = s / 16 * S * (4 + s * (4 - 3 * S));
    y = g, g = a + (1 - z) * s * m * (D + z * T * (M + z * w * (-1 + 2 * M * M)));
  } while (Math.abs(g - y) > 1e-12 && --I > 0);
  const b = S * (6378137 * 6378137 - o * o) / (o * o), A = 1 + b / 16384 * (4096 + b * (-768 + b * (320 - 175 * b))), _ = b / 1024 * (256 + b * (-128 + b * (74 - 47 * b))), O = _ * T * (w - 2 * u * h / S + _ / 4 * (w * (-1 + 2 * T * T) - _ / 6 * D * (-3 + 4 * T * T) * (-3 + 4 * D * D)));
  return o * A * (D - O);
}
function Ke(e, t, n = 1, s) {
  if (t === 0)
    throw v("INVALID_BOOST_VALUE");
  const o = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map(), i = e.length;
  for (let p = 0; p < i; p++) {
    const g = e[p], y = g.length;
    for (let I = 0; I < y; I++) {
      const [m, S] = g[I], T = S * t, w = o.get(m);
      w !== void 0 ? (o.set(m, w * 1.5 + T), r.set(m, r.get(m) + 1)) : (o.set(m, T), r.set(m, 1));
    }
  }
  const c = [];
  for (const p of o.entries())
    c.push(p);
  const a = c.sort((p, g) => g[1] - p[1]);
  if (n === 1)
    return a;
  const l = a.length, f = [];
  for (const p of r.entries())
    f.push(p);
  const u = f.sort((p, g) => g[1] - p[1]);
  let d;
  for (let p = 0; p < l && u[p][1] === s; p++)
    d = p;
  if (typeof d > "u") {
    if (n === 0)
      return [];
    d = 0;
  }
  if (n === 0)
    return a.slice(0, d + 1);
  const h = d + Math.ceil(n * 100 * (a.length - d) / 100);
  return a.slice(0, a.length + h);
}
function dn(e, t, n, s, o, r) {
  const { k: i, b: c, d: a } = r;
  return Math.log(1 + (n - t + 0.5) / (t + 0.5)) * (a + e * (i + 1)) / (e + i * (1 - c + c * s / o));
}
function He(e, t) {
  let n = 0;
  for (let s = 0; s < t; s++)
    n += e[s] * e[s];
  return Math.sqrt(n);
}
function Xe(e, t, n, s = 0.8) {
  const o = He(e, n), r = [];
  for (const [i, [c, a]] of Object.entries(t)) {
    let l = 0;
    for (let u = 0; u < n; u++)
      l += e[u] * a[u];
    const f = l / (o * c);
    f >= s && r.push([
      i,
      f
    ]);
  }
  return r.sort((i, c) => c[1] - i[1]);
}
async function hn(e, t, n, s, o) {
  const r = N(e.sharedInternalDocumentStore, n);
  e.avgFieldLength[t] = ((e.avgFieldLength[t] ?? 0) * (o - 1) + s.length) / o, e.fieldLengths[t][r] = s.length, e.frequencies[t][r] = {};
}
async function pn(e, t, n, s, o) {
  let r = 0;
  for (const a of s)
    a === o && r++;
  const i = N(e.sharedInternalDocumentStore, n), c = r / s.length;
  e.frequencies[t][i][o] = c, o in e.tokenOccurrences[t] || (e.tokenOccurrences[t][o] = 0), e.tokenOccurrences[t][o] = (e.tokenOccurrences[t][o] ?? 0) + 1;
}
async function gn(e, t, n, s) {
  const o = N(e.sharedInternalDocumentStore, n);
  e.avgFieldLength[t] = (e.avgFieldLength[t] * s - e.fieldLengths[t][o]) / (s - 1), e.fieldLengths[t][o] = void 0, e.frequencies[t][o] = void 0;
}
async function yn(e, t, n) {
  e.tokenOccurrences[t][n]--;
}
async function In(e, t, n, s, o) {
  const r = Array.from(o), i = t.avgFieldLength[n], c = t.fieldLengths[n], a = t.tokenOccurrences[n], l = t.frequencies[n], f = typeof a[s] == "number" ? a[s] ?? 0 : 0, u = [], d = r.length;
  for (let p = 0; p < d; p++) {
    var h;
    const g = N(t.sharedInternalDocumentStore, r[p]), y = (l == null || (h = l[g]) === null || h === void 0 ? void 0 : h[s]) ?? 0, I = dn(y, f, e.docsCount, c[g], i, e.params.relevance);
    u.push([
      g,
      I
    ]);
  }
  return u;
}
async function Ze(e, t, n, s, o = "") {
  s || (s = {
    sharedInternalDocumentStore: t,
    indexes: {},
    vectorIndexes: {},
    searchableProperties: [],
    searchablePropertiesWithTypes: {},
    frequencies: {},
    tokenOccurrences: {},
    avgFieldLength: {},
    fieldLengths: {}
  });
  for (const [r, i] of Object.entries(n)) {
    const c = `${o}${o ? "." : ""}${r}`;
    if (typeof i == "object" && !Array.isArray(i)) {
      Ze(e, t, i, s, c);
      continue;
    }
    if ($(i))
      s.searchableProperties.push(c), s.searchablePropertiesWithTypes[c] = i, s.vectorIndexes[c] = {
        size: Be(i),
        vectors: {}
      };
    else {
      const a = /\[/.test(i);
      switch (i) {
        case "boolean":
        case "boolean[]":
          s.indexes[c] = {
            type: "Bool",
            node: {
              true: [],
              false: []
            },
            isArray: a
          };
          break;
        case "number":
        case "number[]":
          s.indexes[c] = {
            type: "AVL",
            node: Ft(0, []),
            isArray: a
          };
          break;
        case "string":
        case "string[]":
          s.indexes[c] = {
            type: "Radix",
            node: W(),
            isArray: a
          }, s.avgFieldLength[c] = 0, s.frequencies[c] = {}, s.tokenOccurrences[c] = {}, s.fieldLengths[c] = {};
          break;
        case "enum":
        case "enum[]":
          s.indexes[c] = {
            type: "Flat",
            node: Gt(),
            isArray: a
          };
          break;
        case "geopoint":
          s.indexes[c] = {
            type: "BKD",
            node: on(),
            isArray: a
          };
          break;
        default:
          throw v("INVALID_SCHEMA_TYPE", Array.isArray(i) ? "array" : i, c);
      }
      s.searchableProperties.push(c), s.searchablePropertiesWithTypes[c] = i;
    }
  }
  return s;
}
async function ve(e, t, n, s, o, r, i, c, a) {
  const l = N(t.sharedInternalDocumentStore, s), { type: f, node: u } = t.indexes[n];
  switch (f) {
    case "Bool": {
      u[o ? "true" : "false"].push(l);
      break;
    }
    case "AVL": {
      Vt(u, o, [
        l
      ]);
      break;
    }
    case "Radix": {
      const d = await c.tokenize(o, i, n);
      await e.insertDocumentScoreParameters(t, n, l, d, a);
      for (const h of d)
        await e.insertTokenScoreParameters(t, n, l, d, h), tn(u, h, l);
      break;
    }
    case "Flat": {
      Kt(u, o, l);
      break;
    }
    case "BKD": {
      rn(u, o, [
        l
      ]);
      break;
    }
  }
}
async function mn(e, t, n, s, o, r, i, c, a) {
  if ($(r))
    return bn(t, n, o, s);
  if (!ce(r))
    return ve(e, t, n, s, o, r, i, c, a);
  const l = ae(r), f = o, u = f.length;
  for (let d = 0; d < u; d++)
    await ve(e, t, n, s, f[d], l, i, c, a);
}
function bn(e, t, n, s) {
  n instanceof Float32Array || (n = new Float32Array(n));
  const o = e.vectorIndexes[t].size, r = He(n, o);
  e.vectorIndexes[t].vectors[s] = [
    r,
    n
  ];
}
async function we(e, t, n, s, o, r, i, c, a) {
  const l = N(t.sharedInternalDocumentStore, s);
  if ($(r))
    return delete t.vectorIndexes[n].vectors[s], !0;
  const { type: f, node: u } = t.indexes[n];
  switch (f) {
    case "AVL":
      return Yt(u, l, o), !0;
    case "Bool": {
      const h = u[o ? "true" : "false"].indexOf(l);
      return u[o ? "true" : "false"].splice(h, 1), !0;
    }
    case "Radix": {
      const d = await c.tokenize(o, i, n);
      await e.removeDocumentScoreParameters(t, n, s, a);
      for (const h of d)
        await e.removeTokenScoreParameters(t, n, h), nn(u, h, l);
      return !0;
    }
    case "Flat":
      return Ht(u, l, o), !0;
    case "BKD":
      return cn(u, o, l), !1;
  }
}
async function Sn(e, t, n, s, o, r, i, c, a) {
  if (!ce(r))
    return we(e, t, n, s, o, r, i, c, a);
  const l = ae(r), f = o, u = f.length;
  for (let d = 0; d < u; d++)
    await we(e, t, n, s, f[d], l, i, c, a);
  return !0;
}
async function Dn(e, t, n, s) {
  if (!(n in t.tokenOccurrences))
    return [];
  const { node: o, type: r } = t.indexes[n];
  if (r !== "Radix")
    throw v("WRONG_SEARCH_PROPERTY_TYPE", n);
  const { exact: i, tolerance: c } = e.params, a = $e(o, {
    term: s,
    exact: i,
    tolerance: c
  }), l = /* @__PURE__ */ new Set();
  for (const f in a)
    if (H(a, f))
      for (const d of a[f])
        l.add(d);
  return e.index.calculateResultScores(e, t, n, s, Array.from(l));
}
async function Tn(e, t, n) {
  const s = Object.keys(n), o = s.reduce((i, c) => ({
    [c]: [],
    ...i
  }), {});
  for (const i of s) {
    const c = n[i];
    if (typeof t.indexes[i] > "u")
      throw v("UNKNOWN_FILTER_PROPERTY", i);
    const { node: a, type: l, isArray: f } = t.indexes[i];
    if (l === "Bool") {
      const h = a[c.toString()];
      P(o[i], h);
      continue;
    }
    if (l === "BKD") {
      let d;
      if ("radius" in c)
        d = "radius";
      else if ("polygon" in c)
        d = "polygon";
      else
        throw new Error(`Invalid operation ${c}`);
      if (d === "radius") {
        const { value: h, coordinates: p, unit: g = "m", inside: y = !0, highPrecision: I = !1 } = c[d], m = mt(h, g), S = an(a.root, p, m, y, void 0, I);
        P(o[i], S.map(({ docIDs: T }) => T).flat());
      } else {
        const { coordinates: h, inside: p = !0, highPrecision: g = !1 } = c[d], y = ln(a.root, h, p, void 0, g);
        P(o[i], y.map(({ docIDs: I }) => I).flat());
      }
      continue;
    }
    if (l === "Radix" && (typeof c == "string" || Array.isArray(c))) {
      for (const d of [
        c
      ].flat()) {
        const h = await e.tokenizer.tokenize(d, e.language, i);
        for (const p of h) {
          const g = $e(a, {
            term: p,
            exact: !0
          });
          P(o[i], Object.values(g).flat());
        }
      }
      continue;
    }
    const u = Object.keys(c);
    if (u.length > 1)
      throw v("INVALID_FILTER_OPERATION", u.length);
    if (l === "Flat") {
      f ? P(o[i], Zt(a, c)) : P(o[i], Xt(a, c));
      continue;
    }
    if (l === "AVL") {
      const d = u[0], h = c[d];
      let p = [];
      switch (d) {
        case "gt": {
          p = De(a, h, !1);
          break;
        }
        case "gte": {
          p = De(a, h, !0);
          break;
        }
        case "lt": {
          p = Te(a, h, !1);
          break;
        }
        case "lte": {
          p = Te(a, h, !0);
          break;
        }
        case "eq": {
          p = $t(a, h) ?? [];
          break;
        }
        case "between": {
          const [g, y] = h;
          p = Wt(a, g, y);
          break;
        }
      }
      P(o[i], p);
    }
  }
  return re(Object.values(o));
}
async function vn(e) {
  return e.searchableProperties;
}
async function wn(e) {
  return e.searchablePropertiesWithTypes;
}
function Je(e) {
  const t = W(e.e, e.s, e.k);
  t.d = e.d, t.w = e.w;
  for (const n of Object.keys(e.c))
    t.c[n] = Je(e.c[n]);
  return t;
}
function On(e) {
  return {
    numberToDocumentId: new Map(e)
  };
}
function An(e) {
  return Array.from(e.numberToDocumentId.entries());
}
async function _n(e, t) {
  const { indexes: n, vectorIndexes: s, searchableProperties: o, searchablePropertiesWithTypes: r, frequencies: i, tokenOccurrences: c, avgFieldLength: a, fieldLengths: l } = t, f = {}, u = {};
  for (const d of Object.keys(n)) {
    const { node: h, type: p, isArray: g } = n[d];
    switch (p) {
      case "Radix":
        f[d] = {
          type: "Radix",
          node: Je(h),
          isArray: g
        };
        break;
      case "Flat":
        f[d] = {
          type: "Flat",
          node: On(h),
          isArray: g
        };
        break;
      default:
        f[d] = n[d];
    }
  }
  for (const d of Object.keys(s)) {
    const h = s[d].vectors;
    for (const p in h)
      h[p] = [
        h[p][0],
        new Float32Array(h[p][1])
      ];
    u[d] = {
      size: s[d].size,
      vectors: h
    };
  }
  return {
    sharedInternalDocumentStore: e,
    indexes: f,
    vectorIndexes: u,
    searchableProperties: o,
    searchablePropertiesWithTypes: r,
    frequencies: i,
    tokenOccurrences: c,
    avgFieldLength: a,
    fieldLengths: l
  };
}
async function En(e) {
  const { indexes: t, vectorIndexes: n, searchableProperties: s, searchablePropertiesWithTypes: o, frequencies: r, tokenOccurrences: i, avgFieldLength: c, fieldLengths: a } = e, l = {};
  for (const u of Object.keys(n)) {
    const d = n[u].vectors;
    for (const h in d)
      d[h] = [
        d[h][0],
        Array.from(d[h][1])
      ];
    l[u] = {
      size: n[u].size,
      vectors: d
    };
  }
  const f = {};
  for (const u of Object.keys(t)) {
    const { type: d, node: h, isArray: p } = t[u];
    if (d !== "Flat") {
      f[u] = t[u];
      continue;
    }
    f[u] = {
      type: "Flat",
      node: An(h),
      isArray: p
    };
  }
  return {
    indexes: f,
    vectorIndexes: l,
    searchableProperties: s,
    searchablePropertiesWithTypes: o,
    frequencies: r,
    tokenOccurrences: i,
    avgFieldLength: c,
    fieldLengths: a
  };
}
async function Pn() {
  return {
    create: Ze,
    insert: mn,
    remove: Sn,
    insertDocumentScoreParameters: hn,
    insertTokenScoreParameters: pn,
    removeDocumentScoreParameters: gn,
    removeTokenScoreParameters: yn,
    calculateResultScores: In,
    search: Dn,
    searchByWhereClause: Tn,
    getSearchableProperties: vn,
    getSearchablePropertiesWithTypes: wn,
    load: _n,
    save: En
  };
}
function Qe(e, t, n, s, o) {
  const r = {
    language: e.tokenizer.language,
    sharedInternalDocumentStore: t,
    enabled: !0,
    isSorted: !0,
    sortableProperties: [],
    sortablePropertiesWithTypes: {},
    sorts: {}
  };
  for (const [i, c] of Object.entries(n)) {
    const a = `${o}${o ? "." : ""}${i}`;
    if (!s.includes(a)) {
      if (typeof c == "object" && !Array.isArray(c)) {
        const l = Qe(e, t, c, s, a);
        P(r.sortableProperties, l.sortableProperties), r.sorts = {
          ...r.sorts,
          ...l.sorts
        }, r.sortablePropertiesWithTypes = {
          ...r.sortablePropertiesWithTypes,
          ...l.sortablePropertiesWithTypes
        };
        continue;
      }
      if (!$(c))
        switch (c) {
          case "boolean":
          case "number":
          case "string":
            r.sortableProperties.push(a), r.sortablePropertiesWithTypes[a] = c, r.sorts[a] = {
              docs: /* @__PURE__ */ new Map(),
              orderedDocsToRemove: /* @__PURE__ */ new Map(),
              orderedDocs: [],
              type: c
            };
            break;
          case "geopoint":
          case "enum":
            continue;
          case "enum[]":
          case "boolean[]":
          case "number[]":
          case "string[]":
            continue;
          default:
            throw v("INVALID_SORT_SCHEMA_TYPE", Array.isArray(c) ? "array" : c, a);
        }
    }
  }
  return r;
}
async function Nn(e, t, n, s) {
  return (s == null ? void 0 : s.enabled) !== !1 ? Qe(e, t, n, (s || {}).unsortableProperties || [], "") : {
    disabled: !0
  };
}
async function kn(e, t, n, s) {
  if (!e.enabled)
    return;
  e.isSorted = !1;
  const o = N(e.sharedInternalDocumentStore, n), r = e.sorts[t];
  r.docs.set(o, r.orderedDocs.length), r.orderedDocs.push([
    o,
    s
  ]);
}
function et(e) {
  if (e.isSorted || !e.enabled)
    return;
  const t = Object.keys(e.sorts);
  for (const n of t)
    xn(e, n);
  e.isSorted = !0;
}
function Rn(e, t, n) {
  return t[1].localeCompare(n[1], e);
}
function Ln(e, t) {
  return e[1] - t[1];
}
function Mn(e, t) {
  return t[1] ? -1 : 1;
}
function xn(e, t) {
  const n = e.sorts[t];
  let s;
  switch (n.type) {
    case "string":
      s = Rn.bind(null, e.language);
      break;
    case "number":
      s = Ln.bind(null);
      break;
    case "boolean":
      s = Mn.bind(null);
      break;
  }
  n.orderedDocs.sort(s);
  const o = n.orderedDocs.length;
  for (let r = 0; r < o; r++) {
    const i = n.orderedDocs[r][0];
    n.docs.set(i, r);
  }
}
function Cn(e) {
  const t = Object.keys(e.sorts);
  for (const n of t)
    tt(e, n);
}
function tt(e, t) {
  const n = e.sorts[t];
  n.orderedDocsToRemove.size && (n.orderedDocs = n.orderedDocs.filter((s) => !n.orderedDocsToRemove.has(s[0])), n.orderedDocsToRemove.clear());
}
async function Un(e, t, n) {
  if (!e.enabled)
    return;
  const s = e.sorts[t], o = N(e.sharedInternalDocumentStore, n);
  s.docs.get(o) && (s.docs.delete(o), s.orderedDocsToRemove.set(o, !0));
}
async function zn(e, t, n) {
  if (!e.enabled)
    throw v("SORT_DISABLED");
  const s = n.property, o = n.order === "DESC", r = e.sorts[s];
  if (!r)
    throw v("UNABLE_TO_SORT_ON_UNKNOWN_FIELD", s, e.sortableProperties.join(", "));
  return tt(e, s), et(e), t.sort((i, c) => {
    const a = r.docs.get(N(e.sharedInternalDocumentStore, i[0])), l = r.docs.get(N(e.sharedInternalDocumentStore, c[0])), f = typeof a < "u", u = typeof l < "u";
    return !f && !u ? 0 : f ? u ? o ? l - a : a - l : -1 : 1;
  }), t;
}
async function jn(e) {
  return e.enabled ? e.sortableProperties : [];
}
async function Bn(e) {
  return e.enabled ? e.sortablePropertiesWithTypes : {};
}
async function Wn(e, t) {
  const n = t;
  if (!n.enabled)
    return {
      enabled: !1
    };
  const s = Object.keys(n.sorts).reduce((o, r) => {
    const { docs: i, orderedDocs: c, type: a } = n.sorts[r];
    return o[r] = {
      docs: new Map(Object.entries(i).map(([l, f]) => [
        +l,
        f
      ])),
      orderedDocsToRemove: /* @__PURE__ */ new Map(),
      orderedDocs: c,
      type: a
    }, o;
  }, {});
  return {
    sharedInternalDocumentStore: e,
    language: n.language,
    sortableProperties: n.sortableProperties,
    sortablePropertiesWithTypes: n.sortablePropertiesWithTypes,
    sorts: s,
    enabled: !0,
    isSorted: n.isSorted
  };
}
async function Fn(e) {
  if (!e.enabled)
    return {
      enabled: !1
    };
  Cn(e), et(e);
  const t = Object.keys(e.sorts).reduce((n, s) => {
    const { docs: o, orderedDocs: r, type: i } = e.sorts[s];
    return n[s] = {
      docs: Object.fromEntries(o.entries()),
      orderedDocs: r,
      type: i
    }, n;
  }, {});
  return {
    language: e.language,
    sortableProperties: e.sortableProperties,
    sortablePropertiesWithTypes: e.sortablePropertiesWithTypes,
    sorts: t,
    enabled: e.enabled,
    isSorted: e.isSorted
  };
}
async function Vn() {
  return {
    create: Nn,
    insert: kn,
    remove: Un,
    save: Fn,
    load: Wn,
    sortBy: zn,
    getSortableProperties: jn,
    getSortablePropertiesWithTypes: Bn
  };
}
const Oe = 192, $n = 383, qn = [
  65,
  65,
  65,
  65,
  65,
  65,
  65,
  67,
  69,
  69,
  69,
  69,
  73,
  73,
  73,
  73,
  69,
  78,
  79,
  79,
  79,
  79,
  79,
  null,
  79,
  85,
  85,
  85,
  85,
  89,
  80,
  115,
  97,
  97,
  97,
  97,
  97,
  97,
  97,
  99,
  101,
  101,
  101,
  101,
  105,
  105,
  105,
  105,
  101,
  110,
  111,
  111,
  111,
  111,
  111,
  null,
  111,
  117,
  117,
  117,
  117,
  121,
  112,
  121,
  65,
  97,
  65,
  97,
  65,
  97,
  67,
  99,
  67,
  99,
  67,
  99,
  67,
  99,
  68,
  100,
  68,
  100,
  69,
  101,
  69,
  101,
  69,
  101,
  69,
  101,
  69,
  101,
  71,
  103,
  71,
  103,
  71,
  103,
  71,
  103,
  72,
  104,
  72,
  104,
  73,
  105,
  73,
  105,
  73,
  105,
  73,
  105,
  73,
  105,
  73,
  105,
  74,
  106,
  75,
  107,
  107,
  76,
  108,
  76,
  108,
  76,
  108,
  76,
  108,
  76,
  108,
  78,
  110,
  78,
  110,
  78,
  110,
  110,
  78,
  110,
  79,
  111,
  79,
  111,
  79,
  111,
  79,
  111,
  82,
  114,
  82,
  114,
  82,
  114,
  83,
  115,
  83,
  115,
  83,
  115,
  83,
  115,
  84,
  116,
  84,
  116,
  84,
  116,
  85,
  117,
  85,
  117,
  85,
  117,
  85,
  117,
  85,
  117,
  85,
  117,
  87,
  119,
  89,
  121,
  89,
  90,
  122,
  90,
  122,
  90,
  122,
  115
];
function Yn(e) {
  return e < Oe || e > $n ? e : qn[e - Oe] || e;
}
function Gn(e) {
  const t = [];
  for (let n = 0; n < e.length; n++)
    t[n] = Yn(e.charCodeAt(n));
  return String.fromCharCode(...t);
}
const Kn = {
  ational: "ate",
  tional: "tion",
  enci: "ence",
  anci: "ance",
  izer: "ize",
  bli: "ble",
  alli: "al",
  entli: "ent",
  eli: "e",
  ousli: "ous",
  ization: "ize",
  ation: "ate",
  ator: "ate",
  alism: "al",
  iveness: "ive",
  fulness: "ful",
  ousness: "ous",
  aliti: "al",
  iviti: "ive",
  biliti: "ble",
  logi: "log"
}, Hn = {
  icate: "ic",
  ative: "",
  alize: "al",
  iciti: "ic",
  ical: "ic",
  ful: "",
  ness: ""
}, Xn = "[^aeiou]", X = "[aeiouy]", x = Xn + "[^aeiouy]*", V = X + "[aeiou]*", ne = "^(" + x + ")?" + V + x, Zn = "^(" + x + ")?" + V + x + "(" + V + ")?$", K = "^(" + x + ")?" + V + x + V + x, Ae = "^(" + x + ")?" + X;
function Jn(e) {
  let t, n, s, o, r, i;
  if (e.length < 3)
    return e;
  const c = e.substring(0, 1);
  if (c == "y" && (e = c.toUpperCase() + e.substring(1)), s = /^(.+?)(ss|i)es$/, o = /^(.+?)([^s])s$/, s.test(e) ? e = e.replace(s, "$1$2") : o.test(e) && (e = e.replace(o, "$1$2")), s = /^(.+?)eed$/, o = /^(.+?)(ed|ing)$/, s.test(e)) {
    const a = s.exec(e);
    s = new RegExp(ne), s.test(a[1]) && (s = /.$/, e = e.replace(s, ""));
  } else
    o.test(e) && (t = o.exec(e)[1], o = new RegExp(Ae), o.test(t) && (e = t, o = /(at|bl|iz)$/, r = new RegExp("([^aeiouylsz])\\1$"), i = new RegExp("^" + x + X + "[^aeiouwxy]$"), o.test(e) ? e = e + "e" : r.test(e) ? (s = /.$/, e = e.replace(s, "")) : i.test(e) && (e = e + "e")));
  if (s = /^(.+?)y$/, s.test(e)) {
    const a = s.exec(e);
    t = a == null ? void 0 : a[1], s = new RegExp(Ae), t && s.test(t) && (e = t + "i");
  }
  if (s = /^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/, s.test(e)) {
    const a = s.exec(e);
    t = a == null ? void 0 : a[1], n = a == null ? void 0 : a[2], s = new RegExp(ne), t && s.test(t) && (e = t + Kn[n]);
  }
  if (s = /^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/, s.test(e)) {
    const a = s.exec(e);
    t = a == null ? void 0 : a[1], n = a == null ? void 0 : a[2], s = new RegExp(ne), t && s.test(t) && (e = t + Hn[n]);
  }
  if (s = /^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/, o = /^(.+?)(s|t)(ion)$/, s.test(e)) {
    const a = s.exec(e);
    t = a == null ? void 0 : a[1], s = new RegExp(K), t && s.test(t) && (e = t);
  } else if (o.test(e)) {
    const a = o.exec(e);
    t = (a == null ? void 0 : a[1]) ?? "" + (a == null ? void 0 : a[2]) ?? "", o = new RegExp(K), o.test(t) && (e = t);
  }
  if (s = /^(.+?)e$/, s.test(e)) {
    const a = s.exec(e);
    t = a == null ? void 0 : a[1], s = new RegExp(K), o = new RegExp(Zn), r = new RegExp("^" + x + X + "[^aeiouwxy]$"), t && (s.test(t) || o.test(t) && !r.test(t)) && (e = t);
  }
  return s = /ll$/, o = new RegExp(K), s.test(e) && o.test(e) && (s = /.$/, e = e.replace(s, "")), c == "y" && (e = c.toLowerCase() + e.substring(1)), e;
}
function _e(e, t) {
  var n;
  const s = `${this.language}:${e}:${t}`;
  return this.normalizationCache.has(s) ? this.normalizationCache.get(s) : !((n = this.stopWords) === null || n === void 0) && n.includes(t) ? (this.normalizationCache.set(s, ""), "") : (this.stemmer && !this.stemmerSkipProperties.has(e) && (t = this.stemmer(t)), t = Gn(t), this.normalizationCache.set(s, t), t);
}
function Qn(e) {
  for (; e[e.length - 1] === ""; )
    e.pop();
  for (; e[0] === ""; )
    e.shift();
  return e;
}
function Ee(e, t, n) {
  if (t && t !== this.language)
    throw v("LANGUAGE_NOT_SUPPORTED", t);
  if (typeof e != "string")
    return [
      e
    ];
  let s;
  if (n && this.tokenizeSkipProperties.has(n))
    s = [
      this.normalizeToken.bind(this, n ?? "")(e)
    ];
  else {
    const r = ut[this.language];
    s = e.toLowerCase().split(r).map(this.normalizeToken.bind(this, n ?? "")).filter(Boolean);
  }
  const o = Qn(s);
  return this.allowDuplicates ? o : Array.from(new Set(o));
}
async function Pe(e = {}) {
  if (!e.language)
    e.language = "english";
  else if (!xe.includes(e.language))
    throw v("LANGUAGE_NOT_SUPPORTED", e.language);
  let t;
  if (e.stemming || e.stemmer && !("stemming" in e))
    if (e.stemmer) {
      if (typeof e.stemmer != "function")
        throw v("INVALID_STEMMER_FUNCTION_TYPE");
      t = e.stemmer;
    } else if (e.language === "english")
      t = Jn;
    else
      throw v("MISSING_STEMMER", e.language);
  let n;
  if (e.stopWords !== !1) {
    if (n = [], Array.isArray(e.stopWords))
      n = e.stopWords;
    else if (typeof e.stopWords == "function")
      n = await e.stopWords(n);
    else if (e.stopWords)
      throw v("CUSTOM_STOP_WORDS_MUST_BE_FUNCTION_OR_ARRAY");
    if (!Array.isArray(n))
      throw v("CUSTOM_STOP_WORDS_MUST_BE_FUNCTION_OR_ARRAY");
    for (const o of n)
      if (typeof o != "string")
        throw v("CUSTOM_STOP_WORDS_MUST_BE_FUNCTION_OR_ARRAY");
  }
  const s = {
    tokenize: Ee,
    language: e.language,
    stemmer: t,
    stemmerSkipProperties: new Set(e.stemmerSkipProperties ? [
      e.stemmerSkipProperties
    ].flat() : []),
    tokenizeSkipProperties: new Set(e.tokenizeSkipProperties ? [
      e.tokenizeSkipProperties
    ].flat() : []),
    stopWords: n,
    allowDuplicates: !!e.allowDuplicates,
    normalizeToken: _e,
    normalizationCache: /* @__PURE__ */ new Map()
  };
  return s.tokenize = Ee.bind(s), s.normalizeToken = _e, s;
}
function es(e) {
  const t = {
    formatElapsedTime: Dt,
    getDocumentIndexId: Tt,
    getDocumentProperties: Ue,
    validateSchema: je
  };
  for (const n of Se) {
    const s = n;
    if (e[s]) {
      if (typeof e[s] != "function")
        throw v("COMPONENT_MUST_BE_FUNCTION", s);
    } else
      e[s] = t[s];
  }
  for (const n of Object.keys(e))
    if (!Bt.includes(n) && !Se.includes(n))
      throw v("UNSUPPORTED_COMPONENT", n);
}
async function ts({ schema: e, sort: t, language: n, components: s, id: o, plugins: r }) {
  s || (s = {}), o || (o = await Ce());
  let i = s.tokenizer, c = s.index, a = s.documentsStore, l = s.sorter;
  if (i ? i.tokenize ? i = i : i = await Pe(i) : i = await Pe({
    language: n ?? "english"
  }), s.tokenizer && n)
    throw v("NO_LANGUAGE_WITH_CUSTOM_TOKENIZER");
  const f = Ot();
  c || (c = await Pn()), l || (l = await Vn()), a || (a = await Ut()), es(s);
  const { getDocumentProperties: u, getDocumentIndexId: d, validateSchema: h, formatElapsedTime: p } = s, g = {
    data: {},
    caches: {},
    schema: e,
    tokenizer: i,
    index: c,
    sorter: l,
    documentsStore: a,
    internalDocumentIDStore: f,
    getDocumentProperties: u,
    getDocumentIndexId: d,
    validateSchema: h,
    beforeInsert: [],
    afterInsert: [],
    beforeRemove: [],
    afterRemove: [],
    beforeUpdate: [],
    afterUpdate: [],
    beforeSearch: [],
    afterSearch: [],
    beforeInsertMultiple: [],
    afterInsertMultiple: [],
    beforeRemoveMultiple: [],
    afterRemoveMultiple: [],
    afterUpdateMultiple: [],
    beforeUpdateMultiple: [],
    formatElapsedTime: p,
    id: o,
    plugins: r
  };
  g.data = {
    index: await g.index.create(g, f, e),
    docs: await g.documentsStore.create(g, f),
    sorting: await g.sorter.create(g, f, e, t)
  };
  for (const y of zt)
    g[y] = (g[y] ?? []).concat(await jt(g, y));
  return g;
}
const Ne = "fulltext", ns = "hybrid", ss = "vector";
function de(e, t) {
  const n = /* @__PURE__ */ new Map(), s = [];
  for (const o of e)
    n.set(o, !0);
  for (const [o, r] of t)
    n.has(o) && (s.push([
      o,
      r
    ]), n.delete(o));
  return s;
}
function os(e = "desc", t, n) {
  return e.toLowerCase() === "asc" ? t[1] - n[1] : n[1] - t[1];
}
async function he(e, t, n) {
  const s = {}, o = t.map(([l]) => l), r = await e.documentsStore.getMultiple(e.data.docs, o), i = Object.keys(n), c = await e.index.getSearchablePropertiesWithTypes(e.data.index);
  for (const l of i) {
    let f = {};
    if (c[l] === "number") {
      const { ranges: u } = n[l], d = [];
      for (const h of u)
        d.push([
          `${h.from}-${h.to}`,
          0
        ]);
      f = Object.fromEntries(d);
    }
    s[l] = {
      count: 0,
      values: f
    };
  }
  const a = r.length;
  for (let l = 0; l < a; l++) {
    const f = r[l];
    for (const u of i) {
      const d = u.includes(".") ? await ie(f, u) : f[u], h = c[u];
      switch (h) {
        case "number": {
          const p = n[u].ranges;
          ke(p, s[u].values, d);
          break;
        }
        case "number[]": {
          const p = /* @__PURE__ */ new Set(), g = n[u].ranges;
          for (const y of d)
            ke(g, s[u].values, y, p);
          break;
        }
        case "boolean":
        case "enum":
        case "string": {
          Re(s[u].values, d, h);
          break;
        }
        case "boolean[]":
        case "enum[]":
        case "string[]": {
          const p = /* @__PURE__ */ new Set(), g = h === "boolean[]" ? "boolean" : "string";
          for (const y of d)
            Re(s[u].values, y, g, p);
          break;
        }
        default:
          throw v("FACET_NOT_SUPPORTED", h);
      }
    }
  }
  for (const l of i)
    if (s[l].count = Object.keys(s[l].values).length, c[l] === "string") {
      const f = n;
      s[l].values = Object.fromEntries(Object.entries(s[l].values).sort((u, d) => os(f.sort, u, d)).slice(f.offset ?? 0, f.limit ?? 10));
    }
  return s;
}
function ke(e, t, n, s) {
  for (const o of e) {
    const r = `${o.from}-${o.to}`;
    s && s.has(r) || n >= o.from && n <= o.to && (t[r] === void 0 ? t[r] = 1 : (t[r]++, s && s.add(r)));
  }
}
function Re(e, t, n, s) {
  const o = (t == null ? void 0 : t.toString()) ?? (n === "boolean" ? "false" : "");
  s && s.has(o) || (e[o] = (e[o] ?? 0) + 1, s && s.add(o));
}
const rs = {
  reducer: (e, t, n, s) => (t[s] = n, t),
  getInitialValue: (e) => Array.from({
    length: e
  })
}, Le = [
  "string",
  "number",
  "boolean"
];
async function pe(e, t, n) {
  const s = n.properties, o = s.length, r = await e.index.getSearchablePropertiesWithTypes(e.data.index);
  for (let I = 0; I < o; I++) {
    const m = s[I];
    if (typeof r[m] > "u")
      throw v("UNKNOWN_GROUP_BY_PROPERTY", m);
    if (!Le.includes(r[m]))
      throw v("INVALID_GROUP_BY_PROPERTY", m, Le.join(", "), r[m]);
  }
  const i = t.map(([I]) => Z(e.internalDocumentIDStore, I)), c = await e.documentsStore.getMultiple(e.data.docs, i), a = c.length, l = n.maxResult || Number.MAX_SAFE_INTEGER, f = [], u = {};
  for (let I = 0; I < o; I++) {
    const m = s[I], S = {
      property: m,
      perValue: {}
    }, T = /* @__PURE__ */ new Set();
    for (let w = 0; w < a; w++) {
      const D = c[w], b = await ie(D, m);
      if (typeof b > "u")
        continue;
      const A = typeof b != "boolean" ? b : "" + b;
      typeof S.perValue[A] > "u" && (S.perValue[A] = {
        indexes: [],
        count: 0
      }), !(S.perValue[A].count >= l) && (S.perValue[A].indexes.push(w), S.perValue[A].count++, T.add(b));
    }
    f.push(Array.from(T)), u[m] = S;
  }
  const d = nt(f), h = d.length, p = [];
  for (let I = 0; I < h; I++) {
    const m = d[I], S = m.length, T = {
      values: [],
      indexes: []
    }, w = [];
    for (let D = 0; D < S; D++) {
      const b = m[D], A = s[D];
      w.push(u[A].perValue[typeof b != "boolean" ? b : "" + b].indexes), T.values.push(b);
    }
    T.indexes = re(w).sort((D, b) => D - b), T.indexes.length !== 0 && p.push(T);
  }
  const g = p.length, y = Array.from({
    length: g
  });
  for (let I = 0; I < g; I++) {
    const m = p[I], S = n.reduce || rs, T = m.indexes.map((A) => ({
      id: i[A],
      score: t[A][1],
      document: c[A]
    })), w = S.reducer.bind(null, m.values), D = S.getInitialValue(m.indexes.length), b = T.reduce(w, D);
    y[I] = {
      values: m.values,
      result: b
    };
  }
  return y;
}
function nt(e, t = 0) {
  if (t + 1 === e.length)
    return e[t].map((r) => [
      r
    ]);
  const n = e[t], s = nt(e, t + 1), o = [];
  for (const r of n)
    for (const i of s) {
      const c = [
        r
      ];
      P(c, i), o.push(c);
    }
  return o;
}
async function is(e, t, n) {
  const s = await U();
  e.beforeSearch && await ue(e.beforeSearch, e, t, n), t.relevance = Object.assign(t.relevance ?? {}, ot);
  const o = Object.keys(e.data.index.vectorIndexes), r = t.facets && Object.keys(t.facets).length > 0, { limit: i = 10, offset: c = 0, term: a, properties: l, threshold: f = 1, distinctOn: u, includeVectors: d = !1 } = t, h = t.preflight === !0, { index: p, docs: g } = e.data, y = await e.tokenizer.tokenize(a ?? "", n);
  let I = e.caches.propertiesToSearch;
  if (!I) {
    const O = await e.index.getSearchablePropertiesWithTypes(p);
    I = await e.index.getSearchableProperties(p), I = I.filter((k) => O[k].startsWith("string")), e.caches.propertiesToSearch = I;
  }
  if (l && l !== "*") {
    for (const O of l)
      if (!I.includes(O))
        throw v("UNKNOWN_INDEX", O, I.join(", "));
    I = I.filter((O) => l.includes(O));
  }
  const m = await J(e.tokenizer, e.index, e.documentsStore, n, t, I, y, await e.documentsStore.count(g), s), S = Object.keys(t.where ?? {}).length > 0;
  let T = [];
  S && (T = await e.index.searchByWhereClause(m, p, t.where));
  const w = y.length;
  if (w || l && l.length > 0) {
    const O = I.length;
    for (let k = 0; k < O; k++) {
      var D;
      const E = I[k];
      if (w !== 0)
        for (let C = 0; C < w; C++) {
          const j = y[C], q = await e.index.search(m, p, E, j);
          P(m.indexMap[E][j], q);
        }
      else {
        m.indexMap[E][""] = [];
        const C = await e.index.search(m, p, E, "");
        P(m.indexMap[E][""], C);
      }
      const L = m.indexMap[E], M = Object.values(L);
      m.docsIntersection[E] = Ke(M, (t == null || (D = t.boost) === null || D === void 0 ? void 0 : D[E]) ?? 1, f, w);
      const z = m.docsIntersection[E], it = z.length;
      for (let C = 0; C < it; C++) {
        const [j, q] = z[C], ge = m.uniqueDocsIDs[j];
        ge ? m.uniqueDocsIDs[j] = ge + q + 0.5 : m.uniqueDocsIDs[j] = q;
      }
    }
  } else
    y.length === 0 && a ? m.uniqueDocsIDs = {} : m.uniqueDocsIDs = Object.fromEntries(Object.keys(await e.documentsStore.getAll(e.data.docs)).map((O) => [
      O,
      0
    ]));
  let b = Object.entries(m.uniqueDocsIDs).map(([O, k]) => [
    +O,
    k
  ]);
  if (S && (b = de(T, b)), t.sortBy)
    if (typeof t.sortBy == "function") {
      const O = b.map(([L]) => L), E = (await e.documentsStore.getMultiple(e.data.docs, O)).map((L, M) => [
        b[M][0],
        b[M][1],
        L
      ]);
      E.sort(t.sortBy), b = E.map(([L, M]) => [
        L,
        M
      ]);
    } else
      b = await e.sorter.sortBy(e.data.sorting, b, t.sortBy).then((O) => O.map(([k, E]) => [
        N(e.internalDocumentIDStore, k),
        E
      ]));
  else
    b = b.sort(yt);
  let A;
  !h && u ? A = await ps(e, b, c, i, u) : h || (A = await rt(e, b, c, i));
  const _ = {
    elapsed: {
      formatted: "",
      raw: 0
    },
    // We keep the hits array empty if it's a preflight request.
    hits: [],
    count: b.length
  };
  if (typeof A < "u" && (_.hits = A.filter(Boolean), d || ze(_, o)), r) {
    const O = await he(e, b, t.facets);
    _.facets = O;
  }
  return t.groupBy && (_.groups = await pe(e, b, t.groupBy)), e.afterSearch && await le(e.afterSearch, e, t, n, _), _.elapsed = await e.formatElapsedTime(await U() - m.timeStart), _;
}
async function cs(e, t, n = "english") {
  const s = await U();
  e.beforeSearch && await ue(e.beforeSearch, e, t, n);
  const { vector: o } = t;
  if (o && (!("value" in o) || !("property" in o)))
    throw v("INVALID_VECTOR_INPUT", Object.keys(o).join(", "));
  const { limit: r = 10, offset: i = 0, includeVectors: c = !1 } = t, a = e.data.index.vectorIndexes[o.property], l = a.size, f = a.vectors, u = t.facets && Object.keys(t.facets).length > 0, d = Object.keys(t.where ?? {}).length > 0, { index: h, docs: p } = e.data;
  if ((o == null ? void 0 : o.value.length) !== l)
    throw v("INVALID_INPUT_VECTOR", o == null ? void 0 : o.property, l, o == null ? void 0 : o.value.length);
  o instanceof Float32Array || (o.value = new Float32Array(o.value));
  let g = Xe(o.value, f, l, t.similarity).map(([_, O]) => [
    N(e.internalDocumentIDStore, _),
    O
  ]), y = e.caches.propertiesToSearch;
  if (!y) {
    const _ = await e.index.getSearchablePropertiesWithTypes(h);
    y = await e.index.getSearchableProperties(h), y = y.filter((O) => _[O].startsWith("string")), e.caches.propertiesToSearch = y;
  }
  const I = [], m = await J(e.tokenizer, e.index, e.documentsStore, n, t, y, I, await e.documentsStore.count(p), s);
  let S = [];
  d && (S = await e.index.searchByWhereClause(m, h, t.where), g = de(S, g));
  let T = [];
  u && (T = await he(e, g, t.facets));
  const w = Array.from({
    length: r
  });
  for (let _ = 0; _ < r; _++) {
    const O = g[_ + i];
    if (!O)
      break;
    const k = e.data.docs.docs[O[0]];
    if (k) {
      c || (k[o.property] = null);
      const E = {
        id: Z(e.internalDocumentIDStore, O[0]),
        score: O[1],
        document: k
      };
      w[_] = E;
    }
  }
  let D = [];
  t.groupBy && (D = await pe(e, g, t.groupBy)), e.afterSearch && await le(e.afterSearch, e, t, n, g);
  const A = await U() - s;
  return {
    count: g.length,
    hits: w.filter(Boolean),
    elapsed: {
      raw: Number(A),
      formatted: await oe(A)
    },
    ...T ? {
      facets: T
    } : {},
    ...D ? {
      groups: D
    } : {}
  };
}
async function as(e, t, n) {
  const s = await U();
  e.beforeSearch && await ue(e.beforeSearch, e, t, n);
  const { offset: o = 0, limit: r = 10, includeVectors: i = !1 } = t, c = t.facets && Object.keys(t.facets).length > 0, [a, l] = await Promise.all([
    ls(e, t, n),
    us(e, t)
  ]), { index: f, docs: u } = e.data;
  let d = fs(a, l, t.term ?? "");
  const h = await e.tokenizer.tokenize(t.term ?? "", n);
  let p = e.caches.propertiesToSearch;
  if (!p) {
    const b = await e.index.getSearchablePropertiesWithTypes(f);
    p = await e.index.getSearchableProperties(f), p = p.filter((A) => b[A].startsWith("string")), e.caches.propertiesToSearch = p;
  }
  if (t.properties && t.properties !== "*") {
    for (const b of t.properties)
      if (!p.includes(b))
        throw v("UNKNOWN_INDEX", b, p.join(", "));
    p = p.filter((b) => t.properties.includes(b));
  }
  const g = await J(e.tokenizer, e.index, e.documentsStore, n, t, p, h, await e.documentsStore.count(u), s), y = Object.keys(t.where ?? {}).length > 0;
  let I = [];
  y && (I = await e.index.searchByWhereClause(g, f, t.where), d = de(I, d).slice(o, o + r));
  let m;
  c && (m = await he(e, d, t.facets));
  let S;
  t.groupBy && (S = await pe(e, d, t.groupBy));
  const T = (await rt(e, d, o, r)).filter(Boolean);
  e.afterSearch && await le(e.afterSearch, e, t, n, T);
  const w = await U(), D = {
    count: d.length,
    elapsed: {
      raw: Number(w - s),
      formatted: await oe(w - s)
    },
    hits: T,
    ...m ? {
      facets: m
    } : {},
    ...S ? {
      groups: S
    } : {}
  };
  if (!i) {
    const b = Object.keys(e.data.index.vectorIndexes);
    ze(D, b);
  }
  return D;
}
async function ls(e, t, n) {
  const s = await U();
  t.relevance = Object.assign(t.relevance ?? {}, ot);
  const { term: o, properties: r, threshold: i = 1 } = t, { index: c, docs: a } = e.data, l = await e.tokenizer.tokenize(o ?? "", n);
  let f = e.caches.propertiesToSearch;
  if (!f) {
    const g = await e.index.getSearchablePropertiesWithTypes(c);
    f = await e.index.getSearchableProperties(c), f = f.filter((y) => g[y].startsWith("string")), e.caches.propertiesToSearch = f;
  }
  if (r && r !== "*") {
    for (const g of r)
      if (!f.includes(g))
        throw v("UNKNOWN_INDEX", g, f.join(", "));
    f = f.filter((g) => r.includes(g));
  }
  const u = await J(e.tokenizer, e.index, e.documentsStore, n, t, f, l, await e.documentsStore.count(a), s), d = l.length;
  if (d || r && r.length > 0) {
    const g = f.length;
    for (let y = 0; y < g; y++) {
      var h;
      const I = f[y];
      if (d !== 0)
        for (let D = 0; D < d; D++) {
          const b = l[D], A = await e.index.search(u, c, I, b);
          P(u.indexMap[I][b], A);
        }
      else {
        u.indexMap[I][""] = [];
        const D = await e.index.search(u, c, I, "");
        P(u.indexMap[I][""], D);
      }
      const m = u.indexMap[I], S = Object.values(m);
      u.docsIntersection[I] = Ke(S, (t == null || (h = t.boost) === null || h === void 0 ? void 0 : h[I]) ?? 1, i, d);
      const T = u.docsIntersection[I], w = T.length;
      for (let D = 0; D < w; D++) {
        const [b, A] = T[D], _ = u.uniqueDocsIDs[b];
        _ ? u.uniqueDocsIDs[b] = _ + A + 0.5 : u.uniqueDocsIDs[b] = A;
      }
    }
  } else
    l.length === 0 && o ? u.uniqueDocsIDs = {} : u.uniqueDocsIDs = Object.fromEntries(Object.keys(await e.documentsStore.getAll(e.data.docs)).map((g) => [
      g,
      0
    ]));
  const p = Object.entries(u.uniqueDocsIDs).map(([g, y]) => [
    +g,
    y
  ]).sort((g, y) => y[1] - g[1]);
  return st(p);
}
async function us(e, t) {
  const n = t.vector, s = e.data.index.vectorIndexes[n == null ? void 0 : n.property], o = s.size, r = s.vectors;
  if (n && (!n.value || !n.property))
    throw v("INVALID_VECTOR_INPUT", Object.keys(n).join(", "));
  if (n.value.length !== o)
    throw v("INVALID_INPUT_VECTOR", n.property, o, n.value.length);
  n instanceof Float32Array || (n.value = new Float32Array(n.value));
  const i = Xe(n.value, r, o, t.similarity).map(([c, a]) => [
    N(e.internalDocumentIDStore, c),
    a
  ]);
  return st(i);
}
function st(e) {
  const t = Math.max(...e.map(([, n]) => n));
  return e.map(([n, s]) => [
    n,
    s / t
  ]);
}
function Me(e, t) {
  return e / t;
}
function se(e, t, n, s) {
  return e * n + t * s;
}
function fs(e, t, n) {
  const s = Math.max(...e.map(([, f]) => f)), o = Math.max(...t.map(([, f]) => f)), { textWeight: r, vectorWeight: i } = ds(), c = /* @__PURE__ */ new Map(), a = e.length;
  for (let f = 0; f < a; f++) {
    const u = Me(e[f][1], s), d = se(u, 0, r, i);
    c.set(e[f][0], d);
  }
  const l = t.length;
  for (let f = 0; f < l; f++) {
    const u = Me(t[f][1], o);
    if (c.has(t[f][0])) {
      let d = c.get(t[f][0]);
      c.set(t[f][0], d += se(0, u, r, i));
    } else
      c.set(t[f][0], se(0, u, r, i));
  }
  return [
    ...c
  ].sort((f, u) => u[1] - f[1]);
}
function ds(e) {
  return {
    textWeight: 0.5,
    vectorWeight: 0.5
  };
}
const ot = {
  k: 1.2,
  b: 0.75,
  d: 0.5
};
async function J(e, t, n, s, o, r, i, c, a) {
  const l = {}, f = {};
  for (const u of r) {
    const d = {};
    for (const h of i)
      d[h] = [];
    l[u] = d, f[u] = [];
  }
  return {
    timeStart: a,
    tokenizer: e,
    index: t,
    documentsStore: n,
    language: s,
    params: o,
    docsCount: c,
    uniqueDocsIDs: {},
    indexMap: l,
    docsIntersection: f
  };
}
async function hs(e, t, n) {
  const s = t.mode ?? Ne;
  if (s === Ne)
    return is(e, t, n);
  if (s === ss)
    return cs(e, t);
  if (s === ns)
    return as(e, t);
  throw v("INVALID_SEARCH_MODE", s);
}
async function ps(e, t, n, s, o) {
  const r = e.data.docs, i = /* @__PURE__ */ new Map(), c = [], a = /* @__PURE__ */ new Set(), l = t.length;
  let f = 0;
  for (let u = 0; u < l; u++) {
    const d = t[u];
    if (typeof d > "u")
      continue;
    const [h, p] = d;
    if (a.has(h))
      continue;
    const g = await e.documentsStore.get(r, h), y = await ie(g, o);
    if (!(typeof y > "u" || i.has(y)) && (i.set(y, !0), f++, !(f <= n) && (c.push({
      id: Z(e.internalDocumentIDStore, h),
      score: p,
      document: g
    }), a.add(h), f >= n + s)))
      break;
  }
  return c;
}
async function rt(e, t, n, s) {
  const o = e.data.docs, r = Array.from({
    length: s
  }), i = /* @__PURE__ */ new Set();
  for (let c = n; c < s + n; c++) {
    const a = t[c];
    if (typeof a > "u")
      break;
    const [l, f] = a;
    if (!i.has(l)) {
      const u = await e.documentsStore.get(o, l);
      r[c] = {
        id: Z(e.internalDocumentIDStore, l),
        score: f,
        document: u
      }, i.add(l);
    }
  }
  return r;
}
async function gs(e, t) {
  e.internalDocumentIDStore.load(e, t.internalDocumentIDStore), e.data.index = await e.index.load(e.internalDocumentIDStore, t.index), e.data.docs = await e.documentsStore.load(e.internalDocumentIDStore, t.docs), e.data.sorting = await e.sorter.load(e.internalDocumentIDStore, t.sorting), e.tokenizer.language = t.language;
}
const ys = {
  type: "string",
  content: "string",
  path: "string"
}, Is = async (e) => {
  const t = await ts({
    schema: ys
  });
  return await gs(t, e), t;
};
(async () => {
  const e = await fetch("../searchIndexes.json").then((n) => n.json()).then((n) => n), t = await Is(e);
  self.onmessage = async (n) => {
    const s = n.data, o = await hs(t, s);
    postMessage(o);
  };
})();
//# sourceMappingURL=search-worker.js.map
