import React from 'react';
import PropTypes from 'prop-types';
import DocumentTitle from 'react-document-title';
import { FormattedMessage } from 'react-intl';
import Icon from 'antd/lib/icon';
import Popover from 'antd/lib/popover';
import QRCode from 'qrcode.react';
import { getChildren } from 'jsonml.js/lib/utils';
import throttleByAnimationFrame from 'antd/lib/_util/throttleByAnimationFrame';
import Demo from './Demo';


export default class ComponentDoc extends React.Component {
  static contextTypes = {
    intl: PropTypes.object,
  }

  constructor(props) {
    super(props);

    this.state = {
      currentIndex: this.getIndex(props),
      toggle: false,
      needMobileFix: false,
    };
    this.handleScroll = this.getScrollHandle();
  }

  getIndex(props) {
    const linkTo = props.location.hash.replace('#', '');

    const demos = Object.keys(props.demos)
      .map(key => props.demos[key])
      .filter(demoData => !demoData.meta.hidden);
    const demoSort = demos.sort((a, b) => parseInt(a.meta.order, 10) - parseInt(b.meta.order, 10));

    demos.map((item, index) => {
      item.index = index;
    });

    const targetDemo = demoSort.filter(item => (item.meta.id === linkTo))[0];
    const linkIndex = linkTo && targetDemo ? targetDemo.index : 0;
    return linkIndex;
  }

  componentWillReceiveProps = () => {
    this.setState({
      currentIndex: 0,
      toggle: false,
    });
  }

  togglePreview = (e) => {
    this.setState({
      currentIndex: e.index,
      toggle: true,
    });
  }


  componentDidMount() {
    document.addEventListener('scroll', this.handleScroll, false);
    setTimeout(this.handleScroll, 0);
  }
  componentWillUnmount() {
    document.removeEventListener('scroll', this.handleScroll, false);
  }

  getScrollHandle = () => throttleByAnimationFrame(() => {
    const apiTop = document.getElementById('api').getBoundingClientRect().top;
    const demoTop = document.getElementById('demo-code').getBoundingClientRect().top;

    let needMobileFix = false;
    if (demoTop <= 0 && apiTop >= 600) {
      needMobileFix = true;
    }
    if (needMobileFix !== this.state.needMobileFix) {
      this.setState({
        needMobileFix,
      });
    }
  });

  render() {
    const props = this.props;
    const { doc, location } = props;
    const { content, meta } = doc;

    const demos = Object.keys(props.demos)
      .map(key => props.demos[key])
      .filter(demoData => !demoData.meta.hidden);

    const leftChildren = [];

    const currentIndex = this.state.currentIndex;

    demos.sort((a, b) => a.meta.order - b.meta.order)
      .forEach((demoData, index) => {
        leftChildren.push(
          <Demo
            togglePreview={this.togglePreview}
            {...demoData}
            className={currentIndex === index ? 'code-box-target' : ''}
            key={index}
            index={index}
            currentIndex={currentIndex}
            utils={props.utils}
            pathname={location.pathname}
          />,
        );
      });

    const protocol = window.location.protocol;
    const path = doc.meta.filename.split('/')[1];
    const isLocalMode = window.location.port;
    const host = isLocalMode ? 'localhost:8002' : window.location.host;
    const demoUrl = `${protocol}//${host}/kitchen-sink/components/${path}`;

    const PopoverContent = (<div>
      <h4 style={{ margin: '8Px 0 12Px', textAlign: 'center' }}><FormattedMessage id="app.ComponentDoc.codeQrcode" /></h4>
      <QRCode size={144} value={demoUrl} />
    </div>);

    const { title, subtitle, chinese, english } = meta;
    const hash = `#${path}-demo-${currentIndex}`;
    const mainPath = isLocalMode ? 'components' : 'kitchen-sink/components';
    const search = this.context.intl.locale === 'zh-CN' ? '?lang=zh-CN' : '?lang=en-US';
    const iframeUrl = `${protocol}//${host}/${mainPath}/${path}${search}${hash}`;

    const { needMobileFix } = this.state;
    let posStyle = {};
    if (needMobileFix) {
      posStyle = {
        position: 'fixed',
        top: 0,
        right: '9.5%',
      };
    } else {
      posStyle = {
        float: 'right',
        marginRight: '-405Px',
      };
    }
    const mobileWrapperStyle = {
      position: 'relative',
      width: 405,
      minHeight: 300,
      padding: '0 0 0 30Px',
      ...posStyle,
    };
    return (
      <DocumentTitle title={`${subtitle || chinese || ''} ${title || english} - Ant Design`}>
        <article>
          <section className="markdown">
            <h1 className="section-title">
              {meta.title || meta.english} {meta.subtitle || meta.chinese}
              <Popover content={PopoverContent} placement="bottom">
                <Icon type="qrcode" />
              </Popover>
            </h1>
            {
              props.utils.toReactComponent(['section', { className: 'markdown' }]
                .concat(getChildren(content)),
              )
            }

            <section id="demoTitle" className="demo-title-wrapper">
              <h2 id="demoTitle" className="demo-title">
                <FormattedMessage id="app.ComponentDoc.codeTitle" />
              </h2>
            </section>
          </section>

          <div id="demo-code" className="clearfix" style={{ paddingRight: 405, paddingBottom: 350 }}>
            <div style={{ width: '100%', float: 'left' }}>
              {leftChildren}
            </div>
            <div style={mobileWrapperStyle}>
              <div id="aside-demo" className="aside-demo">
                <div style={{ width: '377Px', height: '620Px' }}>
                  <div className="demo-preview-wrapper">
                    <div className="demo-preview-header">
                      <div className="demo-preview-statbar">
                        <img width="350Px" alt="presentation" style={{ margin: '0 2Px' }} src="https://os.alipayobjects.com/rmsportal/VfVHYcSUxreetec.png" />
                      </div>
                      <div style={{ height: '40Px' }}>
                        <div className="url-box">{iframeUrl}</div>
                      </div>
                    </div>
                    <section className="code-box-demo code-box-demo-preview">
                      <iframe id="demoFrame"
                        name="demoFrame"
                        title="antd-mobile"
                        style={{
                          width: '377Px',
                          height: '548Px',
                          border: '1Px solid #F7F7F7',
                          borderTop: 'none',
                          boxShadow: '0 2Px 4Px #ebebeb',
                        }}
                        src={iframeUrl}
                      />
                    </section>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {
            props.utils.toReactComponent(
              ['section', {
                id: 'api',
                className: 'markdown api-container',
              }].concat(getChildren(doc.api || ['placeholder'])),
            )
          }
        </article>
      </DocumentTitle>
    );
  }
}
