const createElement = (type, props = {}, ...children) => ({
  type,
  props,
  children
});

const type = val =>
  Object.prototype.toString
    .call(val)
    .slice(8, -1)
    .toLowerCase();

const render = (vdom, parent = null) => {
  const mount = parent ? el => parent.appendChild(el) : el => el;

  switch (type(vdom)) {
    case "string":
    case "number":
      return mount(document.createTextNode(vdom));
    case "boolean":
    case "null":
      return mount(document.createTextNode(""));
    case "object":
      switch (type(vdom.type)) {
        case "function":
          return Component.render(vdom, parent);
        case "string": {
          const dom = mount(document.createElement(vdom.type));
          [
            /* flatten */
          ]
            .concat(...vdom.children)
            .forEach(child => {
              render(child, dom);
            });
          Object.keys(vdom.props).forEach(prop => {
            setAttribute(dom, prop, vdom.props[prop]);
          });
          return dom;
        }
      }
    default:
      throw new Error(`Invalid VDOM: ${vdom}`);
  }
};

const setAttribute = (dom, key, value) => {
  if (typeof value == "function" && key.startsWith("on")) {
    const eventType = key.slice(2).toLowerCase();
    dom.__gooactHandlers = dom.__gooactHandlers || {};
    dom.removeEventListener(eventType, dom.__gooactHandlers[eventType]);
    dom.__gooactHandlers[eventType] = value;
    dom.addEventListener(eventType, dom.__gooactHandlers[eventType]);
  } else if (key == "checked" || key == "value" || key == "className") {
    dom[key] = value;
  } else if (key == "style" && typeof value == "object") {
    Object.assign(dom.style, value);
  } else if (key == "ref" && typeof value == "function") {
    value(dom);
  } else if (key == "key") {
    dom.__gooactKey = value;
  } else if (typeof value != "object" && typeof value != "function") {
    dom.setAttribute(key, value);
  }
};

const patch = (dom, vdom, parent = dom.parentNode) => {
  const replace = parent ? el => parent.replaceChild(el, dom) && el : el => el;

  if (typeof vdom == "object" && typeof vdom.type == "function") {
    return Component.patch(dom, vdom, parent);
  } else if (typeof vdom != "object" && dom instanceof Text) {
    return dom.textContent != vdom ? replace(render(vdom, parent)) : dom;
  } else if (typeof vdom == "object" && dom instanceof Text) {
    return replace(render(vdom, parent));
  } else if (
    typeof vdom == "object" &&
    dom.nodeName != vdom.type.toUpperCase()
  ) {
    return replace(render(vdom, parent));
  } else if (
    typeof vdom == "object" &&
    dom.nodeName == vdom.type.toUpperCase()
  ) {
    const pool = {};
    const active = document.activeElement;
    [
      /* flatten */
    ]
      .concat(...dom.childNodes)
      .map((child, index) => {
        const key = child.__gooactKey || `__index_${index}`;
        pool[key] = child;
      });
    [
      /* flatten */
    ]
      .concat(...vdom.children)
      .map((child, index) => {
        const key = (child.props && child.props.key) || `__index_${index}`;
        dom.appendChild(
          pool[key] ? patch(pool[key], child) : render(child, dom)
        );
        delete pool[key];
      });
    for (const key in pool) {
      const instance = pool[key].__gooactInstance;
      if (instance) instance.componentWillUnmount();
      pool[key].remove();
    }
    for (const attr of dom.attributes) dom.removeAttribute(attr.name);
    for (const prop in vdom.props) setAttribute(dom, prop, vdom.props[prop]);
    active.focus();
    return dom;
  }
};

class Component {
  constructor(props) {
    this.props = props || {};
    this.state = null;
  }

  static render(vdom, parent = null) {
    const props = Object.assign({}, vdom.props, { children: vdom.children });
    if (Component.isPrototypeOf(vdom.type)) {
      const instance = new vdom.type(props);
      instance.componentWillMount();
      instance.base = render(instance.render(), parent);
      instance.base.__gooactInstance = instance;
      instance.base.__gooactKey = vdom.props.key;
      instance.componentDidMount();
      return instance.base;
    } else {
      return render(vdom.type(props), parent);
    }
  }

  static patch(dom, vdom, parent = dom.parentNode) {
    const props = Object.assign({}, vdom.props, { children: vdom.children });
    if (dom.__gooactInstance && dom.__gooactInstance.constructor == vdom.type) {
      dom.__gooactInstance.componentWillReceiveProps(props);
      dom.__gooactInstance.props = props;
      return patch(dom, dom.__gooactInstance.render(), parent);
    } else if (Component.isPrototypeOf(vdom.type)) {
      const ndom = Component.render(vdom, parent);
      return parent ? parent.replaceChild(ndom, dom) && ndom : ndom;
    } else if (!Component.isPrototypeOf(vdom.type)) {
      return patch(dom, vdom.type(props), parent);
    }
  }

  setState(nextState) {
    if (this.base && this.shouldComponentUpdate(this.props, nextState)) {
      const prevState = this.state;
      this.componentWillUpdate(this.props, nextState);
      this.state = nextState;
      patch(this.base, this.render());
      this.componentDidUpdate(this.props, prevState);
    } else {
      this.state = nextState;
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return nextProps != this.props || nextState != this.state;
  }

  componentWillReceiveProps(nextProps) { }

  componentWillUpdate(nextProps, nextState) { }

  componentDidUpdate(prevProps, prevState) { }

  componentWillMount() { }

  componentDidMount() { }

  componentWillUnmount() { }
}



/** @jsx createElement */
const list = (
  <ul className="some-list">
    <li className="some-list__item">One</li>
    <li className="some-list__item">Two</li>
  </ul>
);

render(list, document.getElementById("root"));
