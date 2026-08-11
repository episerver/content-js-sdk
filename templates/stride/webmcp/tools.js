/**
 * Stride Storefront v2 — WebMCP tools (issue 0002).
 *
 * Hand-written CLASSIC script: no module syntax, no build transforms, zero
 * dependencies. Published byte-identical to /webmcp-tools.js by
 * `npm run webmcp:build` and loaded site-wide from the root layout.
 *
 * Normative contract: docs/storefront-v2/contracts.md (§3 API routes,
 * §4 window.strideStoreBridge, §5 tool schemas + pipeline, §6 telemetry)
 * and ADR 0002 (dual-output invariant).
 *
 * Registration: document.modelContext is the normative API;
 * navigator.modelContext is a deprecated Inspector-compat fallback.
 * If neither exists this script is a graceful no-op — NO polyfill, no
 * console output (supersedes the Nimbus v1 polyfill pattern).
 *
 * Boundaries (enforced mechanically by scripts/webmcp-build.mjs):
 *   - no DOM queries/interaction; the only UI touchpoint is
 *     window.strideStoreBridge (the only window.* access);
 *   - all fetches go to same-origin /api/store/* through one guarded helper;
 *   - tool bodies hold no business logic: validate -> fetch -> await bridge
 *     commit -> resolve envelope -> record telemetry.
 *
 * Result envelope (every tool resolves, never bare-rejects):
 *   { ok: true,  data, replayed? }
 *   { ok: false, error: { code, message, hint } }
 *   { ok: 'partial_failure', data, warning }
 * A `content` text mirror (the JSON-serialized envelope) is attached for
 * MCP-host display; the envelope fields stay top-level for direct callers.
 */
(function () {
  'use strict';

  var mc = document.modelContext || navigator.modelContext;
  if (!mc) return; /* graceful no-op: no shim, no console noise */

  try {
    if (mc.__strideWebmcpRegistered) return;
    mc.__strideWebmcpRegistered = true;
  } catch (e) {
    /* native context may reject expando properties; continue */
  }

  var BRIDGE_WAIT_MS = 2000; /* max wait for window.strideStoreBridge to exist */
  var BRIDGE_CALL_TIMEOUT_MS = 2000; /* max wait for a single bridge call */
  var BRIDGE_POLL_MS = 50;

  /* Exact class-specific partial_failure warnings (contracts §5). */
  var WARNING_MUTATION =
    'STATE CHANGED — do not repeat this mutation with a new key. Retry with the SAME idempotencyKey, or call get_cart.';
  var WARNING_READONLY =
    'UI sync failed; no state changed — safe to retry this call.';

  /* sessionId learned from the X-Stride-Session response header (§3/§6). */
  var lastSessionId = '';

  function noop() {}

  function has(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  /* Attach the MCP-host text mirror; envelope fields stay top-level. */
  function finish(env) {
    var text = JSON.stringify(env);
    env.content = [{ type: 'text', text: text }];
    return env;
  }

  function withTimeout(promise, ms) {
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () {
        reject(new Error('timed out after ' + ms + 'ms'));
      }, ms);
      promise.then(
        function (v) {
          clearTimeout(timer);
          resolve(v);
        },
        function (e) {
          clearTimeout(timer);
          reject(e);
        }
      );
    });
  }

  function waitForBridge() {
    return new Promise(function (resolve) {
      var start = Date.now();
      (function poll() {
        var bridge = window.strideStoreBridge;
        if (bridge) return resolve(bridge);
        if (Date.now() - start >= BRIDGE_WAIT_MS) return resolve(null);
        setTimeout(poll, BRIDGE_POLL_MS);
      })();
    });
  }

  /* The ONE fetch call site. Same-origin /api/store/* only (guarded). */
  function storeFetch(path, options) {
    if (path.indexOf('/api/store/') !== 0) {
      return Promise.reject(new Error('blocked non-store path: ' + path));
    }
    return fetch(path, options).then(function (res) {
      var sid = res.headers.get('X-Stride-Session');
      if (sid) lastSessionId = sid;
      return res
        .json()
        .catch(function () {
          return null;
        })
        .then(function (body) {
          return { ok: res.ok, status: res.status, body: body };
        });
    });
  }

  function recordTelemetry(bridge, tool, outcome, t0) {
    if (!bridge || !bridge.telemetry) return;
    try {
      /* Exactly four fields, never more (contracts §6). */
      bridge.telemetry.record({
        sessionId: lastSessionId,
        tool: tool,
        outcome: outcome,
        durationMs: Date.now() - t0
      });
    } catch (e) {
      /* telemetry must never break a tool result */
    }
  }

  /* ── Minimal JSON-Schema validator (subset used by the schemas below) ── */

  function hintFor(name, schema) {
    if (name === 'idempotencyKey') {
      return (
        'supply a caller-generated idempotencyKey of 8-32 chars matching ' +
        '^[A-Za-z0-9._-]+$; use a NEW key for each distinct mutation and ' +
        'reuse the SAME key verbatim when retrying'
      );
    }
    if (name === 'productId' || name === 'compatibleWithProductId' || name === 'ids') {
      return (
        'use a product id exactly as returned by search_products ' +
        '(kebab-case, 3-24 chars, e.g. traverse-gravel-sl)'
      );
    }
    if (name === 'cartItemId') {
      return (
        'use a cartItemId exactly as returned by get_cart ' +
        '(productId or productId:frameSize, e.g. traverse-gravel-sl:56)'
      );
    }
    if (name === 'quantity') {
      return 'quantity must be an integer >= 1 (update_cart_item sets the absolute quantity, not an increment)';
    }
    if (name === 'limit') {
      return 'limit must be an integer between 1 and 24 (default 12)';
    }
    if (schema && schema.enum) {
      return "allowed values for '" + name + "': " + schema.enum.join(', ');
    }
    if (schema && schema.type) {
      var parts = ['expected ' + schema.type];
      if (schema.pattern) parts.push('matching ' + schema.pattern);
      if (schema.minLength != null || schema.maxLength != null) {
        parts.push('length ' + (schema.minLength != null ? schema.minLength : 0) + '-' + (schema.maxLength != null ? schema.maxLength : 'any'));
      }
      if (schema.minimum != null) parts.push('>= ' + schema.minimum);
      if (schema.maximum != null) parts.push('<= ' + schema.maximum);
      return "correct '" + name + "': " + parts.join(', ');
    }
    return "correct the argument '" + name + "' and retry";
  }

  function leafName(path) {
    var dot = path.lastIndexOf('.');
    var name = dot >= 0 ? path.slice(dot + 1) : path;
    var bracket = name.indexOf('[');
    return bracket >= 0 ? name.slice(0, bracket) : name;
  }

  function problem(path, msg, schema) {
    return {
      message: "invalid argument '" + path + "': " + msg,
      hint: hintFor(leafName(path), schema)
    };
  }

  function checkSchema(value, schema, path) {
    var i;
    if (schema.type === 'object') {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return problem(path, 'must be an object', schema);
      }
      var required = schema.required || [];
      for (i = 0; i < required.length; i++) {
        if (!has(value, required[i]) || value[required[i]] === undefined) {
          return {
            message: "missing required argument '" + required[i] + "' (in " + path + ')',
            hint: hintFor(required[i], (schema.properties || {})[required[i]])
          };
        }
      }
      var props = schema.properties || {};
      for (var key in value) {
        if (!has(value, key)) continue;
        if (value[key] === undefined) continue;
        if (!has(props, key)) {
          return {
            message: "unknown argument '" + key + "' (in " + path + ')',
            hint: "remove '" + key + "'; allowed arguments: " + (Object.keys(props).join(', ') || '(none)')
          };
        }
        var nested = checkSchema(value[key], props[key], path === 'arguments' ? key : path + '.' + key);
        if (nested) return nested;
      }
      return null;
    }
    if (schema.type === 'array') {
      if (!Array.isArray(value)) return problem(path, 'must be an array', schema);
      if (schema.minItems != null && value.length < schema.minItems) {
        return problem(path, 'needs at least ' + schema.minItems + ' items', schema);
      }
      if (schema.maxItems != null && value.length > schema.maxItems) {
        return problem(path, 'allows at most ' + schema.maxItems + ' items', schema);
      }
      if (schema.items) {
        for (i = 0; i < value.length; i++) {
          var itemProblem = checkSchema(value[i], schema.items, path + '[' + i + ']');
          if (itemProblem) return itemProblem;
        }
      }
      return null;
    }
    if (schema.type === 'string') {
      if (typeof value !== 'string') return problem(path, 'must be a string', schema);
      if (schema.minLength != null && value.length < schema.minLength) {
        return problem(path, 'is shorter than ' + schema.minLength + ' chars', schema);
      }
      if (schema.maxLength != null && value.length > schema.maxLength) {
        return problem(path, 'is longer than ' + schema.maxLength + ' chars', schema);
      }
      if (schema.enum && schema.enum.indexOf(value) < 0) {
        return problem(path, 'must be one of: ' + schema.enum.join(', '), schema);
      }
      if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
        return problem(path, 'does not match pattern ' + schema.pattern, schema);
      }
      return null;
    }
    if (schema.type === 'number' || schema.type === 'integer') {
      if (typeof value !== 'number' || !isFinite(value)) {
        return problem(path, 'must be a number', schema);
      }
      if (schema.type === 'integer' && value !== Math.floor(value)) {
        return problem(path, 'must be an integer', schema);
      }
      if (schema.minimum != null && value < schema.minimum) {
        return problem(path, 'must be >= ' + schema.minimum, schema);
      }
      if (schema.maximum != null && value > schema.maximum) {
        return problem(path, 'must be <= ' + schema.maximum, schema);
      }
      return null;
    }
    if (schema.type === 'boolean') {
      if (typeof value !== 'boolean') return problem(path, 'must be a boolean', schema);
      return null;
    }
    return null;
  }

  function validateArgs(args, schema) {
    var found = checkSchema(args, schema, 'arguments');
    if (!found) return null;
    return { code: 'INVALID_ARGS', message: found.message, hint: found.hint };
  }

  /* ── Bounded field schemas (contracts §1/§5) ─────────────────────────── */

  function productIdSchema(description) {
    return {
      type: 'string',
      pattern: '^[a-z0-9]+(-[a-z0-9]+)*$',
      minLength: 3,
      maxLength: 24,
      description: description
    };
  }

  function idempotencyKeySchema(description) {
    return {
      type: 'string',
      pattern: '^[A-Za-z0-9._-]+$',
      minLength: 8,
      maxLength: 32,
      description: description
    };
  }

  function cartItemIdSchema(description) {
    return {
      type: 'string',
      pattern: '^[a-z0-9]+(-[a-z0-9]+)*(:(48|50|52|54|56|58|60|62))?$',
      minLength: 3,
      maxLength: 27,
      description: description
    };
  }

  var FRAME_SIZES = ['48', '50', '52', '54', '56', '58', '60', '62'];

  var IDEMPOTENCY_KEY_DESC =
    'Caller-generated retry key, 8-32 chars of A-Za-z0-9._- . Use a NEW ' +
    'unique key per distinct mutation; when retrying the SAME mutation ' +
    '(timeout, partial_failure), reuse the SAME key verbatim so the store ' +
    'deduplicates it. Never reuse a key for a different mutation.';

  /* ── Per-tool wiring: route request + bridge sync + re-sync class ────── */

  function bridgeUnavailableError(readOnly) {
    return {
      code: 'BRIDGE_UNAVAILABLE',
      message:
        'window.strideStoreBridge did not appear within ' + BRIDGE_WAIT_MS +
        'ms, so the page UI could not be synchronized',
      hint: readOnly
        ? 'no cart state changed; reload the page and retry this call'
        : 'the store operation may already be applied — call get_cart to verify, and if retrying reuse the SAME idempotencyKey'
    };
  }

  function apiUnreachableError(readOnly) {
    return {
      code: 'BRIDGE_UNAVAILABLE',
      message: 'the same-origin store API could not be reached (network failure)',
      hint: readOnly
        ? 'safe to retry this read-only call; if it persists, reload the page'
        : 'state is unknown — retry with the SAME idempotencyKey (never a new one), then call get_cart to verify'
    };
  }

  var TOOL_IMPL = {
    search_products: {
      readOnly: true,
      resyncClass: 'self',
      request: function (args) {
        return {
          path: '/api/store/search',
          options: {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(args)
          }
        };
      },
      sync: function (bridge, data) {
        return bridge.showSearch(data);
      }
    },
    compare_bikes: {
      readOnly: true,
      resyncClass: 'self',
      request: function (args) {
        var path = '/api/store/compare?ids=';
        var encoded = [];
        for (var i = 0; i < args.ids.length; i++) {
          encoded.push(encodeURIComponent(args.ids[i]));
        }
        path += encoded.join(',');
        if (args.riderHeightCm != null) {
          path += '&riderHeightCm=' + encodeURIComponent(String(args.riderHeightCm));
        }
        return { path: path, options: { method: 'GET' } };
      },
      sync: function (bridge, data) {
        return bridge.showComparison(data);
      }
    },
    get_cart: {
      readOnly: true,
      resyncClass: 'cart',
      surface: 'page',
      request: function () {
        return { path: '/api/store/cart', options: { method: 'GET' } };
      },
      sync: function (bridge, data) {
        return bridge.showCart(data, 'page');
      }
    },
    add_to_cart: {
      readOnly: false,
      resyncClass: 'cart',
      surface: 'drawer',
      request: function (args) {
        return {
          path: '/api/store/cart/items',
          options: {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'Idempotency-Key': args.idempotencyKey
            },
            body: JSON.stringify({
              productId: args.productId,
              frameSize: args.frameSize,
              quantity: args.quantity
            })
          }
        };
      },
      sync: function (bridge, data) {
        return bridge.showCart(data.cart, 'drawer');
      }
    },
    update_cart_item: {
      readOnly: false,
      resyncClass: 'cart',
      surface: 'drawer',
      request: function (args) {
        return {
          path: '/api/store/cart/items/' + encodeURIComponent(args.cartItemId),
          options: {
            method: 'PATCH',
            headers: {
              'content-type': 'application/json',
              'Idempotency-Key': args.idempotencyKey
            },
            body: JSON.stringify({ quantity: args.quantity })
          }
        };
      },
      sync: function (bridge, data) {
        return bridge.showCart(data.cart, 'drawer');
      }
    },
    remove_from_cart: {
      readOnly: false,
      resyncClass: 'cart',
      surface: 'drawer',
      request: function (args) {
        return {
          path: '/api/store/cart/items/' + encodeURIComponent(args.cartItemId),
          options: {
            method: 'DELETE',
            headers: { 'Idempotency-Key': args.idempotencyKey }
          }
        };
      },
      sync: function (bridge, data) {
        return bridge.showCart(data.cart, 'drawer');
      }
    }
  };

  var TOOL_SCHEMAS = {}; /* filled from the registration literals below */

  /* Re-sync the tool's OWN surface exactly once (contracts §5): search and
     compare replay their bridge call with the same payload; cart-class tools
     re-fetch GET /api/store/cart (the authoritative state, ADR 0002 rule 3)
     and showCart it. Failures here are swallowed — never hang. */
  function resyncOnce(bridge, impl, data) {
    var attempt;
    if (impl.resyncClass === 'cart') {
      attempt = storeFetch('/api/store/cart', { method: 'GET' }).then(function (res) {
        if (!res.ok || !res.body) throw new Error('cart re-fetch failed');
        return bridge.showCart(res.body, impl.surface);
      });
    } else {
      attempt = Promise.resolve().then(function () {
        return impl.sync(bridge, data);
      });
    }
    return withTimeout(attempt, BRIDGE_CALL_TIMEOUT_MS).catch(noop);
  }

  /* The normative pipeline (contracts §5): validate -> fetch /api/store/* ->
     on 2xx await bridge commit -> envelope -> telemetry. */
  function runTool(toolName, args) {
    var impl = TOOL_IMPL[toolName];
    var t0 = Date.now();
    args = args || {};

    var invalid = validateArgs(args, TOOL_SCHEMAS[toolName]);
    if (invalid) {
      /* No fetch, no state change. Best-effort error notice if the bridge is
         already present (no 2s wait for a pure schema rejection). */
      var bridgeNow = window.strideStoreBridge;
      var notice = bridgeNow
        ? withTimeout(
            Promise.resolve().then(function () {
              return bridgeNow.showErrorNotice(invalid);
            }),
            BRIDGE_CALL_TIMEOUT_MS
          ).catch(noop)
        : Promise.resolve();
      return notice.then(function () {
        recordTelemetry(bridgeNow, toolName, invalid.code, t0);
        return finish({ ok: false, error: invalid });
      });
    }

    var req = impl.request(args);
    return storeFetch(req.path, req.options).then(
      function (res) {
        if (!res.ok) {
          var error =
            res.body && res.body.error
              ? res.body.error
              : {
                  code: 'INVALID_ARGS',
                  message: 'store API returned HTTP ' + res.status + ' without a structured error',
                  hint: 'retry the call; if the problem persists, reload the page'
                };
          /* Failure dual-output: await the synchronized error notice, then
             resolve ok:false. No state changed; read-only failures never
             show the cart drawer (no showCart on this path). */
          return waitForBridge().then(function (bridge) {
            var shown = bridge
              ? withTimeout(
                  Promise.resolve().then(function () {
                    return bridge.showErrorNotice(error);
                  }),
                  BRIDGE_CALL_TIMEOUT_MS
                ).catch(noop)
              : Promise.resolve();
            return shown.then(function () {
              recordTelemetry(bridge, toolName, error.code, t0);
              return finish({ ok: false, error: error });
            });
          });
        }

        var data = res.body;
        return waitForBridge().then(function (bridge) {
          if (!bridge) {
            /* Bridge never appeared within BRIDGE_WAIT_MS. */
            return finish({ ok: false, error: bridgeUnavailableError(impl.readOnly) });
          }
          return withTimeout(
            Promise.resolve().then(function () {
              return impl.sync(bridge, data);
            }),
            BRIDGE_CALL_TIMEOUT_MS
          ).then(
            function () {
              var env = { ok: true, data: data };
              if (data && data.replayed === true) env.replayed = true;
              recordTelemetry(bridge, toolName, 'ok', t0);
              return finish(env);
            },
            function () {
              /* 2xx but bridge sync failed/timed out: re-sync own surface
                 once, then resolve partial_failure with the class warning.
                 Never hang, never double-apply. */
              return resyncOnce(bridge, impl, data).then(function () {
                recordTelemetry(bridge, toolName, 'partial_failure', t0);
                return finish({
                  ok: 'partial_failure',
                  data: data,
                  warning: impl.readOnly ? WARNING_READONLY : WARNING_MUTATION
                });
              });
            }
          );
        });
      },
      function () {
        /* Network-level fetch failure: state unknown, never bare-reject. */
        var error = apiUnreachableError(impl.readOnly);
        var bridgeNow = window.strideStoreBridge;
        var shown = bridgeNow
          ? withTimeout(
              Promise.resolve().then(function () {
                return bridgeNow.showErrorNotice(error);
              }),
              BRIDGE_CALL_TIMEOUT_MS
            ).catch(noop)
          : Promise.resolve();
        return shown.then(function () {
          recordTelemetry(bridgeNow, toolName, error.code, t0);
          return finish({ ok: false, error: error });
        });
      }
    );
  }

  function makeExecute(toolName) {
    return function (args) {
      return runTool(toolName, args);
    };
  }

  /* ── The six tool registrations (contracts §5, one block per tool) ───── */

  var TOOL_DEFINITIONS = [
    {
      name: 'search_products',
      description:
        'Search the Stride bike-shop catalog with structured filters and get ' +
        'deterministically ranked results. Use this FIRST to find products and ' +
        'their exact ids. Hard filters drop non-matching products: category ' +
        "('bike' | 'accessory'), discipline, terrain, kind (accessory type), " +
        'maxPriceUsd (budget cap), riderHeightCm (only bikes with an in-stock ' +
        'frame size fitting that rider pass; matches include ' +
        'recommendedFrameSize), minRangeKm (e-bike range floor), ' +
        'compatibleWithProductId (only accessories compatible with that bike), ' +
        'inStockOnly (default true). Soft preferences only re-rank, never ' +
        'filter: preferences.colors, preferences.style, ' +
        'preferences.prioritizeWeight (lighter first). Each match carries ' +
        'reasonCodes explaining its ranking. Zero matches is a normal ok ' +
        'result, not an error. Read-only and always safe to retry. The page ' +
        'navigates to the store results view when this resolves.',
      annotations: { readOnlyHint: true },
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          category: {
            type: 'string',
            enum: ['bike', 'accessory'],
            description: 'Restrict results to bikes or to accessories.'
          },
          discipline: {
            type: 'string',
            enum: ['road', 'gravel', 'commuter', 'mountain', 'e-bike'],
            description: 'Bike discipline (hard filter).'
          },
          terrain: {
            type: 'string',
            enum: ['paved', 'mixed', 'trail'],
            description: 'Terrain the bike must support (hard filter).'
          },
          kind: {
            type: 'string',
            enum: ['helmet', 'lock', 'lights'],
            description: 'Accessory kind (hard filter).'
          },
          maxPriceUsd: {
            type: 'number',
            minimum: 0,
            description: 'Budget cap in USD; products priced above it are dropped.'
          },
          riderHeightCm: {
            type: 'number',
            minimum: 0,
            description:
              'Rider height in cm. Hard fit filter: only bikes with an in-stock frame size for this height pass; matches include recommendedFrameSize.'
          },
          minRangeKm: {
            type: 'number',
            minimum: 0,
            description: 'Minimum range in km (hard filter; only meaningful for e-bikes).'
          },
          compatibleWithProductId: productIdSchema(
            'Only return accessories compatible with this bike (a product id from search_products).'
          ),
          inStockOnly: {
            type: 'boolean',
            description: 'Defaults to true. Set false to include out-of-stock products.'
          },
          preferences: {
            type: 'object',
            additionalProperties: false,
            description: 'Soft preferences that re-rank results (never filter). Omit fields you do not know.',
            properties: {
              colors: {
                type: 'array',
                items: { type: 'string' },
                description: "Preferred colors as lowercase words, e.g. ['black', 'red']."
              },
              style: {
                type: 'string',
                enum: ['sport', 'classic', 'urban'],
                description: 'Preferred style.'
              },
              prioritizeWeight: {
                type: 'boolean',
                description: 'True to rank lighter products first.'
              }
            }
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 24,
            description: 'Maximum results (default 12, max 24).'
          }
        }
      },
      execute: makeExecute('search_products')
    },
    {
      name: 'compare_bikes',
      description:
        'Compare 2-3 bikes side by side (bikes only; use product ids from ' +
        'search_products). Returns per-field deltas — priceUsd, weightKg, ' +
        'rangeKm, fit — with the best product flagged per delta and reason ' +
        'codes like DELTA_LIGHTER / DELTA_CHEAPER. Pass riderHeightCm to add ' +
        'a fit comparison with recommended frame sizes. Use after ' +
        'search_products to decide between shortlisted bikes. Read-only and ' +
        'always safe to retry. The page navigates to the comparison view when ' +
        'this resolves.',
      annotations: { readOnlyHint: true },
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['ids'],
        properties: {
          ids: {
            type: 'array',
            minItems: 2,
            maxItems: 3,
            items: productIdSchema('A bike product id from search_products.'),
            description: 'The 2-3 bike product ids to compare.'
          },
          riderHeightCm: {
            type: 'number',
            minimum: 0,
            description: 'Rider height in cm; adds a fit delta with recommended frame sizes.'
          }
        }
      },
      execute: makeExecute('compare_bikes')
    },
    {
      name: 'get_cart',
      description:
        'Return the current cart: items with cartItemId, quantity, unit price ' +
        'and line total, plus itemCount and subtotalUsd. Takes no arguments. ' +
        'Use it to verify true cart state — especially after a mutation ' +
        'returned partial_failure or an error you did not expect. Read-only ' +
        'and always safe to retry. The page shows the cart when this resolves.',
      annotations: { readOnlyHint: true },
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {}
      },
      execute: makeExecute('get_cart')
    },
    {
      name: 'add_to_cart',
      description:
        'Add a product to the shopping cart. Additive: calling it again with ' +
        'a NEW idempotencyKey adds more quantity, so confirm intent before ' +
        'repeating. Args: productId (exactly as returned by search_products), ' +
        'frameSize (for bikes pick the recommendedFrameSize or another ' +
        'in-stock variant size), quantity (default 1), idempotencyKey ' +
        '(required — see its description; retries MUST reuse the same key so ' +
        'the store applies the add exactly once). Returns the updated cart ' +
        'and the changed line; replayed:true means this exact call was ' +
        'already applied and nothing changed. The cart drawer opens when this ' +
        'resolves.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['productId', 'idempotencyKey'],
        properties: {
          productId: productIdSchema('The product to add (id from search_products).'),
          frameSize: {
            type: 'string',
            enum: FRAME_SIZES,
            description: 'Frame size for bikes. Use the recommendedFrameSize from search results or an in-stock variant.'
          },
          quantity: {
            type: 'integer',
            minimum: 1,
            description: 'How many to add (default 1).'
          },
          idempotencyKey: idempotencyKeySchema(IDEMPOTENCY_KEY_DESC)
        }
      },
      execute: makeExecute('add_to_cart')
    },
    {
      name: 'update_cart_item',
      description:
        'Set the ABSOLUTE quantity of an existing cart line (not an ' +
        'increment; idempotent by design). Args: cartItemId (exactly as ' +
        'returned by get_cart — productId or productId:frameSize), quantity ' +
        '(the new total, integer >= 1), idempotencyKey (required — new key ' +
        'per distinct change, SAME key verbatim on retry). To delete a line ' +
        'use remove_from_cart instead. Returns the updated cart. The cart ' +
        'drawer opens when this resolves.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['cartItemId', 'quantity', 'idempotencyKey'],
        properties: {
          cartItemId: cartItemIdSchema('The cart line to update (from get_cart).'),
          quantity: {
            type: 'integer',
            minimum: 1,
            description: 'The new absolute quantity (>= 1).'
          },
          idempotencyKey: idempotencyKeySchema(IDEMPOTENCY_KEY_DESC)
        }
      },
      execute: makeExecute('update_cart_item')
    },
    {
      name: 'remove_from_cart',
      description:
        'Remove a cart line entirely. Args: cartItemId (exactly as returned ' +
        'by get_cart — productId or productId:frameSize), idempotencyKey ' +
        '(required — new key per distinct removal, SAME key verbatim on ' +
        'retry). Removing an item that is not in the cart returns a ' +
        'structured CART_ITEM_NOT_FOUND error whose hint lists the real cart ' +
        'state. Returns the updated cart. The cart drawer opens when this ' +
        'resolves.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['cartItemId', 'idempotencyKey'],
        properties: {
          cartItemId: cartItemIdSchema('The cart line to remove (from get_cart).'),
          idempotencyKey: idempotencyKeySchema(IDEMPOTENCY_KEY_DESC)
        }
      },
      execute: makeExecute('remove_from_cart')
    }
  ];

  /* Register sequentially, awaiting each registerTool() promise. */
  (function registerAll() {
    var chain = Promise.resolve();
    for (var i = 0; i < TOOL_DEFINITIONS.length; i++) {
      (function (def) {
        TOOL_SCHEMAS[def.name] = def.inputSchema;
        chain = chain.then(function () {
          return mc.registerTool(def);
        });
      })(TOOL_DEFINITIONS[i]);
    }
    chain.catch(function (err) {
      console.warn('[stride-webmcp] tool registration failed:', err && err.message ? err.message : err);
    });
  })();
})();
