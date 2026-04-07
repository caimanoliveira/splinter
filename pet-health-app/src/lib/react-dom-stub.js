// Minimal react-dom stub for React Native (used by @clerk/react internals)
module.exports = {
  createPortal: (children, _container) => children,
  flushSync: (fn) => fn(),
  unstable_batchedUpdates: (fn) => fn(),
  findDOMNode: () => null,
  render: () => null,
  unmountComponentAtNode: () => false,
};
