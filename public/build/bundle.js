
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function set_store_value(store, ret, value) {
        store.set(value);
        return ret;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.4' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const flagLists = writable({
        europe: [
            {
                name: "albania",
                flagPath: "./assets/images/flags/europe/albania.svg",
            },
            {
                name: "andorra",
                flagPath: "./assets/images/flags/europe/andorra.svg",
            },
            {
                name: "armenia",
                flagPath: "./assets/images/flags/europe/armenia.svg",
            },
            {
                name: "austria",
                flagPath: "./assets/images/flags/europe/austria.svg",
            },
            {
                name: "azerbaijan",
                flagPath: "./assets/images/flags/europe/azerbaijan.svg",
            },
            {
                name: "belarus",
                flagPath: "./assets/images/flags/europe/belarus.svg",
            },
            {
                name: "belgium",
                flagPath: "./assets/images/flags/europe/belgium.svg",
            },
            {
                name: "bosnia and herzegovina",
                flagPath: "./assets/images/flags/europe/bosnia-and-herzegovina.svg",
            },
            {
                name: "bulgaria",
                flagPath: "./assets/images/flags/europe/bulgaria.svg",
            },
            {
                name: "croatia",
                flagPath: "./assets/images/flags/europe/croatia.svg",
            },
            {
                name: "cyprus",
                flagPath: "./assets/images/flags/europe/cyprus.svg",
            },
            {
                name: "czech republic",
                flagPath: "./assets/images/flags/europe/czech-republic.svg",
            },
            {
                name: "denmark",
                flagPath: "./assets/images/flags/europe/denmark.svg",
            },
            {
                name: "estonia",
                flagPath: "./assets/images/flags/europe/estonia.svg",
            },
            {
                name: "finland",
                flagPath: "./assets/images/flags/europe/finland.svg",
            },
            {
                name: "france",
                flagPath: "./assets/images/flags/europe/france.svg",
            },
            {
                name: "georgia",
                flagPath: "./assets/images/flags/europe/georgia.svg",
            },
            {
                name: "germany",
                flagPath: "./assets/images/flags/europe/germany.svg",
            },
            {
                name: "greece",
                flagPath: "./assets/images/flags/europe/greece.svg",
            },
            {
                name: "hungary",
                flagPath: "./assets/images/flags/europe/hungary.svg",
            },
            {
                name: "iceland",
                flagPath: "./assets/images/flags/europe/iceland.svg",
            },
            {
                name: "italy",
                flagPath: "./assets/images/flags/europe/italy.svg",
            },
            {
                name: "kazakhstan",
                flagPath: "./assets/images/flags/europe/kazakhstan.svg",
            },
            {
                name: "latvia",
                flagPath: "./assets/images/flags/europe/latvia.svg",
            },
            {
                name: "liechtenstein",
                flagPath: "./assets/images/flags/europe/liechtenstein.svg",
            },
            {
                name: "lithuania",
                flagPath: "./assets/images/flags/europe/lithuania.svg",
            },
            {
                name: "luxembourg",
                flagPath: "./assets/images/flags/europe/luxembourg.svg",
            },
            {
                name: "malta",
                flagPath: "./assets/images/flags/europe/malta.svg",
            },
            {
                name: "moldova",
                flagPath: "./assets/images/flags/europe/moldova.svg",
            },
            {
                name: "monaco",
                flagPath: "./assets/images/flags/europe/monaco.svg",
            },
            {
                name: "montenegro",
                flagPath: "./assets/images/flags/europe/montenegro.svg",
            },
            {
                name: "netherlands",
                flagPath: "./assets/images/flags/europe/netherlands.svg",
            },
            {
                name: "north macedonia",
                flagPath: "./assets/images/flags/europe/north-macedonia.svg",
            },
            {
                name: "norway",
                flagPath: "./assets/images/flags/europe/norway.svg",
            },
            {
                name: "poland",
                flagPath: "./assets/images/flags/europe/poland.svg",
            },
            {
                name: "portugal",
                flagPath: "./assets/images/flags/europe/portugal.svg",
            },
            {
                name: "republic of ireland",
                flagPath: "./assets/images/flags/europe/republic-of-ireland.svg",
            },
            {
                name: "romania",
                flagPath: "./assets/images/flags/europe/romania.svg",
            },
            {
                name: "russia",
                flagPath: "./assets/images/flags/europe/russia.svg",
            },
            {
                name: "san marino",
                flagPath: "./assets/images/flags/europe/san-marino.svg",
            },
            {
                name: "serbia",
                flagPath: "./assets/images/flags/europe/serbia.svg",
            },
            {
                name: "slovakia",
                flagPath: "./assets/images/flags/europe/slovakia.svg",
            },
            {
                name: "slovenia",
                flagPath: "./assets/images/flags/europe/slovenia.svg",
            },
            {
                name: "spain",
                flagPath: "./assets/images/flags/europe/spain.svg",
            },
            {
                name: "sweden",
                flagPath: "./assets/images/flags/europe/sweden.svg",
            },
            {
                name: "switzerland",
                flagPath: "./assets/images/flags/europe/switzerland.svg",
            },
            {
                name: "turkey",
                flagPath: "./assets/images/flags/europe/turkey.svg",
            },
            {
                name: "ukraine",
                flagPath: "./assets/images/flags/europe/ukraine.svg",
            },
            {
                name: "united kingdom",
                flagPath: "./assets/images/flags/europe/united-kingdom.svg",
            },
            {
                name: "vatican",
                flagPath: "./assets/images/flags/europe/vatican.svg",
            },
        ],
        northAmerica: [
            {
                name: "antigua and barbuda",
                flagPath:
                    "./assets/images/flags/north-america/antigua-and-barbuda.svg",
            },
            {
                name: "bahamas",
                flagPath: "./assets/images/flags/north-america/bahamas.svg",
            },
            {
                name: "barbados",
                flagPath: "./assets/images/flags/north-america/barbados.svg",
            },
            {
                name: "belize",
                flagPath: "./assets/images/flags/north-america/belize.svg",
            },
            {
                name: "canada",
                flagPath: "./assets/images/flags/north-america/canada.svg",
            },
            {
                name: "costa rica",
                flagPath: "./assets/images/flags/north-america/costa-rica.svg",
            },
            {
                name: "cuba",
                flagPath: "./assets/images/flags/north-america/cuba.svg",
            },
            {
                name: "dominica",
                flagPath: "./assets/images/flags/north-america/dominica.svg",
            },
            {
                name: "dominican republic",
                flagPath:
                    "./assets/images/flags/north-america/dominican-republic.svg",
            },
            {
                name: "el salvador",
                flagPath: "./assets/images/flags/north-america/el-salvador.svg",
            },
            {
                name: "greenland",
                flagPath: "./assets/images/flags/north-america/greenland.svg",
            },
            {
                name: "grenada",
                flagPath: "./assets/images/flags/north-america/grenada.svg",
            },
            {
                name: "guatemala",
                flagPath: "./assets/images/flags/north-america/guatemala.svg",
            },
            {
                name: "haiti",
                flagPath: "./assets/images/flags/north-america/haiti.svg",
            },
            {
                name: "honduras",
                flagPath: "./assets/images/flags/north-america/honduras.svg",
            },
            {
                name: "jamaica",
                flagPath: "./assets/images/flags/north-america/jamaica.svg",
            },
            {
                name: "mexico",
                flagPath: "./assets/images/flags/north-america/mexico.svg",
            },
            {
                name: "nicaragua",
                flagPath: "./assets/images/flags/north-america/nicaragua.svg",
            },
            {
                name: "panama",
                flagPath: "./assets/images/flags/north-america/panama.svg",
            },
            {
                name: "saint kitts and nevis",
                flagPath:
                    "./assets/images/flags/north-america/saint-kitts-and-nevis.svg",
            },
            {
                name: "saint lucia",
                flagPath: "./assets/images/flags/north-america/saint-lucia.svg",
            },
            {
                name: "saint vincent and the grenadines",
                flagPath:
                    "./assets/images/flags/north-america/saint-vincent-and-the-grenadines.svg",
            },
            {
                name: "trinidad and tobago",
                flagPath:
                    "./assets/images/flags/north-america/trinidad-and-tobago.svg",
            },
            {
                name: "united states of america",
                flagPath:
                    "./assets/images/flags/north-america/united-states-of-america.svg",
            },
        ],
    });

    const view = writable("menu");

    /* src\components\Menu.svelte generated by Svelte v3.46.4 */

    const { Object: Object_1$1, console: console_1 } = globals;
    const file$2 = "src\\components\\Menu.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (27:8) {#each list as item}
    function create_each_block(ctx) {
    	let button;
    	let t_value = /*camelToPascal*/ ctx[1](/*item*/ ctx[6]) + "";
    	let t;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[3](/*item*/ ctx[6]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(t_value);
    			attr_dev(button, "class", "menu__button button-main hover-default");
    			add_location(button, file$2, 27, 8, 820);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(27:8) {#each list as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div3;
    	let div1;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let h1;
    	let t2;
    	let div2;
    	let each_value = /*list*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			h1 = element("h1");
    			h1.textContent = "Geo Quiz";
    			t2 = space();
    			div2 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			if (!src_url_equal(img.src, img_src_value = "./assets/images/flags/north-america/nicaragua.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "nicaragua.svg");
    			attr_dev(img, "class", "menu__background");
    			add_location(img, file$2, 21, 12, 571);
    			attr_dev(div0, "class", "menu__background-holder");
    			add_location(div0, file$2, 20, 8, 520);
    			attr_dev(div1, "class", "menu__background-wrap");
    			add_location(div1, file$2, 19, 4, 475);
    			attr_dev(h1, "class", "menu__heading");
    			add_location(h1, file$2, 24, 4, 711);
    			attr_dev(div2, "class", "menu__list");
    			add_location(div2, file$2, 25, 4, 756);
    			attr_dev(div3, "class", "menu");
    			add_location(div3, file$2, 18, 0, 451);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div1);
    			append_dev(div1, div0);
    			append_dev(div0, img);
    			append_dev(div3, t0);
    			append_dev(div3, h1);
    			append_dev(div3, t2);
    			append_dev(div3, div2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*openQuiz, list, camelToPascal*/ 7) {
    				each_value = /*list*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div2, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $flagLists;
    	let $view;
    	validate_store(flagLists, 'flagLists');
    	component_subscribe($$self, flagLists, $$value => $$invalidate(4, $flagLists = $$value));
    	validate_store(view, 'view');
    	component_subscribe($$self, view, $$value => $$invalidate(5, $view = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Menu', slots, []);
    	let list = Object.keys($flagLists);

    	const camelToPascal = string => {
    		const temp = string.replace(/([A-Z])/g, " $1");
    		const finalResult = temp.charAt(0).toUpperCase() + temp.slice(1);
    		return finalResult;
    	};

    	const openQuiz = quizName => {
    		set_store_value(view, $view = quizName, $view);
    	};

    	console.log(Object.keys($flagLists).length);
    	const writable_props = [];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Menu> was created with unknown prop '${key}'`);
    	});

    	const click_handler = item => openQuiz(item);

    	$$self.$capture_state = () => ({
    		flagLists,
    		view,
    		list,
    		camelToPascal,
    		openQuiz,
    		$flagLists,
    		$view
    	});

    	$$self.$inject_state = $$props => {
    		if ('list' in $$props) $$invalidate(0, list = $$props.list);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [list, camelToPascal, openQuiz, click_handler];
    }

    class Menu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Menu",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\components\Quiz.svelte generated by Svelte v3.46.4 */
    const file$1 = "src\\components\\Quiz.svelte";

    // (79:4) {#if incorrect}
    function create_if_block$1(ctx) {
    	let span1;
    	let t0;
    	let span0;
    	let t1_value = /*flagList*/ ctx[6][/*current*/ ctx[1] - 1].name + "";
    	let t1;

    	const block = {
    		c: function create() {
    			span1 = element("span");
    			t0 = text("Previous answer was ");
    			span0 = element("span");
    			t1 = text(t1_value);
    			attr_dev(span0, "class", "quiz__country-name");
    			add_location(span0, file$1, 79, 52, 2631);
    			attr_dev(span1, "class", "quiz__message");
    			add_location(span1, file$1, 79, 4, 2583);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span1, anchor);
    			append_dev(span1, t0);
    			append_dev(span1, span0);
    			append_dev(span0, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*current*/ 2 && t1_value !== (t1_value = /*flagList*/ ctx[6][/*current*/ ctx[1] - 1].name + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(79:4) {#if incorrect}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div5;
    	let div1;
    	let div0;
    	let img0;
    	let img0_src_value;
    	let img0_alt_value;
    	let t0;
    	let div2;
    	let img1;
    	let img1_src_value;
    	let img1_alt_value;
    	let t1;
    	let div4;
    	let div3;
    	let span0;
    	let t3;
    	let span1;
    	let t4_value = /*current*/ ctx[1] + 1 + "";
    	let t4;
    	let t5;
    	let span2;
    	let t7;
    	let span3;
    	let t8;
    	let t9;
    	let form;
    	let input;
    	let t10;
    	let button0;
    	let t12;
    	let button1;
    	let t14;
    	let mounted;
    	let dispose;
    	let if_block = /*incorrect*/ ctx[4] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			img0 = element("img");
    			t0 = space();
    			div2 = element("div");
    			img1 = element("img");
    			t1 = space();
    			div4 = element("div");
    			div3 = element("div");
    			span0 = element("span");
    			span0.textContent = "Question:";
    			t3 = space();
    			span1 = element("span");
    			t4 = text(t4_value);
    			t5 = space();
    			span2 = element("span");
    			span2.textContent = `${/*total*/ ctx[5]}`;
    			t7 = space();
    			span3 = element("span");
    			t8 = text(/*score*/ ctx[2]);
    			t9 = space();
    			form = element("form");
    			input = element("input");
    			t10 = space();
    			button0 = element("button");
    			button0.textContent = "Enter";
    			t12 = space();
    			button1 = element("button");
    			button1.textContent = "Back to menu";
    			t14 = space();
    			if (if_block) if_block.c();
    			if (!src_url_equal(img0.src, img0_src_value = /*flagList*/ ctx[6][/*current*/ ctx[1]].flagPath)) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", img0_alt_value = /*flagList*/ ctx[6][/*current*/ ctx[1]].name + ' - flag');
    			attr_dev(img0, "class", "quiz__background");
    			add_location(img0, file$1, 59, 12, 1555);
    			attr_dev(div0, "class", "quiz__background-holder");
    			add_location(div0, file$1, 58, 8, 1504);
    			attr_dev(div1, "class", "quiz__background-wrap");
    			add_location(div1, file$1, 57, 4, 1459);
    			if (!src_url_equal(img1.src, img1_src_value = /*flagList*/ ctx[6][/*current*/ ctx[1]].flagPath)) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", img1_alt_value = /*flagList*/ ctx[6][/*current*/ ctx[1]].name + ' - flag');
    			attr_dev(img1, "class", "quiz__image");
    			add_location(img1, file$1, 63, 8, 1737);
    			attr_dev(div2, "class", "quiz__image-wrap");
    			add_location(div2, file$1, 62, 4, 1697);
    			add_location(span0, file$1, 67, 12, 1932);
    			attr_dev(span1, "class", "quiz__current");
    			add_location(span1, file$1, 68, 12, 1969);
    			add_location(span2, file$1, 69, 12, 2031);
    			attr_dev(div3, "class", "quiz__score");
    			add_location(div3, file$1, 66, 8, 1893);
    			attr_dev(span3, "class", "quiz__percentage");
    			add_location(span3, file$1, 71, 8, 2077);
    			attr_dev(div4, "class", "quiz__board");
    			add_location(div4, file$1, 65, 4, 1858);
    			attr_dev(input, "spellcheck", "false");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "quiz__input hover-default");
    			toggle_class(input, "correct", /*correct*/ ctx[3]);
    			toggle_class(input, "incorrect", /*incorrect*/ ctx[4]);
    			add_location(input, file$1, 74, 8, 2216);
    			attr_dev(button0, "class", "button-main hover-default");
    			toggle_class(button0, "correct", /*correct*/ ctx[3]);
    			toggle_class(button0, "incorrect", /*incorrect*/ ctx[4]);
    			add_location(button0, file$1, 75, 8, 2348);
    			attr_dev(form, "class", "quiz__form");
    			add_location(form, file$1, 73, 4, 2140);
    			attr_dev(button1, "class", "quiz__back-button button-link hover-default");
    			add_location(button1, file$1, 77, 4, 2453);
    			attr_dev(div5, "class", "quiz");
    			add_location(div5, file$1, 56, 0, 1435);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div1);
    			append_dev(div1, div0);
    			append_dev(div0, img0);
    			append_dev(div5, t0);
    			append_dev(div5, div2);
    			append_dev(div2, img1);
    			append_dev(div5, t1);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, span0);
    			append_dev(div3, t3);
    			append_dev(div3, span1);
    			append_dev(span1, t4);
    			append_dev(div3, t5);
    			append_dev(div3, span2);
    			append_dev(div4, t7);
    			append_dev(div4, span3);
    			append_dev(span3, t8);
    			append_dev(div5, t9);
    			append_dev(div5, form);
    			append_dev(form, input);
    			set_input_value(input, /*answer*/ ctx[0]);
    			append_dev(form, t10);
    			append_dev(form, button0);
    			append_dev(div5, t12);
    			append_dev(div5, button1);
    			append_dev(div5, t14);
    			if (if_block) if_block.m(div5, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[10]),
    					listen_dev(form, "submit", prevent_default(/*submitHandler*/ ctx[7]), false, true, false),
    					listen_dev(button1, "click", /*backToMenu*/ ctx[8], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*current*/ 2 && !src_url_equal(img0.src, img0_src_value = /*flagList*/ ctx[6][/*current*/ ctx[1]].flagPath)) {
    				attr_dev(img0, "src", img0_src_value);
    			}

    			if (dirty & /*current*/ 2 && img0_alt_value !== (img0_alt_value = /*flagList*/ ctx[6][/*current*/ ctx[1]].name + ' - flag')) {
    				attr_dev(img0, "alt", img0_alt_value);
    			}

    			if (dirty & /*current*/ 2 && !src_url_equal(img1.src, img1_src_value = /*flagList*/ ctx[6][/*current*/ ctx[1]].flagPath)) {
    				attr_dev(img1, "src", img1_src_value);
    			}

    			if (dirty & /*current*/ 2 && img1_alt_value !== (img1_alt_value = /*flagList*/ ctx[6][/*current*/ ctx[1]].name + ' - flag')) {
    				attr_dev(img1, "alt", img1_alt_value);
    			}

    			if (dirty & /*current*/ 2 && t4_value !== (t4_value = /*current*/ ctx[1] + 1 + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*score*/ 4) set_data_dev(t8, /*score*/ ctx[2]);

    			if (dirty & /*answer*/ 1 && input.value !== /*answer*/ ctx[0]) {
    				set_input_value(input, /*answer*/ ctx[0]);
    			}

    			if (dirty & /*correct*/ 8) {
    				toggle_class(input, "correct", /*correct*/ ctx[3]);
    			}

    			if (dirty & /*incorrect*/ 16) {
    				toggle_class(input, "incorrect", /*incorrect*/ ctx[4]);
    			}

    			if (dirty & /*correct*/ 8) {
    				toggle_class(button0, "correct", /*correct*/ ctx[3]);
    			}

    			if (dirty & /*incorrect*/ 16) {
    				toggle_class(button0, "incorrect", /*incorrect*/ ctx[4]);
    			}

    			if (/*incorrect*/ ctx[4]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(div5, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $view;
    	let $flagLists;
    	validate_store(view, 'view');
    	component_subscribe($$self, view, $$value => $$invalidate(12, $view = $$value));
    	validate_store(flagLists, 'flagLists');
    	component_subscribe($$self, flagLists, $$value => $$invalidate(13, $flagLists = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Quiz', slots, []);
    	let { quizType } = $$props;
    	let answer = '';
    	let current = 0;
    	const total = $flagLists[quizType].length;
    	let correctAnswers = 0;
    	let score = 0;
    	let correct = false;
    	let incorrect = false;

    	const shuffleArray = array => {
    		for (let i = array.length - 1; i > 0; i--) {
    			const j = Math.floor(Math.random() * (i + 1));
    			const temp = array[i];
    			array[i] = array[j];
    			array[j] = temp;
    		}

    		return array;
    	};

    	const flagList = shuffleArray($flagLists[quizType]);

    	const answerChecker = () => {
    		if (answer.toLowerCase() === flagList[current].name) {
    			$$invalidate(3, correct = true);
    			$$invalidate(4, incorrect = false);
    			correctAnswers++;
    		} else {
    			$$invalidate(4, incorrect = true);
    			$$invalidate(3, correct = false);
    		}
    	};

    	const submitHandler = () => {
    		if (current < total - 1) {
    			answerChecker();
    			$$invalidate(1, current++, current);
    			$$invalidate(0, answer = '');
    			$$invalidate(2, score = (correctAnswers / current * 100).toFixed(2));
    		} else {
    			answerChecker();

    			setTimeout(
    				() => {
    					window.alert(`Your score was ${score}%`);
    					set_store_value(view, $view = 'menu', $view);
    				},
    				500
    			);
    		}
    	};

    	const backToMenu = () => {
    		set_store_value(view, $view = 'menu', $view);
    	};

    	const writable_props = ['quizType'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Quiz> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		answer = this.value;
    		$$invalidate(0, answer);
    	}

    	$$self.$$set = $$props => {
    		if ('quizType' in $$props) $$invalidate(9, quizType = $$props.quizType);
    	};

    	$$self.$capture_state = () => ({
    		flagLists,
    		view,
    		quizType,
    		answer,
    		current,
    		total,
    		correctAnswers,
    		score,
    		correct,
    		incorrect,
    		shuffleArray,
    		flagList,
    		answerChecker,
    		submitHandler,
    		backToMenu,
    		$view,
    		$flagLists
    	});

    	$$self.$inject_state = $$props => {
    		if ('quizType' in $$props) $$invalidate(9, quizType = $$props.quizType);
    		if ('answer' in $$props) $$invalidate(0, answer = $$props.answer);
    		if ('current' in $$props) $$invalidate(1, current = $$props.current);
    		if ('correctAnswers' in $$props) correctAnswers = $$props.correctAnswers;
    		if ('score' in $$props) $$invalidate(2, score = $$props.score);
    		if ('correct' in $$props) $$invalidate(3, correct = $$props.correct);
    		if ('incorrect' in $$props) $$invalidate(4, incorrect = $$props.incorrect);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		answer,
    		current,
    		score,
    		correct,
    		incorrect,
    		total,
    		flagList,
    		submitHandler,
    		backToMenu,
    		quizType,
    		input_input_handler
    	];
    }

    class Quiz extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { quizType: 9 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Quiz",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*quizType*/ ctx[9] === undefined && !('quizType' in props)) {
    			console.warn("<Quiz> was created without expected prop 'quizType'");
    		}
    	}

    	get quizType() {
    		throw new Error("<Quiz>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set quizType(value) {
    		throw new Error("<Quiz>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.46.4 */

    const { Object: Object_1 } = globals;
    const file = "src\\App.svelte";

    // (18:8) {#if $view === 'menu'}
    function create_if_block_2(ctx) {
    	let menu;
    	let current;
    	menu = new Menu({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(menu.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(menu, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(menu.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(menu.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(menu, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(18:8) {#if $view === 'menu'}",
    		ctx
    	});

    	return block;
    }

    // (21:8) {#if $view === "europe"}
    function create_if_block_1(ctx) {
    	let quiz;
    	let current;

    	quiz = new Quiz({
    			props: { quizType: "europe" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(quiz.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(quiz, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(quiz.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(quiz.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(quiz, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(21:8) {#if $view === \\\"europe\\\"}",
    		ctx
    	});

    	return block;
    }

    // (24:8) {#if $view === "northAmerica"}
    function create_if_block(ctx) {
    	let quiz;
    	let current;

    	quiz = new Quiz({
    			props: { quizType: "northAmerica" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(quiz.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(quiz, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(quiz.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(quiz.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(quiz, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(24:8) {#if $view === \\\"northAmerica\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let link0;
    	let link1;
    	let link2;
    	let t0;
    	let div1;
    	let div0;
    	let t1;
    	let t2;
    	let current;
    	let if_block0 = /*$view*/ ctx[0] === 'menu' && create_if_block_2(ctx);
    	let if_block1 = /*$view*/ ctx[0] === "europe" && create_if_block_1(ctx);
    	let if_block2 = /*$view*/ ctx[0] === "northAmerica" && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			link0 = element("link");
    			link1 = element("link");
    			link2 = element("link");
    			t0 = space();
    			div1 = element("div");
    			div0 = element("div");
    			if (if_block0) if_block0.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			t2 = space();
    			if (if_block2) if_block2.c();
    			attr_dev(link0, "rel", "preconnect");
    			attr_dev(link0, "href", "https://fonts.googleapis.com");
    			add_location(link0, file, 9, 4, 232);
    			attr_dev(link1, "rel", "preconnect");
    			attr_dev(link1, "href", "https://fonts.gstatic.com");
    			attr_dev(link1, "crossorigin", "");
    			add_location(link1, file, 10, 4, 297);
    			attr_dev(link2, "href", "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700;900&display=swap");
    			attr_dev(link2, "rel", "stylesheet");
    			add_location(link2, file, 11, 4, 371);
    			document.title = "Geo Quiz";
    			attr_dev(div0, "class", "app__wrap");
    			add_location(div0, file, 16, 4, 554);
    			attr_dev(div1, "class", "app");
    			add_location(div1, file, 15, 0, 531);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, link0);
    			append_dev(document.head, link1);
    			append_dev(document.head, link2);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(div0, t1);
    			if (if_block1) if_block1.m(div0, null);
    			append_dev(div0, t2);
    			if (if_block2) if_block2.m(div0, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$view*/ ctx[0] === 'menu') {
    				if (if_block0) {
    					if (dirty & /*$view*/ 1) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div0, t1);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*$view*/ ctx[0] === "europe") {
    				if (if_block1) {
    					if (dirty & /*$view*/ 1) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div0, t2);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*$view*/ ctx[0] === "northAmerica") {
    				if (if_block2) {
    					if (dirty & /*$view*/ 1) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div0, null);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			detach_dev(link0);
    			detach_dev(link1);
    			detach_dev(link2);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $flagLists;
    	let $view;
    	validate_store(flagLists, 'flagLists');
    	component_subscribe($$self, flagLists, $$value => $$invalidate(1, $flagLists = $$value));
    	validate_store(view, 'view');
    	component_subscribe($$self, view, $$value => $$invalidate(0, $view = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let list = Object.keys($flagLists);
    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		flagLists,
    		view,
    		Menu,
    		Quiz,
    		list,
    		$flagLists,
    		$view
    	});

    	$$self.$inject_state = $$props => {
    		if ('list' in $$props) list = $$props.list;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [$view];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
      target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
