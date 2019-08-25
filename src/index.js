const createElement = (type, props={}, ...children) => ({type, props, children})

const type = val => Object.prototype.toString.call(val).slice(8,-1).toLowerCase()

const render = (vdom, parent=null) => {
  const mount = parent ? (el => parent.appendChild(el)) : (el => el)

  switch (type(vdom)) {
    case 'string':
    case 'number':
      return mount(document.createTextNode(vdom))
    case 'boolean':
    case 'null':
      return mount(document.createTextNode(''))
    case 'object':
      switch (type(vdom.type)) {
        case 'function':
          return Component.render(vdom, parent)
        case 'string': {
          const dom = mount(document.createElement(vdom.type));
          [].concat(...vdom.children).forEach(child => { render(child, dom) })
          Object.keys(vdom.props).forEach(prop => { setAttribute(dom, prop, vdom.props[prop]) })
          return dom 
        }
      }
    default:
      throw new Error(`Invalid VDOM: ${vdom}`)
  }
}

const setAttribute = (dom, key, value) => {
  if (typeof value == 'function' && key.startsWith('on')) {
      const eventType = key.slice(2).toLowerCase();
      dom.__gooactHandlers = dom.__gooactHandlers || {}
      dom.removeEventListener(eventType, dom.__gooactHandlers[eventType])
      dom.__gooactHandlers[eventType] = value
      dom.addEventListener(eventType, dom.__gooactHandlers[eventType]);
  } else if (key == 'checked' || key == 'value' || key == 'className') {
      dom[key] = value;
  } else if (key == 'style' && typeof value == 'object') {
      Object.assign(dom.style, value);
  } else if (key == 'ref' && typeof value == 'function') {
      value(dom);
  } else if (key == 'key') {
      dom.__gooactKey = value;
  } else if (typeof value != 'object' && typeof value != 'function') {
      dom.setAttribute(key, value);
  }
}

/** @jsx createElement */
const list = <ul className="some-list">
    <li className="some-list__item">One</li>
    <li className="some-list__item">Two</li>
</ul>

render(list, document.getElementById('root'))