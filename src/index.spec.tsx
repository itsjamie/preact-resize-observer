import { h } from 'preact';
import { render, cleanup, screen } from '@testing-library/preact';

import PreactResizeObserver, { InnerRefProp, OnResizeProp } from './index';

const originalCreateElement = document.createElement.bind(document);

let elWidth = 200;
let elHeight = 100;

// Helper Fns

function noop() { }

function changeElementSize(width: number, height: number) {
  elWidth = width;
  elHeight = height;
  // triggers resize observer to check element size
  window.dispatchEvent(new Event('resize'));
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

type CallbackResolver = (resolve: (value: unknown) => void) => void;
function waitForCb(cb: CallbackResolver) {
  return new Promise((resolve) => {
    cb(resolve);
  });
}

// Start Tests

afterAll(() => {
  cleanup()
})

test('child elements are rendered', async () => {
  render(<PreactResizeObserver onResize={noop}><span>test</span></PreactResizeObserver>);
  const field = await screen.queryByText('test')
  expect(field).toBeTruthy();
});

test('custom tag is used', () => {
  const { container } = render(<PreactResizeObserver onResize={noop} tag="section" />);
  const field = container.querySelector('section')
  expect(field).toBeTruthy();
});

test('inner ref is provided', (done) => {
  const className = 'test-class';

  const handleRef: InnerRefProp = async (ref) => {
    // let dom element initialize
    await wait(10);

    expect(ref).toBeInstanceOf(Element);
    expect(ref.classList.toString()).toBe(className);
    done();
  };

  render(<PreactResizeObserver onResize={noop} innerRef={handleRef} className={className} />);
});

describe('onResize callback', () => {
  beforeAll(() => {
    // Override Object to pass the polyfill's instanceof check


    // Override clientHeight/Width methods of created elements to return values the tests can control.
    // These values are used by the resize observer to determine if the size of an element has changed.
    document.createElement = (tag: string) => {
      const el = originalCreateElement(tag);
      Object.defineProperty(el, 'clientHeight', {
        get() {
          return elHeight;
        },
      });
      Object.defineProperty(el, 'clientWidth', {
        get() {
          return elWidth;
        },
      });
      return el;
    };
  });

  afterAll(() => {
    document.createElement = originalCreateElement;
  });

  beforeEach(() => {
    elWidth = 200;
    elHeight = 100;
  });

  test('is called with correct dimensions', async () => {
    const resizeHandler = (resolve: Function) => jest.fn().mockImplementation(() => {
      resolve();
    });

    let onResize: OnResizeProp = jest.fn();
    render(<PreactResizeObserver onResize={onResize} />);

    // Wait to allow intial observer flow to complete
    await wait(50);
    expect(onResize).toBeCalledWith(200, 100);

    await waitForCb((resolve) => {
      onResize = resizeHandler(resolve);
      render(<PreactResizeObserver onResize={onResize} />);
      changeElementSize(300, 100);
    });
    expect(onResize).toBeCalledWith(300, 100);

    await waitForCb((resolve) => {
      onResize = resizeHandler(resolve);
      render(<PreactResizeObserver onResize={onResize} />);
      changeElementSize(300, 300);
    });
    expect(onResize).toBeCalledWith(300, 300);

    await waitForCb((resolve) => {
      onResize = resizeHandler(resolve);
      render(<PreactResizeObserver onResize={onResize} />);
      changeElementSize(50, 50);
    });
    expect(onResize).toBeCalledWith(50, 50);
  });

  test('is not called on initial mount', async () => {
    const onResize = jest.fn();

    render(<PreactResizeObserver onResize={onResize} initial={false} />);

    // Wait to allow intial observer flow to complete
    await wait(50);
    expect(onResize).not.toBeCalled();

    changeElementSize(400, 400);

    await wait(50);
    expect(onResize).toBeCalledWith(400, 400);
  });

  test('is called only when width changes', async () => {
    const onResize = jest.fn();

    render(<PreactResizeObserver onResize={onResize} vertical={false} />);

    await wait(50);
    changeElementSize(300, elHeight);

    await wait(50);
    changeElementSize(elWidth, 200);

    await wait(50);
    // called on initial mount and when width changed
    expect(onResize).toBeCalledTimes(2);
    expect(onResize).nthCalledWith(2, 300, 100);
  });

  test('is called only when height changes', async () => {
    const onResize = jest.fn();

    render(<PreactResizeObserver onResize={onResize} horizontal={false} />);

    await wait(50);
    changeElementSize(300, elHeight);

    await wait(50);
    changeElementSize(elWidth, 200);

    await wait(50);
    // called on initial mount and when height changed
    expect(onResize).toBeCalledTimes(2);
    expect(onResize).nthCalledWith(2, 300, 200);
  });

  test('is called for size changes to a custom element', async () => {
    const resizeHandler = (resolve: Function) => jest.fn().mockImplementation(() => {
      resolve();
    });

    let onResize: OnResizeProp = jest.fn();

    const customElement = document.createElement('div');

    // Start observing custom element
    render(<PreactResizeObserver onResize={onResize} element={customElement} />);

    // Wait to allow intial observer flow to complete
    await wait(50);
    expect(onResize).toBeCalledWith(200, 100);

    await waitForCb((resolve) => {
      onResize = resizeHandler(resolve);
      render(<PreactResizeObserver onResize={onResize} element={customElement} />);
      changeElementSize(300, 100);
    });
    expect(onResize).toBeCalledWith(300, 100);

    await waitForCb((resolve) => {
      onResize = resizeHandler(resolve);
      // Return to observing default element
      render(<PreactResizeObserver onResize={onResize} />);
      changeElementSize(300, 300);
    });
    expect(onResize).toBeCalledWith(300, 300);

    await waitForCb((resolve) => {
      onResize = resizeHandler(resolve);
      // Return to observing custom element
      render(<PreactResizeObserver onResize={onResize} element={customElement} />);
      changeElementSize(50, 50);
    });
    expect(onResize).toBeCalledWith(50, 50);
  });
});
