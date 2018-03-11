import { h, Component } from 'preact';
import ResizeObserver from 'resize-observer-polyfill';
import * as PropTypes from 'prop-types';

export interface IPreactResizeObserverProps {
  onResize(width: number, height: number): void;
  width?: boolean;
  height?: boolean;
}

const style: any = {
  position: 'absolute',
  width: 0,
  height: 0,
  display: 'none',
};

export default class PreactResizeObserver extends Component<IPreactResizeObserverProps, void> {
  private observer: ResizeObserver;
  private element?: Element;
  private currentWidth?: number;
  private currentHeight?: number;

  static propTypes = {
    onResize: PropTypes.func.isRequired,
    width: PropTypes.bool,
    height: PropTypes.bool,
  };

  static defaultProps = {
    width: false,
    height: false,
  };

  constructor(props: IPreactResizeObserverProps) {
    super(props);

    this.observer = new ResizeObserver(this.onResize);
  }

  componentDidMount() {
    let observedElement: Element | undefined;
    if (this.element && this.element.parentElement) {
      observedElement = this.element.parentElement;
    }
    if (observedElement) {
      this.observer.observe(observedElement);
    }
  }

  private onResize = (resizeEntries: ResizeObserverEntry[]) => {
    const resizeCallback = this.props.onResize;
    if (typeof resizeCallback !== 'function') {
      return;
    }
    resizeEntries.forEach((entry) => {
      const { width, height } = entry.contentRect;
      let resized = false;
      if (this.props.width && this.currentWidth !== width) {
        resized = true;
        this.currentWidth = width;
      }
      if (this.props.height && this.currentHeight !== height) {
        resized = true;
        this.currentHeight = height;
      }
      if (resized) {
        resizeCallback(width, height);
      }
    });
  }

  private handleRef = (el?:Element) => {
    this.element = el;
  }

  render() {
    return (
      <div ref={this.handleRef} style={style} />
    );
  }
}
